import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { 
  selectSupport, 
  fetchKbCategoriesThunk, 
  submitSupportFeedbackThunk 
} from 'src/store/slices/support-slice';
import { 
  selectHelpCenter, 
  fetchArticleThunk, 
  fetchArticlesThunk 
} from 'src/store/slices/help-center-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

type Props = {
  mode: 'feedback' | 'ticket-feedback' | 'chatbot-feedback' | 'help-center' | 'help-article';
  id?: string;
  ticketId?: string;
  chatbotId?: string;
};

export function PublicSupportView({ mode, id, ticketId, chatbotId }: Props) {
  const dispatch = useAppDispatch();
  const { categories } = useAppSelector(selectSupport);
  const { articles, currentArticle } = useAppSelector(selectHelpCenter);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (mode === 'help-center') {
      dispatch(fetchKbCategoriesThunk());
      dispatch(fetchArticlesThunk());
    }
    if (mode === 'help-article' && id) {
      dispatch(fetchArticleThunk(id));
    }
  }, [dispatch, mode, id]);

  const handleSubmitFeedback = () => {
    dispatch(submitSupportFeedbackThunk({
      rating,
      comment,
      ticketId,
      chatbotId,
      type: mode
    }));
  };

  const isLoading = categories.loading || articles.loading || currentArticle.loading;

  if (isLoading) {
    return (
      <Box sx={{ py: 10, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 3 }}>
      {/* Feedback Flow */}
      {(mode === 'feedback' || mode === 'ticket-feedback' || mode === 'chatbot-feedback') && (
        <Grid container spacing={3} justifyContent="center">
           <Grid item xs={12} md={6}>
              <Card sx={{ p: 4, textAlign: 'center' }}>
                 <Stack spacing={4}>
                    <Box>
                       <Typography variant="h4">How was your experience?</Typography>
                       <Typography variant="body2" color="text.secondary">
                          {mode === 'ticket-feedback' ? `Feedback for Ticket #${ticketId}` : 
                           mode === 'chatbot-feedback' ? 'Rate your chat interaction' : 
                           'We value your feedback to help us improve.'}
                       </Typography>
                    </Box>

                    <Stack direction="row" justifyContent="center" spacing={2}>
                       {[1, 2, 3, 4, 5].map((star) => (
                          <Iconify 
                            key={star} 
                            icon={star <= rating ? "solar:star-bold" : "solar:star-outline"} 
                            width={40} 
                            sx={{ color: star <= rating ? 'warning.main' : 'text.disabled', cursor: 'pointer' }}
                            onClick={() => setRating(star)}
                          />
                       ))}
                    </Stack>

                    <TextField 
                      fullWidth 
                      multiline 
                      rows={4} 
                      placeholder="Share your thoughts with us..." 
                      label="Your Comments"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />

                    <Button 
                      variant="contained" 
                      color="primary" 
                      size="large" 
                      fullWidth
                      onClick={handleSubmitFeedback}
                      disabled={!rating}
                    >
                      Submit Feedback
                    </Button>
                 </Stack>
              </Card>
           </Grid>
        </Grid>
      )}

      {/* Help Center Flow */}
      {(mode === 'help-center' || mode === 'help-article') && (
        <Box sx={{ maxWidth: 800, mx: 'auto' }}>
           {mode === 'help-center' && (
              <Stack spacing={5}>
                 <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3">Knowledge Base</Typography>
                    <Typography variant="body1" color="text.secondary">Search our help articles for quick answers and guidance.</Typography>
                    <Box sx={{ mt: 3, maxWidth: 500, mx: 'auto' }}>
                       <TextField 
                          fullWidth 
                          placeholder="Search articles..." 
                          InputProps={{ startAdornment: <Iconify icon="solar:magnifer-bold" sx={{ mr: 1 }} /> }}
                       />
                    </Box>
                 </Box>

                 <Grid container spacing={3}>
                    {categories.data.map((cat) => (
                       <Grid item xs={12} sm={6} key={cat.id}>
                          <Card sx={{ p: 3, cursor: 'pointer', '&:hover': { bgcolor: 'background.neutral' } }}>
                             <Stack direction="row" spacing={2} alignItems="center">
                                <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'primary.lighter', color: 'primary.main' }}>
                                   <Iconify icon="solar:folder-bold" />
                                </Box>
                                <Box>
                                   <Typography variant="subtitle1">{cat.name}</Typography>
                                   <Typography variant="caption" color="text.secondary">{cat.articleCount || 0} articles in this category</Typography>
                                </Box>
                             </Stack>
                          </Card>
                       </Grid>
                    ))}
                    {categories.data.length === 0 && (
                      <Grid item xs={12}>
                         <Box sx={{ py: 5, textAlign: 'center', opacity: 0.5 }}>
                            <Iconify icon="solar:ghost-bold" width={48} sx={{ mb: 1 }} />
                            <Typography variant="caption" display="block">No categories found.</Typography>
                         </Box>
                      </Grid>
                    )}
                 </Grid>
              </Stack>
           )}

           {mode === 'help-article' && (
              <Card sx={{ p: 4 }}>
                 <Button variant="text" color="inherit" startIcon={<Iconify icon="solar:arrow-left-bold" />} sx={{ mb: 3 }}>Back to Help Center</Button>
                 <Typography variant="overline" color="primary" sx={{ fontWeight: 800 }}>
                   {currentArticle.data?.category?.toUpperCase() || 'GENERAL'}
                 </Typography>
                 <Typography variant="h2" sx={{ mt: 1, mb: 3 }}>{currentArticle.data?.title || 'Loading article...'}</Typography>
                 
                 <Stack spacing={3}>
                    <Typography 
                      variant="body1" 
                      sx={{ color: 'text.secondary', lineHeight: 1.8 }}
                      dangerouslySetInnerHTML={{ __html: currentArticle.data?.content || '' }}
                    />
                    
                    {!currentArticle.data && (
                      <Typography variant="body1" color="text.secondary">
                        The article you are looking for could not be found.
                      </Typography>
                    )}
                 </Stack>

                 <Divider sx={{ my: 4, borderStyle: 'dashed' }} />
                 
                 <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2">Was this article helpful?</Typography>
                    <Stack direction="row" spacing={1}>
                       <Button variant="soft" color="success" startIcon={<Iconify icon="solar:like-bold" />}>Yes</Button>
                       <Button variant="soft" color="error" startIcon={<Iconify icon="solar:dislike-bold" />}>No</Button>
                    </Stack>
                 </Stack>
              </Card>
           )}
        </Box>
      )}
    </Box>
  );
}
