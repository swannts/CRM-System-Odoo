import { paths } from 'src/routes/paths';

describe('Magento Integration Status', () => {
  beforeEach(() => {
    cy.loginToKeycloak();
  });

  it('shows the Magento integration dashboard', () => {
    cy.visit(paths.dashboard.magentoIntegration, { failOnStatusCode: false });

    cy.contains('Magento Integration').should('be.visible');
    cy.contains('Connection').should('be.visible');
    cy.contains('Status').should('be.visible');
    cy.contains('Magento Data Preview').should('be.visible');
  });

  it('shows the store, product, customer, and order sync controls', () => {
    cy.visit(paths.dashboard.magentoIntegration, { failOnStatusCode: false });

    cy.contains('[role="tab"]', 'Products').click();
    cy.contains('SKU').should('be.visible');
    cy.contains('Name').should('be.visible');

    cy.contains('[role="tab"]', 'Customers').click();
    cy.contains('ID').should('be.visible');
    cy.contains('Email').should('be.visible');

    cy.contains('[role="tab"]', 'Orders').click();
    cy.contains('Order #').should('be.visible');
    cy.contains('Grand Total').should('be.visible');

    cy.contains('[role="tab"]', 'Stores').click();
    cy.contains('Code').should('be.visible');

    cy.contains('button', 'Dry-run customer sync').should('be.visible');
    cy.contains('button', 'Dry-run order sync').should('be.visible');
    cy.contains('button', 'Push customers to CRM').should('be.visible');
    cy.contains('button', 'Push orders to Billing/CRM').should('be.visible');
  });

  it('opens the Magento push confirmation dialog', () => {
    cy.visit(paths.dashboard.magentoIntegration, { failOnStatusCode: false });

    cy.contains('button', 'Push customers to CRM').click();
    cy.contains('Confirm push sync').should('be.visible');
    cy.contains('This will push Magento data into CRM/Billing. Continue?').should('be.visible');
    cy.contains('button', 'Cancel').click();
  });

  it('shows commerce products and orders routes', () => {
    cy.visit(paths.dashboard.products, { failOnStatusCode: false });
    cy.contains('Commerce').should('be.visible');
    cy.contains('Recent Orders').should('be.visible');

    cy.visit(paths.dashboard.orders, { failOnStatusCode: false });
    cy.contains('Commerce').should('be.visible');
    cy.contains('Recent Orders').should('be.visible');
  });
});
