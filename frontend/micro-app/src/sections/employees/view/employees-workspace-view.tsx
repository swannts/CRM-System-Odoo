'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import {
  fetchEmployeesThunk,
  fetchDepartmentsThunk,
  fetchEmployeeSummaryThunk,
  fetchAttendanceThunk,
  fetchLeavesThunk,
  fetchEmployeeDocumentsThunk,
  fetchEmployeeRolesThunk,
  fetchEmployeeSettingsThunk,
  createEmployeeThunk,
  updateEmployeeThunk,
  archiveEmployeeThunk,
  selectEmployees,
} from 'src/store/slices/employee-slice';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';

import { Employee } from '../types';
import { employeesService } from '../services/employees-service';
import { EmployeesSummaryCards } from '../components/employees-summary-cards';
import { EmployeesDirectoryTable } from '../components/employees-directory-table';
import { EmployeesEmptyState, EmployeesErrorState, EmployeesUnavailableState } from '../components/employees-state';

const TABS = [
  'overview',
  'directory',
  'departments',
  'roles_access',
  'attendance',
  'time_off',
  'documents',
  'settings',
] as const;

type TabType = (typeof TABS)[number];

export function EmployeesWorkspaceView() {
  const dispatch = useAppDispatch();
  const { employees, departments, summary, attendance, leaves, documents, roles, settings } = useAppSelector(selectEmployees);

  const [tab, setTab] = useState<TabType>('overview');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [department, setDepartment] = useState('all');
  const [employmentType, setEmploymentType] = useState('all');
  const [openCreate, setOpenCreate] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState<any>({ firstName: '', lastName: '', email: '', phone: '', jobTitle: '', departmentId: '' });
  const [documentEmployeeId, setDocumentEmployeeId] = useState('');
  const [documentName, setDocumentName] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [roleEmployeeId, setRoleEmployeeId] = useState('');
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [settingsForm, setSettingsForm] = useState({
    employmentTypes: '',
    attendanceRules: '',
    timeOffTypes: '',
    workWeek: '',
    documentTypes: '',
  });
  const [settingsFormError, setSettingsFormError] = useState('');

  const loadData = useCallback(() => {
    dispatch(fetchEmployeesThunk({
      page: 1,
      pageSize: 200,
      search,
      type: status === 'all' ? undefined : status,
    }));
    dispatch(fetchDepartmentsThunk());
    dispatch(fetchEmployeeSummaryThunk());
    
    if (tab === 'attendance' || tab === 'overview') {
      dispatch(fetchAttendanceThunk({ page: 1, pageSize: 100 }));
    }
    if (tab === 'time_off' || tab === 'overview') {
      dispatch(fetchLeavesThunk({ page: 1, pageSize: 100 }));
    }
    if (tab === 'roles_access') {
      dispatch(fetchEmployeeRolesThunk());
    }
    if (tab === 'settings') {
      dispatch(fetchEmployeeSettingsThunk());
    }
  }, [dispatch, search, status, tab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (tab === 'documents' && documentEmployeeId) {
      dispatch(fetchEmployeeDocumentsThunk(documentEmployeeId));
    }
  }, [dispatch, tab, documentEmployeeId]);

  const filteredEmployees = useMemo(() => {
    const rows = employees.data || [];
    return rows.filter((e) => {
      const departmentMatch = department === 'all' || e.departmentId === department;
      const employmentMatch = employmentType === 'all' || e.employmentType === employmentType;
      return departmentMatch && employmentMatch;
    });
  }, [employees.data, department, employmentType]);

  const departmentRows = Array.isArray(departments.data) ? departments.data : [];

  const openCreateDialog = () => {
    setForm({ firstName: '', lastName: '', email: '', phone: '', jobTitle: '', departmentId: '' });
    setOpenCreate(true);
  };

  const openEditDialog = (employee: Employee) => {
    setEditEmployee(employee);
    setForm({
      firstName: employee.firstName || '',
      lastName: employee.lastName || '',
      email: employee.email || '',
      phone: employee.phone || '',
      jobTitle: employee.jobTitle || '',
      departmentId: employee.departmentId || '',
    });
  };

  const submitCreate = async () => {
    const fullName = `${form.firstName || ''} ${form.lastName || ''}`.trim();
    if (!fullName && !form.email) return;
    try {
      await dispatch(createEmployeeThunk({
        name: fullName || form.email,
        work_email: form.email || undefined,
        work_phone: form.phone || undefined,
        job_title: form.jobTitle || undefined,
        department_id: form.departmentId ? Number(form.departmentId) : undefined,
      })).unwrap();
      setOpenCreate(false);
      loadData();
      toast.success('Employee created successfully');
    } catch (err: any) {
      toast.error(err || 'Failed to create employee');
    }
  };

  const submitEdit = async () => {
    if (!editEmployee) return;
    const fullName = `${form.firstName || ''} ${form.lastName || ''}`.trim();
    try {
      await dispatch(updateEmployeeThunk({
        id: editEmployee.id,
        payload: {
          name: fullName || editEmployee.displayName,
          work_email: form.email || undefined,
          work_phone: form.phone || undefined,
          job_title: form.jobTitle || undefined,
          department_id: form.departmentId ? Number(form.departmentId) : undefined,
        },
      })).unwrap();
      setEditEmployee(null);
      loadData();
      toast.success('Employee updated');
    } catch (err: any) {
      toast.error(err || 'Failed to update employee');
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await dispatch(archiveEmployeeThunk(id)).unwrap();
      loadData();
      toast.success('Employee archived');
    } catch (err: any) {
      toast.error(err || 'Failed to archive employee');
    }
  };

  const submitUploadDocument = async () => {
    try {
      await employeesService.uploadEmployeeDocument(documentEmployeeId, {
        name: documentName,
        fileUrl: documentUrl,
        type: 'other',
      });
      setDocumentName('');
      setDocumentUrl('');
      dispatch(fetchEmployeeDocumentsThunk(documentEmployeeId));
      toast.success('Document uploaded');
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload document');
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      await employeesService.deleteEmployeeDocument(documentEmployeeId, docId);
      dispatch(fetchEmployeeDocumentsThunk(documentEmployeeId));
      toast.success('Document deleted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete document');
    }
  };

  const submitAssignRole = async () => {
    try {
      await employeesService.assignRole(roleEmployeeId, selectedRoleId);
      toast.success('Role assigned');
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign role');
    }
  };

  const submitSaveSettings = async (payload: any) => {
    try {
      await employeesService.updateSettings(payload);
      dispatch(fetchEmployeeSettingsThunk());
      toast.success('Settings saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save settings');
    }
  };

  const parseSettingsField = (value: string, fieldName: string) => {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    try {
      return JSON.parse(trimmed);
    } catch {
      throw new Error(`${fieldName} must be valid JSON.`);
    }
  };

  return (
    <DashboardContent maxWidth="xl">
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" sx={{ mb: 3 }} spacing={2}>
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            Employees
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Employee directory, attendance, time off, and operational HR management.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Iconify icon="solar:add-circle-bold" />} onClick={openCreateDialog}>
          New Employee
        </Button>
      </Stack>

      <Card sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" scrollButtons="auto">
          {TABS.map((t) => (
            <Tab key={t} value={t} label={t.replace('_', ' ').charAt(0).toUpperCase() + t.replace('_', ' ').slice(1)} />
          ))}
        </Tabs>
      </Card>

      {tab === 'overview' && (
        <Stack spacing={3}>
          {summary.loading ? <CircularProgress /> : <EmployeesSummaryCards summary={summary.data} />}
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Recently added employees</Typography>
                {(employees.data || []).slice(0, 5).map((e: any) => (
                  <Typography key={e.id} variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                    {e.displayName || `${e.firstName} ${e.lastName}`.trim() || e.email}
                  </Typography>
                ))}
                {(employees.data || []).length === 0 && <Typography variant="body2" sx={{ color: 'text.secondary' }}>No employees found.</Typography>}
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Pending approvals</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {(leaves.data || []).filter((x: any) => x.status === 'pending').length} time-off request(s).
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 2.5 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Attendance exceptions</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {(attendance.data || []).filter((x: any) => !x.clockOut).length} open attendance session(s).
                </Typography>
              </Card>
            </Grid>
          </Grid>
        </Stack>
      )}

      {tab === 'directory' && (
        <Card sx={{ p: 2.5 }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <TextField size="small" label="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
            <FormControl size="small">
              <InputLabel>Status</InputLabel>
              <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value as any)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>Department</InputLabel>
              <Select value={department} label="Department" onChange={(e) => setDepartment(String(e.target.value))}>
                <MenuItem value="all">All departments</MenuItem>
                {departmentRows.map((d: any) => (
                  <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {employees.loading && <CircularProgress />}
          {employees.error && (
            <EmployeesErrorState title="Directory unavailable" description="Unable to load employees right now." />
          )}
          {!employees.loading && !employees.error && filteredEmployees.length === 0 && (
            <EmployeesEmptyState title="No employees found" description="Try adjusting your search or filters." />
          )}
          {!employees.loading && !employees.error && filteredEmployees.length > 0 && (
            <EmployeesDirectoryTable
              rows={filteredEmployees}
              onEdit={openEditDialog}
              onArchive={(employee) => handleArchive(employee.id)}
            />
          )}
        </Card>
      )}

      {tab === 'departments' && (
        <Card sx={{ p: 2.5 }}>
          {departments.loading && <CircularProgress />}
          {departments.error && <EmployeesUnavailableState title="Departments unavailable" description="Department management endpoint is currently unavailable." />}
          {!departments.loading && !departments.error && departmentRows.length === 0 && (
            <EmployeesEmptyState title="No departments" description="Create a department to organize employees." />
          )}
          {!departments.loading && !departments.error && departmentRows.length > 0 && (
            <Stack spacing={1}>
              {departmentRows.map((d: any) => (
                <Card key={d.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="subtitle2">{d.name}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Manager: {d.managerName || 'Unassigned'}
                  </Typography>
                </Card>
              ))}
            </Stack>
          )}
        </Card>
      )}

      {tab === 'roles_access' && (
        <Card sx={{ p: 2.5 }}>
          {roles.loading && <CircularProgress />}
          {roles.error && <EmployeesUnavailableState title="Roles & access unavailable" description="Role and access management is not available yet." />}
          {!roles.loading && !roles.error && (
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                <FormControl size="small" sx={{ minWidth: 260 }}>
                  <InputLabel>Employee</InputLabel>
                  <Select value={roleEmployeeId} label="Employee" onChange={(e) => setRoleEmployeeId(String(e.target.value))}>
                    <MenuItem value="">Select employee</MenuItem>
                    {(employees.data || []).map((e: any) => (
                      <MenuItem key={e.id} value={e.id}>
                        {e.displayName || `${e.firstName} ${e.lastName}`.trim() || e.email || e.id}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 260 }}>
                  <InputLabel>Role</InputLabel>
                  <Select value={selectedRoleId} label="Role" onChange={(e) => setSelectedRoleId(String(e.target.value))}>
                    <MenuItem value="">Select role</MenuItem>
                    {(roles.data || []).map((role: any) => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  disabled={!roleEmployeeId || !selectedRoleId}
                  onClick={submitAssignRole}
                >
                  Assign role
                </Button>
              </Stack>

              {(roles.data || []).length === 0 && (
                <EmployeesEmptyState title="No roles available" description="No assignable roles were returned by the backend." />
              )}
            </Stack>
          )}
        </Card>
      )}

      {tab === 'attendance' && (
        <Card sx={{ p: 2.5 }}>
          {attendance.loading && <CircularProgress />}
          {attendance.error && <EmployeesUnavailableState title="Attendance unavailable" description="Attendance service is currently unavailable." />}
          {!attendance.loading && !attendance.error && (attendance.data || []).length === 0 && (
            <EmployeesEmptyState title="No attendance records" description="No attendance records were found for the selected range." />
          )}
          {!attendance.loading && !attendance.error && (attendance.data || []).length > 0 && (
            <Stack spacing={1}>
              {(attendance.data || []).map((a: any) => (
                <Card key={a.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="subtitle2">{a.employeeName || 'Employee'}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    In: {a.clockIn || 'Unavailable'} | Out: {a.clockOut || 'Unavailable'} | Hours: {a.totalHours ?? 'Unavailable'}
                  </Typography>
                </Card>
              ))}
            </Stack>
          )}
        </Card>
      )}

      {tab === 'time_off' && (
        <Card sx={{ p: 2.5 }}>
          {leaves.loading && <CircularProgress />}
          {leaves.error && <EmployeesUnavailableState title="Time off unavailable" description="Time off requests are currently unavailable." />}
          {!leaves.loading && !leaves.error && (leaves.data || []).length === 0 && (
            <EmployeesEmptyState title="No time off requests" description="No pending or historical time off requests found." />
          )}
          {!leaves.loading && !leaves.error && (leaves.data || []).length > 0 && (
            <Stack spacing={1}>
              {(leaves.data || []).map((t: any) => (
                <Card key={t.id} variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="subtitle2">{t.employeeName || 'Employee'} - {t.status}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t.startDate} to {t.endDate}
                  </Typography>
                </Card>
              ))}
            </Stack>
          )}
        </Card>
      )}

      {tab === 'documents' && (
        <Card sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            <FormControl size="small" sx={{ maxWidth: 360 }}>
              <InputLabel>Employee</InputLabel>
              <Select
                value={documentEmployeeId}
                label="Employee"
                onChange={(e) => setDocumentEmployeeId(String(e.target.value))}
              >
                <MenuItem value="">Select employee</MenuItem>
                {(employees.data || []).map((e: any) => (
                  <MenuItem key={e.id} value={e.id}>
                    {e.displayName || `${e.firstName} ${e.lastName}`.trim() || e.email || e.id}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {documentEmployeeId && (
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                <TextField
                  size="small"
                  label="Document name"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                />
                <TextField
                  size="small"
                  label="Document URL"
                  value={documentUrl}
                  onChange={(e) => setDocumentUrl(e.target.value)}
                  fullWidth
                />
                <Button
                  variant="contained"
                  onClick={submitUploadDocument}
                  disabled={!documentName || !documentUrl}
                >
                  Upload
                </Button>
              </Stack>
            )}

            {!documentEmployeeId && (
              <EmployeesEmptyState title="Select an employee" description="Choose an employee to manage documents." />
            )}

            {documentEmployeeId && documents.loading && <CircularProgress />}
            {documentEmployeeId && documents.error && (
              <EmployeesErrorState title="Documents unavailable" description="Could not load employee documents." />
            )}
            {documentEmployeeId && !documents.loading && !documents.error && (documents.data || []).length === 0 && (
              <EmployeesEmptyState title="No documents" description="No documents are linked to this employee yet." />
            )}
            {documentEmployeeId && (documents.data || []).length > 0 && (
              <Stack spacing={1}>
                {(documents.data || []).map((doc: any) => (
                  <Card key={doc.id} variant="outlined" sx={{ p: 1.5 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                      <Box>
                        <Typography variant="subtitle2">{doc.name}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {doc.fileUrl || 'Unavailable'}
                        </Typography>
                      </Box>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        {doc.fileUrl && (
                          <Button size="small" href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                            Open
                          </Button>
                        )}
                        <IconButton size="small" color="error" onClick={() => handleDeleteDocument(doc.id)}>
                          <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Card>
                ))}
              </Stack>
            )}
          </Stack>
        </Card>
      )}

      {tab === 'settings' && (
        <Card sx={{ p: 2.5 }}>
          {settings.loading && <CircularProgress />}
          {settings.error && <EmployeesUnavailableState title="Settings unavailable" description="Employee settings are not available yet." />}
          {!settings.loading && !settings.error && (
            <Stack spacing={2}>
              <Alert severity="info">Enter JSON values for each setting. Leave blank to keep unchanged.</Alert>
              <TextField
                multiline
                minRows={2}
                label="Employment types"
                placeholder='["full_time","part_time","contractor"]'
                value={settingsForm.employmentTypes}
                onChange={(e) => setSettingsForm((prev) => ({ ...prev, employmentTypes: e.target.value }))}
              />
              <TextField
                multiline
                minRows={2}
                label="Attendance rules"
                placeholder='{"allowLateClockIn": true}'
                value={settingsForm.attendanceRules}
                onChange={(e) => setSettingsForm((prev) => ({ ...prev, attendanceRules: e.target.value }))}
              />
              <TextField
                multiline
                minRows={2}
                label="Time-off types"
                placeholder='["vacation","sick","unpaid"]'
                value={settingsForm.timeOffTypes}
                onChange={(e) => setSettingsForm((prev) => ({ ...prev, timeOffTypes: e.target.value }))}
              />
              <TextField
                multiline
                minRows={2}
                label="Work week"
                placeholder='{"days":["Mon","Tue","Wed","Thu","Fri"]}'
                value={settingsForm.workWeek}
                onChange={(e) => setSettingsForm((prev) => ({ ...prev, workWeek: e.target.value }))}
              />
              <TextField
                multiline
                minRows={2}
                label="Document types"
                placeholder='["contract","id","tax","certificate"]'
                value={settingsForm.documentTypes}
                onChange={(e) => setSettingsForm((prev) => ({ ...prev, documentTypes: e.target.value }))}
              />
              <Button
                variant="contained"
                onClick={() => {
                  try {
                    setSettingsFormError('');
                    const payload = {
                      employmentTypes: parseSettingsField(settingsForm.employmentTypes, 'Employment types'),
                      attendanceRules: parseSettingsField(settingsForm.attendanceRules, 'Attendance rules'),
                      timeOffTypes: parseSettingsField(settingsForm.timeOffTypes, 'Time-off types'),
                      workWeek: parseSettingsField(settingsForm.workWeek, 'Work week'),
                      documentTypes: parseSettingsField(settingsForm.documentTypes, 'Document types'),
                    };
                    submitSaveSettings(payload);
                  } catch (error: any) {
                    setSettingsFormError(error?.message || 'Invalid settings payload');
                  }
                }}
              >
                Save settings
              </Button>
              {settingsFormError && <Alert severity="error">{settingsFormError}</Alert>}
            </Stack>
          )}
        </Card>
      )}

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Employee</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="First name" value={form.firstName} onChange={(e) => setForm((prev: any) => ({ ...prev, firstName: e.target.value }))} />
            <TextField label="Last name" value={form.lastName} onChange={(e) => setForm((prev: any) => ({ ...prev, lastName: e.target.value }))} />
            <TextField label="Email" value={form.email} onChange={(e) => setForm((prev: any) => ({ ...prev, email: e.target.value }))} />
            <TextField label="Phone" value={form.phone} onChange={(e) => setForm((prev: any) => ({ ...prev, phone: e.target.value }))} />
            <TextField label="Job title" value={form.jobTitle} onChange={(e) => setForm((prev: any) => ({ ...prev, jobTitle: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitCreate}>Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(editEmployee)} onClose={() => setEditEmployee(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Employee</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="First name" value={form.firstName} onChange={(e) => setForm((prev: any) => ({ ...prev, firstName: e.target.value }))} />
            <TextField label="Last name" value={form.lastName} onChange={(e) => setForm((prev: any) => ({ ...prev, lastName: e.target.value }))} />
            <TextField label="Email" value={form.email} onChange={(e) => setForm((prev: any) => ({ ...prev, email: e.target.value }))} />
            <TextField label="Phone" value={form.phone} onChange={(e) => setForm((prev: any) => ({ ...prev, phone: e.target.value }))} />
            <TextField label="Job title" value={form.jobTitle} onChange={(e) => setForm((prev: any) => ({ ...prev, jobTitle: e.target.value }))} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditEmployee(null)}>Cancel</Button>
          <Button variant="contained" onClick={submitEdit}>Save</Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
