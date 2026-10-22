import Link from "next/link";

const stats = [
  {
    label: "Total Sales",
    value: "1,250,000 MMK",
    change: "+12.5%",
    icon: "↗",
    description: "Revenue overview",
    iconStyle: "bg-blue-50 text-blue-700",
  },
  {
    label: "Total Orders",
    value: "128",
    change: "+8.2%",
    icon: "▤",
    description: "Orders received",
    iconStyle: "bg-violet-50 text-violet-700",
  },
  {
    label: "Total Products",
    value: "56",
    change: "+4.3%",
    icon: "▦",
    description: "Products in catalog",
    iconStyle: "bg-amber-50 text-amber-700",
  },
  {
    label: "Customers",
    value: "94",
    change: "+6.1%",
    icon: "♙",
    description: "Registered customers",
    iconStyle: "bg-emerald-50 text-emerald-700",
  },
];

const monthlySales = [
  { month: "May", revenue: 420000 },
  { month: "Jun", revenue: 560000 },
  { month: "Jul", revenue: 480000 },
  { month: "Aug", revenue: 720000 },
  { month: "Sep", revenue: 640000 },
  { month: "Oct", revenue: 850000 },
];

const recentOrders = [
  {
    id: "ORD-001",
    customer: "Mg Mg",
    total: "85,000 MMK",
    status: "Delivered",
  },
  {
    id: "ORD-002",
    customer: "Aye Aye",
    total: "120,000 MMK",
    status: "Processing",
  },
  {
    id: "ORD-003",
    customer: "Ko Ko",
    total: "45,000 MMK",
    status: "Pending",
  },
  {
    id: "ORD-004",
    customer: "Su Su",
    total: "210,000 MMK",
    status: "Shipped",
  },
];

const topProducts = [
  {
    id: "PRD-001",
    name: "Classic T-Shirt",
    category: "Clothing",
    sold: 124,
    stock: 32,
    revenue: 620000,
  },
  {
    id: "PRD-002",
    name: "Wireless Headphones",
    category: "Electronics",
    sold: 96,
    stock: 18,
    revenue: 960000,
  },
  {
    id: "PRD-003",
    name: "Leather Wallet",
    category: "Accessories",
    sold: 78,
    stock: 5,
    revenue: 390000,
  },
  {
    id: "PRD-004",
    name: "Running Sneakers",
    category: "Footwear",
    sold: 65,
    stock: 0,
    revenue: 1300000,
  },
];

const statusStyles: Record<string, string> = {
  Delivered: "bg-green-100 text-green-700",
  Processing: "bg-blue-100 text-blue-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Shipped: "bg-purple-100 text-purple-700",
};

function formatMMK(amount: number) {
  return `${amount.toLocaleString("en-US")} MMK`;
}

function getStockStyle(stock: number) {
  if (stock === 0) return "text-red-700 bg-red-50";
  if (stock <= 5) return "text-amber-700 bg-amber-50";
  return "text-emerald-700 bg-emerald-50";
}

