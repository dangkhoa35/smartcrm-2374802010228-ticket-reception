import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { SessionProvider } from '../src/auth/SessionContext';
import RegisterPage from '../src/pages/RegisterPage';

const res = (status, body) => ({ ok: status < 400, status, json: async () => body });
const CENTERS = res(200, { data: [
  { center_id: 1, center_code: 'TT01', center_name: 'Trung tâm Cần Thơ', city: 'Cần Thơ' },
  { center_id: 2, center_code: 'TT02', center_name: 'Trung tâm Vĩnh Long', city: 'Vĩnh Long' },
] });

const Dich = () => { const l = useLocation(); return <p>Đã sang đăng nhập: {l.state?.registered}</p>; };
function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <SessionProvider>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<Dich />} />
        </Routes>
      </SessionProvider>
    </MemoryRouter>);
}
async function dien({ confirm = 'Matkhau123' } = {}) {
  await userEvent.type(screen.getByLabelText('Họ và tên'), 'Nguyễn Văn An');
  await userEvent.type(screen.getByLabelText(/^Tên đăng nhập/), 'van.an');
  await userEvent.type(screen.getByLabelText(/^Mật khẩu/), 'Matkhau123');
  await userEvent.type(screen.getByLabelText('Nhập lại mật khẩu'), confirm);
  await userEvent.selectOptions(await screen.findByLabelText('Trung tâm bảo hành'), '2');
}
beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe('Trang đăng ký', () => {
  it('luồng đúng: gửi đủ trường (không gửi ô nhập lại), rồi chuyển sang đăng nhập kèm tên vừa đăng ký', async () => {
    const f = vi.fn().mockResolvedValueOnce(CENTERS).mockResolvedValueOnce(res(201, { data: { username: 'van.an', role: 'NHAN_VIEN_TIEP_NHAN' } }));
    vi.stubGlobal('fetch', f);
    renderPage();
    await dien();
    await userEvent.click(screen.getByRole('button', { name: 'Đăng ký' }));

    expect(await screen.findByText('Đã sang đăng nhập: van.an')).toBeInTheDocument();
    const [url, opts] = f.mock.calls[1];
    expect(url).toBe('http://api.test/api/auth/register');
    const body = JSON.parse(opts.body);
    expect(body).toMatchObject({ full_name: 'Nguyễn Văn An', username: 'van.an', role: 'NHAN_VIEN_TIEP_NHAN', center_id: '2' });
    expect(body.confirm).toBeUndefined();
  });

  it('dữ liệu sai: nhập lại mật khẩu không khớp -> báo ngay, KHÔNG gọi máy chủ để đăng ký', async () => {
    const f = vi.fn().mockResolvedValue(CENTERS);
    vi.stubGlobal('fetch', f);
    renderPage();
    await dien({ confirm: 'KhacHan999' });
    await userEvent.click(screen.getByRole('button', { name: 'Đăng ký' }));
    expect(await screen.findByText('Mật khẩu nhập lại không khớp')).toBeInTheDocument();
    expect(f).toHaveBeenCalledTimes(1); // chỉ lần tải danh sách trung tâm
  });

  it('biên: ô Mã đăng ký chỉ hiện với Kỹ thuật viên và Quản lý, ẩn với Nhân viên tiếp nhận', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(CENTERS));
    renderPage();
    await screen.findByLabelText('Trung tâm bảo hành');
    expect(screen.queryByLabelText(/^Mã đăng ký/)).not.toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText('Vai trò'), 'QUAN_LY_TRUNG_TAM');
    expect(screen.getByLabelText(/^Mã đăng ký/)).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText('Vai trò'), 'NHAN_VIEN_TIEP_NHAN');
    expect(screen.queryByLabelText(/^Mã đăng ký/)).not.toBeInTheDocument();
  });

  it('dữ liệu sai: tên đăng nhập trùng (409) và mã đăng ký sai (403) hiện cạnh đúng ô, giữ nguyên các ô khác', async () => {
    const f = vi.fn().mockResolvedValueOnce(CENTERS)
      .mockResolvedValueOnce(res(409, { error: 'TEN_DANG_NHAP_DA_TON_TAI', message: 'Tên đăng nhập này đã có người dùng', fields: { username: 'Tên đăng nhập này đã có người dùng' } }));
    vi.stubGlobal('fetch', f);
    renderPage();
    await dien();
    await userEvent.click(screen.getByRole('button', { name: 'Đăng ký' }));
    expect(await screen.findByText('Tên đăng nhập này đã có người dùng')).toBeInTheDocument();
    expect(screen.getByLabelText('Họ và tên')).toHaveValue('Nguyễn Văn An');
    expect(screen.getByLabelText(/^Mật khẩu/)).toHaveValue('');
  });

  it('lỗi tải danh sách trung tâm (503): hiện lỗi dễ hiểu và nút Thử lại (ba trạng thái)', async () => {
    const f = vi.fn().mockResolvedValueOnce(res(503, { error: 'LOI_HE_THONG', message: 'Hệ thống đang gặp sự cố. Mã tra cứu: AB12' })).mockResolvedValueOnce(CENTERS);
    vi.stubGlobal('fetch', f);
    renderPage();
    expect(await screen.findByText(/Mã tra cứu: AB12/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
    expect(await screen.findByLabelText('Trung tâm bảo hành')).toBeInTheDocument();
  });
});
