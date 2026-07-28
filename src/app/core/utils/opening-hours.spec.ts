import { openingHoursLabel, weekdayLabel } from './opening-hours';

describe('weekdayLabel', () => {
  it('names a single day', () => {
    expect(weekdayLabel(['Wed'])).toBe('Wed');
  });

  it('collapses a contiguous run into a range', () => {
    expect(weekdayLabel(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])).toBe('Mon – Sat');
    expect(weekdayLabel(['Mon', 'Tue'])).toBe('Mon – Tue');
    expect(weekdayLabel(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])).toBe('Mon – Sun');
  });

  it('lists the days when they are not contiguous', () => {
    expect(weekdayLabel(['Mon', 'Wed', 'Fri'])).toBe('Mon, Wed, Fri');
    expect(weekdayLabel(['Sat', 'Sun', 'Tue'])).toBe('Tue, Sat, Sun');
  });

  it('sorts into week order regardless of how they were listed', () => {
    expect(weekdayLabel(['Wed', 'Mon', 'Tue'])).toBe('Mon – Wed');
  });

  it('returns nothing for no days', () => {
    expect(weekdayLabel([])).toBe('');
  });
});

describe('openingHoursLabel', () => {
  it('joins the days and the times', () => {
    expect(
      openingHoursLabel({
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        opensAt: '09:00 AM',
        closesAt: '08:00 PM',
      }),
    ).toBe('Mon – Sat · 09:00 AM – 08:00 PM');
  });

  it('works for a single day', () => {
    expect(openingHoursLabel({ days: ['Sun'], opensAt: '10:00 AM', closesAt: '02:00 PM' })).toBe(
      'Sun · 10:00 AM – 02:00 PM',
    );
  });
});
