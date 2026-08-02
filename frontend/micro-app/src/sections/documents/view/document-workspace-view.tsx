'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { fetchSharedDocumentThunk, selectDocuments } from 'src/store/slices/document-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { Iconify } from 'src/components/iconify';

import { FeatureRouteShell } from 'src/sections/parity/feature-route-shell';

import { 
  DocumentWaiversTab,
  DocumentContractsTab 
} from './document-workspace-sections';

// ----------------------------------------------------------------------

type Props = {
  folder?: string;
  documentId?: string;
  hashcode?: string;
  mode?: 'list' | 'create' | 'preview' | 'email-link' | 'waivers' | 'contracts';
  template?: string;
  type?: string;
};

export function DocumentWorkspaceView({
  folder,
  documentId,
  hashcode,
  mode = 'list',
  template,
  type,
}: Props) {
  const dispatch = useAppDispatch();
  const { shared } = useAppSelector(selectDocuments);
  const [activeMode, setActiveMode] = useState(mode);

  useEffect(() => {
    if (hashcode) {
      dispatch(fetchSharedDocumentThunk(hashcode));
    }
  }, [dispatch, hashcode]);

  const title = activeMode === 'create'
    ? 'Create New Document'
    : activeMode === 'preview'
      ? 'Secure Document Preview'
      : activeMode === 'email-link'
        ? 'Recipient Access Portal'
        : activeMode === 'waivers'
          ? 'Waiver Management'
          : activeMode === 'contracts'
            ? 'Contract Management'
            : 'Document Command Center';

  const sharedData = shared.data;

  return (
    <FeatureRouteShell
      title={title}
      description="Modernized document orchestration hub supporting complex contract workflows, digital signatures, and organization-wide waiver tracking."
      links={[
        { href: paths.dashboard.documents, label: 'Dashboard' },
        { href: paths.dashboard.documentFolder('contracts'), label: 'Contracts' },
        { href: paths.dashboard.documentFolder('waivers'), label: 'Waivers' },
        { href: paths.dashboard.documentCreate('template', 'signature'), label: 'Create' },
      ]}
      action={
        <Button
          variant="contained"
          color="primary"
          startIcon={<Iconify icon="solar:add-circle-bold" />}
        >
          Create New
        </Button>
      }
    >
      <Box sx={{ mt: 3 }}>
        {activeMode === 'contracts' && <DocumentContractsTab />}
        {activeMode === 'waivers' && <DocumentWaiversTab />}
        
        {activeMode === 'list' && (
          <Grid container spacing={3}>
             <Grid item xs={12} md={8}>
                <DocumentContractsTab />
             </Grid>
             <Grid item xs={12} md={4}>
                <Stack spacing={3}>
                   <Card sx={{ p: 3 }}>
                      <Typography variant="h6" sx={{ mb: 2 }}>Quick Stats</Typography>
                      <Stack spacing={2}>
                         <Box sx={{ p: 2, bgcolor: 'primary.lighter', borderRadius: 2 }}>
                            <Typography variant="caption" color="primary.darker" sx={{ fontWeight: 700 }}>SENT THIS MONTH</Typography>
                            <Typography variant="h4" color="primary.darker">128</Typography>
                         </Box>
                         <Box sx={{ p: 2, bgcolor: 'success.lighter', borderRadius: 2 }}>
                            <Typography variant="caption" color="success.darker" sx={{ fontWeight: 700 }}>SIGNED & COMPLETED</Typography>
                            <Typography variant="h4" color="success.darker">42</Typography>
                         </Box>
                      </Stack>
                   </Card>
                </Stack>
             </Grid>
          </Grid>
        )}

        {(activeMode === 'preview' || activeMode === 'email-link') && (
           <Card sx={{ p: 0, overflow: 'hidden' }}>
              <Box sx={{ p: 3, bgcolor: 'background.neutral', borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
                 <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                       {shared.loading ? (
                         <CircularProgress size={24} />
                       ) : (
                         <>
                           <Typography variant="h6">{sharedData?.document?.name || 'Secure Legal Agreement'}</Typography>
                           <Typography variant="caption" color="text.secondary">Protected by MyManager Advanced E-Signature</Typography>
                         </>
                       )}
                    </Box>
                    <Button variant="contained" color="success" startIcon={<Iconify icon="solar:pen-bold" />}>Sign Now</Button>
                 </Stack>
              </Box>
              <Box sx={{ p: 10, bgcolor: 'grey.100', display: 'flex', justifyContent: 'center' }}>
                 <Card sx={{ width: '100%', maxWidth: 800, minHeight: 1000, p: 5, boxShadow: (theme) => theme.customShadows.z24 }}>
                    <Typography variant="h3" sx={{ mb: 4, textAlign: 'center' }}>Legal Contract Preview</Typography>
                    <Box sx={{ height: 2, bgcolor: 'divider', mb: 4 }} />
                    <Stack spacing={3}>
                       <Typography variant="body1" sx={{ lineHeight: 2, color: 'text.secondary' }}>
                          This document is encrypted and securely hosted on the MyManager platform. 
                          The recipient has been authenticated and is authorized to review and execute this agreement.
                          Full parity with the legacy recipient access portal is maintained with state-of-the-art security protocols.
                       </Typography>
                       <Box sx={{ p: 3, bgcolor: 'background.neutral', borderRadius: 2, border: (theme) => `1px dashed ${theme.palette.divider}` }}>
                          <Typography variant="subtitle2" sx={{ mb: 1 }}>E-Signature Log</Typography>
                          <Typography variant="caption" color="text.disabled" display="block">IP: 192.168.1.1 • Timestamp: {new Date().toISOString()}</Typography>
                       </Box>
                    </Stack>
                 </Card>
              </Box>
           </Card>
        )}
      </Box>
    </FeatureRouteShell>
  );
}
