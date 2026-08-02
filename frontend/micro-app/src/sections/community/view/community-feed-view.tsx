'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { fetchCommunityPosts, createPostThunk, selectCommunity } from 'src/store/slices/community-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import CircularProgress from '@mui/material/CircularProgress';

import { DashboardContent } from 'src/layouts/dashboard';
import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

export function CommunityFeedView() {
  const dispatch = useAppDispatch();
  const { posts } = useAppSelector(selectCommunity);
  
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    dispatch(fetchCommunityPosts());
  }, [dispatch]);

  const handleCreatePost = async () => {
    if (!content.trim()) return;
    try {
      setIsPosting(true);
      await dispatch(createPostThunk({ content: content.trim() })).unwrap();
      setContent('');
      toast.success('Post shared!');
      dispatch(fetchCommunityPosts());
    } catch (error) {
      toast.error(error || 'Failed to post');
    } finally {
      setIsPosting(false);
    }
  };

  const isLoading = posts.loading;
  const postsData = posts.data;

  if (isLoading && !postsData.length) {
    return (
      <Box sx={{ p: 5, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <DashboardContent maxWidth="md">
      <Typography variant="h4" sx={{ mb: 5 }}>Community Feed</Typography>

      <Stack spacing={3}>
        {/* Create Post Card */}
        <Card sx={{ p: 3 }}>
          <Stack direction="row" spacing={2}>
            <Avatar alt="User" />
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder="Share something with the community..."
              variant="outlined"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </Stack>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="contained" 
              onClick={handleCreatePost} 
              disabled={isPosting || !content.trim()}
              startIcon={isPosting && <CircularProgress size={16} color="inherit" />}
            >
              Post
            </Button>
          </Box>
        </Card>

        {/* Feed Posts */}
        {postsData.map((post: any) => (
          <Card key={post._id}>
            <CardHeader
              avatar={<Avatar alt={post.authorName} />}
              title={post.authorName || 'Member'}
              subheader={new Date(post.createdAt).toLocaleString()}
              action={
                <IconButton size="small">
                  <Iconify icon="eva:more-vertical-fill" />
                </IconButton>
              }
            />
            <CardContent>
              <Typography variant="body1">{post.content}</Typography>
            </CardContent>
            <CardActions sx={{ px: 2, pb: 2 }}>
              <Button size="small" startIcon={<Iconify icon="eva:heart-fill" sx={{ color: 'error.main' }} />}>
                {post.likesCount || 0} Likes
              </Button>
              <Button size="small" startIcon={<Iconify icon="eva:message-square-fill" />}>
                {post.commentsCount || 0} Comments
              </Button>
            </CardActions>
          </Card>
        ))}

        {postsData.length === 0 && !isLoading && (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography variant="h6" sx={{ color: 'text.secondary' }}>
              No posts yet. Start the conversation!
            </Typography>
          </Box>
        )}
      </Stack>
    </DashboardContent>
  );
}
