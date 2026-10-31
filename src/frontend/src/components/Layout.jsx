import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useSession } from '../auth/SessionContext';
import { ROLE_LABEL } from '../utils/labels';

export function Layout() {
  const { session, logout } = useSession();
  const navigate = useNavigate();
  return (
    <>
      <header className="topbar">
        <Link to="/tickets" className="brand">Smart CRM – Mekong Mobile · Trung tâm bảo hành</Link>
        <div className="topbar-user">
          <span><strong>{session.fullName ?? `NV ${session.employeeId}`}</strong> · {ROLE_LABEL[session.role]}</span>
          <span className="muted">TT {session.centerId}</span>
          <button type="button" onClick={() => { logout(); navigate('/login'); }}>Đăng xuất</button>
        </div>
      </header>
      {/* key: đăng nhập tài khoản khác thì dựng lại trang để tải dữ liệu mới,
          không giữ dữ liệu của vai trò trước (ví dụ số điện thoại chưa che, NFR2). */}
      <main className="container" key={`${session.role}-${session.employeeId}-${session.centerId}`}><Outlet /></main>
    </>
  );
}
