import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SessionProvider } from '../src/auth/SessionContext';
import { saveSession } from '../src/auth/session';
import TicketDetailPage from '../src/pages/TicketDetailPage';

const ok = (body) => ({ ok: true, status: 200, json: async () => body });
const ticket = (over = {}) => ({
  ticket_id: 5, ticket_code: 'BH-000005/2026', customer_name: 'Đỗ Đức Cường', customer_phone: '078****918',
  product_name: 'Samsung Note 8', serial_no: 'SN1', category_name: null, issue_desc: 'Máy không lên nguồn',
  priority: 'TRUNG_BINH', status: 'MOI', accessories: [], received_at: '2026-10-24T03:00:00.000Z',
  due_date: '2026-10-28T03:00:00.000Z', closed_at: null, is_warranty: true,
  technician_id: null, technician_name: null, ...over,
});
const TECHS = [{ technician_id: 33, technician_code: 'KT033', full_name: 'Phan Kim Hạnh', level: 'CAO_CAP' }];

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/tickets/5']}>
      <SessionProvider><Routes><Route path="/tickets/:id" element={<TicketDetailPage />} /></Routes></SessionProvider>
    </MemoryRouter>);
}
beforeEach(() => { localStorage.clear(); saveSession({ role: 'KY_THUAT_VIEN', employeeId: 2, centerId: 1 }); });
afterEach(() => vi.unstubAllGlobals());

describe('Chi tiết phiếu – phân công kỹ thuật viên (A4, C2)', () => {
  it('hiện tên kỹ thuật viên, không hiện mã số thô (C2)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ data: ticket({ status: 'DA_PHAN_CONG', technician_id: 20, technician_name: 'Trần Văn Thảo' }) })));
    renderPage();
    expect(await screen.findByText('Trần Văn Thảo')).toBeInTheDocument();
    expect(screen.queryByText('20')).not.toBeInTheDocument();
  });

  it('chọn "Đã phân công" mà chưa chọn kỹ thuật viên: báo lỗi và KHÔNG gọi PATCH (dữ liệu sai)', async () => {
    const f = vi.fn((url) => Promise.resolve(url.includes('/technicians') ? ok({ data: TECHS }) : ok({ data: ticket() })));
    vi.stubGlobal('fetch', f);
    renderPage();
    await userEvent.selectOptions(await screen.findByLabelText('Trạng thái mới'), 'DA_PHAN_CONG');
    await screen.findByLabelText(/Kỹ thuật viên phụ trách/);
    await userEvent.click(screen.getByRole('button', { name: 'Cập nhật' }));
    expect(await screen.findByText(/chọn kỹ thuật viên phụ trách/)).toBeInTheDocument();
    expect(f.mock.calls.some(([, o]) => o?.method === 'PATCH')).toBe(false);
  });

  it('chọn kỹ thuật viên rồi cập nhật: PATCH gửi kèm technician_id (luồng đúng)', async () => {
    const f = vi.fn((url, opts = {}) => {
      if (url.includes('/technicians')) return Promise.resolve(ok({ data: TECHS }));
      return Promise.resolve(ok({ data: ticket(opts.method === 'PATCH' ? { status: 'DA_PHAN_CONG', technician_id: 33, technician_name: 'Phan Kim Hạnh' } : {}) }));
    });
    vi.stubGlobal('fetch', f);
    renderPage();
    await userEvent.selectOptions(await screen.findByLabelText('Trạng thái mới'), 'DA_PHAN_CONG');
    await userEvent.selectOptions(await screen.findByLabelText(/Kỹ thuật viên phụ trách/), '33');
    await userEvent.click(screen.getByRole('button', { name: 'Cập nhật' }));
    const patch = f.mock.calls.find(([, o]) => o?.method === 'PATCH');
    expect(JSON.parse(patch[1].body)).toMatchObject({ to_status: 'DA_PHAN_CONG', technician_id: 33 });
  });
});
