import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { reputationService } from 'src/services/reputation-service';
import { RootState } from '../index';

interface ReputationState {
  overview: {
    data: any | null;
    loading: boolean;
    error: string | null;
  };
  reviews: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  requests: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
}

const initialState: ReputationState = {
  overview: { data: null, loading: false, error: null },
  reviews: { data: [], loading: false, error: null },
  requests: { data: [], loading: false, error: null },
};

export const fetchReputationOverview = createAsyncThunk(
  'reputation/fetchOverview',
  async (_, { rejectWithValue }) => {
    try {
      return await reputationService.getOverview();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch reputation overview');
    }
  }
);

export const fetchReputationReviews = createAsyncThunk(
  'reputation/fetchReviews',
  async (params: any | undefined, { rejectWithValue }) => {
    try {
      return await reputationService.getReviews(params);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch reviews');
    }
  }
);

export const fetchReputationRequests = createAsyncThunk(
  'reputation/fetchRequests',
  async (_, { rejectWithValue }) => {
    try {
      return await reputationService.getReviewRequests();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch requests');
    }
  }
);

export const sendReviewRequestThunk = createAsyncThunk(
  'reputation/sendRequest',
  async (payload: any, { rejectWithValue }) => {
    try {
      return await reputationService.sendReviewRequest(payload);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send request');
    }
  }
);

const reputationSlice = createSlice({
  name: 'reputation',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReputationOverview.pending, (state) => { state.overview.loading = true; })
      .addCase(fetchReputationOverview.fulfilled, (state, action) => {
        state.overview.data = action.payload;
        state.overview.loading = false;
      })
      .addCase(fetchReputationOverview.rejected, (state, action) => {
        state.overview.loading = false;
        state.overview.error = action.payload as string;
      })
      .addCase(fetchReputationReviews.pending, (state) => { state.reviews.loading = true; })
      .addCase(fetchReputationReviews.fulfilled, (state, action) => {
        state.reviews.data = action.payload;
        state.reviews.loading = false;
      })
      .addCase(fetchReputationReviews.rejected, (state, action) => {
        state.reviews.loading = false;
        state.reviews.error = action.payload as string;
      })
      .addCase(fetchReputationRequests.pending, (state) => { state.requests.loading = true; })
      .addCase(fetchReputationRequests.fulfilled, (state, action) => {
        state.requests.data = action.payload;
        state.requests.loading = false;
      })
      .addCase(fetchReputationRequests.rejected, (state, action) => {
        state.requests.loading = false;
        state.requests.error = action.payload as string;
      });
  },
});

export default reputationSlice.reducer;
export const selectReputation = (state: RootState) => state.reputation;
