import { Product } from "./product";

export type PurchaseOrderStatus = "Draft" | "Ordered" | "Received" | "Completed";

export type PurchaseOrderItem = {
  id?: string;
  purchase_order_id?: string;
  product_id: string;
  quantity: number;
  rate: number; // The cost_price at the time of order
  total_price: number; // quantity * rate
  product?: Product; // for UI joins
};

export type PurchaseOrder = {
  id: string; // UUID Primary Key
  po_number: string; // The explicit non-null string generated to bypass constraint
  supplier_name: string;
  order_date: string;
  status: PurchaseOrderStatus;
  total_amount: number;
  purchase_order_items?: PurchaseOrderItem[];
};

export type NewPurchaseOrder = {
  po_number?: string;
  supplier_name: string;
  total_amount: number;
  status?: PurchaseOrderStatus;
  purchase_order_items: Omit<PurchaseOrderItem, "purchase_order_id" | "id">[];
};
