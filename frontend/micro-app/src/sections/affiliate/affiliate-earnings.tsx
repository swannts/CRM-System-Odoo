'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { 
  fetchAffiliateEarningsThunk, 
  fetchAffiliateReceiptsThunk, 
  sendAffiliateInvitationThunk,
  selectAffiliate 
} from 'src/store/slices/affiliate-slice';

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
import IconButton from '@mui/material/IconButton';
import TableContainer from '@mui/material/TableContainer';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function AffiliateEarnings() {
  const dispatch = useAppDispatch();
  const { earnings, receipts } = useAppSelector(selectAffiliate);
  const [isInvitationPending, setIsInvitationPending] = useState(false);

  useEffect(() => {
    dispatch(fetchAffiliateEarningsThunk());
    dispatch(fetchAffiliateReceiptsThunk());
  }, [dispatch]);

  const handleInviteSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    if (!email) return;

    try {
      setIsInvitationPending(true);
      await dispatch(sendAffiliateInvitationThunk(email)).unwrap();
      toast.success('Invitation sent successfully!');
      (event.target as HTMLFormElement).reset();
    } catch (err) {
      toast.error(err || 'Failed to send invitation');
    } finally {
      setIsInvitationPending(false);
    }
  };

  const earningsData = (earnings.data as any) || {};

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <SummaryCard title="Total Earned" value={earningsData.totalEarned || 0} icon="solar:wad-of-money-bold-duotone" color="success" />
        </Grid>
        <Grid item xs={12} md={4}>
          <SummaryCard title="Pending Payout" value={earningsData.pendingPayout || 0} icon="solar:clock-circle-bold-duotone" color="warning" />
        </Grid>
        <Grid item xs={12} md={4}>
          <SummaryCard title="Conversion Rate" value={`${earningsData.conversionRate || 0}%`} icon="solar:chart-2-bold-duotone" color="info" isCurrency={false} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3, minHeight: 400 }}>
             <Typography variant="h6" sx={{ mb: 3 }}>Weekly Earning Report</Typography>
             <Box sx={{ height: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', px: 2 }}>
                {[45, 67, 32, 90, 54, 76, 50].map((val, i) => (
                   <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: val * 2.5,
                          bgcolor: 'primary.main',
                          borderRadius: 0.5,
                          opacity: 0.8,
                          '&:hover': { opacity: 1 }
                        }}
                      />
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                      </Typography>
                   </Box>
                ))}
             </Box>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 1 }}>Invite Friends</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
              Spread the word and earn more commission.
            </Typography>

            <form onSubmit={handleInviteSubmit}>
              <Stack spacing={2}>
                <TextField fullWidth name="email" label="Email Address" placeholder="friend@example.com" />
                <Button fullWidth variant="contained" type="submit" disabled={isInvitationPending}>
                  Send Invitation
                </Button>
              </Stack>
            </form>

            <Box sx={{ mt: 4, p: 2, borderRadius: 1.5, bgcolor: 'primary.lighter', color: 'primary.darker' }}>
              <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Iconify icon="solar:info-circle-bold" width={18} />
                Pro Tip
              </Typography>
              <Typography variant="caption">
                Affiliates who invite at least 5 friends see a 25% increase in conversion rates on average.
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>Payment Receipts</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Receipt ID</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {receipts.data.map((row: any) => (
                <TableRow key={row.id}>
                  <TableCell>{fDate(row.date)}</TableCell>
                  <TableCell>{row.receiptId}</TableCell>
                  <TableCell>{fCurrency(row.amount)}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        px: 1,
                        py: 0.5,
                        borderRadius: 0.75,
                        typography: 'caption',
                        fontWeight: 'bold',
                        display: 'inline-flex',
                        bgcolor: row.status === 'Paid' ? 'success.lighter' : 'warning.lighter',
                        color: row.status === 'Paid' ? 'success.darker' : 'warning.darker',
                      }}
                    >
                      {row.status}
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small">
                      <Iconify icon="solar:download-bold-duotone" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {receipts.data.length === 0 && !receipts.loading && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                    No payment receipts found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Stack>
  );
}

function SummaryCard({ title, value, icon, color, isCurrency = true }: any) {
  return (
    <Card
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: `${color}.lighter`,
        color: `${color}.darker`,
      }}
    >
      <Box>
        <Typography variant="subtitle2" sx={{ opacity: 0.64, mb: 1 }}>{title}</Typography>
        <Typography variant="h3">{isCurrency ? fCurrency(value) : value}</Typography>
      </Box>
      <Iconify icon={icon} width={64} sx={{ opacity: 0.24 }} />
    </Card>
  );
}
