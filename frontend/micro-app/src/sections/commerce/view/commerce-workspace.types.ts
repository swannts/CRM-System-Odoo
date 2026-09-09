import { z as zod } from 'zod';

export const PRODUCT_FORM_SCHEMA = zod.object({
  name: zod.string().min(1, 'Product name is required'),
  sku: zod.string().optional(),
  barcode: zod.string().optional(),
  categoryId: zod.string().optional(),
  categoryName: zod.string().optional(),
  description: zod.string().optional(),
  priceCents: zod.coerce.number().min(0, 'Price must be zero or greater'),
  compareAtPriceCents: zod.coerce.number().min(0).default(0),
  costCents: zod.coerce.number().min(0).default(0),
  lowStockThreshold: zod.coerce.number().min(0).default(5),
  inventorySourceCode: zod.string().default('default'),
  tagsText: zod.string().optional(),
  photos: zod.array(zod.string()).default([]),
  status: zod.enum(['draft', 'active', 'archived']).default('active'),
  variants: zod
    .array(
      zod.object({
        name: zod.string().min(1, 'Variant name is required'),
        sku: zod.string().optional(),
        priceCents: zod.coerce.number().min(0),
        stock: zod.coerce.number().min(0),
      })
    )
    .default([]),
  modifierGroups: zod
    .array(
      zod.object({
        name: zod.string().min(1, 'Group name is required'),
        minSelected: zod.coerce.number().min(0).default(0),
        maxSelected: zod.coerce.number().min(0).optional(),
        modifiers: zod.array(
          zod.object({
            name: zod.string().min(1, 'Modifier name is required'),
            priceCents: zod.coerce.number().min(0),
          })
        ),
      })
    )
    .default([]),
});

export const CATEGORY_FORM_SCHEMA = zod.object({
  name: zod.string().min(1, 'Category name is required'),
  description: zod.string().optional(),
  isActive: zod
    .union([zod.boolean(), zod.string()])
    .transform((value) => !(value === false || value === 'false'))
    .default(true),
});

export const COUPON_FORM_SCHEMA = zod.object({
  code: zod.string().min(1, 'Coupon code is required'),
  type: zod.enum(['percent', 'fixed']),
  value: zod.coerce.number().min(0),
  minOrderCents: zod.coerce.number().min(0).default(0),
  maxUsage: zod.union([zod.coerce.number().min(1), zod.literal(''), zod.undefined()]).optional(),
  expiresAt: zod.string().optional(),
  isActive: zod
    .union([zod.boolean(), zod.string()])
    .transform((value) => !(value === false || value === 'false'))
    .default(true),
});

export const SETTINGS_FORM_SCHEMA = zod.object({
  shopName: zod.string().min(1, 'Store name is required'),
  supportEmail: zod.string().email('Enter a valid support email'),
  supportPhone: zod.string().optional(),
  currency: zod.string().min(1, 'Currency is required'),
  taxRate: zod.coerce.number().min(0),
  checkoutNote: zod.string().optional(),
});

export const CHECKOUT_FORM_SCHEMA = zod.object({
  customerName: zod.string().min(1, 'Customer name is required'),
  email: zod.string().email('Enter a valid email'),
  phone: zod.string().optional(),
  line1: zod.string().min(1, 'Address line is required'),
  city: zod.string().min(1, 'City is required'),
  state: zod.string().min(1, 'State is required'),
  postalCode: zod.string().min(1, 'Postal code is required'),
  country: zod.string().min(1, 'Country is required'),
});

export type ProductFormValues = zod.infer<typeof PRODUCT_FORM_SCHEMA>;
export type CategoryFormValues = zod.infer<typeof CATEGORY_FORM_SCHEMA>;
export type CouponFormValues = zod.infer<typeof COUPON_FORM_SCHEMA>;
export type SettingsFormValues = zod.infer<typeof SETTINGS_FORM_SCHEMA>;
export type CheckoutFormValues = zod.infer<typeof CHECKOUT_FORM_SCHEMA>;

