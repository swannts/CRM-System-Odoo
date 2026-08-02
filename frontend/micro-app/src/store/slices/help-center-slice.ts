import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { helpCenterService } from 'src/services/help-center-service';
import { RootState } from '../index';

interface HelpCenterState {
  articles: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  currentArticle: {
    data: any | null;
    loading: boolean;
    error: string | null;
  };
}

const initialState: HelpCenterState = {
  articles: { data: [], loading: false, error: null },
  currentArticle: { data: null, loading: false, error: null },
};

export const fetchArticlesThunk = createAsyncThunk(
  'helpCenter/fetchArticles',
  async (_, { rejectWithValue }) => {
    try {
      return await helpCenterService.getArticles();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch articles');
    }
  }
);

export const fetchArticleThunk = createAsyncThunk(
  'helpCenter/fetchArticle',
  async (id: string, { rejectWithValue }) => {
    try {
      return await helpCenterService.getArticle(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch article');
    }
  }
);

const helpCenterSlice = createSlice({
  name: 'helpCenter',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchArticlesThunk.pending, (state) => { state.articles.loading = true; })
      .addCase(fetchArticlesThunk.fulfilled, (state, action) => {
        state.articles.data = action.payload;
        state.articles.loading = false;
      })
      .addCase(fetchArticlesThunk.rejected, (state, action) => {
        state.articles.loading = false;
        state.articles.error = action.payload as string;
      })
      .addCase(fetchArticleThunk.pending, (state) => { state.currentArticle.loading = true; })
      .addCase(fetchArticleThunk.fulfilled, (state, action) => {
        state.currentArticle.data = action.payload;
        state.currentArticle.loading = false;
      })
      .addCase(fetchArticleThunk.rejected, (state, action) => {
        state.currentArticle.loading = false;
        state.currentArticle.error = action.payload as string;
      });
  },
});

export default helpCenterSlice.reducer;
export const selectHelpCenter = (state: RootState) => state.helpCenter;
