import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SessionProvider } from '../src/auth/SessionContext';
import { saveSession } from '../src/auth/session';
import TicketListPage from '../src/pages/TicketListPage';

const ticket = (over = {}) => ({
  ticket_id: 1, ticket_code: 'BH-000001/2026', customer_name: 'Đỗ Đức Cường', customer_phone: '078****918',
  product_name: 'Samsung Note 8', serial_no: 'SN1', category_name: 'PIN', priority: 'CAO', status: 'MOI',
  due_date: '2020-01-01T00:00:00.000Z', ...over,
});
const ok = (body) => ({ ok: true, status: 200, json: async () => body });

function renderPage(url = '/tickets') {
  return render(
    <MemoryRouter initialEntries={[url]}><SessionProvider><TicketListPage /></SessionProvider></MemoryRouter>);
}

beforeEach(() => { localStorage.clear(); saveSession({ role: 'NHAN_VIEN_TIEP_NHAN', employeeId: 1, centerId: 1 }); });
afterEach(() => vi.unstubAllGlobals());

describe('Danh sách phiếu', () => {
  it('có dữ liệu: hiện dòng phiếu, nhãn tiếng Việt, đánh dấu quá hạn và tổng số phiếu', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ data: [ticket()], paging: { page: 1, size: 20, total: 152, total_pages: 8 } })));
    renderPage();
    expect(await screen.findByText('BH-000001/2026')).toBeInTheDocument();
    expect(screen.getByText('Pin')).toBeInTheDocument();
    expect(screen.getByText(/1 phiếu quá hạn trong trang này/)).toBeInTheDocument();
    expect(screen.getByText(/Tổng 152 phiếu/)).toBeInTheDocument();
  });

  it('lọc ra rỗng: hiện thông báo riêng kèm nút Xóa bộ lọc (không phải bảng trắng)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ data: [], paging: { page: 1, size: 20, total: 0, total_pages: 0 } })));
    renderPage('/tickets?status=DA_HUY');
    expect(await screen.findByText(/Không có phiếu nào ở trạng thái "Đã hủy"/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Xóa bộ lọc' }).length).toBeGreaterThan(0);
  });

  it('tắt máy chủ: hiện lỗi dễ hiểu có nút Thử lại, bấm thì gọi API lại', async () => {
    const f = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', f);
    renderPage();
    expect(await screen.findByRole('alert')).toHaveTextContent(/Không kết nối được tới hệ thống/);
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(f.mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
