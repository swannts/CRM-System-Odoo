'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { 
  fetchArticlesThunk, 
  fetchArticleThunk, 
  selectHelpCenter 
} from 'src/store/slices/help-center-slice';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

// ----------------------------------------------------------------------

type Props = {
  id?: string;
};

export function HelpCenterPublicView({ id }: Props) {
  const dispatch = useAppDispatch();
  const { articles, currentArticle } = useAppSelector(selectHelpCenter);

  useEffect(() => {
    if (id) {
      dispatch(fetchArticleThunk(id));
    } else {
      dispatch(fetchArticlesThunk());
    }
  }, [dispatch, id]);

  const isLoading = id ? currentArticle.loading : articles.loading;
  const data = id ? currentArticle.data : articles.data;

  if (isLoading) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 960, mx: 'auto', py: 6, px: 3 }}>
      <Card sx={{ p: 4 }}>
        {id ? (
          <Stack spacing={2}>
            <Typography variant="h4">{data?.title || 'Help center article'}</Typography>
            <Typography variant="body1">
              {data?.content || data?.body || 'Public article route connected.'}
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={2}>
            <Typography variant="h4">Help Center</Typography>
            {(data || []).map((article: any) => (
              <Box key={article.id || article._id} sx={{ p: 2, borderRadius: 2, bgcolor: 'background.neutral' }}>
                <Typography variant="subtitle2">{article.title}</Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Card>
    </Box>
  );
}
