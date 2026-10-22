import Link from "next/link";
import {
  demoOrders,
  formatMMK,
  getOrderTotal,
  type OrderStatus,
} from "@/app/store/orders";

function StatusBadge({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, string> = {
    Pending: "bg-amber-100 text-amber-800",
    Processing: "bg-blue-100 text-blue-800",
    Shipped: "bg-violet-100 text-violet-800",
    Delivered: "bg-green-100 text-green-800",
    Cancelled: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export default function OrdersPage() {
  const orders = [...demoOrders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">My Orders</h1>
          <p className="mt-2 text-slate-500">
            View your order history and track order status.
          </p>
        </div>

        <Link
          href="/products"
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Continue Shopping
        </Link>
      </div>

      <p className="mt-8 text-sm text-slate-500">{orders.length} orders</p>

      <div className="mt-4 space-y-4">
        {orders.map((order) => (
          <article
            key={order.id}
            className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Order number</p>
                <h2 className="mt-1 font-bold text-slate-900">{order.id}</h2>
                <p className="mt-2 text-sm text-slate-500">
                  {new Date(order.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              <StatusBadge status={order.status} />
            </div>

            <div className="mt-5 border-t border-slate-100 pt-4">
              <p className="text-sm text-slate-600">
                {order.items.length} product types
              </p>

              <ul className="mt-3 space-y-2">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex justify-between gap-4 text-sm"
                  >
                    <span className="text-slate-700">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="shrink-0 font-medium text-slate-900">
                      {formatMMK(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
              <div>
                <p className="text-sm text-slate-500">Order total</p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {formatMMK(getOrderTotal(order))}
                </p>
              </div>

              <Link
                href={`/orders/${order.id}`}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                View Details
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
