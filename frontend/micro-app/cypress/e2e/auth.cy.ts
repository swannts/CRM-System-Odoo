import { paths } from 'src/routes/paths';

describe('Authentication Flow', () => {
  it('should redirect to Keycloak and allow login', () => {
    cy.loginToKeycloak();
    cy.visit('/', { failOnStatusCode: false });
    cy.location('pathname', { timeout: 60000 }).should('eq', paths.dashboard.overview);
    cy.assertAppShell();
  });

  it('should keep the app shell available after visiting a dashboard route', () => {
    cy.loginToKeycloak();
    cy.visit(paths.dashboard.overview, { failOnStatusCode: false });
    cy.assertAppShell();
  });
});
