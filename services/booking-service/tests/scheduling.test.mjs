import { test } from 'node:test';
import assert from 'node:assert/strict';
import { availableStarts, isAvailableStart } from '../src/modules/appointments/domain/scheduling.ts';
const now = new Date('2026-01-01T00:00:00Z');
const schedule = { isActive: true, timeZone: 'Asia/Dhaka', durationMinutes: 30, bufferMinutes: 15,
  availabilities: [{ dayOfWeek: 1, startTime: '09:00', endTime: '11:00' }] };
test('uses booking timezone rather than server timezone and includes every window', () => {
  const slots = availableStarts(schedule, '2026-01-05', now);
  assert.deepEqual(slots.map(s => s.start), ['2026-01-05T03:00:00.000Z', '2026-01-05T03:45:00.000Z', '2026-01-05T04:30:00.000Z']);
  assert.equal(isAvailableStart(schedule, new Date('2026-01-05T03:30:00Z'), now), false);
});
test('rejects invalid calendar dates, inactive types and past slots', () => {
  assert.throws(() => availableStarts(schedule, '2026-02-31', now));
  assert.equal(isAvailableStart({ ...schedule, isActive: false }, new Date('2026-01-05T03:00:00Z'), now), false);
  assert.equal(isAvailableStart(schedule, new Date('2026-01-05T03:00:00Z'), new Date('2026-01-06')), false);
});
test('does not invent nonexistent local times during spring DST transition', () => {
  const slots = availableStarts({ ...schedule, timeZone: 'America/New_York', bufferMinutes: 0,
    availabilities: [{ dayOfWeek: 0, startTime: '01:00', endTime: '04:00' }] }, '2026-03-08', now);
  assert.ok(slots.length > 0);
  assert.ok(slots.every(slot => !slot.label.startsWith('02:')));
  assert.equal(new Set(slots.map(slot => slot.start)).size, slots.length);
});
