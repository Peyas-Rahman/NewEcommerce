import {
  ArrowUpRight,
  Boxes,
  CheckCircle2,
  DollarSign,
  FolderTree,
  RefreshCw,
  ShoppingCart,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://localhost:7090/api";

interface Order {
  id: number;
  orderNumber?: string;
  guestName?: string;
  shippingName?: string;
  shippingPhone?: string;
  grandTotal?: number;
  totalAmount?: number;
  orderStatus?: string;
  createdAt?: string;
}

interface Product {
  id: number;
  name: string;
  isActive?: boolean;
}

interface Category {
  id: number;
  name: string;
  parentCategoryId?: number | null;
}

interface Brand {
  id: number;
  name: string;
}

async function getArray<T>(
  url: string
): Promise<T[]> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Request failed: ${response.status}`
    );
  }

  const data = await response.json();

  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.items))
    return data.items;

  if (Array.isArray(data?.data))
    return data.data;

  if (Array.isArray(data?.products))
    return data.products;

  if (Array.isArray(data?.orders))
    return data.orders;

  if (Array.isArray(data?.results))
    return data.results;

  return [];
}

function money(value: number) {
  return `৳${new Intl.NumberFormat("en-BD", {
    maximumFractionDigits: 0,
  }).format(value || 0)}`;
}

function statusClass(status?: string) {

  if (status === "Delivered") {
    return "bg-green-50 text-green-700 border-green-200";
  }

  if (status === "Cancelled") {
    return "bg-red-50 text-red-700 border-red-200";
  }

  if (status === "Shipped") {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }

  if (status === "Processing") {
    return "bg-violet-50 text-violet-700 border-violet-200";
  }

  return "bg-amber-50 text-amber-700 border-amber-200";
}

export default function AdminDashboard() {

  const [orders, setOrders] =
    useState<Order[]>([]);

  const [products, setProducts] =
    useState<Product[]>([]);

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [brands, setBrands] =
    useState<Brand[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadDashboard = async () => {

    try {

      setLoading(true);
      setError("");

      const results =
        await Promise.allSettled([
          getArray<Order>(
            `${API_BASE_URL}/orders`
          ),

          getArray<Product>(
            `${API_BASE_URL}/Products`
          ),

          getArray<Category>(
            `${API_BASE_URL}/categories`
          ),

          getArray<Brand>(
            `${API_BASE_URL}/brands`
          ),
        ]);

      setOrders(
        results[0].status === "fulfilled"
          ? results[0].value
          : []
      );

      setProducts(
        results[1].status === "fulfilled"
          ? results[1].value
          : []
      );

      setCategories(
        results[2].status === "fulfilled"
          ? results[2].value
          : []
      );

      setBrands(
        results[3].status === "fulfilled"
          ? results[3].value
          : []
      );

      if (
        results.every(
          (result) =>
            result.status === "rejected"
        )
      ) {
        setError(
          "Unable to load dashboard data."
        );
      }

    } catch (err: any) {

      setError(
        err?.message ||
          "Unable to load dashboard data."
      );

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const stats = useMemo(() => {

    const sales = orders
      .filter(
        (order) =>
          order.orderStatus !==
          "Cancelled"
      )
      .reduce(
        (sum, order) =>
          sum +
          Number(
            order.grandTotal ??
              order.totalAmount ??
              0
          ),
        0
      );

    return {

      sales,

      orders:
        orders.length,

      products:
        products.length,

      customers:
        new Set(
          orders
            .map(
              (order) =>
                order.shippingPhone ||
                order.guestName ||
                order.shippingName
            )
            .filter(Boolean)
        ).size,

      pending:
        orders.filter(
          (x) =>
            x.orderStatus ===
            "Pending"
        ).length,

      processing:
        orders.filter((x) =>
          [
            "Confirmed",
            "Processing",
          ].includes(
            x.orderStatus || ""
          )
        ).length,

      shipped:
        orders.filter(
          (x) =>
            x.orderStatus ===
            "Shipped"
        ).length,

      delivered:
        orders.filter(
          (x) =>
            x.orderStatus ===
            "Delivered"
        ).length,

      cancelled:
        orders.filter(
          (x) =>
            x.orderStatus ===
            "Cancelled"
        ).length,
    };

  }, [orders, products]);

  const recentOrders =
    useMemo(
      () =>
        [...orders]
          .sort(
            (a, b) =>
              new Date(
                b.createdAt || 0
              ).getTime() -
              new Date(
                a.createdAt || 0
              ).getTime()
          )
          .slice(0, 6),
      [orders]
    );

  const orderStatus = [
    ["Pending", stats.pending],
    ["Processing", stats.processing],
    ["Shipped", stats.shipped],
    ["Delivered", stats.delivered],
    ["Cancelled", stats.cancelled],
  ] as const;

  const maxStatus = Math.max(
    ...orderStatus.map(
      ([, value]) => value
    ),
    1
  );

  return (
    <div className="min-h-screen">

      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">

        {/* HEADER */}

        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#ff6b00]">

              <TrendingUp size={13} />

              Store Overview

            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">

              Good day, Administrator

            </h1>

            <p className="mt-1 text-sm text-slate-500">

              Here is what is happening across your store.

            </p>

          </div>

          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
            className="flex h-10 items-center gap-2 self-start rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
          >

            <RefreshCw
              size={16}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh

          </button>

        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* KPI */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <Kpi
            title="Total Sales"
            value={money(stats.sales)}
            subtitle="From non-cancelled orders"
            icon={<DollarSign size={19} />}
          />

          <Kpi
            title="Total Orders"
            value={stats.orders}
            subtitle={`${stats.pending} currently pending`}
            icon={<ShoppingCart size={19} />}
          />

          <Kpi
            title="Products"
            value={stats.products}
            subtitle={`${products.filter(
              (x) => x.isActive !== false
            ).length} active products`}
            icon={<Boxes size={19} />}
          />

          <Kpi
            title="Customers"
            value={stats.customers}
            subtitle="Unique customers in orders"
            icon={<Users size={19} />}
          />

        </div>

        {/* QUICK ACTIONS */}

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">

          <QuickLink
            path="/admin/products"
            icon={<Boxes size={18} />}
            label="Manage Products"
          />

          <QuickLink
            path="/admin/categories"
            icon={<FolderTree size={18} />}
            label="Manage Categories"
          />

          <QuickLink
            path="/admin/orders"
            icon={<ShoppingCart size={18} />}
            label="Manage Orders"
          />

          <QuickLink
            path="/admin/inventory"
            icon={<ShoppingCart size={18} />}
            label="Manage Inventory"
          />


        </div>

        {/* MAIN */}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.55fr_1fr]">

          {/* RECENT ORDERS */}

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <SectionHeader
              title="Recent Orders"
              subtitle="Latest customer activity"
              path="/admin/orders"
            />

            {loading ? (
              <Loading />
            ) : recentOrders.length === 0 ? (
              <Empty />
            ) : (
              <div className="divide-y divide-slate-100">

                {recentOrders.map(
                  (order) => {

                    const total =
                      Number(
                        order.grandTotal ??
                          order.totalAmount ??
                          0
                      );

                    return (
                      <div
                        key={order.id}
                        className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center"
                      >

                        <div className="flex min-w-0 flex-1 items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#ff6b00]">

                            <ShoppingCart size={17} />

                          </div>

                          <div className="min-w-0">

                            <div className="truncate text-sm font-bold">

                              {order.orderNumber ||
                                `Order #${order.id}`}

                            </div>

                            <div className="mt-0.5 truncate text-xs text-slate-400">

                              {order.shippingName ||
                                order.guestName ||
                                "Customer"}

                              {" · "}

                              {order.createdAt
                                ? new Date(
                                    order.createdAt
                                  ).toLocaleDateString(
                                    "en-BD"
                                  )
                                : "—"}

                            </div>

                          </div>

                        </div>

                        <span
                          className={`w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold ${statusClass(
                            order.orderStatus
                          )}`}
                        >
                          {order.orderStatus ||
                            "Pending"}
                        </span>

                        <div className="font-bold sm:w-28 sm:text-right">

                          {money(total)}

                        </div>

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </section>

          {/* STATUS */}

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <SectionHeader
              title="Order Status"
              subtitle="Current fulfillment pipeline"
            />

            <div className="space-y-4">

              {orderStatus.map(
                ([label, value]) => (

                  <div key={label}>

                    <div className="mb-1.5 flex justify-between text-xs">

                      <span className="font-semibold text-slate-600">
                        {label}
                      </span>

                      <b>{value}</b>

                    </div>

                    <div className="h-2 rounded-full bg-slate-100">

                      <div
                        className="h-full rounded-full bg-[#ff6b00] transition-all"
                        style={{
                          width:
                            value === 0
                              ? "0%"
                              : `${Math.max(
                                  (value /
                                    maxStatus) *
                                    100,
                                  5
                                )}%`,
                        }}
                      />

                    </div>

                  </div>

                )
              )}

            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5">

              <MiniStatus
                icon={
                  <CheckCircle2 size={16} />
                }
                label="Delivered"
                value={stats.delivered}
              />

              <MiniStatus
                icon={
                  <XCircle size={16} />
                }
                label="Cancelled"
                value={stats.cancelled}
              />

            </div>

          </section>

        </div>

        {/* CATALOG */}

        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">

          <Catalog
            icon={<Boxes size={20} />}
            title="Products"
            value={products.length}
            text="Total products in catalog"
            path="/admin/products"
          />

          <Catalog
            icon={<FolderTree size={20} />}
            title="Categories"
            value={categories.length}
            text={`${categories.filter(
              (x) =>
                x.parentCategoryId != null
            ).length} sub-categories`}
            path="/admin/categories"
          />

          <Catalog
            icon={<Users size={20} />}
            title="Brands"
            value={brands.length}
            text="Brands available in catalog"
          />

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   COMPONENTS
========================================================= */

function Kpi({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
}) {

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight">
            {value}
          </p>

        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#ff6b00]">

          {icon}

        </div>

      </div>

      <p className="mt-3 text-xs text-slate-400">
        {subtitle}
      </p>

    </div>
  );
}


