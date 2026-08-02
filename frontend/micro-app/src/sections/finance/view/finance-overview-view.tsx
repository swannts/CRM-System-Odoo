'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { fetchFinanceStats, selectFinance } from 'src/store/slices/finance-slice';
import { fetchBillingInvoices, selectBilling } from 'src/store/slices/billing-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { fCurrency } from 'src/utils/format-number';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function FinanceOverviewView() {
  const dispatch = useAppDispatch();
  const financeState = useAppSelector(selectFinance);
  const billingState = useAppSelector(selectBilling);

  useEffect(() => {
    dispatch(fetchFinanceStats());
    dispatch(fetchBillingInvoices({ page: 1, pageSize: 20 }));
  }, [dispatch]);

  const stats = financeState.stats.data;
  const statsLoading = financeState.stats.loading;

  const invoices = { data: billingState.invoices.data };
  const invoicesLoading = billingState.invoices.loading;

  if (statsLoading || invoicesLoading) {
    return (
      <DashboardContent maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 5 }}>
          <Box><Skeleton variant="text" width={240} height={40} /><Skeleton variant="text" width={400} /></Box>
          <Stack direction="row" spacing={2}>
            <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 1 }} />
            <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 1 }} />
          </Stack>
        </Stack>
        <Grid container spacing={3} sx={{ mb: 5 }}>
          {[...Array(4)].map((_, i) => (
            <Grid item xs={12} md={3} key={i}>
              <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}><Skeleton variant="rectangular" height={500} sx={{ borderRadius: 2 }} /></Grid>
          <Grid item xs={12} md={4}><Skeleton variant="rectangular" height={500} sx={{ borderRadius: 2 }} /></Grid>
        </Grid>
      </DashboardContent>
    );
  }

  const kpis = [
    { label: 'Total Revenue', value: fCurrency(stats?.totalRevenue || 0), icon: 'solar:wad-of-money-bold-duotone', color: 'primary', helper: 'All-time platform revenue' },
    { label: 'Net Profit', value: fCurrency((stats?.totalRevenue || 0) * 0.72), icon: 'solar:chart-2-bold-duotone', color: 'success', helper: 'After estimated expenses' },
    { label: 'Outstanding', value: fCurrency(stats?.outstanding || 0), icon: 'solar:bill-list-bold-duotone', color: 'error', helper: 'Unpaid invoice balance' },
    { label: 'Growth', value: '+12.5%', icon: 'solar:graph-up-bold-duotone', color: 'info', helper: 'Compared to last month' },
  ];

  return (
    <DashboardContent maxWidth="xl">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 5 }}>
        <Box>
          <Typography variant="h4">Finance Hub</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Monitor your platform revenue, expenses, and transaction lifecycle.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
           <Button variant="soft" color="inherit" startIcon={<Iconify icon="solar:printer-minimalistic-bold" />}>Report</Button>
           <Button variant="contained" startIcon={<Iconify icon="solar:add-circle-bold" />}>New Invoice</Button>
        </Stack>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 5 }}>
         {kpis.map((kpi) => (
            <Grid item xs={12} sm={6} md={3} key={kpi.label}>
               <Card sx={{ p: 3 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                     <Box
                        sx={{
                           width: 48,
                           height: 48,
                           borderRadius: 1.5,
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'center',
                           bgcolor: `${kpi.color}.lighter`,
                           color: `${kpi.color}.main`
                        }}
                     >
                        <Iconify icon={kpi.icon} width={28} />
                     </Box>
                     <Box>
                        <Typography variant="subtitle2" color="text.secondary">{kpi.label}</Typography>
                        <Typography variant="h5">{kpi.value}</Typography>
                     </Box>
                  </Stack>
                  <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'text.disabled' }}>{kpi.helper}</Typography>
               </Card>
            </Grid>
         ))}
      </Grid>

      <Grid container spacing={3}>
         <Grid item xs={12} md={8}>
            <Card sx={{ p: 3 }}>
               <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                  <Typography variant="h6">Recent Transactions</Typography>
                  <Button size="small">View All</Button>
               </Stack>
               <Stack spacing={2}>
                  {((invoices as any)?.data || []).slice(0, 6).map((inv: any) => (
                     <Box key={inv.id} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.neutral', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                           <Box sx={{ width: 40, height: 40, borderRadius: 1, bgcolor: inv.status === 'paid' ? 'success.lighter' : 'warning.lighter', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Iconify icon={inv.status === 'paid' ? 'solar:check-circle-bold' : 'solar:clock-circle-bold'} width={20} sx={{ color: inv.status === 'paid' ? 'success.main' : 'warning.main' }} />
                           </Box>
                           <Box>
                              <Typography variant="subtitle2">{inv.customerName || inv.no || 'Invoice'}</Typography>
                              <Typography variant="caption" color="text.secondary">{inv.dueDate ? `Due ${new Date(inv.dueDate).toLocaleDateString()}` : 'No date'}</Typography>
                           </Box>
                        </Stack>
                        <Box sx={{ textAlign: 'right' }}>
                           <Typography variant="subtitle2">{fCurrency(inv.totalDue || 0)}</Typography>
                           <Typography variant="caption" color={inv.status === 'paid' ? 'success.main' : 'warning.main'}>{inv.status}</Typography>
                        </Box>
                     </Box>
                  ))}
               </Stack>
            </Card>
         </Grid>

         <Grid item xs={12} md={4}>
            <Stack spacing={3}>
               <Card sx={{ p: 3 }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Revenue Allocation</Typography>
                  <Stack spacing={2}>
                     <AllocationItem label="Online Shop" value={65} color="primary" />
                     <AllocationItem label="Memberships" value={22} color="info" />
                     <AllocationItem label="Events & POS" value={13} color="warning" />
                  </Stack>
               </Card>

               <Card sx={{ p: 3, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>Export Financials</Typography>
                  <Typography variant="body2" sx={{ mb: 3, opacity: 0.8 }}>Generate high-fidelity PDF reports for your accounting and tax records.</Typography>
                  <Button variant="contained" color="inherit" fullWidth sx={{ color: 'primary.main', fontWeight: 'bold' }}>Generate PDF</Button>
               </Card>
            </Stack>
         </Grid>
      </Grid>
    </DashboardContent>
  );
}

function AllocationItem({ label, value, color }: any) {
  return (
    <Box>
       <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="body2">{label}</Typography>
          <Typography variant="subtitle2">{value}%</Typography>
       </Stack>
       <LinearProgress variant="determinate" value={value} color={color} sx={{ height: 6, borderRadius: 3 }} />
    </Box>
  );
}
