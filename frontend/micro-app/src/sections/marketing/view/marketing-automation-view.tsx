'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import {
  fetchSequences,
  fetchEnrollments,
  selectMarketing,
  createSequence,
  updateSequence,
  deleteSequence as deleteSequenceThunk,
  enrollInSequence,
  sequenceEnrollmentAction,
} from 'src/store/slices/marketing-slice';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableContainer from '@mui/material/TableContainer';
import IconButton from '@mui/material/IconButton';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import MenuItem from '@mui/material/MenuItem';
import Alert from '@mui/material/Alert';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';

import { emailSequenceService, type EmailSequence, type SequenceStep } from '../services/email-sequence-service';

const EMPTY_STEP: SequenceStep = { stepNumber: 1, type: 'email', delayDays: 0, templateId: '' };

export function MarketingAutomationView() {
  const dispatch = useAppDispatch();
  const { sequences: sequencesState, enrollments: enrollmentsState } = useAppSelector(selectMarketing);

  const sequences = sequencesState.data;
  const enrollments = enrollmentsState.data;
  const loading = sequencesState.loading || enrollmentsState.loading;
  const error = sequencesState.error || enrollmentsState.error;

  const [selectedId, setSelectedId] = useState<string>('');
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null);

  const [openEditor, setOpenEditor] = useState(false);
  const [openEnroll, setOpenEnroll] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<SequenceStep[]>([EMPTY_STEP]);

  const [enrollEmail, setEnrollEmail] = useState('');
  const [enrollFirstName, setEnrollFirstName] = useState('');
  const [enrollLastName, setEnrollLastName] = useState('');
  const [enrollCompanyName, setEnrollCompanyName] = useState('');
  const [enrollDealName, setEnrollDealName] = useState('');

  const selectedSequence = useMemo(() => sequences.find((s) => s.id === selectedId), [sequences, selectedId]);

  const loadSequences = async () => {
    const result = await dispatch(fetchSequences()).unwrap();
    if (!selectedId && result?.[0]?.id) setSelectedId(result[0].id);
  };

  const loadEnrollments = async (sequenceId: string) => {
    dispatch(fetchEnrollments(sequenceId));
  };

  useEffect(() => {
    loadSequences();
  }, []);

  useEffect(() => {
    if (selectedId) loadEnrollments(selectedId);
  }, [selectedId]);

  const resetEditor = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setSteps([EMPTY_STEP]);
  };

  const openCreate = () => {
    resetEditor();
    setOpenEditor(true);
  };

  const openEdit = (sequence: EmailSequence) => {
    setEditingId(sequence.id);
    setName(sequence.name || '');
    setDescription(sequence.description || '');
    setSteps((sequence.steps as SequenceStep[])?.length ? (sequence.steps as SequenceStep[]) : [EMPTY_STEP]);
    setOpenEditor(true);
  };

  const saveSequence = async () => {
    const payload = { name, description, steps };
    if (editingId) {
      await dispatch(updateSequence({ id: editingId, payload })).unwrap();
    } else {
      await dispatch(createSequence(payload)).unwrap();
    }
    setOpenEditor(false);
    await loadSequences();
  };

  const deleteSequence = async (id: string) => {
    await dispatch(deleteSequenceThunk(id)).unwrap();
    if (selectedId === id) setSelectedId('');
    await loadSequences();
  };

  const toggleActive = async (sequence: EmailSequence, isActive: boolean) => {
    await dispatch(updateSequence({ id: sequence.id, payload: { isActive } })).unwrap();
    await loadSequences();
  };

  const submitEnrollment = async () => {
    if (!selectedId) return;
    await dispatch(enrollInSequence({
      id: selectedId,
      payload: {
        contactEmail: enrollEmail,
        firstName: enrollFirstName,
        lastName: enrollLastName,
        companyName: enrollCompanyName,
        dealName: enrollDealName,
      }
    })).unwrap();
    setOpenEnroll(false);
    setEnrollEmail('');
    setEnrollFirstName('');
    setEnrollLastName('');
    setEnrollCompanyName('');
    setEnrollDealName('');
    await loadEnrollments(selectedId);
    await loadSequences();
  };

  const enrollmentAction = async (id: string, action: 'pause' | 'resume' | 'cancel') => {
    await dispatch(sequenceEnrollmentAction({ id, action })).unwrap();
    if (selectedId) await loadEnrollments(selectedId);
  };

  const showEnrollment = async (id: string) => {
    const details = await emailSequenceService.getEnrollment(id);
    setSelectedEnrollment(details);
  };

  return (
    <DashboardContent maxWidth="xl">
      <Stack direction={{ xs: 'column', md: 'row' }} alignItems={{ xs: 'flex-start', md: 'center' }} justifyContent="space-between" sx={{ mb: { xs: 3, md: 5 } }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 1 }}>Email Sequences</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Build and run multi-step sequence automation with enrollment monitoring.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <Button variant="outlined" disabled={!selectedId} startIcon={<Iconify icon="solar:user-plus-bold" />} onClick={() => setOpenEnroll(true)}>
            Enroll Contact
          </Button>
          <Button variant="contained" startIcon={<Iconify icon="mingcute:add-line" />} onClick={openCreate}>
            Create Sequence
          </Button>
        </Stack>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Card sx={{ mb: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Sequence</TableCell>
                <TableCell>Steps</TableCell>
                <TableCell>Enrollments</TableCell>
                <TableCell>Total Delay</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sequences.map((sequence) => (
                <TableRow key={sequence.id} hover selected={sequence.id === selectedId} onClick={() => setSelectedId(sequence.id)} sx={{ cursor: 'pointer' }}>
                  <TableCell>
                    <Typography variant="subtitle2">{sequence.name}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{sequence.description || 'No description'}</Typography>
                  </TableCell>
                  <TableCell>{(sequence.steps as SequenceStep[])?.length || 0}</TableCell>
                  <TableCell>{sequence.enrollmentCount || 0}</TableCell>
                  <TableCell>{sequence.totalDuration || 0}d</TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Switch checked={!!sequence.isActive} onChange={(_, checked) => toggleActive(sequence, checked)} />
                      <Label variant="soft" color={sequence.isActive ? 'success' : 'default'}>{sequence.isActive ? 'active' : 'inactive'}</Label>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={(e) => { e.stopPropagation(); openEdit(sequence); }}><Iconify icon="solar:pen-bold" /></IconButton>
                    <IconButton color="error" onClick={(e) => { e.stopPropagation(); deleteSequence(sequence.id); }}><Iconify icon="solar:trash-bin-trash-bold" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && sequences.length === 0 && (
                <TableRow><TableCell colSpan={6}><Typography variant="body2" sx={{ color: 'text.secondary' }}>No sequences yet.</Typography></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Card>
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Enrollment Status</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Contact</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Current Step</TableCell>
                  <TableCell>Started</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {enrollments.map((enrollment) => (
                  <TableRow key={enrollment.id} hover>
                    <TableCell>{enrollment.contactEmail}</TableCell>
                    <TableCell><Chip size="small" label={enrollment.status} /></TableCell>
                    <TableCell>{enrollment.currentStep}</TableCell>
                    <TableCell>{new Date(enrollment.startedAt).toLocaleString()}</TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => showEnrollment(enrollment.id)}>View</Button>
                      <Button size="small" onClick={() => enrollmentAction(enrollment.id, 'pause')}>Pause</Button>
                      <Button size="small" onClick={() => enrollmentAction(enrollment.id, 'resume')}>Resume</Button>
                      <Button size="small" color="error" onClick={() => enrollmentAction(enrollment.id, 'cancel')}>Cancel</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {selectedId && enrollments.length === 0 && (
                  <TableRow><TableCell colSpan={5}><Typography variant="body2" sx={{ color: 'text.secondary' }}>No enrollments for selected sequence.</Typography></TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Card>

      <Dialog open={openEditor} onClose={() => setOpenEditor(false)} fullWidth maxWidth="md">
        <DialogTitle>{editingId ? 'Edit Sequence' : 'Create Sequence'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} multiline minRows={2} />
            {steps.map((step, idx) => (
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} key={`${step.stepNumber}-${idx}`}>
                <TextField label="Step #" type="number" value={step.stepNumber} onChange={(e) => {
                  const next = [...steps];
                  next[idx] = { ...next[idx], stepNumber: Number(e.target.value) };
                  setSteps(next);
                }} />
                <TextField select label="Type" value={step.type} onChange={(e) => {
                  const next = [...steps];
                  next[idx] = { ...next[idx], type: e.target.value as SequenceStep['type'] };
                  setSteps(next);
                }}>
                  <MenuItem value="email">email</MenuItem>
                  <MenuItem value="wait">wait</MenuItem>
                  <MenuItem value="task">task</MenuItem>
                </TextField>
                <TextField label="Delay Days" type="number" value={step.delayDays} onChange={(e) => {
                  const next = [...steps];
                  next[idx] = { ...next[idx], delayDays: Number(e.target.value) };
                  setSteps(next);
                }} />
                <TextField label="Template ID" value={step.templateId || ''} onChange={(e) => {
                  const next = [...steps];
                  next[idx] = { ...next[idx], templateId: e.target.value };
                  setSteps(next);
                }} />
              </Stack>
            ))}
            <Button variant="outlined" onClick={() => setSteps((prev) => [...prev, { ...EMPTY_STEP, stepNumber: prev.length + 1 }])}>Add Step</Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditor(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveSequence}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openEnroll} onClose={() => setOpenEnroll(false)} fullWidth maxWidth="sm">
        <DialogTitle>Enroll Contact</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Contact Email" value={enrollEmail} onChange={(e) => setEnrollEmail(e.target.value)} />
            <TextField label="First Name" value={enrollFirstName} onChange={(e) => setEnrollFirstName(e.target.value)} />
            <TextField label="Last Name" value={enrollLastName} onChange={(e) => setEnrollLastName(e.target.value)} />
            <TextField label="Company Name" value={enrollCompanyName} onChange={(e) => setEnrollCompanyName(e.target.value)} />
            <TextField label="Deal Name" value={enrollDealName} onChange={(e) => setEnrollDealName(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEnroll(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitEnrollment} disabled={!selectedId}>Enroll</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!selectedEnrollment} onClose={() => setSelectedEnrollment(null)} fullWidth maxWidth="md">
        <DialogTitle>Enrollment Timeline</DialogTitle>
        <DialogContent>
          {!selectedEnrollment ? null : (
            <Stack spacing={1} sx={{ pt: 1 }}>
              <Typography variant="body2">Contact: {selectedEnrollment.contactEmail}</Typography>
              <Typography variant="body2">Status: {selectedEnrollment.status}</Typography>
              {(selectedEnrollment.activities || []).map((a: any) => (
                <Box key={a.id} sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle2">Step {a.stepNumber} ({a.type})</Typography>
                  <Typography variant="caption">Status: {a.status}</Typography>
                  <Typography variant="caption" sx={{ display: 'block' }}>Scheduled: {new Date(a.scheduledAt).toLocaleString()}</Typography>
                  {a.errorMessage ? <Typography variant="caption" color="error" sx={{ display: 'block' }}>{a.errorMessage}</Typography> : null}
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedEnrollment(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
