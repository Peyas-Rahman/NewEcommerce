import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  GitCompareArrows,
  Heart,
  Search,
  ShoppingCart,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Header from "../../../components/layout/Header";
import productService from "../../../services/productService";
import { getAllCategories } from "../../../services/categoryService";
import { addItem } from "../../../services/cartService";
import customerService from "../../../services/customerService";
import {
  toggleCompare,
  toggleWishlist,
} from "../../../services/shoppingListService";
import { assetUrl } from "../../../services/media";
import type { Product } from "../../../types/product";
import type { Category } from "../../../types/category";
import { getFlashSales, type FlashSale } from "../../../services/flashSaleService";

const money = (value: number) =>
  `৳${new Intl.NumberFormat("en-BD").format(value || 0)}`;

const getPriceDetails = (product: Product, flashSalePrice?: number) => {
  const currentPrice = flashSalePrice ?? product.effectivePrice ?? product.discountPrice ?? product.price;
  const previousPrice = product.price > currentPrice ? product.price : null;
  const savedAmount = previousPrice ? previousPrice - currentPrice : 0;
  const discountPercentage = previousPrice ? Math.round((savedAmount / previousPrice) * 100) : 0;

  return { currentPrice, previousPrice, savedAmount, discountPercentage };
};

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [query, setQuery] = useState(
    () => new URLSearchParams(window.location.search).get("search") || "",
  );
  const [category, setCategory] = useState(
    () => new URLSearchParams(window.location.search).get("category") || "",
  );
  const [offer] = useState(
    () => new URLSearchParams(window.location.search).get("offer") || "",
  );
  const [deal] = useState(
    () => new URLSearchParams(window.location.search).get("deal") || "",
  );
  const [newArrivals] = useState(
    () => new URLSearchParams(window.location.search).get("new") === "true",
  );
  const [flashSaleOnly] = useState(
    () => new URLSearchParams(window.location.search).get("flashSale") === "true",
  );
  const [sort, setSort] = useState("featured");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [quickProduct, setQuickProduct] = useState<Product | null>(null);
  const [quickDetails, setQuickDetails] = useState<any>(null);
  const [quickLoading, setQuickLoading] = useState(false);

  useEffect(() => {
    Promise.all([productService.getAll(), getAllCategories(), getFlashSales(true)])
      .then(([items, groups, sales]) => {
        setProducts(items);
        setCategories(groups);
        setFlashSales(sales);
      })
      .catch((error: any) =>
        setNotice(error?.message || "Unable to load products"),
      )
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    const updateSearch = (event: Event) =>
      setQuery((event as CustomEvent<string>).detail || "");
    window.addEventListener("dexora-search-updated", updateSearch);
    return () =>
      window.removeEventListener("dexora-search-updated", updateSearch);
  }, []);
  const categoryIds = useMemo(
    () => getCategoryTreeIds(categories, category),
    [categories, category],
  );
  const filtered = useMemo(
    () =>
      products
        .filter(
          (product) =>
            product.isActive &&
            (!flashSaleOnly || flashSales.some((sale) => sale.productId === product.id)) &&
            (!offer || (product.discountPrice != null && product.discountPrice < product.price)) &&
            (!deal || (product.discountPrice != null && product.discountPrice < product.price)) &&
            (!newArrivals || product.isNewArrival) &&
            (!query ||
              `${product.name} ${product.sku} ${product.brandName || ""}`
                .toLowerCase()
                .includes(query.toLowerCase())) &&
            (!category || categoryIds.has(product.categoryId)),
        )
        .sort((a, b) =>
          flashSaleOnly
            ? (flashSales.find((sale) => sale.productId === a.id)?.sortOrder ?? 0) -
              (flashSales.find((sale) => sale.productId === b.id)?.sortOrder ?? 0)
            : sort === "price-low"
            ? getPriceDetails(a, flashSales.find((sale) => sale.productId === a.id)?.salePrice).currentPrice -
              getPriceDetails(b, flashSales.find((sale) => sale.productId === b.id)?.salePrice).currentPrice
            : sort === "price-high"
              ? getPriceDetails(b, flashSales.find((sale) => sale.productId === b.id)?.salePrice).currentPrice -
                getPriceDetails(a, flashSales.find((sale) => sale.productId === a.id)?.salePrice).currentPrice
              : sort === "new"
                ? Number(b.isNewArrival) - Number(a.isNewArrival)
                : Number(b.isFeatured) - Number(a.isFeatured),
        ),
    [products, query, category, categoryIds, sort, offer, deal, newArrivals, flashSaleOnly, flashSales],
  );
  const addToCart = async (product: Product, quantity = 1) => {
    try {
      const variant = product.variants?.find((item) => item.isActive);
      await addItem(product.id, variant?.id, quantity);
      setNotice(`${product.name} added to cart`);
    } catch (error: any) {
      setNotice(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to add to cart",
      );
    }
  };
  const addToWishlist = async (product: Product) => {
    try {
      toggleWishlist(product.id);
      if (customerService.isLoggedIn())
        await customerService.addWishlist(product.id);
      setNotice("Added to wishlist");
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "Unable to update wishlist");
    }
  };
  const addToCompare = (product: Product) => {
    try {
      toggleCompare(product.id);
      setNotice("Added to compare");
    } catch (error: any) {
      setNotice(error.message);
    }
  };
  const openQuickView = async (product: Product) => {
    setQuickProduct(product);
    setQuickLoading(true);
    const flashSalePrice = flashSales.find((sale) => sale.productId === product.id)?.salePrice;
    try {
      const details = await productService.getDetails(product.id);
      setQuickDetails(
        flashSalePrice ? { ...details, effectivePrice: flashSalePrice } : details,
      );
    } catch {
      setQuickDetails(
        flashSalePrice ? { ...product, effectivePrice: flashSalePrice } : product,
      );
    } finally {
      setQuickLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Header />
      <main className="mx-auto max-w-[1440px] px-4 py-8 md:px-6">
        <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-[#ff6b00]">
              Dexora Store
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
              {flashSaleOnly ? "Flash Sale" : newArrivals ? "New Arrivals" : offer || deal ? "Deals & Offers" : "Shop all products"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {flashSaleOnly ? "Limited-time prices, available while stock lasts." : newArrivals ? "Discover the latest products in our collection." : offer || deal ? "Save more on selected products while stocks last." : "Technology, gaming and everyday essentials."}
            </p>
          </div>
          <div className="relative w-full md:w-[360px]">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 text-sm outline-none focus:border-orange-400"
              placeholder="Search products..."
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-3"
              >
                <X className="h-4 w-4 text-slate-400" />
              </button>
            )}
          </div>
        </div>
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </div>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="featured">Featured</option>
            <option value="new">New arrivals</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
        {notice && (
          <div className="mb-5 rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm text-orange-700">
            {notice}
          </div>
        )}
        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-80 animate-pulse rounded-2xl bg-white"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((product) => (
              <article
                key={product.id}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                {(() => {
                  const pricing = getPriceDetails(
                    product,
                    flashSales.find((sale) => sale.productId === product.id)?.salePrice,
                  );
                  return (
                    <>
                <div className="relative aspect-square overflow-hidden bg-slate-50">
                  {pricing.previousPrice && <span className="absolute left-0 top-3 z-10 bg-purple-700 px-2 py-1 text-[10px] font-bold text-white">Save: {money(pricing.savedAmount)} (-{pricing.discountPercentage}%)</span>}
                  <a href={`/product/${product.slug}`}>
                    <img
                      src={assetUrl(
                        product.images?.find((item) => item.isPrimary)
                          ?.imageUrl || product.images?.[0]?.imageUrl,
                      )}
                      alt={product.name}
                      className="h-full w-full object-contain p-5 transition duration-500 group-hover:scale-105"
                    />
                  </a>
                  <div className="absolute right-3 top-3 flex gap-2">
                    <button
                      aria-label="Quick view"
                      onClick={() => void openQuickView(product)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow"
                    >
                      <Eye className="h-4 w-4 text-slate-600" />
                    </button>
                    <button
                      aria-label="Add to wishlist"
                      onClick={() => void addToWishlist(product)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow"
                    >
                      <Heart className="h-4 w-4 text-slate-500" />
                    </button>
                    <button
                      aria-label="Add to compare"
                      onClick={() => addToCompare(product)}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow"
                    >
                      <GitCompareArrows className="h-4 w-4 text-slate-500" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <a href={`/product/${product.slug}`}>
                    <p className="line-clamp-2 min-h-10 text-sm font-semibold text-slate-800">
                      {product.name}
                    </p>
                  </a>
                  <p className="mt-2 text-xs text-slate-400">
                    {product.brandName || product.categoryName}
                  </p>
                  <div className="mt-3 flex flex-wrap items-baseline gap-2"><p className="text-lg font-black text-red-600">{money(pricing.currentPrice)}</p>{pricing.previousPrice && <p className="text-xs text-slate-500 line-through">{money(pricing.previousPrice)}</p>}</div>
                </div>
                <div className="px-4 pb-4">
                  <button
                    onClick={() => void addToCart(product)}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#ff6b00] text-xs font-bold text-white hover:bg-[#e65f00]"
                  >
                    <ShoppingCart className="h-4 w-4" /> Add to Cart
                  </button>
                </div>
                    </>
                  );
                })()}
              </article>
            ))}
          </div>
        )}
        {!loading && !filtered.length && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-20 text-center">
            <p className="font-bold text-slate-700">No products found</p>
            <p className="mt-1 text-sm text-slate-400">
              Try another search or category.
            </p>
          </div>
        )}
      </main>
      {quickProduct && (
        <QuickView
          product={quickDetails || quickProduct}
          loading={quickLoading}
          onClose={() => {
            setQuickProduct(null);
            setQuickDetails(null);
          }}
          onCart={() => void addToCart(quickDetails || quickProduct)}
          onWishlist={() => void addToWishlist(quickDetails || quickProduct)}
          onCompare={() => addToCompare(quickDetails || quickProduct)}
        />
      )}
    </div>
  );
}