export default function AdminDashboardPage() {
  const maxRevenue = Math.max(...monthlySales.map((item) => item.revenue));

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-gray-500">Store Management / Overview</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Welcome back! Here&apos;s what&apos;s happening with your store.
          </p>
        </div>

        <span className="w-fit rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600">
          Demo Data
        </span>
      </header>

      {/* KPI cards */}
      <section
        aria-label="Store statistics"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-gray-500">{stat.label}</p>
              <span
                aria-hidden="true"
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold ${stat.iconStyle}`}
              >
                {stat.icon}
              </span>
            </div>

            <p className="mt-4 break-words text-2xl font-bold tracking-tight text-gray-900">
              {stat.value}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-emerald-600">
                {stat.change}
              </span>
              <span className="text-gray-400">vs last month</span>
            </div>

            <p className="mt-2 text-xs text-gray-500">{stat.description}</p>
          </article>
        ))}
      </section>

      {/* Sales chart and quick actions */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Sales Overview
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Monthly revenue performance
              </p>
            </div>

            <span className="w-fit rounded-lg bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600">
              Last 6 months
            </span>
          </div>

          <div className="mt-8">
            <div className="mb-3 flex justify-between text-xs text-gray-400">
              <span>Revenue (MMK)</span>
              <span>Maximum: {formatMMK(maxRevenue)}</span>
            </div>

            <div
              role="img"
              aria-label="Monthly sales chart: May 420000 MMK, June 560000 MMK, July 480000 MMK, August 720000 MMK, September 640000 MMK, October 850000 MMK."
              className="flex h-56 items-end gap-3 border-b border-gray-200 pb-0 sm:gap-6"
            >
              {monthlySales.map((item) => {
                const height = Math.max(8, (item.revenue / maxRevenue) * 100);

                return (
                  <div
                    key={item.month}
                    className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2"
                  >
                    <span className="hidden text-center text-[10px] text-gray-500 sm:block sm:text-xs">
                      {(item.revenue / 1000).toFixed(0)}k
                    </span>

                    <div
                      title={`${item.month}: ${formatMMK(item.revenue)}`}
                      className="w-full max-w-14 rounded-t-lg bg-blue-500 transition hover:bg-blue-700"
                      style={{ height: `${height}%` }}
                    />

                    <span className="translate-y-6 text-xs font-medium text-gray-500">
                      {item.month}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 p-4">
              <div>
                <p className="text-xs text-gray-500">Best month in chart</p>
                <p className="mt-1 text-sm font-bold text-gray-900">
                  October · {formatMMK(maxRevenue)}
                </p>
              </div>
              <Link
                href="/admin/sales"
                className="text-sm font-semibold text-blue-600 hover:text-blue-800"
              >
                View sales →
              </Link>
            </div>
          </div>
        </article>

        {/* Quick actions */}
        <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
          <p className="mt-1 text-sm text-gray-500">Jump to store management</p>

          <div className="mt-5 space-y-3">
            <QuickAction
              href="/admin/products"
              icon="▦"
              title="Manage Products"
              description="View and update inventory"
            />
            <QuickAction
              href="/admin/orders"
              icon="▤"
              title="Manage Orders"
              description="Review customer orders"
            />
            <QuickAction
              href="/admin/sales"
              icon="↗"
              title="View Sales"
              description="Review sales performance"
            />
            <QuickAction
              href="/admin/users"
              icon="♙"
              title="Manage Users"
              description="Review customer accounts"
            />
          </div>
        </article>
      </section>

      {/* Recent orders */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
            <p className="mt-1 text-sm text-gray-500">
              Latest activity in your store
            </p>
          </div>

          <Link
            href="/admin/orders"
            className="text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            View all orders →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th scope="col" className="px-5 py-4 font-semibold">
                  Order ID
                </th>
                <th scope="col" className="px-5 py-4 font-semibold">
                  Customer
                </th>
                <th scope="col" className="px-5 py-4 font-semibold">
                  Total
                </th>
                <th scope="col" className="px-5 py-4 font-semibold">
                  Status
                </th>
                <th scope="col" className="px-5 py-4 text-right font-semibold">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <tr key={order.id} className="transition hover:bg-gray-50">
                  <td className="px-5 py-4 font-semibold text-gray-900">
                    {order.id}
                  </td>
                  <td className="px-5 py-4 text-gray-600">{order.customer}</td>
                  <td className="px-5 py-4 font-medium text-gray-900">
                    {order.total}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[order.status]}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href="/admin/orders"
                      aria-label={`View orders for ${order.id}`}
                      className="font-semibold text-blue-600 hover:text-blue-800"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Top products */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Top Products</h2>
            <p className="mt-1 text-sm text-gray-500">
              Demo product sales and inventory
            </p>
          </div>

          <Link
            href="/admin/products"
            className="text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            View all products →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th scope="col" className="px-5 py-4 font-semibold">
                  Product
                </th>
                <th scope="col" className="px-5 py-4 font-semibold">
                  Units Sold
                </th>
                <th scope="col" className="px-5 py-4 font-semibold">
                  Revenue
                </th>
                <th scope="col" className="px-5 py-4 font-semibold">
                  Stock
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {[...topProducts]
                .sort((a, b) => b.sold - a.sold)
                .map((product, index) => (
                  <tr key={product.id} className="transition hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-sm font-bold text-gray-600">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {product.name}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {product.category}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-700">
                      {product.sold}
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {formatMMK(product.revenue)}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStockStyle(product.stock)}`}
                      >
                        {product.stock === 0
                          ? "Out of stock"
                          : product.stock <= 5
                            ? `${product.stock} left`
                            : `${product.stock} in stock`}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-gray-200 p-3.5 transition hover:border-blue-200 hover:bg-blue-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-lg text-gray-700 transition group-hover:bg-blue-100 group-hover:text-blue-700">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-gray-900">
          {title}
        </span>
        <span className="mt-1 block text-xs text-gray-500">{description}</span>
      </span>
      <span
        aria-hidden="true"
        className="text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600"
      >
        →
      </span>
    </Link>
  );
}
