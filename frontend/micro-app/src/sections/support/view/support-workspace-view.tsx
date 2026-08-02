'use client';

import { useMemo, useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { 
  fetchSupportTicketsThunk, 
  fetchSupportTicketByIdThunk, 
  createSupportTicketThunk, 
  updateSupportTicketThunk,
  addTicketNoteThunk,
  addTicketReplyThunk,
  fetchKbArticlesThunk,
  fetchPublicKbArticlesThunk,
  fetchKbCategoriesThunk,
  createKbArticleThunk,
  selectSupport 
} from 'src/store/slices/support-slice';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';

import { FeatureRouteShell } from 'src/sections/parity/feature-route-shell';

export function SupportWorkspaceView() {
  const dispatch = useAppDispatch();
  const { tickets, selectedTicket, articles, publicArticles, categories } = useAppSelector(selectSupport);

  const [activeTab, setActiveTab] = useState<'tickets' | 'kb' | 'public-kb'>('tickets');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [contactId, setContactId] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [assigneeUserId, setAssigneeUserId] = useState('');
  const [slaDueAt, setSlaDueAt] = useState('');

  const [noteBody, setNoteBody] = useState('');
  const [replyBody, setReplyBody] = useState('');

  const [articleTitle, setArticleTitle] = useState('');
  const [articleBody, setArticleBody] = useState('');
  const [articleCategoryId, setArticleCategoryId] = useState('');
  const [articlePublic, setArticlePublic] = useState(true);

  const [isMutationPending, setIsMutationPending] = useState(false);

  useEffect(() => {
    dispatch(fetchSupportTicketsThunk());
  }, [dispatch]);

  useEffect(() => {
    if (selectedTicketId) {
      dispatch(fetchSupportTicketByIdThunk(selectedTicketId));
    }
  }, [dispatch, selectedTicketId]);

  useEffect(() => {
    if (activeTab === 'kb') {
      dispatch(fetchKbArticlesThunk());
      dispatch(fetchKbCategoriesThunk());
    } else if (activeTab === 'public-kb') {
      dispatch(fetchPublicKbArticlesThunk());
      dispatch(fetchKbCategoriesThunk());
    }
  }, [dispatch, activeTab]);

  const handleCreateTicket = async () => {
    if (!subject.trim()) return;
    try {
      setIsMutationPending(true);
      await dispatch(createSupportTicketThunk({
        subject,
        description,
        priority,
        customerContactId: contactId ? Number(contactId) : undefined,
        customerCompanyId: companyId ? Number(companyId) : undefined,
        assigneeUserId: assigneeUserId || undefined,
        slaDueAt: slaDueAt || undefined,
      })).unwrap();
      setSubject('');
      setDescription('');
      setContactId('');
      setCompanyId('');
      setAssigneeUserId('');
      setSlaDueAt('');
      dispatch(fetchSupportTicketsThunk());
      toast.success('Ticket created');
    } catch (err) {
      toast.error(err || 'Unable to create ticket');
    } finally {
      setIsMutationPending(false);
    }
  };

  const handleUpdateTicket = async (id: string, payload: any) => {
    try {
      setIsMutationPending(true);
      await dispatch(updateSupportTicketThunk({ id, payload })).unwrap();
      dispatch(fetchSupportTicketsThunk());
      dispatch(fetchSupportTicketByIdThunk(id));
      toast.success('Ticket updated');
    } catch (err) {
      toast.error(err || 'Failed to update ticket');
    } finally {
      setIsMutationPending(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedTicketId || !noteBody.trim()) return;
    try {
      setIsMutationPending(true);
      await dispatch(addTicketNoteThunk({ id: selectedTicketId, body: noteBody })).unwrap();
      setNoteBody('');
      dispatch(fetchSupportTicketByIdThunk(selectedTicketId));
      toast.success('Note added');
    } catch (err) {
      toast.error(err || 'Failed to add note');
    } finally {
      setIsMutationPending(false);
    }
  };

  const handleAddReply = async () => {
    if (!selectedTicketId || !replyBody.trim()) return;
    try {
      setIsMutationPending(true);
      await dispatch(addTicketReplyThunk({ id: selectedTicketId, body: replyBody, isCustomerVisible: true })).unwrap();
      setReplyBody('');
      dispatch(fetchSupportTicketByIdThunk(selectedTicketId));
      toast.success('Reply sent');
    } catch (err) {
      toast.error(err || 'Failed to send reply');
    } finally {
      setIsMutationPending(false);
    }
  };

  const handleCreateArticle = async () => {
    if (!articleTitle.trim()) return;
    try {
      setIsMutationPending(true);
      await dispatch(createKbArticleThunk({
        title: articleTitle,
        body: articleBody,
        categoryId: articleCategoryId || undefined,
        isPublic: articlePublic,
      })).unwrap();
      setArticleTitle('');
      setArticleBody('');
      dispatch(fetchKbArticlesThunk());
      dispatch(fetchPublicKbArticlesThunk());
      toast.success('Article created');
    } catch (err) {
      toast.error(err || 'Failed to create article');
    } finally {
      setIsMutationPending(false);
    }
  };

  const currentTicket = selectedTicket.data;
  const slaStatus = useMemo(() => {
    if (!currentTicket?.slaDueAt) return null;
    const due = new Date(currentTicket.slaDueAt).getTime();
    const breached = currentTicket.slaBreached || due < Date.now();
    return breached ? 'breached' : 'on-track';
  }, [currentTicket]);

  return (
    <FeatureRouteShell
      title="Support"
      description="Create, assign, and resolve customer tickets with SLA visibility and a basic knowledge base."
      links={[
        { href: '#', label: 'Tickets' },
        { href: '#', label: 'Knowledge Base' },
        { href: '#', label: 'Public Portal' },
      ]}
      action={<Button variant="contained" startIcon={<Iconify icon="solar:chat-round-dots-bold" />} onClick={() => setActiveTab('tickets')}>New Ticket</Button>}
    >
      <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} sx={{ mt: 3 }}>
        <Tab value="tickets" label="Tickets" />
        <Tab value="kb" label="Knowledge Base" />
        <Tab value="public-kb" label="Public KB" />
      </Tabs>

      {activeTab === 'tickets' && (
        <Grid container spacing={3} sx={{ mt: 0.5 }}>
          <Grid item xs={12} md={7}>
            <Card sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ mb: 1.5 }}>Create Ticket</Typography>
              <Grid container spacing={1.5}>
                <Grid item xs={12}><TextField label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} fullWidth /></Grid>
                <Grid item xs={12}><TextField label="Description" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline minRows={3} /></Grid>
                <Grid item xs={12} sm={6}><TextField label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)} fullWidth /></Grid>
                <Grid item xs={12} sm={6}><TextField type="datetime-local" label="SLA Due" InputLabelProps={{ shrink: true }} value={slaDueAt} onChange={(e) => setSlaDueAt(e.target.value)} fullWidth /></Grid>
                <Grid item xs={12} sm={4}><TextField label="Contact ID" value={contactId} onChange={(e) => setContactId(e.target.value)} fullWidth /></Grid>
                <Grid item xs={12} sm={4}><TextField label="Company ID" value={companyId} onChange={(e) => setCompanyId(e.target.value)} fullWidth /></Grid>
                <Grid item xs={12} sm={4}><TextField label="Assignee User ID" value={assigneeUserId} onChange={(e) => setAssigneeUserId(e.target.value)} fullWidth /></Grid>
              </Grid>
              <Button sx={{ mt: 2 }} variant="contained" onClick={handleCreateTicket} disabled={isMutationPending || !subject.trim()}>Create</Button>
            </Card>

            <Card sx={{ mt: 2, p: 0 }}>
              <Box sx={{ p: 2 }}><Typography variant="h6">Ticket List</Typography></Box>
              <Divider />
              {tickets.error ? <Alert severity="warning">Unable to load tickets.</Alert> : null}
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Subject</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Priority</TableCell>
                      <TableCell>SLA</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tickets.data.map((ticket: any) => (
                      <TableRow key={ticket.id} hover selected={selectedTicketId === ticket.id} onClick={() => setSelectedTicketId(ticket.id)} sx={{ cursor: 'pointer' }}>
                        <TableCell>{ticket.subject}</TableCell>
                        <TableCell>{ticket.status}</TableCell>
                        <TableCell><Chip size="small" label={ticket.priority} color={ticket.priority === 'urgent' ? 'error' : ticket.priority === 'high' ? 'warning' : 'default'} /></TableCell>
                        <TableCell>{ticket.slaDueAt ? new Date(ticket.slaDueAt).toLocaleString() : '—'}</TableCell>
                      </TableRow>
                    ))}
                    {tickets.data.length === 0 && !tickets.loading && (
                      <TableRow>
                        <TableCell colSpan={4} sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>No tickets found.</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card sx={{ p: 2.5 }}>
              {!currentTicket ? (
                <Typography variant="body2" color="text.secondary">Select a ticket to view details.</Typography>
              ) : (
                <Stack spacing={1.5}>
                  <Typography variant="h6">{currentTicket.subject}</Typography>
                  <Stack direction="row" spacing={1}>
                    <Chip size="small" label={`Status: ${currentTicket.status}`} />
                    <Chip size="small" color={currentTicket.priority === 'urgent' ? 'error' : currentTicket.priority === 'high' ? 'warning' : 'default'} label={`Priority: ${currentTicket.priority}`} />
                    {slaStatus ? <Chip size="small" color={slaStatus === 'breached' ? 'error' : 'success'} label={`SLA: ${slaStatus}`} /> : null}
                  </Stack>
                  <Typography variant="body2">{currentTicket.description || 'No description'}</Typography>
                  <Typography variant="caption" color="text.secondary">Contact: {currentTicket.customerContactId || '—'} · Company: {currentTicket.customerCompanyId || '—'} · Assignee: {currentTicket.assigneeUserId || '—'}</Typography>

                  <Stack direction="row" spacing={1}>
                    <Button size="small" variant="outlined" onClick={() => handleUpdateTicket(currentTicket.id, { status: 'in_progress' })} disabled={isMutationPending}>Start</Button>
                    <Button size="small" variant="outlined" onClick={() => handleUpdateTicket(currentTicket.id, { status: 'resolved' })} disabled={isMutationPending}>Resolve</Button>
                    <Button size="small" variant="contained" onClick={() => handleUpdateTicket(currentTicket.id, { status: 'closed' })} disabled={isMutationPending}>Close</Button>
                  </Stack>

                  <Divider />
                  <Typography variant="subtitle2">Internal Notes</Typography>
                  {(currentTicket.notes || []).map((note: any) => <Typography key={note.id} variant="body2">• {note.body}</Typography>)}
                  <TextField size="small" placeholder="Add internal note" value={noteBody} onChange={(e) => setNoteBody(e.target.value)} />
                  <Button size="small" onClick={handleAddNote} disabled={!noteBody.trim() || isMutationPending}>Add Note</Button>

                  <Typography variant="subtitle2">Customer Replies</Typography>
                  {(currentTicket.replies || []).map((reply: any) => <Typography key={reply.id} variant="body2">↳ {reply.body}</Typography>)}
                  <TextField size="small" placeholder="Add customer-visible reply" value={replyBody} onChange={(e) => setReplyBody(e.target.value)} />
                  <Button size="small" onClick={handleAddReply} disabled={!replyBody.trim() || isMutationPending}>Add Reply</Button>
                </Stack>
              )}
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 'kb' && (
        <Grid container spacing={3} sx={{ mt: 0.5 }}>
          <Grid item xs={12} md={5}>
            <Card sx={{ p: 2.5 }}>
              <Typography variant="h6" sx={{ mb: 1.5 }}>Create Article</Typography>
              <Stack spacing={1.5}>
                <TextField label="Title" value={articleTitle} onChange={(e) => setArticleTitle(e.target.value)} />
                <TextField label="Category ID" value={articleCategoryId} onChange={(e) => setArticleCategoryId(e.target.value)} />
                <TextField label="Body" value={articleBody} onChange={(e) => setArticleBody(e.target.value)} multiline minRows={4} />
                <TextField label="Public" value={articlePublic ? 'true' : 'false'} onChange={(e) => setArticlePublic(e.target.value === 'true')} />
                <Button variant="contained" onClick={handleCreateArticle} disabled={isMutationPending || !articleTitle.trim()}>Save Article</Button>
              </Stack>
            </Card>
          </Grid>
          <Grid item xs={12} md={7}>
            <Card sx={{ p: 2.5 }}>
              <Typography variant="h6">Articles</Typography>
              <Typography variant="caption" color="text.secondary">Categories: {categories.data.length}</Typography>
              <Stack spacing={1.5} sx={{ mt: 1.5 }}>
                {articles.data.map((article: any) => (
                  <Box key={article.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle2">{article.title}</Typography>
                      <Chip size="small" label={article.isPublic ? 'Public' : 'Internal'} color={article.isPublic ? 'success' : 'default'} />
                      {article.category?.name ? <Chip size="small" label={article.category.name} /> : null}
                    </Stack>
                    <Typography variant="body2" color="text.secondary">{article.body}</Typography>
                  </Box>
                ))}
                {articles.data.length === 0 && !articles.loading && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>No articles found.</Typography>
                )}
              </Stack>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 'public-kb' && (
        <Card sx={{ mt: 2, p: 2.5 }}>
          <Typography variant="h6">Customer Portal Knowledge Base</Typography>
          <Typography variant="caption" color="text.secondary">Publicly visible support articles.</Typography>
          <Stack spacing={1.5} sx={{ mt: 2 }}>
            {publicArticles.data.map((article: any) => (
              <Box key={article.id} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1.5 }}>
                <Typography variant="subtitle2">{article.title}</Typography>
                <Typography variant="body2" color="text.secondary">{article.body}</Typography>
                {article.category?.name ? <Chip size="small" label={article.category.name} sx={{ mt: 1 }} /> : null}
              </Box>
            ))}
            {publicArticles.data.length === 0 && !publicArticles.loading && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>No public articles found.</Typography>
            )}
          </Stack>
        </Card>
      )}
    </FeatureRouteShell>
  );
}
