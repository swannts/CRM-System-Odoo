import { Injectable, Logger } from '@nestjs/common';
import { OdooClientService } from '../odoo-base/odoo-client.service.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { PrismaService } from '../../database/prisma/prisma.service.js';

@Injectable()
export class MarketingService {
  private readonly logger = new Logger(MarketingService.name);
  private campaignStatusField: string | null | undefined;
  private campaignColorFieldAvailable: boolean | undefined;

  // Models
  private readonly campaignModel = 'utm.campaign';
  private readonly mailingModel = 'mailing.mailing';
  private readonly mailingListModel = 'mailing.list';
  private readonly templateModel = 'mail.template';
  private readonly mailModel = 'mail.mail';
  private readonly mailServerModel = 'ir.mail_server';
  private readonly mailingContactModel = 'mailing.contact';
  private readonly mailingTraceModel = 'mailing.trace';
  private readonly sourceModel = 'utm.source';
  private readonly mediumModel = 'utm.medium';
  private readonly leadModel = 'crm.lead';
  private readonly salesOrderModel = 'sale.order';

  // Fields
  private readonly campaignFields = [
    'id',
    'name',
    'title',
    'active',
    'color',
    'create_date',
    'write_date',
  ];
  private readonly mailingFields = [
    'id',
    'subject',
    'mailing_type',
    'body_html',
    'state',
    'sent_date',
    'schedule_date',
    'campaign_id',
    'contact_list_ids',
    'reply_to_mode',
    'reply_to',
  ];
  private readonly mailingListFields = [
    'id',
    'name',
    'active',
    'contact_nbr',
    'contact_count',
  ]; // Try multiple variations
  private readonly templateFields = [
    'id',
    'name',
    'subject',
    'body_html',
    'model_id',
  ];
  private readonly mailingContactFields = [
    'id',
    'name',
    'email',
    'phone',
    'opt_out',
    'create_date',
  ];
  private readonly mailingTraceFields = [
    'id',
    'state',
    'opened',
    'clicked',
    'trace_status',
    'create_date',
  ];
  private readonly sourceFields = [
    'id',
    'name',
    'active',
    'create_date',
    'write_date',
  ];
  private readonly mediumFields = [
    'id',
    'name',
    'active',
    'create_date',
    'write_date',
  ];

  constructor(
    private readonly odooClient: OdooClientService,
    private readonly prisma: PrismaService,
  ) {}

  private async getCampaignFieldFlags() {
    if (
      this.campaignStatusField !== undefined &&
      this.campaignColorFieldAvailable !== undefined
    ) {
      return {
        statusField: this.campaignStatusField,
        hasColor: this.campaignColorFieldAvailable,
      };
    }

    try {
      const fieldsInfo = await this.odooClient.execute(
        this.campaignModel,
        'fields_get',
        [[], ['x_marketing_status', 'color']],
      );
      const statusField = fieldsInfo?.x_marketing_status
        ? 'x_marketing_status'
        : null;
      const hasColor = Boolean(fieldsInfo?.color);
      this.campaignStatusField = statusField;
      this.campaignColorFieldAvailable = hasColor;
      return { statusField, hasColor };
    } catch (error) {
      this.campaignStatusField = null;
      this.campaignColorFieldAvailable = false;
      return { statusField: null, hasColor: false };
    }
  }

  // --- Campaigns (UTM) ---

  async listCampaigns(paginationDto: PaginationDto) {
    const page = paginationDto.page ?? 1;
    const pageSize = paginationDto.pageSize ?? 20;
    const search = paginationDto.search;
    const domain: any[] = search ? [['name', 'ilike', search]] : [];

    const [data, total] = await Promise.all([
      this.odooClient.searchRead(
        this.campaignModel,
        domain,
        this.campaignFields,
        {
          offset: (page - 1) * pageSize,
          limit: pageSize,
          order: 'write_date desc',
        },
      ),
      this.odooClient.execute(this.campaignModel, 'search_count', [domain]),
    ]);

    return { data, total };
  }

  async getCampaign(id: number) {
    const [campaign] = await this.odooClient.searchRead(
      this.campaignModel,
      [['id', '=', id]],
      this.campaignFields,
    );
    return campaign;
  }

  async createCampaign(data: any) {
    const { statusField, hasColor } = await this.getCampaignFieldFlags();
    const payload = {
      name: String(data?.name || '').trim(),
      title: data?.title ? String(data.title).trim() : undefined,
      active: true,
      ...(statusField ? { [statusField]: 'active' } : {}),
      ...(hasColor ? { color: 10 } : {}),
    };
    return this.odooClient.execute(this.campaignModel, 'create', [payload]);
  }

  async updateCampaign(id: number, data: any) {
    const { statusField } = await this.getCampaignFieldFlags();
    const payload: Record<string, any> = {};
    if (data?.name !== undefined) payload.name = String(data.name).trim();
    if (data?.title !== undefined) payload.title = String(data.title).trim();
    if (data?.active !== undefined) payload.active = data.active;
    if (statusField && data?.status !== undefined)
      payload[statusField] = String(data.status);
    return this.odooClient.execute(this.campaignModel, 'write', [
      [id],
      payload,
    ]);
  }

  removeCampaign(id: number) {
    return this.odooClient.execute(this.campaignModel, 'unlink', [[id]]);
  }

  async setCampaignStatus(id: number, action: 'launch' | 'pause' | 'archive') {
    const { statusField, hasColor } = await this.getCampaignFieldFlags();
    const payload: Record<string, any> = {};

    if (action === 'launch') {
      payload.active = true;
      if (statusField) payload[statusField] = 'active';
      if (hasColor) payload.color = 10;
    }
    if (action === 'pause') {
      payload.active = false;
      if (statusField) payload[statusField] = 'paused';
      if (hasColor) payload.color = 3;
    }
    if (action === 'archive') {
      payload.active = false;
      if (statusField) payload[statusField] = 'archived';
      if (hasColor) payload.color = 8;
    }

    return this.odooClient.execute(this.campaignModel, 'write', [
      [id],
      payload,
    ]);
  }

