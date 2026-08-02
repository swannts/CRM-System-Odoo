'use client';

import { useEffect } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import { useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { fetchBillingInvoices, fetchBillingSummary, fetchBillingGraph } from 'src/store/slices/billing-slice';
import { fCurrency } from 'src/utils/format-number';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { Label } from 'src/components/label';

import { BillingWidgetSummary } from '../billing-widget-summary';
import { BillingRevenueChart } from '../components/billing-revenue-chart';

export function BillingDashboardView() {
  const theme = useTheme();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const { invoices: invoicesState, summary: summaryState } = useAppSelector((state) => state.billing);

  useEffect(() => {
    dispatch(fetchBillingSummary());
    dispatch(fetchBillingGraph(6));
    dispatch(fetchBillingInvoices({ page: 1, pageSize: 5 }));
  }, [dispatch]);

  const summary = summaryState.data;
  const graphData = summaryState.data?.graph || [];
  const invoices = invoicesState.data || [];
  const isInvoicesLoading = invoicesState.loading;

  return (
    <DashboardContent maxWidth="xl">
      <Box sx={{ mb: 5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4">Billing Dashboard</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Overview of your financial performance and outstanding invoices.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => router.push(paths.dashboard.invoiceNew)}
        >
          New Invoice
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid xs={12} md={3}>
          <BillingWidgetSummary
            title="Total Invoiced"
            total={summary?.totalInvoiced || 0}
            icon="solar:bill-list-bold"
            color="primary"
          />
        </Grid>

        <Grid xs={12} md={3}>
          <BillingWidgetSummary
            title="Total Paid"
            total={summary?.totalPaid || 0}
            icon="solar:check-circle-bold"
            color="success"
          />
        </Grid>

        <Grid xs={12} md={3}>
          <BillingWidgetSummary
            title="Outstanding"
            total={summary?.totalOutstanding || 0}
            icon="solar:clock-circle-bold"
            color="warning"
          />
        </Grid>

        <Grid xs={12} md={3}>
          <BillingWidgetSummary
            title="Overdue Count"
            total={summary?.overdueCount || 0}
            icon="solar:danger-bold"
            color="error"
          />
        </Grid>

        <Grid xs={12} md={8}>
          <BillingRevenueChart
            title="Revenue Overview"
            subheader="Monthly total invoiced amount"
            data={graphData || []}
          />
        </Grid>

        <Grid xs={12} md={4}>
          <Card sx={{ height: '100%', border: `1px solid ${theme.palette.divider}`, boxShadow: theme.customShadows.card }}>
            <CardHeader
              title="Recent Invoices"
              action={
                <Button
                  size="small"
                  color="inherit"
                  endIcon={<Iconify icon="solar:alt-arrow-right-bold" />}
                  onClick={() => router.push(paths.dashboard.invoices)}
                >
                  View All
                </Button>
              }
            />

            <TableContainer sx={{ mt: 2 }}>
              <Scrollbar>
                <Table sx={{ minWidth: 320 }}>
                  <TableBody>
                    {invoices.map((row: any) => (
                      <TableRow key={row.id} hover onClick={() => router.push(paths.dashboard.invoiceDetails(row.id))} sx={{ cursor: 'pointer' }}>
                        <TableCell>
                          <Typography variant="subtitle2">{row.no}</Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{row.customerName}</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2">{fCurrency(row.totalAmount)}</Typography>
                          <Label
                            variant="soft"
                            color={
                              (row.status === 'posted' ? 'success' : 
                               row.status === 'draft' ? 'info' : 'default') as any
                            }
                            sx={{ mt: 0.5 }}
                          >
                            {row.status}
                          </Label>
                        </TableCell>
                      </TableRow>
                    ))}
                    {invoices.length === 0 && !isInvoicesLoading && (
                      <TableRow>
                        <TableCell colSpan={2} align="center" sx={{ py: 3 }}>
                          No recent invoices
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Scrollbar>
            </TableContainer>
          </Card>
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
