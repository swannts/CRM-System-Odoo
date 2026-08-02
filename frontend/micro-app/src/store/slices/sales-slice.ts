import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as salesService from 'src/services/sales-dashboard-service';
import { RootState } from '../index';
import type { 
  SalesFilters, 
  SalesSummary, 
  SalesOrderRow, 
  SalesLeadRow, 
  SalesOpportunity, 
  SalesActivity, 
  SalesAnalytics,
  SyncPreview,
  SyncResult,
  SalesStage
} from 'src/sections/sales/types';

interface SalesState {
  summary: {
    data: SalesSummary | null;
    loading: boolean;
    error: string | null;
  };
  orders: {
    data: SalesOrderRow[];
    loading: boolean;
    error: string | null;
  };
  leads: {
    data: SalesLeadRow[];
    loading: boolean;
    error: string | null;
  };
  opportunities: {
    data: SalesOpportunity[];
    loading: boolean;
    error: string | null;
  };
  activities: {
    data: SalesActivity[];
    loading: boolean;
    error: string | null;
  };
  analytics: {
    data: SalesAnalytics | null;
    loading: boolean;
    error: string | null;
  };
  stages: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  timeline: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  sync: {
    preview: SyncPreview | null;
    result: SyncResult | null;
    previewLoading: boolean;
    runLoading: boolean;
  };
}

const initialState: SalesState = {
  summary: { data: null, loading: false, error: null },
  orders: { data: [], loading: false, error: null },
  leads: { data: [], loading: false, error: null },
  opportunities: { data: [], loading: false, error: null },
  activities: { data: [], loading: false, error: null },
  analytics: { data: null, loading: false, error: null },
  stages: { data: [], loading: false, error: null },
  timeline: {
    data: [],
    loading: false,
    error: null,
  },
  sync: {
    preview: null,
    result: null,
    previewLoading: false,
    runLoading: false,
  },
};

export const fetchSalesSummary = createAsyncThunk(
  'sales/fetchSummary',
  async (filters: SalesFilters | undefined, { rejectWithValue }) => {
    try {
      return await salesService.getSalesSummary(filters);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch sales summary');
    }
  }
);

export const fetchSalesOrders = createAsyncThunk(
  'sales/fetchOrders',
  async (filters: SalesFilters | undefined, { rejectWithValue }) => {
    try {
      return await salesService.getSalesOrders(filters);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch sales orders');
    }
  }
);

export const fetchSalesLeads = createAsyncThunk(
  'sales/fetchLeads',
  async (filters: SalesFilters | undefined, { rejectWithValue }) => {
    try {
      return await salesService.getSalesLeads(filters);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch sales leads');
    }
  }
);

export const fetchSalesOpportunities = createAsyncThunk(
  'sales/fetchOpportunities',
  async (filters: SalesFilters | undefined, { rejectWithValue }) => {
    try {
      return await salesService.getSalesOpportunities(filters);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch opportunities');
    }
  }
);

export const fetchSalesActivities = createAsyncThunk(
  'sales/fetchActivities',
  async (filters: SalesFilters | undefined, { rejectWithValue }) => {
    try {
      return await salesService.getSalesActivities(filters);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch activities');
    }
  }
);

export const fetchSalesAnalytics = createAsyncThunk(
  'sales/fetchAnalytics',
  async (filters: SalesFilters | undefined, { rejectWithValue }) => {
    try {
      return await salesService.getSalesAnalytics(filters);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch analytics');
    }
  }
);

export const fetchSalesStages = createAsyncThunk(
  'sales/fetchStages',
  async (_, { rejectWithValue }) => {
    try {
      return await salesService.getSalesStages();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch sales stages');
    }
  }
);

