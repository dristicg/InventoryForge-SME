import React from "react";
import SalesListClient from "./SalesListClient";
import { getSalesOrders, getProductsForDropdown } from "../actions/sales";

export const metadata = {
  title: "Sales Orders - InventoryForge",
  description: "Manage your SME sales pipelines.",
};

export default async function SalesPage() {
  // Fetch initial data seamlessly on the server
  const [initialOrders, products] = await Promise.all([
    getSalesOrders(),
    getProductsForDropdown()
  ]);

  return (
    <div className="min-h-screen bg-zinc-950 p-6 md:p-8">
      <div className="mx-auto max-w-[1400px]">
        {/* Pass fetched data to the client interactive layer */}
        <SalesListClient initialOrders={initialOrders} availableProducts={products} />
      </div>
    </div>
  );
}
