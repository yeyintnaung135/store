import Link from "next/link";

const navItems = [
  { label: "Overview", href: "/admin", icon: "◫" },
  { label: "Products", href: "/admin/products", icon: "▦" },
  { label: "Orders", href: "/admin/orders", icon: "▤" },
];

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 md:flex">
      <aside className="w-full border-b border-gray-200 bg-white p-5 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
        <Link href="/admin" className="text-xl font-bold tracking-tight">
          MM Store<span className="text-blue-600">.</span>
          <span className="mt-1 block text-xs font-normal text-gray-500">
            Admin Dashboard
          </span>
        </Link>

        <nav className="mt-8 flex gap-2 overflow-x-auto md:flex-col">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex shrink-0 items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-blue-50 hover:text-blue-700"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-8 rounded-xl bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-900">
            Store Management
          </p>
          <p className="mt-1 text-xs leading-5 text-blue-700">
            Manage products and orders from one place.
          </p>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-5 md:p-8 lg:p-10">{children}</main>
    </div>
  );
}
