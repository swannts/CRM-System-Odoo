import { publicSmokeRoutes, dashboardSmokeRoutes } from '../support/app-routes';

describe('Application smoke coverage', () => {
  it('redirects the root route to the authenticated dashboard when logged in', () => {
    cy.loginToKeycloak();
    cy.visit('/', { failOnStatusCode: false });

    cy.location('pathname', { timeout: 60000 }).should('eq', '/dashboard/overview');
    cy.assertAppShell();
  });

  publicSmokeRoutes.forEach((route) => {
    it(`renders the public route: ${route.label}`, () => {
      cy.visit(route.path, { failOnStatusCode: false });
      route.checks.forEach((text) => {
        cy.contains(text).should('be.visible');
      });
      cy.get('body').should('not.contain', 'Unhandled Runtime Error');
    });
  });

  dashboardSmokeRoutes.forEach((route) => {
    it(`renders the dashboard route: ${route.label}`, () => {
      cy.loginToKeycloak();
      cy.visit(route.path, { failOnStatusCode: false });

      cy.location('pathname').should('match', /^\/dashboard/);
      cy.assertAppShell();
      route.checks.forEach((text) => {
        cy.contains(text).should('be.visible');
      });
    });
  });
});
