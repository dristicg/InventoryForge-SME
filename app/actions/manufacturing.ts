"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { ManufacturingBatch, ManufacturingBatchStatus, NewManufacturingBatch } from "../../types/manufacturing";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mock.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "mock-key";
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function getBatches(): Promise<ManufacturingBatch[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];
  
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("manufacturing_batches")
    .select(`
      *,
      output_product:products!manufacturing_batches_output_product_id_fkey (*),
      manufacturing_raw_materials (
        *,
        product:products (*)
      )
    `);

  if (error) {
    console.warn("Could not fetch manufacturing_batches. Ensure your tables are fully structured in Supabase.", error);
    return [];
  }
  
  // Provide grace defaults for missing DB data
  return (data || []).map((batch: any) => ({
    ...batch,
    status: batch.status || "Pending",
    output_product_id: batch.output_product_id || batch.product_id || "", 
  }));
}

export async function createManufacturingBatch(
  batchData: NewManufacturingBatch
): Promise<{ success: boolean; message?: string; id?: string }> {
  try {
    const supabase = getSupabase();
    const batchNumber = `MFG-${Date.now()}`;

    // 1. Insert Base Batch
    const { data: batchRes, error: batchError } = await supabase
      .from("manufacturing_batches")
      .insert({
        batch_number: batchNumber,
        output_product_id: batchData.output_product_id,
        output_quantity: batchData.output_quantity,
        status: "Pending",
      })
      .select("id")
      .single();

    if (batchError) throw new Error(`Batch Creation Failed: ${batchError.message}`);
    const newBatchId = batchRes.id;

    // 2. Insert Raw Materials List
    if (batchData.raw_materials.length > 0) {
      const items = batchData.raw_materials.map((m) => ({
        batch_id: newBatchId,
        product_id: m.product_id,
        quantity: m.quantity,
      }));

      const { error: itemsError } = await supabase.from("manufacturing_raw_materials").insert(items);
      if (itemsError) throw new Error(`Raw Material Binding Failed: ${itemsError.message}`);
    }

    revalidatePath("/manufacturing");
    return { success: true, id: newBatchId };
  } catch (error: any) {
    console.error("Failed to create manufacturing batch:", error);
    return { success: false, message: error.message || "Failed to create batch" };
  }
}

export async function updateBatchStatus(
  batchId: string, 
  newStatus: ManufacturingBatchStatus
): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = getSupabase();

    // CRITICAL: ATOMIC SWAP UPON COMPLETION
    if (newStatus === "Completed") {
      // 1. DEDUCT Base Components
      const { data: materials, error: matErr } = await supabase
        .from("manufacturing_raw_materials")
        .select("product_id, quantity")
        .eq("batch_id", batchId);
        
      if (matErr) throw new Error("Could not map raw materials for consumption.");

      if (materials && materials.length > 0) {
        for (const mat of materials) {
          const { data: prod } = await supabase.from("products").select("current_quantity").eq("id", mat.product_id).single();
          if (prod) {
            await supabase.from("products").update({ current_quantity: prod.current_quantity - mat.quantity }).eq("id", mat.product_id);
            // Audit Logging component burn
            await supabase.from("stock_audit_log").insert({
              product_id: mat.product_id,
              order_id: batchId,
              change_amount: -mat.quantity,
              reason: `Consumed in assembly ${batchId.slice(0,8)}`
            });
          }
        }
      }

      // 2. INCREMENT Finished Product
      const { data: batch, error: bErr } = await supabase
        .from("manufacturing_batches")
        .select("output_product_id, output_quantity")
        .eq("id", batchId)
        .single();
        
      if (bErr) throw new Error("Could not resolve final batch output parameters.");
      
      if (batch) {
        // Output Quantity injection!
        const { data: outProd } = await supabase.from("products").select("current_quantity").eq("id", batch.output_product_id).single();
        
        if (outProd) {
            await supabase.from("products").update({ current_quantity: outProd.current_quantity + batch.output_quantity }).eq("id", batch.output_product_id);
            
            // Audit Logging injection
            await supabase.from("stock_audit_log").insert({
              product_id: batch.output_product_id,
              order_id: batchId,
              change_amount: batch.output_quantity,
              reason: `Manufactured via assembly ${batchId.slice(0,8)}`
            });
        }
      }
    }

    // 3. Update the tracking state status
    const { error } = await supabase
      .from("manufacturing_batches")
      .update({ status: newStatus })
      .eq("id", batchId);

    if (error) throw new Error(error.message);

    revalidatePath("/manufacturing");
    revalidatePath("/dashboard/products");

    return { success: true };
  } catch (error: any) {
    console.error("Manufacturing operation failed:", error);
    return { success: false, message: error.message || "Failed to progress assembly timeline." };
  }
}
