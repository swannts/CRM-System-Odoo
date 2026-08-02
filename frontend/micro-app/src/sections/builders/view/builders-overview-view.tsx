'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { 
  fetchBuilderWebsitesThunk, 
  fetchBuilderFormsThunk, 
  selectBuilder 
} from 'src/store/slices/builder-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { LoaderBlock } from 'src/components/loading';

// ----------------------------------------------------------------------

export function BuildersOverviewView() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { websites, forms } = useAppSelector(selectBuilder);

  useEffect(() => {
    dispatch(fetchBuilderWebsitesThunk());
    dispatch(fetchBuilderFormsThunk());
  }, [dispatch]);

  const websitesData = websites.data || [];
  const formsData = forms.data || [];
  const isLoading = websites.loading || forms.loading;

  if (isLoading && !websitesData.length && !formsData.length) {
    return <LoaderBlock loader={{ type: 'circular', label: 'Loading builder data...' }} minHeight={220} />;
  }

  const creativeTools = [
    { title: 'Web Builder', icon: 'solar:global-bold-duotone', count: websitesData.length || 0, color: 'primary', path: paths.dashboard.webBuilderCreate },
    { title: 'Form Funnels', icon: 'solar:document-text-bold-duotone', count: formsData.length || 0, color: 'info', path: paths.dashboard.formBuilder },
    { title: 'Email Designer', icon: 'solar:letter-bold-duotone', count: '12 Templates', color: 'warning', path: paths.dashboard.emailEditor },
    { title: 'Workflows', icon: 'solar:magic-stick-3-bold-duotone', count: '8 Active', color: 'success', path: paths.dashboard.workflow },
  ];

  return (
    <DashboardContent maxWidth="xl">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 5 }}>
        <Box>
          <Typography variant="h4">Creative Builders</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Design websites, funnels, and automated experiences without code.
          </Typography>
        </Box>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 5 }}>
         {creativeTools.map((tool) => (
            <Grid item xs={12} sm={6} md={3} key={tool.title}>
               <Card
                  sx={{
                    p: 3,
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'background.neutral' }
                  }}
                  onClick={() => router.push(tool.path)}
               >
                  <Stack direction="row" spacing={2} alignItems="center">
                     <Box
                        sx={{
                           width: 48,
                           height: 48,
                           borderRadius: 1.5,
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'center',
                           bgcolor: `${tool.color}.lighter`,
                           color: `${tool.color}.main`
                        }}
                     >
                        <Iconify icon={tool.icon} width={28} />
                     </Box>
                     <Box>
                        <Typography variant="subtitle1">{tool.title}</Typography>
                        <Typography variant="caption" color="text.secondary">{tool.count}</Typography>
                     </Box>
                  </Stack>
               </Card>
            </Grid>
         ))}
      </Grid>

      <Grid container spacing={3}>
         <Grid item xs={12} md={8}>
            <Card sx={{ p: 3 }}>
               <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                  <Typography variant="h6">Recent Projects</Typography>
                  <Button size="small">View All</Button>
               </Stack>
               <Stack spacing={2}>
                  {websitesData.slice(0, 5).map((site: any) => (
                     <Box key={site.id} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.neutral', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                           <Box sx={{ width: 40, height: 40, borderRadius: 1, bgcolor: 'primary.lighter', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Iconify icon="solar:global-bold" width={20} sx={{ color: 'primary.main' }} />
                           </Box>
                           <Box>
                              <Typography variant="subtitle2">{site.name}</Typography>
                              <Typography variant="caption" color="text.secondary">{site.domain || 'Draft'}</Typography>
                           </Box>
                        </Stack>
                        <Button size="small" variant="soft">Edit</Button>
                     </Box>
                  ))}
                  {websitesData.length === 0 && !isLoading && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      No recent projects found.
                    </Typography>
                  )}
               </Stack>
            </Card>
         </Grid>

         <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, bgcolor: 'background.neutral', height: '100%' }}>
               <Typography variant="h6" sx={{ mb: 3 }}>Quick Start</Typography>
               <Stack spacing={2}>
                  <QuickStartItem title="Blank Page" icon="solar:document-bold" />
                  <QuickStartItem title="Lead Magnet Funnel" icon="solar:magnet-bold" />
                  <QuickStartItem title="Ecommerce Store" icon="solar:cart-large-minimalistic-bold" />
                  <QuickStartItem title="Business Portfolio" icon="solar:case-bold" />
               </Stack>
            </Card>
         </Grid>
      </Grid>
    </DashboardContent>
  );
}

function QuickStartItem({ title, icon }: any) {
  return (
    <Stack
      direction="row"
      spacing={2}
      alignItems="center"
      sx={{
        p: 2,
        borderRadius: 1.5,
        bgcolor: 'background.paper',
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': { transform: 'translateX(4px)', boxShadow: (theme) => theme.customShadows.z4 }
      }}
    >
       <Iconify icon={icon} width={24} sx={{ color: 'text.secondary' }} />
       <Typography variant="subtitle2">{title}</Typography>
    </Stack>
  );
}
