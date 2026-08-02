'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { fetchOmniBroadcasts, selectOmni } from 'src/store/slices/omnichannel-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';
import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

export function BroadcastListView() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { broadcasts } = useAppSelector(selectOmni);

  useEffect(() => {
    dispatch(fetchOmniBroadcasts());
  }, [dispatch]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'processing': return 'info';
      case 'scheduled': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const isLoading = broadcasts.loading;
  const broadcastsData = broadcasts.data;

  if (isLoading && !broadcastsData.length) {
    return <Box sx={{ p: 5, textAlign: 'center' }}><LinearProgress /></Box>;
  }

  return (
    <DashboardContent maxWidth="xl">
      <Box sx={{ mb: 5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h4">Broadcast Campaigns</Typography>
        <Button
          component={RouterLink}
          href={paths.dashboard.omnichannel.broadcast_create}
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
        >
          New Broadcast
        </Button>
      </Box>

      <Card>
        <Scrollbar>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell>Campaign Name</TableCell>
                <TableCell>Provider</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Stats (S/D/F)</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {broadcastsData.map((row: any) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Typography variant="subtitle2" noWrap>{row.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Label variant="soft" color={row.provider === 'whatsapp' ? 'success' : 'info'} startIcon={<Iconify icon={row.provider === 'whatsapp' ? 'logos:whatsapp-icon' : 'logos:telegram'} />}>
                      {row.provider}
                    </Label>
                  </TableCell>
                  <TableCell>
                    <Label variant="filled" color={getStatusColor(row.status)} sx={{ textTransform: 'capitalize' }}>
                      {row.status}
                    </Label>
                  </TableCell>
                  <TableCell sx={{ minWidth: 160 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={row.totalCount > 0 ? (row.sentCount / row.totalCount) * 100 : 0} 
                        sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption">{Math.round(row.totalCount > 0 ? (row.sentCount / row.totalCount) * 100 : 0)}%</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {row.sentCount} / {row.deliveredCount} / {row.failedCount}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(row.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                     <Button size="small" color="primary" onClick={() => router.push(paths.dashboard.omnichannel.broadcast_details(row.id))}>
                        View Details
                     </Button>
                  </TableCell>
                </TableRow>
              ))}
              {broadcastsData.length === 0 && !isLoading && (
                 <TableRow>
                   <TableCell colSpan={7} sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                     No broadcasts found.
                   </TableCell>
                 </TableRow>
              )}
            </TableBody>
          </Table>
        </Scrollbar>
      </Card>
    </DashboardContent>
  );
}
