import { paths } from 'src/routes/paths';

describe('Odoo ERP Integration Flow', () => {
  beforeEach(() => {
    cy.loginToKeycloak();
  });

  it('shows the Odoo integration workspace', () => {
    cy.visit(paths.dashboard.odooIntegration, { failOnStatusCode: false });

    cy.contains('Odoo Integration').should('be.visible');
    cy.contains('Connection').should('be.visible');
    cy.contains('Connection status').should('be.visible');
    cy.contains('Odoo preview').should('be.visible');
    cy.contains('Magento -> Odoo sync').should('be.visible');
  });

  it('switches preview tabs and exposes sync actions', () => {
    cy.visit(paths.dashboard.odooIntegration, { failOnStatusCode: false });

    cy.contains('[role="tab"]', 'Companies').click();
    cy.contains('No preview items.').should('be.visible');
    cy.contains('[role="tab"]', 'Leads').click();
    cy.contains('No preview items.').should('be.visible');
    cy.contains('[role="tab"]', 'Invoices').click();
    cy.contains('No preview items.').should('exist');
    cy.contains('[role="tab"]', 'Sales Orders').click();
    cy.contains('No preview items.').should('be.visible');
    cy.contains('button', 'Dry-run Magento customers -> Odoo').should('be.visible');
    cy.contains('button', 'Push Magento orders -> Odoo').should('be.visible');
  });

  it('opens the Odoo push confirmation dialog', () => {
    cy.visit(paths.dashboard.odooIntegration, { failOnStatusCode: false });

    cy.contains('button', 'Push Magento orders -> Odoo').click();
    cy.contains('Confirm push sync').should('be.visible');
    cy.contains('This will push Magento data into Odoo. Continue?').should('be.visible');
    cy.contains('button', 'Cancel').click();
  });
});
