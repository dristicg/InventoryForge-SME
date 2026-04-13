"use server";

import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  // Note: For real environment, you might use Supabase Service Role Key for bucket creation
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function uploadOrderPDF(base64Data: string, fileName: string) {
  try {
    const supabase = getSupabase();
    const bucketName = "documents";

    // Convert base64 to Buffer
    const buffer = Buffer.from(base64Data.split(",")[1], "base64");

    // 1. Check if bucket exists, if not, we unfortunately can't create it via anon key
    // In a real app, this would be pre-configured.
    
    // 2. Upload file
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(`pdfs/${fileName}`, buffer, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (error) {
      console.warn("Storage upload failed (Bucket might not exist/be public):", error.message);
      return { success: false, message: error.message };
    }

    // 3. Get Public URL
    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(`pdfs/${fileName}`);
    
    return { success: true, url: urlData.publicUrl };
  } catch (error: any) {
    console.error("Storage Action Error:", error);
    return { success: false, message: error.message };
  }
}

export async function generateWhatsAppLink(orderId: string, customerName: string, total: number, pdfUrl?: string) {
  const message = `*InventoryForge Order Summary*\n\n` +
    `Order ID: ${orderId}\n` +
    `Customer: ${customerName}\n` +
    `Grand Total: $${total.toFixed(2)}\n\n` +
    (pdfUrl ? `View PDF: ${pdfUrl}\n\n` : `PDF is attached below.\n\n`) +
    `Thank you for your business!`;

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
