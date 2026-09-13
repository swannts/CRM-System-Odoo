import { Injectable, BadRequestException } from '@nestjs/common';
import { OdooClientService } from '../odoo-base/odoo-client.service.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { CreateContactDto, UpdateContactDto } from './dto/contact.dto.js';
import { PrismaService } from '../../database/prisma/prisma.service.js';
import { parse } from 'csv-parse/sync';

@Injectable()
export class ContactsService {
  private readonly model = 'res.partner';
  private readonly defaultFields = [
    'id',
    'name',
    'email',
    'phone',
    'mobile',
    'is_company',
    'street',
    'city',
    'zip',
    'country_id',
    'supplier_rank',
    'employee',
    'parent_id',
    'website',
    'vat',
    'create_date',
    'write_date',
    'child_ids',
    'active',
  ];

  async import(file: Express.Multer.File) {
    if (!file?.buffer || !file.originalname?.toLowerCase().endsWith('.csv')) throw new BadRequestException('Upload a CSV file.');
    if (file.buffer.length > 5 * 1024 * 1024) throw new BadRequestException('CSV files must be 5 MB or smaller.');
    let records: Record<string, string>[];
    try {
      records = parse(file.buffer.toString('utf8'), { columns: true, bom: true, skip_empty_lines: true, trim: true, max_record_size: 10000 });
    } catch { throw new BadRequestException('Invalid CSV. Check headers, quotes, and column counts.'); }
    if (!records.length || records.length > 5000) throw new BadRequestException('Import between 1 and 5000 contacts per file.');
    const results: any[] = [];
    const seenEmails = new Set<string>();
    for (const [index, record] of records.entries()) {
      const name = (record.Name || record.name || record.fullName || record.FullName || '').trim();
      const email = (record.Email || record.email || '').trim().toLowerCase();
      try {
        if (!name || name.length > 200) throw new Error('Name is required and must be at most 200 characters.');
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Invalid email address.');
        if (email && seenEmails.has(email)) {
          results.push({ row: index + 2, name, success: false, skipped: true, error: 'Duplicate email in this file.' });
          continue;
        }
        if (email) {
          const existing = await this.odooClient.searchRead(this.model, [['email', '=ilike', email]], ['id'], { limit: 1 });
          if (existing.length) {
            results.push({ row: index + 2, name, success: false, skipped: true, error: 'A contact with this email already exists.' });
            seenEmails.add(email);
            continue;
          }
        }
        const created = await this.create({ name, email: email || undefined,
          phone: record.Phone || record.phone, mobile: record.Mobile || record.mobile,
          is_company: String(record.IsCompany || record.is_company || record.isCompany).toLowerCase() === 'true',
          street: record.Street || record.street, city: record.City || record.city, vat: record.VAT || record.vat,
        });
        if (email) seenEmails.add(email);
        results.push({ row: index + 2, name, success: true, id: created });
      } catch (error: any) {
        results.push({ row: index + 2, name, success: false, error: error.message || 'Unable to import row.' });
      }
    }
    return results;
  }

  constructor(
    private readonly odooClient: OdooClientService,
    private readonly prisma: PrismaService,
  ) {}

  private async buildDomain(search?: string, type?: string, includeArchived = false): Promise<any[]> {
    const domain: any[] = [];
    if (!includeArchived) {
      domain.push(['active', '=', true]);
    }
    const normalizedType = String(type || '').toLowerCase();

    if (search) {
      domain.push(
        '|',
        ['name', 'ilike', `%${search}%`],
        ['email', 'ilike', `%${search}%`],
      );
    }

    if (normalizedType) {
      const tabStatuses: Record<string, string[]> = {
        lead: ['lead'],
        member: ['member', 'qualified'],
        client: ['client'],
        vendor: ['vendor'],
        employee: ['employee'],
      };

      const statusAliases = tabStatuses[normalizedType];
      if (statusAliases) {
        const statusMaps = await this.prisma.contactMap.findMany({
          where: {
            OR: statusAliases.map((status) => ({
              status: {
                equals: status,
                mode: 'insensitive',
              },
            })),
          },
          select: { odooId: true },
        });

        const odooIds = statusMaps.map(
          (item: { odooId: number }) => item.odooId,
        );
        if (odooIds.length === 0) {
          return [['id', '=', 0]];
        }

        domain.push(['id', 'in', odooIds]);
      }
    }

    return domain;
  }

