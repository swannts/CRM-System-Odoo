describe('Dashboard Overview', () => {
  beforeEach(() => {
    cy.loginToKeycloak();
  });

  it('renders the analytics dashboard and switches the range and settings dialog', () => {
    cy.visit('/dashboard', { failOnStatusCode: false });

    cy.contains('Executive Analytics').should('be.visible');
    cy.contains('Business Performance').should('be.visible');

    cy.contains('button', '7d').should('be.visible');
    cy.contains('button', '30d').should('be.visible');
    cy.contains('button', '90d').should('be.visible');
    cy.contains('button', '90d').click();

    cy.contains('button', 'Customize Dashboard').click();
    cy.contains('Customize Dashboard').should('be.visible');
    cy.contains('Revenue Widget').should('be.visible');
    cy.contains('Goal Tracker').should('be.visible');
    cy.contains('Alerts Feed').should('be.visible');
    cy.contains('My Tasks').should('be.visible');
    cy.contains('button', 'Save Changes').should('be.visible');
    cy.contains('button', 'Cancel').click();
  });
});
