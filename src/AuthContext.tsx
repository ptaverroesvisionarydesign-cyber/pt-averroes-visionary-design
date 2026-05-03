/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, createContext, useContext, useEffect } from 'react';
import { User, UserRole } from './types';
import { dataService, initUsers } from './services/dataService';
import { auth } from './firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

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
    // 1. Check for saved session
    const savedUser = localStorage.getItem('satdapus_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // 2. Initialize users from Firestore immediately
    initUsers();

    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const trimmedEmail = email.trim();
    console.log("LOGIN INPUT:", trimmedEmail);
    
    // Check in dataService
    const foundUser = await dataService.getUserByEmail(trimmedEmail);
    console.log("USER FOUND:", foundUser);

    if (!foundUser) {
      throw new Error('Email tidak terdaftar');
    }

    // Since we don't have hashing yet, direct comparison
    if (foundUser.password !== password) {
      throw new Error('Password salah');
    }

    // Role check and login successful
    const { password: _, ...userWithoutPassword } = foundUser;
    const u = userWithoutPassword as User;
    
    setUser(u);
    localStorage.setItem('satdapus_user', JSON.stringify(u));
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
