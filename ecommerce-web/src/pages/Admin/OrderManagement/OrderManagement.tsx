import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Search,
  RefreshCw,
  Eye,
  X,
  Package,
  User,
  MapPin,
  CreditCard,
  Clock3,
  Loader2,
  Truck,
  CheckCircle2,
  XCircle,
  ShoppingBag,
} from "lucide-react";

import type { Order } from "../../../types/order";
import orderService from "../../../services/orderService";

const STATUS_OPTIONS = [
  "Pending",
  "Confirmed",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const STATUS_FLOW: Record<string, string[]> = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Processing", "Cancelled"],
  Processing: ["Shipped", "Cancelled"],
  Shipped: ["Delivered"],
  Delivered: [],
  Cancelled: [],
};

const money = (value: number) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(value);

const dateTime = (value: string) =>
  new Date(value).toLocaleString("en-BD", {
    dateStyle: "medium",
    timeStyle: "short",
  });

function statusClass(status: string) {
  switch (status) {
    case "Delivered":
      return "bg-green-50 text-green-700 border-green-200";
    case "Shipped":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Processing":
      return "bg-violet-50 text-violet-700 border-violet-200";
    case "Confirmed":
      return "bg-cyan-50 text-cyan-700 border-cyan-200";
    case "Cancelled":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-amber-50 text-amber-700 border-amber-200";
  }
}

