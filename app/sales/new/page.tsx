import React from "react";
import NewOrderClient from "./NewOrderClient";
import { getProductsForDropdown } from "../../actions/sales";

export const metadata = {
  title: "New Sales Order - InventoryForge",
  description: "Create a new Sales Order quotation.",
};

export default async function NewSalesOrderPage() {
  // Pull live products right on the server to populate the dropdown catalog!
  const products = await getProductsForDropdown();

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-[1200px]">
        <NewOrderClient availableProducts={products} />
      </div>
    </div>
  );
}
