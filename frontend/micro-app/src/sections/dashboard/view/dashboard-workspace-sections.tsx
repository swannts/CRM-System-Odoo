'use client';

import useSWR from 'swr';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { Iconify } from 'src/components/iconify';
import { Chart, useChart } from 'src/components/chart';
import { dashboardService, DashboardRange } from 'src/services/dashboard-service';

// ----------------------------------------------------------------------

type DashboardAnalyticsTabProps = {
  range: DashboardRange;
};

export function DashboardAnalyticsTab({ range }: DashboardAnalyticsTabProps) {
  const theme = useTheme();
  const { data: overview } = useSWR(['dashboard-overview', range], () => dashboardService.getOverview(range));
  const { data: revenueGraph = [] } = useSWR(['dashboard-graph-revenue', range], () => dashboardService.getGraph('revenue', range));
  const { data: activity = [] } = useSWR(['dashboard-activity'], () => dashboardService.getActivity(3));
  const { data: attention = [] } = useSWR(['dashboard-attention'], () => dashboardService.getAttention());

  const revenueSeries = Array.isArray(revenueGraph)
    ? revenueGraph.map((item: any) => Number(item.value ?? 0))
    : [];
  const revenueCategories = Array.isArray(revenueGraph)
    ? revenueGraph.map((item: any) => String(item.month ?? item.stage ?? ''))
    : [];

  return (
    <Grid container spacing={3}>
      {/* Financial Summary */}
      <Grid item xs={12} md={4}>
        <AnalyticsWidgetSummary
          title="Revenue"
          total={`$${Number(overview?.revenue ?? 0).toFixed(2)}`}
          percent={Number(overview?.conversionRate ?? 0).toFixed(1)}
          chart={{
            series: revenueSeries.length ? revenueSeries : [0],
          }}
        />
      </Grid>

      <Grid item xs={12} md={8}>
        <Card sx={{ p: 3, height: '100%' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Box>
              <Typography variant="h6">Business Performance</Typography>
              <Typography variant="caption" color="text.secondary">Revenue trend and customer growth</Typography>
            </Box>
            <Button variant="soft" size="small" endIcon={<Iconify icon="eva:chevron-down-fill" />}>This Month</Button>
          </Stack>
          <Chart
            type="bar"
            series={[
              { name: 'Revenue', data: revenueSeries.length ? revenueSeries : [0] },
            ]}
            options={useChart({
              colors: [theme.palette.primary.main, theme.palette.info.main],
              xaxis: { categories: revenueCategories.length ? revenueCategories : ['No data'] },
            })}
            height={300}
          />
        </Card>
      </Grid>

      {/* Goal Tracking */}
      <Grid item xs={12} md={4}>
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Organization Goals</Typography>
          <Stack spacing={3}>
            {[
              { label: 'Lead Conversion', value: Math.min(100, Number(overview?.conversionRate ?? 0)), color: 'primary' },
              { label: 'Activity Completion', value: overview?.totalActivities ? Math.min(100, ((Number(overview?.completedActivities ?? 0) / Number(overview?.totalActivities ?? 1)) * 100)) : 0, color: 'success' },
              { label: 'Customer Growth', value: Math.min(100, Math.max(0, Number(overview?.customerNetGrowth ?? 0))), color: 'warning' },
            ].map((goal) => (
              <Box key={goal.label}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2">{goal.label}</Typography>
                  <Typography variant="body2">{goal.value}%</Typography>
                </Stack>
                <LinearProgress 
                  variant="determinate" 
                  value={goal.value} 
                  color={goal.color as any} 
                  sx={{ height: 8, borderRadius: 1 }}
                />
              </Box>
            ))}
          </Stack>
        </Card>
      </Grid>

      {/* Notifications & Events */}
      <Grid item xs={12} md={4}>
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Recent Alerts</Typography>
          <Stack spacing={2.5}>
            {[
              ...attention.map((item: any) => ({
                title: `${item.label}: ${item.value}`,
                time: 'Needs attention',
                icon: item.severity === 'high' ? 'solar:danger-bold' : 'solar:info-circle-bold',
                color: item.severity === 'high' ? 'error' : 'info',
              })),
            ].map((alert: any) => (
              <Stack key={alert.title} direction="row" spacing={2} alignItems="center">
                <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: `${alert.color}.lighter`, color: `${alert.color}.main`, display: 'flex' }}>
                   <Iconify icon={alert.icon} />
                </Box>
                <Box>
                  <Typography variant="subtitle2">{alert.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{alert.time}</Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Card>
      </Grid>

      {/* Task List */}
      <Grid item xs={12} md={4}>
        <Card sx={{ p: 0 }}>
          <Box sx={{ p: 2.5 }}>
            <Typography variant="h6">My Tasks</Typography>
          </Box>
          <Divider />
          <Stack>
            {[
              ...activity.map((item: any) => ({
                task: item.title,
                priority: item.state === 'done' ? 'Completed' : 'Planned',
              })),
            ].map((item: any) => (
              <Box key={item.task} sx={{ p: 2, display: 'flex', alignItems: 'center', borderBottom: (theme) => `1px solid ${theme.palette.divider}`, '&:last-child': { borderBottom: 0 } }}>
                <Iconify icon="solar:check-square-bold" sx={{ mr: 2, color: 'text.disabled' }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle2">{item.task}</Typography>
                  <Typography variant="caption" color="text.secondary">Priority: {item.priority}</Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        </Card>
      </Grid>
    </Grid>
  );
}

export function DashboardEcommerceTab() {
  const theme = useTheme();

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>Revenue by Product Category</Typography>
          <Chart
            type="area"
            series={[
              { name: 'Memberships', data: [31, 40, 28, 51, 42, 109, 100] },
              { name: 'Inventory', data: [11, 32, 45, 32, 34, 52, 41] },
            ]}
            options={useChart({
              colors: [theme.palette.primary.main, theme.palette.warning.main],
              xaxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
            })}
            height={300}
          />
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>Sales Overview</Typography>
          <Stack spacing={3}>
            <Box>
              <Typography variant="caption" color="text.secondary">Total Orders</Typography>
              <Typography variant="h4">1,240</Typography>
              <LinearProgress variant="determinate" value={72} sx={{ mt: 1, height: 6, borderRadius: 1 }} />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Conversion Rate</Typography>
              <Typography variant="h4">3.2%</Typography>
              <LinearProgress variant="determinate" value={45} color="info" sx={{ mt: 1, height: 6, borderRadius: 1 }} />
            </Box>
          </Stack>
        </Card>
      </Grid>
    </Grid>
  );
}

// --- Internal Components ---

function AnalyticsWidgetSummary({ title, total, percent, chart }: { title: string; total: string; percent: string; chart: { series: number[] } }) {
  const theme = useTheme();

  const isLoss = Number(percent) < 0;

  return (
    <Card sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="subtitle2">{title}</Typography>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1, mb: 1 }}>
          <Typography variant="h3">{total}</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Iconify
            icon={isLoss ? 'solar:double-alt-arrow-down-bold-duotone' : 'solar:double-alt-arrow-up-bold-duotone'}
            sx={{ color: isLoss ? 'error.main' : 'success.main' }}
          />
          <Typography variant="subtitle2" sx={{ color: isLoss ? 'error.main' : 'success.main' }}>
            {!isLoss && '+'}
            {percent}%
          </Typography>
          <Typography variant="caption" color="text.secondary">than last month</Typography>
        </Stack>
      </Box>
      <Chart
        type="line"
        series={chart.series}
        options={useChart({
          colors: [theme.palette.primary.main],
          chart: { sparkline: { enabled: true } },
          tooltip: { x: { show: false }, y: { formatter: (value: number) => value, title: { formatter: () => '' } }, marker: { show: false } },
        })}
        width={120}
        height={80}
      />
    </Card>
  );
}

import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

type DashboardSettingsDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function DashboardSettingsDialog({ open, onClose }: DashboardSettingsDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Customize Dashboard</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
          Configure which widgets are visible and their display order.
        </Typography>
        <Stack spacing={2}>
          {['Revenue Widget', 'Goal Tracker', 'Alerts Feed', 'My Tasks'].map((widget) => (
            <Card key={widget} sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2">{widget}</Typography>
              <Button size="small" variant="outlined">Enabled</Button>
            </Card>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onClose} variant="contained">Save Changes</Button>
      </DialogActions>
    </Dialog>
  );
}
