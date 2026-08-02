import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { Iconify } from 'src/components/iconify';
import { Form, RHFSwitch, RHFTextField } from 'src/components/hook-form';

import { MarketingSegment } from '../types';

// ----------------------------------------------------------------------

export const SegmentSchema = zod.object({
  name: zod.string().min(1, 'Name is required'),
  isPublic: zod.boolean().default(true),
  description: zod.string().optional(),
  primaryFilter: zod.string().optional(),
});

export type SegmentData = zod.infer<typeof SegmentSchema>;

type Props = {
  segment?: MarketingSegment;
  onSubmit: (data: SegmentData) => Promise<void>;
  onCancel: () => void;
};

export function MarketingSegmentForm({ segment, onSubmit, onCancel }: Props) {
  const defaultValues = {
    name: segment?.name || '',
    isPublic: true,
    description: segment?.description || '',
    primaryFilter: '',
  };

  const methods = useForm({
    resolver: zodResolver(SegmentSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  return (
    <Form methods={methods} onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={3} sx={{ pt: 1 }}>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 'bold', textTransform: 'uppercase', mb: 1, display: 'block' }}>
            Basic Information
          </Typography>
          <RHFTextField 
            name="name" 
            label="Segment Name" 
            placeholder="e.g. High Value Customers" 
            helperText="Give your segment a clear, descriptive name."
          />
        </Box>
        
        <RHFTextField 
          name="description" 
          label="Description" 
          placeholder="Briefly describe who this segment includes..."
          multiline 
          rows={3} 
        />

        <RHFTextField name="primaryFilter" select label="Primary Filter">
          <MenuItem value="">No filter selected</MenuItem>
          <MenuItem value="lifecycle_stage">Lifecycle stage</MenuItem>
          <MenuItem value="tag">Tag</MenuItem>
          <MenuItem value="source">Source</MenuItem>
          <MenuItem value="email_contains">Email contains</MenuItem>
          <MenuItem value="created_date">Created date</MenuItem>
          <MenuItem value="last_activity_date">Last activity date</MenuItem>
          <MenuItem value="has_orders">Has orders</MenuItem>
          <MenuItem value="has_bookings">Has bookings</MenuItem>
          <MenuItem value="marketing_consent">Marketing consent</MenuItem>
        </RHFTextField>

        <Box>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 'bold', textTransform: 'uppercase', mb: 1, display: 'block' }}>
            Settings & Visibility
          </Typography>
          
          <Box
            sx={{
              p: 2,
              borderRadius: 1.5,
              bgcolor: 'background.neutral',
              border: (theme) => `dashed 1px ${theme.palette.divider}`,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'primary.lighter',
                  color: 'primary.main',
                }}
              >
                <Iconify icon="solar:users-group-rounded-bold" width={24} />
              </Box>
              
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2">Public Subscription</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Allow contacts to self-subscribe to this list via portal.
                </Typography>
              </Box>

              <RHFSwitch name="isPublic" label="" sx={{ m: 0 }} />
            </Stack>
          </Box>
        </Box>

        <Stack direction="row" justifyContent="flex-end" spacing={1.5} sx={{ mt: 1 }}>
          <Button variant="outlined" color="inherit" onClick={onCancel}>
            Cancel
          </Button>
          <LoadingButton 
            type="submit" 
            variant="contained" 
            color="primary"
            loading={isSubmitting}
            startIcon={<Iconify icon={segment ? 'solar:check-read-bold' : 'solar:add-circle-bold'} />}
          >
            {segment ? 'Update Segment' : 'Create Segment'}
          </LoadingButton>
        </Stack>
      </Stack>
    </Form>
  );
}
