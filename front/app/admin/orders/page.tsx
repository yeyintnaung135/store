"use client";

import { useMemo, useState } from "react";

type OrderStatus =
  "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";

type OrderItem = {
  name: string;
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  customer: string;
  email: string;
  phone: string;
  date: string;
  total: number;
  payment: "COD" | "Bank Transfer" | "Mobile Banking";
  status: OrderStatus;
  address: string;
  items: OrderItem[];
};

const initialOrders: Order[] = [
  {
    id: "ORD-20261020-001",
    customer: "Mg Mg",
    email: "mgmg@example.com",
    phone: "09123456789",
    date: "2026-10-20",
    total: 85000,
    payment: "COD",
    status: "Delivered",
    address: "Yangon, Myanmar",
    items: [
      { name: "Classic Cotton T-Shirt", quantity: 2, price: 25000 },
      { name: "Baseball Cap", quantity: 1, price: 35000 },
    ],
  },
  {
    id: "ORD-20261020-002",
    customer: "Aye Aye",
    email: "ayeaye@example.com",
    phone: "09987654321",
    date: "2026-10-20",
    total: 120000,
    payment: "Mobile Banking",
    status: "Processing",
    address: "Mandalay, Myanmar",
    items: [
      { name: "Premium Hoodie", quantity: 1, price: 55000 },
      { name: "Wireless Headphones", quantity: 1, price: 65000 },
    ],
  },
  {
    id: "ORD-20261019-003",
    customer: "Ko Ko",
    email: "koko@example.com",
    phone: "09456781234",
    date: "2026-10-19",
    total: 45000,
    payment: "Bank Transfer",
    status: "Pending",
    address: "Naypyidaw, Myanmar",
    items: [{ name: "Canvas Backpack", quantity: 1, price: 45000 }],
  },
  {
    id: "ORD-20261018-004",
    customer: "Su Su",
    email: "susu@example.com",
    phone: "09222333444",
    date: "2026-10-18",
    total: 210000,
    payment: "COD",
    status: "Shipped",
    address: "Yangon, Myanmar",
    items: [
      { name: "Smart Watch", quantity: 1, price: 120000 },
      { name: "Denim Jacket", quantity: 1, price: 90000 },
    ],
  },
  {
    id: "ORD-20261017-005",
    customer: "Hla Hla",
    email: "hlahla@example.com",
    phone: "09777888999",
    date: "2026-10-17",
    total: 75000,
    payment: "Mobile Banking",
    status: "Cancelled",
    address: "Bago, Myanmar",
    items: [{ name: "Running Shoes", quantity: 1, price: 75000 }],
  },
  {
    id: "ORD-20261016-006",
    customer: "Aung Aung",
    email: "aung@example.com",
    phone: "09234567890",
    date: "2026-10-16",
    total: 65000,
    payment: "COD",
    status: "Pending",
    address: "Taunggyi, Myanmar",
    items: [{ name: "Bluetooth Speaker", quantity: 1, price: 65000 }],
  },
  {
    id: "ORD-20261015-007",
    customer: "Mya Mya",
    email: "mya@example.com",
    phone: "09444555666",
    date: "2026-10-15",
    total: 95000,
    payment: "Bank Transfer",
    status: "Processing",
    address: "Mawlamyine, Myanmar",
    items: [{ name: "Denim Jacket", quantity: 1, price: 95000 }],
  },
];

const statuses: OrderStatus[] = [
  "Pending",
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const statusStyles: Record<OrderStatus, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Processing: "bg-blue-100 text-blue-800",
  Shipped: "bg-purple-100 text-purple-800",
  Delivered: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
};

const formatPrice = (price: number) => `${price.toLocaleString("en-US")} MMK`;

