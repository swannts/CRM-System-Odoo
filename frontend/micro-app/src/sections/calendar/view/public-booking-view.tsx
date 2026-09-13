'use client';

import { useEffect, useState } from 'react';
import { Alert, Box, Button, Card, Container, Stack, TextField, Typography } from '@mui/material';
import { bookingService } from 'src/services/booking-service';

type Slot = { start: string; end: string; label: string };
type BookingType = { id: string; title: string; description?: string; durationMinutes: number; timeZone?: string };
type Props = { bookingLink?: string; userId?: string; serviceId?: string };

export function PublicBookingView({ bookingLink, serviceId }: Props) {
  const [type, setType] = useState<BookingType | null>(null);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);
  const [start, setStart] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState('');
  useEffect(() => {
    let cancelled = false;
    setType(null);
    const id = bookingLink || serviceId;
    if (!id) { setError('This booking link is incomplete.'); return undefined; }
    bookingService.getBookingTypeByLink(id)
      .then(value => { if (!cancelled) setType(value); })
      .catch(() => { if (!cancelled) setError('This booking link is unavailable.'); });
    return () => { cancelled = true; };
  }, [bookingLink, serviceId]);
  useEffect(() => {
    let cancelled = false;
    setStart(''); setSlots([]); setLoadingSlots(false);
    if (!type || !date) return undefined;
    setLoadingSlots(true); setError('');
    bookingService.getAvailableSlots(type.id, date)
      .then(value => { if (!cancelled) setSlots(value); })
      .catch(() => { if (!cancelled) setError('Unable to load availability. Please select the date again.'); })
      .finally(() => { if (!cancelled) setLoadingSlots(false); });
    return () => { cancelled = true; };
  }, [type, date]);
  return <Container maxWidth="sm" sx={{ py: 5 }}>
    <Card sx={{ p: { xs: 2, sm: 4 } }}>
      <Stack component="form" spacing={3} onSubmit={async event => {
        event.preventDefault();
        if (!type || !start) return;
        setBusy(true); setError('');
        try {
          const result = await bookingService.createAppointment({ bookingTypeId: type.id, startTime: start, guestName: name, guestEmail: email });
          setConfirmation(`Booking reference: ${result.id}. Your appointment is pending confirmation.`);
          setStart('');
          setSlots(await bookingService.getAvailableSlots(type.id, date));
        } catch (err: any) {
          setError(err?.response?.data?.message || 'Unable to book. Please retry.');
          setStart('');
        } finally { setBusy(false); }
      }}>
        <Typography variant="h4">{type?.title || 'Book an appointment'}</Typography>
        {type && <Typography>{type.description} {type.durationMinutes} minutes. Times shown in {type.timeZone || 'UTC'}.</Typography>}
        {error && <Alert severity="error">{error}</Alert>}
        {confirmation && <Alert severity="success">{confirmation}</Alert>}
        <TextField label="Date" type="date" value={date} disabled={!type || busy} onChange={event => { setDate(event.target.value); setConfirmation(''); }} InputLabelProps={{ shrink: true }} required />
        {loadingSlots && <Typography role="status">Loading availability…</Typography>}
        {date && !loadingSlots && !slots.length && !error && <Typography>No available appointments on this date.</Typography>}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {slots.map(slot => <Button key={slot.start} type="button" disabled={busy} variant={start === slot.start ? 'contained' : 'outlined'} aria-pressed={start === slot.start} onClick={() => { setStart(slot.start); setConfirmation(''); }}>{slot.label}</Button>)}
        </Box>
        <TextField label="Your name" value={name} required inputProps={{ maxLength: 200 }} onChange={event => setName(event.target.value)} />
        <TextField label="Email" type="email" value={email} required inputProps={{ maxLength: 254 }} onChange={event => setEmail(event.target.value)} />
        <Button type="submit" variant="contained" disabled={busy || !start || !name.trim() || !email}>{busy ? 'Booking…' : 'Confirm booking'}</Button>
      </Stack>
    </Card>
  </Container>;
}
