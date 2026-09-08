import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  GitCompareArrows,
  Heart,
  HelpCircle,
  ListChecks,
  MessageCircle,
  Minus,
  Plus,
  Star,
  ShoppingCart,
  X,
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
import { getFlashSales } from "../../../services/flashSaleService";
import {
  createProductQuestion,
  createProductReview,
  getProductQuestions,
  getProductReviews,
  type ProductQuestion,
  type ProductReview,
} from "../../../services/productFeedbackService";

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
  const [flashSalePrice, setFlashSalePrice] = useState<number | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"specification" | "description" | "questions" | "reviews">("specification");
  const [similarProducts, setSimilarProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [questionText, setQuestionText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  useEffect(() => {
    const detailsRequest = /^\d+$/.test(slug)
      ? productService.getDetails(Number(slug))
      : productService.getDetailsBySlug(slug);

    detailsRequest
      .then((data) => {
        setProduct(data);
        setVariant(data?.variants?.find((item: any) => item.isActive));
        Promise.all([getProductReviews(data.id), getProductQuestions(data.id)])
          .then(([reviewItems, questionItems]) => {
            setReviews(reviewItems);
            setQuestions(questionItems);
          })
          .catch(() => {
            setReviews([]);
            setQuestions([]);
          });
        productService.getAll().then((items) =>
          setSimilarProducts(
            items
              .filter((item: any) => item.id !== data.id && item.categoryId === data.categoryId)
              .slice(0, 4),
          ),
        ).catch(() => setSimilarProducts([]));
        return getFlashSales(true).then((sales) =>
          setFlashSalePrice(sales.find((sale) => sale.productId === data.id)?.salePrice ?? null),
        );
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
    flashSalePrice ??
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
  const submitQuestion = async () => {
    if (!customerService.isLoggedIn()) {
      setNotice("Please log in to ask a question.");
      return;
    }
    if (!questionText.trim()) {
      setNotice("Please enter your question.");
      return;
    }
    try {
      setFeedbackBusy(true);
      const question = await createProductQuestion(product.id, { question: questionText.trim() });
      setQuestions((items) => [question, ...items]);
      setQuestionText("");
      setNotice("Your question has been submitted.");
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "Unable to submit question.");
    } finally {
      setFeedbackBusy(false);
    }
  };
  const submitReview = async () => {
    if (!customerService.isLoggedIn()) {
      setNotice("Please log in to write a review.");
      return;
    }
    if (!reviewComment.trim()) {
      setNotice("Please write a review comment.");
      return;
    }
    try {
      setFeedbackBusy(true);
      const review = await createProductReview(product.id, {
        rating: reviewRating,
        title: reviewTitle.trim(),
        comment: reviewComment.trim(),
      });
      setReviews((items) => [review, ...items]);
      setReviewTitle("");
      setReviewComment("");
      setNotice("Your review has been submitted.");
    } catch (error: any) {
      setNotice(error?.response?.data?.message || "Unable to submit review.");
    } finally {
      setFeedbackBusy(false);
    }
  };
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f8fa]">
      <Header />
      <Toast
        message={notice}
        onClose={() => setNotice("")}
        title="Product feedback"
        actionHref=""
      />
      <main className="mx-auto max-w-[1280px] px-4 py-8 md:px-6">
        <a
          href="/shop"
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-slate-500"
        >
          <ArrowLeft className="h-4 w-4" /> Back to shop
        </a>
        <div className="grid min-w-0 gap-8 rounded-3xl border border-slate-200 bg-white p-5 md:grid-cols-2 md:p-8">
          <div className="min-w-0">
            <div className="relative flex min-h-[420px] items-center justify-center rounded-2xl bg-slate-50 p-6">
              <button
                type="button"
                onClick={() => setViewerOpen(true)}
                aria-label="View product image"
                className="flex h-full w-full cursor-zoom-in items-center justify-center"
              >
                <img
                  src={assetUrl(images[image]?.imageUrl)}
                  alt={product.name}
                  className="max-h-[520px] w-full object-contain"
                />
              </button>
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
            <h1 className="mt-2 text-2xl font-black leading-tight text-slate-900 md:text-3xl">
              {product.name}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              SKU: {variant?.sku || product.sku}
            </p>
            {product.variants?.length > 0 && (
              <div className="mt-5">
                <h2 className="text-sm font-bold text-slate-900">Choose a variant</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.variants.map((item: any) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setVariant(item)}
                      className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${variant?.id === item.id ? "border-orange-600 bg-orange-50 text-orange-700" : "border-slate-200 bg-white text-slate-700 hover:border-orange-300"}`}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 md:p-8">
            <div className="flex gap-2 overflow-x-auto border-b border-slate-100 pb-3">
              {([
                ["specification", "Specification", ListChecks],
                ["description", "Description", MessageCircle],
                ["questions", "Questions", HelpCircle],
                ["reviews", "Reviews", Star],
              ] as const).map(([key, label, Icon]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${activeTab === key ? "bg-orange-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>

            {activeTab === "specification" && (
              <div className="mt-6">
                <h2 className="text-xl font-black text-slate-900">Product Specification</h2>
                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
                  {[
                    ["Product code", product.sku || product.id],
                    ["Category", product.categoryName || "-"],
                    ["Brand", product.brandName || "-"],
                    ["Warranty", product.warranty || "-"],
                    ["Available variants", product.variants?.length || 0],
                    ["Availability", product.isInStock ? "In stock" : "Out of stock"],
                  ].map(([label, value], index) => (
                    <div key={String(label)} className={`grid grid-cols-[minmax(130px,0.7fr)_1fr] gap-4 px-4 py-3 text-sm ${index % 2 === 0 ? "bg-slate-50" : "bg-white"}`}>
                      <span className="font-semibold text-slate-500">{label}</span>
                      <span className="font-medium text-slate-800">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "description" && (
              <div className="mt-6">
                <h2 className="text-xl font-black text-slate-900">Product Description</h2>
                {product.description ? (
                  <div className="product-rich-text prose prose-sm mt-4 max-w-none break-words text-slate-600" dangerouslySetInnerHTML={{ __html: product.description }} />
                ) : (
                  <p className="mt-4 text-sm text-slate-500">No detailed description is available for this product yet.</p>
                )}
              </div>
            )}

            {activeTab === "questions" && (
              <div className="mt-6">
                <h2 className="text-xl font-black text-slate-900">Questions ({questions.length})</h2>
                <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                  <textarea value={questionText} onChange={(event) => setQuestionText(event.target.value)} placeholder="Ask about this product..." className="min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-orange-400" />
                  <button type="button" disabled={feedbackBusy} onClick={() => void submitQuestion()} className="mt-3 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{feedbackBusy ? "Submitting..." : "Ask a question"}</button>
                </div>
                <div className="mt-5 space-y-4">
                  {questions.length === 0 ? <p className="text-sm text-slate-500">No questions yet. Be the first to ask.</p> : questions.map((item) => (
                    <article key={item.id} className="rounded-2xl border border-slate-100 p-4">
                      <p className="font-bold text-slate-800">{item.question}</p>
                      <p className="mt-1 text-xs text-slate-400">Asked by {item.customerName}</p>
                      {item.answer && <div className="mt-3 rounded-xl bg-blue-50 p-3 text-sm text-slate-700"><strong>Answer:</strong> {item.answer}</div>}
                    </article>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="mt-6">
                <h2 className="text-xl font-black text-slate-900">Reviews ({reviews.length})</h2>
                <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => <button key={rating} type="button" aria-label={`${rating} stars`} onClick={() => setReviewRating(rating)} className="p-1"><Star className={`h-6 w-6 ${rating <= reviewRating ? "fill-orange-400 text-orange-400" : "text-slate-300"}`} /></button>)}
                  </div>
                  <input value={reviewTitle} onChange={(event) => setReviewTitle(event.target.value)} placeholder="Review title (optional)" className="mt-3 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-orange-400" />
                  <textarea value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} placeholder="Share your experience..." className="mt-3 min-h-24 w-full resize-y rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none focus:border-orange-400" />
                  <button type="button" disabled={feedbackBusy} onClick={() => void submitReview()} className="mt-3 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{feedbackBusy ? "Submitting..." : "Write a review"}</button>
                </div>
                <div className="mt-5 space-y-4">
                  {reviews.length === 0 ? <p className="text-sm text-slate-500">No reviews yet. Share your experience first.</p> : reviews.map((item) => (
                    <article key={item.id} className="rounded-2xl border border-slate-100 p-4">
                      <div className="flex items-center gap-1">{[1, 2, 3, 4, 5].map((rating) => <Star key={rating} className={`h-4 w-4 ${rating <= item.rating ? "fill-orange-400 text-orange-400" : "text-slate-300"}`} />)}</div>
                      {item.title && <h3 className="mt-2 font-bold text-slate-800">{item.title}</h3>}
                      <p className="mt-1 text-sm text-slate-600">{item.comment}</p>
                      <p className="mt-2 text-xs text-slate-400">By {item.customerName}</p>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5">
            <h2 className="text-lg font-black text-slate-900">Similar Products</h2>
            <div className="mt-4 space-y-4">
              {similarProducts.length > 0 ? similarProducts.map((item: any) => (
                <a key={item.id} href={`/product/${item.slug}`} className="flex gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-50 p-2">
                    <img src={assetUrl(item.images?.[0]?.imageUrl)} alt="" className="h-full w-full object-contain" />
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-bold text-slate-800">{item.name}</p>
                    <p className="mt-1 text-sm font-black text-orange-600">{money(item.discountPrice ?? item.price)}</p>
                  </div>
                </a>
              )) : <p className="text-sm text-slate-500">No similar products found.</p>}
            </div>
          </aside>
        </section>
      </main>
      {viewerOpen && images.length > 0 && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 p-4 md:p-8"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setViewerOpen(false);
          }}
        >
          <button
            type="button"
            aria-label="Close image viewer"
            onClick={() => setViewerOpen(false)}
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>
          {images.length > 1 && (
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => setImage((current) => (current === 0 ? images.length - 1 : current - 1))}
              className="absolute left-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20 md:left-8"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}
          <div className="flex max-h-full max-w-5xl flex-col items-center gap-4">
            <img
              src={assetUrl(images[image]?.imageUrl)}
              alt={product.name}
              className="max-h-[72vh] max-w-full object-contain"
            />
            {images.length > 1 && (
              <div className="flex max-w-full gap-2 overflow-x-auto rounded-xl bg-black/20 p-2">
                {images.map((item: any, index: number) => (
                  <button
                    key={item.id || item.imageUrl}
                    type="button"
                    onClick={() => setImage(index)}
                    className={`h-16 w-16 shrink-0 rounded-lg bg-white/90 p-1 ${image === index ? "ring-2 ring-orange-500" : "opacity-70 hover:opacity-100"}`}
                  >
                    <img src={assetUrl(item.imageUrl)} alt="" className="h-full w-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>
          {images.length > 1 && (
            <button
              type="button"
              aria-label="Next image"
              onClick={() => setImage((current) => (current + 1) % images.length)}
              className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20 md:right-8"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
