'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { fetchAffiliateReferralThunk, selectAffiliate } from 'src/store/slices/affiliate-slice';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';

import { AffiliateEarnings } from '../affiliate-earnings';
import { AffiliateReferrals } from '../affiliate-referrals';
import { AffiliateOnboarding } from '../affiliate-onboarding';

// ----------------------------------------------------------------------

export function AffiliateDashboardView() {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const dispatch = useAppDispatch();
  const { referral } = useAppSelector(selectAffiliate);

  useEffect(() => {
    dispatch(fetchAffiliateReferralThunk());
  }, [dispatch]);

  const referralData = referral.data;
  const isLoading = referral.loading;

  if (isLoading && !referralData) {
    return (
      <Box sx={{ p: 5, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const hasAffiliateCode = !!referralData?.affiliateCode;

  if (!hasAffiliateCode) {
    return (
      <DashboardContent maxWidth="xl">
        <Stack spacing={3} alignItems="center" sx={{ textAlign: 'center', py: 10 }}>
          <Box
            sx={{
              width: 160,
              height: 160,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'primary.lighter',
              color: 'primary.main',
              mb: 3
            }}
          >
            <Iconify icon="solar:star-bold-duotone" width={80} />
          </Box>
          <Typography variant="h3">Join the Affiliate Program</Typography>
          <Typography sx={{ color: 'text.secondary', maxWidth: 480 }}>
            Start earning commissions by referring others to our platform. 
            Connect with your audience and grow together!
          </Typography>
          <Button variant="contained" size="large" color="primary">
            Get Started Now
          </Button>
        </Stack>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent maxWidth="xl">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 5 }}>
        <Box>
          <Typography variant="h4">Affiliate Program</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Manage your referrals, track earnings, and grow your network.
          </Typography>
        </Box>

        <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: 'background.neutral' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
            Your Referral Code
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{referralData.affiliateCode}</Typography>
            <Iconify icon="eva:copy-fill" width={18} sx={{ color: 'primary.main', cursor: 'pointer' }} />
          </Stack>
        </Box>
      </Stack>

      <Tabs
        value={currentTab}
        onChange={(e, val) => setCurrentTab(val)}
        sx={{ mb: 5 }}
      >
        <Tab icon={<Iconify icon="solar:chart-bold-duotone" />} label="Dashboard" value="dashboard" />
        <Tab icon={<Iconify icon="solar:users-group-two-rounded-bold-duotone" />} label="My Referrals" value="referrals" />
        <Tab icon={<Iconify icon="solar:checklist-bold-duotone" />} label="Onboarding" value="onboarding" />
      </Tabs>

      {currentTab === 'dashboard' && <AffiliateEarnings />}
      {currentTab === 'referrals' && <AffiliateReferrals />}
      {currentTab === 'onboarding' && <AffiliateOnboarding />}
    </DashboardContent>
  );
}
