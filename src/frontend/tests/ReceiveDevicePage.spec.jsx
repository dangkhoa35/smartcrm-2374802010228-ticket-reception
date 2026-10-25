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

// ---- C4: luồng lỗi 409/422 và A2: thêm thiết bị ----
const KHACH = { customer_id: 9, full_name: 'Hà Đăng Khoa', phone: '090****368', email: null, address: null };
const MAY_HET_BH = { device_id: 1, product_name: 'Samsung Note 8', serial_no: 'S1', purchase_date: '2020-01-01', warranty_months: 12 };

// Giả lập máy chủ theo đường dẫn + phương thức; `postTicket` là phản hồi cho POST /api/tickets
function fakeServer({ devices, postTicket }) {
  return vi.fn((url, opts = {}) => {
    const method = opts.method || 'GET';
    if (url.includes('/issue-categories')) return Promise.resolve(ok({ data: [] }));
    if (url.includes('/devices') && method === 'POST') return Promise.resolve({ ok: true, status: 201, json: async () => ({ data: MAY_HET_BH }) });
    if (url.includes('/devices')) return Promise.resolve(ok({ data: typeof devices === 'function' ? devices() : devices }));
    if (url.includes('/api/tickets') && method === 'POST') return Promise.resolve(postTicket);
    return Promise.resolve(ok({ data: KHACH }));
  });
}

async function toTicketForm() {
  await userEvent.type(screen.getByLabelText('Số điện thoại khách hàng'), '0901234368');
  await userEvent.click(screen.getByRole('button', { name: 'Tra cứu' }));
  await userEvent.selectOptions(await screen.findByLabelText('Thiết bị của khách hàng'), '1');
  await userEvent.type(screen.getByLabelText(/Mô tả lỗi/), 'Máy không lên nguồn sau khi rơi');
}

describe('Tạo phiếu – luồng lỗi từ máy chủ (C4)', () => {
  it('409 thiết bị đang có phiếu mở: hiện đúng câu của máy chủ, vẫn giữ dữ liệu đã nhập', async () => {
    vi.stubGlobal('fetch', fakeServer({
      devices: [{ ...MAY_HET_BH, purchase_date: '2026-09-01' }],
      postTicket: fail(409, { error: 'THIET_BI_DANG_CO_PHIEU_MO', message: 'Thiết bị đang có phiếu chưa đóng: BH-000123/2026' }),
    }));
    renderPage();
    await toTicketForm();
    await userEvent.click(screen.getByRole('button', { name: 'Lưu phiếu bảo hành' }));
    expect(await screen.findByText(/Thiết bị đang có phiếu chưa đóng: BH-000123\/2026/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Mô tả lỗi/)).toHaveValue('Máy không lên nguồn sau khi rơi');
  });

  it('422 mã phê duyệt không hợp lệ: lỗi hiện ngay ở ô mã phê duyệt, không hiện bảng lỗi hệ thống', async () => {
    const msg = 'Mã phê duyệt không phải của một Quản lý trung tâm thuộc trung tâm này';
    vi.stubGlobal('fetch', fakeServer({
      devices: [MAY_HET_BH],
      postTicket: fail(422, { error: 'NGUOI_PHE_DUYET_KHONG_HOP_LE', message: msg }),
    }));
    renderPage();
    await toTicketForm();
    await userEvent.type(screen.getByLabelText(/Mã Quản lý trung tâm phê duyệt/), '99999');
    await userEvent.click(screen.getByRole('button', { name: 'Lưu phiếu bảo hành' }));
    const shown = await screen.findAllByText(msg);
    expect(shown).toHaveLength(1); // chỉ ở ô nhập, không lặp lại ở bảng lỗi chung
    expect(screen.queryByText(/Hệ thống đang gặp sự cố/)).not.toBeInTheDocument();
  });
});

describe('Thêm thiết bị cho khách mới (A2)', () => {
  it('khách chưa có thiết bị: nhập tên + serial, lưu thì gọi POST và hiện biểu mẫu phiếu với thiết bị vừa thêm', async () => {
    let added = false;
    const f = fakeServer({ devices: () => (added ? [MAY_HET_BH] : []), postTicket: ok({}) });
    const post = f.getMockImplementation();
    f.mockImplementation((url, opts = {}) => {
      if (url.includes('/devices') && opts.method === 'POST') added = true;
      return post(url, opts);
    });
    vi.stubGlobal('fetch', f);
    renderPage();
    await userEvent.type(screen.getByLabelText('Số điện thoại khách hàng'), '0901234368');
    await userEvent.click(screen.getByRole('button', { name: 'Tra cứu' }));
    await userEvent.type(await screen.findByLabelText(/Tên sản phẩm/), 'Samsung Note 8');
    await userEvent.type(screen.getByLabelText(/Số serial/), 'S1');
    await userEvent.click(screen.getByRole('button', { name: 'Lưu thiết bị' }));

    const call = f.mock.calls.find(([u, o]) => u.includes('/devices') && o?.method === 'POST');
    expect(JSON.parse(call[1].body)).toMatchObject({ product_name: 'Samsung Note 8', serial_no: 'S1', warranty_months: 12 });
    expect(await screen.findByLabelText('Thiết bị của khách hàng')).toHaveValue('1');
    expect(screen.getByRole('button', { name: 'Lưu phiếu bảo hành' })).toBeInTheDocument();
  });

  it('trùng số serial (409): hiện lỗi ngay ở ô serial, biểu mẫu vẫn còn để sửa', async () => {
    const f = vi.fn((url, opts = {}) => {
      if (url.includes('/issue-categories')) return Promise.resolve(ok({ data: [] }));
      if (url.includes('/devices') && opts.method === 'POST') {
        return Promise.resolve(fail(409, { error: 'SERIAL_DA_TON_TAI', message: 'Số serial này đã có trong hệ thống',
          fields: { serial_no: 'Số serial này đã được đăng ký cho một thiết bị khác' } }));
      }
      if (url.includes('/devices')) return Promise.resolve(ok({ data: [] }));
      return Promise.resolve(ok({ data: KHACH }));
    });
    vi.stubGlobal('fetch', f);
    renderPage();
    await userEvent.type(screen.getByLabelText('Số điện thoại khách hàng'), '0901234368');
    await userEvent.click(screen.getByRole('button', { name: 'Tra cứu' }));
    await userEvent.type(await screen.findByLabelText(/Tên sản phẩm/), 'iPhone');
    await userEvent.type(screen.getByLabelText(/Số serial/), 'TRUNG');
    await userEvent.click(screen.getByRole('button', { name: 'Lưu thiết bị' }));
    expect(await screen.findByText(/đã được đăng ký cho một thiết bị khác/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Số serial/)).toHaveValue('TRUNG');
  });
});
