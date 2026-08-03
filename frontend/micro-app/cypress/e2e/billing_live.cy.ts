import { paths } from 'src/routes/paths';

describe('Billing Live Flows', () => {
  beforeEach(() => {
    cy.loginToKeycloak();
  });

  it('shows billing list summary cards and reconciliation panel', () => {
    cy.visit(paths.dashboard.billing, { failOnStatusCode: false });

    cy.contains('Billing').should('be.visible');
    cy.contains('Total Revenue').should('be.visible');
    cy.contains('Paid').should('be.visible');
    cy.contains('Outstanding').should('be.visible');
    cy.contains('Reconciliation (Odoo vs Magento)').should('be.visible');
    cy.get('input[placeholder="Search invoices..."]').should('be.visible');
  });

  it('switches to graph view and shows the billing trend section', () => {
    cy.visit(`${paths.dashboard.billing}?view=graph`, { failOnStatusCode: false });

    cy.contains('Billing Trend (Last 6 Months)').should('be.visible');
    cy.contains('Live monthly invoice, paid, and outstanding totals from Odoo billing data.').should('be.visible');
    cy.contains('button', 'New Invoice').should('be.visible');
  });

  it('opens the invoice row action menu', () => {
    cy.visit(paths.dashboard.billing, { failOnStatusCode: false });

    cy.get('tbody tr').first().within(() => {
      cy.get('button').last().click();
    });

    cy.contains('View Details').should('be.visible');
    cy.contains('Edit').should('be.visible');
    cy.contains('Download PDF').should('be.visible');
  });

  it('navigates from the invoice list to the preview and edit routes', () => {
    cy.visit(paths.dashboard.billing, { failOnStatusCode: false });

    cy.get('tbody tr').first().within(() => {
      cy.get('button').last().click();
    });

    cy.contains('View Details').click();
    cy.contains('Invoice #').should('be.visible');
    cy.contains('Customer:').should('be.visible');
    cy.contains('button', 'Download PDF').should('be.visible');

    cy.visit(paths.dashboard.billing, { failOnStatusCode: false });
    cy.get('tbody tr').first().within(() => {
      cy.get('button').last().click();
    });

    cy.contains('Edit').click();
    cy.contains('Edit Invoice').should('be.visible');
    cy.contains('Customer Name').should('be.visible');
    cy.contains('Description / Service Name').should('be.visible');
    cy.contains('button', 'Save Invoice').should('be.visible');
  });

  it('renders the create invoice form', () => {
    cy.visit(paths.dashboard.invoiceNew, { failOnStatusCode: false });

    cy.contains('Create Invoice').should('be.visible');
    cy.contains('Customer Name').should('be.visible');
    cy.contains('Description / Service Name').should('be.visible');
    cy.contains('Due Date').should('be.visible');
    cy.contains('button', 'Create Invoice').should('be.visible');
  });
});
