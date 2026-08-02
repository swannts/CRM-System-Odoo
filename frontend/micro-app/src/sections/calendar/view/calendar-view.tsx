'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import {
  fetchCalendarEvents,
  fetchCalendarSummary,
  fetchBookingLinks,
  fetchAvailability,
  fetchReminders,
  fetchCalendarSettings,
  createCalendarEventThunk,
  updateCalendarEventThunk,
  deleteCalendarEventThunk,
  selectCalendar,
} from 'src/store/slices/calendar-slice';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import CircularProgress from '@mui/material/CircularProgress';

import { useBoolean } from 'src/hooks/use-boolean';
import { fDateTime } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';

import { useCalendar } from '../hooks/use-calendar';
import { StyledCalendar } from '../styles';
import CalendarToolbar from '../calendar-toolbar';
import CalendarForm from '../calendar-form';
import { CalendarEmptyState, CalendarUnavailableState } from '../components/calendar-states';

// ----------------------------------------------------------------------

const TABS = ['calendar', 'agenda', 'team', 'availability', 'booking_links', 'reminders', 'settings'] as const;
type TabType = (typeof TABS)[number];

export function CalendarView() {
  const [tab, setTab] = useState<TabType>('calendar');
  const dispatch = useAppDispatch();

  const openForm = useBoolean();
  const [selectedEventId, setSelectedEventId] = useState('');

  const {
    calendarRef,
    date,
    view,
    onNextDate,
    onPrevDate,
    onToday,
    onChangeView,
  } = useCalendar();

  const calendarState = useAppSelector(selectCalendar);

  useEffect(() => {
    dispatch(fetchCalendarEvents());
    dispatch(fetchCalendarSummary());
  }, [dispatch]);

  useEffect(() => {
    if (tab === 'booking_links') dispatch(fetchBookingLinks());
    if (tab === 'availability') dispatch(fetchAvailability());
    if (tab === 'reminders') dispatch(fetchReminders());
    if (tab === 'settings') dispatch(fetchCalendarSettings());
  }, [dispatch, tab]);

  // Map Redux state to query-like objects
  const eventsQuery = { data: { data: calendarState.events.data }, isLoading: calendarState.events.loading };
  const summaryQuery = { data: calendarState.summary.data, isLoading: calendarState.summary.loading };
  const bookingLinksQuery = { data: calendarState.bookingLinks.data, isLoading: calendarState.bookingLinks.loading, isError: !!calendarState.bookingLinks.error };
  const availabilityQuery = { data: calendarState.availability.data, isLoading: calendarState.availability.loading, isError: !!calendarState.availability.error };
  const remindersQuery = { data: calendarState.reminders.data, isLoading: calendarState.reminders.loading, isError: !!calendarState.reminders.error };
  const settingsQuery = { data: calendarState.settings.data, isLoading: calendarState.settings.loading, isError: !!calendarState.settings.error };

  // Mapped Events for FullCalendar
  const dataFiltered = useMemo(
    () =>
      (eventsQuery.data?.data || []).map((event: any) => ({
        ...event,
        id: event.id,
        title: event.title,
        start: event.startAt,
        end: event.endAt,
        color: event.color || '#00A76F',
      })),
    [eventsQuery.data]
  );

  const selectedEvent = useMemo(
    () => (selectedEventId ? dataFiltered.find((event) => event.id === selectedEventId) : null),
    [dataFiltered, selectedEventId]
  );

  const onOpenForm = useCallback(() => {
    openForm.onTrue();
  }, [openForm]);

  const onCloseForm = useCallback(() => {
    openForm.onFalse();
    setSelectedEventId('');
  }, [openForm]);

  const handleClickEvent = useCallback(
    (arg: any) => {
      const { event } = arg;
      setSelectedEventId(event.id);
      onOpenForm();
    },
    [onOpenForm]
  );

  const handleSelectRange = useCallback(
    () => {
      onOpenForm();
      setSelectedEventId('');
    },
    [onOpenForm]
  );

  const unavailable = (title: string, description: string) => (
    <CalendarUnavailableState title={title} description={description} />
  );

  return (
    <Container maxWidth={false} sx={{ px: { xs: 2, md: 5 } }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: { xs: 3, md: 5 } }}>
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>Calendar</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Business scheduling, availability, booking links, and reminders.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={onOpenForm}
        >
          New Event
        </Button>
      </Stack>

      <Card sx={{ mb: 2, p: 1.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1}>
          <Chip size="small" variant="outlined" label={`Total: ${summaryQuery.data?.totalEvents ?? 'Unavailable'}`} />
          <Chip size="small" variant="outlined" label={`Upcoming: ${summaryQuery.data?.upcomingEvents ?? 'Unavailable'}`} />
          <Chip size="small" variant="outlined" label={`Cancelled: ${summaryQuery.data?.cancelledEvents ?? 'Unavailable'}`} />
        </Stack>
      </Card>

      <Card sx={{ mb: 3 }}>
        <Tabs value={tab} onChange={(_, value) => setTab(value)} variant="scrollable" scrollButtons="auto">
          {TABS.map((t) => (
            <Tab key={t} value={t} label={t.replace('_', ' ')} sx={{ textTransform: 'capitalize' }} />
          ))}
        </Tabs>
      </Card>

      {tab === 'calendar' && (
        <Card>
          <StyledCalendar>
            <CalendarToolbar
              date={date}
              view={view}
              onNextDate={onNextDate}
              onPrevDate={onPrevDate}
              onToday={onToday}
              onChangeView={onChangeView}
            />

            <FullCalendar
              weekends
              editable
              droppable
              selectable
              initialDate={date}
              initialView={view}
              dayMaxEventRows={3}
              eventDisplay="block"
              headerToolbar={false}
              allDayMaintainDuration
              eventResizableFromStart
              select={handleSelectRange}
              eventClick={handleClickEvent}
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
              events={dataFiltered}
            />
          </StyledCalendar>
        </Card>
      )}

      {tab === 'agenda' && (
        <Stack spacing={2}>
           {eventsQuery.isLoading && <CircularProgress />}
           {!eventsQuery.isLoading && (
             <>
               <Card sx={{ p: 2.5 }}>
                  <Typography variant="h6" sx={{ mb: 1.5 }}>Events List</Typography>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Title</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Start</TableCell>
                        <TableCell>End</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dataFiltered.map((event: any) => (
                        <TableRow key={event.id} hover>
                          <TableCell>{event.title}</TableCell>
                          <TableCell>{event.type || 'other'}</TableCell>
                          <TableCell><Chip label={event.status || 'scheduled'} size="small" variant="outlined" /></TableCell>
                          <TableCell>{fDateTime(event.start)}</TableCell>
                          <TableCell>{fDateTime(event.end)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
               </Card>
             </>
           )}
        </Stack>
      )}

      {tab === 'team' && unavailable('Team calendar is not available yet.', 'Team-level scheduling requires employee/user calendar aggregation endpoints.')}

      {tab === 'availability' && (
        <Card sx={{ p: 2.5 }}>
          {availabilityQuery.isLoading && <CircularProgress />}
          {!availabilityQuery.isLoading && (availabilityQuery.isError 
            ? unavailable('Availability is not available yet.', 'Create/update availability endpoints are not implemented.')
            : <CalendarEmptyState title="No availability rules" description="No availability rules were returned." />)}
        </Card>
      )}

      {tab === 'booking_links' && (
        <Card sx={{ p: 2.5 }}>
          {bookingLinksQuery.isLoading && <CircularProgress />}
          {!bookingLinksQuery.isLoading && (bookingLinksQuery.isError 
            ? unavailable('Booking links are not available yet.', 'Booking link APIs are not fully available.')
            : (bookingLinksQuery.data || []).length === 0 
              ? <CalendarEmptyState title="No booking links" description="No booking links were returned." />
              : <Table size="small">
                  <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Duration</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
                  <TableBody>{(bookingLinksQuery.data || []).map((link: any) => (
                    <TableRow key={link.id} hover><TableCell>{link.name}</TableCell><TableCell>{link.durationMinutes} min</TableCell><TableCell><Chip size="small" label={link.active ? 'active' : 'inactive'} /></TableCell></TableRow>
                  ))}</TableBody>
                </Table>)}
        </Card>
      )}

      {tab === 'reminders' && (
        <Card sx={{ p: 2.5 }}>
          {remindersQuery.isLoading && <CircularProgress />}
          {!remindersQuery.isLoading && (remindersQuery.isError 
            ? unavailable('Reminders are not available yet.', 'Reminder delivery APIs are not implemented yet.')
            : <CalendarEmptyState title="No reminders" description="No reminder records were returned." />)}
        </Card>
      )}

      {tab === 'settings' && (
        <Card sx={{ p: 2.5 }}>
          {settingsQuery.isLoading && <CircularProgress />}
          {!settingsQuery.isLoading && (settingsQuery.isError 
            ? unavailable('Settings are not available yet.', 'Calendar settings APIs are not implemented yet.')
            : <CalendarEmptyState title="No settings data" description="Settings endpoint returned no configuration." />)}
        </Card>
      )}

      <Dialog
        fullWidth
        maxWidth="sm"
        open={openForm.value}
        onClose={onCloseForm}
      >
        <CalendarForm
          event={selectedEvent}
          onClose={onCloseForm}
          onCreate={(data) => dispatch(createCalendarEventThunk(data))}
          onUpdate={(id, data) => dispatch(updateCalendarEventThunk({ id, payload: data }))}
          onDelete={(id) => dispatch(deleteCalendarEventThunk(id))}
        />
      </Dialog>
    </Container>
  );
}
