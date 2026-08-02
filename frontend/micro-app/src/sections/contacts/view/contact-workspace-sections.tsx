import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { 
  fetchCompanies, 
  unlinkCompanyThunk, 
  linkCompanyThunk,
  createPetThunk,
  updatePetThunk,
  deletePetThunk,
  createFileThunk,
  deleteFileThunk,
  createTaskThunk,
  updateTaskThunk,
  deleteTaskThunk,
  createActivityThunk,
  fetchContactById,
  fetchContactPets,
  fetchContactFiles,
  fetchContactTasks,
  fetchContactActivities,
  selectContacts 
} from 'src/store/slices/contact-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Timeline from '@mui/lab/Timeline';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Select from '@mui/material/Select';
import Divider from '@mui/material/Divider';
import Popover from '@mui/material/Popover';
import TableRow from '@mui/material/TableRow';
import Skeleton from '@mui/material/Skeleton';
import MenuItem from '@mui/material/MenuItem';
import TimelineDot from '@mui/lab/TimelineDot';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import TimelineItem from '@mui/lab/TimelineItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import TimelineContent from '@mui/lab/TimelineContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import LinearProgress from '@mui/material/LinearProgress';
import TableContainer from '@mui/material/TableContainer';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TablePagination from '@mui/material/TablePagination';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';

import { fCurrency } from 'src/utils/format-number';

import { contactService } from 'src/services/contact-service';
import { billingService } from 'src/services/billing-service';

import { Label } from 'src/components/label';
import { showToast } from 'src/components/toast';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

