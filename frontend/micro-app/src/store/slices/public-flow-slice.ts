import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { publicFlowService } from 'src/services/public-flow-service';
import { posService } from 'src/services/pos-service';
import { RootState } from '../index';

interface PublicFlowState {
  checkoutPage: {
    data: any | null;
    loading: boolean;
    error: string | null;
  };
  qrPayPage: {
    data: any | null;
    loading: boolean;
    error: string | null;
  };
  waiver: {
    data: any | null;
    loading: boolean;
    error: string | null;
  };
  verification: {
    result: any | null;
    loading: boolean;
    error: string | null;
  };
  posOrder: {
    data: any | null;
    shipping: any | null;
    delivery: any | null;
    loading: boolean;
    error: string | null;
  };
  approveJoin: {
    loading: boolean;
    success: boolean;
    error: string | null;
  };
}

const initialState: PublicFlowState = {
  checkoutPage: { data: null, loading: false, error: null },
  qrPayPage: { data: null, loading: false, error: null },
  waiver: { data: null, loading: false, error: null },
  verification: { result: null, loading: false, error: null },
  posOrder: { data: null, shipping: null, delivery: null, loading: false, error: null },
  approveJoin: { loading: false, success: false, error: null },
};

export const fetchCheckoutPageThunk = createAsyncThunk(
  'publicFlow/fetchCheckout',
  async (slug: string, { rejectWithValue }) => {
    try {
      return await publicFlowService.getCheckoutPagePublic(slug);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch checkout page');
    }
  }
);

export const fetchQrPayPageThunk = createAsyncThunk(
  'publicFlow/fetchQrPay',
  async (slug: string, { rejectWithValue }) => {
    try {
      return await publicFlowService.getQrPayPagePublic(slug);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch QR pay page');
    }
  }
);

export const fetchPublicWaiverThunk = createAsyncThunk(
  'publicFlow/fetchWaiver',
  async (id: string, { rejectWithValue }) => {
    try {
      return await publicFlowService.getPublicWaiver(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch waiver');
    }
  }
);

export const generatePhoneVerificationThunk = createAsyncThunk(
  'publicFlow/generateVerification',
  async (payload: any, { rejectWithValue }) => {
    try {
      return await publicFlowService.generateContactPhoneVerification(payload);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to generate verification');
    }
  }
);

export const signPublicWaiverThunk = createAsyncThunk(
  'publicFlow/signWaiver',
  async ({ id, payload }: { id: string; payload: any }, { rejectWithValue }) => {
    try {
      return await publicFlowService.signPublicWaiver(id, payload);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to sign waiver');
    }
  }
);

export const trackQrPayPaymentThunk = createAsyncThunk(
  'publicFlow/trackQrPay',
  async ({ slug, values }: { slug: string; values: any }, { rejectWithValue }) => {
    try {
      return await publicFlowService.trackQrPayPayment(slug, values);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to track payment');
    }
  }
);

export const fetchPosOrderThunk = createAsyncThunk(
  'publicFlow/fetchPosOrder',
  async (id: string, { rejectWithValue }) => {
    try {
      return await posService.getOrderById(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch order');
    }
  }
);

export const fetchOrderShippingThunk = createAsyncThunk(
  'publicFlow/fetchOrderShipping',
  async (id: string, { rejectWithValue }) => {
    try {
      return await posService.getOrderShipping(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch shipping');
    }
  }
);

export const fetchDeliveryStatusThunk = createAsyncThunk(
  'publicFlow/fetchDeliveryStatus',
  async (id: string, { rejectWithValue }) => {
    try {
      return await posService.getDeliveryStatus(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch delivery status');
    }
  }
);

export const approveJoinCheckRequestThunk = createAsyncThunk(
  'publicFlow/approveJoinCheck',
  async (payload: { orderId: string; requesterPhone: string }, { rejectWithValue }) => {
    try {
      return await posService.approveJoinCheckRequest(payload);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to approve join request');
    }
  }
);

const publicFlowSlice = createSlice({
  name: 'publicFlow',
  initialState,
  reducers: {
    resetVerification: (state) => {
      state.verification.result = null;
      state.verification.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCheckoutPageThunk.pending, (state) => { state.checkoutPage.loading = true; })
      .addCase(fetchCheckoutPageThunk.fulfilled, (state, action) => {
        state.checkoutPage.data = action.payload;
        state.checkoutPage.loading = false;
      })
      .addCase(fetchCheckoutPageThunk.rejected, (state, action) => {
        state.checkoutPage.loading = false;
        state.checkoutPage.error = action.payload as string;
      })
      .addCase(fetchQrPayPageThunk.pending, (state) => { state.qrPayPage.loading = true; })
      .addCase(fetchQrPayPageThunk.fulfilled, (state, action) => {
        state.qrPayPage.data = action.payload;
        state.qrPayPage.loading = false;
      })
      .addCase(fetchQrPayPageThunk.rejected, (state, action) => {
        state.qrPayPage.loading = false;
        state.qrPayPage.error = action.payload as string;
      })
      .addCase(fetchPublicWaiverThunk.pending, (state) => { state.waiver.loading = true; })
      .addCase(fetchPublicWaiverThunk.fulfilled, (state, action) => {
        state.waiver.data = action.payload;
        state.waiver.loading = false;
      })
      .addCase(fetchPublicWaiverThunk.rejected, (state, action) => {
        state.waiver.loading = false;
        state.waiver.error = action.payload as string;
      })
      .addCase(generatePhoneVerificationThunk.pending, (state) => { state.verification.loading = true; })
      .addCase(generatePhoneVerificationThunk.fulfilled, (state, action) => {
        state.verification.result = action.payload;
        state.verification.loading = false;
      })
      .addCase(generatePhoneVerificationThunk.rejected, (state, action) => {
        state.verification.loading = false;
        state.verification.error = action.payload as string;
      })
      .addCase(fetchPosOrderThunk.pending, (state) => { state.posOrder.loading = true; })
      .addCase(fetchPosOrderThunk.fulfilled, (state, action) => {
        state.posOrder.data = action.payload;
        state.posOrder.loading = false;
      })
      .addCase(fetchPosOrderThunk.rejected, (state, action) => {
        state.posOrder.loading = false;
        state.posOrder.error = action.payload as string;
      })
      .addCase(fetchOrderShippingThunk.fulfilled, (state, action) => {
        state.posOrder.shipping = action.payload;
      })
      .addCase(fetchDeliveryStatusThunk.fulfilled, (state, action) => {
        state.posOrder.delivery = action.payload;
      })
      .addCase(approveJoinCheckRequestThunk.pending, (state) => {
        state.approveJoin.loading = true;
        state.approveJoin.success = false;
      })
      .addCase(approveJoinCheckRequestThunk.fulfilled, (state) => {
        state.approveJoin.loading = false;
        state.approveJoin.success = true;
      })
      .addCase(approveJoinCheckRequestThunk.rejected, (state, action) => {
        state.approveJoin.loading = false;
        state.approveJoin.error = action.payload as string;
      });
  },
});

export const { resetVerification } = publicFlowSlice.actions;
export default publicFlowSlice.reducer;
export const selectPublicFlow = (state: RootState) => state.publicFlow;
