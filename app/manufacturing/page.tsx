import React from "react";
import ManufacturingClient from "./ManufacturingClient";
import { getBatches } from "../actions/manufacturing";

export const metadata = {
  title: "Manufacturing Tracking - InventoryForge",
  description: "Monitor and manage assembly processes turning raw materials into finished goods.",
};

export default async function ManufacturingPage() {
  const initialBatches = await getBatches();

  return (
    <div className="min-h-screen bg-zinc-950 p-6 md:p-8">
      <div className="mx-auto max-w-[1400px]">
        <ManufacturingClient initialBatches={initialBatches as any} />
      </div>
    </div>
  );
}
