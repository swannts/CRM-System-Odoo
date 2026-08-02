import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { posService } from 'src/sections/pos/services/pos-service';
import { 
  PosProduct, 
  PosOrder, 
  PosContext, 
  PosCartItem, 
  PosCustomer 
} from 'src/sections/pos/types';

interface PosState {
  context: {
    data: PosContext | null;
    loading: boolean;
    error: string | null;
  };
  products: {
    data: PosProduct[];
    loading: boolean;
    error: string | null;
  };
  orders: {
    data: PosOrder[];
    loading: boolean;
    error: string | null;
  };
  cart: {
    id: string | null;
    items: PosCartItem[];
    loading: boolean;
    error: string | null;
  };
  customers: {
    data: PosCustomer[];
    loading: boolean;
    error: string | null;
    createLoading: boolean;
    createError: string | null;
  };
  checkout: {
    loading: boolean;
    error: string | null;
    receiptData: any | null;
  };
}

const initialState: PosState = {
  context: {
    data: null,
    loading: false,
    error: null,
  },
  products: {
    data: [],
    loading: false,
    error: null,
  },
  orders: {
    data: [],
    loading: false,
    error: null,
  },
  cart: {
    id: null,
    items: [],
    loading: false,
    error: null,
  },
  customers: {
    data: [],
    loading: false,
    error: null,
    createLoading: false,
    createError: null,
  },
  checkout: {
    loading: false,
    error: null,
    receiptData: null,
  },
};

// --- Thunks ---

export const fetchPosContext = createAsyncThunk(
  'pos/fetchContext',
  async (_, { rejectWithValue }) => {
    try {
      return await posService.getContext();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch POS context');
    }
  }
);

export const fetchPosProducts = createAsyncThunk(
  'pos/fetchProducts',
  async (query: string | undefined, { rejectWithValue }) => {
    try {
      return await posService.getProducts(query);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch products');
    }
  }
);

export const fetchPosOrders = createAsyncThunk(
  'pos/fetchOrders',
  async (_, { rejectWithValue }) => {
    try {
      return await posService.getOrders();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch orders');
    }
  }
);

export const initializeCart = createAsyncThunk(
  'pos/initializeCart',
  async (_, { rejectWithValue }) => {
    try {
      return await posService.createCart();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to initialize cart');
    }
  }
);

export const addProductToCart = createAsyncThunk(
  'pos/addToCart',
  async ({ cartId, productId, qty }: { cartId: string; productId: string; qty: number }, { rejectWithValue }) => {
    try {
      return await posService.addToCart(cartId, { productId, qty });
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add item to cart');
    }
  }
);

export const updateCartQuantity = createAsyncThunk(
  'pos/updateCartItem',
  async ({ cartId, lineId, qty }: { cartId: string; lineId: string; qty: number }, { rejectWithValue }) => {
    try {
      return await posService.updateCartItem(cartId, lineId, { qty });
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update item quantity');
    }
  }
);