  // --- Mass Mailings (The actual "Campaign" logic for sending) ---

  async listMailings(campaignId?: number) {
    const domain: any[] = campaignId ? [['campaign_id', '=', campaignId]] : [];
    return this.odooClient.searchRead(
      this.mailingModel,
      domain,
      this.mailingFields,
    );
  }

  async createMailing(data: any) {
    const payload = {
      subject: data.subject,
      body_html: data.content || data.body_html,
      mailing_type: data.type || 'mail',
      campaign_id: data.campaignId,
      contact_list_ids: data.segmentId
        ? [[6, 0, [Number(data.segmentId)]]]
        : [],
      reply_to_mode: 'update',
    };
    return this.odooClient.execute(this.mailingModel, 'create', [payload]);
  }

  async sendMailing(id: number) {
    // In Odoo mass_mailing, action_put_in_queue puts it in the outgoing queue
    return this.odooClient.execute(this.mailingModel, 'action_put_in_queue', [
      [id],
    ]);
  }

  async sendTestMail(campaignId: number, to: string) {
    const mailing = await this.getOrCreateCampaignMailing(campaignId);
    const subject = String(mailing?.subject || '').trim();
    const bodyHtml = String(mailing?.body_html || '').trim();
    if (!subject || !bodyHtml) {
      throw new Error(
        'Campaign content is incomplete. Subject and content are required.',
      );
    }

    const senderConfigured = await this.isSenderConfigured();
    if (!senderConfigured.configured) {
      throw new Error(
        senderConfigured.message || 'Marketing sender is not configured.',
      );
    }

    const createdId = await this.odooClient.execute(this.mailModel, 'create', [
      {
        subject,
        body_html: bodyHtml,
        email_to: String(to).trim(),
        reply_to: mailing?.reply_to || undefined,
        auto_delete: true,
      },
    ]);

    await this.odooClient.execute(this.mailModel, 'send', [
      [Number(createdId)],
    ]);
    return { success: true };
  }

  async scheduleMailing(id: number, date: string) {
    return this.odooClient.execute(this.mailingModel, 'write', [
      [id],
      { schedule_date: date },
    ]);
  }

  async cancelScheduledMailing(id: number) {
    return this.odooClient.execute(this.mailingModel, 'write', [
      [id],
      { schedule_date: false },
    ]);
  }

  async getOrCreateCampaignMailing(campaignId: number) {
    const existing = await this.odooClient.searchRead(
      this.mailingModel,
      [['campaign_id', '=', campaignId]],
      this.mailingFields,
      { limit: 1, order: 'id desc' },
    );

    if (existing.length > 0) return existing[0];

    const createdId = await this.odooClient.execute(
      this.mailingModel,
      'create',
      [
        {
          subject: 'Untitled campaign',
          body_html: '',
          mailing_type: 'mail',
          campaign_id: campaignId,
          reply_to_mode: 'update',
        },
      ],
    );

    const created = await this.odooClient.searchRead(
      this.mailingModel,
      [['id', '=', Number(createdId)]],
      this.mailingFields,
      { limit: 1 },
    );

    return created[0];
  }

  async getCampaignMailing(campaignId: number) {
    const rows = await this.odooClient.searchRead(
      this.mailingModel,
      [['campaign_id', '=', campaignId]],
      this.mailingFields,
      { limit: 1, order: 'id desc' },
    );
    return rows[0] ?? null;
  }

  async isSenderConfigured() {
    try {
      const count = await this.odooClient.execute(
        this.mailServerModel,
        'search_count',
        [[]],
      );
      if (Number(count || 0) > 0) return { configured: true };
      return {
        configured: false,
        message: 'Marketing sender is not configured.',
      };
    } catch (error) {
      return {
        configured: false,
        message: 'Marketing sender is not configured.',
      };
    }
  }

  async getComplianceStatus(campaignId: number, orgId?: string) {
    const mailing = await this.getCampaignMailing(campaignId);
    if (!mailing) {
      return {
        available: true,
        compliantRecipients: 0,
        totalRecipients: 0,
        blockedRecipients: 0,
        message: 'No audience selected.',
      };
    }

    const listIds = Array.isArray(mailing?.contact_list_ids)
      ? mailing.contact_list_ids
          .map((x: any) => Number(Array.isArray(x) ? x[0] : x))
          .filter((n: number) => Number.isFinite(n) && n > 0)
      : [];

    if (listIds.length === 0) {
      return {
        available: true,
        compliantRecipients: 0,
        totalRecipients: 0,
        blockedRecipients: 0,
        message: 'No audience selected.',
      };
    }

    try {
      const contacts = await this.odooClient.searchRead(
        this.mailingContactModel,
        [['list_ids', 'in', listIds]],
        this.mailingContactFields,
        { limit: 5000, order: 'id desc' },
      );

      const totalRecipients = Array.isArray(contacts) ? contacts.length : 0;

      let compliantRecipients = Array.isArray(contacts)
        ? contacts.filter(
            (c: any) => !c?.opt_out && Boolean(String(c?.email || '').trim()),
          ).length
        : 0;
      let blockedRecipients = Math.max(
        0,
        totalRecipients - compliantRecipients,
      );

      if (orgId) {
        for (const c of Array.isArray(contacts) ? contacts : []) {
          const email = String(c?.email || '')
            .trim()
            .toLowerCase();
          if (!email) continue;
          const suppression = await (
            this.prisma as any
          ).marketingSuppressionEntry.findFirst({
            where: { orgId, channel: 'email', value: email },
          });
          if (suppression) {
            compliantRecipients = Math.max(0, compliantRecipients - 1);
            blockedRecipients += 1;
          }
        }
      }

      return {
        available: true,
        compliantRecipients,
        totalRecipients,
        blockedRecipients,
        message:
          blockedRecipients > 0
            ? 'Some recipients are blocked by consent/unsubscribe rules.'
            : 'All recipients are compliant.',
      };
    } catch (error) {
      return {
        available: false,
        compliantRecipients: 0,
        totalRecipients: 0,
        blockedRecipients: 0,
        message: 'Compliance checks are not available yet.',
      };
    }
  }