function getCategoryTreeIds(categories: Category[], selectedId: string) {
  if (!selectedId) return new Set<number>();
  const rootId = Number(selectedId);
  const ids = new Set<number>([rootId]);
  const visit = (parentId: number) => {
    categories
      .filter((item) => item.parentCategoryId === parentId)
      .forEach((item) => {
        if (!ids.has(item.id)) {
          ids.add(item.id);
          visit(item.id);
        }
      });
  };
  visit(rootId);
  const selected = categories.find((item) => item.id === rootId);
  const visitTree = (items?: Category[]) =>
    items?.forEach((item) => {
      ids.add(item.id);
      visitTree(item.children);
    });
  visitTree(selected?.children);
  return ids;
}

function QuickView({
  product,
  loading,
  onClose,
  onCart,
  onWishlist,
  onCompare,
}: {
  product: any;
  loading: boolean;
  onClose: () => void;
  onCart: () => void;
  onWishlist: () => void;
  onCompare: () => void;
}) {
  const [image, setImage] = useState(0);
  const images = [...(product.images || [])].sort(
    (a: any, b: any) =>
      Number(b.isPrimary) - Number(a.isPrimary) ||
      (a.sortOrder || 0) - (b.sortOrder || 0),
  );
  useEffect(() => setImage(0), [product.id]);
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Product quick view"
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.24)]"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-orange-600">
            Quick View
          </p>
          <button
            aria-label="Close quick view"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center text-slate-400">
            Loading product details...
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 gap-7 overflow-y-auto p-4 md:grid-cols-2 md:overflow-hidden md:p-7">
            <div>
              <div className="flex min-h-[220px] items-center justify-center rounded-2xl bg-slate-50 p-4 md:min-h-[320px] md:p-5">
                <img
                  src={assetUrl(images[image]?.imageUrl)}
                  alt={product.name}
                  className="max-h-[230px] w-full object-contain md:max-h-[350px]"
                />
              </div>
              {images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {images.map((item: any, index: number) => (
                    <button
                      key={item.id || item.imageUrl}
                      onClick={() => setImage(index)}
                      className={`h-16 w-16 shrink-0 rounded-lg border-2 p-1 ${image === index ? "border-orange-500" : "border-transparent"}`}
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
            <div className="flex min-h-0 flex-col md:pr-2">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-orange-600">
                {product.brandName || "Dexora"}
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-900">
                {product.name}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                SKU: {product.sku || "-"}
              </p>
              <p className="mt-5 text-3xl font-black text-slate-900">
                {money(
                  product.effectivePrice ??
                    product.discountPrice ??
                    product.price,
                )}
              </p>
              {product.shortDescription && (
                <div
                  className="prose prose-sm mt-4 max-h-[180px] max-w-none overflow-y-auto pr-2 text-slate-600 [scrollbar-width:thin] md:max-h-[220px]"
                  dangerouslySetInnerHTML={{ __html: product.shortDescription }}
                />
              )}
              <div className="mt-6 flex shrink-0 flex-wrap gap-2">
                <button
                  onClick={onCart}
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 text-sm font-bold text-white"
                >
                  <ShoppingCart className="h-4 w-4" /> Add to Cart
                </button>
                <button
                  aria-label="Add to wishlist"
                  onClick={onWishlist}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200"
                >
                  <Heart className="h-5 w-5" />
                </button>
                <button
                  aria-label="Add to compare"
                  onClick={onCompare}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200"
                >
                  <GitCompareArrows className="h-5 w-5" />
                </button>
              </div>
              <a
                href={`/product/${product.slug}`}
                className="mt-4 text-center text-sm font-bold text-orange-600"
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
