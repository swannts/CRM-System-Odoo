'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { 
  fetchProjectById, 
  fetchProjectCards, 
  selectProjects 
} from 'src/store/slices/project-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';

import { Iconify } from 'src/components/iconify';
import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

type Props = {
  id: string;
};

export function ProjectDashboardView({ id }: Props) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const projectState = useAppSelector(selectProjects);

  const project = projectState.currentProject.data;
  const tasks = projectState.currentProject.currentBoard.cards;

  useEffect(() => {
    dispatch(fetchProjectById(id));
    dispatch(fetchProjectCards(`board-${id}`)); // Mapping virtual board ID
  }, [dispatch, id]);

  const totalTasks = tasks?.length || 0;
  const highPriority = tasks?.filter((t: any) => t.priority === '1').length || 0;
  const inProgress = tasks?.filter((t: any) => t.columnId === '2').length || 0;
  const done = tasks?.filter((t: any) => t.columnId === '3').length || 0;

  // Chart Data
  const chartOptions = useChart({
    labels: ['New', 'In Progress', 'Done'],
    legend: { position: 'bottom', horizontalAlign: 'center' },
    plotOptions: { pie: { donut: { size: '75%' } } },
    colors: [theme.palette.info.main, theme.palette.warning.main, theme.palette.success.main],
  });

  const chartSeries = [
    tasks?.filter((t: any) => t.columnId === '1').length || 0,
    inProgress,
    done,
  ];

  const burndownOptions = useChart({
    xaxis: { categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
    tooltip: { x: { show: false }, marker: { show: false } },
  });

  const burndownSeries = [
    { name: 'Remaining Tasks', data: [12, 10, 9, 7, 5, 4, 2] },
    { name: 'Ideal Burndown', data: [12, 10.3, 8.6, 6.9, 5.2, 3.5, 1.8] },
  ];

  return (
    <Box sx={{ mt: 3 }}>
      <Grid container spacing={3}>
        {/* Summary Widgets */}
        <Grid item xs={12} sm={6} md={3}>
          <SummaryWidget title="Total Tasks" total={totalTasks} icon="solar:clipboard-list-bold" color="primary" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryWidget title="High Priority" total={highPriority} icon="solar:danger-bold" color="error" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryWidget title="In Progress" total={inProgress} icon="solar:play-bold" color="warning" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryWidget title="Completed" total={done} icon="solar:check-circle-bold" color="success" />
        </Grid>

        {/* Task Distribution Chart */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 1 }}>
            <CardHeader title="Status Distribution" />
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
              <Chart type="donut" series={chartSeries} options={chartOptions} width={280} />
            </Box>
          </Card>
        </Grid>

        {/* Burndown Chart */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: 1 }}>
            <CardHeader title="Weekly Burndown (Tasks)" subheader="Progress tracking for the current sprint" />
            <Box sx={{ p: 3 }}>
               <Chart type="line" series={burndownSeries} options={burndownOptions} height={280} />
            </Box>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Recent Activity" />
            <Stack spacing={2} sx={{ p: 3 }}>
               {tasks?.slice(0, 3).map((task: any) => (
                 <Stack key={task.id} direction="row" alignItems="center" spacing={2} sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'background.neutral' }}>
                    <Avatar src="/assets/images/avatar/avatar_1.jpg" sx={{ width: 36, height: 36 }} />
                    <Box sx={{ flexGrow: 1 }}>
                       <Typography variant="subtitle2">Admin updated <b>{task.name || task.title}</b></Typography>
                       <Typography variant="caption" sx={{ color: 'text.secondary' }}>Moved to {task.columnId === '3' ? 'Done' : 'In Progress'}</Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>2 hours ago</Typography>
                 </Stack>
               ))}
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

// ----------------------------------------------------------------------

function SummaryWidget({ title, total, icon, color }: any) {
  return (
    <Card sx={{ p: 3, display: 'flex', alignItems: 'center' }}>
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1 }}>{title}</Typography>
        <Typography variant="h3">{total}</Typography>
      </Box>
      <Iconify icon={icon} width={48} sx={{ color: `${color}.main`, opacity: 0.24 }} />
    </Card>
  );
}
