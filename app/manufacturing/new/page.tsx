import React from "react";
import NewBatchClient from "./NewBatchClient";
import { getProductsForDropdown } from "../../actions/sales"; 

export const metadata = {
  title: "New Assembly Batch - InventoryForge",
  description: "Draft a new manufacturing operation.",
};

export default async function NewBatchPage() {
  const products = await getProductsForDropdown();

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-[1200px]">
        <NewBatchClient availableProducts={products as any} />
      </div>
    </div>
  );
}
