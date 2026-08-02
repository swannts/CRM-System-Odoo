export const VALID_ORG_ROLES = [
  'org_owner',
  'org_admin',
  'org_manager',
  'org_staff',
  'org_viewer',
  'customer',
  'vip_client',
  'sales_staff',
  'admin_manager',
  'logistics',
] as const;

export const ROLE_PROFILES: Record<string, {
  entityType: string;
  keycloakRole: string;
  odooRoleMapping: string;
  magentoRoleMapping: string;
}> = {
  customer: {
    entityType: 'End Customer',
    keycloakRole: 'customer',
    odooRoleMapping: 'Portal User',
    magentoRoleMapping: 'Customer Group: General',
  },
  vip_client: {
    entityType: 'VIP/B2B Client',
    keycloakRole: 'vip_client',
    odooRoleMapping: 'Portal User',
    magentoRoleMapping: 'Customer Group: Wholesale',
  },
  sales_staff: {
    entityType: 'Sales Rep',
    keycloakRole: 'sales_staff',
    odooRoleMapping: 'CRM: Own Documents',
    magentoRoleMapping: 'Admin: Sales Limited',
  },
  admin_manager: {
    entityType: 'Manager',
    keycloakRole: 'admin_manager',
    odooRoleMapping: 'Sales: Administrator',
    magentoRoleMapping: 'Admin: Full Access',
  },
  logistics: {
    entityType: 'Warehouse',
    keycloakRole: 'logistics',
    odooRoleMapping: 'Inventory: User',
    magentoRoleMapping: 'Admin: Shipments Only',
  },
};

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  org_owner: ['*:*'],
  org_admin: [
    'dashboard:*',
    'crm:*',
    'projects:*',
    'billing:*',
    'settings:*',
    'employees:*',
    'documents:*',
    'integrations:*',
    'users:*',
  ],
  org_manager: [
    'dashboard:view',
    'crm:*',
    'projects:*',
    'billing:view',
    'employees:view',
    'documents:*',
    'users:view',
    'integrations:view',
  ],
  org_staff: [
    'dashboard:view',
    'crm:view',
    'crm:create',
    'projects:view',
    'projects:create',
    'documents:view',
    'integrations:view',
  ],
  org_viewer: ['*:view'],
  customer: ['portal:view', 'orders:view', 'invoices:view'],
  vip_client: ['portal:view', 'orders:view', 'orders:create', 'invoices:view'],
  sales_staff: ['crm:view', 'crm:create', 'crm:update', 'sales:view'],
  admin_manager: ['crm:*', 'sales:*', 'inventory:view', 'users:view'],
  logistics: ['inventory:view', 'inventory:update', 'shipments:*'],
};

export const INTEGRATION_ROLE_PERMISSIONS: Record<string, string[]> = {};

export type IntegrationRoles = {
  odoo?: string | null;
  magento?: string | null;
};

export function getDefaultIntegrationRolesForOrgRole(orgRole: string): IntegrationRoles {
  const profile = ROLE_PROFILES[orgRole];
  if (profile) {
    return {
      odoo: profile.odooRoleMapping,
      magento: profile.magentoRoleMapping,
    };
  }
  if (orgRole === 'org_owner' || orgRole === 'org_admin' || orgRole === 'org_manager') {
    return { odoo: 'Sales: Administrator', magento: 'Admin: Full Access' };
  }
  if (orgRole === 'org_staff') {
    return { odoo: 'CRM: Own Documents', magento: 'Admin: Sales Limited' };
  }
  return { odoo: 'Portal User', magento: 'Customer Group: General' };
}

export function normalizeIntegrationRoles(input: any, orgRole?: string): IntegrationRoles {
  const defaults = getDefaultIntegrationRolesForOrgRole(String(orgRole || 'org_staff'));
  return { odoo: defaults.odoo, magento: defaults.magento };
}

export function buildEffectivePermissions(
  orgRole: string,
  integrationRoles: IntegrationRoles,
  explicitPermissions?: string[]
): string[] {
  const base = explicitPermissions?.length
    ? explicitPermissions
    : (DEFAULT_ROLE_PERMISSIONS[orgRole] || []);

  const integrationPerms = [
    ...(integrationRoles.odoo ? INTEGRATION_ROLE_PERMISSIONS[integrationRoles.odoo] || [] : []),
    ...(integrationRoles.magento ? INTEGRATION_ROLE_PERMISSIONS[integrationRoles.magento] || [] : []),
  ];

  return Array.from(new Set([...base, ...integrationPerms]));
}

export function getRbacCatalog() {
  return {
    orgRoles: VALID_ORG_ROLES,
    businessRoles: Object.values(ROLE_PROFILES),
    roleTemplates: DEFAULT_ROLE_PERMISSIONS,
  };
}

export function getRoleProfile(role: string) {
  return ROLE_PROFILES[role] || null;
}
