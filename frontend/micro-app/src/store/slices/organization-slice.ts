import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { organizationService } from 'src/services/organization-service';
import { RootState } from '../index';

interface OrganizationState {
  accessUsers: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  rbacCatalog: {
    data: any | null;
    loading: boolean;
    error: string | null;
  };
  orgDetails: {
    data: any | null;
    loading: boolean;
    error: string | null;
  };
  locations: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  membership: {
    data: any | null;
    loading: boolean;
    error: string | null;
  };
  workspace: {
    data: any | null;
    loading: boolean;
    error: string | null;
  };
  teams: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  pipelines: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  customFields: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  automationRules: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  mutationLoading: boolean;
}

const initialState: OrganizationState = {
  accessUsers: { data: [], loading: false, error: null },
  rbacCatalog: { data: null, loading: false, error: null },
  orgDetails: { data: null, loading: false, error: null },
  locations: { data: [], loading: false, error: null },
  membership: { data: null, loading: false, error: null },
  workspace: { data: null, loading: false, error: null },
  teams: { data: [], loading: false, error: null },
  pipelines: { data: [], loading: false, error: null },
  customFields: { data: [], loading: false, error: null },
  automationRules: { data: [], loading: false, error: null },
  mutationLoading: false,
};

export const fetchOrgAccessUsersThunk = createAsyncThunk(
  'organization/fetchAccessUsers',
  async (params: { search?: string } | undefined, { rejectWithValue }) => {
    try {
      return await organizationService.getAccessUsers(params);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch organization users');
    }
  }
);

export const fetchOrgRbacCatalogThunk = createAsyncThunk(
  'organization/fetchRbacCatalog',
  async (_, { rejectWithValue }) => {
    try {
      return await organizationService.getRbacCatalog();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch RBAC catalog');
    }
  }
);

export const fetchOrgDetailsThunk = createAsyncThunk(
  'organization/fetchDetails',
  async (_, { rejectWithValue }) => {
    try {
      return await organizationService.getOrganizationDetails();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch organization details');
    }
  }
);

export const fetchOrgLocationsThunk = createAsyncThunk(
  'organization/fetchLocations',
  async (_, { rejectWithValue }) => {
    try {
      return await organizationService.getLocations();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch locations');
    }
  }
);

export const fetchMyMembershipThunk = createAsyncThunk(
  'organization/fetchMyMembership',
  async (_, { rejectWithValue }) => {
    try {
      return await organizationService.getMyMembership();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch my membership');
    }
  }
);

export const fetchOrgWorkspaceThunk = createAsyncThunk(
  'organization/fetchWorkspace',
  async (_, { rejectWithValue }) => {
    try {
      return await organizationService.getOrganizationWorkspace();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch workspace');
    }
  }
);

export const fetchOrgTeamsThunk = createAsyncThunk(
  'organization/fetchTeams',
  async (_, { rejectWithValue }) => {
    try {
      return await organizationService.getTeams();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch teams');
    }
  }
);

export const fetchOrgPipelinesThunk = createAsyncThunk(
  'organization/fetchPipelines',
  async (_, { rejectWithValue }) => {
    try {
      return await organizationService.getCrmPipelines();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch pipelines');
    }
  }
);

export const fetchOrgCustomFieldsThunk = createAsyncThunk(
  'organization/fetchCustomFields',
  async (_, { rejectWithValue }) => {
    try {
      return await organizationService.getCrmCustomFields();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch custom fields');
    }
  }
);

export const fetchOrgAutomationRulesThunk = createAsyncThunk(
  'organization/fetchAutomationRules',
  async (_, { rejectWithValue }) => {
    try {
      return await organizationService.getCrmAutomationRules();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch automation rules');
    }
  }
);

// Mutations
export const updateOrgProfileThunk = createAsyncThunk(
  'organization/updateProfile',
  async (data: any, { dispatch, rejectWithValue }) => {
    try {
      const response = await organizationService.updateOrganization(data);
      dispatch(fetchOrgDetailsThunk());
      dispatch(fetchOrgWorkspaceThunk());
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update profile');
    }
  }
);

export const createOrgMemberThunk = createAsyncThunk(
  'organization/createMember',
  async (data: any, { dispatch, rejectWithValue }) => {
    try {
      const response = await organizationService.createKeycloakUser(data);
      dispatch(fetchOrgAccessUsersThunk());
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create member');
    }
  }
);

