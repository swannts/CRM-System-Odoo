import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { scoringService } from 'src/services/scoring-service';
import { RootState } from '../index';

interface ScoringState {
  contactScores: Record<string, { data: any | null; loading: boolean; error: string | null }>;
  hotLeads: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  rules: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
}

const initialState: ScoringState = {
  contactScores: {},
  hotLeads: {
    data: [],
    loading: false,
    error: null,
  },
  rules: {
    data: [],
    loading: false,
    error: null,
  },
};

export const fetchContactScore = createAsyncThunk(
  'scoring/fetchContactScore',
  async (id: string, { rejectWithValue }) => {
    try {
      return await scoringService.getContactScore(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch contact score');
    }
  }
);

export const fetchHotLeads = createAsyncThunk(
  'scoring/fetchHotLeads',
  async (_, { rejectWithValue }) => {
    try {
      return await scoringService.getHotLeads(100, 0);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch hot leads');
    }
  }
);

export const fetchScoreRules = createAsyncThunk(
  'scoring/fetchScoreRules',
  async (_, { rejectWithValue }) => {
    try {
      return await scoringService.getScoreRules();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch score rules');
    }
  }
);

export const createScoreRuleThunk = createAsyncThunk(
  'scoring/createRule',
  async (payload: any, { rejectWithValue }) => {
    try {
      return await scoringService.createScoreRule(payload);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create score rule');
    }
  }
);

export const updateScoreRuleThunk = createAsyncThunk(
  'scoring/updateRule',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      return await scoringService.updateScoreRule(id, data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update score rule');
    }
  }
);

const scoringSlice = createSlice({
  name: 'scoring',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchContactScore.pending, (state, action) => {
        const id = action.meta.arg;
        if (!state.contactScores[id]) {
          state.contactScores[id] = { data: null, loading: true, error: null };
        } else {
          state.contactScores[id].loading = true;
        }
      })
      .addCase(fetchContactScore.fulfilled, (state, action) => {
        const id = action.meta.arg;
        state.contactScores[id].data = action.payload;
        state.contactScores[id].loading = false;
      })
      .addCase(fetchContactScore.rejected, (state, action) => {
        const id = action.meta.arg;
        state.contactScores[id].loading = false;
        state.contactScores[id].error = action.payload as string;
      })
      .addCase(fetchHotLeads.pending, (state) => {
        state.hotLeads.loading = true;
      })
      .addCase(fetchHotLeads.fulfilled, (state, action) => {
        state.hotLeads.data = action.payload;
        state.hotLeads.loading = false;
      })
      .addCase(fetchHotLeads.rejected, (state, action) => {
        state.hotLeads.loading = false;
        state.hotLeads.error = action.payload as string;
      })
      .addCase(fetchScoreRules.pending, (state) => {
        state.rules.loading = true;
      })
      .addCase(fetchScoreRules.fulfilled, (state, action) => {
        state.rules.data = action.payload;
        state.rules.loading = false;
      })
      .addCase(fetchScoreRules.rejected, (state, action) => {
        state.rules.loading = false;
        state.rules.error = action.payload as string;
      });
  },
});

export default scoringSlice.reducer;

export const selectScoring = (state: RootState) => state.scoring;
