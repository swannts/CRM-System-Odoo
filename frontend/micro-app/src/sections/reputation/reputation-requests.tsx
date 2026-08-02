'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { fetchReputationRequests, sendReviewRequestThunk, selectReputation } from 'src/store/slices/reputation-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';

import { fDate } from 'src/utils/format-time';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function ReputationRequests() {
  const dispatch = useAppDispatch();
  const { requests } = useAppSelector(selectReputation);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    dispatch(fetchReputationRequests());
  }, [dispatch]);

  const handleSendRequest = async () => {
    try {
      setIsSending(true);
      await dispatch(sendReviewRequestThunk({})).unwrap();
      toast.success('Review request sent!');
      dispatch(fetchReputationRequests());
    } catch (error) {
      toast.error(error || 'Failed to send request');
    } finally {
      setIsSending(false);
    }
  };

  const requestsData = requests.data;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>Send New Request</Typography>
          <Stack spacing={3}>
            <TextField fullWidth label="Customer Name" placeholder="John Doe" />
            <TextField fullWidth label="Email or Phone" placeholder="john@example.com" />
            <TextField
              select
              fullWidth
              label="Request Template"
              defaultValue="standard"
              SelectProps={{ native: true }}
            >
              <option value="standard">Standard Request</option>
              <option value="discount">Incentivized (Discount)</option>
              <option value="personal">Personal Note</option>
            </TextField>
            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={isSending ? <CircularProgress size={20} color="inherit" /> : <Iconify icon="solar:send-bold" />}
              disabled={isSending}
              onClick={handleSendRequest}
            >
              Send Request
            </Button>
          </Stack>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>Sent Requests</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer</TableCell>
                  <TableCell>Sent Date</TableCell>
                  <TableCell>Platform</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requestsData.map((row: any) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Typography variant="subtitle2">{row.customerName}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{row.contact}</Typography>
                    </TableCell>
                    <TableCell>{fDate(row.sentDate)}</TableCell>
                    <TableCell>
                      <Iconify icon={row.platform === 'google' ? 'logos:google-icon' : 'logos:facebook'} width={20} />
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          px: 1,
                          py: 0.5,
                          borderRadius: 0.75,
                          typography: 'caption',
                          fontWeight: 'bold',
                          display: 'inline-flex',
                          bgcolor: row.status === 'Opened' ? 'info.lighter' : 'success.lighter',
                          color: row.status === 'Opened' ? 'info.darker' : 'success.darker',
                        }}
                      >
                        {row.status}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {requestsData.length === 0 && !requests.loading && (
                  <TableRow>
                    <TableCell colSpan={4} sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                      No requests sent yet.
                    </TableCell>
                  </TableRow>
                )}
                {requests.loading && requestsData.length === 0 && (
                   <TableRow>
                     <TableCell colSpan={4} sx={{ textAlign: 'center', py: 3 }}>
                       <CircularProgress size={32} />
                     </TableCell>
                   </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Grid>
    </Grid>
  );
}

// ----------------------------------------------------------------------

export function ReputationSettings() {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>Request Templates</Typography>
          <Stack spacing={3}>
             <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Email Template</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  defaultValue="Hi {{name}}, we'd love to hear your feedback on your recent experience with us. Could you take a moment to leave us a review?"
                />
             </Box>
             <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>SMS Template</Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  defaultValue="Hi {{name}}, thanks for visiting! Please leave us a review here: {{link}}"
                />
             </Box>
             <Button variant="contained">Save Templates</Button>
          </Stack>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>Automation</Typography>
          <Stack spacing={2}>
             <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                   <Typography variant="subtitle2">Auto-Request Reviews</Typography>
                   <Typography variant="caption" color="text.secondary">Send request automatically after a purchase.</Typography>
                </Box>
                <div className="form-switch">
                   <input type="checkbox" defaultChecked />
                </div>
             </Stack>
             <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                   <Typography variant="subtitle2">Negative Review Alert</Typography>
                   <Typography variant="caption" color="text.secondary">Notify manager if a review is below 3 stars.</Typography>
                </Box>
                <div className="form-switch">
                   <input type="checkbox" defaultChecked />
                </div>
             </Stack>
          </Stack>
        </Card>
      </Grid>
    </Grid>
  );
}
