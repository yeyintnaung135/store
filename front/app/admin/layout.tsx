import Link from "next/link";
import AdminNavigation from "./AdminNavigation";
import AdminRouteGuard from "./AdminRouteGuard";

const navItems = [
  { label: "Overview", href: "/admin", icon: "◫" },
  { label: "Products", href: "/admin/products", icon: "▦" },
  { label: "Orders", href: "/admin/orders", icon: "▤" },
  { label: "Sales", href: "/admin/sales", icon: "◷" },
  { label: "Users", href: "/admin/users", icon: "♙" },
];

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-50 text-gray-900 md:flex">
        <aside className="w-full border-b border-gray-200 bg-white p-5 md:min-h-screen md:w-64 md:shrink-0 md:border-b-0 md:border-r">
          <Link
            href="/admin"
            className="inline-block rounded-lg text-xl font-bold tracking-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            MM Store<span className="text-blue-600">.</span>
            <span className="mt-1 block text-xs font-normal text-gray-500">
              Admin Dashboard
            </span>
          </Link>

          <AdminNavigation items={navItems} />

          <div className="mt-8 rounded-xl bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-900">
              Store Management
            </p>
            <p className="mt-1 text-xs leading-5 text-blue-700">
              Manage products, orders, sales, and users from one place.
            </p>
          </div>

          <div className="mt-5 border-t border-gray-100 pt-4">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
            >
              <span aria-hidden="true">↗</span>
              Back to Store
            </Link>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-5 md:p-8 lg:p-10">{children}</main>
      </div>
    </AdminRouteGuard>
  );
}
