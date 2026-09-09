import { useEffect, useMemo, useRef, useState } from "react";
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Loader2,
  Minus,
  Plus,
  Printer,
  RotateCcw,
  ScanBarcode,
  Search,
  ShoppingCart,
  Smartphone,
  Trash2,
  User,
} from "lucide-react";
import productService from "../../../services/productService";
import orderService from "../../../services/orderService";
import { getAllCategories } from "../../../services/categoryService";
import { assetUrl } from "../../../services/media";
import type { Product, ProductVariant } from "../../../types/product";
import type { Category } from "../../../types/category";
import Barcode from "../../../components/ui/Barcode";

// =========================================================
// SHOP INFO (printed on the invoice)
// =========================================================

const SHOP = {
  name: "Dexora Technologies Ltd.",
  address: "Dhaka, Bangladesh",
  mobile: "01979812200",
  email: "info@dexora.com.bd",
  website: "www.dexora.com.bd",
};

// =========================================================
// TYPES
// =========================================================

type CartLine = {
  key: string;
  productId: number;
  variantId?: number | null;
  name: string;
  variantName?: string | null;
  sku: string;
  warranty?: string | null;
  unitPrice: number;
  quantity: number;
};

type ReceiptData = {
  orderNumber: string;
  date: Date;
  lines: CartLine[];
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  subTotal: number;
  discountAmount: number;
  deliveryCharge: number;
  grandTotal: number;
  paidAmount: number;
  changeAmount: number;
  note: string;
};

const money = (value: number) =>
  `৳${new Intl.NumberFormat("en-BD").format(value || 0)}`;

