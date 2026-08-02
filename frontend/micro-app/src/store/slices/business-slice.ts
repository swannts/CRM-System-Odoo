import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { businessService } from 'src/services/business-service';
import { RootState } from '../index';

interface BusinessState {
  retention: {
    data: any | null;
    loading: boolean;
    error: string | null;
  };
  birthdays: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  expired: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  progression: {
    data: any | null;
    loading: boolean;
    error: string | null;
  };
}

const initialState: BusinessState = {
  retention: { data: null, loading: false, error: null },
  birthdays: { data: [], loading: false, error: null },
  expired: { data: [], loading: false, error: null },
  progression: { data: null, loading: false, error: null },
};

export const fetchBusinessRetentionThunk = createAsyncThunk(
  'business/fetchRetention',
  async (_, { rejectWithValue }) => {
    try {
      return await businessService.getRetentionStats();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch retention stats');
    }
  }
);

export const fetchBusinessBirthdaysThunk = createAsyncThunk(
  'business/fetchBirthdays',
  async (_, { rejectWithValue }) => {
    try {
      return await businessService.getBirthdays();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch birthdays');
    }
  }
);

export const fetchBusinessExpiredThunk = createAsyncThunk(
  'business/fetchExpired',
  async (_, { rejectWithValue }) => {
    try {
      return await businessService.getExpiredMemberships();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch expired memberships');
    }
  }
);

export const fetchBusinessProgressionThunk = createAsyncThunk(
  'business/fetchProgression',
  async (_, { rejectWithValue }) => {
    try {
      return await businessService.getProgressionStats();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch progression stats');
    }
  }
);

const businessSlice = createSlice({
  name: 'business',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBusinessRetentionThunk.pending, (state) => { state.retention.loading = true; })
      .addCase(fetchBusinessRetentionThunk.fulfilled, (state, action) => {
        state.retention.data = action.payload;
        state.retention.loading = false;
      })
      .addCase(fetchBusinessRetentionThunk.rejected, (state, action) => {
        state.retention.loading = false;
        state.retention.error = action.payload as string;
      })
      .addCase(fetchBusinessBirthdaysThunk.pending, (state) => { state.birthdays.loading = true; })
      .addCase(fetchBusinessBirthdaysThunk.fulfilled, (state, action) => {
        state.birthdays.data = action.payload;
        state.birthdays.loading = false;
      })
      .addCase(fetchBusinessExpiredThunk.pending, (state) => { state.expired.loading = true; })
      .addCase(fetchBusinessExpiredThunk.fulfilled, (state, action) => {
        state.expired.data = action.payload;
        state.expired.loading = false;
      })
      .addCase(fetchBusinessProgressionThunk.pending, (state) => { state.progression.loading = true; })
      .addCase(fetchBusinessProgressionThunk.fulfilled, (state, action) => {
        state.progression.data = action.payload;
        state.progression.loading = false;
      });
  },
});

export default businessSlice.reducer;
export const selectBusiness = (state: RootState) => state.business;