export const upsertOrgMembershipThunk = createAsyncThunk(
  'organization/upsertMembership',
  async ({ userId, body }: { userId: string; body: any }, { dispatch, rejectWithValue }) => {
    try {
      const response = await organizationService.upsertMembership(userId, body);
      dispatch(fetchOrgAccessUsersThunk());
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to upsert membership');
    }
  }
);

export const removeOrgMembershipThunk = createAsyncThunk(
  'organization/removeMembership',
  async (userId: string, { dispatch, rejectWithValue }) => {
    try {
      const response = await organizationService.removeMembership(userId);
      dispatch(fetchOrgAccessUsersThunk());
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to remove membership');
    }
  }
);

export const saveOrgLocationThunk = createAsyncThunk(
  'organization/saveLocation',
  async ({ id, data }: { id?: string; data: any }, { dispatch, rejectWithValue }) => {
    try {
      const response = id 
        ? await organizationService.updateLocation(id, data)
        : await organizationService.createLocation(data);
      dispatch(fetchOrgLocationsThunk());
      dispatch(fetchOrgWorkspaceThunk());
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to save location');
    }
  }
);

export const deleteOrgLocationThunk = createAsyncThunk(
  'organization/deleteLocation',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      const response = await organizationService.deleteLocation(id);
      dispatch(fetchOrgLocationsThunk());
      dispatch(fetchOrgWorkspaceThunk());
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete location');
    }
  }
);

export const saveOrgTeamThunk = createAsyncThunk(
  'organization/saveTeam',
  async ({ id, data }: { id?: string; data: any }, { dispatch, rejectWithValue }) => {
    try {
      const response = id 
        ? await organizationService.updateTeam(id, data)
        : await organizationService.createTeam(data);
      dispatch(fetchOrgTeamsThunk());
      dispatch(fetchOrgWorkspaceThunk());
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to save team');
    }
  }
);

export const deleteOrgTeamThunk = createAsyncThunk(
  'organization/deleteTeam',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      const response = await organizationService.deleteTeam(id);
      dispatch(fetchOrgTeamsThunk());
      dispatch(fetchOrgWorkspaceThunk());
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete team');
    }
  }
);

export const saveOrgPipelineThunk = createAsyncThunk(
  'organization/savePipeline',
  async ({ id, data }: { id?: string; data: any }, { dispatch, rejectWithValue }) => {
    try {
      const response = id 
        ? await organizationService.updateCrmPipeline(id, data)
        : await organizationService.createCrmPipeline(data);
      dispatch(fetchOrgPipelinesThunk());
      dispatch(fetchOrgWorkspaceThunk());
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to save pipeline');
    }
  }
);

export const deleteOrgPipelineThunk = createAsyncThunk(
  'organization/deletePipeline',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      const response = await organizationService.deleteCrmPipeline(id);
      dispatch(fetchOrgPipelinesThunk());
      dispatch(fetchOrgWorkspaceThunk());
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete pipeline');
    }
  }
);

export const saveOrgCustomFieldThunk = createAsyncThunk(
  'organization/saveCustomField',
  async ({ id, data }: { id?: string; data: any }, { dispatch, rejectWithValue }) => {
    try {
      const response = id 
        ? await organizationService.updateCrmCustomField(id, data)
        : await organizationService.createCrmCustomField(data);
      dispatch(fetchOrgCustomFieldsThunk());
      dispatch(fetchOrgWorkspaceThunk());
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to save custom field');
    }
  }
);

export const deleteOrgCustomFieldThunk = createAsyncThunk(
  'organization/deleteCustomField',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      const response = await organizationService.deleteCrmCustomField(id);
      dispatch(fetchOrgCustomFieldsThunk());
      dispatch(fetchOrgWorkspaceThunk());
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete custom field');
    }
  }
);

export const updateOrgAutomationRulesThunk = createAsyncThunk(
  'organization/updateAutomationRules',
  async (rules: any[], { dispatch, rejectWithValue }) => {
    try {
      const response = await organizationService.updateCrmAutomationRules({ rules });
      dispatch(fetchOrgAutomationRulesThunk());
      dispatch(fetchOrgWorkspaceThunk());
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update automation rules');
    }
  }
);

