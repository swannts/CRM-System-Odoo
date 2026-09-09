'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import {
  fetchSegments,
  createSegment,
  updateSegment,
  deleteSegment,
  selectMarketing,
} from 'src/store/slices/marketing-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';

import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { showToast } from 'src/components/toast';

import { MarketingSegment } from '../types';
import { marketingService } from '../services/marketing-service';
import { MarketingEmptyState } from '../components/marketing-state-blocks';
import { MarketingSegmentForm, SegmentData } from '../components/marketing-segment-form';

// ----------------------------------------------------------------------

export function MarketingSegmentsView() {
  const dispatch = useAppDispatch();
  const { segments: segmentsState } = useAppSelector(selectMarketing);

  const segments = segmentsState.data;
  const isLoading = segmentsState.loading;
  
  const [open, setOpen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<MarketingSegment | undefined>();
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchSegments());
  }, [dispatch]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setSelectedSegment(undefined);
  };

  const onSubmit = async (formData: SegmentData) => {
    try {
      if (selectedSegment) {
        await dispatch(updateSegment({ id: selectedSegment.id, data: formData })).unwrap();
        showToast({ severity: 'success', message: 'Segment updated successfully' });
      } else {
        await dispatch(createSegment(formData)).unwrap();
        showToast({ severity: 'success', message: 'Segment created successfully' });
      }
      handleClose();
    } catch {
      showToast({ severity: 'error', message: `Failed to ${selectedSegment ? 'update' : 'create'} segment` });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this segment?')) return;
    try {
      await dispatch(deleteSegment(id)).unwrap();
      showToast({ severity: 'success', message: 'Segment deleted successfully' });
    } catch {
      showToast({ severity: 'error', message: 'Failed to delete segment' });
    }
  };

  const handlePreview = async () => {
    try {
      const preview = await marketingService.previewSegment({ segmentId: selectedSegment?.id });
      const count = typeof preview?.count === 'number' ? preview.count : undefined;
      setPreviewMessage(typeof count === 'number' ? `Estimated contacts: ${count}` : 'Segment preview is not available yet.');
    } catch (error: any) {
      setPreviewMessage(error?.response?.data?.message || 'Segment preview is not available yet.');
    }
  };

  return (
    <DashboardContent maxWidth="xl">
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
        sx={{ mb: { xs: 3, md: 5 } }}
      >
        <Box>
          <Typography variant="h4" sx={{ mb: 1 }}>
            Segments
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Define targeted audiences based on filters and behaviors.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleOpen}
        >
          Create Segment
        </Button>
      </Stack>

      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Segment Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Contacts</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {segments.map((segment) => (
                <TableRow key={segment.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">{segment.name}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {segment.description || 'No description'}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Label variant="soft" color={segment.type === 'dynamic' ? 'info' : 'default'}>
                      {segment.type}
                    </Label>
                  </TableCell>

                  <TableCell>{segment.contactCount}</TableCell>

                  <TableCell align="right">
                    <IconButton onClick={() => { setSelectedSegment(segment); setOpen(true); }}>
                      <Iconify icon="solar:pen-bold" />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(segment.id)}>
                      <Iconify icon="solar:trash-bin-trash-bold" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}

              {segments.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: 'center', py: 10 }}>
                    <MarketingEmptyState title="No segments found" description="Create a segment to target your audience." />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'primary.soft',
                color: 'primary.main',
              }}
            >
              <Iconify icon="solar:users-group-rounded-bold-duotone" width={24} />
            </Box>
            <Box>
              <Typography variant="h6">{selectedSegment ? 'Edit Segment' : 'Create New Segment'}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {selectedSegment ? 'Modify your existing audience group.' : 'Define a new audience for your campaigns.'}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        
        <DialogContent sx={{ pb: 3 }}>
          {previewMessage && <Alert severity="info" sx={{ mb: 2 }}>{previewMessage}</Alert>}
          <MarketingSegmentForm 
            segment={selectedSegment} 
            onSubmit={onSubmit} 
            onCancel={handleClose} 
          />
          <Button onClick={handlePreview} variant="outlined" startIcon={<Iconify icon="solar:eye-bold" />} sx={{ mt: 2 }}>
            Preview Segment
          </Button>
        </DialogContent>
      </Dialog>
    </DashboardContent>
  );
}
