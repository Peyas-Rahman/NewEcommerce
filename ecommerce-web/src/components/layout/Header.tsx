import { useEffect, useState, type ReactNode } from "react";

import {
  Heart,
  UserRound,
  ShoppingCart,
  Search,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  GitCompareArrows,
  Flame,
  Gift,
  Truck,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Headphones,
} from "lucide-react";

import logo from "../../assets/dexora-logo.png";

import {
  getHeaderMenuSettings,
  getAllMenus,
} from "../../services/menuService";

import type { MenuItem } from "../../types/menu";

import type {
  HeaderMenuSetting,
} from "../../services/menuService";
import cartService from "../../services/cartService";
import { compareIds, wishlistIds } from "../../services/shoppingListService";
import { getAllCategories } from "../../services/categoryService";
import type { Category } from "../../types/category";
import productService from "../../services/productService";
import type { Product } from "../../types/product";
import { assetUrl } from "../../services/media";
import MobileBottomNav from "./MobileBottomNav";

function menuHref(item: Pick<MenuItem, "url" | "categoryId">) {
  return item.categoryId ? `/shop?category=${item.categoryId}` : item.url || "/shop";
}

function filterVisibleMenuTree(items: MenuItem[]): MenuItem[] {
  return items
    .filter((item) => item.isActive && item.showInHeader)
    .map((item) => ({
      ...item,
      children: (item.children || [])
        .filter((child) => child.isActive)
        .map((child) => ({
          ...child,
          children: filterActiveChildren(child.children || []),
        })),
    }));
}

function filterActiveChildren(items: MenuItem[]): MenuItem[] {
  return items
    .filter((item) => item.isActive)
    .map((item) => ({ ...item, children: filterActiveChildren(item.children || []) }));
}


/* ============================================================
   HEADER
============================================================ */