const organizationSlice = createSlice({
  name: 'organization',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrgAccessUsersThunk.pending, (state) => { state.accessUsers.loading = true; })
      .addCase(fetchOrgAccessUsersThunk.fulfilled, (state, action) => {
        state.accessUsers.data = action.payload;
        state.accessUsers.loading = false;
      })
      .addCase(fetchOrgAccessUsersThunk.rejected, (state, action) => {
        state.accessUsers.loading = false;
        state.accessUsers.error = action.payload as string;
      })
      .addCase(fetchOrgRbacCatalogThunk.pending, (state) => { state.rbacCatalog.loading = true; })
      .addCase(fetchOrgRbacCatalogThunk.fulfilled, (state, action) => {
        state.rbacCatalog.data = action.payload;
        state.rbacCatalog.loading = false;
      })
      .addCase(fetchOrgRbacCatalogThunk.rejected, (state, action) => {
        state.rbacCatalog.loading = false;
        state.rbacCatalog.error = action.payload as string;
      })
      .addCase(fetchOrgDetailsThunk.pending, (state) => { state.orgDetails.loading = true; })
      .addCase(fetchOrgDetailsThunk.fulfilled, (state, action) => {
        state.orgDetails.data = action.payload;
        state.orgDetails.loading = false;
      })
      .addCase(fetchOrgDetailsThunk.rejected, (state, action) => {
        state.orgDetails.loading = false;
        state.orgDetails.error = action.payload as string;
      })
      .addCase(fetchOrgLocationsThunk.pending, (state) => { state.locations.loading = true; })
      .addCase(fetchOrgLocationsThunk.fulfilled, (state, action) => {
        state.locations.data = action.payload;
        state.locations.loading = false;
      })
      .addCase(fetchOrgLocationsThunk.rejected, (state, action) => {
        state.locations.loading = false;
        state.locations.error = action.payload as string;
      })
      .addCase(fetchMyMembershipThunk.pending, (state) => { state.membership.loading = true; })
      .addCase(fetchMyMembershipThunk.fulfilled, (state, action) => {
        state.membership.data = action.payload;
        state.membership.loading = false;
      })
      .addCase(fetchMyMembershipThunk.rejected, (state, action) => {
        state.membership.loading = false;
        state.membership.error = action.payload as string;
      })
      .addCase(fetchOrgWorkspaceThunk.pending, (state) => { state.workspace.loading = true; })
      .addCase(fetchOrgWorkspaceThunk.fulfilled, (state, action) => {
        state.workspace.data = action.payload;
        state.workspace.loading = false;
      })
      .addCase(fetchOrgWorkspaceThunk.rejected, (state, action) => {
        state.workspace.loading = false;
        state.workspace.error = action.payload as string;
      })
      .addCase(fetchOrgTeamsThunk.pending, (state) => { state.teams.loading = true; })
      .addCase(fetchOrgTeamsThunk.fulfilled, (state, action) => {
        state.teams.data = action.payload;
        state.teams.loading = false;
      })
      .addCase(fetchOrgTeamsThunk.rejected, (state, action) => {
        state.teams.loading = false;
        state.teams.error = action.payload as string;
      })
      .addCase(fetchOrgPipelinesThunk.pending, (state) => { state.pipelines.loading = true; })
      .addCase(fetchOrgPipelinesThunk.fulfilled, (state, action) => {
        state.pipelines.data = action.payload;
        state.pipelines.loading = false;
      })
      .addCase(fetchOrgPipelinesThunk.rejected, (state, action) => {
        state.pipelines.loading = false;
        state.pipelines.error = action.payload as string;
      })
      .addCase(fetchOrgCustomFieldsThunk.pending, (state) => { state.customFields.loading = true; })
      .addCase(fetchOrgCustomFieldsThunk.fulfilled, (state, action) => {
        state.customFields.data = action.payload;
        state.customFields.loading = false;
      })
      .addCase(fetchOrgCustomFieldsThunk.rejected, (state, action) => {
        state.customFields.loading = false;
        state.customFields.error = action.payload as string;
      })
      .addCase(fetchOrgAutomationRulesThunk.pending, (state) => { state.automationRules.loading = true; })
      .addCase(fetchOrgAutomationRulesThunk.fulfilled, (state, action) => {
        state.automationRules.data = action.payload;
        state.automationRules.loading = false;
      })
      .addCase(fetchOrgAutomationRulesThunk.rejected, (state, action) => {
        state.automationRules.loading = false;
        state.automationRules.error = action.payload as string;
      })
      // Global Mutation Loading
      .addMatcher(
        (action) => action.type.endsWith('/pending') && action.type.startsWith('organization/'),
        (state) => { state.mutationLoading = true; }
      )
      .addMatcher(
        (action) => (action.type.endsWith('/fulfilled') || action.type.endsWith('/rejected')) && action.type.startsWith('organization/'),
        (state) => { state.mutationLoading = false; }
      );
  },
});

export default organizationSlice.reducer;
export const selectOrganization = (state: RootState) => state.organization;
