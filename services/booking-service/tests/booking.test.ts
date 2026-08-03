import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Booking Service - Appointment & Availability Logic', () => {
  test('calculates start and end time based on duration minutes', () => {
    const calculateEndTime = (startTimeIso: string, durationMinutes: number) => {
      const start = new Date(startTimeIso);
      return new Date(start.getTime() + durationMinutes * 60000).toISOString();
    };

    const startTime = '2026-08-10T10:00:00.000Z';
    const endTime = calculateEndTime(startTime, 30);

    assert.equal(endTime, '2026-08-10T10:30:00.000Z');
  });

  test('checks slot overlap accurately', () => {
    const hasOverlap = (
      slotA: { start: number; end: number },
      slotB: { start: number; end: number }
    ) => {
      return slotA.start < slotB.end && slotA.end > slotB.start;
    };

    const slot1 = { start: 100, end: 200 };
    const slot2 = { start: 150, end: 250 };
    const slot3 = { start: 200, end: 300 };

    assert.equal(hasOverlap(slot1, slot2), true);
    assert.equal(hasOverlap(slot1, slot3), false);
  });
});
