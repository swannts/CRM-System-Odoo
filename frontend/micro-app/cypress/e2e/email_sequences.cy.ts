import { paths } from 'src/routes/paths';

describe('Email Sync & Sequence Campaign Management', () => {
  beforeEach(() => {
    cy.loginToKeycloak();
  });

  it('renders the email sequence workspace', () => {
    cy.visit(paths.dashboard.marketingSection('automation'), { failOnStatusCode: false });

    cy.contains('Email Sequences').should('be.visible');
    cy.contains('Sequence').should('be.visible');
    cy.contains('Enrollment Status').should('be.visible');
    cy.contains('button', 'Create Sequence').should('be.visible');
  });
});
