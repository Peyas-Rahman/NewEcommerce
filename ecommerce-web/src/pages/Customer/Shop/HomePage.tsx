import { useEffect, useState } from "react";
import {
  AirVent,
  ArrowRight,
  BatteryCharging,
  Camera,
  Eye,
  GitCompareArrows,
  Heart,
  Headphones,
  Monitor,
  Refrigerator,
  ShoppingCart,
  ShieldCheck,
  Smartphone,
  Tv,
  Truck,
  Utensils,
  Watch,
  X,
  Zap,
} from "lucide-react";
import Header from "../../../components/layout/Header";
import HeroSection from "../../../components/layout/HeroSection";
import productService from "../../../services/productService";
import { addItem } from "../../../services/cartService";
import { assetUrl } from "../../../services/media";
import { getAllCategories } from "../../../services/categoryService";
import {
  compareIds,
  toggleCompare,
  toggleWishlist,
  wishlistIds,
} from "../../../services/shoppingListService";
import type { Product } from "../../../types/product";
import Toast from "../../../components/ui/Toast";
import type { Category } from "../../../types/category";
import { getFlashSales, type FlashSale } from "../../../services/flashSaleService";

const money = (value: number) =>
  `৳${new Intl.NumberFormat("en-BD").format(value || 0)}`;

const getPriceDetails = (product: Product) => {
  const currentPrice = product.effectivePrice ?? product.discountPrice ?? product.price;
  const previousPrice = product.price > currentPrice ? product.price : null;
  const savedAmount = previousPrice ? previousPrice - currentPrice : 0;
  const discountPercentage = previousPrice ? Math.round((savedAmount / previousPrice) * 100) : 0;

  return { currentPrice, previousPrice, savedAmount, discountPercentage };
};

const stripHtmlToText = (value?: string | null) => {
  if (!value) return "";

  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
};

