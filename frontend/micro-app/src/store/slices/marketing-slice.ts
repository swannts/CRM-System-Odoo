import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  marketingService as odooMarketingService, 
  MarketingCampaign as OdooMarketingCampaign, 
  MarketingAnalytics as OdooMarketingAnalytics,
  MarketingCampaignInsights as OdooMarketingCampaignInsights,
  MarketingSource as OdooMarketingSource,
  MarketingMedium as OdooMarketingMedium
} from 'src/services/marketing-service';
import { 
  marketingService as localMarketingService 
} from 'src/sections/marketing/services/marketing-service';
import { 
  emailSequenceService,
  EmailSequence,
} from 'src/sections/marketing/services/email-sequence-service';
import {
  omniMarketingService
} from 'src/services/omni-service';
import { 
  MarketingCampaign as LocalMarketingCampaign,
  MarketingSegment,
  MarketingTemplate,
  MarketingSummary
} from 'src/sections/marketing/types';
import { RootState } from '../index';

export interface OmniBroadcast {
  id: string;
  name: string;
  provider: string;
  status: string;
  createdAt: string;
  scheduledAt?: string;
  sentCount: number;
  errorCount: number;
}

export interface CampaignCompliance {
  compliantRecipients: number;
  totalRecipients: number;
  message?: string;
  isFallback?: boolean;
}

export interface SenderStatus {
  configured: boolean;
  domain?: string;
  reputation?: number;
  isFallback?: boolean;
}

export interface MarketingActivity {
  id: string;
  type: string;
  description: string;
  occurredAt: string;
  [key: string]: any;
}

export interface TemplateUsage {
  id: string;
  templateId: string;
  templateNameSnapshot?: string;
  appliedAt: string;
  [key: string]: any;
}

export interface DeliveryEvent {
  id: string;
  eventType: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complaint';
  occurredAt: string;
  recipientEmail?: string;
  recipientPhone?: string;
  [key: string]: any;
}

interface MarketingState {
  // Odoo Marketing (Workspace)
  odooCampaigns: {
    data: OdooMarketingCampaign[];
    total: number;
    loading: boolean;
    error: string | null;
  };
  odooAnalytics: {
    data: OdooMarketingAnalytics | null;
    loading: boolean;
    error: string | null;
  };
  odooInsights: {
    data: OdooMarketingCampaignInsights | null;
    loading: boolean;
    error: string | null;
  };
  odooSources: {
    data: OdooMarketingSource[];
    total: number;
    loading: boolean;
    error: string | null;
  };
  odooMediums: {
    data: OdooMarketingMedium[];
    total: number;
    loading: boolean;
    error: string | null;
  };

  // Local Marketing (Campaign Builder / Details)
  localCampaigns: {
    data: LocalMarketingCampaign[];
    loading: boolean;
    error: string | null;
  };
  currentLocalCampaign: {
    data: LocalMarketingCampaign | null;
    loading: boolean;
    error: string | null;
  };
  segments: {
    data: MarketingSegment[];
    loading: boolean;
    error: string | null;
  };
  templates: {
    data: MarketingTemplate[];
    loading: boolean;
    error: string | null;
  };
  summary: {
    data: MarketingSummary | null;
    loading: boolean;
    error: string | null;
  };
  activity: {
    data: MarketingActivity[];
    loading: boolean;
    error: string | null;
  };
  templateUsage: {
    data: TemplateUsage[];
    loading: boolean;
    error: string | null;
  };
  deliveryEvents: {
    data: DeliveryEvent[];
    loading: boolean;
    error: string | null;
  };
  overallAnalytics: {
    data: any | null;
    loading: boolean;
    error: string | null;
  };
  sequences: {
    data: EmailSequence[];
    loading: boolean;
    error: string | null;
  };
  enrollments: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  omniBroadcasts: {
    data: OmniBroadcast[];
    loading: boolean;
    error: string | null;
  };
  compliance: {
    data: CampaignCompliance | null;
    loading: boolean;
    error: string | null;
  };
  senderStatus: {
    data: SenderStatus | null;
    loading: boolean;
    error: string | null;
  };
}

