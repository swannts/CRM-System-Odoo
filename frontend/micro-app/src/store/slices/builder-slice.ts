import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { builderService } from 'src/services/builder-service';
import { marketingService } from 'src/services/marketing-service';
import { RootState } from '../index';

interface BuilderState {
  websites: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  currentWebsite: {
    data: any | null;
    loading: boolean;
    error: string | null;
  };
  websitePreview: {
    data: any | null;
    loading: boolean;
    error: string | null;
  };
  forms: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  formTemplates: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  formPreview: {
    data: any | null;
    loading: boolean;
    error: string | null;
  };
  emailCampaigns: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  workflowWorkspaces: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  reputationStats: {
    data: any | null;
    loading: boolean;
    error: string | null;
  };
}

const initialState: BuilderState = {
  websites: { data: [], loading: false, error: null },
  currentWebsite: { data: null, loading: false, error: null },
  websitePreview: { data: null, loading: false, error: null },
  forms: { data: [], loading: false, error: null },
  formTemplates: { data: [], loading: false, error: null },
  formPreview: { data: null, loading: false, error: null },
  emailCampaigns: { data: [], loading: false, error: null },
  workflowWorkspaces: { data: [], loading: false, error: null },
  reputationStats: { data: null, loading: false, error: null },
};

export const fetchBuilderWebsitesThunk = createAsyncThunk(
  'builder/fetchWebsites',
  async (_, { rejectWithValue }) => {
    try {
      return await builderService.getWebsites();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch websites');
    }
  }
);

