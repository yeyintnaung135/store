"use client";

import { useMemo, useState } from "react";

type SaleStatus = "Completed" | "Pending" | "Refunded";
type PaymentMethod = "COD" | "Mobile Banking" | "Bank Transfer";

type Sale = {
  id: string;
  orderId: string;
  customer: string;
  email: string;
  date: string;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  subtotal: number;
  discount: number;
  total: number;
};

const initialSales: Sale[] = [
  {
    id: "SALE-001",
    orderId: "ORD-20261022-001",
    customer: "Mg Mg",
    email: "mgmg@example.com",
    date: "2026-10-22",
    paymentMethod: "COD",
    status: "Completed",
    subtotal: 95000,
    discount: 5000,
    total: 90000,
  },
  {
    id: "SALE-002",
    orderId: "ORD-20261022-002",
    customer: "Aye Aye",
    email: "ayeaye@example.com",
    date: "2026-10-22",
    paymentMethod: "Mobile Banking",
    status: "Pending",
    subtotal: 125000,
    discount: 5000,
    total: 120000,
  },
  {
    id: "SALE-003",
    orderId: "ORD-20261021-003",
    customer: "Ko Ko",
    email: "koko@example.com",
    date: "2026-10-21",
    paymentMethod: "Bank Transfer",
    status: "Completed",
    subtotal: 50000,
    discount: 0,
    total: 50000,
  },
  {
    id: "SALE-004",
    orderId: "ORD-20261020-004",
    customer: "Su Su",
    email: "susu@example.com",
    date: "2026-10-20",
    paymentMethod: "COD",
    status: "Refunded",
    subtotal: 80000,
    discount: 5000,
    total: 75000,
  },
  {
    id: "SALE-005",
    orderId: "ORD-20261019-005",
    customer: "Hla Hla",
    email: "hlahla@example.com",
    date: "2026-10-19",
    paymentMethod: "Mobile Banking",
    status: "Completed",
    subtotal: 210000,
    discount: 10000,
    total: 200000,
  },
  {
    id: "SALE-006",
    orderId: "ORD-20261018-006",
    customer: "Aung Aung",
    email: "aung@example.com",
    date: "2026-10-18",
    paymentMethod: "COD",
    status: "Pending",
    subtotal: 65000,
    discount: 0,
    total: 65000,
  },
  {
    id: "SALE-007",
    orderId: "ORD-20261017-007",
    customer: "Mya Mya",
    email: "mya@example.com",
    date: "2026-10-17",
    paymentMethod: "Bank Transfer",
    status: "Completed",
    subtotal: 100000,
    discount: 5000,
    total: 95000,
  },
  {
    id: "SALE-008",
    orderId: "ORD-20261016-008",
    customer: "Kyaw Kyaw",
    email: "kyaw@example.com",
    date: "2026-10-16",
    paymentMethod: "Mobile Banking",
    status: "Completed",
    subtotal: 45000,
    discount: 0,
    total: 45000,
  },
  {
    id: "SALE-009",
    orderId: "ORD-20261015-009",
    customer: "Nandar",
    email: "nandar@example.com",
    date: "2026-10-15",
    paymentMethod: "COD",
    status: "Completed",
    subtotal: 155000,
    discount: 5000,
    total: 150000,
  },
  {
    id: "SALE-010",
    orderId: "ORD-20261014-010",
    customer: "Thant Zin",
    email: "thantzin@example.com",
    date: "2026-10-14",
    paymentMethod: "Bank Transfer",
    status: "Pending",
    subtotal: 70000,
    discount: 0,
    total: 70000,
  },
];

const formatPrice = (amount: number) => `${amount.toLocaleString("en-US")} MMK`;

function statusClass(status: SaleStatus) {
  switch (status) {
    case "Completed":
      return "bg-green-100 text-green-700";
    case "Pending":
      return "bg-amber-100 text-amber-700";
    case "Refunded":
      return "bg-red-100 text-red-700";
  }
}

