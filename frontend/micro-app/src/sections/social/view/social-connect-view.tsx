'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { 
  fetchSocialAnalyticsThunk, 
  selectSocial 
} from 'src/store/slices/social-slice';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import { Grid } from '@mui/material';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';

import { SocialPlanner } from '../social-planner';
import { SocialAccounts } from '../social-accounts';
import { SocialComposer } from '../social-composer';

// ----------------------------------------------------------------------

export function SocialConnectView() {
  const dispatch = useAppDispatch();
  const { analytics } = useAppSelector(selectSocial);
  const [currentTab, setCurrentTab] = useState('accounts');

  useEffect(() => {
    dispatch(fetchSocialAnalyticsThunk());
  }, [dispatch]);

  const analyticsData = analytics.data;
  const isLoading = analytics.loading;

  if (isLoading && !analyticsData) {
    return (
      <Box sx={{ p: 5, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <DashboardContent maxWidth="xl">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 5 }}>
        <Box>
          <Typography variant="h4">Social Connect</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Manage and schedule your social media presence from one place.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Iconify icon="solar:pen-new-square-bold" />}
          onClick={() => setCurrentTab('composer')}
        >
          New Post
        </Button>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} md={3}>
           <AnalyticsCard title="Total Reach" value={analyticsData?.totalReach || 0} icon="solar:users-group-rounded-bold-duotone" color="primary" />
        </Grid>
        <Grid item xs={12} md={3}>
           <AnalyticsCard title="Engagement" value={`${analyticsData?.engagementRate || 0}%`} icon="solar:heart-bold-duotone" color="error" />
        </Grid>
        <Grid item xs={12} md={3}>
           <AnalyticsCard title="Followers" value={analyticsData?.totalFollowers || 0} icon="solar:user-plus-bold-duotone" color="info" />
        </Grid>
        <Grid item xs={12} md={3}>
           <AnalyticsCard title="Scheduled" value={analyticsData?.scheduledPosts || 0} icon="solar:calendar-bold-duotone" color="warning" />
        </Grid>
      </Grid>

      <Tabs
        value={currentTab}
        onChange={(e, val) => setCurrentTab(val)}
        sx={{ mb: 5 }}
      >
        <Tab icon={<Iconify icon="solar:users-group-two-rounded-bold-duotone" />} label="Accounts" value="accounts" />
        <Tab icon={<Iconify icon="solar:pen-bold-duotone" />} label="Composer" value="composer" />
        <Tab icon={<Iconify icon="solar:calendar-date-bold-duotone" />} label="Planner" value="planner" />
      </Tabs>

      {currentTab === 'accounts' && <SocialAccounts />}
      {currentTab === 'composer' && <SocialComposer />}
      {currentTab === 'planner' && <SocialPlanner />}
    </DashboardContent>
  );
}

function AnalyticsCard({ title, value, icon, color }: any) {
  return (
    <Card sx={{ p: 2.5, textAlign: 'center' }}>
      <Box
        sx={{
          mb: 1.5,
          width: 48,
          height: 48,
          mx: 'auto',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: `${color}.lighter`,
          color: `${color}.main`,
        }}
      >
        <Iconify icon={icon} width={24} />
      </Box>
      <Typography variant="h4">{value}</Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{title}</Typography>
    </Card>
  );
}
