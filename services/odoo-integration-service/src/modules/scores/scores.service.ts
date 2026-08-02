import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service.js';
import { OdooClientService } from '../odoo-base/odoo-client.service.js';

type EvaluatedMetric = {
  score: number;
  matched: boolean;
  reason: string;
};

@Injectable()
export class ScoresService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScoresService.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly odooClient: OdooClientService,
  ) {}

  onModuleInit() {
    const everyMinutes = Number(process.env.SCORING_JOB_MINUTES || 10);
    const intervalMs = Math.max(5, everyMinutes) * 60 * 1000;
    this.timer = setInterval(() => {
      this.recalculateKnownOrgScores().catch((error) => {
        this.logger.warn(`Scoring job failed: ${error?.message || 'unknown error'}`);
      });
    }, intervalMs);
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async getRules(orgId: string) {
    return this.prisma.scoringRule.findMany({ where: { orgId }, orderBy: [{ active: 'desc' }, { updatedAt: 'desc' }] });
  }

  async createRule(orgId: string, body: any) {
    const created = await this.prisma.scoringRule.create({
      data: {
        orgId,
        scope: body?.scope || 'both',
        category: body?.category || 'demographic',
        name: body?.name || 'Custom rule',
        weight: Number.isFinite(Number(body?.weight)) ? Number(body.weight) : 10,
        condition: body?.condition || null,
        active: body?.active !== false,
      },
    });
    await this.recalculateOrgScores(orgId);
    return created;
  }

  async updateRule(orgId: string, id: string, body: any) {
    const updated = await this.prisma.scoringRule.updateMany({
      where: { id, orgId },
      data: {
        scope: body?.scope,
        category: body?.category,
        name: body?.name,
        weight: Number.isFinite(Number(body?.weight)) ? Number(body.weight) : undefined,
        condition: body?.condition,
        active: typeof body?.active === 'boolean' ? body.active : undefined,
      },
    });
    await this.recalculateOrgScores(orgId);
    return { id, updated: updated.count > 0 };
  }

  async getContactScore(orgId: string, contactOdooId: number) {
    const score = await this.calculateAndUpsertContactScore(orgId, contactOdooId);
    return score;
  }

  async getHotLeads(orgId: string, limit = 20, threshold = 60) {
    let rows = await this.prisma.leadScore.findMany({
      where: { orgId, score: { gte: threshold } },
      orderBy: { score: 'desc' },
      take: Math.max(1, Math.min(100, limit)),
    });
    if (!rows.length) {
      await this.recalculateOrgScores(orgId);
      rows = await this.prisma.leadScore.findMany({
        where: { orgId, score: { gte: threshold } },
        orderBy: { score: 'desc' },
        take: Math.max(1, Math.min(100, limit)),
      });
    }

    const ids = rows.map((r) => r.leadOdooId);
    if (!ids.length) return [];

    const leads = await this.odooClient.searchRead(
      'crm.lead',
      [['id', 'in', ids]],
      ['id', 'name', 'email_from', 'phone', 'stage_id', 'type', 'expected_revenue', 'priority'],
    );

    const scoreById = new Map(rows.map((row) => [row.leadOdooId, row]));
    return leads.map((lead: any) => ({
      id: String(lead.id),
      leadOdooId: lead.id,
      name: lead.name,
      email: lead.email_from,
      phone: lead.phone,
      stage: Array.isArray(lead.stage_id) ? lead.stage_id[1] : 'Unknown',
      type: lead.type,
      priority: lead.priority,
      expectedRevenue: Number(lead.expected_revenue || 0),
      score: scoreById.get(lead.id)?.score || 0,
      breakdown: scoreById.get(lead.id)?.breakdown || {},
      lastCalculatedAt: scoreById.get(lead.id)?.lastCalculatedAt,
    })).sort((a, b) => b.score - a.score);
  }

  async recalculateKnownOrgScores() {
    const [ruleOrgs, contactScoreOrgs, leadScoreOrgs] = await Promise.all([
      this.prisma.scoringRule.findMany({ distinct: ['orgId'], select: { orgId: true } }),
      this.prisma.contactScore.findMany({ distinct: ['orgId'], select: { orgId: true } }),
      this.prisma.leadScore.findMany({ distinct: ['orgId'], select: { orgId: true } }),
    ]);

    const orgs = new Set<string>([
      ...ruleOrgs.map((item) => item.orgId),
      ...contactScoreOrgs.map((item) => item.orgId),
      ...leadScoreOrgs.map((item) => item.orgId),
    ]);

    for (const orgId of orgs) {
      await this.recalculateOrgScores(orgId);
    }
  }

  private async recalculateOrgScores(orgId: string) {
    const [contacts, leads] = await Promise.all([
      this.odooClient.searchRead('res.partner', [['active', '=', true], ['is_company', '=', false]], ['id'], { limit: 200 }),
      this.odooClient.searchRead('crm.lead', [['type', 'in', ['lead', 'opportunity']], ['active', '=', true]], ['id'], { limit: 200 }),
    ]);

    await Promise.all([
      ...contacts.map((contact: any) => this.calculateAndUpsertContactScore(orgId, contact.id)),
      ...leads.map((lead: any) => this.calculateAndUpsertLeadScore(orgId, lead.id)),
    ]);
  }

  private async loadRules(orgId: string) {
    const rules = await this.prisma.scoringRule.findMany({ where: { orgId, active: true } });
    if (rules.length) return rules;

    return [
      { id: 'default-demographic', orgId, scope: 'contact', category: 'demographic', name: 'Has complete profile', weight: 10, condition: { field: 'hasProfile', operator: 'equals', value: true }, active: true },
      { id: 'default-company-fit', orgId, scope: 'contact', category: 'company_fit', name: 'Linked to company', weight: 15, condition: { field: 'hasCompany', operator: 'equals', value: true }, active: true },
      { id: 'default-email-engagement', orgId, scope: 'both', category: 'email_engagement', name: 'Email engagement', weight: 20, condition: { field: 'emailEngagement', operator: 'gt', value: 0 }, active: true },
      { id: 'default-behavior', orgId, scope: 'both', category: 'website_activity_behavior', name: 'Recent activity', weight: 15, condition: { field: 'recentActivityCount', operator: 'gt', value: 0 }, active: true },
      { id: 'default-recency', orgId, scope: 'lead', category: 'sales_activity_recency', name: 'Sales activity in 14d', weight: 20, condition: { field: 'daysSinceActivity', operator: 'lte', value: 14 }, active: true },
      { id: 'default-stage', orgId, scope: 'lead', category: 'deal_stage', name: 'Advanced stage', weight: 20, condition: { field: 'stageScore', operator: 'gte', value: 2 }, active: true },
    ] as any[];
  }

  private evalCondition(metrics: Record<string, any>, condition: any): EvaluatedMetric {
    if (!condition?.field) return { score: 0, matched: false, reason: 'No field in condition' };
    const field = String(condition.field);
    const operator = String(condition.operator || 'equals');
    const target = condition.value;
    const actual = metrics[field];

    const matched =
      operator === 'exists' ? actual !== undefined && actual !== null && actual !== '' :
      operator === 'equals' ? actual === target :
      operator === 'not_equals' ? actual !== target :
      operator === 'includes' ? String(actual || '').toLowerCase().includes(String(target || '').toLowerCase()) :
      operator === 'gt' ? Number(actual || 0) > Number(target || 0) :
      operator === 'gte' ? Number(actual || 0) >= Number(target || 0) :
      operator === 'lt' ? Number(actual || 0) < Number(target || 0) :
      operator === 'lte' ? Number(actual || 0) <= Number(target || 0) :
      false;

    return {
      score: matched ? 1 : 0,
      matched,
      reason: `${field} ${operator} ${String(target)} (actual: ${String(actual)})`,
    };
  }

  private async calculateAndUpsertContactScore(orgId: string, contactOdooId: number) {
    const [contact] = await this.odooClient.searchRead(
      'res.partner',
      [['id', '=', contactOdooId]],
      ['id', 'email', 'phone', 'mobile', 'country_id', 'parent_id', 'website', 'write_date', 'create_date'],
    );
    if (!contact) return null;

    const [rules, activities, opportunities] = await Promise.all([
      this.loadRules(orgId),
      this.odooClient.searchRead('mail.activity', [['res_model', '=', 'res.partner'], ['res_id', '=', contactOdooId]], ['id', 'create_date']),
      this.odooClient.searchRead('crm.lead', [['partner_id', '=', contactOdooId]], ['id', 'stage_id']),
    ]);

    const emailEngagement = await this.getEmailEngagement(orgId, contact.email || undefined);
    const latestActivityDate = activities.map((a: any) => a.create_date).filter(Boolean).sort().at(-1);
    const daysSinceActivity = latestActivityDate ? Math.floor((Date.now() - new Date(latestActivityDate).getTime()) / (24 * 60 * 60 * 1000)) : 999;

    const metrics = {
      hasProfile: Boolean(contact.email && (contact.phone || contact.mobile)),
      hasCompany: Array.isArray(contact.parent_id),
      hasCountry: Array.isArray(contact.country_id),
      hasWebsite: Boolean(contact.website),
      emailEngagement,
      recentActivityCount: activities.length,
      daysSinceActivity,
      dealCount: opportunities.length,
    };

    const scopedRules = rules.filter((rule: any) => rule.scope === 'both' || rule.scope === 'contact');
    const breakdown: Record<string, any> = {};
    let score = 0;
    for (const rule of scopedRules) {
      const result = this.evalCondition(metrics, rule.condition || {});
      const points = result.matched ? Number(rule.weight || 0) : 0;
      score += points;
      breakdown[rule.category || rule.name] = {
        ruleId: rule.id,
        name: rule.name,
        matched: result.matched,
        points,
        reason: result.reason,
      };
    }

    return this.prisma.contactScore.upsert({
      where: { orgId_contactOdooId: { orgId, contactOdooId } },
      update: { score, breakdown, lastCalculatedAt: new Date() },
      create: { orgId, contactOdooId, score, breakdown, lastCalculatedAt: new Date() },
    });
  }

  private async calculateAndUpsertLeadScore(orgId: string, leadOdooId: number) {
    const [lead] = await this.odooClient.searchRead(
      'crm.lead',
      [['id', '=', leadOdooId]],
      ['id', 'name', 'email_from', 'phone', 'stage_id', 'partner_id', 'activity_ids', 'write_date', 'type', 'probability', 'is_won'],
    );
    if (!lead) return null;

    const [rules, activities] = await Promise.all([
      this.loadRules(orgId),
      this.odooClient.searchRead('mail.activity', [['res_model', '=', 'crm.lead'], ['res_id', '=', leadOdooId]], ['id', 'create_date']),
    ]);

    const stageName = Array.isArray(lead.stage_id) ? String(lead.stage_id[1] || '').toLowerCase() : '';
    const stageScore = stageName.includes('new') ? 0 :
      stageName.includes('qual') ? 1 :
      stageName.includes('proposal') || stageName.includes('quote') ? 2 :
      stageName.includes('nego') ? 3 :
      stageName.includes('won') ? 4 : 1;

    const latestActivityDate = activities.map((a: any) => a.create_date).filter(Boolean).sort().at(-1);
    const daysSinceActivity = latestActivityDate ? Math.floor((Date.now() - new Date(latestActivityDate).getTime()) / (24 * 60 * 60 * 1000)) : 999;
    const emailEngagement = await this.getEmailEngagement(orgId, lead.email_from || undefined);

    const metrics = {
      hasProfile: Boolean(lead.email_from && lead.phone),
      hasCompany: Array.isArray(lead.partner_id),
      emailEngagement,
      recentActivityCount: activities.length,
      daysSinceActivity,
      stageScore,
      probability: Number(lead.probability || 0),
      isWon: Boolean(lead.is_won),
    };

    const scopedRules = rules.filter((rule: any) => rule.scope === 'both' || rule.scope === 'lead');
    const breakdown: Record<string, any> = {};
    let score = 0;
    for (const rule of scopedRules) {
      const result = this.evalCondition(metrics, rule.condition || {});
      const points = result.matched ? Number(rule.weight || 0) : 0;
      score += points;
      breakdown[rule.category || rule.name] = {
        ruleId: rule.id,
        name: rule.name,
        matched: result.matched,
        points,
        reason: result.reason,
      };
    }

    return this.prisma.leadScore.upsert({
      where: { orgId_leadOdooId: { orgId, leadOdooId } },
      update: { score, breakdown, lastCalculatedAt: new Date() },
      create: { orgId, leadOdooId, score, breakdown, lastCalculatedAt: new Date() },
    });
  }

  private async getEmailEngagement(orgId: string, email?: string) {
    if (!email) return 0;
    const events = await this.prisma.marketingDeliveryEvent.findMany({
      where: {
        orgId,
        recipientEmail: email,
        eventType: { in: ['open', 'click', 'reply'] },
      },
      select: { eventType: true },
      take: 100,
    });

    return events.reduce((score, event) => {
      if (event.eventType === 'reply') return score + 3;
      if (event.eventType === 'click') return score + 2;
      return score + 1;
    }, 0);
  }
}