export const fetchBuilderWebsiteThunk = createAsyncThunk(
  'builder/fetchWebsite',
  async (id: string, { rejectWithValue }) => {
    try {
      return await builderService.getWebsite(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch website');
    }
  }
);

export const fetchBuilderWebsitePreviewThunk = createAsyncThunk(
  'builder/fetchWebsitePreview',
  async ({ websiteId, pageSlug }: { websiteId: string; pageSlug?: string }, { rejectWithValue }) => {
    try {
      return await builderService.getWebsitePreviewData(websiteId, pageSlug);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch website preview');
    }
  }
);

export const fetchBuilderFormsThunk = createAsyncThunk(
  'builder/fetchForms',
  async (_, { rejectWithValue }) => {
    try {
      return await builderService.getForms();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch forms');
    }
  }
);

export const fetchBuilderFormTemplatesThunk = createAsyncThunk(
  'builder/fetchFormTemplates',
  async (_, { rejectWithValue }) => {
    try {
      return await builderService.getFormTemplates();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch form templates');
    }
  }
);

export const fetchBuilderFormPreviewThunk = createAsyncThunk(
  'builder/fetchFormPreview',
  async (id: string, { rejectWithValue }) => {
    try {
      return await builderService.getFormPreview(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch form preview');
    }
  }
);

export const fetchBuilderEmailCampaignsThunk = createAsyncThunk(
  'builder/fetchEmailCampaigns',
  async (_, { rejectWithValue }) => {
    try {
      return await marketingService.getCampaigns();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch email campaigns');
    }
  }
);

export const fetchBuilderWorkflowWorkspacesThunk = createAsyncThunk(
  'builder/fetchWorkflowWorkspaces',
  async (_, { rejectWithValue }) => {
    try {
      return await marketingService.getWorkflowWorkspaces();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch workflow workspaces');
    }
  }
);

export const fetchBuilderReputationStatsThunk = createAsyncThunk(
  'builder/fetchReputationStats',
  async (_, { rejectWithValue }) => {
    try {
      return await builderService.getReputationDashboardStats();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch reputation stats');
    }
  }
);

export const createBuilderFormThunk = createAsyncThunk(
  'builder/createForm',
  async (values: any, { rejectWithValue }) => {
    try {
      return await builderService.createForm(values);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create form');
    }
  }
);

export const createBuilderWebsiteThunk = createAsyncThunk(
  'builder/createWebsite',
  async (values: any, { rejectWithValue }) => {
    try {
      return await builderService.createWebsite(values);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create website');
    }
  }
);

const builderSlice = createSlice({
  name: 'builder',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBuilderWebsitesThunk.pending, (state) => { state.websites.loading = true; })
      .addCase(fetchBuilderWebsitesThunk.fulfilled, (state, action) => {
        state.websites.data = action.payload;
        state.websites.loading = false;
      })
      .addCase(fetchBuilderWebsitesThunk.rejected, (state, action) => {
        state.websites.loading = false;
        state.websites.error = action.payload as string;
      })
      .addCase(fetchBuilderWebsiteThunk.pending, (state) => { state.currentWebsite.loading = true; })
      .addCase(fetchBuilderWebsiteThunk.fulfilled, (state, action) => {
        state.currentWebsite.data = action.payload;
        state.currentWebsite.loading = false;
      })
      .addCase(fetchBuilderWebsiteThunk.rejected, (state, action) => {
        state.currentWebsite.loading = false;
        state.currentWebsite.error = action.payload as string;
      })
      .addCase(fetchBuilderWebsitePreviewThunk.pending, (state) => { state.websitePreview.loading = true; })
      .addCase(fetchBuilderWebsitePreviewThunk.fulfilled, (state, action) => {
        state.websitePreview.data = action.payload;
        state.websitePreview.loading = false;
      })
      .addCase(fetchBuilderWebsitePreviewThunk.rejected, (state, action) => {
        state.websitePreview.loading = false;
        state.websitePreview.error = action.payload as string;
      })
      .addCase(fetchBuilderFormsThunk.pending, (state) => { state.forms.loading = true; })
      .addCase(fetchBuilderFormsThunk.fulfilled, (state, action) => {
        state.forms.data = action.payload;
        state.forms.loading = false;
      })
      .addCase(fetchBuilderFormsThunk.rejected, (state, action) => {
        state.forms.loading = false;
        state.forms.error = action.payload as string;
      })
      .addCase(fetchBuilderFormTemplatesThunk.pending, (state) => { state.formTemplates.loading = true; })
      .addCase(fetchBuilderFormTemplatesThunk.fulfilled, (state, action) => {
        state.formTemplates.data = action.payload;
        state.formTemplates.loading = false;
      })
      .addCase(fetchBuilderFormTemplatesThunk.rejected, (state, action) => {
        state.formTemplates.loading = false;
        state.formTemplates.error = action.payload as string;
      })
      .addCase(fetchBuilderFormPreviewThunk.pending, (state) => { state.formPreview.loading = true; })
      .addCase(fetchBuilderFormPreviewThunk.fulfilled, (state, action) => {
        state.formPreview.data = action.payload;
        state.formPreview.loading = false;
      })
      .addCase(fetchBuilderFormPreviewThunk.rejected, (state, action) => {
        state.formPreview.loading = false;
        state.formPreview.error = action.payload as string;
      })
      .addCase(fetchBuilderEmailCampaignsThunk.pending, (state) => { state.emailCampaigns.loading = true; })
      .addCase(fetchBuilderEmailCampaignsThunk.fulfilled, (state, action) => {
        state.emailCampaigns.data = action.payload;
        state.emailCampaigns.loading = false;
      })
      .addCase(fetchBuilderEmailCampaignsThunk.rejected, (state, action) => {
        state.emailCampaigns.loading = false;
        state.emailCampaigns.error = action.payload as string;
      })
      .addCase(fetchBuilderWorkflowWorkspacesThunk.pending, (state) => { state.workflowWorkspaces.loading = true; })
      .addCase(fetchBuilderWorkflowWorkspacesThunk.fulfilled, (state, action) => {
        state.workflowWorkspaces.data = action.payload;
        state.workflowWorkspaces.loading = false;
      })
      .addCase(fetchBuilderWorkflowWorkspacesThunk.rejected, (state, action) => {
        state.workflowWorkspaces.loading = false;
        state.workflowWorkspaces.error = action.payload as string;
      })
      .addCase(fetchBuilderReputationStatsThunk.pending, (state) => { state.reputationStats.loading = true; })
      .addCase(fetchBuilderReputationStatsThunk.fulfilled, (state, action) => {
        state.reputationStats.data = action.payload;
        state.reputationStats.loading = false;
      })
      .addCase(fetchBuilderReputationStatsThunk.rejected, (state, action) => {
        state.reputationStats.loading = false;
        state.reputationStats.error = action.payload as string;
      });
  },
});

export default builderSlice.reducer;
export const selectBuilder = (state: RootState) => state.builder;
