"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import {
  addProduct, updateProduct, deleteProduct,
  toggleProductStock,
} from "./actions";
import { Package, Tag, Plus, Trash2, CheckCircle2, XCircle, Star, StarOff, X, ChevronDown, Check, Copy } from "lucide-react";
import type { Product, ProductCategory } from "@/lib/db/schema";
import { parseLines, parseSpecs, specsToText } from "@/lib/store";

type Props = {
  initialProducts: Product[];
  initialCategories: ProductCategory[];
};

const emptyForm = {
  name: "", description: "", price: "", mrp: "", category: "", brand: "", sku: "",
  highlights: "", specs: "", images: "", inStock: true, featured: false,
};

const fieldLabel = "block text-xs font-semibold text-[var(--mute)] mb-1.5 uppercase tracking-wider";
const fieldInput = "w-full text-sm border px-3 py-2 rounded-lg outline-none focus:border-[var(--ink)] transition-colors";

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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState("all");
  const [filterStock, setFilterStock] = useState("all");
  const [isPending, startTransition] = useTransition();

  // ─── Stats ──────────────────────────────────────────────────────
  const total = products.length;
  const inStockCount = products.filter(p => p.inStock).length;
  const outCount = total - inStockCount;
  const featuredCount = products.filter(p => p.featured).length;

  const allAvailableCats = [...new Set([...categories.map(c => c.name), ...products.map(p => p.category).filter((c): c is string => !!c)])].sort();

  // ─── Filtered list ───────────────────────────────────────────────
  const filtered = products.filter(p => {
    if (filterCat !== "all" && p.category !== filterCat) return false;
    if (filterStock === "in" && !p.inStock) return false;
    if (filterStock === "out" && p.inStock) return false;
    return true;
  });

  // ─── Form helpers ─────────────────────────────────────────────────
  const openAdd = () => { setEditingProduct(null); setForm(emptyForm); setShowForm(true); };
  const formFrom = (p: Product) => ({
    name: p.name,
    description: p.description ?? "",
    price: (p.price / 100).toString(),
    mrp: p.mrp ? (p.mrp / 100).toString() : "",
    category: p.category ?? "",
    brand: p.brand ?? "",
    sku: p.sku ?? "",
    highlights: (p.highlights ?? []).join("\n"),
    specs: specsToText(p.specs),
    images: (p.images as string[] ?? []).join("\n"),
    inStock: p.inStock,
    featured: p.featured,
  });
  const openEdit = (p: Product) => { setEditingProduct(p); setForm(formFrom(p)); setShowForm(true); };
  // Start a new product from an existing one (SKU is unique per part, so it is cleared)
  const openDuplicate = (p: Product) => { setEditingProduct(null); setForm({ ...formFrom(p), sku: "" }); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingProduct(null); };

  const imageList = parseLines(form.images);
  const setImageList = (list: string[]) => setForm(f => ({ ...f, images: list.join("\n") }));
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkVal, setLinkVal] = useState("");
  const addLink = () => {
    const u = linkVal.trim();
    if (/^https?:\/\//i.test(u)) setImageList([...imageList, u].slice(0, 8));
    setLinkVal(""); setLinkOpen(false);
  };

  const handleSave = () => {
    const priceNum = parseFloat(form.price);
    if (!form.name.trim() || isNaN(priceNum) || priceNum <= 0) return;
    const mrpNum = parseFloat(form.mrp);
    const data = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: priceNum,
      mrp: isNaN(mrpNum) ? null : mrpNum,
      category: form.category.trim(),
      brand: form.brand,
      sku: form.sku,
      images: imageList,
      highlights: parseLines(form.highlights),
      specs: parseSpecs(form.specs),
      inStock: form.inStock,
      featured: form.featured,
    };
    startTransition(async () => {
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
        setProducts(prev => prev.map(p => p.id === editingProduct.id
          ? { ...p, ...data, price: Math.round(priceNum * 100), mrp: data.mrp && data.mrp > priceNum ? Math.round(data.mrp * 100) : null, brand: data.brand.trim() || null, sku: data.sku.trim() || null, category: data.category || null, description: data.description || null, updatedAt: new Date() }
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
          className="flex items-center gap-2 press px-5 py-2.5 bg-[var(--hi)] text-[var(--ink)] text-sm font-bold rounded-lg shadow-sm hover:shadow-md"
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
        ].map((s, i) => (
          <div key={s.label} className="pop press bg-white border rounded-xl p-4 flex items-center gap-3 hover:border-[var(--hi)]" style={{ borderColor: "var(--rule)", animationDelay: `${i * 50}ms` }}>
            <div className="grid place-items-center w-10 h-10 rounded-full bg-[var(--hi-soft)] text-[var(--ink)]">{s.icon}</div>
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
            className={`pb-2 capitalize transition-colors ${tab === t ? "text-[var(--ink)] border-b-2 border-[var(--hi)]" : "text-[var(--mute)]"}`}
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
          <div className="pop bg-white border rounded-xl overflow-hidden" style={{ borderColor: "var(--rule)" }}>
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
                    <tr key={p.id} onClick={(e) => { if (!(e.target as HTMLElement).closest("button")) openEdit(p); }} className="cursor-pointer hover:bg-[var(--hi-soft)]/40 transition-colors block sm:table-row border-b sm:border-b-0 last:border-b-0">
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
                            <div className="text-xs text-[var(--mute)] mt-0.5">{p.sku ? `SKU: ${p.sku}` : `ID: ${p.id.slice(0, 8)}`}{p.brand ? ` · ${p.brand}` : ""}</div>

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
                                <button onClick={() => openDuplicate(p)} aria-label="Duplicate" className="p-1.5 px-3 text-[var(--mute)] bg-gray-50 border rounded-lg">
                                  <Copy size={14} />
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
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all whitespace-nowrap ${
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
                          <button onClick={() => openDuplicate(p)} className="press p-2 text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--hi-soft)] rounded-lg border border-transparent" title="Duplicate (new product from this one)">
                            <Copy size={15} />
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
        <div className="space-y-4 max-w-xl">
          <div className="pop bg-white border rounded-xl divide-y" style={{ borderColor: "var(--rule)" }}>
            {categories.length === 0 ? (
              <div className="p-6 text-center text-[var(--mute)] text-sm">
                <Tag size={24} className="mx-auto mb-2 opacity-30" />
                No categories yet.
              </div>
            ) : (
              categories.map(c => (
                <div key={c.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-center gap-3 min-w-0">
                    {c.image ? (
                      <img src={c.image} alt="" className="w-10 h-10 shrink-0 rounded-lg object-cover border" style={{ borderColor: "var(--rule)" }} />
                    ) : (
                      <div className="w-10 h-10 shrink-0 rounded-lg bg-gray-50 border grid place-items-center" style={{ borderColor: "var(--rule)" }}>
                        <Tag size={14} className="text-[var(--mute)]" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--ink)] truncate">{c.name}</p>
                      <p className="text-xs text-[var(--mute)]">{products.filter(p => p.category === c.name).length} products</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pop">
            <div className="flex items-center justify-between px-6 py-4 border-b-4 border-[var(--hi)] sticky top-0 bg-white z-10 rounded-t-2xl" style={{ borderColor: "var(--rule)" }}>
              <h2 className="text-lg font-bold text-[var(--ink)]">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <button onClick={closeForm} className="press p-2 rounded-lg text-[var(--mute)] hover:text-[var(--ink)] hover:bg-[var(--hi-soft)]"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-[var(--mute)] mb-1.5 uppercase tracking-wider">Product Name *</label>
                <input
                  type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Arduino Uno R3"
                  className="w-full text-sm border px-4 py-2.5 rounded-lg outline-none focus:border-[var(--ink)] focus:ring-4 focus:ring-[var(--hi-soft)] transition-all"
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
                  className="w-full text-sm border px-4 py-2.5 rounded-lg outline-none focus:border-[var(--ink)] focus:ring-4 focus:ring-[var(--hi-soft)] transition-all resize-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  style={{ borderColor: "var(--rule)" }}
                />
              </div>
              {/* Brand + SKU */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={fieldLabel}>Brand</label>
                  <input type="text" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                    placeholder="e.g. Arduino" className={fieldInput} style={{ borderColor: "var(--rule)" }} />
                </div>
                <div>
                  <label className={fieldLabel}>SKU</label>
                  <input type="text" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                    placeholder="e.g. ARD-UNO-R3" className={fieldInput} style={{ borderColor: "var(--rule)" }} />
                </div>
              </div>
              {/* Price + MRP */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={fieldLabel}>Price (₹) *</label>
                  <input
                    type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="e.g. 499" className={fieldInput} style={{ borderColor: "var(--rule)" }}
                  />
                </div>
                <div>
                  <label className={fieldLabel}>MRP (₹)</label>
                  <input
                    type="number" min="0" step="0.01" value={form.mrp} onChange={e => setForm(f => ({ ...f, mrp: e.target.value }))}
                    placeholder="optional" className={fieldInput} style={{ borderColor: "var(--rule)" }}
                  />
                </div>
                <p className="col-span-2 -mt-1 text-xs text-[var(--mute)]">Fill MRP only if it is a real, higher price. The store then shows it crossed out with the % off.</p>
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
                    className="w-full text-sm border px-4 py-2.5 rounded-lg outline-none focus:border-[var(--ink)] focus:ring-4 focus:ring-[var(--hi-soft)] transition-all animate-in fade-in slide-in-from-top-2"
                    style={{ borderColor: "var(--rule)" }}
                  />
                )}
              </div>
              {/* Highlights + specifications (shown in the product popup) */}
              <div>
                <label className={fieldLabel}>Key points (one per line)</label>
                <textarea value={form.highlights} onChange={e => setForm(f => ({ ...f, highlights: e.target.value }))}
                  placeholder={"Works with 3.3V and 5V\nBuilt-in USB-to-serial chip"} rows={3}
                  className={`${fieldInput} resize-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`} style={{ borderColor: "var(--rule)" }} />
              </div>
              <div>
                <label className={fieldLabel}>Specifications (Label: Value, one per line)</label>
                <textarea value={form.specs} onChange={e => setForm(f => ({ ...f, specs: e.target.value }))}
                  placeholder={"Operating voltage: 5V\nDigital pins: 14"} rows={4}
                  className={`${fieldInput} resize-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`} style={{ borderColor: "var(--rule)" }} />
              </div>

              {/* Photos: the first one is the main photo */}
              <div>
                <label className={fieldLabel}>Photos</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {imageList.map((img, i) => (
                    <div key={img + i} className="relative w-16 h-16 rounded-lg border bg-gray-50 overflow-hidden shrink-0" style={{ borderColor: i === 0 ? "var(--ink)" : "var(--rule)" }}>
                      <img src={img} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.opacity = "0.2"; }} />
                      <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => setImageList(imageList.filter((_, j) => j !== i))}
                        className="absolute top-0.5 right-0.5 grid place-items-center w-5 h-5 rounded-full bg-black/60 text-white"><X size={12} /></button>
                      {i === 0 ? (
                        <span className="absolute bottom-0 inset-x-0 text-center text-[10px] font-bold bg-[var(--ink)] text-white">Main</span>
                      ) : (
                        <button type="button" onClick={() => setImageList([img, ...imageList.filter((_, j) => j !== i)])}
                          className="absolute bottom-0 inset-x-0 text-center text-[10px] font-semibold bg-white/85 text-[var(--ink)]">Make main</button>
                      )}
                    </div>
                  ))}
                  {imageList.length < 8 && (
                    <button type="button" aria-label="Add photo by link" onClick={() => setLinkOpen(o => !o)}
                      className="press grid place-items-center w-16 h-16 rounded-lg border-2 border-dashed border-[var(--rule)] text-[var(--mute)] hover:border-[var(--hi)] hover:bg-[var(--hi-soft)] hover:text-[var(--ink)]"><Plus size={20} /></button>
                  )}
                </div>
                {linkOpen && (
                  <div className="pop mt-3 flex gap-2">
                    <input autoFocus type="url" value={linkVal} onChange={e => setLinkVal(e.target.value)} placeholder="Paste image link and press Enter"
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }}
                      className="flex-1 text-sm border px-4 py-2 rounded-lg outline-none focus:border-[var(--ink)] focus:ring-4 focus:ring-[var(--hi-soft)]" style={{ borderColor: "var(--rule)" }} />
                    <button type="button" onClick={addLink} className="press px-5 py-2 text-sm font-bold bg-[var(--hi)] text-[var(--ink)] rounded-lg">Add</button>
                  </div>
                )}
              </div>
              {/* Toggles */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    onClick={() => setForm(f => ({ ...f, inStock: !f.inStock }))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${form.inStock ? "bg-[var(--hi)]" : "bg-gray-200"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.inStock ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-sm font-medium text-[var(--ink)]">In Stock</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div
                    onClick={() => setForm(f => ({ ...f, featured: !f.featured }))}
                    className={`relative w-10 h-5 rounded-full transition-colors ${form.featured ? "bg-[var(--hi)]" : "bg-gray-200"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.featured ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                  <span className="text-sm font-medium text-[var(--ink)]">Featured</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 justify-end px-6 py-4 border-t bg-[var(--paper-2)] rounded-b-2xl" style={{ borderColor: "var(--rule)" }}>
              <button
                onClick={closeForm}
                className="px-4 py-2 text-sm font-semibold press border rounded-lg hover:bg-white shadow-sm text-[var(--ink)]"
                style={{ borderColor: "var(--rule)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name.trim() || !form.price || isPending}
                className="press px-6 py-2 text-sm font-bold bg-[var(--hi)] text-[var(--ink)] rounded-lg hover:opacity-90 disabled:opacity-40 transition-all shadow-sm"
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
          <div className="bg-white p-6 max-w-sm w-full rounded-2xl shadow-2xl pop">
            <h3 className="text-lg font-bold text-[var(--ink)] mb-2">Delete Product?</h3>
            <p className="text-sm text-[var(--mute)] mb-6">This product will be permanently removed from the store.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeletingId(null)} className="px-4 py-2 text-sm font-semibold border rounded-xl hover:bg-[var(--hi-soft)] transition-colors" style={{ borderColor: "var(--rule)", color: "var(--ink)" }}>Cancel</button>
              <button onClick={handleDelete} className="px-4 py-2 text-sm font-semibold bg-red-500 text-white rounded hover:bg-red-600 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