  async findAll(paginationDto: PaginationDto) {
    const page = paginationDto.page ?? 1;
    const pageSize = paginationDto.pageSize ?? 10;
    const search = paginationDto.search;
    const type = paginationDto.type;
    const includeArchived = paginationDto.active === false;

    const domain = await this.buildDomain(search, type, includeArchived);

    const total = await this.odooClient.execute(this.model, 'search_count', [domain]);
    const offset = (page - 1) * pageSize;

    let data = await this.odooClient.searchRead(this.model, domain, this.defaultFields, {
      offset,
      limit: pageSize,
      order: 'write_date desc',
    });

    // Defensive fallback: in some Odoo states search_count may be non-zero while
    // the ordered search_read page returns empty; retry with a simpler order.
    if (total > 0 && Array.isArray(data) && data.length === 0) {
      data = await this.odooClient.searchRead(this.model, domain, this.defaultFields, {
        offset,
        limit: pageSize,
        order: 'id desc',
      });
    }

    const dataWithUuids = await Promise.all(
      data.map(async (c: any) => {
        const map = (await this.prisma.contactMap.findUnique({
          where: { odooId: c.id },
        })) as any;

        // If no map exists, create one (lazy initialization)
        let uuid = map?.uuid;
        let status = map?.status || 'new';

        if (!map) {
          const newMap = (await this.prisma.contactMap.create({
            data: { odooId: c.id },
          })) as any;
          uuid = newMap.uuid;
          status = newMap.status || 'new';
        }

        return {
          ...c,
          uuid,
          status,
        };
      }),
    );

    return {
      data: dataWithUuids,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getCompanies(paginationDto: PaginationDto) {
    const page = paginationDto.page ?? 1;
    const pageSize = paginationDto.pageSize ?? 10;
    const search = paginationDto.search;

    const domain: any[] = [['is_company', '=', true], ['active', '=', true]];
    if (search) {
      domain.push(['name', 'ilike', `%${search}%`]);
    }

    const [data, total] = await Promise.all([
      this.odooClient.searchRead(this.model, domain, this.defaultFields, {
        offset: (page - 1) * pageSize,
        limit: pageSize,
        order: 'name asc',
      }),
      this.odooClient.execute(this.model, 'search_count', [domain]),
    ]);

    const normalizedData = data.map((c: any) => this.normalizePartner(c));

    return {
      data: normalizedData,
      total,
      page,
      pageSize,
      totalPages: total > 0 ? Math.ceil(total / pageSize) : 0,
    };
  }

  async findCompany(id: number) {
    const [company] = await this.odooClient.searchRead(
      this.model,
      [['id', '=', id], ['is_company', '=', true], ['active', '=', true]],
      this.defaultFields,
    );
    if (!company) return null;
    return this.normalizePartner(company);
  }

  async createCompany(data: any) {
    return this.create({
      ...data,
      isCompany: true,
    });
  }

  async updateCompany(id: number, data: any) {
    return this.update(id, data);
  }

  async removeCompany(id: number) {
    return this.update(id, { active: false } as any);
  }

  async getCompanyContacts(id: number) {
    const contacts = await this.odooClient.searchRead(
      this.model,
      [['parent_id', '=', id]],
      this.defaultFields,
    );
    return contacts.map((c: any) => this.normalizePartner(c));
  }

  async linkCompany(contactId: number, companyId: number) {
    return this.odooClient.execute(this.model, 'write', [[contactId], { parent_id: companyId }]);
  }

  async unlinkCompany(contactId: number) {
    return this.odooClient.execute(this.model, 'write', [[contactId], { parent_id: false }]);
  }

  private normalizePartner(partner: any) {
    return {
      id: partner.id, // We'll handle UUID mapping in the controllers if needed, but Odoo ID is fine for canonical API
      odooId: partner.id,
      name: partner.name,
      email: partner.email || undefined,
      phone: partner.phone || undefined,
      mobile: partner.mobile || undefined,
      website: partner.website || undefined,
      vat: partner.vat || undefined,
      isCompany: partner.is_company,
      parentId: partner.parent_id ? partner.parent_id[0] : undefined,
      parentName: partner.parent_id ? partner.parent_id[1] : undefined,
      address: {
        street: partner.street || undefined,
        city: partner.city || undefined,
        zip: partner.zip || undefined,
        country: partner.country_id ? partner.country_id[1] : undefined,
      },
      contactCount: Array.isArray(partner.child_ids) ? partner.child_ids.length : 0,
      active: partner.active,
      createdAt: partner.create_date,
      updatedAt: partner.write_date,
    };
  }

  async getAnalytics(paginationDto: PaginationDto) {
    const search = paginationDto.search;
    const type = paginationDto.type;
    const domain = await this.buildDomain(search, type);

    const contacts = await this.odooClient.searchRead(
      this.model,
      domain,
      ['id', 'is_company', 'create_date'],
      { limit: 2000, order: 'create_date asc' },
    );

    const contactIds = contacts.map((contact: any) => contact.id);
    const statusMaps = contactIds.length
      ? await this.prisma.contactMap.findMany({
          where: {
            odooId: { in: contactIds },
          },
          select: {
            odooId: true,
            status: true,
          },
        })
      : [];

    const statusByOdooId = new Map<number, string>();
    statusMaps.forEach((item: { odooId: number; status: string | null }) => {
      statusByOdooId.set(item.odooId, item.status || 'new');
    });

    const statusCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};

    contacts.forEach((contact: any) => {
      const status = String(
        statusByOdooId.get(contact.id) || 'new',
      ).toLowerCase();
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      const contactType = contact.is_company ? 'Company' : 'Client';
      typeCounts[contactType] = (typeCounts[contactType] || 0) + 1;
    });

    const now = new Date();
    const monthKeys: string[] = [];
    for (let i = 5; i >= 0; i -= 1) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthKeys.push(
        `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`,
      );
    }

    const monthlyCounts: Record<string, number> = {};
    monthKeys.forEach((key) => {
      monthlyCounts[key] = 0;
    });

    contacts.forEach((contact: any) => {
      const createdAt = new Date(contact?.create_date || Date.now());
      if (Number.isNaN(createdAt.getTime())) return;
      const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (Object.prototype.hasOwnProperty.call(monthlyCounts, key)) {
        monthlyCounts[key] += 1;
      }
    });

    return {
      totalContacts: contacts.length,
      statusDistribution: Object.entries(statusCounts).map(
        ([label, value]) => ({
          label,
          value,
        }),
      ),
      typeDistribution: Object.entries(typeCounts).map(([label, value]) => ({
        label,
        value,
      })),
      monthlyCreated: monthKeys.map((key) => ({
        month: key,
        value: monthlyCounts[key],
      })),
    };
  }

