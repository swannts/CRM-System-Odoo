'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { fetchLocalCampaigns, selectMarketing } from 'src/store/slices/marketing-slice';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { MarketingCampaignList } from '../components/marketing-campaign-list';
import { MarketingBackendStatus } from '../components/marketing-backend-status';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = ['all', 'draft', 'scheduled', 'sending', 'sent', 'paused', 'archived', 'failed'];

// ----------------------------------------------------------------------

import Link from 'next/link';

// ----------------------------------------------------------------------

export function MarketingCampaignsView() {
  const dispatch = useAppDispatch();
  const { localCampaigns } = useAppSelector(selectMarketing);

  const campaigns = localCampaigns.data;
  const isLoading = localCampaigns.loading;
  const error = localCampaigns.error;

  const [currentStatus, setCurrentStatus] = useState('all');

  useEffect(() => {
    dispatch(fetchLocalCampaigns());
  }, [dispatch]);

  const isAvailable = !error && (!isLoading || campaigns.length > 0);

  const handleFilterStatus = useCallback(
    (event: React.SyntheticEvent, newValue: string) => {
      setCurrentStatus(newValue);
    },
    []
  );

  const filteredCampaigns = campaigns.filter((campaign) => {
    if (currentStatus === 'all') return true;
    return campaign.status === currentStatus;
  });

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
            Campaigns
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Campaigns, attribution, and conversion analytics in one workspace.
          </Typography>
        </Box>

        <Button
          component={Link}
          href={paths.dashboard.marketingSection('campaigns/new')}
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          disabled={!isAvailable && campaigns.length === 0}
        >
          Create Campaign
        </Button>
      </Stack>

      <MarketingBackendStatus isAvailable={isAvailable || campaigns.length > 0} />

      <Tabs
        value={currentStatus}
        onChange={handleFilterStatus}
        sx={{
          px: 2.5,
          boxShadow: (theme) => `inset 0 -2px 0 0 ${theme.palette.divider}`,
        }}
      >
        {STATUS_OPTIONS.map((tab) => (
          <Tab
            key={tab}
            iconPosition="end"
            value={tab}
            label={tab.toUpperCase()}
            icon={
              <Label
                variant={((tab === 'all' || tab === currentStatus) && 'filled') || 'soft'}
                color={
                  (tab === 'sent' && 'success') ||
                  (tab === 'scheduled' && 'info') ||
                  (tab === 'draft' && 'default') ||
                  (tab === 'failed' && 'error') ||
                  'default'
                }
              >
                {tab === 'all'
                  ? campaigns.length
                  : campaigns.filter((campaign) => campaign.status === tab).length}
              </Label>
            }
          />
        ))}
      </Tabs>

      <Box sx={{ mt: 3 }}>
        <MarketingCampaignList campaigns={filteredCampaigns} loading={isLoading} />
      </Box>
    </DashboardContent>
  );
}
