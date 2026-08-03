import { paths } from 'src/routes/paths';

describe('Marketing and Web Tools', () => {
  beforeEach(() => {
    cy.loginToKeycloak();
  });

  it('shows the marketing dashboard and workspace entry points', () => {
    cy.visit(paths.dashboard.marketing, { failOnStatusCode: false });

    cy.contains('Marketing Dashboard').should('be.visible');
    cy.contains('Marketing Modules').should('be.visible');
    cy.contains('Campaigns').should('be.visible');
    cy.contains('Segments').should('be.visible');
    cy.contains('Analytics').should('be.visible');
  });

  it('opens the campaigns workspace and filters campaign states', () => {
    cy.visit(paths.dashboard.marketingSection('campaigns'), { failOnStatusCode: false });

    cy.contains('Campaigns').should('be.visible');
    cy.contains('Campaigns, attribution, and conversion analytics in one workspace.').should('be.visible');
    cy.contains('button', 'Create Campaign').should('be.visible');
    cy.contains('[role="tab"]', 'SENT').should('be.visible');
  });

  it('renders the web tools routes used by the builder shell', () => {
    cy.visit(paths.dashboard.webToolsSocialProof, { failOnStatusCode: false });
    cy.contains('Social Proof').should('be.visible');

    cy.visit(paths.dashboard.webToolsSocialScheduler, { failOnStatusCode: false });
    cy.contains('Social Scheduler').should('be.visible');

    cy.visit(paths.dashboard.webToolsReputation, { failOnStatusCode: false });
    cy.contains('Reputation').should('be.visible');
  });
});
