"use client";

import Link from "next/link";
import { useState } from "react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "Categories", href: "/categories" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-2xl font-bold text-blue-600">
          MM Store<span className="text-gray-900">.</span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-600 transition hover:text-blue-600"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Search products"
            onClick={() => setSearchOpen(!searchOpen)}
            className="rounded-lg p-2 text-gray-700 hover:bg-gray-100"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m16 16 4 4" />
            </svg>
          </button>

          <Link
            href="/cart"
            className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Cart (0)
          </Link>

          <Link
            href="/login"
            className="hidden rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 sm:inline-flex"
          >
            Login
          </Link>

          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 md:hidden"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {searchOpen && (
        <div className="border-t border-gray-100 px-4 py-3">
          <form action="/products" className="mx-auto flex max-w-7xl gap-2">
            <input
              name="search"
              type="search"
              placeholder="Search products..."
              aria-label="Search products"
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700"
            >
              Search
            </button>
          </form>
        </div>
      )}

      {menuOpen && (
        <div className="border-t border-gray-200 bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600"
              >
                {link.label}
              </Link>
            ))}

            <Link
              href="/login"
              onClick={() => setMenuOpen(false)}
              className="mt-2 rounded-lg bg-blue-600 px-3 py-3 text-center font-semibold text-white"
            >
              Login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
