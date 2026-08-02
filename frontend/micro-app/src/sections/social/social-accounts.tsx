'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { 
  fetchSocialAccountsThunk, 
  selectSocial 
} from 'src/store/slices/social-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function SocialAccounts() {
  const dispatch = useAppDispatch();
  const { accounts } = useAppSelector(selectSocial);

  useEffect(() => {
    dispatch(fetchSocialAccountsThunk());
  }, [dispatch]);

  const platforms = [
    { id: 'facebook', name: 'Facebook', icon: 'logos:facebook', color: '#1877F2' },
    { id: 'instagram', name: 'Instagram', icon: 'skill-icons:instagram', color: '#E4405F' },
    { id: 'twitter', name: 'Twitter (X)', icon: 'logos:twitter', color: '#1DA1F2' },
    { id: 'linkedin', name: 'LinkedIn', icon: 'logos:linkedin-icon', color: '#0A66C2' },
  ];

  const accountsList = accounts.data || [];
  const isLoading = accounts.loading;

  if (isLoading && !accountsList.length) {
    return <CircularProgress />;
  }

  return (
    <Grid container spacing={3}>
      {platforms.map((platform) => {
        const connectedAccount = accountsList.find((acc: any) => acc.platform === platform.id);
        return (
          <Grid item xs={12} sm={6} md={3} key={platform.id}>
            <Card sx={{ p: 3, textAlign: 'center' }}>
              <Box
                sx={{
                  mb: 2,
                  width: 64,
                  height: 64,
                  mx: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 2,
                  bgcolor: 'background.neutral',
                }}
              >
                <Iconify icon={platform.icon} width={40} />
              </Box>
              <Typography variant="h6">{platform.name}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 2 }}>
                {connectedAccount ? `Connected as ${connectedAccount.username}` : 'Not connected'}
              </Typography>
              <Button
                fullWidth
                variant={connectedAccount ? 'soft' : 'contained'}
                color={connectedAccount ? 'error' : 'primary'}
                startIcon={<Iconify icon={connectedAccount ? 'solar:link-break-bold' : 'solar:link-bold'} />}
              >
                {connectedAccount ? 'Disconnect' : 'Connect'}
              </Button>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}

// ----------------------------------------------------------------------

export function SocialComposer() {
  const [selectedPlatforms, setSelectedPlatforms] = useState(['facebook', 'instagram']);

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={7}>
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>Compose Post</Typography>
          <Stack spacing={3}>
             <Box>
                <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Select Platforms</Typography>
                <Stack direction="row" spacing={1.5}>
                   {['facebook', 'instagram', 'twitter', 'linkedin'].map((id) => (
                      <IconButton
                        key={id}
                        onClick={() => togglePlatform(id)}
                        sx={{
                           p: 1,
                           borderRadius: 1.5,
                           bgcolor: selectedPlatforms.includes(id) ? 'primary.lighter' : 'background.neutral',
                           border: (theme) => `1px solid ${selectedPlatforms.includes(id) ? theme.palette.primary.main : 'transparent'}`,
                        }}
                      >
                         <Iconify
                            icon={id === 'facebook' ? 'logos:facebook' : id === 'instagram' ? 'skill-icons:instagram' : id === 'twitter' ? 'logos:twitter' : 'logos:linkedin-icon'}
                            width={24}
                            sx={{ opacity: selectedPlatforms.includes(id) ? 1 : 0.4 }}
                         />
                      </IconButton>
                   ))}
                </Stack>
             </Box>

             <TextField
               fullWidth
               multiline
               rows={6}
               placeholder="What's on your mind?"
               label="Post Content"
             />

             <Box
               sx={{
                 p: 3,
                 border: '2px dashed',
                 borderColor: 'divider',
                 borderRadius: 1.5,
                 textAlign: 'center',
                 cursor: 'pointer',
                 '&:hover': { bgcolor: 'action.hover' }
               }}
             >
                <Iconify icon="solar:upload-minimalistic-bold-duotone" width={40} sx={{ color: 'text.disabled', mb: 1 }} />
                <Typography variant="subtitle2">Add Images or Video</Typography>
                <Typography variant="caption" color="text.secondary">Drag and drop files here</Typography>
             </Box>

             <Stack direction="row" spacing={2}>
                <Button variant="outlined" fullWidth size="large">Schedule for Later</Button>
                <Button variant="contained" fullWidth size="large">Post Now</Button>
             </Stack>
          </Stack>
        </Card>
      </Grid>

      <Grid item xs={12} md={5}>
         <Card sx={{ p: 3, bgcolor: 'background.neutral', height: '100%' }}>
            <Typography variant="h6" sx={{ mb: 3 }}>Preview</Typography>
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1.5, boxShadow: (theme) => theme.customShadows.z8 }}>
               <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                  <Avatar sx={{ width: 40, height: 40 }} />
                  <Box>
                     <Typography variant="subtitle2">Your Page Name</Typography>
                     <Typography variant="caption" color="text.secondary">Just now • Facebook</Typography>
                  </Box>
               </Stack>
               <Typography variant="body2" sx={{ mb: 2 }}>
                  Your post content will appear here...
               </Typography>
               <Box sx={{ width: '100%', height: 240, bgcolor: 'background.neutral', borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Iconify icon="solar:gallery-bold" width={48} sx={{ color: 'text.disabled' }} />
               </Box>
            </Box>
         </Card>
      </Grid>
    </Grid>
  );
}
