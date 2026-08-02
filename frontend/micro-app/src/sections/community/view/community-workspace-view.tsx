'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { fetchCommunityPosts, selectCommunity } from 'src/store/slices/community-slice';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';

import {
  CommunityFeed,
  CommunityGroups,
  CommunityMembers,
  CommunitySettings,
  CommunityMessenger,
} from './community-workspace-sections';

// ----------------------------------------------------------------------

type Props = {
  tab?: string;
  groupId?: string;
  contactId?: string;
  memberId?: string;
};

export function CommunityWorkspaceView({ tab, groupId, contactId, memberId }: Props) {
  const dispatch = useAppDispatch();
  const { posts } = useAppSelector(selectCommunity);
  const [activeTab, setActiveTab] = useState(tab || 'feed');

  useEffect(() => {
    if (activeTab === 'feed' && !groupId && !contactId && !memberId) {
      dispatch(fetchCommunityPosts());
    }
  }, [dispatch, activeTab, groupId, contactId, memberId]);

  const isGroupDetail = Boolean(groupId);
  const isMemberProfile = Boolean(contactId);
  const isMessenger = activeTab === 'messenger' || Boolean(memberId);

  const isLoading = posts.loading;
  const postsData = posts.data;

  const renderContent = () => {
    if (isGroupDetail) {
      return (
        <Card sx={{ p: 3 }}>
           <Typography variant="h5">Group Detail: #{groupId}</Typography>
           <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
              Legacy group detail route now resolved in the micro-app. This high-fidelity interface manages membership, content moderation, and group settings.
           </Typography>
           <Divider sx={{ my: 3 }} />
           <Typography variant="subtitle1">Active Members</Typography>
           <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              {[1, 2, 3, 4, 5].map((m) => (
                 <Avatar key={m}>M{m}</Avatar>
              ))}
           </Stack>
        </Card>
      );
    }

    if (isMemberProfile) {
      return (
        <Card sx={{ p: 4 }}>
           <Stack spacing={3} alignItems="center">
              <Avatar sx={{ width: 120, height: 120 }}>MB</Avatar>
              <Box sx={{ textAlign: 'center' }}>
                 <Typography variant="h4">Member Name</Typography>
                 <Typography variant="body2" sx={{ color: 'text.secondary' }}>Active Member Since May 2023</Typography>
              </Box>
              <Divider sx={{ width: '100%', borderStyle: 'dashed' }} />
              <Typography variant="body1">
                 Legacy member profile route mapping. This view aggregates social activity, group memberships, and direct messaging history.
              </Typography>
           </Stack>
        </Card>
      );
    }

    if (isMessenger) {
      return <CommunityMessenger memberId={memberId} />;
    }

    switch (activeTab) {
      case 'feed':
        return <CommunityFeed posts={postsData} />;
      case 'groups':
        return <CommunityGroups />;
      case 'members':
        return <CommunityMembers />;
      case 'settings':
        return <CommunitySettings />;
      default:
        return <CommunityFeed posts={postsData} />;
    }
  };

  return (
    <DashboardContent maxWidth="xl">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 5 }}>
        <Box>
          <Typography variant="h4">
             {isGroupDetail ? 'Group Details' : isMemberProfile ? 'Member Profile' : isMessenger ? 'Messenger' : 'Community Hub'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {isGroupDetail 
               ? 'Manage group members, content, and settings.' 
               : isMemberProfile 
                  ? 'View member activity and networking details.' 
                  : 'Engage with your members, manage groups, and monitor social activity.'}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
           <Button
             variant={isMessenger ? 'contained' : 'outlined'}
             startIcon={<Iconify icon="solar:chat-round-dots-bold" />}
             onClick={() => setActiveTab('messenger')}
           >
             Messenger
           </Button>
           <Button
             variant="contained"
             startIcon={<Iconify icon="solar:users-group-rounded-bold" />}
           >
             New Group
           </Button>
        </Stack>
      </Stack>

      {!isGroupDetail && !isMemberProfile && !isMessenger && (
         <Tabs
           value={activeTab}
           onChange={(e, val) => setActiveTab(val)}
           sx={{ mb: 5 }}
         >
           <Tab icon={<Iconify icon="solar:feed-bold-duotone" />} label="Community Feed" value="feed" />
           <Tab icon={<Iconify icon="solar:users-group-two-rounded-bold-duotone" />} label="Groups" value="groups" />
           <Tab icon={<Iconify icon="solar:user-rounded-bold-duotone" />} label="Members" value="members" />
           <Tab icon={<Iconify icon="solar:settings-bold-duotone" />} label="Settings" value="settings" />
         </Tabs>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={activeTab === 'feed' || activeTab === 'groups' ? 8 : 12}>
           {isLoading && !postsData.length ? (
              <Box sx={{ py: 10, textAlign: 'center' }}>
                 <CircularProgress />
              </Box>
           ) : (
              renderContent()
           )}
        </Grid>

        {(activeTab === 'feed' || activeTab === 'groups') && !isGroupDetail && !isMemberProfile && !isMessenger && (
           <Grid item xs={12} md={4}>
              <Stack spacing={3}>
                 <Card sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Community Stats</Typography>
                    <StatItem label="Total Members" value="2,450" icon="solar:users-group-rounded-bold" color="primary" />
                    <StatItem label="Active Groups" value="14" icon="solar:users-group-two-rounded-bold" color="info" />
                    <StatItem label="Daily Posts" value="85" icon="solar:feed-bold" color="success" />
                 </Card>

                 <Card sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>Pending Requests</Typography>
                    <Stack spacing={2}>
                       {[1, 2].map((req) => (
                          <Stack key={req} direction="row" spacing={2} alignItems="center">
                             <Avatar sx={{ width: 32, height: 32 }}>R{req}</Avatar>
                             <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="subtitle2">Request User {req}</Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Group Join Request</Typography>
                             </Box>
                             <IconButton size="small" color="success"><Iconify icon="solar:check-circle-bold" /></IconButton>
                             <IconButton size="small" color="error"><Iconify icon="solar:close-circle-bold" /></IconButton>
                          </Stack>
                       ))}
                    </Stack>
                 </Card>
              </Stack>
           </Grid>
        )}
      </Grid>
    </DashboardContent>
  );
}

function StatItem({ label, value, icon, color }: any) {
   return (
      <Stack direction="row" spacing={2} alignItems="center">
         <Box sx={{ p: 1, borderRadius: 1, bgcolor: `${color}.lighter`, color: `${color}.main`, display: 'flex' }}>
            <Iconify icon={icon} />
         </Box>
         <Box sx={{ flexGrow: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{label}</Typography>
            <Typography variant="subtitle1">{value}</Typography>
         </Box>
      </Stack>
   );
}
