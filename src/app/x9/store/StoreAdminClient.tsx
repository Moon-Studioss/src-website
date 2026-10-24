"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import {
  addProduct, updateProduct, deleteProduct,
  toggleProductStock, addCategory, deleteCategory,
} from "./actions";
import { Package, Tag, Plus, Pencil, Trash2, CheckCircle2, XCircle, Star, StarOff, X, ChevronDown, Check } from "lucide-react";
import type { Product, ProductCategory } from "@/lib/db/schema";

type Props = {
  initialProducts: Product[];
  initialCategories: ProductCategory[];
};

const emptyForm = {
  name: "", description: "", price: "", category: "", images: "", inStock: true, featured: false,
};

function CustomSelect({ value, onChange, options, placeholder = "Select...", className = "min-w-[140px]" }: { 
  value: string, 
  onChange: (val: string) => void, 
  options: {value: string, label: string}[],
  placeholder?: string,
  className?: string
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedOption = options.find(o => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between gap-2 text-sm border px-3 py-1.5 rounded outline-none bg-white shadow-sm transition-colors hover:bg-gray-50 focus:border-[var(--ink)] ${className}`}
        style={{ borderColor: "var(--rule)", color: "var(--ink)" }}
        type="button"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown size={14} className={`text-[var(--mute)] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-full min-w-[160px] max-h-60 overflow-y-auto bg-white border rounded-lg shadow-xl z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150" style={{ borderColor: "var(--rule)" }}>
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              type="button"
              className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${value === opt.value ? 'bg-gray-50 font-semibold text-[var(--ink)]' : 'text-[var(--mute)] hover:bg-gray-50 hover:text-[var(--ink)]'}`}
            >
              <span className="truncate">{opt.label}</span>
              {value === opt.value && <Check size={14} className="text-[var(--ink)] shrink-0 ml-2" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function StoreAdminClient({ initialProducts, initialCategories }: Props) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<ProductCategory[]>(initialCategories);
  const [tab, setTab] = useState<"products" | "categories">("products");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [newCat, setNewCat] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState("all");
  const [filterStock, setFilterStock] = useState("all");
  const [isPending, startTransition] = useTransition();
  const [catError, setCatError] = useState("");

  // ─── Stats ──────────────────────────────────────────────────────
  const total = products.length;
  const inStockCount = products.filter(p => p.inStock).length;
  const outCount = total - inStockCount;
  const featuredCount = products.filter(p => p.featured).length;

  const predefinedCats = ["Microcontrollers", "Sensors", "Displays", "Modules", "Kits", "Cables & Connectors"];
  const allAvailableCats = [...new Set([...predefinedCats, ...categories.map(c => c.name)])];

  // ─── Filtered list ───────────────────────────────────────────────
  const filtered = products.filter(p => {
    if (filterCat !== "all" && p.category !== filterCat) return false;
    if (filterStock === "in" && !p.inStock) return false;
    if (filterStock === "out" && p.inStock) return false;
    return true;
  });

  // ─── Form helpers ─────────────────────────────────────────────────
  const openAdd = () => { setEditingProduct(null); setForm(emptyForm); setShowForm(true); };
  const openEdit = (p: Product) => {
    setEditingProduct(p);
    setForm({
      name: p.name,
      description: p.description ?? "",
      price: (p.price / 100).toString(),
      category: p.category ?? "",
      images: (p.images as string[] ?? []).join("\n"),
      inStock: p.inStock,
      featured: p.featured,
    });
    setShowForm(true);
  };
  const closeForm = () => { setShowForm(false); setEditingProduct(null); };

  const handleSave = () => {
    const priceNum = parseFloat(form.price);
    if (!form.name.trim() || isNaN(priceNum) || priceNum <= 0) return;
    const imageArr = form.images.split("\n").map(s => s.trim()).filter(Boolean);
    const data = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: priceNum,
      category: form.category.trim(),
      images: imageArr,
      inStock: form.inStock,
      featured: form.featured,
    };
    startTransition(async () => {
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
        setProducts(prev => prev.map(p => p.id === editingProduct.id
          ? { ...p, ...data, price: Math.round(priceNum * 100), images: imageArr, updatedAt: new Date() }
          : p));
      } else {
        await addProduct(data);
        // Re-fetch by reloading state — server will revalidate
        window.location.reload();
      }
      closeForm();
    });
  };

  const handleToggleStock = (id: string, current: boolean) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, inStock: !current } : p));
    startTransition(async () => { await toggleProductStock(id, !current); });
  };

  const confirmDelete = (id: string) => setDeletingId(id);
  const handleDelete = () => {
    if (!deletingId) return;
    const id = deletingId;
    setDeletingId(null);
    setProducts(prev => prev.filter(p => p.id !== id));
    startTransition(async () => { await deleteProduct(id); });
  };

  const handleAddCat = async () => {
    setCatError("");
    const res = await addCategory(newCat);
    if (res.error) { setCatError(res.error); return; }
    setCategories(prev => [...prev, { id: Date.now().toString(), name: newCat.trim(), createdAt: new Date() }]);
    setNewCat("");
  };

  const handleDeleteCat = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    startTransition(async () => { await deleteCategory(id); });
  };

  const formatPrice = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ink)] tracking-tight">Store</h1>
          <p className="text-sm text-[var(--mute)] mt-0.5">Manage products and categories</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--ink)] text-white text-sm font-semibold rounded hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Products", value: total, icon: <Package size={18} /> },
          { label: "In Stock", value: inStockCount, icon: <CheckCircle2 size={18} className="text-green-600" /> },
          { label: "Out of Stock", value: outCount, icon: <XCircle size={18} className="text-red-500" /> },
          { label: "Featured", value: featuredCount, icon: <Star size={18} className="text-yellow-500" /> },
        ].map(s => (
          <div key={s.label} className="bg-white border rounded p-4 flex items-center gap-3" style={{ borderColor: "var(--rule)" }}>
            <div className="text-[var(--mute)]">{s.icon}</div>
            <div>
              <div className="text-xl font-bold text-[var(--ink)]">{s.value}</div>
              <div className="text-xs text-[var(--mute)]">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b text-sm font-semibold" style={{ borderColor: "var(--rule)" }}>
        {(["products", "categories"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 capitalize transition-colors ${tab === t ? "text-[var(--ink)] border-b-2 border-[var(--ink)]" : "text-[var(--mute)]"}`}
          >
            {t === "products" ? `Products (${total})` : `Categories (${categories.length})`}
          </button>
        ))}
      </div>

      {/* Products Tab */}
      {tab === "products" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <CustomSelect
              value={filterCat}
              onChange={setFilterCat}
              options={[
                { value: "all", label: "All Categories" },
                ...allAvailableCats.map(name => ({ value: name, label: name })),
                { value: "", label: "Uncategorized" }
              ]}
            />
            <CustomSelect
              value={filterStock}
              onChange={setFilterStock}
              options={[
                { value: "all", label: "All Stock" },
                { value: "in", label: "In Stock" },
                { value: "out", label: "Out of Stock" }
              ]}
            />
            <span className="text-xs text-[var(--mute)]">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</span>
          </div>

          {/* Product Table */}
          <div className="bg-white border rounded overflow-hidden" style={{ borderColor: "var(--rule)" }}>
            {filtered.length === 0 ? (
              <div className="p-10 text-center text-[var(--mute)] text-sm">
                <Package size={32} className="mx-auto mb-3 opacity-30" />
                No products yet. Click "Add Product" to get started.
              </div>
            ) : (
              <table className="w-full text-sm block sm:table">
                <thead className="bg-gray-50 border-b text-[var(--mute)] hidden sm:table-header-group" style={{ borderColor: "var(--rule)" }}>
                  <tr className="block sm:table-row">
                    <th className="text-left px-4 py-3 font-semibold block sm:table-cell">Product</th>
                    <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Category</th>
                    <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Price</th>
                    <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Stock</th>
                    <th className="text-right px-4 py-3 font-semibold hidden sm:table-cell">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y block sm:table-row-group" style={{ borderColor: "var(--rule)" }}>
                  {filtered.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors block sm:table-row border-b sm:border-b-0 last:border-b-0">
                      <td className="px-4 py-4 w-full block sm:table-cell">
                        <div className="flex items-start sm:items-center gap-4">
                          {(p.images as string[])?.[0] ? (
                            <img src={(p.images as string[])[0]} alt={p.name} className="w-16 h-16 sm:w-12 sm:h-12 shrink-0 object-cover rounded-lg border bg-white" style={{ borderColor: "var(--rule)" }} />
                          ) : (
                            <div className="w-16 h-16 sm:w-12 sm:h-12 shrink-0 bg-gray-50 rounded-lg border flex items-center justify-center bg-white" style={{ borderColor: "var(--rule)" }}>
                              <Package size={20} className="text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-[var(--ink)] flex items-center gap-1.5 truncate">
                              {p.name}
                              {p.featured && <Star size={14} className="text-yellow-500 fill-yellow-500 shrink-0" />}
                            </div>
                            <div className="text-xs text-[var(--mute)] mt-0.5">ID: {p.id.slice(0, 8)}</div>

                            {/* Mobile-only Details */}
                            <div className="sm:hidden mt-3 space-y-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-[var(--ink)] text-sm">{formatPrice(p.price)}</span>
                                {p.category && <span className="text-[10px] bg-gray-100 text-[var(--mute)] px-2 py-0.5 rounded uppercase tracking-wider font-semibold">{p.category}</span>}
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleToggleStock(p.id, p.inStock)}
                                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                                    p.inStock
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : "bg-red-50 text-red-600 border-red-200"
                                  }`}
                                >
                                  {p.inStock ? "In Stock" : "Out of Stock"}
                                </button>
                                <button onClick={() => openEdit(p)} className="p-1.5 px-3 text-[var(--mute)] bg-gray-50 border rounded-lg">
                                  <Pencil size={14} />
                                </button>
                                <button onClick={() => confirmDelete(p.id)} className="p-1.5 px-3 text-red-500 bg-red-50 border border-red-100 rounded-lg">
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 hidden sm:table-cell align-middle">
                        {p.category ? (
                          <span className="text-xs bg-gray-100 text-[var(--mute)] px-2.5 py-1 rounded-md whitespace-nowrap">{p.category}</span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 font-semibold text-[var(--ink)] align-middle whitespace-nowrap hidden sm:table-cell">{formatPrice(p.price)}</td>
                      <td className="px-4 py-4 align-middle hidden sm:table-cell">
                        <button
                          onClick={() => handleToggleStock(p.id, p.inStock)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all whitespace-nowrap ${
                            p.inStock
                              ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 shadow-sm"
                              : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100 shadow-sm"
                          }`}
                        >
                          {p.inStock ? "In Stock" : "Out of Stock"}
                        </button>
                      </td>
                      <td className="px-4 py-4 align-middle hidden sm:table-cell">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => openEdit(p)} className="p-2 text-[var(--mute)] hover:text-[var(--ink)] hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200" title="Edit">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => confirmDelete(p.id)} className="p-2 text-[var(--mute)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100" title="Delete">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {tab === "categories" && (
        <div className="space-y-4 max-w-md">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New category name..."
              value={newCat}
              onChange={e => setNewCat(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddCat()}
              className="flex-1 text-sm border px-3 py-2 rounded outline-none focus:border-[var(--ink)] transition-colors"
              style={{ borderColor: "var(--rule)" }}
            />
            <button
              onClick={handleAddCat}
              disabled={!newCat.trim()}
              className="px-4 py-2 text-sm font-semibold bg-[var(--ink)] text-white rounded hover:opacity-90 disabled:opacity-40 transition-all"
            >
              Add
            </button>
          </div>
          {catError && <p className="text-xs text-red-500">{catError}</p>}

          <div className="bg-white border rounded divide-y" style={{ borderColor: "var(--rule)" }}>
            {categories.length === 0 ? (
              <div className="p-6 text-center text-[var(--mute)] text-sm">
                <Tag size={24} className="mx-auto mb-2 opacity-30" />
                No categories yet.
              </div>
            ) : (
              categories.map(c => (
                <div key={c.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Tag size={14} className="text-[var(--mute)]" />
                    <span className="text-sm font-medium text-[var(--ink)]">{c.name}</span>
                    <span className="text-xs text-[var(--mute)]">
                      ({products.filter(p => p.category === c.name).length} products)
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteCat(c.id)}
                    className="p-1.5 text-[var(--mute)] hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10" style={{ borderColor: "var(--rule)" }}>
              <h2 className="text-base font-bold text-[var(--ink)]">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button onClick={closeForm} className="p-1 text-[var(--mute)] hover:text-[var(--ink)]"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-[var(--mute)] mb-1.5 uppercase tracking-wider">Product Name *</label>
                <input
                  type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Arduino Uno R3"
                  className="w-full text-sm border px-3 py-2 rounded-xl outline-none focus:border-[var(--ink)] transition-colors"
                  style={{ borderColor: "var(--rule)" }}
                />
              </div>
              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-[var(--mute)] mb-1.5 uppercase tracking-wider">Description</label>
                <textarea
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of the component..."
                  rows={3}
                  className="w-full text-sm border px-3 py-2 rounded-xl outline-none focus:border-[var(--ink)] transition-colors resize-none"
                  style={{ borderColor: "var(--rule)" }}
                />
              </div>
              {/* Price */}
              <div>
                <label className="block text-xs font-semibold text-[var(--mute)] mb-1.5 uppercase tracking-wider">Price (₹) *</label>
                <input
                  type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="e.g. 499"
                  className="w-full text-sm border px-3 py-2 rounded-xl outline-none focus:border-[var(--ink)] transition-colors"
                  style={{ borderColor: "var(--rule)" }}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[var(--mute)] uppercase tracking-wider">Category</label>
                <CustomSelect
                  value={allAvailableCats.includes(form.category) ? form.category : (form.category === "" ? "" : "custom")}
                  onChange={val => {
                    if (val === "custom") {
                      setForm(f => ({ ...f, category: " " }));
                    } else {
                      setForm(f => ({ ...f, category: val }));
                    }
                  }}
                  className="w-full py-2"
                  placeholder="Select an existing category..."
                  options={[
                    { value: "", label: "Select an existing category..." },
                    ...allAvailableCats.map(name => ({ value: name, label: name })),
                    { value: "custom", label: "➕ Create new category..." }
                  ]}
                />

                {(!allAvailableCats.includes(form.category) && form.category !== "") && (
                  <input
                    type="text"
                    value={form.category.trimStart()} // Remove the hacky space for display
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    placeholder="Type new category name..."
                    autoFocus
                    className="w-full text-sm border px-3 py-2 rounded-xl outline-none focus:border-[var(--ink)] transition-colors animate-in fade-in slide-in-from-top-2"
                    style={{ borderColor: "var(--rule)" }}
                  />
                )}
              </div>
              {/* Image URLs */}
              <div>
                <label className="block text-xs font-semibold text-[var(--mute)] mb-1.5 uppercase tracking-wider">Image URLs (one per line)</label>
                <textarea
                  value={form.images} onChange={e => setForm(f => ({ ...f, images: e.target.value }))}
                  placeholder={"https://example.com/image1.jpg\nhttps://example.com/image2.jpg"}
                  rows={3}
                  className="w-full text-sm border px-3 py-2 rounded-xl outline-none focus:border-[var(--ink)] transition-colors resize-none font-mono text-xs"
                  style={{ borderColor: "var(--rule)" }}
                />
                
                {/* Image Previews */}
                {form.images.trim() && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.images.split("\n").map(s => s.trim()).filter(Boolean).map((img, i) => (
                      <div key={i} className="relative w-12 h-12 rounded border bg-gray-50 overflow-hidden shrink-0 group" style={{ borderColor: "var(--rule)" }}>
                        <img 
                          src={img} 
                          alt={`Preview ${i + 1}`} 
                          className="w-full h-full object-cover transition-opacity" 
                          onError={(e) => {
                            // On error, hide the broken image icon and just show a generic placeholder box
                            (e.target as HTMLImageElement).style.display = 'none';
                            e.currentTarget.parentElement?.classList.add('flex', 'items-center', 'justify-center', 'text-red-400', 'text-[10px]', 'font-bold', 'bg-red-50');
                            if (e.currentTarget.parentElement) {
                              e.currentTarget.parentElement.innerText = 'Err';
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Toggles */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    onClick={() => setForm(f => ({ ...f, inStock: !f.inStock }))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${form.inStock ? "bg-green-500" : "bg-gray-200"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.inStock ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-sm font-medium text-[var(--ink)]">In Stock</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    onClick={() => setForm(f => ({ ...f, featured: !f.featured }))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${form.featured ? "bg-yellow-400" : "bg-gray-200"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.featured ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-sm font-medium text-[var(--ink)]">Featured</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 justify-end p-5 border-t bg-gray-50 rounded-b-2xl" style={{ borderColor: "var(--rule)" }}>
              <button
                onClick={closeForm}
                className="px-4 py-2 text-sm font-semibold border rounded-xl hover:bg-white transition-colors shadow-sm text-[var(--ink)]"
                style={{ borderColor: "var(--rule)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name.trim() || !form.price || isPending}
                className="px-5 py-2 text-sm font-semibold bg-[var(--ink)] text-white rounded-xl hover:opacity-90 disabled:opacity-40 transition-all shadow-sm"
              >
                {isPending ? "Saving..." : editingProduct ? "Save Changes" : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white p-6 max-w-sm w-full rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-[var(--ink)] mb-2">Delete Product?</h3>
            <p className="text-sm text-[var(--mute)] mb-6">This product will be permanently removed from the store.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeletingId(null)} className="px-4 py-2 text-sm font-semibold border rounded-xl hover:bg-gray-50 transition-colors" style={{ borderColor: "var(--rule)", color: "var(--ink)" }}>Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded hover:bg-red-600 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
