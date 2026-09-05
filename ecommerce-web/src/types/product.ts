export interface ProductImage {
  id: number;
  productId: number;
  imageUrl: string;
  altText?: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductVariant {
  id: number;
  productId: number;
  name: string;
  sku: string;
  price?: number | null;
  discountPrice?: number | null;
  trackInventory: boolean;
  isActive: boolean;
  sortOrder: number;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  sku: string;

  shortDescription?: string | null;
  description?: string | null;

  price: number;
  discountPrice?: number | null;
  effectivePrice?: number;
  discountPercentage?: number;

  warranty?: string | null;

  categoryId: number;
  categoryName: string;

  brandId?: number | null;
  brandName?: string | null;

  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isActive: boolean;
  sortOrder?: number;

  stock?: number;
  isInStock?: boolean;

  images: ProductImage[];
  variants: ProductVariant[];
}