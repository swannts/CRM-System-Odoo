'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { 
  fetchOmniChatbots, 
  fetchOmniTriggersThunk,
  selectOmnichannel 
} from 'src/store/slices/omnichannel-slice';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function OmniAutomationView() {
  const dispatch = useAppDispatch();
  const { chatbots, triggers } = useAppSelector(selectOmnichannel);
  const [currentTab, setCurrentTab] = useState('chatbots');

  useEffect(() => {
    dispatch(fetchOmniChatbots());
    dispatch(fetchOmniTriggersThunk());
  }, [dispatch]);

  const chatbotsList = chatbots.data || [];
  const triggersList = triggers.data || [];
  const chatbotsLoading = chatbots.loading;
  const triggersLoading = triggers.loading;

  return (
    <DashboardContent maxWidth="xl">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 5 }}>
        <Box>
          <Typography variant="h4">Omnichannel Automation</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Configure AI chatbots and keyword-based triggers.
          </Typography>
        </Box>
      </Stack>

      <Tabs
        value={currentTab}
        onChange={(e, val) => setCurrentTab(val)}
        sx={{ mb: 5 }}
      >
        <Tab icon={<Iconify icon="solar:bot-bold" />} label="AI Chatbots" value="chatbots" />
        <Tab icon={<Iconify icon="solar:key-minimalistic-square-bold" />} label="Keyword Triggers" value="triggers" />
      </Tabs>

      {currentTab === 'chatbots' && (
        <Stack spacing={3}>
           {chatbotsLoading && !chatbotsList.length && <CircularProgress />}
           {chatbotsList.map((bot: any) => (
             <Card key={bot.id} sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                   <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{ p: 1.5, bgcolor: 'primary.lighter', color: 'primary.main', borderRadius: 1.5 }}>
                         <Iconify icon="solar:bot-bold" width={24} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1">{bot.name}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>Provider: {bot.provider}</Typography>
                      </Box>
                   </Stack>
                   <FormControlLabel control={<Switch checked={bot.isActive} />} label="Active" />
                </Stack>
                <Divider sx={{ borderStyle: 'dashed', my: 2 }} />
                <Typography variant="subtitle2" sx={{ mb: 1 }}>AI Prompt</Typography>
                <TextField fullWidth multiline rows={3} defaultValue={bot.aiPrompt} disabled />
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                   <Button variant="soft" color="error">Delete</Button>
                   <Button variant="soft" color="primary">Edit Configuration</Button>
                </Box>
             </Card>
           ))}
           <Button variant="dashed" sx={{ py: 3 }} startIcon={<Iconify icon="mingcute:add-line" />}>
              Create New Chatbot
           </Button>
        </Stack>
      )}

      {currentTab === 'triggers' && (
        <Stack spacing={3}>
           {triggersLoading && !triggersList.length && <CircularProgress />}
           {triggersList.map((trigger: any) => (
             <Card key={trigger.id} sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                   <CustomChip label={trigger.matchType} color="info" />
                   <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>Keyword: "{trigger.keyword}"</Typography>
                   <FormControlLabel control={<Switch checked={trigger.isActive} />} label="" />
                </Stack>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                   Executes workflow: <Typography component="span" variant="subtitle2" color="primary">{trigger.workflowId}</Typography>
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                   <Button variant="soft" color="error" size="small">Delete</Button>
                   <Button variant="soft" color="primary" size="small">Edit</Button>
                </Box>
             </Card>
           ))}
           <Button variant="dashed" sx={{ py: 3 }} startIcon={<Iconify icon="mingcute:add-line" />}>
              Add Keyword Trigger
           </Button>
        </Stack>
      )}
    </DashboardContent>
  );
}

function CustomChip({ label, color }: any) {
    return (
      <Box 
        sx={{ 
          px: 1, 
          py: 0.5, 
          borderRadius: 1, 
          fontSize: 12, 
          fontWeight: 'bold',
          bgcolor: color === 'info' ? 'info.lighter' : 'grey.200',
          color: color === 'info' ? 'info.dark' : 'grey.800',
          display: 'inline-flex'
        }}
      >
        {label}
      </Box>
    );
}
