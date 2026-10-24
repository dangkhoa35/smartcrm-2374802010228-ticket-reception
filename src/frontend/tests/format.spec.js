import { describe, expect, it } from 'vitest';
import { dueState, warrantyHint } from '../src/utils/format';

const NOW = new Date('2026-10-24T03:00:00Z').getTime();
const t = (hoursFromNow, status = 'MOI') => ({ status, due_date: new Date(NOW + hoursFromNow * 3600e3).toISOString() });

describe('dueState', () => {
  it('quá hạn', () => expect(dueState(t(-30), NOW)).toEqual({ kind: 'overdue', text: 'Quá hạn 1 ngày' }));
  it('sắp tới hạn (dưới 24 giờ)', () => expect(dueState(t(5), NOW).kind).toBe('soon'));
  it('còn hạn', () => expect(dueState(t(80), NOW)).toEqual({ kind: 'ok', text: 'Còn 3 ngày' }));
  it('phiếu đã xong không đánh dấu hạn', () => expect(dueState(t(-100, 'DA_DONG'), NOW).kind).toBe('none'));
});

describe('warrantyHint', () => {
  const now = new Date(2026, 9, 24);
  it('còn bảo hành', () => expect(warrantyHint({ purchase_date: '2026-03-10', warranty_months: 12 }, now).kind).toBe('valid'));
  it('hết bảo hành', () => expect(warrantyHint({ purchase_date: '2024-01-10', warranty_months: 12 }, now).kind).toBe('expired'));
  it('thiếu ngày mua là chưa xác minh', () => expect(warrantyHint({ purchase_date: null, warranty_months: 12 }, now).kind).toBe('unknown'));
});
