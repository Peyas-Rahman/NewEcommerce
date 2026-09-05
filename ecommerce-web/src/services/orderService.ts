import axios from "axios";
import type { Order } from "../types/order";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("dexora_customer_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function getAllOrders(): Promise<Order[]> {
  const response = await api.get<Order[]>("/orders");
  return Array.isArray(response.data) ? response.data : [];
}

export async function getOrderById(id: number): Promise<Order> {
  const response = await api.get<Order>(`/orders/${id}`);
  return response.data;
}

export async function getOrderByNumber(
  orderNumber: string
): Promise<Order> {
  const response = await api.get<Order>(
    `/orders/number/${encodeURIComponent(orderNumber)}`
  );
  return response.data;
}

export async function updateOrderStatus(
  id: number,
  status: string,
  note?: string
): Promise<void> {
  await api.put(
    `/orders/${id}/status`,
    null,
    {
      params: {
        status,
        ...(note?.trim() ? { note: note.trim() } : {}),
      },
    }
  );
}

export async function cancelOrder(
  id: number,
  note?: string
): Promise<void> {
  await api.post(
    `/orders/${id}/cancel`,
    null,
    {
      params: note?.trim()
        ? { note: note.trim() }
        : undefined,
    }
  );
}

const orderService = {
  getAllOrders,
  getOrderById,
  getOrderByNumber,
  updateOrderStatus,
  cancelOrder,
};

export default orderService;
