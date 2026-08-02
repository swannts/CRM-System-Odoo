import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OdooClientService } from '../odoo-base/odoo-client.service.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';
import { PrismaService } from '../../database/prisma/prisma.service.js';

@Injectable()
export class EmployeesService {
  private readonly hrEmployeeModel = 'hr.employee';
  private readonly fallbackEmployeeModel = 'res.partner';
  private readonly departmentModel = 'hr.department';
  private readonly jobModel = 'hr.job';
  private readonly attendanceModel = 'hr.attendance';
  private readonly leaveTypeModel = 'hr.leave.type';
  private readonly leaveModel = 'hr.leave';
  private readonly planningModel = 'planning.slot';
  private readonly groupsModel = 'res.groups';
  private readonly usersModel = 'res.users';
  private readonly configParamModel = 'ir.config_parameter';
  private static readonly mockSettingsStore = new Map<string, string>();

  private readonly employeeFields = [
    'id',
    'name',
    'work_email',
    'work_phone',
    'mobile_phone',
    'job_title',
    'department_id',
    'company_id',
    'user_id',
    'resource_id',
    'active',
    'create_date',
    'write_date',
  ];

  private readonly fallbackEmployeeFields = [
    'id',
    'name',
    'email',
    'phone',
    'mobile',
    'function',
    'employee',
    'active',
    'create_date',
    'write_date',
  ];

  constructor(
    private readonly odooClient: OdooClientService,
    private readonly prisma: PrismaService,
  ) {}

  private normalizeEmployee(record: any) {
    return {
      id: record?.id,
      name: record?.name ?? 'Unnamed employee',
      work_email: record?.work_email ?? record?.email ?? '',
      work_phone: record?.work_phone ?? record?.phone ?? '',
      mobile_phone: record?.mobile_phone ?? record?.mobile ?? '',
      job_title: record?.job_title ?? record?.function ?? '',
      department_id: record?.department_id ?? null,
      company_id: record?.company_id ?? null,
      user_id: record?.user_id ?? null,
      resource_id: record?.resource_id ?? null,
      active: record?.active !== false,
      create_date: record?.create_date ?? null,
      write_date: record?.write_date ?? null,
    };
  }

  private async listModel(
    model: string,
    domain: any[],
    fields: string[],
    page: number,
    pageSize: number,
    order = 'write_date desc',
  ) {
    const [data, total] = await Promise.all([
      this.odooClient.searchRead(model, domain, fields, {
        offset: (page - 1) * pageSize,
        limit: pageSize,
        order,
      }),
      this.odooClient.execute(model, 'search_count', [domain]),
    ]);

    const totalNumber = Number(total ?? 0);
    return {
      data,
      total: totalNumber,
      page,
      pageSize,
      totalPages: totalNumber > 0 ? Math.ceil(totalNumber / pageSize) : 0,
    };
  }

  private parseActiveFilter(rawType?: string): boolean | undefined {
    if (rawType === 'active') return true;
    if (rawType === 'inactive') return false;
    return undefined;
  }

  private getSettingsKey(orgId: string, key: string) {
    return `crm.employees.settings.${orgId}.${key}`;
  }

  private normalizeRole(record: any) {
    return {
      id: String(record?.id ?? ''),
      name: String(record?.name ?? 'Unnamed role'),
      description:
        typeof record?.comment === 'string' ? record.comment : undefined,
      system: true,
    };
  }

  private async resolveEmployeeUserId(employeeId: number): Promise<number> {
    try {
      const [employee] = await this.odooClient.searchRead(
        this.hrEmployeeModel,
        [['id', '=', employeeId]],
        ['id', 'user_id'],
        { limit: 1 },
      );
      const userId = Array.isArray(employee?.user_id)
        ? Number(employee.user_id[0])
        : Number(employee?.user_id);
      if (Number.isFinite(userId) && userId > 0) return userId;
    } catch {
      // Continue to explicit failure.
    }
    throw new BadRequestException('Employee is not linked to a user account.');
  }

  private async getConfigParam(key: string): Promise<string | null> {
    try {
      const value = await this.odooClient.execute(
        this.configParamModel,
        'get_param',
        [key],
      );
      if (typeof value === 'string') return value;
      if (value === false || value == null) return null;
      return EmployeesService.mockSettingsStore.get(key) ?? null;
    } catch {
      return EmployeesService.mockSettingsStore.get(key) ?? null;
    }
  }

