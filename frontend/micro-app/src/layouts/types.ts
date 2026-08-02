import type { ReactNode } from 'react';

export type NavPath = string;

export type NavIcon = ReactNode;

export type NavItem = {
  title: string;
  path: NavPath;
  icon?: NavIcon;
  info?: ReactNode;
  caption?: string;
  disabled?: boolean;
  roles?: string[];
  children?: NavItem[];
};

export type NavSection = {
  subheader: string;
  items: NavItem[];
};

export type AccountNavItem = {
  label: string;
  href: NavPath;
  icon: NavIcon;
  info?: string;
};

export type Workspace = {
  id: string;
  name: string;
  logo: string;
  plan: 'Free' | 'Pro';
};
