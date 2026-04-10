export type Product = {
  id: string; // usually UUID in DB
  name: string;
  sku: string;
  category: string;
  selling_price: number;
  cost_price?: number;
  current_quantity: number;
  qrCodeData?: string;
  status?: string;
  lastUpdated?: string;
};

export type NewProduct = Omit<Product, 'id' | 'qrCodeData' | 'status' | 'lastUpdated'>;
