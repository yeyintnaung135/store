
"use client";

import { useEffect, useRef, useState } from "react";
import { products } from "./data";

const PAGE_SIZE = 10;

export default function ProductList() {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const visibleProducts = products.slice(0, visibleCount);
  const hasMore = visibleCount < products.length;

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target || !hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading) {
          setLoading(true);

          // Simulate fetching the next page
          const timer = setTimeout(() => {
            setVisibleCount((count) =>
              Math.min(count + PAGE_SIZE, products.length)
            );
            setLoading(false);
          }, 400);

          return () => clearTimeout(timer);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            All Products
          </h1>
          <p className="mt-2 text-gray-500">
            Discover your next favorite product.
          </p>
        </div>

        <span className="text-sm text-gray-500">
          {visibleCount} / {products.length}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {visibleProducts.map((product) => (
          <article
            key={product.id}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-lg"
          >
            <div className="relative aspect-[3/2] bg-gray-100">
            <img
  src={product.image}
  alt={product.name}
  loading="lazy"
  className="h-full w-full object-cover"
/>
            </div>

            <div className="p-3">
              <p className="text-xs text-blue-600">
                {product.category}
              </p>
              <h2 className="mt-1 font-semibold text-gray-900">
                {product.name}
              </h2>
              <p className="mt-2 font-bold text-gray-900">
                {product.price.toLocaleString("en-US")} MMK
              </p>
              <button
                type="button"
                className="mt-3 w-full rounded-lg bg-gray-900 px-3 py-2 text-sm text-white hover:bg-blue-600"
              >
                View Product
              </button>
            </div>
          </article>
        ))}
      </div>

      <div
        ref={sentinelRef}
        className="flex min-h-20 items-center justify-center"
        aria-live="polite"
      >
        {loading && hasMore && (
          <p className="text-sm text-gray-500">Loading more products...</p>
        )}
        {!hasMore && (
          <p className="text-sm text-gray-500">
            You have viewed all 50 products.
          </p>
        )}
      </div>
    </section>
  );
}