const initialState: MarketingState = {
  odooCampaigns: {
    data: [],
    total: 0,
    loading: false,
    error: null,
  },
  odooAnalytics: {
    data: null,
    loading: false,
    error: null,
  },
  odooInsights: {
    data: null,
    loading: false,
    error: null,
  },
  odooSources: {
    data: [],
    total: 0,
    loading: false,
    error: null,
  },
  odooMediums: {
    data: [],
    total: 0,
    loading: false,
    error: null,
  },
  localCampaigns: {
    data: [],
    loading: false,
    error: null,
  },
  currentLocalCampaign: {
    data: null,
    loading: false,
    error: null,
  },
  segments: {
    data: [],
    loading: false,
    error: null,
  },
  templates: {
    data: [],
    loading: false,
    error: null,
  },
  summary: {
    data: null,
    loading: false,
    error: null,
  },
  activity: {
    data: [],
    loading: false,
    error: null,
  },
  templateUsage: {
    data: [],
    loading: false,
    error: null,
  },
  deliveryEvents: {
    data: [],
    loading: false,
    error: null,
  },
  overallAnalytics: {
    data: null,
    loading: false,
    error: null,
  },
  sequences: {
    data: [],
    loading: false,
    error: null,
  },
  enrollments: {
    data: [],
    loading: false,
    error: null,
  },
  omniBroadcasts: {
    data: [],
    loading: false,
    error: null,
  },
  compliance: {
    data: null,
    loading: false,
    error: null,
  },
  senderStatus: {
    data: null,
    loading: false,
    error: null,
  },
};

// --- Odoo Thunks ---
export const fetchOdooCampaigns = createAsyncThunk(
  'marketing/fetchOdooCampaigns',
  async (params: { page?: number; pageSize?: number; search?: string } | undefined, { rejectWithValue }) => {
    try {
      return await odooMarketingService.getCampaignsPage(params);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch Odoo campaigns');
    }
  }
);

export const fetchOdooAnalytics = createAsyncThunk(
  'marketing/fetchOdooAnalytics',
  async (params: { dateFrom?: string; dateTo?: string } | undefined, { rejectWithValue }) => {
    try {
      return await odooMarketingService.getAnalytics(params);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch Odoo marketing analytics');
    }
  }
);

export const fetchOdooInsights = createAsyncThunk(
  'marketing/fetchOdooInsights',
  async ({ id, params }: { id: string; params?: { page?: number; pageSize?: number } }, { rejectWithValue }) => {
    try {
      return await odooMarketingService.getCampaignInsights(id, params);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch Odoo campaign insights');
    }
  }
);

export const fetchOdooSources = createAsyncThunk(
  'marketing/fetchOdooSources',
  async (params: { page?: number; pageSize?: number; search?: string } | undefined, { rejectWithValue }) => {
    try {
      return await odooMarketingService.getSourcesPage(params);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch Odoo sources');
    }
  }
);

export const fetchOdooMediums = createAsyncThunk(
  'marketing/fetchOdooMediums',
  async (params: { page?: number; pageSize?: number; search?: string } | undefined, { rejectWithValue }) => {
    try {
      return await odooMarketingService.getMediumsPage(params);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch Odoo mediums');
    }
  }
);

// --- Local Thunks ---
export const fetchLocalCampaigns = createAsyncThunk(
  'marketing/fetchLocalCampaigns',
  async (_, { rejectWithValue }) => {
    try {
      return await localMarketingService.getCampaigns();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch local campaigns');
    }
  }
);

