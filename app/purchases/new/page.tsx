import React from "react";
import NewPurchaseClient from "./NewPurchaseClient";
import { getProductsForDropdown } from "../../actions/sales"; 

// Reusing getProductsForDropdown from sales actions since the payload (id, name, sku, current_quantity, selling_price, cost_price) works dynamically.

export const metadata = {
  title: "New Purchase Order - InventoryForge",
  description: "Draft a new Purchase Order to restock inventory.",
};

export default async function NewPurchaseOrderPage() {
  const products = await getProductsForDropdown();

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-[1200px]">
        <NewPurchaseClient availableProducts={products as any} />
      </div>
    </div>
  );
}
