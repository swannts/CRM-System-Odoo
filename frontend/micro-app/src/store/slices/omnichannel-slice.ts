import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { omniChatService, omniMarketingService, omniAutomationService } from 'src/services/omni-service';
import { RootState } from '../index';

interface OmniChannelState {
  instances: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  conversations: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  currentConversation: {
    data: any | null;
    messages: any[];
    loading: boolean;
    error: string | null;
  };
  triggers: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  chatbots: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  currentChatbot: {
    data: any | null;
    loading: boolean;
    error: string | null;
  };
  webhooks: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  webhookLogs: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  broadcasts: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  qr: {
    data: any | null;
    loading: boolean;
    error: string | null;
  };
}

const initialState: OmniChannelState = {
  instances: { data: [], loading: false, error: null },
  conversations: { data: [], loading: false, error: null },
  currentConversation: { data: null, messages: [], loading: false, error: null },
  chatbots: { data: [], loading: false, error: null },
  currentChatbot: { data: null, loading: false, error: null },
  triggers: { data: [], loading: false, error: null },
  webhooks: { data: [], loading: false, error: null },
  webhookLogs: { data: [], loading: false, error: null },
  broadcasts: { data: [], loading: false, error: null },
  qr: { data: null, loading: false, error: null },
};

export const fetchOmniInstances = createAsyncThunk(
  'omni/fetchInstances',
  async (_, { rejectWithValue }) => {
    try {
      return await omniChatService.getInstances();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch instances');
    }
  }
);

export const createOmniInstanceThunk = createAsyncThunk(
  'omni/createInstance',
  async (data: any, { rejectWithValue }) => {
    try {
      return await omniChatService.createInstance(data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create instance');
    }
  }
);

export const deleteOmniInstanceThunk = createAsyncThunk(
  'omni/deleteInstance',
  async (id: string, { rejectWithValue }) => {
    try {
      return await omniChatService.deleteInstance(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete instance');
    }
  }
);

export const fetchWhatsAppQRThunk = createAsyncThunk(
  'omni/fetchQR',
  async (id: string, { rejectWithValue }) => {
    try {
      return await omniChatService.getWhatsAppQR(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch QR code');
    }
  }
);

export const fetchOmniConversations = createAsyncThunk(
  'omni/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      return await omniChatService.getConversations();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch conversations');
    }
  }
);

export const fetchOmniMessages = createAsyncThunk(
  'omni/fetchMessages',
  async (conversationId: string, { rejectWithValue }) => {
    try {
      return await omniChatService.getMessages(conversationId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch messages');
    }
  }
);

export const sendOmniMessageThunk = createAsyncThunk(
  'omni/sendMessage',
  async ({ conversationId, content, type }: { conversationId: string; content: string; type?: string }, { rejectWithValue }) => {
    try {
      return await omniChatService.sendMessage(conversationId, content, type);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send message');
    }
  }
);

export const assignOmniAgentThunk = createAsyncThunk(
  'omni/assignAgent',
  async ({ conversationId, agentId }: { conversationId: string; agentId: string }, { rejectWithValue }) => {
    try {
      return await omniChatService.assignAgent(conversationId, agentId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to assign agent');
    }
  }
);

export const updateOmniConversationThunk = createAsyncThunk(
  'omni/updateConversation',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      return await omniChatService.updateConversation(id, data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update conversation');
    }
  }
);

export const suggestOmniReplyThunk = createAsyncThunk(
  'omni/suggestReply',
  async (conversationId: string, { rejectWithValue }) => {
    try {
      return await omniChatService.suggestReply(conversationId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to suggest reply');
    }
  }
);

export const fetchOmniChatbots = createAsyncThunk(
  'omni/fetchChatbots',
  async (_, { rejectWithValue }) => {
    try {
      return await omniAutomationService.getChatbots();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch chatbots');
    }
  }
);

export const fetchOmniTriggersThunk = createAsyncThunk(
  'omni/fetchTriggers',
  async (_, { rejectWithValue }) => {
    try {
      return await omniAutomationService.getTriggers();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch triggers');
    }
  }
);

export const fetchOmniChatbotByIdThunk = createAsyncThunk(
  'omni/fetchChatbotById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await omniAutomationService.getChatbotById(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch chatbot');
    }
  }
);

export const updateOmniChatbotThunk = createAsyncThunk(
  'omni/updateChatbot',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      return await omniAutomationService.updateChatbot(id, data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update chatbot');
    }
  }
);

