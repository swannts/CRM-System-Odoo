'use client';

import { z as zod } from 'zod';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { fetchProjects, selectProjects } from 'src/store/slices/project-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import Skeleton from '@mui/material/Skeleton';
import TableBody from '@mui/material/TableBody';
import TextField from '@mui/material/TextField';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { DashboardContent } from 'src/layouts/dashboard';
import { projectService } from 'src/services/project-service';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { Form, RHFTextField } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'title', label: 'Project Name' },
  { id: 'description', label: 'Description' },
  { id: 'createdAt', label: 'Created At' },
  { id: 'status', label: 'Status' },
  { id: 'action', label: 'Action', align: 'right' as const },
];

export const NewProjectSchema = zod.object({
  name: zod.string().min(1, { message: 'Project name is required!' }),
  description: zod.string(),
});

// ----------------------------------------------------------------------

export function ProjectListView() {
  const dispatch = useAppDispatch();
  const projectState = useAppSelector(selectProjects);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const quickEdit = useBoolean();

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const projects = projectState.projects.data;
  const isLoading = projectState.projects.loading;

  const methods = useForm({
    resolver: zodResolver(NewProjectSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await projectService.createProject(data);
      reset();
      quickEdit.onFalse();
      dispatch(fetchProjects());
    } catch (error) {
      console.error(error);
    }
  });

  const filteredProjects = projects.filter((project: any) =>
    (project.name || project.title || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardContent maxWidth="xl">
      <Box sx={{ mb: 5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h4">Project Manager</Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={quickEdit.onTrue}
        >
          New Project
        </Button>
      </Box>

      <Card>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
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
                {isLoading ? (
                  [...Array(5)].map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="80%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="40%" /></TableCell>
                      <TableCell><Skeleton variant="text" width="40%" /></TableCell>
                      <TableCell align="right"><Skeleton variant="circular" width={32} height={32} /></TableCell>
                    </TableRow>
                  ))
                ) : (
                  <>
                    {filteredProjects.map((row: any) => (
                      <TableRow key={row.id || row._id} hover>
                        <TableCell>
                          <Typography
                            variant="subtitle2"
                            onClick={() => router.push(paths.dashboard.project(row.id || row._id))}
                            sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                          >
                            {row.name || row.title || 'Untitled project'}
                          </Typography>
                        </TableCell>
                        <TableCell>{row.description || 'No description'}</TableCell>
                        <TableCell>{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : 'N/A'}</TableCell>
                        <TableCell>{row.status || 'Active'}</TableCell>
                        <TableCell align="right">
                          <IconButton onClick={() => router.push(paths.dashboard.project(row.id || row._id))}>
                            <Iconify icon="eva:arrow-ios-forward-fill" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}

                    {filteredProjects.length === 0 && !isLoading && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                          <Typography variant="h6">No projects found</Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>
      </Card>

      <Dialog fullWidth maxWidth="sm" open={quickEdit.value} onClose={quickEdit.onFalse}>
        <Form methods={methods} onSubmit={onSubmit}>
          <DialogTitle>New Project</DialogTitle>

          <DialogContent>
            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns="1fr"
              sx={{ p: 3 }}
            >
              <RHFTextField name="name" label="Project Name" />
              <RHFTextField name="description" label="Description" multiline rows={4} />
            </Box>
          </DialogContent>

          <DialogActions>
            <Button variant="outlined" onClick={quickEdit.onFalse}>
              Cancel
            </Button>

            <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
              Create
            </LoadingButton>
          </DialogActions>
        </Form>
      </Dialog>
    </DashboardContent>
  );
}
