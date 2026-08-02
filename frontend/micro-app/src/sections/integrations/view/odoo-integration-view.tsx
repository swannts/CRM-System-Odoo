'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import {
  fetchContacts,
  fetchCompanies,
  fetchLeads,
  fetchOpportunities,
  fetchInvoices,
  fetchSalesOrders,
  fetchProducts,
  fetchInventory,
  fetchOdooConnection,
} from 'src/store/slices/odoo-slice';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';
import {
  useConnectOdooMutation,
  useDisconnectOdooMutation,
  useSyncMagentoCustomersToOdooMutation,
  useSyncMagentoOrdersToOdooMutation,
} from 'src/hooks/use-odoo';
import { toast } from 'src/components/snackbar';
import type { OdooSyncResult } from 'src/types/odoo';

type PreviewTab =
  | 'contacts'
  | 'companies'
  | 'leads'
  | 'opportunities'
  | 'invoices'
  | 'sales-orders'
  | 'products'
  | 'inventory';

type SyncAction = 'dry-customers' | 'dry-orders' | 'push-customers' | 'push-orders';

function summarizeItems(items: unknown[] | undefined, count = 5): string[] {
  if (!Array.isArray(items)) return [];
  return items.slice(0, count).map((item) => JSON.stringify(item));
}

export function OdooIntegrationView() {
  const dispatch = useAppDispatch();
  const [previewTab, setPreviewTab] = useState<PreviewTab>('contacts');
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [pendingSyncAction, setPendingSyncAction] = useState<SyncAction | null>(null);
  const [latestSyncResult, setLatestSyncResult] = useState<OdooSyncResult | null>(null);

  const [connectForm, setConnectForm] = useState({
    baseUrl: '',
    db: '',
    username: '',
    password: '',
    apiKey: '',
  });

  const odooState = useAppSelector((state) => state.odoo);
  const { connection, contacts, companies, leads, opportunities, invoices, salesOrders, products, inventory } = odooState;

  useEffect(() => {
    dispatch(fetchOdooConnection());
    dispatch(fetchContacts({ page: 1, pageSize: 20 }));
    dispatch(fetchCompanies({ page: 1, pageSize: 20 }));
    dispatch(fetchLeads({ page: 1, pageSize: 20 }));
    dispatch(fetchOpportunities({ page: 1, pageSize: 20 }));
    dispatch(fetchInvoices({ page: 1, pageSize: 20 }));
    dispatch(fetchSalesOrders({ page: 1, pageSize: 20 }));
    dispatch(fetchProducts({ page: 1, pageSize: 20 }));
    dispatch(fetchInventory({ page: 1, pageSize: 20 }));
  }, [dispatch]);

  const connectMutation = useConnectOdooMutation();
  const disconnectMutation = useDisconnectOdooMutation();
  const syncCustomersMutation = useSyncMagentoCustomersToOdooMutation();
  const syncOrdersMutation = useSyncMagentoOrdersToOdooMutation();

  const isConnected = Boolean(connection.data?.connected);

  const previewItems = useMemo(() => {
    switch (previewTab) {
      case 'contacts':
        return contacts.data;
      case 'companies':
        return companies.data;
      case 'leads':
        return leads.data;
      case 'opportunities':
        return opportunities.data;
      case 'invoices':
        return invoices.data;
      case 'sales-orders':
        return salesOrders.data;
      case 'products':
        return products.data;
      case 'inventory':
        return inventory.data;
      default:
        return [];
    }
  }, [
    previewTab,
    contacts.data,
    companies.data,
    leads.data,
    opportunities.data,
    invoices.data,
    salesOrders.data,
    products.data,
    inventory.data,
  ]);

  const handleConnect = async () => {
    try {
      const payload = {
        baseUrl: connectForm.baseUrl || undefined,
        db: connectForm.db || undefined,
        username: connectForm.username || undefined,
        password: connectForm.password || undefined,
        apiKey: connectForm.apiKey || undefined,
      };

      await connectMutation.mutateAsync(payload);
      setConnectForm((prev) => ({ ...prev, password: '', apiKey: '' }));
      toast.success('Odoo connection updated.');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to connect Odoo.');
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectMutation.mutateAsync();
      setLatestSyncResult(null);
      toast.success('Odoo disconnected.');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to disconnect Odoo.');
    }
  };

  const runSyncAction = async (action: SyncAction) => {
    try {
      const output =
        action === 'dry-customers'
          ? await syncCustomersMutation.mutateAsync({ dryRun: true })
          : action === 'dry-orders'
            ? await syncOrdersMutation.mutateAsync({ dryRun: true })
            : action === 'push-customers'
              ? await syncCustomersMutation.mutateAsync({ dryRun: false, push: true })
              : await syncOrdersMutation.mutateAsync({ dryRun: false, push: true });

      setLatestSyncResult(output);
      toast.success(output.message || 'Sync completed.');
    } catch (error: any) {
      toast.error(error?.message || 'Sync failed.');
    }
  };

  const confirmPushAction = async () => {
    if (!pendingSyncAction) return;
    setSyncDialogOpen(false);
    await runSyncAction(pendingSyncAction);
    setPendingSyncAction(null);
  };

  return (
    <DashboardContent maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">Odoo Integration</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
          Canonical API base: /api/odoo
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Connection</Typography>
            <Stack spacing={2}>
              <TextField label="Odoo Base URL" value={connectForm.baseUrl} onChange={(e) => setConnectForm((p) => ({ ...p, baseUrl: e.target.value }))} placeholder="http://odoo:8069" fullWidth />
              <TextField label="Database" value={connectForm.db} onChange={(e) => setConnectForm((p) => ({ ...p, db: e.target.value }))} fullWidth />
              <TextField label="Username" value={connectForm.username} onChange={(e) => setConnectForm((p) => ({ ...p, username: e.target.value }))} fullWidth />
              <TextField label="Password" type="password" value={connectForm.password} onChange={(e) => setConnectForm((p) => ({ ...p, password: e.target.value }))} fullWidth />
              <TextField label="API Key" type="password" value={connectForm.apiKey} onChange={(e) => setConnectForm((p) => ({ ...p, apiKey: e.target.value }))} fullWidth />

              <Stack direction="row" spacing={1.5}>
                <Button variant="contained" onClick={handleConnect} disabled={connectMutation.isPending}>
                  {connectMutation.isPending ? 'Connecting...' : 'Connect'}
                </Button>
                <Button variant="outlined" color="warning" onClick={handleDisconnect} disabled={disconnectMutation.isPending || !isConnected}>
                  {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect'}
                </Button>
              </Stack>
            </Stack>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Connection status</Typography>
            {connection.error ? (
              <Alert severity="error">Unable to load Odoo connection status.</Alert>
            ) : (
              <Stack spacing={1}>
                <Typography variant="body2">Connected: {isConnected ? 'Yes' : 'No'}</Typography>
                <Typography variant="body2">Base URL: {connection.data?.baseUrl || '-'}</Typography>
                <Typography variant="body2">Database: {connection.data?.db || '-'}</Typography>
                <Typography variant="body2">Username: {connection.data?.username || '-'}</Typography>
                <Typography variant="body2">Credential source: {connection.data?.credentialSource || '-'}</Typography>
              </Stack>
            )}
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Odoo preview</Typography>
            <Tabs value={previewTab} onChange={(_e, value) => setPreviewTab(value)} variant="scrollable" scrollButtons="auto">
              <Tab value="contacts" label="Contacts" />
              <Tab value="companies" label="Companies" />
              <Tab value="leads" label="Leads" />
              <Tab value="opportunities" label="Opportunities" />
              <Tab value="invoices" label="Invoices" />
              <Tab value="sales-orders" label="Sales Orders" />
              <Tab value="products" label="Products" />
              <Tab value="inventory" label="Inventory" />
            </Tabs>

            <Box sx={{ mt: 2 }}>
              {summarizeItems(previewItems as unknown[]).length === 0 ? (
                <Typography variant="body2" color="text.secondary">No preview items.</Typography>
              ) : (
                <Stack spacing={1}>
                  {summarizeItems(previewItems as unknown[]).map((row, idx) => (
                    <Typography key={`${previewTab}-${idx}`} component="pre" variant="caption" sx={{ whiteSpace: 'pre-wrap', m: 0 }}>
                      {row}
                    </Typography>
                  ))}
                </Stack>
              )}
            </Box>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Magento -&gt; Odoo sync</Typography>
            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              <Button variant="outlined" onClick={() => runSyncAction('dry-customers')} disabled={syncCustomersMutation.isPending || syncOrdersMutation.isPending}>
                Dry-run Magento customers -&gt; Odoo
              </Button>
              <Button variant="outlined" onClick={() => runSyncAction('dry-orders')} disabled={syncCustomersMutation.isPending || syncOrdersMutation.isPending}>
                Dry-run Magento orders -&gt; Odoo
              </Button>
              <Button variant="contained" color="warning" onClick={() => { setPendingSyncAction('push-customers'); setSyncDialogOpen(true); }} disabled={syncCustomersMutation.isPending || syncOrdersMutation.isPending}>
                Push Magento customers -&gt; Odoo
              </Button>
              <Button variant="contained" color="warning" onClick={() => { setPendingSyncAction('push-orders'); setSyncDialogOpen(true); }} disabled={syncCustomersMutation.isPending || syncOrdersMutation.isPending}>
                Push Magento orders -&gt; Odoo
              </Button>
            </Stack>

            {latestSyncResult ? (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">{latestSyncResult.message || 'Sync completed.'}</Typography>
                <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap', m: 0 }}>
                  {JSON.stringify(latestSyncResult, null, 2)}
                </Typography>
              </Box>
            ) : null}
          </Card>
        </Grid>
      </Grid>

      <Dialog open={syncDialogOpen} onClose={() => setSyncDialogOpen(false)}>
        <DialogTitle>Confirm push sync</DialogTitle>
        <DialogContent>
          <Typography>This will push Magento data into Odoo. Continue?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSyncDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={confirmPushAction}>Continue</Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
