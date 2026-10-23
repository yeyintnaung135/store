const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string | number;
  stock: number;
  status: string;
  photoUrl: string | null;
  categoryId: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
};

export type ProductListResponse = {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export async function getProducts(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    signal?: AbortSignal;
  } = {},
): Promise<ProductListResponse> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const url = new URL(`${API_URL.replace(/\/+$/, "")}/products`);

  url.searchParams.set("page", String(params.page ?? 1));
  url.searchParams.set("limit", String(params.limit ?? 10));

  if (params.search?.trim()) {
    url.searchParams.set("search", params.search.trim());
  }

  if (params.categoryId) {
    url.searchParams.set("categoryId", params.categoryId);
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: params.signal,
  });

  if (!response.ok) {
    throw new Error(`Unable to load products (${response.status})`);
  }

  return response.json() as Promise<ProductListResponse>;
}
