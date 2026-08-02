import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { affiliateService } from 'src/services/affiliate-service';
import { RootState } from '../index';

interface AffiliateState {
  referral: {
    data: any | null;
    loading: boolean;
    error: string | null;
  };
  earnings: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  referrals: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  list: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  receipts: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
}

const initialState: AffiliateState = {
  referral: { data: null, loading: false, error: null },
  earnings: { data: [], loading: false, error: null },
  referrals: { data: [], loading: false, error: null },
  list: { data: [], loading: false, error: null },
  receipts: { data: [], loading: false, error: null },
};

export const fetchAffiliateReferralThunk = createAsyncThunk(
  'affiliate/fetchReferral',
  async (_, { rejectWithValue }) => {
    try {
      return await affiliateService.getReferral();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch referral info');
    }
  }
);

export const fetchAffiliateEarningsThunk = createAsyncThunk(
  'affiliate/fetchEarnings',
  async (_, { rejectWithValue }) => {
    try {
      return await affiliateService.getEarnings();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch earnings');
    }
  }
);

export const fetchAffiliateReferralsThunk = createAsyncThunk(
  'affiliate/fetchReferrals',
  async (_, { rejectWithValue }) => {
    try {
      return await affiliateService.getReferrals();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch referrals');
    }
  }
);

export const fetchAffiliateReceiptsThunk = createAsyncThunk(
  'affiliate/fetchReceipts',
  async (_, { rejectWithValue }) => {
    try {
      return await affiliateService.getPaymentReceipts();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch receipts');
    }
  }
);

export const sendAffiliateInvitationThunk = createAsyncThunk(
  'affiliate/sendInvitation',
  async (email: string, { rejectWithValue }) => {
    try {
      return await affiliateService.sendInvitation(email);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send invitation');
    }
  }
);

export const fetchAffiliateListThunk = createAsyncThunk(
  'affiliate/fetchList',
  async (_, { rejectWithValue }) => {
    try {
      return await affiliateService.getAffiliates();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch affiliate list');
    }
  }
);

const affiliateSlice = createSlice({
  name: 'affiliate',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAffiliateReferralThunk.pending, (state) => { state.referral.loading = true; })
      .addCase(fetchAffiliateReferralThunk.fulfilled, (state, action) => {
        state.referral.data = action.payload;
        state.referral.loading = false;
      })
      .addCase(fetchAffiliateReferralThunk.rejected, (state, action) => {
        state.referral.loading = false;
        state.referral.error = action.payload as string;
      })
      .addCase(fetchAffiliateEarningsThunk.pending, (state) => { state.earnings.loading = true; })
      .addCase(fetchAffiliateEarningsThunk.fulfilled, (state, action) => {
        state.earnings.data = action.payload;
        state.earnings.loading = false;
      })
      .addCase(fetchAffiliateReferralsThunk.pending, (state) => { state.referrals.loading = true; })
      .addCase(fetchAffiliateReferralsThunk.fulfilled, (state, action) => {
        state.referrals.data = action.payload;
        state.referrals.loading = false;
      })
      .addCase(fetchAffiliateReceiptsThunk.pending, (state) => { state.receipts.loading = true; })
      .addCase(fetchAffiliateReceiptsThunk.fulfilled, (state, action) => {
        state.receipts.data = action.payload;
        state.receipts.loading = false;
      })
      .addCase(fetchAffiliateReceiptsThunk.rejected, (state, action) => {
        state.receipts.loading = false;
        state.receipts.error = action.payload as string;
      })
      .addCase(fetchAffiliateListThunk.pending, (state) => { state.list.loading = true; })
      .addCase(fetchAffiliateListThunk.fulfilled, (state, action) => {
        state.list.data = action.payload;
        state.list.loading = false;
      })
      .addCase(fetchAffiliateListThunk.rejected, (state, action) => {
        state.list.loading = false;
        state.list.error = action.payload as string;
      });
  },
});

export default affiliateSlice.reducer;
export const selectAffiliate = (state: RootState) => state.affiliate;
