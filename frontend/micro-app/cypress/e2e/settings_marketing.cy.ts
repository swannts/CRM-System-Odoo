import { paths } from 'src/routes/paths';

describe('Settings & Marketing Management', () => {
  beforeEach(() => {
    cy.loginToKeycloak();
  });

  it('renders the settings workspace tabs', () => {
    cy.visit(paths.dashboard.settings, { failOnStatusCode: false });

    cy.contains('Organization').should('be.visible');
    cy.contains('General').should('be.visible');
    cy.contains('Billing').should('be.visible');
    cy.contains('Smart List').should('be.visible');
  });

  it('renders marketing overview, analytics, segments, and compliance routes', () => {
    cy.visit(paths.dashboard.marketing, { failOnStatusCode: false });
    cy.contains('Marketing Dashboard').should('be.visible');

    cy.visit(paths.dashboard.marketingSection('analytics'), { failOnStatusCode: false });
    cy.contains('Marketing Analytics').should('be.visible');

    cy.visit(paths.dashboard.marketingSection('segments'), { failOnStatusCode: false });
    cy.contains('Segments').should('be.visible');

    cy.visit(paths.dashboard.marketingSection('compliance'), { failOnStatusCode: false });
    cy.contains('Compliance & Suppression').should('be.visible');
  });
});
