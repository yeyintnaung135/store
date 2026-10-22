import { Suspense } from "react";
import ProductList from "./productsList";

type ProductsPageProps = {
  searchParams: Promise<{
    category?: string;
    sort?: string;
  }>;
};

async function ProductsContent({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  return (
    <ProductList
      initialCategory={params.category ?? "All"}
      initialSort={params.sort ?? "default"}
    />
  );
}

export default function ProductsPage(props: ProductsPageProps) {
  return (
    <Suspense fallback={<p className="p-8">Loading products...</p>}>
      <ProductsContent searchParams={props.searchParams} />
    </Suspense>
  );
}
