import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import { useMemo, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { RootState, useAppDispatch } from 'src/store/hooks';
import { 
  createLocalCampaign, 
  fetchCampaignCompliance, 
  fetchSenderStatus 
} from 'src/store/slices/marketing-slice';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { Iconify } from 'src/components/iconify';
import { showToast } from 'src/components/toast';
import { Form, RHFTextField } from 'src/components/hook-form';

import { marketingService } from '../services/marketing-service';
import { MarketingTemplatePicker } from './marketing-template-picker';
import { MarketingCampaignPreview } from './marketing-campaign-preview';
import { MarketingSegment, MarketingCampaign, MarketingTemplate } from '../types';

// ----------------------------------------------------------------------

type Props = {
  campaign?: MarketingCampaign;
  segments: MarketingSegment[];
};

const TOKENS = [
  { label: 'First Name', value: '{{first_name}}' },
  { label: 'Company', value: '{{company}}' },
  { label: 'Email', value: '{{email}}' },
];

export const CampaignSchema = zod.object({
  name: zod.string().min(1, 'Name is required'),
  type: zod.string().min(1, 'Type is required'),
  subject: zod.string().optional(),
  previewText: zod.string().optional(),
  templateId: zod.string().optional(),
  segmentId: zod.string().min(1, 'Audience is required'),
  content: zod.string().min(1, 'Content is required'),
  senderName: zod.string().optional(),
  senderEmail: zod.string().optional(),
}).refine((data) => {
  if (data.type === 'email' && (!data.subject || !data.senderEmail)) {
    return false;
  }
  return true;
}, {
  message: 'Subject and sender email are required for email campaigns',
  path: ['senderEmail'],
});

export function MarketingCampaignForm({ campaign, segments }: Props) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const isEdit = !!campaign;

  const { data: complianceData } = useSelector((state: RootState) => state.marketing.compliance);
  const { data: senderStatusData } = useSelector((state: RootState) => state.marketing.senderStatus);

  const [tab, setTab] = useState('edit');
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [testSendOpen, setTestSendOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (campaign?.id) {
      dispatch(fetchCampaignCompliance(campaign.id));
      dispatch(fetchSenderStatus());
    }
  }, [campaign?.id, dispatch]);

  const defaultValues = useMemo(
    () => ({
      name: campaign?.name || '',
      type: campaign?.type || 'email',
      subject: campaign?.subject || '',
      previewText: campaign?.previewText || '',
      templateId: campaign?.templateId || '',
      segmentId: campaign?.segmentId || '',
      content: campaign?.content || '',
      senderName: campaign?.senderName || '',
      senderEmail: campaign?.senderEmail || '',
    }),
    [campaign]
  );

  const methods = useForm({
    resolver: zodResolver(CampaignSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  useEffect(() => {
    if (campaign) {
      reset(defaultValues);
    }
  }, [campaign, reset, defaultValues]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (isEdit && campaign?.id) {
        await marketingService.updateCampaignContent(campaign.id, data);
      } else {
        const created = await dispatch(createLocalCampaign(data as any)).unwrap();
        const createdId =
          typeof created === 'number'
            ? String(created)
            : created?.id
            ? String(created.id)
            : '';
        if (createdId) {
          await marketingService.updateCampaignContent(createdId, data);
        }
      }
      showToast({ severity: 'success', message: 'Campaign draft saved.' });
      router.push(paths.dashboard.marketingSection('campaigns'));
    } catch (error: any) {
      showToast({ severity: 'error', message: error?.response?.data?.message || 'Failed to save campaign.' });
    }
  });

  const handleSelectTemplate = (template: MarketingTemplate) => {
    setValue('templateId', String(template.id || ''), { shouldValidate: false });
    setValue('content', template.content || '', { shouldValidate: true });
    if (template.subject) setValue('subject', template.subject, { shouldValidate: true });
  };

  const handleInsertToken = (token: string) => {
    const currentContent = values.content || '';
    setValue('content', currentContent + token);
  };

  const canDeliver =
    Boolean(values.segmentId) &&
    Boolean(values.content) &&
    (values.type !== 'email' || (Boolean(values.subject) && Boolean(values.senderEmail)));

  const complianceReady =
    !isEdit ||
    (complianceData &&
      typeof complianceData?.compliantRecipients === 'number' &&
      complianceData.compliantRecipients > 0);

  const senderReady = !isEdit || Boolean(senderStatusData?.configured);
  const deliveryEnabled = canDeliver && complianceReady && senderReady;

  const handleSendTest = async () => {
    if (!campaign?.id || !testRecipient) return;
    try {
      setIsSending(true);
      await marketingService.sendTestCampaign(campaign.id, { to: testRecipient });
      showToast({ severity: 'success', message: 'Test campaign sent.' });
      setTestSendOpen(false);
    } catch (error: any) {
      showToast({ severity: 'error', message: error?.response?.data?.message || 'Send test is unavailable.' });
    } finally {
      setIsSending(false);
    }
  };

  const handleSchedule = async () => {
    if (!campaign?.id || !scheduleTime) return;
    try {
      setIsSending(true);
      await marketingService.scheduleCampaign(campaign.id, { scheduledAt: scheduleTime });
      showToast({ severity: 'success', message: 'Campaign scheduled.' });
      setScheduleOpen(false);
      router.push(paths.dashboard.marketingSection('campaigns'));
    } catch (error: any) {
      showToast({ severity: 'error', message: error?.response?.data?.message || 'Schedule is unavailable.' });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendNow = async () => {
    if (!campaign?.id) return;
    try {
      setIsSending(true);
      await marketingService.sendCampaignNow(campaign.id);
      showToast({ severity: 'success', message: 'Campaign queued for delivery.' });
      router.push(paths.dashboard.marketingSection('campaigns'));
    } catch (error: any) {
      showToast({ severity: 'error', message: error?.response?.data?.message || 'Send is unavailable.' });
    } finally {
      setIsSending(false);
    }
  };

  const handleCancelSchedule = async () => {
    if (!campaign?.id) return;
    try {
      setIsSending(true);
      await marketingService.cancelScheduledCampaign(campaign.id);
      showToast({ severity: 'success', message: 'Campaign schedule canceled.' });
    } catch (error: any) {
      showToast({ severity: 'error', message: error?.response?.data?.message || 'Cancel schedule is unavailable.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(_e, v) => setTab(v)}
        sx={{ mb: 3, borderBottom: (theme) => `solid 1px ${theme.palette.divider}` }}
      >
        <Tab icon={<Iconify icon="solar:pen-bold" width={20} />} label="Builder" value="edit" />
        <Tab icon={<Iconify icon="solar:eye-bold" width={20} />} label="Preview" value="preview" />
      </Tabs>

      {tab === 'edit' ? (
        <Form methods={methods} onSubmit={onSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card sx={{ p: 3 }}>
                <Stack spacing={3}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="subtitle1">Campaign Builder</Typography>
                    <Button
                      variant="soft"
                      startIcon={<Iconify icon="solar:clapperboard-edit-bold" />}
                      onClick={() => setTemplatePickerOpen(true)}
                    >
                      Use Template
                    </Button>
                  </Stack>

                  <RHFTextField name="name" label="Campaign Name" />

                  {values.type === 'email' && (
                    <>
                      <RHFTextField name="subject" label="Email Subject" />
                      <RHFTextField name="previewText" label="Preview Text" multiline rows={2} />
                    </>
                  )}

                  <Box>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                      <Typography variant="subtitle2">Content</Typography>
                      <Stack direction="row" spacing={1}>
                        {TOKENS.map((token) => (
                          <Chip
                            key={token.value}
                            label={token.label}
                            size="small"
                            onClick={() => handleInsertToken(token.value)}
                            icon={<Iconify icon="solar:add-circle-bold" />}
                          />
                        ))}
                      </Stack>
                    </Stack>
                    <RHFTextField name="content" label="Campaign Content" multiline rows={10} />
                  </Box>
                </Stack>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Stack spacing={3}>
                <Card sx={{ p: 3 }}>
                  <Stack spacing={3}>
                    <RHFTextField select name="type" label="Campaign Type">
                      <MenuItem value="email">Email</MenuItem>
                      <MenuItem value="sms">SMS</MenuItem>
                      <MenuItem value="broadcast">Broadcast</MenuItem>
                      <MenuItem value="multi_channel">Multi Channel</MenuItem>
                    </RHFTextField>

                    <RHFTextField select name="segmentId" label="Audience Segment">
                      <MenuItem value="">Select Segment</MenuItem>
                      {segments.map((segment) => (
                        <MenuItem key={segment.id} value={segment.id}>
                          {segment.name}
                        </MenuItem>
                      ))}
                    </RHFTextField>

                    <RHFTextField name="senderName" label="Sender Name" />
                    <RHFTextField name="senderEmail" label="Sender Email" />

                    <LoadingButton fullWidth type="submit" variant="contained" size="large" loading={isSubmitting}>
                      Save Draft
                    </LoadingButton>
                  </Stack>
                </Card>

                {isEdit && (
                  <Card sx={{ p: 3 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>Delivery Actions</Typography>
                    <Stack spacing={2}>
                      <Button
                        fullWidth
                        variant="soft"
                        color="info"
                        startIcon={<Iconify icon="solar:paper-plane-bold" />}
                        onClick={() => setTestSendOpen(true)}
                        disabled={!deliveryEnabled}
                      >
                        Send Test
                      </Button>

                      <Button
                        fullWidth
                        variant="soft"
                        color="warning"
                        startIcon={<Iconify icon="solar:calendar-bold" />}
                        onClick={() => setScheduleOpen(true)}
                        disabled={!deliveryEnabled}
                      >
                        Schedule
                      </Button>

                      <Button
                        fullWidth
                        variant="outlined"
                        color="inherit"
                        onClick={handleCancelSchedule}
                      >
                        Cancel Schedule
                      </Button>

                      <LoadingButton
                        fullWidth
                        variant="contained"
                        color="success"
                        startIcon={<Iconify icon="solar:rocket-bold" />}
                        onClick={handleSendNow}
                        loading={isSending}
                        disabled={!deliveryEnabled}
                      >
                        Send Now
                      </LoadingButton>
                    </Stack>
                  </Card>
                )}

                <Card sx={{ p: 2, bgcolor: 'background.neutral' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                    <Iconify icon="solar:info-circle-bold" width={16} sx={{ mr: 0.5 }} />
                    {isEdit
                      ? !senderStatusData?.configured
                        ? 'Sender configuration is required.'
                        : !complianceData
                        ? 'Compliance check pending.'
                        : complianceData.message || 'Compliance check successful.'
                      : 'Save draft to run compliance checks.'}
                  </Typography>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        </Form>
      ) : (
        <Card sx={{ p: 3 }}>
          <MarketingCampaignPreview subject={values.subject} content={values.content} />
        </Card>
      )}

      <Dialog open={testSendOpen} onClose={() => setTestSendOpen(false)}>
        <DialogTitle>Send Test</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Enter recipient email for a test delivery.
          </Typography>
          <TextField autoFocus fullWidth label="Recipient" value={testRecipient} onChange={(e) => setTestRecipient(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestSendOpen(false)}>Cancel</Button>
          <LoadingButton variant="contained" onClick={handleSendTest} loading={isSending} disabled={!testRecipient || !deliveryEnabled}>
            Send Test
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Dialog open={scheduleOpen} onClose={() => setScheduleOpen(false)}>
        <DialogTitle>Schedule Campaign</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Choose a future datetime for scheduling.
          </Typography>
          <TextField
            fullWidth
            type="datetime-local"
            label="Schedule Time"
            InputLabelProps={{ shrink: true }}
            value={scheduleTime}
            onChange={(e) => setScheduleTime(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleOpen(false)}>Cancel</Button>
          <LoadingButton variant="contained" onClick={handleSchedule} loading={isSending} disabled={!scheduleTime || !deliveryEnabled}>
            Schedule
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <MarketingTemplatePicker
        open={templatePickerOpen}
        onClose={() => setTemplatePickerOpen(false)}
        onSelect={handleSelectTemplate}
      />
    </Box>
  );
}
