"use client";

import Link from "next/link";
import { useCallback, useState, type ChangeEvent, type FormEvent } from "react";

type AuthMode = "login" | "register";

type AuthFormProps = {
  mode: AuthMode;
};

type AuthFormData = {
  name: string;
  identifier: string;
  password: string;
  confirmPassword: string;
};

const initialForm: AuthFormData = {
  name: "",
  identifier: "",
  password: "",
  confirmPassword: "",
};

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

function isValidIdentifier(value: string): boolean {
  const identifier = value.trim();

  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
  const isPhone = /^\+?[0-9\s()-]{7,20}$/.test(identifier);

  return isEmail || isPhone;
}

export default function AuthForm({ mode }: AuthFormProps) {
  const isLogin = mode === "login";

  const [form, setForm] = useState<AuthFormData>(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setError("");
      setSuccess("");

      const identifier = form.identifier.trim();

      if (!identifier || !form.password) {
        setError("Please fill in all required fields.");
        return;
      }

      if (!isValidIdentifier(identifier)) {
        setError("Enter a valid email address or phone number.");
        return;
      }

      if (form.password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }

      if (!isLogin && !form.name.trim()) {
        setError("Please enter your name.");
        return;
      }

      if (!isLogin && form.password !== form.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      setIsSubmitting(true);

      try {
        // TODO: Call the NestJS authentication API here.
        setSuccess(
          isLogin
            ? "Validation passed. Login API is not connected yet."
            : "Validation passed. Registration API is not connected yet.",
        );
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [form, isLogin],
  );

  const togglePassword = useCallback(() => {
    setShowPassword((current) => !current);
  }, []);

  const toggleConfirmPassword = useCallback(() => {
    setShowConfirmPassword((current) => !current);
  }, []);

  return (
    <main className="flex flex-1 items-center justify-center bg-slate-50 px-4 py-12">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl md:grid-cols-2">
        {/* Brand panel */}
        <section className="relative hidden flex-col justify-between overflow-hidden bg-slate-900 p-10 text-white md:flex lg:p-14">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />

          <Link href="/" className="relative text-2xl font-bold tracking-tight">
            MM<span className="text-blue-400">Store</span>
          </Link>

          <div className="relative py-12">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-400">
              {isLogin ? "Welcome back" : "Join MM Store"}
            </p>

            <h1 className="mt-5 text-4xl font-bold leading-tight lg:text-5xl">
              {isLogin
                ? "Your next favorite thing is waiting."
                : "Your shopping journey starts here."}
            </h1>

            <p className="mt-6 max-w-sm leading-7 text-slate-300">
              {isLogin
                ? "Sign in to enjoy a simpler shopping experience."
                : "Create an account to make shopping simpler and more convenient."}
            </p>
          </div>

          <p className="relative text-sm text-slate-400">
            Shop smarter. Live better.
          </p>
        </section>

        {/* Auth form */}
        <section className="px-6 py-10 sm:px-10 sm:py-14 lg:px-14">
          <div className="mx-auto max-w-md">
            <Link
              href="/"
              className="text-xl font-bold tracking-tight text-slate-900 md:hidden"
            >
              MM<span className="text-blue-600">Store</span>
            </Link>

            <div className="mt-8 md:mt-4">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                {isLogin ? "Sign in" : "Create account"}
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {isLogin
                  ? "Enter your email or phone number to continue."
                  : "Fill in your details to create your account."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {!isLogin && (
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Full name
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={100}
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    className={inputClass}
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="identifier"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email or phone number
                </label>

                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  inputMode="text"
                  required
                  maxLength={254}
                  value={form.identifier}
                  onChange={handleChange}
                  placeholder="you@example.com or +959..."
                  className={inputClass}
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-700"
                  >
                    Password
                  </label>

                  {isLogin && (
                    <Link
                      href="/forgot-password"
                      className="text-sm font-medium text-blue-600 hover:text-blue-700"
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
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    required
                    minLength={8}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="At least 8 characters"
                    className={`${inputClass} pr-20`}
                  />

                  <button
                    type="button"
                    onClick={togglePassword}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    className="absolute inset-y-0 right-3 text-sm font-medium text-slate-500 hover:text-slate-900"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Confirm password
                  </label>

                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter your password"
                      className={`${inputClass} pr-20`}
                    />

                    <button
                      type="button"
                      onClick={toggleConfirmPassword}
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                      className="absolute inset-y-0 right-3 text-sm font-medium text-slate-500 hover:text-slate-900"
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </p>
              )}

              {success && (
                <p
                  role="status"
                  className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
                >
                  {success}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-slate-900 px-5 py-3.5 font-semibold text-white shadow-sm transition hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "Please wait..."
                  : isLogin
                    ? "Sign in"
                    : "Create account"}
              </button>
            </form>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">
                {isLogin ? "NEW TO MM STORE?" : "ALREADY HAVE AN ACCOUNT?"}
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <Link
              href={isLogin ? "/register" : "/login"}
              className="block w-full rounded-xl border border-slate-300 px-5 py-3.5 text-center font-semibold text-slate-700 transition hover:border-slate-900 hover:bg-slate-50"
            >
              {isLogin ? "Create an account" : "Sign in instead"}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
