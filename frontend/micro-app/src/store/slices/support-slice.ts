import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supportService } from 'src/services/support-service';
import { RootState } from '../index';

interface SupportState {
  tickets: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  selectedTicket: {
    data: any | null;
    loading: boolean;
    error: string | null;
  };
  articles: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  publicArticles: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  categories: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
}

const initialState: SupportState = {
  tickets: { data: [], loading: false, error: null },
  selectedTicket: { data: null, loading: false, error: null },
  articles: { data: [], loading: false, error: null },
  publicArticles: { data: [], loading: false, error: null },
  categories: { data: [], loading: false, error: null },
};

export const fetchSupportTicketsThunk = createAsyncThunk(
  'support/fetchTickets',
  async (_, { rejectWithValue }) => {
    try {
      return await supportService.listTickets();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch tickets');
    }
  }
);

export const fetchSupportTicketByIdThunk = createAsyncThunk(
  'support/fetchTicketById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await supportService.getTicket(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch ticket');
    }
  }
);

export const createSupportTicketThunk = createAsyncThunk(
  'support/createTicket',
  async (payload: any, { rejectWithValue }) => {
    try {
      return await supportService.createTicket(payload);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create ticket');
    }
  }
);

export const updateSupportTicketThunk = createAsyncThunk(
  'support/updateTicket',
  async ({ id, payload }: { id: string; payload: any }, { rejectWithValue }) => {
    try {
      return await supportService.updateTicket(id, payload);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update ticket');
    }
  }
);

export const addTicketNoteThunk = createAsyncThunk(
  'support/addNote',
  async ({ id, body }: { id: string; body: string }, { rejectWithValue }) => {
    try {
      return await supportService.addTicketNote(id, body);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add note');
    }
  }
);

export const addTicketReplyThunk = createAsyncThunk(
  'support/addReply',
  async ({ id, body, isCustomerVisible }: { id: string; body: string; isCustomerVisible: boolean }, { rejectWithValue }) => {
    try {
      return await supportService.addTicketReply(id, body, isCustomerVisible);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add reply');
    }
  }
);

export const fetchKbArticlesThunk = createAsyncThunk(
  'support/fetchArticles',
  async (_, { rejectWithValue }) => {
    try {
      return await supportService.listKbArticles();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch articles');
    }
  }
);

export const fetchPublicKbArticlesThunk = createAsyncThunk(
  'support/fetchPublicArticles',
  async (_, { rejectWithValue }) => {
    try {
      return await supportService.listPublicKbArticles();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch public articles');
    }
  }
);

export const fetchKbCategoriesThunk = createAsyncThunk(
  'support/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      return await supportService.listKbCategories();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch categories');
    }
  }
);

export const createKbArticleThunk = createAsyncThunk(
  'support/createArticle',
  async (payload: any, { rejectWithValue }) => {
    try {
      return await supportService.createKbArticle(payload);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create article');
    }
  }
);

export const submitSupportFeedbackThunk = createAsyncThunk(
  'support/submitFeedback',
  async (payload: any, { rejectWithValue }) => {
    try {
      return await supportService.submitFeedback(payload);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to submit feedback');
    }
  }
);

const supportSlice = createSlice({
  name: 'support',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSupportTicketsThunk.pending, (state) => { state.tickets.loading = true; })
      .addCase(fetchSupportTicketsThunk.fulfilled, (state, action) => {
        state.tickets.data = action.payload;
        state.tickets.loading = false;
      })
      .addCase(fetchSupportTicketsThunk.rejected, (state, action) => {
        state.tickets.loading = false;
        state.tickets.error = action.payload as string;
      })
      .addCase(fetchSupportTicketByIdThunk.pending, (state) => { state.selectedTicket.loading = true; })
      .addCase(fetchSupportTicketByIdThunk.fulfilled, (state, action) => {
        state.selectedTicket.data = action.payload;
        state.selectedTicket.loading = false;
      })
      .addCase(fetchSupportTicketByIdThunk.rejected, (state, action) => {
        state.selectedTicket.loading = false;
        state.selectedTicket.error = action.payload as string;
      })
      .addCase(fetchKbArticlesThunk.fulfilled, (state, action) => {
        state.articles.data = action.payload;
      })
      .addCase(fetchPublicKbArticlesThunk.fulfilled, (state, action) => {
        state.publicArticles.data = action.payload;
      })
      .addCase(fetchKbCategoriesThunk.fulfilled, (state, action) => {
        state.categories.data = action.payload;
      });
  },
});

export default supportSlice.reducer;
export const selectSupport = (state: RootState) => state.support;
