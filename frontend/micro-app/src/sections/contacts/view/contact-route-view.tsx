'use client';

import { useMemo, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { fetchContactsByType, selectContacts } from 'src/store/slices/contact-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';

import { Scrollbar } from 'src/components/scrollbar';

import { ContactDetailsView } from './contact-details-view';

// ----------------------------------------------------------------------

type Props = {
  type?: string;
  id?: string;
  mode?: string;
};

export function ContactRouteView({ type, id, mode }: Props) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isDetailMode = Boolean(mode && id);

  const contactState = useAppSelector(selectContacts);
  const { data, loading } = contactState.contacts;

  const title = useMemo(() => {
    if (isDetailMode) return `Contact ${mode}`;
    if (type === 'employee') return 'Employee Contacts';
    if (type === 'pets') return 'Pet Contacts';
    if (type) return `${type[0].toUpperCase()}${type.slice(1)} Contacts`;
    return 'Contacts';
  }, [isDetailMode, mode, type]);

  useEffect(() => {
    if (!isDetailMode && type) {
      dispatch(fetchContactsByType({ type, id }));
    }
  }, [dispatch, type, id, isDetailMode]);

  if (isDetailMode && id) {
    return <ContactDetailsView id={id} mode={mode} />;
  }

  if (!type) {
    return null;
  }

  return (
    <DashboardContent maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4">{title}</Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
          Legacy parity route for typed contact lists, employee views, and pet/member related flows.
        </Typography>
      </Box>

      <Card>
        <Scrollbar>
          <Table sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : (
                (data || []).map((contact: any) => (
                  <TableRow
                    key={contact._id || contact.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      router.push(paths.dashboard.contactView(contact._id || contact.id, 'overview'));
                    }}
                  >
                    <TableCell>{contact.fullName}</TableCell>
                    <TableCell>{contact.email || 'N/A'}</TableCell>
                    <TableCell>{contact.phone || 'N/A'}</TableCell>
                    <TableCell>{contact.status || 'Active'}</TableCell>
                  </TableRow>
                ))
              )}

              {!loading && (data || []).length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                    <Stack spacing={1}>
                      <Typography variant="subtitle1">No contacts found</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        This route is wired, but the backing dataset is empty for the current tenant.
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Scrollbar>
      </Card>
    </DashboardContent>
  );
}
