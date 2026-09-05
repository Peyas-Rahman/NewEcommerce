export interface OrderItem {
  id: number;
  productId: number;
  productVariantId?: number | null;
  productName: string;
  variantName?: string | null;
  sku: string;
  unitPrice: number;
  discountAmount: number;
  quantity: number;
  totalPrice: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerId?: number | null;
  guestName?: string | null;
  guestPhone?: string | null;
  guestEmail?: string | null;

  subTotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  grandTotal: number;

  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;

  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity?: string | null;
  shippingArea?: string | null;
  shippingPostalCode?: string | null;

  customerNote?: string | null;
  createdAt: string;

  items: OrderItem[];
}
