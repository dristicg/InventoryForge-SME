"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, Check, Search, Package } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { createPurchaseOrder } from "../../actions/purchases";
import { Product } from "../../../types/product";
import { NewPurchaseOrder, PurchaseOrderItem } from "../../../types/purchase";

interface NewPurchaseClientProps {
  availableProducts: Product[];
}

export default function NewPurchaseClient({ availableProducts }: NewPurchaseClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Base form state
  const [supplierName, setSupplierName] = useState("");
  const [lineItems, setLineItems] = useState<PurchaseOrderItem[]>([]);

  // Intermediate state for adding a new item
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Auto-filtering the searchable dropdown
  const filteredProducts = useMemo(() => {
    return availableProducts.filter((p) => 
      p.name.toLowerCase().includes(productSearch.toLowerCase()) || 
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [availableProducts, productSearch]);

  const selectProduct = (p: Product) => {
    setSelectedProduct(p);
    setProductSearch(p.name);
    setIsDropdownOpen(false);
  };

  const handleAddLineItem = () => {
    if (!selectedProduct || quantity <= 0) return;

    if (lineItems.find(item => item.product_id === selectedProduct.id)) {
      toast.error("This product is already in the order. Update the quantity instead.");
      return;
    }

    // Default to cost_price if it exists, otherwise use a fraction of selling price or 0 for demo purposes
    const itemCostPrice = selectedProduct.cost_price ?? (selectedProduct.selling_price * 0.5);

    const newItem: PurchaseOrderItem = {
      product_id: selectedProduct.id,
      quantity: quantity,
      rate: itemCostPrice,
      total_price: itemCostPrice * quantity,
      product: selectedProduct 
    };

    setLineItems([...lineItems, newItem]);
    
    // Reset picker
    setSelectedProduct(null);
    setProductSearch("");
    setQuantity(1);
    setIsDropdownOpen(false);
  };

  const removeLineItem = (productId: string) => {
    setLineItems(lineItems.filter(item => item.product_id !== productId));
  };

  const updateItemQty = (productId: string, newQty: number) => {
    if (newQty <= 0) return;
    setLineItems(lineItems.map(item => 
      item.product_id === productId 
        ? { ...item, quantity: newQty, total_price: newQty * item.rate }
        : item
    ));
  };

  const grandTotal = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + item.total_price, 0);
  }, [lineItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName || lineItems.length === 0) {
      toast.error("Please provide supplier details and add at least one line item.");
      return;
    }

    setIsSubmitting(true);
    
    const orderData: NewPurchaseOrder = {
      supplier_name: supplierName,
      total_amount: grandTotal,
      purchase_order_items: lineItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        rate: item.rate,
        total_price: item.total_price
      }))
    };

    const result = await createPurchaseOrder(orderData);
    setIsSubmitting(false);

    if (result.success) {
      toast.success("Purchase order created successfully!");
      router.push("/purchases");
    } else {
      toast.error(result.message || "Failed to submit purchase order.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/purchases" className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">New Purchase Order</h1>
            <p className="text-sm text-slate-500">Draft an inbound order to restock your warehouse.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/purchases" className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || lineItems.length === 0}
            className="inline-flex items-center px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none focus:ring-offset-2"
          >
            {isSubmitting ? "Generating PO..." : "Save Draft"}
            <Check className="ml-2 h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Supplier Details</h2>
            <div>
              <label className="block text-sm font-medium leading-6 text-slate-900">Supplier / Vendor Name</label>
              <div className="mt-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. Global Tech Distributors"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="block w-full rounded-xl border-0 py-2.5 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-semibold text-slate-900">Inbound Items</h2>
            </div>
            
            <div className="p-6">
              <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 mb-6">
                <h3 className="text-sm font-semibold text-purple-900 mb-3">Add Restock Target</h3>
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  
                  <div className="flex-1 relative w-full">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Search via SKU or Name</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        type="text"
                        value={productSearch}
                        onChange={(e) => {
                          setProductSearch(e.target.value);
                          setIsDropdownOpen(true);
                          if (selectedProduct && e.target.value !== selectedProduct.name) {
                            setSelectedProduct(null);
                          }
                        }}
                        onFocus={() => setIsDropdownOpen(true)}
                        placeholder="Search known products..."
                        className="block w-full rounded-lg border-0 py-2 pl-10 pr-4 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-purple-600 sm:text-sm"
                      />
                    </div>
                    
                    {isDropdownOpen && !selectedProduct && (
                      <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none text-sm">
                        {filteredProducts.length > 0 ? (
                          filteredProducts.map((p) => (
                            <li
                              key={p.id}
                              onClick={() => selectProduct(p)}
                              className="relative cursor-pointer select-none py-2 pl-3 pr-9 text-slate-900 hover:bg-purple-600 hover:text-white group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="block truncate font-medium">{p.name} <span className="text-xs opacity-70 ml-2">Stock: {p.current_quantity}</span></span>
                                <span className="block truncate text-slate-500 group-hover:text-purple-100">${(p.cost_price ?? (p.selling_price * 0.5)).toFixed(2)} cost</span>
                              </div>
                            </li>
                          ))
                        ) : (
                          <li className="relative cursor-default select-none py-2 px-3 text-slate-500">
                            No products found.
                          </li>
                        )}
                      </ul>
                    )}
                  </div>

                  <div className="w-full sm:w-24">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Incoming Qty</label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="block w-full rounded-lg border-0 py-2 px-4 text-slate-900 ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-purple-600 sm:text-sm"
                    />
                  </div>

                  <div className="w-full sm:w-32">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Cost Rate ($)</label>
                    <input
                      type="number"
                      disabled
                      value={selectedProduct ? (selectedProduct.cost_price ?? (selectedProduct.selling_price * 0.5)).toFixed(2) : ""}
                      className="block w-full rounded-lg border-0 py-2 px-4 text-slate-500 bg-slate-100 ring-1 ring-inset ring-slate-200 sm:text-sm cursor-not-allowed"
                    />
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    disabled={!selectedProduct || quantity <= 0}
                    className="w-full sm:w-auto inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-50 transition-colors"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Add
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {lineItems.map((item) => (
                  <div key={item.product_id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-slate-200 bg-white shadow-sm gap-4 relative group hover:border-purple-200 transition-colors">
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="h-10 w-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 flex-shrink-0">
                        <Package className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{item.product?.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <input 
                            type="number" 
                            className="text-xs w-16 p-1 px-2 border rounded" 
                            value={item.quantity}
                            onFocus={(e) => e.target.select()}
                            onChange={e => updateItemQty(item.product_id, Number(e.target.value))}
                          />
                          <p className="text-xs text-slate-500">units @ ${item.rate.toFixed(2)} cost</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                      <p className="text-sm font-semibold text-slate-900">${item.total_price.toFixed(2)}</p>
                      <button
                        type="button"
                        onClick={() => removeLineItem(item.product_id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {lineItems.length === 0 && (
                  <div className="text-center py-8">
                    <Package className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="text-sm text-slate-500">PO is empty. Add elements to draft the inbound freight.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-white mb-6">PO Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Total Items Inbound</span>
                <span className="text-white font-medium">{lineItems.reduce((acc, item) => acc + item.quantity, 0)} units</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Unique SKUs</span>
                <span className="text-white font-medium">{lineItems.length}</span>
              </div>
              <div className="border-t border-slate-700 pt-4 mt-6">
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-slate-200">Total Capital Outlay</span>
                  <span className="text-2xl font-bold text-white">${grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || lineItems.length === 0}
              className="mt-8 w-full inline-flex justify-center items-center rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-blue-500 hover:shadow-md transition-all focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
            >
              {isSubmitting ? "Executing..." : "Confirm & Save Draft"}
            </button>
            <p className="text-xs text-slate-500 text-center mt-4">New Purchase Orders trigger the "Draft" pipeline.</p>
          </div>
        </div>
      </div>
    </form>
  );
}
