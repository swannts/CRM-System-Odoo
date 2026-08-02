'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { 
  fetchOmniConversations, 
  fetchOmniMessages, 
  sendOmniMessageThunk,
  assignOmniAgentThunk,
  updateOmniConversationThunk,
  suggestOmniReplyThunk,
  setCurrentConversation,
  selectOmni 
} from 'src/store/slices/omnichannel-slice';
import { fetchMemberships, selectOrganization } from 'src/store/slices/organization-slice';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { useSocket } from 'src/hooks/use-socket';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'pending', label: 'Pending' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

function getStatusColor(status?: string): 'default' | 'warning' | 'success' | 'error' {
  switch ((status || '').toLowerCase()) {
    case 'pending':
      return 'warning';
    case 'resolved':
      return 'success';
    case 'closed':
      return 'error';
    default:
      return 'default';
  }
}

function formatParticipantLabel(userId?: string, role?: string) {
  if (!userId) return 'Unassigned';
  return role ? `${userId} (${role})` : userId;
}

export function OmniChatView() {
  const dispatch = useAppDispatch();
  const { user } = useAuthContext();
  const { conversations, currentConversation } = useAppSelector(selectOmni);
  const { memberships } = useAppSelector(selectOrganization);

  const [messageText, setMessageText] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isMutationPending, setIsMutationPending] = useState(false);

  useEffect(() => {
    dispatch(fetchOmniConversations());
    dispatch(fetchMemberships());
  }, [dispatch]);

  const selectedConversation = currentConversation.data;
  const messages = currentConversation.messages;
  const conversationsData = conversations.data;
  const membershipsData = memberships.data;

  useEffect(() => {
    if (!selectedConversation && conversationsData.length > 0) {
      dispatch(setCurrentConversation(conversationsData[0]));
    }
  }, [conversationsData, selectedConversation, dispatch]);

  useEffect(() => {
    if (selectedConversation?.id) {
      dispatch(fetchOmniMessages(selectedConversation.id));
    }
  }, [selectedConversation?.id, dispatch]);

  useSocket(user?.orgId, (event, data) => {
    if (event === 'omni:message') {
      dispatch(fetchOmniConversations());
      if (data?.conversationId === selectedConversation?.id) {
        dispatch(fetchOmniMessages(data.conversationId));
      }
    }
  });

  const handleSend = async () => {
    if (!messageText.trim() || !selectedConversation?.id) return;
    try {
      setIsMutationPending(true);
      await dispatch(sendOmniMessageThunk({
        conversationId: selectedConversation.id,
        content: messageText.trim(),
        type: 'text',
      })).unwrap();
      setMessageText('');
      setError(null);
      dispatch(fetchOmniMessages(selectedConversation.id));
      dispatch(fetchOmniConversations());
    } catch (err: any) {
      setError(err || 'Unable to send message.');
    } finally {
      setIsMutationPending(false);
    }
  };

  const handleAssign = async (agentId: string) => {
    if (!selectedConversation?.id) return;
    try {
      setIsMutationPending(true);
      await dispatch(assignOmniAgentThunk({ conversationId: selectedConversation.id, agentId })).unwrap();
      dispatch(fetchOmniConversations());
    } catch (err: any) {
      setError(err || 'Unable to assign agent.');
    } finally {
      setIsMutationPending(false);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    if (!selectedConversation?.id) return;
    try {
      setIsMutationPending(true);
      await dispatch(updateOmniConversationThunk({ id: selectedConversation.id, data: { status } })).unwrap();
      dispatch(fetchOmniConversations());
    } catch (err: any) {
      setError(err || 'Unable to update status.');
    } finally {
      setIsMutationPending(false);
    }
  };

  const handleSuggest = async () => {
    if (!selectedConversation?.id) return;
    try {
      setIsMutationPending(true);
      const result = await dispatch(suggestOmniReplyThunk(selectedConversation.id)).unwrap();
      if (result?.suggestion) setMessageText(result.suggestion);
    } catch (err: any) {
      setError(err || 'Unable to generate suggestion.');
    } finally {
      setIsMutationPending(false);
    }
  };

  const filteredConversations = conversationsData.filter((conversation: any) => {
    const haystack = [
      conversation.contactName,
      conversation.contactId,
      conversation.provider,
      conversation.providerRef,
      conversation.lastMessage,
      conversation.assignedAgentId,
      conversation.status,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(search.trim().toLowerCase());
  });

  const orderedMessages = [...messages].sort(
    (left: any, right: any) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  );

  const selectedMembership =
    membershipsData.find((membership: any) => membership.userId === selectedConversation?.assignedAgentId) || null;

  if (conversations.loading && !conversationsData.length) {
    return (
      <Box sx={{ p: 5, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <DashboardContent maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 3 }}>
        Omnichannel Inbox
      </Typography>

      {error ? (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      <Stack
        direction="row"
        sx={{
          height: '75vh',
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: 'background.paper',
          border: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ width: 360, flexShrink: 0, borderRight: (theme) => `1px solid ${theme.palette.divider}` }}>
          <Box sx={{ p: 2, borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
            <TextField
              fullWidth
              size="small"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search conversations..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          <Scrollbar>
            <Stack spacing={0.5} sx={{ p: 1 }}>
              {filteredConversations.map((conversation: any) => (
                <Box
                  key={conversation.id}
                  onClick={() => dispatch(setCurrentConversation(conversation))}
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    bgcolor:
                      selectedConversation?.id === conversation.id ? 'action.selected' : 'transparent',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Box sx={{ position: 'relative' }}>
                    <Avatar alt={conversation.contactName || conversation.contactId} />
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: -2,
                        right: -2,
                        width: 20,
                        height: 20,
                        bgcolor: 'background.paper',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Iconify
                        icon={
                          conversation.provider === 'whatsapp'
                            ? 'logos:whatsapp-icon'
                            : 'logos:telegram'
                        }
                        width={14}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography variant="subtitle2" noWrap>
                        {conversation.contactName || conversation.contactId}
                      </Typography>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={(conversation.status || 'open').toUpperCase()}
                        color={getStatusColor(conversation.status)}
                      />
                    </Stack>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                      sx={{ display: 'block', mb: 0.5 }}
                    >
                      {conversation.lastMessage || 'No messages yet'}
                    </Typography>

                    <Typography variant="caption" color="text.disabled" noWrap>
                      {conversation.assignedAgentId
                        ? `Assigned: ${conversation.assignedAgentId}`
                        : `Channel: ${conversation.provider}`}
                    </Typography>
                  </Box>
                </Box>
              ))}

              {filteredConversations.length === 0 && !conversations.loading && (
                <Box sx={{ px: 2, py: 6, textAlign: 'center' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    No conversations found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try a different search term or wait for inbound messages to arrive.
                  </Typography>
                </Box>
              )}
            </Stack>
          </Scrollbar>
        </Box>

        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          {!selectedConversation ? (
            <Box
              sx={{
                flexGrow: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <Iconify icon="solar:chat-round-line-bold-duotone" width={64} sx={{ color: 'text.disabled' }} />
              <Typography variant="subtitle1" color="text.secondary">
                Select a conversation to reply
              </Typography>
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  p: 2,
                  borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0 }}>
                  <Avatar alt={selectedConversation.contactName || selectedConversation.contactId} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle1" noWrap>
                      {selectedConversation.contactName || selectedConversation.contactId}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 0.75, flexWrap: 'wrap' }}>
                      <Chip
                        label={selectedConversation.provider}
                        size="small"
                        variant="outlined"
                        color="info"
                      />
                      <Chip
                        label={selectedConversation.providerRef || selectedConversation.contactId}
                        size="small"
                        variant="outlined"
                      />
                      {selectedMembership ? (
                        <Chip
                          label={formatParticipantLabel(
                            selectedMembership.userId,
                            selectedMembership.role
                          )}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      ) : null}
                    </Stack>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Select
                    size="small"
                    value={selectedConversation.status || 'open'}
                    onChange={(event) => handleStatusUpdate(String(event.target.value))}
                    disabled={isMutationPending}
                    sx={{ minWidth: 120 }}
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>

                  <Select
                    size="small"
                    displayEmpty
                    value={selectedConversation.assignedAgentId || ''}
                    onChange={(event) => handleAssign(String(event.target.value))}
                    disabled={isMutationPending || membershipsData.length === 0}
                    sx={{ minWidth: 220 }}
                    renderValue={(value) => {
                      if (!value) {
                        return 'Assign agent';
                      }

                      const membership = membershipsData.find((item: any) => item.userId === value);
                      return formatParticipantLabel(membership?.userId, membership?.role);
                    }}
                  >
                    {membershipsData.map((membership: any) => (
                      <MenuItem key={membership.id || membership.userId} value={membership.userId}>
                        {formatParticipantLabel(membership.userId, membership.role)}
                      </MenuItem>
                    ))}
                  </Select>

                  <IconButton
                    onClick={handleSuggest}
                    color="primary"
                    disabled={isMutationPending}
                  >
                    <Iconify icon="solar:magic-stick-3-bold" />
                  </IconButton>
                </Stack>
              </Box>

              <Box sx={{ px: 2, py: 1.5, borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
                <Typography variant="caption" color="text.secondary">
                  Contact ID: {selectedConversation.contactId} | Conversation ID: {selectedConversation.id}
                </Typography>
              </Box>

              <Box sx={{ flexGrow: 1, p: 2, overflowY: 'hidden' }}>
                <Scrollbar sx={{ height: '100%' }}>
                  <Stack spacing={2.5}>
                    {currentConversation.loading && !messages.length && (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <CircularProgress size={24} />
                      </Box>
                    )}

                    {!currentConversation.loading && orderedMessages.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 8 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          No message history yet
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          This conversation is ready for the first outbound reply.
                        </Typography>
                      </Box>
                    ) : null}

                    {orderedMessages.map((message: any) => (
                      <Box
                        key={message.id}
                        sx={{
                          display: 'flex',
                          justifyContent: message.direction === 'outbound' ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <Box sx={{ maxWidth: '75%' }}>
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: 1.5,
                              bgcolor:
                                message.direction === 'outbound'
                                  ? 'primary.main'
                                  : 'background.neutral',
                              color:
                                message.direction === 'outbound'
                                  ? 'primary.contrastText'
                                  : 'text.primary',
                              borderBottomRightRadius:
                                message.direction === 'outbound' ? 0 : 1.5,
                              borderBottomLeftRadius:
                                message.direction === 'inbound' ? 0 : 1.5,
                            }}
                          >
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                              {message.content || '[Empty message]'}
                            </Typography>
                          </Box>

                          <Typography
                            variant="caption"
                            sx={{
                              mt: 0.5,
                              display: 'block',
                              textAlign: message.direction === 'outbound' ? 'right' : 'left',
                              color: 'text.disabled',
                            }}
                          >
                            {new Date(message.createdAt).toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Scrollbar>
              </Box>

              <Box sx={{ p: 2, borderTop: (theme) => `1px solid ${theme.palette.divider}` }}>
                <Stack direction="row" spacing={1}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    placeholder="Type your message..."
                    value={messageText}
                    onChange={(event) => setMessageText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <IconButton
                    color="primary"
                    onClick={handleSend}
                    disabled={!messageText.trim() || isMutationPending}
                  >
                    {isMutationPending ? (
                      <CircularProgress size={22} />
                    ) : (
                      <Iconify icon="solar:send-bold" width={28} />
                    )}
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
