'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { 
  fetchAdpStatusThunk, 
  connectAdpThunk, 
  disconnectAdpThunk,
  selectIntegration 
} from 'src/store/slices/integration-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function IntegrationAdp() {
  const dispatch = useAppDispatch();
  const { adp } = useAppSelector(selectIntegration);
  const [isMutationPending, setIsMutationPending] = useState(false);

  useEffect(() => {
    dispatch(fetchAdpStatusThunk());
  }, [dispatch]);

  const handleConnect = async () => {
    try {
      setIsMutationPending(true);
      const url = await dispatch(connectAdpThunk()).unwrap();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      toast.error(err || 'Failed to connect to ADP');
    } finally {
      setIsMutationPending(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsMutationPending(true);
      await dispatch(disconnectAdpThunk()).unwrap();
      dispatch(fetchAdpStatusThunk());
      toast.success('Disconnected from ADP');
    } catch (err) {
      toast.error(err || 'Failed to disconnect');
    } finally {
      setIsMutationPending(false);
    }
  };

  const status = adp.status;
  const isLoading = adp.loading;

  if (isLoading && !status) {
    return <CircularProgress />;
  }

  const isConnected = status?.isConnected;

  return (
    <Card sx={{ p: 3, border: (theme) => `1px solid ${theme.palette.divider}` }}>
      <Stack direction="row" alignItems="center" spacing={3} sx={{ mb: 3 }}>
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.neutral',
          }}
        >
          <Iconify icon="simple-icons:adp" width={48} sx={{ color: '#AD0000' }} />
        </Box>

        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6">ADP Marketplace</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Sync your payroll, HR, and employee data seamlessly with ADP.
          </Typography>
        </Box>

        {isConnected ? (
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main', typography: 'subtitle2' }}>
            <Iconify icon="eva:checkmark-circle-2-fill" width={20} sx={{ mr: 0.5 }} />
            Connected
          </Box>
        ) : (
          <Box sx={{ color: 'text.disabled', typography: 'subtitle2' }}>Not Connected</Box>
        )}
      </Stack>

      <Divider sx={{ borderStyle: 'dashed', my: 3 }} />

      <Stack spacing={2}>
        <Typography variant="subtitle2">Permissions & Data Sync</Typography>
        <Stack spacing={1}>
          {[
            'Employee profiles and payroll data',
            'Time and attendance records',
            'Organizational structure sync',
          ].map((item) => (
            <Stack key={item} direction="row" alignItems="center" spacing={1}>
              <Iconify icon="eva:checkmark-fill" width={16} sx={{ color: 'text.disabled' }} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {item}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Stack>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        {isConnected ? (
          <Button
            variant="outlined"
            color="error"
            onClick={handleDisconnect}
            disabled={isMutationPending}
          >
            {isMutationPending ? 'Disconnecting...' : 'Disconnect ADP'}
          </Button>
        ) : (
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleConnect}
            disabled={isMutationPending}
            startIcon={isMutationPending ? <CircularProgress size={20} color="inherit" /> : <Iconify icon="eva:external-link-fill" />}
          >
            Connect with ADP
          </Button>
        )}
      </Box>
    </Card>
  );
}
