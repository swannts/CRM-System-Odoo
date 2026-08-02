import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { contactService, IContact, IContactsPaginatedResponse, IContactAnalyticsResponse } from 'src/services/contact-service';
import { RootState } from '../index';

interface ContactState {
  contacts: {
    data: IContact[];
    total: number;
    loading: boolean;
    error: string | null;
  };
  analytics: {
    data: IContactAnalyticsResponse | null;
    loading: boolean;
    error: string | null;
  };
  companies: {
    data: IContact[];
    total: number;
    loading: boolean;
    error: string | null;
  };
  summary: {
    data: IContact[];
    loading: boolean;
    error: string | null;
  };
  currentContact: {
    data: IContact | null;
    loading: boolean;
    error: string | null;
    pets: any[];
    files: any[];
    tasks: any[];
    activities: any[];
    shifts: { data: any[]; total: number; loading: boolean };
    orders: any[];
    projects: any[];
  };
}

const initialState: ContactState = {
  contacts: {
    data: [],
    total: 0,
    loading: false,
    error: null,
  },
  analytics: {
    data: null,
    loading: false,
    error: null,
  },
  companies: {
    data: [],
    total: 0,
    loading: false,
    error: null,
  },
  summary: {
    data: [],
    loading: false,
    error: null,
  },
  currentContact: {
    data: null,
    loading: false,
    error: null,
    pets: [],
    files: [],
    tasks: [],
    activities: [],
    shifts: { data: [], total: 0, loading: false },
    orders: [],
    projects: [],
  },
};

export const fetchContacts = createAsyncThunk(
  'contacts/fetchContacts',
  async (params: { page?: number; pageSize?: number; search?: string; type?: string } | undefined, { rejectWithValue }) => {
    try {
      return await contactService.getContactsPaginated(params);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch contacts');
    }
  }
);

export const fetchContactAnalytics = createAsyncThunk(
  'contacts/fetchAnalytics',
  async (params: { search?: string; type?: string } | undefined, { rejectWithValue }) => {
    try {
      return await contactService.getContactsAnalytics(params);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch contact analytics');
    }
  }
);

export const fetchCompanies = createAsyncThunk(
  'contacts/fetchCompanies',
  async (params: { page?: number; pageSize?: number; search?: string } | undefined, { rejectWithValue }) => {
    try {
      return await contactService.getCompanies(params);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch companies');
    }
  }
);

export const fetchContactSummary = createAsyncThunk(
  'contacts/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      return await contactService.getContacts({
        page: 1,
        pageSize: 200,
      });
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch contact summary');
    }
  }
);

export const fetchContactById = createAsyncThunk(
  'contacts/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await contactService.getContact(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch contact');
    }
  }
);

