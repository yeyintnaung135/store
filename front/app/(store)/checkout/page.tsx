"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useCart } from "@/app/store/cart-context";

type CheckoutForm = {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes: string;
};

const initialForm: CheckoutForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  notes: "",
};

export default function CheckoutPage() {
  const { state } = useCart();
  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const total = state.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess(false);

    if (state.items.length === 0) {
      setError("Your cart is empty. Please add products first.");
      return;
    }

    const phone = form.phone.trim();

    if (!/^\+?[0-9\s()-]{7,20}$/.test(phone)) {
      setError("Please enter a valid phone number.");
      return;
    }

    setSuccess(true);
  }

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess(false);
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

  if (state.items.length === 0 && !success) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-slate-900">
          Your cart is empty
        </h1>
        <p className="mt-3 text-slate-500">
          Add products to your cart before checking out.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-block rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Browse Products
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Checkout</h1>
        <p className="mt-2 text-slate-500">
          Enter your delivery details to continue.
        </p>
      </div>

      {success ? (
        <section className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-8">
          <h2 className="text-2xl font-bold text-green-800">
            Checkout form validated!
          </h2>
          <p className="mt-3 leading-7 text-green-700">
            This is a frontend demo. Your order has not been created or
            submitted. Order processing will be enabled after the API is
            connected.
          </p>
          <Link
            href="/cart"
            className="mt-6 inline-block font-semibold text-green-800 underline"
          >
            Return to cart
          </Link>
        </section>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8"
          >
            <section>
              <h2 className="text-xl font-bold text-slate-900">
                Contact information
              </h2>

              <div className="mt-5">
                <label
                  htmlFor="name"
                  className="text-sm font-medium text-slate-700"
                >
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={100}
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className={inputClass}
                />
              </div>

              <div className="mt-5">
                <label
                  htmlFor="phone"
                  className="text-sm font-medium text-slate-700"
                >
                  Phone number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  maxLength={20}
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="+959..."
                  className={inputClass}
                />
              </div>

              <div className="mt-5">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-slate-700"
                >
                  Email address (optional)
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={inputClass}
                />
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-900">
                Delivery address
              </h2>

              <div className="mt-5">
                <label
                  htmlFor="address"
                  className="text-sm font-medium text-slate-700"
                >
                  Street address / Township
                </label>
                <textarea
                  id="address"
                  name="address"
                  required
                  minLength={5}
                  maxLength={500}
                  rows={3}
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Enter your full delivery address"
                  className={inputClass}
                />
              </div>

              <div className="mt-5">
                <label
                  htmlFor="city"
                  className="text-sm font-medium text-slate-700"
                >
                  City / Region
                </label>
                <input
                  id="city"
                  name="city"
                  required
                  maxLength={100}
                  value={form.city}
                  onChange={handleChange}
                  placeholder="e.g. Yangon"
                  className={inputClass}
                />
              </div>

              <div className="mt-5">
                <label
                  htmlFor="notes"
                  className="text-sm font-medium text-slate-700"
                >
                  Delivery notes (optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={2}
                  maxLength={500}
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Additional instructions"
                  className={inputClass}
                />
              </div>
            </section>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 px-5 py-3.5 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
            >
              Place Order
            </button>

            <Link
              href="/cart"
              className="block text-center text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              Back to cart
            </Link>
          </form>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold text-slate-900">Order Summary</h2>

            <div className="mt-5 space-y-4">
              {state.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between gap-4 text-sm"
                >
                  <div>
                    <p className="font-medium text-slate-800">{item.name}</p>
                    <p className="mt-1 text-slate-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="shrink-0 font-medium text-slate-900">
                    {(item.price * item.quantity).toLocaleString("en-US")} MMK
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-slate-200 pt-5">
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold text-slate-900">Subtotal</span>
                <span className="text-xl font-bold text-slate-900">
                  {total.toLocaleString("en-US")} MMK
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Delivery fees, if any, will be confirmed when the order
                processing API is implemented.
              </p>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
