export interface PosProduct {
  id: string;
  name: string;
  price: number;
  sku?: string;
  barcode?: string;
  image?: string;
  category?: string;
  stock?: number;
}

export interface PosCartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  qty: number;
}

export interface PosContext {
  paymentMethods: any[];
  taxRate: number;
  currency: string;
}

export interface PosOrder {
  id: string;
  ticketNo: string;
  totalAmount: number;
  orderStatus: string;
  createdAt: string;
  items?: PosCartItem[];
}

export interface PosCustomer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
}
