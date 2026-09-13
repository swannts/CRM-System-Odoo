import { BadRequestException } from '@nestjs/common';
import { parseOdooNumericId } from '../../common/utils/parse-odoo-numeric-id';
import { CrmController } from './crm.controller';
import { CrmService } from './crm.service';

describe('CrmService', () => {
  const makeService = (odooClient: any) => new CrmService(odooClient);

  it('returns compatibility and Odoo-native opportunity fields', async () => {
    const service = makeService({
      searchRead: jest.fn().mockResolvedValue([
        {
          id: 42,
          name: 'Upgrade project',
          partner_id: [7, 'Acme Inc'],
          email_from: 'buyer@acme.test',
          phone: '555',
          probability: 50,
          planned_revenue: 1000,
          recurring_revenue_monthly: 25,
          stage_id: [3, 'Proposal'],
          user_id: [9, 'Alice'],
          priority: '1',
          date_deadline: '2026-06-01',
          create_date: '2026-05-01',
          write_date: '2026-05-02',
          type: 'opportunity',
          active: true,
          is_won: false,
          tag_ids: [],
          activity_ids: [88],
          activity_summary: 'Call back',
          activity_date_deadline: '2026-05-03',
          activity_type_id: [2, 'Call'],
          activity_state: 'planned',
        },
      ]),
    });

    const result = await service.findOne(42);

    expect(result).toMatchObject({
      id: 42,
      odooId: 42,
      customerName: 'Acme Inc',
      customerId: 7,
      companyName: 'Acme Inc',
      stageId: 3,
      stageName: 'Proposal',
      stageStatus: 'proposal',
      status: 'proposal',
      expectedCloseDate: '2026-06-01',
      expectedRevenue: 1000,
      weightedValue: 500,
      partner: { id: 7, name: 'Acme Inc' },
      stage: { id: 3, name: 'Proposal', status: 'proposal' },
      user: { id: 9, name: 'Alice' },
      nextActivity: {
        id: 'act-88',
        odooId: 88,
        title: 'Call back',
        summary: 'Call back',
        dueDate: '2026-05-03',
        deadline: '2026-05-03',
        type: 'Call',
        state: 'planned',
        overdue: false,
      },
    });
  });

  it('archives opportunities instead of deleting them', async () => {
    const execute = jest.fn().mockResolvedValue(true);
    const service = makeService({ execute });

    await expect(service.remove(42)).resolves.toEqual({ id: 42, archived: true });
    expect(execute).toHaveBeenCalledWith('crm.lead', 'write', [[42], { active: false }]);
  });

  it('maps opportunity stage updates to Odoo stage_id payloads', async () => {
    const execute = jest.fn().mockResolvedValue(true);
    const searchRead = jest.fn().mockResolvedValueOnce([{
      id: 42,
      name: 'Deal',
      partner_id: [7, 'Acme Inc'],
      stage_id: [5, 'Negotiation'],
      probability: 80,
      active: true,
      type: 'opportunity',
    }]);
    const service = makeService({ execute, searchRead });

    await service.update(42, { stageId: 5 });

    expect(execute).toHaveBeenCalledWith(
      'crm.lead',
      'write',
      [[42], expect.objectContaining({ stage_id: 5 })],
    );
  });

  it('preserves lead type on partial updates and forwards explicit loss archival', async () => {
    const execute = jest.fn().mockResolvedValue(true);
    const searchRead = jest.fn().mockResolvedValue([{ id: 42, type: 'lead', active: false }]);
    const service = makeService({ execute, searchRead });
    await service.update(42, { active: false });
    expect(execute).toHaveBeenCalledWith('crm.lead', 'write', [[42], { active: false }]);
    expect(execute.mock.calls[0][2][1]).not.toHaveProperty('type');
  });

  it('validates activity payloads and falls back to an available Odoo activity type', async () => {
    const execute = jest.fn().mockResolvedValue(99);
    const searchRead = jest.fn()
      .mockResolvedValueOnce([{ id: 5, name: 'To Do' }])
      .mockResolvedValueOnce([{
        id: 99,
        res_id: 42,
        summary: 'Follow up',
        note: 'Details',
        date_deadline: '2026-05-10',
        activity_type_id: [5, 'To Do'],
        user_id: [2, 'Alice'],
        state: 'planned',
        create_date: '2026-05-02',
      }]);
    const service = makeService({
      searchRead,
      execute,
    });

    await expect(service.createActivity({ opportunityId: 42, type: 'followup', title: 'Follow up' })).resolves.toMatchObject({
      id: '99',
      odooId: 99,
      opportunityId: '42',
      type: 'todo',
      title: 'Follow up',
      dueDate: '2026-05-10',
      completed: false,
      assignedTo: 'Alice',
    });
    expect(execute).toHaveBeenCalledWith('mail.activity', 'create', [
      expect.objectContaining({
        res_model: 'crm.lead',
        res_id: 42,
        summary: 'Follow up',
        activity_type_id: 5,
      }),
    ]);
  });

  it('rejects incomplete activity payloads before calling Odoo', async () => {
    const execute = jest.fn();
    const service = makeService({
      searchRead: jest.fn().mockResolvedValue([{ id: 5, name: 'To Do' }]),
      execute,
    });

    await expect(service.createActivity({ opportunityId: 'foo', title: 'Follow up' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(service.createActivity({ opportunityId: 42, title: '' })).rejects.toBeInstanceOf(BadRequestException);
    expect(execute).not.toHaveBeenCalled();
  });

  it('returns normalized activity rows and predictable complete/delete responses', async () => {
    const execute = jest.fn().mockResolvedValue(true);
    const service = makeService({
      searchRead: jest.fn().mockResolvedValue([{
        id: 77,
        res_id: 42,
        summary: 'Demo',
        date_deadline: '2026-05-10',
        activity_type_id: [3, 'Call'],
        user_id: [2, 'Alice'],
        state: 'done',
        create_date: '2026-05-02',
      }]),
      execute,
    });

    await expect(service.getActivities({ page: 1, pageSize: 20 })).resolves.toEqual([
      expect.objectContaining({ id: '77', odooId: 77, opportunityId: '42', type: 'call', completed: true }),
    ]);
    await expect(service.completeActivity(77)).resolves.toEqual({ id: 77, completed: true });
    await expect(service.removeActivity(77)).resolves.toEqual({ id: 77, deleted: true });
  });

  it('separates inactive archived opportunities from lost opportunities in pipeline summary', async () => {
    const service = makeService({
      searchRead: jest.fn().mockResolvedValue([
        { expected_revenue: 100, probability: 50, stage_id: [1, 'New'], is_won: false, active: true },
        { expected_revenue: 200, probability: 100, stage_id: [2, 'Won'], is_won: true, active: true },
        { expected_revenue: 300, probability: 0, stage_id: [3, 'Lost'], is_won: false, active: false },
        { expected_revenue: 400, probability: 20, stage_id: [4, 'Dormant'], is_won: false, active: false },
      ]),
    });

    await expect(service.getPipelineSummary()).resolves.toMatchObject({
      totalOpenValue: 100,
      weightedValue: 50,
      wonValue: 200,
      lostValue: 300,
      archivedValue: 400,
      openCount: 1,
      wonCount: 1,
      lostCount: 1,
      archivedCount: 1,
      opportunityCount: 4,
    });
  });
});

describe('CrmController ID parsing', () => {
  it('parses prefixed Odoo IDs directly', () => {
    expect(parseOdooNumericId('act-123')).toBe(123);
    expect(() => parseOdooNumericId('foo')).toThrow(BadRequestException);
  });

  it('accepts prefixed Odoo IDs', async () => {
    const crmService = { findOne: jest.fn().mockResolvedValue({ id: 123 }) };
    const controller = new CrmController(crmService as any);

    await expect(controller.findOne('act-123')).resolves.toEqual({ id: 123 });
    expect(crmService.findOne).toHaveBeenCalledWith(123);
  });

  it('rejects non-numeric IDs with HTTP 400 semantics', async () => {
    const controller = new CrmController({ findOne: jest.fn() } as any);

    await expect(controller.findOne('foo')).rejects.toBeInstanceOf(BadRequestException);
  });
});
