'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Card, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { AuthGuard } from 'src/auth/guard';
import axios from 'src/utils/axios';

type Workspace = { id: string; name: string; role: string };
type Invitation = { id: string; email: string; role: string; expiresAt: string; acceptedAt: string | null; revokedAt: string | null };

function WorkspaceSetup() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selected, setSelected] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('org_staff');
  const [token, setToken] = useState('');
  const [link, setLink] = useState('');
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [requestId] = useState(() => crypto.randomUUID());
  const selectedWorkspace = workspaces.find(w => w.id === selected);
  const canInvite = ['org_owner', 'org_admin'].includes(selectedWorkspace?.role || '');

  const load = useCallback(async () => {
    const response = await axios.get('/org/v1/workspaces');
    setWorkspaces(response.data.data);
    const stored = sessionStorage.getItem('organizationId');
    setSelected(response.data.data.some((workspace: Workspace) => workspace.id === stored) ? stored || '' : response.data.data[0]?.id || '');
  }, []);
  const perform = useCallback(async (operation: () => Promise<void>) => {
    setBusy(true); setError('');
    try { await operation(); }
    catch (err: any) { setError(err?.response?.data?.message || err?.message || 'Please retry.'); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => {
    setToken(sessionStorage.getItem('pendingInvitation') || '');
    void perform(load);
  }, [perform, load]);
  useEffect(() => {
    setInvitations([]); setLink('');
    if (!canInvite) return;
    let cancelled = false;
    axios.get('/org/v1/invitations', { headers: { 'X-Org-Id': selected } })
      .then(response => { if (!cancelled) setInvitations(response.data.data); })
      .catch(() => { if (!cancelled) setError('Unable to load invitations.'); });
    return () => { cancelled = true; };
  }, [selected, canInvite]);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: { xs: 2, md: 4 } }}>
      <Stack spacing={3}>
        <Typography variant="h4">Your workspaces</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <Card sx={{ p: 3 }}>
          <Stack spacing={2}>
            <Typography variant="h6">Open a workspace</Typography>
            {workspaces.length === 0 && <Typography>Create a workspace or accept an invitation to begin.</Typography>}
            {workspaces.length > 0 && <TextField select label="Workspace" value={selected} onChange={event => setSelected(event.target.value)}>
              {workspaces.map(workspace => <MenuItem key={workspace.id} value={workspace.id}>{workspace.name}</MenuItem>)}
            </TextField>}
            <Button variant="contained" disabled={!selected || busy} onClick={() => {
              sessionStorage.setItem('organizationId', selected);
              window.location.assign('/dashboard/');
            }}>Open workspace</Button>
          </Stack>
        </Card>
        <Card component="form" sx={{ p: 3 }} onSubmit={event => {
          event.preventDefault();
          void perform(async () => {
            const response = await axios.post('/org/v1/workspaces', { requestId, name });
            sessionStorage.setItem('organizationId', response.data.data.id);
            window.location.assign('/dashboard/');
          });
        }}>
          <Stack spacing={2}>
            <Typography variant="h6">Create a workspace</Typography>
            <TextField required label="Business name" value={name} inputProps={{ maxLength: 120 }} onChange={event => setName(event.target.value)} />
            <Button type="submit" variant="contained" disabled={busy || !name.trim()}>Create workspace</Button>
          </Stack>
        </Card>
        <Card component="form" sx={{ p: 3 }} onSubmit={event => {
          event.preventDefault();
          void perform(async () => {
            const response = await axios.post('/org/v1/invitations/accept', { token });
            sessionStorage.removeItem('pendingInvitation');
            sessionStorage.setItem('organizationId', response.data.data.organizationId);
            window.location.assign('/dashboard/');
          });
        }}>
          <Stack spacing={2}>
            <Typography variant="h6">Accept an invitation</Typography>
            <Typography>Sign in with the verified email address that received the invitation.</Typography>
            <TextField label="Invitation code" required value={token} onChange={event => setToken(event.target.value.trim())} />
            <Button type="submit" disabled={busy || !token}>Join workspace</Button>
          </Stack>
        </Card>
        {canInvite && <Card sx={{ p: 3 }}>
          <Stack component="form" spacing={2} onSubmit={event => {
            event.preventDefault();
            void perform(async () => {
              const response = await axios.post('/org/v1/invitations', { email, role }, { headers: { 'X-Org-Id': selected } });
              setLink(`${window.location.origin}/workspace-setup/#invite=${response.data.data.token}`);
              const pending = await axios.get('/org/v1/invitations', { headers: { 'X-Org-Id': selected } });
              setInvitations(pending.data.data);
            });
          }}>
            <Typography variant="h6">Invite a teammate</Typography>
            <TextField label="Email" type="email" required value={email} onChange={event => setEmail(event.target.value)} />
            <TextField label="Role" select value={role} onChange={event => setRole(event.target.value)}>
              <MenuItem value="org_admin">Admin</MenuItem><MenuItem value="org_manager">Manager</MenuItem>
              <MenuItem value="org_staff">Staff</MenuItem><MenuItem value="org_viewer">Viewer</MenuItem>
            </TextField>
            <Button type="submit" disabled={busy}>Create invitation link</Button>
            {link && <TextField label="Share this private link with your teammate" value={link} InputProps={{ readOnly: true }} helperText="Expires in seven days. No email has been sent." />}
            {invitations.map(invite => <Stack key={invite.id} direction="row" spacing={2} alignItems="center">
              <Typography sx={{ flex: 1, overflowWrap: 'anywhere' }}>{invite.email}: {invite.acceptedAt ? 'Accepted' : invite.revokedAt ? 'Revoked' : new Date(invite.expiresAt) < new Date() ? 'Expired' : 'Pending'}</Typography>
              {!invite.acceptedAt && !invite.revokedAt && <Button disabled={busy} onClick={() => void perform(async () => {
                await axios.delete(`/org/v1/invitations/${invite.id}`, { headers: { 'X-Org-Id': selected } });
                setInvitations(items => items.map(item => item.id === invite.id ? { ...item, revokedAt: new Date().toISOString() } : item));
              })}>Revoke</Button>}
            </Stack>)}
          </Stack>
        </Card>}
      </Stack>
    </Box>
  );
}

export default function Page() {
  useEffect(() => {
    const invite = new URLSearchParams(window.location.hash.slice(1)).get('invite');
    if (invite) {
      sessionStorage.setItem('pendingInvitation', invite);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);
  return <Suspense fallback={<Typography>Loading workspace…</Typography>}><AuthGuard><WorkspaceSetup /></AuthGuard></Suspense>;
}
