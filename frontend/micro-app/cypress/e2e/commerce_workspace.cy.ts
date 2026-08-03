import { paths } from 'src/routes/paths';

import { commerceWorkspaceModuleLabels } from '../support/app-routes';

describe('Commerce workspace', () => {
  beforeEach(() => {
    cy.loginToKeycloak();
  });

  it('renders the commerce dashboard shell', () => {
    cy.visit(paths.dashboard.shop, { failOnStatusCode: false });

    cy.assertAppShell();
    cy.contains('Commerce').should('be.visible');
    cy.contains('Recent Orders').should('be.visible');
  });

  it('switches between commerce modules using the tab bar', () => {
    cy.visit(paths.dashboard.shop, { failOnStatusCode: false });

    commerceWorkspaceModuleLabels.forEach((module) => {
      cy.contains('[role="tab"]', module.label).click();
      cy.location('pathname', { timeout: 60000 }).should('include', paths.dashboard.shopSection(module.value));
      cy.assertAppShell();
    });
  });
});
