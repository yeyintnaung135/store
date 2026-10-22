"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/app/store/cart-context";

export default function CartPage() {
  const { state, dispatch } = useCart();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const total = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  if (!isMounted) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-16" aria-busy="true">
        <p className="text-center text-slate-500">Loading your cart...</p>
      </main>
    );
  }

  if (state.items.length === 0) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
          🛒
        </div>

        <h1 className="mt-5 text-3xl font-bold text-slate-900">
          Your Cart Is Empty
        </h1>

        <p className="mt-3 text-slate-500">Add some products to get started.</p>

        <Link
          href="/products"
          className="mt-6 inline-flex rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          Browse Products
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Shopping Cart</h1>
          <p className="mt-2 text-sm text-slate-500">
            {state.items.reduce((sum, item) => sum + item.quantity, 0)} items in
            your cart
          </p>
        </div>

        <Link
          href="/products"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          Continue Shopping
        </Link>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <section className="space-y-4" aria-label="Cart items">
          {state.items.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="break-words font-semibold text-slate-900">
                    {item.name}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {item.price.toLocaleString("en-US")} MMK each
                  </p>
                </div>

                <p className="font-semibold text-slate-900">
                  {(item.price * item.quantity).toLocaleString("en-US")} MMK
                </p>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
                <div
                  className="flex items-center gap-3"
                  aria-label={`${item.name} quantity controls`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      dispatch({
                        type: "DECREASE_QUANTITY",
                        payload: { id: item.id },
                      })
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 transition hover:bg-slate-100"
                    aria-label={`Decrease ${item.name} quantity`}
                  >
                    −
                  </button>

                  <span
                    className="min-w-6 text-center font-medium"
                    aria-label={`${item.name} quantity`}
                  >
                    {item.quantity}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      dispatch({
                        type: "INCREASE_QUANTITY",
                        payload: { id: item.id },
                      })
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 transition hover:bg-slate-100"
                    aria-label={`Increase ${item.name} quantity`}
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    dispatch({
                      type: "REMOVE_FROM_CART",
                      payload: { id: item.id },
                    })
                  }
                  className="text-sm font-medium text-red-600 hover:underline"
                  aria-label={`Remove ${item.name} from cart`}
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </section>

        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900">Order Summary</h2>

          <div className="mt-5 flex items-center justify-between gap-4">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-medium text-slate-900">
              {total.toLocaleString("en-US")} MMK
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-4">
            <span className="text-slate-500">Shipping</span>
            <span className="text-sm text-slate-500">
              Calculated at checkout
            </span>
          </div>

          <div className="mt-5 border-t border-slate-200 pt-5">
            <div className="flex items-center justify-between gap-4">
              <span className="font-semibold text-slate-900">Total</span>
              <span className="text-xl font-bold text-slate-900">
                {total.toLocaleString("en-US")} MMK
              </span>
            </div>
          </div>

          <Link
            href="/checkout"
            className="mt-6 block w-full rounded-xl bg-blue-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-blue-700"
          >
            Proceed to Checkout
          </Link>

          <button
            type="button"
            onClick={() => dispatch({ type: "CLEAR_CART" })}
            className="mt-4 w-full text-sm font-medium text-red-600 hover:underline"
          >
            Clear Cart
          </button>
        </aside>
      </div>
    </main>
  );
}
