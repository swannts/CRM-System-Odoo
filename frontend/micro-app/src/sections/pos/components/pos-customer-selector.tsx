import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Button from '@mui/material/Button';
import ListItem from '@mui/material/ListItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { 
  selectPos, 
  searchPosCustomers, 
  createPosCustomer 
} from 'src/store/slices/pos-slice';

import { PosErrorState } from './pos-error-state';

// ----------------------------------------------------------------------

type Customer = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
};

type Props = {
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
};

export function PosCustomerSelector({
  selectedCustomer,
  onSelectCustomer,
}: Props) {
  const dispatch = useAppDispatch();
  const { customers } = useAppSelector(selectPos);
  
  const [query, setQuery] = useState('');

  // Create Customer Dialog State
  const [createOpen, setCreateOpen] = useState(false);
  const [createData, setCreateData] = useState({ name: '', email: '', phone: '' });

  const handleCreateCustomer = async () => {
    if (!createData.name.trim()) {
      return;
    }
    
    try {
      const newCustomer = await dispatch(createPosCustomer(createData)).unwrap();
      onSelectCustomer(newCustomer);
      setCreateOpen(false);
      setCreateData({ name: '', email: '', phone: '' });
    } catch (err: any) {
      console.error('Failed to create customer:', err);
    }
  };

  useEffect(() => {
    if (!query) {
      return;
    }

    const timer = setTimeout(() => {
      dispatch(searchPosCustomers(query));
    }, 500);

    return () => clearTimeout(timer);
  }, [query, dispatch]);

  if (selectedCustomer) {
    return (
      <Box p={2} borderBottom={1} borderColor="divider">
        <Typography variant="subtitle2" gutterBottom>
          Attached Customer
        </Typography>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="body1">{selectedCustomer.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedCustomer.phone || selectedCustomer.email || ''}
            </Typography>
          </Box>
          <Button size="small" color="error" onClick={() => onSelectCustomer(null)}>
            Remove
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box p={2} borderBottom={1} borderColor="divider">
      <Typography variant="subtitle2" gutterBottom>
        Customer
      </Typography>
      <Box display="flex" gap={1} mb={1}>
        <Button
          size="small"
          variant="outlined"
          onClick={() => onSelectCustomer({ id: 'walk-in-ui-only', name: 'Walk-in customer' })}
        >
          Walk-in
        </Button>
        <Button
          size="small"
          variant="text"
          onClick={() => setCreateOpen(true)}
        >
          + New
        </Button>
      </Box>
      <TextField
        fullWidth
        size="small"
        placeholder="Search by name, phone, email..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {customers.error && <PosErrorState message={customers.error} />}
      {!customers.error && customers.loading && (
        <Box display="flex" justifyContent="center" p={2}>
          <CircularProgress size={24} />
        </Box>
      )}
      {!customers.error && !customers.loading && customers.data.length > 0 && query && (
        <List sx={{ maxHeight: 200, overflow: 'auto', border: 1, borderColor: 'divider', mt: 1, borderRadius: 1 }}>
          {customers.data.map((c: Customer) => (
            <ListItem key={c.id} disablePadding>
              <ListItemButton onClick={() => onSelectCustomer(c)}>
                <ListItemText primary={c.name} secondary={c.phone || c.email} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}

      {/* Create Customer Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Create Customer</DialogTitle>
        <DialogContent>
          <Box py={1} display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Name"
              fullWidth
              size="small"
              required
              value={createData.name}
              onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
              disabled={customers.createLoading}
            />
            <TextField
              label="Email"
              fullWidth
              size="small"
              type="email"
              value={createData.email}
              onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
              disabled={customers.createLoading}
            />
            <TextField
              label="Phone"
              fullWidth
              size="small"
              value={createData.phone}
              onChange={(e) => setCreateData({ ...createData, phone: e.target.value })}
              disabled={customers.createLoading}
            />
            {customers.createError && <Typography color="error" variant="body2">{customers.createError}</Typography>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={customers.createLoading}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateCustomer} disabled={customers.createLoading}>
            {customers.createLoading ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
