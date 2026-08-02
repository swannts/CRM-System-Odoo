import { randomUUID } from 'node:crypto';
import {
  OrganizationRepository,
  LocationRepository,
  OnboardingRepository,
  MembershipRepository,
  GoalRepository,
  HabitRepository,
} from '../repositories/organization.repository.js';
import { KeycloakAdminService } from './keycloak-admin.service.js';
import {
  VALID_ORG_ROLES,
  DEFAULT_ROLE_PERMISSIONS,
  normalizeIntegrationRoles,
  buildEffectivePermissions,
  getRbacCatalog,
  getRoleProfile,
  IntegrationRoles,
} from './rbac-catalog.js';

function asRecord(value: unknown): Record<string, any> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, any>;
  }
  return {};
}

function asArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function cleanString(value: unknown): string {
  return String(value || '').trim();
}

export class OrganizationService {
  private orgRepo = new OrganizationRepository();
  private membershipRepo = new MembershipRepository();

  private toOrganizationDto(org: any) {
    const metadata = asRecord(org?.metadata);

    return {
      ...org,
      email: metadata.email || null,
      phone: metadata.phone || null,
      address: metadata.address || null,
      website: metadata.website || null,
      timezone: metadata.timezone || null,
      branding: metadata.branding || {},
    };
  }

  async getOrganization(orgId: string, userId?: string) {
    const org = await this.orgRepo.findById(orgId);
    if (org) {
      if (userId) {
        const membershipSvc = new MembershipService();
        await membershipSvc.resolveMembership(orgId, userId);
      }
      return this.toOrganizationDto(org);
    }

    const created = await this.orgRepo.create({
      id: orgId,
      name: 'Organization',
      slug: null,
      metadata: {},
    });

    if (userId) {
      const membershipSvc = new MembershipService();
      await membershipSvc.resolveMembership(orgId, userId);
    }

    return this.toOrganizationDto(created);
  }

  async updateOrganization(orgId: string, userId: string, payload: any) {
    const org = await this.getOrganization(orgId, userId);

    const metadata = { ...asRecord(org?.metadata) };

    const name = cleanString(payload?.name) || org.name || 'Organization';
    const email = cleanString(payload?.email);
    const phone = cleanString(payload?.phone);
    const address = cleanString(payload?.address);
    const website = cleanString(payload?.website);
    const timezone = cleanString(payload?.timezone);

    const brandingRaw =
      payload?.branding && typeof payload.branding === 'object' && !Array.isArray(payload.branding)
        ? payload.branding
        : {};
    const branding = {
      ...(metadata.branding && typeof metadata.branding === 'object' ? metadata.branding : {}),
      ...brandingRaw,
    };

    const updated = await this.orgRepo.update(orgId, {
      name,
      metadata: {
        ...metadata,
        email: email || null,
        phone: phone || null,
        address: address || null,
        website: website || null,
        timezone: timezone || null,
        branding,
      },
    });

    return this.toOrganizationDto(updated);
  }

  async updateUserProfile(orgId: string, userId: string, payload: any) {
    const org = await this.getOrganization(orgId, userId);
    const metadata = { ...asRecord(org?.metadata) };
    const userProfiles = { ...asRecord(metadata.userProfiles) };
    const existing = asRecord(userProfiles[userId]);

    const next = {
      ...existing,
      fullName: payload?.fullName !== undefined ? cleanString(payload.fullName) : existing.fullName || '',
      email: payload?.email !== undefined ? cleanString(payload.email) : existing.email || '',
      phone: payload?.phone !== undefined ? cleanString(payload.phone) : existing.phone || '',
      avatar: payload?.avatar !== undefined ? cleanString(payload.avatar) : existing.avatar || '',
      timezone: payload?.timezone !== undefined ? cleanString(payload.timezone) : existing.timezone || '',
      updatedAt: new Date().toISOString(),
    };

    userProfiles[userId] = next;
    const updated = await this.orgRepo.update(orgId, {
      metadata: {
        ...metadata,
        userProfiles,
      },
    });

    return {
      organizationId: updated.id,
      userId,
      profile: next,
    };
  }

