import { paths } from 'src/routes/paths';

describe('Shop and Point of Sale (POS)', () => {
  beforeEach(() => {
    cy.loginToKeycloak();
  });

  it('renders the shop workspace and the commerce modules', () => {
    cy.visit(paths.dashboard.shop, { failOnStatusCode: false });

    cy.contains('Commerce').should('be.visible');
    cy.contains('Recent Orders').should('be.visible');
    cy.contains('Catalog').should('be.visible');
    cy.contains('Inventory').should('be.visible');
  });

  it('navigates the commerce module tabs and POS route', () => {
    cy.visit(paths.dashboard.shop, { failOnStatusCode: false });

    cy.contains('[role="tab"]', 'Products').click();
    cy.contains('Catalog').should('be.visible');
    cy.contains('[role="tab"]', 'Orders').click();
    cy.contains('Recent Orders').should('be.visible');
    cy.contains('[role="tab"]', 'Settings').click();
    cy.contains('Store settings').should('be.visible');
    cy.contains('Current storefront summary').should('be.visible');
  });

  it('renders the POS workspace route', () => {
    cy.visit(paths.dashboard.pos('demo-shop'), { failOnStatusCode: false });
    cy.contains('Point of Sale').should('be.visible');
    cy.contains('[role="tab"]', 'Register').should('be.visible');
    cy.contains('[role="tab"]', 'Orders').should('be.visible');
    cy.contains('button', 'Checkout').should('be.visible');
  });
});
