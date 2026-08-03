import { paths } from 'src/routes/paths';

describe('Admin and Finance', () => {
  beforeEach(() => {
    cy.loginToKeycloak();
  });

  it('shows the finance hub summary and transactions', () => {
    cy.visit('/dashboard/finance', { failOnStatusCode: false });

    cy.contains('Finance Hub').should('be.visible');
    cy.contains('Recent Transactions').should('be.visible');
    cy.contains('Revenue Allocation').should('be.visible');
    cy.contains('Export Financials').should('be.visible');
  });

  it('shows the employee directory tabs and the settings workspace', () => {
    cy.visit(paths.dashboard.employees, { failOnStatusCode: false });

    cy.contains('h4', 'Employees').should('be.visible');
    cy.contains('[role="tab"]', 'Overview').should('be.visible');
    cy.contains('[role="tab"]', 'Directory').should('be.visible');
    cy.contains('[role="tab"]', 'Attendance').should('be.visible');
    cy.contains('[role="tab"]', 'Time off').should('be.visible');

    cy.contains('[role="tab"]', 'Directory').click();
    cy.contains('[role="tab"]', 'Directory').should('have.attr', 'aria-selected', 'true');
    cy.contains('label', 'Search').should('be.visible');
    cy.contains('label', 'Status').should('be.visible');
    cy.contains('label', 'Department').should('be.visible');

    cy.contains('[role="tab"]', 'Overview').click();
    cy.contains('[role="tab"]', 'Overview').should('have.attr', 'aria-selected', 'true');
    cy.contains('Recently added employees').should('be.visible');
    cy.contains('Pending approvals').should('be.visible');
  });

  it('shows the organization workspace tabs', () => {
    cy.visit(paths.dashboard.organizations, { failOnStatusCode: false });

    cy.contains('Organization CRM Workspace').should('be.visible');
    cy.contains('Overview').should('be.visible');
    cy.contains('Profile').should('be.visible');
    cy.contains('Members').should('be.visible');
    cy.contains('Locations').should('be.visible');

    cy.contains('[role="tab"]', 'Members').click();
    cy.contains('[role="tab"]', 'Members').should('have.attr', 'aria-selected', 'true');
    cy.contains('[role="tab"]', 'Locations').click();
    cy.contains('[role="tab"]', 'Locations').should('have.attr', 'aria-selected', 'true');
  });

  it('renders the admin service-fees route', () => {
    cy.visit(paths.dashboard.serviceFees, { failOnStatusCode: false });
    cy.contains('Service Fees').should('be.visible');
    cy.contains('Context').should('be.visible');
  });

  it('renders the finance section routes', () => {
    cy.visit(paths.dashboard.financeSection('overview'), { failOnStatusCode: false });
    cy.contains('Billing and Finance').should('be.visible');
    cy.contains('Summary').should('be.visible');

    cy.visit(paths.dashboard.financeSection('pnl'), { failOnStatusCode: false });
    cy.contains('Profit and Loss').should('be.visible');
  });
});
