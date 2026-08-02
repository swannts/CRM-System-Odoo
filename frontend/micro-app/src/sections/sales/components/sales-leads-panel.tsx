import { useEffect } from 'react';
import type { SalesLeadRow } from 'src/services/sales-dashboard-service';
import { useAppDispatch, useAppSelector } from 'src/store/hooks';
import { fetchHotLeads, selectScoring } from 'src/store/slices/scoring-slice';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';

import { formatOptionalCurrency } from '../utils';
import { SalesEmptyState } from './sales-empty-state';

export function SalesLeadsPanel({ leads, search }: { leads: SalesLeadRow[]; search: string }) {
  const dispatch = useAppDispatch();
  const scoringState = useAppSelector(selectScoring);

  useEffect(() => {
    dispatch(fetchHotLeads());
  }, [dispatch]);

  const hotLeads = scoringState.hotLeads.data;
  const scoreById = new Map(hotLeads.map((lead: any) => [String(lead.leadOdooId ?? lead.id), Number(lead.score || 0)]));
  const query = search.trim().toLowerCase();
  const filtered = !query
    ? leads
    : leads.filter((lead) =>
        [lead.name, lead.email, lead.phone, lead.stage]
          .map((v) => String(v || '').toLowerCase())
          .some((v) => v.includes(query))
      );

  if (!leads.length) {
    return <SalesEmptyState title="No leads" description="No leads are available right now." />;
  }

  if (!filtered.length) {
    return <SalesEmptyState title="No leads found" description="Try a different search term." compact />;
  }

  return (
    <Card sx={{ p: 0 }}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Stage</TableCell>
              <TableCell>Expected Revenue</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Priority</TableCell>
              <TableCell>Score</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((lead) => (
              <TableRow key={lead.id} hover>
                <TableCell><Typography variant="body2">{lead.name || 'Unnamed lead'}</Typography></TableCell>
                <TableCell><Chip label={lead.stage || 'Unknown'} size="small" variant="outlined" /></TableCell>
                <TableCell>{formatOptionalCurrency(lead.expectedRevenue)}</TableCell>
                <TableCell>{lead.email || 'Unavailable'}</TableCell>
                <TableCell>{lead.phone || 'Unavailable'}</TableCell>
                <TableCell>{lead.priority || 'Unavailable'}</TableCell>
                <TableCell>{scoreById.get(String(lead.id)) ?? 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  );
}