const getShortDescriptionItems = (value?: string | null) => {
  if (!value) return [];

  const listItems = [...value.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
    .map((match) => stripHtmlToText(match[1]))
    .filter(Boolean);

  return listItems.length > 0
    ? listItems
    : [stripHtmlToText(value)].filter(Boolean);
};

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [notice, setNotice] = useState("");
  const [quickProduct, setQuickProduct] = useState<Product | null>(null);
  const [quickDetails, setQuickDetails] = useState<Product | null>(null);
  const [quickLoading, setQuickLoading] = useState(false);

  useEffect(() => {
    Promise.all([productService.getAll(), getAllCategories()])
      .then(([items, groups]) => {
        setProducts(items);
        setCategories(groups);
        return getFlashSales(true).catch(() => [] as FlashSale[]);
      })
      .then(setFlashSales)
      .catch(() => setNotice("Unable to load products"));
  }, []);

  const openQuickView = async (product: Product) => {
    setQuickProduct(product);
    setQuickDetails(product);
    setQuickLoading(true);

    try {
      const details = await productService.getDetails(product.id);
      setQuickDetails(details || product);
    } catch {
      setQuickDetails(product);
    } finally {
      setQuickLoading(false);
    }
  };

  const groups = [
    {
      title: "Featured Products",
      items: products.filter((product) => product.isFeatured),
    },
    {
      title: "Best Sellers",
      items: products.filter((product) => product.isBestSeller),
    },
    {
      title: "New Arrivals",
      items: products.filter((product) => product.isNewArrival),
    },
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

  const addToWishlist = (product: Product) => {
    toggleWishlist(product.id);
    setNotice(
      `${product.name} ${wishlistIds().includes(product.id) ? "removed from" : "added to"} wishlist`,
    );
  };

  const addToCompare = (product: Product) => {
    try {
      toggleCompare(product.id);
      setNotice(
        `${product.name} ${compareIds().includes(product.id) ? "added to" : "removed from"} compare`,
      );
    } catch (error: any) {
      setNotice(error?.message || "Unable to update compare list");
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Header />
      <HeroSection />
      <main className="mx-auto max-w-[1440px] px-4 py-10 md:px-6">
        <Toast message={notice} onClose={() => setNotice("")} />
        <div className="grid gap-3 sm:grid-cols-3">
          <Trust
            icon={Truck}
            title="Fast Delivery"
            text="Reliable delivery across Bangladesh"
          />
          <Trust
            icon={ShieldCheck}
            title="Genuine Products"
            text="Quality tech from trusted sources"
          />
          <Trust
            icon={Heart}
            title="Customer First"
            text="Support when you need it"
          />
        </div>
        {categories.length > 0 && (
          <FeaturedCategories categories={categories} />
        )}
        {flashSales.length > 0 && (
          <FlashSaleSection
            items={flashSales}
          />
        )}
        {groups.map(
          (group) =>
            group.items.length > 0 && (
              <section key={group.title} className="mt-12">
                <div className="mb-5 flex items-end justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[.16em] text-orange-600">
                      Dexora Collection
                    </p>
                    <h2 className="mt-1 text-2xl font-black">{group.title}</h2>
                  </div>
                  <a
                    href="/shop"
                    className="flex items-center gap-1 text-sm font-bold text-slate-500"
                  >
                    View all <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {group.items.slice(0, 6).map((product) => (
                    <article
                      key={product.id}
                      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
                    >
                      {(() => {
                        const pricing = getPriceDetails(product);
                        return (
                          <>
                      <div className="absolute right-3 top-3 z-10 flex gap-2 opacity-0 transition group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => void openQuickView(product)}
                          aria-label="Quick view"
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-white"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => addToWishlist(product)}
                          aria-label="Wishlist"
                          className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-slate-200 hover:bg-white ${wishlistIds().includes(product.id) ? "text-red-500" : "text-slate-700"}`}
                        >
                          <Heart
                            className={`h-4 w-4 ${wishlistIds().includes(product.id) ? "fill-current" : ""}`}
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => addToCompare(product)}
                          aria-label="Compare"
                          className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm ring-1 ring-slate-200 hover:bg-white ${compareIds().includes(product.id) ? "text-blue-500" : "text-slate-700"}`}
                        >
                          <GitCompareArrows className="h-4 w-4" />
                        </button>
                      </div>
                      <a href={`/product/${product.slug}`}>
                        <div className="relative flex aspect-square items-center justify-center bg-slate-50 p-3">
                          {pricing.previousPrice && <span className="absolute left-0 top-3 bg-purple-700 px-2 py-1 text-[10px] font-bold text-white">Save: {money(pricing.savedAmount)} (-{pricing.discountPercentage}%)</span>}
                          <img
                            src={assetUrl(
                              product.images?.find((image) => image.isPrimary)
                                ?.imageUrl || product.images?.[0]?.imageUrl,
                            )}
                            alt={product.name}
                            className="h-full w-full object-contain"
                          />
                        </div>
                        <div className="p-3">
                          <p className="line-clamp-2 min-h-10 text-sm font-bold text-slate-800">
                            {product.name}
                          </p>
                          <div className="mt-2 flex flex-wrap items-baseline gap-2"><p className="text-base font-black text-red-600">{money(pricing.currentPrice)}</p>{pricing.previousPrice && <p className="text-xs text-slate-500 line-through">{money(pricing.previousPrice)}</p>}</div>
                        </div>
                      </a>
                      <div className="px-3 pb-3">
                        <button
                          onClick={() => void addToCart(product)}
                          className="flex h-9 w-full items-center justify-center gap-1 rounded-xl bg-[#ff6b00] text-xs font-bold text-white hover:bg-[#e65f00]"
                        >
                          <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
                        </button>
                      </div>
                          </>
                        );
                      })()}
                    </article>
                  ))}
                </div>
              </section>
            ),
        )}
        {quickProduct && (
          <QuickViewModal
            product={quickDetails ?? quickProduct}
            loading={quickLoading}
            onClose={() => {
              setQuickProduct(null);
              setQuickDetails(null);
              setQuickLoading(false);
            }}
            onCart={() => void addToCart(quickProduct)}
            onWishlist={() => addToWishlist(quickProduct)}
            onCompare={() => addToCompare(quickProduct)}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}

function QuickViewModal({
  product,
  loading,
  onClose,
  onCart,
  onWishlist,
  onCompare,
}: {
  product: Product;
  loading: boolean;
  onClose: () => void;
  onCart: () => void;
  onWishlist: () => void;
  onCompare: () => void;
}) {
  const [imageIndex, setImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(
    wishlistIds().includes(product.id),
  );
  const [isCompared, setIsCompared] = useState(
    compareIds().includes(product.id),
  );
  const images = [...(product.images || [])].sort(
    (a, b) =>
      Number(b.isPrimary) - Number(a.isPrimary) ||
      (a.sortOrder || 0) - (b.sortOrder || 0),
  );
  const descriptionItems = getShortDescriptionItems(product.shortDescription);

  useEffect(() => {
    setImageIndex(0);
    setIsWishlisted(wishlistIds().includes(product.id));
    setIsCompared(compareIds().includes(product.id));
  }, [product.id]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Product quick view"
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#ff6b00]">
            Quick View
          </p>
          <button
            type="button"
            aria-label="Close quick view"
            onClick={onClose}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-[420px] items-center justify-center text-slate-400">
            Loading product details...
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 gap-0 overflow-y-auto md:grid-cols-[0.92fr_1.08fr] md:overflow-hidden">
            <div className="border-r border-slate-100 bg-[#f5f8fb] p-4 md:p-6">
              <div className="flex min-h-[190px] items-center justify-center rounded-2xl border border-white/80 bg-[#edf4f8] p-4 md:min-h-[320px] md:p-6">
                <img
                  src={assetUrl(
                    images[imageIndex]?.imageUrl ||
                      product.images?.[0]?.imageUrl,
                  )}
                  alt={product.name}
                  className="max-h-[210px] w-full object-contain md:max-h-[280px]"
                />
              </div>

              {images.length > 1 && (
                <div className="mt-4 flex gap-2 overflow-x-auto">
                  {images.map((item, index) => (
                    <button
                      key={item.id || item.imageUrl}
                      type="button"
                      onClick={() => setImageIndex(index)}
                      className={`h-16 w-16 shrink-0 rounded-xl border-2 bg-white p-1 ${
                        imageIndex === index
                          ? "border-[#ff6b00]"
                          : "border-transparent"
                      }`}
                    >
                      <img
                        src={assetUrl(item.imageUrl)}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex min-h-0 flex-col bg-white px-6 py-6 md:px-8 md:py-7">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#ff6b00]">
                {product.brandName || "DEXORA"}
              </p>

              <h2 className="mt-3 text-3xl font-black leading-tight text-slate-900 md:text-4xl">
                {product.name}
              </h2>

              <p className="mt-3 text-sm text-slate-500">
                SKU: {product.sku || "-"}
              </p>

              <p className="mt-5 text-4xl font-black text-slate-900">
                {money(
                  product.effectivePrice ??
                    product.discountPrice ??
                    product.price,
                )}
              </p>

              {descriptionItems.length > 0 && (
                <div className="mt-6 min-h-0">
                  <p className="text-lg font-bold text-slate-800">
                    Key Features
                  </p>
                  <ul className="mt-3 max-h-[180px] overflow-y-auto pr-2 [scrollbar-width:thin] list-disc space-y-1.5 pl-5 text-sm leading-6 text-slate-500 md:max-h-[220px]">
                    {descriptionItems.map((item, index) => (
                      <li key={`${item}-${index}`}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-6 flex shrink-0 flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={onCart}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#ff6b00] px-5 py-4 text-base font-bold text-white shadow-sm hover:bg-[#e65f00]"
                >
                  <ShoppingCart className="h-5 w-5" /> Add to Cart
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onWishlist();
                    setIsWishlisted(wishlistIds().includes(product.id));
                  }}
                  className={`flex h-14 w-14 items-center justify-center rounded-xl border ${
                    isWishlisted
                      ? "border-red-200 bg-red-50 text-red-600"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                  aria-label="Wishlist"
                >
                  <Heart
                    className={`h-5 w-5 ${isWishlisted ? "fill-current" : ""}`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onCompare();
                    setIsCompared(compareIds().includes(product.id));
                  }}
                  className={`flex h-14 w-14 items-center justify-center rounded-xl border ${
                    isCompared
                      ? "border-blue-200 bg-blue-50 text-blue-600"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                  aria-label="Compare"
                >
                  <GitCompareArrows className="h-5 w-5" />
                </button>
              </div>

              <a
                href={`/product/${product.slug}`}
                className="mt-6 text-center text-sm font-bold text-slate-800 underline underline-offset-4 hover:text-orange-600"
              >
                View full details
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FlashSaleSection({
  items,
}: {
  items: FlashSale[];
}) {
  return (
    <section className="mt-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.16em] text-orange-600">
            Limited time deals
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-2xl font-black text-slate-900">
            <Zap className="h-6 w-6 fill-orange-500 text-orange-500" /> Flash Sale
          </h2>
        </div>
        <a href="/shop?flashSale=true" className="text-sm font-bold text-slate-500 hover:text-orange-600">
          View all <ArrowRight className="inline h-4 w-4" />
        </a>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {items.slice(0, 6).map((item) => {
          return <FlashSaleCard key={item.id} item={item} />;
        })}
      </div>
    </section>
  );
}

function FlashSaleCard({
  item,
}: {
  item: FlashSale;
}) {
  const [remaining, setRemaining] = useState(() => Math.max(0, new Date(item.endsAt).getTime() - Date.now()));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(Math.max(0, new Date(item.endsAt).getTime() - Date.now()));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [item.endsAt]);

  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const saved = Math.max(0, item.originalPrice - item.salePrice);
  const image = assetUrl(item.imageUrl);

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative flex aspect-square items-center justify-center rounded-xl bg-slate-50 p-3">
        {saved > 0 && <span className="absolute left-2 top-2 rounded bg-emerald-700 px-2 py-1 text-[10px] font-bold text-white">Save: {money(saved)}</span>}
        <img src={image} alt={item.productName} className="h-full w-full object-contain" />
      </div>
      <h3 className="mt-3 line-clamp-2 min-h-9 text-xs font-bold text-slate-800">{item.productName}</h3>
      <div className="mt-2 flex items-baseline gap-2"><strong className="text-sm font-black text-red-600">{money(item.salePrice)}</strong><span className="text-[10px] text-slate-400 line-through">{money(item.originalPrice)}</span></div>
      <div className="mt-3 grid grid-cols-4 divide-x rounded-lg border border-orange-200 bg-orange-50 py-1 text-center text-orange-700">
        {[[days, "Days"], [hours, "Hrs"], [minutes, "Min"], [seconds, "Sec"]].map(([value, label]) => <span key={String(label)}><strong className="block text-xs">{String(value).padStart(2, "0")}</strong><small className="text-[8px] uppercase">{label}</small></span>)}
      </div>
      <a href={`/product/${item.slug}`} className="mt-3 flex h-9 w-full items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-orange-500 to-orange-700 text-xs font-bold text-white hover:from-orange-600 hover:to-orange-800"><Zap className="h-3.5 w-3.5 fill-current" /> View Deal</a>
    </article>
  );
}

function FeaturedCategories({ categories }: { categories: Category[] }) {
  const roots = categories
    .filter((category) => category.isActive && category.isFeatured && !category.parentCategoryId)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .slice(0, 16);
  return (
    <section className="mt-12">
      <div className="text-center">
        <h2 className="text-2xl font-black text-slate-900">
          Featured Category
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Get Your Desired Product from Featured Category!
        </p>
      </div>
      <div className="mt-7 grid grid-cols-4 gap-2 sm:gap-3 md:grid-cols-6 lg:grid-cols-8">
        {roots.map((category) => (
          <a
            key={category.id}
            href={`/shop?category=${category.id}`}
            className="group flex min-h-[104px] flex-col items-center justify-center rounded-xl border border-transparent bg-white px-1.5 py-3 text-center shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-md sm:min-h-[134px] sm:rounded-2xl sm:px-3 sm:py-5"
          >
            <CategoryIcon category={category} />
            <span className="mt-2 line-clamp-2 text-[10px] font-medium leading-tight text-slate-800 group-hover:text-orange-600 sm:mt-4 sm:text-sm">
              {category.name}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}

function CategoryIcon({ category }: { category: Category }) {
  const [imageFailed, setImageFailed] = useState(false);
  if (category.imageUrl && !imageFailed)
    return (
      <img
        src={assetUrl(category.imageUrl)}
        alt=""
        onError={() => setImageFailed(true)}
        className="h-11 w-11 object-contain"
      />
    );
  const name = category.name.toLowerCase();
  const Icon =
    name.includes("air") || name.includes("ac")
      ? AirVent
      : name.includes("power") || name.includes("battery")
        ? BatteryCharging
        : name.includes("camera")
          ? Camera
          : name.includes("head") || name.includes("ear")
            ? Headphones
            : name.includes("monitor")
              ? Monitor
              : name.includes("fridge")
                ? Refrigerator
                : name.includes("phone")
                  ? Smartphone
                  : name.includes("tv")
                    ? Tv
                    : name.includes("watch")
                      ? Watch
                      : name.includes("food") || name.includes("fryer")
                        ? Utensils
                        : name.includes("torch")
                          ? Zap
                          : Monitor;
  return <Icon className="h-11 w-11 stroke-[1.5] text-slate-800" />;
}

function Trust({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Truck;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <Icon className="h-5 w-5 text-orange-600" />
      <p className="mt-3 text-sm font-black">{title}</p>
      <p className="mt-1 text-xs text-slate-500">{text}</p>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-10 bg-[#07111f] text-white">
      <div className="mx-auto max-w-[1440px] px-4 py-10 md:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <p className="text-xl font-black">DEXORA</p>
            <p className="mt-3 text-sm leading-6 text-white/50">
              Technology, gaming and everyday essentials.
            </p>
          </div>
          <div>
            <p className="font-bold">Store</p>
            <a href="/shop" className="mt-3 block text-sm text-white/50">
              All Products
            </a>
          </div>
          <div>
            <p className="font-bold">Account</p>
            <a href="/account" className="mt-3 block text-sm text-white/50">
              My Account
            </a>
            <a href="/login" className="mt-2 block text-sm text-white/50">
              Sign In
            </a>
          </div>
          <div>
            <p className="font-bold">Support</p>
            <p className="mt-3 text-sm text-white/50">
              Fast delivery • Genuine products • Customer first
            </p>
          </div>
        </div>
        <div className="mt-8 border-t border-white/10 pt-5 text-xs text-white/35">
          © {new Date().getFullYear()} Dexora Technologies. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
