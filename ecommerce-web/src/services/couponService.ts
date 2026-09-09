import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || "/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("dexora_customer_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface CouponResult {
  code: string;
  discountAmount: number;
  subTotal: number;
  grandTotal: number;
  message: string;
}

export interface Coupon {
  id: number;
  code: string;
  discountType: "Percentage" | "Fixed";
  discountValue: number;
  minimumOrderAmount?: number | null;
  maximumDiscountAmount?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  startsAt?: string | null;
  expiresAt?: string | null;
  isActive: boolean;
}

export interface CouponPayload {
  code: string;
  discountType: "Percentage" | "Fixed";
  discountValue: number;
  minimumOrderAmount?: number | null;
  maximumDiscountAmount?: number | null;
  usageLimit?: number | null;
  startsAt?: string | null;
  expiresAt?: string | null;
  isActive: boolean;
}

export async function validateCoupon(code: string, subTotal: number) {
  return (await api.post<CouponResult>("/coupons/validate", { code, subTotal })).data;
}

export async function getAllCoupons(): Promise<Coupon[]> {
  const data = (await api.get("/coupons")).data;
  return Array.isArray(data) ? data : [];
}

export async function createCoupon(payload: CouponPayload): Promise<Coupon> {
  return (await api.post<Coupon>("/coupons", payload)).data;
}

export async function updateCoupon(id: number, payload: CouponPayload): Promise<Coupon> {
  return (await api.put<Coupon>(`/coupons/${id}`, payload)).data;
}

export async function deleteCoupon(id: number): Promise<void> {
  await api.delete(`/coupons/${id}`);
}

export default {
  validateCoupon,
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};
