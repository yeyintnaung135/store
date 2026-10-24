"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AdminOrderApiError,
  allowedOrderStatusTransitions,
  getAdminOrderById,
  getAdminOrders,
  updateAdminOrderStatus,
} from "@/app/lib/admin-order";

import type {
  AdminOrdersQuery,
  Order,
  OrderStatus,
  OrdersMeta,
} from "@/app/types/orders";

const PAGE_SIZE = 10;

const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800 ring-amber-200",
  CONFIRMED: "bg-blue-100 text-blue-800 ring-blue-200",
  PROCESSING: "bg-violet-100 text-violet-800 ring-violet-200",
  SHIPPED: "bg-cyan-100 text-cyan-800 ring-cyan-200",
  DELIVERED: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  CANCELLED: "bg-red-100 text-red-800 ring-red-200",
};

const ALL_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

function formatMoney(value: string | number): string {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return String(value);
  }

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof AdminOrderApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${
        STATUS_STYLES[status]
      }`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function SummaryCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <tr key={index} className="animate-pulse border-b border-slate-100">
          {Array.from({ length: 6 }).map((__, cellIndex) => (
            <td key={cellIndex} className="px-5 py-5">
              <div className="h-4 rounded bg-slate-100" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<OrdersMeta>({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 0,
  });

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | OrderStatus>("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Debounce search input so we do not call the API on every keystroke.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    const query: AdminOrdersQuery = {
      page,
      limit: PAGE_SIZE,
      ...(search ? { search } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    };

    try {
      const response = await getAdminOrders(query);

      setOrders(response.data);
      setMeta(response.meta);
    } catch (err) {
      setOrders([]);
      setMeta({
        total: 0,
        page,
        limit: PAGE_SIZE,
        totalPages: 0,
      });
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const openOrderDetails = async (order: Order) => {
    setSelectedOrder(order);
    setDetailsLoading(true);
    setDetailsError("");
    setActionError("");
    setActionSuccess("");

    try {
      const fullOrder = await getAdminOrderById(order.id);
      setSelectedOrder(fullOrder);
    } catch (err) {
      // Keep the list result visible if the details endpoint fails.
      setDetailsError(getErrorMessage(err));
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeOrderDetails = () => {
    if (updatingOrderId) return;

    setSelectedOrder(null);
    setDetailsError("");
    setActionError("");
    setActionSuccess("");
  };

  const handleStatusUpdate = async (nextStatus: OrderStatus) => {
    if (!selectedOrder || updatingOrderId) return;

    const allowedStatuses = allowedOrderStatusTransitions[selectedOrder.status];

    if (!allowedStatuses.includes(nextStatus)) {
      setActionError(
        `Cannot change status from ${STATUS_LABELS[selectedOrder.status]} to ${STATUS_LABELS[nextStatus]}.`,
      );
      return;
    }

    setUpdatingOrderId(selectedOrder.id);
    setActionError("");
    setActionSuccess("");

    try {
      const updatedOrder = await updateAdminOrderStatus(selectedOrder.id, {
        status: nextStatus,
      });

      setSelectedOrder(updatedOrder);
      setActionSuccess(
        `Order status updated to ${STATUS_LABELS[updatedOrder.status]}.`,
      );

      // Refresh the table using the current search and filters.
      await loadOrders();
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const pageCount = Math.max(meta.totalPages || 0, 1);
  const canGoPrevious = page > 1 && !loading;
  const canGoNext = page < pageCount && !loading;

  const pageNumbers = useMemo(() => {
    const start = Math.max(1, Math.min(page - 2, pageCount - 4));
    const end = Math.min(pageCount, start + 4);

    return Array.from(
      { length: Math.max(0, end - start + 1) },
      (_, index) => start + index,
    );
  }, [page, pageCount]);

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatusFilter("");
    setPage(1);
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-indigo-600">
              Administration
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Orders</h1>
            <p className="mt-2 text-sm text-slate-500">
              View customer orders, inspect order items, and manage order
              status.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadOrders()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span aria-hidden="true">↻</span>
            {loading ? "Refreshing..." : "Refresh orders"}
          </button>
        </div>

        {/* Summary */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Orders found"
            value={loading ? "—" : meta.total.toLocaleString("en-US")}
            description="Matches your current filters"
          />
          <SummaryCard
            title="Pending on this page"
            value={
              loading
                ? "—"
                : orders
                    .filter((order) => order.status === "PENDING")
                    .length.toString()
            }
            description="Awaiting confirmation"
          />
          <SummaryCard
            title="In progress on this page"
            value={
              loading
                ? "—"
                : orders
                    .filter((order) =>
                      ["CONFIRMED", "PROCESSING", "SHIPPED"].includes(
                        order.status,
                      ),
                    )
                    .length.toString()
            }
            description="Confirmed, processing, or shipped"
          />
          <SummaryCard
            title="Delivered on this page"
            value={
              loading
                ? "—"
                : orders
                    .filter((order) => order.status === "DELIVERED")
                    .length.toString()
            }
            description="Successfully delivered"
          />
        </section>

        {/* Main table */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-bold">All orders</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {loading
                    ? "Loading orders..."
                    : `${meta.total.toLocaleString("en-US")} order(s) found`}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative">
                  <span
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  >
                    ⌕
                  </span>
                  <input
                    type="search"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search order or customer..."
                    aria-label="Search orders"
                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 sm:w-72"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value as "" | OrderStatus);
                    setPage(1);
                  }}
                  aria-label="Filter by order status"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                >
                  <option value="">All statuses</option>
                  {ALL_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <p className="font-semibold">Could not load orders</p>
              <p className="mt-1 break-words">{error}</p>
              <button
                type="button"
                onClick={() => void loadOrders()}
                className="mt-3 font-semibold underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-left">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Order
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Customer
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Date
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Items
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <LoadingRows />
                ) : error ? null : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl text-slate-400">
                        ⌕
                      </div>
                      <p className="mt-4 font-semibold text-slate-800">
                        No orders found
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Try changing the search term or status filter.
                      </p>
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">
                          {order.orderNumber}
                        </p>
                        <p className="mt-1 max-w-40 truncate text-xs text-slate-400">
                          {order.id}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">
                          {order.user?.name || "Unknown customer"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {order.user?.email ||
                            order.user?.phone ||
                            "No contact information"}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                        {formatDate(order.createdAt)}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {order.items?.reduce(
                          (total, item) => total + item.quantity,
                          0,
                        ) ?? 0}{" "}
                        unit(s)
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-slate-900">
                        {formatMoney(order.total)}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={order.status} />
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => void openOrderDetails(order)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          View details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-sm text-slate-500">
              {meta.total === 0
                ? "No results"
                : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(
                    page * PAGE_SIZE,
                    meta.total,
                  )} of ${meta.total}`}
            </p>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                disabled={!canGoPrevious}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              {pageNumbers.map((pageNumber) => (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setPage(pageNumber)}
                  aria-current={pageNumber === page ? "page" : undefined}
                  className={`h-9 min-w-9 rounded-lg px-3 text-sm font-semibold transition ${
                    pageNumber === page
                      ? "bg-indigo-600 text-white"
                      : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}

              <button
                type="button"
                disabled={!canGoNext}
                onClick={() =>
                  setPage((current) => Math.min(pageCount, current + 1))
                }
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Order details modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeOrderDetails();
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") closeOrderDetails();
          }}
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-detail-title"
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
                  Order details
                </p>
                <h2
                  id="order-detail-title"
                  className="mt-1 text-xl font-bold text-slate-900"
                >
                  {selectedOrder.orderNumber}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Created {formatDate(selectedOrder.createdAt)}
                </p>
              </div>

              <button
                type="button"
                onClick={closeOrderDetails}
                disabled={Boolean(updatingOrderId)}
                aria-label="Close order details"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-xl text-slate-500 hover:bg-slate-50 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <div className="space-y-6 p-5 sm:p-6">
              {detailsLoading && (
                <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
                  Refreshing order details...
                </p>
              )}

              {detailsError && (
                <p
                  role="alert"
                  className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
                >
                  {detailsError} Showing the available order information.
                </p>
              )}

              {/* Customer and status */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-500">
                    Customer
                  </h3>
                  <p className="mt-3 font-bold text-slate-900">
                    {selectedOrder.user?.name || "Unknown customer"}
                  </p>
                  <p className="mt-1 break-words text-sm text-slate-600">
                    {selectedOrder.user?.email || "No email provided"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {selectedOrder.user?.phone || "No phone provided"}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-500">
                    Current status
                  </h3>
                  <div className="mt-3">
                    <StatusBadge status={selectedOrder.status} />
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    Status changes are validated by the backend.
                  </p>
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">Order items</h3>
                  <span className="text-sm text-slate-500">
                    {selectedOrder.items?.length ?? 0} product line(s)
                  </span>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[480px] text-left">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Product
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Price
                          </th>
                          <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Qty
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Subtotal
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {!selectedOrder.items?.length ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-4 py-8 text-center text-sm text-slate-500"
                            >
                              No order items found.
                            </td>
                          </tr>
                        ) : (
                          selectedOrder.items.map((item) => (
                            <tr
                              key={item.id}
                              className="border-t border-slate-100"
                            >
                              <td className="px-4 py-4">
                                <p className="font-medium text-slate-800">
                                  {item.productName}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                  ID: {item.productId}
                                </p>
                              </td>
                              <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-slate-600">
                                {formatMoney(item.unitPrice)}
                              </td>
                              <td className="px-4 py-4 text-center text-sm text-slate-600">
                                {item.quantity}
                              </td>
                              <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-semibold text-slate-900">
                                {formatMoney(item.subtotal)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-4">
                    <span className="font-semibold text-slate-700">
                      Order total
                    </span>
                    <span className="text-xl font-bold text-slate-900">
                      {formatMoney(selectedOrder.total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status update */}
              <div className="rounded-2xl border border-slate-200 p-4 sm:p-5">
                <h3 className="font-bold text-slate-900">Update status</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Select one of the allowed next steps for this order.
                </p>

                {actionError && (
                  <p
                    role="alert"
                    className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                  >
                    {actionError}
                  </p>
                )}

                {actionSuccess && (
                  <p
                    role="status"
                    className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700"
                  >
                    {actionSuccess}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {allowedOrderStatusTransitions[selectedOrder.status]
                    .length === 0 ? (
                    <p className="text-sm text-slate-500">
                      This order is in a final status. No further status changes
                      are available.
                    </p>
                  ) : (
                    allowedOrderStatusTransitions[selectedOrder.status].map(
                      (nextStatus) => (
                        <button
                          key={nextStatus}
                          type="button"
                          disabled={Boolean(updatingOrderId)}
                          onClick={() => void handleStatusUpdate(nextStatus)}
                          className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                            nextStatus === "CANCELLED"
                              ? "border border-red-200 bg-white text-red-700 hover:bg-red-50"
                              : "bg-indigo-600 text-white hover:bg-indigo-700"
                          }`}
                        >
                          {updatingOrderId === selectedOrder.id
                            ? "Updating..."
                            : `Mark as ${STATUS_LABELS[nextStatus]}`}
                        </button>
                      ),
                    )
                  )}
                </div>
              </div>

              <div className="flex justify-end border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={closeOrderDetails}
                  disabled={Boolean(updatingOrderId)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Close
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
