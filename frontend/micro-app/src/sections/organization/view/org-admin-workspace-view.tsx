'use client';

import Link from 'next/link';
import { z as zod } from 'zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { 
  fetchOrgDetailsThunk, 
  fetchOrgLocationsThunk, 
  createOrgLocationThunk,
  selectOrganization 
} from 'src/store/slices/organization-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { Form, RHFTextField } from 'src/components/hook-form';
import { toast } from 'src/components/snackbar';

import { FeatureRouteShell } from 'src/sections/parity/feature-route-shell';

// ----------------------------------------------------------------------

const LocationSchema = zod.object({
  name: zod.string().min(1, 'Location name is required'),
  email: zod.string().email().optional().or(zod.literal('')),
  phone: zod.string().optional(),
  street: zod.string().optional(),
  city: zod.string().optional(),
  state: zod.string().optional(),
  zip_code: zod.string().optional(),
  country: zod.string().optional(),
});

type Props = {
  mode?:
    | 'organizations'
    | 'organization-detail'
    | 'organization-location'
    | 'plans'
    | 'plan-success'
    | 'plan-payment'
    | 'white-label'
    | 'domain'
    | 'service-fees'
    | 'organization-service-fees'
    | 'token-auth'
    | 'org-payment-method';
  organizationId?: string;
  userId?: string;
  planId?: string;
  duration?: string;
  token?: string;
};

