'use client';

import type { Theme, SxProps } from '@mui/material/styles';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';

interface BaseLoaderProps {
  sx?: SxProps<Theme>;
}

interface CircularLoaderProps extends BaseLoaderProps {
  type?: 'circular';
  size?: number;
  thickness?: number;
  label?: string;
}

interface LinearLoaderProps extends BaseLoaderProps {
  type: 'linear';
  value?: number;
  height?: number;
  label?: string;
}

interface SkeletonLoaderProps extends BaseLoaderProps {
  type: 'skeleton';
  rows?: number;
  rowHeight?: number;
  showHeader?: boolean;
}

export type AppLoaderProps = CircularLoaderProps | LinearLoaderProps | SkeletonLoaderProps;

export function AppLoader(props: AppLoaderProps) {
  if (props.type === 'linear') {
    const { value, height = 6, sx, label } = props;

    return (
      <Stack spacing={1} sx={{ width: 1, ...sx }}>
        {label ? <Typography variant="caption">{label}</Typography> : null}
        <LinearProgress
          variant={typeof value === 'number' ? 'determinate' : 'indeterminate'}
          value={value}
          sx={{ height, borderRadius: 99 }}
        />
      </Stack>
    );
  }

  if (props.type === 'skeleton') {
    const { rows = 3, rowHeight = 22, showHeader = true, sx } = props;

    return (
      <Stack spacing={1.2} sx={{ width: 1, ...sx }}>
        {showHeader ? <Skeleton variant="text" width="35%" height={28} /> : null}
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} variant="rectangular" height={rowHeight} sx={{ borderRadius: 1.5 }} />
        ))}
      </Stack>
    );
  }

  const { size = 28, thickness = 3.6, sx, label } = props as CircularLoaderProps;

  return (
    <Stack alignItems="center" spacing={1.2} sx={{ ...sx }}>
      <CircularProgress size={size} thickness={thickness} />
      {label ? <Typography variant="caption">{label}</Typography> : null}
    </Stack>
  );
}

interface LoaderBlockProps {
  loader?: AppLoaderProps;
  minHeight?: number | string;
  sx?: SxProps<Theme>;
}

export function LoaderBlock({ loader = { type: 'circular' }, minHeight = 180, sx }: LoaderBlockProps) {
  return (
    <Box
      sx={{
        width: 1,
        minHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...sx,
      }}
    >
      <AppLoader {...loader} />
    </Box>
  );
}
