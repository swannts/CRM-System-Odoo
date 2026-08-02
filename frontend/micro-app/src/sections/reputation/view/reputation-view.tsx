'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { fetchReputationOverview, selectReputation } from 'src/store/slices/reputation-slice';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';

import { ReputationReviews } from '../reputation-reviews';
import { ReputationRequests } from '../reputation-requests';
import { ReputationSettings } from '../reputation-requests'; // Unified with requests in previous check

// ----------------------------------------------------------------------

export function ReputationView() {
  const dispatch = useAppDispatch();
  const { overview } = useAppSelector(selectReputation);
  const [currentTab, setCurrentTab] = useState('overview');

  useEffect(() => {
    dispatch(fetchReputationOverview());
  }, [dispatch]);

  const isLoading = overview.loading;
  const overviewData = overview.data;

  if (isLoading && !overviewData) {
    return (
      <DashboardContent maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 5 }}>
          <Box><Skeleton variant="text" width={240} height={40} /><Skeleton variant="text" width={400} /></Box>
          <Skeleton variant="rectangular" width={140} height={40} sx={{ borderRadius: 1 }} />
        </Stack>
        <Grid container spacing={3} sx={{ mb: 5 }}>
          {[...Array(3)].map((_, i) => (
            <Grid item xs={12} md={4} key={i}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rectangular" height={48} sx={{ mb: 5 }} />
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent maxWidth="xl">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 5 }}>
        <Box>
          <Typography variant="h4">Reputation Management</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Monitor and improve your online presence across Google and Facebook.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:chat-round-plus-bold" />}
          onClick={() => setCurrentTab('requests')}
        >
          Request Review
        </Button>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} md={4}>
          <SummaryCard title="Average Rating" value={overviewData?.averageRating || 0} icon="solar:star-bold-duotone" color="warning" subText={`${overviewData?.totalReviews || 0} Total Reviews`} />
        </Grid>
        <Grid item xs={12} md={4}>
          <SummaryCard title="Positive Sentiment" value={`${overviewData?.sentiment || 0}%`} icon="solar:emoji-funny-circle-bold-duotone" color="success" subText="Based on recent reviews" />
        </Grid>
        <Grid item xs={12} md={4}>
          <SummaryCard title="Response Rate" value={`${overviewData?.responseRate || 0}%`} icon="solar:chat-round-check-bold-duotone" color="info" subText="Replies to reviews" />
        </Grid>
      </Grid>

      <Tabs
        value={currentTab}
        onChange={(e, val) => setCurrentTab(val)}
        sx={{ mb: 5 }}
      >
        <Tab icon={<Iconify icon="solar:chart-bold-duotone" />} label="Overview & Reviews" value="overview" />
        <Tab icon={<Iconify icon="solar:letter-bold-duotone" />} label="Review Requests" value="requests" />
        <Tab icon={<Iconify icon="solar:settings-bold-duotone" />} label="Settings" value="settings" />
      </Tabs>

      {currentTab === 'overview' && <ReputationReviews />}
      {currentTab === 'requests' && <ReputationRequests />}
      {currentTab === 'settings' && <ReputationSettings />}
    </DashboardContent>
  );
}

function SummaryCard({ title, value, icon, color, subText }: any) {
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
        <Typography variant="h3">{value}</Typography>
        <Typography variant="caption" sx={{ opacity: 0.64 }}>{subText}</Typography>
      </Box>
      <Iconify icon={icon} width={64} sx={{ opacity: 0.24 }} />
    </Card>
  );
}
