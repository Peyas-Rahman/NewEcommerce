import { useEffect, useState } from "react";
import Header from "../../../components/layout/Header";
import customerService, { type WishlistItem } from "../../../services/customerService";
import { removeWishlist } from "../../../services/shoppingListService";

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { if (!customerService.isLoggedIn()) { window.location.href = "/login"; return; } customerService.getWishlist().then(setItems).catch((e) => setError(e?.response?.data?.message || "Please login to view your wishlist.")); }, []);
  const remove = async (item: WishlistItem) => { try { await customerService.removeWishlist(item.productId); } catch { removeWishlist(item.productId); } setItems((current) => current.filter((value) => value.id !== item.id)); };
  return <div className="min-h-screen bg-[#f7f8fa]"><Header/><main className="mx-auto max-w-[1100px] px-4 py-8 md:px-6"><h1 className="text-3xl font-black">My Wishlist</h1>{error&&<div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>} {!items.length&&!error?<div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center text-slate-500">Your wishlist is empty.</div>:<div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map((item)=><article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4"><a href={`/product/${item.productId}`} className="font-bold">{item.productName}</a><p className="mt-2 font-black text-orange-600">৳{new Intl.NumberFormat("en-BD").format(item.price||0)}</p><button onClick={()=>void remove(item)} className="mt-4 text-sm font-bold text-red-500">Remove</button></article>)}</div>}</main></div>
}