import { Response } from 'express';
import {
  OrganizationService,
  LocationService,
  OnboardingService,
  MembershipService,
  UserAccessService,
  CrmConfigurationService,
  GoalService,
  HabitService,
} from '../services/organization.service.js';
import { AuthenticatedRequest } from '../../../common/interfaces/authenticated-request.js';

export class OrganizationController {
  private svc = new OrganizationService();

  async get(req: AuthenticatedRequest, res: Response) {
    try {
      const org = await this.svc.getOrganization(req.identity.orgId, req.identity.userId);
      return res.json({ data: org });
    } catch (err: any) {
      if (err.message === 'Organization not found') return res.status(404).json({ message: err.message });
      return res.status(500).json({ message: err.message });
    }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const org = await this.svc.updateOrganization(req.identity.orgId, req.identity.userId, req.body || {});
      return res.json({ data: org });
    } catch (err: any) { return res.status(500).json({ message: err.message }); }
  }

  async workspace(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.getWorkspace(req.identity.orgId, req.identity.userId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async getSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const section = String(req.params.section || '').trim();
      const data = await this.svc.getSettingsSection(req.identity.orgId, req.identity.userId, section);
      return res.json({ data });
    } catch (err: any) {
      if (err.message === 'Unknown settings section') return res.status(400).json({ message: err.message });
      return res.status(500).json({ message: err.message });
    }
  }

  async updateSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const section = String(req.params.section || '').trim();
      const data = await this.svc.updateSettingsSection(req.identity.orgId, req.identity.userId, section, req.body || {});
      return res.json({ data });
    } catch (err: any) {
      if (err.message === 'Unknown settings section') return res.status(400).json({ message: err.message });
      return res.status(500).json({ message: err.message });
    }
  }
}

export class LocationController {
  private svc = new LocationService();

  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const locations = await this.svc.getLocations(req.identity.orgId, req.identity.userId);
      return res.json({ data: locations });
    } catch (err: any) { return res.status(500).json({ message: err.message }); }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.body.name) return res.status(400).json({ message: 'Name is required' });
      const location = await this.svc.createLocation(req.identity.orgId, req.identity.userId, req.body);
      return res.status(201).json({ data: location });
    } catch (err: any) { return res.status(500).json({ message: err.message }); }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const locationId = String(req.params.locationId || '').trim();
      if (!locationId) return res.status(400).json({ message: 'locationId is required' });
      const location = await this.svc.updateLocation(
        req.identity.orgId,
        req.identity.userId,
        locationId,
        req.body || {}
      );
      return res.json({ data: location });
    } catch (err: any) {
      if (err.message === 'Location not found') return res.status(404).json({ message: err.message });
      return res.status(500).json({ message: err.message });
    }
  }

  async remove(req: AuthenticatedRequest, res: Response) {
    try {
      const locationId = String(req.params.locationId || '').trim();
      if (!locationId) return res.status(400).json({ message: 'locationId is required' });
      const data = await this.svc.removeLocation(req.identity.orgId, req.identity.userId, locationId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }
}

export class OnboardingController {
  private svc = new OnboardingService();

  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.getStatuses(req.identity.userId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.createStatus(req.identity.userId, req.body);
      return res.status(201).json({ data });
    } catch (err: any) {
      if (err.message === 'tourStepId is required') return res.status(400).json({ message: err.message });
      if (err.message === 'Tour already visited') return res.status(409).json({ message: err.message });
      return res.status(500).json({ message: err.message });
    }
  }
}

export class MembershipController {
  private svc = new MembershipService();

  async resolve(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.resolveMembership(req.identity.orgId, req.identity.userId);
      if (!data) return res.status(404).json({ message: 'Membership not found' });
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.listMemberships(req.identity.orgId, req.identity.userId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async upsert(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = String(req.params.userId || req.body.userId || '').trim();
      if (!userId) return res.status(400).json({ message: 'userId is required' });

      const data = await this.svc.upsertMembership(
        req.identity.orgId,
        req.identity.userId,
        userId,
        req.body
      );

      return res.json({ data });
    } catch (err: any) {
      if (err.message === 'Invalid organization role') {
        return res.status(400).json({ message: err.message });
      }
      return res.status(500).json({ message: err.message });
    }
  }

  async remove(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = String(req.params.userId || '').trim();
      if (!userId) return res.status(400).json({ message: 'userId is required' });
      const data = await this.svc.removeMembership(req.identity.orgId, req.identity.userId, userId);
      return res.json({ data });
    } catch (err: any) {
      if (err.message === 'Cannot remove the last organization owner') {
        return res.status(400).json({ message: err.message });
      }
      return res.status(500).json({ message: err.message });
    }
  }
}

