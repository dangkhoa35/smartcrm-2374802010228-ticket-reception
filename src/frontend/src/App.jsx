import { Link, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useSession } from './auth/SessionContext';
import { Layout } from './components/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TicketListPage from './pages/TicketListPage';
import TicketDetailPage from './pages/TicketDetailPage';
import ReceiveDevicePage from './pages/ReceiveDevicePage';

function RequireSession() {
  const { session } = useSession();
  // 401 từ API xoá phiên -> quay về đây -> về trang đăng nhập
  return session ? <Outlet /> : <Navigate to="/login" replace />;
}

const NotFound = () => (
  <section>
    <h1>Không tìm thấy trang</h1>
    <p><Link to="/tickets">◀ Về danh sách phiếu bảo hành</Link></p>
  </section>
);

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<RequireSession />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/tickets" replace />} />
          <Route path="/tickets" element={<TicketListPage />} />
          <Route path="/tickets/new" element={<ReceiveDevicePage />} />
          <Route path="/tickets/:id" element={<TicketDetailPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
