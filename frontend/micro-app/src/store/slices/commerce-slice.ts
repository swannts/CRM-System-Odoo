import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { commerceService, ICommerceProduct, ICommerceCategory, ICommerceInventoryItem, ICommerceOrder } from 'src/services/commerce-service';
import { RootState } from '../index';

interface ListState<T> {
  items: T[];
  total: number;
  loading: boolean;
  error: string | null;
}

const initialListState = {
  items: [],
  total: 0,
  loading: false,
  error: null,
};

export interface CommerceState {
  products: ListState<ICommerceProduct>;
  categories: ListState<ICommerceCategory>;
  inventory: ListState<ICommerceInventoryItem>;
  orders: ListState<ICommerceOrder>;
  coupons: ListState<ICommerceCoupon>;
}

const initialState: CommerceState = {
  products: initialListState,
  categories: initialListState,
  inventory: initialListState,
  orders: initialListState,
  coupons: initialListState,
};

// Thunks
export const fetchCommerceProducts = createAsyncThunk(
  'commerce/fetchProducts',
  async ({ orgId, params }: { orgId?: string; params?: any }, { rejectWithValue }) => {
    try {
      return await commerceService.getProductsPage(orgId, params);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch products');
    }
  }
);

export const fetchCommerceCategories = createAsyncThunk(
  'commerce/fetchCategories',
  async (orgId?: string, { rejectWithValue }) => {
    try {
      return await commerceService.getCategories(orgId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch categories');
    }
  }
);

export const fetchCommerceInventory = createAsyncThunk(
  'commerce/fetchInventory',
  async ({ orgId, params }: { orgId?: string; params?: any }, { rejectWithValue }) => {
    try {
      return await commerceService.getInventoryPage(orgId, params);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch inventory');
    }
  }
);

export const fetchCommerceOrders = createAsyncThunk(
  'commerce/fetchOrders',
  async (orgId?: string, { rejectWithValue }) => {
    try {
      return await commerceService.getOrders(orgId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch orders');
    }
  }
);

export const fetchInventoryLocations = createAsyncThunk(
  'commerce/fetchInventoryLocations',
  async ({ orgId, params }: { orgId?: string; params?: any }, { rejectWithValue }) => {
    try {
      return await commerceService.getInventoryLocations(orgId, params);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch inventory locations');
    }
  }
);

export const fetchCommerceCouponsThunk = createAsyncThunk(
  'commerce/fetchCoupons',
  async (orgId?: string, { rejectWithValue }) => {
    try {
      return await commerceService.getCoupons(orgId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch coupons');
    }
  }
);

export const createMagentoProductThunk = createAsyncThunk(
  'commerce/createProduct',
  async ({ orgId, data }: { orgId: string; data: any }, { dispatch, rejectWithValue }) => {
    try {
      const response = await commerceService.createProduct(orgId, data);
      dispatch(fetchCommerceProducts({ orgId }));
      dispatch(fetchCommerceCategories(orgId));
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create product');
    }
  }
);

export const updateMagentoProductThunk = createAsyncThunk(
  'commerce/updateProduct',
  async ({ orgId, sku, data }: { orgId: string; sku: string; data: any }, { dispatch, rejectWithValue }) => {
    try {
      const response = await commerceService.updateProduct(orgId, sku, data);
      dispatch(fetchCommerceProducts({ orgId }));
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update product');
    }
  }
);

export const deleteMagentoProductThunk = createAsyncThunk(
  'commerce/deleteProduct',
  async ({ orgId, sku }: { orgId: string; sku: string }, { dispatch, rejectWithValue }) => {
    try {
      const response = await commerceService.deleteProduct(orgId, sku);
      dispatch(fetchCommerceProducts({ orgId }));
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete product');
    }
  }
);

const commerceSlice = createSlice({
  name: 'commerce',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCommerceProducts.pending, (state) => {
        state.products.loading = true;
      })
      .addCase(fetchCommerceProducts.fulfilled, (state, action) => {
        state.products.items = action.payload.items;
        state.products.total = action.payload.total;
        state.products.loading = false;
      })
      .addCase(fetchCommerceProducts.rejected, (state, action) => {
        state.products.loading = false;
        state.products.error = action.payload as string;
      });

    builder
      .addCase(fetchCommerceCategories.pending, (state) => {
        state.categories.loading = true;
      })
      .addCase(fetchCommerceCategories.fulfilled, (state, action) => {
        state.categories.items = action.payload;
        state.categories.total = action.payload.length;
        state.categories.loading = false;
      })
      .addCase(fetchCommerceCategories.rejected, (state, action) => {
        state.categories.loading = false;
        state.categories.error = action.payload as string;
      });

    builder
      .addCase(fetchCommerceInventory.pending, (state) => {
        state.inventory.loading = true;
      })
      .addCase(fetchCommerceInventory.fulfilled, (state, action) => {
        state.inventory.items = action.payload.items;
        state.inventory.total = action.payload.total;
        state.inventory.loading = false;
      })
      .addCase(fetchCommerceInventory.rejected, (state, action) => {
        state.inventory.loading = false;
        state.inventory.error = action.payload as string;
      });

    builder
      .addCase(fetchCommerceOrders.pending, (state) => {
        state.orders.loading = true;
      })
      .addCase(fetchCommerceOrders.fulfilled, (state, action) => {
        state.orders.items = action.payload;
        state.orders.total = action.payload.length;
        state.orders.loading = false;
      })
      .addCase(fetchCommerceOrders.rejected, (state, action) => {
        state.orders.loading = false;
        state.orders.error = action.payload as string;
      });

    builder
      .addCase(fetchInventoryLocations.pending, (state) => {
        state.inventory.loading = true;
      })
      .addCase(fetchInventoryLocations.fulfilled, (state, action) => {
        state.inventory.loading = false;
      })
      .addCase(fetchInventoryLocations.rejected, (state, action) => {
        state.inventory.loading = false;
        state.inventory.error = action.payload as string;
      })
      .addCase(fetchCommerceCouponsThunk.pending, (state) => {
        state.coupons.loading = true;
      })
      .addCase(fetchCommerceCouponsThunk.fulfilled, (state, action) => {
        state.coupons.items = action.payload;
        state.coupons.total = action.payload.length;
        state.coupons.loading = false;
      })
      .addCase(fetchCommerceCouponsThunk.rejected, (state, action) => {
        state.coupons.loading = false;
        state.coupons.error = action.payload as string;
      });
  },
});

export default commerceSlice.reducer;

export const selectCommerce = (state: RootState) => state.commerce;
