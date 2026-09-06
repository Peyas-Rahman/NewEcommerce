import { GitCompareArrows, Gift, UserRound } from "lucide-react";
import { useEffect } from "react";

export default function MobileBottomNav() {
  useEffect(() => {
    document.body.classList.add("has-mobile-bottom-nav");
    return () => document.body.classList.remove("has-mobile-bottom-nav");
  }, []);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 h-[calc(4rem+env(safe-area-inset-bottom))] border-t border-slate-700 bg-[#07111f] px-2 pb-[env(safe-area-inset-bottom)] text-white shadow-[0_-8px_24px_rgba(15,23,42,0.18)] md:hidden">
      <div className="mx-auto grid h-16 max-w-md grid-cols-4">
        <a href="/shop?offer=discount" className="flex flex-col items-center justify-center gap-1 text-[10px] text-white/80 hover:text-orange-400">
          <Gift className="h-4 w-4 text-orange-400" /> Offers
        </a>
        <a href="/shop?deal=flash" className="flex flex-col items-center justify-center gap-1 text-[10px] text-white/80 hover:text-orange-400">
          <span className="text-base leading-none text-orange-400">⚡</span> Flash Deals
        </a>
        <a href="/compare" className="flex flex-col items-center justify-center gap-1 text-[10px] text-white/80 hover:text-orange-400">
          <GitCompareArrows className="h-4 w-4 text-orange-400" /> Compare
        </a>
        <a href={localStorage.getItem("dexora_customer_token") ? "/account" : "/login"} className="flex flex-col items-center justify-center gap-1 text-[10px] text-white/80 hover:text-orange-400">
          <UserRound className="h-4 w-4 text-orange-400" /> Account
        </a>
      </div>
    </nav>
  );
}