  async findOne(id: number) {
    const [contact] = await this.odooClient.searchRead(
      this.model,
      [['id', '=', id]],
      this.defaultFields,
    );
    if (!contact) return null;

    const map = (await this.prisma.contactMap.findUnique({
      where: { odooId: id },
    })) as any;

    // Lazy create map if missing
    let uuid = map?.uuid;
    let status = map?.status || 'new';

    if (!map) {
      const newMap = (await this.prisma.contactMap.create({
        data: { odooId: id },
      })) as any;
      uuid = newMap.uuid;
      status = newMap.status || 'new';
    }

    // Calculate insights
    const [orders, tasks, activities, shifts] = await Promise.all([
      this.getOrders(id),
      this.getTasks(id),
      this.getActivities(id),
      this.getShifts(id, { page: 1, pageSize: 1 }),
    ]);

    const totalSpent = orders
      .filter((o: any) => o.state === 'sale' || o.state === 'done')
      .reduce((acc: number, curr: any) => acc + curr.amount_total, 0);

    const completedTasks = tasks.filter((t: any) => t.status === 'done').length;
    const engagement =
      tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    const lastActivity =
      activities[0]?.createdAt ||
      shifts.data?.[0]?.clockIn ||
      contact.write_date ||
      contact.create_date;

    return {
      ...contact,
      uuid,
      status,
      insights: {
        totalSpent,
        engagement,
        lastActive: lastActivity,
        totalTasks: tasks.length,
        completedTasks,
        totalOrders: orders.length,
      },
    };
  }

