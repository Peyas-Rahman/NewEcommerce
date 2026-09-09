import { useEffect, useState } from "react";
import {
  Loader2,
  Pencil,
  Plus,
  TicketPercent,
  Trash2,
  X,
} from "lucide-react";
import couponService, {
  type Coupon,
  type CouponPayload,
} from "../../../services/couponService";

const money = (value: number) =>
  `৳${new Intl.NumberFormat("en-BD").format(value || 0)}`;

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-GB");
};

const emptyForm: CouponPayload = {
  code: "",
  discountType: "Percentage",
  discountValue: 0,
  minimumOrderAmount: null,
  maximumDiscountAmount: null,
  usageLimit: null,
  startsAt: null,
  expiresAt: null,
  isActive: true,
};

export default function CouponManagement() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CouponPayload>(emptyForm);

  const load = async () => {
    try {
      setLoading(true);
      setCoupons(await couponService.getAllCoupons());
    } catch {
      setError("Failed to load coupons.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const update = <K extends keyof CouponPayload>(
    field: K,
    value: CouponPayload[K],
  ) => setForm((current) => ({ ...current, [field]: value }));

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minimumOrderAmount: coupon.minimumOrderAmount ?? null,
      maximumDiscountAmount: coupon.maximumDiscountAmount ?? null,
      usageLimit: coupon.usageLimit ?? null,
      startsAt: coupon.startsAt ? coupon.startsAt.slice(0, 10) : null,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : null,
      isActive: coupon.isActive,
    });
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.code.trim()) {
      setError("Coupon code is required.");
      return;
    }
    if (form.discountValue <= 0) {
      setError("Discount value must be greater than zero.");
      return;
    }

    try {
      setBusy(true);
      setError("");
      const payload: CouponPayload = {
        ...form,
        code: form.code.trim().toUpperCase(),
      };

      if (editingId) {
        await couponService.updateCoupon(editingId, payload);
        setSuccess("Coupon updated successfully.");
      } else {
        await couponService.createCoupon(payload);
        setSuccess("Coupon created successfully.");
      }

      setShowForm(false);
      await load();
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ||
          "Could not save the coupon.",
      );
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm("Delete this coupon?")) return;
    try {
      await couponService.deleteCoupon(id);
      setSuccess("Coupon deleted.");
      await load();
    } catch {
      setError("Could not delete the coupon.");
    }
  };

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Coupons</h1>
          <p className="text-[13px] text-slate-500">
            Create and manage discount coupons for the store.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#ff6b00] px-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#e65f00]"
        >
          <Plus size={15} />
          New Coupon
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] font-medium text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[13px] font-medium text-emerald-700">
          {success}
        </div>
      )}

      {/* FORM */}
      {showForm && (
        <form
          onSubmit={submit}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <TicketPercent size={16} className="text-[#ff6b00]" />
              {editingId ? "Edit Coupon" : "Create Coupon"}
            </h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              aria-label="Close form"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">
                Code *
              </span>
              <input
                value={form.code}
                onChange={(e) => update("code", e.target.value)}
                placeholder="e.g. EID2026"
                className="form-input uppercase"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">
                Discount Type *
              </span>
              <select
                value={form.discountType}
                onChange={(e) =>
                  update(
                    "discountType",
                    e.target.value as "Percentage" | "Fixed",
                  )
                }
                className="form-input"
              >
                <option value="Percentage">Percentage (%)</option>
                <option value="Fixed">Fixed (৳)</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">
                Discount Value *
              </span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.discountValue || ""}
                onChange={(e) =>
                  update("discountValue", Number(e.target.value) || 0)
                }
                placeholder={
                  form.discountType === "Percentage" ? "e.g. 10" : "e.g. 500"
                }
                className="form-input"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">
                Usage Limit
              </span>
              <input
                type="number"
                min={0}
                value={form.usageLimit ?? ""}
                onChange={(e) =>
                  update(
                    "usageLimit",
                    e.target.value === ""
                      ? null
                      : Number(e.target.value),
                  )
                }
                placeholder="Unlimited"
                className="form-input"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">
                Minimum Order (৳)
              </span>
              <input
                type="number"
                min={0}
                value={form.minimumOrderAmount ?? ""}
                onChange={(e) =>
                  update(
                    "minimumOrderAmount",
                    e.target.value === ""
                      ? null
                      : Number(e.target.value),
                  )
                }
                placeholder="None"
                className="form-input"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">
                Max Discount (৳)
              </span>
              <input
                type="number"
                min={0}
                value={form.maximumDiscountAmount ?? ""}
                onChange={(e) =>
                  update(
                    "maximumDiscountAmount",
                    e.target.value === ""
                      ? null
                      : Number(e.target.value),
                  )
                }
                placeholder="No cap"
                className="form-input"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">
                Starts At
              </span>
              <input
                type="date"
                value={form.startsAt ?? ""}
                onChange={(e) =>
                  update("startsAt", e.target.value || null)
                }
                className="form-input"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-slate-600">
                Expires At
              </span>
              <input
                type="date"
                value={form.expiresAt ?? ""}
                onChange={(e) =>
                  update("expiresAt", e.target.value || null)
                }
                className="form-input"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => update("isActive", e.target.checked)}
                className="h-4 w-4 accent-[#ff6b00]"
              />
              Active
            </label>

            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#ff6b00] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#e65f00] disabled:opacity-50"
            >
              {busy && <Loader2 size={15} className="animate-spin" />}
              {editingId ? "Update Coupon" : "Create Coupon"}
            </button>
          </div>
        </form>
      )}

      {/* LIST */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-slate-400">
            <Loader2 size={16} className="animate-spin" />
            Loading coupons...
          </div>
        ) : !coupons.length ? (
          <div className="py-16 text-center text-[13px] text-slate-400">
            No coupons yet. Create your first coupon.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Discount</th>
                  <th className="px-4 py-3 font-semibold">Min. Order</th>
                  <th className="px-4 py-3 font-semibold">Used / Limit</th>
                  <th className="px-4 py-3 font-semibold">Valid</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr
                    key={coupon.id}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                  >
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {coupon.code}
                    </td>
                    <td className="px-4 py-3">
                      {coupon.discountType === "Percentage"
                        ? `${coupon.discountValue}%`
                        : money(coupon.discountValue)}
                      {coupon.maximumDiscountAmount
                        ? ` (max ${money(coupon.maximumDiscountAmount)})`
                        : ""}
                    </td>
                    <td className="px-4 py-3">
                      {coupon.minimumOrderAmount
                        ? money(coupon.minimumOrderAmount)
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {coupon.usedCount}
                      {coupon.usageLimit ? ` / ${coupon.usageLimit}` : " / ∞"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatDate(coupon.startsAt)} →{" "}
                      {formatDate(coupon.expiresAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          coupon.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {coupon.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(coupon)}
                          aria-label="Edit coupon"
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-[#ff6b00]"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(coupon.id)}
                          aria-label="Delete coupon"
                          className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
