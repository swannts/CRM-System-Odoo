'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { 
  selectBooking, 
  fetchPublicBookingTypeThunk, 
  fetchAvailableSlotsThunk, 
  createPublicAppointmentThunk 
} from 'src/store/slices/booking-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { fCurrency } from 'src/utils/format-number';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  bookingLink?: string;
  userId?: string;
  serviceId?: string;
};

export function PublicBookingView({ bookingLink, userId, serviceId }: Props) {
  const dispatch = useAppDispatch();
  const { publicBooking } = useAppSelector(selectBooking);
  const { type: bookingType, loading, slots } = publicBooking;

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  useEffect(() => {
    if (bookingLink || serviceId) {
      dispatch(fetchPublicBookingTypeThunk({ link: bookingLink, id: serviceId }));
    }
  }, [dispatch, bookingLink, serviceId]);

  useEffect(() => {
    if (selectedDate && bookingType?.id) {
      dispatch(fetchAvailableSlotsThunk({ typeId: bookingType.id, date: selectedDate }));
    }
  }, [dispatch, selectedDate, bookingType?.id]);

  if (loading && !bookingType) {
    return (
      <Box sx={{ py: 15, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.neutral', minHeight: '100vh', py: { xs: 5, md: 10 } }}>
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="center">
          <Grid item xs={12} md={4}>
            <Card sx={{ p: 4, height: '100%', position: 'sticky', top: 24 }}>
              <Stack spacing={3} alignItems="center" sx={{ textAlign: 'center' }}>
                <Avatar 
                   sx={{ width: 80, height: 80, fontSize: 32, bgcolor: 'primary.main', color: 'primary.contrastText' }}
                >
                   {bookingType?.title?.charAt(0) || 'B'}
                </Avatar>
                
                <Box>
                   <Typography variant="h4">{bookingType?.title || 'Book Appointment'}</Typography>
                   <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                      {bookingType?.description || 'Please select a date and time that works best for you.'}
                   </Typography>
                </Box>

                <Divider sx={{ width: '100%', borderStyle: 'dashed' }} />

                <Stack spacing={2} sx={{ width: '100%' }}>
                   <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Iconify icon="solar:clock-circle-bold" sx={{ color: 'primary.main' }} />
                      <Typography variant="subtitle2">{bookingType?.durationMinutes || 30} Minutes</Typography>
                   </Stack>
                   <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Iconify icon="solar:videocamera-record-bold" sx={{ color: 'primary.main' }} />
                      <Typography variant="subtitle2">Web Conferencing</Typography>
                   </Stack>
                   {bookingType?.priceCents > 0 && (
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                         <Iconify icon="solar:tag-bold" sx={{ color: 'primary.main' }} />
                         <Typography variant="subtitle2">{fCurrency(bookingType.priceCents / 100)}</Typography>
                      </Stack>
                   )}
                </Stack>
              </Stack>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Card sx={{ p: 0, overflow: 'hidden' }}>
               <Box sx={{ p: 3, borderBottom: (theme) => `1px solid ${theme.palette.divider}`, bgcolor: 'background.neutral' }}>
                  <Typography variant="h6">Select Date & Time</Typography>
               </Box>

               <Grid container>
                  <Grid item xs={12} md={7} sx={{ p: 3, borderRight: (theme) => ({ md: `1px solid ${theme.palette.divider}` }) }}>
                     <Typography variant="subtitle2" sx={{ mb: 2 }}>Available Dates</Typography>
                     {/* Simplified Date Grid for Parity Demo */}
                     <Grid container spacing={1}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((day) => (
                           <Grid item xs={3} key={day}>
                              <Button 
                                 fullWidth 
                                 variant={selectedDate === `2024-05-${day}` ? 'contained' : 'outlined'}
                                 onClick={() => setSelectedDate(`2024-05-${day}`)}
                                 sx={{ py: 1.5 }}
                              >
                                 {day}
                              </Button>
                           </Grid>
                        ))}
                     </Grid>
                  </Grid>

                  <Grid item xs={12} md={5} sx={{ p: 3 }}>
                     <Typography variant="subtitle2" sx={{ mb: 2 }}>{selectedDate ? `Times for May ${selectedDate.split('-')[2]}` : 'Select a date'}</Typography>
                     {selectedDate ? (
                        <Stack spacing={1}>
                           {['09:00 AM', '10:00 AM', '11:30 AM', '01:00 PM', '02:30 PM', '04:00 PM'].map((time) => (
                              <Button 
                                 key={time} 
                                 fullWidth 
                                 variant={selectedTime === time ? 'contained' : 'soft'}
                                 onClick={() => setSelectedTime(time)}
                                 color={selectedTime === time ? 'primary' : 'inherit'}
                              >
                                 {time}
                              </Button>
                           ))}
                        </Stack>
                     ) : (
                        <Box sx={{ py: 5, textAlign: 'center', opacity: 0.5 }}>
                           <Iconify icon="solar:calendar-bold-duotone" width={48} sx={{ mb: 1 }} />
                           <Typography variant="caption" display="block">Pick a date to see availability</Typography>
                        </Box>
                     )}
                  </Grid>
               </Grid>

               <Divider />

               <Box sx={{ p: 3, textAlign: 'right' }}>
                  <Button 
                     size="large" 
                     variant="contained" 
                     disabled={!selectedTime}
                     endIcon={<Iconify icon="solar:arrow-right-bold" />}
                     sx={{ px: 4 }}
                  >
                     Confirm Booking
                  </Button>
               </Box>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