function StatusIcon({ status }: { status: string }) {
  if (status === "Delivered") return <CheckCircle2 size={14} />;
  if (status === "Cancelled") return <XCircle size={14} />;
  if (status === "Shipped") return <Truck size={14} />;
  if (status === "Processing") return <Package size={14} />;
  return <Clock3 size={14} />;
}

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);
  const [nextStatus, setNextStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await orderService.getAllOrders();
      setOrders(data);
    } catch (err: any) {
      console.error("ORDER LOAD ERROR:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load orders."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();

    return orders.filter((order) => {
      const customer =
        order.guestName ||
        order.shippingName ||
        "Customer";

      const matchesSearch =
        !term ||
        order.orderNumber.toLowerCase().includes(term) ||
        customer.toLowerCase().includes(term) ||
        (order.guestPhone || order.shippingPhone || "")
          .toLowerCase()
          .includes(term) ||
        order.paymentMethod.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "All" ||
        order.orderStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const stats = useMemo(() => {
    const totalRevenue = orders
      .filter((x) => x.orderStatus !== "Cancelled")
      .reduce((sum, x) => sum + x.grandTotal, 0);

    return {
      total: orders.length,
      pending: orders.filter((x) => x.orderStatus === "Pending").length,
      processing: orders.filter((x) =>
        ["Confirmed", "Processing", "Shipped"].includes(x.orderStatus)
      ).length,
      delivered: orders.filter((x) => x.orderStatus === "Delivered").length,
      revenue: totalRevenue,
    };
  }, [orders]);

  const openDetails = (order: Order) => {
    setSelectedOrder(order);
    setNextStatus("");
    setStatusNote("");
    setError("");
  };

  const closeDetails = () => {
    if (updating) return;
    setSelectedOrder(null);
    setNextStatus("");
    setStatusNote("");
  };

  const refreshSelected = async (id: number) => {
    const fresh = await orderService.getOrderById(id);
    setSelectedOrder(fresh);
    setOrders((previous) =>
      previous.map((order) =>
        order.id === id ? fresh : order
      )
    );
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !nextStatus) return;

    try {
      setUpdating(true);
      setError("");
      setSuccess("");

      await orderService.updateOrderStatus(
        selectedOrder.id,
        nextStatus,
        statusNote
      );

      await refreshSelected(selectedOrder.id);

      setSuccess(
        `Order ${selectedOrder.orderNumber} status updated to ${nextStatus}.`
      );
      setNextStatus("");
      setStatusNote("");
    } catch (err: any) {
      console.error("ORDER STATUS ERROR:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update order status."
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedOrder) return;

    const confirmed = window.confirm(
      `Cancel order ${selectedOrder.orderNumber}?`
    );

    if (!confirmed) return;

    try {
      setUpdating(true);
      setError("");
      setSuccess("");

      await orderService.cancelOrder(
        selectedOrder.id,
        statusNote
      );

      await refreshSelected(selectedOrder.id);

      setSuccess(
        `Order ${selectedOrder.orderNumber} cancelled successfully.`
      );
      setStatusNote("");
    } catch (err: any) {
      console.error("ORDER CANCEL ERROR:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to cancel order."
      );
    } finally {
      setUpdating(false);
    }
  };

  const customerName = (order: Order) =>
    order.guestName ||
    order.shippingName ||
    "Customer";

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1500px] px-5 py-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ff6b00] text-white">
                <ShoppingBag size={21} />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Order Management
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Manage orders, payments and fulfillment status.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={loadOrders}
              disabled={loading}
              className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] px-5 py-6 lg:px-8">
        {success && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")}>
              <X size={17} />
            </button>
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <Stat label="Total Orders" value={stats.total} />
          <Stat label="Pending" value={stats.pending} />
          <Stat label="In Progress" value={stats.processing} />
          <Stat label="Delivered" value={stats.delivered} />
          <Stat
            label="Revenue"
            value={money(stats.revenue)}
            wide
          />
        </div>

        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row">
          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search order number, customer, phone..."
              className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-[#ff6b00] focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 rounded-lg border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[#ff6b00]"
          >
            <option value="All">All Statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[150px_1fr_150px_140px_130px_90px] items-center gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 lg:grid">
            <div>Order</div>
            <div>Customer</div>
            <div>Status</div>
            <div>Payment</div>
            <div>Total</div>
            <div className="text-right">Action</div>
          </div>

          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center gap-3 text-sm text-slate-500">
              <Loader2 size={20} className="animate-spin" />
              Loading orders...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
              <ShoppingBag size={40} className="text-slate-300" />
              <h3 className="mt-4 font-semibold text-slate-900">
                No orders found
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or status filter.
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className="grid grid-cols-1 gap-3 border-b border-slate-100 px-5 py-4 transition hover:bg-slate-50 lg:grid-cols-[150px_1fr_150px_140px_130px_90px] lg:items-center"
              >
                <div>
                  <div className="font-semibold text-slate-900">
                    {order.orderNumber}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {dateTime(order.createdAt)}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 font-medium text-slate-800">
                    <User size={15} className="text-slate-400" />
                    {customerName(order)}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {order.shippingPhone}
                  </div>
                </div>

                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
                      order.orderStatus
                    )}`}
                  >
                    <StatusIcon status={order.orderStatus} />
                    {order.orderStatus}
                  </span>
                </div>

                <div>
                  <div className="font-medium text-slate-700">
                    {order.paymentMethod || "—"}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {order.paymentStatus || "—"}
                  </div>
                </div>

                <div className="font-bold text-slate-900">
                  {money(order.grandTotal)}
                </div>

                <div className="flex lg:justify-end">
                  <button
                    type="button"
                    onClick={() => openDetails(order)}
                    className="flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:border-orange-200 hover:bg-orange-50 hover:text-[#ff6b00]"
                  >
                    <Eye size={15} />
                    View
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Order {selectedOrder.orderNumber}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {dateTime(selectedOrder.createdAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={closeDetails}
                disabled={updating}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X size={19} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                  {success}
                </div>
              )}

              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                <InfoCard
                  icon={<User size={18} />}
                  title="Customer"
                >
                  <div className="font-semibold text-slate-800">
                    {customerName(selectedOrder)}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {selectedOrder.shippingPhone}
                  </div>
                  {selectedOrder.guestEmail && (
                    <div className="mt-1 break-all text-sm text-slate-500">
                      {selectedOrder.guestEmail}
                    </div>
                  )}
                </InfoCard>

                <InfoCard
                  icon={<MapPin size={18} />}
                  title="Shipping"
                >
                  <div className="font-semibold text-slate-800">
                    {selectedOrder.shippingName}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {selectedOrder.shippingAddress}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {[
                      selectedOrder.shippingArea,
                      selectedOrder.shippingCity,
                      selectedOrder.shippingPostalCode,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                  </div>
                </InfoCard>

                <InfoCard
                  icon={<CreditCard size={18} />}
                  title="Payment"
                >
                  <div className="font-semibold text-slate-800">
                    {selectedOrder.paymentMethod || "—"}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Status: {selectedOrder.paymentStatus || "—"}
                  </div>
                  <div className="mt-2 text-lg font-bold text-slate-900">
                    {money(selectedOrder.grandTotal)}
                  </div>
                </InfoCard>
              </div>

              <div className="mb-6 rounded-xl border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800">
                  Order Items ({selectedOrder.items.length})
                </div>

                <div>
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0 sm:flex-row sm:items-center"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#ff6b00]">
                        <Package size={18} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-800">
                          {item.productName}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-400">
                          {item.variantName && (
                            <span>
                              Variant: {item.variantName}
                            </span>
                          )}
                          {item.sku && (
                            <span>
                              SKU: {item.sku}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-sm text-slate-500">
                        {item.quantity} × {money(item.unitPrice)}
                      </div>

                      <div className="font-bold text-slate-800 sm:w-28 sm:text-right">
                        {money(item.totalPrice)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
                <div className="rounded-xl border border-slate-200 p-5">
                  <h3 className="font-bold text-slate-900">
                    Update Order Status
                  </h3>

                  <div className="mt-4">
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Current Status
                    </label>

                    <div
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${statusClass(
                        selectedOrder.orderStatus
                      )}`}
                    >
                      <StatusIcon status={selectedOrder.orderStatus} />
                      {selectedOrder.orderStatus}
                    </div>
                  </div>

                  {STATUS_FLOW[selectedOrder.orderStatus]?.length > 0 && (
                    <>
                      <div className="mt-5">
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Next Status
                        </label>

                        <select
                          value={nextStatus}
                          onChange={(e) =>
                            setNextStatus(e.target.value)
                          }
                          className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#ff6b00] focus:ring-2 focus:ring-orange-100"
                        >
                          <option value="">
                            Select next status
                          </option>

                          {STATUS_FLOW[
                            selectedOrder.orderStatus
                          ].map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mt-4">
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Note (optional)
                        </label>

                        <textarea
                          value={statusNote}
                          onChange={(e) =>
                            setStatusNote(e.target.value)
                          }
                          rows={3}
                          placeholder="Add a note..."
                          className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#ff6b00] focus:ring-2 focus:ring-orange-100"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleStatusUpdate}
                        disabled={updating || !nextStatus}
                        className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#ff6b00] px-4 text-sm font-semibold text-white hover:bg-[#e95f00] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {updating && (
                          <Loader2
                            size={16}
                            className="animate-spin"
                          />
                        )}
                        Update Status
                      </button>
                    </>
                  )}

                  {selectedOrder.orderStatus !== "Delivered" &&
                    selectedOrder.orderStatus !== "Cancelled" && (
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={updating}
                        className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60"
                      >
                        <XCircle size={16} />
                        Cancel Order
                      </button>
                    )}
                </div>

                <div className="rounded-xl border border-slate-200 p-5">
                  <h3 className="font-bold text-slate-900">
                    Order Summary
                  </h3>

                  <div className="mt-4 space-y-3 text-sm">
                    <SummaryRow
                      label="Subtotal"
                      value={money(selectedOrder.subTotal)}
                    />
                    <SummaryRow
                      label="Discount"
                      value={`- ${money(
                        selectedOrder.discountAmount
                      )}`}
                    />
                    <SummaryRow
                      label="Shipping"
                      value={money(selectedOrder.shippingAmount)}
                    />
                    <SummaryRow
                      label="Tax"
                      value={money(selectedOrder.taxAmount)}
                    />

                    <div className="border-t border-slate-200 pt-3">
                      <SummaryRow
                        label="Grand Total"
                        value={money(selectedOrder.grandTotal)}
                        strong
                      />
                    </div>
                  </div>

                  {selectedOrder.customerNote && (
                    <div className="mt-5 rounded-lg bg-slate-50 p-3">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Customer Note
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        {selectedOrder.customerNote}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={closeDetails}
                disabled={updating}
                className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string | number;
  wide?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-5 shadow-sm ${
        wide ? "col-span-2 lg:col-span-1" : ""
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 truncate text-xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-400">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${
        strong
          ? "text-base font-bold text-slate-900"
          : "text-slate-500"
      }`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
