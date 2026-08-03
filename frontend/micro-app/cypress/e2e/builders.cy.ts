import { paths } from 'src/routes/paths';

describe('Builders (Form & Workflow)', () => {
  beforeEach(() => {
    cy.loginToKeycloak();
  });

  it('opens the form funnel workspace', () => {
    cy.visit(paths.dashboard.formBuilder, { failOnStatusCode: false });

    cy.contains('Form Funnel').should('be.visible');
    cy.contains('Funnels').should('be.visible');
    cy.contains('Templates').should('be.visible');
    cy.contains('button', 'New Form').should('be.visible');
  });

  it('renders the email editor, workflow, and reputation routes', () => {
    cy.visit(paths.dashboard.emailEditor, { failOnStatusCode: false });
    cy.contains('Email Visual Designer').should('be.visible');
    cy.contains('button', 'Save Draft').should('be.visible');

    cy.visit(paths.dashboard.workflow, { failOnStatusCode: false });
    cy.contains('Workflow').should('be.visible');
    cy.contains('Workflow Workspaces').should('be.visible');

    cy.visit(paths.dashboard.webToolsReputation, { failOnStatusCode: false });
    cy.contains('Reputation Management').should('be.visible');
    cy.contains('Overview & Reviews').should('be.visible');
    cy.contains('button', 'Request Review').should('be.visible');

    cy.visit(paths.dashboard.webToolsSocialProof, { failOnStatusCode: false });
    cy.contains('Social Proof').should('be.visible');

    cy.visit(paths.dashboard.webToolsSocialScheduler, { failOnStatusCode: false });
    cy.contains('Social Scheduler').should('be.visible');
  });
});
