import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SessionProvider } from '../src/auth/SessionContext';
import { saveSession } from '../src/auth/session';
import { Layout } from '../src/components/Layout';
import TicketListPage from '../src/pages/TicketListPage';

const ok = (body) => ({ ok: true, status: 200, json: async () => body });
const page = (phone) => ok({ data: [{
  ticket_id: 1, ticket_code: 'BH-000001/2026', customer_name: 'A', customer_phone: phone, product_name: 'P',
  serial_no: 'S', category_name: 'PIN', priority: 'CAO', status: 'MOI', due_date: '2099-01-01T00:00:00.000Z',
}], paging: { page: 1, size: 20, total: 1, total_pages: 1 } });

beforeEach(() => { localStorage.clear(); saveSession({ role: 'QUAN_LY_TRUNG_TAM', employeeId: 1, centerId: 1 }); });
afterEach(() => vi.unstubAllGlobals());

describe('đổi vai trò', () => {
  it('tải lại danh sách theo vai trò mới, không giữ số điện thoại đầy đủ của vai trò cũ (NFR2)', async () => {
    // máy chủ trả số đầy đủ cho Quản lý, số đã che cho vai trò khác
    const f = vi.fn((url, opts) => Promise.resolve(page(opts.headers['x-role'] === 'QUAN_LY_TRUNG_TAM' ? '0367353916' : '036****916')));
    vi.stubGlobal('fetch', f);
    render(
      <MemoryRouter initialEntries={['/tickets']}>
        <SessionProvider>
          <Routes><Route element={<Layout />}><Route path="/tickets" element={<TicketListPage />} /></Route></Routes>
        </SessionProvider>
      </MemoryRouter>);
    expect(await screen.findByText('0367353916')).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText('Vai trò'), 'KY_THUAT_VIEN');

    expect(await screen.findByText('036****916')).toBeInTheDocument();
    expect(screen.queryByText('0367353916')).not.toBeInTheDocument();
    await waitFor(() => expect(f.mock.calls.at(-1)[1].headers['x-role']).toBe('KY_THUAT_VIEN'));
  });
});
