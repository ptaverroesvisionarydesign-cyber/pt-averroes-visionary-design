/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import { NotificationProvider } from './NotificationContext';
import LoginPage from './LoginPage';
import BrandingFooter from './components/BrandingFooter';
import { 
  LayoutDashboard, 
  FileText, 
  Database, 
  BarChart3, 
  LogOut, 
  Menu, 
  X,
  CreditCard,
  Settings,
  ShieldCheck
} from 'lucide-react';
import { UserRole } from './types';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

import Dashboard from './components/Dashboard';
import InputData from './components/InputData';
import DataListView from './components/DataListView';
import AdminSettings from './components/AdminSettings';
import GmvPaymentManagement from './components/GmvPaymentManagement';
import Statistik from './components/Statistik';

// Placeholder Pages

function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DATLAP, UserRole.OLDAT] },
    { name: 'Input Data', path: '/input', icon: FileText, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DATLAP] },
    { name: 'Data List', path: '/data', icon: Database, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DATLAP, UserRole.OLDAT] },
    { name: 'Statistik', path: '/stats', icon: BarChart3, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    { name: 'Pembayaran', path: '/payment', icon: CreditCard, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    { name: 'Pengaturan Admin', path: '/admin-settings', icon: ShieldCheck, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
  ].filter(item => item.roles.includes(user?.role as UserRole));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 bg-white border-r border-slate-200 flex-col sticky top-0 h-screen">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-purple-glow">
              <Database size={24} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-purple-900">SATDAPUS</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "geometric-sidebar-item",
                  isActive 
                    ? 'bg-purple-50 text-primary' 
                    : 'text-slate-500 hover:bg-slate-50'
                )}
              >
                <item.icon size={20} className={cn(isActive ? "text-primary" : "text-slate-400")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto border-t border-slate-100">
          <div className="bg-slate-900 rounded-2xl p-4 text-white flex items-center gap-3 mb-4 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-white shrink-0">
              {user?.name?.[0].toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate uppercase mt-0.5 tracking-wider">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all font-medium text-sm"
          >
            <LogOut size={18} />
            Keluar Aplikasi
          </button>
        </div>
      </aside>

      {/* Header - Mobile */}
      <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2 text-primary font-black tracking-tight">
          <Database size={20} />
          <span>SATDAPUS</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-600"
        >
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </header>

      {/* Sidebar - Mobile */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="md:hidden fixed inset-0 z-50 bg-white p-6 pt-20"
          >
            <button 
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-6 right-6 p-2"
            >
              <X />
            </button>
            <nav className="space-y-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-4 text-lg font-bold text-slate-700 py-3 border-b border-slate-50"
                >
                  <item.icon />
                  {item.name}
                </Link>
              ))}
              <button 
                onClick={logout}
                className="flex items-center gap-4 text-lg font-bold text-red-600 py-3 w-full text-left"
              >
                <LogOut />
                Keluar
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 relative overflow-auto">
        {children}
        <BrandingFooter />
      </main>
    </div>
  );
}

function MainRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-primary">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="flex flex-col items-center"
        >
          <Database size={48} className="mb-4" />
          <span className="font-black text-xl tracking-widest">SATDAPUS</span>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/input" element={(user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN || user.role === UserRole.DATLAP) ? <InputData /> : <Navigate to="/" />} />
        <Route path="/data" element={<DataListView />} />

        <Route path="/stats" element={(user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) ? <Statistik /> : <Navigate to="/" />} />
        <Route path="/payment" element={(user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) ? <GmvPaymentManagement /> : <Navigate to="/" />} />
        <Route path="/admin-settings" element={(user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) ? <AdminSettings /> : <Navigate to="/" />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <MainRoutes />
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}
