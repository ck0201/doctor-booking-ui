import { toRouteId } from './route-params';

describe('toRouteId', () => {
  it('accepts positive integers', () => {
    expect(toRouteId('1')).toBe(1);
    expect(toRouteId('42')).toBe(42);
    expect(toRouteId(' 7 ')).toBe(7);
  });

  it('rejects anything absent', () => {
    expect(toRouteId(undefined)).toBeNull();
    expect(toRouteId(null)).toBeNull();
    expect(toRouteId('')).toBeNull();
    expect(toRouteId('   ')).toBeNull();
  });

  it('rejects values that are not plain positive integers', () => {
    expect(toRouteId('0')).toBeNull();
    expect(toRouteId('-1')).toBeNull();
    expect(toRouteId('1.5')).toBeNull();
    expect(toRouteId('abc')).toBeNull();
    expect(toRouteId('1abc')).toBeNull();
  });

  it('rejects numeric forms Number() would coerce', () => {
    expect(toRouteId('1e3')).toBeNull();
    expect(toRouteId('0x10')).toBeNull();
    expect(toRouteId('Infinity')).toBeNull();
  });
});
