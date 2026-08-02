'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import {
  fetchContactById,
  fetchContactPets,
  fetchContactFiles,
  fetchContactTasks,
  fetchContactActivities,
  fetchContactShifts,
  fetchContactOrders,
  fetchContactProjects,
  updateContactThunk,
  clockInThunk,
  clockOutThunk,
  createPetThunk,
  createFileThunk,
  createTaskThunk,
  createActivityThunk,
  selectContacts,
} from 'src/store/slices/contact-slice';
import { fetchContactScore, selectScoring } from 'src/store/slices/scoring-slice';
import { fetchBillingInvoices, selectBilling } from 'src/store/slices/billing-slice';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import AvatarGroup from '@mui/material/AvatarGroup';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useContactRealtime } from 'src/hooks/use-contact-realtime';

import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { showToast } from 'src/components/toast';

import {
  TasksTab,
  ContactPetsTab,
  ContactFilesTab,
  ContactTimeline,
  ContactOrdersTab,
  ContactBillingTab,
  ContactOverviewTab,
  ContactProjectsTab,
  ContactWorkHistoryTab,
} from './contact-workspace-sections';

// ----------------------------------------------------------------------

type Props = {
  id: string;
  mode?: string;
};

export function ContactDetailsView({ id, mode = 'overview' }: Props) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const [currentTab, setCurrentTab] = useState(mode);
  const [editOpen, setEditOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editValues, setEditValues] = useState({
    fullName: '',
    email: '',
    phone: '',
    status: 'active',
  });

  const { activeUsers, notifyUpdate } = useContactRealtime(id, 'org-123'); // Org ID should be dynamic

  const contactState = useAppSelector(selectContacts);
  const scoringState = useAppSelector(selectScoring);
  const billingState = useAppSelector(selectBilling);

  const contact = contactState.currentContact.data;
  const contactLoading = contactState.currentContact.loading;
  const contactScore = scoringState.contactScores[id]?.data;

  const [invoicesPage, setInvoicesPage] = useState(0);
  const [invoicesPageSize, setInvoicesPageSize] = useState(5);

  const invoices = billingState.invoices;
  const invoicesLoading = billingState.invoices.loading;

  const odooOrders = contactState.currentContact.orders;
  const ordersLoading = false; // Add orders loading if needed

  const odooProjects = contactState.currentContact.projects;
  const projectsLoading = false;

  const pets = contactState.currentContact.pets;
  const petsLoading = false;

  const files = contactState.currentContact.files;
  const filesLoading = false;

  const tasks = contactState.currentContact.tasks;
  const tasksLoading = false;

  const activities = contactState.currentContact.activities;
  const activitiesLoading = false;

  const [shiftsPage, setShiftsPage] = useState(0);
  const [shiftsPageSize, setShiftsPageSize] = useState(5);

  const shifts = contactState.currentContact.shifts;
  const shiftsLoading = contactState.currentContact.shifts.loading;

  useEffect(() => {
    dispatch(fetchContactById(id));
    dispatch(fetchContactScore(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (currentTab === 'billing' || currentTab === 'invoices') {
      dispatch(fetchBillingInvoices({ contactId: id, page: invoicesPage + 1, pageSize: invoicesPageSize }));
    }
    if (currentTab === 'commerce') {
      dispatch(fetchContactOrders(id));
    }
    if (currentTab === 'projects') {
      dispatch(fetchContactProjects(id));
    }
    if (currentTab === 'pets') {
      dispatch(fetchContactPets(id));
    }
    if (currentTab === 'files') {
      dispatch(fetchContactFiles(id));
    }
    if (currentTab === 'tasks') {
      dispatch(fetchContactTasks(id));
    }
    if (currentTab === 'activity') {
      dispatch(fetchContactActivities(id));
    }
    if (currentTab === 'work-history') {
      dispatch(fetchContactShifts({ id, params: { page: shiftsPage + 1, pageSize: shiftsPageSize } }));
    }
  }, [dispatch, id, currentTab, invoicesPage, invoicesPageSize, shiftsPage, shiftsPageSize]);

  useEffect(() => {
    setCurrentTab(mode);
  }, [mode]);

  useEffect(() => {
    if (!contact) return;

    setEditValues({
      fullName: contact.fullName || '',
      email: contact.email || '',
      phone: contact.phone || '',
      status: contact.status || 'active',
    });
  }, [contact]);

  const handleChangeTab = useCallback((event: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
    router.push(paths.dashboard.contactView(id, newValue));
  }, [id, router]);

  const handleEditValueChange =
    (field: 'fullName' | 'email' | 'phone' | 'status') =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setEditValues((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  const handleSaveContact = async () => {
    try {
      setIsSaving(true);
      await dispatch(updateContactThunk({ id, data: editValues })).unwrap();
      notifyUpdate(editValues);
      dispatch(fetchContactById(id));
      setEditOpen(false);
      showToast({ message: 'Contact updated successfully.', severity: 'success' });
    } catch (error) {
      const message = typeof error === 'string' ? error : 'Failed to update contact';
      showToast({ message, severity: 'warning' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClockIn = async () => {
    try {
      await dispatch(clockInThunk(id)).unwrap();
      dispatch(fetchContactShifts({ id, params: { page: shiftsPage + 1, pageSize: shiftsPageSize } }));
      showToast({ message: 'Clocked in successfully' });
    } catch (error) {
      showToast({ message: typeof error === 'string' ? error : 'Failed to clock in', severity: 'warning' });
    }
  };

  const handleClockOut = async (shiftId: string) => {
    try {
      await dispatch(clockOutThunk(shiftId)).unwrap();
      dispatch(fetchContactShifts({ id, params: { page: shiftsPage + 1, pageSize: shiftsPageSize } }));
      showToast({ message: 'Clocked out successfully' });
    } catch (error) {
      showToast({ message: typeof error === 'string' ? error : 'Failed to clock out', severity: 'warning' });
    }
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 'overview':
        return <ContactOverviewTab contact={contact} />;
      case 'billing':
      case 'invoices':
        return (
          <ContactBillingTab 
            invoices={invoices} 
            loading={invoicesLoading} 
            contactId={id} 
            onPageChange={(page: number, size: number) => {
              setInvoicesPage(page);
              setInvoicesPageSize(size);
            }}
          />
        );
      case 'work-history':
        return (
          <ContactWorkHistoryTab 
            shifts={shifts} 
            loading={shiftsLoading} 
            onClockIn={handleClockIn}
            onClockOut={handleClockOut}
            onPageChange={(page: number, size: number) => {
              setShiftsPage(page);
              setShiftsPageSize(size);
            }}
          />
        );
      case 'pets':
        return <ContactPetsTab pets={pets} loading={petsLoading} contactId={id} />;
      case 'files':
        return <ContactFilesTab files={files} loading={filesLoading} contactId={id} />;
      case 'activity':
        return (
          <ContactTimeline 
            activities={activities} 
            loading={activitiesLoading} 
            contactId={id}
          />
        );
      case 'commerce':
        return <ContactOrdersTab orders={odooOrders} loading={ordersLoading} />;
      case 'projects':
        return <ContactProjectsTab projects={odooProjects} loading={projectsLoading} />;
      case 'tasks':
        return <TasksTab tasks={tasks} loading={tasksLoading} contactId={id} />;
      default:
        return <ContactOverviewTab contact={contact} />;
    }
  };

  if (contactLoading && !contact) {
    return <ContactSkeleton />;
  }

  if (!contact) {
    return <Typography variant="h5">Contact not found</Typography>;
  }

  const isEmployee = contact?.contactType?.includes('Employee');
  const isClient = contact?.contactType?.includes('Member');

  return (
    <DashboardContent maxWidth="xl">
      <Box sx={{ mb: 5, display: 'flex', alignItems: 'center' }}>
        <Button
          onClick={() => router.push(paths.dashboard.contacts)}
          startIcon={<Iconify icon="solar:arrow-left-bold" />}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" sx={{ flexGrow: 1 }}>{isEmployee ? 'Employee' : 'Contact'} Profile: {contact.fullName}</Typography>
        
        {activeUsers.length > 0 && (
          <AvatarGroup max={3} sx={{ mr: 2 }}>
            {activeUsers.map((user) => (
              <Tooltip key={user.userId} title={`${user.userName} is ${user.action}`}>
                <Avatar 
                  alt={user.userName} 
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    border: (theme) => `2px solid ${user.action === 'editing' ? theme.palette.error.main : theme.palette.success.main}` 
                  }}
                >
                  {user.userName.charAt(0)}
                </Avatar>
              </Tooltip>
            ))}
          </AvatarGroup>
        )}
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Avatar
              src={contact.photo}
              alt={contact.fullName}
              sx={{ width: 120, height: 120, mx: 'auto', mb: 3, border: (theme) => `4px solid ${theme.palette.background.neutral}` }}
            >
              {contact.fullName.charAt(0).toUpperCase()}
            </Avatar>

            <Typography variant="h6">{contact.fullName}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              {contact.email || 'No email on file'}
            </Typography>

            <Stack direction="row" justifyContent="center" spacing={1} sx={{ mb: 3 }}>
              <Label color="success" variant="soft">
                {contact.status || 'active'}
              </Label>
              <Label color="info" variant="soft">
                {contact.contactType?.[0] || 'Member'}
              </Label>
              <Label color={(Number(contactScore?.score || 0) >= 60 ? 'warning' : 'default') as any} variant="soft">
                Score {Number(contactScore?.score || 0)}
              </Label>
            </Stack>

            <Divider sx={{ borderStyle: 'dashed', my: 3 }} />

            <Stack spacing={2} sx={{ textAlign: 'left' }}>
              <ProfileInfoItem icon="solar:phone-bold" text={contact.phone || 'No phone'} />
              <ProfileInfoItem icon="solar:map-point-bold" text="Location Specified" />
              <ProfileInfoItem icon="solar:calendar-bold" text={`Joined ${new Date(contact.createdAt).toLocaleDateString()}`} />
            </Stack>

            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={() => setEditOpen(true)}
              sx={{ mt: 3 }}
            >
              Edit Profile
            </Button>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <Tabs
              value={currentTab}
              onChange={handleChangeTab}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                px: 3,
                bgcolor: 'background.neutral',
              }}
            >
              <Tab label="Overview" value="overview" />
              <Tab label="Billing" value="billing" />
              {isEmployee && <Tab label="Work History" value="work-history" />}
              {isClient && <Tab label="Pets" value="pets" />}
              <Tab label="Files" value="files" />
              <Tab label="Activity" value="activity" />
              <Tab label="Commerce" value="commerce" />
              <Tab label="Projects" value="projects" />
              <Tab label="Tasks" value="tasks" />
            </Tabs>

            <Box sx={{ p: 3 }}>
               {renderTabContent()}
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Dialog fullWidth maxWidth="sm" open={editOpen} onClose={() => setEditOpen(false)}>
        <DialogTitle>Edit Contact</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <TextField label="Full Name" value={editValues.fullName} onChange={handleEditValueChange('fullName')} />
            <TextField label="Email" value={editValues.email} onChange={handleEditValueChange('email')} />
            <TextField label="Phone" value={editValues.phone} onChange={handleEditValueChange('phone')} />
            <TextField label="Status" value={editValues.status} onChange={handleEditValueChange('status')} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setEditOpen(false)}>Cancel</Button>
          <LoadingButton variant="contained" loading={isSaving} onClick={handleSaveContact}>Save changes</LoadingButton>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}

function ProfileInfoItem({ icon, text }: any) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Iconify icon={icon} width={20} sx={{ color: 'text.secondary' }} />
      <Typography variant="body2">{text}</Typography>
    </Stack>
  );
}

function ContactSkeleton() {
  return (
    <DashboardContent maxWidth="xl">
      <Stack direction="row" alignItems="center" sx={{ mb: 5 }}>
        <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
        <Skeleton variant="text" width={300} height={40} />
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 4 }}>
            <Skeleton variant="circular" width={120} height={120} sx={{ mx: 'auto', mb: 3 }} />
            <Skeleton variant="text" width="60%" sx={{ mx: 'auto', mb: 1 }} />
            <Skeleton variant="text" width="40%" sx={{ mx: 'auto', mb: 3 }} />
            <Stack spacing={2}>
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="text" width="100%" />
            </Stack>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card>
            <Skeleton variant="rectangular" height={48} />
            <Box sx={{ p: 3 }}>
              <Skeleton variant="rectangular" height={400} />
            </Box>
          </Card>
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
