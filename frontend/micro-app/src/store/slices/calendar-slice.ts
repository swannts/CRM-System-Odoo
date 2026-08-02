import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { calendarService } from 'src/services/calendar-service';
import { RootState } from '../index';

interface CalendarState {
  events: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  summary: {
    data: any | null;
    loading: boolean;
    error: string | null;
  };
  bookingLinks: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  availability: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  reminders: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  settings: {
    data: any | null;
    loading: boolean;
    error: string | null;
  };
}

const initialState: CalendarState = {
  events: { data: [], loading: false, error: null },
  summary: { data: null, loading: false, error: null },
  bookingLinks: { data: [], loading: false, error: null },
  availability: { data: [], loading: false, error: null },
  reminders: { data: [], loading: false, error: null },
  settings: { data: null, loading: false, error: null },
};

export const fetchCalendarEvents = createAsyncThunk(
  'calendar/fetchEvents',
  async (params: { page?: number; pageSize?: number } | undefined, { rejectWithValue }) => {
    try {
      const response = await calendarService.getEvents();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch events');
    }
  }
);

export const fetchCalendarSummary = createAsyncThunk(
  'calendar/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      return await calendarService.getSummary();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch summary');
    }
  }
);

export const fetchBookingLinks = createAsyncThunk(
  'calendar/fetchBookingLinks',
  async (_, { rejectWithValue }) => {
    try {
      return await calendarService.getBookingLinks();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch booking links');
    }
  }
);

export const fetchAvailability = createAsyncThunk(
  'calendar/fetchAvailability',
  async (_, { rejectWithValue }) => {
    try {
      return await calendarService.getAvailability();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch availability');
    }
  }
);

export const fetchReminders = createAsyncThunk(
  'calendar/fetchReminders',
  async (_, { rejectWithValue }) => {
    try {
      return await calendarService.getReminders();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch reminders');
    }
  }
);

export const fetchCalendarSettings = createAsyncThunk(
  'calendar/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      return await calendarService.getSettings();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch settings');
    }
  }
);

export const createCalendarEventThunk = createAsyncThunk(
  'calendar/createEvent',
  async (payload: any, { dispatch, rejectWithValue }) => {
    try {
      const response = await calendarService.createEvent(payload);
      dispatch(fetchCalendarEvents());
      dispatch(fetchCalendarSummary());
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create event');
    }
  }
);

export const updateCalendarEventThunk = createAsyncThunk(
  'calendar/updateEvent',
  async ({ id, payload }: { id: string; payload: any }, { dispatch, rejectWithValue }) => {
    try {
      const response = await calendarService.updateEvent(id, payload);
      dispatch(fetchCalendarEvents());
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update event');
    }
  }
);

export const deleteCalendarEventThunk = createAsyncThunk(
  'calendar/deleteEvent',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      const response = await calendarService.deleteEvent(id);
      dispatch(fetchCalendarEvents());
      dispatch(fetchCalendarSummary());
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete event');
    }
  }
);

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCalendarEvents.pending, (state) => {
        state.events.loading = true;
      })
      .addCase(fetchCalendarEvents.fulfilled, (state, action) => {
        state.events.data = action.payload;
        state.events.loading = false;
      })
      .addCase(fetchCalendarEvents.rejected, (state, action) => {
        state.events.loading = false;
        state.events.error = action.payload as string;
      })
      .addCase(fetchCalendarSummary.pending, (state) => {
        state.summary.loading = true;
      })
      .addCase(fetchCalendarSummary.fulfilled, (state, action) => {
        state.summary.data = action.payload;
        state.summary.loading = false;
      })
      .addCase(fetchCalendarSummary.rejected, (state, action) => {
        state.summary.loading = false;
        state.summary.error = action.payload as string;
      })
      .addCase(fetchBookingLinks.pending, (state) => {
        state.bookingLinks.loading = true;
      })
      .addCase(fetchBookingLinks.fulfilled, (state, action) => {
        state.bookingLinks.data = action.payload;
        state.bookingLinks.loading = false;
      })
      .addCase(fetchBookingLinks.rejected, (state, action) => {
        state.bookingLinks.loading = false;
        state.bookingLinks.error = action.payload as string;
      })
      .addCase(fetchAvailability.pending, (state) => {
        state.availability.loading = true;
      })
      .addCase(fetchAvailability.fulfilled, (state, action) => {
        state.availability.data = action.payload;
        state.availability.loading = false;
      })
      .addCase(fetchAvailability.rejected, (state, action) => {
        state.availability.loading = false;
        state.availability.error = action.payload as string;
      })
      .addCase(fetchReminders.pending, (state) => {
        state.reminders.loading = true;
      })
      .addCase(fetchReminders.fulfilled, (state, action) => {
        state.reminders.data = action.payload;
        state.reminders.loading = false;
      })
      .addCase(fetchReminders.rejected, (state, action) => {
        state.reminders.loading = false;
        state.reminders.error = action.payload as string;
      })
      .addCase(fetchCalendarSettings.pending, (state) => {
        state.settings.loading = true;
      })
      .addCase(fetchCalendarSettings.fulfilled, (state, action) => {
        state.settings.data = action.payload;
        state.settings.loading = false;
      })
      .addCase(fetchCalendarSettings.rejected, (state, action) => {
        state.settings.loading = false;
        state.settings.error = action.payload as string;
      });
  },
});

export default calendarSlice.reducer;
export const selectCalendar = (state: RootState) => state.calendar;
