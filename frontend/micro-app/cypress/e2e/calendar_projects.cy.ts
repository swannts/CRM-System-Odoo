import { paths } from 'src/routes/paths';

describe('Calendar and Projects', () => {
  beforeEach(() => {
    cy.loginToKeycloak();
  });

  it('switches calendar tabs and shows the scheduling states', () => {
    cy.visit(paths.dashboard.calendar, { failOnStatusCode: false });

    cy.contains('Calendar').should('be.visible');
    cy.contains('button', 'New Event').should('be.visible');

    cy.contains('[role="tab"]', 'agenda').click();
    cy.contains('Events List').should('be.visible');
    cy.contains('Title').should('be.visible');
    cy.contains('Status').should('be.visible');
    cy.contains('Start').should('be.visible');
    cy.contains('End').should('be.visible');

    cy.contains('[role="tab"]', 'availability').click();
    cy.contains('No availability rules').should('be.visible');

    cy.contains('[role="tab"]', 'booking links').click();
    cy.contains('No booking links').should('be.visible');
  });

  it('renders the project manager, opens create dialog, and navigates to project details', () => {
    cy.visit(paths.dashboard.projects, { failOnStatusCode: false });

    cy.contains('Project Manager').should('be.visible');
    cy.contains('Search projects...').should('be.visible');
    cy.contains('Project Name').should('be.visible');
    cy.contains('button', 'New Project').click();
    cy.contains('New Project').should('be.visible');
    cy.contains('button', 'Create').should('be.visible');
    cy.contains('Description').should('be.visible');
    cy.contains('button', 'Cancel').click();

    cy.get('tbody tr').first().within(() => {
      cy.get('button').click();
    });

    cy.contains('[role="tab"]', 'Board').should('have.attr', 'aria-selected', 'true');
    cy.contains('[role="tab"]', 'Dashboard').should('be.visible');
    cy.contains('New Column').should('be.visible');
  });
});
