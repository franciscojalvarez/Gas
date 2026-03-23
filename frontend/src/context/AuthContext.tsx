import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import api from '../api/axios';
import { User, LoginResponse } from '../types';

interface AuthContextType {
  user: User | null;
  permissions: string[];
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasPermission: (permissionName: string) => boolean;
  loadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    // Intentar cargar usuario desde token guardado
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async (): Promise<void> => {
    try {
      const [userResponse, permissionsResponse] = await Promise.all([
        api.get('/auth/me'),
        api.get('/auth/permissions')
      ]);
      setUser(userResponse.data);
      setPermissions(permissionsResponse.data);
    } catch (error) {
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      setUser(null);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.post<LoginResponse>('/auth/login', { username, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      // Cargar permisos
      const permissionsResponse = await api.get<string[]>('/auth/permissions');
      setPermissions(permissionsResponse.data);
      
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Error al iniciar sesión' 
      };
    }
  };

  const register = async (userData: any): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.post<LoginResponse>('/auth/register', userData);
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      // Cargar permisos
      const permissionsResponse = await api.get<string[]>('/auth/permissions');
      setPermissions(permissionsResponse.data);
      
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Error al registrar usuario' 
      };
    }
  };

  const logout = (): void => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setPermissions([]);
  };

  const hasPermission = (permissionName: string): boolean => {
    return permissions.includes(permissionName);
  };

  const value: AuthContextType = {
    user,
    permissions,
    loading,
    login,
    register,
    logout,
    hasPermission,
    loadUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

