import { paths } from 'src/routes/paths';

import { COMMERCE_DASHBOARD_MODULES } from 'src/sections/commerce/view/commerce-workspace.types';

export const publicSmokeRoutes = [
  { label: 'login', path: paths.public.login, checks: ['Sign in to your account', 'Sign in'] },
  { label: 'register', path: paths.public.register, checks: ['Get started absolutely free', 'Create account'] },
  { label: 'login code', path: paths.public.loginCode, checks: ['Sign In With Code', 'Login'] },
  { label: 'forgot password', path: paths.public.forgotPassword, checks: ['Forgot Password', 'Login'] },
  { label: 'onboarding', path: paths.public.onboarding, checks: ['Onboarding', 'Register'] },
  { label: 'verified', path: paths.public.verified, checks: ['Verified'] },
  { label: 'notifications', path: paths.public.notifications, checks: ['Notifications'] },
  { label: 'mobile settings', path: paths.public.mobileSettings, checks: ['Mobile Settings'] },
  { label: 'mobile menu', path: paths.public.mobileMenu, checks: ['Mobile Menu'] },
  { label: 'help center', path: paths.public.helpCenter, checks: ['Help Center'] },
  { label: 'plans', path: paths.public.plans, checks: ['Plans', 'planId:', 'duration:'] },
] as const;

export const dashboardSmokeRoutes = [
  { label: 'overview', path: paths.dashboard.overview, checks: ['Executive Analytics', 'Business Performance'] },
  { label: 'sales', path: paths.dashboard.sales, checks: ['Sales', 'Pipeline'] },
  { label: 'contacts', path: paths.dashboard.contacts, checks: ['Contact Manager', 'Total Contacts'] },
  { label: 'documents', path: paths.dashboard.documents, checks: ['Documents', 'Upload File'] },
  { label: 'billing', path: paths.dashboard.billing, checks: ['Billing', 'Reconciliation (Odoo vs Magento)'] },
  { label: 'finance', path: '/dashboard/finance', checks: ['Finance Hub', 'Recent Transactions'] },
  { label: 'calendar', path: paths.dashboard.calendar, checks: ['Calendar', 'New Event'] },
  { label: 'projects', path: paths.dashboard.projects, checks: ['Project Manager', 'New Project'] },
  { label: 'marketing', path: paths.dashboard.marketing, checks: ['Marketing Dashboard', 'Campaigns'] },
  { label: 'organizations', path: paths.dashboard.organizations, checks: ['Organization CRM Workspace', 'Overview'] },
  { label: 'employees', path: paths.dashboard.employees, checks: ['Employees', 'Attendance'] },
  { label: 'settings', path: paths.dashboard.settings, checks: ['Organization Settings', 'General Information'] },
  { label: 'integrations: magento', path: paths.dashboard.magentoIntegration, checks: ['Magento Integration', 'Connection'] },
  { label: 'integrations: odoo', path: paths.dashboard.odooIntegration, checks: ['Odoo Integration', 'Connection'] },
  { label: 'commerce', path: paths.dashboard.shop, checks: ['Commerce', 'Recent Orders'] },
] as const;

export const commerceWorkspaceModuleLabels = COMMERCE_DASHBOARD_MODULES.filter((module) =>
  ['dashboard', 'products', 'inventory', 'orders', 'categories', 'settings'].includes(module.value)
);
