import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { bookingService } from 'src/services/booking-service';
import { RootState } from '../index';

export interface IBookingType {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  price?: number;
  link?: string;
  active?: boolean;
  color?: string;
}

export interface IAppointment {
  id: string;
  bookingTypeId: string;
  contactId: string;
  startTime: string;
  endTime: string;
  status: string;
  note?: string;
  contactName?: string;
  bookingTypeName?: string;
}

interface BookingState {
  bookingTypes: {
    data: IBookingType[];
    loading: boolean;
    error: string | null;
  };
  appointments: {
    data: IAppointment[];
    loading: boolean;
    error: string | null;
  };
  publicBooking: {
    type: IBookingType | null;
    slots: any[];
    loading: boolean;
    error: string | null;
    mutationLoading: boolean;
  };
}

const initialState: BookingState = {
  bookingTypes: {
    data: [],
    loading: false,
    error: null,
  },
  appointments: {
    data: [],
    loading: false,
    error: null,
  },
  publicBooking: {
    type: null,
    slots: [],
    loading: false,
    error: null,
    mutationLoading: false,
  },
};

export const fetchBookingTypes = createAsyncThunk('booking/fetchTypes', async (_, { rejectWithValue }) => {
  try {
    return await bookingService.getBookingTypes();
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch booking types');
  }
});

export const fetchAppointments = createAsyncThunk('booking/fetchAppointments', async (_, { rejectWithValue }) => {
  try {
    return await bookingService.getAppointments();
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to fetch appointments');
  }
});

export const fetchPublicBookingTypeThunk = createAsyncThunk(
  'booking/fetchPublicType',
  async ({ link, id }: { link?: string; id?: string }, { rejectWithValue }) => {
    try {
      if (link) return await bookingService.getBookingTypeByLink(link);
      return await bookingService.getBookingType(id!);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch booking type');
    }
  }
);

export const fetchAvailableSlotsThunk = createAsyncThunk(
  'booking/fetchSlots',
  async ({ typeId, date }: { typeId: string; date: string }, { rejectWithValue }) => {
    try {
      return await bookingService.getAvailableSlots(typeId, date);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch slots');
    }
  }
);

export const createPublicAppointmentThunk = createAsyncThunk(
  'booking/createPublicAppointment',
  async (data: any, { rejectWithValue }) => {
    try {
      return await bookingService.createAppointment(data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create appointment');
    }
  }
);

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    clearPublicBooking: (state) => {
      state.publicBooking.type = null;
      state.publicBooking.slots = [];
      state.publicBooking.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookingTypes.pending, (state) => {
        state.bookingTypes.loading = true;
      })
      .addCase(fetchBookingTypes.fulfilled, (state, action) => {
        state.bookingTypes.data = action.payload;
        state.bookingTypes.loading = false;
      })
      .addCase(fetchBookingTypes.rejected, (state, action) => {
        state.bookingTypes.loading = false;
        state.bookingTypes.error = action.payload as string;
      })
      .addCase(fetchAppointments.pending, (state) => {
        state.appointments.loading = true;
      })
      .addCase(fetchAppointments.fulfilled, (state, action) => {
        state.appointments.data = action.payload;
        state.appointments.loading = false;
      })
      .addCase(fetchAppointments.rejected, (state, action) => {
        state.appointments.loading = false;
        state.appointments.error = action.payload as string;
      })
      .addCase(fetchPublicBookingTypeThunk.pending, (state) => {
        state.publicBooking.loading = true;
      })
      .addCase(fetchPublicBookingTypeThunk.fulfilled, (state, action) => {
        state.publicBooking.type = action.payload;
        state.publicBooking.loading = false;
      })
      .addCase(fetchPublicBookingTypeThunk.rejected, (state, action) => {
        state.publicBooking.loading = false;
        state.publicBooking.error = action.payload as string;
      })
      .addCase(fetchAvailableSlotsThunk.fulfilled, (state, action) => {
        state.publicBooking.slots = action.payload;
      })
      .addCase(createPublicAppointmentThunk.pending, (state) => {
        state.publicBooking.mutationLoading = true;
      })
      .addCase(createPublicAppointmentThunk.fulfilled, (state) => {
        state.publicBooking.mutationLoading = false;
      })
      .addCase(createPublicAppointmentThunk.rejected, (state, action) => {
        state.publicBooking.mutationLoading = false;
        state.publicBooking.error = action.payload as string;
      });
  },
});

export const { clearPublicBooking } = bookingSlice.actions;
export default bookingSlice.reducer;

export const selectBooking = (state: RootState) => state.booking;
