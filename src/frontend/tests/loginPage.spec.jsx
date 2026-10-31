import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SessionProvider } from '../src/auth/SessionContext';
import { getSession } from '../src/auth/session';
import LoginPage from '../src/pages/LoginPage';

const res = (status, body) => ({ ok: status < 400, status, json: async () => body });
const LOGIN_OK = res(200, { data: {
  token: 'tok.en.xyz', expires_at: new Date(Date.now() + 1800 * 1000).toISOString(),
  user: { employee_id: 2, full_name: 'Kỹ thuật Mẫu', username: 'kythuatvien', role: 'KY_THUAT_VIEN', center_id: 1 },
} });

function renderPage(state) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/login', state }]}>
      <SessionProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/tickets" element={<h1>Danh sách phiếu</h1>} />
        </Routes>
      </SessionProvider>
    </MemoryRouter>);
}
beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe('Trang đăng nhập', () => {
  it('luồng đúng: đăng nhập, lưu phiên có token (vai trò lấy từ tài khoản) và vào danh sách phiếu', async () => {
    const f = vi.fn().mockResolvedValue(LOGIN_OK);
    vi.stubGlobal('fetch', f);
    renderPage();
    await userEvent.type(screen.getByLabelText('Tên đăng nhập'), 'kythuatvien');
    await userEvent.type(screen.getByLabelText('Mật khẩu'), 'Kythuat@123');
    await userEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(await screen.findByRole('heading', { name: 'Danh sách phiếu' })).toBeInTheDocument();
    const [url, opts] = f.mock.calls[0];
    expect(url).toBe('http://api.test/api/auth/login');
    expect(JSON.parse(opts.body)).toEqual({ username: 'kythuatvien', password: 'Kythuat@123' });
    expect(getSession()).toMatchObject({ token: 'tok.en.xyz', role: 'KY_THUAT_VIEN', employeeId: 2, centerId: 1 });
  });

  it('dữ liệu sai: máy chủ trả 401 -> hiện một câu chung, xóa ô mật khẩu, không lưu phiên', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(res(401, { error: 'SAI_THONG_TIN_DANG_NHAP', message: 'Sai tên đăng nhập hoặc mật khẩu' })));
    renderPage();
    await userEvent.type(screen.getByLabelText('Tên đăng nhập'), 'quanly');
    await userEvent.type(screen.getByLabelText('Mật khẩu'), 'sai-roi-nhe');
    await userEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));

    expect(await screen.findByText('Sai tên đăng nhập hoặc mật khẩu')).toBeInTheDocument();
    expect(screen.getByLabelText('Mật khẩu')).toHaveValue('');
    expect(getSession()).toBeNull();
  });

  it('biên: để trống hai ô -> lỗi theo từng trường từ máy chủ (400), không chuyển trang', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(res(400, { error: 'DU_LIEU_KHONG_HOP_LE', message: 'x',
      fields: { username: 'Vui lòng nhập tên đăng nhập', password: 'Vui lòng nhập mật khẩu' } })));
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: 'Đăng nhập' }));
    expect(await screen.findByText('Vui lòng nhập tên đăng nhập')).toBeInTheDocument();
    expect(screen.getByText('Vui lòng nhập mật khẩu')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Danh sách phiếu' })).not.toBeInTheDocument();
  });

  it('khung tài khoản dùng thử mặc định thu gọn; bấm nút mới mở bảng, bấm lại thì thu gọn', async () => {
    renderPage();
    const nut = screen.getByRole('button', { name: /Xem/ });
    expect(nut).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('quanly')).not.toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument(); // không còn nút chọn vai trò
    await userEvent.click(nut);
    expect(screen.getByText('quanly')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Thu gọn/ }));
    expect(screen.queryByText('quanly')).not.toBeInTheDocument();
  });

  it('nút "Điền sẵn" điền tên đăng nhập và mật khẩu của tài khoản mẫu; nút Hiện cho xem mật khẩu', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /Xem/ }));
    const row = screen.getByText('quanly').closest('tr');
    await userEvent.click(row.querySelector('button'));
    expect(screen.getByLabelText('Tên đăng nhập')).toHaveValue('quanly');
    expect(screen.getByLabelText('Mật khẩu')).toHaveValue('Quanly@123');
    expect(screen.getByLabelText('Mật khẩu')).toHaveAttribute('type', 'password');
    await userEvent.click(screen.getByRole('button', { name: 'Hiện' }));
    expect(screen.getByLabelText('Mật khẩu')).toHaveAttribute('type', 'text');
  });

  it('vừa đăng ký xong: báo thành công và điền sẵn tên đăng nhập', () => {
    renderPage({ registered: 'van.an' });
    expect(screen.getByRole('status')).toHaveTextContent('Đăng ký thành công');
    expect(screen.getByLabelText('Tên đăng nhập')).toHaveValue('van.an');
  });
});