export const removeProductFromCart = createAsyncThunk(
  'pos/removeCartItem',
  async ({ cartId, lineId }: { cartId: string; lineId: string }, { rejectWithValue }) => {
    try {
      return await posService.removeCartItem(cartId, lineId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to remove item from cart');
    }
  }
);

export const processCheckout = createAsyncThunk(
  'pos/checkout',
  async (data: any, { rejectWithValue }) => {
    try {
      return await posService.checkout(data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Checkout failed');
    }
  }
);

export const refundPosOrder = createAsyncThunk(
  'pos/refundOrder',
  async ({ id, reason, amount }: { id: string; reason: string; amount: number }, { rejectWithValue }) => {
    try {
      return await posService.refundOrder(id, { reason, amount });
    } catch (error: any) {
      return rejectWithValue(error.message || 'Refund failed');
    }
  }
);

export const searchPosCustomers = createAsyncThunk(
  'pos/searchCustomers',
  async (query: string | undefined, { rejectWithValue }) => {
    try {
      return await posService.getCustomers(query);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to search customers');
    }
  }
);

export const createPosCustomer = createAsyncThunk(
  'pos/createCustomer',
  async (data: { name: string; phone?: string; email?: string }, { rejectWithValue }) => {
    try {
      return await posService.createCustomer(data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create customer');
    }
  }
);

// --- Slice ---

const posSlice = createSlice({
  name: 'pos',
  initialState,
  reducers: {
    clearCheckoutState: (state) => {
      state.checkout.receiptData = null;
      state.checkout.error = null;
    },
    resetCart: (state) => {
      state.cart.id = null;
      state.cart.items = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Context
      .addCase(fetchPosContext.pending, (state) => {
        state.context.loading = true;
      })
      .addCase(fetchPosContext.fulfilled, (state, action) => {
        state.context.loading = false;
        state.context.data = action.payload;
      })
      .addCase(fetchPosContext.rejected, (state, action) => {
        state.context.loading = false;
        state.context.error = action.payload as string;
      })
      // Products
      .addCase(fetchPosProducts.pending, (state) => {
        state.products.loading = true;
      })
      .addCase(fetchPosProducts.fulfilled, (state, action) => {
        state.products.loading = false;
        state.products.data = action.payload;
      })
      .addCase(fetchPosProducts.rejected, (state, action) => {
        state.products.loading = false;
        state.products.error = action.payload as string;
      })
      // Orders
      .addCase(fetchPosOrders.pending, (state) => {
        state.orders.loading = true;
      })
      .addCase(fetchPosOrders.fulfilled, (state, action) => {
        state.orders.loading = false;
        state.orders.data = action.payload;
      })
      .addCase(fetchPosOrders.rejected, (state, action) => {
        state.orders.loading = false;
        state.orders.error = action.payload as string;
      })
      // Cart Initialization
      .addCase(initializeCart.pending, (state) => {
        state.cart.loading = true;
      })
      .addCase(initializeCart.fulfilled, (state, action) => {
        state.cart.loading = false;
        state.cart.id = String(action.payload.id);
        state.cart.items = []; // New cart is empty
      })
      .addCase(initializeCart.rejected, (state, action) => {
        state.cart.loading = false;
        state.cart.error = action.payload as string;
      })
      // Cart Mutations (Add/Update/Remove)
      .addCase(addProductToCart.fulfilled, (state, action) => {
        // payload should contain synchronized items or full cart
        const items = action.payload?.items || action.payload?.cart?.items || action.payload?.lines;
        if (Array.isArray(items)) {
           state.cart.items = items;
        }
      })
      .addCase(updateCartQuantity.fulfilled, (state, action) => {
        const items = action.payload?.items || action.payload?.cart?.items || action.payload?.lines;
        if (Array.isArray(items)) {
           state.cart.items = items;
        }
      })
      .addCase(removeProductFromCart.fulfilled, (state, action) => {
        const items = action.payload?.items || action.payload?.cart?.items || action.payload?.lines;
        if (Array.isArray(items)) {
           state.cart.items = items;
        }
      })
      // Checkout
      .addCase(processCheckout.pending, (state) => {
        state.checkout.loading = true;
      })
      .addCase(processCheckout.fulfilled, (state, action) => {
        state.checkout.loading = false;
        state.checkout.receiptData = action.payload.receiptData || action.payload;
        state.cart.id = null;
        state.cart.items = [];
      })
      .addCase(processCheckout.rejected, (state, action) => {
        state.checkout.loading = false;
        state.checkout.error = action.payload as string;
      })
      // Customers
      .addCase(searchPosCustomers.pending, (state) => {
        state.customers.loading = true;
        state.customers.error = null;
      })
      .addCase(searchPosCustomers.fulfilled, (state, action) => {
        state.customers.loading = false;
        state.customers.data = action.payload;
      })
      .addCase(searchPosCustomers.rejected, (state, action) => {
        state.customers.loading = false;
        state.customers.error = action.payload as string;
      })
      .addCase(createPosCustomer.pending, (state) => {
        state.customers.createLoading = true;
        state.customers.createError = null;
      })
      .addCase(createPosCustomer.fulfilled, (state, action) => {
        state.customers.createLoading = false;
        state.customers.data.unshift(action.payload);
      })
      .addCase(createPosCustomer.rejected, (state, action) => {
        state.customers.createLoading = false;
        state.customers.createError = action.payload as string;
      });
  },
});

export const { clearCheckoutState, resetCart } = posSlice.actions;
export const selectPos = (state: { pos: PosState }) => state.pos;
export default posSlice.reducer;
