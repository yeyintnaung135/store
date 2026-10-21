"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { products } from "./data";
import Link from "next/link";

const PAGE_SIZE = Math.max(
  1,
  Number.parseInt(process.env.NEXT_PUBLIC_PRODUCT_PAGE_SIZE ?? "10", 10) || 10,
);

type SortOption = "default" | "price-asc" | "price-desc";

export default function ProductList() {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState<SortOption>("default");

  const sentinelRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(
    () => ["All", ...new Set(products.map((product) => product.category))],
    [],
  );

  const filteredProducts = useMemo(() => {
    const result = products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.trim().toLowerCase());

      const matchesCategory =
        category === "All" || product.category === category;

      return matchesSearch && matchesCategory;
    });

    if (sort === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sort === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [search, category, sort]);

  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  useEffect(() => {
    if (!loading) return;

    const timer = setTimeout(() => {
      setVisibleCount((count) =>
        Math.min(count + PAGE_SIZE, filteredProducts.length),
      );
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [loading, filteredProducts.length]);

  useEffect(() => {
    const target = sentinelRef.current;

    if (!target || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoading(true);
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [hasMore, loading]);

  function resetPagination() {
    setVisibleCount(PAGE_SIZE);
    setLoading(false);
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            All Products
          </h1>
          <p className="mt-2 text-slate-500">
            Discover your next favorite product.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPagination();
            }}
            placeholder="Search products..."
            aria-label="Search products"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              resetPagination();
            }}
            aria-label="Filter by category"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item === "All" ? "All Categories" : item}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as SortOption);
              resetPagination();
            }}
            aria-label="Sort products by price"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="default">Default Sorting</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>

        <p className="text-sm text-slate-500">
          Showing {visibleProducts.length} of {filteredProducts.length} products
        </p>
      </div>

      {visibleProducts.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visibleProducts.map((product) => (
            <article
              key={product.id}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative aspect-[3/2] bg-slate-100">
                <img
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="p-3">
                <p className="text-xs text-blue-600">{product.category}</p>

                <h2 className="mt-1 font-semibold text-slate-900">
                  {product.name}
                </h2>

                <p className="mt-2 font-bold text-slate-900">
                  {product.price.toLocaleString("en-US")} MMK
                </p>

                <Link
                  href={`/products/${product.id}`}
                  className="mt-3 block w-full rounded-lg bg-slate-900 px-3 py-2 text-center text-sm text-white transition hover:bg-blue-600"
                >
                  View Product
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <p className="font-medium text-slate-700">No products found</p>
          <p className="mt-2 text-sm text-slate-500">
            Try another search term or category.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setCategory("All");
              setSort("default");
              resetPagination();
            }}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Clear Filters
          </button>
        </div>
      )}

      <div
        ref={sentinelRef}
        className="flex min-h-20 items-center justify-center"
        aria-live="polite"
      >
        {loading && hasMore && (
          <p className="text-sm text-slate-500">Loading more products...</p>
        )}

        {!hasMore && filteredProducts.length > 0 && (
          <p className="text-sm text-slate-500">
            You have viewed all {filteredProducts.length} matching products.
          </p>
        )}
      </div>
    </section>
  );
}
