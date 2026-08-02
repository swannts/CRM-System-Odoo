'use client';

import dynamic from 'next/dynamic';

import Box, { BoxProps } from '@mui/material/Box';
import { alpha , styled } from '@mui/material/styles';

// ----------------------------------------------------------------------

const ApexChart = dynamic(() => import('react-apexcharts'), {
  ssr: false,
  loading: () => (
    <Box
      sx={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.neutral',
        borderRadius: 1.5,
        width: '100%',
        height: '100%',
      }}
    />
  ),
});

// ----------------------------------------------------------------------

const StyledRoot = styled(Box)(({ theme }) => ({
  '& .apexcharts-canvas': {
    '& .apexcharts-tooltip': {
      border: 'none',
      borderRadius: theme.shape.borderRadius * 1.5,
      boxShadow: theme.customShadows.dropdown,
      backgroundColor: theme.palette.background.default,
      '& .apexcharts-tooltip-title': {
        border: 'none',
        textAlign: 'center',
        fontWeight: theme.typography.fontWeightBold,
        backgroundColor: alpha(theme.palette.grey[500], 0.16),
        color: theme.palette.text[theme.palette.mode === 'light' ? 'secondary' : 'primary'],
      },
    },
    '& .apexcharts-xaxistooltip': {
      border: 'none',
      color: theme.palette.text.primary,
      borderRadius: theme.shape.borderRadius * 1.5,
      boxShadow: theme.customShadows.dropdown,
      backgroundColor: theme.palette.background.default,
      '&:before': { borderBottomColor: 'transparent' },
      '&:after': { borderBottomColor: theme.palette.background.default },
    },
    '& .apexcharts-legend': {
      padding: 0,
    },
    '& .apexcharts-legend-series': {
      display: 'inline-flex !important',
      alignItems: 'center',
    },
    '& .apexcharts-legend-marker': {
      marginRight: 8,
    },
    '& .apexcharts-legend-text': {
      lineHeight: '18px',
      textTransform: 'capitalize',
    },
  },
}));

interface Props extends BoxProps {
  type?: 'line' | 'area' | 'bar' | 'histogram' | 'pie' | 'donut' | 'rangeBar' | 'radialBar' | 'scatter' | 'bubble' | 'radar' | 'polarArea';
  series: any[];
  options: any;
  height?: number | string;
  width?: number | string;
}

export function Chart({ type = 'bar', series, options, height, width, sx, ...other }: Props) {
  return (
    <StyledRoot sx={{ flexShrink: 0, ...sx }} {...other}>
      <ApexChart type={type as any} series={series} options={options} width="100%" height={height || '100%'} />
    </StyledRoot>
  );
}
