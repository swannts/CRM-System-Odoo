import dayjs from 'dayjs';
import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import { updateAppointmentStatus, rescheduleAppointment } from 'src/services/booking-service';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

// ----------------------------------------------------------------------


interface Props {
  appointments: any[];
  loading: boolean;
  onRefresh: () => Promise<unknown>;
}

export function AppointmentsTab({ appointments, loading, onRefresh }: Props) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [rescheduling, setRescheduling] = useState<string | null>(null);
  const [newTime, setNewTime] = useState('');
  const saveSchedule = async () => {
    if (!rescheduling || !newTime) return;
    setBusy(rescheduling);
    setError('');
    try {
      await rescheduleAppointment(rescheduling, new Date(newTime).toISOString());
      setRescheduling(null);
      await onRefresh();
    } catch {
      setError('Unable to reschedule. Choose an available future time within the booking schedule and try again.');
    } finally { setBusy(null); }
  };
  const changeStatus = async (id: string, status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED') => {
    setBusy(id);
    setError('');
    try {
      await updateAppointmentStatus(id, status);
      await onRefresh();
    } catch {
      setError('Could not update or refresh appointments. Please reload and try again.');
    } finally {
      setBusy(null);
    }
  };
  if (loading) {
    return (
      <Box sx={{ p: 5, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      {error && <Alert severity="error">{error}</Alert>}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Customer</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Date & Time</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(appointments || []).map((row: any) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Typography variant="subtitle2">{row.guestName || row.name || 'Guest'}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>{row.guestEmail || row.email}</Typography>
                </TableCell>
                <TableCell>{row.bookingType?.title}</TableCell>
                <TableCell>
                  <Typography variant="body2">{dayjs(row.startTime).format('MMM D, YYYY')}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>{dayjs(row.startTime).format('h:mm A')}</Typography>
                </TableCell>

                <TableCell>
                  <Chip
                    label={row.status}
                    color={
                      (row.status === 'CONFIRMED' && 'success') ||
                      (row.status === 'PENDING' && 'warning') ||
                      (row.status === 'CANCELLED' && 'error') ||
                      'default'
                    }
                    size="small"
                    variant="soft"
                  />
                </TableCell>
                <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {row.notes || '-'}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    {row.status === 'PENDING' && <Button disabled={busy !== null} onClick={() => changeStatus(row.id, 'CONFIRMED')}>Confirm</Button>}
                    {row.status === 'CONFIRMED' && <Button disabled={busy !== null} onClick={() => changeStatus(row.id, 'COMPLETED')}>Complete</Button>}
                    {['PENDING', 'CONFIRMED'].includes(row.status) && <Button disabled={busy !== null} onClick={() => { setRescheduling(row.id); setNewTime(dayjs(row.startTime).format('YYYY-MM-DDTHH:mm')); setError(''); }}>Reschedule</Button>}
                    {['PENDING', 'CONFIRMED'].includes(row.status) && <Button color="error" disabled={busy !== null} onClick={() => changeStatus(row.id, 'CANCELLED')}>Cancel</Button>}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {appointments?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: 'center', py: 10 }}>
                  <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                    No appointments found.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={rescheduling !== null} onClose={() => { if (!busy) setRescheduling(null); }}>
        <DialogTitle>Reschedule appointment</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField sx={{ mt: 1 }} type="datetime-local" label="New start time" value={newTime} onChange={event => setNewTime(event.target.value)} InputLabelProps={{ shrink: true }} helperText={`Your local timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}. The booking's availability and buffer still apply.`} />
        </DialogContent>
        <DialogActions>
          <Button disabled={busy !== null} onClick={() => setRescheduling(null)}>Back</Button>
          <Button disabled={busy !== null || !newTime} onClick={saveSchedule}>Save</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
