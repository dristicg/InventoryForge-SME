import React from "react";
import PurchaseListClient from "./PurchaseListClient";
import { getPurchaseOrders } from "../actions/purchases";

export const metadata = {
  title: "Purchase Orders - InventoryForge",
  description: "View and manage inbound Purchase Orders.",
};

export default async function PurchasesPage() {
  const initialPO = await getPurchaseOrders();

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="mx-auto max-w-[1200px]">
        <PurchaseListClient initialOrders={initialPO} />
      </div>
    </div>
  );
}
