import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import Switch from '@mui/material/Switch';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import TableContainer from '@mui/material/TableContainer';
import CircularProgress from '@mui/material/CircularProgress';
import TablePagination from '@mui/material/TablePagination';

import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import {
  fetchOdooCampaigns,
  fetchOdooSources,
  fetchOdooMediums,
  fetchOdooAnalytics,
  fetchOdooInsights,
  createOdooCampaign,
  updateOdooCampaign,
  setOdooCampaignAction,
  createOdooSource,
  updateOdooSource,
  deleteOdooSource,
  createOdooMedium,
  updateOdooMedium,
  deleteOdooMedium,
  selectMarketing,
} from 'src/store/slices/marketing-slice';

import { marketingService } from 'src/services/marketing-service';

import { Iconify } from 'src/components/iconify';
import { showToast } from 'src/components/toast';

import { FeatureRouteShell } from 'src/sections/parity/feature-route-shell';

type WorkspaceProps = { 
  section?: string;
  mode?: string;
  workflowId?: string;
  [key: string]: any;
};

export function MarketingWorkspaceView({ section, mode, workflowId }: WorkspaceProps = {}) {
  const defaultTab = section === 'sources' ? 'sources' : section === 'mediums' ? 'mediums' : section === 'analytics' ? 'analytics' : 'campaigns';
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [campaignSearch, setCampaignSearch] = useState('');
  const [campaignPage, setCampaignPage] = useState(0);
  const [campaignRowsPerPage, setCampaignRowsPerPage] = useState(10);
  const [sourceSearch, setSourceSearch] = useState('');
  const [sourcePage, setSourcePage] = useState(0);
  const [sourceRowsPerPage, setSourceRowsPerPage] = useState(10);
  const [mediumSearch, setMediumSearch] = useState('');
  const [mediumPage, setMediumPage] = useState(0);
  const [mediumRowsPerPage, setMediumRowsPerPage] = useState(10);
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [nameDialogMode, setNameDialogMode] = useState<NameMode>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [insightsPage, setInsightsPage] = useState(0);
  const [insightsRowsPerPage, setInsightsRowsPerPage] = useState(10);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [inlineCampaignEditId, setInlineCampaignEditId] = useState<string | null>(null);
  const [inlineCampaignName, setInlineCampaignName] = useState('');
  const [busyCampaignId, setBusyCampaignId] = useState<string | null>(null);
  const [busySourceId, setBusySourceId] = useState<string | null>(null);
  const [busyMediumId, setBusyMediumId] = useState<string | null>(null);
  const [pendingCampaignDelete, setPendingCampaignDelete] = useState<PendingCampaignDelete>(null);

  const dispatch = useAppDispatch();
  const { odooCampaigns, odooSources, odooMediums, odooAnalytics, odooInsights } = useAppSelector(selectMarketing);

  const refreshAll = () => {
    dispatch(fetchOdooCampaigns({ search: campaignSearch, page: campaignPage + 1, pageSize: campaignRowsPerPage }));
    dispatch(fetchOdooSources({ search: sourceSearch, page: sourcePage + 1, pageSize: sourceRowsPerPage }));
    dispatch(fetchOdooMediums({ search: mediumSearch, page: mediumPage + 1, pageSize: mediumRowsPerPage }));
    dispatch(fetchOdooAnalytics({ dateFrom, dateTo }));
    if (selectedCampaignId) {
      dispatch(fetchOdooInsights({ id: selectedCampaignId, params: { page: insightsPage + 1, pageSize: insightsRowsPerPage } }));
    }
  };

  useMemo(() => {
    dispatch(fetchOdooCampaigns({ search: campaignSearch, page: campaignPage + 1, pageSize: campaignRowsPerPage }));
  }, [dispatch, campaignSearch, campaignPage, campaignRowsPerPage]);

  useMemo(() => {
    dispatch(fetchOdooSources({ search: sourceSearch, page: sourcePage + 1, pageSize: sourceRowsPerPage }));
  }, [dispatch, sourceSearch, sourcePage, sourceRowsPerPage]);

  useMemo(() => {
    dispatch(fetchOdooMediums({ search: mediumSearch, page: mediumPage + 1, pageSize: mediumRowsPerPage }));
  }, [dispatch, mediumSearch, mediumPage, mediumRowsPerPage]);

  useMemo(() => {
    dispatch(fetchOdooAnalytics({ dateFrom, dateTo }));
  }, [dispatch, dateFrom, dateTo]);

  useMemo(() => {
    if (selectedCampaignId) {
      dispatch(fetchOdooInsights({ id: selectedCampaignId, params: { page: insightsPage + 1, pageSize: insightsRowsPerPage } }));
    }
  }, [dispatch, selectedCampaignId, insightsPage, insightsRowsPerPage]);

  const campaignsRows = odooCampaigns.data;
  const campaignTotal = odooCampaigns.total;
  const sources = odooSources.data;
  const sourcesTotal = odooSources.total;
  const mediums = odooMediums.data;
  const mediumsTotal = odooMediums.total;
  const analytics = odooAnalytics.data;

  const isBusy = odooCampaigns.loading || odooSources.loading || odooMediums.loading || odooAnalytics.loading;

  const handleCreateCampaign = async (name: string) => {
    try {
      await dispatch(createOdooCampaign({ name })).unwrap();
      showToast({ severity: 'success', message: 'Campaign created.' });
      closeNameDialog();
    } catch (err: any) {
      showToast({ severity: 'error', message: err });
    }
  };

  const handleUpdateCampaign = async (id: string, name: string) => {
    try {
      setBusyCampaignId(id);
      await dispatch(updateOdooCampaign({ id, name })).unwrap();
      showToast({ severity: 'success', message: 'Campaign updated.' });
      closeNameDialog();
      setInlineCampaignEditId(null);
      setInlineCampaignName('');
    } catch (err: any) {
      showToast({ severity: 'error', message: err });
    } finally {
      setBusyCampaignId(null);
    }
  };

  const handleCampaignAction = async (id: string, action: 'launch' | 'pause' | 'archive') => {
    try {
      setBusyCampaignId(id);
      await dispatch(setOdooCampaignAction({ id, action })).unwrap();
      showToast({ severity: 'success', message: 'Campaign status updated.' });
    } catch (err: any) {
      showToast({ severity: 'error', message: err });
    } finally {
      setBusyCampaignId(null);
    }
  };

  const handleCreateSource = async (name: string) => {
    try {
      await dispatch(createOdooSource({ name })).unwrap();
      showToast({ severity: 'success', message: 'Source created.' });
      closeNameDialog();
    } catch (err: any) {
      showToast({ severity: 'error', message: err });
    }
  };

  const handleUpdateSource = async (id: string, name?: string, active?: boolean) => {
    try {
      setBusySourceId(id);
      await dispatch(updateOdooSource({ id, name, active })).unwrap();
      showToast({ severity: 'success', message: 'Source updated.' });
      closeNameDialog();
    } catch (err: any) {
      showToast({ severity: 'error', message: err });
    } finally {
      setBusySourceId(null);
    }
  };

  const handleDeleteSource = async (id: string) => {
    try {
      setBusySourceId(id);
      await dispatch(deleteOdooSource(id)).unwrap();
      showToast({ severity: 'success', message: 'Source deleted.' });
      setPendingDelete(null);
    } catch (err: any) {
      showToast({ severity: 'error', message: err });
    } finally {
      setBusySourceId(null);
    }
  };

  const handleCreateMedium = async (name: string) => {
    try {
      await dispatch(createOdooMedium({ name })).unwrap();
      showToast({ severity: 'success', message: 'Medium created.' });
      closeNameDialog();
    } catch (err: any) {
      showToast({ severity: 'error', message: err });
    }
  };

  const handleUpdateMedium = async (id: string, name?: string, active?: boolean) => {
    try {
      setBusyMediumId(id);
      await dispatch(updateOdooMedium({ id, name, active })).unwrap();
      showToast({ severity: 'success', message: 'Medium updated.' });
      closeNameDialog();
    } catch (err: any) {
      showToast({ severity: 'error', message: err });
    } finally {
      setBusyMediumId(null);
    }
  };

  const handleDeleteMedium = async (id: string) => {
    try {
      setBusyMediumId(id);
      await dispatch(deleteOdooMedium(id)).unwrap();
      showToast({ severity: 'success', message: 'Medium deleted.' });
      setPendingDelete(null);
    } catch (err: any) {
      showToast({ severity: 'error', message: err });
    } finally {
      setBusyMediumId(null);
    }
  };

  const openNameDialog = (mode: NameMode, current?: { id?: string; name?: string }) => {
    setNameDialogMode(mode);
    setEditingId(current?.id || null);
    setNameInput(current?.name || '');
    setNameDialogOpen(true);
  };
  const closeNameDialog = () => {
    setNameDialogOpen(false);
    setNameDialogMode(null);
    setEditingId(null);
    setNameInput('');
  };

  const submitNameDialog = () => {
    const name = nameInput.trim();
    if (!name || !nameDialogMode) return;
    if (nameDialogMode === 'campaign') {
      if (editingId) handleUpdateCampaign(editingId, name);
      else handleCreateCampaign(name);
      return;
    }
    if (nameDialogMode === 'source') {
      if (editingId) handleUpdateSource(editingId, name);
      else handleCreateSource(name);
      return;
    }
    if (nameDialogMode === 'medium') {
      if (editingId) handleUpdateMedium(editingId, name);
      else handleCreateMedium(name);
    }
  };


  return (
    <FeatureRouteShell
      title="Marketing Workspace"
      description="Campaigns, attribution, and conversion analytics in one workspace."
      links={[{ href: '#', label: 'Campaigns' }, { href: '#', label: 'Sources' }, { href: '#', label: 'Analytics' }]}
      action={<Button variant="contained" startIcon={<Iconify icon="solar:add-circle-bold" />} onClick={() => openNameDialog('campaign')}>New campaign</Button>}
    >
      <Tabs value={activeTab} onChange={(_e, value) => setActiveTab(value)} sx={{ mb: 3 }}>
        <Tab value="campaigns" label="Campaigns" />
        <Tab value="sources" label="Sources" />
        <Tab value="mediums" label="Mediums" />
        <Tab value="analytics" label="Analytics" />
      </Tabs>

      {isBusy ? (
        <Stack alignItems="center" sx={{ py: 6 }}><CircularProgress /></Stack>
      ) : (
        <>
          {activeTab === 'campaigns' && (
            <Card sx={{ p: 3 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" sx={{ mb: 2 }}>
                <TextField
                  size="small"
                  label="Search campaigns"
                  value={campaignSearch}
                  onChange={(e) => {
                    setCampaignSearch(e.target.value);
                    setCampaignPage(0);
                  }}
                />
                <Button
                  variant="contained"
                  startIcon={<Iconify icon="solar:add-circle-bold" />}
                  onClick={() => openNameDialog('campaign')}
                >
                  Create campaign
                </Button>
              </Stack>
              <TableContainer>
                <Table>
                  <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Status</TableCell><TableCell>Updated</TableCell><TableCell align="right">Actions</TableCell></TableRow></TableHead>
                  <TableBody>
                    {campaignRows.map((campaign: any) => (
                      <TableRow key={campaign.id}>
                        <TableCell>
                          {inlineCampaignEditId === campaign.id ? (
                            <Stack direction="row" spacing={1} alignItems="center">
                              <TextField
                                size="small"
                                value={inlineCampaignName}
                                onChange={(e) => setInlineCampaignName(e.target.value)}
                                sx={{ minWidth: 220 }}
                              />
                              <IconButton
                                color="success"
                                disabled={busyCampaignId === campaign.id}
                                onClick={() => {
                                  const next = inlineCampaignName.trim();
                                  if (!next) return;
                                  handleUpdateCampaign(campaign.id, next);
                                }}
                              >
                                {busyCampaignId === campaign.id ? <CircularProgress size={18} /> : <Iconify icon="solar:check-circle-bold" />}
                              </IconButton>
                              <IconButton
                                color="inherit"
                                onClick={() => {
                                  setInlineCampaignEditId(null);
                                  setInlineCampaignName('');
                                }}
                              >
                                <Iconify icon="solar:close-circle-bold" />
                              </IconButton>
                            </Stack>
                          ) : (
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography>{campaign.name}</Typography>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setInlineCampaignEditId(campaign.id);
                                  setInlineCampaignName(campaign.name || '');
                                }}
                              >
                                <Iconify icon="solar:pen-2-bold" />
                              </IconButton>
                            </Stack>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            color={campaign.status === 'archived' ? 'default' : campaign.status === 'paused' ? 'warning' : 'success'}
                            label={campaign.status === 'archived' ? 'Archived' : campaign.status === 'paused' ? 'Paused' : 'Active'}
                          />
                        </TableCell>
                        <TableCell>{campaign.updatedAt || '-'}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button
                              size="small"
                              variant="outlined"
                              disabled={busyCampaignId === campaign.id}
                              onClick={() => {
                                setInsightsPage(0);
                                setSelectedCampaignId(campaign.id);
                              }}
                            >
                              Details
                            </Button>
                            <Button size="small" variant="outlined" disabled={busyCampaignId === campaign.id} onClick={() => handleCampaignAction(campaign.id, 'launch')}>Launch</Button>
                            <Button size="small" variant="outlined" disabled={busyCampaignId === campaign.id} onClick={() => handleCampaignAction(campaign.id, 'pause')}>Pause</Button>
                            <Button size="small" color="warning" variant="outlined" disabled={busyCampaignId === campaign.id} onClick={() => handleCampaignAction(campaign.id, 'archive')}>Archive</Button>
                            <IconButton
                              color="error"
                              disabled={busyCampaignId === campaign.id}
                              onClick={() => setPendingCampaignDelete({ id: campaign.id, name: campaign.name })}
                            >
                              {busyCampaignId === campaign.id ? <CircularProgress size={18} /> : <Iconify icon="solar:trash-bin-trash-bold" />}
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                    {campaignRows.length === 0 && <TableRow><TableCell colSpan={4} sx={{ py: 5, textAlign: 'center' }}>No campaigns found.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                component="div"
                count={campaignTotal}
                page={campaignPage}
                onPageChange={(_event, nextPage) => setCampaignPage(nextPage)}
                rowsPerPage={campaignRowsPerPage}
                onRowsPerPageChange={(event) => {
                  setCampaignRowsPerPage(Number(event.target.value));
                  setCampaignPage(0);
                }}
                rowsPerPageOptions={[10, 20, 50]}
              />
            </Card>
          )}

          {activeTab === 'sources' && (
            <Card sx={{ p: 3 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" sx={{ mb: 2 }}>
                <TextField
                  size="small"
                  label="Search sources"
                  value={sourceSearch}
                  onChange={(e) => {
                    setSourceSearch(e.target.value);
                    setSourcePage(0);
                  }}
                />
                <Button variant="contained" onClick={() => openNameDialog('source')}>New source</Button>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1.25}>
                {sources.map((source: any) => (
                  <Stack key={source.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.5, borderRadius: 1, bgcolor: 'background.neutral' }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Typography>{source.name}</Typography>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {source.active ? 'Active' : 'Inactive'}
                        </Typography>
                        <Switch
                          size="small"
                          checked={source.active !== false}
                          disabled={busySourceId === source.id}
                          onChange={(event) =>
                            handleUpdateSource(source.id, source.name, event.target.checked)
                          }
                        />
                      </Stack>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <IconButton color="info" disabled={busySourceId === source.id} onClick={() => openNameDialog('source', { id: source.id, name: source.name })}><Iconify icon="solar:pen-2-bold" /></IconButton>
                      <IconButton color="error" disabled={busySourceId === source.id} onClick={() => setPendingDelete({ kind: 'source', id: source.id, name: source.name })}>
                        {busySourceId === source.id ? <CircularProgress size={18} /> : <Iconify icon="solar:trash-bin-trash-bold" />}
                      </IconButton>
                    </Stack>
                  </Stack>
                ))}
                {sources.length === 0 && <Alert severity="info">No sources configured.</Alert>}
              </Stack>
              <TablePagination
                component="div"
                count={sourcesTotal}
                page={sourcePage}
                onPageChange={(_event, nextPage) => setSourcePage(nextPage)}
                rowsPerPage={sourceRowsPerPage}
                onRowsPerPageChange={(event) => {
                  setSourceRowsPerPage(Number(event.target.value));
                  setSourcePage(0);
                }}
                rowsPerPageOptions={[10, 20, 50]}
              />
            </Card>
          )}

          {activeTab === 'mediums' && (
            <Card sx={{ p: 3 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" sx={{ mb: 2 }}>
                <TextField
                  size="small"
                  label="Search mediums"
                  value={mediumSearch}
                  onChange={(e) => {
                    setMediumSearch(e.target.value);
                    setMediumPage(0);
                  }}
                />
                <Button variant="contained" onClick={() => openNameDialog('medium')}>New medium</Button>
              </Stack>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={1.25}>
                {mediums.map((medium: any) => (
                  <Stack key={medium.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ p: 1.5, borderRadius: 1, bgcolor: 'background.neutral' }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Typography>{medium.name}</Typography>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {medium.active ? 'Active' : 'Inactive'}
                        </Typography>
                        <Switch
                          size="small"
                          checked={medium.active !== false}
                          disabled={busyMediumId === medium.id}
                          onChange={(event) =>
                            handleUpdateMedium(medium.id, medium.name, event.target.checked)
                          }
                        />
                      </Stack>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <IconButton color="info" disabled={busyMediumId === medium.id} onClick={() => openNameDialog('medium', { id: medium.id, name: medium.name })}><Iconify icon="solar:pen-2-bold" /></IconButton>
                      <IconButton color="error" disabled={busyMediumId === medium.id} onClick={() => setPendingDelete({ kind: 'medium', id: medium.id, name: medium.name })}>
                        {busyMediumId === medium.id ? <CircularProgress size={18} /> : <Iconify icon="solar:trash-bin-trash-bold" />}
                      </IconButton>
                    </Stack>
                  </Stack>
                ))}
                {mediums.length === 0 && <Alert severity="info">No mediums configured.</Alert>}
              </Stack>
              <TablePagination
                component="div"
                count={mediumsTotal}
                page={mediumPage}
                onPageChange={(_event, nextPage) => setMediumPage(nextPage)}
                rowsPerPage={mediumRowsPerPage}
                onRowsPerPageChange={(event) => {
                  setMediumRowsPerPage(Number(event.target.value));
                  setMediumPage(0);
                }}
                rowsPerPageOptions={[10, 20, 50]}
              />
            </Card>
          )}

          {activeTab === 'analytics' && (
            <Stack spacing={2}>
              <Card sx={{ p: 3 }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 2 }}>
                  <TextField size="small" type="date" label="From" InputLabelProps={{ shrink: true }} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  <TextField size="small" type="date" label="To" InputLabelProps={{ shrink: true }} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </Stack>
                <Typography variant="h6" sx={{ mb: 2 }}>Marketing KPI</Typography>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <Metric label="Total campaigns" value={analytics?.totalCampaigns ?? 0} />
                  <Metric label="Active campaigns" value={analytics?.activeCampaigns ?? 0} />
                  <Metric label="Total leads" value={analytics?.totalLeads ?? 0} />
                  <Metric label="Opportunities" value={analytics?.totalOpportunities ?? 0} />
                  <Metric label="Conversion" value={`${analytics?.conversionRate ?? 0}%`} />
                  <Metric label="Revenue" value={`$${Number(analytics?.revenue ?? 0).toFixed(2)}`} />
                </Stack>
              </Card>
            </Stack>
          )}
        </>
      )}

      <Dialog open={nameDialogOpen} onClose={closeNameDialog}>
        <DialogTitle>{editingId ? 'Edit' : 'Create'} {nameDialogMode || 'item'}</DialogTitle>
        <DialogContent>
          <TextField autoFocus margin="dense" fullWidth label="Name" value={nameInput} onChange={(event) => setNameInput(event.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeNameDialog}>Cancel</Button>
          <Button variant="contained" disabled={!nameInput.trim()} onClick={submitNameDialog}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(pendingDelete)} onClose={() => setPendingDelete(null)}>
        <DialogTitle>Delete {pendingDelete?.kind || 'item'}?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            This will permanently delete {pendingDelete?.name || 'this item'}.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingDelete(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (!pendingDelete) return;
              if (pendingDelete.kind === 'source') handleDeleteSource(pendingDelete.id);
              if (pendingDelete.kind === 'medium') handleDeleteMedium(pendingDelete.id);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(pendingCampaignDelete)} onClose={() => setPendingCampaignDelete(null)}>
        <DialogTitle>Archive campaign?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            This will archive {pendingCampaignDelete?.name || 'this campaign'} and keep its data.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPendingCampaignDelete(null)}>Cancel</Button>
          <Button
            color="warning"
            variant="contained"
            onClick={() => {
              if (!pendingCampaignDelete) return;
              handleCampaignAction(pendingCampaignDelete.id, 'archive');
              setPendingCampaignDelete(null);
            }}
          >
            Archive
          </Button>
        </DialogActions>
      </Dialog>

      <Drawer anchor="right" open={Boolean(selectedCampaignId)} onClose={() => setSelectedCampaignId(null)}>
        <Box sx={{ width: 520, p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Campaign Insights</Typography>
          {odooInsights.loading ? (
            <CircularProgress />
          ) : (
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Related Leads ({odooInsights.data?.leadsTotal ?? 0})
                </Typography>
                <Stack spacing={1}>
                  {(odooInsights.data?.leads || []).map((lead: any) => (
                    <Alert key={`lead-${lead.id}`} severity="info">{lead.name} • {lead.type || 'lead'} • {lead.email_from || 'No email'}</Alert>
                  ))}
                  {(odooInsights.data?.leads || []).length === 0 && <Alert severity="warning">No leads linked.</Alert>}
                </Stack>
              </Box>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Related Orders ({odooInsights.data?.ordersTotal ?? 0})
                </Typography>
                <Stack spacing={1}>
                  {(odooInsights.data?.orders || []).map((order: any) => (
                    <Alert key={`order-${order.id}`} severity="success">{order.name || `Order #${order.id}`} • ${Number(order.amount_total || 0).toFixed(2)} • {order.state}</Alert>
                  ))}
                  {(odooInsights.data?.orders || []).length === 0 && <Alert severity="warning">No orders linked.</Alert>}
                </Stack>
              </Box>

              <TablePagination
                component="div"
                count={Math.max(Number(odooInsights.data?.leadsTotal || 0), Number(odooInsights.data?.ordersTotal || 0))}
                page={insightsPage}
                onPageChange={(_event, nextPage) => setInsightsPage(nextPage)}
                rowsPerPage={insightsRowsPerPage}
                onRowsPerPageChange={(event) => {
                  setInsightsRowsPerPage(Number(event.target.value));
                  setInsightsPage(0);
                }}
                rowsPerPageOptions={[5, 10, 20]}
              />
            </Stack>
          )}
        </Box>
      </Drawer>
    </FeatureRouteShell>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <Box sx={{ p: 2, borderRadius: 1.5, bgcolor: 'background.neutral', minWidth: 140 }}>
      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
      <Typography variant="h6">{value}</Typography>
    </Box>
  );
}
