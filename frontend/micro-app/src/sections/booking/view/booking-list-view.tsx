'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { fetchBookingTypes, fetchAppointments, selectBooking } from 'src/store/slices/booking-slice';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { useBoolean } from 'src/hooks/use-boolean';

import { useLocales } from 'src/locales';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { showToast } from 'src/components/toast';

import { AppointmentsTab } from '../appointments-tab';
import { BookingTypeDialog } from '../booking-type-dialog';

// ----------------------------------------------------------------------

export function BookingListView() {
  const dispatch = useAppDispatch();
  const { t } = useLocales();
  const dialog = useBoolean();
  const [selectedType, setSelectedType] = useState<any>(null);
  const [currentTab, setCurrentTab] = useState('types');

  const bookingState = useAppSelector(selectBooking);

  useEffect(() => {
    dispatch(fetchBookingTypes());
  }, [dispatch]);

  useEffect(() => {
    if (currentTab === 'appointments') {
      dispatch(fetchAppointments());
    }
  }, [dispatch, currentTab]);

  const bookingTypes = bookingState.bookingTypes.data;
  const isLoading = bookingState.bookingTypes.loading;
  const appointments = bookingState.appointments.data;
  const appointmentsLoading = bookingState.appointments.loading;

  const handleEdit = (type: any) => {
    setSelectedType(type);
    dialog.onTrue();
  };

  const handleNew = () => {
    setSelectedType(null);
    dialog.onTrue();
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 5, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <DashboardContent maxWidth="xl">
      <Box sx={{ mb: 5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h4">{t('booking.title')}</Typography>
        {currentTab === 'types' && (
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={handleNew}
          >
            {t('booking.new_type')}
          </Button>
        )}
      </Box>


      <Tabs
        value={currentTab}
        onChange={(e, v) => setCurrentTab(v)}
        sx={{ mb: 5, borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}
      >
        <Tab value="types" label={t('booking.title')} />
        <Tab value="appointments" label={t('booking.appointments')} />
      </Tabs>


      {currentTab === 'types' ? (
        <Grid container spacing={3}>
          {(bookingTypes || []).map((type: any) => (
            <Grid item xs={12} sm={6} md={4} key={type.id}>
              <Card sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                  <Box sx={{ width: 12, height: 40, borderRadius: 1, bgcolor: type.color || 'primary.main' }} />
                  <Box>
                    <Typography variant="subtitle1">{type.title}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {type.durationMinutes} mins • {type.slug}
                    </Typography>
                  </Box>
                </Stack>
                
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                  {type.description || 'No description provided.'}
                </Typography>

                <Divider sx={{ borderStyle: 'dashed', my: 2 }} />

                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button 
                    variant="soft" 
                    color="info" 
                    size="small" 
                    startIcon={<Iconify icon="eva:link-2-fill" />}
                    onClick={() => {
                      const url = `${window.location.origin}/booking/${type.slug}`;
                      navigator.clipboard.writeText(url);
                      showToast({ message: t('booking.copy_link_success') || 'Link copied!' });
                    }}
                  >
                    {t('booking.copy_link')}
                  </Button>
                  <Button variant="soft" size="small" startIcon={<Iconify icon="eva:edit-fill" />} onClick={() => handleEdit(type)}>
                    {t('booking.edit')}
                  </Button>

                </Stack>
              </Card>
            </Grid>
          ))}

          {bookingTypes?.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 10, width: '100%' }}>
              <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                {t('booking.no_types')}
              </Typography>
            </Box>
          )}

        </Grid>
      ) : (
        <AppointmentsTab appointments={appointments} loading={appointmentsLoading} onRefresh={() => dispatch(fetchAppointments()).unwrap()} />
      )}


      <BookingTypeDialog 
        open={dialog.value} 
        onClose={dialog.onFalse} 
        bookingType={selectedType} 
      />
    </DashboardContent>
  );
}

