"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  login as loginRequest,
  register as registerRequest,
} from "../../lib/auth";
import { useAuth } from "../../lib/AuthProvider";

type AuthFormComponentProps = {
  mode?: "login" | "register";
};

export default function AuthFormComponent({
  mode = "login",
}: AuthFormComponentProps) {
  const router = useRouter();
  const { login } = useAuth();

  const isRegister = mode === "register";

  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanIdentifier = identifier.trim();
    const isEmail = cleanIdentifier.includes("@");

    if (!cleanIdentifier) {
      setError("Please enter your email or phone number.");
      return;
    }

    if (isRegister && !name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (password.length < 8 || password.length > 72) {
      setError("Password must be between 8 and 72 characters.");
      return;
    }

    if (isRegister && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (
      !isEmail &&
      !/^\+[1-9]\d{7,14}$/.test(cleanIdentifier.replace(/[\s()-]/g, ""))
    ) {
      setError(
        "Enter a valid email address or phone number with country code, e.g. +959123456789.",
      );
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        const normalizedPhone = cleanIdentifier.replace(/[\s()-]/g, "");

        await registerRequest({
          name: name.trim(),
          ...(isEmail
            ? { email: cleanIdentifier.toLowerCase() }
            : { phone: normalizedPhone }),
          password,
        });

        setSuccess("Account created successfully. Please log in.");

        router.replace("/login");
        router.refresh();
      } else {
        await login({
          identifier: isEmail
            ? cleanIdentifier.toLowerCase()
            : cleanIdentifier.replace(/[\s()-]/g, ""),
          password,
        });

        router.replace("/");
        router.refresh();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight text-gray-900"
          >
            MM Store
          </Link>

          <h1 className="mt-6 text-2xl font-bold text-gray-900">
            {isRegister ? "Create your account" : "Welcome back"}
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {isRegister
              ? "Sign up to start shopping with us."
              : "Sign in to continue shopping."}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
          >
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegister && (
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Full name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter your full name"
                required
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-100"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="identifier"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Email or phone number
            </label>

            <input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              placeholder="you@example.com or +959123456789"
              required
              disabled={loading}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-100"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>

              {!isRegister && (
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-gray-700 hover:text-black hover:underline"
                >
                  Forgot password?
                </Link>
              )}
            </div>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={isRegister ? "new-password" : "current-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                minLength={8}
                maxLength={72}
                required
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-20 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-100"
              />

              <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                className="absolute inset-y-0 right-3 text-sm font-medium text-gray-500 hover:text-gray-900"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {isRegister && (
            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Confirm password
              </label>

              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Enter your password again"
                minLength={8}
                maxLength={72}
                required
                disabled={loading}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-900 focus:ring-2 focus:ring-gray-900/10 disabled:bg-gray-100"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-gray-900 px-4 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Please wait..."
              : isRegister
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <Link
            href={isRegister ? "/login" : "/register"}
            className="font-semibold text-gray-900 hover:underline"
          >
            {isRegister ? "Sign in" : "Create account"}
          </Link>
        </p>

        <div className="mt-6 border-t border-gray-100 pt-5 text-center">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">
            ← Continue shopping
          </Link>
        </div>
      </div>
    </main>
  );
}
