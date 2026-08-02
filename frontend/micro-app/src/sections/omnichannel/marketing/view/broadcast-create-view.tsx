'use client';

import { useMemo, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { 
  fetchOmniInstances, 
  createBroadcastThunk,
  selectOmnichannel 
} from 'src/store/slices/omnichannel-slice';
import { fetchContactSummary, selectContacts } from 'src/store/slices/contact-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type FormValues = {
  name: string;
  provider: string;
  instanceId: string;
  content: string;
  scheduledAt: string;
};

type SelectedRecipient = {
  contactId: string;
  fullName: string;
  phone: string;
  email?: string;
};

const defaultValues: FormValues = {
  name: '',
  provider: 'whatsapp',
  instanceId: '',
  content: 'Hello {{name}}, this is a message from MyManager.',
  scheduledAt: '',
};

export function BroadcastCreateView() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  
  const { instances } = useAppSelector(selectOmnichannel);
  const { summary: contactSummary } = useAppSelector(selectContacts);

  const [error, setError] = useState<string | null>(null);
  const [contactSearch, setContactSearch] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<SelectedRecipient[]>([]);

  const methods = useForm<FormValues>({
    defaultValues,
  });

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = methods;

  const values = watch();

  useEffect(() => {
    dispatch(fetchOmniInstances());
    dispatch(fetchContactSummary());
  }, [dispatch]);

  const instancesList = instances.data || [];
  const contacts = contactSummary.data || [];
  const contactsLoading = contactSummary.loading;

  const filteredInstances = useMemo(
    () => instancesList.filter((instance: any) => instance.provider === values.provider),
    [instancesList, values.provider]
  );

  const availableContacts = useMemo(
    () =>
      contacts.filter((contact: any) => {
        if (!contact.phone) return false;
        
        const isMatch = contact.fullName?.toLowerCase().includes(contactSearch.toLowerCase()) ||
                       contact.email?.toLowerCase().includes(contactSearch.toLowerCase()) ||
                       contact.phone?.includes(contactSearch);
                       
        if (!isMatch) return false;

        return !selectedRecipients.some((recipient) => recipient.contactId === (contact.id || contact._id));
      }),
    [contacts, selectedRecipients, contactSearch]
  );

  const addRecipient = (contact: any) => {
    const normalizedRecipient = {
      contactId: contact.id || contact._id,
      fullName: contact.fullName || 'Unnamed contact',
      phone: contact.phone,
      email: contact.email || '',
    };

    setSelectedRecipients((current) => [...current, normalizedRecipient]);
  };

  const removeRecipient = (contactId: string) => {
    setSelectedRecipients((current) => current.filter((recipient) => recipient.contactId !== contactId));
  };

  const addAllVisibleRecipients = () => {
    setSelectedRecipients((current) => {
      const existingIds = new Set(current.map((recipient) => recipient.contactId));
      const nextRecipients = availableContacts
        .filter((contact: any) => !existingIds.has(contact.id || contact._id))
        .map((contact: any) => ({
          contactId: contact.id || contact._id,
          fullName: contact.fullName || 'Unnamed contact',
          phone: contact.phone,
          email: contact.email || '',
        }));

      return [...current, ...nextRecipients];
    });
  };

  const clearRecipients = () => {
    setSelectedRecipients([]);
  };

  const onSubmit = handleSubmit(async (data) => {
    if (selectedRecipients.length === 0) {
      setError('Select at least one recipient before launching the campaign.');
      return;
    }

    setError(null);

    try {
      await dispatch(createBroadcastThunk({
        name: data.name,
        provider: data.provider,
        instanceId: data.instanceId,
        content: data.content,
        type: 'text',
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt).toISOString() : undefined,
        metadata: {
          audienceSource: 'crm_contacts',
          contactSearch: contactSearch || null,
        },
        recipients: selectedRecipients.map((recipient) => ({
          contactId: recipient.contactId,
          mobile: recipient.phone,
          variables: {
            name: recipient.fullName,
            phone: recipient.phone,
            email: recipient.email || '',
          },
        })),
      })).unwrap();
      
      toast.success('Broadcast created successfully');
      router.push(paths.dashboard.omni.marketing);
    } catch (err) {
      setError(err || 'Failed to create broadcast.');
      toast.error(err || 'Failed to create broadcast');
    }
  });

  const handleAddVariable = (variable: string) => {
    const current = values.content || '';
    const suffix = current.endsWith(' ') || current.length === 0 ? '' : ' ';
    setValue('content', `${current}${suffix}{{${variable}}}`);
  };

  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 3 }}>
        Create New Broadcast
      </Typography>

      {error ? (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      <form onSubmit={onSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Stack spacing={3}>
              <Card sx={{ p: 3 }}>
                <Stack spacing={3}>
                  <TextField
                    label="Campaign Name"
                    fullWidth
                    {...methods.register('name', {
                      required: 'Name is required',
                    })}
                    error={!!errors.name}
                    helperText={errors.name?.message || ''}
                  />

                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                    <TextField
                      select
                      fullWidth
                      label="Provider"
                      {...methods.register('provider', {
                        required: 'Provider is required',
                      })}
                    >
                      <MenuItem value="whatsapp">WhatsApp</MenuItem>
                      <MenuItem value="telegram">Telegram</MenuItem>
                    </TextField>

                    <TextField
                      select
                      fullWidth
                      label="Account / Instance"
                      {...methods.register('instanceId', {
                        required: 'Instance is required',
                      })}
                      error={!!errors.instanceId}
                      helperText={errors.instanceId?.message || ''}
                    >
                      {filteredInstances.map((instance: any) => (
                        <MenuItem
                          key={instance.id || instance.instanceId}
                          value={instance.instanceId || instance.id}
                        >
                          {instance.name || instance.instanceId} ({instance.phoneNumber || instance.phone || 'Connected'})
                        </MenuItem>
                      ))}
                    </TextField>
                  </Stack>

                  <TextField
                    fullWidth
                    type="datetime-local"
                    label="Schedule Send"
                    InputLabelProps={{ shrink: true }}
                    {...methods.register('scheduledAt')}
                    helperText="Leave empty to start processing immediately."
                  />

                  <Divider />

                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Message Content
                    </Typography>

                    <Stack direction="row" spacing={1} sx={{ mb: 1.5, flexWrap: 'wrap' }}>
                      <Button size="small" variant="outlined" onClick={() => handleAddVariable('name')}>
                        + Name
                      </Button>
                      <Button size="small" variant="outlined" onClick={() => handleAddVariable('phone')}>
                        + Phone
                      </Button>
                      <Button size="small" variant="outlined" onClick={() => handleAddVariable('email')}>
                        + Email
                      </Button>
                    </Stack>

                    <TextField
                      multiline
                      rows={6}
                      fullWidth
                      placeholder="Type your broadcast message here... Use {{variable}} for personalization."
                      {...methods.register('content', {
                        required: 'Message content is required',
                      })}
                      error={!!errors.content}
                      helperText={errors.content?.message || ''}
                    />
                  </Box>
                </Stack>
              </Card>

              <Card sx={{ p: 3 }}>
                <Stack
                  direction={{ xs: 'column', md: 'row' }}
                  spacing={2}
                  alignItems={{ xs: 'stretch', md: 'center' }}
                  justifyContent="space-between"
                  sx={{ mb: 2 }}
                >
                  <Box>
                    <Typography variant="h6">Audience Selection</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Select CRM contacts with valid phone numbers for this campaign.
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1}>
                    <Button variant="outlined" onClick={addAllVisibleRecipients} disabled={availableContacts.length === 0}>
                      Add Visible
                    </Button>
                    <Button variant="text" color="inherit" onClick={clearRecipients} disabled={selectedRecipients.length === 0}>
                      Clear
                    </Button>
                  </Stack>
                </Stack>

                <TextField
                  fullWidth
                  value={contactSearch}
                  onChange={(event) => setContactSearch(event.target.value)}
                  placeholder="Search contacts by name, email, or phone..."
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                    endAdornment: contactsLoading ? <CircularProgress size={18} /> : null,
                  }}
                />

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Available Contacts
                    </Typography>
                    <List disablePadding sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                      {availableContacts.slice(0, 12).map((contact: any) => (
                        <ListItem
                          key={contact.id || contact._id}
                          secondaryAction={
                            <Button size="small" variant="contained" onClick={() => addRecipient(contact)}>
                              Add
                            </Button>
                          }
                          sx={{ py: 1.5 }}
                        >
                          <Box sx={{ minWidth: 0, pr: 10 }}>
                            <Typography variant="subtitle2" noWrap>
                              {contact.fullName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {contact.phone}
                              {contact.email ? ` | ${contact.email}` : ''}
                            </Typography>
                          </Box>
                        </ListItem>
                      ))}

                      {!contactsLoading && availableContacts.length === 0 ? (
                        <ListItem sx={{ py: 3 }}>
                          <Typography variant="body2" color="text.secondary">
                            No more eligible contacts found for the current search.
                          </Typography>
                        </ListItem>
                      ) : null}
                    </List>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Selected Recipients
                    </Typography>
                    <List disablePadding sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                      {selectedRecipients.map((recipient) => (
                        <ListItem
                          key={recipient.contactId}
                          secondaryAction={
                            <IconButton edge="end" onClick={() => removeRecipient(recipient.contactId)}>
                              <Iconify icon="solar:trash-bin-trash-bold" />
                            </IconButton>
                          }
                          sx={{ py: 1.5 }}
                        >
                          <Box sx={{ minWidth: 0, pr: 8 }}>
                            <Typography variant="subtitle2" noWrap>
                              {recipient.fullName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {recipient.phone}
                              {recipient.email ? ` | ${recipient.email}` : ''}
                            </Typography>
                          </Box>
                        </ListItem>
                      ))}

                      {selectedRecipients.length === 0 ? (
                        <ListItem sx={{ py: 3 }}>
                          <Typography variant="body2" color="text.secondary">
                            No recipients selected yet.
                          </Typography>
                        </ListItem>
                      ) : null}
                    </List>
                  </Grid>
                </Grid>
              </Card>
            </Stack>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Campaign Summary
              </Typography>

              <Stack spacing={2}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Provider
                  </Typography>
                  <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
                    {values.provider}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Selected Account
                  </Typography>
                  <Typography variant="subtitle2">
                    {filteredInstances.find((instance: any) => (instance.instanceId || instance.id) === values.instanceId)
                      ?.name || 'Not selected'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Recipients
                  </Typography>
                  <Typography variant="subtitle2">{selectedRecipients.length}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Personalization
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" justifyContent="flex-end">
                    {['name', 'phone', 'email']
                      .filter((key) => values.content?.includes(`{{${key}}}`))
                      .map((key) => (
                        <Chip key={key} label={key} size="small" variant="outlined" />
                      ))}
                  </Stack>
                </Box>

                <Divider sx={{ borderStyle: 'dashed' }} />

                <Alert severity={selectedRecipients.length > 0 ? 'success' : 'info'}>
                  {selectedRecipients.length > 0
                    ? `This campaign will target ${selectedRecipients.length} CRM contact${selectedRecipients.length > 1 ? 's' : ''}.`
                    : 'Add recipients to make this broadcast ready to launch.'}
                </Alert>

                <Alert severity="info">
                  {values.scheduledAt
                    ? 'The campaign will stay scheduled until the selected send time.'
                    : 'The campaign will begin processing immediately after creation.'}
                </Alert>

                <LoadingButton
                  fullWidth
                  size="large"
                  type="submit"
                  variant="contained"
                  loading={isSubmitting}
                  sx={{ mt: 2 }}
                >
                  Launch Campaign
                </LoadingButton>
              </Stack>
            </Card>
          </Grid>
        </Grid>
      </form>
    </DashboardContent>
  );
}
