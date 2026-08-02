import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { integrationService } from 'src/services/integration-service';
import { RootState } from '../index';

interface IntegrationState {
  adp: {
    status: any | null;
    loading: boolean;
    error: string | null;
  };
}

const initialState: IntegrationState = {
  adp: { status: null, loading: false, error: null },
};

export const fetchAdpStatusThunk = createAsyncThunk(
  'integration/fetchAdpStatus',
  async (_, { rejectWithValue }) => {
    try {
      return await integrationService.getAdpStatus();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch ADP status');
    }
  }
);

export const connectAdpThunk = createAsyncThunk(
  'integration/connectAdp',
  async (_, { rejectWithValue }) => {
    try {
      return await integrationService.generateAdpToken();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to connect to ADP');
    }
  }
);

export const disconnectAdpThunk = createAsyncThunk(
  'integration/disconnectAdp',
  async (_, { rejectWithValue }) => {
    try {
      return await integrationService.disconnectAdp();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to disconnect from ADP');
    }
  }
);

const integrationSlice = createSlice({
  name: 'integration',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdpStatusThunk.pending, (state) => { state.adp.loading = true; })
      .addCase(fetchAdpStatusThunk.fulfilled, (state, action) => {
        state.adp.status = action.payload;
        state.adp.loading = false;
      })
      .addCase(fetchAdpStatusThunk.rejected, (state, action) => {
        state.adp.loading = false;
        state.adp.error = action.payload as string;
      });
  },
});

export default integrationSlice.reducer;
export const selectIntegration = (state: RootState) => state.integration;
