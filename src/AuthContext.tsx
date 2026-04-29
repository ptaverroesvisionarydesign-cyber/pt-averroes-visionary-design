/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, createContext, useContext, useEffect } from 'react';
import { User, UserRole } from './types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for saved session
    const savedUser = localStorage.getItem('satdapus_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Hardcoded demo authentication as requested
    if (email === 'admin@halal.id' && password === 'avd2711') {
      const u: User = { id: 'admin', email, name: 'Super Admin', role: UserRole.SUPER_ADMIN, status: 'Aktif', joinDate: '2025-01-01', lastLogin: '-' };
      setUser(u);
      localStorage.setItem('satdapus_user', JSON.stringify(u));
      return;
    }

    if (email === 'admin.biasa@halal.id' && password === 'admin') {
      const u: User = { id: 'admin2', email, name: 'Admin Operasional', role: UserRole.ADMIN, status: 'Aktif', joinDate: '2025-01-05', lastLogin: '-' };
      setUser(u);
      localStorage.setItem('satdapus_user', JSON.stringify(u));
      return;
    }

    if (email === 'userdatlap1@halal.id' && password === 'useruserdatlap001') {
      const u: User = { id: 'dl1', email, name: 'Data Lapangan 1', role: UserRole.DATLAP, kodeWilayah: 'LEUWISARI', status: 'Aktif', joinDate: '2025-01-10', lastLogin: '-' };
      setUser(u);
      localStorage.setItem('satdapus_user', JSON.stringify(u));
      return;
    }

    if (email === 'userOldat1@halal.id' && password === 'useruseroldat001') {
      const u: User = { id: 'od1', email, name: 'Olah Data 1', role: UserRole.OLDAT, status: 'Aktif', joinDate: '2025-02-15', lastLogin: '-' };
      setUser(u);
      localStorage.setItem('satdapus_user', JSON.stringify(u));
      return;
    }

    throw new Error('Email atau password salah');
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('satdapus_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
