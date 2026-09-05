import axios from "axios";
import type { Product } from "../types/product";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// =========================================================
// TYPES
// =========================================================

export interface ProductQuery {
  search?: string;
  categoryId?: number;
  brandId?: number;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: string;
}

export interface ProductImagePayload {
  imageUrl: string;
  altText?: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductVariantPayload {
  name: string;
  sku?: string | null;
  price?: number | null;
  discountPrice?: number | null;
  trackInventory: boolean;
  isActive: boolean;
  sortOrder: number;
}

// =========================================================
// GET ALL PRODUCTS
// =========================================================

export async function getAll(): Promise<Product[]> {
  const response = await api.get("/Products");

  const data = response.data;

  console.log("GET PRODUCTS RESPONSE:", data);

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  if (Array.isArray(data?.products)) {
    return data.products;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  return [];
}

// =========================================================
// GET PRODUCT BY ID
// =========================================================

export async function getById(id: number) {
  const response = await api.get(
    `/Products/${id}`
  );

  return response.data;
}

// =========================================================
// GET PRODUCT DETAILS
// =========================================================

export async function getDetails(id: number) {
  const response = await api.get(
    `/Products/${id}/details`
  );

  return response.data;
}

// =========================================================
// SEARCH PRODUCTS
// =========================================================

export async function search(
  query: ProductQuery = {}
) {
  const response = await api.get(
    "/Products/search",
    {
      params: query,
    }
  );

  return response.data;
}

// =========================================================
// CREATE PRODUCT
// =========================================================

export async function create(data: any) {
  const response = await api.post(
    "/Products",
    data
  );

  return response.data;
}

// =========================================================
// UPDATE PRODUCT
// =========================================================

export async function update(
  id: number,
  data: any
) {
  const response = await api.put(
    `/Products/${id}`,
    data
  );

  return response.data;
}

// =========================================================
// DELETE PRODUCT
// =========================================================

export async function remove(id: number) {
  await api.delete(
    `/Products/${id}`
  );

  return true;
}

// =========================================================
// PRODUCT IMAGES
// =========================================================

// GET ALL IMAGES

export async function getImages(
  productId: number
) {
  const response = await api.get(
    `/products/${productId}/images`
  );

  return response.data;
}

// =========================================================
// GET SINGLE IMAGE
// =========================================================

export async function getImage(
  productId: number,
  imageId: number
) {
  const response = await api.get(
    `/products/${productId}/images/${imageId}`
  );

  return response.data;
}

// =========================================================
// CREATE IMAGE BY URL
// =========================================================

export async function createImage(
  productId: number,
  data: ProductImagePayload
) {
  const response = await api.post(
    `/products/${productId}/images`,
    data
  );

  return response.data;
}

// =========================================================
// UPDATE IMAGE
// =========================================================

export async function updateImage(
  productId: number,
  imageId: number,
  data: ProductImagePayload
) {
  const response = await api.put(
    `/products/${productId}/images/${imageId}`,
    data
  );

  return response.data;
}

// =========================================================
// DELETE IMAGE
// =========================================================

export async function deleteImage(
  productId: number,
  imageId: number
) {
  await api.delete(
    `/products/${productId}/images/${imageId}`
  );

  return true;
}

// =========================================================
// UPLOAD PRODUCT IMAGE
//
// BACKEND ENDPOINT:
//
// POST /api/products/{productId}/images/upload
//
// This endpoint:
// 1. Saves physical image
// 2. Creates ProductImages record
// 3. Returns ProductImageDto
// =========================================================

export async function uploadImage(
  productId: number,
  file: File,
  altText?: string,
  isPrimary: boolean = false,
  sortOrder: number = 0
) {
  if (!productId) {
    throw new Error(
      "Product ID is required."
    );
  }

  if (!file) {
    throw new Error(
      "Image file is required."
    );
  }

  const formData = new FormData();

  formData.append(
    "file",
    file
  );

  formData.append(
    "altText",
    altText || ""
  );

  formData.append(
    "isPrimary",
    String(isPrimary)
  );

  formData.append(
    "sortOrder",
    String(sortOrder)
  );

  const response = await api.post(
    `/products/${productId}/images/upload`,
    formData,
    {
      headers: {
        "Content-Type":
          "multipart/form-data",
      },
    }
  );

  return response.data;
}

// =========================================================
// PRODUCT VARIANTS
// =========================================================

// GET VARIANTS

export async function getVariants(
  productId: number
) {
  const response = await api.get(
    `/products/${productId}/variants`
  );

  return response.data;
}

// =========================================================
// GET SINGLE VARIANT
// =========================================================

export async function getVariant(
  productId: number,
  variantId: number
) {
  const response = await api.get(
    `/products/${productId}/variants/${variantId}`
  );

  return response.data;
}

// =========================================================
// CREATE VARIANT
// =========================================================

export async function createVariant(
  productId: number,
  data: ProductVariantPayload
) {
  const response = await api.post(
    `/products/${productId}/variants`,
    data
  );

  return response.data;
}

// =========================================================
// UPDATE VARIANT
// =========================================================

export async function updateVariant(
  productId: number,
  variantId: number,
  data: ProductVariantPayload
) {
  const response = await api.put(
    `/products/${productId}/variants/${variantId}`,
    data
  );

  return response.data;
}

// =========================================================
// DELETE VARIANT
// =========================================================

export async function deleteVariant(
  productId: number,
  variantId: number
) {
  await api.delete(
    `/products/${productId}/variants/${variantId}`
  );

  return true;
}

// =========================================================
// DEFAULT EXPORT
// =========================================================

const productService = {
  // Products
  getAll,
  getById,
  getDetails,
  search,
  create,
  update,
  remove,

  // Images
  getImages,
  getImage,
  createImage,
  updateImage,
  deleteImage,
  uploadImage,

  // Variants
  getVariants,
  getVariant,
  createVariant,
  updateVariant,
  deleteVariant,
};

export default productService;