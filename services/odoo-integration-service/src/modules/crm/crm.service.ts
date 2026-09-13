import { BadRequestException, Injectable } from '@nestjs/common';
import { OdooClientService } from '../odoo-base/odoo-client.service.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

@Injectable()
export class CrmService {
  private readonly model = 'crm.lead';
  private readonly defaultFields = [
    'id',
    'name',
    'partner_id',
    'email_from',
    'phone',
    'probability',
    'planned_revenue',
    'expected_revenue',
    'recurring_revenue_monthly',
    'stage_id',
    'type',
    'description',
    'priority',
    'user_id',
    'date_deadline',
    'create_date',
    'write_date',
    'activity_ids',
    'activity_type_id',
    'activity_summary',
    'activity_state',
    'activity_date_deadline',
    'active',
    'is_won',
    'tag_ids',
  ];

  private readonly stageModel = 'crm.stage';
  private readonly stageFields = ['id', 'name', 'sequence', 'is_won'];

  constructor(private readonly odooClient: OdooClientService) {}

  async findAll(paginationDto: any) {
    const { page = 1, pageSize = 20, search, stageId, type, active = true } = paginationDto;
    const offset = (page - 1) * pageSize;

    const domain: any[] = [['active', '=', active]];

    if (search) {
      domain.push('|', ['name', 'ilike', search], ['partner_id.name', 'ilike', search]);
    }

    if (stageId) {
      domain.push(['stage_id', '=', Number(stageId)]);
    }

    if (type) {
      domain.push(['type', '=', type]);
    }

    const [data, total] = await Promise.all([
      this.odooClient.searchRead(this.model, domain, this.defaultFields, {
        offset,
        limit: pageSize,
        order: 'create_date desc',
      }),
      this.odooClient.execute(this.model, 'search_count', [domain]),
    ]);

    const mappedData = data.map((lead: any) => this.normalizeOpportunity(lead));

    return { 
      data: mappedData, 
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: number) {
    const [lead] = await this.odooClient.searchRead(
      this.model,
      [['id', '=', id]],
      this.defaultFields,
    );
    if (!lead) return null;
    return this.normalizeOpportunity(lead);
  }

  private getOpportunityStatus(lead: any): 'new' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost' {
    const stageLabel = Array.isArray(lead.stage_id) ? lead.stage_id[1] : '';
    const probability = Number(lead.probability ?? 0);
    const label = String(stageLabel ?? '').toLowerCase();

    // 1. Won condition
    if (lead.is_won || label.includes('won') || probability === 100) return 'won';

    // 2. Lost condition (requires explicit loss or 0% probability while inactive)
    const isExplicitlyLost = label.includes('lost') || (probability === 0 && lead.active === false);
    if (isExplicitlyLost) return 'lost';

    // 3. Mapping based on stage name keywords
    if (label.includes('nego')) return 'negotiation';
    if (label.includes('prop') || label.includes('quote')) return 'proposal';
    if (label.includes('qual')) return 'qualified';
    if (label.includes('new')) return 'new';

    return 'new';
  }

  private normalizeOpportunity(lead: any) {
    const stageLabel = Array.isArray(lead.stage_id) ? lead.stage_id[1] : '';
    const stageId = Array.isArray(lead.stage_id) ? lead.stage_id[0] : null;
    const partnerId = Array.isArray(lead.partner_id) ? lead.partner_id[0] : null;
    const partnerName = Array.isArray(lead.partner_id) ? lead.partner_id[1] : '';
    const probability = Number(lead.probability ?? 0);
    const expectedRevenue = Number(lead.expected_revenue || lead.planned_revenue || 0);
    const weightedValue = (expectedRevenue * probability) / 100;
    const stageStatus = this.getOpportunityStatus(lead);
    const activityId = Array.isArray(lead.activity_ids) ? lead.activity_ids[0] : undefined;

    return {
      id: lead.id,
      odooId: lead.id,
      name: lead.name,
      partner: partnerId ? { id: partnerId, name: partnerName } : null,
      customerName: partnerName,
      customerId: partnerId ?? undefined,
      companyName: partnerName,
      email: lead.email_from,
      phone: lead.phone,
      probability,
      expectedRevenue,
      weightedValue,
      recurringRevenue: lead.recurring_revenue_monthly || 0,
      stage: {
        id: stageId,
        name: stageLabel,
        status: stageStatus,
      },
      stageId: stageId ?? undefined,
      stageName: stageLabel,
      stageStatus,
      status: stageStatus,
      user: Array.isArray(lead.user_id)
        ? { id: lead.user_id[0], name: lead.user_id[1] }
        : null,
      priority: lead.priority,
      tags: Array.isArray(lead.tag_ids) ? lead.tag_ids : [],
      expectedClose: lead.date_deadline,
      expectedCloseDate: lead.date_deadline,
      createdAt: lead.create_date,
      updatedAt: lead.write_date,
      type: lead.type,
      active: lead.active,
      nextActivity: lead.activity_summary
        ? {
            id: activityId ? `act-${activityId}` : undefined,
            odooId: activityId,
            type: Array.isArray(lead.activity_type_id)
              ? lead.activity_type_id[1]
              : 'todo',
            title: lead.activity_summary,
            summary: lead.activity_summary,
            dueDate: lead.activity_date_deadline,
            deadline: lead.activity_date_deadline,
            state: lead.activity_state,
            overdue: lead.activity_state === 'overdue',
          }
        : null,
    };
  }

