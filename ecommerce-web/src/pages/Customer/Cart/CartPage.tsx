import { useEffect, useState } from "react";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Header from "../../../components/layout/Header";
import cartService, { type Cart } from "../../../services/cartService";
import { assetUrl } from "../../../services/media";

const money = (value: number) =>
  `৳${new Intl.NumberFormat("en-BD").format(value || 0)}`;

const imageUrl = assetUrl;

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCart = async () => {
    try {
      setError("");
      setCart(await cartService.getCart());
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || requestError?.message || "Unable to load cart");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCart();
  }, []);

  const updateQuantity = async (itemId: number, quantity: number) => {
    if (!cart || quantity < 1) return;
    try {
      setCart(await cartService.updateItem(cart.id, itemId, quantity));
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || requestError?.message || "Unable to update cart");
    }
  };

  const removeItem = async (itemId: number) => {
    if (!cart) return;
    try {
      await cartService.removeItem(cart.id, itemId);
      await loadCart();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || requestError?.message || "Unable to remove item");
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Header />
      <main className="mx-auto max-w-[1200px] px-4 py-8 md:px-6">
        <h1 className="text-3xl font-black">Shopping Cart</h1>
        {error && <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {loading ? (
          <div className="py-20 text-center text-slate-400">Loading cart...</div>
        ) : !cart?.items?.length ? (
          <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white py-20 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-4 font-bold">Your cart is empty</h2>
            <a href="/shop" className="mt-5 inline-flex rounded-xl bg-[#ff6b00] px-5 py-3 text-sm font-bold text-white">Continue Shopping</a>
          </div>
        ) : (
          <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_360px]">
            <section className="space-y-3">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <img src={imageUrl(item.imageUrl)} alt={item.productName} className="h-24 w-24 rounded-xl bg-slate-50 object-contain p-2" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-800">{item.productName}</h3>
                    {item.variantName && <p className="mt-1 text-xs text-slate-500">{item.variantName}</p>}
                    <p className="mt-2 text-sm font-bold">{money(item.unitPrice)}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex h-9 items-center rounded-lg border border-slate-200">
                        <button aria-label="Decrease quantity" onClick={() => void updateQuantity(item.id, item.quantity - 1)} className="px-2"><Minus className="h-3.5 w-3.5" /></button>
                        <span className="w-8 text-center text-xs font-bold">{item.quantity}</span>
                        <button aria-label="Increase quantity" onClick={() => void updateQuantity(item.id, item.quantity + 1)} className="px-2"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                      <button onClick={() => void removeItem(item.id)} className="flex items-center gap-1 text-xs font-semibold text-red-500"><Trash2 className="h-4 w-4" /> Remove</button>
                    </div>
                  </div>
                  <div className="font-black text-slate-900">{money(item.totalPrice)}</div>
                </div>
              ))}
            </section>
            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="text-lg font-black">Order Summary</h2>
              <div className="mt-5 flex justify-between text-sm"><span className="text-slate-500">Items</span><span>{cart.totalItems}</span></div>
              <div className="mt-3 flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span className="font-bold">{money(cart.subTotal)}</span></div>
              <div className="my-5 border-t border-slate-100" />
              <div className="flex justify-between"><span className="font-bold">Total</span><span className="text-xl font-black">{money(cart.subTotal)}</span></div>
              <a href="/checkout" className="mt-5 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#ff6b00] text-sm font-bold text-white">Checkout <ArrowRight className="h-4 w-4" /></a>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
