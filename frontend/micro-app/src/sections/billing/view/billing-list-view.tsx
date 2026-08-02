'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import {
  fetchBillingInvoices,
  fetchBillingSummary,
  fetchBillingReconciliation,
  fetchBillingGraph,
  selectBilling,
} from 'src/store/slices/billing-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Menu from '@mui/material/Menu';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import Grid from '@mui/material/Unstable_Grid2';
import TableBody from '@mui/material/TableBody';
import TextField from '@mui/material/TextField';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import InputAdornment from '@mui/material/InputAdornment';
import TablePagination from '@mui/material/TablePagination';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter, usePathname, useSearchParams } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { fCurrency } from 'src/utils/format-number';

import { DashboardContent } from 'src/layouts/dashboard';
import { billingService } from 'src/services/billing-service';

import { Label } from 'src/components/label';
import { showToast } from 'src/components/toast';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { Chart, useChart } from 'src/components/chart';

import { BillingWidgetSummary } from '../billing-widget-summary';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'no', label: 'Invoice No.' },
  { id: 'customer', label: 'Customer' },
  { id: 'amount', label: 'Amount' },
  { id: 'status', label: 'Status' },
  { id: 'dueDate', label: 'Due Date' },
  { id: 'action', label: 'Action', align: 'right' as const },
];

const RECON_TABLE_HEAD = [
  { id: 'invoice', label: 'Invoice' },
  { id: 'invoiceTotal', label: 'Invoice Total' },
  { id: 'residual', label: 'Outstanding' },
  { id: 'magentoRef', label: 'Magento Ref' },
  { id: 'match', label: 'Match' },
  { id: 'action', label: 'Action', align: 'right' as const },
];

// ----------------------------------------------------------------------

