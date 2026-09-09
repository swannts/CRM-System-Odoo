'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { fetchBroadcasts, selectMarketing } from 'src/store/slices/marketing-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import TableContainer from '@mui/material/TableContainer';

import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

export function OmniBroadcastView() {
  const dispatch = useAppDispatch();
  const { omniBroadcasts } = useAppSelector(selectMarketing);

  const broadcasts = omniBroadcasts.data;
  const isLoading = omniBroadcasts.loading;

  useEffect(() => {
    dispatch(fetchBroadcasts());
  }, [dispatch]);

  if (isLoading) {
    return <Box sx={{ p: 5, textAlign: 'center' }}><LinearProgress /></Box>;
  }

  return (
    <DashboardContent maxWidth="xl">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 5 }}>
        <Box>
          <Typography variant="h4">Omnichannel Broadcasts</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Send bulk messages across WhatsApp and Telegram.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
        >
          New Broadcast
        </Button>
      </Stack>

      <Card>
        <TableContainer sx={{ overflow: 'unset' }}>
          <Scrollbar>
            <Table sx={{ minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Campaign Name</TableCell>
                  <TableCell>Provider</TableCell>
                  <TableCell>Scheduled At</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(broadcasts || []).map((row: any) => (
                  <TableRow key={row.id}>
                    <TableCell>
                       <Typography variant="subtitle2" noWrap>{row.name}</Typography>
                    </TableCell>
                    <TableCell>
                       <Stack direction="row" spacing={1} alignItems="center">
                          <Iconify icon={row.provider === 'whatsapp' ? 'logos:whatsapp-icon' : 'logos:telegram'} width={20} />
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{row.provider}</Typography>
                       </Stack>
                    </TableCell>
                    <TableCell>{new Date(row.scheduledAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <Label
                        color={
                          (row.status === 'completed' && 'success') ||
                          (row.status === 'processing' && 'warning') ||
                          (row.status === 'failed' && 'error') ||
                          'default'
                        }
                      >
                        {row.status}
                      </Label>
                    </TableCell>
                    <TableCell align="right">
                      <Button size="small" startIcon={<Iconify icon="solar:eye-bold" />}>View Logs</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Scrollbar>
        </TableContainer>
      </Card>
    </DashboardContent>
  );
}
