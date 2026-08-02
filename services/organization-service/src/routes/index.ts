import type { Express } from "express";
import {
  OrganizationController,
  LocationController,
  OnboardingController,
  MembershipController,
  UserAccessController,
  CrmConfigurationController,
  GoalController,
  HabitController,
  AutomationCompatController,
} from "../modules/organization/controllers/organization.controller.js";
import { identityMiddleware } from "../common/middleware/identity.js";
import { attachRoleContext, requireOrgRoles } from "../common/middleware/authorization.js";

export function registerRoutes(app: Express) {
  const auth = [identityMiddleware as any, attachRoleContext as any] as any[];

  const orgCtrl = new OrganizationController();
  const locationCtrl = new LocationController();
  const onboardingCtrl = new OnboardingController();
  const membershipCtrl = new MembershipController();
  const userAccessCtrl = new UserAccessController();
  const crmConfigCtrl = new CrmConfigurationController();
  const goalCtrl = new GoalController();
  const habitCtrl = new HabitController();
  const automationCompatCtrl = new AutomationCompatController();

  const ownerOrAdmin = requireOrgRoles(["org_owner", "org_admin"]) as any;
  const ownerOnly = requireOrgRoles(["org_owner"]) as any;
  const managerUp = requireOrgRoles(["org_owner", "org_admin", "org_manager"]) as any;

  app.get("/v1/organizations", ...auth, (req, res) => orgCtrl.get(req as any, res));
  app.get("/v1/details", ...auth, (req, res) => orgCtrl.get(req as any, res));
  app.put("/v1/organizations", ...auth, ownerOrAdmin, (req, res) => orgCtrl.update(req as any, res));
  app.put("/v1/details", ...auth, ownerOrAdmin, (req, res) => orgCtrl.update(req as any, res));
  app.get("/v1/workspace", ...auth, (req, res) => orgCtrl.workspace(req as any, res));
  app.get("/v1/settings/:section", ...auth, (req, res) => orgCtrl.getSettings(req as any, res));
  app.put("/v1/settings/:section", ...auth, ownerOrAdmin, (req, res) => orgCtrl.updateSettings(req as any, res));

  app.get("/v1/locations", ...auth, (req, res) => locationCtrl.list(req as any, res));
  app.post("/v1/locations", ...auth, managerUp, (req, res) => locationCtrl.create(req as any, res));
  app.patch("/v1/locations/:locationId", ...auth, managerUp, (req, res) => locationCtrl.update(req as any, res));
  app.delete("/v1/locations/:locationId", ...auth, managerUp, (req, res) => locationCtrl.remove(req as any, res));

  app.get("/v1/memberships/resolve", ...auth, (req, res) => membershipCtrl.resolve(req as any, res));
  app.get("/v1/memberships/me", ...auth, (req, res) => membershipCtrl.resolve(req as any, res));
  app.get("/v1/memberships", ...auth, ownerOnly, (req, res) => membershipCtrl.list(req as any, res));
  app.post("/v1/memberships", ...auth, ownerOnly, (req, res) => membershipCtrl.upsert(req as any, res));
  app.patch("/v1/memberships/:userId", ...auth, ownerOnly, (req, res) => membershipCtrl.upsert(req as any, res));
  app.delete("/v1/memberships/:userId", ...auth, ownerOnly, (req, res) => membershipCtrl.remove(req as any, res));

  app.get("/v1/rbac/catalog", ...auth, ownerOnly, (req, res) => userAccessCtrl.catalog(req as any, res));
  app.get("/v1/users/access", ...auth, ownerOnly, (req, res) => userAccessCtrl.list(req as any, res));
  app.get("/v1/keycloak/users", ...auth, ownerOnly, (req, res) => userAccessCtrl.keycloakUsers(req as any, res));
  app.post("/v1/keycloak/users", ...auth, ownerOnly, (req, res) => userAccessCtrl.create(req as any, res));
  app.post("/v1/memberships/:userId/sync-keycloak", ...auth, ownerOnly, (req, res) => userAccessCtrl.sync(req as any, res));

  app.get("/v1/teams", ...auth, (req, res) => crmConfigCtrl.listTeams(req as any, res));
  app.post("/v1/teams", ...auth, managerUp, (req, res) => crmConfigCtrl.upsertTeam(req as any, res));
  app.patch("/v1/teams/:teamId", ...auth, managerUp, (req, res) => crmConfigCtrl.upsertTeam(req as any, res));
  app.delete("/v1/teams/:teamId", ...auth, managerUp, (req, res) => crmConfigCtrl.deleteTeam(req as any, res));

  app.get("/v1/crm/pipelines", ...auth, (req, res) => crmConfigCtrl.listPipelines(req as any, res));
  app.post("/v1/crm/pipelines", ...auth, managerUp, (req, res) => crmConfigCtrl.upsertPipeline(req as any, res));
  app.patch("/v1/crm/pipelines/:pipelineId", ...auth, managerUp, (req, res) => crmConfigCtrl.upsertPipeline(req as any, res));
  app.delete("/v1/crm/pipelines/:pipelineId", ...auth, managerUp, (req, res) => crmConfigCtrl.deletePipeline(req as any, res));

  app.get("/v1/crm/custom-fields", ...auth, (req, res) => crmConfigCtrl.listCustomFields(req as any, res));
  app.post("/v1/crm/custom-fields", ...auth, managerUp, (req, res) => crmConfigCtrl.upsertCustomField(req as any, res));
  app.patch("/v1/crm/custom-fields/:fieldId", ...auth, managerUp, (req, res) => crmConfigCtrl.upsertCustomField(req as any, res));
  app.delete("/v1/crm/custom-fields/:fieldId", ...auth, managerUp, (req, res) => crmConfigCtrl.deleteCustomField(req as any, res));

  app.get("/v1/crm/automation", ...auth, (req, res) => crmConfigCtrl.getAutomationRules(req as any, res));
  app.put("/v1/crm/automation", ...auth, managerUp, (req, res) => crmConfigCtrl.updateAutomationRules(req as any, res));

  app.get("/v1/onboarding/status", ...auth, (req, res) => onboardingCtrl.list(req as any, res));
  app.post("/v1/onboarding/status", ...auth, (req, res) => onboardingCtrl.create(req as any, res));

  app.get("/v1/goals", ...auth, (req, res) => goalCtrl.list(req as any, res));
  app.post("/v1/goals", ...auth, (req, res) => goalCtrl.create(req as any, res));
  app.patch("/v1/goals/:goalId", ...auth, (req, res) => goalCtrl.update(req as any, res));
  app.delete("/v1/goals/:goalId", ...auth, (req, res) => goalCtrl.remove(req as any, res));
  app.post("/v1/goals/:goalId/complete", ...auth, (req, res) => goalCtrl.complete(req as any, res));
  app.post("/v1/goals/:goalId/archive", ...auth, (req, res) => goalCtrl.archive(req as any, res));

  app.get("/v1/habits", ...auth, (req, res) => habitCtrl.list(req as any, res));
  app.post("/v1/habits", ...auth, (req, res) => habitCtrl.create(req as any, res));
  app.patch("/v1/habits/:habitId", ...auth, (req, res) => habitCtrl.update(req as any, res));
  app.delete("/v1/habits/:habitId", ...auth, (req, res) => habitCtrl.remove(req as any, res));
  app.post("/v1/habits/:habitId/check-in", ...auth, (req, res) => habitCtrl.checkIn(req as any, res));

  app.post("/v1/compat/chat_flow/insert_flow_beta", ...auth, managerUp, (req, res) =>
    automationCompatCtrl.insertFlowBeta(req as any, res)
  );
  app.get("/v1/compat/chat_flow/get_flows_beta", ...auth, (req, res) => automationCompatCtrl.getFlowsBeta(req as any, res));
  app.post("/v1/compat/chatbot/add_beta_chatbot", ...auth, managerUp, (req, res) =>
    automationCompatCtrl.addBetaChatbot(req as any, res)
  );
  app.post("/v1/compat/wa_call/insert_flow", ...auth, managerUp, (req, res) =>
    automationCompatCtrl.insertWaCallFlow(req as any, res)
  );
  app.post("/v1/compat/broadcast/create_template_campaign", ...auth, managerUp, (req, res) =>
    automationCompatCtrl.createTemplateCampaign(req as any, res)
  );
  app.get("/v1/compat/broadcast/dashboard", ...auth, (req, res) => automationCompatCtrl.dashboard(req as any, res));
  app.post("/v1/compat/wa_call/create_broadcast", ...auth, managerUp, (req, res) =>
    automationCompatCtrl.createWaCallBroadcast(req as any, res)
  );
  app.post("/v1/compat/templet/add_new", ...auth, managerUp, (req, res) =>
    automationCompatCtrl.addTemplate(req as any, res)
  );
  app.post("/v1/compat/user/update_profile", ...auth, (req, res) => automationCompatCtrl.updateUserProfile(req as any, res));

  app.get("/health", (_req, res) => res.json({ status: "ok", service: "organization-service (TS)" }));
}
