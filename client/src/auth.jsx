import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';
const Ctx = createContext();
export const useAuth = () => useContext(Ctx);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api('/auth/me').then(d => setUser(d.user)).catch(() => {}).finally(() => setLoading(false)); }, []);
  const logout = async () => { await api('/auth/logout', 'POST'); setUser(null); };
  return <Ctx.Provider value={{ user, setUser, loading, logout }}>{children}</Ctx.Provider>;
}
export function useTheme() {
  const [dark, setDark] = useState(() => localStorage.theme ? localStorage.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); localStorage.theme = dark ? 'dark' : 'light'; }, [dark]);
  return [dark, () => setDark(d => !d)];
}
