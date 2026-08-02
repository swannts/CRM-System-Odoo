import { useMemo } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import {
  fetchCommerceProducts,
  fetchCommerceCategories,
  createMagentoProductThunk,
  updateMagentoProductThunk,
  deleteMagentoProductThunk,
  selectCommerce,
} from 'src/store/slices/commerce-slice';
import { commerceService } from 'src/services/commerce-service';
import type { ProductFormValues } from 'src/sections/commerce/view/commerce-workspace.types';

export function useMagentoProducts(params?: { orgId?: string; enabled?: boolean }) {
  const dispatch = useAppDispatch();
  const { products } = useAppSelector(selectCommerce);

  useMemo(() => {
    if (params?.enabled !== false) {
      dispatch(fetchCommerceProducts({ orgId: params?.orgId }));
    }
  }, [dispatch, params?.orgId, params?.enabled]);

  return {
    data: products.items,
    isLoading: products.loading,
    error: products.error,
  };
}

export function useMagentoCategories(params?: { orgId?: string; enabled?: boolean }) {
  const dispatch = useAppDispatch();
  const { categories } = useAppSelector(selectCommerce);

  useMemo(() => {
    if (params?.enabled !== false) {
      dispatch(fetchCommerceCategories(params?.orgId));
    }
  }, [dispatch, params?.orgId, params?.enabled]);

  return {
    data: categories.items,
    isLoading: categories.loading,
    error: categories.error,
  };
}

export function useMagentoCreateProduct(opts: { orgId: string }) {
  const dispatch = useAppDispatch();
  return {
    mutate: (values: ProductFormValues) =>
      dispatch(createMagentoProductThunk({ orgId: opts.orgId, data: values })),
  };
}

export function useMagentoUpdateProduct(opts: { orgId: string; sku: string }) {
  const dispatch = useAppDispatch();
  return {
    mutate: (values: ProductFormValues) =>
      dispatch(updateMagentoProductThunk({ orgId: opts.orgId, sku: opts.sku, data: values })),
  };
}

export function useMagentoDeleteProduct(opts: { orgId: string }) {
  const dispatch = useAppDispatch();
  return {
    mutate: (sku: string) =>
      dispatch(deleteMagentoProductThunk({ orgId: opts.orgId, sku })),
  };
}

export function useMagentoUploadProductImages() {
  return {
    mutate: async (files: File[]) =>
      Promise.all(files.map((file) => commerceService.uploadProductImage(file))),
  };
}