export default function AdminSalesPage() {
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const pageSize = 5;

  const filteredSales = useMemo(() => {
    const query = search.trim().toLowerCase();

    return sales.filter((sale) => {
      const matchesSearch =
        sale.id.toLowerCase().includes(query) ||
        sale.orderId.toLowerCase().includes(query) ||
        sale.customer.toLowerCase().includes(query) ||
        sale.email.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All Statuses" || sale.status === statusFilter;

      const matchesStartDate = !startDate || sale.date >= startDate;
      const matchesEndDate = !endDate || sale.date <= endDate;

      return (
        matchesSearch && matchesStatus && matchesStartDate && matchesEndDate
      );
    });
  }, [sales, search, statusFilter, startDate, endDate]);

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / pageSize));
  const page = Math.min(currentPage, totalPages);

  const visibleSales = filteredSales.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const completedSales = sales.filter((sale) => sale.status === "Completed");

  const totalRevenue = completedSales.reduce(
    (sum, sale) => sum + sale.total,
    0,
  );

  const completedCount = completedSales.length;
  const pendingCount = sales.filter((sale) => sale.status === "Pending").length;

  const averageOrderValue =
    completedCount > 0 ? totalRevenue / completedCount : 0;

  function resetPage() {
    setCurrentPage(1);
  }

  function updateStatus(status: SaleStatus) {
    if (!selectedSale) return;

    setSales((current) =>
      current.map((sale) =>
        sale.id === selectedSale.id ? { ...sale, status } : sale,
      ),
    );

    setSelectedSale({ ...selectedSale, status });
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-gray-500">Store Management / Sales</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Sales
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Track revenue, transactions, and payment status.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Print Report
        </button>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatPrice(totalRevenue)}
          </p>
          <p className="mt-2 text-xs text-green-600">Completed sales only</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Total Sales</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {completedCount}
          </p>
          <p className="mt-2 text-xs text-gray-500">Completed transactions</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Average Order Value</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {formatPrice(Math.round(averageOrderValue))}
          </p>
          <p className="mt-2 text-xs text-gray-500">Per completed sale</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Pending Payments</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {pendingCount}
          </p>
          <p className="mt-2 text-xs text-amber-600">Awaiting completion</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-5 lg:flex-row">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              resetPage();
            }}
            placeholder="Search sale ID, order, customer..."
            aria-label="Search sales"
            className="min-w-0 flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              resetPage();
            }}
            aria-label="Filter by sale status"
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option>All Statuses</option>
            <option>Completed</option>
            <option>Pending</option>
            <option>Refunded</option>
          </select>

          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="flex items-center gap-2 text-sm text-gray-500">
              From
              <input
                type="date"
                aria-label="Start date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => {
                  setStartDate(event.target.value);
                  resetPage();
                }}
                className="min-w-0 rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700"
              />
            </label>

            <label className="flex items-center gap-2 text-sm text-gray-500">
              To
              <input
                type="date"
                aria-label="End date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => {
                  setEndDate(event.target.value);
                  resetPage();
                }}
                className="min-w-0 rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-700"
              />
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Sale / Order</th>
                <th className="px-5 py-4 font-semibold">Customer</th>
                <th className="px-5 py-4 font-semibold">Date</th>
                <th className="px-5 py-4 font-semibold">Payment</th>
                <th className="px-5 py-4 font-semibold">Amount</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 text-right font-semibold">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {visibleSales.map((sale) => (
                <tr key={sale.id} className="transition hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-gray-900">{sale.id}</p>
                    <p className="mt-1 text-xs text-gray-400">{sale.orderId}</p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900">{sale.customer}</p>
                    <p className="mt-1 text-xs text-gray-500">{sale.email}</p>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                    {sale.date}
                  </td>

                  <td className="px-5 py-4 text-gray-600">
                    {sale.paymentMethod}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 font-semibold text-gray-900">
                    {formatPrice(sale.total)}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(sale.status)}`}
                    >
                      {sale.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      aria-label={`View ${sale.id}`}
                      onClick={() => setSelectedSale(sale)}
                      className="font-semibold text-blue-600 hover:text-blue-800"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}

              {visibleSales.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    No sales found. Try another search or filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center">
          <p className="text-sm text-gray-500">
            Showing {filteredSales.length === 0 ? 0 : (page - 1) * pageSize + 1}
            {"–"}
            {Math.min(page * pageSize, filteredSales.length)} of{" "}
            {filteredSales.length} sales
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setCurrentPage((current) => current - 1)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="px-2 text-sm text-gray-600">
              {page} / {totalPages}
            </span>

            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setCurrentPage((current) => current + 1)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {selectedSale && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedSale(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sale-details-title"
            className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="sale-details-title"
                  className="text-xl font-bold text-gray-900"
                >
                  Sale Details
                </h2>
                <p className="mt-1 text-sm text-gray-500">{selectedSale.id}</p>
              </div>

              <button
                type="button"
                aria-label="Close sale details"
                onClick={() => setSelectedSale(null)}
                className="rounded-lg px-3 py-1 text-xl text-gray-500 hover:bg-gray-100"
              >
                ×
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">Order ID</span>
                <span className="text-right text-sm font-semibold">
                  {selectedSale.orderId}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">Customer</span>
                <span className="text-right text-sm font-semibold">
                  {selectedSale.customer}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">Email</span>
                <span className="break-all text-right text-sm">
                  {selectedSale.email}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">Date</span>
                <span className="text-sm">{selectedSale.date}</span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">Payment Method</span>
                <span className="text-right text-sm">
                  {selectedSale.paymentMethod}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">Subtotal</span>
                <span className="text-sm">
                  {formatPrice(selectedSale.subtotal)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-sm text-gray-500">Discount</span>
                <span className="text-sm">
                  {formatPrice(selectedSale.discount)}
                </span>
              </div>

              <div className="flex justify-between gap-4 border-t border-gray-100 pt-4">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(selectedSale.total)}
                </span>
              </div>

              <div>
                <label
                  htmlFor="sale-status"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Sale Status
                </label>

                <select
                  id="sale-status"
                  value={selectedSale.status}
                  onChange={(event) =>
                    updateStatus(event.target.value as SaleStatus)
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="Completed">Completed</option>
                  <option value="Pending">Pending</option>
                  <option value="Refunded">Refunded</option>
                </select>

                <p className="mt-2 text-xs text-gray-500">
                  Demo only: status changes are kept in page state and reset
                  after refreshing.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