  private async setConfigParam(key: string, value: string): Promise<void> {
    try {
      await this.odooClient.execute(this.configParamModel, 'set_param', [
        key,
        value,
      ]);
    } catch {
      // In mock mode we still persist in-process for deterministic API behavior.
    }
    EmployeesService.mockSettingsStore.set(key, value);
  }

  async findAll(paginationDto: PaginationDto) {
    const page = paginationDto.page ?? 1;
    const pageSize = paginationDto.pageSize ?? 50;
    const search = paginationDto.search;
    const activeFilter = this.parseActiveFilter(paginationDto.type);

    const domain: any[] = [];
    if (search) domain.push(['name', 'ilike', `%${search}%`]);
    if (activeFilter !== undefined) domain.push(['active', '=', activeFilter]);

    try {
      const result = await this.listModel(
        this.hrEmployeeModel,
        domain,
        this.employeeFields,
        page,
        pageSize,
      );
      return {
        ...result,
        data: result.data.map((item: any) => this.normalizeEmployee(item)),
      };
    } catch {
      const fallbackDomain: any[] = [['employee', '=', true]];
      if (search) {
        fallbackDomain.push(
          '|',
          ['name', 'ilike', `%${search}%`],
          ['email', 'ilike', `%${search}%`],
        );
      }
      if (activeFilter !== undefined)
        fallbackDomain.push(['active', '=', activeFilter]);

      const result = await this.listModel(
        this.fallbackEmployeeModel,
        fallbackDomain,
        this.fallbackEmployeeFields,
        page,
        pageSize,
      );
      return {
        ...result,
        data: result.data.map((item: any) => this.normalizeEmployee(item)),
      };
    }
  }

  async findOne(id: number) {
    try {
      const [employee] = await this.odooClient.searchRead(
        this.hrEmployeeModel,
        [['id', '=', id]],
        this.employeeFields,
        { limit: 1 },
      );
      if (employee) return this.normalizeEmployee(employee);
    } catch {
      // no-op, fallback below
    }

    const [fallbackEmployee] = await this.odooClient.searchRead(
      this.fallbackEmployeeModel,
      [['id', '=', id]],
      this.fallbackEmployeeFields,
      { limit: 1 },
    );
    return fallbackEmployee ? this.normalizeEmployee(fallbackEmployee) : null;
  }

  async create(data: any) {
    const payload = {
      name: data?.name ?? data?.fullName,
      work_email: data?.work_email ?? data?.email ?? false,
      work_phone: data?.work_phone ?? data?.phone ?? false,
      mobile_phone: data?.mobile_phone ?? data?.mobile ?? false,
      job_title: data?.job_title ?? data?.jobTitle ?? false,
      department_id: data?.department_id ?? data?.departmentId ?? false,
      active: data?.active ?? true,
    };

    try {
      return this.odooClient.execute(this.hrEmployeeModel, 'create', [payload]);
    } catch {
      return this.odooClient.execute(this.fallbackEmployeeModel, 'create', [
        {
          name: payload.name,
          email: payload.work_email,
          phone: payload.work_phone,
          mobile: payload.mobile_phone,
          function: payload.job_title,
          employee: true,
          active: payload.active,
        },
      ]);
    }
  }

