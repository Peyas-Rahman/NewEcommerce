import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("dexora_customer_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface ProductReview {
  id: number;
  productId: number;
  customerId: number;
  customerName: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
}

export interface ProductQuestion {
  id: number;
  productId: number;
  customerId: number;
  customerName: string;
  question: string;
  answer?: string | null;
  createdAt: string;
}

export async function getProductReviews(productId: number) {
  return (await api.get<ProductReview[]>(`/products/${productId}/reviews`)).data;
}

export async function createProductReview(productId: number, data: { rating: number; title?: string; comment: string }) {
  return (await api.post<ProductReview>(`/products/${productId}/reviews`, data)).data;
}

export async function getProductQuestions(productId: number) {
  return (await api.get<ProductQuestion[]>(`/products/${productId}/questions`)).data;
}

export async function createProductQuestion(productId: number, data: { question: string }) {
  return (await api.post<ProductQuestion>(`/products/${productId}/questions`, data)).data;
}