  async previewSegmentById(segmentId: number) {
    try {
      const contacts = await this.odooClient.searchRead(
        this.mailingContactModel,
        [['list_ids', 'in', [segmentId]]],
        this.mailingContactFields,
        { limit: 25, order: 'id desc' },
      );

      const sampleContacts = (Array.isArray(contacts) ? contacts : [])
        .slice(0, 10)
        .map((c: any) => ({
          id: String(c?.id || ''),
          name: c?.name ? String(c.name) : undefined,
          email: c?.email ? String(c.email) : undefined,
          phone: c?.phone ? String(c.phone) : undefined,
          consentStatus: c?.opt_out ? 'opted_out' : 'subscribed',
        }));

      return {
        count: Array.isArray(contacts) ? contacts.length : 0,
        sampleContacts,
      };
    } catch (error) {
      return {
        message: 'Segment preview is not available yet.',
        available: false,
      };
    }
  }

  async campaignDeliveryAnalytics(campaignId: number) {
    const mailing = await this.getCampaignMailing(campaignId);
    if (!mailing?.id) return {};

    try {
      const traces = await this.odooClient.searchRead(
        this.mailingTraceModel,
        [['mailing_id', '=', Number(mailing.id)]],
        this.mailingTraceFields,
        { limit: 10000, order: 'id desc' },
      );

      const rows = Array.isArray(traces) ? traces : [];
      const recipients = rows.length;
      const delivered = rows.filter(
        (r: any) => String(r?.state || '').toLowerCase() === 'sent',
      ).length;
      const opened = rows.filter((r: any) => Boolean(r?.opened)).length;
      const clicked = rows.filter((r: any) => Boolean(r?.clicked)).length;
      const bounced = rows.filter((r: any) => {
        const status = String(r?.trace_status || r?.state || '').toLowerCase();
        return status.includes('bounce') || status.includes('exception');
      }).length;
      const unsubscribed = rows.filter((r: any) =>
        String(r?.trace_status || '')
          .toLowerCase()
          .includes('unsubscribe'),
      ).length;

      return {
        recipients,
        delivered,
        opened,
        clicked,
        bounced,
        unsubscribed,
      };
    } catch (error) {
      return {};
    }
  }

  private async mapFiltersToDomain(
    filters: Array<{ field: string; operator: string; value: any }>,
  ) {
    const allowedFields = new Set([
      'lifecycleStage',
      'tag',
      'source',
      'email',
      'createdAt',
      'lastActivityAt',
      'hasOrders',
      'hasBookings',
      'marketingConsent',
    ]);
    const allowedOperators = new Set([
      'equals',
      'not_equals',
      'contains',
      'starts_with',
      'ends_with',
      'greater_than',
      'less_than',
      'between',
      'in',
      'not_in',
    ]);

    const domain: any[] = [];
    const fieldsInfo = await this.odooClient.execute(
      this.mailingContactModel,
      'fields_get',
      [[]],
    );
    const hasField = (field: string) => Boolean(fieldsInfo?.[field]);
    for (const raw of filters) {
      const field = String(raw?.field || '');
      const operator = String(raw?.operator || '');
      if (!allowedFields.has(field)) {
        throw new Error(`Unsupported filter field: ${field}`);
      }
      if (!allowedOperators.has(operator)) {
        throw new Error(`Unsupported filter operator: ${operator}`);
      }

      if (field === 'lifecycleStage') {
        if (!hasField('lifecycle_stage'))
          throw new Error('Unsupported filter field: lifecycleStage');
        if (operator === 'equals')
          domain.push(['lifecycle_stage', '=', String(raw?.value || '')]);
        else if (operator === 'not_equals')
          domain.push(['lifecycle_stage', '!=', String(raw?.value || '')]);
        else
          throw new Error(
            `Unsupported operator for lifecycleStage: ${operator}`,
          );
      }
      if (field === 'tag') {
        if (!hasField('tag_ids'))
          throw new Error('Unsupported filter field: tag');
        const values = Array.isArray(raw?.value)
          ? raw.value
              .map((x: any) => Number(x))
              .filter((n: number) => Number.isFinite(n))
          : [Number(raw?.value)];
        if (!values.length) throw new Error('Invalid tag filter value.');
        if (operator === 'in' || operator === 'equals')
          domain.push(['tag_ids', 'in', values]);
        else if (operator === 'not_in' || operator === 'not_equals')
          domain.push(['tag_ids', 'not in', values]);
        else throw new Error(`Unsupported operator for tag: ${operator}`);
      }
      if (field === 'source') {
        if (!hasField('source_id'))
          throw new Error('Unsupported filter field: source');
        if (operator === 'equals')
          domain.push(['source_id', '=', Number(raw?.value)]);
        else if (operator === 'not_equals')
          domain.push(['source_id', '!=', Number(raw?.value)]);
        else throw new Error(`Unsupported operator for source: ${operator}`);
      }
      if (field === 'email') {
        if (operator === 'contains')
          domain.push(['email', 'ilike', `%${String(raw?.value || '')}%`]);
        else if (operator === 'starts_with')
          domain.push(['email', 'ilike', `${String(raw?.value || '')}%`]);
        else if (operator === 'ends_with')
          domain.push(['email', 'ilike', `%${String(raw?.value || '')}`]);
        else if (operator === 'equals')
          domain.push(['email', '=', String(raw?.value || '')]);
        else if (operator === 'not_equals')
          domain.push(['email', '!=', String(raw?.value || '')]);
        else throw new Error(`Unsupported operator for email: ${operator}`);
      }
      if (field === 'createdAt') {
        if (operator === 'greater_than')
          domain.push(['create_date', '>', String(raw?.value || '')]);
        else if (operator === 'less_than')
          domain.push(['create_date', '<', String(raw?.value || '')]);
        else if (
          operator === 'between' &&
          Array.isArray(raw?.value) &&
          raw.value.length === 2
        ) {
          domain.push(['create_date', '>=', String(raw.value[0])]);
          domain.push(['create_date', '<=', String(raw.value[1])]);
        } else if (operator === 'equals')
          domain.push(['create_date', '=', String(raw?.value || '')]);
        else throw new Error(`Unsupported operator for createdAt: ${operator}`);
      }
      if (field === 'lastActivityAt') {
        if (!hasField('write_date'))
          throw new Error('Unsupported filter field: lastActivityAt');
        if (operator === 'greater_than')
          domain.push(['write_date', '>', String(raw?.value || '')]);
        else if (operator === 'less_than')
          domain.push(['write_date', '<', String(raw?.value || '')]);
        else if (
          operator === 'between' &&
          Array.isArray(raw?.value) &&
          raw.value.length === 2
        ) {
          domain.push(['write_date', '>=', String(raw.value[0])]);
          domain.push(['write_date', '<=', String(raw.value[1])]);
        } else if (operator === 'equals')
          domain.push(['write_date', '=', String(raw?.value || '')]);
        else
          throw new Error(
            `Unsupported operator for lastActivityAt: ${operator}`,
          );
      }
      if (field === 'marketingConsent') {
        // Odoo mailing.contact keeps suppression via opt_out.
        const desired = Boolean(raw?.value);
        domain.push(['opt_out', '=', !desired]);
      }
    }
    return domain;
  }

