'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { fetchChatContacts, fetchChatMessages, selectChat } from 'src/store/slices/chat-slice';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

// ----------------------------------------------------------------------

export function ChatView() {
  const dispatch = useAppDispatch();
  const chatState = useAppSelector(selectChat);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    dispatch(fetchChatContacts());
  }, [dispatch]);

  useEffect(() => {
    if (selectedContact?.channelId) {
      dispatch(fetchChatMessages(selectedContact.channelId));
    }
  }, [dispatch, selectedContact]);

  const contacts = chatState.contacts.data;
  const contactsLoading = chatState.contacts.loading;
  
  const messages = selectedContact?.channelId ? chatState.messages[selectedContact.channelId]?.data || [] : [];
  const messagesLoading = selectedContact?.channelId ? chatState.messages[selectedContact.channelId]?.loading : false;

  if (contactsLoading && contacts.length === 0) {
    return (
      <Box sx={{ p: 5, textAlign: 'center' }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <DashboardContent maxWidth="xl">
      <Stack direction="row" sx={{ height: '70vh', borderRadius: 2, overflow: 'hidden', bgcolor: 'background.paper', border: (theme) => `1px solid ${theme.palette.divider}` }}>
        {/* Contact List */}
        <Box sx={{ width: 320, flexShrink: 0, borderRight: (theme) => `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6">Contacts</Typography>
          </Box>
          <Scrollbar>
            <Stack spacing={0.5} sx={{ p: 1 }}>
              {(contacts || []).map((contact: any) => (
                <Box
                  key={contact.id}
                  onClick={() => setSelectedContact(contact)}
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    bgcolor: selectedContact?.id === contact.id ? 'action.selected' : 'transparent',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Avatar alt={contact.fullName} />
                  <Box>
                    <Typography variant="subtitle2">{contact.fullName}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {contact.lastMessage || 'Start a conversation'}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Scrollbar>
        </Box>

        {/* Chat Window */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {!selectedContact ? (
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Typography variant="subtitle1" color="text.secondary">Select a contact to start chatting</Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ p: 2, borderBottom: (theme) => `1px solid ${theme.palette.divider}`, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar alt={selectedContact.fullName} />
                <Typography variant="subtitle1">{selectedContact.fullName}</Typography>
              </Box>

              <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
                 <Scrollbar>
                    <Stack spacing={2}>
                      {messagesLoading && <LinearProgress />}
                       {(messages || []).map((msg: any) => (
                         <Box key={msg.id} sx={{ display: 'flex', justifyContent: msg.senderType === 'user' ? 'flex-end' : 'flex-start' }}>
                            <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: msg.senderType === 'user' ? 'primary.main' : 'background.neutral', color: msg.senderType === 'user' ? 'primary.contrastText' : 'text.primary', maxWidth: '70%' }}>
                               <Typography variant="body2">{msg.content}</Typography>
                            </Box>
                         </Box>
                       ))}
                    </Stack>
                 </Scrollbar>
              </Box>

              <Box sx={{ p: 2, borderTop: (theme) => `1px solid ${theme.palette.divider}` }}>
                 <Stack direction="row" spacing={1}>
                    <TextField fullWidth size="small" placeholder="Type a message..." value={message} onChange={(e) => setMessage(e.target.value)} />
                    <IconButton color="primary">
                       <Iconify icon="solar:send-bold" />
                    </IconButton>
                 </Stack>
              </Box>
            </>
          )}
        </Box>
      </Stack>
    </DashboardContent>
  );
}
