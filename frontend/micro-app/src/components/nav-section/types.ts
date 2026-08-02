import { ReactNode } from 'react';
import { Theme, SxProps } from '@mui/material/styles';

// ----------------------------------------------------------------------

export type NavItemProps = {
  path: string;
  title: string;
  icon?: ReactNode;
  info?: ReactNode;
  caption?: string;
  disabled?: boolean;
  roles?: string[];
  children?: any;
  [key: string]: any;
};

export type NavSectionProps = {
  data: {
    subheader?: string;
    items: NavItemProps[];
  }[];
  slotProps?: any;
  enabledRootRedirect?: boolean;
  sx?: SxProps<Theme>;
};

export type NavItemStateProps = {
  depth?: number;
  open?: boolean;
  active?: boolean;
  hasChild?: boolean;
  externalLink?: boolean;
};
