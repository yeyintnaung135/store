export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  unitPrice: string | number;
  quantity: number;
  subtotal: string | number;
};

export type OrderCustomer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
};

export type Order = {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  total: string | number;
  createdAt: string;
  updatedAt: string;
  user: OrderCustomer;
  items: OrderItem[];
};

export type OrdersMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type OrdersResponse = {
  data: Order[];
  meta: OrdersMeta;
};

export type AdminOrdersQuery = {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus;
};

export type UpdateOrderStatusPayload = {
  status: OrderStatus;
};
