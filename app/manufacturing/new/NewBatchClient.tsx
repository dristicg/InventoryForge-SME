"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Check, Search, Factory, Combine } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { createManufacturingBatch } from "../../actions/manufacturing";
import { Product } from "../../../types/product";
import { NewManufacturingBatch } from "../../../types/manufacturing";

interface CompProps {
  availableProducts: Product[];
}

export default function NewBatchClient({ availableProducts }: CompProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Output configuration
  const [outputProductSearch, setOutputProductSearch] = useState("");
  const [selectedOutputProduct, setSelectedOutputProduct] = useState<Product | null>(null);
  const [isOutputDropdownOpen, setIsOutputDropdownOpen] = useState(false);
  const [outputQuantity, setOutputQuantity] = useState<number>(1);

  // Raw Materials state
  const [rawMaterials, setRawMaterials] = useState<{product_id: string; product: Product; quantity: number}[]>([]);
  
  // Add component state
  const [componentSearch, setComponentSearch] = useState("");
  const [selectedComponent, setSelectedComponent] = useState<Product | null>(null);
  const [isComponentDropdownOpen, setIsComponentDropdownOpen] = useState(false);
  const [componentQuantity, setComponentQuantity] = useState<number>(1);

  // Searching logic
  const filteredOutputProducts = useMemo(() => {
    return availableProducts.filter((p) => 
      p.name.toLowerCase().includes(outputProductSearch.toLowerCase()) || 
      p.sku.toLowerCase().includes(outputProductSearch.toLowerCase())
    );
  }, [availableProducts, outputProductSearch]);

  const filteredComponents = useMemo(() => {
    return availableProducts.filter((p) => 
      p.name.toLowerCase().includes(componentSearch.toLowerCase()) || 
      p.sku.toLowerCase().includes(componentSearch.toLowerCase())
    );
  }, [availableProducts, componentSearch]);

  const selectOutputProduct = (p: Product) => {
    setSelectedOutputProduct(p);
    setOutputProductSearch(p.name);
    setIsOutputDropdownOpen(false);
  };

  const selectComponent = (p: Product) => {
    setSelectedComponent(p);
    setComponentSearch(p.name);
    setIsComponentDropdownOpen(false);
  };

  const handleAddComponent = () => {
    if (!selectedComponent || componentQuantity <= 0) return;

    if (rawMaterials.find(item => item.product_id === selectedComponent.id)) {
      toast.error("This raw material is already in the list. Update the quantity instead.");
      return;
    }

    setRawMaterials([...rawMaterials, {
      product_id: selectedComponent.id,
      product: selectedComponent,
      quantity: componentQuantity
    }]);
    
    // Reset picker
    setSelectedComponent(null);
    setComponentSearch("");
    setComponentQuantity(1);
    setIsComponentDropdownOpen(false);
  };

  const removeComponent = (productId: string) => {
    setRawMaterials(rawMaterials.filter(item => item.product_id !== productId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOutputProduct || outputQuantity <= 0) {
      toast.error("Please define exactly what Finished Good you are producing.");
      return;
    }
    // We allow 0 raw materials just in case they just want to spawn items or it's a phase 1 operation.

    setIsSubmitting(true);
    
    const batchData: NewManufacturingBatch = {
      output_product_id: selectedOutputProduct.id,
      output_quantity: outputQuantity,
      raw_materials: rawMaterials.map(mat => ({
        product_id: mat.product_id,
        quantity: mat.quantity,
      }))
    };

    const result = await createManufacturingBatch(batchData);
    setIsSubmitting(false);

    if (result.success) {
      toast.success("Assembly pipeline mapped!");
      router.push("/manufacturing");
    } else {
      toast.error(result.message || "Failed to initialize manufacturing run.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/manufacturing" className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">New Assembly Run</h1>
            <p className="text-sm text-slate-500">Map components to generate finished inventory.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/manufacturing" className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || !selectedOutputProduct}
            className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-xl shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-all focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:ring-offset-2"
          >
            {isSubmitting ? "Orchestrating..." : "Start Pipeline"}
            <Combine className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Output Definition */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl shadow-xl p-6 text-white sticky top-6">
            <div className="flex items-center gap-3 mb-6 mix-blend-plus-lighter opacity-70">
              <Factory className="h-6 w-6" />
              <h2 className="text-lg font-bold uppercase tracking-wider">Output Target</h2>
            </div>
            
            <div className="space-y-5">
              <div className="relative">
                <label className="block text-sm font-medium text-indigo-100 mb-1.5">What are we building?</label>
                <div className="relative">
                  <input
                    type="text"
                    value={outputProductSearch}
                    onChange={(e) => {
                      setOutputProductSearch(e.target.value);
                      setIsOutputDropdownOpen(true);
                      if (selectedOutputProduct && e.target.value !== selectedOutputProduct.name) {
                        setSelectedOutputProduct(null);
                      }
                    }}
                    onFocus={() => setIsOutputDropdownOpen(true)}
                    placeholder="Search catalogue..."
                    className="block w-full rounded-xl border-0 py-3 px-4 text-slate-900 shadow-sm ring-2 ring-transparent focus:ring-indigo-400 sm:text-sm bg-white/90 backdrop-blur"
                  />
                  
                  {isOutputDropdownOpen && !selectedOutputProduct && (
                      <ul className="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 shadow-2xl ring-1 ring-black/5 focus:outline-none text-sm">
                        {filteredOutputProducts.length > 0 ? (
                          filteredOutputProducts.map((p) => (
                            <li key={p.id} onClick={() => selectOutputProduct(p)} className="cursor-pointer py-2.5 px-4 hover:bg-indigo-50 text-slate-900 border-b border-slate-50 last:border-0 transition-colors">
                                <span className="block font-bold">{p.name}</span>
                                <span className="block text-xs text-slate-500">{p.sku} | Stock: {p.current_quantity}</span>
                            </li>
                          ))
                        ) : (
                          <li className="py-2.5 px-4 text-slate-500">No output product found.</li>
                        )}
                      </ul>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-indigo-100 mb-1.5">Forecasted Finished Units</label>
                <input
                  type="number"
                  min="1"
                  value={outputQuantity}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setOutputQuantity(Number(e.target.value))}
                  className="block w-full rounded-xl border-0 py-3 px-4 text-slate-900 shadow-sm bg-white/90 backdrop-blur font-bold text-lg"
                />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 opacity-70 text-xs leading-relaxed">
              Upon reaching 'Complete' status, this quantity will be instantly injected into your primary stock levels.
            </div>
          </div>
        </div>


        {/* Components / Bill of Materials Definition */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900">Bill of Materials (Consumed)</h2>
            </div>
            
            <div className="p-6">
              
              {/* Component Picker Row */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl mb-8 flex flex-col sm:flex-row items-end gap-4 shadow-inner">
                  <div className="flex-1 relative w-full">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Target Material</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={componentSearch}
                        onChange={(e) => {
                          setComponentSearch(e.target.value);
                          setIsComponentDropdownOpen(true);
                          if (selectedComponent && e.target.value !== selectedComponent.name) {
                            setSelectedComponent(null);
                          }
                        }}
                        onFocus={() => setIsComponentDropdownOpen(true)}
                        placeholder="Search products/raw..."
                        className="block w-full rounded-lg border-0 py-2.5 pl-10 pr-4 text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-indigo-600 sm:text-sm bg-white"
                      />
                    </div>
                    
                    {isComponentDropdownOpen && !selectedComponent && (
                      <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg bg-white shadow-xl ring-1 ring-black/5 focus:outline-none text-sm">
                        {filteredComponents.length > 0 ? (
                          filteredComponents.map((p) => (
                            <li key={p.id} onClick={() => selectComponent(p)} className="cursor-pointer py-2 px-3 hover:bg-slate-50 text-slate-900 flex justify-between items-center group">
                              <span className="font-semibold text-slate-800">{p.name}</span>
                              <span className="text-xs text-slate-400 group-hover:text-indigo-600 font-mono">Stock: {p.current_quantity}</span>
                            </li>
                          ))
                        ) : (
                          <li className="py-2 px-3 text-slate-500">No raw materials matched.</li>
                        )}
                      </ul>
                    )}
                  </div>

                  <div className="w-full sm:w-28">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Usage</label>
                    <input
                      type="number"
                      min="1"
                      value={componentQuantity}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setComponentQuantity(Number(e.target.value))}
                      className="block w-full rounded-lg border-0 py-2.5 px-4 text-center font-bold text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-indigo-600 sm:text-sm"
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleAddComponent}
                    disabled={!selectedComponent || componentQuantity <= 0}
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-colors"
                  >
                    Bind Material
                  </button>
              </div>

              {/* Bound Materials List */}
              <div className="space-y-3">
                {rawMaterials.map((mat) => (
                  <div key={mat.product_id} className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl border border-slate-100 bg-white shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] gap-4 hover:border-red-100 transition-colors group">
                    <div className="flex w-full items-center gap-3">
                      <div className="h-10 w-10 bg-slate-100 rounded-md flex items-center justify-center text-slate-400 font-mono text-xs border border-slate-200">
                        {mat.product.sku?.substring(0,3) || 'RAW'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">{mat.product.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Physical Burn: <span className="font-bold text-slate-700">{mat.quantity} units</span></p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeComponent(mat.product_id)}
                      className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}

                {rawMaterials.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
                    <Combine className="mx-auto h-10 w-10 text-slate-200 mb-3" />
                    <p className="text-sm font-semibold text-slate-400">No raw materials mapped.</p>
                    <p className="text-xs text-slate-400 mt-1">If this is a sub-assembly, bind components above.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

      </div>
    </form>
  );
}
