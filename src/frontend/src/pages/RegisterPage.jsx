import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { useSession } from '../auth/SessionContext';
import { DataState } from '../components/DataState';
import { FieldError } from '../components/FieldError';
import { useApi } from '../hooks/useApi';
import { ROLES, ROLE_LABEL } from '../utils/labels';

const NEED_CODE = ['KY_THUAT_VIEN', 'QUAN_LY_TRUNG_TAM']; // khớp auth.service.js

export default function RegisterPage() {
  const { session } = useSession();
  const navigate = useNavigate();
  const centers = useApi(() => authApi.centers(), []);
  const [f, setF] = useState({ full_name: '', username: '', password: '', confirm: '', role: 'NHAN_VIEN_TIEP_NHAN', center_id: '', registration_code: '' });
  const [fields, setFields] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/tickets" replace />;
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (f.password !== f.confirm) { setFields({ confirm: 'Mật khẩu nhập lại không khớp' }); return; }
    setFields({}); setBusy(true);
    try {
      const { confirm, ...payload } = f; // eslint-disable-line no-unused-vars
      const u = await authApi.register(payload);
      navigate('/login', { replace: true, state: { registered: u.username } });
    } catch (err) {
      setF((p) => ({ ...p, password: '', confirm: '' }));
      if (err.fields) setFields(err.fields);
      if (!err.fields || err.status >= 500) setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container narrow">
      <h1>Đăng ký tài khoản</h1>
      <form onSubmit={submit} className="card form" noValidate>
        <label>Họ và tên
          <input value={f.full_name} onChange={set('full_name')} autoComplete="name" />
          <FieldError message={fields.full_name} />
        </label>
        <label>Tên đăng nhập
          <input value={f.username} onChange={set('username')} autoComplete="username" autoCapitalize="none" />
          <span className="muted hint">4–30 ký tự: chữ thường không dấu, số, dấu chấm, gạch dưới</span>
          <FieldError message={fields.username} />
        </label>
        <label>Mật khẩu
          <input type="password" value={f.password} onChange={set('password')} autoComplete="new-password" />
          <span className="muted hint">Tối thiểu 8 ký tự, có ít nhất một chữ cái và một chữ số</span>
          <FieldError message={fields.password} />
        </label>
        <label>Nhập lại mật khẩu
          <input type="password" value={f.confirm} onChange={set('confirm')} autoComplete="new-password" />
          <FieldError message={fields.confirm} />
        </label>
        <label>Vai trò
          <select value={f.role} onChange={set('role')}>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
          <FieldError message={fields.role} />
        </label>
        {NEED_CODE.includes(f.role) && (
          <label>Mã đăng ký
            <input value={f.registration_code} onChange={set('registration_code')} autoComplete="off" />
            <span className="muted hint">Vai trò này cần mã do quản trị hệ thống cấp</span>
            <FieldError message={fields.registration_code} />
          </label>
        )}
        <div>
          <DataState loading={centers.loading} error={centers.error} data={centers.result} onRetry={centers.reload}
            empty={{ message: 'Chưa có trung tâm bảo hành nào. Hãy chạy npm run seed.' }}>
            {(list) => (
              <label>Trung tâm bảo hành
                <select value={f.center_id} onChange={set('center_id')}>
                  <option value="">— Chọn trung tâm —</option>
                  {list.map((c) => <option key={c.center_id} value={c.center_id}>{c.center_name}{c.city ? ` (${c.city})` : ''}</option>)}
                </select>
                <FieldError message={fields.center_id} />
              </label>
            )}
          </DataState>
        </div>
        {error && <p className="alert alert-error" role="alert">{error}</p>}
        <button type="submit" className="primary" disabled={busy}>{busy ? 'Đang đăng ký…' : 'Đăng ký'}</button>
        <p className="muted">Đã có tài khoản? <Link to="/login">Đăng nhập</Link></p>
      </form>
    </main>
  );
}
