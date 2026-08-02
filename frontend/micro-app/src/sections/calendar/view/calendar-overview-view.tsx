'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { 
  fetchCalendarEventsThunk, 
  fetchBookingTypesThunk, 
  selectCalendar 
} from 'src/store/slices/calendar-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import AvatarGroup from '@mui/material/AvatarGroup';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function CalendarOverviewView() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { events, bookingTypes } = useAppSelector(selectCalendar);

  useEffect(() => {
    dispatch(fetchCalendarEventsThunk());
    dispatch(fetchBookingTypesThunk());
  }, [dispatch]);

  const eventsData = events.data || [];
  const bookingTypesData = bookingTypes.data || [];
  const isLoading = events.loading || bookingTypes.loading;

  if (isLoading && !eventsData.length && !bookingTypesData.length) {
    return (
      <Box sx={{ p: 5, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  const schedulingKPIs = [
    { label: 'Upcoming Events', value: eventsData.length || 0, icon: 'solar:calendar-bold-duotone', color: 'primary' },
    { label: 'Active Bookings', value: '24 Today', icon: 'solar:clock-circle-bold-duotone', color: 'info' },
    { label: 'Total Capacity', value: '85%', icon: 'solar:user-speak-bold-duotone', color: 'success' },
    { label: 'Waitlist', value: '12', icon: 'solar:users-group-rounded-bold-duotone', color: 'warning' },
  ];

  return (
    <DashboardContent maxWidth="xl">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 5 }}>
        <Box>
          <Typography variant="h4">Scheduling Hub</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Manage your appointments, events, and staff schedules in one unified workspace.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5}>
           <Button variant="soft" color="inherit" onClick={() => router.push(paths.dashboard.calendar)}>Full Calendar</Button>
           <Button variant="contained" startIcon={<Iconify icon="solar:add-circle-bold" />}>New Event</Button>
        </Stack>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 5 }}>
         {schedulingKPIs.map((kpi) => (
            <Grid item xs={12} sm={6} md={3} key={kpi.label}>
               <Card sx={{ p: 3, textAlign: 'center' }}>
                  <Box
                     sx={{
                        width: 56,
                        height: 56,
                        mx: 'auto',
                        mb: 2,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: `${kpi.color}.lighter`,
                        color: `${kpi.color}.main`
                     }}
                  >
                     <Iconify icon={kpi.icon} width={28} />
                  </Box>
                  <Typography variant="h4">{kpi.value}</Typography>
                  <Typography variant="subtitle2" color="text.secondary">{kpi.label}</Typography>
               </Card>
            </Grid>
         ))}
      </Grid>

      <Grid container spacing={3}>
         <Grid item xs={12} md={8}>
            <Card sx={{ p: 3 }}>
               <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                  <Typography variant="h6">Upcoming Agenda</Typography>
                  <Button size="small">View Full Schedule</Button>
               </Stack>
               <Stack spacing={2}>
                  {eventsData.slice(0, 5).map((event: any) => (
                     <Box key={event.id} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.neutral', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Stack direction="row" spacing={2} alignItems="center">
                           <Box sx={{ p: 1, borderRadius: 1, bgcolor: 'primary.lighter', textAlign: 'center', minWidth: 60 }}>
                              <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 'bold', display: 'block' }}>
                                 {event.start ? new Date(event.start).toLocaleString('en-US', { month: 'short' }) : '---'}
                              </Typography>
                              <Typography variant="h6" sx={{ color: 'primary.darker', lineHeight: 1 }}>
                                 {event.start ? new Date(event.start).getDate() : '--'}
                              </Typography>
                           </Box>
                           <Box>
                              <Typography variant="subtitle2">{event.title || 'Untitled Event'}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                 {event.start ? new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                              </Typography>
                           </Box>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                           <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: 10 } }}>
                              <Avatar src="/static/mock-avatars/1.jpg" />
                              <Avatar src="/static/mock-avatars/2.jpg" />
                              <Avatar src="/static/mock-avatars/3.jpg" />
                           </AvatarGroup>
                           <Button size="small" variant="soft">Check-In</Button>
                        </Stack>
                     </Box>
                  ))}
                  {eventsData.length === 0 && !isLoading && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      No upcoming events.
                    </Typography>
                  )}
               </Stack>
            </Card>
         </Grid>

         <Grid item xs={12} md={4}>
            <Card sx={{ p: 3, bgcolor: 'background.neutral', height: '100%' }}>
               <Typography variant="h6" sx={{ mb: 3 }}>Quick Booking Links</Typography>
               <Stack spacing={2}>
                  {bookingTypesData.map((type: any) => (
                     <Stack
                        key={type.id}
                        direction="row"
                        spacing={2}
                        alignItems="center"
                        sx={{
                           p: 2,
                           borderRadius: 1.5,
                           bgcolor: 'background.paper',
                           cursor: 'pointer',
                           transition: 'all 0.2s',
                           '&:hover': { transform: 'translateX(4px)', boxShadow: (theme) => theme.customShadows.z4 }
                        }}
                     >
                        <Box sx={{ width: 40, height: 40, borderRadius: 1, bgcolor: 'info.lighter', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           <Iconify icon="solar:link-bold" sx={{ color: 'info.main' }} />
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                           <Typography variant="subtitle2">{type.title || type.name}</Typography>
                           <Typography variant="caption" color="text.secondary">Public Portal Link</Typography>
                        </Box>
                        <Iconify icon="solar:copy-bold" sx={{ color: 'text.disabled' }} />
                     </Stack>
                  ))}
                  {bookingTypesData.length === 0 && !isLoading && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      No booking types defined.
                    </Typography>
                  )}
               </Stack>
            </Card>
         </Grid>
      </Grid>
    </DashboardContent>
  );
}
