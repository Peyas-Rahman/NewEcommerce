import { useEffect, useState } from "react";
import { AirVent, ArrowRight, BatteryCharging, Camera, Heart, Headphones, Monitor, Refrigerator, ShoppingCart, ShieldCheck, Smartphone, Tv, Truck, Utensils, Watch, Zap } from "lucide-react";
import Header from "../../../components/layout/Header";
import HeroSection from "../../../components/layout/HeroSection";
import productService from "../../../services/productService";
import { addItem } from "../../../services/cartService";
import { assetUrl } from "../../../services/media";
import { getAllCategories } from "../../../services/categoryService";
import type { Product } from "../../../types/product";
import Toast from "../../../components/ui/Toast";
import type { Category } from "../../../types/category";

const money = (value: number) => `৳${new Intl.NumberFormat("en-BD").format(value || 0)}`;

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    Promise.all([productService.getAll(), getAllCategories()]).then(([items, groups]) => {
      setProducts(items);
      setCategories(groups);
    }).catch(() => setNotice("Unable to load products"));
  }, []);

  const groups = [
    { title: "Featured Products", items: products.filter((product) => product.isFeatured) },
    { title: "Best Sellers", items: products.filter((product) => product.isBestSeller) },
    { title: "New Arrivals", items: products.filter((product) => product.isNewArrival) },
  ];

  const addToCart = async (product: Product) => {
    try {
      const variant = product.variants?.find((item) => item.isActive);
      await addItem(product.id, variant?.id, 1);
      setNotice(`${product.name} added to cart`);
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "Unable to add to cart");
    }
  };

  return <div className="min-h-screen bg-[#f7f8fa]"><Header /><HeroSection /><main className="mx-auto max-w-[1440px] px-4 py-10 md:px-6">
    <Toast message={notice} onClose={() => setNotice("")} />
    <div className="grid gap-3 sm:grid-cols-3"><Trust icon={Truck} title="Fast Delivery" text="Reliable delivery across Bangladesh" /><Trust icon={ShieldCheck} title="Genuine Products" text="Quality tech from trusted sources" /><Trust icon={Heart} title="Customer First" text="Support when you need it" /></div>
    {categories.length > 0 && <FeaturedCategories categories={categories} />}
    {groups.map((group) => group.items.length > 0 && <section key={group.title} className="mt-12"><div className="mb-5 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-orange-600">Dexora Collection</p><h2 className="mt-1 text-2xl font-black">{group.title}</h2></div><a href="/shop" className="flex items-center gap-1 text-sm font-bold text-slate-500">View all <ArrowRight className="h-4 w-4" /></a></div><div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">{group.items.slice(0, 6).map((product) => <article key={product.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"><a href={`/product/${product.id}`}><div className="flex aspect-square items-center justify-center bg-slate-50 p-3"><img src={assetUrl(product.images?.find((image) => image.isPrimary)?.imageUrl || product.images?.[0]?.imageUrl)} alt={product.name} className="h-full w-full object-contain" /></div><div className="p-3"><p className="line-clamp-2 min-h-10 text-sm font-bold text-slate-800">{product.name}</p><p className="mt-2 text-base font-black text-slate-900">{money(product.effectivePrice ?? product.price)}</p></div></a><div className="px-3 pb-3"><button onClick={() => void addToCart(product)} className="flex h-9 w-full items-center justify-center gap-1 rounded-xl bg-[#ff6b00] text-xs font-bold text-white hover:bg-[#e65f00]"><ShoppingCart className="h-3.5 w-3.5" /> Add to Cart</button></div></article>)}</div></section>)}
  </main><Footer /></div>;
}

function FeaturedCategories({ categories }: { categories: Category[] }) {
  const roots = categories.filter((category) => category.isActive && !category.parentCategoryId).sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).slice(0, 16);
  return <section className="mt-12"><div className="text-center"><h2 className="text-2xl font-black text-slate-900">Featured Category</h2><p className="mt-2 text-sm text-slate-600">Get Your Desired Product from Featured Category!</p></div><div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">{roots.map((category) => <a key={category.id} href={`/shop?category=${category.id}`} className="group flex min-h-[134px] flex-col items-center justify-center rounded-2xl border border-transparent bg-white px-3 py-5 text-center shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-md"><CategoryIcon category={category} /><span className="mt-4 line-clamp-2 text-sm font-medium text-slate-800 group-hover:text-orange-600">{category.name}</span></a>)}</div></section>;
}

function CategoryIcon({ category }: { category: Category }) {
  const [imageFailed, setImageFailed] = useState(false);
  if (category.imageUrl && !imageFailed) return <img src={assetUrl(category.imageUrl)} alt="" onError={() => setImageFailed(true)} className="h-11 w-11 object-contain" />;
  const name = category.name.toLowerCase();
  const Icon = name.includes("air") || name.includes("ac") ? AirVent : name.includes("power") || name.includes("battery") ? BatteryCharging : name.includes("camera") ? Camera : name.includes("head") || name.includes("ear") ? Headphones : name.includes("monitor") ? Monitor : name.includes("fridge") ? Refrigerator : name.includes("phone") ? Smartphone : name.includes("tv") ? Tv : name.includes("watch") ? Watch : name.includes("food") || name.includes("fryer") ? Utensils : name.includes("torch") ? Zap : Monitor;
  return <Icon className="h-11 w-11 stroke-[1.5] text-slate-800" />;
}

function Trust({ icon: Icon, title, text }: { icon: typeof Truck; title: string; text: string }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-5"><Icon className="h-5 w-5 text-orange-600" /><p className="mt-3 text-sm font-black">{title}</p><p className="mt-1 text-xs text-slate-500">{text}</p></div>;
}

function Footer() {
  return <footer className="mt-10 bg-[#07111f] text-white"><div className="mx-auto max-w-[1440px] px-4 py-10 md:px-6"><div className="grid gap-8 md:grid-cols-4"><div><p className="text-xl font-black">DEXORA</p><p className="mt-3 text-sm leading-6 text-white/50">Technology, gaming and everyday essentials.</p></div><div><p className="font-bold">Store</p><a href="/shop" className="mt-3 block text-sm text-white/50">All Products</a></div><div><p className="font-bold">Account</p><a href="/account" className="mt-3 block text-sm text-white/50">My Account</a><a href="/login" className="mt-2 block text-sm text-white/50">Sign In</a></div><div><p className="font-bold">Support</p><p className="mt-3 text-sm text-white/50">Fast delivery • Genuine products • Customer first</p></div></div><div className="mt-8 border-t border-white/10 pt-5 text-xs text-white/35">© {new Date().getFullYear()} Dexora Technologies. All rights reserved.</div></div></footer>;
}
