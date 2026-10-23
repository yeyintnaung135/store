"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import { useAuth } from "@/app/lib/AuthProvider";

import {
  createAdminProduct,
  deleteAdminProduct,
  getAdminProducts,
  updateAdminProduct,
  type AdminProduct,
  type ProductInput,
} from "@/app/lib/adminProducts";

const PAGE_SIZE = 5;
const LOW_STOCK_THRESHOLD = 5;

type Category = {
  id: string;
  name: string;
  slug: string;
};

type ProductStatus = "ACTIVE" | "DRAFT";

type ProductForm = {
  name: string;
  categoryId: string;
  price: string;
  stock: string;
  status: ProductStatus;
  description: string;
  photoUrl: string;
};

const EMPTY_FORM: ProductForm = {
  name: "",
  categoryId: "",
  price: "",
  stock: "0",
  status: "DRAFT",
  description: "",
  photoUrl: "",
};

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const buttonClass =
  "rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50";

function formatPrice(price: string | number): string {
  return `${Number(price).toLocaleString("en-US")} MMK`;
}

function toSlug(value: string): string {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .trim()
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}

async function getCategories(): Promise<Category[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const { getAccessToken, refreshSession } = await import("@/app/lib/auth");

  async function request(token: string) {
    return fetch(`${apiUrl?.replace(/\/+$/, "")}/categories`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      cache: "no-store",
    });
  }

  let token = getAccessToken();

  if (!token) {
    const session = await refreshSession();
    token = session.accessToken;
  }

  let response = await request(token);

  if (response.status === 401) {
    const session = await refreshSession();
    response = await request(session.accessToken);
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const result = body as { message?: string | string[] } | null;
    throw new Error(
      Array.isArray(result?.message)
        ? result.message.join(", ")
        : result?.message || "Failed to load categories",
    );
  }

  const result = body as Category[] | { data: Category[] };
  const items = Array.isArray(result) ? result : result.data;

  if (!Array.isArray(items)) {
    throw new Error("Unexpected categories API response");
  }

  return items;
}

