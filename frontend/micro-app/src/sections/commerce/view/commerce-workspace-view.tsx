'use client';

import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { useBoolean } from 'src/hooks/use-boolean';

import { DashboardContent } from 'src/layouts/dashboard';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import {
  commerceService,
  type ICommerceCoupon,
  type ICommerceProduct,
  type ICommerceCategory,
} from 'src/services/commerce-service';
import {
  selectCommerce,
  fetchCommerceOrders,
  fetchCommerceProducts,
  fetchCommerceInventory,
  fetchCommerceCategories,
  fetchInventoryLocations,
  fetchCommerceCouponsThunk,
} from 'src/store/slices/commerce-slice';

import { toast } from 'src/components/snackbar';

import { useAuthContext } from 'src/auth/hooks';

import {
  readStorage,
  getBasePrice,
  cartStorageKey,
  normalizeOrder,
  settingsStorageKey,
} from './commerce-workspace.utils';
import {
  CommerceOrdersTable,
  CommerceSummaryCards,
  CommerceProductsTable,
  CommerceInventoryTable,
  CommerceCategoryDialog,
  CommerceCategoriesTable,
  CommerceProductFormCard,
  CommerceDashboardModules,
} from './commerce-workspace-sections';
import {
  type CartLine,
  type LocalOrder,
  DEFAULT_SETTINGS,
  COUPON_FORM_SCHEMA,
  PRODUCT_FORM_SCHEMA,
  CHECKOUT_FORM_SCHEMA,
  CATEGORY_FORM_SCHEMA,
  SETTINGS_FORM_SCHEMA,
  resolveInitialModule,
  type CouponFormValues,
  type ProductFormValues,
  type CategoryFormValues,
  type CheckoutFormValues,
  type SettingsFormValues,
  COMMERCE_DASHBOARD_MODULES,
  DEFAULT_PRODUCT_FORM_VALUES,
  type CommerceWorkspaceProps,
  type CommerceDashboardModule,
} from './commerce-workspace.types';

