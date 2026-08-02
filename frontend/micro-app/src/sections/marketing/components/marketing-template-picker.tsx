import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { fetchTemplates, selectMarketing } from 'src/store/slices/marketing-slice';

import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CardActionArea from '@mui/material/CardActionArea';

import { Label } from 'src/components/label';

import { MarketingTemplate } from '../types';

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (template: MarketingTemplate) => void;
};

export function MarketingTemplatePicker({ open, onClose, onSelect }: Props) {
  const dispatch = useAppDispatch();
  const { templates: templatesState } = useAppSelector(selectMarketing);

  const templates = templatesState.data;
  const isLoading = templatesState.loading;

  useEffect(() => {
    if (open) {
      dispatch(fetchTemplates());
    }
  }, [dispatch, open]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Select Template</DialogTitle>
      <DialogContent sx={{ pb: 3 }}>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {templates.map((template) => (
            <Grid key={template.id} item xs={12} sm={6} md={4}>
              <Card
                sx={{
                  border: (theme) => `solid 1px ${theme.palette.divider}`,
                  '&:hover': {
                    borderColor: 'primary.main',
                  },
                }}
              >
                <CardActionArea onClick={() => {
                  onSelect(template);
                  onClose();
                }}>
                  <CardContent sx={{ p: 1.5 }}>
                    <Typography variant="subtitle2" noWrap>
                      {template.name}
                    </Typography>
                    <Label variant="soft" color="info" sx={{ mt: 0.5 }}>
                      {template.type}
                    </Label>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
          {templates.length === 0 && !isLoading && (
            <Grid item xs={12}>
              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 5 }}>
                No templates found.
              </Typography>
            </Grid>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
