import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Save, Trash2, Zap } from "lucide-react";
import productService from "../../../services/productService";
import { assetUrl } from "../../../services/media";
import { createFlashSale, deleteFlashSale, getFlashSales, updateFlashSale, type FlashSale, type FlashSaleInput } from "../../../services/flashSaleService";
import type { Product } from "../../../types/product";

const emptyForm: FlashSaleInput = {
  productId: 0,
  salePrice: 0,
  endsAt: "",
  isActive: true,
  sortOrder: 1,
};

const toInputDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export default function FlashSaleManagement() {
  const [items, setItems] = useState<FlashSale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<FlashSaleInput>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [salesResult, productsResult] = await Promise.allSettled([
      getFlashSales(),
      productService.getAll(),
    ]);

    if (productsResult.status === "fulfilled") {
      setProducts(productsResult.value);
    } else {
      setError("Unable to load products. Please refresh after restarting the API.");
    }

    if (salesResult.status === "fulfilled") {
      setItems(salesResult.value);
    } else if (productsResult.status === "fulfilled") {
      setError("Flash Sale API is unavailable. Restart the API to load saved sales.");
    }
  };

  useEffect(() => { void load(); }, []);

  const availableProducts = useMemo(
    () => products.filter((product) => product.isActive && (!items.some((item) => item.productId === product.id) || product.id === form.productId)),
    [products, items, form.productId],
  );

  const reset = () => {
    setEditingId(null);
    setForm({ ...emptyForm, endsAt: toInputDate(new Date(Date.now() + 86400000).toISOString()) });
    setError("");
  };

  const edit = (item: FlashSale) => {
    setEditingId(item.id);
    setForm({ productId: item.productId, salePrice: item.salePrice, endsAt: toInputDate(item.endsAt), isActive: item.isActive, sortOrder: item.sortOrder });
    setError("");
  };

  const save = async () => {
    try {
      setSaving(true);
      setError("");
      const payload = { ...form, endsAt: new Date(form.endsAt).toISOString() };
      if (editingId) await updateFlashSale(editingId, payload);
      else await createFlashSale(payload);
      await load();
      reset();
    } catch (error: any) {
      setError(error?.response?.data?.message || error?.message || "Unable to save flash sale.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm("Remove this flash sale?")) return;
    await deleteFlashSale(id);
    await load();
    if (editingId === id) reset();
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-5 lg:p-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-orange-600">Homepage merchandising</p>
            <h1 className="text-2xl font-black text-slate-900">Flash Sale</h1>
            <p className="mt-1 text-sm text-slate-500">Control products, sale prices, order and countdown expiry.</p>
          </div>
          <button type="button" onClick={reset} className="flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-700"><Plus size={17} /> New Sale</button>
        </div>
        {error && <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_390px]">
          <section className="space-y-3">
            {items.map((item) => (
              <article key={item.id} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <img src={assetUrl(item.imageUrl)} alt="" className="h-24 w-24 rounded-xl bg-slate-50 object-contain" />
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-orange-600">Flash Sale</p><h2 className="mt-1 font-black text-slate-900">{item.productName}</h2></div><span className={`h-fit rounded-full px-2 py-1 text-[10px] font-bold ${item.isActive ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>{item.isActive ? "Active" : "Hidden"}</span></div>
                  <div className="mt-2 flex flex-wrap items-baseline gap-2"><strong className="text-lg font-black text-orange-600">৳{item.salePrice.toLocaleString("en-BD")}</strong><span className="text-xs text-slate-400 line-through">৳{item.originalPrice.toLocaleString("en-BD")}</span></div>
                  <p className="mt-1 text-xs text-slate-500">Ends {new Date(item.endsAt).toLocaleString("en-BD")}</p>
                  <div className="mt-3 flex gap-2"><button type="button" onClick={() => edit(item)} className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-bold"><Pencil size={13} /> Edit</button><button type="button" onClick={() => void remove(item.id)} className="flex items-center gap-1 rounded-lg border border-red-100 px-3 py-1.5 text-xs font-bold text-red-600"><Trash2 size={13} /> Remove</button></div>
                </div>
              </article>
            ))}
            {!items.length && <div className="rounded-2xl border border-dashed bg-white p-12 text-center text-sm text-slate-500">No flash sale products yet.</div>}
          </section>
          <section className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-black text-slate-900"><Zap className="h-4 w-4 text-orange-600" /> {editingId ? "Edit Flash Sale" : "Create Flash Sale"}</h2>
            <div className="mt-5 grid gap-4">
              <Field label="Product"><select value={form.productId} onChange={(event) => setForm({ ...form, productId: Number(event.target.value) })} className="admin-input"><option value={0}>Select product</option>{availableProducts.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></Field>
              <Field label="Sale price"><input type="number" min="1" value={form.salePrice || ""} onChange={(event) => setForm({ ...form, salePrice: Number(event.target.value) })} className="admin-input" /></Field>
              <Field label="Sale ends at"><input type="datetime-local" value={form.endsAt} onChange={(event) => setForm({ ...form, endsAt: event.target.value })} className="admin-input" /></Field>
              <Field label="Display order"><input type="number" min="0" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })} className="admin-input" /></Field>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700"><input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} className="h-4 w-4 accent-orange-600" /> Show on homepage</label>
              <button type="button" disabled={saving} onClick={() => void save()} className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"><Save size={16} /> {saving ? "Saving..." : "Save Flash Sale"}</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-xs font-bold text-slate-600"><span className="mb-1.5 block">{label}</span>{children}</label>;
}