export class UserAccessController {
  private svc = new UserAccessService();

  async catalog(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.getCatalog(req.identity.orgId, req.identity.userId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const search = String(req.query.search || '').trim();
      const data = await this.svc.listUsers(req.identity.orgId, req.identity.userId, search || undefined);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async keycloakUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const search = String(req.query.search || '').trim();
      const data = await this.svc.searchKeycloakUsers(req.identity.orgId, req.identity.userId, search || undefined);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.createUser(req.identity.orgId, req.identity.userId, req.body || {});
      return res.status(201).json({ data });
    } catch (err: any) {
      if (err.message === 'email is required') {
        return res.status(400).json({ message: err.message });
      }
      return res.status(500).json({ message: err.message });
    }
  }

  async sync(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = String(req.params.userId || req.body.userId || '').trim();
      if (!userId) return res.status(400).json({ message: 'userId is required' });
      const data = await this.svc.syncKeycloak(req.identity.orgId, req.identity.userId, userId);
      return res.json({ data });
    } catch (err: any) {
      if (err.message === 'Membership not found') {
        return res.status(404).json({ message: err.message });
      }
      return res.status(500).json({ message: err.message });
    }
  }
}

export class CrmConfigurationController {
  private svc = new CrmConfigurationService();

  async listTeams(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.listTeams(req.identity.orgId, req.identity.userId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async upsertTeam(req: AuthenticatedRequest, res: Response) {
    try {
      const teamId = String(req.params.teamId || '').trim() || null;
      const data = await this.svc.upsertTeam(req.identity.orgId, req.identity.userId, teamId, req.body || {});
      return res.status(teamId ? 200 : 201).json({ data });
    } catch (err: any) {
      if (err.message === 'Team name is required') return res.status(400).json({ message: err.message });
      return res.status(500).json({ message: err.message });
    }
  }

  async deleteTeam(req: AuthenticatedRequest, res: Response) {
    try {
      const teamId = String(req.params.teamId || '').trim();
      if (!teamId) return res.status(400).json({ message: 'teamId is required' });
      const data = await this.svc.deleteTeam(req.identity.orgId, req.identity.userId, teamId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async listPipelines(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.listPipelines(req.identity.orgId, req.identity.userId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async upsertPipeline(req: AuthenticatedRequest, res: Response) {
    try {
      const pipelineId = String(req.params.pipelineId || '').trim() || null;
      const data = await this.svc.upsertPipeline(req.identity.orgId, req.identity.userId, pipelineId, req.body || {});
      return res.status(pipelineId ? 200 : 201).json({ data });
    } catch (err: any) {
      if (err.message === 'Pipeline name is required') return res.status(400).json({ message: err.message });
      return res.status(500).json({ message: err.message });
    }
  }

  async deletePipeline(req: AuthenticatedRequest, res: Response) {
    try {
      const pipelineId = String(req.params.pipelineId || '').trim();
      if (!pipelineId) return res.status(400).json({ message: 'pipelineId is required' });
      const data = await this.svc.deletePipeline(req.identity.orgId, req.identity.userId, pipelineId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async listCustomFields(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.listCustomFields(req.identity.orgId, req.identity.userId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async upsertCustomField(req: AuthenticatedRequest, res: Response) {
    try {
      const fieldId = String(req.params.fieldId || '').trim() || null;
      const data = await this.svc.upsertCustomField(req.identity.orgId, req.identity.userId, fieldId, req.body || {});
      return res.status(fieldId ? 200 : 201).json({ data });
    } catch (err: any) {
      if (err.message === 'Custom field name is required') return res.status(400).json({ message: err.message });
      return res.status(500).json({ message: err.message });
    }
  }

  async deleteCustomField(req: AuthenticatedRequest, res: Response) {
    try {
      const fieldId = String(req.params.fieldId || '').trim();
      if (!fieldId) return res.status(400).json({ message: 'fieldId is required' });
      const data = await this.svc.deleteCustomField(req.identity.orgId, req.identity.userId, fieldId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async getAutomationRules(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.getAutomationRules(req.identity.orgId, req.identity.userId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async updateAutomationRules(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.updateAutomationRules(req.identity.orgId, req.identity.userId, req.body || {});
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }
}

export class GoalController {
  private svc = new GoalService();

  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.getGoals(req.identity.orgId, req.identity.userId);
      return res.json({ data });
    } catch (err: any) { return res.status(500).json({ message: err.message }); }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.createGoal(req.identity.orgId, req.identity.userId, req.body);
      return res.status(201).json({ data });
    } catch (err: any) { return res.status(400).json({ message: err.message }); }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const goalId = String(req.params.goalId || '');
      const data = await this.svc.updateGoal(req.identity.orgId, req.identity.userId, goalId, req.body);
      return res.json({ data });
    } catch (err: any) { return res.status(500).json({ message: err.message }); }
  }

  async remove(req: AuthenticatedRequest, res: Response) {
    try {
      const goalId = String(req.params.goalId || '');
      const data = await this.svc.removeGoal(req.identity.orgId, req.identity.userId, goalId);
      return res.json({ data });
    } catch (err: any) { return res.status(500).json({ message: err.message }); }
  }

  async complete(req: AuthenticatedRequest, res: Response) {
    try {
      const goalId = String(req.params.goalId || '');
      const data = await this.svc.completeGoal(req.identity.orgId, req.identity.userId, goalId);
      return res.json({ data });
    } catch (err: any) { return res.status(500).json({ message: err.message }); }
  }

  async archive(req: AuthenticatedRequest, res: Response) {
    try {
      const goalId = String(req.params.goalId || '');
      const data = await this.svc.archiveGoal(req.identity.orgId, req.identity.userId, goalId);
      return res.json({ data });
    } catch (err: any) { return res.status(500).json({ message: err.message }); }
  }
}

export class HabitController {
  private svc = new HabitService();

  async list(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.getHabits(req.identity.orgId, req.identity.userId);
      return res.json({ data });
    } catch (err: any) { return res.status(500).json({ message: err.message }); }
  }

  async create(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.createHabit(req.identity.orgId, req.identity.userId, req.body);
      return res.status(201).json({ data });
    } catch (err: any) { return res.status(400).json({ message: err.message }); }
  }

  async update(req: AuthenticatedRequest, res: Response) {
    try {
      const habitId = String(req.params.habitId || '');
      const data = await this.svc.updateHabit(req.identity.orgId, req.identity.userId, habitId, req.body);
      return res.json({ data });
    } catch (err: any) { return res.status(500).json({ message: err.message }); }
  }

  async remove(req: AuthenticatedRequest, res: Response) {
    try {
      const habitId = String(req.params.habitId || '');
      const data = await this.svc.removeHabit(req.identity.orgId, req.identity.userId, habitId);
      return res.json({ data });
    } catch (err: any) { return res.status(500).json({ message: err.message }); }
  }

  async checkIn(req: AuthenticatedRequest, res: Response) {
    try {
      const habitId = String(req.params.habitId || '');
      const data = await this.svc.checkInHabit(
        req.identity.orgId,
        req.identity.userId,
        habitId,
        req.body?.date,
      );
      return res.json({ data });
    } catch (err: any) { return res.status(500).json({ message: err.message }); }
  }
}

export class AutomationCompatController {
  private svc = new CrmConfigurationService();

  async insertFlowBeta(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.insertFlowBeta(req.identity.orgId, req.identity.userId, req.body || {});
      return res.status(201).json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async getFlowsBeta(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.getFlowsBeta(req.identity.orgId, req.identity.userId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async addBetaChatbot(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.addBetaChatbot(req.identity.orgId, req.identity.userId, req.body || {});
      return res.status(201).json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async insertWaCallFlow(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.insertWaCallFlow(req.identity.orgId, req.identity.userId, req.body || {});
      return res.status(201).json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async createTemplateCampaign(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.createTemplateCampaign(req.identity.orgId, req.identity.userId, req.body || {});
      return res.status(201).json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async dashboard(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.getBroadcastDashboard(req.identity.orgId, req.identity.userId);
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async createWaCallBroadcast(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.createWaCallBroadcast(req.identity.orgId, req.identity.userId, req.body || {});
      return res.status(201).json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async addTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await this.svc.addTemplate(req.identity.orgId, req.identity.userId, req.body || {});
      return res.status(201).json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }

  async updateUserProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const orgSvc = new OrganizationService();
      const data = await orgSvc.updateUserProfile(req.identity.orgId, req.identity.userId, req.body || {});
      return res.json({ data });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  }
}
