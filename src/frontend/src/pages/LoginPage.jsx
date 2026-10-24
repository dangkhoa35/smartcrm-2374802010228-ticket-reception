import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useSession } from '../auth/SessionContext';
import { ROLES, ROLE_LABEL } from '../utils/labels';

export default function LoginPage() {
  const { session, login } = useSession();
  const navigate = useNavigate();
  const [role, setRole] = useState('NHAN_VIEN_TIEP_NHAN');
  const [employeeId, setEmployeeId] = useState('1');
  const [centerId, setCenterId] = useState('1');
  const [error, setError] = useState('');

  if (session) return <Navigate to="/tickets" replace />;

  function submit(e) {
    e.preventDefault();
    const emp = Number(employeeId), center = Number(centerId);
    if (!Number.isInteger(emp) || emp < 1 || !Number.isInteger(center) || center < 1) {
      setError('Mã nhân viên và mã trung tâm phải là số nguyên dương.');
      return;
    }
    login({ role, employeeId: emp, centerId: center });
    navigate('/tickets', { replace: true });
  }

  return (
    <main className="container narrow">
      <h1>Smart CRM – Mekong Mobile</h1>
      <p className="muted">Bản thử nghiệm Sprint 2: chọn vai trò làm việc. Đăng nhập bằng mật khẩu sẽ làm ở BT2.</p>
      <form onSubmit={submit} className="card form">
        <label>Vai trò
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
        </label>
        <label>Mã nhân viên
          <input inputMode="numeric" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
        </label>
        <label>Mã trung tâm bảo hành
          <input inputMode="numeric" value={centerId} onChange={(e) => setCenterId(e.target.value)} />
        </label>
        {error && <p className="field-error" role="alert">{error}</p>}
        <button type="submit" className="primary">Vào hệ thống</button>
      </form>
    </main>
  );
}
