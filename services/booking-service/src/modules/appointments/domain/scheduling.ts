export type Schedule = {
  durationMinutes: number;
  bufferMinutes: number;
  timeZone?: string;
  isActive: boolean;
  availabilities: { dayOfWeek: number; startTime: string; endTime: string }[];
};

const formatters = new Map<string, Intl.DateTimeFormat>();
function localParts(date: Date, timeZone: string) {
  if (!formatters.has(timeZone)) formatters.set(timeZone, new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short',
  }));
  const parts = formatters.get(timeZone)!.formatToParts(date);
  const get = (key: string) => parts.find(p => p.type === key)!.value;
  return { date: `${get('year')}-${get('month')}-${get('day')}`,
    minute: Number(get('hour')) * 60 + Number(get('minute')),
    weekday: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(get('weekday')) };
}
const minuteOfDay = (value: string) => {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return NaN;
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
};

export function isAvailableStart(schedule: Schedule, start: Date, now = new Date()) {
  if (!schedule.isActive || !Number.isFinite(start.getTime()) || start <= now || start.getUTCSeconds() || start.getUTCMilliseconds()) return false;
  if (!Number.isInteger(schedule.durationMinutes) || schedule.durationMinutes < 1 || schedule.durationMinutes > 1440 || !Number.isInteger(schedule.bufferMinutes) || schedule.bufferMinutes < 0) return false;
  const local = localParts(start, schedule.timeZone || 'UTC');
  const end = localParts(new Date(start.getTime() + schedule.durationMinutes * 60000), schedule.timeZone || 'UTC');
  return schedule.availabilities.some(window => {
    const from = minuteOfDay(window.startTime), to = minuteOfDay(window.endTime);
    return window.dayOfWeek === local.weekday && local.date === end.date &&
      local.minute >= from && end.minute <= to && end.minute > local.minute &&
      (local.minute - from) % (schedule.durationMinutes + schedule.bufferMinutes) === 0;
  });
}

export function availableStarts(schedule: Schedule, date: string, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) || new Date(`${date}T00:00:00Z`).toISOString().slice(0,10) !== date) throw new Error('Invalid date; expected YYYY-MM-DD');
  const anchor = Date.parse(`${date}T00:00:00Z`);
  const result: { start: string; end: string; label: string }[] = [];
  // Scan instants rather than constructing local dates, including DST transitions.
  for (let instant = anchor - 14*3600000; instant < anchor + 38*3600000; instant += 60000) {
    const start = new Date(instant);
    const local = localParts(start, schedule.timeZone || 'UTC');
    if (local.date !== date || !isAvailableStart(schedule, start, now)) continue;
    result.push({ start: start.toISOString(), end: new Date(instant + schedule.durationMinutes*60000).toISOString(), label: `${String(Math.floor(local.minute/60)).padStart(2,'0')}:${String(local.minute%60).padStart(2,'0')}` });
  }
  return result;
}
