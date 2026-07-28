import {
  addDays,
  addMinutes,
  formatDayLabel,
  formatFullDayLabel,
  formatTimeOfDay,
  timeKey,
  weekdayOf,
} from './booking-slots';

describe('addDays', () => {
  it('moves forward within a month', () => {
    expect(addDays('2026-08-10', 5)).toBe('2026-08-15');
  });

  it('crosses a month boundary', () => {
    expect(addDays('2026-08-30', 3)).toBe('2026-09-02');
  });

  it('crosses a year boundary', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
  });

  it('handles a leap day', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2028-02-29', 1)).toBe('2028-03-01');
  });

  it('moves backwards for a negative count', () => {
    expect(addDays('2026-08-01', -1)).toBe('2026-07-31');
  });

  it('rejects anything that is not an ISO date', () => {
    expect(() => addDays('10-08-2026', 1)).toThrow();
    expect(() => addDays('2026-8-1', 1)).toThrow();
  });
});

describe('weekdayOf', () => {
  it('reads the weekday without drifting by timezone', () => {
    expect(weekdayOf('2026-08-10')).toBe('Mon');
    expect(weekdayOf('2026-08-15')).toBe('Sat');
    expect(weekdayOf('2026-08-16')).toBe('Sun');
  });

  it('covers a whole week from the window start', () => {
    const days = Array.from({ length: 7 }, (_, offset) => weekdayOf(addDays('2026-08-10', offset)));

    expect(days).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });
});

describe('day labels', () => {
  it('formats a short label', () => {
    expect(formatDayLabel('2026-08-10')).toBe('Mon 10 Aug');
    expect(formatDayLabel('2026-01-01')).toBe('Thu 1 Jan');
  });

  it('formats a label with the year', () => {
    expect(formatFullDayLabel('2026-08-10')).toBe('Mon 10 Aug 2026');
  });
});

describe('formatTimeOfDay', () => {
  it('formats morning and afternoon times', () => {
    expect(formatTimeOfDay(10, 0)).toBe('10:00 AM');
    expect(formatTimeOfDay(9, 30)).toBe('09:30 AM');
    expect(formatTimeOfDay(13, 5)).toBe('01:05 PM');
    expect(formatTimeOfDay(17, 45)).toBe('05:45 PM');
  });

  it('formats both midnights correctly', () => {
    expect(formatTimeOfDay(0, 0)).toBe('12:00 AM');
    expect(formatTimeOfDay(12, 0)).toBe('12:00 PM');
  });
});

describe('timeKey', () => {
  it('pads to four digits', () => {
    expect(timeKey(9, 5)).toBe('0905');
    expect(timeKey(17, 30)).toBe('1730');
  });
});

describe('addMinutes', () => {
  it('adds within the hour', () => {
    expect(addMinutes(10, 0, 15)).toEqual({ hour: 10, minute: 15 });
  });

  it('rolls over the hour', () => {
    expect(addMinutes(10, 50, 15)).toEqual({ hour: 11, minute: 5 });
  });

  it('wraps past midnight', () => {
    expect(addMinutes(23, 50, 15)).toEqual({ hour: 0, minute: 5 });
  });
});
