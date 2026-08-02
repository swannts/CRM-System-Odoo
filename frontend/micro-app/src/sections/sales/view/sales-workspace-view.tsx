'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import {
  fetchSalesSummary,
  fetchSalesOrders,
  fetchSalesLeads,
  fetchSalesOpportunities,
  fetchSalesActivities,
  fetchSalesAnalytics,
  fetchSalesStages,
  createOpportunityThunk,
  updateOpportunityThunk,
  updateOpportunityStageThunk,
  createSalesActivityThunk,
  completeSalesActivityThunk,
  deleteSalesActivityThunk,
  deleteSalesOpportunityThunk,
  linkOrderToOpportunityThunk,
  previewSyncThunk,
  runSyncThunk,
  selectSales,
  clearSyncResults,
} from 'src/store/slices/sales-slice';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { toast } from 'src/components/snackbar';

import { FeatureRouteShell } from 'src/sections/parity/feature-route-shell';

import { SalesHeader } from '../components/sales-header';
import { SalesKpiRow } from '../components/sales-kpi-row';
import { SalesSyncDialog } from '../components/sales-sync-dialog';
import { SalesErrorState } from '../components/sales-error-state';
import { SalesLeadsPanel } from '../components/sales-leads-panel';
import { SalesTabs, type SalesTab } from '../components/sales-tabs';
import { SalesOrdersTable } from '../components/sales-orders-table';
import { SalesPipelineKanban } from '../components/sales-pipeline-kanban';
import { SalesAnalyticsPanel } from '../components/sales-analytics-panel';
import { SalesActivitiesPanel } from '../components/sales-activities-panel';
import { SalesOpportunityDrawer } from '../components/sales-opportunity-drawer';
import { SalesOpportunityDialog, type OpportunityFormValues } from '../components/sales-opportunity-dialog';
import { SalesDashboardPanel } from '../components/sales-dashboard-panel';

import type { SalesFilters, SalesActivity, SalesOpportunity } from '../types';