export function OrgAdminWorkspaceView({
  mode = 'organizations',
  organizationId,
  userId,
  planId,
  duration,
  token,
}: Props) {
  const dispatch = useAppDispatch();
  const { orgDetails, locations } = useAppSelector(selectOrganization);
  const [isLocationPending, setIsLocationPending] = useState(false);

  const methods = useForm({
    resolver: zodResolver(LocationSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      street: '',
      city: '',
      state: '',
      zip_code: '',
      country: '',
    },
  });

  useEffect(() => {
    dispatch(fetchOrgDetailsThunk());
    dispatch(fetchOrgLocationsThunk());
  }, [dispatch]);

  const isLoading = orgDetails.loading || locations.loading;
  const organization = orgDetails.data;
  const locationsData = locations.data || [];

  const handleCreateLocation = async (values: any) => {
    try {
      setIsLocationPending(true);
      await dispatch(createOrgLocationThunk(values)).unwrap();
      methods.reset();
      dispatch(fetchOrgLocationsThunk());
      toast.success('Location created successfully');
    } catch (err) {
      toast.error(err || 'Failed to create location');
    } finally {
      setIsLocationPending(false);
    }
  };

  if (isLoading && !organization) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const content = (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6">
              {mode === 'plans'
                ? 'Plans'
                : mode === 'white-label'
                  ? 'White Label'
                  : mode === 'domain'
                    ? 'Domain'
                    : mode.includes('service-fees')
                      ? 'Service Fees'
                      : mode === 'token-auth'
                        ? 'Token Authentication'
                        : mode === 'org-payment-method'
                          ? 'Organization Payment Method'
                          : mode === 'organization-location'
                            ? 'Organization Locations'
                            : 'Organization'}
            </Typography>

            {mode === 'organizations' || mode === 'organization-detail' || mode === 'organization-location' ? (
              <>
                <Typography variant="body2">Name: {organization?.name || 'Unknown'}</Typography>
                <Typography variant="body2">Email: {organization?.email || 'N/A'}</Typography>
                <Typography variant="body2">Organization ID: {organizationId || organization?.id || 'current-org'}</Typography>
                {mode === 'organization-location' && (
                  <>
                    <Divider />
                    <Typography variant="subtitle2">Locations</Typography>
                    {locationsData.map((location: any) => (
                      <Box key={location.id} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.neutral' }}>
                        <Typography variant="subtitle2">{location.name}</Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {[location.city, location.state, location.country].filter(Boolean).join(', ') || 'No address'}
                        </Typography>
                      </Box>
                    ))}
                  </>
                )}
              </>
            ) : mode === 'plans' || mode === 'plan-success' || mode === 'plan-payment' ? (
              <>
                <Typography variant="body2">planId: {planId || 'n/a'}</Typography>
                <Typography variant="body2">duration: {duration || 'n/a'}</Typography>
                <Alert severity="info">
                  The legacy plans route surface now exists in the new app, but subscription checkout and success-state behavior still depend on broader billing/subscription backend work.
                </Alert>
              </>
            ) : mode === 'white-label' || mode === 'domain' ? (
              <>
                <Typography variant="body2">Organization branding/domain routes now resolve in the new app.</Typography>
                <Alert severity="info">
                  White-label and domain behavior is currently represented through organization-level settings. Full domain provisioning and branding parity still requires dedicated backend support.
                </Alert>
              </>
            ) : mode.includes('service-fees') ? (
              <>
                <Typography variant="body2">organizationId: {organizationId || 'current-org'}</Typography>
                <Alert severity="info">
                  Service-fee pages are routed in the new app, but the legacy admin fee-management backend has not been fully migrated to dedicated microservices yet.
                </Alert>
              </>
            ) : (
              <>
                <Typography variant="body2">token: {token || 'n/a'}</Typography>
                <Alert severity="info">
                  This public route is now present in the new app. Full token-auth and org payment method behavior remains compatibility-dependent.
                </Alert>
              </>
            )}
          </Stack>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6">Context</Typography>
            <Typography variant="body2">organizationId: {organizationId || 'n/a'}</Typography>
            <Typography variant="body2">userId: {userId || 'n/a'}</Typography>
            <Typography variant="body2">token: {token || 'n/a'}</Typography>
            <Typography variant="body2">locations: {locationsData.length}</Typography>
          </Stack>
        </Card>
      </Grid>

      {mode === 'organization-location' && (
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Add Location
            </Typography>
            <Form methods={methods} onSubmit={methods.handleSubmit(handleCreateLocation)}>
              <Stack spacing={2}>
                <RHFTextField name="name" label="Location Name" />
                <RHFTextField name="email" label="Email" />
                <RHFTextField name="phone" label="Phone" />
                <RHFTextField name="street" label="Street" />
                <RHFTextField name="city" label="City" />
                <RHFTextField name="state" label="State" />
                <RHFTextField name="zip_code" label="Zip Code" />
                <RHFTextField name="country" label="Country" />
                <Button type="submit" variant="contained" disabled={isLocationPending}>
                  Create Location
                </Button>
              </Stack>
            </Form>
          </Card>
        </Grid>
      )}
    </Grid>
  );

  if (
    mode === 'organizations' ||
    mode === 'organization-detail' ||
    mode === 'organization-location' ||
    mode === 'white-label' ||
    mode === 'domain' ||
    mode === 'service-fees' ||
    mode === 'organization-service-fees'
  ) {
    return (
      <DashboardContent maxWidth="xl">
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h4">Organization Admin</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button component={Link} href={paths.dashboard.organizations} variant="soft" color="inherit">
              Organizations
            </Button>
            <Button component={Link} href={paths.dashboard.devices} variant="soft" color="inherit">
              Devices
            </Button>
            <Button component={Link} href={paths.dashboard.whiteLabel} variant="soft" color="inherit">
              White Label
            </Button>
            <Button component={Link} href={paths.dashboard.domain} variant="soft" color="inherit">
              Domain
            </Button>
          </Stack>
        </Box>
        {content}
      </DashboardContent>
    );
  }

  return (
    <FeatureRouteShell
      title="Organization Public Flow"
      description="Legacy plans, token, and organization payment routes mapped into the micro-app."
      links={[
        { href: paths.public.plans, label: 'Plans' },
        ...(planId && duration ? [{ href: paths.public.planPayment(planId, duration), label: 'Plan Payment' }] : []),
      ]}
    >
      {content}
    </FeatureRouteShell>
  );
}
