import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as authApi from "../api/auth";
import type { User } from "../types";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    name: string;
    email: string;
    password: string;
    zipCode: string;
    isHost: boolean;
    phone?: string;
    backgroundCheckAccepted?: boolean;
  }) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "spacio_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const fetchMe = useCallback(async () => {
    if (!token) return;
    try {
      const data = await authApi.me();
      setUser(data);
    } catch (err) {
      console.error(err);
      setUser(null);
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
    }
  }, [token]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await authApi.login(email, password);
        localStorage.setItem(TOKEN_KEY, res.access_token);
        setToken(res.access_token);
        await fetchMe();
      } catch (err: any) {
        setError(err?.response?.data?.detail || "Login failed");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchMe]
  );

  const register = useCallback(
    async (input: {
      name: string;
      email: string;
      password: string;
      zipCode: string;
      isHost: boolean;
      phone?: string;
      backgroundCheckAccepted?: boolean;
    }) => {
      setLoading(true);
      setError(null);
      try {
        await authApi.register(input);
        await login(input.email, input.password);
      } catch (err: any) {
        setError(err?.response?.data?.detail || "Register failed");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [login]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo(
    () => ({ user, token, login, register, logout, loading, error }),
    [user, token, login, register, logout, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

