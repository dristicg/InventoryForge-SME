"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Plus, Filter, PackageOpen, ChevronRight, X, Clock, PackageCheck, Send, CheckCircle2, FileDown, Share2 } from "lucide-react";
import { toast } from "sonner";
import { SalesOrder, SalesOrderStatus } from "../../types/sales";
import { updateOrderStatus } from "../actions/sales";
import { generateProfessionalPDF } from "../../lib/pdf/generator";
import { uploadOrderPDF, generateWhatsAppLink } from "../actions/storage";

interface SalesListClientProps {
  initialOrders: SalesOrder[];
  // Products passed so we can potentially display product names in details
  availableProducts: any[]; 
}

const STAGES: SalesOrderStatus[] = ['Quotation', 'Confirmed', 'Packing', 'Dispatched', 'Completed'];

const STATUS_COLORS: Record<SalesOrderStatus, string> = {
  Quotation: "bg-slate-100 text-slate-800 ring-slate-500/20",
  Confirmed: "bg-blue-50 text-blue-700 ring-blue-600/20",
  Packing: "bg-orange-50 text-orange-700 ring-orange-600/20",
  Dispatched: "bg-purple-50 text-purple-700 ring-purple-600/20",
  Completed: "bg-green-50 text-green-700 ring-green-600/20",
};

