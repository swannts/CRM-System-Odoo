'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import {
  fetchOrgDetailsThunk,
  fetchOrgLocationsThunk,
  selectOrganization,
} from 'src/store/slices/organization-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';

import { FeatureRouteShell } from 'src/sections/parity/feature-route-shell';

// ----------------------------------------------------------------------

type Props = {
  tab?: string;
};

export function SettingsWorkspaceView({ tab = 'general' }: Props) {
  const dispatch = useAppDispatch();
  const { orgDetails, locations } = useAppSelector(selectOrganization);

  useEffect(() => {
    dispatch(fetchOrgDetailsThunk());
    dispatch(fetchOrgLocationsThunk());
  }, [dispatch]);

  if (orgDetails.loading || locations.loading) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <FeatureRouteShell
      title={`Settings: ${tab}`}
      description="Legacy settings tabs such as billing, progression, advance, deposit, and smart lists are now represented as route-aware tabs in the micro-app."
      links={[
        { href: paths.dashboard.settings, label: 'General' },
        { href: paths.dashboard.settingsTab('billing'), label: 'Billing' },
        { href: paths.dashboard.settingsTab('advance'), label: 'Advance' },
        { href: paths.dashboard.settingsTab('smartList'), label: 'Smart List' },
        { href: paths.public.magentoIntegration, label: 'Integrations -> Magento' },
      ]}
    >
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6">Organization</Typography>
              <Typography variant="body2">
                Name: {orgDetails.data?.name || orgDetails.data?.organizationName || 'Unknown'}
              </Typography>
              <Typography variant="body2">Email: {orgDetails.data?.email || 'N/A'}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Active tab: {tab}
              </Typography>
            </Stack>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Locations
            </Typography>
            <Typography variant="h3">{(locations.data || []).length}</Typography>
          </Card>
        </Grid>
      </Grid>
    </FeatureRouteShell>
  );
}
