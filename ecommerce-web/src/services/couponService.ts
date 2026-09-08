import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL || "/api" });

export interface CouponResult {
  code: string;
  discountAmount: number;
  subTotal: number;
  grandTotal: number;
  message: string;
}

export async function validateCoupon(code: string, subTotal: number) {
  return (await api.post<CouponResult>("/coupons/validate", { code, subTotal })).data;
}