  async findByUuid(uuid: string) {
    const map = (await this.prisma.contactMap.findUnique({
      where: { uuid },
    })) as any;
    if (!map) return null;
    return this.findOne(map.odooId);
  }

  async resolveUuid(uuid: string): Promise<number | null> {
    const map = (await this.prisma.contactMap.findUnique({
      where: { uuid },
    })) as any;
    return map?.odooId ?? null;
  }

  // --- Pets ---
  async getPets(id: number) {
    return this.prisma.pet.findMany({ where: { contactId: id } });
  }
  async createPet(id: number, data: any) {
    return this.prisma.pet.create({ data: { ...data, contactId: id } });
  }
  async removePet(petId: string) {
    return this.prisma.pet.delete({ where: { id: petId } });
  }

  async updatePet(petId: string, data: any) {
    return this.prisma.pet.update({ where: { id: petId }, data });
  }

  // --- Files ---
  async getFiles(id: number) {
    return this.prisma.contactFile.findMany({ where: { contactId: id } });
  }
  async createFile(id: number, data: any) {
    return this.prisma.contactFile.create({ data: { ...data, contactId: id } });
  }
  async removeFile(fileId: string) {
    return this.prisma.contactFile.delete({ where: { id: fileId } });
  }

  // --- Tasks ---
  async getTasks(id: number) {
    return this.prisma.contactTask.findMany({ where: { contactId: id } });
  }
  async createTask(id: number, data: any) {
    return this.prisma.contactTask.create({ data: { ...data, contactId: id } });
  }
  async removeTask(taskId: string) {
    return this.prisma.contactTask.delete({ where: { id: taskId } });
  }

  async updateTask(taskId: string, data: any) {
    return this.prisma.contactTask.update({ where: { id: taskId }, data });
  }

  async create(data: CreateContactDto) {
    const normalized: any = {
      ...data,
      name: (data as any).name ?? (data as any).fullName,
      is_company: (data as any).is_company ?? (data as any).isCompany ?? false,
    };

    delete normalized.fullName;
    delete normalized.isCompany;

    const createdId = await this.odooClient.execute(this.model, 'create', [
      normalized,
    ]);

    if (typeof createdId === 'number') {
      await this.prisma.contactMap.upsert({
        where: { odooId: createdId },
        update: { status: String((data as any).status || 'new').toLowerCase() },
        create: {
          odooId: createdId,
          status: String((data as any).status || 'new').toLowerCase(),
        },
      });
    }

    return createdId;
  }

  async update(id: number, data: UpdateContactDto) {
    const { status, ...odooData } = data;

    // Update local status if provided
    if (status) {
      await (this.prisma.contactMap as any).upsert({
        where: { odooId: id },
        update: { status: String(status).toLowerCase() },
        create: { odooId: id, status: String(status).toLowerCase() },
      });
    }

    // Update Odoo if there's other data
    if (Object.keys(odooData).length > 0) {
      return this.odooClient.execute(this.model, 'write', [[id], odooData]);
    }

    return { id, status };
  }

