'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { fetchSummary, fetchOverallAnalytics, selectMarketing } from 'src/store/slices/marketing-slice';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';

import { MarketingSummaryCards } from '../components/marketing-summary-cards';
import { MarketingUnavailableState } from '../components/marketing-state-blocks';
import { MarketingCampaignAnalytics } from '../components/marketing-campaign-analytics';

export function MarketingAnalyticsView() {
  const dispatch = useAppDispatch();
  const { summary: summaryState, overallAnalytics: analyticsState } = useAppSelector(selectMarketing);

  const summary = summaryState.data;
  const summaryLoading = summaryState.loading;
  const analytics = analyticsState.data;
  const analyticsLoading = analyticsState.loading;

  useEffect(() => {
    dispatch(fetchSummary());
    dispatch(fetchOverallAnalytics());
  }, [dispatch]);

  return (
    <DashboardContent maxWidth="xl">
      <Box sx={{ mb: 5 }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Marketing Analytics
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Real campaign delivery and conversion metrics.
        </Typography>
      </Box>

      <Stack spacing={4}>
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Overall Summary</Typography>
          <MarketingSummaryCards summary={summary} />
        </Box>

        {!analytics ? (
          <MarketingUnavailableState
            title="Analytics unavailable"
            description="Marketing analytics are not available yet."
          />
        ) : (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Delivery Performance</Typography>
            <MarketingCampaignAnalytics analytics={analytics} loading={summaryLoading || analyticsLoading} />
          </Box>
        )}
      </Stack>
    </DashboardContent>
  );
}
