'use client';

import Link from 'next/link';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { DashboardContent } from 'src/layouts/dashboard';

// ----------------------------------------------------------------------

type RouteLink = {
  href: string;
  label: string;
};

type Props = {
  title: string;
  description: string;
  links?: RouteLink[];
  action?: React.ReactNode;
  children?: React.ReactNode;
};

export function FeatureRouteShell({ title, description, links = [], action, children }: Props) {
  return (
    <DashboardContent maxWidth="xl">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4">{title}</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
            {description}
          </Typography>
        </Box>
        {action}
      </Stack>

      {links.length > 0 && (
        <Card sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Related Routes
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {links.map((linkItem) => (
              <Button key={linkItem.href} component={Link} href={linkItem.href} variant="soft" color="inherit">
                {linkItem.label}
              </Button>
            ))}
          </Stack>
        </Card>
      )}

      <Divider sx={{ mb: 3 }} />
      {children}
    </DashboardContent>
  );
}
