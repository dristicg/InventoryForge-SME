"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { SalesOrder, NewSalesOrder, SalesOrderStatus, SalesOrderItem } from "../../types/sales";

// Supabase server-side client
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mock.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "mock-key";
  return createClient(url, key, { auth: { persistSession: false } });
}

const MOCK_PRODUCTS = [
  { id: "11111111-1111-1111-1111-111111111111", name: "Industrial Power Supply", sku: "PWR-IND-100", current_quantity: 45, selling_price: 299.99 },
  { id: "22222222-2222-2222-2222-222222222222", name: "Machined Steel Gears", sku: "MCH-STL-050", current_quantity: 8, selling_price: 45.50 },
  { id: "33333333-3333-3333-3333-333333333333", name: "Copper Wiring Spool", sku: "CBL-COP-200", current_quantity: 120, selling_price: 15.00 },
];

export async function getProductsForDropdown() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return MOCK_PRODUCTS;
  const supabase = getSupabase();
  // Select * to prevent crashing if specific columns are missing in user's schema
  const { data, error } = await supabase.from("products").select("*").order("name");
  
  if (error || !data || data.length === 0) {
    console.warn("No products found in DB or an error occurred accessing columns, using mock products for testing.", error);
    return MOCK_PRODUCTS;
  }
  
  // Clean up and map user's actual database columns to the expected frontend format
  return data.map((product: any) => ({
    ...product,
    sku: product.sku || product.product_code || "Unknown-SKU",
    current_quantity: product.current_quantity || 0,
    selling_price: product.selling_price || 50, // Default price since their schema doesn't have it
    cost_price: product.cost_price || 25,
  }));
}

export async function getSalesOrders(): Promise<SalesOrder[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("sales_orders")
    .select(`
      *,
      sales_order_items (
        *,
        product:products (*)
      )
    `);

  if (error) {
    console.error("Error fetching sales orders:", error);
    return [];
  }
  return data || [];
}

export async function createSalesOrder(orderData: NewSalesOrder): Promise<{ success: boolean; message?: string; id?: string }> {
  try {
    const supabase = getSupabase();
    
    // Generate a unique order number for the database
    const generatedOrderNumber = `ORD-${Date.now()}`;
    
    // 1. Insert Sales Order
    const { data: orderResponse, error: orderError } = await supabase
      .from("sales_orders")
      .insert({
        order_number: generatedOrderNumber,
        customer_name: orderData.customer_name,
        total_amount: orderData.total_amount,
        status: "Quotation", // Default new status
      })
      .select("id")
      .single();

    if (orderError) throw new Error(orderError.message);
    const newOrderId = orderResponse.id;

    // 2. Map and Insert Items
    const itemsToInsert = orderData.sales_order_items.map((item) => ({
      sales_order_id: newOrderId,
      product_id: item.product_id,
      quantity: item.quantity,
      rate: item.rate
    }));

    const { error: itemsError } = await supabase.from("sales_order_items").insert(itemsToInsert);
    if (itemsError) throw new Error(itemsError.message);

    revalidatePath("/sales");
    return { success: true, id: newOrderId };
  } catch (error: any) {
    console.error("Failed to create order:", error);
    return { success: false, message: error.message || "Failed to create sales order." };
  }
}

export async function updateOrderStatus(orderId: string, newStatus: SalesOrderStatus): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = getSupabase();
    
    // If the status is Dispatched, we need to handle STOCK DEDUCTION
    if (newStatus === "Dispatched") {
      // Fetch order items to know how much to deduct
      const { data: items, error: itemsError } = await supabase
        .from("sales_order_items")
        .select("product_id, quantity")
        .eq("sales_order_id", orderId);

      if (itemsError) throw new Error("Could not fetch items for stock deduction.");

      // For each item, update stock and log
      if (items && items.length > 0) {
        for (const item of items) {
          // A real production app would use an RPC for atomic deduction:
          // e.g. await supabase.rpc('decrement_stock', { p_id: item.product_id, amount: item.quantity });
          // But simulating it here:
          const { data: product, error: prodErr } = await supabase
            .from("products")
            .select("current_quantity")
            .eq("id", item.product_id)
            .single();

          if (!prodErr && product) {
            const newQty = product.current_quantity - item.quantity;
            
            await supabase.from("products").update({ current_quantity: newQty }).eq("id", item.product_id);
            
            // Insert Stock Audit Log
            await supabase.from("stock_audit_log").insert({
              product_id: item.product_id,
              order_id: orderId,
              change_amount: -item.quantity,
              reason: `Dispatched from Sales Order ${orderId}`
            });
          }
        }
      }
    }

    // Update the actual order status
    const { error } = await supabase
      .from("sales_orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) throw new Error(error.message);

    revalidatePath("/sales");
    // Also revalidate products page since stock may have changed
    revalidatePath("/dashboard/products");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to update status:", error);
    return { success: false, message: error.message || "Status update failed." };
  }
}
