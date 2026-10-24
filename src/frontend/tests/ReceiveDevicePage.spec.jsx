import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { SessionProvider } from '../src/auth/SessionContext';
import { saveSession } from '../src/auth/session';
import ReceiveDevicePage from '../src/pages/ReceiveDevicePage';

const ok = (body) => ({ ok: true, status: 200, json: async () => body });
const fail = (status, body) => ({ ok: false, status, json: async () => body });

function renderPage() {
  return render(<MemoryRouter><SessionProvider><ReceiveDevicePage /></SessionProvider></MemoryRouter>);
}
beforeEach(() => { localStorage.clear(); saveSession({ role: 'NHAN_VIEN_TIEP_NHAN', employeeId: 1, centerId: 1 }); });
afterEach(() => vi.unstubAllGlobals());

describe('Tạo phiếu – màn tiếp nhận', () => {
  it('số điện thoại chưa có: hiện biểu mẫu tạo khách hàng mới (trạng thái rỗng có hành động)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fail(404, { error: 'KHONG_TIM_THAY', message: 'Chưa có khách hàng với số điện thoại này' })));
    renderPage();
    await userEvent.type(screen.getByLabelText('Số điện thoại khách hàng'), '0914016959');
    await userEvent.click(screen.getByRole('button', { name: 'Tra cứu' }));
    expect(await screen.findByText(/chưa có trong hệ thống/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tạo khách hàng' })).toBeInTheDocument();
  });

  it('số điện thoại sai: hiện lỗi theo trường, giữ lại số đã nhập (dữ liệu sai)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fail(400, {
      error: 'DU_LIEU_KHONG_HOP_LE', message: 'Dữ liệu gửi lên không hợp lệ',
      fields: { phone: 'Số điện thoại không hợp lệ (cần 10 số, bắt đầu bằng 0)' } })));
    renderPage();
    const input = screen.getByLabelText('Số điện thoại khách hàng');
    await userEvent.type(input, '123');
    await userEvent.click(screen.getByRole('button', { name: 'Tra cứu' }));
    expect(await screen.findByText(/Số điện thoại không hợp lệ/)).toBeInTheDocument();
    expect(input).toHaveValue('123');
  });

  it('khách chưa có thiết bị: nói rõ lý do, có nút chọn khách khác, không cho lưu phiếu (giá trị biên)', async () => {
    const f = vi.fn((url) => {
      if (url.includes('/devices')) return Promise.resolve(ok({ data: [] }));
      if (url.includes('/issue-categories')) return Promise.resolve(ok({ data: [] }));
      return Promise.resolve(ok({ data: { customer_id: 9, full_name: 'Hà Đăng Khoa', phone: '090****368', email: null, address: null } }));
    });
    vi.stubGlobal('fetch', f);
    renderPage();
    await userEvent.type(screen.getByLabelText('Số điện thoại khách hàng'), '0901234368');
    await userEvent.click(screen.getByRole('button', { name: 'Tra cứu' }));
    expect(await screen.findByText(/chưa có thiết bị nào/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Lưu phiếu bảo hành' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Chọn khách hàng khác' }));
    expect(screen.getByRole('button', { name: 'Tra cứu' })).toBeInTheDocument();
  });
});