  private mapOpportunityWritePayload(data: any) {
    const priorityMap: Record<string, string> = { low: '0', medium: '1', high: '2' };
    const payload: Record<string, any> = {
      name: data?.name,
      email_from: data?.email ?? data?.email_from,
      phone: data?.phone,
      planned_revenue: data?.expectedRevenue ?? data?.planned_revenue,
      probability: data?.probability,
      recurring_revenue_monthly: data?.recurringRevenue ?? data?.recurring_revenue_monthly,
      stage_id: data?.stageId ?? data?.stage_id,
      priority: priorityMap[data?.priority] ?? data?.priority,
      date_deadline: data?.expectedCloseDate ?? data?.expectedClose ?? data?.date_deadline,
      description: data?.notes ?? data?.description,
      type: data?.type,
      active: data?.active,
    };

    if (data?.partnerId || data?.customerId) {
      payload.partner_id = Number(data.partnerId ?? data.customerId);
    }

    return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined && value !== ''));
  }

  async create(data: any) {
    const id = await this.odooClient.execute(this.model, 'create', [this.mapOpportunityWritePayload({ ...data, type: data?.type ?? 'opportunity' })]);
    return this.findOne(Number(id));
  }

  async update(id: number, data: any) {
    await this.odooClient.execute(this.model, 'write', [[id], this.mapOpportunityWritePayload(data)]);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.odooClient.execute(this.model, 'write', [[id], { active: false }]);
    return { id, archived: true };
  }

  async getStages() {
    return this.odooClient.searchRead(this.stageModel, [], this.stageFields, {
      order: 'sequence asc',
    });
  }

  // --- Activities ---
  async getActivities(paginationDto: PaginationDto) {
    const domain: any[] = [['res_model', '=', this.model]];
    if (paginationDto.search) {
      domain.push(['summary', 'ilike', `%${paginationDto.search}%`]);
    }

    const activities = await this.odooClient.searchRead(
      'mail.activity',
      domain,
      [
        'id',
        'res_id',
        'res_name',
        'summary',
        'note',
        'date_deadline',
        'activity_type_id',
        'user_id',
        'state',
        'create_date',
      ],
      { order: 'date_deadline asc', limit: 100 },
    );

    return activities.map((activity: any) => this.normalizeActivity(activity));
  }

  private normalizeActivity(activity: any) {
    const rawType = Array.isArray(activity.activity_type_id)
      ? String(activity.activity_type_id[1]).toLowerCase()
      : 'todo';

    return {
      id: String(activity.id),
      odooId: activity.id,
      opportunityId: activity.res_id ? String(activity.res_id) : undefined,
      contactId: undefined,
      type: rawType.includes('mail')
        ? 'email'
        : rawType.includes('call')
          ? 'call'
          : rawType.includes('meet')
            ? 'meeting'
            : 'todo',
      title: activity.summary || 'Activity',
      note: activity.note,
      dueDate: activity.date_deadline,
      completed: activity.state === 'done',
      state: activity.state,
      assignedTo: Array.isArray(activity.user_id) ? activity.user_id[1] : undefined,
      createdAt: activity.create_date,
    };
  }

  private async findActivity(id: number) {
    const [activity] = await this.odooClient.searchRead(
      'mail.activity',
      [['id', '=', id]],
      ['id', 'res_id', 'summary', 'note', 'date_deadline', 'activity_type_id', 'user_id', 'state', 'create_date'],
    );
    return activity ? this.normalizeActivity(activity) : null;
  }

  private async resolveActivityTypeId(type?: string): Promise<number | undefined> {
    const types = await this.odooClient.searchRead('mail.activity.type', [], ['id', 'name']);
    if (!types.length) return undefined;

    const requested = String(type ?? '').toLowerCase().trim();
    const findBy = (needle: string) =>
      types.find((t: any) => {
        const label = String(t.name ?? '').toLowerCase();
        return label === needle || label.includes(needle) || needle.includes(label);
      });

    if (requested) {
      const foundType = findBy(requested);
      if (foundType) return foundType.id;
    }

    for (const alias of ['todo', 'to-do', 'to do', 'call', 'email', 'meeting']) {
      const foundType = findBy(alias);
      if (foundType) return foundType.id;
    }

    return types[0]?.id;
  }

  async createActivity(data: any) {
    const { type, title, dueDate, opportunityId, res_id, ...rest } = data;
    const resId = Number(res_id || opportunityId);
    const summary = String(title || data.summary || '').trim();

    if (!Number.isFinite(resId) || resId <= 0) {
      throw new BadRequestException('A valid opportunity ID is required to create an activity.');
    }
    if (!summary) {
      throw new BadRequestException('Activity title is required.');
    }

    const activity_type_id = data.activity_type_id || await this.resolveActivityTypeId(type);
    if (!activity_type_id) {
      throw new BadRequestException('No Odoo activity type is configured.');
    }

    const payload = {
      ...rest,
      res_model: this.model,
      res_id: resId,
      summary,
      date_deadline: dueDate || data.date_deadline,
      activity_type_id,
    };

    const activityId = await this.odooClient.execute('mail.activity', 'create', [payload]);
    return this.findActivity(Number(activityId));
  }

  async updateActivity(id: number, data: any) {
    await this.odooClient.execute('mail.activity', 'write', [[id], data]);
    return this.findActivity(id);
  }

  async completeActivity(id: number) {
    await this.odooClient.execute('mail.activity', 'action_done', [[id]]);
    return { id, completed: true };
  }

  async removeActivity(id: number) {
    await this.odooClient.execute('mail.activity', 'unlink', [[id]]);
    return { id, deleted: true };
  }

  async createNote(id: number, body: string) {
    return this.odooClient.execute('mail.message', 'create', [
      {
        body,
        res_id: id,
        model: this.model,
        message_type: 'comment',
        subtype_id: 1,
      },
    ]);
  }

  async getTimeline(id: number) {
    const [messages, activities] = await Promise.all([
      this.odooClient.searchRead(
        'mail.message',
        [['res_id', '=', id], ['model', '=', this.model]],
        ['id', 'body', 'date', 'author_id', 'message_type', 'subtype_id'],
        { order: 'date desc', limit: 50 },
      ),
      this.odooClient.searchRead(
        'mail.activity',
        [['res_id', '=', id], ['res_model', '=', this.model]],
        ['id', 'summary', 'note', 'date_deadline', 'activity_type_id', 'user_id', 'state', 'create_date'],
        { order: 'date_deadline desc', limit: 50 },
      ),
    ]);

    const timeline = [
      ...messages.map((m: any) => ({
        id: `msg-${m.id}`,
        type: 'message',
        title: m.subtype_id ? m.subtype_id[1] : 'Message',
        content: m.body,
        date: m.date,
        author: m.author_id ? m.author_id[1] : 'System',
      })),
      ...activities.map((a: any) => ({
        id: `act-${a.id}`,
        odooId: a.id,
        type: 'activity',
        title: a.summary || (Array.isArray(a.activity_type_id) ? a.activity_type_id[1] : 'Activity'),
        content: a.note,
        date: a.date_deadline || a.create_date,
        author: a.user_id ? a.user_id[1] : 'System',
        state: a.state,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return timeline;
  }

  // --- Summary & Dashboard ---
  async getPipelineSummary() {
    const leads = await this.odooClient.searchRead(
      this.model,
      [['type', '=', 'opportunity']],
      ['expected_revenue', 'probability', 'stage_id', 'planned_revenue', 'is_won', 'active'],
    );

    const summary = leads.reduce((acc: any, lead: any) => {
      const value = Number(lead.expected_revenue || lead.planned_revenue || 0);
      const weighted = (value * Number(lead.probability || 0)) / 100;
      const status = this.getOpportunityStatus(lead);
      const stageLabel = Array.isArray(lead.stage_id) ? String(lead.stage_id[1] ?? '').toLowerCase() : '';

      if (lead.is_won || status === 'won') {
        acc.wonValue += value;
        acc.wonCount += 1;
      } else if (stageLabel.includes('lost') || status === 'lost') {
        acc.lostValue += value;
        acc.lostCount += 1;
      } else if (lead.active === false) {
        acc.archivedValue += value;
        acc.archivedCount += 1;
      } else {
        acc.totalOpenValue += value;
        acc.weightedValue += weighted;
        acc.openCount += 1;
      }

      return acc;
    }, {
      totalOpenValue: 0,
      weightedValue: 0,
      wonValue: 0,
      lostValue: 0,
      archivedValue: 0,
      openCount: 0,
      wonCount: 0,
      lostCount: 0,
      archivedCount: 0,
    });

    return {
      ...summary,
      opportunityCount: leads.length,
    };
  }

  async getDashboard() {
    const [summary, stages, activities] = await Promise.all([
      this.getPipelineSummary(),
      this.getStages(),
      this.getActivities({ page: 1, pageSize: 20 }),
    ]);

    // Group by stage for chart
    const leads = await this.odooClient.searchRead(
      this.model,
      [['type', '=', 'opportunity']],
      ['stage_id', 'expected_revenue', 'planned_revenue'],
    );

    const pipelineByStage = stages.map((stage: any) => {
      const stageLeads = leads.filter((l: any) => l.stage_id && l.stage_id[0] === stage.id);
      return {
        stage: stage.name,
        count: stageLeads.length,
        value: stageLeads.reduce((acc, curr) => acc + (curr.expected_revenue || curr.planned_revenue || 0), 0),
      };
    });

    return {
      summary,
      pipelineByStage,
      recentActivities: activities.slice(0, 10),
    };
  }
}
