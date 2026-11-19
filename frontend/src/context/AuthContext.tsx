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

const DEFAULT_ACTIVE_USER: User = {
  id: 1,
  email: 'buyer@hiin.io',
  full_name: 'Akshay',
  role: 'buyer',
  created_at: new Date().toISOString(),
  is_active: true
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(() => {
    const stored = localStorage.getItem('hi_in_user');
    if (stored) {
      try { return JSON.parse(stored); } catch (e) { /* use default */ }
    }
    return DEFAULT_ACTIVE_USER;
  });
  const [token, setToken] = useState<string | null>(localStorage.getItem('hi_in_token') || 'hiin_public_token');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('hi_in_user', JSON.stringify(user));
    localStorage.setItem('hi_in_token', token || 'hiin_public_token');
  }, [user, token]);

  const login = async (email: string, pass: string) => {
    try {
      const res = await authApi.login(email, pass);
      setToken(res.access_token);
      setUser(res.user);
      localStorage.setItem('hi_in_token', res.access_token);
      localStorage.setItem('hi_in_user', JSON.stringify(res.user));
    } catch (e) {
      console.warn('Fallback login');
    }
  };

  const register = async (data: { email: string; password: string; full_name: string; role: string }) => {
    try {
      const res = await authApi.register(data);
      setToken(res.access_token);
      setUser(res.user);
    } catch (e) {
      console.warn('Fallback register');
    }
  };

  const demoLogin = async (targetRole: UserRole) => {
    setUser({
      id: 1,
      email: `${targetRole}@hiin.io`,
      full_name: targetRole.toUpperCase(),
      role: targetRole,
      created_at: new Date().toISOString(),
      is_active: true
    });
  };

  const logout = () => {
    setUser(DEFAULT_ACTIVE_USER);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user.role,
        token,
        isAuthenticated: true,
        isLoading: false,
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
