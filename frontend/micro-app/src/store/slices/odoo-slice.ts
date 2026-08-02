import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  connectOdoo,
  getOdooLeads,
  disconnectOdoo,
  getOdooContacts,
  getOdooInvoices,
  getOdooProducts,
  getOdooCompanies,
  getOdooInventory,
  getOdooConnection,
  getOdooSalesOrders,
  getOdooOpportunities,
  syncMagentoAllToOdoo,
  syncMagentoOrdersToOdoo,
  syncMagentoCustomersToOdoo,
} from 'src/services/odoo-service';
import { OdooListParams } from 'src/types/odoo';
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

export interface OdooState {
  connection: {
    data: any | null;
    loading: boolean;
    error: string | null;
  };
  contacts: ListState<any>;
  companies: ListState<any>;
  leads: ListState<any>;
  opportunities: ListState<any>;
  salesOrders: ListState<any>;
  invoices: ListState<any>;
  products: ListState<any>;
  inventory: ListState<any>;
}

const initialState: OdooState = {
  connection: {
    data: null,
    loading: false,
    error: null,
  },
  contacts: initialListState,
  companies: initialListState,
  leads: initialListState,
  opportunities: initialListState,
  salesOrders: initialListState,
  invoices: initialListState,
  products: initialListState,
  inventory: initialListState,
};

// Thunks
export const fetchOdooConnection = createAsyncThunk('odoo/fetchConnection', async (_, { rejectWithValue }) => {
  try {
    return await getOdooConnection();
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch connection');
  }
});

export const fetchContacts = createAsyncThunk('odoo/fetchContacts', async (params: OdooListParams | undefined, { rejectWithValue }) => {
  try {
    return await getOdooContacts(params);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch contacts');
  }
});

export const fetchCompanies = createAsyncThunk('odoo/fetchCompanies', async (params: OdooListParams | undefined, { rejectWithValue }) => {
  try {
    return await getOdooCompanies(params);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch companies');
  }
});

export const fetchLeads = createAsyncThunk('odoo/fetchLeads', async (params: OdooListParams | undefined, { rejectWithValue }) => {
  try {
    return await getOdooLeads(params);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch leads');
  }
});

export const fetchOpportunities = createAsyncThunk('odoo/fetchOpportunities', async (params: OdooListParams | undefined, { rejectWithValue }) => {
  try {
    return await getOdooOpportunities(params);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch opportunities');
  }
});

export const fetchSalesOrders = createAsyncThunk('odoo/fetchSalesOrders', async (params: OdooListParams | undefined, { rejectWithValue }) => {
  try {
    return await getOdooSalesOrders(params);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch sales orders');
  }
});

export const fetchInvoices = createAsyncThunk('odoo/fetchInvoices', async (params: OdooListParams | undefined, { rejectWithValue }) => {
  try {
    return await getOdooInvoices(params);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch invoices');
  }
});

export const fetchProducts = createAsyncThunk('odoo/fetchProducts', async (params: OdooListParams | undefined, { rejectWithValue }) => {
  try {
    return await getOdooProducts(params);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch products');
  }
});

export const fetchInventory = createAsyncThunk('odoo/fetchInventory', async (params: OdooListParams | undefined, { rejectWithValue }) => {
  try {
    return await getOdooInventory(params);
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch inventory');
  }
});

export const connectOdooThunk = createAsyncThunk(
  'odoo/connect',
  async (input: any, { dispatch, rejectWithValue }) => {
    try {
      const response = await connectOdoo(input);
      dispatch(fetchOdooConnection());
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to connect Odoo');
    }
  }
);

export const disconnectOdooThunk = createAsyncThunk(
  'odoo/disconnect',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await disconnectOdoo();
      dispatch(fetchOdooConnection());
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to disconnect Odoo');
    }
  }
);

export const syncMagentoToOdooThunk = createAsyncThunk(
  'odoo/syncMagento',
  async ({ type, options }: { type: 'all' | 'customers' | 'orders'; options?: any }, { rejectWithValue }) => {
    try {
      if (type === 'customers') return await syncMagentoCustomersToOdoo({ ...options, dryRun: options?.dryRun ?? true });
      if (type === 'orders') return await syncMagentoOrdersToOdoo({ ...options, dryRun: options?.dryRun ?? true });
      return await syncMagentoAllToOdoo({ ...options, dryRun: options?.dryRun ?? true });
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to sync Magento to Odoo');
    }
  }
);

const odooSlice = createSlice({
  name: 'odoo',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // Helper to handle list thunks
    const handleList = (builder: any, thunk: any, key: keyof OdooState) => {
      builder
        .addCase(thunk.pending, (state: any) => {
          state[key].loading = true;
          state[key].error = null;
        })
        .addCase(thunk.fulfilled, (state: any, action: any) => {
          state[key].data = action.payload.data;
          state[key].total = action.payload.total;
          state[key].loading = false;
        })
        .addCase(thunk.rejected, (state: any, action: any) => {
          state[key].loading = false;
          state[key].error = action.payload;
        });
    };

    builder
      .addCase(fetchOdooConnection.pending, (state) => {
        state.connection.loading = true;
      })
      .addCase(fetchOdooConnection.fulfilled, (state, action) => {
        state.connection.data = action.payload;
        state.connection.loading = false;
      })
      .addCase(fetchOdooConnection.rejected, (state, action) => {
        state.connection.loading = false;
        state.connection.error = action.payload as string;
      });

    handleList(builder, fetchContacts, 'contacts');
    handleList(builder, fetchCompanies, 'companies');
    handleList(builder, fetchLeads, 'leads');
    handleList(builder, fetchOpportunities, 'opportunities');
    handleList(builder, fetchSalesOrders, 'salesOrders');
    handleList(builder, fetchInvoices, 'invoices');
    handleList(builder, fetchProducts, 'products');
    handleList(builder, fetchInventory, 'inventory');
  },
});

export default odooSlice.reducer;

export const selectOdoo = (state: RootState) => state.odoo;
