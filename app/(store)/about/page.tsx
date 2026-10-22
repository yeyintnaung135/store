import Link from "next/link";

const values = [
  {
    title: "Quality Products",
    description:
      "We focus on offering useful products that bring value to your everyday life.",
  },
  {
    title: "Customer First",
    description:
      "We aim to make shopping simple, convenient, and enjoyable for everyone.",
  },
  {
    title: "Easy Shopping",
    description:
      "Discover products, compare prices, and find your favorites in one place.",
  },
];

export const metadata = {
  title: "About Us | MM Store",
  description: "Learn more about MM Store and our approach to online shopping.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <section className="grid items-center gap-12 md:grid-cols-2">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">
            About MM Store
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Shopping made simple.
          </h1>

          <p className="mt-6 max-w-xl leading-7 text-slate-600">
            MM Store is an online shopping experience designed to help you
            discover products easily. We believe shopping should be simple,
            convenient, and enjoyable.
          </p>

          <Link
            href="/products"
            className="mt-8 inline-flex rounded-xl bg-slate-900 px-6 py-3 font-medium text-white transition hover:bg-blue-600"
          >
            Explore Products
          </Link>
        </div>

        <div className="flex min-h-72 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-100 via-indigo-50 to-slate-100 p-10">
          <div className="text-center">
            <p className="text-6xl font-black tracking-tight text-slate-900">
              MM
            </p>
            <p className="mt-3 text-lg font-medium text-slate-600">
              Simple shopping. Better choices.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            What matters to us
          </h2>
          <p className="mt-4 leading-7 text-slate-600">
            Our goal is to create a convenient and reliable shopping experience
            for every customer.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {values.map((value, index) => (
            <article
              key={value.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-600">
                0{index + 1}
              </div>

              <h3 className="mt-5 text-xl font-semibold text-slate-900">
                {value.title}
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                {value.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-20 rounded-3xl bg-slate-900 px-6 py-12 text-center sm:px-12">
        <h2 className="text-3xl font-bold text-white">Ready to explore?</h2>

        <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-300">
          Browse our collection and discover something you will love.
        </p>

        <Link
          href="/products"
          className="mt-7 inline-flex rounded-xl bg-white px-6 py-3 font-semibold text-slate-900 transition hover:bg-blue-100"
        >
          Browse Products
        </Link>
      </section>
    </main>
  );
}