const plain = (value: number) =>
  new Intl.NumberFormat("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);

const getLinePrice = (product: Product, variant?: ProductVariant | null) => {
  if (variant && variant.price != null) {
    return variant.discountPrice != null && variant.discountPrice < variant.price
      ? variant.discountPrice
      : variant.price;
  }
  return product.effectivePrice ?? product.discountPrice ?? product.price;
};

const paymentMethods = [
  { label: "Cash", icon: Banknote },
  { label: "Card", icon: CreditCard },
  { label: "Mobile", icon: Smartphone },
];

// =========================================================
// COMPONENT
// =========================================================

export default function PosTerminal() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  const [cart, setCart] = useState<CartLine[]>([]);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [discountType, setDiscountType] = useState<"flat" | "percent">("flat");
  const [discountInput, setDiscountInput] = useState("");
  const [deliveryCharge, setDeliveryCharge] = useState("");
  const [paidInput, setPaidInput] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [note, setNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);

  // =========================================================
  // LOAD DATA
  // =========================================================

  useEffect(() => {
    productService
      .getAll()
      .then((data) => setProducts(data.filter((p) => p.isActive)))
      .catch(() => setError("Failed to load products."))
      .finally(() => setLoadingProducts(false));

    getAllCategories()
      .then((data) => setCategories(data.filter((c) => c.isActive)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // =========================================================
  // FILTERED PRODUCTS
  // =========================================================

  const filteredProducts = useMemo(() => {
    let list = products;

    if (activeCategory !== null) {
      list = list.filter((p) => p.categoryId === activeCategory);
    }

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const inProduct =
          p.name.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.categoryName?.toLowerCase().includes(q) ||
          p.brandName?.toLowerCase().includes(q);
        const inVariant = p.variants?.some(
          (v) =>
            v.name.toLowerCase().includes(q) ||
            v.sku?.toLowerCase().includes(q),
        );
        return inProduct || inVariant;
      });
    }

    return list;
  }, [products, search, activeCategory]);

  // =========================================================
  // TOTALS
  // =========================================================

  const subTotal = cart.reduce(
    (sum, line) => sum + line.unitPrice * line.quantity,
    0,
  );
  const totalItems = cart.reduce((sum, line) => sum + line.quantity, 0);

  const discountValue = Number(discountInput) || 0;
  const discountAmount = Math.min(
    discountType === "percent"
      ? Math.round((subTotal * discountValue) / 100)
      : discountValue,
    subTotal,
  );

  const delivery = Number(deliveryCharge) || 0;
  const grandTotal = subTotal - discountAmount + delivery;

  const paidAmount = paidInput === "" ? grandTotal : Number(paidInput) || 0;
  const changeAmount = Math.max(paidAmount - grandTotal, 0);
  const dueAmount = Math.max(grandTotal - paidAmount, 0);

  // =========================================================
  // CART ACTIONS
  // =========================================================

  const addToCart = (product: Product, variant?: ProductVariant | null) => {
    const key = variant ? `${product.id}:${variant.id}` : `${product.id}`;

    setCart((prev) => {
      const existing = prev.find((line) => line.key === key);
      if (existing) {
        return prev.map((line) =>
          line.key === key
            ? { ...line, quantity: line.quantity + 1 }
            : line,
        );
      }

      return [
        ...prev,
        {
          key,
          productId: product.id,
          variantId: variant?.id ?? null,
          name: product.name,
          variantName: variant?.name ?? null,
          sku: variant?.sku || product.sku,
          warranty: product.warranty ?? null,
          unitPrice: getLinePrice(product, variant),
          quantity: 1,
        },
      ];
    });
  };

  const handleScanEnter = () => {
    const q = search.trim().toLowerCase();
    if (!q) return;

    for (const product of products) {
      if (product.sku?.toLowerCase() === q) {
        addToCart(product, null);
        setSearch("");
        return;
      }
      const variant = product.variants?.find(
        (v) => v.sku?.toLowerCase() === q && v.isActive,
      );
      if (variant) {
        addToCart(product, variant);
        setSearch("");
        return;
      }
    }
  };

  const updateQuantity = (key: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((line) =>
          line.key === key
            ? { ...line, quantity: line.quantity + delta }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  };

  const setQuantity = (key: string, value: number) => {
    setCart((prev) =>
      prev
        .map((line) => (line.key === key ? { ...line, quantity: value } : line))
        .filter((line) => line.quantity > 0),
    );
  };

  const removeLine = (key: string) =>
    setCart((prev) => prev.filter((line) => line.key !== key));

  const clearSale = () => {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setDiscountInput("");
    setDeliveryCharge("");
    setPaidInput("");
    setNote("");
    setReceipt(null);
    setError(null);
  };

  // =========================================================
  // COMPLETE SALE
  // =========================================================

  const completeSale = async () => {
    if (!cart.length || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const order = await orderService.createOrder({
        customerId: null,
        guestName: customerName.trim() || "Walk-in Customer",
        guestPhone: customerPhone.trim() || null,
        guestEmail: null,
        shippingName: customerName.trim() || "Walk-in Customer",
        shippingPhone: customerPhone.trim() || "-",
        shippingAddress: "In-store sale (POS)",
        shippingCity: null,
        shippingArea: null,
        shippingPostalCode: null,
        paymentMethod,
        customerNote: note.trim() || null,
        couponCode: null,
        items: cart.map((line) => ({
          productId: line.productId,
          productVariantId: line.variantId ?? null,
          quantity: line.quantity,
        })),
      });

      if (!order) throw new Error("Order was not created.");

      await orderService
        .updateOrderStatus(order.id, "Confirmed", `POS ${paymentMethod} sale.`)
        .catch(() => {});

      setReceipt({
        orderNumber: order.orderNumber,
        date: new Date(),
        lines: cart,
        customerName: customerName.trim() || "Walk-in Customer",
        customerPhone: customerPhone.trim(),
        paymentMethod,
        subTotal,
        discountAmount,
        deliveryCharge: delivery,
        grandTotal,
        paidAmount,
        changeAmount,
        note: note.trim(),
      });
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Could not complete the sale. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const printReceipt = () => {
    // The document title becomes the suggested file name when saving
    // as PDF, e.g. "Invoice #ORD-20260909-00015.pdf"
    const previousTitle = document.title;
    document.title = receipt
      ? `Invoice #${receipt.orderNumber}`
      : "Invoice";
    window.print();
    const restore = () => {
      document.title = previousTitle;
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    setTimeout(restore, 3000);
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <>
      {/* ==================================================
          A4 INVOICE (print only)
      ================================================== */}
      {receipt && (
        <div
          id="pos-invoice"
          className="hidden bg-white p-3 print:block"
        >
          <div className="mx-auto max-w-[720px] text-[12.5px] leading-snug text-slate-900">
            {/* HEADER */}
            <div className="text-center">
              <h1 className="text-[26px] font-bold tracking-wide">
                {SHOP.name}
              </h1>
              <p>{SHOP.address}</p>
              <p className="font-semibold">Mobile: {SHOP.mobile}</p>
              <p>
                Email: {SHOP.email} , {SHOP.website}
              </p>
            </div>

            <h2 className="mt-3 text-center text-[17px] font-semibold">
              Invoice
            </h2>

            {/* META */}
            <div className="mt-2.5 flex items-start justify-between">
              <div>
                <p>
                  <span className="font-semibold">Invoice No.</span>{" "}
                  {receipt.orderNumber}
                </p>
                <p className="mt-0.5 font-semibold">Customer</p>
                <p>{receipt.customerName}</p>
                {receipt.customerPhone && (
                  <p>Mobile: {receipt.customerPhone}</p>
                )}
              </div>
              <p>
                <span className="font-semibold">Date</span>{" "}
                {receipt.date.toLocaleDateString("en-GB")}{" "}
                {receipt.date.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            {/* ITEMS */}
            <table className="mt-3.5 w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-800">
                  <th className="pb-1.5 text-left font-semibold">Product</th>
                  <th className="w-[110px] pb-1.5 text-center font-semibold">
                    Quantity
                  </th>
                  <th className="w-[100px] pb-1.5 text-right font-semibold">
                    Unit Price
                  </th>
                  <th className="w-[100px] pb-1.5 text-right font-semibold">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {receipt.lines.map((line) => (
                  <tr
                    key={line.key}
                    className="border-b border-slate-200 align-top"
                  >
                    <td className="py-2 pr-3">
                      <p>{line.name}</p>
                      {line.variantName && <p>{line.variantName}</p>}
                      <p className="text-slate-500">{line.sku}</p>
                      {line.warranty && (
                        <p className="font-semibold">
                          Warranty: {line.warranty}
                        </p>
                      )}
                    </td>
                    <td className="py-2 text-center whitespace-nowrap">
                      {line.quantity.toFixed(2)} Pc(s)
                    </td>
                    <td className="py-2 text-right whitespace-nowrap">
                      {plain(line.unitPrice)}
                    </td>
                    <td className="py-2 text-right whitespace-nowrap">
                      {plain(line.unitPrice * line.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* PAYMENT + TOTALS */}
            <div className="mt-4 flex items-start justify-between gap-8">
              {/* Payment summary */}
              <div className="min-w-[220px]">
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-slate-200">
                      <td className="py-1 font-semibold">
                        {receipt.paymentMethod}
                      </td>
                      <td className="py-1 whitespace-nowrap">
                        ৳{plain(receipt.paidAmount)}
                      </td>
                      <td className="py-1 pl-3 text-right text-slate-500">
                        {receipt.date.toLocaleDateString("en-GB")}
                      </td>
                    </tr>
                    <tr className="border-b border-slate-200">
                      <td className="py-1 font-semibold">Total Paid</td>
                      <td className="py-1 font-semibold whitespace-nowrap">
                        ৳{plain(receipt.paidAmount)}
                      </td>
                      <td className="py-1" />
                    </tr>
                  </tbody>
                </table>

                {receipt.changeAmount > 0 && (
                  <p className="mt-1.5 font-semibold">
                    Change Returned: ৳{plain(receipt.changeAmount)}
                  </p>
                )}
                {receipt.paidAmount < receipt.grandTotal && (
                  <p className="mt-1.5 font-semibold text-red-600">
                    Due: ৳{plain(receipt.grandTotal - receipt.paidAmount)}
                  </p>
                )}

                {receipt.note && (
                  <p className="mt-2 text-slate-500">Note: {receipt.note}</p>
                )}
              </div>

              {/* Totals */}
              <table className="min-w-[230px] border-separate border-spacing-x-2">
                <tbody>
                  <tr>
                    <td className="py-1 text-right font-semibold">
                      Subtotal:
                    </td>
                    <td className="py-1 pl-6 text-right whitespace-nowrap">
                      ৳ {plain(receipt.subTotal)}
                    </td>
                  </tr>
                  {receipt.discountAmount > 0 && (
                    <tr>
                      <td className="py-1 text-right font-semibold">
                        Discount:
                      </td>
                      <td className="py-1 pl-6 text-right whitespace-nowrap">
                        -৳ {plain(receipt.discountAmount)}
                      </td>
                    </tr>
                  )}
                  {receipt.deliveryCharge > 0 && (
                    <tr>
                      <td className="py-1 text-right font-semibold">
                        Delivery:
                      </td>
                      <td className="py-1 pl-6 text-right whitespace-nowrap">
                        ৳ {plain(receipt.deliveryCharge)}
                      </td>
                    </tr>
                  )}
                  <tr className="border-t border-slate-300">
                    <td className="py-1 text-right font-bold">Total:</td>
                    <td className="py-1 pl-6 text-right font-bold whitespace-nowrap">
                      ৳ {plain(receipt.grandTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* BARCODE */}
            <div className="mt-5 text-center">
              <Barcode
                value={receipt.orderNumber}
                height={42}
                className="mx-auto"
              />
              <p className="mt-1 text-[11px]">{receipt.orderNumber}</p>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          SCREEN
      ================================================== */}
      <div className="pos-screen space-y-4 print:hidden">
        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">POS Terminal</h1>
            <p className="text-[13px] text-slate-500">
              Search or scan products to build the bill.{" "}
              <kbd className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                F2
              </kbd>{" "}
              focuses search.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {receipt && (
              <button
                type="button"
                onClick={printReceipt}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-[13px] font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                <Printer size={15} />
                Print Invoice
              </button>
            )}
            <button
              type="button"
              onClick={clearSale}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50"
            >
              <RotateCcw size={15} />
              New Sale
            </button>
          </div>
        </div>

        {/* SUCCESS */}
        {receipt && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="text-emerald-600" size={20} />
              <div>
                <p className="text-[13px] font-bold text-emerald-800">
                  Sale completed — Invoice #{receipt.orderNumber}
                </p>
                <p className="text-xs text-emerald-700">
                  Total {money(receipt.grandTotal)} · Paid{" "}
                  {money(receipt.paidAmount)}
                  {receipt.changeAmount > 0 &&
                    ` · Change ${money(receipt.changeAmount)}`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={clearSale}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              <Plus size={14} />
              Next Sale
            </button>
          </div>
        )}

        {/* ERROR */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-[13px] font-medium text-red-700">
            {error}
          </div>
        )}

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* ================================================
              LEFT — PRODUCTS
          ================================================ */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Search */}
            <div className="border-b border-slate-100 p-3.5">
              <div className="relative">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleScanEnter();
                    }
                  }}
                  placeholder="Search product, SKU or scan barcode + Enter..."
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-10 text-[13px] outline-none transition focus:border-[#ff6b00] focus:bg-white"
                />
                <ScanBarcode
                  size={16}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300"
                />
              </div>
            </div>

            {/* Category tabs */}
            <div className="flex gap-1.5 overflow-x-auto border-b border-slate-100 px-3.5 py-2.5">
              <button
                type="button"
                onClick={() => setActiveCategory(null)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                  activeCategory === null
                    ? "bg-[#ff6b00] text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() =>
                    setActiveCategory(
                      activeCategory === category.id ? null : category.id,
                    )
                  }
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    activeCategory === category.id
                      ? "bg-[#ff6b00] text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* Product grid */}
            <div className="max-h-[56vh] overflow-y-auto p-3.5">
              {loadingProducts ? (
                <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-slate-400">
                  <Loader2 size={16} className="animate-spin" />
                  Loading products...
                </div>
              ) : !filteredProducts.length ? (
                <div className="py-16 text-center text-[13px] text-slate-400">
                  No products found.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 2xl:grid-cols-4">
                  {filteredProducts.map((product) => {
                    const primaryImage =
                      product.images?.find((img) => img.isPrimary) ??
                      product.images?.[0];
                    const activeVariants =
                      product.variants?.filter((v) => v.isActive) ?? [];
                    const inCart = cart.some(
                      (line) => line.productId === product.id,
                    );

                    return (
                      <div
                        key={product.id}
                        className={`relative flex flex-col overflow-hidden rounded-lg border bg-white transition hover:shadow-md ${
                          inCart
                            ? "border-[#ff6b00] ring-1 ring-[#ff6b00]/40"
                            : "border-slate-200 hover:border-[#ff6b00]/50"
                        }`}
                      >
                        {inCart && (
                          <span className="absolute right-1.5 top-1.5 z-10 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#ff6b00] text-[10px] font-bold text-white">
                            ✓
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            activeVariants.length === 1
                              ? addToCart(product, activeVariants[0])
                              : addToCart(product, null)
                          }
                          className="flex flex-1 flex-col text-left"
                        >
                          <div className="flex h-24 shrink-0 items-center justify-center border-b border-slate-100 bg-slate-50/60">
                            {primaryImage ? (
                              <img
                                src={assetUrl(primaryImage.imageUrl)}
                                alt={product.name}
                                className="max-h-full w-auto max-w-full object-contain p-2"
                                loading="lazy"
                              />
                            ) : (
                              <ShoppingCart
                                size={24}
                                className="text-slate-300"
                              />
                            )}
                          </div>

                          <div className="flex flex-1 flex-col p-2.5">
                            <p className="line-clamp-2 min-h-[2.1rem] text-[11px] font-semibold leading-tight text-slate-800">
                              {product.name}
                            </p>
                            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                              {product.sku}
                            </p>
                            <p className="mt-1 text-[13px] font-bold text-[#ff6b00]">
                              {money(getLinePrice(product, null))}
                            </p>
                          </div>
                        </button>

                        {activeVariants.length > 0 && (
                          <div className="border-t border-slate-100 p-1.5">
                            <select
                              defaultValue=""
                              onChange={(e) => {
                                const variant = activeVariants.find(
                                  (v) => v.id === Number(e.target.value),
                                );
                                if (variant) addToCart(product, variant);
                                e.target.value = "";
                              }}
                              className="h-7 w-full rounded-md border border-slate-200 bg-slate-50 px-1.5 text-[11px] outline-none focus:border-[#ff6b00]"
                            >
                              <option value="" disabled>
                                Select variant...
                              </option>
                              {activeVariants.map((variant) => (
                                <option key={variant.id} value={variant.id}>
                                  {variant.name} —{" "}
                                  {money(getLinePrice(product, variant))}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ================================================
              RIGHT — BILL
          ================================================ */}
          <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Bill header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3">
              <div className="flex items-center gap-2">
                <ShoppingCart size={16} className="text-[#ff6b00]" />
                <h2 className="text-[13px] font-bold text-slate-900">
                  Current Bill
                </h2>
              </div>
              <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200">
                {totalItems} item{totalItems === 1 ? "" : "s"}
              </span>
            </div>

            {/* Customer */}
            <div className="grid grid-cols-2 gap-2 border-b border-slate-100 px-3.5 py-3">
              <div className="relative">
                <User
                  size={13}
                  className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer name"
                  className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-7 pr-2 text-xs outline-none focus:border-[#ff6b00] focus:bg-white"
                />
              </div>
              <input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Phone"
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs outline-none focus:border-[#ff6b00] focus:bg-white"
              />
            </div>

            {/* Cart lines */}
            <div className="max-h-[30vh] min-h-[130px] overflow-y-auto px-2.5 py-2">
              {!cart.length ? (
                <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-1.5 text-slate-300">
                  <ShoppingCart size={30} />
                  <p className="text-xs text-slate-400">
                    Click products to add them to the bill
                  </p>
                </div>
              ) : (
                cart.map((line) => (
                  <div
                    key={line.key}
                    className="mb-1.5 rounded-lg border border-slate-100 bg-slate-50/60 p-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-800">
                          {line.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {line.variantName ? `${line.variantName} · ` : ""}
                          {money(line.unitPrice)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeLine(line.key)}
                        aria-label="Remove item"
                        className="rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="mt-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-0.5 rounded-md border border-slate-200 bg-white p-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(line.key, -1)}
                          aria-label="Decrease quantity"
                          className="flex h-6 w-6 items-center justify-center rounded text-slate-500 transition hover:bg-slate-100"
                        >
                          <Minus size={12} />
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) =>
                            setQuantity(
                              line.key,
                              Math.max(0, Number(e.target.value) || 0),
                            )
                          }
                          className="h-6 w-9 border-0 bg-transparent text-center text-[13px] font-bold text-slate-800 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          onClick={() => updateQuantity(line.key, 1)}
                          aria-label="Increase quantity"
                          className="flex h-6 w-6 items-center justify-center rounded text-slate-500 transition hover:bg-slate-100"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <p className="text-[13px] font-bold text-slate-900">
                        {money(line.unitPrice * line.quantity)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Charges + totals */}
            <div className="space-y-2 border-t border-slate-100 bg-slate-50/50 px-3.5 py-3">
              <div className="flex items-center gap-2">
                <span className="w-16 shrink-0 text-xs font-medium text-slate-500">
                  Discount
                </span>
                <input
                  type="number"
                  min={0}
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  placeholder="0"
                  className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none focus:border-[#ff6b00]"
                />
                <div className="flex shrink-0 rounded-md border border-slate-200 bg-white p-0.5">
                  {(["flat", "percent"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setDiscountType(type)}
                      className={`h-6 w-7 rounded text-[11px] font-bold transition ${
                        discountType === type
                          ? "bg-[#ff6b00] text-white"
                          : "text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {type === "flat" ? "৳" : "%"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-16 shrink-0 text-xs font-medium text-slate-500">
                  Delivery
                </span>
                <input
                  type="number"
                  min={0}
                  value={deliveryCharge}
                  onChange={(e) => setDeliveryCharge(e.target.value)}
                  placeholder="0"
                  className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none focus:border-[#ff6b00]"
                />
              </div>

              <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                {paymentMethods.map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setPaymentMethod(label)}
                    className={`flex h-8 items-center justify-center gap-1 rounded-md border text-xs font-semibold transition ${
                      paymentMethod === label
                        ? "border-[#ff6b00] bg-[#ff6b00]/10 text-[#ff6b00]"
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    <Icon size={13} />
                    {label}
                  </button>
                ))}
              </div>

              {paymentMethod === "Cash" && (
                <div className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-xs font-medium text-slate-500">
                    Paid
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={paidInput}
                    onChange={(e) => setPaidInput(e.target.value)}
                    placeholder={String(grandTotal)}
                    className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 text-xs outline-none focus:border-[#ff6b00]"
                  />
                </div>
              )}

              <div className="space-y-1 border-t border-dashed border-slate-200 pt-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span>{money(subTotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>
                      Discount
                      {discountType === "percent" &&
                        discountValue > 0 &&
                        ` (${discountValue}%)`}
                    </span>
                    <span>-{money(discountAmount)}</span>
                  </div>
                )}
                {delivery > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Delivery</span>
                    <span>{money(delivery)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-0.5 text-[15px] font-bold text-slate-900">
                  <span>Total</span>
                  <span className="text-[#ff6b00]">{money(grandTotal)}</span>
                </div>
                {paymentMethod === "Cash" && changeAmount > 0 && (
                  <div className="flex justify-between font-semibold text-emerald-600">
                    <span>Change</span>
                    <span>{money(changeAmount)}</span>
                  </div>
                )}
                {paymentMethod === "Cash" && dueAmount > 0 && (
                  <div className="flex justify-between font-semibold text-red-500">
                    <span>Due</span>
                    <span>{money(dueAmount)}</span>
                  </div>
                )}
              </div>

              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Sale note (optional)"
                className="h-8 w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs outline-none focus:border-[#ff6b00]"
              />

              <button
                type="button"
                disabled={!cart.length || submitting}
                onClick={completeSale}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#ff6b00] text-[13px] font-bold text-white shadow-md shadow-[#ff6b00]/25 transition hover:bg-[#e65f00] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Banknote size={16} />
                    Complete Sale — {money(grandTotal)}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================
          PRINT STYLES
      ================================================== */}
      <style>{`
        @media print {
          html {
            background: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          body,
          #root {
            background: #fff !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* The invoice and ALL its ancestors (admin layout wrappers with
             min-h-screen / gray backgrounds) become white, flat and only
             as tall as the invoice content */
          body:has(#pos-invoice) *:has(#pos-invoice) {
            visibility: visible !important;
            background: #fff !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            overflow: visible !important;
          }

          /* Everything else (sidebar, topbar, POS screen) is removed
             from the print layout entirely */
          body:has(#pos-invoice) *:not(:has(#pos-invoice)):not(#pos-invoice):not(#pos-invoice *) {
            display: none !important;
            position: absolute !important;
            width: 0 !important;
            height: 0 !important;
            max-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            overflow: hidden !important;
            visibility: hidden !important;
          }

          #pos-invoice {
            display: block !important;
            visibility: visible !important;
            position: static !important;
            width: 100% !important;
            background: #fff !important;
            padding: 12mm 10mm !important;
          }

          #pos-invoice * {
            visibility: visible !important;
            background-color: transparent !important;
          }

          html,
          body,
          #root {
            height: auto !important;
            min-height: 0 !important;
            overflow: hidden !important;
          }

          body > div[style] {
            display: none !important;
          }

          /* Zero page margin removes the browser's header/footer
             (date, title, URL, page number) completely */
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </>
  );
}
