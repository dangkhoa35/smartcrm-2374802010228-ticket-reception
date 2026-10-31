import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { useSession } from '../auth/SessionContext';
import { FieldError } from '../components/FieldError';
import { ROLE_LABEL } from '../utils/labels';

// Tài khoản dùng thử (khớp seed.js). Chỉ hiện khi VITE_SHOW_DEMO_ACCOUNTS khác 'false'.
const DEMO = [
  { role: 'NHAN_VIEN_TIEP_NHAN', username: 'tiepnhan', password: 'Tiepnhan@123' },
  { role: 'KY_THUAT_VIEN', username: 'kythuatvien', password: 'Kythuat@123' },
  { role: 'QUAN_LY_TRUNG_TAM', username: 'quanly', password: 'Quanly@123' },
];
const SHOW_DEMO = import.meta.env.VITE_SHOW_DEMO_ACCOUNTS !== 'false';

export default function LoginPage() {
  const { session, login } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const registered = location.state?.registered; // vừa đăng ký xong: điền sẵn tên và báo thành công
  const [username, setUsername] = useState(registered ?? '');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [fields, setFields] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false); // khung tài khoản dùng thử mặc định thu gọn

  if (session) return <Navigate to="/tickets" replace />;

  async function submit(e) {
    e.preventDefault();
    setError(''); setFields({});
    setBusy(true);
    try {
      const r = await authApi.login({ username, password });
      login({
        token: r.token, expiresAt: r.expires_at, role: r.user.role, employeeId: r.user.employee_id,
        centerId: r.user.center_id, fullName: r.user.full_name, username: r.user.username,
      });
      navigate('/tickets', { replace: true });
    } catch (err) {
      setPassword(''); // không giữ mật khẩu sau khi thất bại
      if (err.fields) setFields(err.fields); else setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container narrow">
      <h1>Smart CRM – Mekong Mobile</h1>
      <p className="muted">Đăng nhập hệ thống tiếp nhận bảo hành</p>
      {registered && <p className="alert alert-success" role="status">Đăng ký thành công. Hãy đăng nhập bằng tài khoản <strong>{registered}</strong>.</p>}
      <form onSubmit={submit} className="card form" noValidate>
        <label>Tên đăng nhập
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" autoCapitalize="none" />
          <FieldError message={fields.username} />
        </label>
        <label>Mật khẩu
          <span className="pw-row">
            <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            <button type="button" onClick={() => setShowPw((v) => !v)} aria-pressed={showPw}>{showPw ? 'Ẩn' : 'Hiện'}</button>
          </span>
          <FieldError message={fields.password} />
        </label>
        {error && <p className="alert alert-error" role="alert">{error}</p>}
        <button type="submit" className="primary" disabled={busy}>{busy ? 'Đang đăng nhập…' : 'Đăng nhập'}</button>
        <p className="muted">Chưa có tài khoản? <Link to="/register">Đăng ký</Link></p>
      </form>

      {SHOW_DEMO && (
        <section className="card" aria-label="Tài khoản dùng thử">
          <div className="demo-head">
            <h2>Tài khoản dùng thử</h2>
            <button type="button" aria-expanded={demoOpen} aria-controls="demo-body" onClick={() => setDemoOpen((v) => !v)}>
              {demoOpen ? 'Thu gọn ▲' : 'Xem ▼'}
            </button>
          </div>
          {demoOpen && (
            <div id="demo-body">
              <p className="muted">Mỗi vai trò có một tài khoản riêng. Chỉ để chạy thử, không dùng khi triển khai thật.</p>
              <table className="demo-table">
                <thead><tr><th>Vai trò</th><th>Tên đăng nhập</th><th>Mật khẩu</th><th /></tr></thead>
                <tbody>
                  {DEMO.map((d) => (
                    <tr key={d.username}>
                      <td>{ROLE_LABEL[d.role]}</td><td><code>{d.username}</code></td><td><code>{d.password}</code></td>
                      <td><button type="button" onClick={() => { setUsername(d.username); setPassword(d.password); setError(''); setFields({}); }}>Điền sẵn</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
