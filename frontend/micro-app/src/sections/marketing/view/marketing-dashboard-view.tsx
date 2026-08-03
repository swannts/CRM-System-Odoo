'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { fetchSummary, selectMarketing } from 'src/store/slices/marketing-slice';

import Link from 'next/link';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Alert from '@mui/material/Alert';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';

import { MarketingRecentActivity } from '../marketing-recent-activity';
import { MarketingSummaryCards } from '../components/marketing-summary-cards';

// ----------------------------------------------------------------------

const SECTIONS = [
  {
    title: 'Campaigns',
    description: 'Manage email, SMS, and broadcast campaigns.',
    icon: 'solar:rocket-bold-duotone',
    path: 'campaigns',
    color: 'primary',
  },
  {
    title: 'Segments',
    description: 'Define and target specific customer groups.',
    icon: 'solar:users-group-rounded-bold-duotone',
    path: 'segments',
    color: 'info',
  },
  {
    title: 'Automations',
    description: 'Create automated customer journeys.',
    icon: 'solar:branching-paths-bold-duotone',
    path: 'automation',
    color: 'warning',
  },
  {
    title: 'Templates',
    description: 'Reusable designs for your communications.',
    icon: 'solar:clapperboard-edit-bold-duotone',
    path: 'templates',
    color: 'secondary',
  },
  {
    title: 'Compliance',
    description: 'Manage suppression lists and opt-outs.',
    icon: 'solar:shield-check-bold-duotone',
    path: 'compliance',
    color: 'error',
  },
  {
    title: 'Analytics',
    description: 'Track performance and conversion rates.',
    icon: 'solar:chart-2-bold-duotone',
    path: 'analytics',
    color: 'success',
  },
];

export function MarketingDashboardView() {
  const dispatch = useAppDispatch();
  const { summary: summaryState } = useAppSelector(selectMarketing);

  const summary = summaryState.data;
  const isLoading = summaryState.loading;
  const error = summaryState.error;

  const isNotAvailable = !isLoading && (summary as any)?.isFallback;

  useEffect(() => {
    dispatch(fetchSummary());
  }, [dispatch]);

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
            Marketing Dashboard
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            A central overview of your contacts, campaigns, and conversions.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} sx={{ mt: { xs: 2, md: 0 } }}>
          <Button
            component={Link}
            href={paths.dashboard.marketingSection('campaigns/new')}
            variant="contained"
            startIcon={<Iconify icon="solar:rocket-bold" />}
            disabled={isNotAvailable}
          >
            New Campaign
          </Button>
        </Stack>
      </Stack>

      {isNotAvailable && (
        <Alert severity="info" sx={{ mb: 3 }} icon={<Iconify icon="solar:info-circle-bold" />}>
          Marketing backend services are currently not available. Some features are temporarily disabled until services recover.
        </Alert>
      )}

      <MarketingSummaryCards summary={summary} />

      <Typography variant="h6" sx={{ mt: 5, mb: 3 }}>
        Marketing Modules
      </Typography>

      <Grid container spacing={3}>
        {SECTIONS.map((section) => (
          <Grid key={section.title} item xs={12} sm={6} md={4}>
            <Card
              sx={{
                bgcolor: (theme) => (theme.palette.mode === 'light' ? 'common.white' : 'grey.800'),
                opacity: isNotAvailable ? 0.8 : 1,
              }}
            >
              <CardActionArea
                component={Link}
                href={paths.dashboard.marketingSection(section.path)}
                sx={{ p: 3 }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: `${section.color}.main`,
                    bgcolor: (theme) => `${theme.palette[section.color as any].lighter}`,
                    mb: 2,
                  }}
                >
                  <Iconify icon={section.icon} width={28} />
                </Box>
                <Typography variant="subtitle1" gutterBottom>
                  {section.title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {section.description}
                </Typography>
              </CardActionArea>
            </Card>
          </Grid>
        ))}

        <Grid item xs={12} md={8}>
          {/* Placeholder for future detailed analytics or charts */}
        </Grid>

        <Grid item xs={12} md={4}>
          <MarketingRecentActivity />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
