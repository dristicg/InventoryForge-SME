import { Product } from "./product";

export type SalesOrderStatus = 'Quotation' | 'Confirmed' | 'Packing' | 'Dispatched' | 'Completed';

export interface SalesOrderItem {
  id?: string;
  sales_order_id?: string;
  product_id: string; // references products.id
  quantity: number;
  rate: number; // effectively selling_price at the time of order
  total_price: number; 
  product?: Product; // joined data
}

export interface SalesOrder {
  id: string;
  customer_name: string;
  order_date: string;
  status: SalesOrderStatus;
  total_amount: number;
  sales_order_items?: SalesOrderItem[];
}

export type NewSalesOrder = Omit<SalesOrder, 'id' | 'order_date' | 'status' | 'sales_order_items'> & {
  sales_order_items: SalesOrderItem[];
};

export interface StockAuditLog {
  id?: string;
  product_id: string;
  order_id?: string;
  change_amount: number; // e.g. -5 for a dispatch
  reason: string;
  created_at?: string;
}
