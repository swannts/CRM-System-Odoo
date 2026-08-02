import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { documentService } from 'src/services/document-service';
import { RootState } from '../index';

interface DocumentState {
  list: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  details: {
    data: any | null;
    loading: boolean;
    error: string | null;
  };
  shared: {
    data: any | null;
    loading: boolean;
    error: string | null;
  };
}

const initialState: DocumentState = {
  list: { data: [], loading: false, error: null },
  details: { data: null, loading: false, error: null },
  shared: { data: null, loading: false, error: null },
};

export const fetchDocuments = createAsyncThunk(
  'documents/fetchList',
  async (params: any | undefined, { rejectWithValue }) => {
    try {
      return await documentService.getDocuments(params);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch documents');
    }
  }
);

export const fetchDocumentById = createAsyncThunk(
  'documents/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await documentService.getDocument(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch document');
    }
  }
);

export const fetchSharedDocumentThunk = createAsyncThunk(
  'documents/fetchShared',
  async (hashcode: string, { rejectWithValue }) => {
    try {
      return await documentService.getSharedDocument(hashcode);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch shared document');
    }
  }
);

const documentSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocuments.pending, (state) => { state.list.loading = true; })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.list.data = action.payload;
        state.list.loading = false;
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.list.loading = false;
        state.list.error = action.payload as string;
      })
      .addCase(fetchDocumentById.pending, (state) => { state.details.loading = true; })
      .addCase(fetchDocumentById.fulfilled, (state, action) => {
        state.details.data = action.payload;
        state.details.loading = false;
      })
      .addCase(fetchDocumentById.rejected, (state, action) => {
        state.details.loading = false;
        state.details.error = action.payload as string;
      })
      .addCase(fetchSharedDocumentThunk.pending, (state) => { state.shared.loading = true; })
      .addCase(fetchSharedDocumentThunk.fulfilled, (state, action) => {
        state.shared.data = action.payload;
        state.shared.loading = false;
      })
      .addCase(fetchSharedDocumentThunk.rejected, (state, action) => {
        state.shared.loading = false;
        state.shared.error = action.payload as string;
      });
  },
});

export default documentSlice.reducer;
export const selectDocuments = (state: RootState) => state.documents;