export const createBroadcastThunk = createAsyncThunk(
  'omnichannel/createBroadcast',
  async (data: any, { rejectWithValue }) => {
    try {
      return await omniMarketingService.createBroadcast(data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create broadcast');
    }
  }
);

export const fetchOmniWebhooks = createAsyncThunk(
  'omni/fetchWebhooks',
  async (_, { rejectWithValue }) => {
    try {
      return await omniAutomationService.getWebhooks();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch webhooks');
    }
  }
);

export const fetchOmniWebhookLogs = createAsyncThunk(
  'omni/fetchWebhookLogs',
  async (id: string, { rejectWithValue }) => {
    try {
      return await omniAutomationService.getWebhookLogs(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch webhook logs');
    }
  }
);

export const fetchOmniBroadcasts = createAsyncThunk(
  'omni/fetchBroadcasts',
  async (_, { rejectWithValue }) => {
    try {
      return await omniMarketingService.getBroadcasts();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch broadcasts');
    }
  }
);

const omniChannelSlice = createSlice({
  name: 'omnichannel',
  initialState,
  reducers: {
    setCurrentConversation: (state, action) => {
      state.currentConversation.data = action.payload;
      state.currentConversation.messages = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOmniInstances.pending, (state) => { state.instances.loading = true; })
      .addCase(fetchOmniInstances.fulfilled, (state, action) => {
        state.instances.data = action.payload;
        state.instances.loading = false;
      })
      .addCase(fetchOmniInstances.rejected, (state, action) => {
        state.instances.loading = false;
        state.instances.error = action.payload as string;
      })
      .addCase(fetchOmniTriggersThunk.pending, (state) => { state.triggers.loading = true; })
      .addCase(fetchOmniTriggersThunk.fulfilled, (state, action) => {
        state.triggers.data = action.payload;
        state.triggers.loading = false;
      })
      .addCase(fetchOmniTriggersThunk.rejected, (state, action) => {
        state.triggers.loading = false;
        state.triggers.error = action.payload as string;
      })
      .addCase(fetchWhatsAppQRThunk.pending, (state) => { state.qr.loading = true; })
      .addCase(fetchWhatsAppQRThunk.fulfilled, (state, action) => {
        state.qr.data = action.payload;
        state.qr.loading = false;
      })
      .addCase(fetchWhatsAppQRThunk.rejected, (state, action) => {
        state.qr.loading = false;
        state.qr.error = action.payload as string;
      })
      .addCase(fetchOmniConversations.pending, (state) => { state.conversations.loading = true; })
      .addCase(fetchOmniConversations.fulfilled, (state, action) => {
        state.conversations.data = action.payload;
        state.conversations.loading = false;
      })
      .addCase(fetchOmniConversations.rejected, (state, action) => {
        state.conversations.loading = false;
        state.conversations.error = action.payload as string;
      })
      .addCase(fetchOmniMessages.pending, (state) => { state.currentConversation.loading = true; })
      .addCase(fetchOmniMessages.fulfilled, (state, action) => {
        state.currentConversation.messages = action.payload;
        state.currentConversation.loading = false;
      })
      .addCase(fetchOmniMessages.rejected, (state, action) => {
        state.currentConversation.loading = false;
        state.currentConversation.error = action.payload as string;
      })
      .addCase(fetchOmniChatbots.pending, (state) => { state.chatbots.loading = true; })
      .addCase(fetchOmniChatbots.fulfilled, (state, action) => {
        state.chatbots.data = action.payload;
        state.chatbots.loading = false;
      })
      .addCase(fetchOmniChatbots.rejected, (state, action) => {
        state.chatbots.loading = false;
        state.chatbots.error = action.payload as string;
      })
      .addCase(fetchOmniChatbotByIdThunk.pending, (state) => { state.currentChatbot.loading = true; })
      .addCase(fetchOmniChatbotByIdThunk.fulfilled, (state, action) => {
        state.currentChatbot.data = action.payload;
        state.currentChatbot.loading = false;
      })
      .addCase(fetchOmniChatbotByIdThunk.rejected, (state, action) => {
        state.currentChatbot.loading = false;
        state.currentChatbot.error = action.payload as string;
      })
      .addCase(fetchOmniWebhooks.pending, (state) => { state.webhooks.loading = true; })
      .addCase(fetchOmniWebhooks.fulfilled, (state, action) => {
        state.webhooks.data = action.payload;
        state.webhooks.loading = false;
      })
      .addCase(fetchOmniWebhooks.rejected, (state, action) => {
        state.webhooks.loading = false;
        state.webhooks.error = action.payload as string;
      })
      .addCase(fetchOmniWebhookLogs.pending, (state) => { state.webhookLogs.loading = true; })
      .addCase(fetchOmniWebhookLogs.fulfilled, (state, action) => {
        state.webhookLogs.data = action.payload;
        state.webhookLogs.loading = false;
      })
      .addCase(fetchOmniWebhookLogs.rejected, (state, action) => {
        state.webhookLogs.loading = false;
        state.webhookLogs.error = action.payload as string;
      })
      .addCase(fetchOmniBroadcasts.pending, (state) => { state.broadcasts.loading = true; })
      .addCase(fetchOmniBroadcasts.fulfilled, (state, action) => {
        state.broadcasts.data = action.payload;
        state.broadcasts.loading = false;
      })
      .addCase(fetchOmniBroadcasts.rejected, (state, action) => {
        state.broadcasts.loading = false;
        state.broadcasts.error = action.payload as string;
      });
  },
});

export const { setCurrentConversation } = omniChannelSlice.actions;
export default omniChannelSlice.reducer;
export const selectOmni = (state: RootState) => state.omnichannel;
