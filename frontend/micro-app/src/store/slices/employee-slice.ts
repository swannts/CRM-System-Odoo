import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { employeeService } from 'src/services/employee-service';
import { RootState } from '../index';

interface EmployeeState {
  employees: {
    data: any[];
    total: number;
    loading: boolean;
    error: string | null;
  };
  attendance: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  leaves: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  shifts: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  departments: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  summary: {
    data: any | null;
    loading: boolean;
    error: string | null;
  };
  documents: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  roles: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  settings: {
    data: any | null;
    loading: boolean;
    error: string | null;
  };
}

const initialState: EmployeeState = {
  employees: { data: [], total: 0, loading: false, error: null },
  attendance: { data: [], loading: false, error: null },
  leaves: { data: [], loading: false, error: null },
  shifts: { data: [], loading: false, error: null },
  departments: { data: [], loading: false, error: null },
  summary: { data: null, loading: false, error: null },
  documents: { data: [], loading: false, error: null },
  roles: { data: [], loading: false, error: null },
  settings: { data: null, loading: false, error: null },
};

export const fetchEmployeesThunk = createAsyncThunk(
  'employee/fetchList',
  async (params: any, { rejectWithValue }) => {
    try {
      return await employeeService.getEmployees(params);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch employees');
    }
  }
);

export const fetchAttendanceThunk = createAsyncThunk(
  'employee/fetchAttendance',
  async (params: any, { rejectWithValue }) => {
    try {
      return await employeeService.getAttendance(params);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch attendance');
    }
  }
);

export const fetchLeavesThunk = createAsyncThunk(
  'employee/fetchLeaves',
  async (params: any, { rejectWithValue }) => {
    try {
      return await employeeService.getLeaveRequests(params);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch leave requests');
    }
  }
);

export const fetchShiftsThunk = createAsyncThunk(
  'employee/fetchShifts',
  async (params: any, { rejectWithValue }) => {
    try {
      return await employeeService.getShifts(params);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch shifts');
    }
  }
);

export const fetchDepartmentsThunk = createAsyncThunk(
  'employee/fetchDepartments',
  async (_, { rejectWithValue }) => {
    try {
      return await employeeService.getDepartments();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch departments');
    }
  }
);

export const fetchEmployeeSummaryThunk = createAsyncThunk(
  'employee/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      return await employeeService.getEmployeeSummary();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch summary');
    }
  }
);

export const fetchEmployeeDocumentsThunk = createAsyncThunk(
  'employee/fetchDocuments',
  async (id: string, { rejectWithValue }) => {
    try {
      return await employeeService.getEmployeeDocuments(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch documents');
    }
  }
);

export const fetchEmployeeRolesThunk = createAsyncThunk(
  'employee/fetchRoles',
  async (_, { rejectWithValue }) => {
    try {
      return await employeeService.getRoles();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch roles');
    }
  }
);

export const fetchEmployeeSettingsThunk = createAsyncThunk(
  'employee/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      return await employeeService.getSettings();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch settings');
    }
  }
);

export const createEmployeeThunk = createAsyncThunk(
  'employee/create',
  async (payload: any, { rejectWithValue }) => {
    try {
      return await employeeService.createEmployee(payload);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create employee');
    }
  }
);

export const updateEmployeeThunk = createAsyncThunk(
  'employee/update',
  async ({ id, payload }: { id: string; payload: any }, { rejectWithValue }) => {
    try {
      return await employeeService.updateEmployee(id, payload);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update employee');
    }
  }
);

export const archiveEmployeeThunk = createAsyncThunk(
  'employee/archive',
  async (id: string, { rejectWithValue }) => {
    try {
      return await employeeService.archiveEmployee(id);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to archive employee');
    }
  }
);

const employeeSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployeesThunk.pending, (state) => { state.employees.loading = true; })
      .addCase(fetchEmployeesThunk.fulfilled, (state, action) => {
        state.employees.data = action.payload.data;
        state.employees.total = action.payload.total;
        state.employees.loading = false;
      })
      .addCase(fetchEmployeesThunk.rejected, (state, action) => {
        state.employees.loading = false;
        state.employees.error = action.payload as string;
      })
      .addCase(fetchAttendanceThunk.pending, (state) => { state.attendance.loading = true; })
      .addCase(fetchAttendanceThunk.fulfilled, (state, action) => {
        state.attendance.data = action.payload.data;
        state.attendance.loading = false;
      })
      .addCase(fetchAttendanceThunk.rejected, (state, action) => {
        state.attendance.loading = false;
        state.attendance.error = action.payload as string;
      })
      .addCase(fetchLeavesThunk.pending, (state) => { state.leaves.loading = true; })
      .addCase(fetchLeavesThunk.fulfilled, (state, action) => {
        state.leaves.data = action.payload.data;
        state.leaves.loading = false;
      })
      .addCase(fetchLeavesThunk.rejected, (state, action) => {
        state.leaves.loading = false;
        state.leaves.error = action.payload as string;
      })
      .addCase(fetchShiftsThunk.pending, (state) => { state.shifts.loading = true; })
      .addCase(fetchShiftsThunk.fulfilled, (state, action) => {
        state.shifts.data = action.payload.data;
        state.shifts.loading = false;
      })
      .addCase(fetchShiftsThunk.rejected, (state, action) => {
        state.shifts.loading = false;
        state.shifts.error = action.payload as string;
      })
      .addCase(fetchDepartmentsThunk.pending, (state) => { state.departments.loading = true; })
      .addCase(fetchDepartmentsThunk.fulfilled, (state, action) => {
        state.departments.data = action.payload;
        state.departments.loading = false;
      })
      .addCase(fetchDepartmentsThunk.rejected, (state, action) => {
        state.departments.loading = false;
        state.departments.error = action.payload as string;
      })
      .addCase(fetchEmployeeSummaryThunk.pending, (state) => { state.summary.loading = true; })
      .addCase(fetchEmployeeSummaryThunk.fulfilled, (state, action) => {
        state.summary.data = action.payload;
        state.summary.loading = false;
      })
      .addCase(fetchEmployeeSummaryThunk.rejected, (state, action) => {
        state.summary.loading = false;
        state.summary.error = action.payload as string;
      })
      .addCase(fetchEmployeeDocumentsThunk.pending, (state) => { state.documents.loading = true; })
      .addCase(fetchEmployeeDocumentsThunk.fulfilled, (state, action) => {
        state.documents.data = action.payload;
        state.documents.loading = false;
      })
      .addCase(fetchEmployeeDocumentsThunk.rejected, (state, action) => {
        state.documents.loading = false;
        state.documents.error = action.payload as string;
      })
      .addCase(fetchEmployeeRolesThunk.pending, (state) => { state.roles.loading = true; })
      .addCase(fetchEmployeeRolesThunk.fulfilled, (state, action) => {
        state.roles.data = action.payload;
        state.roles.loading = false;
      })
      .addCase(fetchEmployeeRolesThunk.rejected, (state, action) => {
        state.roles.loading = false;
        state.roles.error = action.payload as string;
      })
      .addCase(fetchEmployeeSettingsThunk.pending, (state) => { state.settings.loading = true; })
      .addCase(fetchEmployeeSettingsThunk.fulfilled, (state, action) => {
        state.settings.data = action.payload;
        state.settings.loading = false;
      })
      .addCase(fetchEmployeeSettingsThunk.rejected, (state, action) => {
        state.settings.loading = false;
        state.settings.error = action.payload as string;
      });
  },
});

export default employeeSlice.reducer;
export const selectEmployees = (state: RootState) => state.employees;