  private async filterContactsByPartnerActivity(
    baseRows: any[],
    filters: Array<{ field: string; operator: string; value: any }>,
  ) {
    const wantsOrders = filters.find((f) => f.field === 'hasOrders');
    const wantsBookings = filters.find((f) => f.field === 'hasBookings');
    if (!wantsOrders && !wantsBookings) return baseRows;

    const fieldsInfo = await this.odooClient.execute(
      this.mailingContactModel,
      'fields_get',
      [[]],
    );
    if (!fieldsInfo?.partner_id) {
      throw new Error('Unsupported filter field: hasOrders');
    }
    const contacts = await this.odooClient.searchRead(
      this.mailingContactModel,
      [
        [
          'id',
          'in',
          baseRows
            .map((r: any) => Number(r.id))
            .filter((n: number) => Number.isFinite(n)),
        ],
      ],
      ['id', 'partner_id'],
    );

    const partnerMap = new Map<number, number>();
    for (const row of Array.isArray(contacts) ? contacts : []) {
      const contactId = Number(row?.id);
      const partnerId = Number(
        Array.isArray(row?.partner_id) ? row.partner_id[0] : row?.partner_id,
      );
      if (
        Number.isFinite(contactId) &&
        Number.isFinite(partnerId) &&
        partnerId > 0
      )
        partnerMap.set(contactId, partnerId);
    }
    const partnerIds = Array.from(new Set(Array.from(partnerMap.values())));

    let orderPartnerIds = new Set<number>();
    if (wantsOrders && partnerIds.length > 0) {
      const orders = await this.odooClient.searchRead(
        this.salesOrderModel,
        [['partner_id', 'in', partnerIds]],
        ['id', 'partner_id'],
        { limit: 10000, order: 'id desc' },
      );
      orderPartnerIds = new Set(
        (Array.isArray(orders) ? orders : [])
          .map((o: any) =>
            Number(
              Array.isArray(o?.partner_id) ? o.partner_id[0] : o?.partner_id,
            ),
          )
          .filter((n: number) => Number.isFinite(n)),
      );
    }

    let bookingPartnerIds = new Set<number>();
    if (wantsBookings && partnerIds.length > 0) {
      const events = await this.odooClient.searchRead(
        'calendar.event',
        [['partner_ids', 'in', partnerIds]],
        ['id', 'partner_ids'],
        { limit: 10000, order: 'id desc' },
      );
      const acc = new Set<number>();
      for (const evt of Array.isArray(events) ? events : []) {
        const ids = Array.isArray(evt?.partner_ids) ? evt.partner_ids : [];
        ids
          .map((id: any) => Number(id))
          .filter((n: number) => Number.isFinite(n))
          .forEach((n: number) => acc.add(n));
      }
      bookingPartnerIds = acc;
    }

    return baseRows.filter((row: any) => {
      const partnerId = partnerMap.get(Number(row?.id));
      if (!partnerId) return false;
      if (wantsOrders) {
        const expected = Boolean(wantsOrders.value);
        const has = orderPartnerIds.has(partnerId);
        if (expected !== has) return false;
      }
      if (wantsBookings) {
        const expected = Boolean(wantsBookings.value);
        const has = bookingPartnerIds.has(partnerId);
        if (expected !== has) return false;
      }
      return true;
    });
  }

  async previewSegment(filters: any) {
    const list = Array.isArray(filters) ? filters : [];
    const domain = await this.mapFiltersToDomain(
      list.filter(
        (f: any) => f?.field !== 'hasOrders' && f?.field !== 'hasBookings',
      ),
    );
    const contacts = await this.odooClient.searchRead(
      this.mailingContactModel,
      domain,
      this.mailingContactFields,
      { limit: 5000, order: 'id desc' },
    );
    const filtered = await this.filterContactsByPartnerActivity(
      Array.isArray(contacts) ? contacts : [],
      list,
    );
    const total = filtered.length;

    const sampleContacts = filtered.slice(0, 10).map((c: any) => ({
      id: String(c?.id || ''),
      name: c?.name ? String(c.name) : undefined,
      email: c?.email ? String(c.email) : undefined,
      phone: c?.phone ? String(c.phone) : undefined,
      consentStatus: c?.opt_out ? 'opted_out' : 'subscribed',
    }));

    return {
      count: Number(total || 0),
      sampleContacts,
    };
  }

  async getSuppressionList(orgId: string) {
    return (this.prisma as any).marketingSuppressionEntry.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }

