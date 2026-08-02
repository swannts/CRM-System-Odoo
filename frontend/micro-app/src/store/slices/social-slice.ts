import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { socialService } from 'src/services/social-service';
import { RootState } from '../index';

interface SocialState {
  accounts: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  analytics: {
    data: any | null;
    loading: boolean;
    error: string | null;
  };
}

const initialState: SocialState = {
  accounts: { data: [], loading: false, error: null },
  analytics: { data: null, loading: false, error: null },
};

export const fetchSocialAccountsThunk = createAsyncThunk(
  'social/fetchAccounts',
  async (_, { rejectWithValue }) => {
    try {
      return await socialService.getAccounts();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch social accounts');
    }
  }
);

export const fetchSocialAnalyticsThunk = createAsyncThunk(
  'social/fetchAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      return await socialService.getAnalytics();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch social analytics');
    }
  }
);

const socialSlice = createSlice({
  name: 'social',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSocialAccountsThunk.pending, (state) => { state.accounts.loading = true; })
      .addCase(fetchSocialAccountsThunk.fulfilled, (state, action) => {
        state.accounts.data = action.payload;
        state.accounts.loading = false;
      })
      .addCase(fetchSocialAccountsThunk.rejected, (state, action) => {
        state.accounts.loading = false;
        state.accounts.error = action.payload as string;
      })
      .addCase(fetchSocialAnalyticsThunk.pending, (state) => { state.analytics.loading = true; })
      .addCase(fetchSocialAnalyticsThunk.fulfilled, (state, action) => {
        state.analytics.data = action.payload;
        state.analytics.loading = false;
      })
      .addCase(fetchSocialAnalyticsThunk.rejected, (state, action) => {
        state.analytics.loading = false;
        state.analytics.error = action.payload as string;
      });
  },
});

export default socialSlice.reducer;
export const selectSocial = (state: RootState) => state.social;