export function SalesWorkspaceView() {
  const dispatch = useAppDispatch();
  const salesState = useAppSelector(selectSales);

  const [tab, setTab] = useState<SalesTab>('dashboard');
  const [search, setSearch] = useState('');
  const [syncOpen, setSyncOpen] = useState(false);
  const [opportunityOpen, setOpportunityOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<SalesOpportunity | null>(null);
  const [activityOpen, setActivityOpen] = useState(false);
  const [activityTitle, setActivityTitle] = useState('');
  const [activityType, setActivityType] = useState<SalesActivity['type']>('todo');
  const [activityDueDate, setActivityDueDate] = useState('');

  const filters: SalesFilters = useMemo(() => ({ search: search || undefined }), [search]);

  const summary = salesState.summary;
  const opportunities = salesState.opportunities;
  const leads = salesState.leads;
  const orders = salesState.orders;
  const activities = salesState.activities;
  const analytics = salesState.analytics;
  const stages = salesState.stages;
  const sync = salesState.sync;

  const [isMutationPending, setIsMutationPending] = useState(false);

  const refreshAll = useCallback(() => {
    dispatch(fetchSalesSummary(filters));
    dispatch(fetchSalesOpportunities(filters));
    dispatch(fetchSalesLeads(filters));
    dispatch(fetchSalesOrders(filters));
    dispatch(fetchSalesActivities(filters));
    dispatch(fetchSalesAnalytics(filters));
    dispatch(fetchSalesStages());
  }, [dispatch, filters]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const handleOpportunitySubmit = async (values: OpportunityFormValues) => {
    try {
      setIsMutationPending(true);
      if (selectedOpportunity?.id) {
        await dispatch(updateOpportunityThunk({ id: selectedOpportunity.id, payload: values })).unwrap();
        toast.success('Opportunity updated');
      } else {
        await dispatch(createOpportunityThunk(values)).unwrap();
        toast.success('Opportunity created');
      }
      setOpportunityOpen(false);
      refreshAll();
    } catch (error: any) {
      toast.error(error || 'Unable to save opportunity');
    } finally {
      setIsMutationPending(false);
    }
  };

  const handleMoveStage = async (id: string, stage: SalesOpportunity['stage'], stageId?: number) => {
    try {
      setIsMutationPending(true);
      await dispatch(updateOpportunityStageThunk({ id, stage, stageId })).unwrap();
      toast.success('Stage updated');
      if (selectedOpportunity?.id === id) {
        setSelectedOpportunity({ ...selectedOpportunity, stage, stageId });
      }
      refreshAll();
    } catch (error: any) {
      toast.error(error || 'Stage update unavailable');
    } finally {
      setIsMutationPending(false);
    }
  };

  const failedSections = [summary, opportunities, leads, orders, activities, analytics].filter((s) => !!s.error).length;

  return (
    <FeatureRouteShell title="Sales" description="Track pipeline, leads, orders, and revenue in one place.">
      <Stack spacing={3}>
        <SalesHeader
          search={search}
          onSearch={setSearch}
          onRefresh={refreshAll}
          onOpenSync={() => setSyncOpen(true)}
          onOpenCreate={() => {
            setSelectedOpportunity(null);
            setOpportunityOpen(true);
          }}
        />

        {failedSections >= 2 ? <Alert severity="warning">Some sales sections are temporarily unavailable. Available sections still work.</Alert> : null}

        {summary.error ? (
          <SalesErrorState
            title="Summary unavailable"
            message={summary.error}
            onRetry={() => dispatch(fetchSalesSummary(filters))}
          />
        ) : (
          <SalesKpiRow summary={summary.data} loading={summary.loading} />
        )}

        <SalesTabs value={tab} onChange={setTab} />

        <Box>
          {tab === 'dashboard' && (
            <SalesDashboardPanel
              summary={summary.data}
              pipelineByStage={analytics.data?.pipelineByStage}
              recentActivities={activities.data}
            />
          )}

          {tab === 'pipeline' ? (
            opportunities.error ? (
              <SalesErrorState
                title="Pipeline unavailable"
                message={opportunities.error}
                onRetry={() => dispatch(fetchSalesOpportunities(filters))}
              />
            ) : (
              <SalesPipelineKanban
                opportunities={opportunities.data ?? []}
                stages={stages.data}
                moving={isMutationPending}
                onOpen={(item) => setSelectedOpportunity(item)}
                onMove={handleMoveStage}
              />
            )
          ) : null}

          {tab === 'leads' ? (
            leads.error ? (
              <SalesErrorState
                title="Leads unavailable"
                message={leads.error}
                onRetry={() => dispatch(fetchSalesLeads(filters))}
              />
            ) : (
              <SalesLeadsPanel leads={leads.data ?? []} search={search} />
            )
          ) : null}

          {tab === 'orders' ? (
            orders.error ? (
              <SalesErrorState
                title="Orders unavailable"
                message={orders.error}
                onRetry={() => dispatch(fetchSalesOrders(filters))}
              />
            ) : (
              <SalesOrdersTable
                rows={orders.data ?? []}
                opportunities={opportunities.data ?? []}
                onLink={async (orderId, opportunityId) => {
                  try {
                    setIsMutationPending(true);
                    await dispatch(linkOrderToOpportunityThunk({ orderId, opportunityId })).unwrap();
                    toast.success('Order linked');
                    refreshAll();
                  } catch (error: any) {
                    toast.error(error || 'Link unavailable');
                  } finally {
                    setIsMutationPending(false);
                  }
                }}
                linking={isMutationPending}
              />
            )
          ) : null}

          {tab === 'activities' ? (
            activities.error ? (
              <SalesErrorState
                title="Activities unavailable"
                message={activities.error}
                onRetry={() => dispatch(fetchSalesActivities(filters))}
              />
            ) : (
              <SalesActivitiesPanel
                rows={activities.data ?? []}
                onComplete={async (id) => {
                  try {
                    setIsMutationPending(true);
                    await dispatch(completeSalesActivityThunk(id)).unwrap();
                    toast.success('Activity completed');
                    refreshAll();
                  } catch (error: any) {
                    toast.error(error || 'Complete unavailable');
                  } finally {
                    setIsMutationPending(false);
                  }
                }}
                onDelete={async (id) => {
                  try {
                    setIsMutationPending(true);
                    await dispatch(deleteSalesActivityThunk(id)).unwrap();
                    toast.success('Activity deleted');
                    refreshAll();
                  } catch (error: any) {
                    toast.error(error || 'Delete unavailable');
                  } finally {
                    setIsMutationPending(false);
                  }
                }}
                completing={isMutationPending}
                deleting={isMutationPending}
              />
            )
          ) : null}

          {tab === 'analytics' ? (
            analytics.error && summary.error && leads.error && orders.error ? (
              <SalesErrorState title="Analytics unavailable" description="Analytics data is currently unavailable." />
            ) : (
              <SalesAnalyticsPanel summary={summary.data} leads={leads.data ?? []} orders={orders.data ?? []} />
            )
          ) : null}
        </Box>
      </Stack>

      <SalesOpportunityDrawer
        open={Boolean(selectedOpportunity)}
        item={selectedOpportunity}
        orders={orders.data ?? []}
        stageLoading={isMutationPending}
        onClose={() => setSelectedOpportunity(null)}
        onEdit={() => setOpportunityOpen(true)}
        onAddActivity={() => setActivityOpen(true)}
        onLinkOrder={async (orderId, opportunityId) => {
          try {
            setIsMutationPending(true);
            await dispatch(linkOrderToOpportunityThunk({ orderId, opportunityId })).unwrap();
            toast.success('Order linked');
            refreshAll();
          } catch (error: any) {
            toast.error(error || 'Link unavailable');
          } finally {
            setIsMutationPending(false);
          }
        }}
        onMoveStage={handleMoveStage}
        onDelete={async (id) => {
          try {
            setIsMutationPending(true);
            await dispatch(deleteSalesOpportunityThunk(id)).unwrap();
            toast.success('Opportunity archived');
            setSelectedOpportunity(null);
            refreshAll();
          } catch (error: any) {
            toast.error(error || 'Delete unavailable');
          } finally {
            setIsMutationPending(false);
          }
        }}
        stages={stages.data}
      />

      <SalesOpportunityDialog
        open={opportunityOpen}
        initial={selectedOpportunity}
        loading={isMutationPending}
        onClose={() => setOpportunityOpen(false)}
        onSubmit={handleOpportunitySubmit}
      />

      <Dialog open={activityOpen} onClose={() => setActivityOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add activity</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField label="Title" value={activityTitle} onChange={(e) => setActivityTitle(e.target.value)} />
            <TextField select label="Type" value={activityType} onChange={(e) => setActivityType(e.target.value as SalesActivity['type'])}>
              <MenuItem value="call">Call</MenuItem>
              <MenuItem value="email">Email</MenuItem>
              <MenuItem value="meeting">Meeting</MenuItem>
              <MenuItem value="todo">To-do</MenuItem>
              <MenuItem value="note">Note</MenuItem>
            </TextField>
            <TextField type="date" label="Due date" InputLabelProps={{ shrink: true }} value={activityDueDate} onChange={(e) => setActivityDueDate(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActivityOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!selectedOpportunity?.id || !activityTitle || isMutationPending}
            onClick={async () => {
              if (!selectedOpportunity?.id) return;
              try {
                setIsMutationPending(true);
                await dispatch(createSalesActivityThunk({
                  opportunityId: selectedOpportunity.id,
                  payload: {
                    type: activityType,
                    title: activityTitle,
                    dueDate: activityDueDate || undefined,
                  },
                })).unwrap();
                toast.success('Activity created');
                setActivityOpen(false);
                setActivityTitle('');
                setActivityDueDate('');
                refreshAll();
              } catch (error: any) {
                toast.error(error || 'Create activity unavailable');
              } finally {
                setIsMutationPending(false);
              }
            }}
          >
            Add activity
          </Button>
        </DialogActions>
      </Dialog>

      <SalesSyncDialog
        open={syncOpen}
        preview={sync.preview}
        result={sync.result}
        previewLoading={sync.previewLoading}
        runLoading={sync.runLoading}
        onClose={() => {
          setSyncOpen(false);
          dispatch(clearSyncResults());
        }}
        onPreview={() => dispatch(previewSyncThunk())}
        onRun={async () => {
          try {
            await dispatch(runSyncThunk()).unwrap();
            toast.success('Sync completed');
            refreshAll();
          } catch (error: any) {
            toast.error(error || 'Sync unavailable');
          }
        }}
      />
    </FeatureRouteShell>
  );
}
