"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, QrCode as QrIcon, X, Check, ArrowDownToLine } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Product, NewProduct } from "../../../types/product";
import { supabase } from "../../../lib/supabase/client";

// Mock Initial Data
const initialProducts: Product[] = [
  {
    id: "PRD-001",
    name: "Industrial Power Supply",
    sku: "PWR-IND-100",
    category: "Electronics",
    price: 299.99,
    stock: 45,
    qrCodeData: "PRD-001|PWR-IND-100",
    status: "In Stock",
    lastUpdated: new Date().toISOString(),
  },
  {
    id: "PRD-002",
    name: "Machined Steel Gears",
    sku: "MCH-STL-050",
    category: "Hardware",
    price: 45.5,
    stock: 8,
    qrCodeData: "PRD-002|MCH-STL-050",
    status: "Low Stock",
    lastUpdated: new Date().toISOString(),
  },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedQR, setSelectedQR] = useState<Product | null>(null);

  // Form State
  const [formData, setFormData] = useState<NewProduct>({
    name: "",
    sku: "",
    category: "",
    price: 0,
    stock: 0,
  });

  // Realtime subscription to products table
  useEffect(() => {
    // We only subscribe if environment variables are somewhat valid to prevent console spam
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL.includes("mock")) {
      console.log("Mock supabase config detected. Please inject real env vars for live updates.");
    }
    
    const channel = supabase
      .channel('products-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'products',
        },
        (payload) => {
          console.log("Realtime change received:", payload);
          if (payload.eventType === 'INSERT') {
            const newProduct = payload.new as Product;
            setProducts((prev) => [newProduct, ...prev]);
            toast.info(`New product added: ${newProduct.name}`);
          } else if (payload.eventType === 'UPDATE') {
            const updatedProduct = payload.new as Product;
            setProducts((prev) => prev.map((p) => p.id === updatedProduct.id ? updatedProduct : p));
            toast.info(`Stock/Info updated live for ${updatedProduct.name}`);
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id;
            setProducts((prev) => prev.filter((p) => p.id !== deletedId));
            toast.warning(`A product was removed live.`);
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Successfully subscribed to Supabase realtime products changes.");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" || name === "stock" ? Number(value) : value,
    }));
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `PRD-${String(products.length + 1).padStart(3, "0")}`;
    const newPrd: Product = {
      ...formData,
      id: newId,
      qrCodeData: `${newId}|${formData.sku}`,
      status: formData.stock > 10 ? "In Stock" : formData.stock > 0 ? "Low Stock" : "Out of Stock",
      lastUpdated: new Date().toISOString(),
    };
    setProducts([newPrd, ...products]);
    setIsAddModalOpen(false);
    setFormData({ name: "", sku: "", category: "", price: 0, stock: 0 });
  };

  const handleUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const stockStatus =
      formData.stock > 10 ? "In Stock" : formData.stock > 0 ? "Low Stock" : "Out of Stock";

    setProducts(
      products.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              ...formData,
              status: stockStatus,
              qrCodeData: `${p.id}|${formData.sku}`,
              lastUpdated: new Date().toISOString(),
            }
          : p
      )
    );
    setIsEditModalOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      category: p.category,
      price: p.price,
      stock: p.stock,
    });
    setIsEditModalOpen(true);
  };

  const downloadQR = (product: Product) => {
    const svg = document.getElementById(`qr-${product.id}`);
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `QR_${product.sku}.png`;
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
      };
      img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  return (
    <div className="min-h-screen bg-zinc-950 p-6 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Products</h1>
            <p className="text-sm text-zinc-400 mt-1">Manage your inventory products and generated QR codes.</p>
          </div>
          <button
            onClick={() => {
              setFormData({ name: "", sku: "", category: "", price: 0, stock: 0 });
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between rounded-xl bg-zinc-900 p-4 shadow-sm border border-white/5">
          <div className="relative w-full sm:max-w-md">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-zinc-500" />
            </div>
            <input
              type="text"
              placeholder="Search by name, SKU, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-lg border-0 py-2 pl-10 pr-4 text-white ring-1 ring-inset ring-white/10 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 bg-zinc-800/50 transition-all hover:bg-zinc-800"
            />
          </div>
          <div className="text-sm text-zinc-400">
            Showing <span className="font-semibold text-white">{filteredProducts.length}</span> items
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-hidden rounded-xl border border-white/5 bg-zinc-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/5">
              <thead className="bg-zinc-800/50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Product Info</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">SKU</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Price / Stock</th>
                  <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-zinc-400 uppercase tracking-wider">QR Code</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                  <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-zinc-900">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-800/50 transition-colors group">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="font-medium text-white">{p.name}</div>
                        <div className="text-sm text-zinc-400">{p.category}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="inline-flex items-center rounded-md bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-300 ring-1 ring-inset ring-white/5 font-mono">
                          {p.sku}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm font-medium text-white">${p.price.toFixed(2)}</div>
                        <div className="text-sm text-zinc-400">{p.stock} units left</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center">
                        <button
                          onClick={() => setSelectedQR(p)}
                          className="inline-flex items-center rounded-lg p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                          title="View QR Code"
                        >
                          <QrIcon className="h-5 w-5" />
                        </button>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                          p.status === "In Stock" ? "bg-green-50 text-green-700 ring-green-600/20" :
                          p.status === "Low Stock" ? "bg-yellow-50 text-yellow-800 ring-yellow-600/20" :
                          "bg-red-50 text-red-700 ring-red-600/20"
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(p)}
                            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                      No products found. Start by adding a new product.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Product Form Modal (Add / Edit) */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => {
              setIsAddModalOpen(false);
              setIsEditModalOpen(false);
            }}
          />
          {/* Dialog Container */}
          <div className="relative z-50 w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                {isEditModalOpen ? "Edit Product" : "Add New Product"}
              </h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={isEditModalOpen ? handleUpdateProduct : handleCreateProduct} className="px-6 py-4">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="name" className="block text-sm font-medium leading-6 text-slate-900">Product Name</label>
                  <div className="mt-2">
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-0 py-2 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                      placeholder="e.g. Copper Wire Spool"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="sku" className="block text-sm font-medium leading-6 text-slate-900">SKU</label>
                  <div className="mt-2">
                    <input
                      type="text"
                      name="sku"
                      id="sku"
                      required
                      value={formData.sku}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-0 py-2 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 uppercase"
                      placeholder="SKU-123"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium leading-6 text-slate-900">Category</label>
                  <div className="mt-2">
                    <select
                      name="category"
                      id="category"
                      required
                      value={formData.category}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-0 py-2 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    >
                      <option value="">Select Category</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Hardware">Hardware</option>
                      <option value="Raw Materials">Raw Materials</option>
                      <option value="Apparel">Apparel</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="price" className="block text-sm font-medium leading-6 text-slate-900">Price ($)</label>
                  <div className="mt-2 relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <span className="text-slate-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      name="price"
                      id="price"
                      min="0"
                      step="0.01"
                      required
                      value={formData.price}
                      onFocus={(e) => e.target.select()}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-0 py-2 pl-7 pr-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="stock" className="block text-sm font-medium leading-6 text-slate-900">Stock Quantity</label>
                  <div className="mt-2">
                    <input
                      type="number"
                      name="stock"
                      id="stock"
                      min="0"
                      required
                      value={formData.stock}
                      onFocus={(e) => e.target.select()}
                      onChange={handleInputChange}
                      className="block w-full rounded-lg border-0 py-2 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-end gap-x-4 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="text-sm font-semibold leading-6 text-slate-900 px-4 py-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  <Check className="mr-2 h-4 w-4" />
                  {isEditModalOpen ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal Display */}
      {selectedQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedQR(null)} />
          <div className="relative z-50 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl scale-100 transform transition-all text-center">
            <button
              onClick={() => setSelectedQR(null)}
              className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-900 mt-2">{selectedQR.name}</h3>
            <p className="text-sm text-slate-500 font-mono mt-1 mb-6">{selectedQR.sku}</p>
            
            <div className="flex justify-center bg-white p-4 rounded-xl border-2 border-dashed border-slate-200 w-fit mx-auto">
              <QRCodeSVG
                id={`qr-${selectedQR.id}`}
                value={selectedQR.qrCodeData}
                size={200}
                level="H"
                includeMargin={true}
                className="rounded-lg shadow-sm"
              />
            </div>
            
            <button
              onClick={() => downloadQR(selectedQR)}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 transition-all"
            >
              <ArrowDownToLine className="h-4 w-4" />
              Download High-Res QR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
