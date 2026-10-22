export type OrderStatus =
  "Pending" | "Processing" | "Shipped" | "Delivered" | "Cancelled";

export type OrderItem = {
  id: number;
  name: string;
  price: number;
  quantity: number;
};

export type Order = {
  id: string;
  createdAt: string;
  status: OrderStatus;
  items: OrderItem[];
  customer: {
    name: string;
    phone: string;
    address: string;
    city: string;
  };
};

export const demoOrders: Order[] = [
  {
    id: "ORD-20261020-001",
    createdAt: "2026-10-20T09:30:00.000Z",
    status: "Delivered",
    items: [
      { id: 1, name: "Wireless Headphones", price: 45000, quantity: 1 },
      { id: 2, name: "USB-C Cable", price: 8000, quantity: 2 },
    ],
    customer: {
      name: "Demo Customer",
      phone: "09123456789",
      address: "No. 12, Test Street",
      city: "Yangon",
    },
  },
  {
    id: "ORD-20261018-002",
    createdAt: "2026-10-18T14:00:00.000Z",
    status: "Shipped",
    items: [{ id: 3, name: "Mechanical Keyboard", price: 85000, quantity: 1 }],
    customer: {
      name: "Demo Customer",
      phone: "09123456789",
      address: "No. 12, Test Street",
      city: "Yangon",
    },
  },
  {
    id: "ORD-20261015-003",
    createdAt: "2026-10-15T08:15:00.000Z",
    status: "Processing",
    items: [
      { id: 4, name: "Wireless Mouse", price: 25000, quantity: 1 },
      { id: 5, name: "Mouse Pad", price: 12000, quantity: 1 },
    ],
    customer: {
      name: "Demo Customer",
      phone: "09123456789",
      address: "No. 12, Test Street",
      city: "Yangon",
    },
  },
];

export function getOrderTotal(order: Order): number {
  return order.items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );
}

export function formatMMK(amount: number): string {
  return `${amount.toLocaleString("en-US")} MMK`;
}
