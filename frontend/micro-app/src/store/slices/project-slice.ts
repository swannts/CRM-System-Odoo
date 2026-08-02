import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { projectService } from 'src/services/project-service';
import { RootState } from '../index';

export interface IProject {
  id: string;
  name: string;
  title?: string;
  description?: string;
  status?: string;
  createdAt?: string;
}

export interface ITask {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  dueDate?: string;
  projectId?: string;
  columnId?: string;
}

interface ProjectState {
  projects: {
    data: IProject[];
    loading: boolean;
    error: string | null;
  };
  currentProject: {
    data: any | null;
    boards: any[];
    tasks: any[];
    columns: any[];
    cards: any[];
    loading: boolean;
    error: string | null;
  };
}

const initialState: ProjectState = {
  projects: {
    data: [],
    loading: false,
    error: null,
  },
  currentProject: {
    data: null,
    boards: [],
    tasks: [],
    columns: [],
    cards: [],
    loading: false,
    error: null,
  },
};

export const fetchProjects = createAsyncThunk(
  'projects/fetchList',
  async (_, { rejectWithValue }) => {
    try {
      return await projectService.getProjects();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch projects');
    }
  }
);

export const fetchProjectById = createAsyncThunk(
  'projects/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await projectService.getProject(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch project');
    }
  }
);

export const fetchProjectBoards = createAsyncThunk(
  'projects/fetchBoards',
  async (projectId: string, { rejectWithValue }) => {
    try {
      return await projectService.getProjectBoards(projectId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch boards');
    }
  }
);

export const fetchBoardColumns = createAsyncThunk(
  'projects/fetchColumns',
  async (boardId: string, { rejectWithValue }) => {
    try {
      return await projectService.getColumns(boardId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch columns');
    }
  }
);

export const fetchBoardCards = createAsyncThunk(
  'projects/fetchCards',
  async (boardId: string, { rejectWithValue }) => {
    try {
      return await projectService.getCards(boardId);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch cards');
    }
  }
);

export const createColumnThunk = createAsyncThunk(
  'projects/createColumn',
  async ({ boardId, data }: { boardId: string; data: any }, { rejectWithValue }) => {
    try {
      return await projectService.createColumn(boardId, data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create column');
    }
  }
);

export const updateColumnThunk = createAsyncThunk(
  'projects/updateColumn',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      return await projectService.updateColumn(id, data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update column');
    }
  }
);

export const deleteColumnThunk = createAsyncThunk(
  'projects/deleteColumn',
  async (id: string, { rejectWithValue }) => {
    try {
      return await projectService.deleteColumn(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete column');
    }
  }
);

export const reorderColumnsThunk = createAsyncThunk(
  'projects/reorderColumns',
  async ({ boardId, orderedIds }: { boardId: string; orderedIds: Array<string | number> }, { rejectWithValue }) => {
    try {
      return await projectService.reorderColumns(boardId, orderedIds);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to reorder columns');
    }
  }
);

export const createCardThunk = createAsyncThunk(
  'projects/createCard',
  async ({ boardId, data }: { boardId: string; data: any }, { rejectWithValue }) => {
    try {
      return await projectService.createCard(boardId, data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create card');
    }
  }
);

export const updateCardThunk = createAsyncThunk(
  'projects/updateCard',
  async ({ id, data }: { id: string; data: any }, { rejectWithValue }) => {
    try {
      return await projectService.updateCard(id, data);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update card');
    }
  }
);

export const deleteCardThunk = createAsyncThunk(
  'projects/deleteCard',
  async (id: string, { rejectWithValue }) => {
    try {
      return await projectService.deleteCard(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete card');
    }
  }
);

const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => { state.projects.loading = true; })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.projects.data = action.payload;
        state.projects.loading = false;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.projects.loading = false;
        state.projects.error = action.payload as string;
      })
      .addCase(fetchProjectById.pending, (state) => { state.currentProject.loading = true; })
      .addCase(fetchProjectById.fulfilled, (state, action) => {
        state.currentProject.data = action.payload;
        state.currentProject.loading = false;
      })
      .addCase(fetchProjectById.rejected, (state, action) => {
        state.currentProject.loading = false;
        state.currentProject.error = action.payload as string;
      })
      .addCase(fetchProjectBoards.fulfilled, (state, action) => {
        state.currentProject.boards = action.payload;
      })
      .addCase(fetchBoardColumns.fulfilled, (state, action) => {
        state.currentProject.columns = action.payload;
      })
      .addCase(fetchBoardCards.fulfilled, (state, action) => {
        state.currentProject.cards = action.payload;
      });
  },
});

export default projectSlice.reducer;
export const selectProjects = (state: RootState) => state.projects;
