import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  GitCompareArrows,
  Heart,
  Minus,
  Plus,
  ShoppingCart,
} from "lucide-react";
import Header from "../../../components/layout/Header";
import Toast from "../../../components/ui/Toast";
import productService from "../../../services/productService";
import customerService from "../../../services/customerService";
import { addItem } from "../../../services/cartService";
import {
  toggleCompare,
  toggleWishlist,
} from "../../../services/shoppingListService";
import { assetUrl } from "../../../services/media";

const money = (value: number) =>
  `৳${new Intl.NumberFormat("en-BD").format(value || 0)}`;

const getPriceDetails = (product: any, price: number) => {
  const previousPrice = product.price > price ? product.price : null;
  const savedAmount = previousPrice ? previousPrice - price : 0;
  const discountPercentage = previousPrice
    ? Math.round((savedAmount / previousPrice) * 100)
    : 0;

  return { previousPrice, savedAmount, discountPercentage };
};

export default function ProductDetailsPage({ slug }: { slug: string }) {
  const [product, setProduct] = useState<any>();
  const [notice, setNotice] = useState("");
  const [variant, setVariant] = useState<any>();
  const [image, setImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const detailsRequest = /^\d+$/.test(slug)
      ? productService.getDetails(Number(slug))
      : productService.getDetailsBySlug(slug);

    detailsRequest
      .then((data) => {
        setProduct(data);
        setVariant(data?.variants?.find((item: any) => item.isActive));
      })
      .catch((error: any) => setNotice(error?.message || "Product not found"));
  }, [slug]);
  const images = useMemo(
    () =>
      [...(product?.images || [])].sort(
        (a: any, b: any) =>
          Number(b.isPrimary) - Number(a.isPrimary) ||
          (a.sortOrder || 0) - (b.sortOrder || 0),
      ),
    [product],
  );
  if (!product)
    return (
      <>
        <Header />
        <div className="py-20 text-center text-slate-500">
          {notice || "Loading product..."}
        </div>
      </>
    );
  const price =
    variant?.discountPrice ??
    variant?.price ??
    product.effectivePrice ??
    product.discountPrice ??
    product.price;
  const pricing = getPriceDetails(product, price);
  const addCart = async () => {
    try {
      setBusy(true);
      await addItem(product.id, variant?.id, quantity);
      setNotice(`${product.name} added to your cart`);
      return true;
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "Unable to add to cart");
      return false;
    } finally {
      setBusy(false);
    }
  };
  const wishlist = async () => {
    try {
      toggleWishlist(product.id);
      if (customerService.isLoggedIn())
        await customerService.addWishlist(product.id);
      setNotice("Product added to wishlist");
    } catch {
      setNotice("Unable to update wishlist");
    }
  };
  const compare = () => {
    try {
      toggleCompare(product.id);
      setNotice("Product added to compare");
    } catch (error: any) {
      setNotice(error.message);
    }
  };
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f8fa]">
      <Header />
      <Toast message={notice} onClose={() => setNotice("")} />
      <main className="mx-auto max-w-[1280px] px-4 py-8 md:px-6">
        <a
          href="/shop"
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500"
        >
          <ArrowLeft className="h-4 w-4" /> Back to shop
        </a>
        <div className="grid min-w-0 gap-8 rounded-3xl border border-slate-200 bg-white p-5 md:grid-cols-2 md:p-8">
          <div className="min-w-0">
            <div className="flex min-h-[420px] items-center justify-center rounded-2xl bg-slate-50 p-6">
              <img
                src={assetUrl(images[image]?.imageUrl)}
                alt={product.name}
                className="max-h-[520px] w-full object-contain"
              />
            </div>
            <div className="mt-4 flex gap-3 overflow-x-auto">
              {images.map((item: any, index: number) => (
                <button
                  key={item.id || item.imageUrl}
                  onClick={() => setImage(index)}
                  className={`h-20 w-20 shrink-0 rounded-xl border-2 bg-slate-50 p-1 ${image === index ? "border-orange-500" : "border-transparent"}`}
                >
                  <img
                    src={assetUrl(item.imageUrl)}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <p className="text-xs font-bold uppercase tracking-[.18em] text-orange-600">
              {product.brandName || "Dexora"}
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-900 md:text-4xl">
              {product.name}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              SKU: {variant?.sku || product.sku}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-600">
              <span className="rounded-full bg-slate-100 px-3 py-2">Price: <strong className="text-slate-900">{money(price)}</strong>{pricing.previousPrice && <span className="ml-1 line-through">{money(pricing.previousPrice)}</span>}</span>
              {pricing.previousPrice && <span className="rounded-full bg-emerald-50 px-3 py-2 text-emerald-700">Save: <strong>{money(pricing.savedAmount)}</strong> (-{pricing.discountPercentage}%)</span>}
              <span className="rounded-full bg-slate-100 px-3 py-2">Regular Price: <strong className="text-slate-900">{money(product.price)}</strong></span>
              <span className={`rounded-full px-3 py-2 ${product.isInStock === false ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>Status: <strong>{product.isInStock === false ? "Out of Stock" : "In Stock"}</strong></span>
              <span className="rounded-full bg-slate-100 px-3 py-2">Product Code: <strong className="text-slate-900">{product.sku || product.id}</strong></span>
              {product.brandName && <span className="rounded-full bg-slate-100 px-3 py-2">Brand: <strong className="text-slate-900">{product.brandName}</strong></span>}
            </div>
            <p className="mt-6 text-3xl font-black text-slate-900">{money(price)}</p>
            {product.shortDescription && (
              <div className="mt-5">
                <h2 className="text-lg font-bold text-slate-900">Key Features</h2>
                <div className="product-rich-text prose prose-sm mt-2 max-w-full break-words text-slate-600" dangerouslySetInnerHTML={{ __html: product.shortDescription }} />
              </div>
            )}
            <div className="mt-7 flex flex-wrap gap-3">
              <div className="flex h-12 shrink-0 items-center rounded-xl border border-slate-200">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-3"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                disabled={busy}
                onClick={() => void addCart()}
                className="flex h-12 min-w-[150px] flex-1 items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-bold text-white disabled:opacity-60"
              >
                <ShoppingCart className="h-5 w-5" />
                {busy ? "Adding..." : "Add to Cart"}
              </button>
              <button
                disabled={busy || product.isInStock === false}
                onClick={() => {
                  void addCart().then((added) => {
                    if (added) window.location.href = "/checkout";
                  });
                }}
                className="h-12 min-w-[110px] flex-1 rounded-xl bg-[#3f51b5] px-4 text-sm font-bold text-white disabled:opacity-60 sm:flex-none"
              >
                Buy Now
              </button>
              <button
                aria-label="Add to wishlist"
                onClick={() => void wishlist()}
                className="h-12 w-12 shrink-0 rounded-xl border border-slate-200"
              >
                <Heart className="mx-auto h-5 w-5" />
              </button>
              <button
                aria-label="Add to compare"
                onClick={compare}
                className="h-12 w-12 shrink-0 rounded-xl border border-slate-200"
              >
                <GitCompareArrows className="mx-auto h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
        {product.description && (
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 md:p-8">
            <h2 className="text-xl font-black text-slate-900">Product Description</h2>
            <div
              className="product-rich-text prose prose-sm mt-4 max-w-none break-words text-slate-600"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </section>
        )}
      </main>
    </div>
  );
}
