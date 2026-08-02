import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { notificationService } from 'src/services/notification-service';
import { RootState } from '../index';

interface NotificationState {
  notifications: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  totals: {
    data: { all: number; unread: number; archived: number } | null;
    loading: boolean;
    error: string | null;
  };
}

const initialState: NotificationState = {
  notifications: { data: [], loading: false, error: null },
  totals: { data: null, loading: false, error: null },
};

export const fetchNotificationsThunk = createAsyncThunk(
  'notifications/fetchList',
  async (params: any, { rejectWithValue }) => {
    try {
      return await notificationService.getNotifications(params);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch notifications');
    }
  }
);

export const fetchNotificationTotalsThunk = createAsyncThunk(
  'notifications/fetchTotals',
  async (_, { rejectWithValue }) => {
    try {
      return await notificationService.getNotificationTotals();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch totals');
    }
  }
);

export const markNotificationsReadThunk = createAsyncThunk(
  'notifications/markRead',
  async (ids: string[] | undefined, { rejectWithValue }) => {
    try {
      return await notificationService.markNotificationsRead(ids);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to mark notifications as read');
    }
  }
);

export const archiveNotificationsThunk = createAsyncThunk(
  'notifications/archive',
  async (ids: string[] | undefined, { rejectWithValue }) => {
    try {
      return await notificationService.archiveNotifications(ids);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to archive notifications');
    }
  }
);

export const unarchiveNotificationsThunk = createAsyncThunk(
  'notifications/unarchive',
  async (ids: string[] | undefined, { rejectWithValue }) => {
    try {
      return await notificationService.unarchiveNotifications(ids);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to unarchive notifications');
    }
  }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotificationsThunk.pending, (state) => { state.notifications.loading = true; })
      .addCase(fetchNotificationsThunk.fulfilled, (state, action) => {
        state.notifications.data = action.payload;
        state.notifications.loading = false;
      })
      .addCase(fetchNotificationsThunk.rejected, (state, action) => {
        state.notifications.loading = false;
        state.notifications.error = action.payload as string;
      })
      .addCase(fetchNotificationTotalsThunk.pending, (state) => { state.totals.loading = true; })
      .addCase(fetchNotificationTotalsThunk.fulfilled, (state, action) => {
        state.totals.data = action.payload;
        state.totals.loading = false;
      })
      .addCase(fetchNotificationTotalsThunk.rejected, (state, action) => {
        state.totals.loading = false;
        state.totals.error = action.payload as string;
      });
  },
});

export default notificationSlice.reducer;
export const selectNotifications = (state: RootState) => state.notifications;
