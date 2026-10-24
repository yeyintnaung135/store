import { getAccessToken, refreshSession } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type AdminCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export type CategoryInput = {
  name: string;
  slug: string;
  description?: string | null;
};

type CategoryListResponse =
  | AdminCategory[]
  | {
      data: AdminCategory[];
      meta?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
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

  if (!token) {
    try {
      const session = await refreshSession();
      token = session.accessToken;
    } catch {
      throw new Error("Your session has expired. Please log in again.");
    }
  }

  let response = await sendRequest(token);

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
    const body = data as {
      message?: string | string[];
    } | null;

    const message = body?.message;

    throw new Error(
      Array.isArray(message)
        ? message.join(", ")
        : message || `Request failed (${response.status})`,
    );
  }

  return data as T;
}

export async function getAdminCategories(): Promise<AdminCategory[]> {
  const response = await adminRequest<CategoryListResponse>("/categories");

  return Array.isArray(response) ? response : response.data;
}

export function createAdminCategory(
  input: CategoryInput,
): Promise<AdminCategory> {
  return adminRequest<AdminCategory>("/categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateAdminCategory(
  id: string,
  input: Partial<CategoryInput>,
): Promise<AdminCategory> {
  return adminRequest<AdminCategory>(`/categories/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function deleteAdminCategory(id: string): Promise<{ message: string }> {
  return adminRequest<{ message: string }>(
    `/categories/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    },
  );
}
