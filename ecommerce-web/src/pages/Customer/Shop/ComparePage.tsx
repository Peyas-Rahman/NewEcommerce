import { useEffect, useState } from "react";
import Header from "../../../components/layout/Header";
import productService from "../../../services/productService";
import { compareIds, removeCompare } from "../../../services/shoppingListService";

export default function ComparePage() {
  const [products, setProducts] = useState<any[]>([]);
  useEffect(() => {
    Promise.all(compareIds().map((id) => productService.getById(id))).then(setProducts).catch(() => setProducts([]));
  }, []);
  return <div className="min-h-screen bg-[#f7f8fa]"><Header/><main className="mx-auto max-w-[1200px] px-4 py-8 md:px-6"><h1 className="text-3xl font-black">Compare Products</h1>{!products.length?<Empty text="No products selected for comparison."/>:<div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{products.map((product)=><article key={product.id} className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-black">{product.name}</h2><p className="mt-3 text-2xl font-black text-orange-600">৳{new Intl.NumberFormat("en-BD").format(product.effectivePrice||product.price||0)}</p><dl className="mt-5 space-y-3 text-sm"><div><dt className="text-slate-400">Brand</dt><dd className="font-semibold">{product.brandName||"-"}</dd></div><div><dt className="text-slate-400">Category</dt><dd className="font-semibold">{product.categoryName||"-"}</dd></div><div><dt className="text-slate-400">Availability</dt><dd className="font-semibold">{product.isInStock===false?"Out of stock":"In stock"}</dd></div></dl><button onClick={()=>{removeCompare(product.id);setProducts((items)=>items.filter((item)=>item.id!==product.id))}} className="mt-6 text-sm font-bold text-red-500">Remove</button></article>)}</div>}<a href="/shop" className="mt-7 inline-flex rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white">Continue Shopping</a></main></div>
}
function Empty({text}:{text:string}){return <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center text-slate-500">{text}</div>}