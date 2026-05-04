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
  ShieldCheck,
  DollarSign,
  MessageSquare
} from 'lucide-react';
import { UserRole } from './types';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

import Dashboard from './components/Dashboard';
import InputData from './components/InputData';
import DataListView from './components/DataListView';
import AdminSettings from './components/AdminSettings';
import GmvSettings from './components/GmvSettings';
import ChatGroup from './components/ChatGroup';
import GmvPaymentManagement from './components/GmvPaymentManagement';
import Statistik from './components/Statistik';

// Placeholder Pages

function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [chatUnread, setChatUnread] = React.useState(Number(localStorage.getItem('chat_unread_count') || 0));
  const location = useLocation();

  React.useEffect(() => {
    const handleUnreadUpdate = () => {
      setChatUnread(Number(localStorage.getItem('chat_unread_count') || 0));
    };
    window.addEventListener('chat_unread_updated', handleUnreadUpdate);
    return () => window.removeEventListener('chat_unread_updated', handleUnreadUpdate);
  }, []);

  const navigation = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DATLAP, UserRole.OLDAT] },
    { name: 'Input Data', path: '/input', icon: FileText, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DATLAP] },
    { name: 'Data List', path: '/data', icon: Database, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DATLAP, UserRole.OLDAT] },
    { name: 'Chat Grup', path: '/chat', icon: MessageSquare, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DATLAP, UserRole.OLDAT] },
    { name: 'Statistik', path: '/stats', icon: BarChart3, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    { name: 'Pembayaran', path: '/payment', icon: CreditCard, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    { name: 'Pengaturan GMV', path: '/gmv-settings', icon: DollarSign, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
    { name: 'Pengaturan Admin', path: '/admin-settings', icon: ShieldCheck, roles: [UserRole.SUPER_ADMIN, UserRole.ADMIN] },
  ].filter(item => item.roles.includes(user?.role as UserRole));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row overflow-x-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 lg:w-72 bg-white border-r border-slate-200 flex-col sticky top-0 h-screen shrink-0">
        <div className="p-8">
          <div className="flex items-center justify-center">
            <img src="satdapus.png" alt="SATDAPUS Logo" className="w-full h-auto object-contain" referrerPolicy="no-referrer" />
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
                {item.name === 'Chat Grup' && chatUnread > 0 && (
                  <span className="ml-auto bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full animate-pulse">
                    {chatUnread}
                  </span>
                )}
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
      <header className="md:hidden bg-white/80 backdrop-blur-md border-b border-slate-100 p-4 flex items-center justify-between sticky top-0 z-40">
        <div className="h-8 flex items-center">
          <img src="satdapus.png" alt="SATDAPUS Logo" className="h-full w-auto object-contain" referrerPolicy="no-referrer" />
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2.5 bg-slate-50 text-slate-900 rounded-xl active:scale-95 transition-all"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-2 py-2 flex justify-around items-center z-[100] shadow-2xl">
        {navigation.slice(0, 5).map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-2xl transition-all relative",
                isActive ? "text-primary bg-primary/5" : "text-slate-400"
              )}
            >
              <item.icon size={20} />
              {item.name === 'Chat Grup' && chatUnread > 0 && (
                <span className="absolute top-1 right-1 bg-primary text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse border-2 border-white">
                  {chatUnread}
                </span>
              )}
              <span className="text-[8px] font-black uppercase tracking-tighter">{item.name.split(' ')[0]}</span>
            </Link>
          );
        })}
        {/* More button for extra nav items if any */}
        {navigation.length > 5 && (
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center gap-1 p-2 text-slate-400"
          >
            <Menu size={20} />
            <span className="text-[8px] font-black uppercase tracking-tighter">More</span>
          </button>
        )}
      </nav>

      {/* Sidebar - Mobile Overlay (Only for 'More' or settings) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden fixed inset-0 z-[150] bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-[160] bg-white rounded-t-[3rem] shadow-2xl flex flex-col max-h-[80vh] overflow-hidden"
            >
              <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                 <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Menu Lainnya</h3>
                 <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-slate-400"><X size={20} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex flex-col items-center gap-3 p-6 rounded-3xl text-center transition-all",
                        isActive 
                          ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                          : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                      )}
                    >
                      <item.icon size={24} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="p-8 border-t border-slate-50 bg-slate-50/50">
                <button 
                  onClick={logout}
                  className="flex items-center justify-center gap-3 w-full px-6 py-5 rounded-2xl bg-white border border-slate-200 text-rose-600 font-black text-xs uppercase tracking-widest shadow-sm"
                >
                  <LogOut size={18} />
                  Keluar Aplikasi
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 relative min-h-[calc(100vh-64px)] md:min-h-screen pb-20 md:pb-0">
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
          animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="flex flex-col items-center max-w-xs px-8"
        >
          <img src="satdapus.png" alt="SATDAPUS Logo" className="w-full h-auto object-contain" referrerPolicy="no-referrer" />
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
        <Route path="/chat" element={<ChatGroup />} />

        <Route path="/stats" element={(user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) ? <Statistik /> : <Navigate to="/" />} />
        <Route path="/payment" element={(user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) ? <GmvPaymentManagement /> : <Navigate to="/" />} />
        <Route path="/gmv-settings" element={(user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) ? <GmvSettings /> : <Navigate to="/" />} />
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
