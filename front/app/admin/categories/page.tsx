"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getAdminCategories,
  createAdminCategory,
  updateAdminCategory,
  deleteAdminCategory,
  type AdminCategory,
  type CategoryInput,
} from "@/app/lib/admin-categories";

function createSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategory | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getAdminCategories();
      setCategories(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Categories ကို ရယူလို့မရပါ။",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  function openCreateModal() {
    setEditing(null);
    setName("");
    setSlug("");
    setSlugManuallyEdited(false);
    setError("");
    setModalOpen(true);
  }

  function openEditModal(category: AdminCategory) {
    setEditing(category);
    setName(category.name);
    setSlug(category.slug);
    setSlugManuallyEdited(true);
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setError("");
  }

  function handleNameChange(value: string) {
    setName(value);

    if (!slugManuallyEdited) {
      setSlug(createSlug(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugManuallyEdited(true);
    setSlug(createSlug(value));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const cleanName = name.trim();
    const cleanSlug = createSlug(slug);

    if (!cleanName) {
      setError("Category name ထည့်ပေးပါ။");
      return;
    }

    if (!cleanSlug) {
      setError("Slug ထည့်ပေးပါ။ English letters, numbers နဲ့ hyphens သုံးပါ။");
      return;
    }

    const input: CategoryInput = {
      name: cleanName,
      slug: cleanSlug,
    };

    setSaving(true);

    try {
      if (editing) {
        await updateAdminCategory(editing.id, input);
        setSuccess("Category ကို ပြင်ဆင်ပြီးပါပြီ။");
      } else {
        await createAdminCategory(input);
        setSuccess("Category အသစ်ထည့်ပြီးပါပြီ။");
      }

      setModalOpen(false);
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "သိမ်းဆည်းလို့မရပါ။");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category: AdminCategory) {
    const confirmed = window.confirm(
      `"${category.name}" category ကို ဖျက်မှာ သေချာပါသလား?`,
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingId(category.id);

    try {
      await deleteAdminCategory(category.id);
      setCategories((current) =>
        current.filter((item) => item.id !== category.id),
      );
      setSuccess("Category ကို ဖျက်ပြီးပါပြီ။");
    } catch (err) {
      setError(err instanceof Error ? err.message : "ဖျက်လို့မရပါ။");
    } finally {
      setDeletingId(null);
    }
  }

  const filteredCategories = categories.filter((category) => {
    const keyword = search.trim().toLowerCase();

    return (
      category.name.toLowerCase().includes(keyword) ||
      category.slug.toLowerCase().includes(keyword) ||
      (category.description ?? "").toLowerCase().includes(keyword)
    );
  });

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-900 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
              Store Admin
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              Categories
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              သင့် Store ရဲ့ product categories တွေကို စီမံခန့်ခွဲပါ။
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-200"
          >
            + Add Category
          </button>
        </header>

        {error && !modalOpen && (
          <div
            role="alert"
            className="flex flex-col justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center"
          >
            <span>{error}</span>

            <button
              type="button"
              onClick={() => void loadCategories()}
              className="font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            <span>{success}</span>

            <button
              type="button"
              onClick={() => setSuccess("")}
              aria-label="Dismiss notification"
              className="rounded px-2 py-1 hover:bg-emerald-100"
            >
              ✕
            </button>
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Categories</p>
            <p className="mt-2 text-3xl font-bold">
              {loading ? "—" : categories.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Search Results</p>
            <p className="mt-2 text-3xl font-bold">
              {loading ? "—" : filteredCategories.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Category Management</p>
            <p className="mt-2 text-lg font-semibold text-emerald-600">
              Ready to manage
            </p>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">All Categories</h2>
              <p className="mt-1 text-sm text-slate-500">
                Category list and management
              </p>
            </div>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search categories..."
              aria-label="Search categories"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:max-w-xs"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Category</th>
                  <th className="px-5 py-4 font-semibold">Slug</th>
                  <th className="px-5 py-4 font-semibold">Description</th>
                  <th className="px-5 py-4 font-semibold">Created</th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-16 text-center text-slate-500"
                    >
                      Loading categories...
                    </td>
                  </tr>
                ) : filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <p className="font-medium text-slate-700">
                        {search ? "No categories found" : "No categories yet"}
                      </p>

                      <p className="mt-1 text-slate-500">
                        {search
                          ? "Search စကားလုံးကို ပြောင်းကြည့်ပါ။"
                          : "Add Category ကိုနှိပ်ပြီး စတင်ပါ။"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map((category) => (
                    <tr
                      key={category.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 font-bold text-indigo-600">
                            {category.name.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <p className="font-semibold">{category.name}</p>
                            <p className="mt-1 text-xs text-slate-400">
                              ID: {category.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <code className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                          {category.slug}
                        </code>
                      </td>

                      <td className="max-w-xs px-5 py-4 text-slate-500">
                        <span className="line-clamp-2">
                          {category.description || "—"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                        {category.createdAt
                          ? new Date(category.createdAt).toLocaleDateString()
                          : "—"}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(category)}
                            className="rounded-lg border border-slate-200 px-3 py-2 font-medium transition hover:bg-slate-100"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleDelete(category)}
                            disabled={deletingId === category.id}
                            className="rounded-lg border border-red-200 px-3 py-2 font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId === category.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-modal-title"
            className="my-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 id="category-modal-title" className="text-xl font-bold">
                  {editing ? "Edit Category" : "Create Category"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Category information ကို ဖြည့်ပေးပါ။
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="category-name"
                  className="mb-2 block text-sm font-medium"
                >
                  Category Name *
                </label>

                <input
                  id="category-name"
                  value={name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  placeholder="e.g. Electronics"
                  maxLength={100}
                  required
                  autoFocus
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <div>
                <label
                  htmlFor="category-slug"
                  className="mb-2 block text-sm font-medium"
                >
                  Slug *
                </label>

                <input
                  id="category-slug"
                  value={slug}
                  onChange={(event) => handleSlugChange(event.target.value)}
                  placeholder="e.g. electronics"
                  maxLength={150}
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />

                <p className="mt-1 text-xs text-slate-500">
                  URL မှာသုံးမယ့် identifier ဖြစ်ပါတယ်။
                </p>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 font-medium transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editing
                      ? "Save Changes"
                      : "Create Category"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