function QuickLink({
  path,
  icon,
  label,
}: {
  path: string;
  icon: React.ReactNode;
  label: string;
}) {

  return (
    <button
      type="button"
      onClick={() =>
        (window.location.href = path)
      }
      className="flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 shadow-sm transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#ff6b00]"
    >
      {icon}
      {label}
    </button>
  );
}


function SectionHeader({
  title,
  subtitle,
  path,
}: {
  title: string;
  subtitle: string;
  path?: string;
}) {

  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

      <div>

        <h2 className="font-bold">
          {title}
        </h2>

        <p className="mt-0.5 text-xs text-slate-400">
          {subtitle}
        </p>

      </div>

      {path && (
        <button
          type="button"
          onClick={() =>
            (window.location.href = path)
          }
          className="flex items-center gap-1 text-xs font-bold text-[#ff6b00] hover:underline"
        >
          View all
          <ArrowUpRight size={14} />
        </button>
      )}

    </div>
  );
}


function MiniStatus({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {

  return (
    <div className="rounded-xl bg-slate-50 p-3">

      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">

        {icon}

        {label}

      </div>

      <div className="mt-1 text-lg font-bold">
        {value}
      </div>

    </div>
  );
}


function Catalog({
  icon,
  title,
  value,
  text,
  path,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  text: string;
  path?: string;
}) {

  const content = (
    <>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        {icon}
      </div>

      <div className="min-w-0 flex-1">

        <div className="flex items-center justify-between">

          <span className="text-sm font-bold">
            {title}
          </span>

          <b className="text-xl">
            {value}
          </b>

        </div>

        <p className="mt-1 truncate text-xs text-slate-400">
          {text}
        </p>

      </div>
    </>
  );

  if (!path) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() =>
        (window.location.href = path)
      }
      className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-orange-200 hover:shadow-md"
    >
      {content}
    </button>
  );
}


function Loading() {

  return (
    <div className="flex min-h-[280px] items-center justify-center gap-2 text-sm text-slate-400">

      <RefreshCw
        size={17}
        className="animate-spin"
      />

      Loading...

    </div>
  );
}


function Empty() {

  return (
    <div className="flex min-h-[280px] items-center justify-center text-sm text-slate-400">
      No orders available
    </div>
  );
}