export default function Header() {

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [menuItems, setMenuItems] =
    useState<MenuItem[]>([]);

  const [menuSettings, setMenuSettings] =
    useState<HeaderMenuSetting | null>(null);

  const [menuLoading, setMenuLoading] =
    useState(true);

  const [menuError, setMenuError] =
    useState(false);

  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [compareCount, setCompareCount] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchProducts, setSearchProducts] = useState<Product[]>([]);

  const submitSearch = () => {
    const value = searchTerm.trim();
    window.location.href = value ? `/shop?search=${encodeURIComponent(value)}` : "/shop";
  };

  const updateSearch = (value: string) => {
    setSearchTerm(value);
    if (window.location.pathname.startsWith("/shop")) {
      const query = value.trim() ? `?search=${encodeURIComponent(value.trim())}` : "/shop";
      window.history.replaceState(null, "", query);
      window.dispatchEvent(new CustomEvent("dexora-search-updated", { detail: value }));
    }
  };


  /* ==========================================================
     LOAD HEADER MENU + SETTINGS
  ========================================================== */

  useEffect(() => {

    let mounted = true;

    const loadHeader = async () => {

      try {

        setMenuLoading(true);
        setMenuError(false);

        const [menus, settings] =
          await Promise.all([
            getAllMenus(),
            getHeaderMenuSettings(),
          ]);

        if (!mounted) {
          return;
        }

        setMenuItems(filterVisibleMenuTree(menus));
        setMenuSettings(settings);

      } catch (error) {

        console.error(
          "Failed to load header:",
          error
        );

        if (mounted) {
          setMenuError(true);
        }

      } finally {

        if (mounted) {
          setMenuLoading(false);
        }

      }

    };

    loadHeader();

    return () => {
      mounted = false;
    };

  }, []);

  useEffect(() => {
    getAllCategories().then(setCategories).catch(() => setCategories([]));
    productService.getAll().then(setSearchProducts).catch(() => setSearchProducts([]));
  }, []);

  const suggestions = searchTerm.trim()
    ? searchProducts.filter((product) => `${product.name} ${product.sku} ${product.brandName || ""} ${product.categoryName || ""}`.toLowerCase().includes(searchTerm.trim().toLowerCase())).slice(0, 6)
    : [];

  useEffect(() => {
    const refreshCounts = () => {
      setWishlistCount(wishlistIds().length);
      setCompareCount(compareIds().length);
      void cartService.getCart().then((cart) => setCartCount(cart.totalItems || 0)).catch(() => setCartCount(0));
    };
    refreshCounts();
    window.addEventListener("dexora-shopping-list-updated", refreshCounts);
    window.addEventListener("dexora-cart-updated", refreshCounts);
    return () => {
      window.removeEventListener("dexora-shopping-list-updated", refreshCounts);
      window.removeEventListener("dexora-cart-updated", refreshCounts);
    };
  }, []);


  /* ==========================================================
     ALIGNMENT
  ========================================================== */

  const alignmentClass =
    menuSettings?.alignment?.toLowerCase() === "center"
      ? "justify-center"
      : menuSettings?.alignment?.toLowerCase() === "right"
        ? "justify-end"
        : "justify-start";


  /* ==========================================================
     SPACING
  ========================================================== */

  const spacingClass =
    menuSettings?.spacing?.toLowerCase() === "compact"
      ? "gap-4"
      : menuSettings?.spacing?.toLowerCase() === "spacious"
        ? "gap-10"
        : "gap-7";


  /* ==========================================================
     STICKY
  ========================================================== */

  const stickyClass =
    menuSettings?.isSticky !== false
      ? "sticky top-0 z-50"
      : "relative z-50";


  /* ==========================================================
     HEADER ACTIVE
  ========================================================== */

  const headerActive =
    menuSettings?.isActive !== false;


  return (
    <>
      <header
        className={`
          ${stickyClass}
          w-full
          bg-white
        `}
      >

        {/* ====================================================
            TOP PROMOTIONAL BAR
        ==================================================== */}

        <div className="bg-[#07111f] text-white">

          <div
            className="
              mx-auto
              flex
              h-9
              max-w-[1440px]
              items-center
              justify-between
              px-4
              md:px-6
            "
          >

            {/* LEFT */}

            <div
              className="
                hidden
                items-center
                gap-5
                text-[11px]
                md:flex
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-white/80
                "
              >

                <Truck
                  className="
                    h-3.5
                    w-3.5
                    text-[#ff6b00]
                  "
                />

                <span>
                  Fast Delivery
                </span>

              </div>


              <div className="h-3.5 w-px bg-white/15" />


              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-white/80
                "
              >

                <ShieldCheck
                  className="
                    h-3.5
                    w-3.5
                    text-[#ff6b00]
                  "
                />

                <span>
                  100% Genuine
                </span>

              </div>


              <div className="h-3.5 w-px bg-white/15" />


              <div
                className="
                  flex
                  items-center
                  gap-2
                  text-white/80
                "
              >

                <RotateCcw
                  className="
                    h-3.5
                    w-3.5
                    text-[#ff6b00]
                  "
                />

                <span>
                  Easy Returns
                </span>

              </div>

            </div>


            {/* RIGHT */}

            <div
              className="
                ml-auto
                flex
                items-center
                gap-4
                text-[11px]
                md:gap-6
              "
            >

              {/* OFFERS */}

              <a
                href="/shop?offer=discount"
                className="
                  group
                  flex
                  items-center
                  gap-1.5
                  transition
                  hover:text-[#ff6b00]
                "
              >

                <Gift
                  className="
                    h-3.5
                    w-3.5
                    text-[#ff6b00]
                  "
                />

                <span>
                  Offers
                </span>

                <span
                  className="
                    rounded-full
                    bg-[#ff6b00]
                    px-1.5
                    py-[1px]
                    text-[8px]
                    font-bold
                    leading-none
                  "
                >
                  HOT
                </span>

              </a>


              <div className="h-3.5 w-px bg-white/15" />


              {/* FLASH DEALS */}

              <a
                href="/shop?flashSale=true"
                className="
                  group
                  flex
                  items-center
                  gap-1.5
                  transition
                  hover:text-[#ff6b00]
                "
              >

                <Flame
                  className="
                    h-3.5
                    w-3.5
                    text-[#ff6b00]
                  "
                />

                <span>
                  Flash Deals
                </span>

                <span
                  className="
                    rounded-full
                    bg-[#0757c9]
                    px-1.5
                    py-[1px]
                    text-[8px]
                    font-bold
                    leading-none
                  "
                >
                  NEW
                </span>

              </a>


              <div
                className="
                  hidden
                  h-3.5
                  w-px
                  bg-white/15
                  sm:block
                "
              />


              {/* NEW ARRIVALS */}

              <a
                href="/shop?new=true"
                className="
                  hidden
                  items-center
                  gap-1.5
                  transition
                  hover:text-[#ff6b00]
                  sm:flex
                "
              >

                <Sparkles
                  className="
                    h-3.5
                    w-3.5
                    text-[#ff6b00]
                  "
                />

                <span>
                  New Arrivals
                </span>

              </a>

            </div>

          </div>

        </div>


        {/* ====================================================
            MAIN HEADER
        ==================================================== */}

        <div className="border-b border-gray-100 bg-white">

          <div
            className="
              mx-auto
              flex
              h-[78px]
              max-w-[1440px]
              items-center
              gap-5
              px-4
              md:px-6
            "
          >

            {/* MOBILE MENU */}

            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(true)
              }
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                border
                border-gray-200
                text-gray-700
                transition
                hover:border-[#0757c9]
                hover:text-[#0757c9]
                md:hidden
              "
              aria-label="Open menu"
            >

              <Menu className="h-5 w-5" />

            </button>


            {/* LOGO */}

            <a
              href="/"
              className="
                flex
                shrink-0
                items-center
              "
            >

              <img
                src={logo}
                alt="Dexora Technologies"
                className="
                  w-[145px]
                  object-contain
                  sm:w-[165px]
                  md:w-[178px]
                "
              />

            </a>


            {/* SEARCH */}

            <div
              className="
                hidden
                flex-1
                relative
                md:block
              "
            >

              <div
                className="
                  mx-auto
                  flex
                  h-[46px]
                  max-w-[650px]
                  overflow-hidden
                  rounded-xl
                  border
                  border-gray-200
                  bg-[#f8fafc]
                  transition-all
                  duration-200
                  focus-within:border-[#0757c9]
                  focus-within:bg-white
                  focus-within:shadow-[0_0_0_4px_rgba(7,87,201,0.08)]
                "
              >

                <div
                  className="
                    flex
                    items-center
                    pl-4
                    text-gray-400
                  "
                >

                  <Search className="h-[18px] w-[18px]" />

                </div>


                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => updateSearch(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") submitSearch(); }}
                  placeholder="Search products, brands & categories..."
                  className="
                    min-w-0
                    flex-1
                    bg-transparent
                    px-3
                    text-[13px]
                    text-gray-800
                    outline-none
                    placeholder:text-gray-400
                  "
                />


                <button
                  type="button"
                  onClick={submitSearch}
                  className="
                    flex
                    w-[54px]
                    items-center
                    justify-center
                    bg-[#0757c9]
                    text-white
                    transition
                    hover:bg-[#064da9]
                  "
                  aria-label="Search"
                >

                  <Search className="h-[18px] w-[18px]" />

                </button>

              </div>

              {suggestions.length > 0 && <div className="absolute left-1/2 top-[52px] z-[99999] w-full max-w-[650px] -translate-x-1/2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.16)]"><div className="p-2">{suggestions.map((product) => <a key={product.id} href={`/product/${product.slug}`} className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-orange-50"><img src={assetUrl(product.images?.[0]?.imageUrl)} alt="" className="h-10 w-10 rounded-md bg-slate-50 object-contain" /><span className="min-w-0"><span className="block truncate text-sm font-semibold text-slate-800">{product.name}</span><span className="block text-xs text-slate-400">{product.categoryName || "Product"} · {money(product.effectivePrice ?? product.price)}</span></span></a>)}</div><button type="button" onClick={submitSearch} className="w-full border-t border-slate-100 px-4 py-2.5 text-left text-xs font-bold text-orange-600 hover:bg-orange-50">View all results for “{searchTerm.trim()}”</button></div>}

            </div>


            {/* ACTIONS */}

            <div
              className="
                ml-auto
                flex
                items-center
                gap-1
              "
            >

              <HeaderAction
                icon={
                  <GitCompareArrows className="h-[19px] w-[19px]" />
                }
                label="Compare"
                badge={String(compareCount)}
                href="/compare"
              />


              <HeaderAction
                icon={
                  <Heart className="h-[19px] w-[19px]" />
                }
                label="Wishlist"
                badge={String(wishlistCount)}
                href="/wishlist"
              />


              {/* ACCOUNT */}

              <div className="group relative hidden lg:block">
                <button
                  type="button"
                  onClick={() => { window.location.href = "/account"; }}
                  className="flex items-center gap-2 rounded-xl px-2.5 py-2 transition hover:bg-blue-50"
                >

                <div
                  className="
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-full
                    bg-[#f1f5f9]
                  "
                >

                  <UserRound
                    className="
                      h-[18px]
                      w-[18px]
                      text-[#334155]
                    "
                  />

                </div>


                <div className="text-left">

                  <p
                    className="
                      text-[10px]
                      leading-3
                      text-gray-400
                    "
                  >
                    Welcome
                  </p>

                  <p
                    className="
                      text-[12px]
                      font-semibold
                      leading-4
                      text-gray-800
                    "
                  >
                    My Account
                  </p>

                </div>


                <ChevronDown
                  className="
                    h-3.5
                    w-3.5
                    text-gray-400
                  "
                />

                </button>
                <div className="pointer-events-none absolute right-0 top-full z-[99999] w-52 translate-y-2 pt-2 opacity-0 transition duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
                    <a href="/account" className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#0757c9]">My profile</a>
                    <a href="/account/orders" className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#0757c9]">My orders</a>
                    <a href="/wishlist" className="block rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-600">Wishlist</a>
                  </div>
                </div>
              </div>


              {/* MOBILE ACCOUNT */}

              <button
                type="button"
                onClick={() => { window.location.href = "/account"; }}
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  text-gray-700
                  transition
                  hover:bg-gray-50
                  lg:hidden
                "
                aria-label="Account"
              >

                <UserRound className="h-[19px] w-[19px]" />

              </button>


              {/* CART */}

              <div className="group relative ml-1">
                <button
                  type="button"
                  onClick={() => { window.location.href = "/cart"; }}
                  className="relative flex h-[45px] w-[45px] items-center justify-center rounded-xl bg-[#ff6b00] text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#e96000] hover:shadow-lg"
                  aria-label="Shopping cart"
                >

                <ShoppingCart className="h-[20px] w-[20px]" />


                <span
                  className="
                    absolute
                    -right-1
                    -top-1
                    flex
                    h-[19px]
                    min-w-[19px]
                    items-center
                    justify-center
                    rounded-full
                    border-2
                    border-white
                    bg-[#0757c9]
                    px-1
                    text-[8px]
                    font-bold
                  "
                >
                  {cartCount}
                </span>

                </button>
                <div className="pointer-events-none absolute right-0 top-full z-[99999] w-56 translate-y-2 pt-2 opacity-0 transition duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-900">Your cart</p>
                      <span className="rounded-full bg-orange-50 px-2 py-1 text-[10px] font-bold text-orange-600">{cartCount} items</span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Review your selected products before checkout.</p>
                    <a href="/cart" className="mt-3 flex h-9 items-center justify-center rounded-xl bg-[#e65f00] text-xs font-bold text-white hover:bg-[#d95700]">View cart</a>
                  </div>
                </div>
              </div>

            </div>

          </div>


          {/* MOBILE SEARCH */}

          <div
            className="
              px-4
              pb-3
              md:hidden
            "
          >

            <div
              className="
                flex
                h-[43px]
                overflow-hidden
                rounded-xl
                border
                border-gray-200
                bg-[#f8fafc]
              "
            >

              <div
                className="
                  flex
                  items-center
                  pl-3.5
                  text-gray-400
                "
              >

                <Search className="h-[17px] w-[17px]" />

              </div>


              <input
                type="text"
                value={searchTerm}
                onChange={(event) => updateSearch(event.target.value)}
                onKeyDown={(event) => { if (event.key === "Enter") submitSearch(); }}
                placeholder="Search products..."
                className="
                  min-w-0
                  flex-1
                  bg-transparent
                  px-2.5
                  text-[13px]
                  outline-none
                "
              />


              <button
                type="button"
                onClick={submitSearch}
                className="
                  flex
                  w-12
                  items-center
                  justify-center
                  bg-[#0757c9]
                  text-white
                "
                aria-label="Search"
              >

                <Search className="h-[17px] w-[17px]" />

              </button>

            </div>

          </div>

        </div>


        {/* ====================================================
            DESKTOP NAVIGATION
        ==================================================== */}

        {headerActive && (

          <nav
            className="
              relative
              hidden
              border-b
              border-gray-200
              bg-white
              md:block
            "
          >

            <div
              className="
                relative
                mx-auto
                flex
                h-[50px]
                max-w-[1440px]
                items-center
                px-4
                md:px-6
              "
            >

              {/* ALL CATEGORIES */}

              {menuSettings?.showAllCategories !== false && (
                <div className="relative h-full">
                  <button
                  type="button"
                  onClick={() => setCategoriesOpen((open) => !open)}
                  className="
                    flex
                    h-full
                    shrink-0
                    items-center
                    gap-2
                    border-r
                    border-gray-200
                    pr-5
                    text-[13px]
                    font-semibold
                    text-gray-800
                    transition
                    hover:text-[#0757c9]
                  "
                >

                  <Menu className="h-[17px] w-[17px]" />

                  <span>
                    All Categories
                  </span>

                  <ChevronDown
                    className="
                      h-3.5
                      w-3.5
                      text-gray-400
                    "
                  />

                  </button>
                  {categoriesOpen && <div className="absolute left-0 top-full z-[99999] w-[320px] rounded-xl border border-slate-200 bg-white p-3 shadow-[0_18px_45px_rgba(15,23,42,0.16)]"><p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Shop by category</p><div className="grid">{buildCategoryTree(categories).map((category) => <CategoryMenuItem key={category.id} category={category} onSelect={() => setCategoriesOpen(false)} />)}</div></div>}
                </div>

              )}


              {/* MENU CONTAINER */}

              <div
                className={`
                  flex
                  h-full
                  min-w-0
                  flex-1
                  items-center
                  pl-5
                  ${alignmentClass}
                  ${spacingClass}
                `}
              >

                {/* LOADING */}

                {menuLoading && (

                  <>
                    <MenuSkeleton width="w-14" />
                    <MenuSkeleton width="w-14" />
                    <MenuSkeleton width="w-16" />
                    <MenuSkeleton width="w-14" />
                  </>

                )}


                {/* ERROR */}

                {!menuLoading &&
                  menuError && (

                    <span
                      className="
                        text-[11px]
                        text-gray-400
                      "
                    >
                      Menu unavailable
                    </span>

                  )}


                {/* DYNAMIC MENU */}

                {!menuLoading &&
                  !menuError &&
                  menuItems.map((item) => (

                    <DesktopMenuItem
                      key={item.id}
                      item={item}
                    />

                  ))}


                {/* DEALS */}

                {menuSettings?.showDeals !== false && (

                  <a
                    href="/shop?flashSale=true"
                    className="
                      group
                      flex
                      items-center
                      gap-1.5
                      whitespace-nowrap
                      rounded-lg
                      px-2
                      py-1.5
                      text-[12px]
                      font-bold
                      text-[#ff6b00]
                      transition
                      hover:bg-[#fff7f2]
                    "
                  >

                    <Flame className="h-3.5 w-3.5" />

                    Deals

                  </a>

                )}

              </div>

            </div>

          </nav>

        )}

      </header>


      {/* ======================================================
          MOBILE DRAWER
      ====================================================== */}

      {mobileMenuOpen && (

        <div
          className="
            fixed
            inset-0
            z-[100]
            md:hidden
          "
        >

          {/* OVERLAY */}

          <div
            className="
              absolute
              inset-0
              bg-black/50
              backdrop-blur-[2px]
            "
            onClick={() =>
              setMobileMenuOpen(false)
            }
          />


          {/* DRAWER */}

          <aside
            className="
              absolute
              left-0
              top-0
              flex
              h-full
              w-[310px]
              flex-col
              bg-white
              shadow-2xl
            "
          >

            {/* DRAWER HEADER */}

            <div
              className="
                flex
                h-[76px]
                shrink-0
                items-center
                justify-between
                border-b
                border-gray-100
                px-5
              "
            >

              <img
                src={logo}
                alt="Dexora Technologies"
                className="w-[145px]"
              />


              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-xl
                  bg-gray-100
                  text-gray-700
                  transition
                  hover:bg-gray-200
                "
                aria-label="Close menu"
              >

                <X className="h-5 w-5" />

              </button>

            </div>


            {/* QUICK ACTIONS */}

            <div
              className="
                grid
                grid-cols-3
                gap-2
                border-b
                border-gray-100
                p-4
              "
            >

              <MobileQuickAction
                icon={
                  <UserRound className="h-4 w-4" />
                }
                label="Account"
                href="/account"
              />

              <MobileQuickAction
                icon={
                  <Heart className="h-4 w-4" />
                }
                label="Wishlist"
                href="/wishlist"
              />

              <MobileQuickAction
                icon={
                  <ShoppingCart className="h-4 w-4" />
                }
                label="Cart"
                href="/cart"
              />

            </div>


            {/* MOBILE MENU */}

            {headerActive && (

              <div
                className="
                  flex-1
                  overflow-y-auto
                  p-4
                "
              >

                <div
                  className="
                    mb-3
                    flex
                    items-center
                    justify-between
                    px-2
                  "
                >

                  <p
                    className="
                      text-[11px]
                      font-bold
                      uppercase
                      tracking-wider
                      text-gray-400
                    "
                  >
                    Shop Categories
                  </p>

                </div>


                <div className="space-y-1">

                  {/* LOADING */}

                  {menuLoading && (

                    <>
                      {Array.from({
                        length: 6,
                      }).map((_, index) => (

                        <div
                          key={index}
                          className="
                            h-11
                            animate-pulse
                            rounded-xl
                            bg-gray-100
                          "
                        />

                      ))}
                    </>

                  )}


                  {/* ERROR */}

                  {!menuLoading &&
                    menuError && (

                      <p
                        className="
                          px-2
                          text-[12px]
                          text-gray-400
                        "
                      >
                        Unable to load menu.
                      </p>

                    )}


                  {/* MENU ITEMS */}

                  {!menuLoading &&
                    !menuError &&
                    menuItems.map((item) => (

                      <MobileMenuItem
                        key={item.id}
                        item={item}
                      />

                    ))}


                  {/* DEALS */}

                  {menuSettings?.showDeals !== false && (

                    <a
                      href="/shop?flashSale=true"
                      className="
                        mt-2
                        flex
                        items-center
                        gap-2
                        rounded-xl
                        bg-[#fff7f2]
                        px-3.5
                        py-3
                        text-[13px]
                        font-bold
                        text-[#ff6b00]
                      "
                    >

                      <Flame className="h-4 w-4" />

                      Deals & Offers

                    </a>

                  )}

                </div>

              </div>

            )}


            {/* SUPPORT */}

            <div
              className="
                border-t
                border-gray-100
                p-4
              "
            >

              <div
                className="
                  flex
                  items-center
                  gap-3
                  rounded-xl
                  bg-[#f8fafc]
                  p-3
                "
              >

                <div
                  className="
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-full
                    bg-[#0757c9]
                    text-white
                  "
                >

                  <Headphones className="h-4 w-4" />

                </div>


                <div>

                  <p
                    className="
                      text-[10px]
                      text-gray-400
                    "
                  >
                    Need help?
                  </p>

                  <p
                    className="
                      text-[12px]
                      font-semibold
                      text-gray-800
                    "
                  >
                    Customer Support
                  </p>

                </div>

              </div>

            </div>

          </aside>

        </div>

      )}

      <MobileBottomNav />
    </>
  );
}


/* ============================================================
   DESKTOP MENU ITEM
============================================================ */

function DesktopMenuItem({
  item,
}: {
  item: MenuItem;
}) {

  const hasChildren =
    Array.isArray(item.children) &&
    item.children.length > 0;


  return (

    <div
      className="
        group
        relative
        flex
        h-full
        items-center
      "
    >

      {/* MAIN LINK */}

      <a
        href={menuHref(item)}
        target={
          item.openInNewTab
            ? "_blank"
            : undefined
        }
        rel={
          item.openInNewTab
            ? "noreferrer"
            : undefined
        }
        className="
          relative
          flex
          h-full
          items-center
          gap-1.5
          whitespace-nowrap
          px-1.5
          text-[12px]
          font-medium
          text-gray-700
          transition
          hover:text-[#0757c9]
        "
      >

        <span>
          {item.title}
        </span>


        {/* BADGE */}

        {item.badgeText && (

          <span
            className={`
              absolute
              -right-2
              top-[3px]
              rounded-full
              px-1.5
              py-[1px]
              text-[7px]
              font-bold
              leading-none
              text-white
              ${
                item.badgeType?.toLowerCase() === "new"
                  ? "bg-[#0757c9]"
                  : "bg-[#ff6b00]"
              }
            `}
          >
            {item.badgeText}
          </span>

        )}


        {/* CHILD ARROW */}

        {hasChildren && (

          <ChevronDown
            className="
              h-3
              w-3
              text-gray-400
              transition-transform
              duration-200
              group-hover:rotate-180
            "
          />

        )}


        {/* HOVER LINE */}

        <span
          className="
            absolute
            bottom-0
            left-1/2
            h-[2px]
            w-0
            -translate-x-1/2
            rounded-full
            bg-[#0757c9]
            transition-all
            duration-200
            group-hover:w-[80%]
          "
        />

      </a>


      {/* ======================================================
          DROPDOWN
      ====================================================== */}

      {hasChildren && (

        <div
          className="
            invisible
            absolute
            left-0
            top-[calc(100%-1px)]
            z-[99999]
            w-[260px]
            pt-2
            translate-y-2
            opacity-0
            pointer-events-none
            transition-all
            duration-200
            group-hover:visible
            group-hover:translate-y-0
            group-hover:opacity-100
            group-hover:pointer-events-auto
          "
        >

          <div
            className="
              overflow-visible
              rounded-xl
              border
              border-gray-100
              bg-white
              p-2
              shadow-[0_18px_45px_rgba(15,23,42,0.16)]
            "
          >

            {/* DROPDOWN TITLE */}

            <div
              className="
                mb-1
                border-b
                border-gray-100
                px-3
                py-2
              "
            >

              <p
                className="
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-wider
                  text-gray-400
                "
              >
                {item.title}
              </p>

            </div>


            {/* CHILDREN */}

            {item.children
              .slice()
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((child) => (
                <DesktopSubmenuItem key={child.id} item={child} />
              ))}

          </div>

        </div>

      )}

    </div>

  );
}


/* ============================================================
   MOBILE MENU ITEM
============================================================ */

function MobileMenuItem({
  item,
  depth = 0,
}: {
  item: MenuItem;
  depth?: number;
}) {

  const [open, setOpen] =
    useState(false);

  const hasChildren =
    Array.isArray(item.children) &&
    item.children.length > 0;


  return (

    <div className="mb-1">

      <div className="flex items-center">

        <a
          href={menuHref(item)}
          target={
            item.openInNewTab
              ? "_blank"
              : undefined
          }
          rel={
            item.openInNewTab
              ? "noreferrer"
              : undefined
          }
          className="
            flex
            flex-1
            items-center
            rounded-xl
            px-3.5
            py-3
            text-[13px]
            font-medium
            text-gray-700
            transition
            hover:bg-[#f5f8ff]
            hover:text-[#0757c9]
          "
        >

          <span>
            {item.title}
          </span>


          {item.badgeText && (

            <span
              className={`
                ml-2
                rounded-full
                px-1.5
                py-[1px]
                text-[7px]
                font-bold
                text-white
                ${
                  item.badgeType?.toLowerCase() === "new"
                    ? "bg-[#0757c9]"
                    : "bg-[#ff6b00]"
                }
              `}
            >
              {item.badgeText}
            </span>

          )}

        </a>


        {hasChildren && (

          <button
            type="button"
            onClick={() =>
              setOpen(
                previous =>
                  !previous
              )
            }
            className="
              mr-1
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              text-gray-400
              transition
              hover:bg-gray-100
              hover:text-[#0757c9]
            "
            aria-label={`Toggle ${item.title}`}
          >

            <ChevronDown
              className={`
                h-4
                w-4
                transition-transform
                duration-200
                ${
                  open
                    ? "rotate-180"
                    : ""
                }
              `}
            />

          </button>

        )}

      </div>


      {/* CHILDREN */}

      {hasChildren && open && (

        <div
          className="
            ml-4
            mt-1
            space-y-1
            border-l
            border-gray-100
            pl-2
          "
        >

          {item.children
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((child) => (
              <MobileMenuItem
                key={child.id}
                item={child}
                depth={depth + 1}
              />
            ))}

        </div>

      )}

    </div>

  );
}


/* ============================================================
   HEADER ACTION
============================================================ */

function HeaderAction({
  icon,
  label,
  badge,
  href,
}: {
  icon: ReactNode;
  label: string;
  badge: string;
  href: string;
}) {

  return (

    <button
      type="button"
      onClick={() => { window.location.href = href; }}
      className="
        group
        relative
        hidden
        h-[52px]
        min-w-[57px]
        flex-col
        items-center
        justify-center
        rounded-xl
        text-gray-500
        transition
        hover:bg-[#f8fafc]
        hover:text-[#0757c9]
        sm:flex
      "
    >

      <div
        className="
          transition-transform
          duration-200
          group-hover:-translate-y-0.5
        "
      >
        {icon}
      </div>


      <span
        className="
          mt-1
          text-[9px]
          font-medium
        "
      >
        {label}
      </span>


      <span
        className="
          absolute
          right-0.5
          top-1
          flex
          h-[16px]
          min-w-[16px]
          items-center
          justify-center
          rounded-full
          bg-[#ff6b00]
          px-1
          text-[7px]
          font-bold
          text-white
        "
      >
        {badge}
      </span>

    </button>

  );
}


/* ============================================================
   MOBILE QUICK ACTION
============================================================ */

function MobileQuickAction({
  icon,
  label,
  href,
}: {
  icon: ReactNode;
  label: string;
  href: string;
}) {

  return (

    <button
      type="button"
      onClick={() => { window.location.href = href; }}
      className="
        flex
        flex-col
        items-center
        justify-center
        gap-1.5
        rounded-xl
        bg-[#f8fafc]
        py-3
        text-gray-600
        transition
        hover:bg-[#f1f5f9]
        hover:text-[#0757c9]
      "
    >

      {icon}

      <span
        className="
          text-[9px]
          font-medium
        "
      >
        {label}
      </span>

    </button>

  );
}


/* ============================================================
   MENU SKELETON
============================================================ */

function MenuSkeleton({
  width,
}: {
  width: string;
}) {

  return (

    <div
      className={`
        ${width}
        h-3
        animate-pulse
        rounded
        bg-gray-100
      `}
    />

  );

}

function DesktopSubmenuItem({ item }: { item: MenuItem }) {
  const hasChildren = item.children?.length > 0;
  return <div className="submenu-parent">
    <a href={menuHref(item)} target={item.openInNewTab ? "_blank" : undefined} rel={item.openInNewTab ? "noreferrer" : undefined} className="flex items-center justify-between rounded-lg px-3 py-2.5 text-[12px] font-medium text-gray-700 transition hover:bg-[#f5f8ff] hover:text-[#0757c9]">
      <span>{item.title}</span>
      <span className="flex items-center gap-2">{item.badgeText && <span className="rounded-full bg-[#ff6b00] px-1.5 py-[1px] text-[7px] font-bold text-white">{item.badgeText}</span>}{hasChildren && <ChevronRight className="h-3 w-3 text-gray-400" />}</span>
    </a>
    {hasChildren && <div className="submenu-panel absolute left-full top-0 z-[99999] w-[230px] pl-2"><div className="rounded-xl border border-gray-100 bg-white p-2 shadow-[0_18px_45px_rgba(15,23,42,0.16)]">{item.children.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((child) => <DesktopSubmenuItem key={child.id} item={child} />)}</div></div>}
  </div>;
}

function buildCategoryTree(categories: Category[]) {
  const nodes = new Map(categories.filter((category) => category.isActive).map((category) => [category.id, { ...category, children: [] as Category[] }]));
  const roots: Category[] = [];
  nodes.forEach((category) => {
    if (category.parentCategoryId && nodes.has(category.parentCategoryId)) nodes.get(category.parentCategoryId)!.children!.push(category);
    else roots.push(category);
  });
  return roots.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
}

function CategoryMenuItem({ category, onSelect }: { category: Category; onSelect: () => void }) {
  const hasChildren = Boolean(category.children?.length);
  return <div className="submenu-parent"><a href={`/shop?category=${category.id}`} onClick={onSelect} className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-600"><span>{category.name}</span>{hasChildren && <ChevronRight className="h-4 w-4 text-slate-400" />}</a>{hasChildren && <div className="submenu-panel absolute left-full top-0 z-[99999] w-[240px] pl-2"><div className="rounded-xl border border-slate-200 bg-white p-2 shadow-[0_18px_45px_rgba(15,23,42,0.16)]">{category.children!.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)).map((child) => <CategoryMenuItem key={child.id} category={child} onSelect={onSelect} />)}</div></div>}</div>;
}

const searchMoney = (value: number) => `৳${new Intl.NumberFormat("en-BD").format(value || 0)}`;
const money = searchMoney;