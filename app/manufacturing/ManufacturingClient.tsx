"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Columns, List as ListIcon, Hammer, ArrowRight, CheckCircle2, Factory, Layers, PlayCircle, Loader2, FileDown, Share2 } from "lucide-react";
import { toast } from "sonner";
import { ManufacturingBatch, ManufacturingBatchStatus } from "../../types/manufacturing";
import { updateBatchStatus } from "../actions/manufacturing";
import { generateProfessionalPDF } from "../../lib/pdf/generator";
import { uploadOrderPDF, generateWhatsAppLink } from "../actions/storage";

interface CompProps {
  initialBatches: ManufacturingBatch[];
}

export default function ManufacturingClient({ initialBatches }: CompProps) {
  const [batches, setBatches] = useState<ManufacturingBatch[]>(initialBatches);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const columns: ManufacturingBatchStatus[] = ["Pending", "In Progress", "Completed"];

  const handleStatusChange = async (batchId: string, newStatus: ManufacturingBatchStatus) => {
    if (newStatus === "Completed") {
      const isCertain = confirm("Confirming this assembly as 'Completed' will immediately burn the raw materials from stock and increment your Finished Goods. Proceed?");
      if (!isCertain) return;
    }

    setIsUpdating(batchId);
    
    // Optimistic UI update
    const previousState = [...batches];
    setBatches(batches.map(b => b.id === batchId ? { ...b, status: newStatus } : b));

    const result = await updateBatchStatus(batchId, newStatus);
    
    setIsUpdating(null);

    if (result.success) {
      toast.success(`Batch moved to ${newStatus}`);
    } else {
      toast.error(result.message || "Failed to update manufacturing phase.");
      setBatches(previousState); // rollback
    }
  };

  const [isProcessingFile, setIsProcessingFile] = useState<string | null>(null);

  const handleDownloadPDF = (batch: ManufacturingBatch) => {
    const doc = generateProfessionalPDF(batch, "Manufacturing Batch");
    doc.save(`Batch_${batch.batch_number || batch.id.substring(0, 8)}.pdf`);
    toast.success("PDF Downloaded");
  };

  const handleWhatsAppShare = async (batch: ManufacturingBatch) => {
    setIsProcessingFile(batch.id);
    toast.info("Preparing shareable link...");
    
    try {
      const doc = generateProfessionalPDF(batch, "Manufacturing Batch");
      const pdfBase64 = doc.output("datauristring");
      const fileName = `MFG_${batch.id.substring(0, 8)}_${Date.now()}.pdf`;

      const uploadResult = await uploadOrderPDF(pdfBase64, fileName);
      
      const shareUrl = await generateWhatsAppLink(
        batch.batch_number || batch.id.substring(0, 8),
        batch.output_product?.name || "Assembly Order",
        0, // Manufacturing doesn't usually have a 'total cost' displayed the same way as Sales
        uploadResult.success ? uploadResult.url : undefined
      );

      window.open(shareUrl, "_blank");
      
      if (!uploadResult.success) {
        toast.warning("Link shared without file (Storage Bucket 'documents' not found/configured).");
      }
    } catch (e: any) {
      toast.error("Failed to share on WhatsApp.");
    } finally {
      setIsProcessingFile(null);
    }
  };

  const getColColor = (status: string) => {
    switch (status) {
      case "Pending": return "bg-amber-100/50 border-amber-200 text-amber-900";
      case "In Progress": return "bg-blue-100/50 border-blue-200 text-blue-900";
      case "Completed": return "bg-emerald-100/50 border-emerald-200 text-emerald-900";
      default: return "bg-slate-100 border-slate-200 text-slate-900";
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Factory className="h-8 w-8 text-indigo-500" />
            Manufacturing Operations
          </h1>
          <p className="text-zinc-400 mt-1">Transform raw materials into finished inventory automatically.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="bg-zinc-900 p-1 rounded-lg flex border border-white/5 shadow-sm">
            <button 
              onClick={() => setViewMode("kanban")}
              className={`p-2 rounded-md transition-all ${viewMode === "kanban" ? "bg-indigo-600/10 text-indigo-400 shadow-sm" : "text-zinc-500 hover:text-white hover:bg-zinc-800"}`}
            >
              <Columns className="h-4 w-4" />
            </button>
            <button 
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-all ${viewMode === "list" ? "bg-indigo-600/10 text-indigo-400 shadow-sm" : "text-zinc-500 hover:text-white hover:bg-zinc-800"}`}
            >
              <ListIcon className="h-4 w-4" />
            </button>
          </div>
          
          <Link
            href="/manufacturing/new"
            className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:ring-offset-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Batch
          </Link>
        </div>
      </div>

      {viewMode === "kanban" ? (
        // --- KANBAN VIEW ---
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-220px)] min-h-[600px]">
          {columns.map((col) => {
            const colBatches = batches.filter(b => b.status === col);
            return (
              <div key={col} className={`flex flex-col rounded-2xl border bg-zinc-900/50 overflow-hidden ${col === 'In Progress' ? 'border-indigo-500/20' : 'border-white/5'}`}>
                <div className="px-5 py-4 border-b border-white/5 bg-zinc-800/50 backdrop-blur-md flex justify-between items-center">
                  <h3 className="font-bold text-sm tracking-wide uppercase text-zinc-400">{col}</h3>
                  <span className="bg-zinc-800 text-white rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-sm">{colBatches.length}</span>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {colBatches.length === 0 ? (
                    <div className="h-32 border-2 border-dashed border-white/5 rounded-xl flex items-center justify-center text-zinc-600 text-sm">
                      No batches
                    </div>
                  ) : (
                    colBatches.map(batch => (
                      <div key={batch.id} className="bg-zinc-900 rounded-xl border border-white/5 shadow-sm hover:shadow-md hover:border-indigo-500/30 transition-all p-5 relative group overflow-hidden">
                        
                        {/* Loading overlay for optimistic state wait */}
                        {isUpdating === batch.id && (
                          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col justify-center items-center">
                            <Loader2 className="h-6 w-6 text-indigo-600 animate-spin mb-2" />
                            <span className="text-xs font-semibold text-indigo-900">Synchronizing...</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{batch.batch_number || batch.id.slice(0,8)}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDownloadPDF(batch)}
                              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Download PDF"
                            >
                              <FileDown className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleWhatsAppShare(batch)}
                              disabled={isProcessingFile === batch.id}
                              className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Share on WhatsApp"
                            >
                              <Share2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        
                        <h4 className="font-bold text-slate-900 leading-tight mb-4">
                          {batch.output_product?.name || `Product Code: ${batch.output_product_id.substring(0,8)}`}
                          <span className="text-indigo-600 ml-2">x{batch.output_quantity}</span>
                        </h4>
                        
                        <div className="bg-slate-50 rounded-lg p-3 text-sm border border-slate-100 mb-5">
                          <p className="text-xs font-bold uppercase text-slate-500 mb-2 flex items-center gap-1"><Layers className="h-3 w-3" /> Raw Materials</p>
                          <div className="space-y-1.5">
                            {batch.manufacturing_raw_materials?.map((mat: any, idx) => (
                              <div key={mat.id || idx} className="flex justify-between items-center text-slate-600 text-xs">
                                <span className="truncate pr-2">{mat.product?.name || mat.product_id.slice(0,6)}</span>
                                <span className="font-medium bg-slate-200 px-1.5 rounded">{mat.quantity}</span>
                              </div>
                            ))}
                            {(!batch.manufacturing_raw_materials || batch.manufacturing_raw_materials.length === 0) && (
                              <span className="text-slate-400 italic">No linked components</span>
                            )}
                          </div>
                        </div>
                        
                        {/* Interactive Action Buttons specific to column */}
                        <div className="pt-4 border-t border-slate-100 flex gap-2">
                          {col === "Pending" && (
                            <button 
                              onClick={() => handleStatusChange(batch.id, "In Progress")}
                              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-2 rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
                            >
                              <PlayCircle className="h-4 w-4" /> Start Assembly
                            </button>
                          )}
                          {col === "In Progress" && (
                            <button 
                              onClick={() => handleStatusChange(batch.id, "Completed")}
                              className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white py-2 rounded-lg text-xs font-semibold hover:bg-emerald-500 shadow-sm shadow-emerald-600/20 transition-all"
                            >
                              <CheckCircle2 className="h-4 w-4" /> Log as Completed
                            </button>
                          )}
                          {col === "Completed" && (
                            <div className="w-full text-center py-2 text-xs font-bold text-emerald-600 bg-emerald-50 rounded-lg border border-emerald-100">
                              Production Finalized!
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>


      ) : (
        // --- LIST VIEW ---
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-900">Batch Target</th>
                  <th className="px-6 py-4 font-semibold text-slate-900">Output Range</th>
                  <th className="px-6 py-4 font-semibold text-slate-900">Phase</th>
                  <th className="px-6 py-4 font-semibold text-slate-900 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.length > 0 ? batches.map(batch => (
                  <tr key={batch.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{batch.output_product?.name || batch.output_product_id.substring(0,6)}</p>
                      <p className="text-xs font-mono text-slate-500 mt-0.5">{batch.batch_number || batch.id.slice(0,8)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-100">
                        {batch.output_quantity} Units
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getColColor(batch.status)}`}>
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-3">
                         <div className="flex items-center gap-1 mr-2 px-2 border-r border-slate-200">
                           <button onClick={() => handleDownloadPDF(batch)} className="p-1 text-slate-500 hover:text-slate-900" title="Download">
                             <FileDown className="h-4 w-4" />
                           </button>
                           <button onClick={() => handleWhatsAppShare(batch)} disabled={isProcessingFile === batch.id} className="p-1 text-slate-500 hover:text-green-600" title="WhatsApp">
                             <Share2 className="h-4 w-4" />
                           </button>
                         </div>
                         {batch.status === "Pending" && (
                            <button onClick={() => handleStatusChange(batch.id, "In Progress")} disabled={isUpdating === batch.id} className="text-indigo-600 font-semibold text-xs hover:text-indigo-800 disabled:opacity-50">Advance to Assembly</button>
                         )}
                         {batch.status === "In Progress" && (
                            <button onClick={() => handleStatusChange(batch.id, "Completed")} disabled={isUpdating === batch.id} className="text-emerald-600 font-bold text-xs hover:text-emerald-800 disabled:opacity-50">Mark Finished</button>
                         )}
                         {batch.status === "Completed" && (
                            <span className="text-slate-400 text-xs font-medium italic">— Restocked —</span>
                         )}
                       </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      No active manufacturing workflows.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
