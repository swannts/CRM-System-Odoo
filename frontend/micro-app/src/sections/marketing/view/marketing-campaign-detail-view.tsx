'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import {
  fetchLocalCampaign,
  fetchSegments,
  fetchTemplateUsage,
  fetchDeliveryEvents,
  selectMarketing,
} from 'src/store/slices/marketing-slice';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useRouter } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { MarketingCampaignForm } from '../components/marketing-campaign-form';

// ----------------------------------------------------------------------

type Props = {
  id?: string;
};

export function MarketingCampaignDetailView({ id }: Props) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isEdit = !!id;

  const {
    currentLocalCampaign,
    segments: segmentsState,
    templateUsage: usageState,
    deliveryEvents: eventsState,
  } = useAppSelector(selectMarketing);

  const campaign = currentLocalCampaign.data;
  const campaignLoading = currentLocalCampaign.loading;
  const segments = segmentsState.data;
  const segmentsLoading = segmentsState.loading;
  const usageQuery = {
    data: usageState.data,
    isLoading: usageState.loading,
    isError: !!usageState.error,
  };
  const eventsQuery = {
    data: eventsState.data,
    isLoading: eventsState.loading,
    isError: !!eventsState.error,
  };

  useEffect(() => {
    if (id) {
      dispatch(fetchLocalCampaign(id));
      dispatch(fetchTemplateUsage(id));
      dispatch(fetchDeliveryEvents(id));
    }
    dispatch(fetchSegments());
  }, [dispatch, id]);
  
  if (campaignLoading || segmentsLoading) {
    return (
      <DashboardContent>
        <Stack alignItems="center" justifyContent="center" sx={{ py: 20 }}>
          <CircularProgress />
        </Stack>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent maxWidth="xl">
      <Stack direction="row" alignItems="center" sx={{ mb: 3 }}>
        <Button
          onClick={() => router.back()}
          startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
          sx={{ mr: 1 }}
        >
          Back
        </Button>
        <Typography variant="h4">{isEdit ? 'Edit Campaign' : 'New Campaign'}</Typography>
      </Stack>

      <MarketingCampaignForm campaign={campaign} segments={segments} />

      {isEdit && (
        <Stack spacing={2} sx={{ mt: 3 }}>
          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Template Usage</Typography>
            {usageQuery.isError && <Alert severity="info">Template usage metadata is unavailable.</Alert>}
            {Array.isArray(usageQuery.data) && usageQuery.data.length === 0 && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>No template recorded.</Typography>
            )}
            {Array.isArray(usageQuery.data) && usageQuery.data.length > 0 && (
              <Stack spacing={1}>
                {usageQuery.data.slice(0, 10).map((u: any) => (
                  <Typography key={u.id} variant="body2">
                    {u.templateNameSnapshot || 'Template'} • {new Date(u.appliedAt).toLocaleString()}
                  </Typography>
                ))}
              </Stack>
            )}
          </Card>

          <Card sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Delivery Event Timeline</Typography>
            {eventsQuery.isError && <Alert severity="info">Delivery events are unavailable.</Alert>}
            {Array.isArray(eventsQuery.data) && eventsQuery.data.length === 0 && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>No delivery events recorded.</Typography>
            )}
            {Array.isArray(eventsQuery.data) && eventsQuery.data.length > 0 && (
              <Stack spacing={1}>
                {eventsQuery.data.slice(0, 20).map((event: any) => (
                  <Typography key={event.id} variant="body2">
                    {String(event.eventType || '').toUpperCase()} • {new Date(event.occurredAt).toLocaleString()} • {event.recipientEmail || event.recipientPhone || 'recipient'}
                  </Typography>
                ))}
              </Stack>
            )}
          </Card>
        </Stack>
      )}
    </DashboardContent>
  );
}
