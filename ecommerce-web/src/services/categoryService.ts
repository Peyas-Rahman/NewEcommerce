import axios from "axios";

import type {
  Category,
  CreateCategory,
  UpdateCategory,
} from "../types/category";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const categoryApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

categoryApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("dexora_customer_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getAllCategories = async (): Promise<Category[]> => {
  const response =
    await categoryApi.get<Category[]>("/categories");

  return response.data;
};

export const getCategoryById = async (
  id: number
): Promise<Category> => {
  const response =
    await categoryApi.get<Category>(
      `/categories/${id}`
    );

  return response.data;
};

export const createCategory = async (
  data: CreateCategory
): Promise<Category> => {
  const response =
    await categoryApi.post<Category>(
      "/categories",
      data
    );

  return response.data;
};

export const updateCategory = async (
  id: number,
  data: UpdateCategory
): Promise<Category> => {
  const response =
    await categoryApi.put<Category>(
      `/categories/${id}`,
      data
    );

  return response.data;
};

export const deleteCategory = async (
  id: number
): Promise<void> => {
  await categoryApi.delete(`/categories/${id}`);
};