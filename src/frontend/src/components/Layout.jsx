import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useSession } from '../auth/SessionContext';
import { ROLES, ROLE_LABEL } from '../utils/labels';

export function Layout() {
  const { session, switchRole, logout } = useSession();
  const navigate = useNavigate();
  return (
    <>
      <header className="topbar">
        <Link to="/tickets" className="brand">Smart CRM – Mekong Mobile · Trung tâm bảo hành</Link>
        <div className="topbar-user">
          <label>Vai trò:{' '}
            <select value={session.role} aria-label="Vai trò"
              onChange={(e) => { switchRole(e.target.value); navigate('/tickets'); }}>
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </label>
          <span className="muted">NV {session.employeeId} · TT {session.centerId}</span>
          <button type="button" onClick={() => { logout(); navigate('/login'); }}>Đổi người dùng</button>
        </div>
      </header>
      {/* key: đổi vai trò / nhân viên / trung tâm thì dựng lại trang để tải dữ liệu mới.
          Nếu không, trang giữ dữ liệu của vai trò trước (ví dụ số điện thoại chưa che, NFR2). */}
      <main className="container" key={`${session.role}-${session.employeeId}-${session.centerId}`}><Outlet /></main>
    </>
  );
}
