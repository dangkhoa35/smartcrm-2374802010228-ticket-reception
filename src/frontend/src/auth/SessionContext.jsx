import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clearSession, getSession, saveSession } from './session';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [session, setSession] = useState(() => getSession());

  const login = useCallback((s) => { saveSession(s); setSession(s); }, []);
  const switchRole = useCallback((role) => {
    setSession((prev) => { const next = { ...prev, role }; saveSession(next); return next; });
  }, []);
  const logout = useCallback(() => { clearSession(); setSession(null); }, []);

  // Lớp gọi API phát sự kiện này khi nhận 401: xoá phiên và về trang đăng nhập.
  useEffect(() => {
    window.addEventListener('auth:unauthorized', logout);
    return () => window.removeEventListener('auth:unauthorized', logout);
  }, [logout]);

  const value = useMemo(() => ({ session, login, switchRole, logout }), [session, login, switchRole, logout]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
