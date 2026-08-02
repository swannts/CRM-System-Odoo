'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { 
  fetchScoreRules, 
  createScoreRuleThunk, 
  updateScoreRuleThunk,
  fetchHotLeads,
  selectScoring 
} from 'src/store/slices/scoring-slice';

import type { SalesLeadRow, SalesSummary, SalesOrderRow } from 'src/services/sales-dashboard-service';

import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';

import { SalesEmptyState } from './sales-empty-state';
import { formatOptionalNumber, formatOptionalCurrency } from '../utils';

export function SalesAnalyticsPanel({
  summary,
  orders,
  leads,
}: {
  summary?: SalesSummary;
  orders: SalesOrderRow[];
  leads: SalesLeadRow[];
}) {
  const dispatch = useAppDispatch();
  const scoringState = useAppSelector(selectScoring);

  const [draftName, setDraftName] = useState('Recent Sales Activity');
  const [draftWeight, setDraftWeight] = useState(10);
  const [draftScope, setDraftScope] = useState<'contact' | 'lead' | 'both'>('lead');
  const [draftDays, setDraftDays] = useState(14);
  const [isMutationPending, setIsMutationPending] = useState(false);

  const { data: scoreRules, loading: rulesLoading } = scoringState.rules;

  useEffect(() => {
    dispatch(fetchScoreRules());
  }, [dispatch]);

  const handleAddRule = async () => {
    try {
      setIsMutationPending(true);
      await dispatch(createScoreRuleThunk({
        name: draftName,
        weight: draftWeight,
        scope: draftScope,
        category: 'sales_activity_recency',
        condition: {
          field: 'daysSinceActivity',
          operator: 'lte',
          value: draftDays,
        },
      })).unwrap();
      dispatch(fetchScoreRules());
      dispatch(fetchHotLeads());
    } catch (error) {
      console.error(error);
    } finally {
      setIsMutationPending(false);
    }
  };

  const handleToggleRule = async (id: string, active: boolean) => {
    try {
      setIsMutationPending(true);
      await dispatch(updateScoreRuleThunk({ id, data: { active } })).unwrap();
      dispatch(fetchScoreRules());
      dispatch(fetchHotLeads());
    } catch (error) {
      console.error(error);
    } finally {
      setIsMutationPending(false);
    }
  };

  if (!summary && !orders.length && !leads.length) {
    return <SalesEmptyState title="Not enough data" description="Not enough data to show analytics yet." />;
  }

  const opportunities = leads.filter((lead) => String(lead.type || '').toLowerCase().includes('opportunity')).length;
  const conversionRate = opportunities > 0 ? (orders.length / opportunities) * 100 : undefined;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ p: 2.5 }}>
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">Revenue</Typography>
            <Typography variant="h6">{formatOptionalCurrency(summary?.totalRevenue)}</Typography>
          </Stack>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ p: 2.5 }}>
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">Orders</Typography>
            <Typography variant="h6">{formatOptionalNumber(summary?.totalOrders ?? orders.length)}</Typography>
          </Stack>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ p: 2.5 }}>
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">Leads</Typography>
            <Typography variant="h6">{formatOptionalNumber(leads.length)}</Typography>
          </Stack>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ p: 2.5 }}>
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">Conversion Snapshot</Typography>
            <Typography variant="h6">{typeof conversionRate === 'number' ? `${conversionRate.toFixed(1)}%` : 'Unavailable'}</Typography>
          </Stack>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            <Typography variant="h6">Scoring Rule Settings</Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
              <TextField label="Rule name" value={draftName} onChange={(e) => setDraftName(e.target.value)} size="small" />
              <TextField label="Weight" type="number" value={draftWeight} onChange={(e) => setDraftWeight(Number(e.target.value || 0))} size="small" />
              <TextField label="Scope" select value={draftScope} onChange={(e) => setDraftScope(e.target.value as any)} size="small">
                <MenuItem value="contact">Contact</MenuItem>
                <MenuItem value="lead">Lead</MenuItem>
                <MenuItem value="both">Both</MenuItem>
              </TextField>
              <TextField label="Recency Days" type="number" value={draftDays} onChange={(e) => setDraftDays(Number(e.target.value || 0))} size="small" />
              <Button variant="contained" onClick={handleAddRule} disabled={isMutationPending}>
                {isMutationPending ? <CircularProgress size={24} /> : 'Add Rule'}
              </Button>
            </Stack>

            <Stack spacing={1}>
              {rulesLoading ? (
                <CircularProgress sx={{ mx: 'auto', my: 2 }} />
              ) : (
                scoreRules.map((rule: any) => (
                  <Stack key={rule.id} direction="row" alignItems="center" justifyContent="space-between" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, px: 1.5, py: 1 }}>
                    <Typography variant="body2">{rule.name} ({rule.category}) • weight {rule.weight}</Typography>
                    <FormControlLabel
                      control={<Switch checked={Boolean(rule.active)} onChange={(e) => handleToggleRule(rule.id, e.target.checked)} disabled={isMutationPending} />}
                      label={rule.active ? 'Active' : 'Disabled'}
                    />
                  </Stack>
                ))
              )}
            </Stack>
          </Stack>
        </Card>
      </Grid>
    </Grid>
  );
}