export const fetchLocalCampaign = createAsyncThunk(
  'marketing/fetchLocalCampaign',
  async (id: string, { rejectWithValue }) => {
    try {
      return await localMarketingService.getCampaign(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch local campaign');
    }
  }
);

export const fetchSegments = createAsyncThunk(
  'marketing/fetchSegments',
  async (_, { rejectWithValue }) => {
    try {
      return await localMarketingService.getSegments();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch segments');
    }
  }
);

export const fetchTemplates = createAsyncThunk(
  'marketing/fetchTemplates',
  async (_, { rejectWithValue }) => {
    try {
      return await localMarketingService.getTemplates();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch templates');
    }
  }
);

export const fetchSummary = createAsyncThunk(
  'marketing/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      return await localMarketingService.getSummary();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch summary');
    }
  }
);

export const fetchActivity = createAsyncThunk(
  'marketing/fetchActivity',
  async (_, { rejectWithValue }) => {
    try {
      return await localMarketingService.getActivity();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch activity');
    }
  }
);

export const fetchTemplateUsage = createAsyncThunk(
  'marketing/fetchTemplateUsage',
  async (id: string, { rejectWithValue }) => {
    try {
      return await localMarketingService.getCampaignTemplateUsage(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch template usage');
    }
  }
);

export const fetchDeliveryEvents = createAsyncThunk(
  'marketing/fetchDeliveryEvents',
  async (id: string, { rejectWithValue }) => {
    try {
      return await localMarketingService.getCampaignDeliveryEvents(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch delivery events');
    }
  }
);

export const createSegment = createAsyncThunk(
  'marketing/createSegment',
  async (data: Partial<MarketingSegment>, { rejectWithValue }) => {
    try {
      return await localMarketingService.createSegment(data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create segment');
    }
  }
);

export const updateSegment = createAsyncThunk(
  'marketing/updateSegment',
  async ({ id, data }: { id: string; data: Partial<MarketingSegment> }, { rejectWithValue }) => {
    try {
      return await localMarketingService.updateSegment(id, data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update segment');
    }
  }
);

export const deleteSegment = createAsyncThunk(
  'marketing/deleteSegment',
  async (id: string, { rejectWithValue }) => {
    try {
      await localMarketingService.deleteSegment(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete segment');
    }
  }
);

export const createTemplate = createAsyncThunk(
  'marketing/createTemplate',
  async (data: Partial<MarketingTemplate>, { rejectWithValue }) => {
    try {
      return await localMarketingService.createTemplate(data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create template');
    }
  }
);

export const duplicateTemplate = createAsyncThunk(
  'marketing/duplicateTemplate',
  async (id: string, { rejectWithValue }) => {
    try {
      return await localMarketingService.duplicateTemplate(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to duplicate template');
    }
  }
);

export const deleteTemplate = createAsyncThunk(
  'marketing/deleteTemplate',
  async (id: string, { rejectWithValue }) => {
    try {
      await localMarketingService.deleteTemplate(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete template');
    }
  }
);

export const fetchOverallAnalytics = createAsyncThunk(
  'marketing/fetchOverallAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      return await localMarketingService.getOverallAnalytics();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch overall analytics');
    }
  }
);

export const fetchSequences = createAsyncThunk(
  'marketing/fetchSequences',
  async (_, { rejectWithValue }) => {
    try {
      return await emailSequenceService.list();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch sequences');
    }
  }
);

export const fetchEnrollments = createAsyncThunk(
  'marketing/fetchEnrollments',
  async (sequenceId: string, { rejectWithValue }) => {
    try {
      return await emailSequenceService.listEnrollments(sequenceId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch enrollments');
    }
  }
);

export const fetchBroadcasts = createAsyncThunk(
  'marketing/fetchBroadcasts',
  async (_, { rejectWithValue }) => {
    try {
      return await omniMarketingService.getBroadcasts();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch broadcasts');
    }
  }
);

export const fetchCampaignCompliance = createAsyncThunk(
  'marketing/fetchCampaignCompliance',
  async (id: string, { rejectWithValue }) => {
    try {
      return await localMarketingService.getCampaignComplianceStatus(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch compliance status');
    }
  }
);

export const fetchSenderStatus = createAsyncThunk(
  'marketing/fetchSenderStatus',
  async (_, { rejectWithValue }) => {
    try {
      return await localMarketingService.getSenderStatus();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch sender status');
    }
  }
);

export const createSequence = createAsyncThunk(
  'marketing/createSequence',
  async (payload: Partial<EmailSequence>, { rejectWithValue }) => {
    try {
      return await emailSequenceService.create(payload);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create sequence');
    }
  }
);

export const updateSequence = createAsyncThunk(
  'marketing/updateSequence',
  async ({ id, payload }: { id: string; payload: Partial<EmailSequence> }, { rejectWithValue }) => {
    try {
      return await emailSequenceService.update(id, payload);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update sequence');
    }
  }
);

export const deleteSequence = createAsyncThunk(
  'marketing/deleteSequence',
  async (id: string, { rejectWithValue }) => {
    try {
      await emailSequenceService.remove(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete sequence');
    }
  }
);

export const enrollInSequence = createAsyncThunk(
  'marketing/enrollInSequence',
  async ({ id, payload }: { id: string; payload: any }, { rejectWithValue }) => {
    try {
      return await emailSequenceService.enroll(id, payload);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to enroll in sequence');
    }
  }
);

export const sequenceEnrollmentAction = createAsyncThunk(
  'marketing/sequenceEnrollmentAction',
  async ({ id, action }: { id: string; action: 'pause' | 'resume' | 'cancel' }, { rejectWithValue }) => {
    try {
      if (action === 'pause') return await emailSequenceService.pauseEnrollment(id);
      if (action === 'resume') return await emailSequenceService.resumeEnrollment(id);
      return await emailSequenceService.cancelEnrollment(id);
    } catch (error: any) {
      return rejectWithValue(error.message || `Failed to ${action} enrollment`);
    }
  }
);

export const createLocalCampaign = createAsyncThunk(
  'marketing/createLocalCampaign',
  async (data: Partial<MarketingCampaign>, { rejectWithValue }) => {
    try {
      return await localMarketingService.createCampaign(data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create campaign');
    }
  }
);

export const createOdooCampaign = createAsyncThunk(
  'marketing/createOdooCampaign',
  async (payload: { name: string }, { rejectWithValue }) => {
    try {
      return await odooMarketingService.createCampaign(payload);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create campaign');
    }
  }
);

export const updateOdooCampaign = createAsyncThunk(
  'marketing/updateOdooCampaign',
  async ({ id, name }: { id: string; name: string }, { rejectWithValue }) => {
    try {
      return await odooMarketingService.updateCampaign(id, { name });
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update campaign');
    }
  }
);

export const setOdooCampaignAction = createAsyncThunk(
  'marketing/setOdooCampaignAction',
  async ({ id, action }: { id: string; action: 'launch' | 'pause' | 'archive' }, { rejectWithValue }) => {
    try {
      return await odooMarketingService.setCampaignAction(id, action);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update campaign status');
    }
  }
);

export const createOdooSource = createAsyncThunk(
  'marketing/createOdooSource',
  async (payload: { name: string }, { rejectWithValue }) => {
    try {
      return await odooMarketingService.createSource(payload);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create source');
    }
  }
);

export const updateOdooSource = createAsyncThunk(
  'marketing/updateOdooSource',
  async ({ id, name, active }: { id: string; name?: string; active?: boolean }, { rejectWithValue }) => {
    try {
      return await odooMarketingService.updateSource(id, { name, active });
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update source');
    }
  }
);

export const deleteOdooSource = createAsyncThunk(
  'marketing/deleteOdooSource',
  async (id: string, { rejectWithValue }) => {
    try {
      await odooMarketingService.deleteSource(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete source');
    }
  }
);

export const createOdooMedium = createAsyncThunk(
  'marketing/createOdooMedium',
  async (payload: { name: string }, { rejectWithValue }) => {
    try {
      return await odooMarketingService.createMedium(payload);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create medium');
    }
  }
);

export const updateOdooMedium = createAsyncThunk(
  'marketing/updateOdooMedium',
  async ({ id, name, active }: { id: string; name?: string; active?: boolean }, { rejectWithValue }) => {
    try {
      return await odooMarketingService.updateMedium(id, { name, active });
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update medium');
    }
  }
);

export const deleteOdooMedium = createAsyncThunk(
  'marketing/deleteOdooMedium',
  async (id: string, { rejectWithValue }) => {
    try {
      await odooMarketingService.deleteMedium(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete medium');
    }
  }
);

const marketingSlice = createSlice({
  name: 'marketing',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOdooCampaigns.pending, (state) => {
        state.odooCampaigns.loading = true;
      })
      .addCase(fetchOdooCampaigns.fulfilled, (state, action) => {
        state.odooCampaigns.data = action.payload.items;
        state.odooCampaigns.total = action.payload.total;
        state.odooCampaigns.loading = false;
      })
      .addCase(fetchOdooCampaigns.rejected, (state, action) => {
        state.odooCampaigns.loading = false;
        state.odooCampaigns.error = action.payload as string;
      })
      .addCase(fetchOdooAnalytics.pending, (state) => {
        state.odooAnalytics.loading = true;
      })
      .addCase(fetchOdooAnalytics.fulfilled, (state, action) => {
        state.odooAnalytics.data = action.payload;
        state.odooAnalytics.loading = false;
      })
      .addCase(fetchOdooAnalytics.rejected, (state, action) => {
        state.odooAnalytics.loading = false;
        state.odooAnalytics.error = action.payload as string;
      })
      .addCase(fetchOdooInsights.pending, (state) => {
        state.odooInsights.loading = true;
      })
      .addCase(fetchOdooInsights.fulfilled, (state, action) => {
        state.odooInsights.data = action.payload;
        state.odooInsights.loading = false;
      })
      .addCase(fetchOdooInsights.rejected, (state, action) => {
        state.odooInsights.loading = false;
        state.odooInsights.error = action.payload as string;
      })
      .addCase(fetchOdooSources.pending, (state) => {
        state.odooSources.loading = true;
      })
      .addCase(fetchOdooSources.fulfilled, (state, action) => {
        state.odooSources.data = action.payload.items;
        state.odooSources.total = action.payload.total;
        state.odooSources.loading = false;
      })
      .addCase(fetchOdooSources.rejected, (state, action) => {
        state.odooSources.loading = false;
        state.odooSources.error = action.payload as string;
      })
      .addCase(fetchOdooMediums.pending, (state) => {
        state.odooMediums.loading = true;
      })
      .addCase(fetchOdooMediums.fulfilled, (state, action) => {
        state.odooMediums.data = action.payload.items;
        state.odooMediums.total = action.payload.total;
        state.odooMediums.loading = false;
      })
      .addCase(fetchOdooMediums.rejected, (state, action) => {
        state.odooMediums.loading = false;
        state.odooMediums.error = action.payload as string;
      })
      .addCase(fetchLocalCampaigns.pending, (state) => {
        state.localCampaigns.loading = true;
      })
      .addCase(fetchLocalCampaigns.fulfilled, (state, action) => {
        state.localCampaigns.data = action.payload;
        state.localCampaigns.loading = false;
      })
      .addCase(fetchLocalCampaigns.rejected, (state, action) => {
        state.localCampaigns.loading = false;
        state.localCampaigns.error = action.payload as string;
      })
      .addCase(fetchLocalCampaign.pending, (state) => {
        state.currentLocalCampaign.loading = true;
      })
      .addCase(fetchLocalCampaign.fulfilled, (state, action) => {
        state.currentLocalCampaign.data = action.payload;
        state.currentLocalCampaign.loading = false;
      })
      .addCase(fetchLocalCampaign.rejected, (state, action) => {
        state.currentLocalCampaign.loading = false;
        state.currentLocalCampaign.error = action.payload as string;
      })
      .addCase(fetchSegments.pending, (state) => {
        state.segments.loading = true;
      })
      .addCase(fetchSegments.fulfilled, (state, action) => {
        state.segments.data = action.payload;
        state.segments.loading = false;
      })
      .addCase(fetchSegments.rejected, (state, action) => {
        state.segments.loading = false;
        state.segments.error = action.payload as string;
      })
      .addCase(fetchTemplates.pending, (state) => {
        state.templates.loading = true;
      })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.templates.data = action.payload;
        state.templates.loading = false;
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.templates.loading = false;
        state.templates.error = action.payload as string;
      })
      .addCase(fetchSummary.pending, (state) => {
        state.summary.loading = true;
      })
      .addCase(fetchSummary.fulfilled, (state, action) => {
        state.summary.data = action.payload;
        state.summary.loading = false;
      })
      .addCase(fetchSummary.rejected, (state, action) => {
        state.summary.loading = false;
        state.summary.error = action.payload as string;
      })
      .addCase(fetchActivity.pending, (state) => {
        state.activity.loading = true;
      })
      .addCase(fetchActivity.fulfilled, (state, action) => {
        state.activity.data = action.payload;
        state.activity.loading = false;
      })
      .addCase(fetchActivity.rejected, (state, action) => {
        state.activity.loading = false;
        state.activity.error = action.payload as string;
      })
      .addCase(fetchTemplateUsage.pending, (state) => {
        state.templateUsage.loading = true;
      })
      .addCase(fetchTemplateUsage.fulfilled, (state, action) => {
        state.templateUsage.data = action.payload;
        state.templateUsage.loading = false;
      })
      .addCase(fetchTemplateUsage.rejected, (state, action) => {
        state.templateUsage.loading = false;
        state.templateUsage.error = action.payload as string;
      })
      .addCase(fetchDeliveryEvents.pending, (state) => {
        state.deliveryEvents.loading = true;
      })
      .addCase(fetchDeliveryEvents.fulfilled, (state, action) => {
        state.deliveryEvents.data = action.payload;
        state.deliveryEvents.loading = false;
      })
      .addCase(fetchDeliveryEvents.rejected, (state, action) => {
        state.deliveryEvents.loading = false;
        state.deliveryEvents.error = action.payload as string;
      })
      .addCase(fetchOverallAnalytics.pending, (state) => {
        state.overallAnalytics.loading = true;
      })
      .addCase(fetchOverallAnalytics.fulfilled, (state, action) => {
        state.overallAnalytics.data = action.payload;
        state.overallAnalytics.loading = false;
      })
      .addCase(fetchOverallAnalytics.rejected, (state, action) => {
        state.overallAnalytics.loading = false;
        state.overallAnalytics.error = action.payload as string;
      })
      .addCase(fetchSequences.pending, (state) => {
        state.sequences.loading = true;
      })
      .addCase(fetchSequences.fulfilled, (state, action) => {
        state.sequences.data = action.payload;
        state.sequences.loading = false;
      })
      .addCase(fetchSequences.rejected, (state, action) => {
        state.sequences.loading = false;
        state.sequences.error = action.payload as string;
      })
      .addCase(fetchEnrollments.pending, (state) => {
        state.enrollments.loading = true;
      })
      .addCase(fetchEnrollments.fulfilled, (state, action) => {
        state.enrollments.data = action.payload;
        state.enrollments.loading = false;
      })
      .addCase(fetchEnrollments.rejected, (state, action) => {
        state.enrollments.loading = false;
        state.enrollments.error = action.payload as string;
      })
      .addCase(fetchBroadcasts.pending, (state) => {
        state.omniBroadcasts.loading = true;
      })
      .addCase(fetchBroadcasts.fulfilled, (state, action) => {
        state.omniBroadcasts.data = action.payload;
        state.omniBroadcasts.loading = false;
      })
      .addCase(fetchBroadcasts.rejected, (state, action) => {
        state.omniBroadcasts.loading = false;
        state.omniBroadcasts.error = action.payload as string;
      })
      .addCase(fetchCampaignCompliance.pending, (state) => {
        state.compliance.loading = true;
      })
      .addCase(fetchCampaignCompliance.fulfilled, (state, action) => {
        state.compliance.data = action.payload;
        state.compliance.loading = false;
      })
      .addCase(fetchCampaignCompliance.rejected, (state, action) => {
        state.compliance.loading = false;
        state.compliance.error = action.payload as string;
      })
      .addCase(fetchSenderStatus.pending, (state) => {
        state.senderStatus.loading = true;
      })
      .addCase(fetchSenderStatus.fulfilled, (state, action) => {
        state.senderStatus.data = action.payload;
        state.senderStatus.loading = false;
      })
      .addCase(fetchSenderStatus.rejected, (state, action) => {
        state.senderStatus.loading = false;
        state.senderStatus.error = action.payload as string;
      })
      .addCase(createSegment.fulfilled, (state, action) => {
        state.segments.data.push(action.payload);
      })
      .addCase(updateSegment.fulfilled, (state, action) => {
        const index = state.segments.data.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) {
          state.segments.data[index] = action.payload;
        }
      })
      .addCase(deleteSegment.fulfilled, (state, action) => {
        state.segments.data = state.segments.data.filter((s) => s.id !== action.payload);
      })
      .addCase(createTemplate.fulfilled, (state, action) => {
        state.templates.data.push(action.payload);
      })
      .addCase(duplicateTemplate.fulfilled, (state, action) => {
        state.templates.data.push(action.payload);
      })
      .addCase(deleteTemplate.fulfilled, (state, action) => {
        state.templates.data = state.templates.data.filter((t) => t.id !== action.payload);
      })
      .addCase(createLocalCampaign.fulfilled, (state, action) => {
        state.localCampaigns.data.push(action.payload);
      })
      .addCase(createOdooCampaign.fulfilled, (state, action) => {
        state.odooCampaigns.data.unshift(action.payload);
      })
      .addCase(createSequence.fulfilled, (state, action) => {
        state.sequences.data.unshift(action.payload);
      })
      .addCase(updateSequence.fulfilled, (state, action) => {
        const index = state.sequences.data.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) state.sequences.data[index] = action.payload;
      })
      .addCase(deleteSequence.fulfilled, (state, action) => {
        state.sequences.data = state.sequences.data.filter((s) => s.id !== action.payload);
      })
      .addCase(sequenceEnrollmentAction.fulfilled, (state, action) => {
        const index = state.enrollments.data.findIndex((e) => e.id === action.payload.id);
        if (index !== -1) state.enrollments.data[index] = action.payload;
      })
      .addCase(updateOdooCampaign.fulfilled, (state, action) => {
        const index = state.odooCampaigns.data.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) state.odooCampaigns.data[index] = action.payload;
      })
      .addCase(setOdooCampaignAction.fulfilled, (state, action) => {
        const index = state.odooCampaigns.data.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) state.odooCampaigns.data[index] = action.payload;
      })
      .addCase(createOdooSource.fulfilled, (state, action) => {
        state.odooSources.data.unshift(action.payload);
      })
      .addCase(updateOdooSource.fulfilled, (state, action) => {
        const index = state.odooSources.data.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) state.odooSources.data[index] = action.payload;
      })
      .addCase(deleteOdooSource.fulfilled, (state, action) => {
        state.odooSources.data = state.odooSources.data.filter((s) => s.id !== action.payload);
      })
      .addCase(createOdooMedium.fulfilled, (state, action) => {
        state.odooMediums.data.unshift(action.payload);
      })
      .addCase(updateOdooMedium.fulfilled, (state, action) => {
        const index = state.odooMediums.data.findIndex((m) => m.id === action.payload.id);
        if (index !== -1) state.odooMediums.data[index] = action.payload;
      })
      .addCase(deleteOdooMedium.fulfilled, (state, action) => {
        state.odooMediums.data = state.odooMediums.data.filter((m) => m.id !== action.payload);
      });
  },
});

export default marketingSlice.reducer;

export const selectMarketing = (state: RootState) => state.marketing;