export const fetchContactPets = createAsyncThunk(
  'contacts/fetchPets',
  async (id: string, { rejectWithValue }) => {
    try {
      return await contactService.getPets(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch pets');
    }
  }
);

export const fetchContactFiles = createAsyncThunk(
  'contacts/fetchFiles',
  async (id: string, { rejectWithValue }) => {
    try {
      return await contactService.getFiles(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch files');
    }
  }
);

export const fetchContactTasks = createAsyncThunk(
  'contacts/fetchTasks',
  async (id: string, { rejectWithValue }) => {
    try {
      return await contactService.getTasks(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch tasks');
    }
  }
);

export const fetchContactActivities = createAsyncThunk(
  'contacts/fetchActivities',
  async (id: string, { rejectWithValue }) => {
    try {
      return await contactService.getActivities(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch activities');
    }
  }
);

export const fetchContactShifts = createAsyncThunk(
  'contacts/fetchShifts',
  async ({ id, params }: { id: string; params?: { page?: number; pageSize?: number } }, { rejectWithValue }) => {
    try {
      return await contactService.getShifts(id, params);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch shifts');
    }
  }
);

export const fetchContactOrders = createAsyncThunk(
  'contacts/fetchOrders',
  async (id: string, { rejectWithValue }) => {
    try {
      return await contactService.getOrders(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch orders');
    }
  }
);

export const fetchContactProjects = createAsyncThunk(
  'contacts/fetchProjects',
  async (id: string, { rejectWithValue }) => {
    try {
      return await contactService.getProjects(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch projects');
    }
  }
);

export const fetchContactsByType = createAsyncThunk(
  'contacts/fetchByType',
  async ({ type, id }: { type: string; id?: string }, { rejectWithValue }) => {
    try {
      return await contactService.getContactsByType(type, id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch contacts by type');
    }
  }
);

export const updateContactThunk = createAsyncThunk(
  'contacts/updateContact',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      return await contactService.updateContact(id, data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update contact');
    }
  }
);

export const createContactThunk = createAsyncThunk(
  'contacts/createContact',
  async (data: any, { rejectWithValue }) => {
    try {
      return await contactService.createContact(data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create contact');
    }
  }
);

export const deleteContactThunk = createAsyncThunk(
  'contacts/deleteContact',
  async (id: string, { rejectWithValue }) => {
    try {
      return await contactService.deleteContact(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete contact');
    }
  }
);

export const linkCompanyThunk = createAsyncThunk(
  'contacts/linkCompany',
  async ({ id, companyId }: { id: string; companyId: number }, { rejectWithValue }) => {
    try {
      return await contactService.linkCompany(id, companyId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to link company');
    }
  }
);

export const unlinkCompanyThunk = createAsyncThunk(
  'contacts/unlinkCompany',
  async (id: string, { rejectWithValue }) => {
    try {
      return await contactService.unlinkCompany(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to unlink company');
    }
  }
);

export const createPetThunk = createAsyncThunk(
  'contacts/createPet',
  async ({ contactId, data }: { contactId: string; data: any }, { rejectWithValue }) => {
    try {
      return await contactService.createPet(contactId, data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create pet');
    }
  }
);

export const updatePetThunk = createAsyncThunk(
  'contacts/updatePet',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      return await contactService.updatePet(id, data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update pet');
    }
  }
);

export const deletePetThunk = createAsyncThunk(
  'contacts/deletePet',
  async (id: string, { rejectWithValue }) => {
    try {
      return await contactService.deletePet(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete pet');
    }
  }
);

export const createFileThunk = createAsyncThunk(
  'contacts/createFile',
  async ({ contactId, data }: { contactId: string; data: any }, { rejectWithValue }) => {
    try {
      return await contactService.createFile(contactId, data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to upload file');
    }
  }
);

export const deleteFileThunk = createAsyncThunk(
  'contacts/deleteFile',
  async (id: string, { rejectWithValue }) => {
    try {
      return await contactService.deleteFile(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete file');
    }
  }
);

export const createTaskThunk = createAsyncThunk(
  'contacts/createTask',
  async ({ contactId, data }: { contactId: string; data: any }, { rejectWithValue }) => {
    try {
      return await contactService.createTask(contactId, data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create task');
    }
  }
);

export const updateTaskThunk = createAsyncThunk(
  'contacts/updateTask',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      return await contactService.updateTask(id, data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update task');
    }
  }
);

export const deleteTaskThunk = createAsyncThunk(
  'contacts/deleteTask',
  async (id: string, { rejectWithValue }) => {
    try {
      return await contactService.deleteTask(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete task');
    }
  }
);

export const createActivityThunk = createAsyncThunk(
  'contacts/createActivity',
  async ({ contactId, data }: { contactId: string; data: any }, { rejectWithValue }) => {
    try {
      return await contactService.createActivity(contactId, data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to log activity');
    }
  }
);

export const updateActivityThunk = createAsyncThunk(
  'contacts/updateActivity',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      return await contactService.updateActivity(id, data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update activity');
    }
  }
);

export const deleteActivityThunk = createAsyncThunk(
  'contacts/deleteActivity',
  async (id: string, { rejectWithValue }) => {
    try {
      return await contactService.deleteActivity(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete activity');
    }
  }
);

export const clockInThunk = createAsyncThunk(
  'contacts/clockIn',
  async (id: string, { rejectWithValue }) => {
    try {
      return await contactService.clockIn(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to clock in');
    }
  }
);

export const clockOutThunk = createAsyncThunk(
  'contacts/clockOut',
  async (shiftId: string, { rejectWithValue }) => {
    try {
      return await contactService.clockOut(shiftId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to clock out');
    }
  }
);

const contactSlice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchContacts.pending, (state) => {
        state.contacts.loading = true;
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.contacts.data = action.payload.data;
        state.contacts.total = action.payload.total;
        state.contacts.loading = false;
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.contacts.loading = false;
        state.contacts.error = action.payload as string;
      })
      .addCase(fetchContactAnalytics.pending, (state) => {
        state.analytics.loading = true;
      })
      .addCase(fetchContactAnalytics.fulfilled, (state, action) => {
        state.analytics.data = action.payload;
        state.analytics.loading = false;
      })
      .addCase(fetchContactAnalytics.rejected, (state, action) => {
        state.analytics.loading = false;
        state.analytics.error = action.payload as string;
      })
      .addCase(fetchCompanies.pending, (state) => {
        state.companies.loading = true;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.companies.data = action.payload.data;
        state.companies.total = action.payload.total;
        state.companies.loading = false;
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.companies.loading = false;
        state.companies.error = action.payload as string;
      })
      .addCase(fetchContactSummary.pending, (state) => {
        state.summary.loading = true;
      })
      .addCase(fetchContactSummary.fulfilled, (state, action) => {
        state.summary.data = action.payload;
        state.summary.loading = false;
      })
      .addCase(fetchContactSummary.rejected, (state, action) => {
        state.summary.loading = false;
        state.summary.error = action.payload as string;
      })
      .addCase(fetchContactById.pending, (state) => {
        state.currentContact.loading = true;
      })
      .addCase(fetchContactById.fulfilled, (state, action) => {
        state.currentContact.data = action.payload;
        state.currentContact.loading = false;
      })
      .addCase(fetchContactById.rejected, (state, action) => {
        state.currentContact.loading = false;
        state.currentContact.error = action.payload as string;
      })
      .addCase(fetchContactPets.fulfilled, (state, action) => {
        state.currentContact.pets = action.payload;
      })
      .addCase(fetchContactFiles.fulfilled, (state, action) => {
        state.currentContact.files = action.payload;
      })
      .addCase(fetchContactTasks.fulfilled, (state, action) => {
        state.currentContact.tasks = action.payload;
      })
      .addCase(fetchContactActivities.fulfilled, (state, action) => {
        state.currentContact.activities = action.payload;
      })
      .addCase(fetchContactShifts.pending, (state) => {
        state.currentContact.shifts.loading = true;
      })
      .addCase(fetchContactShifts.fulfilled, (state, action) => {
        state.currentContact.shifts.data = action.payload.data;
        state.currentContact.shifts.total = action.payload.total;
        state.currentContact.shifts.loading = false;
      })
      .addCase(fetchContactShifts.rejected, (state) => {
        state.currentContact.shifts.loading = false;
      })
      .addCase(fetchContactOrders.fulfilled, (state, action) => {
        state.currentContact.orders = action.payload;
      })
      .addCase(fetchContactProjects.fulfilled, (state, action) => {
        state.currentContact.projects = action.payload;
      })
      .addCase(fetchContactsByType.pending, (state) => {
        state.contacts.loading = true;
      })
      .addCase(fetchContactsByType.fulfilled, (state, action) => {
        state.contacts.data = action.payload;
        state.contacts.loading = false;
      })
      .addCase(fetchContactsByType.rejected, (state, action) => {
        state.contacts.loading = false;
        state.contacts.error = action.payload as string;
      });
  },
});

export default contactSlice.reducer;

export const selectContacts = (state: RootState) => state.contacts;
