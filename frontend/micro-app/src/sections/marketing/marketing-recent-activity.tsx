import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { fetchActivity, selectMarketing } from 'src/store/slices/marketing-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';
import { fToNow } from 'src/utils/format-time';

// ----------------------------------------------------------------------

export function MarketingRecentActivity() {
  const dispatch = useAppDispatch();
  const { activity } = useAppSelector(selectMarketing);

  const activities = activity.data;
  const isLoading = activity.loading;

  useEffect(() => {
    dispatch(fetchActivity());
  }, [dispatch]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'campaign': return 'solar:rocket-bold';
      case 'mailing': return 'solar:letter-bold';
      case 'segment': return 'solar:users-group-rounded-bold';
      default: return 'solar:bell-bold';
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'campaign': return 'primary';
      case 'mailing': return 'info';
      case 'segment': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <Card sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" sx={{ mb: 3 }}>Recent Activity</Typography>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <Stack spacing={3}>
          {activities.length === 0 && (
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 3 }}>
              No recent activity.
            </Typography>
          )}
          {activities.map((item: any) => (
            <Stack key={item.id} direction="row" spacing={2}>
              <Avatar sx={{ bgcolor: (theme: any) => theme.palette[getColor(item.type)].lighter, color: (theme: any) => theme.palette[getColor(item.type)].main }}>
                <Iconify icon={getIcon(item.type)} width={20} />
              </Avatar>
              <Box>
                <Typography variant="subtitle2">
                  {item.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)} {item.action} • {fToNow(item.date)}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>
      )}
    </Card>
  );
}
