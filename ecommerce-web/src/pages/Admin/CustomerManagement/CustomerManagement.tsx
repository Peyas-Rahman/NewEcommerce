import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  Phone,
  Search,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";
import orderService from "../../../services/orderService";
import type { Order } from "../../../types/order";

type Customer = {
  key: string;
  name: string;
  phone: string;
  email: string;
  orders: number;
  total: number;
  orderList: Order[];
};

const money = (value: number) =>
  `৳${new Intl.NumberFormat("en-BD").format(value || 0)}`;

export default function CustomerManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [pageSize, setPageSize] = useState(8);

  useEffect(() => {
    orderService.getAllOrders().then(setOrders).catch(() => {});
  }, []);

  const customers = useMemo<Customer[]>(() => {
    const customerMap = new Map<string, Customer>();

    orders.forEach((order) => {
      const key = order.customerId
        ? `id:${order.customerId}`
        : `guest:${order.guestPhone || order.guestEmail || order.shippingPhone}`;
      const existing = customerMap.get(key) || {
        key,
        name: order.shippingName || order.guestName || "Guest",
        phone: order.shippingPhone || order.guestPhone || "-",
        email: order.guestEmail || "-",
        orders: 0,
        total: 0,
        orderList: [],
      };

      existing.orders += 1;
      existing.total += Number(order.grandTotal || 0);
      existing.orderList.push(order);
      customerMap.set(key, existing);
    });

    return [...customerMap.values()].filter((customer) =>
      `${customer.name} ${customer.phone} ${customer.email}`
        .toLowerCase()
        .includes(query.toLowerCase()),
    );
  }, [orders, query]);

  const pageCount = Math.max(1, Math.ceil(customers.length / pageSize));
  const visibleCustomers = customers.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const changeQuery = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const changePage = (nextPage: number) => {
    setPage(Math.min(Math.max(nextPage, 1), pageCount));
  };

  const changePageSize = (value: number) => {
    setPageSize(value);
    setPage(1);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[.16em] text-orange-600">
          Customers
        </p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black">Customer Overview</h1>
            <p className="text-sm text-slate-500">
              Customer activity derived from existing orders.
            </p>
          </div>
          <p className="text-sm font-semibold text-slate-500">
            {customers.length} records shown
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xl">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            className="form-input h-10 border-slate-200 bg-slate-50 pl-10 focus:bg-white"
            value={query}
            onChange={(event) => changeQuery(event.target.value)}
            placeholder="Search name, mobile or email..."
          />
        </div>
        <label className="flex shrink-0 items-center gap-2 text-xs font-semibold text-slate-500">
          Show
          <select
            value={pageSize}
            onChange={(event) => changePageSize(Number(event.target.value))}
            className="h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 outline-none focus:border-orange-400 focus:bg-white"
          >
            <option value={8}>8 rows</option>
            <option value={15}>15 rows</option>
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
          </select>
        </label>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="min-w-[920px]">
        <div
          className="grid items-center gap-4 border-b border-slate-200 bg-slate-50/90 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500"
          style={{
            gridTemplateColumns:
              "70px minmax(180px, 1.3fr) 150px minmax(190px, 1.4fr) 90px 130px 90px",
          }}
        >
          <span>SL</span>
          <span>Name</span>
          <span>Phone</span>
          <span>Email</span>
          <span>Qty</span>
          <span>Amount</span>
          <span className="text-right">Action</span>
        </div>

        {visibleCustomers.map((customer, index) => (
          <div
            key={customer.key}
            className="grid items-center gap-4 border-b border-slate-100 px-5 py-4 transition-colors last:border-0 hover:bg-orange-50/30"
            style={{
              gridTemplateColumns:
                "70px minmax(180px, 1.3fr) 150px minmax(190px, 1.4fr) 90px 130px 90px",
            }}
          >
            <span className="text-sm font-semibold text-slate-500">
              {(page - 1) * pageSize + index + 1}
            </span>
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                <Users className="h-4 w-4" />
              </div>
              <h3 className="truncate font-black text-slate-900">
                {customer.name}
              </h3>
            </div>

            <span className="flex items-center gap-2 truncate text-xs text-slate-500">
              <Phone className="h-3.5 w-3.5 shrink-0" /> {customer.phone}
            </span>
            <span className="flex items-center gap-2 truncate text-xs text-slate-500">
              <Mail className="h-3.5 w-3.5 shrink-0" /> {customer.email}
            </span>
            <span className="text-sm text-slate-600">
              {customer.orders}
            </span>
            <strong className="text-sm text-slate-900">
              {money(customer.total)}
            </strong>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCustomer(customer)}
                className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
              >
                <Eye className="h-4 w-4" /> View
              </button>
            </div>
          </div>
        ))}
        </div>
      </div>

      {!customers.length && (
        <div className="mt-5 rounded-2xl border border-dashed p-12 text-center text-sm text-slate-400">
          No customers found.
        </div>
      )}

      {customers.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs text-slate-500">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, customers.length)} of {customers.length} customers
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Previous page"
              disabled={page === 1}
              onClick={() => changePage(page - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                onClick={() => changePage(pageNumber)}
                className={`h-8 min-w-8 rounded-lg px-2 text-xs font-bold ${page === pageNumber ? "bg-orange-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              aria-label="Next page"
              disabled={page === pageCount}
              onClick={() => changePage(page + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {selectedCustomer && (
        <CustomerDetails
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
        />
      )}
    </div>
  );
}

function CustomerDetails({
  customer,
  onClose,
}: {
  customer: Customer;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-orange-600">
              Customer Details
            </p>
            <h2 className="mt-1 text-xl font-black text-slate-900">
              {customer.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close customer details"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(90vh-90px)] overflow-y-auto p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">Phone</p>
              <p className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-700">
                <Phone className="h-4 w-4 text-orange-600" /> {customer.phone}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-400">Email</p>
              <p className="mt-1 flex items-center gap-2 break-all text-sm font-bold text-slate-700">
                <Mail className="h-4 w-4 shrink-0 text-orange-600" /> {customer.email}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <h3 className="font-black text-slate-900">Order History</h3>
            <span className="text-sm font-bold text-orange-600">
              {money(customer.total)} total
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {customer.orderList.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 p-3"
              >
                <div>
                  <p className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <ShoppingBag className="h-4 w-4 text-orange-600" />
                    #{order.orderNumber}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(order.createdAt).toLocaleDateString("en-BD")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">
                    {money(order.grandTotal)}
                  </p>
                  <p className="text-xs font-semibold text-orange-600">
                    {order.orderStatus}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
