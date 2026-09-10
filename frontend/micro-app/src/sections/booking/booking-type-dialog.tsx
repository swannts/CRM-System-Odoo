'use client';

import { useEffect } from 'react';
import { z as zod } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAppDispatch } from 'src/store/hooks';
import { 
  createBookingTypeThunk, 
  updateBookingTypeThunk, 
} from 'src/store/slices/calendar-slice';

import { fetchBookingTypes } from 'src/store/slices/booking-slice';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

const SCHEMA = zod.object({
  title: zod.string().min(1, 'Title is required'),
  description: zod.string().optional(),
  durationMinutes: zod.coerce.number().int().min(1).max(1440),
  bufferMinutes: zod.coerce.number().int().min(0).max(1440),
  timeZone: zod.string().refine((value) => {
    try { new Intl.DateTimeFormat('en', { timeZone: value }); return true; } catch { return false; }
  }, 'Enter a valid IANA timezone'),
  availabilities: zod.array(zod.object({
    dayOfWeek: zod.coerce.number().int().min(0).max(6),
    startTime: zod.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    endTime: zod.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  }).refine((row) => row.endTime > row.startTime, 'End must be after start')),
  color: zod.string().optional(),
});

type FormValues = zod.infer<typeof SCHEMA>;

interface Props {
  open: boolean;
  onClose: () => void;
  bookingType?: any;
}

export function BookingTypeDialog({ open, onClose, bookingType }: Props) {
  const dispatch = useAppDispatch();

  const methods = useForm<FormValues>({
    resolver: zodResolver(SCHEMA),
    defaultValues: {
      title: bookingType?.title || '',
      description: bookingType?.description || '',
      durationMinutes: bookingType?.durationMinutes || 30,
      bufferMinutes: bookingType?.bufferMinutes || 0,
      color: bookingType?.color || '#2196f3',
      timeZone: bookingType?.timeZone || 'UTC',
      availabilities: bookingType?.availabilities || [],
    },
  });

  const { register, handleSubmit, reset, control, formState: { isSubmitting, errors } } = methods;

  const { fields, append, remove } = useFieldArray({ control, name: 'availabilities' });
  useEffect(() => {
    if (open) reset({
      title: bookingType?.title || '', description: bookingType?.description || '',
      durationMinutes: bookingType?.durationMinutes || 30,
      bufferMinutes: bookingType?.bufferMinutes || 0, color: bookingType?.color || '#2196f3',
      timeZone: bookingType?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      availabilities: (bookingType?.availabilities || []).map((row: any) => ({ dayOfWeek: row.dayOfWeek, startTime: row.startTime, endTime: row.endTime })),
    });
  }, [open, bookingType, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (bookingType) {
        await dispatch(updateBookingTypeThunk({ id: bookingType.id, data })).unwrap();
        toast.success('Booking type updated');
      } else {
        await dispatch(createBookingTypeThunk(data)).unwrap();
        toast.success('Booking type created');
      }
      dispatch(fetchBookingTypes());
      onClose();
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Failed to save booking type');
    }
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{bookingType ? 'Edit Booking Type' : 'New Booking Type'}</DialogTitle>
      
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          <TextField
            {...register('title')}
            label="Title"
            fullWidth
            error={!!errors.title}
            helperText={errors.title?.message}
          />

          <TextField
            {...register('description')}
            label="Description"
            fullWidth
            multiline
            rows={3}
          />

          <Stack direction="row" spacing={2}>
            <TextField
              {...register('durationMinutes')}
              label="Duration (mins)"
              type="number"
              fullWidth
            />
            <TextField
              {...register('bufferMinutes')}
              label="Buffer (mins)"
              type="number"
              fullWidth
            />
          </Stack>

          <TextField {...register('timeZone')} label="Timezone" error={!!errors.timeZone} helperText={errors.timeZone?.message || 'For example: Asia/Dhaka or America/New_York'} />
          <Typography variant="subtitle2">Weekly availability</Typography>
          {fields.map((field, index) => (
            <Stack key={field.id} spacing={1}>
              <Stack direction="row" spacing={1}>
                <TextField select label="Day" defaultValue={field.dayOfWeek} {...register(`availabilities.${index}.dayOfWeek`)} sx={{ minWidth: 120 }}>
                  {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, value) => <MenuItem key={day} value={value}>{day}</MenuItem>)}
                </TextField>
                <TextField type="time" label="Start" InputLabelProps={{ shrink: true }} {...register(`availabilities.${index}.startTime`)} />
                <TextField type="time" label="End" InputLabelProps={{ shrink: true }} {...register(`availabilities.${index}.endTime`)} />
                <Button color="error" onClick={() => remove(index)}>Remove</Button>
              </Stack>
              {errors.availabilities?.[index] && <Typography color="error">Use valid times with end after start.</Typography>}
            </Stack>
          ))}
          <Button onClick={() => append({ dayOfWeek: 1, startTime: '09:00', endTime: '17:00' })}>Add available hours</Button>
          <Typography variant="caption">Only these hours will be offered for public booking. No hours means no available slots.</Typography>
          <TextField
            {...register('color')}
            label="Color"
            select
            fullWidth
            defaultValue={bookingType?.color || '#2196f3'}
          >
            {[
              { label: 'Blue', value: '#2196f3' },
              { label: 'Green', value: '#4caf50' },
              { label: 'Red', value: '#f44336' },
              { label: 'Orange', value: '#ff9800' },
              { label: 'Purple', value: '#9c27b0' },
            ].map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: option.value }} />
                  <Typography>{option.label}</Typography>
                </Stack>
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <LoadingButton variant="contained" loading={isSubmitting} onClick={onSubmit}>
          {bookingType ? 'Update' : 'Create'}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
