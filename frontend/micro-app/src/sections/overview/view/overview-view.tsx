'use client';

import { useMemo, useState, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';

import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import {
  fetchDashboardOverview,
  fetchDashboardGraph,
  fetchDashboardActivity,
  fetchDashboardAttention,
} from 'src/store/slices/dashboard-slice';

import { OverviewHeader } from '../components/overview-header';
import { OverviewKpiGrid } from '../components/overview-kpi-grid';
import { OverviewGraphPanel } from '../components/overview-graph-panel';
import { OverviewErrorState } from '../components/overview-error-state';
import { OverviewActivityFeed } from '../components/overview-activity-feed';
import { OverviewAttentionPanel } from '../components/overview-attention-panel';

// ----------------------------------------------------------------------

type ViewMode = 'graphs' | 'activity';
type GraphMode = 'revenue' | 'contacts' | 'orders' | 'pipeline' | 'bookings';
type RangeMode = '7d' | '30d' | '90d' | '180d';

export function OverviewView() {
  const dispatch = useAppDispatch();
  const [viewMode, setViewMode] = useState<ViewMode>('graphs');
  const [graphMode, setGraphMode] = useState<GraphMode>('revenue');
  const [rangeMode, setRangeMode] = useState<RangeMode>('30d');

  const { overview, graph, activity, attention: attentionState } = useAppSelector((state) => state.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardOverview(rangeMode));
  }, [dispatch, rangeMode]);

  useEffect(() => {
    dispatch(fetchDashboardGraph({ metric: graphMode, range: rangeMode }));
  }, [dispatch, graphMode, rangeMode]);

  useEffect(() => {
    dispatch(fetchDashboardActivity(12));
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchDashboardAttention());
  }, [dispatch]);

  const kpis = useMemo(() => overview.data?.kpis ?? {}, [overview.data]);
  const sourceStatus = useMemo(() => overview.data?.sourceStatus ?? {}, [overview.data]);

  const graphData = useMemo(() => {
    const categories = Array.isArray(graph.data?.categories) ? (graph.data.categories as string[]) : [];
    const series = Array.isArray(graph.data?.series)
      ? (graph.data.series as { name: string; data: number[] }[]).map((s) => ({ ...s }))
      : [];

    const formattedCategories = categories.map((cat: string) => {
      if (cat.includes('-') && cat.split('-').length === 2) {
        const [year, month] = cat.split('-').map(Number);
        return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
      }
      return cat;
    });

    return { categories: formattedCategories, series };
  }, [graph.data]);

  const activities = useMemo(() => {
    const raw = Array.isArray(activity.data) ? activity.data : [];
    return raw.map((item: any) => ({
      id: String(item?.id ?? Math.random()),
      title: String(item?.title ?? 'Activity'),
      subtitle: String(item?.subtitle ?? ''),
      timestamp: String(item?.timestamp ?? ''),
      type: String(item?.type ?? 'other'),
    }));
  }, [activity.data]);

  const attention = useMemo(() => {
    const raw = Array.isArray(attentionState.data) ? attentionState.data : [];
    return raw.map((item: any) => ({
      title: String(item?.title ?? 'Attention required'),
      count: Number(item?.count ?? 0),
      severity: (item?.severity ?? 'info') as 'info' | 'warning' | 'error' | 'success',
    }));
  }, [attentionState.data]);

  const handleRefresh = () => {
    dispatch(fetchDashboardOverview(rangeMode));
    dispatch(fetchDashboardGraph({ metric: graphMode, range: rangeMode }));
    dispatch(fetchDashboardActivity(12));
    dispatch(fetchDashboardAttention());
  };

  const isAnyLoading = overview.loading || graph.loading || activity.loading || attentionState.loading;
  const isAnyError = !!(overview.error || graph.error || activity.error || attentionState.error);

  return (
    <DashboardContent maxWidth="xl">
      <OverviewHeader
        rangeMode={rangeMode}
        onRangeChange={(v) => setRangeMode(v)}
        onRefresh={handleRefresh}
        loading={isAnyLoading}
      />

      <Stack spacing={4}>
        <OverviewKpiGrid
          kpis={kpis}
          loading={overview.loading}
          error={!!overview.error}
        />

        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Business Performance</Typography>

          <ToggleButtonGroup
            size="small"
            value={viewMode}
            exclusive
            onChange={(_, value) => value && setViewMode(value)}
            sx={{ bgcolor: 'background.neutral', p: 0.5, borderRadius: 1 }}
          >
            <ToggleButton value="graphs" sx={{ border: 'none', px: 2 }}>
              <Iconify icon="solar:chart-2-bold" width={18} sx={{ mr: 1 }} />
              Analytics
            </ToggleButton>
            <ToggleButton value="activity" sx={{ border: 'none', px: 2 }}>
              <Iconify icon="solar:history-bold" width={18} sx={{ mr: 1 }} />
              Activity
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        <Grid container spacing={3}>
          <Grid xs={12} md={viewMode === 'graphs' ? 8 : 12}>
            {viewMode === 'graphs' ? (
              <OverviewGraphPanel
                data={graphData}
                loading={graph.loading}
                error={!!graph.error}
                activeMode={graphMode}
                onModeChange={(v) => setGraphMode(v)}
              />
            ) : (
              <OverviewActivityFeed
                activities={activities}
                loading={activity.loading}
              />
            )}
          </Grid>

          {viewMode === 'graphs' && (
            <Grid xs={12} md={4}>
              <OverviewAttentionPanel
                attention={attention}
                sourceStatus={sourceStatus}
                loading={attentionState.loading || overview.loading}
              />
            </Grid>
          )}
        </Grid>

        {isAnyError && (
          <OverviewErrorState
            severity="warning"
            message="Some dashboard modules are currently unavailable. We are still showing the data we could retrieve."
          />
        )}
      </Stack>
    </DashboardContent>
  );
}
