import Link from "next/link";
import { products } from "../products/data";

const categories = [
  {
    name: "Electronics",
    description: "Discover gadgets and everyday technology.",
    icon: "🎧",
  },
  {
    name: "Fashion",
    description: "Explore styles for every occasion.",
    icon: "👕",
  },
  {
    name: "Accessories",
    description: "Find useful accessories for your lifestyle.",
    icon: "🎒",
  },
];

export default function CategoriesPage() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-600">
          Explore MM Store
        </p>

        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
          Shop by Category
        </h1>

        <p className="mt-3 max-w-2xl text-slate-600">
          Discover products across our collections and find what you need.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const count = products.filter(
            (product) => product.category === category.name,
          ).length;

          return (
            <article
              key={category.name}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex size-14 items-center justify-center rounded-xl bg-indigo-50 text-3xl">
                {category.icon}
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-900">
                {category.name}
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {category.description}
              </p>

              <p className="mt-4 text-sm text-slate-500">{count} products</p>

              <Link
                href={`/products?category=${encodeURIComponent(category.name)}`}
                className="mt-5 inline-flex items-center gap-2 font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Browse products <span aria-hidden="true">→</span>
              </Link>
            </article>
          );
        })}
      </div>
    </main>
  );
}
