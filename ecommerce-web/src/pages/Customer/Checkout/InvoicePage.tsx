import { ArrowLeft, Download, FileText } from "lucide-react";
import { jsPDF } from "jspdf";
import { useEffect, useState } from "react";
import Header from "../../../components/layout/Header";
import orderService from "../../../services/orderService";

type InvoiceOrder = {
  id: number;
  orderNumber: string;
  guestName?: string | null;
  guestPhone?: string | null;
  guestEmail?: string | null;
  customerId?: number | null;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity?: string | null;
  shippingArea?: string | null;
  shippingPostalCode?: string | null;
  paymentMethod: string;
  orderStatus: string;
  createdAt: string;
  subTotal: number;
  shippingAmount: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  items: Array<{ productName: string; sku?: string | null; quantity: number; unitPrice: number; totalPrice: number }>;
};

const money = (value: number) => `BDT ${new Intl.NumberFormat("en-BD").format(value || 0)}`;

function getCustomerName(order: InvoiceOrder) {
  return order.guestName || "Customer";
}

function getAddress(order: InvoiceOrder) {
  return [order.shippingAddress, order.shippingArea, order.shippingCity, order.shippingPostalCode]
    .filter(Boolean)
    .join(", ");
}

function downloadInvoice(order: InvoiceOrder) {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  let y = 22;

  pdf.setFillColor(255, 107, 0);
  pdf.rect(0, 0, pageWidth, 9, "F");
  pdf.setFontSize(22);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(15, 23, 42);
  pdf.text("DEXORA", 18, y);
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(100, 116, 139);
  pdf.text("INVOICE", pageWidth - 18, y, { align: "right" });

  y += 16;
  pdf.setDrawColor(226, 232, 240);
  pdf.line(18, y, pageWidth - 18, y);
  y += 12;
  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Invoice: #${order.orderNumber}`, 18, y);
  pdf.text(`Date: ${new Date(order.createdAt).toLocaleDateString("en-GB")}`, pageWidth - 18, y, { align: "right" });

  y += 18;
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(15, 23, 42);
  pdf.text("BILL TO", 18, y);
  pdf.text("SHIPPING ADDRESS", pageWidth / 2, y);
  y += 7;
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(71, 85, 105);
  pdf.text(getCustomerName(order), 18, y);
  pdf.text(order.shippingPhone || order.guestPhone || "", 18, y + 6);
  pdf.text(pdf.splitTextToSize(getAddress(order), 78), pageWidth / 2, y);

  y += 28;
  pdf.setFillColor(248, 250, 252);
  pdf.rect(18, y - 6, pageWidth - 36, 10, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(15, 23, 42);
  pdf.text("ITEM", 22, y);
  pdf.text("QTY", 132, y, { align: "right" });
  pdf.text("TOTAL", pageWidth - 22, y, { align: "right" });
  y += 12;
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(71, 85, 105);

  for (const item of order.items || []) {
    const name = pdf.splitTextToSize(item.productName, 95);
    pdf.text(name, 22, y);
    pdf.text(String(item.quantity), 132, y, { align: "right" });
    pdf.text(money(item.totalPrice), pageWidth - 22, y, { align: "right" });
    y += Math.max(8, name.length * 5) + 4;
    pdf.setDrawColor(241, 245, 249);
    pdf.line(18, y - 3, pageWidth - 18, y - 3);
  }

  y += 8;
  const totals = [
    ["Subtotal", order.subTotal],
    ["Shipping", order.shippingAmount],
    ["Discount", -order.discountAmount],
    ["Tax", order.taxAmount],
  ];
  pdf.setFontSize(10);
  for (const [label, value] of totals) {
    pdf.text(String(label), 115, y);
    pdf.text(money(Number(value)), pageWidth - 22, y, { align: "right" });
    y += 7;
  }
  pdf.setDrawColor(15, 23, 42);
  pdf.line(115, y, pageWidth - 18, y);
  y += 10;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.setTextColor(15, 23, 42);
  pdf.text("Grand Total", 115, y);
  pdf.text(money(order.grandTotal), pageWidth - 22, y, { align: "right" });
  y += 18;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Payment: ${order.paymentMethod || "Cash on Delivery"}`, 18, y);
  pdf.text(`Status: ${order.orderStatus}`, pageWidth - 18, y, { align: "right" });
  pdf.text("Thank you for shopping with Dexora.", 18, 280);
  pdf.save(`dexora-invoice-${order.orderNumber}.pdf`);
}

export default function InvoicePage({ id }: { id: number }) {
  const [order, setOrder] = useState<InvoiceOrder | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    orderService.getOrderById(id).then((data) => setOrder(data as InvoiceOrder)).catch(() => setError("Invoice not found."));
  }, [id]);

  return <div className="min-h-screen bg-[#f7f8fa]"><Header /><main className="mx-auto max-w-4xl px-4 py-8 md:px-6"><div className="flex items-center justify-between gap-4"><a href={order?.customerId ? `/account/orders/${id}` : "/shop"} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500"><ArrowLeft className="h-4 w-4" /> Back</a>{order && <button type="button" onClick={() => downloadInvoice(order)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#ff6b00] px-5 text-sm font-bold text-white"><Download className="h-4 w-4" /> Download PDF</button>}</div>{error ? <div className="mt-8 rounded-2xl bg-red-50 p-6 text-red-700">{error}</div> : !order ? <div className="py-20 text-center text-slate-400">Preparing invoice...</div> : <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-10"><div className="flex items-start justify-between border-b border-slate-200 pb-7"><div><p className="text-2xl font-black text-slate-900">DEXORA</p><p className="mt-1 text-xs font-bold uppercase tracking-[.18em] text-orange-600">Invoice</p></div><div className="text-right text-sm text-slate-500"><p className="font-bold text-slate-900">#{order.orderNumber}</p><p>{new Date(order.createdAt).toLocaleDateString("en-GB")}</p></div></div><div className="grid gap-6 border-b border-slate-200 py-7 sm:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Bill to</p><p className="mt-2 font-bold text-slate-900">{getCustomerName(order)}</p><p className="text-sm text-slate-500">{order.shippingPhone || order.guestPhone}</p></div><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Shipping address</p><p className="mt-2 text-sm leading-6 text-slate-600">{getAddress(order)}</p></div></div><div className="py-7"><div className="grid grid-cols-[1fr_60px_100px] gap-3 bg-slate-50 px-3 py-3 text-xs font-bold uppercase tracking-wider text-slate-500"><span>Item</span><span className="text-right">Qty</span><span className="text-right">Total</span></div>{order.items?.map((item, index) => <div key={`${item.productName}-${index}`} className="grid grid-cols-[1fr_60px_100px] gap-3 border-b border-slate-100 px-3 py-4 text-sm"><span className="font-semibold text-slate-800">{item.productName}</span><span className="text-right text-slate-500">{item.quantity}</span><span className="text-right font-bold text-slate-800">৳{new Intl.NumberFormat("en-BD").format(item.totalPrice || 0)}</span></div>)}</div><div className="ml-auto max-w-xs space-y-2 text-sm"><div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{money(order.subTotal)}</span></div><div className="flex justify-between text-slate-500"><span>Shipping</span><span>{money(order.shippingAmount)}</span></div><div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-black text-slate-900"><span>Grand total</span><span>{money(order.grandTotal)}</span></div></div><div className="mt-8 flex items-center gap-2 text-sm text-slate-500"><FileText className="h-4 w-4 text-orange-600" /> Payment: {order.paymentMethod || "Cash on Delivery"}</div></section>}</main></div>;
}
