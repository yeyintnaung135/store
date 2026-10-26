"use server";

import type { CreateOrderInput, Order } from "@/app/types/orders.tsx";

const API_URL = (
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3000"
).replace(/\/+$/, "");

export async function createOrderAction(
  payload: CreateOrderInput,
  accessToken: string,
): Promise<Order> {
  if (!accessToken?.trim()) {
    throw new Error("Login လုပ်ထားဖို့လိုပါတယ်။");
  }

  const response = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const result: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof result === "object" && result !== null && "message" in result
        ? (result as { message: string | string[] }).message
        : `Order creation failed (${response.status}).`;

    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }

  return result as Order;
}
