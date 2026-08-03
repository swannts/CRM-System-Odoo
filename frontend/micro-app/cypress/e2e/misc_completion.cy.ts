import { paths } from 'src/routes/paths';

describe('Miscellaneous Features Completion', () => {
  beforeEach(() => {
    cy.loginToKeycloak();
  });

  it('should render the chat workspace', () => {
    cy.visit('/dashboard/chat', { failOnStatusCode: false });
    cy.contains('Contacts').should('be.visible');
    cy.contains('Select a contact to start chatting').should('be.visible');
    cy.contains('Type a message...').should('be.visible');
  });

  it('should render the omnichannel inbox', () => {
    cy.visit(paths.dashboard.omni.chat, { failOnStatusCode: false });
    cy.contains('Omnichannel Inbox').should('be.visible');
    cy.contains('Open').should('be.visible');
    cy.contains('Pending').should('be.visible');
  });

  it('should render the project manager and project workspace', () => {
    cy.visit(paths.dashboard.projects, { failOnStatusCode: false });
    cy.contains('Project Manager').should('be.visible');
    cy.contains('button', 'New Project').should('be.visible');
    cy.contains('Search projects...').should('be.visible');

    cy.visit(paths.dashboard.project('demo-project'), { failOnStatusCode: false });
    cy.contains('Project Details').should('be.visible');
    cy.contains('Board').should('be.visible');
    cy.contains('Dashboard').should('be.visible');
  });

  it('should render the booking workspace and calendar', () => {
    cy.visit('/dashboard/booking', { failOnStatusCode: false });
    cy.contains('Bookings & Appointments').should('be.visible');
    cy.contains('Appointments').should('be.visible');
    cy.contains('button', 'New Booking Type').should('be.visible');

    cy.visit(paths.dashboard.calendar, { failOnStatusCode: false });
    cy.contains('Calendar').should('be.visible');
    cy.contains('New Event').should('be.visible');
    cy.contains('booking links').should('be.visible');
  });

  it('should render the organization management and location workspaces', () => {
    cy.visit(paths.dashboard.organizations, { failOnStatusCode: false });
    cy.contains('Organization CRM Workspace').should('be.visible');
    cy.contains('Overview').should('be.visible');
    cy.contains('Profile').should('be.visible');

    cy.visit(paths.dashboard.organizationLocation('demo-org', 'demo-user'), { failOnStatusCode: false });
    cy.contains('Organization').should('be.visible');
    cy.contains('Locations').should('be.visible');
    cy.contains('Add Location').should('be.visible');
    cy.contains('button', 'Create Location').should('be.visible');
  });
});
