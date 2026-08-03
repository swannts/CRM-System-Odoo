import { paths } from 'src/routes/paths';

const publicRoutes = [
  {
    label: 'login',
    path: paths.public.login,
    checks: ['Sign in to your account', 'Email address', 'Sign in'],
  },
  {
    label: 'register',
    path: paths.public.register,
    checks: ['Get started absolutely free', 'First name', 'Create account'],
  },
  {
    label: 'login code',
    path: paths.public.loginCode,
    checks: ['Sign In With Code', 'Login', 'Register'],
  },
  {
    label: 'forgot password',
    path: paths.public.forgotPassword,
    checks: ['Forgot Password', 'Login', 'Register'],
  },
  {
    label: 'onboarding',
    path: paths.public.onboarding,
    checks: ['Onboarding', 'Login', 'Register'],
  },
  {
    label: 'verified',
    path: paths.public.verified,
    checks: ['Verified'],
  },
  {
    label: 'notifications',
    path: paths.public.notifications,
    checks: ['Notifications'],
  },
  {
    label: 'mobile settings',
    path: paths.public.mobileSettings,
    checks: ['Mobile Settings'],
  },
  {
    label: 'mobile menu',
    path: paths.public.mobileMenu,
    checks: ['Mobile Menu'],
  },
  {
    label: 'help center',
    path: paths.public.helpCenter,
    checks: ['Help Center'],
  },
  {
    label: 'plans',
    path: paths.public.plans,
    checks: ['Plans', 'planId:', 'duration:'],
  },
] as const;

describe('Public Pages Access', () => {
  publicRoutes.forEach((route) => {
    it(`renders the public route: ${route.label}`, () => {
      cy.visit(route.path, { failOnStatusCode: false });
      route.checks.forEach((text) => {
        cy.contains(text).should('be.visible');
      });
      cy.get('body').should('not.contain', 'Unhandled Runtime Error');
    });
  });
});