  async getWorkspace(orgId: string, userId: string) {
    const org = await this.getOrganization(orgId, userId);
    const memberships = await this.membershipRepo.findMany(orgId);
    const locationsCount = await this.orgRepo.countLocations(orgId);
    const membership = await new MembershipService().resolveMembership(orgId, userId);

    const roleCounts = memberships.reduce((acc: Record<string, number>, item: any) => {
      const role = cleanString(item?.role) || 'unknown';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    const metadata = asRecord(org?.metadata);
    const crm = asRecord(metadata.crm);

    return {
      organization: org,
      stats: {
        membersTotal: memberships.length,
        locationsTotal: locationsCount,
        roleCounts,
        teamsTotal: asArray(crm.teams).length,
        pipelinesTotal: asArray(crm.pipelines).length,
        customFieldsTotal: asArray(crm.customFields).length,
      },
      capabilities: {
        canManageOrganization: ['org_owner', 'org_admin'].includes(cleanString(membership?.role)),
        hasAutomationRules: asArray(crm.automationRules).length > 0,
      },
    };
  }

  async getSettingsSection(orgId: string, userId: string, section: string) {
    const org = await this.getOrganization(orgId, userId);
    const metadata = asRecord(org?.metadata);
    const crm = asRecord(metadata.crm);

    switch (section) {
      case 'profile':
        return {
          name: org.name || '',
          email: metadata.email || '',
          phone: metadata.phone || '',
          website: metadata.website || '',
          timezone: metadata.timezone || '',
          address: metadata.address || '',
        };
      case 'branding':
        return {
          branding: asRecord(metadata.branding),
        };
      case 'crm':
        return {
          teams: asArray(crm.teams),
          pipelines: asArray(crm.pipelines),
          customFields: asArray(crm.customFields),
          automationRules: asArray(crm.automationRules),
        };
      case 'security':
        return {
          security: asRecord(metadata.security),
        };
      default:
        throw new Error('Unknown settings section');
    }
  }

  async updateSettingsSection(orgId: string, userId: string, section: string, payload: any) {
    const org = await this.getOrganization(orgId, userId);
    const metadata = { ...asRecord(org?.metadata) };

    if (section === 'profile') {
      return this.updateOrganization(orgId, userId, payload);
    }

    if (section === 'branding') {
      metadata.branding = {
        ...asRecord(metadata.branding),
        ...asRecord(payload?.branding),
      };
    } else if (section === 'security') {
      metadata.security = {
        ...asRecord(metadata.security),
        ...asRecord(payload?.security),
      };
    } else if (section === 'crm') {
      const incoming = asRecord(payload);
      const existingCrm = asRecord(metadata.crm);
      metadata.crm = {
        ...existingCrm,
        ...(incoming.teams ? { teams: asArray(incoming.teams) } : {}),
        ...(incoming.pipelines ? { pipelines: asArray(incoming.pipelines) } : {}),
        ...(incoming.customFields ? { customFields: asArray(incoming.customFields) } : {}),
        ...(incoming.automationRules ? { automationRules: asArray(incoming.automationRules) } : {}),
      };
    } else {
      throw new Error('Unknown settings section');
    }

    const updated = await this.orgRepo.update(orgId, { metadata });
    return this.toOrganizationDto(updated);
  }
}

export class LocationService {
  private locationRepo = new LocationRepository();
  private orgSvc = new OrganizationService();

  async getLocations(orgId: string, userId: string) {
    await this.orgSvc.getOrganization(orgId, userId);
    return this.locationRepo.findMany(orgId);
  }

  async createLocation(orgId: string, userId: string, data: any) {
    await this.orgSvc.getOrganization(orgId, userId);
    return this.locationRepo.create({
      organizationId: orgId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      street: data.street,
      city: data.city,
      state: data.state,
      zipCode: data.zip_code,
      country: data.country,
    });
  }

  async updateLocation(orgId: string, userId: string, locationId: string, data: any) {
    await this.orgSvc.getOrganization(orgId, userId);
    const existing = await this.locationRepo.findById(orgId, locationId);
    if (!existing) {
      throw new Error('Location not found');
    }

    return this.locationRepo.update(locationId, {
      name: data.name ?? existing.name,
      email: data.email ?? existing.email,
      phone: data.phone ?? existing.phone,
      street: data.street ?? existing.street,
      city: data.city ?? existing.city,
      state: data.state ?? existing.state,
      zipCode: data.zip_code ?? existing.zipCode,
      country: data.country ?? existing.country,
    });
  }

  async removeLocation(orgId: string, userId: string, locationId: string) {
    await this.orgSvc.getOrganization(orgId, userId);
    const existing = await this.locationRepo.findById(orgId, locationId);
    if (!existing) {
      return { deleted: false };
    }

    await this.locationRepo.delete(locationId);
    return { deleted: true };
  }
}

export class CrmConfigurationService {
  private orgRepo = new OrganizationRepository();
  private orgSvc = new OrganizationService();

  private getCrmMetadata(org: any) {
    const metadata = asRecord(org?.metadata);
    const crm = asRecord(metadata.crm);
    return {
      metadata,
      crm: {
        teams: asArray<any>(crm.teams),
        pipelines: asArray<any>(crm.pipelines),
        customFields: asArray<any>(crm.customFields),
        automationRules: asArray<any>(crm.automationRules),
      },
    };
  }

  private async persistCrm(orgId: string, metadata: Record<string, any>, crmPatch: Record<string, any>) {
    const crm = { ...asRecord(metadata.crm), ...crmPatch };
    return this.orgRepo.update(orgId, {
      metadata: {
        ...metadata,
        crm,
      },
    });
  }

  async listTeams(orgId: string, userId: string) {
    const org = await this.orgSvc.getOrganization(orgId, userId);
    const { crm } = this.getCrmMetadata(org);
    return crm.teams;
  }

  async upsertTeam(orgId: string, userId: string, teamId: string | null, payload: any) {
    const org = await this.orgSvc.getOrganization(orgId, userId);
    const { metadata, crm } = this.getCrmMetadata(org);
    const existing = crm.teams;

    const name = cleanString(payload?.name);
    if (!name) throw new Error('Team name is required');

    const managerUserId = cleanString(payload?.managerUserId) || null;
    const members = asArray<string>(payload?.members)
      .map((item) => cleanString(item))
      .filter(Boolean);

    const id = teamId || randomUUID();
    const now = new Date().toISOString();
    const next = existing.some((item) => item.id === id)
      ? existing.map((item) =>
          item.id === id
            ? {
                ...item,
                name,
                description: cleanString(payload?.description),
                managerUserId,
                members,
                updatedAt: now,
              }
            : item
        )
      : [
          ...existing,
          {
            id,
            name,
            description: cleanString(payload?.description),
            managerUserId,
            members,
            createdAt: now,
            updatedAt: now,
          },
        ];

    await this.persistCrm(orgId, metadata, { teams: next });
    return next.find((item) => item.id === id) || null;
  }

  async deleteTeam(orgId: string, userId: string, teamId: string) {
    const org = await this.orgSvc.getOrganization(orgId, userId);
    const { metadata, crm } = this.getCrmMetadata(org);
    const next = crm.teams.filter((item) => item.id !== teamId);
    const deleted = next.length !== crm.teams.length;
    if (deleted) {
      await this.persistCrm(orgId, metadata, { teams: next });
    }
    return { deleted };
  }

  async listPipelines(orgId: string, userId: string) {
    const org = await this.orgSvc.getOrganization(orgId, userId);
    const { crm } = this.getCrmMetadata(org);
    return crm.pipelines;
  }

  async upsertPipeline(orgId: string, userId: string, pipelineId: string | null, payload: any) {
    const org = await this.orgSvc.getOrganization(orgId, userId);
    const { metadata, crm } = this.getCrmMetadata(org);
    const existing = crm.pipelines;

    const name = cleanString(payload?.name);
    if (!name) throw new Error('Pipeline name is required');

    const stages = asArray<any>(payload?.stages)
      .map((stage) => ({
        id: cleanString(stage?.id) || randomUUID(),
        name: cleanString(stage?.name),
        probability: Number(stage?.probability || 0),
        color: cleanString(stage?.color) || '#3366FF',
      }))
      .filter((stage) => stage.name);

    const id = pipelineId || randomUUID();
    const now = new Date().toISOString();
    const next = existing.some((item) => item.id === id)
      ? existing.map((item) =>
          item.id === id
            ? {
                ...item,
                name,
                description: cleanString(payload?.description),
                stages,
                updatedAt: now,
              }
            : item
        )
      : [
          ...existing,
          {
            id,
            name,
            description: cleanString(payload?.description),
            stages,
            createdAt: now,
            updatedAt: now,
          },
        ];

    await this.persistCrm(orgId, metadata, { pipelines: next });
    return next.find((item) => item.id === id) || null;
  }

  async deletePipeline(orgId: string, userId: string, pipelineId: string) {
    const org = await this.orgSvc.getOrganization(orgId, userId);
    const { metadata, crm } = this.getCrmMetadata(org);
    const next = crm.pipelines.filter((item) => item.id !== pipelineId);
    const deleted = next.length !== crm.pipelines.length;
    if (deleted) {
      await this.persistCrm(orgId, metadata, { pipelines: next });
    }
    return { deleted };
  }

  async listCustomFields(orgId: string, userId: string) {
    const org = await this.orgSvc.getOrganization(orgId, userId);
    const { crm } = this.getCrmMetadata(org);
    return crm.customFields;
  }

  async upsertCustomField(orgId: string, userId: string, fieldId: string | null, payload: any) {
    const org = await this.orgSvc.getOrganization(orgId, userId);
    const { metadata, crm } = this.getCrmMetadata(org);
    const existing = crm.customFields;

    const name = cleanString(payload?.name);
    const entity = cleanString(payload?.entity) || 'contact';
    const type = cleanString(payload?.type) || 'text';
    if (!name) throw new Error('Custom field name is required');

    const options = asArray<any>(payload?.options)
      .map((option) => cleanString(option))
      .filter(Boolean);

    const id = fieldId || randomUUID();
    const now = new Date().toISOString();
    const next = existing.some((item) => item.id === id)
      ? existing.map((item) =>
          item.id === id
            ? {
                ...item,
                name,
                entity,
                type,
                required: Boolean(payload?.required),
                options,
                updatedAt: now,
              }
            : item
        )
      : [
          ...existing,
          {
            id,
            name,
            entity,
            type,
            required: Boolean(payload?.required),
            options,
            createdAt: now,
            updatedAt: now,
          },
        ];

    await this.persistCrm(orgId, metadata, { customFields: next });
    return next.find((item) => item.id === id) || null;
  }

  async deleteCustomField(orgId: string, userId: string, fieldId: string) {
    const org = await this.orgSvc.getOrganization(orgId, userId);
    const { metadata, crm } = this.getCrmMetadata(org);
    const next = crm.customFields.filter((item) => item.id !== fieldId);
    const deleted = next.length !== crm.customFields.length;
    if (deleted) {
      await this.persistCrm(orgId, metadata, { customFields: next });
    }
    return { deleted };
  }

  async getAutomationRules(orgId: string, userId: string) {
    const org = await this.orgSvc.getOrganization(orgId, userId);
    const { crm } = this.getCrmMetadata(org);
    return crm.automationRules;
  }

  async updateAutomationRules(orgId: string, userId: string, payload: any) {
    const org = await this.orgSvc.getOrganization(orgId, userId);
    const { metadata } = this.getCrmMetadata(org);
    const rules = asArray<any>(payload?.rules).map((rule) => ({
      id: cleanString(rule?.id) || randomUUID(),
      name: cleanString(rule?.name),
      trigger: cleanString(rule?.trigger),
      action: cleanString(rule?.action),
      enabled: Boolean(rule?.enabled),
    }));

    await this.persistCrm(orgId, metadata, { automationRules: rules });
    return rules;
  }

  private getAutomationCompat(org: any) {
    const metadata = asRecord(org?.metadata);
    const crm = asRecord(metadata.crm);
    return {
      metadata,
      crm,
      chatFlows: asArray<any>(crm.chatFlows),
      betaChatbots: asArray<any>(crm.betaChatbots),
      waCallFlows: asArray<any>(crm.waCallFlows),
      waCallBroadcasts: asArray<any>(crm.waCallBroadcasts),
      templateCampaigns: asArray<any>(crm.templateCampaigns),
      templates: asArray<any>(crm.templates),
    };
  }

  async insertFlowBeta(orgId: string, userId: string, payload: any) {
    const org = await this.orgSvc.getOrganization(orgId, userId);
    const { metadata, chatFlows } = this.getAutomationCompat(org);
    const now = new Date().toISOString();
    const flow = {
      id: randomUUID(),
      name: cleanString(payload?.name) || 'Untitled flow',
      trigger: cleanString(payload?.trigger),
      nodes: asArray(payload?.nodes),
      edges: asArray(payload?.edges),
      enabled: Boolean(payload?.enabled),
      createdAt: now,
      updatedAt: now,
    };
    const next = [flow, ...chatFlows];
    await this.persistCrm(orgId, metadata, { chatFlows: next });
    return flow;
  }

  async getFlowsBeta(orgId: string, userId: string) {
    const org = await this.orgSvc.getOrganization(orgId, userId);
    const { chatFlows } = this.getAutomationCompat(org);
    return chatFlows;
  }

  async addBetaChatbot(orgId: string, userId: string, payload: any) {
    const org = await this.orgSvc.getOrganization(orgId, userId);
    const { metadata, betaChatbots } = this.getAutomationCompat(org);
    const now = new Date().toISOString();
    const chatbot = {
      id: randomUUID(),
      name: cleanString(payload?.name) || 'Chatbot',
      flowId: cleanString(payload?.flowId || payload?.betaFlowId) || null,
      channel: cleanString(payload?.channel) || 'whatsapp',
      isActive: payload?.isActive !== false,
      config: asRecord(payload?.config),
      createdAt: now,
      updatedAt: now,
    };
    const next = [chatbot, ...betaChatbots];
    await this.persistCrm(orgId, metadata, { betaChatbots: next });
    return chatbot;
  }

  async insertWaCallFlow(orgId: string, userId: string, payload: any) {
    const org = await this.orgSvc.getOrganization(orgId, userId);
    const { metadata, waCallFlows } = this.getAutomationCompat(org);
    const now = new Date().toISOString();
    const flow = {
      id: randomUUID(),
      name: cleanString(payload?.name) || 'WA Call Flow',
      script: cleanString(payload?.script),
      steps: asArray(payload?.steps),
      enabled: payload?.enabled !== false,
      createdAt: now,
      updatedAt: now,
    };
    const next = [flow, ...waCallFlows];
    await this.persistCrm(orgId, metadata, { waCallFlows: next });
    return flow;
  }

  async createTemplateCampaign(orgId: string, userId: string, payload: any) {
    const org = await this.orgSvc.getOrganization(orgId, userId);
    const { metadata, templateCampaigns } = this.getAutomationCompat(org);
    const now = new Date().toISOString();
    const campaign = {
      id: randomUUID(),
      name: cleanString(payload?.name) || 'Template Campaign',
      templateId: cleanString(payload?.templateId) || null,
      audience: asRecord(payload?.audience),
      status: cleanString(payload?.status) || 'draft',
      sentCount: Number(payload?.sentCount || 0),
      deliveredCount: Number(payload?.deliveredCount || 0),
      readCount: Number(payload?.readCount || 0),
      failedCount: Number(payload?.failedCount || 0),
      createdAt: now,
      updatedAt: now,
    };
    const next = [campaign, ...templateCampaigns];
    await this.persistCrm(orgId, metadata, { templateCampaigns: next });
    return campaign;
  }

  async getBroadcastDashboard(orgId: string, userId: string) {
    const org = await this.orgSvc.getOrganization(orgId, userId);
    const { templateCampaigns } = this.getAutomationCompat(org);
    const total = templateCampaigns.length;
    const sent = templateCampaigns.reduce((s, c) => s + Number(c.sentCount || 0), 0);
    const delivered = templateCampaigns.reduce((s, c) => s + Number(c.deliveredCount || 0), 0);
    const read = templateCampaigns.reduce((s, c) => s + Number(c.readCount || 0), 0);
    const failed = templateCampaigns.reduce((s, c) => s + Number(c.failedCount || 0), 0);
    return { totalCampaigns: total, sent, delivered, read, failed, campaigns: templateCampaigns };
  }

  async createWaCallBroadcast(orgId: string, userId: string, payload: any) {
    const org = await this.orgSvc.getOrganization(orgId, userId);
    const { metadata, waCallBroadcasts } = this.getAutomationCompat(org);
    const now = new Date().toISOString();
    const broadcast = {
      id: randomUUID(),
      name: cleanString(payload?.name) || 'WA Call Broadcast',
      flowId: cleanString(payload?.flowId) || null,
      audience: asRecord(payload?.audience),
      status: cleanString(payload?.status) || 'scheduled',
      scheduledAt: payload?.scheduledAt || null,
      createdAt: now,
      updatedAt: now,
    };
    const next = [broadcast, ...waCallBroadcasts];
    await this.persistCrm(orgId, metadata, { waCallBroadcasts: next });
    return broadcast;
  }

  async addTemplate(orgId: string, userId: string, payload: any) {
    const org = await this.orgSvc.getOrganization(orgId, userId);
    const { metadata, templates } = this.getAutomationCompat(org);
    const now = new Date().toISOString();
    const template = {
      id: randomUUID(),
      name: cleanString(payload?.name) || 'Template',
      language: cleanString(payload?.language) || 'en',
      category: cleanString(payload?.category) || 'marketing',
      body: cleanString(payload?.body),
      variables: asArray(payload?.variables),
      createdAt: now,
      updatedAt: now,
    };
    const next = [template, ...templates];
    await this.persistCrm(orgId, metadata, { templates: next });
    return template;
  }
}

export class OnboardingService {
  private onboardingRepo = new OnboardingRepository();

  async getStatuses(userId: string) {
    return this.onboardingRepo.findManyByUser(userId);
  }

  async createStatus(userId: string, data: any) {
    if (!data.tourStepId) {
      throw new Error('tourStepId is required');
    }

    const existing = await this.onboardingRepo.findUnique(userId, String(data.tourStepId));
    if (existing) {
      throw new Error('Tour already visited');
    }

    return this.onboardingRepo.create({
      userId,
      tourStepId: String(data.tourStepId),
      tourCompleted: Boolean(data.tourCompleted),
    });
  }
}

export class MembershipService {
  private membershipRepo = new MembershipRepository();
  private orgRepo = new OrganizationRepository();
  private keycloakAdmin = new KeycloakAdminService();

  async resolveMembership(orgId: string, userId: string) {
    const org = await this.orgRepo.findById(orgId);
    if (!org) {
      await this.orgRepo.create({
        id: orgId,
        name: 'Organization',
        slug: null,
        metadata: {},
      });
    }

    const existing = await this.membershipRepo.findByUser(orgId, userId);
    if (existing) {
      return existing;
    }

    const membershipCount = await this.orgRepo.countMemberships(orgId);
    if (membershipCount === 0) {
      return this.membershipRepo.create({
        organizationId: orgId,
        userId,
        role: 'org_owner',
        permissions: DEFAULT_ROLE_PERMISSIONS.org_owner,
        metadata: { bootstrapped: true },
      });
    }
    return this.membershipRepo.create({
      organizationId: orgId,
      userId,
      role: 'org_staff',
      permissions: DEFAULT_ROLE_PERMISSIONS.org_staff,
      metadata: { autoProvisioned: true },
    });
  }

  getCatalog() {
    return getRbacCatalog();
  }

  async listMemberships(orgId: string, requesterUserId: string) {
    await this.resolveMembership(orgId, requesterUserId);
    return this.membershipRepo.findMany(orgId);
  }

  async listAccessUsers(orgId: string, requesterUserId: string, search?: string) {
    await this.resolveMembership(orgId, requesterUserId);
    const memberships = await this.membershipRepo.findMany(orgId);

    let keycloakUsersById: Record<string, any> = {};
    try {
      const users = search
        ? await this.keycloakAdmin.findUsers(search)
        : await this.keycloakAdmin.getUsersByIds(memberships.map((m: any) => m.userId));
      keycloakUsersById = users.reduce((acc: Record<string, any>, user: any) => {
        if (user?.id) acc[user.id] = user;
        return acc;
      }, {});
    } catch (error) {
      // Keep endpoint functional even when Keycloak admin API is unavailable.
    }

    return memberships
      .map((membership: any) => {
        const integrationRoles: IntegrationRoles = normalizeIntegrationRoles(
          membership?.metadata?.integrationRoles,
          membership.role
        );
        const profile = keycloakUsersById[membership.userId] || null;
        return {
          ...membership,
          integrationRoles,
          roleProfile: getRoleProfile(membership.role),
          profile: profile
            ? {
                id: profile.id,
                username: profile.username,
                email: profile.email,
                firstName: profile.firstName,
                lastName: profile.lastName,
                enabled: profile.enabled,
              }
            : null,
        };
      })
      .filter((item: any) => {
        if (!search) return true;
        const q = String(search).toLowerCase();
        const name = `${item?.profile?.firstName || ''} ${item?.profile?.lastName || ''}`.trim().toLowerCase();
        return (
          String(item?.userId || '').toLowerCase().includes(q) ||
          String(item?.profile?.email || '').toLowerCase().includes(q) ||
          String(item?.profile?.username || '').toLowerCase().includes(q) ||
          name.includes(q)
        );
      });
  }

  async findKeycloakUsers(orgId: string, requesterUserId: string, search?: string) {
    await this.resolveMembership(orgId, requesterUserId);
    return this.keycloakAdmin.findUsers(search);
  }

  async createUserAndAssign(orgId: string, requesterUserId: string, data: any) {
    await this.resolveMembership(orgId, requesterUserId);

    if (!data?.email) {
      throw new Error('email is required');
    }

    const created = await this.keycloakAdmin.createUser({
      email: String(data.email).trim(),
      username: data.username ? String(data.username).trim() : undefined,
      firstName: data.firstName ? String(data.firstName).trim() : undefined,
      lastName: data.lastName ? String(data.lastName).trim() : undefined,
      temporaryPassword: data.temporaryPassword ? String(data.temporaryPassword) : undefined,
    });

    const assigned = await this.upsertMembership(orgId, requesterUserId, created.id, {
      role: data.role || 'org_staff',
      permissions: data.permissions,
      metadata: {
        ...(data.metadata || {}),
        integrationRoles: data?.metadata?.integrationRoles,
      },
      syncKeycloak: true,
    });

    return { user: created, membership: assigned };
  }

  async syncMembershipToKeycloak(orgId: string, requesterUserId: string, userId: string) {
    await this.resolveMembership(orgId, requesterUserId);
    const membership = await this.membershipRepo.findByUser(orgId, userId);
    if (!membership) {
      throw new Error('Membership not found');
    }

    const membershipMetadata =
      membership?.metadata && typeof membership.metadata === 'object' && !Array.isArray(membership.metadata)
        ? (membership.metadata as Record<string, any>)
        : {};
    const membershipPermissions = Array.isArray(membership.permissions)
      ? membership.permissions.filter((item: unknown): item is string => typeof item === 'string')
      : undefined;

    const integrationRoles = normalizeIntegrationRoles(membershipMetadata.integrationRoles, membership.role);
    const permissions = buildEffectivePermissions(
      membership.role,
      integrationRoles,
      membershipPermissions
    );

    await this.keycloakAdmin.syncUserAccess(userId, {
      organizationId: orgId,
      orgRole: membership.role,
      permissions,
      keycloakRole: getRoleProfile(membership.role)?.keycloakRole || membership.role,
      integrationRoles,
    });

    return { userId, synced: true };
  }

  async upsertMembership(orgId: string, requesterUserId: string, userId: string, data: any) {
    await this.resolveMembership(orgId, requesterUserId);

    const role = String(data.role || '').trim();
    if (!VALID_ORG_ROLES.includes(role as any)) {
      throw new Error('Invalid organization role');
    }

    const integrationRoles = normalizeIntegrationRoles(data?.metadata?.integrationRoles, role);
    const roleProfile = getRoleProfile(role);
    const permissions = buildEffectivePermissions(
      role,
      integrationRoles,
      Array.isArray(data.permissions) && data.permissions.length > 0 ? data.permissions : undefined
    );

    const membership = await this.membershipRepo.upsert(orgId, userId, {
      role,
      permissions,
      metadata: {
        ...(data.metadata ?? {}),
        integrationRoles,
      },
    });

    const syncKeycloak = data?.syncKeycloak !== false;
    if (syncKeycloak) {
      try {
        await this.keycloakAdmin.syncUserAccess(userId, {
          organizationId: orgId,
          orgRole: role,
          permissions,
          keycloakRole: roleProfile?.keycloakRole || role,
          integrationRoles,
        });
      } catch (error) {
        // Keep membership saved even if Keycloak sync fails.
      }
    }

    return membership;
  }

  async removeMembership(orgId: string, requesterUserId: string, userId: string) {
    await this.resolveMembership(orgId, requesterUserId);
    const membership = await this.membershipRepo.findByUser(orgId, userId);
    if (!membership) return { deleted: false };

    if (membership.role === 'org_owner') {
      const memberships = await this.membershipRepo.findMany(orgId);
      const ownerCount = memberships.filter((item: any) => item.role === 'org_owner').length;
      if (ownerCount <= 1) {
        throw new Error('Cannot remove the last organization owner');
      }
    }

    await this.membershipRepo.delete(orgId, userId);
    return { deleted: true };
  }
}

export class UserAccessService {
  private membershipSvc = new MembershipService();

  async getCatalog(orgId: string, requesterUserId: string) {
    await this.membershipSvc.resolveMembership(orgId, requesterUserId);
    return this.membershipSvc.getCatalog();
  }

  async listUsers(orgId: string, requesterUserId: string, search?: string) {
    return this.membershipSvc.listAccessUsers(orgId, requesterUserId, search);
  }

  async searchKeycloakUsers(orgId: string, requesterUserId: string, search?: string) {
    return this.membershipSvc.findKeycloakUsers(orgId, requesterUserId, search);
  }

  async createUser(orgId: string, requesterUserId: string, data: any) {
    return this.membershipSvc.createUserAndAssign(orgId, requesterUserId, data);
  }

  async syncKeycloak(orgId: string, requesterUserId: string, userId: string) {
    return this.membershipSvc.syncMembershipToKeycloak(orgId, requesterUserId, userId);
  }

  async removeUserMembership(orgId: string, requesterUserId: string, userId: string) {
    return this.membershipSvc.removeMembership(orgId, requesterUserId, userId);
  }
}

export class GoalService {
  private goalRepo = new GoalRepository();
  private orgSvc = new OrganizationService();

  async getGoals(orgId: string, userId: string) {
    await this.orgSvc.getOrganization(orgId, userId);
    return this.goalRepo.findMany(orgId, userId);
  }

  async createGoal(orgId: string, userId: string, data: any) {
    await this.orgSvc.getOrganization(orgId, userId);
    if (!data.title) throw new Error('Title is required');
    
    return this.goalRepo.create({
      organizationId: orgId,
      userId,
      title: data.title,
      category: data.category || 'General',
      progress: data.progress || 0,
      metadata: data.metadata || {},
    });
  }

  async updateGoal(orgId: string, userId: string, goalId: string, data: any) {
    await this.orgSvc.getOrganization(orgId, userId);
    const existing = await this.goalRepo.findById(orgId, userId, goalId);
    if (!existing) throw new Error('Goal not found');

    return this.goalRepo.update(goalId, {
      title: data.title ?? existing.title,
      category: data.category ?? existing.category,
      progress: data.progress ?? existing.progress,
      metadata: data.metadata ?? existing.metadata,
    });
  }

  async removeGoal(orgId: string, userId: string, goalId: string) {
    await this.orgSvc.getOrganization(orgId, userId);
    const existing = await this.goalRepo.findById(orgId, userId, goalId);
    if (!existing) return { deleted: false };

    await this.goalRepo.delete(goalId);
    return { deleted: true };
  }

  async completeGoal(orgId: string, userId: string, goalId: string) {
    await this.orgSvc.getOrganization(orgId, userId);
    const existing = await this.goalRepo.findById(orgId, userId, goalId);
    if (!existing) throw new Error('Goal not found');

    return this.goalRepo.update(goalId, {
      progress: 100,
      metadata: {
        ...(existing.metadata as any),
        completedAt: new Date().toISOString(),
        status: 'completed',
      },
    });
  }

  async archiveGoal(orgId: string, userId: string, goalId: string) {
    await this.orgSvc.getOrganization(orgId, userId);
    const existing = await this.goalRepo.findById(orgId, userId, goalId);
    if (!existing) throw new Error('Goal not found');

    return this.goalRepo.update(goalId, {
      metadata: {
        ...(existing.metadata as any),
        archived: true,
        archivedAt: new Date().toISOString(),
        status: 'archived',
      },
    });
  }
}

export class HabitService {
  private habitRepo = new HabitRepository();
  private orgSvc = new OrganizationService();

  async getHabits(orgId: string, userId: string) {
    await this.orgSvc.getOrganization(orgId, userId);
    return this.habitRepo.findMany(orgId, userId);
  }

  async createHabit(orgId: string, userId: string, data: any) {
    await this.orgSvc.getOrganization(orgId, userId);
    if (!data.title) throw new Error('Title is required');
    
    return this.habitRepo.create({
      organizationId: orgId,
      userId,
      title: data.title,
      momentum: data.momentum || [],
      metadata: data.metadata || {},
    });
  }

  async updateHabit(orgId: string, userId: string, habitId: string, data: any) {
    await this.orgSvc.getOrganization(orgId, userId);
    const existing = await this.habitRepo.findById(orgId, userId, habitId);
    if (!existing) throw new Error('Habit not found');

    return this.habitRepo.update(habitId, {
      title: data.title ?? existing.title,
      momentum: data.momentum ?? existing.momentum,
      metadata: data.metadata ?? existing.metadata,
    });
  }

  async removeHabit(orgId: string, userId: string, habitId: string) {
    await this.orgSvc.getOrganization(orgId, userId);
    const existing = await this.habitRepo.findById(orgId, userId, habitId);
    if (!existing) return { deleted: false };

    await this.habitRepo.delete(habitId);
    return { deleted: true };
  }

  async checkInHabit(orgId: string, userId: string, habitId: string, checkInDate?: string) {
    await this.orgSvc.getOrganization(orgId, userId);
    const existing = await this.habitRepo.findById(orgId, userId, habitId);
    if (!existing) throw new Error('Habit not found');

    const date = (checkInDate || new Date().toISOString().slice(0, 10)).slice(0, 10);
    const prev = Array.isArray(existing.momentum) ? existing.momentum : [];
    const nextMomentum = Array.from(new Set([...prev.map((d: any) => String(d)), date])).sort();

    return this.habitRepo.update(habitId, {
      momentum: nextMomentum,
      metadata: {
        ...(existing.metadata as any),
        lastCheckInAt: new Date().toISOString(),
      },
    });
  }
}
