'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { 
  fetchEmployeesThunk, 
  fetchAttendanceThunk, 
  fetchLeavesThunk, 
  fetchShiftsThunk, 
  selectEmployees 
} from 'src/store/slices/employee-slice';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TextField from '@mui/material/TextField';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import InputAdornment from '@mui/material/InputAdornment';
import TablePagination from '@mui/material/TablePagination';
import CircularProgress from '@mui/material/CircularProgress';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'name', label: 'Employee' },
  { id: 'email', label: 'Email' },
  { id: 'shifts', label: 'Total Shifts' },
  { id: 'categories', label: 'Categories' },
  { id: 'action', label: 'Action', align: 'right' as const },
];

// ----------------------------------------------------------------------

export function EmployeeListView() {
  const dispatch = useAppDispatch();
  const { employees, attendance, leaves, shifts } = useAppSelector(selectEmployees);

  const [viewTab, setViewTab] = useState<'employees' | 'attendance' | 'leave' | 'shifts'>('employees');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [statusTab, setStatusTab] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    if (viewTab === 'employees') {
      dispatch(fetchEmployeesThunk({
        page: page + 1,
        pageSize: rowsPerPage,
        search,
        type: statusTab === 'all' ? undefined : statusTab,
      }));
    } else if (viewTab === 'attendance') {
      dispatch(fetchAttendanceThunk({ page: 1, pageSize: 20, search }));
    } else if (viewTab === 'leave') {
      dispatch(fetchLeavesThunk({ page: 1, pageSize: 20 }));
    } else if (viewTab === 'shifts') {
      dispatch(fetchShiftsThunk({ page: 1, pageSize: 20 }));
    }
  }, [dispatch, viewTab, search, page, rowsPerPage, statusTab]);

  const employeesData = employees.data;
  const total = employees.total;
  const isLoading = employees.loading;
  const isAttendanceLoading = attendance.loading;
  const isLeaveLoading = leaves.loading;
  const isShiftsLoading = shifts.loading;

  return (
    <DashboardContent maxWidth="xl">
      <Box sx={{ mb: 5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h4">Employees</Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
        >
          New Schedule
        </Button>
      </Box>

      <Card>
        <Box sx={{ p: 2 }}>
          <Tabs
            value={viewTab}
            onChange={(_, value) => {
              setViewTab(value);
              setPage(0);
            }}
            sx={{ mb: 2 }}
          >
            <Tab value="employees" label="Employees" />
            <Tab value="attendance" label="Attendance" />
            <Tab value="leave" label="Leave Requests" />
            <Tab value="shifts" label="Shifts" />
          </Tabs>

          {viewTab === 'employees' ? (
            <Tabs
              value={statusTab}
              onChange={(_, value) => {
                setStatusTab(value);
                setPage(0);
              }}
              sx={{ mb: 2 }}
            >
              <Tab value="all" label="All" />
              <Tab value="active" label="Active" />
              <Tab value="inactive" label="Inactive" />
            </Tabs>
          ) : null}

          <TextField
            fullWidth
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Search employees..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
          <Scrollbar>
            <Table sx={{ minWidth: 800 }}>
              {viewTab === 'employees' ? (
                <>
                  <TableHead>
                    <TableRow>
                      {TABLE_HEAD.map((headCell) => (
                        <TableCell key={headCell.id} align={headCell.align}>
                          {headCell.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isLoading && !employeesData.length ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {employeesData.map((row: any) => (
                          <TableRow key={row._id} hover>
                            <TableCell sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar alt={row.fullName} src={row.photo} sx={{ mr: 2 }} />
                              {row.fullName}
                            </TableCell>
                            <TableCell>{row.email}</TableCell>
                            <TableCell>{row.totalShifts}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                {row.categories?.map((cat: any) => (
                                  <Chip key={cat._id} label={cat.name} size="small" variant="outlined" />
                                ))}
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <IconButton>
                                <Iconify icon="eva:more-vertical-fill" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                        {employeesData.length === 0 && !isLoading && (
                          <TableRow>
                            <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                              <Typography variant="h6">No data found</Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    )}
                  </TableBody>
                </>
              ) : null}

              {viewTab === 'attendance' ? (
                <>
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Check In</TableCell>
                      <TableCell>Check Out</TableCell>
                      <TableCell>Worked Hours</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isAttendanceLoading && !attendance.data.length ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 10 }}>
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : attendance.data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 10 }}>
                          <Typography variant="h6">No attendance records</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      attendance.data.map((row: any) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.employee_id?.[1] || '-'}</TableCell>
                          <TableCell>{row.check_in || '-'}</TableCell>
                          <TableCell>{row.check_out || '-'}</TableCell>
                          <TableCell>{row.worked_hours ?? 0}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </>
              ) : null}

              {viewTab === 'leave' ? (
                <>
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>From</TableCell>
                      <TableCell>To</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isLeaveLoading && !leaves.data.length ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : leaves.data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                          <Typography variant="h6">No leave requests</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      leaves.data.map((row: any) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.employee_id?.[1] || '-'}</TableCell>
                          <TableCell>{row.holiday_status_id?.[1] || '-'}</TableCell>
                          <TableCell>{row.request_date_from || '-'}</TableCell>
                          <TableCell>{row.request_date_to || '-'}</TableCell>
                          <TableCell>{row.state || '-'}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </>
              ) : null}

              {viewTab === 'shifts' ? (
                <>
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Start</TableCell>
                      <TableCell>End</TableCell>
                      <TableCell>Hours</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isShiftsLoading && !shifts.data.length ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                          <CircularProgress />
                        </TableCell>
                      </TableRow>
                    ) : shifts.data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                          <Typography variant="h6">No shifts found</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      shifts.data.map((row: any) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.employee_id?.[1] || '-'}</TableCell>
                          <TableCell>{row.name || '-'}</TableCell>
                          <TableCell>{row.start_datetime || '-'}</TableCell>
                          <TableCell>{row.end_datetime || '-'}</TableCell>
                          <TableCell>{row.allocated_hours ?? 0}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </>
              ) : null}
            </Table>
          </Scrollbar>
        </TableContainer>

        {employees.error ? (
          <Box sx={{ px: 2, pb: 2 }}>
            <Alert severity="error">Failed to load employees. Please refresh.</Alert>
          </Box>
        ) : null}

        {viewTab === 'employees' ? (
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 50]}
          />
        ) : null}
      </Card>
    </DashboardContent>
  );
}
