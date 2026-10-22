import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  demoOrders,
  formatMMK,
  getOrderTotal,
  type OrderStatus,
} from "@/app/store/orders";

type Props = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return demoOrders.map((order) => ({
    id: order.id,
  }));
}

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

export default function OrderDetailPage({ params }: Props) {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-4xl px-4 py-10">
          <p className="text-slate-500">Loading order details...</p>
        </main>
      }
    >
      <OrderDetailContent params={params} />
    </Suspense>
  );
}

async function OrderDetailContent({ params }: Props) {
  const { id } = await params;

  const order = demoOrders.find((item) => item.id === id);

  if (!order) {
    notFound();
  }

  const totalQuantity = order.items.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Link
        href="/orders"
        className="text-sm font-medium text-blue-600 hover:underline"
      >
        &larr; Back to My Orders
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Order Details</h1>
          <p className="mt-2 text-slate-500">{order.id}</p>
        </div>

        <StatusBadge status={order.status} />
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold text-slate-900">Order Information</h2>

        <dl className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">Order number</dt>
            <dd className="mt-1 font-medium text-slate-900">{order.id}</dd>
          </div>

          <div>
            <dt className="text-sm text-slate-500">Order date</dt>
            <dd className="mt-1 font-medium text-slate-900">
              {new Date(order.createdAt).toLocaleString("en-GB", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "UTC",
              })}
            </dd>
          </div>

          <div>
            <dt className="text-sm text-slate-500">Order status</dt>
            <dd className="mt-2">
              <StatusBadge status={order.status} />
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold text-slate-900">
          Delivery Information
        </h2>

        <div className="mt-4 space-y-2 text-sm">
          <p className="font-medium text-slate-900">{order.customer.name}</p>
          <p className="text-slate-600">{order.customer.phone}</p>
          <p className="text-slate-600">{order.customer.address}</p>
          <p className="text-slate-600">{order.customer.city}</p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-bold text-slate-900">Ordered Products</h2>

        <div className="mt-4 divide-y divide-slate-100">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-4 py-4"
            >
              <div>
                <p className="font-medium text-slate-900">{item.name}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {formatMMK(item.price)} × {item.quantity}
                </p>
              </div>

              <p className="font-semibold text-slate-900">
                {formatMMK(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-200 pt-5">
          <div>
            <p className="font-semibold text-slate-900">Order Total</p>
            <p className="mt-1 text-sm text-slate-500">{totalQuantity} items</p>
          </div>

          <p className="text-xl font-bold text-slate-900">
            {formatMMK(getOrderTotal(order))}
          </p>
        </div>
      </section>

      <div className="mt-8">
        <Link
          href="/orders"
          className="inline-flex rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Back to Order History
        </Link>
      </div>
    </main>
  );
}
