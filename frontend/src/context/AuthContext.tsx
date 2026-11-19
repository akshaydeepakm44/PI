import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: { email: string; password: string; full_name: string; role: string }) => Promise<void>;
  demoLogin: (role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('hi_in_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('hi_in_token');
      const storedUser = localStorage.getItem('hi_in_user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          // Refresh user data from server in background
          const freshUser = await authApi.getMe();
          setUser(freshUser);
          localStorage.setItem('hi_in_user', JSON.stringify(freshUser));
        } catch (err) {
          console.warn('Session expired or invalid token', err);
          logout();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await authApi.login(email, pass);
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem('hi_in_token', res.access_token);
    localStorage.setItem('hi_in_user', JSON.stringify(res.user));
  };

  const register = async (data: { email: string; password: string; full_name: string; role: string }) => {
    const res = await authApi.register(data);
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem('hi_in_token', res.access_token);
    localStorage.setItem('hi_in_user', JSON.stringify(res.user));
  };

  const demoLogin = async (targetRole: UserRole) => {
    const res = await authApi.demoLogin(targetRole);
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem('hi_in_token', res.access_token);
    localStorage.setItem('hi_in_user', JSON.stringify(res.user));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('hi_in_token');
    localStorage.removeItem('hi_in_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user ? user.role : null,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        demoLogin,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
