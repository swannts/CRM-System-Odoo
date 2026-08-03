import { paths } from 'src/routes/paths';

describe('Documents & Billing Management', () => {
  beforeEach(() => {
    cy.loginToKeycloak();
  });

  it('renders the documents command center', () => {
    cy.visit(paths.dashboard.documents, { failOnStatusCode: false });

    cy.contains('Documents').should('be.visible');
    cy.contains('button', 'Upload File').should('be.visible');
    cy.get('input[placeholder="Search documents..."]').should('be.visible');
  });

  it('renders the invoice list route and follows finance navigation links', () => {
    cy.visit(paths.dashboard.invoices, { failOnStatusCode: false });

    cy.contains('Billing and Finance').should('be.visible');
    cy.contains('Invoice List').should('be.visible');
    cy.contains('Add Invoice').should('be.visible');
    cy.contains('Finance Overview').should('be.visible');

    cy.contains('a', 'Finance Overview').click();
    cy.contains('Billing and Finance').should('be.visible');
    cy.contains('Recent Transactions').should('be.visible');

    cy.contains('a', 'P&L').click();
    cy.contains('Profit and Loss').should('be.visible');
  });
});