const formatDate = (date: string) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [statusDraft, setStatusDraft] = useState<OrderStatus>("Pending");
  const [statusError, setStatusError] = useState("");

  const pageSize = 5;

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const query = search.trim().toLowerCase();

      const matchesSearch =
        order.id.toLowerCase().includes(query) ||
        order.customer.toLowerCase().includes(query) ||
        order.email.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All Statuses" || order.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));

  const currentPage = Math.min(page, totalPages);

  const visibleOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const selectedOrder =
    orders.find((order) => order.id === selectedOrderId) ?? null;

  const totalRevenue = orders
    .filter((order) => order.status !== "Cancelled")
    .reduce((sum, order) => sum + order.total, 0);

  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function changeStatusFilter(value: string) {
    setStatusFilter(value);
    setPage(1);
  }

  function openOrder(order: Order) {
    setSelectedOrderId(order.id);
    setStatusDraft(order.status);
    setStatusError("");
  }

  function closeOrder() {
    setSelectedOrderId(null);
    setStatusError("");
  }

  function saveOrderStatus() {
    if (!selectedOrder) return;

    setOrders((current) =>
      current.map((order) =>
        order.id === selectedOrder.id
          ? { ...order, status: statusDraft }
          : order,
      ),
    );

    closeOrder();
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-gray-500">Store Management / Orders</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Orders</h1>
          <p className="mt-2 text-sm text-gray-500">
            Track orders, view customer details, and update order status.
          </p>
        </div>

        <span className="w-fit rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600">
          Demo Data
        </span>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="mt-2 text-2xl font-bold">{orders.length}</p>
        </article>

        <article className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Pending Orders</p>
          <p className="mt-2 text-2xl font-bold">
            {orders.filter((order) => order.status === "Pending").length}
          </p>
        </article>

        <article className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Processing Orders</p>
          <p className="mt-2 text-2xl font-bold">
            {orders.filter((order) => order.status === "Processing").length}
          </p>
        </article>

        <article className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Order Value</p>
          <p className="mt-2 text-xl font-bold">{formatPrice(totalRevenue)}</p>
          <p className="mt-1 text-xs text-gray-400">
            Excludes cancelled orders
          </p>
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-5 md:flex-row">
          <input
            value={search}
            onChange={(event) => changeSearch(event.target.value)}
            placeholder="Search order ID, customer, or email..."
            aria-label="Search orders"
            className="min-w-0 flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <select
            value={statusFilter}
            onChange={(event) => changeStatusFilter(event.target.value)}
            aria-label="Filter by order status"
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="All Statuses">All Statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Order ID</th>
                <th className="px-5 py-4 font-semibold">Customer</th>
                <th className="px-5 py-4 font-semibold">Date</th>
                <th className="px-5 py-4 font-semibold">Total</th>
                <th className="px-5 py-4 font-semibold">Payment</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 text-right font-semibold">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {visibleOrders.map((order) => (
                <tr key={order.id} className="transition hover:bg-gray-50">
                  <td className="whitespace-nowrap px-5 py-4 font-semibold">
                    {order.id}
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-medium">{order.customer}</p>
                    <p className="mt-1 text-xs text-gray-400">{order.email}</p>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                    {formatDate(order.date)}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 font-medium">
                    {formatPrice(order.total)}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                    {order.payment}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[order.status]}`}
                    >
                      {order.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => openOrder(order)}
                      aria-label={`View ${order.id}`}
                      className="font-semibold text-blue-600 hover:text-blue-800"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}

              {visibleOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    No orders found. Try another search or status.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center">
          <p className="text-sm text-gray-500">
            Showing{" "}
            {filteredOrders.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            {"–"}
            {Math.min(currentPage * pageSize, filteredOrders.length)} of{" "}
            {filteredOrders.length} orders
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="px-2 text-sm text-gray-600">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeOrder();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-detail-title"
            className="my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500">Order Details</p>
                <h2
                  id="order-detail-title"
                  className="mt-1 break-all text-xl font-bold"
                >
                  {selectedOrder.id}
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  Placed on {formatDate(selectedOrder.date)}
                </p>
              </div>

              <button
                type="button"
                onClick={closeOrder}
                aria-label="Close order details"
                className="rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold">Customer Information</h3>
                <p className="mt-3 text-sm">{selectedOrder.customer}</p>
                <p className="mt-1 break-all text-sm text-gray-500">
                  {selectedOrder.email}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {selectedOrder.phone}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold">Shipping Address</h3>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  {selectedOrder.address}
                </p>
                <p className="mt-3 text-sm text-gray-500">
                  Payment: {selectedOrder.payment}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-semibold">Order Items</h3>

              <div className="mt-3 divide-y divide-gray-100 rounded-xl border border-gray-200">
                {selectedOrder.items.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-4 p-4"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        Qty: {item.quantity} × {formatPrice(item.price)}
                      </p>
                    </div>

                    <p className="whitespace-nowrap text-sm font-semibold">
                      {formatPrice(item.quantity * item.price)}
                    </p>
                  </div>
                ))}

                <div className="flex items-center justify-between bg-gray-50 p-4">
                  <span className="font-semibold">Order Total</span>
                  <span className="text-lg font-bold">
                    {formatPrice(selectedOrder.total)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label
                htmlFor="order-status"
                className="mb-2 block text-sm font-semibold"
              >
                Update Order Status
              </label>

              <select
                id="order-status"
                value={statusDraft}
                onChange={(event) => {
                  setStatusDraft(event.target.value as OrderStatus);
                  setStatusError("");
                }}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              {statusError && (
                <p className="mt-2 text-sm text-red-600">{statusError}</p>
              )}
            </div>

            <div className="mt-6 flex flex-col-reverse justify-end gap-3 sm:flex-row">
              <button
                type="button"
                onClick={closeOrder}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50"
              >
                Close
              </button>

              <button
                type="button"
                onClick={saveOrderStatus}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Save Status
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
