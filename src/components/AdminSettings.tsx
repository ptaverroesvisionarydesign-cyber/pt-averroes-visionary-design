/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Book, 
  MapPin, 
  Sparkles, 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  ShieldCheck,
  CheckCircle2,
  X,
  Loader2,
  Key,
  Mail,
  User as UserIcon,
  Activity,
  Eye,
  Phone,
  Shield,
  ArrowRight,
  Lock,
  RefreshCw,
  LogOut
} from 'lucide-react';
import { User, UserRole, Kbli, Wilayah } from '../types';
import { cn } from '../lib/utils';
import { dataService } from '../services/dataService';
import UserDetailModal from './UserDetailModal';

import { useAuth } from '../AuthContext';

type Tab = 'users' | 'kbli' | 'wilayah';

export default function AdminSettings() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab ] = useState<Tab>('users');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'user' | 'kbli' | 'wilayah'>('user');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState('');

  // States
  const [users, setUsers] = useState<User[]>([
    { id: '1', email: 'admin@halal.id', name: 'Super Admin', noHp: '081234567890', role: UserRole.SUPER_ADMIN, status: 'Aktif', joinDate: '2025-01-01', lastLogin: '2026-04-28 10:00' },
    { id: '2', email: 'user.leuwisari@halal.id', name: 'Asep Pendamping', noHp: '082233445566', role: UserRole.DATLAP, kodeWilayah: 'LEUWISARI', status: 'Aktif', joinDate: '2025-03-15', lastLogin: '2026-04-29 08:30' },
    { id: '3', email: 'user.singaparna@halal.id', name: 'Siti Olah Data', noHp: '085566778899', role: UserRole.OLDAT, kodeWilayah: 'SINGAPARNA', status: 'Aktif', joinDate: '2025-06-20', lastLogin: '2026-04-28 16:45' },
    { id: '4', email: 'admin.biasa@halal.id', name: 'Admin Operasional', noHp: '089900112233', role: UserRole.ADMIN, status: 'Aktif', joinDate: '2025-08-10', lastLogin: '2026-04-29 09:15' },
  ]);

  const [kblis, setKblis] = useState<Kbli[]>(dataService.getKblis());
  const [wilayahs, setWilayahs] = useState<Wilayah[]>(dataService.getWilayahs());

  // Form States
  const [userForm, setUserForm] = useState({ 
    name: '', 
    email: '', 
    noHp: '',
    password: '', 
    role: UserRole.DATLAP, 
    kodeWilayah: '', 
    status: 'Aktif' as 'Aktif' | 'Nonaktif' | 'Suspend',
    resetPassword: false as boolean,
    forceLogout: false as boolean
  });
  const [kbliForm, setKbliForm] = useState({ kode: '', judul: '', deskripsi: '' });
  const [wilayahForm, setWilayahForm] = useState({ kode: '', nama: '' });
  const [kbliAiInput, setKbliAiInput] = useState('');

  const [showNotification, setShowNotification] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState('');

  const openModal = (type: Tab, item: any = null) => {
    setModalType(type);
    setEditingItem(item);
    if (type === 'users') {
      setUserForm(item ? { 
        name: item.name, 
        email: item.email, 
        noHp: item.noHp || '',
        password: '', 
        role: item.role, 
        kodeWilayah: item.kodeWilayah || '',
        status: item.status || 'Aktif',
        resetPassword: false,
        forceLogout: false
      } : { 
        name: '', 
        email: '', 
        noHp: '',
        password: '', 
        role: UserRole.DATLAP, 
        kodeWilayah: '',
        status: 'Aktif',
        resetPassword: false,
        forceLogout: false
      });
    } else if (type === 'kbli') {
      setKbliForm(item ? { kode: item.kode, judul: item.judul, deskripsi: item.deskripsi } : { kode: '', judul: '', deskripsi: '' });
    } else if (type === 'wilayah') {
      setWilayahForm(item ? { kode: item.kode, nama: item.nama } : { kode: '', nama: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Specific Validation
    if (modalType === 'user') {
      if (!userForm.name || !userForm.email || !userForm.noHp) {
        alert('Field wajib tidak boleh kosong!');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email)) {
        alert('Format email tidak valid!');
        return;
      }
      if (!/^\d+$/.test(userForm.noHp)) {
        alert('Nomor HP hanya boleh berisi angka!');
        return;
      }

      // Role permission check fallback
      if (currentUser?.role === UserRole.ADMIN && editingItem?.role === UserRole.SUPER_ADMIN) {
        alert('Anda tidak memiliki otoritas untuk mengubah data Super Admin.');
        return;
      }
    }

    setLoading(true);
    setTimeout(() => {
      if (modalType === 'user') {
        const { resetPassword, forceLogout, ...userData } = userForm;
        if (editingItem) {
          setUsers(users.map(u => u.id === editingItem.id ? { ...u, ...userData } : u));
          setNotificationMsg('Data berhasil diperbarui');
        } else {
          setUsers([...users, { 
            id: Math.random().toString(36).substr(2, 9), 
            ...userData,
            joinDate: new Date().toISOString().split('T')[0],
            lastLogin: '-'
          }]);
          setNotificationMsg('Akun baru berhasil dibuat');
        }
        setShowNotification(true);
        setTimeout(() => setShowNotification(false), 3000);
      } else if (modalType === 'kbli') {
        if (editingItem) {
          dataService.updateKbli(editingItem.id, kbliForm);
        } else {
          dataService.addKbli(kbliForm);
        }
        setKblis(dataService.getKblis());
      } else if (modalType === 'wilayah') {
        if (editingItem) {
          dataService.updateWilayah(editingItem.id, wilayahForm);
        } else {
          dataService.addWilayah(wilayahForm);
        }
        setWilayahs(dataService.getWilayahs());
      }
      setLoading(false);
      setIsModalOpen(false);
    }, 800);
  };

  const handleDelete = (type: Tab, id: string) => {
    if (window.confirm('Yakin ingin menghapus data ini?')) {
      if (type === 'users') {
        setUsers(users.filter(u => u.id !== id));
      } else if (type === 'kbli') {
        dataService.deleteKbli(id);
        setKblis(dataService.getKblis());
      } else if (type === 'wilayah') {
        dataService.deleteWilayah(id);
        setWilayahs(dataService.getWilayahs());
      }
    }
  };

  const handleAiGenerate = async () => {
    if (!kbliAiInput) return;
    setAiLoading(true);
    const result = await dataService.generateKbliSuggestion(kbliAiInput);
    setAiResult(result);
    setAiLoading(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-32">
       <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <ShieldCheck className="text-primary" size={32} />
            PENGATURAN SISTEM
          </h1>
          <p className="text-slate-400 font-medium">Manajemen konfigurasi pusat aplikasi SATDAPUS.</p>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
        {[
          { id: 'users', label: 'Manajemen User', icon: Users },
          { id: 'kbli', label: 'Manajemen KBLI', icon: Book },
          { id: 'wilayah', label: 'Kode Wilayah', icon: MapPin },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black transition-all whitespace-nowrap",
              activeTab === tab.id ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'users' && (
          <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Daftar Pengguna Aktif</h3>
              <button onClick={() => openModal('users')} className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-purple-glow">
                <Plus size={16} /> TAMBAH USER
              </button>
            </div>
            <div className="geometric-card overflow-hidden">
              <table className="w-full text-left">
                 <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">User Details</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Wilayah</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                           <div className="font-black text-slate-800 uppercase text-xs">{u.name}</div>
                           <div className="text-[10px] font-medium text-slate-400">{u.email}</div>
                        </td>
                        <td className="px-6 py-4">
                           <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[9px] font-black uppercase">{u.role}</span>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-500">{u.kodeWilayah || '-'}</td>
                        <td className="px-6 py-4 text-right space-x-2">
                           <button 
                             onClick={() => {
                               setSelectedUser(u);
                               setIsDetailModalOpen(true);
                             }} 
                             className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg" 
                             title="Lihat Detail Akun"
                           >
                             <Eye size={14} />
                           </button>
                           <button 
                            disabled={currentUser?.role === UserRole.ADMIN && u.role === UserRole.SUPER_ADMIN}
                            onClick={() => openModal('users', u)} 
                            className={cn(
                              "p-2 rounded-lg transition-all",
                              currentUser?.role === UserRole.ADMIN && u.role === UserRole.SUPER_ADMIN 
                                ? "text-slate-300 cursor-not-allowed" 
                                : "text-blue-500 hover:bg-blue-50"
                            )}
                            title="Edit Data"
                           >
                            <Edit2 size={14} />
                           </button>
                           <button 
                            disabled={currentUser?.role === UserRole.ADMIN && u.role === UserRole.SUPER_ADMIN}
                            onClick={() => handleDelete('users', u.id)} 
                            className={cn(
                              "p-2 rounded-lg transition-all",
                              currentUser?.role === UserRole.ADMIN && u.role === UserRole.SUPER_ADMIN 
                                ? "text-slate-300 cursor-not-allowed" 
                                : "text-rose-500 hover:bg-rose-50"
                            )}
                            title="Hapus Akun"
                           >
                            <Trash2 size={14} />
                           </button>
                        </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'kbli' && (
          <motion.div key="kbli" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 space-y-6">
                <div className="geometric-card p-6 bg-slate-900 text-white shadow-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="text-primary" size={20} />
                    <h4 className="font-black text-sm uppercase tracking-widest">AI KBLI GENERATOR</h4>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-4 font-medium italic">Ceritakan bidang usahanya, biarkan AI mencari kode KBLI yang tepat.</p>
                  <textarea 
                    className="w-full bg-slate-800 border-none rounded-xl p-4 text-xs font-medium focus:ring-1 focus:ring-primary outline-none h-24 resize-none"
                    placeholder="Contoh: Saya menjual keripik tempe dalam kemasan..."
                    value={kbliAiInput}
                    onChange={e => setKbliAiInput(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['Jual Keripik', 'Kantin Sekolah', 'Minimarket'].map(ex => (
                      <button 
                        key={ex}
                        onClick={() => setKbliAiInput(prev => prev ? `${prev} ${ex}` : ex)}
                        className="text-[9px] bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded-md transition-colors"
                      >
                        + {ex}
                      </button>
                    ))}
                  </div>
                  <button 
                    onClick={handleAiGenerate}
                    disabled={aiLoading}
                    className="w-full py-3 bg-primary text-white rounded-xl font-black text-xs mt-4 shadow-purple-glow flex items-center justify-center gap-2"
                  >
                    {aiLoading ? <Loader2 className="animate-spin" size={16} /> : <><Sparkles size={16} /> GENERATE SARAN KBLI</>}
                  </button>
                  {aiResult && (
                    <div className="mt-4 p-4 bg-slate-800 rounded-xl border border-primary/20 text-[10px] font-medium leading-relaxed">
                      {aiResult}
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Database KBLI (5-Digit)</h3>
                  <button onClick={() => openModal('kbli')} className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2">
                    <Plus size={16} /> TAMBAH KBLI
                  </button>
                </div>
                <div className="geometric-card p-4 space-y-2">
                   {kblis.map(k => (
                     <div key={k.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between group">
                        <div className="flex gap-4">
                          <div className="h-10 w-16 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-black text-primary text-sm shadow-sm">{k.kode}</div>
                          <div>
                            <div className="font-black text-slate-800 text-xs uppercase">{k.judul}</div>
                            <div className="text-[10px] text-slate-400 font-medium line-clamp-1">{k.deskripsi}</div>
                          </div>
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                           <button onClick={() => openModal('kbli', k)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={14} /></button>
                           <button onClick={() => handleDelete('kbli', k.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={14} /></button>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'wilayah' && (
          <motion.div key="wilayah" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex gap-4">
               <Activity className="text-amber-500 shrink-0" />
               <p className="text-xs font-medium text-amber-700 leading-relaxed">
                 <span className="font-black uppercase">Perhatian:</span> Kode wilayah ini sangat krusial karena digunakan sebagai identitas dalam penomoran dokumen resmi: <code className="bg-white px-2 py-0.5 rounded font-black">Nomor/SP.[KODE]/GN/...</code>. Pastikan kode unik dan tidak mengandung spasi.
               </p>
            </div>
            <div className="flex justify-between items-center mt-8">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Konfigurasi Kode Wilayah</h3>
              <button onClick={() => openModal('wilayah')} className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2">
                <Plus size={16} /> TAMBAH WILAYAH
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {wilayahs.map(w => (
                 <div key={w.id} className="geometric-card p-6 flex items-center justify-between group hover:border-primary/50">
                    <div>
                      <div className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Prefix Dokumen</div>
                      <div className="text-xl font-black text-slate-900 tracking-tighter">SP.{w.kode}</div>
                      <div className="text-xs font-bold text-slate-400 mt-2">{w.nama}</div>
                    </div>
                    <div className="flex flex-col gap-2">
                       <button onClick={() => openModal('wilayah', w)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={14} /></button>
                       <button onClick={() => handleDelete('wilayah', w.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                 </div>
               ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNotification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 bg-slate-900 text-white rounded-3xl shadow-2xl flex items-center gap-4 border border-white/10"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
              <CheckCircle2 size={18} />
            </div>
            <span className="font-bold text-sm">{notificationMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDetailModalOpen && selectedUser && (
          <UserDetailModal 
            user={selectedUser} 
            onClose={() => setIsDetailModalOpen(false)}
            onUpdateUser={(updated) => {
              setUsers(users.map(u => u.id === updated.id ? updated : u));
              setSelectedUser(updated);
            }}
            onDeleteUser={(id) => {
              setUsers(users.filter(u => u.id !== id));
              setIsDetailModalOpen(false);
            }}
            onEdit={(u) => openModal('users', u)}
          />
        )}
      </AnimatePresence>

      {/* Settings Modals */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} 
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-2xl rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] overflow-hidden border border-slate-100"
            >
              <div className="bg-primary p-8 text-white flex items-center justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
                <div className="relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                      {editingItem ? <Edit2 size={24} /> : <Plus size={24} />}
                    </div>
                    <div>
                      <h3 className="font-black uppercase tracking-widest text-xl italic leading-none">
                        {editingItem ? 'Otoritas Edit User' : 'Daftar Akun Baru'}
                      </h3>
                      {editingItem && (
                        <div className="mt-1 flex items-center gap-2">
                           <span className="text-[10px] font-black text-white/50 tracking-widest uppercase">Sedang Mengedit:</span>
                           <span className="text-[10px] font-black text-emerald-300 tracking-widest uppercase bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">{editingItem.name}</span>
                        </div>
                      )}
                      {!editingItem && (
                         <p className="text-[10px] font-black text-white/60 tracking-widest uppercase mt-1">
                           Sistem Manajemen Otoritas SATDAPUS
                         </p>
                      )}
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-all relative z-10"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-10 space-y-10 max-h-[75vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
                {modalType === 'user' && (
                  <>
                    <div className="space-y-6">
                      <div className="flex items-center gap-3 text-primary mb-2">
                         <div className="h-1.5 w-6 bg-primary rounded-full" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Identitas Utama</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><UserIcon size={12} /> Nama Lengkap</label>
                          <input type="text" required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})} placeholder="Contoh: BUDI" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Mail size={12} /> Email</label>
                          <input type="email" required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} placeholder="user@halal.id" />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Phone size={12} /> Nomor HP (WA)</label>
                          <input type="text" required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all" value={userForm.noHp} onChange={e => setUserForm({...userForm, noHp: e.target.value.replace(/\D/g, '')})} placeholder="08xxxxxxxxxx" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><MapPin size={12} /> Wilayah Kerja</label>
                          <input type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:italic" value={userForm.kodeWilayah} onChange={e => setUserForm({...userForm, kodeWilayah: e.target.value.toUpperCase()})} placeholder="SINGAPARNA" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 pt-4">
                      <div className="flex items-center gap-3 text-primary mb-2">
                         <div className="h-1.5 w-6 bg-primary rounded-full" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Otoritas & Status</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Shield size={12} /> Tingkat Akses (Role)</label>
                          <select 
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
                            value={userForm.role} 
                            onChange={e => setUserForm({...userForm, role: e.target.value as UserRole})}
                          >
                             {currentUser?.role === UserRole.SUPER_ADMIN && <option value={UserRole.SUPER_ADMIN}>Super Admin</option>}
                             <option value={UserRole.ADMIN}>Admin</option>
                             <option value={UserRole.DATLAP}>Lapangan</option>
                             <option value={UserRole.OLDAT}>Olah Data</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Activity size={12} /> Status Akun</label>
                          <select 
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all" 
                            value={userForm.status} 
                            onChange={e => setUserForm({...userForm, status: e.target.value as any})}
                          >
                             <option value="Aktif">AKTIF</option>
                             <option value="Nonaktif">NONAKTIF</option>
                             <option value="Suspend">SUSPEND</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-slate-50">
                      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                                 <Lock size={18} />
                              </div>
                              <div>
                                 <div className="text-xs font-black uppercase text-slate-800">Reset Keamanan</div>
                                 <div className="text-[10px] font-bold text-slate-400 uppercase">Input password baru untuk user</div>
                              </div>
                           </div>
                           <input 
                            type="checkbox" 
                            className="w-5 h-5 accent-primary cursor-pointer" 
                            checked={userForm.resetPassword}
                            onChange={e => setUserForm({...userForm, resetPassword: e.target.checked})}
                           />
                        </div>

                        {userForm.resetPassword && (
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2">
                             <input 
                              type="password" 
                              placeholder="Masukkan password baru..."
                              className="w-full px-5 py-4 bg-white border border-primary/20 rounded-2xl font-bold text-slate-700 outline-none shadow-sm"
                              value={userForm.password}
                              onChange={e => setUserForm({...userForm, password: e.target.value})}
                             />
                          </motion.div>
                        )}
                      </div>

                      <div className="flex items-center justify-between px-6 py-4 bg-rose-50/30 rounded-3xl border border-rose-100/50">
                         <div className="flex items-center gap-3">
                            <LogOut size={16} className="text-rose-400" />
                            <span className="text-xs font-black uppercase text-rose-500">Paksa Logout User (Force Logout)</span>
                         </div>
                         <input 
                          type="checkbox" 
                          className="w-5 h-5 accent-rose-500 cursor-pointer"
                          checked={userForm.forceLogout}
                          onChange={e => setUserForm({...userForm, forceLogout: e.target.checked})}
                         />
                      </div>
                    </div>
                  </>
                )}

                {modalType === 'kbli' && (
                  <>
                    <div className="grid grid-cols-3 gap-6">
                       <div className="col-span-1 space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kode (5 Digit)</label>
                         <input type="text" maxLength={5} required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none" value={kbliForm.kode} onChange={e => setKbliForm({...kbliForm, kode: e.target.value})} />
                       </div>
                       <div className="col-span-2 space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Judul KBLI</label>
                         <input type="text" required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none uppercase text-xs" value={kbliForm.judul} onChange={e => setKbliForm({...kbliForm, judul: e.target.value})} />
                       </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deskripsi Lingkup Usaha</label>
                      <textarea className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none h-32 resize-none text-[10px]" value={kbliForm.deskripsi} onChange={e => setKbliForm({...kbliForm, deskripsi: e.target.value})} />
                    </div>
                  </>
                )}

                {modalType === 'wilayah' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kode Wilayah (Prefix)</label>
                      <input type="text" required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-700 outline-none uppercase placeholder:lowercase italic" placeholder="leuwisari" value={wilayahForm.kode} onChange={e => setWilayahForm({...wilayahForm, kode: e.target.value.toUpperCase().replace(/\s/g, '')})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Deskripsi Wilayah</label>
                      <input type="text" required className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 outline-none" value={wilayahForm.nama} onChange={e => setWilayahForm({...wilayahForm, nama: e.target.value})} />
                    </div>
                  </>
                )}

                <div className="flex flex-col gap-4 pt-6">
                  <button 
                   type="submit" 
                   disabled={loading} 
                   className="w-full py-5 rounded-[2.5rem] bg-primary text-white font-black shadow-xl shadow-primary/30 hover:bg-primary-dark transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <>Simpan Perubahan <CheckCircle2 size={18} /></>}
                  </button>
                  
                  {editingItem && modalType === 'user' && (
                    <button 
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setSelectedUser(editingItem);
                        setIsDetailModalOpen(true);
                      }}
                      className="w-full py-3 text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center justify-center gap-2"
                    >
                      Lihat Analisis Detail Lengkap <ArrowRight size={12} />
                    </button>
                  )}

                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="w-full py-4 rounded-2xl bg-slate-50 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}