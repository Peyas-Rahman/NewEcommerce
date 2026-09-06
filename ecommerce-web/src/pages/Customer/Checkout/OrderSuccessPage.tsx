import { ArrowRight, CheckCircle2, Download } from "lucide-react";
import { useEffect, useState } from "react";
import Header from "../../../components/layout/Header";
import orderService from "../../../services/orderService";
import { isLoggedIn } from "../../../services/customerService";

export default function OrderSuccessPage({ id }: { id?: number }) {
	const [order, setOrder] = useState<any>(null);

	useEffect(() => {
		if (id) orderService.getOrderById(id).then(setOrder).catch(() => {});
	}, [id]);

	const loggedIn = isLoggedIn();

	return <div className="min-h-screen bg-[#f7f8fa]"><Header /><main className="mx-auto max-w-2xl px-4 py-16 text-center"><div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-12"><CheckCircle2 className="mx-auto h-16 w-16 text-green-500" /><p className="mt-6 text-xs font-bold uppercase tracking-[.18em] text-orange-600">Order confirmed</p><h1 className="mt-2 text-3xl font-black">Thank you for your order!</h1><p className="mt-3 text-sm leading-6 text-slate-500">Your order has been placed successfully. Keep your order number for future reference.</p>{order && <div className="mt-6 rounded-2xl bg-slate-50 p-5"><p className="text-xs text-slate-400">Order number</p><p className="mt-1 text-xl font-black">#{order.orderNumber}</p><p className="mt-3 text-sm text-slate-600">Total: <strong>৳{new Intl.NumberFormat("en-BD").format(order.grandTotal || 0)}</strong></p></div>}<div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><a href="/shop" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-bold">Continue Shopping</a>{order && <a href={`/invoice?id=${order.id}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#ff6b00] px-5 text-sm font-bold text-white"><Download className="h-4 w-4" /> Download Invoice PDF</a>}{order && loggedIn && <a href={`/account/orders/${order.id}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-bold">View Order <ArrowRight className="h-4 w-4" /></a>}</div></div></main></div>;
}
