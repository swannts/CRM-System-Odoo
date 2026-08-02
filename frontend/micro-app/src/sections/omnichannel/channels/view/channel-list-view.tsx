'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { 
  fetchOmniInstances, 
  createOmniInstanceThunk, 
  deleteOmniInstanceThunk, 
  selectOmni 
} from 'src/store/slices/omnichannel-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';

import { DashboardContent } from 'src/layouts/dashboard';
import { omniChannelService } from 'src/services/omni-service';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';

// ----------------------------------------------------------------------

export function ChannelListView() {
  const dispatch = useAppDispatch();
  const { instances } = useAppSelector(selectOmni);

  const [openConnect, setOpenConnect] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'whatsapp' | 'telegram'>('whatsapp');
  const [instanceName, setInstanceName] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchOmniInstances());
  }, [dispatch]);

  const handleOpenConnect = () => setOpenConnect(true);
  const handleCloseConnect = () => {
    setOpenConnect(false);
    setQrCode(null);
    setInstanceName('');
  };

  const handleCreateInstance = async () => {
    setIsGenerating(true);
    try {
      const instance = await dispatch(createOmniInstanceThunk({
        provider: selectedProvider,
        name: instanceName || `${selectedProvider} Account`,
      })).unwrap();

      if (selectedProvider === 'whatsapp') {
        const qrData = await omniChannelService.getWhatsAppQR(instance.instanceId);
        setQrCode(qrData.qr);
      } else {
        handleCloseConnect();
        dispatch(fetchOmniInstances());
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const target = instances.data.find((item: any) => item.id === deleteId);
      if (!target) return;

      await dispatch(deleteOmniInstanceThunk({ 
        instanceId: target.instanceId, 
        provider: target.provider 
      })).unwrap();
      
      dispatch(fetchOmniInstances());
      setDeleteId(null);
    } catch (error) {
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONNECTED': return 'success';
      case 'PENDING': return 'warning';
      case 'DISCONNECTED': return 'error';
      default: return 'default';
    }
  };

  const isLoading = instances.loading;
  const instancesData = instances.data;

  if (isLoading && !instancesData.length) {
    return <Box sx={{ p: 5, textAlign: 'center' }}><LinearProgress /></Box>;
  }

  return (
    <DashboardContent maxWidth="xl">
      <Box sx={{ mb: 5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h4">Messaging Channels</Typography>
        <Button
          variant="contained"
          onClick={handleOpenConnect}
          startIcon={<Iconify icon="mingcute:add-line" />}
        >
          Add Channel
        </Button>
      </Box>

      <Card>
        <Scrollbar>
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow>
                <TableCell>Instance Name</TableCell>
                <TableCell>Provider</TableCell>
                <TableCell>Phone / Identifier</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {instancesData.map((row: any) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Typography variant="subtitle2" noWrap>{row.name}</Typography>
                  </TableCell>
                  <TableCell>
                    <Label variant="soft" color={row.provider === 'whatsapp' ? 'success' : 'info'} startIcon={<Iconify icon={row.provider === 'whatsapp' ? 'logos:whatsapp-icon' : 'logos:telegram'} />}>
                      {row.provider}
                    </Label>
                  </TableCell>
                  <TableCell>{row.phone || row.phoneNumber || row.instanceId || 'N/A'}</TableCell>
                  <TableCell>
                    <Label variant="filled" color={getStatusColor(row.status)} sx={{ textTransform: 'capitalize' }}>
                      {row.status || 'UNKNOWN'}
                    </Label>
                  </TableCell>
                  <TableCell>
                    {new Date(row.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                     <Button 
                        size="small" 
                        color="error" 
                        startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                        onClick={() => setDeleteId(row.id)}
                      >
                        Delete
                     </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Scrollbar>
      </Card>

      {/* Connect Dialog */}
      <Dialog open={openConnect} onClose={handleCloseConnect} fullWidth maxWidth="xs">
        <DialogTitle>Connect New Channel</DialogTitle>
        <DialogContent sx={{ mt: 1 }}>
          {!qrCode ? (
            <Stack spacing={3} sx={{ pt: 1 }}>
              <TextField
                select
                fullWidth
                label="Select Provider"
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value as any)}
              >
                <MenuItem value="whatsapp">WhatsApp</MenuItem>
                <MenuItem value="telegram">Telegram</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label="Account Name"
                placeholder="My Business WhatsApp"
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
              />
              <Typography variant="body2" color="text.secondary">
                For WhatsApp, you will need to scan a QR code. For Telegram, you will need a Bot Token.
              </Typography>
            </Stack>
          ) : (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>Scan this QR code with WhatsApp</Typography>
              <Box 
                component="img" 
                src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`} 
                sx={{ width: 250, height: 250, mx: 'auto', borderRadius: 2, border: '1px solid', borderColor: 'divider' }} 
              />
              <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary' }}>
                Open WhatsApp &gt; Menu or Settings &gt; Linked Devices
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConnect} color="inherit">Cancel</Button>
          {!qrCode && (
            <Button variant="contained" onClick={handleCreateInstance} disabled={isGenerating}>
              {isGenerating ? <CircularProgress size={24} color="inherit" /> : 'Generate Connection'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Channel"
        content="Are you sure you want to delete this messaging channel? This action cannot be undone."
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        }
      />
    </DashboardContent>
  );
}