  async update(id: number, data: any) {
    const payload = {
      name: data?.name ?? data?.fullName,
      work_email: data?.work_email ?? data?.email,
      work_phone: data?.work_phone ?? data?.phone,
      mobile_phone: data?.mobile_phone ?? data?.mobile,
      job_title: data?.job_title ?? data?.jobTitle,
      department_id: data?.department_id ?? data?.departmentId,
      active: data?.active,
    };

    const cleanedPayload = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined),
    );

    try {
      return this.odooClient.execute(this.hrEmployeeModel, 'write', [
        [id],
        cleanedPayload,
      ]);
    } catch {
      const fallbackPayload = {
        name: cleanedPayload.name,
        email: cleanedPayload.work_email,
        phone: cleanedPayload.work_phone,
        mobile: cleanedPayload.mobile_phone,
        function: cleanedPayload.job_title,
        active: cleanedPayload.active,
      };

      const cleanedFallback = Object.fromEntries(
        Object.entries(fallbackPayload).filter(
          ([, value]) => value !== undefined,
        ),
      );
      return this.odooClient.execute(this.fallbackEmployeeModel, 'write', [
        [id],
        cleanedFallback,
      ]);
    }
  }

  async updateStatus(id: number, status: 'active' | 'inactive') {
    const active = status === 'active';
    try {
      return this.odooClient.execute(this.hrEmployeeModel, 'write', [
        [id],
        { active },
      ]);
    } catch {
      return this.odooClient.execute(this.fallbackEmployeeModel, 'write', [
        [id],
        { active },
      ]);
    }
  }

  async remove(id: number) {
    try {
      await this.odooClient.execute(this.hrEmployeeModel, 'write', [[id], { active: false }]);
    } catch {
      await this.odooClient.execute(this.fallbackEmployeeModel, 'write', [[id], { active: false }]);
    }
    return { id, archived: true };
  }

  async getDepartments(paginationDto: PaginationDto) {
    const page = paginationDto.page ?? 1;
    const pageSize = paginationDto.pageSize ?? 50;
    const search = paginationDto.search;
    const domain: any[] = search ? [['name', 'ilike', `%${search}%`]] : [];

    return this.listModel(
      this.departmentModel,
      domain,
      ['id', 'name', 'manager_id', 'parent_id', 'company_id', 'active'],
      page,
      pageSize,
      'name asc',
    );
  }

  async createDepartment(data: any) {
    return this.odooClient.execute(this.departmentModel, 'create', [
      {
        name: data?.name,
        manager_id: data?.manager_id ?? data?.managerId ?? false,
        parent_id: data?.parent_id ?? data?.parentId ?? false,
        company_id: data?.company_id ?? data?.companyId ?? false,
      },
    ]);
  }

  async getJobs(paginationDto: PaginationDto) {
    const page = paginationDto.page ?? 1;
    const pageSize = paginationDto.pageSize ?? 50;
    const search = paginationDto.search;
    const domain: any[] = search ? [['name', 'ilike', `%${search}%`]] : [];

    return this.listModel(
      this.jobModel,
      domain,
      ['id', 'name', 'department_id', 'no_of_recruitment', 'active'],
      page,
      pageSize,
      'name asc',
    );
  }

  async createJob(data: any) {
    return this.odooClient.execute(this.jobModel, 'create', [
      {
        name: data?.name,
        department_id: data?.department_id ?? data?.departmentId ?? false,
        no_of_recruitment:
          data?.no_of_recruitment ?? data?.noOfRecruitment ?? 1,
      },
    ]);
  }

  async getAttendanceByEmployee(employeeId: number, query: any) {
    const page = Number(query?.page ?? 1);
    const pageSize = Number(query?.pageSize ?? 50);
    const startDate = query?.startDate;
    const endDate = query?.endDate;

    const domain: any[] = [['employee_id', '=', employeeId]];
    if (startDate) domain.push(['check_in', '>=', startDate]);
    if (endDate) domain.push(['check_in', '<=', endDate]);

    return this.listModel(
      this.attendanceModel,
      domain,
      [
        'id',
        'employee_id',
        'check_in',
        'check_out',
        'worked_hours',
        'create_date',
      ],
      page,
      pageSize,
      'check_in desc',
    );
  }

  async getAttendance(query: any) {
    const page = Number(query?.page ?? 1);
    const pageSize = Number(query?.pageSize ?? 50);
    const startDate = query?.startDate;
    const endDate = query?.endDate;
    const domain: any[] = [];

    if (query?.employeeId)
      domain.push(['employee_id', '=', Number(query.employeeId)]);
    if (startDate) domain.push(['check_in', '>=', startDate]);
    if (endDate) domain.push(['check_in', '<=', endDate]);

    return this.listModel(
      this.attendanceModel,
      domain,
      [
        'id',
        'employee_id',
        'check_in',
        'check_out',
        'worked_hours',
        'create_date',
      ],
      page,
      pageSize,
      'check_in desc',
    );
  }

  async attendanceDashboard(query: any) {
    const pageSize = Number(query?.pageSize ?? 200);
    const cappedPageSize = Math.min(pageSize, 200);
    const result = await this.listModel(
      this.attendanceModel,
      [],
      ['id', 'employee_id', 'check_in', 'check_out', 'worked_hours'],
      1,
      cappedPageSize,
      'check_in desc',
    );

    const rows = result.data || [];
    const checkedIn = rows.filter(
      (row: any) => row.check_in && !row.check_out,
    ).length;
    const completed = rows.filter((row: any) => !!row.check_out).length;
    const totalHours = rows.reduce(
      (acc: number, row: any) => acc + Number(row.worked_hours || 0),
      0,
    );

    return {
      totalRecords: result.total,
      activeCheckIns: checkedIn,
      completedSessions: completed,
      averageWorkedHours:
        rows.length > 0 ? Number((totalHours / rows.length).toFixed(2)) : 0,
    };
  }

  async clockIn(data: any) {
    return this.odooClient.execute(this.attendanceModel, 'create', [
      {
        employee_id: data?.employee_id ?? data?.employeeId,
        check_in: data?.check_in ?? new Date().toISOString(),
      },
    ]);
  }

  async clockOut(attendanceId: number, data?: any) {
    return this.odooClient.execute(this.attendanceModel, 'write', [
      [attendanceId],
      {
        check_out: data?.check_out ?? new Date().toISOString(),
      },
    ]);
  }

  async clockOutLatestForEmployee(employeeId: number, data?: any) {
    const records = await this.odooClient.searchRead(
      this.attendanceModel,
      [
        ['employee_id', '=', employeeId],
        ['check_out', '=', false],
      ],
      ['id', 'check_in', 'check_out'],
      { limit: 1, order: 'check_in desc' },
    );
    const latest = Array.isArray(records) ? records[0] : null;
    if (!latest?.id)
      throw new NotFoundException(
        'No open attendance record found for this employee.',
      );
    return this.clockOut(Number(latest.id), data);
  }

  async createAttendanceRecord(data: any) {
    const payload = {
      employee_id: data?.employee_id ?? data?.employeeId,
      check_in: data?.check_in ?? data?.clockIn ?? new Date().toISOString(),
      check_out: data?.check_out ?? data?.clockOut ?? undefined,
    };
    if (!payload.employee_id)
      throw new BadRequestException('employeeId is required.');
    return this.odooClient.execute(this.attendanceModel, 'create', [payload]);
  }

  async updateAttendanceRecord(id: number, data: any) {
    const payload: Record<string, any> = {};
    if (data?.check_in || data?.clockIn)
      payload.check_in = data.check_in ?? data.clockIn;
    if (data?.check_out || data?.clockOut)
      payload.check_out = data.check_out ?? data.clockOut;
    if (Object.keys(payload).length === 0) {
      throw new BadRequestException(
        'No attendance fields provided for update.',
      );
    }
    return this.odooClient.execute(this.attendanceModel, 'write', [
      [id],
      payload,
    ]);
  }

  async deleteAttendanceRecord(id: number) {
    return this.odooClient.execute(this.attendanceModel, 'unlink', [[id]]);
  }

  async getLeaveTypes() {
    return this.odooClient.searchRead(
      this.leaveTypeModel,
      [],
      ['id', 'name', 'requires_allocation', 'active'],
      { order: 'name asc' },
    );
  }

  async getLeaveRequests(query: any) {
    const page = Number(query?.page ?? 1);
    const pageSize = Math.min(Number(query?.pageSize ?? 50), 200);
    const domain: any[] = [];

    if (query?.employeeId)
      domain.push(['employee_id', '=', Number(query.employeeId)]);
    if (query?.status) domain.push(['state', '=', String(query.status)]);
    if (query?.startDate)
      domain.push(['request_date_from', '>=', query.startDate]);
    if (query?.endDate) domain.push(['request_date_to', '<=', query.endDate]);

    return this.listModel(
      this.leaveModel,
      domain,
      [
        'id',
        'name',
        'employee_id',
        'holiday_status_id',
        'request_date_from',
        'request_date_to',
        'number_of_days',
        'state',
      ],
      page,
      pageSize,
      'request_date_from desc',
    );
  }

  async createLeaveRequest(data: any) {
    return this.odooClient.execute(this.leaveModel, 'create', [
      {
        name: data?.name ?? 'Leave Request',
        employee_id: data?.employee_id ?? data?.employeeId,
        holiday_status_id: data?.holiday_status_id ?? data?.leaveTypeId,
        request_date_from: data?.request_date_from ?? data?.startDate,
        request_date_to: data?.request_date_to ?? data?.endDate,
      },
    ]);
  }

  async approveLeaveRequest(id: number) {
    try {
      return await this.odooClient.execute(this.leaveModel, 'action_approve', [
        [id],
      ]);
    } catch {
      try {
        return await this.odooClient.execute(
          this.leaveModel,
          'action_validate',
          [[id]],
        );
      } catch {
        return this.odooClient.execute(this.leaveModel, 'write', [
          [id],
          { state: 'validate' },
        ]);
      }
    }
  }

  async refuseLeaveRequest(id: number) {
    try {
      return await this.odooClient.execute(this.leaveModel, 'action_refuse', [
        [id],
      ]);
    } catch {
      return this.odooClient.execute(this.leaveModel, 'write', [
        [id],
        { state: 'refuse' },
      ]);
    }
  }

  async cancelLeaveRequest(id: number) {
    try {
      return await this.odooClient.execute(this.leaveModel, 'action_cancel', [
        [id],
      ]);
    } catch {
      return this.odooClient.execute(this.leaveModel, 'write', [
        [id],
        { state: 'cancel' },
      ]);
    }
  }

  async getShifts(query: any) {
    const page = Number(query?.page ?? 1);
    const pageSize = Math.min(Number(query?.pageSize ?? 50), 200);
    const domain: any[] = [];

    if (query?.employeeId)
      domain.push(['employee_id', '=', Number(query.employeeId)]);
    if (query?.startDate)
      domain.push(['start_datetime', '>=', query.startDate]);
    if (query?.endDate) domain.push(['end_datetime', '<=', query.endDate]);

    return this.listModel(
      this.planningModel,
      domain,
      [
        'id',
        'name',
        'employee_id',
        'start_datetime',
        'end_datetime',
        'allocated_hours',
        'state',
        'resource_id',
      ],
      page,
      pageSize,
      'start_datetime asc',
    );
  }

  async getShiftsByEmployee(employeeId: number, query: any) {
    return this.getShifts({ ...query, employeeId });
  }

  async createShift(data: any) {
    return this.odooClient.execute(this.planningModel, 'create', [
      {
        name: data?.name ?? 'Shift',
        employee_id: data?.employee_id ?? data?.employeeId,
        start_datetime: data?.start_datetime ?? data?.startDateTime,
        end_datetime: data?.end_datetime ?? data?.endDateTime,
        allocated_hours: data?.allocated_hours ?? data?.allocatedHours ?? false,
      },
    ]);
  }

  async updateShift(id: number, data: any) {
    const payload = {
      name: data?.name,
      employee_id: data?.employee_id ?? data?.employeeId,
      start_datetime: data?.start_datetime ?? data?.startDateTime,
      end_datetime: data?.end_datetime ?? data?.endDateTime,
      allocated_hours: data?.allocated_hours ?? data?.allocatedHours,
      state: data?.state,
    };
    const cleanedPayload = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined),
    );

    return this.odooClient.execute(this.planningModel, 'write', [
      [id],
      cleanedPayload,
    ]);
  }

  async deleteShift(id: number) {
    return this.odooClient.execute(this.planningModel, 'unlink', [[id]]);
  }

  async getEmployeeDocuments(employeeId: number) {
    const rows = await this.prisma.contactFile.findMany({
      where: { contactId: employeeId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    return rows.map((row: any) => ({
      id: row.id,
      employeeId: String(employeeId),
      name: row.name,
      type: row.type || 'other',
      fileUrl: row.url || undefined,
      uploadedAt: row.createdAt,
    }));
  }

  async uploadEmployeeDocument(employeeId: number, data: any) {
    const name = String(data?.name || '').trim();
    if (!name) throw new BadRequestException('Document name is required.');
    const url = String(data?.fileUrl || data?.url || '').trim();
    if (!url) throw new BadRequestException('fileUrl is required.');
    const type = data?.type ? String(data.type) : undefined;

    const created = await this.prisma.contactFile.create({
      data: {
        contactId: employeeId,
        name,
        size: String(data?.size || 'unknown'),
        url,
        type,
      },
    });

    return {
      id: created.id,
      employeeId: String(employeeId),
      name: created.name,
      type: created.type || 'other',
      fileUrl: created.url || undefined,
      uploadedAt: created.createdAt,
    };
  }

  async deleteEmployeeDocument(employeeId: number, documentId: string) {
    const row = await this.prisma.contactFile.findFirst({
      where: { id: String(documentId), contactId: employeeId },
    });
    if (!row) throw new NotFoundException('Employee document not found.');
    await this.prisma.contactFile.delete({ where: { id: row.id } });
    return { success: true };
  }

  async getRoles() {
    const rows = await this.odooClient.searchRead(
      this.groupsModel,
      [],
      ['id', 'name', 'comment'],
      { order: 'name asc', limit: 500 },
    );
    return (Array.isArray(rows) ? rows : []).map((row: any) =>
      this.normalizeRole(row),
    );
  }

  async assignRole(employeeId: number, roleId: number) {
    if (!Number.isFinite(roleId) || roleId <= 0) {
      throw new BadRequestException('Valid roleId is required.');
    }
    const userId = await this.resolveEmployeeUserId(employeeId);
    await this.odooClient.execute(this.usersModel, 'write', [
      [userId],
      { groups_id: [[4, roleId]] },
    ]);
    return { success: true };
  }

  async removeRole(employeeId: number, roleId: number) {
    if (!Number.isFinite(roleId) || roleId <= 0) {
      throw new BadRequestException('Valid roleId is required.');
    }
    const userId = await this.resolveEmployeeUserId(employeeId);
    await this.odooClient.execute(this.usersModel, 'write', [
      [userId],
      { groups_id: [[3, roleId]] },
    ]);
    return { success: true };
  }

  async updateEmployeePermissions(employeeId: number, data: any) {
    const roleIds = Array.isArray(data?.roleIds)
      ? data.roleIds
          .map((id: any) => Number(id))
          .filter((id: number) => Number.isFinite(id) && id > 0)
      : null;
    if (!roleIds || roleIds.length === 0) {
      throw new BadRequestException(
        'roleIds[] is required to update employee permissions.',
      );
    }
    const userId = await this.resolveEmployeeUserId(employeeId);
    await this.odooClient.execute(this.usersModel, 'write', [
      [userId],
      { groups_id: [[6, 0, roleIds]] },
    ]);
    return { success: true };
  }

  async getSettings(orgId: string) {
    if (!orgId) throw new BadRequestException('x-org-id is required.');
    const keys = {
      employmentTypes: this.getSettingsKey(orgId, 'employmentTypes'),
      attendanceRules: this.getSettingsKey(orgId, 'attendanceRules'),
      timeOffTypes: this.getSettingsKey(orgId, 'timeOffTypes'),
      workWeek: this.getSettingsKey(orgId, 'workWeek'),
      documentTypes: this.getSettingsKey(orgId, 'documentTypes'),
    };
    const [
      employmentTypesRaw,
      attendanceRulesRaw,
      timeOffTypesRaw,
      workWeekRaw,
      documentTypesRaw,
    ] = await Promise.all([
      this.getConfigParam(keys.employmentTypes),
      this.getConfigParam(keys.attendanceRules),
      this.getConfigParam(keys.timeOffTypes),
      this.getConfigParam(keys.workWeek),
      this.getConfigParam(keys.documentTypes),
    ]);

    const parseJson = (value: string | null) => {
      if (!value) return undefined;
      try {
        return JSON.parse(value);
      } catch {
        return undefined;
      }
    };

    return {
      employmentTypes: parseJson(employmentTypesRaw),
      attendanceRules: parseJson(attendanceRulesRaw),
      timeOffTypes: parseJson(timeOffTypesRaw),
      workWeek: parseJson(workWeekRaw),
      documentTypes: parseJson(documentTypesRaw),
    };
  }

  async updateSettings(orgId: string, data: any) {
    if (!orgId) throw new BadRequestException('x-org-id is required.');
    const updatableKeys = [
      'employmentTypes',
      'attendanceRules',
      'timeOffTypes',
      'workWeek',
      'documentTypes',
    ] as const;
    const updates: Array<Promise<void>> = [];

    for (const key of updatableKeys) {
      if (data?.[key] === undefined) continue;
      updates.push(
        this.setConfigParam(
          this.getSettingsKey(orgId, key),
          JSON.stringify(data[key]),
        ),
      );
    }

    if (updates.length === 0) {
      throw new BadRequestException('No supported settings fields provided.');
    }
    await Promise.all(updates);
    return this.getSettings(orgId);
  }
}
