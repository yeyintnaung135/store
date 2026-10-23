import { getAccessToken, refreshSession } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string | number;
  stock: number;
  status: "ACTIVE" | "DRAFT";
  photoUrl: string | null;
  categoryId: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
};

export type AdminProductListResponse = {
  data: AdminProduct[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export type ProductInput = {
  name: string;
  slug: string;
  description?: string | null;
  price: number;
  stock: number;
  categoryId: string;
  status?: "ACTIVE" | "DRAFT";
  photoUrl?: string | null;
};

type ProductQuery = {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
};

async function adminRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const baseUrl = API_URL.replace(/\/+$/, "");

  async function sendRequest(token: string): Promise<Response> {
    return fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...init.headers,
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
      cache: "no-store",
    });
  }

  let token = getAccessToken();

  // Restore the access token if it is missing.
  if (!token) {
    try {
      const session = await refreshSession();
      token = session.accessToken;
    } catch {
      throw new Error("Your session has expired. Please log in again.");
    }
  }

  let response = await sendRequest(token);

  // Refresh the token and retry once after a 401 response.
  if (response.status === 401) {
    try {
      const session = await refreshSession();
      response = await sendRequest(session.accessToken);
    } catch {
      throw new Error("Your session has expired. Please log in again.");
    }
  }

  const data: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const body = data as { message?: string | string[] } | null;
    const message = body?.message;

    throw new Error(
      Array.isArray(message)
        ? message.join(", ")
        : message || `Request failed (${response.status})`,
    );
  }

  return data as T;
}

export function getAdminProducts(
  params: ProductQuery = {},
): Promise<AdminProductListResponse> {
  const query = new URLSearchParams({
    page: String(params.page ?? 1),
    limit: String(params.limit ?? 10),
  });

  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }

  if (params.categoryId) {
    query.set("categoryId", params.categoryId);
  }

  return adminRequest<AdminProductListResponse>(
    `/products?${query.toString()}`,
  );
}

export function createAdminProduct(input: ProductInput): Promise<AdminProduct> {
  return adminRequest<AdminProduct>("/products", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateAdminProduct(
  id: string,
  input: Partial<ProductInput>,
): Promise<AdminProduct> {
  return adminRequest<AdminProduct>(`/products/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteAdminProduct(id: string): Promise<{ message: string }> {
  return adminRequest<{ message: string }>(
    `/products/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    },
  );
}
