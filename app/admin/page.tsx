const stats = [
  { label: "Total Sales", value: "1,250,000 MMK", change: "+12.5%" },
  { label: "Total Orders", value: "128", change: "+8.2%" },
  { label: "Total Products", value: "56", change: "+4.3%" },
  { label: "Customers", value: "94", change: "+6.1%" },
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
  { id: "ORD-003", customer: "Ko Ko", total: "45,000 MMK", status: "Pending" },
  { id: "ORD-004", customer: "Su Su", total: "210,000 MMK", status: "Shipped" },
];

const statusStyles: Record<string, string> = {
  Delivered: "bg-green-100 text-green-700",
  Processing: "bg-blue-100 text-blue-700",
  Pending: "bg-yellow-100 text-yellow-700",
  Shipped: "bg-purple-100 text-purple-700",
};

export default function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-gray-500">Store Management / Overview</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-sm text-gray-500">
            Welcome back! Here&apos;s what&apos;s happening with your store.
          </p>
        </div>

        <span className="w-fit rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600">
          Demo Data
        </span>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <p className="mt-4 text-2xl font-bold tracking-tight">
              {stat.value}
            </p>
            <p className="mt-3 text-sm text-green-600">
              {stat.change} <span className="text-gray-400">vs last month</span>
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-col justify-between gap-2 border-b border-gray-100 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold">Recent Orders</h2>
            <p className="mt-1 text-sm text-gray-500">
              Latest activity in your store
            </p>
          </div>

          <a
            href="/admin/orders"
            className="text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            View all orders →
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Order ID</th>
                <th className="px-5 py-4 font-semibold">Customer</th>
                <th className="px-5 py-4 font-semibold">Total</th>
                <th className="px-5 py-4 font-semibold">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <tr key={order.id} className="transition hover:bg-gray-50">
                  <td className="px-5 py-4 font-semibold">{order.id}</td>
                  <td className="px-5 py-4 text-gray-600">{order.customer}</td>
                  <td className="px-5 py-4 font-medium">{order.total}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[order.status]}`}
                    >
                      {order.status}
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
