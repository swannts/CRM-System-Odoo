type KeycloakUser = {
  id: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled?: boolean;
  attributes?: Record<string, string[]>;
};

const MANAGED_ROLE_PREFIX = 'app_';
const BUSINESS_ROLES = new Set(['customer', 'vip_client', 'sales_staff', 'admin_manager', 'logistics']);

export class KeycloakAdminService {
  private baseUrl = process.env.KEYCLOAK_ADMIN_URL || process.env.KEYCLOAK_URL || 'http://keycloak:8080';
  private realm = process.env.KEYCLOAK_REALM || 'mymanager';
  private username = process.env.KEYCLOAK_ADMIN_USERNAME || process.env.KC_BOOTSTRAP_ADMIN_USERNAME || 'admin';
  private password = process.env.KEYCLOAK_ADMIN_PASSWORD || process.env.KC_BOOTSTRAP_ADMIN_PASSWORD || 'admin';

  private async getAdminToken(): Promise<string> {
    const body = new URLSearchParams({
      grant_type: 'password',
      client_id: 'admin-cli',
      username: this.username,
      password: this.password,
    });

    const response = await fetch(`${this.baseUrl}/realms/master/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Keycloak admin token request failed: ${response.status} ${text}`);
    }

    const json: any = await response.json();
    return String(json.access_token || '');
  }

  private async request(path: string, init?: RequestInit) {
    const token = await this.getAdminToken();
    const headers = new Headers(init?.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    if (!headers.has('Content-Type') && init?.body) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${this.baseUrl}${path}`, { ...init, headers });
    return response;
  }

  async findUsers(search?: string): Promise<KeycloakUser[]> {
    const query = new URLSearchParams();
    if (search) query.set('search', search);
    query.set('max', '50');

    const response = await this.request(`/admin/realms/${this.realm}/users?${query.toString()}`, {
      method: 'GET',
    });

    if (!response.ok) return [];
    const json: any = await response.json();
    return Array.isArray(json) ? json : [];
  }

  async getUsersByIds(ids: string[]): Promise<KeycloakUser[]> {
    const unique = Array.from(new Set(ids.filter(Boolean)));
    const users = await Promise.all(unique.map(async (id) => {
      const response = await this.request(`/admin/realms/${this.realm}/users/${encodeURIComponent(id)}`, {
        method: 'GET',
      });
      if (!response.ok) return null;
      const json: any = await response.json();
      return json;
    }));
    return users.filter(Boolean) as KeycloakUser[];
  }

  async resolveUser(identifier: string): Promise<KeycloakUser | null> {
    const trimmed = String(identifier || '').trim();
    if (!trimmed) return null;

    const byIdResponse = await this.request(`/admin/realms/${this.realm}/users/${encodeURIComponent(trimmed)}`, {
      method: 'GET',
    });
    if (byIdResponse.ok) return byIdResponse.json() as any;

    const users = await this.findUsers(trimmed);
    return users.find((u) => u.id === trimmed || u.username === trimmed || u.email === trimmed) || users[0] || null;
  }

  private async ensureRealmRole(roleName: string): Promise<any> {
    const getResponse = await this.request(`/admin/realms/${this.realm}/roles/${encodeURIComponent(roleName)}`, {
      method: 'GET',
    });
    if (getResponse.ok) return getResponse.json();

    const createResponse = await this.request(`/admin/realms/${this.realm}/roles`, {
      method: 'POST',
      body: JSON.stringify({ name: roleName }),
    });
    if (!createResponse.ok && createResponse.status !== 409) {
      const text = await createResponse.text();
      throw new Error(`Failed creating Keycloak role ${roleName}: ${createResponse.status} ${text}`);
    }

    const refetch = await this.request(`/admin/realms/${this.realm}/roles/${encodeURIComponent(roleName)}`, {
      method: 'GET',
    });
    if (!refetch.ok) throw new Error(`Unable to read Keycloak role ${roleName} after create.`);
    return refetch.json();
  }

  private async clearManagedRealmRoles(userId: string) {
    const response = await this.request(
      `/admin/realms/${this.realm}/users/${encodeURIComponent(userId)}/role-mappings/realm`,
      { method: 'GET' }
    );
    if (!response.ok) return;
    const mapped: any[] = await response.json();
    const managed = mapped.filter((role) => {
      const name = String(role?.name || '');
      return name.startsWith(MANAGED_ROLE_PREFIX) || BUSINESS_ROLES.has(name);
    });
    if (!managed.length) return;

    await this.request(
      `/admin/realms/${this.realm}/users/${encodeURIComponent(userId)}/role-mappings/realm`,
      {
        method: 'DELETE',
        body: JSON.stringify(managed.map((role) => ({ id: role.id, name: role.name }))),
      }
    );
  }

  private async assignRealmRoles(userId: string, roleNames: string[]) {
    const roles = await Promise.all(
      roleNames.map((name) => this.ensureRealmRole(name))
    );

    await this.request(
      `/admin/realms/${this.realm}/users/${encodeURIComponent(userId)}/role-mappings/realm`,
      {
        method: 'POST',
        body: JSON.stringify(
          roles.map((role: any) => ({
            id: role.id,
            name: role.name,
          }))
        ),
      }
    );
  }

  private async mergeUserAttributes(userId: string, attrs: Record<string, string>) {
    const response = await this.request(`/admin/realms/${this.realm}/users/${encodeURIComponent(userId)}`, {
      method: 'GET',
    });
    if (!response.ok) return;
    const user: any = await response.json();
    const existing = user.attributes || {};

    const merged: Record<string, string[]> = { ...existing };
    Object.entries(attrs).forEach(([key, value]) => {
      merged[key] = [String(value)];
    });

    const payload = { ...user, attributes: merged };
    await this.request(`/admin/realms/${this.realm}/users/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  async syncUserAccess(userId: string, data: {
    organizationId: string;
    orgRole: string;
    permissions: string[];
    keycloakRole?: string | null;
    integrationRoles: { odoo?: string | null; magento?: string | null };
  }) {
    const keycloakRole = data.keycloakRole || data.orgRole;
    const realmRoles = [
      BUSINESS_ROLES.has(keycloakRole) ? keycloakRole : `${MANAGED_ROLE_PREFIX}${keycloakRole}`,
    ].filter(Boolean) as string[];

    await this.clearManagedRealmRoles(userId);
    await this.assignRealmRoles(userId, realmRoles);

    await this.mergeUserAttributes(userId, {
      organization_id: data.organizationId,
      org_role: data.orgRole,
      org_permissions: JSON.stringify(data.permissions || []),
      integration_odoo_role_mapping: data.integrationRoles.odoo || '',
      integration_magento_role_mapping: data.integrationRoles.magento || '',
    });
  }

  async createUser(data: {
    email: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    temporaryPassword?: string;
  }): Promise<KeycloakUser> {
    const payload = {
      username: data.username || data.email,
      email: data.email,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      enabled: true,
      emailVerified: false,
    };

    const createResponse = await this.request(`/admin/realms/${this.realm}/users`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!createResponse.ok && createResponse.status !== 409) {
      const text = await createResponse.text();
      throw new Error(`Failed to create Keycloak user: ${createResponse.status} ${text}`);
    }

    const resolved = await this.resolveUser(data.email);
    if (!resolved?.id) throw new Error('User created but could not be resolved from Keycloak.');

    if (data.temporaryPassword) {
      await this.request(`/admin/realms/${this.realm}/users/${encodeURIComponent(resolved.id)}/reset-password`, {
        method: 'PUT',
        body: JSON.stringify({
          type: 'password',
          value: data.temporaryPassword,
          temporary: true,
        }),
      });
    }

    return resolved;
  }
}
