import {
  ClipboardList,
  Gift,
  House,
  Menu,
  ShoppingBag,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

export default function MobileBottomNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add("has-mobile-bottom-nav");
    return () => document.body.classList.remove("has-mobile-bottom-nav");
  }, []);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 h-[calc(5.25rem+env(safe-area-inset-bottom))] rounded-t-[26px] border-t border-slate-200/80 bg-white/95 px-3 pb-[env(safe-area-inset-bottom)] text-slate-400 shadow-[0_-14px_38px_rgba(15,23,42,0.14)] backdrop-blur-xl before:absolute before:inset-x-10 before:top-0 before:h-px before:bg-gradient-to-r before:from-[#0757c9] before:via-[#ff6b00] before:to-[#0757c9] before:opacity-40 md:hidden">
      <div className="relative mx-auto grid h-[5.25rem] max-w-md grid-cols-5 items-end">
        <BottomNavItem href="/" label="Home" active={window.location.pathname === "/"}>
          <House />
        </BottomNavItem>
        <BottomNavItem href="/shop?offer=discount" label="Offers">
          <Gift />
        </BottomNavItem>
        <div className="relative z-20 flex h-20 flex-col items-center justify-end pb-2">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-3 left-1/2 z-0 h-14 w-28 -translate-x-1/2 rounded-t-[3.5rem] bg-white shadow-[0_-4px_12px_rgba(15,23,42,0.1)]"
          />
          <div className={`pointer-events-none absolute bottom-[58px] left-1/2 z-30 h-44 w-64 -translate-x-1/2 transition ${menuOpen ? "opacity-100" : "opacity-0"}`}>
            <RadialAction
              href="/shop"
              label="Categories"
              icon={<Menu className="h-4 w-4" />}
              open={menuOpen}
              position="left-2 top-16"
              delay="75ms"
              onClick={() => setMenuOpen(false)}
            />
            <RadialAction
              href="/shop?flashSale=true"
              label="Flash Deals"
              icon={<Zap className="h-4 w-4" />}
              open={menuOpen}
              position="left-16 top-1"
              delay="125ms"
              onClick={() => setMenuOpen(false)}
            />
            <RadialAction
              href="/cart"
              label="Cart"
              icon={<ShoppingBag className="h-4 w-4" />}
              open={menuOpen}
              position="right-16 top-1"
              delay="175ms"
              onClick={() => setMenuOpen(false)}
            />
            <RadialAction
              href="/orders"
              label="Orders"
              icon={<ClipboardList className="h-4 w-4" />}
              open={menuOpen}
              position="right-2 top-16"
              delay="225ms"
              onClick={() => setMenuOpen(false)}
            />
          </div>
          <button
            type="button"
            aria-label={menuOpen ? "Close quick menu" : "Open quick menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((previous) => !previous)}
            className="group relative z-40 -mt-8 flex h-[62px] w-[62px] items-center justify-center rounded-full border-[5px] border-white bg-[#e65f00] text-white shadow-[0_8px_22px_rgba(230,95,0,0.32)] ring-2 ring-[#ff6b00]/20 transition duration-300 hover:-translate-y-0.5 hover:bg-[#d95700]"
          >
            {menuOpen ? (
              <X className="h-7 w-7" strokeWidth={2.5} />
            ) : (
              <ShoppingBag className="h-6 w-6" />
            )}
          </button>
        </div>
        <BottomNavItem href="/shop?flashSale=true" label="Flash Deals" active={window.location.search.includes("flashSale=true")}>
          <Zap />
        </BottomNavItem>
        <BottomNavItem href={localStorage.getItem("dexora_customer_token") ? "/account" : "/login"} label="Account" active={window.location.pathname.startsWith("/account")}>
          <UserRound />
        </BottomNavItem>
      </div>
    </nav>
  );
}

function BottomNavItem({
  href,
  label,
  active = false,
  children,
}: {
  href: string;
  label: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={`flex h-16 flex-col items-center justify-center gap-1 text-[9px] font-semibold transition ${active ? "text-[#0757c9]" : "text-slate-400 hover:text-[#0757c9]"}`}
    >
      <span className={`flex h-8 w-12 items-center justify-center rounded-2xl transition ${active ? "bg-blue-50" : "bg-transparent"}`}>
        {children}
      </span>
      <span>{label}</span>
      <span className={`h-1 w-1 rounded-full bg-[#ff6b00] transition ${active ? "scale-100 opacity-100" : "scale-0 opacity-0"}`} />
    </a>
  );
}

function RadialAction({
  href,
  label,
  icon,
  open,
  position,
  delay,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  open: boolean;
  position: string;
  delay: string;
  onClick: () => void;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      style={{ transitionDelay: open ? delay : "0ms" }}
      className={`pointer-events-auto absolute ${position} flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-full border border-blue-100 bg-white text-[8px] font-semibold text-[#0757c9] shadow-[0_5px_14px_rgba(15,23,42,0.15)] transition duration-300 ${open ? "scale-100 translate-y-0" : "scale-50 translate-y-5"}`}
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}