export default function AdminProductsPage() {
  const { user, loading: authLoading } = useAuth();

  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);

  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);

  const isAdmin = user?.role === "ADMIN";

  const activeProducts = useMemo(
    () => products.filter((product) => product.status === "ACTIVE").length,
    [products],
  );

  const lowStockProducts = useMemo(
    () =>
      products.filter((product) => product.stock <= LOW_STOCK_THRESHOLD).length,
    [products],
  );

  const productToDelete = products.find((product) => product.id === deleteId);

  const loadProducts = useCallback(async () => {
    if (!isAdmin) return;

    setLoading(true);
    setPageError("");

    try {
      const response = await getAdminProducts({
        page,
        limit: PAGE_SIZE,
        search: search.trim(),
        categoryId: categoryId || undefined,
      });

      setProducts(response.data);
      setTotalProducts(response.meta.total);
      setTotalPages(Math.max(1, response.meta.totalPages));
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [isAdmin, page, search, categoryId]);

  useEffect(() => {
    if (authLoading) return;

    if (!isAdmin) {
      setLoading(false);
      return;
    }

    void loadProducts();
  }, [authLoading, isAdmin, loadProducts]);

  useEffect(() => {
    if (authLoading || !isAdmin) return;

    let cancelled = false;

    async function loadCategoryOptions() {
      setCategoryLoading(true);

      try {
        const result = await getCategories();

        if (!cancelled) {
          setCategories(result);
        }
      } catch (error) {
        if (!cancelled) {
          setPageError(getErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setCategoryLoading(false);
        }
      }
    }

    void loadCategoryOptions();

    return () => {
      cancelled = true;
    };
  }, [authLoading, isAdmin]);

  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function changeCategory(value: string) {
    setCategoryId(value);
    setPage(1);
  }

  function openCreateModal() {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      categoryId: categories[0]?.id ?? "",
    });
    setFormError("");
    setNotice("");
    setModalOpen(true);
  }

  function openEditModal(product: AdminProduct) {
    setEditingId(product.id);

    setForm({
      name: product.name,
      categoryId: product.categoryId,
      price: String(product.price),
      stock: String(product.stock),
      status: product.status,
      description: product.description ?? "",
      photoUrl: product.photoUrl ?? "",
    });

    setFormError("");
    setNotice("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setFormError("");
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setNotice("");

    const name = form.name.trim();
    const price = Number(form.price);
    const stock = Number(form.stock);

    if (
      !name ||
      name.length > 120 ||
      form.price.trim() === "" ||
      !Number.isFinite(price) ||
      price <= 0 ||
      form.stock.trim() === "" ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setFormError(
        "Enter a product name, a valid positive price, and a whole-number stock of zero or more.",
      );
      return;
    }

    if (!form.categoryId) {
      setFormError("Please select a category.");
      return;
    }

    const slug = toSlug(name);

    if (!slug) {
      setFormError("Product name must contain letters or numbers.");
      return;
    }

    const input: ProductInput = {
      name,
      slug,
      price,
      stock,
      status: form.status,
      categoryId: form.categoryId,
      description: form.description.trim() || null,
      photoUrl: form.photoUrl.trim() || null,
    };

    setSaving(true);

    try {
      if (editingId) {
        await updateAdminProduct(editingId, input);
      } else {
        await createAdminProduct(input);
      }

      setModalOpen(false);
      setForm(EMPTY_FORM);
      setNotice(
        editingId
          ? "Product updated successfully."
          : "Product created successfully.",
      );

      // Return to the first page after creating a product.
      if (!editingId) {
        setPage(1);
        setSearch("");
        setCategoryId("");
      } else {
        await loadProducts();
      }

      if (!editingId) {
        // State changes trigger the list reload.
      }
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;

    setDeleting(true);
    setPageError("");
    setNotice("");

    try {
      await deleteAdminProduct(deleteId);
      setDeleteId(null);
      setNotice("Product deleted successfully.");

      // If the last item on a page was removed, move back one page.
      if (products.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        await loadProducts();
      }
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setDeleting(false);
    }
  }

  if (authLoading) {
    return (
      <div className="p-8 text-sm text-gray-500">Restoring your session...</div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl rounded-xl border border-gray-200 bg-white p-8">
        <h1 className="text-xl font-bold">Please log in</h1>
        <p className="mt-2 text-sm text-gray-500">
          Sign in to access product management.
        </p>
        <a
          href="/login"
          className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Go to login
        </a>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-7xl rounded-xl border border-red-200 bg-white p-8">
        <h1 className="text-xl font-bold text-red-700">Access denied</h1>
        <p className="mt-2 text-sm text-gray-600">
          You need an ADMIN account to manage products.
        </p>
      </div>
    );
  }

  const currentPage = Math.min(page, totalPages);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm text-gray-500">Store Management / Products</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Products</h1>
          <p className="mt-2 text-sm text-gray-500">
            Manage your product catalog, pricing, and stock.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          disabled={categories.length === 0 || categoryLoading}
          className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          + Add Product
        </button>
      </header>

      {notice && (
        <p
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
        >
          {notice}
        </p>
      )}

      {pageError && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <p>{pageError}</p>
          <button
            type="button"
            onClick={() => void loadProducts()}
            className="mt-2 font-semibold underline"
          >
            Retry loading products
          </button>
        </div>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="mt-2 text-2xl font-bold">{totalProducts}</p>
          <p className="mt-1 text-xs text-gray-400">All matching products</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Active Products on Page</p>
          <p className="mt-2 text-2xl font-bold">{activeProducts}</p>
          <p className="mt-1 text-xs text-gray-400">Current page only</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">
            Low Stock on Page (5 or fewer)
          </p>
          <p className="mt-2 text-2xl font-bold">{lowStockProducts}</p>
          <p className="mt-1 text-xs text-gray-400">Current page only</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-5 md:flex-row">
          <input
            value={search}
            onChange={(event) => changeSearch(event.target.value)}
            placeholder="Search products..."
            aria-label="Search products"
            className="min-w-0 flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />

          <select
            value={categoryId}
            onChange={(event) => changeCategory(event.target.value)}
            aria-label="Filter by category"
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            disabled={categoryLoading}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {categoryLoading && (
          <p className="px-5 py-2 text-xs text-gray-500">
            Loading categories...
          </p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-5 py-4 font-semibold">Product</th>
                <th className="px-5 py-4 font-semibold">Category</th>
                <th className="px-5 py-4 font-semibold">Price</th>
                <th className="px-5 py-4 font-semibold">Stock</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    No products found. Try another search or category.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="transition hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-900">
                        {product.name}
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        ID: {product.id}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {product.category?.name ?? "Unknown category"}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 font-medium">
                      {formatPrice(product.price)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={
                          product.stock <= LOW_STOCK_THRESHOLD
                            ? "font-semibold text-red-600"
                            : "text-gray-600"
                        }
                      >
                        {product.stock}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          product.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {product.status === "ACTIVE" ? "Active" : "Draft"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => openEditModal(product)}
                          className="font-medium text-blue-600 hover:text-blue-800"
                          aria-label={`Edit ${product.name}`}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteId(product.id)}
                          className="font-medium text-red-600 hover:text-red-800"
                          aria-label={`Delete ${product.name}`}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center">
          <p className="text-sm text-gray-500">
            {totalProducts === 0
              ? "Showing 0 products"
              : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(
                  (currentPage - 1) * PAGE_SIZE + products.length,
                  totalProducts,
                )} of ${totalProducts} products`}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1 || loading}
              onClick={() => setPage((current) => current - 1)}
              className={buttonClass}
            >
              Previous
            </button>

            <span className="px-2 text-sm text-gray-600">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages || loading}
              onClick={() => setPage((current) => current + 1)}
              className={buttonClass}
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 id="product-modal-title" className="text-xl font-bold">
              {editingId ? "Edit Product" : "Add Product"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Enter the product information below.
            </p>

            <form onSubmit={saveProduct} noValidate className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="product-name"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Product Name
                </label>
                <input
                  id="product-name"
                  required
                  maxLength={120}
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  className={inputClass}
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label
                  htmlFor="product-category"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Category
                </label>
                <select
                  id="product-category"
                  required
                  value={form.categoryId}
                  onChange={(event) =>
                    setForm({ ...form, categoryId: event.target.value })
                  }
                  className={inputClass}
                  disabled={categoryLoading || categories.length === 0}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="product-price"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Price (MMK)
                  </label>
                  <input
                    id="product-price"
                    required
                    type="number"
                    min="0.01"
                    step="any"
                    value={form.price}
                    onChange={(event) =>
                      setForm({ ...form, price: event.target.value })
                    }
                    className={inputClass}
                    placeholder="25000"
                  />
                </div>

                <div>
                  <label
                    htmlFor="product-stock"
                    className="mb-1.5 block text-sm font-medium"
                  >
                    Stock
                  </label>
                  <input
                    id="product-stock"
                    required
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={(event) =>
                      setForm({ ...form, stock: event.target.value })
                    }
                    className={inputClass}
                    placeholder="10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="product-status"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Status
                </label>
                <select
                  id="product-status"
                  value={form.status}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      status: event.target.value as ProductStatus,
                    })
                  }
                  className={inputClass}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="DRAFT">Draft</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="product-description"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Description
                </label>
                <textarea
                  id="product-description"
                  rows={3}
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                  className={inputClass}
                  placeholder="Optional product description"
                />
              </div>

              <div>
                <label
                  htmlFor="product-photo"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Photo URL
                </label>
                <input
                  id="product-photo"
                  type="url"
                  value={form.photoUrl}
                  onChange={(event) =>
                    setForm({ ...form, photoUrl: event.target.value })
                  }
                  className={inputClass}
                  placeholder="https://example.com/product.jpg"
                />
              </div>

              {formError && (
                <p role="alert" className="text-sm text-red-600">
                  {formError}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className={buttonClass}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || categoryLoading}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId && productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 id="delete-title" className="text-lg font-bold">
              Delete Product?
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-800">
                {productToDelete.name}
              </span>
              ? This action cannot be undone.
            </p>

            {pageError && (
              <p role="alert" className="mt-3 text-sm text-red-600">
                {pageError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                className={buttonClass}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void confirmDelete()}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
