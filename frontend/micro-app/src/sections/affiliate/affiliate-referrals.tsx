'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { fetchAffiliateListThunk, selectAffiliate } from 'src/store/slices/affiliate-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import LinearProgress from '@mui/material/LinearProgress';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function AffiliateReferrals() {
  const dispatch = useAppDispatch();
  const { list } = useAppSelector(selectAffiliate);

  useEffect(() => {
    dispatch(fetchAffiliateListThunk());
  }, [dispatch]);

  const affiliatesData = list.data;
  const isLoading = list.loading;

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>My Referrals</Typography>
      {isLoading && !affiliatesData.length && <LinearProgress sx={{ mb: 2 }} />}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Join Date</TableCell>
              <TableCell>Total Purchases</TableCell>
              <TableCell>Commission Earned</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {affiliatesData.map((row: any) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar alt={row.name} src={row.avatarUrl} />
                    <Box>
                       <Typography variant="subtitle2">{row.name}</Typography>
                       <Typography variant="caption" sx={{ color: 'text.secondary' }}>{row.email}</Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>{fDate(row.joinDate)}</TableCell>
                <TableCell>{row.totalPurchases || 0}</TableCell>
                <TableCell>{fCurrency(row.commission)}</TableCell>
                <TableCell>
                  <Box
                    sx={{
                      px: 1,
                      py: 0.5,
                      borderRadius: 0.75,
                      typography: 'caption',
                      fontWeight: 'bold',
                      display: 'inline-flex',
                      bgcolor: 'success.lighter',
                      color: 'success.darker',
                    }}
                  >
                    Active
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {affiliatesData.length === 0 && !isLoading && (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                  You haven't referred any users yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}

// ----------------------------------------------------------------------

export function AffiliateOnboarding() {
  const tasks = [
    { title: 'Complete your profile', status: 'Completed', icon: 'solar:user-bold-duotone' },
    { title: 'Connect your payment method', status: 'Pending', icon: 'solar:card-bold-duotone' },
    { title: 'Share your first referral link', status: 'Completed', icon: 'solar:share-bold-duotone' },
    { title: 'Invite 3 friends to join', status: 'In Progress', icon: 'solar:users-group-two-rounded-bold-duotone' },
  ];

  return (
    <Card sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>Affiliate Onboarding</Typography>
      <Stack spacing={3}>
        {tasks.map((task) => (
          <Stack key={task.title} direction="row" alignItems="center" spacing={2} sx={{ p: 2, borderRadius: 1.5, border: (theme) => `1px solid ${theme.palette.divider}` }}>
             <Box
               sx={{
                 width: 48,
                 height: 48,
                 borderRadius: 1,
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center',
                 bgcolor: 'background.neutral',
               }}
             >
                <Iconify icon={task.icon} width={24} sx={{ color: 'primary.main' }} />
             </Box>
             <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2">{task.title}</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{task.status}</Typography>
             </Box>
             <Box
               sx={{
                 px: 1,
                 py: 0.5,
                 borderRadius: 0.75,
                 typography: 'caption',
                 fontWeight: 'bold',
                 bgcolor: task.status === 'Completed' ? 'success.lighter' : 'warning.lighter',
                 color: task.status === 'Completed' ? 'success.darker' : 'warning.darker',
               }}
             >
                {task.status}
             </Box>
          </Stack>
        ))}
      </Stack>
    </Card>
  );
}
