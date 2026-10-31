import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clearSession, getSession, saveSession } from './session';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [session, setSession] = useState(() => getSession());

  const login = useCallback((s) => { saveSession(s); setSession(s); }, []);
  const logout = useCallback(() => { clearSession(); setSession(null); }, []);

  // Lớp gọi API phát sự kiện này khi nhận 401: xoá phiên và về trang đăng nhập.
  useEffect(() => {
    window.addEventListener('auth:unauthorized', logout);
    return () => window.removeEventListener('auth:unauthorized', logout);
  }, [logout]);

  // Tự đăng xuất đúng lúc token hết hạn (không cần chờ lần gọi API kế tiếp bị 401)
  useEffect(() => {
    if (!session?.expiresAt) return undefined;
    const ms = new Date(session.expiresAt).getTime() - Date.now();
    const id = setTimeout(logout, Math.max(0, Math.min(ms, 2 ** 31 - 1)));
    return () => clearTimeout(id);
  }, [session, logout]);

  const value = useMemo(() => ({ session, login, logout }), [session, login, logout]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export const useSession = () => useContext(SessionContext);
