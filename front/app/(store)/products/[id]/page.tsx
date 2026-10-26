import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import AddToCartBtn from "./addToCartBtn";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: string | number;
  image?: string | null;
  images?: string[] | null;
  category?: string | { name: string } | null;
};

type ProductDetailPageProps = {
  params: Promise<{ id: string }>;
};

const API_URL = (process.env.API_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

async function getProduct(id: string): Promise<Product | null> {
  const response = await fetch(
    `${API_URL}/products/${encodeURIComponent(id)}`,
    {
      cache: "no-store",
    },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Product API failed: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as Product;
}

async function ProductContent({ params }: ProductDetailPageProps) {
  // params ကို Suspense အတွင်းရှိ component ထဲမှာမှ ဖတ်ပါ။
  const { id } = await params;

  // Database ရဲ့ UUID string ကို တိုက်ရိုက်သုံးပါ။
  // Number(id) မပြောင်းရပါ။
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const category =
    typeof product.category === "string"
      ? product.category
      : (product.category?.name ?? "Product");

  const image =
    product.image ?? product.images?.[0] ?? "/images/product-placeholder.png";

  const price = Number(product.price);

  if (!Number.isFinite(price)) {
    throw new Error("Invalid product price.");
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-gray-500">
        <Link href="/" className="hover:text-black">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/products" className="hover:text-black">
          Products
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      <section className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-12">
        <div className="flex min-h-[320px] items-center justify-center overflow-hidden rounded-2xl bg-gray-100 p-6 sm:min-h-[450px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={product.name}
            className="max-h-[450px] w-full object-contain"
          />
        </div>

        <div className="flex flex-col justify-center">
          <p className="mb-3 text-sm font-medium uppercase tracking-wider text-gray-500">
            {category}
          </p>

          <h1 className="mb-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {product.name}
          </h1>

          <p className="mb-6 text-2xl font-semibold text-gray-900">
            {price.toLocaleString("en-US", {
              style: "currency",
              currency: "USD",
            })}
          </p>

          <div className="mb-8">
            <h2 className="mb-2 text-lg font-semibold text-gray-900">
              Product Description
            </h2>

            <p className="whitespace-pre-line leading-7 text-gray-600">
              {product.description || "No description available."}
            </p>
          </div>

          <div className="mb-6">
            <AddToCartBtn
              product={{
                id: product.id,
                name: product.name,
                price,
                image,
                category,
                description: product.description ?? "",
              }}
            />
          </div>

          <Link
            href="/products"
            className="inline-flex w-fit items-center text-sm font-medium text-gray-600 hover:text-black"
          >
            ← Continue Shopping
          </Link>
        </div>
      </section>
    </main>
  );
}

function ProductLoading() {
  return (
    <main className="mx-auto w-full max-w-7xl animate-pulse px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 h-4 w-48 rounded bg-gray-200" />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="min-h-[320px] rounded-2xl bg-gray-200 md:min-h-[450px]" />

        <div className="space-y-5 py-6">
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="h-10 w-3/4 rounded bg-gray-200" />
          <div className="h-8 w-36 rounded bg-gray-200" />
          <div className="h-24 rounded bg-gray-200" />
          <div className="h-12 w-40 rounded bg-gray-200" />
        </div>
      </div>
    </main>
  );
}

export default function ProductDetailPage(props: ProductDetailPageProps) {
  return (
    <Suspense fallback={<ProductLoading />}>
      <ProductContent params={props.params} />
    </Suspense>
  );
}
