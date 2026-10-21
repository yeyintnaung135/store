"use client";

import Link from "next/link";
import { useCart } from "@/app/store/cart-context";

export default function CartPage() {
  const { state, dispatch } = useCart();

  const total = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  if (state.items.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold">Your Cart Is Empty</h1>
        <p className="mt-3 text-slate-500">Add some products to get started.</p>
        <Link
          href="/products"
          className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white"
        >
          Browse Products
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold">Shopping Cart</h1>

      <div className="mt-8 space-y-4">
        {state.items.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-white p-5"
          >
            <div>
              <h2 className="font-semibold">{item.name}</h2>
              <p className="mt-1 text-slate-500">
                {item.price.toLocaleString("en-US")} MMK
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  dispatch({
                    type: "DECREASE_QUANTITY",
                    payload: { id: item.id },
                  })
                }
                className="rounded border px-3 py-1"
                aria-label={`Decrease ${item.name} quantity`}
              >
                −
              </button>

              <span>{item.quantity}</span>

              <button
                onClick={() =>
                  dispatch({
                    type: "INCREASE_QUANTITY",
                    payload: { id: item.id },
                  })
                }
                className="rounded border px-3 py-1"
                aria-label={`Increase ${item.name} quantity`}
              >
                +
              </button>

              <button
                onClick={() =>
                  dispatch({
                    type: "REMOVE_FROM_CART",
                    payload: { id: item.id },
                  })
                }
                className="ml-2 text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>

            <p className="w-full text-right font-semibold">
              {(item.price * item.quantity).toLocaleString("en-US")} MMK
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t pt-6">
        <button
          onClick={() => dispatch({ type: "CLEAR_CART" })}
          className="text-red-600 hover:underline"
        >
          Clear Cart
        </button>

        <div className="text-right">
          <p className="text-sm text-slate-500">Total</p>
          <p className="text-2xl font-bold">
            {total.toLocaleString("en-US")} MMK
          </p>
          <button
            disabled
            className="mt-4 cursor-not-allowed rounded-xl bg-slate-300 px-6 py-3 font-semibold text-slate-600"
          >
            Checkout (Coming Soon)
          </button>
        </div>
      </div>
    </main>
  );
}
