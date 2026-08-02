'use client';

import Link from 'next/link';
import { useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { 
  fetchBuilderFormsThunk, 
  fetchBuilderFormTemplatesThunk, 
  fetchBuilderFormPreviewThunk,
  fetchBuilderWebsitesThunk,
  fetchBuilderWebsiteThunk,
  fetchBuilderWebsitePreviewThunk,
  fetchBuilderEmailCampaignsThunk,
  fetchBuilderWorkflowWorkspacesThunk,
  fetchBuilderReputationStatsThunk,
  createBuilderFormThunk,
  createBuilderWebsiteThunk,
  selectBuilder 
} from 'src/store/slices/builder-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { m } from 'framer-motion';
import { alpha } from '@mui/material/styles';
import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

type BuilderMode =
  | 'form-list'
  | 'form-create'
  | 'form-setting'
  | 'form-preview'
  | 'form-submitted'
  | 'email-editor'
  | 'webbuilder-create'
  | 'webbuilder-editor'
  | 'webbuilder-preview'
  | 'workflow'
  | 'social-proof'
  | 'social-scheduler'
  | 'reputation';

type Props = {
  mode: BuilderMode;
  id?: string;
  type?: string;
  template?: string;
  previewPath?: string;
  websiteId?: string;
  pageSlug?: string;
};

export function BuilderWorkspaceView({
  mode,
  id,
  type,
  template,
  previewPath,
  websiteId,
  pageSlug,
}: Props) {
  const dispatch = useAppDispatch();
  const builderState = useAppSelector(selectBuilder);
  
  const formMethods = useForm({
    defaultValues: {
      title: '',
      name: '',
      formCategory: '',
      type: type || 'form',
      template: template || '',
    },
  });
  const websiteMethods = useForm({
    defaultValues: {
      name: '',
      type: type || 'business',
    },
  });

  useEffect(() => {
    if (['form-list', 'form-create', 'form-setting'].includes(mode)) {
      dispatch(fetchBuilderFormsThunk());
    }
    if (['form-list', 'form-create'].includes(mode)) {
      dispatch(fetchBuilderFormTemplatesThunk());
    }
    if (['form-setting', 'form-preview'].includes(mode) && id) {
      dispatch(fetchBuilderFormPreviewThunk(id));
    }
    if (['webbuilder-create', 'webbuilder-editor'].includes(mode)) {
      dispatch(fetchBuilderWebsitesThunk());
    }
    if (mode === 'webbuilder-editor' && id) {
      dispatch(fetchBuilderWebsiteThunk(id));
    }
    if (mode === 'webbuilder-preview' && websiteId) {
      dispatch(fetchBuilderWebsitePreviewThunk({ websiteId, pageSlug }));
    }
    if (mode === 'email-editor') {
      dispatch(fetchBuilderEmailCampaignsThunk());
    }
    if (mode === 'workflow') {
      dispatch(fetchBuilderWorkflowWorkspacesThunk());
    }
    if (['social-proof', 'reputation'].includes(mode)) {
      dispatch(fetchBuilderReputationStatsThunk());
    }
  }, [dispatch, mode, id, websiteId, pageSlug]);

  const handleCreateForm = async (values: any) => {
    try {
      await dispatch(createBuilderFormThunk(values)).unwrap();
      formMethods.reset();
      dispatch(fetchBuilderFormsThunk());
      toast.success('Form created');
    } catch (err) {
      toast.error(err || 'Failed to create form');
    }
  };

  const handleCreateWebsite = async (values: any) => {
    try {
      await dispatch(createBuilderWebsiteThunk(values)).unwrap();
      websiteMethods.reset();
      dispatch(fetchBuilderWebsitesThunk());
      toast.success('Website created');
    } catch (err) {
      toast.error(err || 'Failed to create website');
    }
  };

  const isLoading = useMemo(() => {
    if (mode === 'form-list') return builderState.forms.loading || builderState.formTemplates.loading;
    if (mode === 'form-create') return builderState.formTemplates.loading;
    if (mode === 'form-setting') return builderState.formPreview.loading;
    if (mode === 'form-preview') return builderState.formPreview.loading;
    if (mode === 'webbuilder-create') return builderState.websites.loading;
    if (mode === 'webbuilder-editor') return builderState.currentWebsite.loading;
    if (mode === 'webbuilder-preview') return builderState.websitePreview.loading;
    if (mode === 'email-editor') return builderState.emailCampaigns.loading;
    if (mode === 'workflow') return builderState.workflowWorkspaces.loading;
    if (mode === 'social-proof' || mode === 'reputation') return builderState.reputationStats.loading;
    return false;
  }, [mode, builderState]);

  const relatedLinks = useMemo(
    () => [
      { href: paths.dashboard.formBuilder, label: 'Form Funnel' },
      { href: paths.dashboard.emailEditor, label: 'Email Editor' },
      { href: paths.dashboard.webBuilderCreate, label: 'Web Builder' },
      { href: paths.dashboard.workflow, label: 'Workflow' },
      { href: paths.dashboard.webToolsReputation, label: 'Reputation' },
    ],
    []
  );

  if (isLoading && !builderState.forms.data.length && !builderState.websites.data.length) {
    return (
      <Box sx={{ py: 10, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 5 }}>
      <Stack spacing={4}>
        <Box
          component={m.div}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          sx={{
            p: 4,
            borderRadius: 3,
            position: 'relative',
            overflow: 'hidden',
            bgcolor: 'background.paper',
            border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            boxShadow: (theme) => `0 8px 32px 0 ${alpha(theme.palette.common.black, 0.08)}`,
            '&:before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '4px',
              background: (theme) =>
                `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.info.main})`,
            },
          }}
        >
          <Typography variant="h4">
            {mode === 'form-list'
              ? 'Form Funnel'
              : mode === 'form-create'
                ? 'Create Form Funnel'
                : mode === 'form-setting'
                  ? 'Form Settings'
                  : mode === 'form-preview'
                    ? 'Form Preview'
                    : mode === 'form-submitted'
                      ? 'Form Submitted'
                      : mode === 'email-editor'
                        ? 'Email Editor'
                        : mode === 'webbuilder-create'
                          ? 'Web Builder'
                          : mode === 'webbuilder-editor'
                            ? 'Website Editor'
                            : mode === 'webbuilder-preview'
                              ? 'Website Preview'
                              : mode === 'workflow'
                                ? 'Workflow'
                                : mode === 'social-proof'
                                  ? 'Social Proof'
                                  : mode === 'social-scheduler'
                                    ? 'Social Scheduler'
                                    : 'Reputation'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            Legacy builder and editor routes mapped into the micro-app with compatibility-backed data where available.
          </Typography>
        </Box>

        <Card
          component={m.div}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          sx={{
            p: 2,
            backdropFilter: 'blur(10px)',
            bgcolor: (theme) => alpha(theme.palette.background.paper, 0.8),
            border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {relatedLinks.map((link) => (
              <Button key={link.href} component={Link} href={link.href} variant="soft" color="inherit">
                {link.label}
              </Button>
            ))}
          </Stack>
        </Card>

        {mode === 'form-list' && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card
                component={m.div}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                sx={{
                  p: 3,
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                  border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
                  Funnels
                </Typography>
                <Typography variant="h3">{builderState.forms.data.length}</Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card
                component={m.div}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                sx={{
                  p: 3,
                  bgcolor: (theme) => alpha(theme.palette.info.main, 0.04),
                  border: (theme) => `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                }}
              >
                <Typography variant="h6" sx={{ mb: 2, color: 'info.main' }}>
                  Templates
                </Typography>
                <Typography variant="h3">{builderState.formTemplates.data.length}</Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card
                component={m.div}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                sx={{ p: 3 }}
              >
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Quick Actions
                </Typography>
                <Stack spacing={1}>
                  <Button component={Link} href={paths.dashboard.formBuilderCreate('form', 'blank', 'new')} variant="contained">
                    New Form
                  </Button>
                  <Button component={Link} href={paths.dashboard.webBuilderCreate} variant="outlined">
                    New Website
                  </Button>
                </Stack>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card sx={{ p: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Existing Forms
                </Typography>
                <Stack spacing={1.5}>
                  {(builderState.forms.data || []).slice(0, 8).map((form: any, index: number) => (
                    <Box key={form._id || form.id || index} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.neutral' }}>
                      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={1}>
                        <Box>
                          <Typography variant="subtitle2">{form.title || form.name || `Form ${index + 1}`}</Typography>
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {form.formCategory?.name || form.type || 'No category'}
                          </Typography>
                        </Box>
                        <Stack direction="row" spacing={1}>
                          <Button
                            component={Link}
                            href={paths.dashboard.formBuilderSetting(form._id || form.id || 'new')}
                            size="small"
                            variant="outlined"
                          >
                            Settings
                          </Button>
                          <Button
                            component={Link}
                            href={paths.public.formPreview(form._id || form.id || 'new', 'default')}
                            size="small"
                            variant="soft"
                            color="inherit"
                          >
                            Preview
                          </Button>
                        </Stack>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              </Card>
            </Grid>
          </Grid>
        )}

        {mode === 'form-create' && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Create Form
                </Typography>
                <Stack
                  component="form"
                  spacing={2}
                  onSubmit={formMethods.handleSubmit(handleCreateForm)}
                >
                  <TextField label="Title" {...formMethods.register('title')} />
                  <TextField label="Internal Name" {...formMethods.register('name')} />
                  <TextField label="Type" {...formMethods.register('type')} />
                  <TextField label="Template" {...formMethods.register('template')} />
                  <TextField label="Category" {...formMethods.register('formCategory')} />
                  <Button type="submit" variant="contained">
                    Create Form
                  </Button>
                </Stack>
              </Card>
            </Grid>
            <Grid item xs={12} md={5}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Legacy Route Context
                </Typography>
                <Typography variant="body2">type: {type || 'n/a'}</Typography>
                <Typography variant="body2">template: {template || 'n/a'}</Typography>
                <Typography variant="body2">id: {id || 'n/a'}</Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Available templates
                </Typography>
                <Stack spacing={1}>
                  {(builderState.formTemplates.data || []).slice(0, 6).map((item: any, index: number) => (
                    <Typography key={item._id || item.id || index} variant="body2" sx={{ color: 'text.secondary' }}>
                      {item.title || item.name || `Template ${index + 1}`}
                    </Typography>
                  ))}
                </Stack>
              </Card>
            </Grid>
          </Grid>
        )}

        {mode === 'form-setting' && (
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6">{builderState.formPreview.data?.title || builderState.formPreview.data?.name || id}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Form settings and edit-route surface now resolve in the new app. Deep drag-and-drop editor parity still needs a dedicated builder implementation pass.
              </Typography>
              <Alert severity="info">
                This route is backed by the legacy form-builder compatibility API for current form data.
              </Alert>
            </Stack>
          </Card>
        )}

        {mode === 'form-preview' && (
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6">{builderState.formPreview.data?.title || builderState.formPreview.data?.name || id}</Typography>
              <Typography variant="body2">path: {previewPath || 'default'}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Public form preview route is available in the micro-app. Rendering is currently compatibility-backed from the legacy form definition.
              </Typography>
            </Stack>
          </Card>
        )}

        {mode === 'form-submitted' && (
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6">Submission Received</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                The legacy submitted state route now exists in the new app for public form flows.
              </Typography>
              <Typography variant="body2">Form ID: {id || 'n/a'}</Typography>
            </Stack>
          </Card>
        )}

        {mode === 'email-editor' && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Email Campaigns
                </Typography>
                <Typography variant="h3">{builderState.emailCampaigns.data.length}</Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={8}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Editor Context
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  The email editor route now resolves in the micro-app and is tied into marketing campaign data. Full drag-and-drop editor parity still needs a dedicated editor implementation.
                </Typography>
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Campaign ID: {id || 'new'}
                </Typography>
              </Card>
            </Grid>
          </Grid>
        )}

        {mode === 'webbuilder-create' && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Create Website
                </Typography>
                <Stack
                  component="form"
                  spacing={2}
                  onSubmit={websiteMethods.handleSubmit(handleCreateWebsite)}
                >
                  <TextField label="Website Name" {...websiteMethods.register('name')} />
                  <TextField label="Website Type" {...websiteMethods.register('type')} />
                  <Button type="submit" variant="contained">
                    Create Website
                  </Button>
                </Stack>
              </Card>
            </Grid>
            <Grid item xs={12} md={5}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Existing Websites
                </Typography>
                <Stack spacing={1.5}>
                  {(builderState.websites.data || []).slice(0, 6).map((site: any, index: number) => (
                    <Box key={site._id || site.id || index} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.neutral' }}>
                      <Typography variant="subtitle2">{site.name || site.title || `Website ${index + 1}`}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {site.domain || site.slug || site.type || 'No domain yet'}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Card>
            </Grid>
          </Grid>
        )}

        {mode === 'webbuilder-editor' && (
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6">{builderState.currentWebsite.data?.name || builderState.currentWebsite.data?.title || id}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Website editor route now resolves in the micro-app and loads current website metadata from the compatibility API.
              </Typography>
              <Alert severity="info">
                Full visual editor parity, section manipulation, and publishing history still require a dedicated webbuilder editor implementation in the new frontend.
              </Alert>
            </Stack>
          </Card>
        )}

        {mode === 'webbuilder-preview' && (
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6">Website Preview</Typography>
              <Typography variant="body2">websiteId: {websiteId || 'n/a'}</Typography>
              <Typography variant="body2">pageSlug: {pageSlug || 'home'}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Public webbuilder preview route is present and loads preview data through the compatibility API.
              </Typography>
              <Typography variant="body2">
                Preview title: {builderState.websitePreview.data?.title || builderState.websitePreview.data?.name || 'Preview available'}
              </Typography>
            </Stack>
          </Card>
        )}

        {mode === 'workflow' && (
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6">Workflow Workspaces</Typography>
              <Typography variant="h3">{builderState.workflowWorkspaces.data.length}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                The top-level workflow route now resolves alongside the deeper workflow builder routes that were already added earlier.
              </Typography>
            </Stack>
          </Card>
        )}

        {mode === 'social-proof' && (
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6">Social Proof</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Legacy social-proof route now resolves in the new app. It currently shares reputation performance data until a dedicated social-proof microservice/frontend slice is built.
              </Typography>
              <Typography variant="body2">
                Reviews tracked: {builderState.reputationStats.data?.reviewsCount || builderState.reputationStats.data?.totalReviews || 'n/a'}
              </Typography>
            </Stack>
          </Card>
        )}

        {mode === 'social-scheduler' && (
          <Card sx={{ p: 3 }}>
            <Stack spacing={2}>
              <Typography variant="h6">Social Scheduler</Typography>
              <Alert severity="info">
                The legacy scheduler route now exists in the new app, but scheduling workflows still need a dedicated migration from the MySocial stack.
              </Alert>
            </Stack>
          </Card>
        )}

        {mode === 'reputation' && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Total Reviews
                </Typography>
                <Typography variant="h3">
                  {builderState.reputationStats.data?.totalReviews || builderState.reputationStats.data?.reviewsCount || 0}
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Average Rating
                </Typography>
                <Typography variant="h3">
                  {builderState.reputationStats.data?.averageRating || builderState.reputationStats.data?.avgRating || '0.0'}
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Unreplied
                </Typography>
                <Typography variant="h3">
                  {builderState.reputationStats.data?.unrepliedCount || builderState.reputationStats.data?.pendingReplies || 0}
                </Typography>
              </Card>
            </Grid>
          </Grid>
        )}
      </Stack>
    </Container>
  );
}
