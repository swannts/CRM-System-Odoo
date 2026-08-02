'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { fetchOrgDetailsThunk, selectOrganization } from 'src/store/slices/organization-slice';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';

import { IntegrationAdp } from '../integration-adp';
import { OmniIntegrationView } from '../omni-integration-view';
import { OrganizationUserManagementView } from './organization-user-management-view';

// ----------------------------------------------------------------------

export function OrganizationSettingsView() {
  const [currentTab, setCurrentTab] = useState('general');
  const dispatch = useAppDispatch();
  const { orgDetails } = useAppSelector(selectOrganization);

  useEffect(() => {
    dispatch(fetchOrgDetailsThunk());
  }, [dispatch]);

  const organization = orgDetails.data;
  const isLoading = orgDetails.loading;

  if (isLoading && !organization) {
    return (
      <Box sx={{ p: 5, textAlign: 'center' }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 5 }}>Organization Settings</Typography>

      <Tabs
        value={currentTab}
        onChange={(e, val) => setCurrentTab(val)}
        sx={{ mb: 5 }}
      >
        <Tab icon={<Iconify icon="ic:round-business" />} label="General" value="general" />
        <Tab icon={<Iconify icon="ic:round-color-lens" />} label="Branding" value="branding" />
        <Tab icon={<Iconify icon="ic:round-people" />} label="Roles & Permissions" value="roles" />
        <Tab icon={<Iconify icon="solar:chat-round-bold" />} label="Omnichannel" value="omni" />
        <Tab icon={<Iconify icon="ic:round-extension" />} label="Integrations" value="integrations" />
      </Tabs>

      {currentTab === 'general' && (
        <Grid container spacing={3}>
           <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ mb: 1 }}>General Information</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Basic details about your organization.
              </Typography>
           </Grid>
           <Grid item xs={12} md={8}>
              <Card sx={{ p: 3 }}>
                 <Stack spacing={3}>
                    <TextField fullWidth label="Organization Name" defaultValue={organization?.name || 'MyManager Org'} />
                    <TextField fullWidth label="Email Address" defaultValue={organization?.email || 'admin@mymanager.com'} />
                    <TextField fullWidth multiline rows={3} label="Address" />
                 </Stack>
                 <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="contained">Save Changes</Button>
                 </Box>
              </Card>
           </Grid>
        </Grid>
      )}

      {currentTab === 'branding' && (
         <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
               <Typography variant="h6" sx={{ mb: 1 }}>Branding</Typography>
               <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                 Customize the look and feel of your portal.
               </Typography>
            </Grid>
            <Grid item xs={12} md={8}>
               <Card sx={{ p: 3 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>Main Logo</Typography>
                  <Box sx={{ width: 100, height: 100, border: '1px dashed #ccc', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                     <Iconify icon="ic:round-add-photo-alternate" width={32} />
                  </Box>
                  <Divider sx={{ mb: 3 }} />
                  <Typography variant="subtitle2" sx={{ mb: 2 }}>Primary Color</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                     {['#00A76F', '#3366FF', '#FFAB00', '#FF5630'].map(color => (
                        <Box key={color} sx={{ width: 32, height: 32, bgcolor: color, borderRadius: '50%', cursor: 'pointer', border: color === '#00A76F' ? '2px solid #000' : 'none' }} />
                     ))}
                  </Box>
               </Card>
            </Grid>
         </Grid>
      )}
      {currentTab === 'roles' && <OrganizationUserManagementView />}
      {currentTab === 'omni' && <OmniIntegrationView />}
      {currentTab === 'integrations' && (
        <Grid container spacing={3}>
           <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ mb: 1 }}>Third-Party Integrations</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Connect your organization with external services to sync data and automate workflows.
              </Typography>
           </Grid>
           <Grid item xs={12} md={8}>
                      <Card sx={{ p: 3, mb: 3 }}>
                         <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                            <Box>
                               <Typography variant="h6">Magento Integration</Typography>
                               <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                  Magento is now the eCommerce source of truth for catalog, checkout, and orders.
                               </Typography>
                            </Box>
                            <Button component={Link} href={paths.public.magentoIntegration} variant="contained">
                               Open Magento
                            </Button>
                         </Stack>
                      </Card>
               <IntegrationAdp />
            </Grid>
        </Grid>
      )}
    </DashboardContent>
  );
}
