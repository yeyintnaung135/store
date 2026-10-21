import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { products } from "../data";

type ProductDetailPageProps = {
  params: Promise<{ id: string }>;
};

async function ProductContent({ params }: ProductDetailPageProps) {
  const { id } = await params;
  const productId = Number(id);

  const product = products.find((item) => item.id === productId);

  if (!product) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        ← Back to Products
      </Link>

      <div className="mt-8 grid gap-10 md:grid-cols-2">
        <img
          src={product.image}
          alt={product.name}
          className="aspect-[4/3] w-full rounded-2xl object-cover"
        />

        <div>
          <p className="text-sm font-semibold text-blue-600">
            {product.category}
          </p>

          <h1 className="mt-3 text-3xl font-bold text-slate-900">
            {product.name}
          </h1>

          <p className="mt-5 text-2xl font-bold text-slate-900">
            {product.price.toLocaleString("en-US")} MMK
          </p>

          <hr className="my-6 border-slate-200" />

          <h2 className="text-lg font-semibold">Product Description</h2>

          <p className="mt-3 leading-7 text-slate-600">{product.description}</p>

          <button
            type="button"
            className="mt-8 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </section>
  );
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-[60vh] flex-col items-center justify-center gap-4"
          role="status"
          aria-label="Loading product"
        >
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="text-sm font-medium text-slate-500">
            Loading product...
          </p>
        </div>
      }
    >
      <ProductContent params={params} />
    </Suspense>
  );
}
