"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mock.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "mock-key";
  return createClient(url, key, { auth: { persistSession: false } });
}
import { PurchaseOrder, NewPurchaseOrder, PurchaseOrderStatus } from "../../types/purchase";

export async function getPurchaseOrders(): Promise<PurchaseOrder[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("purchase_orders")
    .select(`
      *,
      purchase_order_items (
        *,
        product:products (*)
      )
    `);

  if (error) {
    console.warn("Error fetching purchase orders. Ensure the 'purchase_orders' table exists in Supabase.", error);
    return [];
  }
  return data || [];
}

export async function createPurchaseOrder(
  orderData: NewPurchaseOrder
): Promise<{ success: boolean; message?: string; id?: string }> {
  try {
    const supabase = getSupabase();
    const poNumber = `PO-${Date.now()}`;

    // 1. Insert Purchase Order
    const { data: orderResponse, error: orderError } = await supabase
      .from("purchase_orders")
      .insert({
        po_number: poNumber,
        supplier_name: orderData.supplier_name,
        total_amount: orderData.total_amount,
        status: "Draft",
      })
      .select("id")
      .single();

    if (orderError) throw new Error(orderError.message);
    const newOrderId = orderResponse.id;

    // 2. Insert Items
    const items = orderData.purchase_order_items.map((item) => ({
      purchase_order_id: newOrderId,
      product_id: item.product_id,
      quantity: item.quantity,
      rate: item.rate
    }));

    const { error: itemsError } = await supabase.from("purchase_order_items").insert(items);
    if (itemsError) {
      // Rollback PO if items fail (Supabase REST missing Native RPC transactions without Custom Functions)
      await supabase.from("purchase_orders").delete().eq("id", newOrderId);
      throw new Error(itemsError.message);
    }

    revalidatePath("/purchases");
    return { success: true, id: newOrderId };
  } catch (error: any) {
    console.error("Error creating purchase order:", error);
    return { success: false, message: error.message || "Failed to create order" };
  }
}

export async function updatePurchaseStatus(
  orderId: string,
  newStatus: PurchaseOrderStatus
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = getSupabase();

    // If advancing to "Received", AUTOMATICALLY INJECT STOCK!
    if (newStatus === "Received") {
      // 1. Fetch Line Items to figure out amounts
      const { data: items, error: itemsError } = await supabase
        .from("purchase_order_items")
        .select("product_id, quantity")
        .eq("purchase_order_id", orderId);

      if (itemsError) throw itemsError;

      // 2. Process each item (In Supabase REST, usually sequential updates if no custom Postgres RPC is available)
      for (const item of items) {
        // Fetch current quantity to safely increment
        const { data: productData, error: productFetchError } = await supabase
          .from("products")
          .select("current_quantity")
          .eq("id", item.product_id)
          .single();

        if (productFetchError) throw productFetchError;

        const updatedQuantity = productData.current_quantity + item.quantity;

        // Perform Increment!
        const { error: updateError } = await supabase
          .from("products")
          .update({ current_quantity: updatedQuantity })
          .eq("id", item.product_id);

        if (updateError) throw updateError;

        // Append to stock_audit_log!
        await supabase.from("stock_audit_log").insert({
          product_id: item.product_id,
          change_amount: item.quantity,
          transaction_type: "RESTOCK",
          notes: `Restock via Purchase Order ID: ${orderId}`,
        });
      }
    }

    // Finally Update the standard Status column
    const { error } = await supabase
      .from("purchase_orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) throw new Error(error.message);

    revalidatePath("/purchases");
    revalidatePath("/purchases/new"); // Overkill but guarantees absolute cache sync if forms reuse cache
    return { success: true };
  } catch (error: any) {
    console.error("Error updating PO status:", error);
    return { success: false, message: error.message || "Failed to update PO status" };
  }
}
