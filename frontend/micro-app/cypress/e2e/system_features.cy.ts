import { paths } from 'src/routes/paths';

describe('System Features & Utilities', () => {
  beforeEach(() => {
    cy.loginToKeycloak();
  });

  it('renders the dashboard analytics and finance sections', () => {
    cy.visit(paths.dashboard.overview, { failOnStatusCode: false });
    cy.contains('Executive Analytics').should('be.visible');
    cy.contains('My Tasks').should('be.visible');
  });

  it('renders the finance overview and billing sections', () => {
    cy.visit(paths.dashboard.financeSection('overview'), { failOnStatusCode: false });
    cy.contains('Billing and Finance').should('be.visible');
    cy.contains('Recent Transactions').should('be.visible');
    cy.contains('P&L').click();
    cy.contains('Profit and Loss').should('be.visible');
  });

  it('renders the booking and calendar surfaces', () => {
    cy.visit(paths.dashboard.calendar, { failOnStatusCode: false });
    cy.contains('Calendar').should('be.visible');
    cy.contains('New Event').should('be.visible');
    cy.contains('[role="tab"]', 'agenda').click();
    cy.contains('Events List').should('be.visible');
    cy.contains('[role="tab"]', 'booking links').click();
    cy.contains('No booking links').should('be.visible');

    cy.visit('/dashboard/booking', { failOnStatusCode: false });
    cy.contains('Bookings & Appointments').should('be.visible');
    cy.contains('Appointments').should('be.visible');
  });
});
