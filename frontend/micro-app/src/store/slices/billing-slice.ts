import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { billingService, IInvoice } from 'src/services/billing-service';
import { RootState } from '../index';

interface BillingState {
  invoices: {
    data: IInvoice[];
    total: number;
    loading: boolean;
    error: string | null;
  };
  summary: {
    data: {
      totalDue: number;
      totalAmount: number;
      paidAmount: number;
      invoiceCount: number;
      graph?: any;
    } | null;
    loading: boolean;
    error: string | null;
  };
  reconciliation: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  payments: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  currentInvoice: {
    data: IInvoice | null;
    loading: boolean;
    error: string | null;
  };
}

const initialState: BillingState = {
  invoices: {
    data: [],
    total: 0,
    loading: false,
    error: null,
  },
  summary: {
    data: null,
    loading: false,
    error: null,
  },
  reconciliation: {
    data: [],
    loading: false,
    error: null,
  },
  payments: {
    data: [],
    loading: false,
    error: null,
  },
  currentInvoice: {
    data: null,
    loading: false,
    error: null,
  },
};

// Thunks
export const fetchBillingInvoices = createAsyncThunk(
  'billing/fetchInvoices',
  async (params: { page?: number; pageSize?: number; search?: string; contactId?: string | number; state?: string; paymentState?: string; dateFrom?: string; dateTo?: string } | undefined, { rejectWithValue }) => {
    try {
      return await billingService.getInvoices(params);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch invoices');
    }
  }
);

export const fetchBillingSummary = createAsyncThunk(
  'billing/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      return await billingService.getSummary();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch billing summary');
    }
  }
);

export const fetchBillingGraph = createAsyncThunk(
  'billing/fetchGraph',
  async (months: number | undefined, { rejectWithValue }) => {
    try {
      return await billingService.getGraph(months);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch billing graph');
    }
  }
);

export const fetchBillingReconciliation = createAsyncThunk(
  'billing/fetchReconciliation',
  async (_, { rejectWithValue }) => {
    try {
      return await billingService.getReconciliation();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch reconciliation');
    }
  }
);

export const fetchInvoiceById = createAsyncThunk(
  'billing/fetchInvoiceById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await billingService.getInvoice(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch invoice');
    }
  }
);

export const fetchPayments = createAsyncThunk(
  'billing/fetchPayments',
  async (_, { rejectWithValue }) => {
    try {
      return await billingService.getPayments();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch payments');
    }
  }
);

export const createInvoiceThunk = createAsyncThunk(
  'billing/createInvoice',
  async (data: any, { rejectWithValue }) => {
    try {
      return await billingService.createInvoice(data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create invoice');
    }
  }
);

export const updateInvoiceThunk = createAsyncThunk(
  'billing/updateInvoice',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      return await billingService.updateInvoice(id, data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update invoice');
    }
  }
);

export const postInvoiceThunk = createAsyncThunk(
  'billing/postInvoice',
  async (id: string, { rejectWithValue }) => {
    try {
      return await billingService.postInvoice(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to post invoice');
    }
  }
);

export const deleteInvoiceThunk = createAsyncThunk(
  'billing/deleteInvoice',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      const response = await billingService.deleteInvoice(id);
      dispatch(fetchBillingInvoices({}));
      dispatch(fetchBillingSummary());
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete invoice');
    }
  }
);

const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBillingInvoices.pending, (state) => {
        state.invoices.loading = true;
      })
      .addCase(fetchBillingInvoices.fulfilled, (state, action) => {
        state.invoices.data = action.payload.data;
        state.invoices.total = action.payload.total;
        state.invoices.loading = false;
      })
      .addCase(fetchBillingInvoices.rejected, (state, action) => {
        state.invoices.loading = false;
        state.invoices.error = action.payload as string;
      })
      .addCase(fetchBillingSummary.pending, (state) => {
        state.summary.loading = true;
      })
      .addCase(fetchBillingSummary.fulfilled, (state, action) => {
        state.summary.data = action.payload;
        state.summary.loading = false;
      })
      .addCase(fetchBillingSummary.rejected, (state, action) => {
        state.summary.loading = false;
        state.summary.error = action.payload as string;
      })
      .addCase(fetchBillingGraph.pending, (state) => {
        state.summary.loading = true;
      })
      .addCase(fetchBillingGraph.fulfilled, (state, action) => {
        if (state.summary.data) {
          state.summary.data.graph = action.payload;
        } else {
          state.summary.data = {
            totalDue: 0,
            totalAmount: 0,
            paidAmount: 0,
            invoiceCount: 0,
            graph: action.payload,
          };
        }
        state.summary.loading = false;
      })
      .addCase(fetchBillingGraph.rejected, (state, action) => {
        state.summary.loading = false;
        state.summary.error = action.payload as string;
      })
      .addCase(fetchBillingReconciliation.pending, (state) => {
        state.reconciliation.loading = true;
      })
      .addCase(fetchBillingReconciliation.fulfilled, (state, action) => {
        state.reconciliation.data = action.payload;
        state.reconciliation.loading = false;
      })
      .addCase(fetchBillingReconciliation.rejected, (state, action) => {
        state.reconciliation.loading = false;
        state.reconciliation.error = action.payload as string;
      })
      .addCase(fetchInvoiceById.pending, (state) => {
        state.currentInvoice.loading = true;
      })
      .addCase(fetchInvoiceById.fulfilled, (state, action) => {
        state.currentInvoice.data = action.payload;
        state.currentInvoice.loading = false;
      })
      .addCase(fetchInvoiceById.rejected, (state, action) => {
        state.currentInvoice.loading = false;
        state.currentInvoice.error = action.payload as string;
      })
      .addCase(fetchPayments.pending, (state) => {
        state.payments.loading = true;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.payments.data = action.payload;
        state.payments.loading = false;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.payments.loading = false;
        state.payments.error = action.payload as string;
      })
      .addCase(postInvoiceThunk.fulfilled, (state, action) => {
        if (state.currentInvoice.data && state.currentInvoice.data.id === action.meta.arg) {
          state.currentInvoice.data.status = 'posted';
        }
      });
  },
});

export default billingSlice.reducer;

export const selectBilling = (state: RootState) => state.billing;
