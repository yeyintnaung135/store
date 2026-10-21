
import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-6 text-white">
      <div className="text-center">
        <h1 className="text-7xl font-bold text-blue-500">
          404
        </h1>

        <h2 className="mt-4 text-2xl font-semibold">
          Page not found
        </h2>

        <p className="mt-3 text-gray-400">
          The page you are looking for does not exist.
        </p>

        <Link
          href="/"
          className="mt-7 inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700"
        >
          Back to Home
        </Link>
      </div>
    </main>
  )
}
