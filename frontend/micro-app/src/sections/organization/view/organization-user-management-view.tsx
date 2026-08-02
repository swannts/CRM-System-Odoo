'use client';

import { useMemo, useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { 
  fetchOrgAccessUsersThunk, 
  fetchOrgRbacCatalogThunk, 
  upsertOrgMembershipThunk, 
  removeOrgMembershipThunk, 
  syncOrgMembershipToKeycloakThunk, 
  createOrgKeycloakUserThunk,
  selectOrganization 
} from 'src/store/slices/organization-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import TableContainer from '@mui/material/TableContainer';
import InputAdornment from '@mui/material/InputAdornment';

import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';

type Drafts = Record<string, {
  role: string;
  permissionsCsv: string;
}>;

export function OrganizationUserManagementView() {
  const dispatch = useAppDispatch();
  const { accessUsers, rbacCatalog } = useAppSelector(selectOrganization);

  const [search, setSearch] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('customer');
  const [drafts, setDrafts] = useState<Drafts>({});
  const [isMutationPending, setIsMutationPending] = useState(false);

  useEffect(() => {
    dispatch(fetchOrgRbacCatalogThunk());
    dispatch(fetchOrgAccessUsersThunk({ search }));
  }, [dispatch, search]);

  const catalog = rbacCatalog.data;
  const users = accessUsers.data || [];
  const isLoading = accessUsers.loading;

  const businessRoles = Array.isArray(catalog?.businessRoles) ? catalog.businessRoles : [];
  const roleOptions = businessRoles.map((role: any) => role.keycloakRole);

  const handleCreateUser = async () => {
    if (!newUserEmail.trim()) return;
    try {
      setIsMutationPending(true);
      await dispatch(createOrgKeycloakUserThunk({
        email: newUserEmail,
        role: newUserRole,
        metadata: {
          integrationRoles: {
            odoo: 'odoo_viewer',
            magento: 'magento_viewer',
          },
        },
      })).unwrap();
      setNewUserEmail('');
      dispatch(fetchOrgAccessUsersThunk({ search }));
      toast.success('User created and assigned');
    } catch (err) {
      toast.error(err || 'Failed creating user');
    } finally {
      setIsMutationPending(false);
    }
  };

  const handleSaveMembership = async (userId: string, row: any) => {
    try {
      setIsMutationPending(true);
      await dispatch(upsertOrgMembershipThunk({
        userId,
        body: {
          role: row.role,
          permissions: String(row.permissionsCsv || '')
            .split(',')
            .map((item: string) => item.trim())
            .filter(Boolean),
          metadata: {
            integrationRoles: {},
          },
        },
      })).unwrap();
      dispatch(fetchOrgAccessUsersThunk({ search }));
      toast.success('User access updated');
    } catch (err) {
      toast.error(err || 'Failed to update membership');
    } finally {
      setIsMutationPending(false);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      setIsMutationPending(true);
      await dispatch(removeOrgMembershipThunk(userId)).unwrap();
      dispatch(fetchOrgAccessUsersThunk({ search }));
      toast.success('User removed from organization');
    } catch (err) {
      toast.error(err || 'Failed to remove membership');
    } finally {
      setIsMutationPending(false);
    }
  };

  const handleSyncUser = async (userId: string) => {
    try {
      setIsMutationPending(true);
      await dispatch(syncOrgMembershipToKeycloakThunk(userId)).unwrap();
      toast.success('Synced to Keycloak');
    } catch (err) {
      toast.error(err || 'Failed syncing with Keycloak');
    } finally {
      setIsMutationPending(false);
    }
  };

  const rows = useMemo(
    () =>
      users.map((user: any) => {
        const draft = drafts[user.userId];
        return {
          ...user,
          role: draft?.role ?? user.role,
          permissionsCsv: draft?.permissionsCsv ?? (Array.isArray(user.permissions) ? user.permissions.join(', ') : ''),
        };
      }),
    [users, drafts]
  );

  if (rbacCatalog.error) {
    return (
      <Alert severity="warning">
        Only organization owners can manage users, roles, and integration permissions.
      </Alert>
    );
  }

  return (
    <Stack spacing={3}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Typography variant="h6">Add User</Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              fullWidth
              label="User Email"
              value={newUserEmail}
              onChange={(event) => setNewUserEmail(event.target.value)}
            />
            <Select value={newUserRole} onChange={(event) => setNewUserRole(String(event.target.value))}>
              {businessRoles.map((role: any) => (
                <MenuItem key={role.keycloakRole} value={role.keycloakRole}>
                  {role.entityType} ({role.keycloakRole})
                </MenuItem>
              ))}
            </Select>
            <LoadingButton
              loading={isMutationPending}
              variant="contained"
              onClick={handleCreateUser}
              disabled={!newUserEmail.trim()}
            >
              Create User
            </LoadingButton>
          </Stack>
        </Stack>
      </Card>

      <Card sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
          <Typography variant="h6">Users, Roles & Permissions</Typography>
          <TextField
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search user by id/email/name"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="solar:magnifer-bold" />
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Organization Role</TableCell>
                <TableCell>Odoo Role</TableCell>
                <TableCell>Magento Role</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row: any) => (
                <TableRow key={row.userId} hover>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle2">
                        {row.profile?.firstName || row.profile?.lastName
                          ? `${row.profile?.firstName || ''} ${row.profile?.lastName || ''}`.trim()
                          : row.profile?.username || row.userId}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.profile?.email || row.userId}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Select
                      size="small"
                      value={row.role}
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [row.userId]: {
                            role: String(event.target.value),
                            permissionsCsv: row.permissionsCsv,
                          },
                        }))
                      }
                    >
                      {Array.from(new Set([row.role, ...roleOptions])).map((role: any) => (
                        <MenuItem key={role} value={role}>
                          {role}
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {businessRoles.find((item: any) => item.keycloakRole === row.role)?.odooRoleMapping || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {businessRoles.find((item: any) => item.keycloakRole === row.role)?.magentoRoleMapping || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={row.permissionsCsv}
                      onChange={(event) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [row.userId]: {
                            role: row.role,
                            permissionsCsv: event.target.value,
                          },
                        }))
                      }
                      placeholder="crm:view, projects:create"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <LoadingButton
                        size="small"
                        loading={isMutationPending}
                        variant="contained"
                        onClick={() => handleSaveMembership(row.userId, row)}
                      >
                        Save
                      </LoadingButton>
                      <Button
                        size="small"
                        onClick={() => handleSyncUser(row.userId)}
                        disabled={isMutationPending}
                      >
                        Sync
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => handleRemoveUser(row.userId)}
                        disabled={isMutationPending}
                      >
                        Remove
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {!rows.length && !isLoading && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Box sx={{ py: 8, textAlign: 'center' }}>
                      <Typography variant="subtitle1">No users found</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Stack>
  );
}
