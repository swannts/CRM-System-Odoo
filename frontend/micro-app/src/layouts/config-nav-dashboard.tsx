import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/config-global';

import { SvgColor } from 'src/components/svg-color';

import type { NavSection } from './types';

// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor src={`${CONFIG.site.basePath}/assets/icons/navbar/${name}.svg`} />
);

const ICONS = {
  job: icon('ic-job'),
  blog: icon('ic-blog'),
  chat: icon('ic-chat'),
  mail: icon('ic-mail'),
  user: icon('ic-user'),
  file: icon('ic-file'),
  lock: icon('ic-lock'),
  tour: icon('ic-tour'),
  order: icon('ic-order'),
  label: icon('ic-label'),
  blank: icon('ic-blank'),
  kanban: icon('ic-kanban'),
  folder: icon('ic-folder'),
  course: icon('ic-course'),
  banking: icon('ic-banking'),
  booking: icon('ic-booking'),
  invoice: icon('ic-invoice'),
  product: icon('ic-product'),
  setting: icon('ic-parameter'),
  ecommerce: icon('ic-ecommerce'),
  external: icon('ic-external'),
  calendar: icon('ic-calendar'),
  disabled: icon('ic-disabled'),
  menuItem: icon('ic-menu-item'),
  analytics: icon('ic-analytics'),
  dashboard: icon('ic-dashboard'),
  parameter: icon('ic-parameter'),
};

// ----------------------------------------------------------------------

export const navData: NavSection[] = [
  /**
   * Overview
   */
  {
    subheader: 'Management',
    items: [
      { title: 'Workspaces and invitations', path: '/workspace-setup/', icon: ICONS.setting },
      { title: 'Overview', path: paths.dashboard.overview, icon: ICONS.dashboard },
      { title: 'Contacts', path: paths.dashboard.contacts, icon: ICONS.user },
      { title: 'Sales', path: paths.dashboard.sales, icon: ICONS.analytics },
      { title: 'Billing', path: paths.dashboard.billing, icon: ICONS.invoice },
      { title: 'Finance', path: paths.dashboard.financeSection('overview'), icon: ICONS.banking, roles: ['org_manager', 'org_admin', 'org_owner', 'platform_admin'] },
      { title: 'Projects', path: paths.dashboard.projects, icon: ICONS.kanban },
      { title: 'Shop', path: paths.dashboard.shop, icon: ICONS.ecommerce },
      { title: 'Products', path: paths.dashboard.products, icon: ICONS.product },
      { title: 'Marketing', path: paths.dashboard.marketing, icon: ICONS.course },
      { title: 'Form Funnel', path: paths.dashboard.formBuilder, icon: ICONS.menuItem },
      { title: 'Web Builder', path: paths.dashboard.webBuilderCreate, icon: ICONS.blog },
      { title: 'Workflow', path: paths.dashboard.workflow, icon: ICONS.analytics, roles: ['org_manager', 'org_admin', 'org_owner', 'platform_admin'] },
      { title: 'Calendar', path: paths.dashboard.calendar, icon: ICONS.calendar },
      { title: 'Community', path: paths.dashboard.community, icon: ICONS.chat },
      { title: 'Chat', path: '/dashboard/chat', icon: ICONS.mail },
      { title: 'Booking', path: '/dashboard/booking', icon: ICONS.tour },
      { title: 'Reputation', path: paths.dashboard.webToolsReputation, icon: ICONS.analytics },
      { title: 'POS Tables', path: paths.dashboard.posTables, icon: ICONS.booking },
      { title: 'Organizations', path: paths.dashboard.organizations, icon: ICONS.job, roles: ['org_admin', 'org_owner', 'platform_admin'] },
      { title: 'Devices', path: paths.dashboard.devices, icon: ICONS.external, roles: ['org_admin', 'org_owner', 'platform_admin'] },
      { title: 'White Label', path: paths.dashboard.whiteLabel, icon: ICONS.setting, roles: ['org_admin', 'org_owner', 'platform_admin'] },
      { title: 'Domain', path: paths.dashboard.domain, icon: ICONS.external, roles: ['org_admin', 'org_owner', 'platform_admin'] },
      { title: 'Settings', path: paths.dashboard.settings, icon: ICONS.setting, roles: ['org_admin', 'org_owner', 'platform_admin'] },
      { title: 'Documents', path: paths.dashboard.documents, icon: ICONS.folder },
      { title: 'Employees', path: paths.dashboard.employees, icon: ICONS.job, roles: ['org_manager', 'org_admin', 'org_owner', 'platform_admin'] },
    ],
  },
  /**
   * Omnichannel
   */
  {
    subheader: 'Omnichannel',
    items: [
      { title: 'Inbox', path: paths.dashboard.omni.chat, icon: ICONS.mail },
      { title: 'Automation', path: paths.dashboard.omni.automation, icon: ICONS.analytics },
      { title: 'Broadcasts', path: paths.dashboard.omni.marketing, icon: ICONS.blog },
      { title: 'Channels', path: paths.dashboard.omni.channels, icon: ICONS.external },
      { title: 'Webhooks', path: paths.dashboard.omni.webhook_list, icon: ICONS.setting },
    ],
  },
];
