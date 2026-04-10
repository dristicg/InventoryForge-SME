import { Product } from "./product";

export type ManufacturingBatchStatus = "Pending" | "In Progress" | "Completed";

export interface ManufacturingRawMaterial {
  id?: string;
  batch_id?: string;
  product_id: string;
  quantity: number;
  product?: Product; // Linked component data for UI (name, sku)
}

export interface ManufacturingBatch {
  id: string;
  batch_number: string;
  output_product_id: string;
  output_quantity: number;
  status: ManufacturingBatchStatus;
  created_at?: string;
  
  // Relations
  output_product?: Product;
  manufacturing_raw_materials?: ManufacturingRawMaterial[];
}

export interface NewManufacturingBatch {
  output_product_id: string;
  output_quantity: number;
  raw_materials: {
    product_id: string;
    quantity: number;
  }[];
}
