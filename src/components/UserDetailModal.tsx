/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
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
import { dataService } from '../services/dataService';
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
  
  // Real-time Data States
  const [realTransactions, setRealTransactions] = useState<any[]>([]);
  const [realActivities, setRealActivities] = useState<any[]>([]);
  const [financialLoading, setFinancialLoading] = useState(true);

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

  // Subscribe to real-time data
  useEffect(() => {
    setFinancialLoading(true);
    const unsubActivities = dataService.getActivitiesByUserId(user.id, (data) => {
      setRealActivities(data);
    });

    const unsubTransactions = dataService.getTransactionsByUserId(user.id, (data) => {
      setRealTransactions(data);
      setFinancialLoading(false);
    });

    return () => {
      unsubActivities();
      unsubTransactions();
    };
  }, [user.id]);

  // Derived Stats
  const stats = useMemo(() => {
    const totalGmv = realTransactions.reduce((acc, tx) => acc + (tx.totalGmv || 0), 0);
    const totalPaid = realTransactions.reduce((acc, tx) => acc + (tx.jumlahDibayar || 0), 0);
    const debt = totalGmv - totalPaid;
    const trxCount = realTransactions.length;
    
    const baseScore = user.role === UserRole.DATLAP ? 85 : 92;
    const scoreModifier = trxCount > 10 ? 5 : -5;
    
    return {
      score: Math.min(100, Math.max(0, baseScore + scoreModifier)),
      status: (baseScore + scoreModifier) > 80 ? 'Produktif' : (baseScore + scoreModifier) > 50 ? 'Normal' : 'Bermasalah',
      handleCount: trxCount,
      totalGmv,
      totalPaid,
      debt,
      trxCount
    };
  }, [realTransactions, user.role]);

  const chartData = useMemo(() => {
    // Generate simple last 6 months gmv trend from transactions if possible
    // For this prototype, we'll slice or mock a bit but based on real totals
    return [
      { name: 'Jan', gmv: stats.totalGmv * 0.1, paid: stats.totalPaid * 0.1 },
      { name: 'Feb', gmv: stats.totalGmv * 0.15, paid: stats.totalPaid * 0.12 },
      { name: 'Mar', gmv: stats.totalGmv * 0.2, paid: stats.totalPaid * 0.18 },
      { name: 'Apr', gmv: stats.totalGmv * 0.25, paid: stats.totalPaid * 0.22 },
      { name: 'May', gmv: stats.totalGmv * 0.1, paid: stats.totalPaid * 0.08 },
      { name: 'Jun', gmv: stats.totalGmv * 0.2, paid: stats.totalPaid * 0.3 },
    ];
  }, [stats]);

  const handleAdminAction = async (action: string, description: string, fn: () => Promise<void>) => {
    if (!currentUser) return;
    try {
      setLoading(true);
      await fn();
      await dataService.logActivity({
        userId: user.id,
        type: 'ADMIN_ACTION',
        description: `${currentUser.name} (Admin) melakukan: ${description}`,
        metadata: { adminId: currentUser.id, action }
      });
      alert(`Berhasil: ${description}`);
    } catch (err) {
      console.error(err);
      alert(`Gagal: ${description}`);
    } finally {
      setLoading(false);
    }
  };

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
        <h4 className="font-black text-xs uppercase tracking-widest text-slate-500">Log Transaksi Keuangan</h4>
        <div className="flex gap-2">
          <input type="text" placeholder="Cari transaksi..." className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-1 focus:ring-primary h-10 w-64" />
        </div>
      </div>
      <div className="overflow-x-auto max-h-[600px] scrollbar-thin scrollbar-thumb-slate-200">
        {financialLoading ? (
          <div className="p-10 text-center animate-pulse text-slate-400 font-black uppercase text-xs">Memuat data keuangan...</div>
        ) : realTransactions.length === 0 ? (
          <div className="p-10 text-center text-slate-400 font-black uppercase text-xs">Belum ada riwayat transaksi.</div>
        ) : (
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
              {realTransactions.map((tx, idx) => (
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
        )}
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
          {realActivities.length === 0 ? (
            <div className="pl-14 text-slate-400 text-xs font-black uppercase italic">Log aktivitas kosong.</div>
          ) : realActivities.map((act, idx) => (
            <div key={idx} className="relative pl-14 group">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:border-primary/30 transition-all z-10">
                {act.type === 'LOGIN' ? <Lock size={18} /> : act.type === 'INPUT_PAYMENT' ? <Wallet size={18} /> : <ActivityIcon size={18} />}
              </div>
              <div className="geometric-card p-6 bg-white border-slate-100 hover:shadow-md transition-all cursor-pointer" onClick={() => alert(JSON.stringify(act, null, 2))}>
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm font-black text-slate-800 uppercase italic leading-tight">{act.description}</div>
                  <div className="text-[10px] font-black text-slate-400 whitespace-nowrap ml-4">{new Date(act.timestamp).toLocaleString('id-ID')}</div>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400">
                  <div className="flex items-center gap-1"><Smartphone size={12} /> {act.metadata?.device || 'Unknown Mobile'}</div>
                  <div className="flex items-center gap-1"><Globe size={12} /> IP: {act.metadata?.ip || 'Hidden IP'}</div>
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
                  <span>Audit Level</span>
                  <span className="text-slate-800 font-black">Full Transparency</span>
               </div>
               <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase">
                  <span>Log Count</span>
                  <span className="text-slate-800">{realActivities.length}</span>
               </div>
               <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase">
                  <span>Status Keamanan</span>
                  <span className="text-emerald-500">Aman</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );

  const renderAdminActions = () => (
    <div className="space-y-8 max-w-4xl pb-20 sm:pb-0">
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
                       <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase">ID: {user.id}</span>
                    </div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Lengkap</label>
                      <input type="text" className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Akses</label>
                      <input type="email" className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
                    </div>
                  </div>
               </div>
            </div>

            <div className="pt-10 flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={async () => {
                    handleAdminAction('UPDATE_PROFILE', 'Update Data Profil', async () => {
                      await dataService.updateUser(user.id, userForm);
                      onUpdateUser({...user, ...userForm});
                      setIsEditing(false);
                    });
                  }}
                  className="px-10 py-5 bg-primary text-white rounded-[2.5rem] font-black uppercase text-sm flex-1"
                >
                  Simpan Perubahan
                </button>
                <button onClick={() => setIsEditing(false)} className="px-10 py-5 bg-slate-100 text-slate-500 rounded-[2.5rem] font-black uppercase text-sm flex-1">Batalkan</button>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <button key="btn-edit" onClick={() => setIsEditing(true)} className="geometric-card p-6 bg-white border-slate-100 hover:border-primary flex flex-col gap-4 text-left group">
               <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-primary group-hover:bg-primary/5 transition-all"><Edit3 size={20} /></div>
               <div><div className="text-xs font-black uppercase text-slate-800 mb-1">Edit Profil User</div><p className="text-[10px] font-medium text-slate-400">Ubah data identitas user.</p></div>
            </button>

            <button key="btn-suspend" onClick={() => handleAdminAction('SUSPEND', user.status === 'Suspended' ? 'Unsuspend' : 'Suspend Account', () => dataService.suspendUser(user.id, user.status !== 'Suspended'))} className="geometric-card p-6 bg-white border-slate-100 hover:border-rose-500 group flex flex-col gap-4 text-left">
               <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-rose-500 group-hover:bg-rose-50"><Lock size={20} /></div>
               <div><div className="text-xs font-black uppercase text-slate-800 mb-1">{user.status === 'Suspended' ? 'Aktifkan Akun' : 'Suspend Akun'}</div><p className="text-[10px] font-medium text-slate-400">Blokir akses sementara.</p></div>
            </button>

            <button key="btn-refresh" onClick={() => window.location.reload()} className="geometric-card p-6 bg-white border-slate-100 hover:border-amber-500 group flex flex-col gap-4 text-left">
               <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-amber-500 group-hover:bg-amber-50"><RefreshCw size={20} /></div>
               <div><div className="text-xs font-black uppercase text-slate-800 mb-1">Reset Data / Refresh</div><p className="text-[10px] font-medium text-slate-400">Sync database sekarang.</p></div>
            </button>

            <button key="btn-reset-pw" onClick={() => alert('Link reset password telah dikirim ke email user.')} className="geometric-card p-6 bg-white border-slate-100 hover:border-blue-500 group flex flex-col gap-4 text-left">
               <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50"><Shield size={20} /></div>
               <div><div className="text-xs font-black uppercase text-slate-800 mb-1">Reset Password</div><p className="text-[10px] font-medium text-slate-400">Kirim email pemulihan.</p></div>
            </button>

            <button key="btn-notif" onClick={() => {
              const msg = prompt('Masukkan pesan notifikasi:');
              if (msg) handleAdminAction('SEND_NOTIF', 'Kirim Notifikasi', async () => {
                await dataService.addNotification({ userId: user.id, title: 'Pesan Admin', message: msg, type: 'admin' });
              });
            }} className="geometric-card p-6 bg-white border-slate-100 hover:border-emerald-500 group flex flex-col gap-4 text-left">
               <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 group-hover:bg-emerald-50"><Bell size={20} /></div>
               <div><div className="text-xs font-black uppercase text-slate-800 mb-1">Kirim Notifikasi</div><p className="text-[10px] font-medium text-slate-400">Broadcast pesan ke user.</p></div>
            </button>

            <button key="btn-delete" onClick={() => {
              if (confirm('KONFIRMASI: Hapus akun selamanya?')) {
                handleAdminAction('DELETE_USER', 'Hapus Akun Permanen', async () => {
                  await dataService.deleteUser(user.id);
                  onDeleteUser(user.id);
                  onClose();
                });
              }
            }} className="geometric-card p-6 bg-white border-slate-100 hover:border-rose-600 hover:bg-rose-50 group flex flex-col gap-4 text-left">
               <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-white group-hover:bg-rose-600"><Trash2 size={20} /></div>
               <div><div className="text-xs font-black uppercase text-rose-600 mb-1">Hapus Akun Selamanya</div><p className="text-[10px] font-medium text-slate-400 opacity-70">Operasi kritis, jejak log audit tercipta.</p></div>
            </button>
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
      className="fixed inset-0 z-[1000] bg-slate-900 overflow-hidden flex flex-col"
    >
      <header className="px-6 py-6 sm:px-10 sm:py-8 border-b border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
           <button onClick={onClose} className="p-3 bg-white/5 text-white rounded-2xl hover:bg-white/10 transition-all border border-white/10">
              <X size={20} />
           </button>
           <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl font-black text-white tracking-tighter uppercase italic truncate">{user.name}</h1>
              <p className="text-[9px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">DETAIL USER • {user.role}</p>
           </div>
        </div>
        
        <div className="hidden sm:flex items-center gap-8 px-8 py-3 bg-white/5 rounded-3xl border border-white/5 text-xs">
           <div className="text-center">
              <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Total GMV</div>
              <div className="font-black text-primary">Rp {stats.totalGmv.toLocaleString('id-ID')}</div>
           </div>
           <div className="w-px h-6 bg-white/10" />
           <div className="text-center">
              <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Trx count</div>
              <div className="font-black text-white">{stats.trxCount}</div>
           </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Responsive Navigation */}
        <aside className="hidden md:flex w-72 border-r border-white/5 p-8 flex-col gap-2 overflow-y-auto bg-slate-900/40">
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
                "flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black transition-all group relative",
                activeTab === tab.id 
                  ? "bg-primary text-white shadow-xl shadow-primary/30" 
                  : "text-slate-500 hover:bg-white/5"
              )}
            >
              <tab.icon size={18} />
              {tab.id.toUpperCase()}
            </button>
          ))}
        </aside>

        <section className="flex-1 overflow-y-auto p-6 sm:p-10 pb-32 md:pb-10 bg-slate-50 scroll-smooth">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="max-w-6xl mx-auto"
            >
              {activeTab === 'Overview' && renderOverview()}
              {activeTab === 'Keuangan' && renderFinance()}
              {activeTab === 'Riwayat' && renderHistory()}
              {activeTab === 'Aktivitas' && renderActivity()}
              {activeTab === 'Aksi Admin' && renderAdminActions()}
            </motion.div>
          </AnimatePresence>
        </section>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 flex justify-between items-center z-[1100] shadow-2xl">
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
                "p-3 rounded-2xl transition-all flex flex-col items-center gap-1",
                activeTab === tab.id ? "text-primary bg-primary/5" : "text-slate-400"
              )}
            >
              <tab.icon size={20} />
              <span className="text-[7px] font-black uppercase tracking-tighter">{tab.id === 'Aksi Admin' ? 'Admin' : tab.id}</span>
            </button>
          ))}
        </nav>
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
