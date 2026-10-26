"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

import { useAuth } from "@/app/lib/AuthProvider";
import { useCart } from "@/app/store/cart-context";
import { getAccessToken } from "@/app/lib/auth";
import { createOrderAction } from "@/app/lib/orders-action";
import type { Order } from "@/app/types/orders.tsx";

function formatPrice(price: number) {
  return price.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { state, dispatch } = useCart();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  const items = state.items ?? [];

  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  const totalPrice = items.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (submitting) return;

    if (authLoading) {
      setError("Login အခြေအနေကို စစ်ဆေးနေပါတယ်။");
      return;
    }

    if (!user) {
      setError("Order တင်ရန် Login ဝင်ပေးပါ။");
      return;
    }

    if (!items.length) {
      setError("Cart ထဲမှာ ပစ္စည်းမရှိပါဘူး။");
      return;
    }

    const token = getAccessToken();

    if (!token) {
      setError("Login session မရှိပါဘူး။ ပြန် Login ဝင်ပေးပါ။");
      return;
    }

    try {
      setSubmitting(true);

      const order = await createOrderAction(
        {
          items: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
        },
        token,
      );

      setCreatedOrder(order);

      // Order အောင်မြင်ပြီးမှ Cart ကိုရှင်းပါ။
      dispatch({ type: "CLEAR_CART" });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Order တင်လို့မရပါဘူး။ ထပ်ကြိုးစားပေးပါ။",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16 text-center">
        Loading...
      </main>
    );
  }

  if (createdOrder) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-2xl border p-8 text-center shadow-sm">
          <div className="mb-4 text-5xl text-green-600">✓</div>

          <h1 className="mb-3 text-3xl font-bold">
            Order Created Successfully!
          </h1>

          <p className="mb-6 text-gray-500">
            သင့် Order ကို Server မှာ အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ။
          </p>

          <div className="mb-6 rounded-xl bg-gray-50 p-5 text-left">
            <div className="flex justify-between gap-4 py-2">
              <span className="text-gray-500">Order Number</span>
              <strong>{createdOrder.orderNumber}</strong>
            </div>

            <div className="flex justify-between gap-4 py-2">
              <span className="text-gray-500">Status</span>
              <strong>{createdOrder.status}</strong>
            </div>

            <div className="flex justify-between gap-4 py-2">
              <span className="text-gray-500">Total</span>
              <strong>{formatPrice(Number(createdOrder.total))}</strong>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/orders"
              className="rounded-xl bg-black px-6 py-3 font-semibold text-white hover:bg-gray-800"
            >
              My Orders
            </Link>

            <Link
              href="/products"
              className="rounded-xl border px-6 py-3 font-semibold hover:bg-gray-50"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="mb-3 text-3xl font-bold">Your Cart Is Empty</h1>

        <p className="mb-6 text-gray-500">
          Order မတင်ခင် Cart ထဲကို ပစ္စည်းထည့်ပေးပါ။
        </p>

        <Link
          href="/products"
          className="rounded-xl bg-black px-6 py-3 font-semibold text-white"
        >
          Browse Products
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link href="/cart" className="text-sm text-gray-500 hover:text-black">
          ← Back to Cart
        </Link>

        <h1 className="mt-4 text-3xl font-bold">Checkout</h1>

        <p className="mt-2 text-gray-500">
          Order အချက်အလက်များကို စစ်ဆေးပြီး Place Order နှိပ်ပါ။
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="rounded-2xl border p-5 sm:p-8">
            <h2 className="mb-5 text-xl font-bold">Your Items</h2>

            <div className="divide-y">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between gap-4 py-4">
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {formatPrice(Number(item.price))} × {item.quantity}
                    </p>
                  </div>

                  <p className="shrink-0 font-semibold">
                    {formatPrice(Number(item.price) * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            {error && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {!user && (
              <p className="mt-5 text-sm text-amber-700">
                Order တင်ရန်{" "}
                <Link
                  href="/login?redirect=/checkout"
                  className="font-semibold underline"
                >
                  Login ဝင်ပါ
                </Link>
                ။
              </p>
            )}

            <form onSubmit={handleSubmit}>
              <button
                type="submit"
                disabled={submitting || !user}
                className="mt-6 w-full rounded-xl bg-black px-6 py-4 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Creating Order..."
                  : `Place Order · ${formatPrice(totalPrice)}`}
              </button>
            </form>
          </div>
        </section>

        <aside className="rounded-2xl border p-6">
          <h2 className="mb-5 text-xl font-bold">Order Summary</h2>

          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total Items</span>
              <span>{totalQuantity}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between gap-4 text-lg font-bold">
                <span>Total</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
            </div>
          </div>

          <p className="mt-5 text-xs leading-5 text-gray-500">
            Final price ကို Server က Database ထဲရှိ Product ဈေးနှုန်းအတိုင်း
            ပြန်လည်တွက်ချက်ပေးရပါမယ်။
          </p>
        </aside>
      </div>
    </main>
  );
}