export default function SalesListClient({ initialOrders, availableProducts }: SalesListClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Filter orders manually via search
  const filteredOrders = useMemo(() => {
    return initialOrders.filter((order) => {
      const term = searchTerm.toLowerCase();
      return (
        order.id.toLowerCase().includes(term) ||
        order.customer_name.toLowerCase().includes(term) ||
        order.status.toLowerCase().includes(term)
      );
    });
  }, [initialOrders, searchTerm]);

  // Handle Status Update
  const advanceStatus = async (order: SalesOrder) => {
    const currentIndex = STAGES.indexOf(order.status);
    if (currentIndex === -1 || currentIndex === STAGES.length - 1) return;

    const nextStatus = STAGES[currentIndex + 1];
    
    // Give user warning if Dispatched since it deducts stock
    if (nextStatus === "Dispatched") {
      const confirmDispatch = confirm("Advancing to 'Dispatched' will deduct item quantities from live stock. Are you sure?");
      if (!confirmDispatch) return;
    }

    setIsUpdating(true);
    const result = await updateOrderStatus(order.id, nextStatus);
    setIsUpdating(false);

    if (result.success) {
      toast.success(`Order advanced to ${nextStatus}`);
      // Optimistically update selected order in modal view (Server action will revalidate the background list)
      setSelectedOrder({ ...order, status: nextStatus });
    } else {
      toast.error(result.message || "Failed to advance order.");
    }
  };

  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const handleDownloadPDF = (order: SalesOrder) => {
    const doc = generateProfessionalPDF(order, "Sales Order");
    doc.save(`SalesOrder_${order.id.substring(0, 8)}.pdf`);
    toast.success("PDF Downloaded");
  };

  const handleWhatsAppShare = async (order: SalesOrder) => {
    setIsProcessingFile(true);
    toast.info("Preparing shareable link...");
    
    try {
      const doc = generateProfessionalPDF(order, "Sales Order");
      const pdfBase64 = doc.output("datauristring");
      const fileName = `SO_${order.id.substring(0, 8)}_${Date.now()}.pdf`;

      const uploadResult = await uploadOrderPDF(pdfBase64, fileName);
      
      const shareUrl = await generateWhatsAppLink(
        order.id.substring(0, 8),
        order.customer_name,
        order.total_amount,
        uploadResult.success ? uploadResult.url : undefined
      );

      window.open(shareUrl, "_blank");
      
      if (!uploadResult.success) {
        toast.warning("Link shared without file (Storage Bucket 'documents' not found/configured).");
      }
    } catch (e: any) {
      toast.error("Failed to share on WhatsApp.");
    } finally {
      setIsProcessingFile(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Sales Orders</h1>
          <p className="text-zinc-400 mt-1">Manage B2B pipelines and track fulfillment stages.</p>
        </div>
        <Link
          href="/sales/new"
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none focus:ring-offset-2"
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Order
        </Link>
      </div>

      {/* Toolbar / Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-zinc-900 p-4 rounded-2xl shadow-sm border border-white/5">
        <div className="relative w-full sm:max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-zinc-500" />
          </div>
          <input
            type="text"
            placeholder="Search by ID, customer name, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-xl border-0 py-2.5 pl-10 pr-4 text-white ring-1 ring-inset ring-white/10 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm bg-zinc-800/50 transition-colors hover:bg-zinc-800"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-zinc-400">{filteredOrders.length} orders</span>
          <button className="inline-flex items-center justify-center rounded-lg border border-white/5 bg-zinc-900 p-2.5 text-zinc-400 hover:bg-zinc-800">
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Modern Card Grid / List Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div 
              key={order.id} 
              onClick={() => setSelectedOrder(order)}
              className="group relative flex flex-col bg-zinc-900 rounded-2xl border border-white/5 shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all cursor-pointer overflow-hidden p-6 gap-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-white line-clamp-1">{order.customer_name}</h3>
                  <p className="text-sm text-zinc-400 font-mono mt-0.5">{order.id.slice(0, 13)}...</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_COLORS[order.status]}`}>
                  {order.status}
                </span>
              </div>
              
              <div className="border-t border-white/5 pt-4 flex items-center justify-between mt-auto">
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Total Amount</p>
                  <p className="font-bold text-white">${order.total_amount?.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-zinc-500 mb-1">Items</p>
                  <p className="font-medium text-zinc-300">{order.sales_order_items?.length || 0} unique</p>
                </div>
              </div>

              {/* Progress Summary Line */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100">
                <div 
                  className={`h-full ${order.status === 'Completed' ? 'bg-green-500' : 'bg-blue-500'} transition-all`}
                  style={{ width: `${((STAGES.indexOf(order.status) + 1) / STAGES.length) * 100}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
            <h3 className="mt-2 text-sm font-semibold text-slate-900">No orders found</h3>
            <p className="mt-1 text-sm text-slate-500">Get started by creating a new sales order.</p>
          </div>
        )}
      </div>

      {/* Order Details & Progress Tracker Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => !isUpdating && setSelectedOrder(null)} />
          
          {/* Right Slide-in Panel */}
          <div className="relative z-50 w-full max-w-lg bg-white h-full shadow-2xl flex flex-col pt-6 transform transition-transform animate-in slide-in-from-right duration-300">
            <div className="px-6 flex items-center justify-between pb-6 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Order Details</h2>
                <p className="text-sm font-mono text-slate-500 mt-1">{selectedOrder.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPDF(selectedOrder)}
                  className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Download PDF"
                >
                  <FileDown className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleWhatsAppShare(selectedOrder)}
                  disabled={isProcessingFile}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Share on WhatsApp"
                >
                  <Share2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 transition-colors ml-2"
                  disabled={isUpdating}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Order Info */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <p className="text-sm text-slate-500 mb-1">Customer</p>
                <p className="text-lg font-semibold text-slate-900">{selectedOrder.customer_name}</p>
                
                <div className="mt-4 flex justify-between items-center border-t border-slate-200 pt-4">
                  <p className="text-sm font-medium text-slate-600">Total Value</p>
                  <p className="text-xl font-bold text-slate-900">${selectedOrder.total_amount?.toFixed(2)}</p>
                </div>
              </div>

              {/* Progress Tracker UI */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Fulfillment Stage</h3>
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100 translate-x-px" />
                  
                  <div className="space-y-6">
                    {STAGES.map((stage, idx) => {
                      const currentIdx = STAGES.indexOf(selectedOrder.status);
                      const isCompleted = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;

                      return (
                        <div key={stage} className="relative flex items-start gap-4">
                          <div className={`
                            relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white
                            ${isCompleted ? 'border-blue-600 text-blue-600' : 'border-slate-200 text-slate-400'}
                            ${isCurrent ? 'ring-4 ring-blue-50' : ''}
                          `}>
                            {idx === 0 && <Clock className="h-4 w-4" />}
                            {idx === 1 && <CheckCircle2 className="h-4 w-4" />}
                            {idx === 2 && <PackageCheck className="h-4 w-4" />}
                            {idx === 3 && <Send className="h-4 w-4" />}
                            {idx === 4 && <CheckCircle2 className="h-4 w-4" />}
                          </div>
                          <div className="pt-1.5">
                            <p className={`font-semibold ${isCompleted ? 'text-slate-900' : 'text-slate-500'}`}>{stage}</p>
                            {isCurrent && (
                              <p className="text-xs text-blue-600 font-medium mt-0.5">Currently active phase</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Advance Button */}
                {STAGES.indexOf(selectedOrder.status) < STAGES.length - 1 && (
                  <button
                    onClick={() => advanceStatus(selectedOrder)}
                    disabled={isUpdating}
                    className="mt-6 w-full inline-flex justify-center items-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 transition-all"
                  >
                    {isUpdating ? "Updating..." : `Advance to ${STAGES[STAGES.indexOf(selectedOrder.status) + 1]}`}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Line Items */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Line Items</h3>
                <div className="space-y-3">
                  {selectedOrder.sales_order_items?.map((item: any, i) => (
                    <div key={item.id || i} className="flex justify-between items-center p-4 border border-slate-100 rounded-xl bg-white shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                          <PackageOpen className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.product?.name || `Product ID: ${item.product_id.substring(0,6)}`}</p>
                          <p className="text-xs text-slate-500">{item.quantity} units x ${item.rate?.toFixed(2)}</p>
                        </div>
                      </div>
                      <p className="font-semibold text-slate-900">${item.total_price?.toFixed(2)}</p>
                    </div>
                  ))}
                  {(!selectedOrder.sales_order_items || selectedOrder.sales_order_items.length === 0) && (
                    <p className="text-sm text-slate-500 italic">No line items loaded.</p>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
