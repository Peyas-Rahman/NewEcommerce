import { useEffect, useState, type ReactNode } from "react";
import { MapPin, TicketPercent, Truck, Wallet } from "lucide-react";
import Header from "../../../components/layout/Header";
import cartService, { type Cart } from "../../../services/cartService";
import customerService, { type Address } from "../../../services/customerService";
import { checkout } from "../../../services/checkoutService";
import { validateCoupon } from "../../../services/couponService";

const money = (value: number) => `৳${new Intl.NumberFormat("en-BD").format(value || 0)}`;

type CheckoutForm = { guestName: string; guestPhone: string; guestEmail: string; shippingName: string; shippingPhone: string; shippingAddress: string; shippingCity: string; shippingArea: string; shippingPostalCode: string; paymentMethod: string; customerNote: string };
const initialForm: CheckoutForm = { guestName: "", guestPhone: "", guestEmail: "", shippingName: "", shippingPhone: "", shippingAddress: "", shippingCity: "", shippingArea: "", shippingPostalCode: "", paymentMethod: "CashOnDelivery", customerNote: "" };

export default function CheckoutPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const loggedIn = customerService.isLoggedIn();
  const update = (field: keyof CheckoutForm, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const applyCoupon = async () => {
    const code = couponCode.trim();
    if (!code || !cart) return;
    try {
      setCouponBusy(true);
      setCouponMessage("");
      const result = await validateCoupon(code, cart.subTotal || 0);
      localStorage.setItem("dexora_coupon_code", code.toUpperCase());
      setCouponDiscount(result.discountAmount || 0);
      setCouponMessage(result.message || "Coupon applied successfully.");
    } catch (requestError: any) {
      localStorage.removeItem("dexora_coupon_code");
      setCouponDiscount(0);
      setCouponMessage(requestError?.response?.data?.message || "Invalid coupon code");
    } finally {
      setCouponBusy(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setCart(await cartService.getCart());
        if (loggedIn) {
          const saved = await customerService.getAddresses();
          setAddresses(saved);
          const address = saved.find((item) => item.isDefault) || saved[0];
          if (address) setForm((current) => ({ ...current, shippingName: address.fullName, shippingPhone: address.phone, shippingAddress: address.addressLine, shippingCity: address.city || "", shippingArea: address.area || "", shippingPostalCode: address.postalCode || "" }));
        }
      } catch (requestError: any) { setError(requestError?.response?.data?.message || requestError?.message || "Unable to load checkout"); }
      finally { setLoading(false); }
    };
    void load();
  }, [loggedIn]);

  const selectAddress = (id: number) => { const address = addresses.find((item) => item.id === id); if (address) setForm((current) => ({ ...current, shippingName: address.fullName, shippingPhone: address.phone, shippingAddress: address.addressLine, shippingCity: address.city || "", shippingArea: address.area || "", shippingPostalCode: address.postalCode || "" })); };
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (!cart?.items.length) { setError("Your cart is empty."); return; } try { setBusy(true); setError(""); const order = await checkout(form); window.location.href = `/order-success?id=${order.id || ""}`; } catch (requestError: any) { setError(requestError?.response?.data?.message || requestError?.message || "Checkout failed"); } finally { setBusy(false); } };

  return <div className="min-h-screen bg-[#f7f8fa]"><Header /><main className="mx-auto max-w-[1200px] px-4 py-8 md:px-6"><h1 className="text-3xl font-black">Checkout</h1>{!loggedIn && <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">You can place this order without creating an account.</div>}{loading ? <div className="py-20 text-center text-slate-400">Loading checkout...</div> : <form onSubmit={submit} className="mt-7 grid gap-6 lg:grid-cols-[1fr_360px]"><section className="space-y-5">{!loggedIn && <div className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-black">Your contact information</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Full name"><input className="form-input" required value={form.guestName} onChange={(e) => update("guestName", e.target.value)} /></Field><Field label="Phone"><input className="form-input" required value={form.guestPhone} onChange={(e) => update("guestPhone", e.target.value)} /></Field><Field label="Email (optional)"><input type="email" className="form-input sm:col-span-2" value={form.guestEmail} onChange={(e) => update("guestEmail", e.target.value)} /></Field></div></div>}<div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-orange-600" /><h2 className="font-black">Shipping information</h2></div>{loggedIn && addresses.length > 0 && <select onChange={(e) => selectAddress(Number(e.target.value))} className="form-input mt-4"><option value="">Choose saved address</option>{addresses.map((address) => <option key={address.id} value={address.id}>{address.addressType} - {address.addressLine}</option>)}</select>}<div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Full name"><input className="form-input" required value={form.shippingName} onChange={(e) => update("shippingName", e.target.value)} /></Field><Field label="Phone"><input className="form-input" required value={form.shippingPhone} onChange={(e) => update("shippingPhone", e.target.value)} /></Field><div className="sm:col-span-2"><Field label="Address"><textarea className="form-textarea" required value={form.shippingAddress} onChange={(e) => update("shippingAddress", e.target.value)} /></Field></div><Field label="City"><input className="form-input" value={form.shippingCity} onChange={(e) => update("shippingCity", e.target.value)} /></Field><Field label="Area"><input className="form-input" value={form.shippingArea} onChange={(e) => update("shippingArea", e.target.value)} /></Field><Field label="Postal code"><input className="form-input" value={form.shippingPostalCode} onChange={(e) => update("shippingPostalCode", e.target.value)} /></Field></div></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-2"><Wallet className="h-5 w-5 text-orange-600" /><h2 className="font-black">Payment method</h2></div><label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4"><input type="radio" checked readOnly /><div><p className="font-bold">Cash on Delivery</p><p className="text-xs text-slate-500">Pay when your order arrives.</p></div></label><Field label="Order note"><textarea className="form-textarea mt-4" value={form.customerNote} onChange={(e) => update("customerNote", e.target.value)} placeholder="Optional note" /></Field></div></section><aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-lg font-black">Your order</h2>{cart?.items.map((item) => <div key={item.id} className="mt-4 flex justify-between gap-3 text-sm"><span className="text-slate-600">{item.productName} x {item.quantity}</span><span className="font-bold">{money(item.totalPrice)}</span></div>)}<div className="my-5 border-t border-slate-100" /><div className="mb-4"><p className="mb-2 flex items-center gap-1.5 text-[13px] font-black text-slate-900"><TicketPercent className="h-4 w-4 text-[#ff6b00]" />Have a coupon?</p><div className="flex gap-2"><input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Enter coupon code" className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm uppercase outline-none focus:border-orange-400" /><button type="button" disabled={couponBusy} onClick={() => void applyCoupon()} className="rounded-xl bg-[#e65f00] px-4 text-xs font-bold text-white disabled:opacity-60">{couponBusy ? "..." : "Apply"}</button></div>{couponMessage && <p className={`mt-2 text-xs ${couponDiscount > 0 ? "text-emerald-600" : "text-red-600"}`}>{couponMessage}{couponDiscount > 0 && ` You save ${money(couponDiscount)}`}</p>}</div>{couponDiscount > 0 && <div className="mb-2 flex justify-between text-sm font-semibold text-emerald-600"><span>Discount</span><span>-{money(couponDiscount)}</span></div>}<div className="flex justify-between text-lg font-black"><span>Total</span><span>{money(Math.max(0, (cart?.subTotal || 0) - couponDiscount))}</span></div>{error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}<button disabled={busy} className="mt-5 h-12 w-full rounded-xl bg-[#ff6b00] text-sm font-bold text-white disabled:opacity-60">{busy ? "Placing order..." : "Place Order"}</button><div className="mt-4 flex items-center gap-2 text-xs text-slate-400"><Truck className="h-4 w-4" /> Delivery details are confirmed after order placement.</div></aside></form>}</main></div>;
}
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block"><span className="form-label">{label}</span>{children}</label>; }
