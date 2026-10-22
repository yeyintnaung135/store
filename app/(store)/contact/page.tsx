"use client";

import { useState, type FormEvent } from "react";

type ContactForm = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

const initialForm: ContactForm = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

export default function ContactPage() {
  const [form, setForm] = useState<ContactForm>(initialForm);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setStatus("idle");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("idle");
    setIsSubmitting(true);

    try {
      // Frontend-only demo. Connect a real API to send messages.
      await new Promise((resolve) => setTimeout(resolve, 500));

      setForm(initialForm);
      setStatus("success");
    } catch {
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
          Contact MM Store
        </p>

        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          How can we help?
        </h1>

        <p className="mx-auto mt-5 max-w-xl leading-7 text-slate-600">
          Have a question about a product or your shopping experience? Send us a
          message and we will be happy to help.
        </p>
      </section>

      <section className="mx-auto mt-12 grid max-w-5xl gap-8 md:grid-cols-5">
        <aside className="rounded-2xl bg-slate-900 p-7 text-white md:col-span-2">
          <h2 className="text-2xl font-semibold">Get in touch</h2>

          <p className="mt-3 leading-7 text-slate-300">
            We welcome your questions, feedback, and suggestions.
          </p>

          <div className="mt-8 space-y-6">
            <div>
              <p className="text-sm font-medium text-slate-400">Email</p>
              <p className="mt-1 break-words">Your store email</p>
              <p className="mt-2 text-xs text-slate-400">
                Replace this with your real contact email.
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-400">Support</p>
              <p className="mt-1">Product questions and feedback</p>
            </div>
          </div>
        </aside>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 md:col-span-3">
          <h2 className="text-2xl font-semibold text-slate-900">
            Send us a message
          </h2>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Full name
              </label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                minLength={2}
                maxLength={100}
                autoComplete="name"
                placeholder="Your name"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                maxLength={254}
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="subject"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Subject
              </label>
              <input
                id="subject"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                required
                minLength={3}
                maxLength={150}
                placeholder="What is this about?"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                minLength={10}
                maxLength={3000}
                rows={5}
                placeholder="How can we help you?"
                className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-1 text-right text-xs text-slate-500">
                {form.message.length}/3000
              </p>
            </div>

            {status === "success" && (
              <p
                role="status"
                className="rounded-lg bg-green-50 p-3 text-sm text-green-700"
              >
                Demo submitted successfully. No message has actually been sent.
              </p>
            )}

            {status === "error" && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                Something went wrong. Please try again.
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
