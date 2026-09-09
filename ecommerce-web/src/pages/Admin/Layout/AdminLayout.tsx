import {
  BarChart3,
  Boxes,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Flame,
  FolderTree,
  LayoutDashboard,
  Menu,
  MonitorSmartphone,
  PanelTop,
  Images,
  PackageSearch,
  ShoppingCart,
  Store,
  Tags,
  TicketPercent,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  {
    label: "Dashboard",
    path: "/admin",
    icon: LayoutDashboard,
    available: true,
  },
  {
    label: "Products",
    path: "/admin/products",
    icon: Boxes,
    available: true,
  },
  {
    label: "Categories",
    path: "/admin/categories",
    icon: FolderTree,
    available: true,
  },
  {
    label: "Brands",
    path: "/admin/brands",
    icon: Tags,
    available: true,
  },
  {
    label: "Orders",
    path: "/admin/orders",
    icon: ShoppingCart,
    available: true,
  },
  {
    label: "POS Terminal",
    path: "/admin/pos",
    icon: MonitorSmartphone,
    available: true,
  },
  {
    label: "Inventory",
    path: "/admin/inventory",
    icon: PackageSearch,
    available: true,
  },
  {
    label: "Customers",
    path: "/admin/customers",
    icon: Users,
    available: true,
  },
  {
    label: "Payments",
    path: "/admin/payments",
    icon: ClipboardList,
    available: true,
  },
  {
    label: "Reports",
    path: "/admin/reports",
    icon: BarChart3,
    available: true,
  },
  {
    label: "Menu Management",
    path: "/admin/menus",
    icon: Menu,
    available: true,
  },
  {
    label: "Header Settings",
    path: "/admin/header-settings",
    icon: PanelTop,
    available: true,
  },
  {
    label: "Homepage Slider",
    path: "/admin/homepage-slider",
    icon: Images,
    available: true,
  },
  {
    label: "Flash Sale",
    path: "/admin/flash-sales",
    icon: Flame,
    available: true,
  },
  {
    label: "Coupons",
    path: "/admin/coupons",
    icon: TicketPercent,
    available: true,
  },
];

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentPath = window.location.pathname;

  const currentPage =
    menuItems.find(
      (item) =>
        item.path === currentPath ||
        (item.path !== "/admin" &&
          currentPath.startsWith(item.path))
    )?.label || "Dashboard";

  const navigate = (path: string, available: boolean) => {
    if (!available) return;

    window.location.href = path;
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-slate-900">

      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col
          bg-[#0b1220] text-white
          transition-all duration-200
          ${collapsed ? "w-[78px]" : "w-[250px]"}
          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >

        {/* BRAND */}

        <div className="flex h-[76px] items-center border-b border-white/10 px-4">

          <div className="flex min-w-0 flex-1 items-center gap-3">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ff6b00] shadow-lg">
              <Store size={20} />
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-[15px] font-bold">
                  Dexora Admin
                </div>

                <div className="truncate text-[11px] text-slate-400">
                  Ecommerce Control Center
                </div>
              </div>
            )}

          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={18} />
          </button>

        </div>

        {/* NAVIGATION */}

        <div className="flex-1 overflow-y-auto px-3 py-5">

          {!collapsed && (
            <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
              Management
            </div>
          )}

          <nav className="space-y-1.5">

            {menuItems.map((item) => {

              const Icon = item.icon;

              const active =
                item.path === "/admin"
                  ? currentPath === "/admin" ||
                    currentPath === "/admin/"
                  : currentPath.startsWith(item.path);

              return (
                <button
                  key={item.path}
                  type="button"
                  disabled={!item.available}
                  onClick={() =>
                    navigate(item.path, item.available)
                  }
                  title={
                    collapsed
                      ? item.available
                        ? item.label
                        : `${item.label} - Coming Soon`
                      : undefined
                  }
                  className={`
                    group flex h-11 w-full items-center gap-3
                    rounded-xl px-3 text-sm font-medium
                    transition
                    ${collapsed ? "justify-center" : ""}
                    ${
                      active
                        ? "bg-[#ff6b00] text-white shadow-lg shadow-orange-950/20"
                        : item.available
                        ? "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                        : "cursor-not-allowed text-slate-600"
                    }
                  `}
                >

                  <Icon size={18} />

                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">
                        {item.label}
                      </span>

                      {!item.available && (
                        <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[9px] font-semibold text-slate-500">
                          Soon
                        </span>
                      )}
                    </>
                  )}

                </button>
              );
            })}

          </nav>
        </div>

        {/* ADMIN PROFILE */}

        <div className="border-t border-white/10 p-3">

          <div
            className={`
              flex items-center gap-3 rounded-xl px-3 py-3
              ${collapsed ? "justify-center" : ""}
            `}
          >

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold">
              AD
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">
                  Administrator
                </div>

                <div className="truncate text-[11px] text-slate-500">
                  Admin Account
                </div>
              </div>
            )}

          </div>

          {/* COLLAPSE */}

          <button
            type="button"
            onClick={() =>
              setCollapsed((value) => !value)
            }
            className="mt-2 hidden h-9 w-full items-center justify-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white lg:flex"
          >
            {collapsed ? (
              <ChevronRight size={17} />
            ) : (
              <ChevronLeft size={17} />
            )}
          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div
        className={`
          min-h-screen transition-[margin] duration-200
          ${
            collapsed
              ? "lg:ml-[78px]"
              : "lg:ml-[250px]"
          }
        `}
      >

        {/* TOP HEADER */}

        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">

          <div className="flex items-center gap-3">

            {/* MOBILE MENU */}

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
            >
              <Menu size={19} />
            </button>

            <div>
              <div className="text-sm font-semibold text-slate-900">
                {currentPage}
              </div>

              <div className="text-xs text-slate-400">
                Admin / {currentPage}
              </div>
            </div>

          </div>

          {/* VIEW STORE */}

          <button
            type="button"
            onClick={() =>
              (window.location.href = "/")
            }
            className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:flex"
          >
            <Store size={15} />
            View Store
          </button>

        </header>

        {/* PAGE */}

        <main>
          {children}
        </main>

      </div>

    </div>
  );
}