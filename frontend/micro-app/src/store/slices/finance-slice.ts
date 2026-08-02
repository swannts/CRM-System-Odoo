import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { financeService, RevenueStats } from 'src/services/finance-service';
import { RootState } from '../index';

interface FinanceState {
  stats: {
    data: RevenueStats | null;
    loading: boolean;
    error: string | null;
  };
}

const initialState: FinanceState = {
  stats: {
    data: null,
    loading: false,
    error: null,
  },
};

export const fetchFinanceStats = createAsyncThunk(
  'finance/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      return await financeService.getRevenueStats();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch finance stats');
    }
  }
);

const financeSlice = createSlice({
  name: 'finance',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFinanceStats.pending, (state) => {
        state.stats.loading = true;
      })
      .addCase(fetchFinanceStats.fulfilled, (state, action) => {
        state.stats.data = action.payload;
        state.stats.loading = false;
      })
      .addCase(fetchFinanceStats.rejected, (state, action) => {
        state.stats.loading = false;
        state.stats.error = action.payload as string;
      });
  },
});

export default financeSlice.reducer;

export const selectFinance = (state: RootState) => state.finance;