export function ContactOverviewTab({ contact }: any) {
  const dispatch = useAppDispatch();
  const companyDialog = useBoolean();
  const insights = contact?.insights || {
    totalSpent: 0,
    engagement: 0,
    lastActive: contact?.createdAt,
    totalTasks: 0,
    completedTasks: 0
  };

  return (
    <Stack spacing={3}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Stack spacing={3}>
            <Card sx={{ p: 3, border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Personal Information</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">GENDER</Typography>
                  <Typography variant="subtitle2">{contact.gender || 'Not specified'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">BIRTHDAY</Typography>
                  <Typography variant="subtitle2">{contact.dob || 'Not specified'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">ADDRESS</Typography>
                  <Typography variant="subtitle2">{contact.address || 'No address provided'}</Typography>
                </Grid>
              </Grid>
            </Card>

            <Card sx={{ p: 3, border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6">Company Relationship</Typography>
                {contact.companyId ? (
                   <Button 
                    size="small" 
                    color="error" 
                    variant="soft" 
                    onClick={async () => {
                      if (confirm('Archive this contact relationship? (Unlinks from company)')) {
                        try {
                          await dispatch(unlinkCompanyThunk(contact.id)).unwrap();
                          showToast({ message: 'Relationship archived' });
                          dispatch(fetchContactById(contact.id));
                        } catch (e: any) {
                          showToast({ message: e.message, severity: 'error' });
                        }
                      }
                    }}
                  >
                    Archive Link
                  </Button>
                ) : (
                  <Button size="small" variant="soft" color="primary" onClick={() => companyDialog.onTrue()}>
                    Link Company
                  </Button>
                )}
              </Stack>

              {contact.companyId ? (
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main', borderRadius: 1 }}>
                    <Iconify icon="solar:buildings-bold" />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2">{contact.companyName}</Typography>
                    <Typography variant="caption" color="text.secondary">Linked Odoo Partner ID: {contact.companyId}</Typography>
                  </Box>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  This contact is not currently associated with a company in Odoo.
                </Typography>
              )}
            </Card>

            <Card sx={{ p: 3, border: (theme) => `1px solid ${theme.palette.divider}`, boxShadow: 'none' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Membership & Engagement</Typography>
              <Stack direction="row" spacing={4}>
                <Box>
                  <Typography variant="caption" color="text.secondary">TOTAL SPENT</Typography>
                  <Typography variant="h5" color="primary">${insights.totalSpent?.toFixed(2)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">TASKS COMPLETED</Typography>
                  <Typography variant="h5" color="success">{insights.completedTasks} / {insights.totalTasks}</Typography>
                </Box>
              </Stack>
            </Card>
          </Stack>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={3}>
            <Card sx={{ p: 3, bgcolor: 'background.neutral', border: 0 }}>
              <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Iconify icon="solar:chart-square-bold" sx={{ mr: 1, color: 'primary.main' }} />
                Smart Insights
              </Typography>
              
              <Stack spacing={2.5}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                    LIFETIME VALUE (LTV)
                  </Typography>
                  <Typography variant="h6">${insights.totalSpent?.toLocaleString()}</Typography>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                    ENGAGEMENT LEVEL
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ flexGrow: 1, height: 6, bgcolor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                      <Box sx={{ width: `${insights.engagement}%`, height: '100%', bgcolor: insights.engagement > 50 ? 'success.main' : 'warning.main' }} />
                    </Box>
                    <Typography variant="subtitle2">{insights.engagement}%</Typography>
                  </Stack>
                </Box>

                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                    ODOO SYNC STATUS
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Iconify icon="solar:check-circle-bold" sx={{ color: 'success.main' }} />
                    <Typography variant="body2">Synced with Odoo v18</Typography>
                  </Stack>
                </Box>

                <Divider sx={{ borderStyle: 'dashed' }} />

                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                    LAST ACTIVE
                  </Typography>
                  <Typography variant="body2">{insights.lastActive ? new Date(insights.lastActive).toLocaleString() : 'Never'}</Typography>
                </Box>
              </Stack>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <Dialog open={companyDialog.value} onClose={companyDialog.onFalse} fullWidth maxWidth="xs">
        <DialogTitle>Link to Company</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              Search for an existing Odoo company to link this contact to.
            </Typography>
            <CompanySelector onSelect={async (companyId) => {
              try {
                await dispatch(linkCompanyThunk({ id: contact.id, companyId })).unwrap();
                showToast({ message: 'Company linked' });
                dispatch(fetchContactById(contact.id));
                companyDialog.onFalse();
              } catch (e: any) {
                showToast({ message: e.message, severity: 'error' });
              }
            }} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={companyDialog.onFalse}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

export function ContactBillingTab({ invoices: invoicesData, loading, contactId, totalInvoices, onPageChange }: any) {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  const invoices = Array.isArray(invoicesData) ? invoicesData : invoicesData?.data || [];
  const totalItems = totalInvoices ?? invoicesData?.total ?? invoices.length;

  const handleDownload = async (id: string, name: string) => {
    try {
      const blob = await billingService.downloadInvoice(id);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_${name}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed', error);
    }
  };

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
    if (onPageChange) onPageChange(newPage, pageSize);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);
    setPageSize(newSize);
    setPage(0);
    if (onPageChange) onPageChange(0, newSize);
  };

  // Use Skeleton while loading if no data is present to prevent blinking
  if (loading && (!invoices || invoices.length === 0)) {
    return (
      <Stack spacing={3}>
        <Skeleton variant="rectangular" height={40} width={200} />
        <Skeleton variant="rectangular" height={400} />
      </Stack>
    );
  }

  return (
    <Stack spacing={3} sx={{ position: 'relative' }}>
      {loading && <LinearProgress sx={{ position: 'absolute', top: -10, left: 0, right: 0, height: 2, borderRadius: 1 }} />}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Invoices & Payments</Typography>
        <Button 
          variant="contained" 
          size="small" 
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={() => router.push(`${paths.dashboard.invoiceNew  }?customer=${contactId}`)}
        >
          New Invoice
        </Button>
      </Stack>

      <TableContainer sx={{ border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 1.5 }}>
        <Scrollbar>
          <Table sx={{ minWidth: 640 }}>
            <TableHead>
              <TableRow>
                <TableCell>Invoice No.</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(!invoices || invoices.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No invoices found for this contact.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {invoices?.map((inv: any) => (
                <TableRow key={inv.id} hover>
                  <TableCell>
                    <Typography variant="subtitle2">{inv.no || inv.invoiceNo || inv.number}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{new Date(inv.createdAt || inv.dueDate).toLocaleDateString()}</Typography>
                  </TableCell>
                  <TableCell>{fCurrency(inv.totalDue)}</TableCell>
                  <TableCell>
                    <Label
                      variant="soft"
                      color={
                        (inv.status === 'paid' && 'success') ||
                        (inv.status === 'overdue' && 'error') ||
                        'warning'
                      }
                    >
                      {inv.status}
                    </Label>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => router.push(paths.dashboard.invoiceDetails(inv.id))}>
                      <Iconify icon="solar:eye-bold" />
                    </IconButton>
                    <IconButton color="info" onClick={() => handleDownload(inv.id, inv.no || inv.invoiceNo || inv.number)}>
                      <Iconify icon="solar:download-bold" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Scrollbar>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={totalItems}
        rowsPerPage={pageSize}
        page={page}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </Stack>
  );
}

export function ContactWorkHistoryTab({ shifts: shiftsData, loading, onClockIn, onClockOut, totalShifts, onPageChange }: any) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);

  const shifts = Array.isArray(shiftsData) ? shiftsData : shiftsData?.data || [];
  const totalItems = totalShifts ?? shiftsData?.total ?? shifts.length;

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
    if (onPageChange) onPageChange(newPage, pageSize);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);
    setPageSize(newSize);
    setPage(0);
    if (onPageChange) onPageChange(0, newSize);
  };

  if (loading && (!shifts || shifts.length === 0)) {
    return (
      <Stack spacing={3}>
        <Skeleton variant="rectangular" height={40} width={200} />
        <Stack spacing={2}>
          {[1, 2, 3].map((i) => <Skeleton key={i} variant="rectangular" height={60} />)}
        </Stack>
      </Stack>
    );
  }

  const activeShift = shifts?.find((s: any) => !s.clockOut);

  return (
    <Stack spacing={3} sx={{ position: 'relative' }}>
      {loading && <LinearProgress sx={{ position: 'absolute', top: -10, left: 0, right: 0, height: 2, borderRadius: 1 }} />}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Work History & Timecards</Typography>
        <LoadingButton 
          variant="contained" 
          size="small" 
          color={activeShift ? "error" : "primary"}
          onClick={activeShift ? () => onClockOut(activeShift.id) : onClockIn}
        >
          {activeShift ? "Clock Out" : "Clock In"}
        </LoadingButton>
      </Stack>
      <Stack spacing={2}>
        {(!shifts || shifts.length === 0) && (
          <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 5 }}>
            No work history recorded yet.
          </Typography>
        )}
        {shifts?.map((shift: any) => (
          <Box key={shift.id} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.neutral', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="subtitle2">{new Date(shift.clockIn).toLocaleDateString()}</Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(shift.clockIn).toLocaleTimeString()} - {shift.clockOut ? new Date(shift.clockOut).toLocaleTimeString() : 'In Progress'}
              </Typography>
            </Box>
            <Stack direction="row" spacing={3} alignItems="center">
              <Typography variant="subtitle2">
                {shift.clockOut 
                  ? `${Math.round((new Date(shift.clockOut).getTime() - new Date(shift.clockIn).getTime()) / 3600000)}h` 
                  : '--'}
              </Typography>
              <Label color={shift.status === 'Approved' ? 'success' : 'warning'}>{shift.clockOut ? shift.status : 'Active'}</Label>
            </Stack>
          </Box>
        ))}
      </Stack>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={totalItems}
        rowsPerPage={pageSize}
        page={page}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />
    </Stack>
  );
}

export function ContactPetsTab({ pets, loading, refetch, contactId }: any) {
  const dispatch = useAppDispatch();
  const dialog = useBoolean();
  const deleteDialog = useBoolean();
  const [currentPet, setCurrentPet] = useState<any>(null);
  const [petToDelete, setPetToDelete] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formValues, setFormValues] = useState({
    name: '',
    breed: '',
    age: '',
    type: 'Dog',
    notes: '',
  });

  const handleOpenDialog = (pet?: any) => {
    if (pet) {
      setCurrentPet(pet);
      setFormValues({
        name: pet.name,
        breed: pet.breed,
        age: pet.age || '',
        type: pet.type || 'Dog',
        notes: pet.notes || '',
      });
    } else {
      setCurrentPet(null);
      setFormValues({
        name: '',
        breed: '',
        age: '',
        type: 'Dog',
        notes: '',
      });
    }
    dialog.onTrue();
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (currentPet) {
        await dispatch(updatePetThunk({ id: currentPet.id, data: formValues })).unwrap();
        showToast({ message: 'Pet updated successfully' });
      } else {
        await dispatch(createPetThunk({ contactId, data: formValues })).unwrap();
        showToast({ message: 'Pet registered successfully' });
      }
      dispatch(fetchContactPets(contactId));
      dialog.onFalse();
    } catch (error: any) {
      showToast({ message: error || 'Failed to save pet', severity: 'warning' });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = (pet: any) => {
    setPetToDelete(pet);
    deleteDialog.onTrue();
  };

  const handleDelete = async () => {
    try {
      await dispatch(deletePetThunk(petToDelete.id)).unwrap();
      showToast({ message: 'Pet removed' });
      dispatch(fetchContactPets(contactId));
      deleteDialog.onFalse();
    } catch (error: any) {
      showToast({ message: error || 'Failed to remove pet', severity: 'warning' });
    }
  };

  if (loading && (!pets || pets.length === 0)) {
    return (
      <Stack spacing={3}>
        <Skeleton variant="rectangular" height={40} width={200} />
        <Grid container spacing={2}>
          {[1, 2].map((i) => (
            <Grid item xs={12} sm={6} key={i}>
              <Skeleton variant="rectangular" height={120} />
            </Grid>
          ))}
        </Grid>
      </Stack>
    );
  }

  return (
    <Stack spacing={3} sx={{ position: 'relative' }}>
      {loading && <LinearProgress sx={{ position: 'absolute', top: -10, left: 0, right: 0, height: 2, borderRadius: 1 }} />}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Registered Pets</Typography>
        <Button 
          variant="contained" 
          size="small" 
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={() => handleOpenDialog()}
        >
          Add Pet
        </Button>
      </Stack>

      <Grid container spacing={2}>
        {(!pets || pets.length === 0) && (
          <Grid item xs={12}>
            <Box sx={{ py: 10, textAlign: 'center', bgcolor: 'background.neutral', borderRadius: 2 }}>
              <Iconify icon="solar:cat-bold" width={48} sx={{ color: 'text.disabled', mb: 2 }} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                No pets registered for this contact.
              </Typography>
            </Box>
          </Grid>
        )}
        {pets?.map((pet: any) => (
          <Grid item xs={12} sm={6} key={pet.id}>
            <PetCard 
              pet={pet} 
              onEdit={() => handleOpenDialog(pet)} 
              onDelete={() => confirmDelete(pet)} 
            />
          </Grid>
        ))}
      </Grid>

      <Dialog open={dialog.value} onClose={dialog.onFalse} fullWidth maxWidth="xs">
        <DialogTitle>{currentPet ? 'Edit Pet' : 'Register New Pet'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField 
              label="Pet Name" 
              fullWidth 
              value={formValues.name} 
              onChange={(e) => setFormValues({...formValues, name: e.target.value})} 
            />
            <FormControl fullWidth>
              <InputLabel>Pet Type</InputLabel>
              <Select 
                label="Pet Type"
                value={formValues.type}
                onChange={(e) => setFormValues({...formValues, type: e.target.value})}
              >
                <MenuItem value="Dog">Dog</MenuItem>
                <MenuItem value="Cat">Cat</MenuItem>
                <MenuItem value="Bird">Bird</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField 
              label="Breed" 
              fullWidth 
              value={formValues.breed} 
              onChange={(e) => setFormValues({...formValues, breed: e.target.value})} 
            />
            <TextField 
              label="Age" 
              fullWidth 
              value={formValues.age} 
              onChange={(e) => setFormValues({...formValues, age: e.target.value})} 
            />
            <TextField 
              label="Notes" 
              fullWidth 
              multiline 
              rows={3}
              value={formValues.notes} 
              onChange={(e) => setFormValues({...formValues, notes: e.target.value})} 
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={dialog.onFalse} variant="outlined">Cancel</Button>
          <LoadingButton loading={isSaving} variant="contained" onClick={handleSave}>Save</LoadingButton>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.value} onClose={deleteDialog.onFalse}>
        <DialogTitle>Remove Pet?</DialogTitle>
        <DialogContent>Are you sure you want to remove {petToDelete?.name} from this contact?</DialogContent>
        <DialogActions>
          <Button onClick={deleteDialog.onFalse}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Remove</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

function PetCard({ pet, onEdit, onDelete }: any) {
  const [open, setOpen] = useState<HTMLButtonElement | null>(null);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setOpen(event.currentTarget);
  };

  const handleClose = () => {
    setOpen(null);
  };

  return (
    <Card sx={{ p: 2, display: 'flex', alignItems: 'center', border: (theme) => `1px solid ${theme.palette.divider}`, position: 'relative' }}>
      <Avatar 
        sx={{ 
          width: 56, 
          height: 56, 
          mr: 2, 
          bgcolor: pet.type === 'Dog' ? 'primary.lighter' : 'secondary.lighter',
          color: pet.type === 'Dog' ? 'primary.dark' : 'secondary.dark'
        }}
      >
        <Iconify icon={pet.type === 'Dog' ? 'solar:dog-bold' : pet.type === 'Cat' ? 'solar:cat-bold' : 'solar:cat-bold'} />
      </Avatar>
      
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="subtitle1">{pet.name}</Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {pet.breed} • {pet.age || 'N/A'} years old
        </Typography>
        {pet.notes && (
           <Typography variant="caption" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            "{pet.notes.slice(0, 30)}..."
           </Typography>
        )}
      </Box>

      <IconButton onClick={handleOpen}>
        <Iconify icon="eva:more-vertical-fill" />
      </IconButton>

      <Popover
        open={Boolean(open)}
        anchorEl={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Stack sx={{ p: 1 }}>
          <MenuItem onClick={() => { onEdit(); handleClose(); }}>
            <Iconify icon="solar:pen-bold" sx={{ mr: 1 }} /> Edit
          </MenuItem>
          <MenuItem onClick={() => { onDelete(); handleClose(); }} sx={{ color: 'error.main' }}>
            <Iconify icon="solar:trash-bin-trash-bold" sx={{ mr: 1 }} /> Remove
          </MenuItem>
        </Stack>
      </Popover>
    </Card>
  );
}

export function ContactFilesTab({ files, loading, refetch, contactId }: any) {
  const dispatch = useAppDispatch();
  const dialog = useBoolean();
  const deleteDialog = useBoolean();
  const [fileToDelete, setFileToDelete] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleOpenDialog = () => {
    setSelectedFile(null);
    dialog.onTrue();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      setIsUploading(true);
      // In a real app, we'd upload to S3 and get a URL. 
      // For now, we simulate by sending file metadata.
      const newFile = {
        name: selectedFile.name,
        size: `${(selectedFile.size / 1024).toFixed(1)} KB`,
        type: selectedFile.type,
        url: '#', // Placeholder
      };
      await dispatch(createFileThunk({ contactId, data: newFile })).unwrap();
      showToast({ message: 'File uploaded successfully' });
      dispatch(fetchContactFiles(contactId));
      dialog.onFalse();
    } catch (error: any) {
      showToast({ message: error || 'Upload failed', severity: 'warning' });
    } finally {
      setIsUploading(false);
    }
  };

  const confirmDelete = (file: any) => {
    setFileToDelete(file);
    deleteDialog.onTrue();
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteFileThunk(fileToDelete.id)).unwrap();
      showToast({ message: 'File removed' });
      dispatch(fetchContactFiles(contactId));
      deleteDialog.onFalse();
    } catch (error: any) {
      showToast({ message: error || 'Failed to remove file', severity: 'warning' });
    }
  };

  const getFileIcon = (type: string) => {
    if (type?.includes('pdf')) return 'solar:file-text-bold';
    if (type?.includes('image')) return 'solar:gallery-bold';
    if (type?.includes('word') || type?.includes('officedocument')) return 'solar:document-bold';
    return 'solar:document-bold';
  };

  if (loading && (!files || files.length === 0)) {
    return (
      <Stack spacing={3}>
        <Skeleton variant="rectangular" height={40} width={200} />
        <Stack spacing={2}>
          {[1, 2, 3].map((i) => <Skeleton key={i} variant="rectangular" height={60} />)}
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack spacing={3} sx={{ position: 'relative' }}>
      {loading && <LinearProgress sx={{ position: 'absolute', top: -10, left: 0, right: 0, height: 2, borderRadius: 1 }} />}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Shared Documents</Typography>
        <Button 
          variant="contained" 
          size="small" 
          startIcon={<Iconify icon="solar:upload-bold" />}
          onClick={handleOpenDialog}
        >
          Upload File
        </Button>
      </Stack>
      
      <Stack spacing={1}>
        {(!files || files.length === 0) && (
          <Box sx={{ py: 10, textAlign: 'center', bgcolor: 'background.neutral', borderRadius: 2 }}>
            <Iconify icon="solar:cloud-upload-bold" width={48} sx={{ color: 'text.disabled', mb: 2 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              No files uploaded yet.
            </Typography>
          </Box>
        )}
        {files?.map((file: any) => (
          <Box 
            key={file.id} 
            sx={{ 
              p: 2, 
              display: 'flex', 
              alignItems: 'center', 
              borderRadius: 1.5,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              '&:hover': { bgcolor: 'background.neutral' }
            }}
          >
            <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main', mr: 2 }}>
              <Iconify icon={getFileIcon(file.type)} />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle2">{file.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {file.size} • Uploaded {new Date(file.createdAt).toLocaleDateString()}
              </Typography>
            </Box>
            <Stack direction="row">
              <IconButton size="small" color="info"><Iconify icon="solar:download-bold" /></IconButton>
              <IconButton size="small" color="error" onClick={() => confirmDelete(file)}><Iconify icon="solar:trash-bin-trash-bold" /></IconButton>
            </Stack>
          </Box>
        ))}
      </Stack>

      <Dialog open={dialog.value} onClose={dialog.onFalse} fullWidth maxWidth="sm">
        <DialogTitle sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Upload Documents</Typography>
          <IconButton onClick={dialog.onFalse} size="small">
            <Iconify icon="mingcute:close-line" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, pt: 0, overflow: 'hidden' }}>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
            Select files from your computer or drag and drop them here.
          </Typography>

          {!selectedFile ? (
            <Box 
              component="label"
              sx={{ 
                p: 5, 
                display: 'block',
                border: (theme) => `2px dashed ${theme.palette.divider}`, 
                borderRadius: 2,
                textAlign: 'center',
                cursor: 'pointer',
                transition: (theme) => theme.transitions.create(['background-color', 'border-color']),
                bgcolor: 'background.neutral',
                '&:hover': { 
                  bgcolor: (theme) => theme.palette.action.hover,
                  borderColor: 'primary.main'
                }
              }}
            >
              <input type="file" hidden onChange={handleFileChange} />
              <Stack spacing={2} alignItems="center" justifyContent="center">
                <Box 
                  sx={{ 
                    width: 64, 
                    height: 64, 
                    borderRadius: '50%', 
                    bgcolor: 'primary.lighter', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: 'primary.main'
                  }}
                >
                  <Iconify icon="solar:cloud-upload-bold" width={32} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" gutterBottom>Click to upload</Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
                    Maximum file size: 10MB
                  </Typography>
                </Box>
              </Stack>
            </Box>
          ) : (
            <Stack spacing={2}>
              <Box 
                sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: 'background.neutral',
                  display: 'flex',
                  alignItems: 'center',
                  border: (theme) => `1px solid ${theme.palette.divider}`
                }}
              >
                {selectedFile.type.includes('image') ? (
                  <Box 
                    component="img"
                    src={URL.createObjectURL(selectedFile)}
                    sx={{ width: 48, height: 48, borderRadius: 1, objectFit: 'cover', mr: 2 }}
                  />
                ) : (
                  <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main', mr: 2, borderRadius: 1 }}>
                    <Iconify icon={getFileIcon(selectedFile.type)} />
                  </Avatar>
                )}
                
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" noWrap>{selectedFile.name}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </Typography>
                </Box>

                <IconButton size="small" onClick={() => setSelectedFile(null)}>
                  <Iconify icon="solar:close-circle-bold" sx={{ color: 'text.disabled' }} />
                </IconButton>
              </Box>

              {isUploading && (
                <Stack spacing={1}>
                  <LinearProgress variant="indeterminate" sx={{ borderRadius: 1, height: 6 }} />
                  <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                    Uploading...
                  </Typography>
                </Stack>
              )}
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button fullWidth variant="outlined" color="inherit" onClick={dialog.onFalse}>
            Cancel
          </Button>
          <LoadingButton 
            fullWidth
            disabled={!selectedFile} 
            loading={isUploading} 
            variant="contained" 
            onClick={handleUpload}
          >
            Confirm Upload
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.value} onClose={deleteDialog.onFalse}>
        <DialogTitle>Delete File?</DialogTitle>
        <DialogContent>Are you sure you want to permanently delete {fileToDelete?.name}?</DialogContent>
        <DialogActions>
          <Button onClick={deleteDialog.onFalse}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

export function ContactTimeline({ activities, loading, refetch, contactId }: any) {
  const dispatch = useAppDispatch();
  const dialog = useBoolean();
  const deleteDialog = useBoolean();
  const [currentActivity, setCurrentActivity] = useState<any>(null);
  const [activityToDelete, setActivityToDelete] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formValues, setFormValues] = useState({
    type: 'note',
    title: '',
    content: '',
  });

  const handleOpenDialog = (type: string, activity?: any) => {
    if (activity) {
      setCurrentActivity(activity);
      setFormValues({
        type: activity.type,
        title: activity.title,
        content: activity.content,
      });
    } else {
      setCurrentActivity(null);
      setFormValues({
        type,
        title: type === 'note' ? 'New Note' : type === 'call' ? 'Call Log' : type === 'email' ? 'Email Follow-up' : 'Meeting Summary',
        content: '',
      });
    }
    dialog.onTrue();
  };

  const handleSave = async () => {
    if (!formValues.content) return;
    try {
      setIsSaving(true);
      
      const iconMap: Record<string, string> = {
        note: 'solar:pen-new-square-bold',
        call: 'solar:phone-bold',
        email: 'solar:letter-bold',
        meeting: 'solar:users-group-rounded-bold',
      };

      const colorMap: Record<string, string> = {
        note: 'info',
        call: 'success',
        email: 'warning',
        meeting: 'secondary',
      };

      if (currentActivity) {
        await dispatch(updateActivityThunk({ 
          id: currentActivity.id, 
          data: {
            ...formValues,
            icon: iconMap[formValues.type],
            color: colorMap[formValues.type],
          }
        })).unwrap();
        showToast({ message: 'Activity updated successfully' });
      } else {
        await dispatch(createActivityThunk({ 
          contactId, 
          data: {
            ...formValues,
            icon: iconMap[formValues.type],
            color: colorMap[formValues.type],
          }
        })).unwrap();
        showToast({ message: 'Activity logged successfully' });
      }
      dispatch(fetchContactActivities(contactId));
      dialog.onFalse();
    } catch (error: any) {
      showToast({ message: error || 'Failed to save activity', severity: 'warning' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteActivityThunk(activityToDelete.id)).unwrap();
      showToast({ message: 'Activity removed' });
      dispatch(fetchContactActivities(contactId));
      deleteDialog.onFalse();
    } catch (error: any) {
      showToast({ message: error || 'Failed to remove activity', severity: 'warning' });
    }
  };
  const confirmDelete = (activity: any) => {
    setActivityToDelete(activity);
    deleteDialog.onTrue();
  };

  if (loading && (!activities || activities.length === 0)) {
    return (
      <Stack spacing={3}>
        <Skeleton variant="rectangular" height={40} width={200} />
        <Stack spacing={3} sx={{ mt: 3 }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} variant="rectangular" height={100} />)}
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack spacing={3} sx={{ position: 'relative' }}>
      {loading && <LinearProgress sx={{ position: 'absolute', top: -10, left: 0, right: 0, height: 2, borderRadius: 1 }} />}
      
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Activity Timeline</Typography>
        <Stack direction="row" spacing={1}>
          <Button 
            variant="soft" 
            color="info" 
            size="small" 
            startIcon={<Iconify icon="solar:pen-new-square-bold" />}
            onClick={() => handleOpenDialog('note')}
          >
            Note
          </Button>
          <Button 
            variant="soft" 
            color="success" 
            size="small" 
            startIcon={<Iconify icon="solar:phone-bold" />}
            onClick={() => handleOpenDialog('call')}
          >
            Call
          </Button>
          <Button 
            variant="soft" 
            color="secondary" 
            size="small" 
            startIcon={<Iconify icon="solar:users-group-rounded-bold" />}
            onClick={() => handleOpenDialog('meeting')}
          >
            Meeting
          </Button>
        </Stack>
      </Stack>

      <Timeline sx={{ p: 0, m: 0 }}>
        {(!activities || activities.length === 0) && (
          <Box sx={{ py: 10, textAlign: 'center', bgcolor: 'background.neutral', borderRadius: 2 }}>
            <Iconify icon="solar:history-bold" width={48} sx={{ color: 'text.disabled', mb: 2 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              No activities recorded yet.
            </Typography>
          </Box>
        )}
        {(activities || []).map((item: any, index: number) => (
          <TimelineItem key={item.id} sx={{ '&:before': { display: 'none' } }}>
            <TimelineSeparator>
              <TimelineDot color={item.color as any}>
                <Iconify icon={item.icon || 'solar:document-bold'} width={16} />
              </TimelineDot>
              {index !== activities.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent sx={{ pb: 3 }}>
              <TimelineCard 
                item={item} 
                onEdit={() => handleOpenDialog(item.type, item)} 
                onDelete={() => confirmDelete(item)} 
              />
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>

      <Dialog open={dialog.value} onClose={dialog.onFalse} fullWidth maxWidth="xs">
        <DialogTitle sx={{ textTransform: 'capitalize' }}>
          {currentActivity ? 'Edit' : 'Log'} {formValues.type}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField 
              label="Title" 
              fullWidth 
              value={formValues.title}
              onChange={(e) => setFormValues({...formValues, title: e.target.value})}
            />
            <TextField 
              label="Activity Details" 
              fullWidth 
              multiline 
              rows={4}
              placeholder="What happened?..."
              value={formValues.content}
              onChange={(e) => setFormValues({...formValues, content: e.target.value})}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={dialog.onFalse} variant="outlined">Cancel</Button>
          <LoadingButton 
            disabled={!formValues.content}
            loading={isSaving} 
            variant="contained" 
            onClick={handleSave}
          >
            {currentActivity ? 'Update' : 'Log'} Activity
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.value} onClose={deleteDialog.onFalse}>
        <DialogTitle>Remove Activity?</DialogTitle>
        <DialogContent>Are you sure you want to permanently remove this activity log?</DialogContent>
        <DialogActions>
          <Button onClick={deleteDialog.onFalse}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Remove</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

function TimelineCard({ item, onEdit, onDelete }: any) {
  const [open, setOpen] = useState<HTMLButtonElement | null>(null);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setOpen(event.currentTarget);
  };

  const handleClose = () => {
    setOpen(null);
  };

  return (
    <Card sx={{ p: 2, bgcolor: 'background.neutral', border: 0, position: 'relative' }}>
      <Stack spacing={0.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2">{item.title}</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {new Date(item.createdAt).toLocaleString()}
            </Typography>
            <IconButton size="small" onClick={handleOpen}>
              <Iconify icon="eva:more-vertical-fill" width={16} />
            </IconButton>
          </Stack>
        </Stack>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{item.content}</Typography>
        <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
        <Typography variant="caption" color="text.disabled">Logged by {item.author}</Typography>
      </Stack>

      <Popover
        open={Boolean(open)}
        anchorEl={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Stack sx={{ p: 1 }}>
          <MenuItem onClick={() => { onEdit(); handleClose(); }}>
            <Iconify icon="solar:pen-bold" sx={{ mr: 1 }} /> Edit
          </MenuItem>
          <MenuItem onClick={() => { onDelete(); handleClose(); }} sx={{ color: 'error.main' }}>
            <Iconify icon="solar:trash-bin-trash-bold" sx={{ mr: 1 }} /> Delete
          </MenuItem>
        </Stack>
      </Popover>
    </Card>
  );
}

export function ContactOrdersTab({ orders, loading }: any) {
  const router = useRouter();
  if (loading && (!orders || orders.length === 0)) {
    return (
      <Stack spacing={3}>
        <Skeleton variant="text" width={200} height={40} />
        <Stack spacing={2}>
          {[1, 2, 3].map((i) => <Skeleton key={i} variant="rectangular" height={80} />)}
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack spacing={3} sx={{ position: 'relative' }}>
      {loading && <LinearProgress sx={{ position: 'absolute', top: -10, left: 0, right: 0, height: 2, borderRadius: 1 }} />}
      <Typography variant="h6">Odoo Sales Orders</Typography>
      <Scrollbar sx={{ maxHeight: 500 }}>
        <Stack spacing={2}>
          {(!orders || orders.length === 0) && (
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 5 }}>
              No orders found in Odoo for this contact.
            </Typography>
          )}
          {orders?.map((order: any) => (
            <Box
              key={order.id}
              sx={{
                p: 2.5,
                borderRadius: 2,
                border: (theme) => `1px solid ${theme.palette.divider}`,
                bgcolor: 'background.neutral',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box sx={{ cursor: 'pointer' }} onClick={() => router.push(`${paths.dashboard.sales  }?order=${order.name}`)}>
                  <Typography variant="subtitle2">{order.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(order.date_order).toLocaleDateString()}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Typography variant="h6">${order.amount_total.toFixed(2)}</Typography>
                  <Label
                    color={
                      (order.state === 'sale' && 'success') ||
                      (order.state === 'cancel' && 'error') ||
                      'warning'
                    }
                  >
                    {order.state.toUpperCase()}
                  </Label>
                </Stack>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Scrollbar>
    </Stack>
  );
}

export function ContactProjectsTab({ projects, loading }: any) {
  const router = useRouter();
  if (loading && (!projects || projects.length === 0)) {
    return (
      <Stack spacing={3}>
        <Skeleton variant="text" width={200} height={40} />
        <Grid container spacing={3}>
          {[1, 2].map((i) => (
            <Grid item xs={12} sm={6} key={i}>
              <Skeleton variant="rectangular" height={150} />
            </Grid>
          ))}
        </Grid>
      </Stack>
    );
  }

  return (
    <Stack spacing={3} sx={{ position: 'relative' }}>
      {loading && <LinearProgress sx={{ position: 'absolute', top: -10, left: 0, right: 0, height: 2, borderRadius: 1 }} />}
      <Typography variant="h6">Linked Odoo Projects</Typography>
      <Grid container spacing={3}>
        {(!projects || projects.length === 0) && (
          <Grid item xs={12}>
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 5 }}>
              No active projects found in Odoo for this contact.
            </Typography>
          </Grid>
        )}
        {projects?.map((project: any) => (
          <Grid item xs={12} sm={6} key={project.id}>
            <Card
              sx={{
                p: 3,
                boxShadow: (theme) => theme.customShadows.z1,
                border: (theme) => `1px solid ${theme.palette.divider}`,
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'primary.lighter',
                    color: 'primary.darker',
                  }}
                >
                  <Iconify icon="solar:folder-with-files-bold" />
                </Box>
                <Typography variant="subtitle1">{project.name}</Typography>
              </Stack>

              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">Task Label</Typography>
                  <Typography variant="caption">{project.label_tasks}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="caption" color="text.secondary">Created</Typography>
                  <Typography variant="caption">{new Date(project.create_date).toLocaleDateString()}</Typography>
                </Stack>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  sx={{ mt: 2 }}
                  startIcon={<Iconify icon="solar:eye-bold" />}
                  onClick={() => router.push(`${paths.dashboard.projects  }/view/${project.id}`)}
                >
                  View Details
                </Button>
              </Stack>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}

export function TasksTab({ tasks, loading, refetch, contactId }: any) {
  const dispatch = useAppDispatch();
  const dialog = useBoolean();
  const deleteDialog = useBoolean();
  const [currentTask, setCurrentTask] = useState<any>(null);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formValues, setFormValues] = useState({
    title: '',
    dueDate: '',
    priority: 'Medium',
    status: 'pending',
  });

  const handleOpenDialog = (task?: any) => {
    if (task) {
      setCurrentTask(task);
      setFormValues({
        title: task.title,
        dueDate: task.dueDate || '',
        priority: task.priority || 'Medium',
        status: task.status || 'pending',
      });
    } else {
      setCurrentTask(null);
      setFormValues({
        title: '',
        dueDate: '',
        priority: 'Medium',
        status: 'pending',
      });
    }
    dialog.onTrue();
  };

  const handleSave = async () => {
    if (!formValues.title) return;
    try {
      setIsSaving(true);
      if (currentTask) {
        await dispatch(updateTaskThunk({ id: currentTask.id, data: formValues })).unwrap();
        showToast({ message: 'Task updated successfully' });
      } else {
        await dispatch(createTaskThunk({ contactId, data: formValues })).unwrap();
        showToast({ message: 'Task created successfully' });
      }
      dispatch(fetchContactTasks(contactId));
      dialog.onFalse();
    } catch (error: any) {
      showToast({ message: error || 'Failed to save task', severity: 'warning' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (task: any) => {
    try {
      const newStatus = task.status === 'done' ? 'pending' : 'done';
      await dispatch(updateTaskThunk({ id: task.id, data: { status: newStatus } })).unwrap();
      showToast({ message: `Task marked as ${newStatus}` });
      dispatch(fetchContactTasks(contactId));
    } catch (error) {
      showToast({ message: 'Failed to update status', severity: 'warning' });
    }
  };

  const confirmDelete = (task: any) => {
    setTaskToDelete(task);
    deleteDialog.onTrue();
  };

  const handleDelete = async () => {
    try {
      await dispatch(deleteTaskThunk(taskToDelete.id)).unwrap();
      showToast({ message: 'Task archived' });
      dispatch(fetchContactTasks(contactId));
      deleteDialog.onFalse();
    } catch (error: any) {
      showToast({ message: error || 'Failed to archive task', severity: 'warning' });
    }
  };

  if (loading && (!tasks || tasks.length === 0)) {
    return (
      <Stack spacing={3}>
        <Skeleton variant="text" width={200} height={40} />
        <Stack spacing={2}>
          {[1, 2, 3].map((i) => <Skeleton key={i} variant="rectangular" height={70} />)}
        </Stack>
      </Stack>
    );
  }

  return (
    <Stack spacing={3} sx={{ position: 'relative' }}>
      {loading && <LinearProgress sx={{ position: 'absolute', top: -10, left: 0, right: 0, height: 2, borderRadius: 1 }} />}
      
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Assigned Tasks</Typography>
        <Button 
          variant="contained" 
          size="small" 
          startIcon={<Iconify icon="solar:add-circle-bold" />}
          onClick={() => handleOpenDialog()}
        >
          New Task
        </Button>
      </Stack>

      <Stack spacing={2}>
        {(!tasks || tasks.length === 0) && (
          <Box sx={{ py: 10, textAlign: 'center', bgcolor: 'background.neutral', borderRadius: 2 }}>
            <Iconify icon="solar:clipboard-check-bold" width={48} sx={{ color: 'text.disabled', mb: 2 }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              No tasks assigned yet.
            </Typography>
          </Box>
        )}
        {tasks?.map((task: any) => (
          <Box 
            key={task.id} 
            sx={{ 
              p: 2, 
              borderRadius: 2, 
              border: (theme) => `1px solid ${theme.palette.divider}`,
              bgcolor: task.status === 'done' ? 'background.neutral' : 'background.paper',
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              opacity: task.status === 'done' ? 0.7 : 1,
              '&:hover': { bgcolor: 'action.hover' }
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <IconButton onClick={() => handleToggleStatus(task)}>
                <Iconify 
                  icon={task.status === 'done' ? 'solar:check-square-bold' : 'solar:square-academic-cap-bold'} 
                  sx={{ color: task.status === 'done' ? 'success.main' : 'text.disabled' }} 
                />
              </IconButton>
              <Box>
                <Typography 
                  variant="subtitle2" 
                  sx={{ textDecoration: task.status === 'done' ? 'line-through' : 'none' }}
                >
                  {task.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {task.dueDate ? `Due ${task.dueDate}` : `Created ${new Date(task.createdAt).toLocaleDateString()}`}
                </Typography>
              </Box>
            </Stack>
            
            <Stack direction="row" spacing={1} alignItems="center">
              <Label color={task.priority === 'High' ? 'error' : task.priority === 'Low' ? 'info' : 'warning'}>
                {task.priority || 'Medium'}
              </Label>
              <IconButton size="small" onClick={() => handleOpenDialog(task)}>
                <Iconify icon="solar:pen-bold" width={16} />
              </IconButton>
              <IconButton size="small" color="error" onClick={() => confirmDelete(task)}>
                <Iconify icon="solar:trash-bin-trash-bold" width={16} />
              </IconButton>
            </Stack>
          </Box>
        ))}
      </Stack>

      <Dialog open={dialog.value} onClose={dialog.onFalse} fullWidth maxWidth="xs">
        <DialogTitle>{currentTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <TextField 
              label="Task Title" 
              fullWidth 
              value={formValues.title} 
              onChange={(e) => setFormValues({...formValues, title: e.target.value})} 
            />
            <TextField 
              label="Due Date" 
              type="date"
              fullWidth 
              InputLabelProps={{ shrink: true }}
              value={formValues.dueDate} 
              onChange={(e) => setFormValues({...formValues, dueDate: e.target.value})} 
            />
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select 
                label="Priority"
                value={formValues.priority}
                onChange={(e) => setFormValues({...formValues, priority: e.target.value})}
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={dialog.onFalse} variant="outlined">Cancel</Button>
          <LoadingButton loading={isSaving} variant="contained" onClick={handleSave}>
            {currentTask ? 'Update' : 'Create'}
          </LoadingButton>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.value} onClose={deleteDialog.onFalse}>
        <DialogTitle>Delete Task?</DialogTitle>
        <DialogContent>Are you sure you want to permanently delete this task?</DialogContent>
        <DialogActions>
          <Button onClick={deleteDialog.onFalse}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Remove</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

// ----------------------------------------------------------------------

function CompanySelector({ onSelect }: { onSelect: (id: number) => void }) {
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState('');
  const contactState = useAppSelector(selectContacts);
  const { data: companies, loading: isLoading } = contactState.companies;

  useEffect(() => {
    if (search.length > 2) {
      dispatch(fetchCompanies({ search, pageSize: 20 }));
    }
  }, [dispatch, search]);

  return (
    <Stack spacing={2}>
      <TextField
        fullWidth
        placeholder="Search Odoo companies..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: <Iconify icon="solar:magnifer-bold" sx={{ color: 'text.disabled', mr: 1 }} />,
        }}
      />

      {isLoading && <LinearProgress sx={{ borderRadius: 1 }} />}

      <Stack spacing={1} sx={{ maxHeight: 300, overflow: 'auto', minHeight: search.length > 2 ? 100 : 0 }}>
        {companies?.map((company: any) => (
          <Button
            key={company.id}
            fullWidth
            variant="outlined"
            onClick={() => onSelect(Number(company.id))}
            sx={{ 
              justifyContent: 'flex-start', 
              textAlign: 'left', 
              py: 1.5,
              borderColor: 'divider',
              '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.main' }
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.lighter', color: 'primary.main' }}>
                <Iconify icon="solar:buildings-bold" width={16} />
              </Avatar>
              <Box>
                <Typography variant="subtitle2">{company.name || company.fullName}</Typography>
                <Typography variant="caption" color="text.secondary">{company.email || company.phone || 'No contact info'}</Typography>
              </Box>
            </Stack>
          </Button>
        ))}
        
        {search.length > 2 && !isLoading && companies.length === 0 && (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              No companies match "{search}"
            </Typography>
          </Box>
        )}

        {search.length <= 2 && (
          <Box sx={{ py: 2, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              Enter at least 3 characters to search
            </Typography>
          </Box>
        )}
      </Stack>
    </Stack>
  );
}
