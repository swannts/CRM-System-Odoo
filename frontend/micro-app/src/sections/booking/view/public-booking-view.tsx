'use client';

import dayjs from 'dayjs';
import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import {
  fetchPublicBookingTypeThunk,
  fetchAvailableSlotsThunk,
  createPublicAppointmentThunk,
  selectBooking,
  clearPublicBooking,
} from 'src/store/slices/booking-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { showToast } from 'src/components/toast';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  link: string;
};

export function PublicBookingView({ link }: Props) {
  const dispatch = useAppDispatch();
  const { publicBooking } = useAppSelector(selectBooking);
  const { type: bookingType, slots, loading: typeLoading, error: bookingTypeError, mutationLoading } = publicBooking;

  const [selectedDate, setSelectedDate] = useState<any>(dayjs());
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [step, setStep] = useState(1); // 1: Date/Time, 2: Info, 3: Success
  const [customerInfo, setCustomerInfo] = useState({ name: '', email: '', notes: '' });

  useEffect(() => {
    dispatch(fetchPublicBookingTypeThunk(link));
    return () => {
      dispatch(clearPublicBooking());
    };
  }, [dispatch, link]);

  useEffect(() => {
    if (bookingType?.id) {
      dispatch(
        fetchAvailableSlotsThunk({
          typeId: bookingType.id,
          date: dayjs(selectedDate).format('YYYY-MM-DD'),
        })
      );
    }
  }, [dispatch, bookingType?.id, selectedDate]);

  const handleBooking = async () => {
    try {
      await dispatch(
        createPublicAppointmentThunk({
          bookingTypeId: bookingType!.id,
          startTime: selectedSlot.start,
          name: customerInfo.name,
          email: customerInfo.email,
          notes: customerInfo.notes,
        })
      ).unwrap();
      setStep(3);
      showToast({ message: 'Appointment booked successfully!' });
    } catch (err: any) {
      showToast({ message: err || 'Failed to book appointment', severity: 'error' });
    }
  };

  if (typeLoading)
    return (
      <Box sx={{ p: 5, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );

  if (bookingTypeError) {
    return (
      <Box sx={{ p: 5, textAlign: 'center' }}>
        <Alert severity="error">Unable to load booking type. Please try again later.</Alert>
      </Box>
    );
  }

  if (!bookingType)
    return (
      <Box sx={{ p: 5, textAlign: 'center' }}>
        <Typography variant="h4">Booking type not found</Typography>
      </Box>
    );

  if (step === 3) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', mt: 10, textAlign: 'center' }}>
        <Card sx={{ p: 5 }}>
          <Iconify icon="solar:check-circle-bold" width={64} sx={{ color: 'success.main', mb: 2 }} />
          <Typography variant="h4" sx={{ mb: 2 }}>
            Confirmed!
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4 }}>
            Your appointment for <strong>{bookingType.title}</strong> is scheduled for
            <strong> {dayjs(selectedSlot.start).format('MMM D, YYYY h:mm A')}</strong>.
          </Typography>

          <Button variant="contained" onClick={() => window.location.reload()}>
            Book Another
          </Button>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', py: 5, px: 2 }}>
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 1,
                bgcolor: bookingType.color || 'primary.main',
                mb: 2,
              }}
            />
            <Typography variant="h5" sx={{ mb: 1 }}>
              {bookingType.title}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ color: 'text.secondary', mb: 2 }}>
              <Iconify icon="solar:clock-circle-bold" />
              <Typography variant="body2">{bookingType.durationMinutes} mins</Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {bookingType.description || 'No description provided.'}
            </Typography>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          {step === 1 ? (
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Select Date & Time
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Stack spacing={1}>
                    {[0, 1, 2, 3, 4, 5, 6].map((i) => {
                      const d = dayjs().add(i, 'day');
                      const isSelected = d.format('YYYY-MM-DD') === dayjs(selectedDate).format('YYYY-MM-DD');
                      return (
                        <Button
                          key={i}
                          variant={isSelected ? 'contained' : 'outlined'}
                          onClick={() => {
                            setSelectedDate(d);
                            setSelectedSlot(null);
                          }}
                          sx={{ justifyContent: 'space-between', p: 2 }}
                        >
                          <Typography variant="subtitle2">{d.format('dddd')}</Typography>
                          <Typography variant="caption">{d.format('MMM D')}</Typography>
                        </Button>
                      );
                    })}
                  </Stack>
                </Grid>

                <Grid item xs={12} sm={6}>
                  {!slots || slots.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 5 }}>
                      <Typography variant="body2" color="text.secondary">
                        No slots available for this date.
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={1} sx={{ maxHeight: 400, overflowY: 'auto' }}>
                      {slots.map((slot: any) => (
                        <Button
                          key={slot.start}
                          variant={selectedSlot?.start === slot.start ? 'contained' : 'soft'}
                          onClick={() => setSelectedSlot(slot)}
                          fullWidth
                        >
                          {slot.label}
                        </Button>
                      ))}
                    </Stack>
                  )}
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" disabled={!selectedSlot} onClick={() => setStep(2)}>
                  Next
                </Button>
              </Box>
            </Card>
          ) : (
            <Card sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <Button variant="soft" size="small" onClick={() => setStep(1)} sx={{ minWidth: 40, p: 0 }}>
                  <Iconify icon="solar:arrow-left-bold" />
                </Button>
                <Typography variant="h6">Your Details</Typography>
              </Stack>

              <Stack spacing={3}>
                <Typography variant="body2">
                  Booking for: <strong>{dayjs(selectedSlot.start).format('MMM D, YYYY h:mm A')}</strong>
                </Typography>

                <TextField
                  label="Name"
                  fullWidth
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                />

                <TextField
                  label="Email"
                  fullWidth
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                />

                <TextField
                  label="Notes"
                  fullWidth
                  multiline
                  rows={3}
                  value={customerInfo.notes}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, notes: e.target.value })}
                />

                <LoadingButton
                  variant="contained"
                  size="large"
                  loading={mutationLoading}
                  onClick={handleBooking}
                  disabled={!customerInfo.name || !customerInfo.email}
                >
                  Confirm Booking
                </LoadingButton>
              </Stack>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
