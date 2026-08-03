import { paths } from 'src/routes/paths';

describe('Contacts Module', () => {
  beforeEach(() => {
    cy.loginToKeycloak();
  });

  it('renders the contact manager dashboard and filters by tab', () => {
    cy.visit(paths.dashboard.contacts, { failOnStatusCode: false });

    cy.contains('Contact Manager').should('be.visible');
    cy.contains('Total Contacts').should('be.visible');
    cy.contains('Active Leads').should('be.visible');
    cy.contains('Members').should('be.visible');
    cy.contains('Employees').should('be.visible');
    cy.get('input[placeholder*="Search leads, members, or clients"]').should('be.visible');

    cy.contains('[role="tab"]', 'Leads').click();
    cy.contains('[role="tab"]', 'Employees').click();
    cy.contains('[role="tab"]', 'All').should('be.visible');
  });

  it('opens the create and import dialogs', () => {
    cy.visit(paths.dashboard.contacts, { failOnStatusCode: false });

    cy.contains('button', 'New Contact').click();
    cy.contains('New Contact').should('be.visible');
    cy.contains('button', 'Create Contact').should('be.visible');
    cy.contains('button', 'Cancel').click();

    cy.contains('button', 'Import').click();
    cy.contains('Import Contacts').should('be.visible');
    cy.contains('button', 'Download Template').should('be.visible');
    cy.contains('button', 'Cancel').click();
  });

  it('switches to graph and kanban views', () => {
    cy.visit(`${paths.dashboard.contacts}?view=graph`, { failOnStatusCode: false });
    cy.contains('Contacts Created (Last 6 Months)').should('be.visible');
    cy.contains('Status Distribution').should('be.visible');
    cy.contains('Contact Type Distribution').should('be.visible');

    cy.visit(`${paths.dashboard.contacts}?view=kanban`, { failOnStatusCode: false });
    cy.contains('Lead').should('be.visible');
    cy.contains('Member').should('be.visible');
    cy.contains('Client').should('be.visible');
    cy.contains('Vendor').should('be.visible');
    cy.contains('Employee').should('be.visible');
    cy.contains('button', 'Add Contact').should('be.visible');
  });

  it('opens a contact detail page from the row actions and edits the profile', () => {
    cy.visit(paths.dashboard.contacts, { failOnStatusCode: false });

    cy.get('tbody tr').first().within(() => {
      cy.get('button').last().click();
    });

    cy.contains('View details').click();
    cy.contains('Contact Profile:').should('be.visible');
    cy.contains('[role="tab"]', 'Overview').should('be.visible');
    cy.contains('[role="tab"]', 'Tasks').should('be.visible');

    cy.contains('button', 'Edit Profile').click();
    cy.contains('Edit Contact').should('be.visible');
    cy.contains('button', 'Save changes').should('be.visible');
    cy.contains('button', 'Cancel').click();
  });

  it('opens the archive dialog from the row actions', () => {
    cy.visit(paths.dashboard.contacts, { failOnStatusCode: false });

    cy.get('tbody tr').first().within(() => {
      cy.get('button').last().click();
    });

    cy.contains('Archive contact').click();
    cy.contains('Archive Contact?').should('be.visible');
    cy.contains('button', 'Archive').should('be.visible');
    cy.contains('button', 'Cancel').click();
  });
});