  async remove(id: number) {
    await this.odooClient.execute(this.model, 'write', [[id], { active: false }]);
    return { id, archived: true };
  }

  async getOrders(id: number) {
    return this.odooClient.searchRead(
      'sale.order',
      [['partner_id', '=', id]],
      ['id', 'name', 'date_order', 'amount_total', 'state', 'invoice_status'],
      { order: 'date_order desc' },
    );
  }

  async getProjects(id: number) {
    return this.odooClient.searchRead(
      'project.project',
      [['partner_id', '=', id]],
      ['id', 'name', 'label_tasks', 'allow_timesheets', 'create_date'],
      { order: 'create_date desc' },
    );
  }

  // --- Activities ---
  async getActivities(id: number) {
    return this.prisma.contactActivity.findMany({
      where: { contactId: id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createActivity(contactId: number, data: any) {
    return this.prisma.contactActivity.create({
      data: {
        contactId,
        ...data,
      },
    });
  }

  async updateActivity(id: string, data: any) {
    return this.prisma.contactActivity.update({
      where: { id },
      data,
    });
  }

  async removeActivity(id: string) {
    await this.prisma.contactActivity.delete({
      where: { id },
    });
    return { id, archived: true };
  }

  // --- Shifts / Attendance ---
  async getShifts(id: number, paginationDto: PaginationDto) {
    const page = paginationDto.page ?? 1;
    const pageSize = paginationDto.pageSize ?? 10;

    const [data, total] = await Promise.all([
      this.prisma.contactShift.findMany({
        where: { contactId: id },
        orderBy: { clockIn: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.contactShift.count({
        where: { contactId: id },
      }),
    ]);
    return { data, total };
  }

  async clockIn(id: number) {
    return this.prisma.contactShift.create({
      data: { contactId: id, clockIn: new Date(), status: 'Approved' },
    });
  }

  async clockOut(shiftId: string) {
    return this.prisma.contactShift.update({
      where: { id: shiftId },
      data: { clockOut: new Date() },
    });
  }

  // --- Odoo Timeline & Notes ---
  async getTimeline(id: number) {
    const [messages, activities] = await Promise.all([
      this.odooClient.searchRead(
        'mail.message',
        [
          ['res_id', '=', id],
          ['model', '=', this.model],
        ],
        ['id', 'body', 'date', 'author_id', 'message_type', 'subtype_id'],
        { order: 'date desc', limit: 50 },
      ),
      this.odooClient.searchRead(
        'mail.activity',
        [
          ['res_id', '=', id],
          ['res_model', '=', this.model],
        ],
        [
          'id',
          'summary',
          'note',
          'date_deadline',
          'activity_type_id',
          'user_id',
          'state',
        ],
        { order: 'date_deadline desc', limit: 20 },
      ),
    ]);

    // Combine and normalize
    const timeline = [
      ...messages.map((m: any) => ({
        id: `msg-${m.id}`,
        type: 'message',
        date: m.date,
        body: m.body,
        author: m.author_id ? m.author_id[1] : 'System',
        messageType: m.message_type,
      })),
      ...activities.map((a: any) => ({
        id: `act-${a.id}`,
        type: 'activity',
        date: a.date_deadline,
        summary: a.summary,
        note: a.note,
        state: a.state,
        activityType: a.activity_type_id ? a.activity_type_id[1] : 'Activity',
        assignedTo: a.user_id ? a.user_id[1] : 'Unassigned',
      })),
    ];

    return timeline.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }

  async createNote(id: number, body: string) {
    return this.odooClient.execute('mail.message', 'create', [
      {
        body,
        res_id: id,
        model: this.model,
        message_type: 'comment',
        subtype_id: 1, // Note subtype usually 1
      },
    ]);
  }
}
