'use client';

import { z as zod } from 'zod';
import { useMemo, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { 
  fetchBillingInvoices, 
  fetchInvoiceById, 
  fetchPayments, 
  createInvoiceThunk, 
  updateInvoiceThunk, 
  postInvoiceThunk,
  selectBilling 
} from 'src/store/slices/billing-slice';
import { fetchFinanceStats, selectFinance } from 'src/store/slices/finance-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { fCurrency } from 'src/utils/format-number';

import { billingService } from 'src/services/billing-service';
import { contactService } from 'src/services/contact-service';

import { showToast } from 'src/components/toast';
import { Form, RHFTextField } from 'src/components/hook-form';

import { Label } from 'src/components/label';
import { FeatureRouteShell } from 'src/sections/parity/feature-route-shell';

// ----------------------------------------------------------------------

const InvoiceSchema = zod.object({
  partner_id: zod.number().min(1, 'Customer is required'),
  customerName: zod.string().min(1, 'Customer name is required'),
  totalAmount: zod.coerce.number().min(0.01, 'Amount must be positive'),
  dueDate: zod.string().min(1, 'Due date is required'),
  description: zod.string().optional(),
});

type Props = {
  section?: string;
  invoiceId?: string;
  mode?: 'list' | 'new' | 'edit' | 'preview' | 'print' | 'payment' | 'confirm' | 'receipt';
};

export function FinanceWorkspaceView({ section, invoiceId, mode = 'list' }: Props) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preFilledCustomerId = searchParams.get('customer');

  const billingState = useAppSelector(selectBilling);
  const financeState = useAppSelector(selectFinance);

  const [filters, setFilters] = useState({
    state: '',
    paymentState: '',
    dateFrom: '',
    dateTo: '',
  });

  const methods = useForm({
    resolver: zodResolver(InvoiceSchema),
    defaultValues: {
      partner_id: 0,
      customerName: '',
      totalAmount: 0,
      dueDate: new Date().toISOString().slice(0, 10),
      description: 'Invoice for services',
    },
  });

  const { reset, setValue } = methods;

  // Pre-fill customer logic
  useEffect(() => {
    if (preFilledCustomerId && mode === 'new') {
      const fetchPreFill = async () => {
        try {
          const contact = await contactService.getContact(preFilledCustomerId);
          if (contact) {
            setValue('partner_id', Number(contact.id));
            setValue('customerName', contact.fullName);
          }
        } catch (error) {
          console.error('Failed to pre-fill customer', error);
        }
      };
      fetchPreFill();
    }
  }, [preFilledCustomerId, mode, setValue]);

  // Data fetching
  useEffect(() => {
    if (invoiceId) {
      dispatch(fetchInvoiceById(invoiceId));
    } else {
      dispatch(fetchBillingInvoices({ 
        ...filters, 
        contactId: section === 'customer' ? (preFilledCustomerId || undefined) : undefined 
      }));
    }

    if (section === 'payouts' || mode === 'receipt') {
      dispatch(fetchPayments());
    }

    if (['overview', 'income', 'expense', 'pnl'].includes(section || 'overview')) {
      dispatch(fetchFinanceStats());
    }
  }, [dispatch, invoiceId, section, filters, mode, preFilledCustomerId]);

  const handleSaveInvoice = async (values: any) => {
    try {
      if (mode === 'edit' && invoiceId) {
        const updatePayload = {
          partner_id: values.partner_id,
          invoice_date_due: values.dueDate,
          narration: values.description || 'Invoice updated from dashboard',
        };
        await dispatch(updateInvoiceThunk({ id: invoiceId, data: updatePayload })).unwrap();
        showToast({ message: 'Invoice updated successfully', severity: 'success' });
      } else {
        const payload = {
          partner_id: values.partner_id,
          invoice_date: new Date().toISOString().slice(0, 10),
          invoice_date_due: values.dueDate,
          move_type: 'out_invoice',
          invoice_line_ids: [
            [0, 0, {
              name: values.description || 'Service Fee',
              quantity: 1,
              price_unit: values.totalAmount,
            }]
          ]
        };
        await dispatch(createInvoiceThunk(payload)).unwrap();
        showToast({ message: 'Invoice created successfully', severity: 'success' });
      }
      router.push(paths.dashboard.billing);
    } catch (error: any) {
      showToast({ message: error || 'Failed to save invoice', severity: 'error' });
    }
  };

  const handlePostInvoice = async () => {
    if (!invoiceId) return;
    try {
      await dispatch(postInvoiceThunk(invoiceId)).unwrap();
      showToast({ message: 'Invoice posted successfully.', severity: 'success' });
    } catch (error: any) {
      showToast({ message: error || 'Failed to post invoice', severity: 'error' });
    }
  };

  const handleDownloadInvoice = async () => {
    if (!invoiceId || !billingState.currentInvoice.data) return;
    try {
      const blob = await billingService.downloadInvoice(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${billingState.currentInvoice.data.no || `invoice-${invoiceId}`}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast({ message: 'Invoice PDF downloaded.', severity: 'success' });
    } catch (error: any) {
      showToast({ message: error?.message || 'Failed to download invoice', severity: 'error' });
    }
  };

  const title = useMemo(() => {
    if (mode === 'new') return 'Create Invoice';
    if (mode === 'edit') return 'Edit Invoice';
    if (mode === 'preview') return 'Invoice Preview';
    if (mode === 'print') return 'Print Invoice';
    if (mode === 'payment') return 'Invoice Payment';
    if (mode === 'confirm') return 'Payment Confirmation';
    if (mode === 'receipt') return 'Receipt';
    if (section === 'payouts') return 'Finance Payouts';
    if (section === 'income') return 'Finance Income';
    if (section === 'expense') return 'Finance Expense';
    if (section === 'pnl') return 'Profit and Loss';
    return 'Billing and Finance';
  }, [mode, section]);

  const links = [
    { href: paths.dashboard.invoices, label: 'Invoice List' },
    { href: paths.dashboard.invoiceNew, label: 'Add Invoice' },
    { href: paths.dashboard.financeSection('overview'), label: 'Finance Overview' },
    { href: paths.dashboard.financeSection('payouts'), label: 'Payouts' },
    { href: paths.dashboard.financeSection('income'), label: 'Income' },
    { href: paths.dashboard.financeSection('expense'), label: 'Expense' },
    { href: paths.dashboard.financeSection('pnl'), label: 'P&L' },
  ];

  const currentInvoice = billingState.currentInvoice.data;
  const currentInvoiceLoading = billingState.currentInvoice.loading;

  if (invoiceId && currentInvoiceLoading) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <LinearProgress />
      </Box>
    );
  }

  if (currentInvoice && (mode === 'preview' || mode === 'print' || mode === 'payment' || mode === 'confirm' || mode === 'receipt')) {
    return (
      <FeatureRouteShell
        title={title}
        description="Legacy invoice preview, print, payment, confirmation, and receipt flows mapped into the micro-app."
        links={links}
      >
        <Card sx={{ p: 4 }}>
          <Stack spacing={2}>
            <Typography variant="h5">Invoice #{currentInvoice.no || (currentInvoice as any)._id || currentInvoice.id}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Customer: {currentInvoice.customerName || (currentInvoice as any).billTo || 'Unknown'}
            </Typography>
            <Typography variant="body2">Status: {currentInvoice.status || 'Draft'}</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="h4">{fCurrency(currentInvoice.totalDue || currentInvoice.totalAmount || 0)}</Typography>
              {(currentInvoice as any).isOverdue && (
                <Label color="error" variant="filled">OVERDUE</Label>
              )}
            </Stack>

            {(currentInvoice as any).lines && (currentInvoice as any).lines.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Line Items</Typography>
                <Stack spacing={1.5} divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
                  {(currentInvoice as any).lines.map((line: any) => (
                    <Stack key={line.id} direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body2">{line.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {line.quantity} x {fCurrency(line.priceUnit)}
                        </Typography>
                      </Box>
                      <Typography variant="subtitle2">{fCurrency(line.priceTotal ?? line.priceSubtotal)}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            )}
            <Stack direction="row" spacing={1}>
              {String(currentInvoice.status || '').toLowerCase() === 'draft' && (
                <Button
                  variant="contained"
                  onClick={handlePostInvoice}
                >
                  Post Invoice
                </Button>
              )}
              <Button variant="outlined" onClick={handleDownloadInvoice}>
                Download PDF
              </Button>
            </Stack>
            {(mode === 'payment' || mode === 'confirm') && (
              <Alert severity={mode === 'confirm' ? 'success' : 'info'}>
                {mode === 'confirm'
                  ? 'Payment confirmation route is active and bound to the real invoice record.'
                  : 'Payment collection route is active. Processor checkout wiring remains backend-dependent per tenant setup.'}
              </Alert>
            )}
            {mode === 'receipt' && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Recent payment records: {billingState.payments.data.length}
              </Typography>
            )}
          </Stack>
        </Card>
      </FeatureRouteShell>
    );
  }

  if (mode === 'new' || mode === 'edit') {
    const defaultValues = {
      partner_id: (currentInvoice as any)?.partner_id?.[0] || 0,
      customerName: (currentInvoice as any)?.partner_id?.[1] || currentInvoice?.customerName || '',
      totalAmount: (currentInvoice as any)?.amount_total || currentInvoice?.totalAmount || 0,
      dueDate: (currentInvoice as any)?.invoice_date_due || currentInvoice?.dueDate || new Date().toISOString().slice(0, 10),
      description: 'Invoice for services',
    };

    if (methods.getValues('customerName') !== defaultValues.customerName && currentInvoice) {
      reset(defaultValues);
    }

    return (
      <FeatureRouteShell
        title={title}
        description="Legacy add and edit invoice routes now resolve to a real invoice form in the micro-app."
        links={links}
      >
        <Card sx={{ p: 3 }}>
          <Form methods={methods} onSubmit={methods.handleSubmit(handleSaveInvoice)}>
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Customer</Typography>
                <RHFTextField name="customerName" label="Customer Name" disabled />
                <Typography variant="caption" color="text.secondary">ID: {methods.watch('partner_id')}</Typography>
              </Box>
              
              <RHFTextField name="description" label="Description / Service Name" multiline rows={2} />
              
              <RHFTextField name="totalAmount" label="Total Amount ($)" type="number" />
              
              <TextField
                type="date"
                label="Due Date"
                InputLabelProps={{ shrink: true }}
                value={methods.watch('dueDate')}
                onChange={(event) => setValue('dueDate', event.target.value, { shouldValidate: true })}
              />
              <Button type="submit" variant="contained">
                {mode === 'edit' ? 'Save Invoice' : 'Create Invoice'}
              </Button>
              {mode === 'edit' && (
                <Stack direction="row" spacing={1}>
                  {String(currentInvoice?.status || '').toLowerCase() === 'draft' && (
                    <Button
                      variant="soft"
                      color="success"
                      onClick={handlePostInvoice}
                    >
                      Post Invoice
                    </Button>
                  )}
                  <Button variant="outlined" onClick={handleDownloadInvoice} disabled={!invoiceId}>
                    Download PDF
                  </Button>
                </Stack>
              )}
            </Stack>
          </Form>
        </Card>
      </FeatureRouteShell>
    );
  }

  return (
    <FeatureRouteShell
      title={title}
      description="Finance parity workspace covering overview, payouts, income, expense, profit and loss, and invoice list flows."
      links={links}
    >
      <Grid container spacing={3}>
        <Grid item xs={12} md={section === 'payouts' ? 12 : 8}>
          <Card sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="h6">
                {section === 'payouts' ? 'Payout History' : 'Invoices'}
              </Typography>
              {section !== 'payouts' && (
                <Stack direction="row" spacing={1}>
                  <TextField
                    select
                    size="small"
                    label="Status"
                    value={filters.state}
                    onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                    sx={{ width: 120 }}
                    SelectProps={{ native: true }}
                  >
                    <option value="">All</option>
                    <option value="draft">Draft</option>
                    <option value="posted">Posted</option>
                    <option value="cancel">Cancelled</option>
                  </TextField>
                  <TextField
                    select
                    size="small"
                    label="Payment"
                    value={filters.paymentState}
                    onChange={(e) => setFilters({ ...filters, paymentState: e.target.value })}
                    sx={{ width: 140 }}
                    SelectProps={{ native: true }}
                  >
                    <option value="">All</option>
                    <option value="not_paid">Not Paid</option>
                    <option value="in_payment">In Payment</option>
                    <option value="paid">Paid</option>
                    <option value="partial">Partial</option>
                    <option value="reversed">Reversed</option>
                  </TextField>
                  <TextField
                    type="date"
                    size="small"
                    label="From"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    type="date"
                    size="small"
                    label="To"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                  />
                </Stack>
              )}
            </Stack>
            <Stack spacing={2}>
              {(() => {
                const list = section === 'payouts' ? billingState.payments.data : billingState.invoices.data;
                const isLoading = section === 'payouts' ? billingState.payments.loading : billingState.invoices.loading;
                
                if (list.length === 0 && !isLoading) {
                  return (
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No records are available for this finance route yet.
                    </Typography>
                  );
                }

                if (isLoading) {
                  return <LinearProgress />;
                }

                return list.map((item: any) => (
                  <Box
                    key={item._id || item.id}
                    onClick={() => router.push(paths.dashboard.invoiceDetails(item.id))}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'background.neutral',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'background.neutral', opacity: 0.8 },
                    }}
                  >
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="subtitle2">
                          {item.no || item.id}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {item.customerName || item.metadata?.customerName || 'Unknown Customer'}
                        </Typography>
                      </Box>
                      <Stack alignItems="flex-end">
                        <Typography variant="subtitle2">
                          {fCurrency(item.totalDue || item.amountTotal || item.amount || 0)}
                        </Typography>
                        <Label
                          variant="soft"
                          color={
                            (item.status === 'posted' ? 'success' :
                             item.status === 'draft' ? 'info' : 'default') as any
                          }
                          sx={{ mt: 0.5 }}
                        >
                          {item.status || 'Draft'}
                        </Label>
                      </Stack>
                    </Stack>
                  </Box>
                ));
              })()}
            </Stack>
          </Card>
        </Grid>

        {section !== 'payouts' && (
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Summary
              </Typography>
              {financeState.stats.loading ? (
                <LinearProgress />
              ) : (
                <Stack spacing={1.5}>
                  <Typography variant="body2">Reported metrics are sourced from the current finance APIs.</Typography>
                  <Divider />
                  <Stack spacing={2} sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>Total Revenue</Typography>
                      <Typography variant="subtitle2">{fCurrency(financeState.stats.data?.totalRevenue || 0)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>Paid</Typography>
                      <Typography variant="subtitle2" sx={{ color: 'success.main' }}>{fCurrency(financeState.stats.data?.paid || 0)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>Outstanding</Typography>
                      <Typography variant="subtitle2" sx={{ color: 'warning.main' }}>{fCurrency(financeState.stats.data?.outstanding || 0)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>Overdue</Typography>
                      <Typography variant="subtitle2" sx={{ color: 'error.main', fontWeight: 'bold' }}>{fCurrency(financeState.stats.data?.overdue || 0)}</Typography>
                    </Box>
                    <Divider sx={{ borderStyle: 'dashed' }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>Invoice Count</Typography>
                      <Typography variant="subtitle2">{financeState.stats.data?.invoiceCount || 0}</Typography>
                    </Box>
                  </Stack>
                </Stack>
              )}
            </Card>
          </Grid>
        )}
      </Grid>
    </FeatureRouteShell>
  );
}
