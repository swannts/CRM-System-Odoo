import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { chatService } from 'src/services/chat-service';
import { RootState } from '../index';

export interface IChatContact {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  channelId: string | null;
  lastMessage: any | null;
}

export interface IChatMessage {
  id: string;
  body: string;
  createdAt: string;
  authorId: string;
  channelId: string;
}

interface ChatState {
  contacts: {
    data: IChatContact[];
    loading: boolean;
    error: string | null;
  };
  messages: Record<string, { data: IChatMessage[]; loading: boolean; error: string | null }>;
}

const initialState: ChatState = {
  contacts: {
    data: [],
    loading: false,
    error: null,
  },
  messages: {},
};

export const fetchChatContacts = createAsyncThunk(
  'chat/fetchContacts',
  async (_, { rejectWithValue }) => {
    try {
      return await chatService.getContacts();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch chat contacts');
    }
  }
);

export const fetchChatMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (channelId: string, { rejectWithValue }) => {
    try {
      return await chatService.getMessages(channelId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch chat messages');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchChatContacts.pending, (state) => {
        state.contacts.loading = true;
      })
      .addCase(fetchChatContacts.fulfilled, (state, action) => {
        state.contacts.data = action.payload;
        state.contacts.loading = false;
      })
      .addCase(fetchChatContacts.rejected, (state, action) => {
        state.contacts.loading = false;
        state.contacts.error = action.payload as string;
      })
      .addCase(fetchChatMessages.pending, (state, action) => {
        const channelId = action.meta.arg;
        if (!state.messages[channelId]) {
          state.messages[channelId] = { data: [], loading: true, error: null };
        } else {
          state.messages[channelId].loading = true;
        }
      })
      .addCase(fetchChatMessages.fulfilled, (state, action) => {
        const channelId = action.meta.arg;
        state.messages[channelId].data = action.payload;
        state.messages[channelId].loading = false;
      })
      .addCase(fetchChatMessages.rejected, (state, action) => {
        const channelId = action.meta.arg;
        state.messages[channelId].loading = false;
        state.messages[channelId].error = action.payload as string;
      });
  },
});

export default chatSlice.reducer;

export const selectChat = (state: RootState) => state.chat;
