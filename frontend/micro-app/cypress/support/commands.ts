/* eslint-disable @typescript-eslint/no-namespace */
import { paths } from 'src/routes/paths';

// ***********************************************
// Cypress Custom Commands for MyManager CRM
// ***********************************************

const keycloakUrl = new URL(String(Cypress.env('KEYCLOAK_URL') || 'http://localhost:8080')).origin;
const keycloakUsername = String(Cypress.env('KEYCLOAK_USERNAME') || 'org-owner');
const keycloakPassword = String(Cypress.env('KEYCLOAK_PASSWORD') || 'password123');

declare global {
  namespace Cypress {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Chainable<Subject = any> {
      loginToKeycloak(username?: string, password?: string): Chainable<void>;
      ensureAuthenticated(path?: string): Chainable<void>;
      assertAppShell(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('loginToKeycloak', (username = keycloakUsername, password = keycloakPassword) => {
  cy.session(['keycloak', username, password], () => {
    cy.visit(paths.auth.keycloak.signIn, { failOnStatusCode: false });
    cy.location('origin', { timeout: 60000 }).should('eq', keycloakUrl);

    cy.origin(
      keycloakUrl,
      { args: { username: username || keycloakUsername, password: password || keycloakPassword } },
      (args) => {
        const { username: loginUsername, password: loginPassword } = args as {
          username: string;
          password: string;
        };
        cy.get('#username', { timeout: 60000 }).should('be.visible').clear().type(loginUsername);
        cy.get('#password').should('be.visible').clear().type(loginPassword, { log: false });
        cy.get('#kc-login').click();
      }
    );

    cy.location('pathname', { timeout: 60000 }).should('match', /^\/dashboard\/overview\/?$/);
  }, {
    cacheAcrossSpecs: true,
  });
});

Cypress.Commands.add('ensureAuthenticated', (path = '/') => {
  cy.loginToKeycloak();
  if (path !== '/') {
    cy.visit(path, { failOnStatusCode: false });
  }
});

Cypress.Commands.add('assertAppShell', () => {
  cy.get('[data-cy="app-shell"]').should('be.visible');
  cy.get('[data-cy="dashboard-content"]').should('be.visible');
  cy.get('body').should('not.contain', 'Unhandled Runtime Error');
});

export {};
