import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dashboardService, DashboardRange, DashboardMetric } from 'src/services/dashboard-service';
import { RootState } from '../index';

export interface DashboardOverview {
  totalRevenue: number;
  totalContacts: number;
  totalOrders: number;
  totalPipeline: number;
  totalBookings: number;
  revenueTrend: number;
  contactsTrend: number;
  ordersTrend: number;
  pipelineTrend: number;
  bookingsTrend: number;
  [key: string]: any;
}

export interface DashboardGraph {
  series: {
    name: string;
    data: number[];
  }[];
  categories: string[];
}

export interface DashboardActivity {
  id: string;
  type: string;
  title: string;
  description?: string;
  occurredAt: string;
}

export interface DashboardAttention {
  id: string;
  type: 'urgent' | 'info' | 'warning';
  title: string;
  link?: string;
  dueAt?: string;
}

interface DashboardState {
  overview: {
    data: DashboardOverview | null;
    loading: boolean;
    error: string | null;
  };
  graph: {
    data: DashboardGraph | null;
    loading: boolean;
    error: string | null;
  };
  activity: {
    data: DashboardActivity[];
    loading: boolean;
    error: string | null;
  };
  attention: {
    data: DashboardAttention[];
    loading: boolean;
    error: string | null;
  };
}

const initialState: DashboardState = {
  overview: { data: null, loading: false, error: null },
  graph: { data: null, loading: false, error: null },
  activity: { data: [], loading: false, error: null },
  attention: { data: [], loading: false, error: null },
};

export const fetchDashboardOverview = createAsyncThunk(
  'dashboard/fetchOverview',
  async (range: DashboardRange | undefined, { rejectWithValue }) => {
    try {
      return await dashboardService.getOverview(range);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch overview');
    }
  }
);

export const fetchDashboardGraph = createAsyncThunk(
  'dashboard/fetchGraph',
  async ({ metric, range }: { metric: DashboardMetric; range?: DashboardRange }, { rejectWithValue }) => {
    try {
      return await dashboardService.getGraph(metric, range);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch graph');
    }
  }
);

export const fetchDashboardActivity = createAsyncThunk(
  'dashboard/fetchActivity',
  async (limit: number | undefined, { rejectWithValue }) => {
    try {
      return await dashboardService.getActivity(limit);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch activity');
    }
  }
);

export const fetchDashboardAttention = createAsyncThunk(
  'dashboard/fetchAttention',
  async (_, { rejectWithValue }) => {
    try {
      return await dashboardService.getAttention();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch attention');
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardOverview.pending, (state) => {
        state.overview.loading = true;
      })
      .addCase(fetchDashboardOverview.fulfilled, (state, action) => {
        state.overview.data = action.payload;
        state.overview.loading = false;
      })
      .addCase(fetchDashboardOverview.rejected, (state, action) => {
        state.overview.loading = false;
        state.overview.error = action.payload as string;
      })
      .addCase(fetchDashboardGraph.pending, (state) => {
        state.graph.loading = true;
      })
      .addCase(fetchDashboardGraph.fulfilled, (state, action) => {
        state.graph.data = action.payload;
        state.graph.loading = false;
      })
      .addCase(fetchDashboardGraph.rejected, (state, action) => {
        state.graph.loading = false;
        state.graph.error = action.payload as string;
      })
      .addCase(fetchDashboardActivity.pending, (state) => {
        state.activity.loading = true;
      })
      .addCase(fetchDashboardActivity.fulfilled, (state, action) => {
        state.activity.data = action.payload;
        state.activity.loading = false;
      })
      .addCase(fetchDashboardActivity.rejected, (state, action) => {
        state.activity.loading = false;
        state.activity.error = action.payload as string;
      })
      .addCase(fetchDashboardAttention.pending, (state) => {
        state.attention.loading = true;
      })
      .addCase(fetchDashboardAttention.fulfilled, (state, action) => {
        state.attention.data = action.payload;
        state.attention.loading = false;
      })
      .addCase(fetchDashboardAttention.rejected, (state, action) => {
        state.attention.loading = false;
        state.attention.error = action.payload as string;
      });
  },
});

export default dashboardSlice.reducer;

export const selectDashboard = (state: RootState) => state.dashboard;
