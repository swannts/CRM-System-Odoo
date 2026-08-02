import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  connectMagento,
  getMagentoOrders,
  getMagentoStores,
  disconnectMagento,
  syncMagentoOrders,
  getMagentoProducts,
  getMagentoCustomers,
  syncMagentoCustomers,
  getMagentoConnection,
  getMagentoDownstreamHealth,
} from 'src/services/magento-service';
import { RootState } from '../index';

interface ListState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  total: number;
}

const initialListState = {
  data: [],
  loading: false,
  error: null,
  total: 0,
};

export interface MagentoState {
  connection: {
    data: any | null;
    loading: boolean;
    error: string | null;
  };
  stores: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  products: ListState<any>;
  orders: ListState<any>;
  customers: ListState<any>;
  health: {
    data: any | null;
    loading: boolean;
    error: string | null;
  };
}

const initialState: MagentoState = {
  connection: {
    data: null,
    loading: false,
    error: null,
  },
  stores: {
    data: [],
    loading: false,
    error: null,
  },
  products: initialListState,
  orders: initialListState,
  customers: initialListState,
  health: {
    data: null,
    loading: false,
    error: null,
  },
};

// Thunks
export const fetchMagentoConnection = createAsyncThunk('magento/fetchConnection', async (_, { rejectWithValue }) => {
  try {
    return await getMagentoConnection();
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch connection');
  }
});

export const fetchMagentoStores = createAsyncThunk('magento/fetchStores', async (_, { rejectWithValue }) => {
  try {
    return await getMagentoStores();
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch stores');
  }
});

export const fetchMagentoProducts = createAsyncThunk('magento/fetchProducts', async (params: any, { rejectWithValue }) => {
  try {
    return await getMagentoProducts(params);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch products');
  }
});

export const fetchMagentoOrders = createAsyncThunk('magento/fetchOrders', async (params: any, { rejectWithValue }) => {
  try {
    return await getMagentoOrders(params);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch orders');
  }
});

export const fetchMagentoCustomers = createAsyncThunk('magento/fetchCustomers', async (params: any, { rejectWithValue }) => {
  try {
    return await getMagentoCustomers(params);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch customers');
  }
});

export const fetchMagentoDownstreamHealth = createAsyncThunk('magento/fetchHealth', async (_, { rejectWithValue }) => {
  try {
    return await getMagentoDownstreamHealth();
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch health');
  }
});

export const connectMagentoThunk = createAsyncThunk(
  'magento/connect',
  async (input: any, { dispatch, rejectWithValue }) => {
    try {
      const response = await connectMagento(input);
      dispatch(fetchMagentoConnection());
      dispatch(fetchMagentoStores());
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to connect Magento');
    }
  }
);

export const disconnectMagentoThunk = createAsyncThunk(
  'magento/disconnect',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await disconnectMagento();
      dispatch(fetchMagentoConnection());
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to disconnect Magento');
    }
  }
);

export const syncMagentoCustomersThunk = createAsyncThunk(
  'magento/syncCustomers',
  async (options: any, { dispatch, rejectWithValue }) => {
    try {
      const response = await syncMagentoCustomers({ dryRun: true, ...options });
      dispatch(fetchMagentoCustomers({}));
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to sync customers');
    }
  }
);

export const syncMagentoOrdersThunk = createAsyncThunk(
  'magento/syncOrders',
  async (options: any, { dispatch, rejectWithValue }) => {
    try {
      const response = await syncMagentoOrders({ dryRun: true, ...options });
      dispatch(fetchMagentoOrders({}));
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to sync orders');
    }
  }
);

const magentoSlice = createSlice({
  name: 'magento',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    const handleList = (builder: any, thunk: any, key: keyof MagentoState) => {
      builder
        .addCase(thunk.pending, (state: any) => {
          state[key].loading = true;
          state[key].error = null;
        })
        .addCase(thunk.fulfilled, (state: any, action: any) => {
          state[key].data = action.payload.data || action.payload;
          state[key].total = action.payload.total || 0;
          state[key].loading = false;
        })
        .addCase(thunk.rejected, (state: any, action: any) => {
          state[key].loading = false;
          state[key].error = action.payload;
        });
    };

    builder
      .addCase(fetchMagentoConnection.pending, (state) => {
        state.connection.loading = true;
      })
      .addCase(fetchMagentoConnection.fulfilled, (state, action) => {
        state.connection.data = action.payload;
        state.connection.loading = false;
      })
      .addCase(fetchMagentoConnection.rejected, (state, action) => {
        state.connection.loading = false;
        state.connection.error = action.payload as string;
      })
      .addCase(fetchMagentoDownstreamHealth.pending, (state) => {
        state.health.loading = true;
      })
      .addCase(fetchMagentoDownstreamHealth.fulfilled, (state, action) => {
        state.health.data = action.payload;
        state.health.loading = false;
      })
      .addCase(fetchMagentoDownstreamHealth.rejected, (state, action) => {
        state.health.loading = false;
        state.health.error = action.payload as string;
      });

    handleList(builder, fetchMagentoStores, 'stores');
    handleList(builder, fetchMagentoProducts, 'products');
    handleList(builder, fetchMagentoOrders, 'orders');
    handleList(builder, fetchMagentoCustomers, 'customers');
  },
});

export default magentoSlice.reducer;

export const selectMagento = (state: RootState) => state.magento;