  async getActivity() {
    const limit = 20;
    const [campaigns, mailings, segments] = await Promise.all([
      this.odooClient.searchRead(this.campaignModel, [], ['id', 'name', 'write_date'], { limit, order: 'write_date desc' }),
      this.odooClient.searchRead(this.mailingModel, [], ['id', 'subject', 'state', 'write_date'], { limit, order: 'write_date desc' }),
      this.odooClient.searchRead(this.mailingListModel, [], ['id', 'name', 'write_date'], { limit, order: 'write_date desc' }),
    ]);

    const activities: any[] = [];

    (campaigns || []).forEach((c: any) => {
      activities.push({
        id: `campaign-${c.id}`,
        type: 'campaign',
        action: 'updated',
        title: c.name,
        date: c.write_date,
      });
    });

    (mailings || []).forEach((m: any) => {
      activities.push({
        id: `mailing-${m.id}`,
        type: 'mailing',
        action: m.state === 'done' ? 'sent' : 'updated',
        title: m.subject || 'Untitled Mailing',
        date: m.write_date,
      });
    });

    (segments || []).forEach((s: any) => {
      activities.push({
        id: `segment-${s.id}`,
        type: 'segment',
        action: 'updated',
        title: s.name,
        date: s.write_date,
      });
    });

    return activities
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  async addSuppressionEntry(orgId: string, payload: any) {
    const channel = String(payload?.channel || '').toLowerCase();
    if (!['email', 'sms'].includes(channel))
      throw new Error('Invalid suppression channel.');
    const value = String(payload?.value || '').trim();
    if (!value) throw new Error('Suppression value is required.');
    return (this.prisma as any).marketingSuppressionEntry.create({
      data: {
        orgId,
        channel,
        value: value.toLowerCase(),
        reason: String(payload?.reason || 'manual'),
        source: payload?.source ? String(payload.source) : undefined,
      },
    });
  }

  async removeSuppressionEntry(orgId: string, id: string) {
    const existing = await (
      this.prisma as any
    ).marketingSuppressionEntry.findFirst({ where: { id, orgId } });
    if (!existing) return null;
    return (this.prisma as any).marketingSuppressionEntry.delete({
      where: { id },
    });
  }

  async upsertContactConsent(
    orgId: string,
    contactId: string,
    payload: any,
    userId?: string,
  ) {
    return (this.prisma as any).marketingContactConsent.upsert({
      where: { orgId_contactId: { orgId, contactId } },
      update: {
        emailOptIn: payload?.emailOptIn,
        smsOptIn: payload?.smsOptIn,
        unsubscribed: payload?.unsubscribed === true,
        updatedByUser: userId || undefined,
      },
      create: {
        orgId,
        contactId,
        emailOptIn: payload?.emailOptIn,
        smsOptIn: payload?.smsOptIn,
        unsubscribed: payload?.unsubscribed === true,
        updatedByUser: userId || undefined,
      },
    });
  }

  async evaluateRecipientEligibility(
    orgId: string,
    input: {
      channel: 'email' | 'sms';
      email?: string;
      phone?: string;
      contactId?: string;
    },
  ) {
    const channel = input.channel;
    const email = input.email ? String(input.email).trim().toLowerCase() : '';
    const phone = input.phone ? String(input.phone).trim() : '';

    if (channel === 'email' && !email)
      return {
        eligible: false,
        code: 'missing_email',
        reason: 'Recipient email is missing.',
      };
    if (channel === 'sms' && !phone)
      return {
        eligible: false,
        code: 'missing_phone',
        reason: 'Recipient phone is missing.',
      };

    const suppressions = await (
      this.prisma as any
    ).marketingSuppressionEntry.findMany({
      where: {
        orgId,
        channel,
        value: channel === 'email' ? email : phone,
      },
      take: 1,
    });
    if (suppressions.length > 0) {
      const reason = String(suppressions[0]?.reason || 'suppressed');
      if (reason === 'bounce')
        return {
          eligible: false,
          code: 'bounced',
          reason: 'Recipient suppressed due to bounce.',
        };
      if (reason === 'complaint')
        return {
          eligible: false,
          code: 'complained',
          reason: 'Recipient suppressed due to complaint.',
        };
      if (reason === 'unsubscribed')
        return {
          eligible: false,
          code: 'unsubscribed',
          reason: 'Recipient has unsubscribed.',
        };
      return {
        eligible: false,
        code: 'suppressed',
        reason: 'Recipient is suppressed.',
      };
    }

    if (input.contactId) {
      const consent = await (
        this.prisma as any
      ).marketingContactConsent.findUnique({
        where: {
          orgId_contactId: { orgId, contactId: String(input.contactId) },
        },
      });
      if (consent?.unsubscribed)
        return {
          eligible: false,
          code: 'unsubscribed',
          reason: 'Recipient has unsubscribed.',
        };
      if (channel === 'email' && consent?.emailOptIn === false)
        return {
          eligible: false,
          code: 'missing_consent',
          reason: 'Email consent missing.',
        };
      if (channel === 'sms' && consent?.smsOptIn === false)
        return {
          eligible: false,
          code: 'missing_consent',
          reason: 'SMS consent missing.',
        };
    }

    return { eligible: true };
  }

  async storeTemplateUsage(orgId: string, payload: any) {
    return (this.prisma as any).marketingCampaignTemplateUsage.create({
      data: {
        orgId,
        campaignId: String(payload.campaignId),
        templateId: String(payload.templateId),
        templateVersionId: payload?.templateVersionId
          ? String(payload.templateVersionId)
          : undefined,
        templateNameSnapshot: String(payload.templateNameSnapshot || ''),
        subjectSnapshot: payload?.subjectSnapshot
          ? String(payload.subjectSnapshot)
          : undefined,
        previewTextSnapshot: payload?.previewTextSnapshot
          ? String(payload.previewTextSnapshot)
          : undefined,
        contentSnapshot: payload?.contentSnapshot
          ? String(payload.contentSnapshot)
          : undefined,
        appliedByUserId: payload?.appliedByUserId
          ? String(payload.appliedByUserId)
          : undefined,
      },
    });
  }

  async getCampaignTemplateUsage(orgId: string, campaignId: string) {
    return (this.prisma as any).marketingCampaignTemplateUsage.findMany({
      where: { orgId, campaignId: String(campaignId) },
      orderBy: { appliedAt: 'desc' },
      take: 20,
    });
  }

  async getTemplateUsage(orgId: string, templateId: string) {
    return (this.prisma as any).marketingCampaignTemplateUsage.findMany({
      where: { orgId, templateId: String(templateId) },
      orderBy: { appliedAt: 'desc' },
      take: 100,
    });
  }

  async ingestDeliveryEvent(orgId: string, provider: string, event: any) {
    const providerEventId = event?.providerEventId
      ? String(event.providerEventId)
      : undefined;
    const providerMessageId = event?.providerMessageId
      ? String(event.providerMessageId)
      : undefined;
    if (providerEventId) {
      const existing = await (
        this.prisma as any
      ).marketingDeliveryEvent.findFirst({
        where: { orgId, provider, providerEventId },
      });
      if (existing) return existing;
    }
    if (providerMessageId) {
      const existingByMessage = await (
        this.prisma as any
      ).marketingDeliveryEvent.findFirst({
        where: {
          orgId,
          provider,
          providerMessageId,
          eventType: String(event?.eventType || ''),
        },
      });
      if (existingByMessage) return existingByMessage;
    }

    const created = await (this.prisma as any).marketingDeliveryEvent.create({
      data: {
        orgId,
        campaignId: String(event.campaignId),
        recipientId: event?.recipientId ? String(event.recipientId) : undefined,
        recipientEmail: event?.recipientEmail
          ? String(event.recipientEmail).toLowerCase()
          : undefined,
        recipientPhone: event?.recipientPhone
          ? String(event.recipientPhone)
          : undefined,
        provider,
        providerEventId,
        providerMessageId,
        eventType: String(event.eventType),
        url: event?.url ? String(event.url) : undefined,
        reason: event?.reason ? String(event.reason) : undefined,
        rawPayload: event?.rawPayload ?? undefined,
        occurredAt: event?.occurredAt ? new Date(event.occurredAt) : new Date(),
      },
    });

    const type = String(event?.eventType || '').toLowerCase();
    if (['bounced', 'complained', 'unsubscribed'].includes(type)) {
      const channel = event?.recipientPhone ? 'sms' : 'email';
      const value =
        channel === 'sms'
          ? String(event?.recipientPhone || '')
          : String(event?.recipientEmail || '').toLowerCase();
      if (value) {
        await this.addSuppressionEntry(orgId, {
          channel,
          value,
          reason:
            type === 'bounced'
              ? 'bounce'
              : type === 'complained'
                ? 'complaint'
                : 'unsubscribed',
          source: `webhook:${provider}`,
        });
      }
    }

    return created;
  }

  async getDeliveryEvents(orgId: string, campaignId: string) {
    return (this.prisma as any).marketingDeliveryEvent.findMany({
      where: { orgId, campaignId: String(campaignId) },
      orderBy: { occurredAt: 'desc' },
      take: 500,
    });
  }

  async campaignEventAnalytics(orgId: string, campaignId: string) {
    const events = await this.getDeliveryEvents(orgId, campaignId);
    const campaignIdNum = Number(campaignId);
    const eventMetrics = events.length
      ? (() => {
          const count = (type: string) =>
            events.filter(
              (e: any) => String(e?.eventType || '').toLowerCase() === type,
            ).length;
          const recipients = new Set(
            events
              .map((e: any) =>
                String(
                  e?.recipientEmail ||
                    e?.recipientPhone ||
                    e?.recipientId ||
                    '',
                ),
              )
              .filter(Boolean),
          ).size;
          const sent = count('sent');
          const delivered = count('delivered');
          const opened = count('opened');
          const clicked = count('clicked');
          const bounced = count('bounced');
          const complained = count('complained');
          const unsubscribed = count('unsubscribed');
          const failed = count('failed');

          return {
            recipients,
            sent,
            delivered,
            opened,
            clicked,
            bounced,
            complained,
            unsubscribed,
            failed,
            openRate:
              delivered > 0
                ? Number(((opened / delivered) * 100).toFixed(1))
                : undefined,
            clickRate:
              delivered > 0
                ? Number(((clicked / delivered) * 100).toFixed(1))
                : undefined,
            bounceRate:
              sent > 0
                ? Number(((bounced / sent) * 100).toFixed(1))
                : undefined,
            unsubscribeRate:
              delivered > 0
                ? Number(((unsubscribed / delivered) * 100).toFixed(1))
                : undefined,
          };
        })()
      : {};

    if (!Number.isFinite(campaignIdNum) || campaignIdNum <= 0)
      return eventMetrics;

    const [opportunities, orders] = await Promise.all([
      this.odooClient.searchRead(
        this.leadModel,
        [
          ['campaign_id', '=', campaignIdNum],
          ['type', '=', 'opportunity'],
        ],
        ['id'],
        { limit: 10000, order: 'id desc' },
      ),
      this.odooClient.searchRead(
        this.salesOrderModel,
        [
          ['campaign_id', '=', campaignIdNum],
          ['state', 'in', ['sale', 'done']],
        ],
        ['id', 'amount_total'],
        { limit: 10000, order: 'id desc' },
      ),
    ]);

    const conversions = Array.isArray(opportunities)
      ? opportunities.length
      : undefined;
    const revenue = Array.isArray(orders)
      ? orders.reduce(
          (sum: number, row: any) => sum + Number(row?.amount_total || 0),
          0,
        )
      : undefined;

    return {
      ...eventMetrics,
      conversions,
      revenue,
    };
  }

  async updateCampaignContent(
    id: number,
    data: any,
    context?: { orgId?: string; userId?: string },
  ) {
    const mailing = await this.getOrCreateCampaignMailing(id);
    const payload: Record<string, any> = {};

    if (data?.subject !== undefined)
      payload.subject = String(data.subject || '').trim();
    if (data?.content !== undefined)
      payload.body_html = String(data.content || '');
    if (data?.segmentId !== undefined) {
      const segmentId = Number(data.segmentId);
      payload.contact_list_ids =
        Number.isFinite(segmentId) && segmentId > 0
          ? [[6, 0, [segmentId]]]
          : [[5, 0, 0]];
    }
    if (data?.senderEmail !== undefined)
      payload.reply_to = String(data.senderEmail || '').trim();

    if (Object.keys(payload).length > 0) {
      await this.odooClient.execute(this.mailingModel, 'write', [
        [mailing.id],
        payload,
      ]);
    }

    if (data?.templateId !== undefined && context?.orgId) {
      const templateId = Number(data.templateId);
      if (Number.isFinite(templateId) && templateId > 0) {
        const template = await this.getTemplate(templateId);
        if (template) {
          await this.storeTemplateUsage(context.orgId, {
            campaignId: String(id),
            templateId: String(templateId),
            templateNameSnapshot: String(template?.name || ''),
            subjectSnapshot: data?.subject ?? template?.subject ?? undefined,
            previewTextSnapshot: data?.previewText ?? undefined,
            contentSnapshot: data?.content ?? template?.body_html ?? undefined,
            appliedByUserId: context?.userId,
          });
        }
      }
    }

    await this.updateCampaign(id, {
      name: data?.name,
      title: data?.title,
      status: data?.status,
      active: data?.active,
    });

    return this.getCampaign(id);
  }

  // --- Segments (Mailing Lists) ---

  async listSegments() {
    try {
      this.logger.log(`Fetching segments from model: ${this.mailingListModel}`);

      // Step 1: Detect available fields to avoid Odoo errors
      const fieldsInfo = await this.odooClient.execute(
        this.mailingListModel,
        'fields_get',
        [[], ['name', 'contact_nbr', 'contact_count', 'is_public', 'active']],
      );
      const availableFields = Object.keys(fieldsInfo);

      this.logger.log(
        `Available fields for ${this.mailingListModel}: ${availableFields.join(', ')}`,
      );

      const requestedFields = ['id', 'name'];
      if (availableFields.includes('active')) requestedFields.push('active');
      if (availableFields.includes('contact_count'))
        requestedFields.push('contact_count');
      else if (availableFields.includes('contact_nbr'))
        requestedFields.push('contact_nbr');

      // Step 2: Fetch data with discovered fields
      const lists = await this.odooClient.searchRead(
        this.mailingListModel,
        [],
        requestedFields,
      );

      this.logger.log(`Found ${lists.length} segments in Odoo.`);
      return lists;
    } catch (error) {
      this.logger.error(
        `Failed to fetch segments: ${error.message}`,
        error.stack,
      );
      return [];
    }
  }

  async getSegment(id: number) {
    const [segment] = await this.odooClient.searchRead(
      this.mailingListModel,
      [['id', '=', id]],
      this.mailingListFields,
    );
    return segment;
  }

  async createSegment(data: any) {
    // Basic fields that are almost guaranteed to exist
    const payload: any = {
      name: data.name,
    };

    // Check fields before setting to avoid Odoo error
    try {
      const fieldsInfo = await this.odooClient.execute(
        this.mailingListModel,
        'fields_get',
        [[], ['active', 'is_public']],
      );
      if (fieldsInfo.active) payload.active = true;
      if (fieldsInfo.is_public) payload.is_public = data.isPublic !== false;
    } catch (e) {
      // Ignore if field detection fails
    }

    return this.odooClient.execute(this.mailingListModel, 'create', [payload]);
  }

  async updateSegment(id: number, data: any) {
    const payload: Record<string, any> = {};
    if (data.name) payload.name = data.name;

    try {
      const fieldsInfo = await this.odooClient.execute(
        this.mailingListModel,
        'fields_get',
        [[], ['is_public']],
      );
      if (fieldsInfo.is_public && data.isPublic !== undefined) {
        payload.is_public = data.isPublic;
      }
    } catch (e) {}

    return this.odooClient.execute(this.mailingListModel, 'write', [
      [id],
      payload,
    ]);
  }

  async deleteSegment(id: number) {
    return this.odooClient.execute(this.mailingListModel, 'unlink', [[id]]);
  }

  // --- Templates (Mail Templates) ---

  async listTemplates() {
    // Filter by model if possible, usually 'mailing.mailing' or 'res.partner'
    return this.odooClient.searchRead(
      this.templateModel,
      [],
      this.templateFields,
      { limit: 50 },
    );
  }

  async getTemplate(id: number) {
    const [template] = await this.odooClient.searchRead(
      this.templateModel,
      [['id', '=', id]],
      this.templateFields,
    );
    return template;
  }

  async createTemplate(data: any) {
    const payload: Record<string, any> = {
      name: String(data?.name || '').trim(),
      subject: String(data?.subject || '').trim(),
      body_html: String(data?.content || ''),
    };
    return this.odooClient.execute(this.templateModel, 'create', [payload]);
  }

  async updateTemplate(id: number, data: any) {
    const payload: Record<string, any> = {};
    if (data?.name !== undefined) payload.name = String(data.name || '').trim();
    if (data?.subject !== undefined)
      payload.subject = String(data.subject || '').trim();
    if (data?.content !== undefined)
      payload.body_html = String(data.content || '');
    if (Object.keys(payload).length === 0) return true;
    return this.odooClient.execute(this.templateModel, 'write', [
      [id],
      payload,
    ]);
  }

  async deleteTemplate(id: number) {
    return this.odooClient.execute(this.templateModel, 'unlink', [[id]]);
  }

  async duplicateTemplate(id: number) {
    return this.odooClient.execute(this.templateModel, 'copy', [[id]]);
  }

  // --- Dashboard & Analytics ---

  async analytics(filters?: { dateFrom?: string; dateTo?: string }) {
    const leadDateDomain: any[] = [];
    const orderDateDomain: any[] = [];
    if (filters?.dateFrom) {
      leadDateDomain.push(['create_date', '>=', filters.dateFrom]);
      orderDateDomain.push(['date_order', '>=', filters.dateFrom]);
    }
    if (filters?.dateTo) {
      leadDateDomain.push(['create_date', '<=', filters.dateTo]);
      orderDateDomain.push(['date_order', '<=', filters.dateTo]);
    }
    const [
      totalCampaigns,
      activeCampaigns,
      totalSources,
      totalMediums,
      totalLeads,
      totalOpportunities,
      salesRows,
    ] = await Promise.all([
      this.odooClient.execute(this.campaignModel, 'search_count', [[]]),
      this.odooClient.execute(this.campaignModel, 'search_count', [
        [['active', '=', true]],
      ]),
      this.odooClient.execute(this.sourceModel, 'search_count', [[]]),
      this.odooClient.execute(this.mediumModel, 'search_count', [[]]),
      this.odooClient.execute(this.leadModel, 'search_count', [
        [['type', '=', 'lead'], ...leadDateDomain],
      ]),
      this.odooClient.execute(this.leadModel, 'search_count', [
        [['type', '=', 'opportunity'], ...leadDateDomain],
      ]),
      this.odooClient.searchRead(
        this.salesOrderModel,
        orderDateDomain,
        ['amount_total', 'state', 'date_order'],
        { limit: 300, order: 'id desc' },
      ),
    ]);

    const wonSales = Array.isArray(salesRows)
      ? salesRows.filter((row: any) =>
          ['sale', 'done'].includes(String(row?.state || '').toLowerCase()),
        )
      : [];
    const revenue = wonSales.reduce(
      (sum: number, row: any) => sum + Number(row?.amount_total || 0),
      0,
    );
    const conversionRate =
      totalLeads > 0
        ? Number(((totalOpportunities / totalLeads) * 100).toFixed(2))
        : 0;

    return {
      totalCampaigns: Number(totalCampaigns || 0),
      activeCampaigns: Number(activeCampaigns || 0),
      totalSources: Number(totalSources || 0),
      totalMediums: Number(totalMediums || 0),
      totalLeads: Number(totalLeads || 0),
      totalOpportunities: Number(totalOpportunities || 0),
      conversionRate,
      wonOrders: wonSales.length,
      revenue,
      avgRevenuePerWonOrder: wonSales.length
        ? Number((revenue / wonSales.length).toFixed(2))
        : 0,
    };
  }

  async campaignInsights(id: number, paginationDto: PaginationDto) {
    const page = paginationDto.page ?? 1;
    const pageSize = paginationDto.pageSize ?? 20;
    const leadFields = [
      'id',
      'name',
      'email_from',
      'phone',
      'type',
      'stage_id',
      'expected_revenue',
      'create_date',
    ];
    const orderFields = [
      'id',
      'name',
      'partner_id',
      'state',
      'amount_total',
      'date_order',
    ];

    const leadDomain: any[] = [['campaign_id', '=', id]];
    const orderDomain: any[] = [['campaign_id', '=', id]];

    const [leads, leadsTotal, orders, ordersTotal] = await Promise.all([
      this.odooClient.searchRead(this.leadModel, leadDomain, leadFields, {
        offset: (page - 1) * pageSize,
        limit: pageSize,
        order: 'create_date desc',
      }),
      this.odooClient.execute(this.leadModel, 'search_count', [leadDomain]),
      this.odooClient.searchRead(
        this.salesOrderModel,
        orderDomain,
        orderFields,
        {
          offset: (page - 1) * pageSize,
          limit: pageSize,
          order: 'date_order desc',
        },
      ),
      this.odooClient.execute(this.salesOrderModel, 'search_count', [
        orderDomain,
      ]),
    ]);

    return {
      leads,
      leadsTotal: Number(leadsTotal || 0),
      orders,
      ordersTotal: Number(ordersTotal || 0),
    };
  }

  // --- Sources & Mediums ---

  async listSources(paginationDto: PaginationDto) {
    const page = paginationDto.page ?? 1;
    const pageSize = paginationDto.pageSize ?? 100;
    const search = paginationDto.search;
    const domain: any[] = search ? [['name', 'ilike', search]] : [];

    const [data, total] = await Promise.all([
      this.odooClient.searchRead(this.sourceModel, domain, this.sourceFields, {
        offset: (page - 1) * pageSize,
        limit: pageSize,
        order: 'name asc',
      }),
      this.odooClient.execute(this.sourceModel, 'search_count', [domain]),
    ]);

    return { data, total };
  }

  createSource(data: any) {
    const payload = {
      name: String(data?.name || '').trim(),
      active: data?.active !== false,
    };
    return this.odooClient.execute(this.sourceModel, 'create', [payload]);
  }

  updateSource(id: number, data: any) {
    const payload: Record<string, any> = {};
    if (data?.name !== undefined) payload.name = String(data.name).trim();
    if (data?.active !== undefined) payload.active = Boolean(data.active);
    return this.odooClient.execute(this.sourceModel, 'write', [[id], payload]);
  }

  deleteSource(id: number) {
    return this.odooClient.execute(this.sourceModel, 'unlink', [[id]]);
  }

  removeSource(id: number) {
    return this.deleteSource(id);
  }

  async listMediums(paginationDto: PaginationDto) {
    const page = paginationDto.page ?? 1;
    const pageSize = paginationDto.pageSize ?? 100;
    const search = paginationDto.search;
    const domain: any[] = search ? [['name', 'ilike', search]] : [];

    const [data, total] = await Promise.all([
      this.odooClient.searchRead(this.mediumModel, domain, this.mediumFields, {
        offset: (page - 1) * pageSize,
        limit: pageSize,
        order: 'name asc',
      }),
      this.odooClient.execute(this.mediumModel, 'search_count', [domain]),
    ]);

    return { data, total };
  }

  createMedium(data: any) {
    const payload = {
      name: String(data?.name || '').trim(),
      active: data?.active !== false,
    };
    return this.odooClient.execute(this.mediumModel, 'create', [payload]);
  }

  updateMedium(id: number, data: any) {
    const payload: Record<string, any> = {};
    if (data?.name !== undefined) payload.name = String(data.name).trim();
    if (data?.active !== undefined) payload.active = Boolean(data.active);
    return this.odooClient.execute(this.mediumModel, 'write', [[id], payload]);
  }

  deleteMedium(id: number) {
    return this.odooClient.execute(this.mediumModel, 'unlink', [[id]]);
  }

  removeMedium(id: number) {
    return this.deleteMedium(id);
  }
}