export function BillingListView() {
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewMode = searchParams.get('view') === 'graph' ? 'graph' : 'list';

  const billingState = useAppSelector(selectBilling);

  useEffect(() => {
    dispatch(fetchBillingInvoices({ search, page: page + 1, pageSize: rowsPerPage }));
    dispatch(fetchBillingSummary());
  }, [dispatch, search, page, rowsPerPage]);

  useEffect(() => {
    if (viewMode === 'list') {
      dispatch(fetchBillingReconciliation());
    }
    if (viewMode === 'graph') {
      dispatch(fetchBillingGraph(6));
    }
  }, [dispatch, viewMode]);

  const invoices = billingState.invoices.data;
  const totalInvoices = billingState.invoices.total;
  const isLoading = billingState.invoices.loading;
  const summaryData = billingState.summary.data;
  const reconciliationData = billingState.reconciliation.data;

  const [menuAnchorEl, setMenuAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const reconciliationRows = Array.isArray(reconciliationData) ? reconciliationData : [];
  const selectedInvoice = invoices.find((invoice: any) => String(invoice.id) === String(selectedInvoiceId));
  const paidAmount = Number(summaryData?.totalPaid ?? invoices.reduce((acc: number, curr: any) => acc + (Number(curr.paidAmount) || 0), 0));
  const outstandingAmount = Number(summaryData?.totalOutstanding ?? invoices.reduce((acc: number, curr: any) => acc + (Number(curr.totalDue) || 0), 0));
  const confirmDelete = useBoolean();

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, invoiceId: string) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedInvoiceId(invoiceId);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setSelectedInvoiceId(null);
  };

  const handleView = () => {
    if (selectedInvoiceId) {
      router.push(paths.dashboard.invoiceDetails(selectedInvoiceId));
    }
    handleCloseMenu();
  };

  const handleEdit = () => {
    if (selectedInvoiceId) {
      router.push(paths.dashboard.invoiceEdit(selectedInvoiceId));
    }
    handleCloseMenu();
  };

  const handleDelete = async () => {
    try {
      if (selectedInvoiceId) {
        await billingService.deleteInvoice(selectedInvoiceId);
        dispatch(fetchBillingInvoices({ search, page: page + 1, pageSize: rowsPerPage }));
        showToast({ message: 'Invoice deleted successfully.', severity: 'success' });
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to delete invoice';
      showToast({ message, severity: 'warning' });
    }
    confirmDelete.onFalse();
    handleCloseMenu();
  };

  const handlePostInvoice = async () => {
    try {
      if (!selectedInvoiceId) return;
      await billingService.postInvoice(selectedInvoiceId);
      dispatch(fetchBillingInvoices({ search, page: page + 1, pageSize: rowsPerPage }));
      showToast({ message: 'Invoice posted successfully.', severity: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to post invoice';
      showToast({ message, severity: 'warning' });
    } finally {
      handleCloseMenu();
    }
  };

  const handleDownload = async () => {
    try {
      if (!selectedInvoiceId) return;
      const blob = await billingService.downloadInvoice(selectedInvoiceId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedInvoice?.no || `invoice-${selectedInvoiceId}`}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast({ message: 'Invoice PDF downloaded.', severity: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to download invoice';
      showToast({ message, severity: 'warning' });
    } finally {
      handleCloseMenu();
    }
  };

  const handleLink = async (invoiceId: string | number) => {
    const magentoOrderRef = window.prompt('Enter Magento order reference (increment_id)');
    if (!magentoOrderRef) return;
    try {
      await billingService.linkReconciliation({ invoiceId, magentoOrderRef });
      dispatch(fetchBillingReconciliation());
      showToast({ message: 'Reconciliation link requested.', severity: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to link reconciliation';
      showToast({ message, severity: 'warning' });
    }
  };

  const handleUnlink = async (invoiceId: string | number) => {
    try {
      await billingService.unlinkReconciliation({ invoiceId });
      dispatch(fetchBillingReconciliation());
      showToast({ message: 'Reconciliation unlink requested.', severity: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to unlink reconciliation';
      showToast({ message, severity: 'warning' });
    }
  };

  const totalAmount = Number(summaryData?.totalInvoiced ?? invoices.reduce((acc: number, curr: any) => acc + (Number(curr.totalAmount) || 0), 0));

  const graphData = summaryData?.graph as any;
  const monthKeys = Array.isArray(graphData?.categories) ? graphData.categories : [];
  const chartSeries = Array.isArray(graphData?.series) ? graphData.series : [
    { name: 'Invoiced', data: [] },
    { name: 'Paid', data: [] },
    { name: 'Outstanding', data: [] },
  ];

  const chartOptions = useChart({
    chart: { stacked: false, toolbar: { show: false } },
    stroke: { width: [2, 2, 2], curve: 'smooth' },
    fill: { opacity: 0.2 },
    colors: ['#1f6feb', '#2e7d32', '#ed6c02'],
    xaxis: {
      categories: monthKeys.map((key) => {
        const [year, month] = key.split('-');
        return `${month}/${year.slice(2)}`;
      }),
    },
    yaxis: {
      labels: {
        formatter: (value: number) => `$${Math.round(value).toLocaleString()}`,
      },
    },
    tooltip: {
      y: {
        formatter: (value: number) => fCurrency(value),
      },
    },
    legend: { position: 'top' },
  });

  const getStatusColor = (status: string, paymentStatus?: string) => {
    const normalized = String(status || '').toLowerCase();
    const payment = String(paymentStatus || '').toLowerCase();

    if (normalized === 'cancel' || normalized === 'cancelled') return 'error';
    if (payment === 'paid') return 'success';
    if (payment === 'partial') return 'warning';
    if (normalized === 'posted') return 'info';
    return 'default';
  };

  const onChangeView = (nextView: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextView === 'graph') {
      params.set('view', 'graph');
    } else {
      params.delete('view');
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <DashboardContent maxWidth="xl">
      <Box sx={{ mb: 5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h4">Billing</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ToggleButtonGroup
            size="small"
            value={viewMode}
            exclusive
            onChange={(event, val) => val && onChangeView(val)}
          >
            <ToggleButton value="list">
              <Iconify icon="solar:list-bold" />
            </ToggleButton>
            <ToggleButton value="graph">
              <Iconify icon="solar:chart-2-bold" />
            </ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => router.push(paths.dashboard.invoiceNew)}
          >
            New Invoice
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid xs={12} md={4}>
          <BillingWidgetSummary
            title="Total Revenue"
            total={totalAmount}
            icon="solar:wad-of-money-bold"
          />
        </Grid>

        <Grid xs={12} md={4}>
          <BillingWidgetSummary
            title="Paid"
            total={paidAmount}
            color="success"
            icon="solar:check-circle-bold"
          />
        </Grid>

        <Grid xs={12} md={4}>
          <BillingWidgetSummary
            title="Outstanding"
            total={outstandingAmount}
            color="warning"
            icon="solar:clock-circle-bold"
          />
        </Grid>
      </Grid>

      {viewMode === 'graph' ? (
        <Card sx={{ p: 2.5 }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6">Billing Trend (Last 6 Months)</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Live monthly invoice, paid, and outstanding totals from Odoo billing data.
            </Typography>
          </Box>
          <Chart type="line" series={chartSeries} options={chartOptions} height={340} />
        </Card>
      ) : (
        <>
          <Card>
            <Box sx={{ p: 2 }}>
              <TextField
                fullWidth
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder="Search invoices..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
              <Scrollbar>
                <Table sx={{ minWidth: 800 }}>
                  <TableHead>
                    <TableRow>
                      {TABLE_HEAD.map((headCell) => (
                        <TableCell key={headCell.id} align={headCell.align}>
                          {headCell.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {isLoading ? (
                      [...Array(5)].map((_, index) => (
                        <TableRow key={index}>
                          <TableCell><Skeleton variant="text" width={60} /></TableCell>
                          <TableCell><Skeleton variant="text" width={140} /></TableCell>
                          <TableCell><Skeleton variant="text" width={80} /></TableCell>
                          <TableCell><Skeleton variant="text" width={60} /></TableCell>
                          <TableCell><Skeleton variant="text" width={100} /></TableCell>
                          <TableCell align="right"><Skeleton variant="circular" width={32} height={32} /></TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <>
                        {invoices.map((row: any) => (
                          <TableRow key={row.id} hover>
                            <TableCell>{row.no}</TableCell>
                            <TableCell>{row.customerName}</TableCell>
                            <TableCell>{fCurrency(row.totalAmount)}</TableCell>
                            <TableCell>
                              <Label
                                variant="soft"
                                color={getStatusColor(row.status, row.deliveryStatus) as any}
                              >
                                {row.deliveryStatus === 'paid' ? 'Paid' : row.status}
                              </Label>
                            </TableCell>
                            <TableCell>{row.dueDate ? new Date(row.dueDate).toLocaleDateString() : '-'}</TableCell>
                            <TableCell align="right">
                              <IconButton onClick={(event) => handleOpenMenu(event, row.id)}>
                                <Iconify icon="eva:more-vertical-fill" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}

                        {invoices.length === 0 && !isLoading && (
                          <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                              <Typography variant="h6">No data found</Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    )}
                  </TableBody>
                </Table>
              </Scrollbar>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={totalInvoices}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(event, newPage) => setPage(newPage)}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
            />
          </Card>

          <Card sx={{ mt: 3 }}>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6">Reconciliation (Odoo vs Magento)</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Matched and unmatched invoice-to-order references across accounting and commerce.
              </Typography>
            </Box>
            <TableContainer>
              <Scrollbar>
                <Table sx={{ minWidth: 900 }}>
                  <TableHead>
                    <TableRow>
                      {RECON_TABLE_HEAD.map((headCell) => (
                        <TableCell key={headCell.id} align={headCell.align}>
                          {headCell.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reconciliationRows.map((row: any) => (
                      <TableRow key={String(row.invoiceId)}>
                        <TableCell>{row.invoiceNumber || row.invoiceId}</TableCell>
                        <TableCell>{fCurrency(Number(row.invoiceTotal || 0))}</TableCell>
                        <TableCell>{fCurrency(Number(row.residual || 0))}</TableCell>
                        <TableCell>{row.magentoOrderRef || '-'}</TableCell>
                        <TableCell>
                          <Label variant="soft" color={row.matched ? 'success' : 'warning'}>
                            {row.matched ? 'Matched' : 'Unmatched'}
                          </Label>
                        </TableCell>
                        <TableCell align="right">
                          {row.matched ? (
                            <Button size="small" color="warning" variant="soft" onClick={() => handleUnlink(row.invoiceId)}>
                              Unlink
                            </Button>
                          ) : (
                            <Button size="small" variant="contained" onClick={() => handleLink(row.invoiceId)}>
                              Link
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {reconciliationRows.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            No reconciliation records available.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Scrollbar>
            </TableContainer>
          </Card>
        </>
      )}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleView}>
          <Iconify icon="solar:eye-bold" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <Iconify icon="solar:pen-bold" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={handlePostInvoice}
          disabled={!selectedInvoice || String(selectedInvoice.status).toLowerCase() !== 'draft'}
        >
          <Iconify icon="solar:verified-check-bold" sx={{ mr: 1 }} />
          Post Invoice
        </MenuItem>
        <MenuItem onClick={handleDownload}>
          <Iconify icon="solar:download-bold" sx={{ mr: 1 }} />
          Download PDF
        </MenuItem>
        <MenuItem
          onClick={confirmDelete.onTrue}
          disabled={!selectedInvoice || String(selectedInvoice.status).toLowerCase() === 'posted'}
          sx={{ color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      <Dialog open={confirmDelete.value} onClose={confirmDelete.onFalse}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          {selectedInvoice && String(selectedInvoice.status).toLowerCase() === 'posted'
            ? 'Posted invoices cannot be deleted. Use the cancel or credit note flow in Odoo.'
            : 'Are you sure you want to delete this draft invoice?'}
        </DialogContent>
        <DialogActions>
          <Button onClick={confirmDelete.onFalse} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={!selectedInvoice || String(selectedInvoice.status).toLowerCase() === 'posted'}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
