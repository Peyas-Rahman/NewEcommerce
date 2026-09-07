import axios from "axios";

export interface FlashSale {
  id: number;
  productId: number;
  productName: string;
  slug: string;
  imageUrl?: string | null;
  originalPrice: number;
  salePrice: number;
  endsAt: string;
  isActive: boolean;
  sortOrder: number;
}

export type FlashSaleInput = Omit<FlashSale, "id" | "productName" | "slug" | "imageUrl" | "originalPrice">;

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || "/api" });

export async function getFlashSales(activeOnly = false) {
  return (await api.get<FlashSale[]>("/flash-sales", { params: { activeOnly } })).data;
}

export async function createFlashSale(data: FlashSaleInput) {
  return (await api.post<FlashSale>("/flash-sales", data)).data;
}

export async function updateFlashSale(id: number, data: FlashSaleInput) {
  return (await api.put<FlashSale>(`/flash-sales/${id}`, data)).data;
}

export async function deleteFlashSale(id: number) {
  await api.delete(`/flash-sales/${id}`);
}
