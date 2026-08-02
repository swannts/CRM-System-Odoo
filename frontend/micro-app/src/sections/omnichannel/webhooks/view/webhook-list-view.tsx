'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { fetchOmniWebhooks, selectOmni } from 'src/store/slices/omnichannel-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';
import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

export function WebhookListView() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { webhooks } = useAppSelector(selectOmni);

  useEffect(() => {
    dispatch(fetchOmniWebhooks());
  }, [dispatch]);

  const handleCopyUrl = (id: string) => {
    const url = `${window.location.origin}/api/automation/v1/public/webhook/receive/${id}`;
    navigator.clipboard.writeText(url);
    toast.success('Webhook URL copied to clipboard!');
  };

  const isLoading = webhooks.loading;
  const webhooksData = webhooks.data;

  if (isLoading && !webhooksData.length) {
    return <Box sx={{ p: 5, textAlign: 'center' }}><LinearProgress /></Box>;
  }

  return (
    <DashboardContent maxWidth="xl">
      <Box sx={{ mb: 5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h4">Webhook Automations</Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
        >
          New Webhook
        </Button>
      </Box>

      <Card>
        <Scrollbar>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Endpoint URL</TableCell>
                <TableCell>Target Bot / Workflow</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {webhooksData.map((row: any) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Typography variant="subtitle2" noWrap>{row.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                         .../webhook/receive/{row.id}
                      </Typography>
                      <Tooltip title="Copy Public URL">
                         <IconButton size="small" onClick={() => handleCopyUrl(row.id)}>
                            <Iconify icon="solar:copy-bold" />
                         </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {row.chatbotId ? (
                       <Label variant="soft" color="primary">Chatbot Trigger</Label>
                    ) : (
                       <Label variant="soft" color="info">Workflow Trigger</Label>
                    )}
                  </TableCell>
                  <TableCell>
                    <Label variant="filled" color={row.isActive ? 'success' : 'default'}>
                      {row.isActive ? 'Active' : 'Inactive'}
                    </Label>
                  </TableCell>
                  <TableCell>
                    {new Date(row.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                     <Button size="small" color="primary" onClick={() => router.push(paths.dashboard.omni.webhook_logs(row.id))}>
                        View Logs
                     </Button>
                  </TableCell>
                </TableRow>
              ))}
              {webhooksData.length === 0 && !isLoading && (
                 <TableRow>
                   <TableCell colSpan={6} sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                     No webhooks found.
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
