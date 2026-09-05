import { CheckCircle2, Info, X } from "lucide-react";
import { useEffect } from "react";

export default function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onClose, 3600);
    return () => window.clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;
  const error = /unable|failed|error|not found|required/i.test(message);
  return <div role="status" className="fixed bottom-5 right-5 z-[120] flex w-[min(380px,calc(100vw-2rem))] items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_50px_rgba(15,23,42,0.18)] animate-[toast-in_.25s_ease-out]">
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${error ? "bg-red-50 text-red-500" : "bg-green-50 text-green-600"}`}>{error ? <Info className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}</div>
    <div className="min-w-0 flex-1"><p className="text-sm font-bold text-slate-900">{error ? "Something went wrong" : "Added to cart"}</p><p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{message}</p>{!error && <a href="/cart" className="mt-2 inline-block text-xs font-bold text-orange-600 hover:text-orange-700">View cart</a>}</div>
    <button aria-label="Close notification" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
  </div>;
}
