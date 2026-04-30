/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  User as UserIcon, 
  TrendingUp, 
  History, 
  Activity as ActivityIcon, 
  Settings, 
  Wallet,
  Shield,
  Clock,
  MapPin,
  Mail,
  Edit3,
  Lock,
  RefreshCw,
  Bell,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Globe,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Briefcase,
  Phone,
  Activity,
  Save,
  ChevronLeft,
  Loader2,
  LogOut
} from 'lucide-react';
import { User, UserRole, UserActivity, Pembayaran } from '../types';
import { cn } from '../lib/utils';
import { useAuth } from '../AuthContext';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface UserDetailModalProps {
  user: User;
  onClose: () => void;
  onUpdateUser: (updatedUser: User) => void;
  onDeleteUser: (userId: string) => void;
  onEdit: (user: User) => void;
}

type TabType = 'Overview' | 'Keuangan' | 'Riwayat' | 'Aktivitas' | 'Aksi Admin';

export default function UserDetailModal({ user, onClose, onUpdateUser, onDeleteUser, onEdit }: UserDetailModalProps) {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('Overview');
  const [isSuspending, setIsSuspending] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const [userForm, setUserForm] = useState({
    name: user.name,
    email: user.email,
    noHp: user.noHp || '',
    role: user.role,
    status: user.status,
    kodeWilayah: user.kodeWilayah || '',
    resetPassword: false,
    password: '',
    forceLogout: false
  });

  // Mock Data for the modal
  const stats = useMemo(() => {
    const isHighPerformer = user.role === UserRole.DATLAP ? 85 : 92;
    return {
      score: isHighPerformer,
      status: isHighPerformer > 80 ? 'Produktif' : isHighPerformer > 50 ? 'Normal' : 'Bermasalah',
      handleCount: user.role === UserRole.OLDAT ? 124 : 85,
      totalGmv: 45000000,
      totalPaid: 42000000,
      debt: 3000000,
      trxCount: 156
    };
  }, [user]);

  const chartData = [
    { name: 'Jan', gmv: 4000, paid: 2400 },
    { name: 'Feb', gmv: 3000, paid: 1398 },
    { name: 'Mar', gmv: 2000, paid: 9800 },
    { name: 'Apr', gmv: 2780, paid: 3908 },
    { name: 'May', gmv: 1890, paid: 4800 },
    { name: 'Jun', gmv: 2390, paid: 3800 },
  ];

  const activities: UserActivity[] = [
    { id: '1', userId: user.id, type: 'LOGIN', description: 'Login Berhasil', timestamp: '2026-04-29 08:30', device: 'Chrome / Windows', ip: '192.168.1.1' },
    { id: '2', userId: user.id, type: 'INPUT_PAYMENT', description: 'Input Pembayaran MSME #124', timestamp: '2026-04-28 15:20', device: 'Chrome / Windows', ip: '192.168.1.1' },
    { id: '3', userId: user.id, type: 'UPDATE_DATA', description: 'Update data NIB Pelaku Usaha Asep', timestamp: '2026-04-28 11:10', device: 'Android / Mobile', ip: '10.0.0.5' },
    { id: '4', userId: user.id, type: 'INPUT_GMV', description: 'Input GMV Bulanan April', timestamp: '2026-04-27 09:45', device: 'Chrome / Windows', ip: '192.168.1.1' },
  ];

  const transactions: Pembayaran[] = [
    { id: 'TX001', timestamp: '2026-04-25 10:00', userId: user.id, role: user.role, totalGmv: 1000000, jumlahDibayar: 1000000, sisa: 0, status: 'Lunas', metode: 'Transfer', keterangan: 'Januari' },
    { id: 'TX002', timestamp: '2026-04-26 14:30', userId: user.id, role: user.role, totalGmv: 2000000, jumlahDibayar: 1000000, sisa: 1000000, status: 'Sebagian', metode: 'Cash', keterangan: 'Februari' },
    { id: 'TX003', timestamp: '2026-04-27 09:15', userId: user.id, role: user.role, totalGmv: 1500000, jumlahDibayar: 0, sisa: 1500000, status: 'Belum Dibayar', metode: 'E-Wallet', keterangan: 'Maret' },
  ];

  const renderOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="geometric-card p-8 bg-white border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-all group-hover:scale-110" />
          <div className="flex items-start gap-6 relative">
            <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center text-primary border-4 border-white shadow-xl shadow-primary/5">
              <UserIcon size={48} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">{user.name}</h2>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                  user.status === 'Aktif' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
                )}>
                  {user.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-400">
                <div className="flex items-center gap-1.5"><Shield size={14} className="text-primary" /> {user.role}</div>
                <div className="flex items-center gap-1.5"><MapPin size={14} className="text-primary" /> {user.kodeWilayah || 'Semua Wilayah'}</div>
                <div className="flex items-center gap-1.5"><Mail size={14} className="text-primary" /> {user.email}</div>
              </div>
              <div className="pt-4 flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID USER:</span>
                <span className="text-xs font-mono font-black text-slate-600 bg-slate-50 px-2 py-1 rounded">USR-{user.id.padStart(6, '0')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="geometric-card p-6 bg-slate-50 border-slate-100">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Clock size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Tanggal Join</span>
            </div>
            <div className="text-lg font-black text-slate-800">{user.joinDate}</div>
          </div>
          <div className="geometric-card p-6 bg-slate-50 border-slate-100">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <ActivityIcon size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Last Login</span>
            </div>
            <div className="text-lg font-black text-slate-800">{user.lastLogin}</div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="geometric-card p-8 bg-slate-900 text-white shadow-xl shadow-slate-900/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-3xl -mr-32 -mt-32" />
          <div className="relative">
             <div className="flex items-center justify-between mb-8">
               <h4 className="font-black uppercase tracking-widest text-xs text-slate-400">Analisis Performa Sistem</h4>
               <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center font-black text-lg">{stats.score}</div>
             </div>
             
             <div className="space-y-6">
               <div>
                 <div className="flex justify-between items-center mb-2">
                   <div className="text-xs font-bold text-slate-300">Skor Kualitas Akun</div>
                   <div className="text-xs font-black text-primary">{stats.score}/100</div>
                 </div>
                 <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                   <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.score}%` }}
                    className="h-full bg-primary shadow-glow shadow-primary/50"
                   />
                 </div>
               </div>

               <div className="flex items-center gap-4">
                 <div className="p-3 bg-white/5 rounded-2xl border border-white/10 flex flex-col gap-1 flex-1">
                   <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Status</span>
                   <span className={cn(
                     "text-sm font-black uppercase",
                     stats.status === 'Produktif' ? "text-emerald-400" : stats.status === 'Normal' ? "text-blue-400" : "text-rose-400"
                   )}>{stats.status}</span>
                 </div>
                 <div className="p-3 bg-white/5 rounded-2xl border border-white/10 flex flex-col gap-1 flex-1">
                   <span className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">Handle Project</span>
                   <span className="text-sm font-black text-white">{stats.handleCount}</span>
                 </div>
               </div>
             </div>

             <div className="mt-8 flex gap-2">
               {stats.status === 'Produktif' && (
                 <div className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
                   🔥 Terverifikasi Aktif
                 </div>
               )}
               {user.status === 'Nonaktif' && (
                 <div className="bg-rose-500/20 text-rose-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
                   ⚠️ Perlu Perhatian
                 </div>
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderFinance = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total GMV', value: stats.totalGmv, icon: DollarSign, color: 'text-primary', bg: 'bg-primary/5' },
          { label: 'Total Dibayar', value: stats.totalPaid, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Sisa Hutang', value: stats.debt, icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50' },
          { label: 'Total Transaksi', value: stats.trxCount, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50', isPrefix: false },
        ].map((item, idx) => (
          <div key={idx} className={cn("geometric-card p-6 border-transparent", item.bg)}>
            <div className="flex items-center justify-between mb-4">
              <item.icon className={item.color} size={20} />
              <ArrowUpRight className="text-slate-300" size={14} />
            </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</div>
            <div className={cn("text-xl font-black tracking-tight", item.color)}>
              {item.isPrefix === false ? item.value : `Rp ${item.value.toLocaleString('id-ID')}`}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="geometric-card p-8 bg-white border-slate-100 flex flex-col h-[400px]">
          <h4 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-8">Pertumbuhan GMV Realtime</h4>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  itemStyle={{ fontWeight: 800 }}
                />
                <Line type="monotone" dataKey="gmv" stroke="#8b5cf6" strokeWidth={4} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="geometric-card p-8 bg-white border-slate-100 flex flex-col h-[400px]">
          <h4 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-8">Pembayaran vs Target</h4>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                />
                <Bar dataKey="paid" fill="#10b981" radius={[8, 8, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-primary/5 p-8 rounded-[2.5rem] flex items-center gap-6">
        <div className="w-16 h-16 rounded-3xl bg-primary text-white flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
          <AlertCircle size={32} />
        </div>
        <div>
          <h5 className="font-black text-primary uppercase text-sm mb-1 tracking-tight">Eksklusif System Insight</h5>
          <p className="text-xs font-bold text-slate-600 leading-relaxed max-w-2xl">
            {stats.score > 80 ? "User ini memiliki tingkat konversi NIB dan Halal di atas rata-rata region. Performa pembayaran sangat stabil dengan sisa piutang minimal." : "User ini memiliki beberapa input yang belum lunas. Diperlukan tindak lanjut untuk penarikan piutang bulanan."}
          </p>
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="geometric-card bg-white border-slate-100 overflow-hidden">
      <div className="p-6 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h4 className="font-black text-xs uppercase tracking-widest text-slate-500">Log Transaksi Keluangan</h4>
        <div className="flex gap-2">
          <input type="text" placeholder="Cari transaksi..." className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-primary h-10 w-64" />
          <button className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-slate-500 hover:bg-slate-50">Filter</button>
        </div>
      </div>
      <div className="overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-200">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 sticky top-0 z-10">
            <tr>
              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</th>
              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nominal</th>
              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Metode</th>
              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Keterangan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {transactions.map((tx, idx) => (
              <tr key={idx} className="hover:bg-slate-50 transition-colors">
                <td className="px-8 py-5 text-xs font-bold text-slate-600">{tx.timestamp}</td>
                <td className="px-8 py-5">
                  <div className="font-black text-slate-800">Rp {tx.jumlahDibayar.toLocaleString('id-ID')}</div>
                  <div className="text-[10px] text-slate-400 font-medium">GMV: Rp {tx.totalGmv.toLocaleString('id-ID')}</div>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-[10px] font-black uppercase text-slate-500">{tx.metode}</span>
                  </div>
                </td>
                <td className="px-8 py-5">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[9px] font-black uppercase",
                    tx.status === 'Lunas' ? "bg-emerald-100 text-emerald-600" : tx.status === 'Sebagian' ? "bg-amber-100 text-amber-600" : "bg-rose-100 text-rose-600"
                  )}>
                    {tx.status}
                  </span>
                </td>
                <td className="px-8 py-5 text-xs font-bold text-slate-400 italic">{tx.keterangan || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderActivity = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <h4 className="font-black text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2">
          <Clock size={16} className="text-primary" /> Tracking Aktivitas Realtime
        </h4>
        <div className="space-y-4 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
          {activities.map((act, idx) => (
            <div key={idx} className="relative pl-14 group">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:border-primary/30 transition-all z-10">
                {act.type === 'LOGIN' ? <Lock size={18} /> : act.type === 'INPUT_PAYMENT' ? <Wallet size={18} /> : <Edit3 size={18} />}
              </div>
              <div className="geometric-card p-6 bg-white border-slate-100 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm font-black text-slate-800 uppercase italic">{act.description}</div>
                  <div className="text-[10px] font-black text-slate-400">{act.timestamp}</div>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                  <div className="flex items-center gap-1"><Smartphone size={12} /> {act.device}</div>
                  <div className="flex items-center gap-1"><Globe size={12} /> IP: {act.ip}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-6">
         <div className="geometric-card p-8 bg-primary/5 border-primary/10">
            <h5 className="font-black text-xs uppercase tracking-widest text-primary mb-4">Security Overview</h5>
            <div className="space-y-4">
               <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase">
                  <span>Login Device</span>
                  <span className="text-slate-800">Trusted</span>
               </div>
               <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase">
                  <span>Location Variance</span>
                  <span className="text-emerald-500">Low (Safe)</span>
               </div>
               <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase">
                  <span>Auth Method</span>
                  <span className="text-slate-800">Email/OAuth</span>
               </div>
            </div>
            <button className="w-full mt-6 py-3 bg-white text-primary border border-primary/20 rounded-xl font-black text-[10px] uppercase hover:bg-primary hover:text-white transition-all">
               Audit Full Session Log
            </button>
         </div>
      </div>
    </div>
  );

  const renderAdminActions = () => (
    <div className="space-y-8 max-w-4xl">
      <AnimatePresence>
        {isEditing ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-10"
          >
            {/* Edit Mode Header */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-200">
               <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-primary transition-all shadow-sm"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase italic leading-none">Edit Profil User</h3>
                    <div className="mt-1 flex items-center gap-2">
                       <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">Petugas:</span>
                       <span className="text-[10px] font-black text-primary tracking-widest uppercase bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">{user.name}</span>
                    </div>
                  </div>
               </div>
               {loading && (
                 <div className="flex items-center gap-2 text-[10px] font-black text-primary animate-pulse">
                   <Loader2 size={12} className="animate-spin" />
                   SEDANG MENYIMPAN PERUBAHAN...
                 </div>
               )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               {/* Left Column: Core Data */}
               <div className="space-y-8">
                  <div className="flex items-center gap-3 text-primary">
                    <div className="h-1.5 w-6 bg-primary rounded-full shadow-glow" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Identitas Utama</span>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><UserIcon size={12} /> Nama Lengkap</label>
                      <input 
                        type="text" 
                        required 
                        className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm"
                        value={userForm.name} 
                        onChange={e => setUserForm({...userForm, name: e.target.value})} 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Mail size={12} /> Email Akses</label>
                      <input 
                        type="email" 
                        required 
                        className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm"
                        value={userForm.email} 
                        onChange={e => setUserForm({...userForm, email: e.target.value})} 
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Lock size={12} /> Password Baru (Opsional)</label>
                      <input 
                        type="password" 
                        placeholder="Klik untuk isi password baru..."
                        className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm"
                        value={userForm.password} 
                        onChange={e => setUserForm({...userForm, password: e.target.value})} 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Phone size={12} /> Nomor HP</label>
                        <input 
                          type="text" 
                          className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm"
                          value={userForm.noHp} 
                          onChange={e => setUserForm({...userForm, noHp: e.target.value})} 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><MapPin size={12} /> Wilayah Kerja</label>
                        <input 
                          type="text" 
                          className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm"
                          value={userForm.kodeWilayah} 
                          onChange={e => setUserForm({...userForm, kodeWilayah: e.target.value})} 
                        />
                      </div>
                    </div>
                  </div>
               </div>

               {/* Right Column: Auth & Security */}
               <div className="space-y-8">
                  <div className="flex items-center gap-3 text-primary">
                    <div className="h-1.5 w-6 bg-primary rounded-full shadow-glow" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Otoritas & Akses</span>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Shield size={12} /> Level Otoritas</label>
                      <select 
                        className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm"
                        value={userForm.role}
                        onChange={e => setUserForm({...userForm, role: e.target.value as UserRole})}
                        disabled={currentUser?.role === UserRole.ADMIN && user.role === UserRole.SUPER_ADMIN}
                      >
                         {currentUser?.role === UserRole.SUPER_ADMIN && <option value={UserRole.SUPER_ADMIN}>SUPER ADMIN</option>}
                         <option value={UserRole.ADMIN}>ADMIN OPERASIONAL</option>
                         <option value={UserRole.DATLAP}>PENDAMPING LAPANGAN</option>
                         <option value={UserRole.OLDAT}>ADMIN OLAH DATA</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Activity size={12} /> Status Akun</label>
                      <select 
                        className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm"
                        value={userForm.status}
                        onChange={e => setUserForm({...userForm, status: e.target.value as any})}
                      >
                         <option value="Aktif">AKTIF</option>
                         <option value="Nonaktif">NONAKTIF</option>
                         <option value="Suspend">SUSPEND</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] space-y-6">
                     <div className="flex items-center justify-between px-6 py-4 bg-rose-50 rounded-2xl border border-rose-100">
                        <div className="flex items-center gap-3">
                           <LogOut size={16} className="text-rose-500" />
                           <span className="text-[10px] font-black uppercase text-rose-600">Force Logout Session</span>
                        </div>
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 rounded accent-rose-500"
                          checked={userForm.forceLogout}
                          onChange={e => setUserForm({...userForm, forceLogout: e.target.checked})}
                        />
                     </div>
                  </div>
               </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-10 flex gap-4">
                <button 
                  onClick={() => {
                    if (!userForm.name || !userForm.email) {
                      alert('Nama dan Email wajib diisi!');
                      return;
                    }
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email)) {
                      alert('Format email tidak valid!');
                      return;
                    }
                    
                    setLoading(true);
                    setTimeout(() => {
                      onUpdateUser({
                        ...user,
                        name: userForm.name,
                        email: userForm.email,
                        noHp: userForm.noHp,
                        role: userForm.role,
                        status: userForm.status,
                        kodeWilayah: userForm.kodeWilayah
                      });
                      setLoading(false);
                      setShowNotification(true);
                      setTimeout(() => {
                        setShowNotification(false);
                        setIsEditing(false);
                      }, 2000);
                    }, 1500);
                  }}
                  disabled={loading || (currentUser?.role === UserRole.ADMIN && user.role === UserRole.SUPER_ADMIN)}
                  className="px-10 py-5 bg-primary text-white rounded-[2.5rem] font-black shadow-2xl shadow-primary/30 hover:bg-primary-dark transition-all flex items-center gap-3 uppercase tracking-widest text-sm"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Simpan Perubahan</>}
                </button>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-10 py-5 bg-white border border-slate-200 text-slate-400 rounded-[2.5rem] font-black hover:bg-slate-50 transition-all uppercase tracking-widest text-sm"
                >
                  Batalkan
                </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <div className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-100 flex gap-6">
              <div className="w-16 h-16 rounded-3xl bg-rose-500 text-white flex items-center justify-center shrink-0">
                <Shield size={32} />
              </div>
              <div>
                <h5 className="font-black text-rose-600 uppercase text-sm mb-1 tracking-tight">Super Admin Power Console</h5>
                <p className="text-xs font-bold text-rose-500/70 leading-relaxed">
                  Anda sedang mengontrol akses penuh user. Setiap perubahan akan dicatat ke dalam master audit system dan tidak dapat dibatalkan tanpa jejak. Gunakan dengan bijak.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <button 
                onClick={() => setIsEditing(true)} 
                className={cn(
                  "geometric-card p-6 bg-white border-slate-100 group transition-all flex flex-col gap-4 text-left",
                  currentUser?.role === UserRole.ADMIN && user.role === UserRole.SUPER_ADMIN 
                    ? "opacity-50 cursor-not-allowed" 
                    : "hover:border-primary"
                )}
                disabled={currentUser?.role === UserRole.ADMIN && user.role === UserRole.SUPER_ADMIN}
              >
                 <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-primary/5 transition-all">
                    <Edit3 size={20} />
                 </div>
                 <div>
                    <div className="text-xs font-black uppercase text-slate-800 mb-1">Edit Profil User</div>
                    <p className="text-[10px] font-medium text-slate-400">Ubah nama, email, wilayah, atau identitas lainnya.</p>
                 </div>
              </button>

        <button 
          onClick={() => {
            setIsSuspending(true);
            setTimeout(() => {
              onUpdateUser({...user, status: user.status === 'Aktif' ? 'Nonaktif' : 'Aktif'});
              setIsSuspending(false);
            }, 1000);
          }}
          disabled={isSuspending}
          className={cn(
            "geometric-card p-6 bg-white border-slate-100 group transition-all flex flex-col gap-4 text-left",
            user.status === 'Aktif' ? "hover:border-rose-500" : "hover:border-emerald-500"
          )}
        >
           <div className={cn(
             "w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center transition-all",
             user.status === 'Aktif' ? "group-hover:text-rose-500 group-hover:bg-rose-50" : "group-hover:text-emerald-500 group-hover:bg-emerald-50"
           )}>
              <Lock size={20} />
           </div>
           <div>
              <div className="text-xs font-black uppercase text-slate-800 mb-1">
                {isSuspending ? 'Processing...' : user.status === 'Aktif' ? 'Suspend Akun' : 'Aktifkan Akun'}
              </div>
              <p className="text-[10px] font-medium text-slate-400">Batalkan semua akses user ke dalam dashboard sistem.</p>
           </div>
        </button>

        <button onClick={() => {}} className="geometric-card p-6 bg-white border-slate-100 hover:border-amber-500 group transition-all flex flex-col gap-4 text-left">
           <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-amber-500 group-hover:bg-amber-50 transition-all">
              <RefreshCw size={20} />
           </div>
           <div>
              <div className="text-xs font-black uppercase text-slate-800 mb-1">Reset Data / Refresh</div>
              <p className="text-[10px] font-medium text-slate-400">Sync database dan refresh status performa user.</p>
           </div>
        </button>

        <button onClick={() => {}} className="geometric-card p-6 bg-white border-slate-100 hover:border-blue-500 group transition-all flex flex-col gap-4 text-left">
           <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50 transition-all">
              <Lock size={20} />
           </div>
           <div>
              <div className="text-xs font-black uppercase text-slate-800 mb-1">Reset Password</div>
              <p className="text-[10px] font-medium text-slate-400">Kirim link reset password otomatis ke email user.</p>
           </div>
        </button>

        <button onClick={() => {}} className="geometric-card p-6 bg-white border-slate-100 hover:border-primary group transition-all flex flex-col gap-4 text-left">
           <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-primary/5 transition-all">
              <Bell size={20} />
           </div>
           <div>
              <div className="text-xs font-black uppercase text-slate-800 mb-1">Kirim Notifikasi</div>
              <p className="text-[10px] font-medium text-slate-400">Kirim broadcast pesan eksklusif ke dashboard user.</p>
           </div>
        </button>

        <button 
          onClick={() => {
            if(window.confirm('PERINGATAN KRITIS: Anda akan menghapus akun ini secara permanen. Lanjutkan?')) {
              if(window.confirm('KONFIRMASI TERAKHIR: Semua data input user ini akan di-archive. Hapus akun sekarang?')) {
                onDeleteUser(user.id);
                onClose();
              }
            }
          }}
          className="geometric-card p-6 bg-white border-slate-100 hover:border-rose-600 hover:bg-rose-50 text-rose-500 group transition-all flex flex-col gap-4 text-left shadow-lg shadow-rose-200/20"
        >
           <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center group-hover:text-white group-hover:bg-rose-500 transition-all">
              <Trash2 size={20} />
           </div>
           <div>
              <div className="text-xs font-black uppercase mb-1">Hapus Akun Selamanya</div>
              <p className="text-[10px] font-medium opacity-70">Operasi destruktif. Membutuhkan 2x konfirmasi admin.</p>
           </div>
        </button>
      </div>
    </motion.div>
  )}
</AnimatePresence>
</div>
);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-slate-900/95 backdrop-blur-md overflow-hidden flex flex-col"
    >
      <header className="px-10 py-8 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-6">
           <button onClick={onClose} className="p-3 bg-white/5 text-white rounded-2xl hover:bg-white/10 transition-all border border-white/10">
              <X size={20} />
           </button>
           <div>
              <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">Manajemen Detail User</h1>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">SATDAPUS SUPER ADMIN CONSOLE • ID: {user.id}</p>
           </div>
        </div>
        
        <div className="flex items-center gap-8 px-8 py-3 bg-white/5 rounded-3xl border border-white/5">
           <div className="text-center">
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Global GMV Impact</div>
              <div className="text-lg font-black text-primary">Rp 45M <span className="text-[10px] text-emerald-400 font-bold ml-1">↑ 12%</span></div>
           </div>
           <div className="w-px h-8 bg-white/10" />
           <div className="text-center">
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Conversion Rate</div>
              <div className="text-lg font-black text-white">98.2%</div>
           </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <aside className="w-80 border-r border-white/5 p-10 flex flex-col gap-2 overflow-y-auto bg-slate-900/20">
          {[
            { id: 'Overview', icon: Briefcase },
            { id: 'Keuangan', icon: TrendingUp },
            { id: 'Riwayat', icon: History },
            { id: 'Aktivitas', icon: ActivityIcon },
            { id: 'Aksi Admin', icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                "flex items-center gap-4 px-6 py-5 rounded-[2rem] text-sm font-black transition-all group relative",
                activeTab === tab.id 
                  ? "bg-primary text-white shadow-xl shadow-primary/20" 
                  : "text-slate-500 hover:text-white hover:bg-white/5"
              )}
            >
              <tab.icon size={20} className={cn(activeTab === tab.id ? "text-white" : "text-slate-600 transition-colors group-hover:text-primary")} />
              {tab.id.toUpperCase()}
              {activeTab === tab.id && (
                <motion.div layoutId="active-tab-glow" className="absolute -right-2 w-1.5 h-8 bg-primary rounded-l-full shadow-glow" />
              )}
            </button>
          ))}

          <div className="mt-auto pt-10">
             <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                <div className="flex items-center gap-3 mb-4">
                   <Shield className="text-primary" size={20} />
                   <h6 className="text-[10px] font-black text-white uppercase tracking-widest">Auth Level 3</h6>
                </div>
                <p className="text-[9px] font-medium text-slate-500 leading-relaxed mb-4">
                   Anda sedang mengakses restricted area. Semua metadata aktivitas dicatat oleh system.
                </p>
                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                   <div className="h-full bg-primary w-2/3" />
                </div>
             </div>
          </div>
        </aside>

        {/* Content Area */}
        <section className="flex-1 overflow-y-auto p-12 bg-slate-50">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-10">
                 <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">{activeTab}</h2>
                 <div className="h-1.5 w-24 bg-primary mt-2 rounded-full shadow-glow" />
              </div>

              {activeTab === 'Overview' && renderOverview()}
              {activeTab === 'Keuangan' && renderFinance()}
              {activeTab === 'Riwayat' && renderHistory()}
              {activeTab === 'Aktivitas' && renderActivity()}
              {activeTab === 'Aksi Admin' && renderAdminActions()}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>

      <AnimatePresence>
        {showNotification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[2000] px-10 py-5 bg-slate-900 text-white rounded-[2rem] shadow-3xl flex items-center gap-5 border border-white/10"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-glow shadow-emerald-500/30">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div className="text-sm font-black uppercase tracking-widest text-emerald-300">Update Sukses</div>
              <div className="text-xs font-bold text-white/70 tracking-tight">Data user berhasil diperbarui dalam database.</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
