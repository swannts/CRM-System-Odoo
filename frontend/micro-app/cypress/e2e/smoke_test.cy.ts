import { paths } from 'src/routes/paths';

describe('Smoke Test - Critical Path', () => {
  it('should verify application lifecycle and authenticated access', () => {
    cy.loginToKeycloak();
    cy.visit(paths.dashboard.overview, { failOnStatusCode: false });
    cy.contains('Executive Analytics').should('be.visible');
    cy.assertAppShell();
  });
});
