import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { communityService } from 'src/services/community-service';
import { RootState } from '../index';

interface CommunityState {
  posts: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  groups: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
}

const initialState: CommunityState = {
  posts: { data: [], loading: false, error: null },
  groups: { data: [], loading: false, error: null },
};

export const fetchCommunityPosts = createAsyncThunk(
  'community/fetchPosts',
  async (_, { rejectWithValue }) => {
    try {
      return await communityService.getPosts();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch posts');
    }
  }
);

export const fetchCommunityGroups = createAsyncThunk(
  'community/fetchGroups',
  async (_, { rejectWithValue }) => {
    try {
      return await communityService.getGroups();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch groups');
    }
  }
);

export const createPostThunk = createAsyncThunk(
  'community/createPost',
  async (data: any, { rejectWithValue }) => {
    try {
      return await communityService.createPost(data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create post');
    }
  }
);

const communitySlice = createSlice({
  name: 'community',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCommunityPosts.pending, (state) => { state.posts.loading = true; })
      .addCase(fetchCommunityPosts.fulfilled, (state, action) => {
        state.posts.data = action.payload;
        state.posts.loading = false;
      })
      .addCase(fetchCommunityPosts.rejected, (state, action) => {
        state.posts.loading = false;
        state.posts.error = action.payload as string;
      })
      .addCase(fetchCommunityGroups.pending, (state) => { state.groups.loading = true; })
      .addCase(fetchCommunityGroups.fulfilled, (state, action) => {
        state.groups.data = action.payload;
        state.groups.loading = false;
      })
      .addCase(fetchCommunityGroups.rejected, (state, action) => {
        state.groups.loading = false;
        state.groups.error = action.payload as string;
      });
  },
});

export default communitySlice.reducer;
export const selectCommunity = (state: RootState) => state.community;
