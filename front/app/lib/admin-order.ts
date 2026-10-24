import type {
  AdminOrdersQuery,
  Order,
  OrdersResponse,
  OrderStatus,
  UpdateOrderStatusPayload,
} from "@/app/types/orders";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export class AdminOrderApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = "AdminOrderApiError";
  }
}

function getAccessToken(): string {
  if (typeof window === "undefined") {
    throw new AdminOrderApiError("Browser environment is required.");
  }

  // Change this key if your login code stores the token under another name.
  const token = localStorage.getItem("accessToken");

  if (!token) {
    throw new AdminOrderApiError("Access token မရှိပါ။ ပြန် Login ဝင်ပေးပါ။");
  }

  return token;
}

async function adminOrderRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getAccessToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);

    const message = Array.isArray(body?.message)
      ? body.message.join(", ")
      : body?.message;

    throw new AdminOrderApiError(
      message || `Request failed (${response.status})`,
      response.status,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/**
 * GET /admin/orders
 */
export async function getAdminOrders(
  query: AdminOrdersQuery = {},
): Promise<OrdersResponse> {
  const params = new URLSearchParams();

  if (query.page !== undefined) {
    params.set("page", String(query.page));
  }

  if (query.limit !== undefined) {
    params.set("limit", String(query.limit));
  }

  if (query.search?.trim()) {
    params.set("search", query.search.trim());
  }

  if (query.status) {
    params.set("status", query.status);
  }

  const searchParams = params.toString();

  return adminOrderRequest<OrdersResponse>(
    `/admin/orders${searchParams ? `?${searchParams}` : ""}`,
  );
}

/**
 * GET /admin/orders/:id
 */
export async function getAdminOrderById(id: string): Promise<Order> {
  return adminOrderRequest<Order>(`/admin/orders/${encodeURIComponent(id)}`);
}

/**
 * PATCH /admin/orders/:id/status
 */
export async function updateAdminOrderStatus(
  id: string,
  payload: UpdateOrderStatusPayload,
): Promise<Order> {
  return adminOrderRequest<Order>(
    `/admin/orders/${encodeURIComponent(id)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export const adminOrderStatuses: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export const allowedOrderStatusTransitions: Record<OrderStatus, OrderStatus[]> =
  {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["PROCESSING", "CANCELLED"],
    PROCESSING: ["SHIPPED", "CANCELLED"],
    SHIPPED: ["DELIVERED"],
    DELIVERED: [],
    CANCELLED: [],
  };
