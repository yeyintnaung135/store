"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getProducts, type Product } from "@/app/lib/product";

const PAGE_SIZE = Math.max(
  1,
  Number.parseInt(process.env.NEXT_PUBLIC_PRODUCT_PAGE_SIZE ?? "10", 10) || 10,
);

type SortOption = "default" | "price-asc" | "price-desc";

type ProductListProps = {
  initialCategory?: string;
  initialSort?: SortOption;
};

function formatPrice(price: string | number) {
  return Number(price).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

export default function ProductList({
  initialCategory = "all",
  initialSort = "default",
}: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryId, setCategoryId] = useState(
    initialCategory === "all" ? "" : initialCategory,
  );
  const [sort, setSort] = useState<SortOption>(initialSort);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);

  // Debounce search input before calling the API.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load the first page whenever search or category changes.
  useEffect(() => {
    const controller = new AbortController();

    async function loadFirstPage() {
      setLoading(true);
      setError("");
      setProducts([]);
      setPage(0);
      setTotalPages(0);
      loadingMoreRef.current = false;

      try {
        const result = await getProducts({
          page: 1,
          limit: PAGE_SIZE,
          search: debouncedSearch,
          categoryId: categoryId || undefined,
          signal: controller.signal,
        });

        setProducts(result.data);
        setPage(result.meta.page);
        setTotalPages(result.meta.totalPages);
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error ? err.message : "Failed to load products.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadFirstPage();
    return () => controller.abort();
  }, [debouncedSearch, categoryId]);

  const loadMore = useCallback(async () => {
    if (loading || loadingMoreRef.current || page === 0 || page >= totalPages) {
      return;
    }

    loadingMoreRef.current = true;
    setLoadingMore(true);
    setError("");

    try {
      const result = await getProducts({
        page: page + 1,
        limit: PAGE_SIZE,
        search: debouncedSearch,
        categoryId: categoryId || undefined,
      });

      setProducts((current) => {
        const existingIds = new Set(current.map((product) => product.id));
        return [
          ...current,
          ...result.data.filter((product) => !existingIds.has(product.id)),
        ];
      });
      setPage(result.meta.page);
      setTotalPages(result.meta.totalPages);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load more products.",
      );
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [loading, page, totalPages, debouncedSearch, categoryId]);

  // Infinite scroll.
  useEffect(() => {
    const element = sentinelRef.current;
    if (
      !element ||
      loading ||
      loadingMore ||
      page >= totalPages ||
      page === 0
    ) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "200px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [loadMore, loading, loadingMore, page, totalPages]);

  // Build category options from products received from the API.
  const categories = useMemo(() => {
    const map = new Map<string, string>();

    for (const product of products) {
      if (product.category?.id && product.category?.name) {
        map.set(product.category.id, product.category.name);
      }
    }

    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [products]);

  const sortedProducts = useMemo(() => {
    const result = [...products];

    if (sort === "price-asc") {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sort === "price-desc") {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    }

    return result;
  }, [products, sort]);

  function clearFilters() {
    setSearch("");
    setCategoryId("");
    setSort("default");
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search products..."
          aria-label="Search products"
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black sm:flex-1"
        />

        <select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          aria-label="Filter by category"
          className="rounded-lg border border-gray-300 bg-white px-4 py-3"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(event) => setSort(event.target.value as SortOption)}
          aria-label="Sort products"
          className="rounded-lg border border-gray-300 bg-white px-4 py-3"
        >
          <option value="default">Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>

        <button
          type="button"
          onClick={clearFilters}
          className="rounded-lg border border-gray-300 px-4 py-3 hover:bg-gray-50"
        >
          Clear
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-2 underline"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <p className="py-12 text-center text-gray-500">Loading products...</p>
      ) : sortedProducts.length === 0 ? (
        <div className="py-16 text-center">
          <h2 className="text-xl font-semibold">No products found</h2>
          <p className="mt-2 text-gray-500">
            Try a different search or clear your filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {sortedProducts.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.id}`}
              className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-md"
            >
              <div className="flex aspect-square items-center justify-center bg-gray-100">
                {product.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.photoUrl}
                    alt={product.name}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm text-gray-400">No image</span>
                )}
              </div>

              <div className="p-3 sm:p-4">
                <p className="mb-1 text-xs text-gray-500">
                  {product.category?.name ?? "Uncategorized"}
                </p>
                <h2 className="line-clamp-2 font-medium text-gray-900 group-hover:underline">
                  {product.name}
                </h2>
                <p className="mt-2 font-semibold text-gray-900">
                  {formatPrice(product.price)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-4" />

      {loadingMore && (
        <p className="py-6 text-center text-gray-500">
          Loading more products...
        </p>
      )}

      {!loading && page > 0 && page >= totalPages && products.length > 0 && (
        <p className="py-6 text-center text-sm text-gray-500">
          You&apos;ve reached the end.
        </p>
      )}
    </section>
  );
}