export type CartLine = {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  variantId?: string;
  variantName?: string;
};

export type LocalOrder = {
  id: string;
  source: 'local' | 'server';
  status: string;
  paymentStatus: string;
  totalAmountCents: number;
  createdAt: string;
  items: Array<{
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPriceCents: number;
  }>;
  shippingAddress?: Record<string, unknown>;
};

export type CommerceWorkspaceMode =
  | 'dashboard-shop'
  | 'dashboard-products'
  | 'dashboard-orders'
  | 'public-shop'
  | 'public-products'
  | 'public-memberships'
  | 'public-courses'
  | 'product-detail'
  | 'checkout'
  | 'order-payment'
  | 'shipping-payment'
  | 'receipt'
  | 'online-shop'
  | 'online-product'
  | 'online-orders'
  | 'categories'
  | 'coupons'
  | 'tables'
  | 'settings';

export type CommerceDashboardModule =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'coupons'
  | 'orders'
  | 'customers'
  | 'memberships'
  | 'pos'
  | 'kds'
  | 'cfd'
  | 'kiosk'
  | 'inventory'
  | 'designer'
  | 'tables'
  | 'settings';

export const COMMERCE_DASHBOARD_MODULES: { label: string; value: CommerceDashboardModule; icon: string }[] = [
  { label: 'Dashboard', value: 'dashboard', icon: 'solar:chart-square-bold' },
  { label: 'POS', value: 'pos', icon: 'solar:cash-out-bold' },
  { label: 'Products', value: 'products', icon: 'solar:box-bold' },
  { label: 'Inventory', value: 'inventory', icon: 'solar:archive-bold' },
  { label: 'Orders', value: 'orders', icon: 'solar:cart-large-bold' },
  { label: 'KDS', value: 'kds', icon: 'solar:clutter-bold' },
  { label: 'Customers', value: 'customers', icon: 'solar:users-group-rounded-bold' },
  { label: 'Memberships', value: 'memberships', icon: 'solar:medal-ribbon-bold' },
  { label: 'Categories', value: 'categories', icon: 'solar:layers-bold' },
  { label: 'Coupons', value: 'coupons', icon: 'solar:tag-bold' },
  { label: 'Tables', value: 'tables', icon: 'solar:tuning-square-2-bold' },
  { label: 'Settings', value: 'settings', icon: 'solar:settings-bold' },
];

export type CustomerSummary = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  orderCount: number;
  totalSpentCents: number;
  lastOrderAt: string;
};

export type CommerceWorkspaceProps = {
  mode?: CommerceWorkspaceMode;
  shopPath?: string;
  shopId?: string;
  contactId?: string;
  productId?: string;
  cartId?: string;
  orderId?: string;
  incomeId?: string;
  receiptId?: string;
  section?: string;
  type?: string;
};

export const DEFAULT_PRODUCT_FORM_VALUES: ProductFormValues = {
  name: '',
  sku: '',
  barcode: '',
  categoryId: '',
  categoryName: '',
  description: '',
  priceCents: 0,
  compareAtPriceCents: 0,
  costCents: 0,
  lowStockThreshold: 5,
  inventorySourceCode: 'default',
  tagsText: '',
  photos: [],
  status: 'active',
  variants: [],
  modifierGroups: [],
};

export const DEFAULT_SETTINGS: SettingsFormValues = {
  shopName: 'MyManager Store',
  supportEmail: 'support@example.com',
  supportPhone: '',
  currency: 'USD',
  taxRate: 0,
  checkoutNote: '',
};

export function resolveInitialModule(mode?: CommerceWorkspaceMode): CommerceDashboardModule {
  if (!mode) return 'dashboard';
  if (mode.includes('product')) return 'products';
  if (mode.includes('order')) return 'orders';
  if (mode === 'categories') return 'categories';
  if (mode === 'coupons') return 'coupons';
  if (mode === 'settings') return 'settings';
  if (mode === 'tables') return 'tables';
  return 'dashboard';
}
