"use client";

import { useMemo, useState } from "react";

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: "Active" | "Draft";
};

const initialProducts: Product[] = [
  {
    id: 1,
    name: "Classic Cotton T-Shirt",
    category: "Clothing",
    price: 25000,
    stock: 45,
    status: "Active",
  },
  {
    id: 2,
    name: "Premium Hoodie",
    category: "Clothing",
    price: 55000,
    stock: 12,
    status: "Active",
  },
  {
    id: 3,
    name: "Wireless Headphones",
    category: "Electronics",
    price: 85000,
    stock: 20,
    status: "Active",
  },
  {
    id: 4,
    name: "Leather Wallet",
    category: "Accessories",
    price: 35000,
    stock: 0,
    status: "Draft",
  },
  {
    id: 5,
    name: "Smart Watch",
    category: "Electronics",
    price: 120000,
    stock: 8,
    status: "Active",
  },
  {
    id: 6,
    name: "Canvas Backpack",
    category: "Accessories",
    price: 45000,
    stock: 16,
    status: "Active",
  },
  {
    id: 7,
    name: "Running Shoes",
    category: "Footwear",
    price: 75000,
    stock: 25,
    status: "Active",
  },
  {
    id: 8,
    name: "Baseball Cap",
    category: "Accessories",
    price: 18000,
    stock: 30,
    status: "Draft",
  },
  {
    id: 9,
    name: "Denim Jacket",
    category: "Clothing",
    price: 95000,
    stock: 5,
    status: "Active",
  },
  {
    id: 10,
    name: "Bluetooth Speaker",
    category: "Electronics",
    price: 65000,
    stock: 14,
    status: "Active",
  },
];

const categories = [
  "All Categories",
  "Clothing",
  "Electronics",
  "Accessories",
  "Footwear",
];

const formatPrice = (price: number) => `${price.toLocaleString("en-US")} MMK`;

const validationMessage =
  "Enter a product name, a valid price, and a whole-number stock of zero or more.";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    name: "",
    category: "Clothing",
    price: "",
    stock: "",
    status: "Active" as Product["status"],
  });

  const pageSize = 5;

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name
        .toLowerCase()
        .includes(search.trim().toLowerCase());

      const matchesCategory =
        category === "All Categories" || product.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, category]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));

  const currentPage = Math.min(page, totalPages);

  const visibleProducts = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  function openCreateModal() {
    setEditingId(null);
    setForm({
      name: "",
      category: "Clothing",
      price: "",
      stock: "",
      status: "Active",
    });
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(product: Product) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
      status: product.status,
    });
    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setFormError("");
  }

  function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    const name = form.name.trim();
    const price = Number(form.price);
    const stock = Number(form.stock);

    if (
      !name ||
      form.price.trim() === "" ||
      form.stock.trim() === "" ||
      !Number.isFinite(price) ||
      !Number.isFinite(stock) ||
      price <= 0 ||
      stock < 0 ||
      !Number.isInteger(stock)
    ) {
      setFormError(validationMessage);
      return;
    }

    if (editingId !== null) {
      setProducts((current) =>
        current.map((product) =>
          product.id === editingId
            ? {
                ...product,
                name,
                category: form.category,
                price,
                stock,
                status: form.status,
              }
            : product,
        ),
      );
    } else {
      const newProduct: Product = {
        id: Math.max(0, ...products.map((product) => product.id)) + 1,
        name,
        category: form.category,
        price,
        stock,
        status: form.status,
      };

      setProducts((current) => [newProduct, ...current]);
      setSearch("");
      setCategory("All Categories");
      setPage(1);
    }

    closeModal();
  }

  function confirmDelete() {
    if (deleteId === null) return;

    setProducts((current) =>
      current.filter((product) => product.id !== deleteId),
    );

    setDeleteId(null);
  }

  function changeSearch(value: string) {
    setSearch(value);
    setPage(1);
  }

  function changeCategory(value: string) {
    setCategory(value);
    setPage(1);
  }

  const productToDelete = products.find((product) => product.id === deleteId);

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
          className="rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          + Add Product
        </button>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="mt-2 text-2xl font-bold">{products.length}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Active Products</p>
          <p className="mt-2 text-2xl font-bold">
            {products.filter((product) => product.status === "Active").length}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm text-gray-500">Low Stock (5 or fewer)</p>
          <p className="mt-2 text-2xl font-bold">
            {products.filter((product) => product.stock <= 5).length}
          </p>
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
            value={category}
            onChange={(event) => changeCategory(event.target.value)}
            aria-label="Filter by category"
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

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
              {visibleProducts.map((product) => (
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
                    {product.category}
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 font-medium">
                    {formatPrice(product.price)}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={
                        product.stock <= 5
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
                        product.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {product.status}
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
              ))}

              {visibleProducts.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-gray-500"
                  >
                    No products found. Try another search or category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center">
          <p className="text-sm text-gray-500">
            Showing{" "}
            {filteredProducts.length === 0
              ? 0
              : (currentPage - 1) * pageSize + 1}
            {"–"}
            {Math.min(currentPage * pageSize, filteredProducts.length)} of{" "}
            {filteredProducts.length} products
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="px-2 text-sm text-gray-600">
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
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
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
            className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 id="product-modal-title" className="text-xl font-bold">
              {editingId !== null ? "Edit Product" : "Add Product"}
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
                  className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
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
                  value={form.category}
                  onChange={(event) =>
                    setForm({ ...form, category: event.target.value })
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm"
                >
                  {categories
                    .filter((item) => item !== "All Categories")
                    .map((item) => (
                      <option key={item} value={item}>
                        {item}
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
                    min="1"
                    step="1"
                    value={form.price}
                    onChange={(event) =>
                      setForm({ ...form, price: event.target.value })
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
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
                    className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm"
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
                      status: event.target.value as Product["status"],
                    })
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                </select>
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
                  className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {editingId !== null ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteId !== null && productToDelete && (
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

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
