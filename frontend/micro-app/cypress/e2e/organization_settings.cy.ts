import { paths } from 'src/routes/paths';

describe('Organization Settings & Management', () => {
  beforeEach(() => {
    cy.loginToKeycloak();
  });

  it('renders the organization settings tabs and general form', () => {
    cy.visit(paths.dashboard.settings, { failOnStatusCode: false });

    cy.contains('Organization Settings').should('be.visible');
    cy.contains('General Information').should('be.visible');
    cy.contains('Branding').should('be.visible');
    cy.contains('Roles & Permissions').should('be.visible');
    cy.contains('Integrations').should('be.visible');
    cy.contains('button', 'Save Changes').should('be.visible');
  });

  it('switches to the integrations tab and exposes the Magento integration link', () => {
    cy.visit(paths.dashboard.settings, { failOnStatusCode: false });

    cy.contains('button', 'Integrations').click();
    cy.contains('Third-Party Integrations').should('be.visible');
    cy.contains('Magento Integration').should('be.visible');
    cy.contains('button', 'Open Magento').should('be.visible');
  });
});