export function CommerceWorkspaceView({
  mode = 'dashboard-shop',
  shopPath,
  shopId,
  contactId: _contactId,
  productId,
  cartId: _cartId,
  orderId: _orderId,
  receiptId: _receiptId,
  section,
  type: _type,
}: CommerceWorkspaceProps) {
  const capabilities = {
    bulkProductStatusUpdate: false,
    coupons: false,
    memberships: false,
    designer: false,
  } as const;

  const router = useRouter();
  const { user, authenticated } = useAuthContext();

  const isStorefrontMode =
    mode === 'public-shop' ||
    mode === 'online-shop' ||
    mode === 'product-detail' ||
    mode === 'online-product' ||
    mode === 'checkout' ||
    mode === 'order-payment' ||
    mode === 'receipt' ||
    mode === 'public-products' ||
    mode === 'public-memberships' ||
    mode === 'public-courses' ||
    mode === 'online-orders';

  const resolvedOrgId =
    (user as any)?.org_id || (user as any)?.orgId || (user as any)?.organizationId || '';
  const queryShopKey = shopId || shopPath || resolvedOrgId;
  const resolvedShopKey = queryShopKey || 'shop';
  const isKnownSection = section
    ? COMMERCE_DASHBOARD_MODULES.some((module) => module.value === section)
    : false;
  const currentModule: CommerceDashboardModule =
    isKnownSection
      ? (section as CommerceDashboardModule)
      : resolveInitialModule(mode);
  const handleModuleChange = useCallback(
    (nextModule: CommerceDashboardModule) => {
      router.push(paths.dashboard.shopSection(nextModule));
    },
    [router]
  );
  const enabledDashboardModules = useMemo(
    () =>
      COMMERCE_DASHBOARD_MODULES.filter((moduleItem) => {
        if (moduleItem.value === 'coupons' && !capabilities.coupons) return false;
        if (moduleItem.value === 'memberships' && !capabilities.memberships) return false;
        if (moduleItem.value === 'designer' && !capabilities.designer) return false;
        return true;
      }),
    [capabilities.coupons, capabilities.designer, capabilities.memberships]
  );

  const [search, _setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [productCategoryFilter, _setProductCategoryFilter] = useState('all');
  const [productStatusFilter, _setProductStatusFilter] = useState('all');
  const [productPage, _setProductPage] = useState(0);
  const [productRowsPerPage, _setProductRowsPerPage] = useState(20);
  const [_selectedProductIds, _setSelectedProductIds] = useState<string[]>([]);
  const [_deleteTargetIds, _setDeleteTargetIds] = useState<string[]>([]);
  const [categorySearch, _setCategorySearch] = useState('');
  const [couponSearch, _setCouponSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [inventorySearch, _setInventorySearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [_editingCouponId, _setEditingCouponId] = useState<string | null>(null);
  const [appliedCouponCode, _setAppliedCouponCode] = useState('');
  const [cartItems, setCartItems] = useState<CartLine[]>([]);

  const categoryDialog = useBoolean();
  const _couponDialog = useBoolean();
  const productDialog = useBoolean();

  const productMethods = useForm<ProductFormValues>({
    resolver: zodResolver(PRODUCT_FORM_SCHEMA),
    defaultValues: DEFAULT_PRODUCT_FORM_VALUES,
  });

  const categoryMethods = useForm<CategoryFormValues>({
    resolver: zodResolver(CATEGORY_FORM_SCHEMA),
    defaultValues: { name: '', description: '', isActive: true },
  });

  const _couponMethods = useForm<CouponFormValues>({
    resolver: zodResolver(COUPON_FORM_SCHEMA),
    defaultValues: { code: '', type: 'percent', value: 0, minOrderCents: 0, maxUsage: '', expiresAt: '', isActive: true },
  });

  const settingsMethods = useForm<SettingsFormValues>({
    resolver: zodResolver(SETTINGS_FORM_SCHEMA),
    defaultValues: DEFAULT_SETTINGS,
  });

  const _checkoutMethods = useForm<CheckoutFormValues>({
    resolver: zodResolver(CHECKOUT_FORM_SCHEMA),
    defaultValues: {
      customerName: '',
      email: '',
      phone: '',
      line1: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'US',
    },
  });

  const _control = productMethods.control;

  useEffect(() => {
    setCartItems(readStorage<CartLine[]>(cartStorageKey(resolvedShopKey), []));
    settingsMethods.reset(readStorage<SettingsFormValues>(settingsStorageKey(resolvedShopKey), DEFAULT_SETTINGS));
  }, [resolvedShopKey, settingsMethods]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const dispatch = useAppDispatch();
  const commerceState = useAppSelector(selectCommerce);

  const loadProducts = useCallback(() => {
    if (queryShopKey && !isStorefrontMode) {
      dispatch(fetchCommerceProducts({
        orgId: queryShopKey as string,
        params: { currentPage: productPage + 1, pageSize: productRowsPerPage, search: debouncedSearch }
      }));
    }
  }, [dispatch, queryShopKey, isStorefrontMode, productPage, productRowsPerPage, debouncedSearch]);

  const loadInventory = useCallback(() => {
    if (resolvedShopKey && !isStorefrontMode && currentModule === 'inventory') {
      dispatch(fetchCommerceInventory({
        orgId: resolvedShopKey,
        params: { currentPage: productPage + 1, pageSize: productRowsPerPage, search: inventorySearch.trim() }
      }));
      dispatch(fetchInventoryLocations({
        orgId: resolvedShopKey,
        params: { currentPage: 1, pageSize: 300 }
      }));
    }
  }, [dispatch, resolvedShopKey, isStorefrontMode, currentModule, productPage, productRowsPerPage, inventorySearch]);

  const loadBasicData = useCallback(() => {
    if (authenticated && !isStorefrontMode) {
      dispatch(fetchCommerceOrders(resolvedOrgId));
      dispatch(fetchCommerceCategories(resolvedShopKey));
      dispatch(fetchCommerceCouponsThunk(resolvedShopKey));
    }
  }, [dispatch, authenticated, isStorefrontMode, resolvedOrgId, resolvedShopKey]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  useEffect(() => {
    loadBasicData();
  }, [loadBasicData]);

  // Compatibility objects for existing UI components
  const adminProductsQuery = {
    data: commerceState.products,
    isLoading: commerceState.products.loading,
    refetch: loadProducts
  };

  const inventoryQuery = {
    data: commerceState.inventory,
    isLoading: commerceState.inventory.loading,
    refetch: loadInventory
  };

  const ordersQuery = {
    data: commerceState.orders.items,
    isLoading: commerceState.orders.loading,
    refetch: () => dispatch(fetchCommerceOrders(resolvedOrgId))
  };

  const categoriesQuery = {
    data: commerceState.categories.items,
    isLoading: commerceState.categories.loading,
    refetch: () => dispatch(fetchCommerceCategories(resolvedShopKey))
  };

  const couponsQuery = {
    data: commerceState.coupons.items,
    isLoading: commerceState.coupons.loading,
    refetch: () => dispatch(fetchCommerceCouponsThunk(resolvedShopKey))
  };

  const refreshOrders = useCallback(() => {
    dispatch(fetchCommerceOrders(resolvedOrgId));
  }, [dispatch, resolvedOrgId]);

  // Mutations refactored to async/await with Redux refresh
  const handleCreateProduct = async (values: ProductFormValues) => {
    try {
      await commerceService.createProduct(resolvedShopKey, values);
      loadProducts();
      productMethods.reset(DEFAULT_PRODUCT_FORM_VALUES);
      setEditingId(null);
      productDialog.onFalse();
      toast.success('Product created successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create product');
    }
  };

  const handleUpdateProduct = async (values: ProductFormValues) => {
    try {
      await commerceService.updateProduct(resolvedShopKey, editingId!, values);
      loadProducts();
      setEditingId(null);
      productMethods.reset(DEFAULT_PRODUCT_FORM_VALUES);
      productDialog.onFalse();
      toast.success('Product updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update product');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await commerceService.deleteProduct(resolvedShopKey, id);
      loadProducts();
      toast.success('Product deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete product');
    }
  };

  const handleCreateCategory = async (values: CategoryFormValues) => {
    try {
      await commerceService.createCategory(resolvedShopKey, values);
      dispatch(fetchCommerceCategories(resolvedShopKey));
      categoryDialog.onFalse();
      categoryMethods.reset({ name: '', description: '', isActive: true });
      toast.success('Category added');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add category');
    }
  };

  const handleUpdateCategory = async (values: CategoryFormValues) => {
    try {
      await commerceService.updateCategory(resolvedShopKey, editingCategoryId!, values);
      dispatch(fetchCommerceCategories(resolvedShopKey));
      loadProducts();
      setEditingCategoryId(null);
      categoryDialog.onFalse();
      categoryMethods.reset({ name: '', description: '', isActive: true });
      toast.success('Category updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await commerceService.deleteCategory(resolvedShopKey, id);
      dispatch(fetchCommerceCategories(resolvedShopKey));
      toast.success('Category removed');
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove category');
    }
  };

  const handleViewOrder = useCallback(
    (id: string) => {
      router.push(paths.public.orderPayment(id));
    },
    [router]
  );

  const handleMarkOrderProcessing = useCallback(
    async (id: string) => {
      try {
        await commerceService.updateOrder(resolvedOrgId, id, { status: 'processing' });
        refreshOrders();
        toast.success('Order marked as processing');
      } catch (err: any) {
        toast.error(err.message || 'Failed to update order');
      }
    },
    [refreshOrders, resolvedOrgId]
  );

  const handleMarkOrderCompleted = useCallback(
    async (id: string) => {
      try {
        await commerceService.updateOrder(resolvedOrgId, id, { status: 'completed', paymentStatus: 'paid' });
        refreshOrders();
        toast.success('Order marked as completed');
      } catch (err: any) {
        toast.error(err.message || 'Failed to update order');
      }
    },
    [refreshOrders, resolvedOrgId]
  );

  const products = useMemo<ICommerceProduct[]>(
    () => {
      const source = isStorefrontMode ? [] : adminProductsQuery.data?.items;
      return Array.isArray(source) ? source : [];
    },
    [adminProductsQuery.data?.items, isStorefrontMode]
  );

  const categories = useMemo<ICommerceCategory[]>(
    () => (Array.isArray(categoriesQuery.data) ? categoriesQuery.data : []),
    [categoriesQuery.data]
  );

  const catalogCategories = useMemo(
    () =>
      categories.map((category) => {
        const matchingProducts = products.filter((product) => {
          if (product.categoryId) return product.categoryId === category.id;
          return product.categoryName?.toLowerCase() === category.name.toLowerCase();
        });

        return {
          ...category,
          productCount: matchingProducts.length,
          activeProductCount: matchingProducts.filter((product) => product.status === 'active').length,
        };
      }),
    [categories, products]
  );

  const orders = useMemo<LocalOrder[]>(
    () => (Array.isArray(ordersQuery.data) ? ordersQuery.data.map(normalizeOrder) : []),
    [ordersQuery.data]
  );

  const mergedOrders = useMemo(
    () => [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [orders]
  );

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const description = product.description?.toLowerCase() || '';
      const sku = product.sku?.toLowerCase() || '';
      const categoryName = product.categoryName?.toLowerCase() || '';
      const tags = product.tags?.join(' ').toLowerCase() || '';
      const matchesQuery =
        !query ||
        product.name.toLowerCase().includes(query) ||
        description.includes(query) ||
        sku.includes(query) ||
        categoryName.includes(query) ||
        tags.includes(query);

      const matchesCategory =
        productCategoryFilter === 'all' ||
        product.categoryId === productCategoryFilter ||
        (!product.categoryId &&
          catalogCategories.find((category) => category.id === productCategoryFilter)?.name.toLowerCase() ===
            categoryName);
      const normalizedStatus = String(product.status || 'draft').toLowerCase();
      const matchesStatus = productStatusFilter === 'all' || normalizedStatus === productStatusFilter;

      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [catalogCategories, productCategoryFilter, productStatusFilter, products, search]);

  const filteredCategories = useMemo(() => {
    const query = categorySearch.trim().toLowerCase();
    if (!query) return catalogCategories;

    return catalogCategories.filter((category) => {
      const description = category.description?.toLowerCase() || '';
      return category.name.toLowerCase().includes(query) || description.includes(query);
    });
  }, [catalogCategories, categorySearch]);

  const _filteredCoupons = useMemo(() => {
    const coupons = Array.isArray(couponsQuery.data) ? (couponsQuery.data as ICommerceCoupon[]) : [];
    const query = couponSearch.trim().toLowerCase();
    if (!query) return coupons;

    return coupons.filter((coupon) => {
      const status = coupon.isActive ? 'active' : 'inactive';
      return (
        coupon.code.toLowerCase().includes(query) ||
        coupon.type.toLowerCase().includes(query) ||
        status.includes(query)
      );
    });
  }, [couponSearch, couponsQuery.data]);

  const _selectedProduct = useMemo(
    () =>
      filteredProducts.find((product) => product.id === productId) ||
      products.find((product) => product.id === productId),
    [filteredProducts, productId, products]
  );

  const cartSubtotalCents = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0),
    [cartItems]
  );

  const activeCoupon = useMemo(() => {
    const coupons = Array.isArray(couponsQuery.data) ? (couponsQuery.data as ICommerceCoupon[]) : [];
    const coupon = coupons.find((item) => item.code?.toLowerCase() === appliedCouponCode.trim().toLowerCase());

    if (!coupon || !coupon.isActive) return null;
    if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) return null;
    if (coupon.minOrderCents > cartSubtotalCents) return null;
    if (typeof coupon.maxUsage === 'number' && coupon.usedCount >= coupon.maxUsage) return null;

    return coupon;
  }, [appliedCouponCode, cartSubtotalCents, couponsQuery.data]);

  const discountCents = useMemo(() => {
    if (!activeCoupon) return 0;
    if (activeCoupon.type === 'percent') {
      return Math.round(cartSubtotalCents * ((activeCoupon.value || 0) / 100));
    }
    return Math.min(cartSubtotalCents, activeCoupon.value || 0);
  }, [activeCoupon, cartSubtotalCents]);

  const _cartTotalCents = Math.max(0, cartSubtotalCents - discountCents);

  const normalizedOrderSearch = orderSearch.trim().toLowerCase();
  const filteredOrders = useMemo(
    () =>
      mergedOrders.filter((item) => {
        const customerName = String((item.shippingAddress as any)?.customerName || '').toLowerCase();
        const matchesSearch =
          !normalizedOrderSearch ||
          item.id.toLowerCase().includes(normalizedOrderSearch) ||
          item.items.some((line) => String(line.productName || '').toLowerCase().includes(normalizedOrderSearch)) ||
          customerName.includes(normalizedOrderSearch);

        const matchesStatus =
          orderStatusFilter === 'all' ||
          item.status === orderStatusFilter ||
          item.paymentStatus === orderStatusFilter;

        return matchesSearch && matchesStatus;
      }),
    [mergedOrders, normalizedOrderSearch, orderStatusFilter]
  );

  const isLoading = commerceState.products.loading || commerceState.categories.loading || commerceState.orders.loading;

  if (isLoading && !products.length) {
    return (
      <Box sx={{ p: 5, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <DashboardContent maxWidth="xl">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 5 }}>
        <Box>
          <Typography variant="h4">Commerce</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Manage products, categories, orders, and storefront settings.
          </Typography>
        </Box>
      </Stack>

      <CommerceDashboardModules
        currentModule={currentModule}
        onModuleChange={handleModuleChange}
        modules={enabledDashboardModules}
      />

      {currentModule === 'dashboard' && (
        <Stack spacing={4}>
           <CommerceSummaryCards orders={mergedOrders} products={products} cartItems={cartItems} />

           <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                 <Card sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 3 }}>Recent Orders</Typography>
                    <CommerceOrdersTable
                      orders={filteredOrders.slice(0, 5)}
                      search={orderSearch}
                      statusFilter={orderStatusFilter}
                      onSearchChange={setOrderSearch}
                      onStatusFilterChange={setOrderStatusFilter}
                      onView={handleViewOrder}
                      onPay={handleViewOrder}
                      onMarkProcessing={handleMarkOrderProcessing}
                      onMarkCompleted={handleMarkOrderCompleted}
                    />
                 </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                 <Card sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 3 }}>Top Products</Typography>
                    <Stack spacing={2}>
                       {filteredProducts.slice(0, 5).map((product) => (
                         <Box key={product.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box
                              component="img"
                              src={product.photos?.[0] || '/assets/placeholder.png'}
                              sx={{ width: 48, height: 48, borderRadius: 1, objectFit: 'cover' }}
                            />
                            <Box sx={{ flexGrow: 1 }}>
                               <Typography variant="subtitle2">{product.name}</Typography>
                               <Typography variant="caption" color="text.secondary">{product.sku}</Typography>
                            </Box>
                            <Typography variant="subtitle2">${(getBasePrice(product) / 100).toFixed(2)}</Typography>
                         </Box>
                       ))}
                    </Stack>
                 </Card>
              </Grid>
           </Grid>
        </Stack>
      )}

      {currentModule === 'products' && (
        <Stack spacing={3}>
           <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={() => {
                  setEditingId(null);
                  productMethods.reset(DEFAULT_PRODUCT_FORM_VALUES);
                  productDialog.onTrue();
                }}
              >
                New Product
              </Button>
           </Stack>
           <CommerceProductsTable
             products={filteredProducts}
             onEdit={(id) => {
               setEditingId(id);
               const prod = products.find(p => p.id === id);
               if (prod) productMethods.reset(prod as any);
               productDialog.onTrue();
             }}
             onDelete={handleDeleteProduct}
           />
        </Stack>
      )}

      {currentModule === 'categories' && (
        <Stack spacing={3}>
           <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="contained"
                startIcon={<Iconify icon="mingcute:add-line" />}
                onClick={() => {
                  setEditingCategoryId(null);
                  categoryMethods.reset({ name: '', description: '', isActive: true });
                  categoryDialog.onTrue();
                }}
              >
                New Category
              </Button>
           </Stack>
           <CommerceCategoriesTable
             categories={filteredCategories}
             onEdit={(id) => {
               setEditingCategoryId(id);
               const cat = categories.find(c => c.id === id);
               if (cat) categoryMethods.reset(cat);
               categoryDialog.onTrue();
             }}
             onDelete={handleDeleteCategory}
           />
        </Stack>
      )}

      {currentModule === 'orders' && (
        <CommerceOrdersTable
          orders={filteredOrders}
          search={orderSearch}
          statusFilter={orderStatusFilter}
          onSearchChange={setOrderSearch}
          onStatusFilterChange={setOrderStatusFilter}
          onView={handleViewOrder}
          onPay={handleViewOrder}
          onMarkProcessing={handleMarkOrderProcessing}
          onMarkCompleted={handleMarkOrderCompleted}
        />
      )}

      {currentModule === 'inventory' && (
        <CommerceInventoryTable
          inventory={inventoryQuery.data?.items || []}
        />
      )}

      <CommerceCategoryDialog
        open={categoryDialog.value}
        onClose={categoryDialog.onFalse}
        methods={categoryMethods}
        isEdit={!!editingCategoryId}
        onSubmit={editingCategoryId ? handleUpdateCategory : handleCreateCategory}
      />

      <Dialog open={productDialog.value} onClose={productDialog.onFalse} fullWidth maxWidth="md">
         <DialogTitle>{editingId ? 'Edit Product' : 'New Product'}</DialogTitle>
         <DialogContent>
            <CommerceProductFormCard methods={productMethods} />
         </DialogContent>
         <DialogActions>
            <Button onClick={productDialog.onFalse}>Cancel</Button>
            <Button variant="contained" onClick={productMethods.handleSubmit(editingId ? handleUpdateProduct : handleCreateProduct)}>
               {editingId ? 'Update' : 'Create'}
            </Button>
         </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}

function Iconify({ icon, width = 20, sx }: any) {
    return <Box component="span" className="iconify" data-icon={icon} sx={{ width, height: width, ...sx }} />;
}
