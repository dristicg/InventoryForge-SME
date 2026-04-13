"use client";

import React, { useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Package, AlertTriangle, ShoppingCart, Truck, Factory, ArrowRight, Loader2 } from "lucide-react";
import { ReorderSuggestion } from "../actions/dashboard";
import { createPurchaseOrder } from "../actions/purchases";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface DashboardClientProps {
  metrics: {
    totalProducts: number;
    lowStock: number;
    pendingSales: number;
    pendingPurchases: number;
    activeBatches: number;
  };
  suggestions: ReorderSuggestion[];
  analytics: {
    barChartData: any[];
    lineChartData: any[];
  };
}

export default function DashboardClient({ metrics, suggestions, analytics }: DashboardClientProps) {
  const router = useRouter();
  const [isOrdering, setIsOrdering] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const handleCreatePO = async (suggestion: ReorderSuggestion) => {
    setIsOrdering(suggestion.productId);
    try {
      const payload = {
        supplier_name: "Smart Reorder Auto-Supplier",
        total_amount: suggestion.suggestedQty * suggestion.rate,
        purchase_order_items: [
          {
            product_id: suggestion.productId,
            quantity: suggestion.suggestedQty,
            rate: suggestion.rate,
            total_price: suggestion.suggestedQty * suggestion.rate
          }
        ]
      };
      
      const res = await createPurchaseOrder(payload);
      if (res.success) {
        toast.success(`Purchase Order created for ${suggestion.name}!`);
        router.refresh();
      } else {
        toast.error("Failed to create Purchase Order: " + res.message);
      }
    } catch (e: any) {
      toast.error("Error creating PO.");
    } finally {
      setIsOrdering(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Package size={64} />
          </div>
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
            <Package size={ 18 } />
            <span className="font-medium">Total Products</span>
          </div>
          <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {metrics.totalProducts}
          </div>
        </div>

        <div className={`bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-sm relative overflow-hidden group ${metrics.lowStock > 0 ? 'border-red-200 dark:border-red-900/50' : 'border-slate-200 dark:border-slate-800'}`}>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <AlertTriangle size={64} className={metrics.lowStock > 0 ? "text-red-500" : ""} />
          </div>
          <div className={`flex items-center gap-3 mb-2 font-medium ${metrics.lowStock > 0 ? "text-red-500 dark:text-red-400" : "text-slate-500 dark:text-slate-400"}`}>
            <AlertTriangle size={ 18 } />
            <span>Low Stock</span>
          </div>
          <div className={`text-3xl font-bold tracking-tight ${metrics.lowStock > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
            {metrics.lowStock}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShoppingCart size={64} />
          </div>
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
            <ShoppingCart size={ 18 } />
            <span className="font-medium">Pending Sales</span>
          </div>
          <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {metrics.pendingSales}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Truck size={64} />
          </div>
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
            <Truck size={ 18 } />
            <span className="font-medium">Pending Purchases</span>
          </div>
          <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {metrics.pendingPurchases}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Factory size={64} />
          </div>
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
            <Factory size={ 18 } />
            <span className="font-medium">Active Batches</span>
          </div>
          <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {metrics.activeBatches}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Charts Column */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Stock Value Movement (7 Days)</h3>
            <div className="h-72 w-full min-h-[288px] min-w-0">
              {isMounted ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={288}>
                  <LineChart data={analytics.lineChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} tickFormatter={(value) => `$${value}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                      itemStyle={{ color: '#38bdf8' }}
                    />
                    <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">Loading charts...</div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Top 5 Products by Sales Value</h3>
            <div className="h-72 w-full min-h-[288px] min-w-0">
              {isMounted ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={288}>
                  <BarChart data={analytics.barChartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} tickFormatter={(value) => `$${value}`} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 12}} />
                    <Tooltip 
                      cursor={{fill: '#f1f5f9', opacity: 0.1}} 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                      itemStyle={{ color: '#8b5cf6' }}
                    />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">Loading charts...</div>
              )}
            </div>
          </div>
        </div>

        {/* Smart Reorder Column */}
        <div className="xl:col-span-1">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-900 dark:to-slate-800/80 border border-indigo-100 dark:border-indigo-900/50 rounded-xl shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-indigo-100 dark:border-indigo-900/50">
              <div className="flex items-center gap-2 mb-1">
                <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Smart Reorder</h3>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                AI-driven restock suggestions based on last 30 days of sales velocity.
              </p>
            </div>
            
            <div className="p-0 flex-1 overflow-auto">
              {suggestions.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <Package className="mx-auto mt-4 mb-3 opacity-20" size={48} />
                  <p>Stock levels are optimal.</p>
                  <p className="text-xs mt-1 opacity-70">No reorder suggestions at this time.</p>
                </div>
              ) : (
                <ul className="divide-y divide-indigo-50 dark:divide-slate-800">
                  {suggestions.map((suggestion) => (
                    <li key={suggestion.productId} className="p-5 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-slate-900 dark:text-slate-100">{suggestion.name}</h4>
                          <span className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded mt-1 inline-block">
                            {suggestion.sku}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-500 mb-1">Current Stock</div>
                          <div className={`font-bold ${suggestion.currentStock > 0 ? "text-slate-700 dark:text-slate-300" : "text-red-500"}`}>
                            {suggestion.currentStock}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-4 bg-white dark:bg-slate-950/50 rounded-lg p-3 text-sm">
                        <div>
                          <div className="text-slate-500 text-xs">Avg Daily Sales</div>
                          <div className="font-medium mt-0.5">{suggestion.avgDailySales} units/day</div>
                        </div>
                        <div>
                          <div className="text-indigo-600 dark:text-indigo-400 text-xs font-medium">Suggested Qty</div>
                          <div className="font-bold text-indigo-700 dark:text-indigo-300 mt-0.5">{suggestion.suggestedQty} units</div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCreatePO(suggestion)}
                        disabled={isOrdering === suggestion.productId}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-70"
                      >
                        {isOrdering === suggestion.productId ? (
                          <><Loader2 size={16} className="animate-spin" /> Creating PO...</>
                        ) : (
                          <><ShoppingCart size={16} /> Create Purchase Order</>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