export const fetchOpportunityTimeline = createAsyncThunk(
  'sales/fetchTimeline',
  async (id: string | number, { rejectWithValue }) => {
    try {
      return await salesService.getOpportunityTimeline(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch timeline');
    }
  }
);

// Mutations
export const createOpportunityNoteThunk = createAsyncThunk(
  'sales/createNote',
  async ({ id, body }: { id: string | number; body: string }, { rejectWithValue }) => {
    try {
      return await salesService.createOpportunityNote(id, body);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create note');
    }
  }
);
export const createOpportunityThunk = createAsyncThunk(
  'sales/createOpportunity',
  async (payload: any, { rejectWithValue }) => {
    try {
      return await salesService.createSalesOpportunity(payload);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create opportunity');
    }
  }
);

export const updateOpportunityThunk = createAsyncThunk(
  'sales/updateOpportunity',
  async ({ id, payload }: { id: string; payload: any }, { rejectWithValue }) => {
    try {
      return await salesService.updateSalesOpportunity(id, payload);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update opportunity');
    }
  }
);

export const updateOpportunityStageThunk = createAsyncThunk(
  'sales/updateOpportunityStage',
  async ({ id, stage, stageId }: { id: string; stage: SalesStage; stageId?: number }, { rejectWithValue }) => {
    try {
      return await salesService.updateOpportunityStage(id, stage, stageId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update stage');
    }
  }
);

export const createSalesActivityThunk = createAsyncThunk(
  'sales/createActivity',
  async ({ opportunityId, payload }: { opportunityId: string; payload: any }, { rejectWithValue }) => {
    try {
      return await salesService.createSalesActivity(opportunityId, payload);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create activity');
    }
  }
);

export const completeSalesActivityThunk = createAsyncThunk(
  'sales/completeActivity',
  async (id: string, { rejectWithValue }) => {
    try {
      return await salesService.completeSalesActivity(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to complete activity');
    }
  }
);

export const deleteSalesActivityThunk = createAsyncThunk(
  'sales/deleteActivity',
  async (id: string, { rejectWithValue }) => {
    try {
      return await salesService.deleteSalesActivity(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete activity');
    }
  }
);

export const deleteSalesOpportunityThunk = createAsyncThunk(
  'sales/deleteOpportunity',
  async (id: string, { rejectWithValue }) => {
    try {
      return await salesService.deleteSalesOpportunity(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete opportunity');
    }
  }
);

export const linkOrderToOpportunityThunk = createAsyncThunk(
  'sales/linkOrder',
  async ({ orderId, opportunityId }: { orderId: string; opportunityId: string }, { rejectWithValue }) => {
    try {
      return await salesService.linkOrderToOpportunity(orderId, opportunityId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to link order');
    }
  }
);

export const previewSyncThunk = createAsyncThunk(
  'sales/previewSync',
  async (_, { rejectWithValue }) => {
    try {
      return await salesService.previewMagentoToOdooSync();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to preview sync');
    }
  }
);

export const runSyncThunk = createAsyncThunk(
  'sales/runSync',
  async (_, { rejectWithValue }) => {
    try {
      return await salesService.runMagentoToOdooSync();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to run sync');
    }
  }
);

const salesSlice = createSlice({
  name: 'sales',
  initialState,
  reducers: {
    clearSyncResults: (state) => {
      state.sync.preview = null;
      state.sync.result = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesSummary.pending, (state) => { state.summary.loading = true; })
      .addCase(fetchSalesSummary.fulfilled, (state, action) => {
        state.summary.data = action.payload;
        state.summary.loading = false;
      })
      .addCase(fetchSalesSummary.rejected, (state, action) => {
        state.summary.loading = false;
        state.summary.error = action.payload as string;
      })
      .addCase(fetchSalesOrders.pending, (state) => { state.orders.loading = true; })
      .addCase(fetchSalesOrders.fulfilled, (state, action) => {
        state.orders.data = action.payload;
        state.orders.loading = false;
      })
      .addCase(fetchSalesOrders.rejected, (state, action) => {
        state.orders.loading = false;
        state.orders.error = action.payload as string;
      })
      .addCase(fetchSalesLeads.pending, (state) => { state.leads.loading = true; })
      .addCase(fetchSalesLeads.fulfilled, (state, action) => {
        state.leads.data = action.payload;
        state.leads.loading = false;
      })
      .addCase(fetchSalesLeads.rejected, (state, action) => {
        state.leads.loading = false;
        state.leads.error = action.payload as string;
      })
      .addCase(fetchSalesOpportunities.pending, (state) => { state.opportunities.loading = true; })
      .addCase(fetchSalesOpportunities.fulfilled, (state, action) => {
        state.opportunities.data = action.payload;
        state.opportunities.loading = false;
      })
      .addCase(fetchSalesOpportunities.rejected, (state, action) => {
        state.opportunities.loading = false;
        state.opportunities.error = action.payload as string;
      })
      .addCase(fetchSalesActivities.pending, (state) => { state.activities.loading = true; })
      .addCase(fetchSalesActivities.fulfilled, (state, action) => {
        state.activities.data = action.payload;
        state.activities.loading = false;
      })
      .addCase(fetchSalesActivities.rejected, (state, action) => {
        state.activities.loading = false;
        state.activities.error = action.payload as string;
      })
      .addCase(fetchSalesAnalytics.pending, (state) => { state.analytics.loading = true; })
      .addCase(fetchSalesAnalytics.fulfilled, (state, action) => {
        state.analytics.data = action.payload;
        state.analytics.loading = false;
      })
      .addCase(fetchSalesAnalytics.rejected, (state, action) => {
        state.analytics.loading = false;
        state.analytics.error = action.payload as string;
      })
      .addCase(fetchSalesStages.pending, (state) => { state.stages.loading = true; })
      .addCase(fetchSalesStages.fulfilled, (state, action) => {
        state.stages.data = action.payload;
        state.stages.loading = false;
      })
      .addCase(fetchSalesStages.rejected, (state, action) => {
        state.stages.loading = false;
        state.stages.error = action.payload as string;
      })
      .addCase(fetchOpportunityTimeline.pending, (state) => {
        state.timeline.loading = true;
      })
      .addCase(fetchOpportunityTimeline.fulfilled, (state, action) => {
        state.timeline.data = action.payload;
        state.timeline.loading = false;
      })
      .addCase(fetchOpportunityTimeline.rejected, (state, action) => {
        state.timeline.loading = false;
        state.timeline.error = action.payload as string;
      })
      .addCase(previewSyncThunk.pending, (state) => { state.sync.previewLoading = true; })
      .addCase(previewSyncThunk.fulfilled, (state, action) => {
        state.sync.preview = action.payload;
        state.sync.previewLoading = false;
      })
      .addCase(previewSyncThunk.rejected, (state) => { state.sync.previewLoading = false; })
      .addCase(runSyncThunk.pending, (state) => { state.sync.runLoading = true; })
      .addCase(runSyncThunk.fulfilled, (state, action) => {
        state.sync.result = action.payload;
        state.sync.runLoading = false;
      })
      .addCase(runSyncThunk.rejected, (state) => { state.sync.runLoading = false; });
  },
});

export const { clearSyncResults } = salesSlice.actions;
export default salesSlice.reducer;
export const selectSales = (state: RootState) => state.sales;
