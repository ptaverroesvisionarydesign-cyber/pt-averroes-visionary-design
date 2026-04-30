/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  Edit3, 
  Lock, 
  ChevronRight, 
  ShieldAlert,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Mail,
  Trash2,
  Key,
  Copy,
  PlusCircle,
  Check,
  Loader2,
  X,
  Download,
  ExternalLink,
  Image as ImageIcon,
  Upload,
  Send,
  UserCheck,
  UserPlus,
  Hand,
  Unlock,
  AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useNotifications } from '../NotificationContext';
import { UserRole, DataPelakuUsaha, StatusProses } from '../types';
import { cn } from '../lib/utils';
import { dataService } from '../services/dataService';

// Mock Data for View
const MOCK_DATA: Partial<DataPelakuUsaha>[] = [
  { id: '1', namaPelakuUsaha: 'Bpk. Junaedi', nik: '3201012345678901', statusProses: 'Proses Pengolahan NIB', noHp: '08123456789', timestamp: '26-04-2026', namaProduk: 'Kerupuk Pisang', namaMerek: 'Juna Snack', kecamatan: 'Leuwisari', kbliId: '3', cleaningAgent: 'Sunlight', kemasan: 'Plastik PP', bahanBaku: 'Pisang, Tepung, Gula, Garam', prosesProduksi: '1. Kupas pisang, 2. Iris tipis, 3. Campur bumbu, 4. Goreng hingga matang.', emailTemp: 'junaedi.halal@gmail.com', passwordHash: 'HALAL123', nib: '9120001234567' },
  { id: '2', namaPelakuUsaha: 'Ibu Siti', nik: '3201019876543210', statusProses: 'Verifikasi BPJPH', noHp: '08571234567', timestamp: '25-04-2026', namaProduk: 'Peyek Kacang', namaMerek: 'Siti Peyek', kecamatan: 'Ciawi', kbliId: '3', cleaningAgent: 'Mama Lemon', kemasan: 'Plastik Mika', bahanBaku: 'Kacang Tanah, Tepung Beras, Santan', prosesProduksi: '1. Rebus santan, 2. Campur tepung, 3. Masukkan kacang, 4. Goreng per sendok.', emailTemp: 'siti.halal@gmail.com', passwordHash: 'PEYEK88', nib: '9120009876543' },
  { id: '3', namaPelakuUsaha: 'Bpk. Ahmad', nik: '3201011122334455', statusProses: 'terbit sertifikat halal', noHp: '08139988776', timestamp: '24-04-2026', namaProduk: 'Kripik Singkong', namaMerek: 'Ahmad Chips', kecamatan: 'Leuwisari', kbliId: '3', cleaningAgent: 'Sunlight', kemasan: 'Standing Pouch', bahanBaku: 'Singkong, Minyak Goreng, Penyedap', prosesProduksi: '1. Pilih singkong, 2. Iris, 3. Rendam bumbu, 4. Goreng garing.', emailTemp: 'ahmad.halal@gmail.com', passwordHash: 'SINGKONG1', nib: '9120005544332' },
];

export default function DataListView() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const [dataList, setDataList] = useState<Partial<DataPelakuUsaha>[]>(dataService.getDataList());
  const [viewStep, setViewStep] = useState(user?.role === UserRole.OLDAT ? 1 : 2);
  const [selectedStatus, setSelectedStatus] = useState<StatusProses | ''>('');
  const [editingData, setEditingData] = useState<Partial<DataPelakuUsaha> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [broadcast] = useState(() => new BroadcastChannel('halal_updates'));

  const [showPassword, setShowPassword] = useState(false);
  const [isEditingKbli, setIsEditingKbli] = useState(false);
  const [isEditingKbliTop, setIsEditingKbliTop] = useState(false);
  const [showHalalProcess, setShowHalalProcess] = useState(false);
  
  // New Filters
  const [selectedDatlap, setSelectedDatlap] = useState<string>('');
  const [selectedOldat, setSelectedOldat] = useState<string>('');
  const [selectedPengolahan, setSelectedPengolahan] = useState<string>('');

  const formatName = (name?: string) => {
    if (!name) return 'Belum Diproses';
    if (name.length <= 14) return name;
    return `${name.substring(0, 14)}...`;
  };

  const datlapUsers = dataService.getUsers().filter(u => u.role === UserRole.DATLAP);
  const oldatUsers = dataService.getUsers().filter(u => u.role === UserRole.OLDAT);

  const getRomanMonth = (dateString?: string) => {
    if (!dateString) return '...';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '...';
      const months = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
      return months[date.getMonth()];
    } catch {
      return '...';
    }
  };

  const getYear = (dateString?: string) => {
    if (!dateString) return '...';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '...';
      return date.getFullYear();
    } catch {
      return '...';
    }
  };

  useEffect(() => {
    broadcast.onmessage = (event) => {
      if (event.data.type === 'UPDATE_DATA' || event.data.type === 'ADD_DATA' || event.data.type === 'DELETE_DATA') {
        // Refresh local view from the updated service state
        // In this simulation, components update their own view + service state
        const currentList = dataService.getDataList();
        
        if (event.data.type === 'ADD_DATA') {
          if (!currentList.find(d => d.id === event.data.item.id)) {
            dataService.setDataList([...currentList, event.data.item]);
          }
        } else if (event.data.type === 'UPDATE_DATA') {
          dataService.setDataList(currentList.map(item => item.id === event.data.item.id ? { ...item, ...event.data.item } : item));
        } else if (event.data.type === 'DELETE_DATA') {
          dataService.setDataList(currentList.filter(d => d.id !== event.data.id));
        }
        
        setDataList(dataService.getDataList());
      }
    };
    return () => broadcast.close();
  }, [broadcast]);

  const [statuses, setStatuses] = useState<StatusProses[]>([
    'Proses Pengolahan NIB & Halal'
  ]);

  const [adminHalalStatuses, setAdminHalalStatuses] = useState<StatusProses[]>([
    'Proses pengajuan',
    'Verifikasi BPJPH',
    'terbit sertifikat halal',
    'dikembalikan ke pu'
  ]);

  const [newStatusInput, setNewStatusInput] = useState('');

  const handleAddStatus = () => {
    if (!newStatusInput.trim()) return;
    const value = newStatusInput.trim();
    
    if (!statuses.includes(value)) {
      setStatuses(prev => [...prev, value]);
    }
    
    if (user?.role === UserRole.ADMIN && !adminHalalStatuses.includes(value)) {
      setAdminHalalStatuses(prev => [...prev, value]);
    }
    
    if (editingData) {
      setEditingData({ ...editingData, statusProses: value });
    }
    
    setNewStatusInput('');
  };

  const filteredData = dataList.filter(d => {
    const isPrivileged = user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN;
    
    const matchesRole = isPrivileged
      ? (user?.role === UserRole.ADMIN ? adminHalalStatuses.includes(d.statusProses!) : true)
      : user?.role === UserRole.OLDAT 
        ? d.statusProses === selectedStatus 
        : true;
    const matchesSearch = d.namaPelakuUsaha?.toLowerCase().includes(searchQuery.toLowerCase()) || d.nik?.includes(searchQuery);
    const matchesDatlap = !selectedDatlap || d.createdBy === selectedDatlap;
    const matchesOldat = !selectedOldat || d.processedByOldat === selectedOldat || d.pendampingOlahDataId === selectedOldat;
    const matchesPengolahan = !selectedPengolahan || d.status_pengolahan === selectedPengolahan;
    
    return matchesRole && matchesSearch && matchesDatlap && matchesOldat && matchesPengolahan;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Proses Pengolahan NIB & Halal': return 'bg-amber-100 text-amber-700';
      case 'Proses Pengolahan Halal': return 'bg-purple-100 text-purple-700';
      case 'Halal Terbit':
      case 'terbit sertifikat halal': return 'bg-emerald-100 text-emerald-700';
      case 'Proses pengajuan': return 'bg-blue-100 text-blue-700';
      case 'Verifikasi BPJPH': return 'bg-indigo-100 text-indigo-700';
      case 'dikembalikan ke pu': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const handleSave = () => {
    if (!editingData?.id) return;
    setSaving(true);
    
    setTimeout(() => {
      const updatedItem = { ...editingData };
      
      // Update metadata and tracking
      if (user) {
        // We use the helper to update the object
        const updatedWithMeta = dataService.updateDataMetadata(updatedItem as DataPelakuUsaha, user, 'edit');
        Object.assign(updatedItem, updatedWithMeta);
      }

      const currentList = dataService.getDataList();
      
      const exists = currentList.find(i => i.id === updatedItem.id);
      let newList;
      if (exists) {
        newList = currentList.map(item => item.id === updatedItem.id ? updatedItem : item);
      } else {
        newList = [...currentList, updatedItem];
      }
      
      dataService.setDataList(newList);
      setDataList(newList);

      // Broadcast the live update
      broadcast.postMessage({ 
        type: exists ? 'UPDATE_DATA' : 'ADD_DATA', 
        item: updatedItem 
      });

      // Add Notification for OLdat processing
      if (user?.role === UserRole.OLDAT) {
        addNotification({
          type: 'PROSES_DATA',
          title: '⚙️ Proses Data',
          message: `PU atas nama: ${updatedItem.namaPelakuUsaha}\nDikerjakan oleh: ${user?.name}`,
          userId: user?.id || '',
          actorName: user?.name,
          puName: updatedItem.namaPelakuUsaha,
          targetRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OLDAT],
          link: '/data'
        });
      }

      setSaving(false);
      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        setViewStep(2);
      }, 2000);
    }, 1500);
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-6 sm:space-y-8">
      {/* OLDAT STEP 1: Status Dropdown */}
      {user?.role === UserRole.OLDAT && viewStep === 1 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] shadow-elevation p-6 sm:p-10 text-center border border-slate-100 max-w-lg mx-auto"
        >
          <div className="h-16 w-16 sm:h-20 sm:w-20 bg-primary/10 text-primary rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Clock size={32} className="sm:w-10 sm:h-10" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2 tracking-tight uppercase">Pilih Tahap Kerja</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-bold uppercase tracking-wide mb-8">Tentukan tahap pengolahan data hari ini.</p>
          
          <div className="space-y-3 sm:space-y-4">
            {statuses.map(status => (
              <button
                key={status}
                onClick={() => {
                  setSelectedStatus(status);
                  setViewStep(2);
                }}
                className="w-full py-4 px-5 sm:px-6 rounded-2xl border-2 border-slate-100 text-left font-bold text-slate-700 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all flex items-center justify-between group text-xs sm:text-sm uppercase tracking-tight"
              >
                {status}
                <ChevronRight className="opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4" />
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* STEP 2: Data List (Spreadsheet Style) */}
      {viewStep === 2 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight uppercase leading-tight">
                {selectedStatus ? `LIST: ${selectedStatus}` : 'REKAPITULASI DATA'}
              </h1>
              <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mt-2 bg-slate-100 px-3 py-1 rounded-full inline-block">Menampilkan {filteredData.length} entri data</p>
            </div>
            
            {user?.role === UserRole.OLDAT && (
              <button 
                onClick={() => setViewStep(1)}
                className="w-full sm:w-auto text-[10px] sm:text-xs font-black text-primary bg-primary/10 px-6 py-3 rounded-xl border border-primary/10 uppercase hover:bg-primary hover:text-white transition-all shadow-sm"
              >
                Ganti Tahap Kerja
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 bg-white p-2 rounded-[2rem] shadow-elevation border border-slate-100">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Cari Nama / NIK..."
                className="w-full pl-12 pr-4 py-3 sm:py-3.5 bg-slate-50 rounded-2xl outline-none focus:bg-white border border-transparent focus:border-primary/20 transition-all font-bold text-xs sm:text-sm text-slate-600"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN) && (
                <>
                  <select 
                    className="pl-4 pr-10 py-3 bg-slate-50 rounded-2xl outline-none focus:bg-white border border-transparent focus:border-primary/20 transition-all font-bold text-[10px] text-slate-600 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1rem_center] bg-no-repeat"
                    value={selectedDatlap}
                    onChange={e => setSelectedDatlap(e.target.value)}
                  >
                    <option value="">Semua Penginput</option>
                    {datlapUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                  <select 
                    className="pl-4 pr-10 py-3 bg-slate-50 rounded-2xl outline-none focus:bg-white border border-transparent focus:border-primary/20 transition-all font-bold text-[10px] text-slate-600 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1rem_center] bg-no-repeat"
                    value={selectedOldat}
                    onChange={e => setSelectedOldat(e.target.value)}
                  >
                    <option value="">Semua Pengolah</option>
                    {oldatUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                  <select 
                    className="pl-4 pr-10 py-3 bg-slate-50 rounded-2xl outline-none focus:bg-white border border-transparent focus:border-primary/20 transition-all font-bold text-[10px] text-slate-600 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20fill%3D%22none%22%20stroke%3D%22currentColor%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_1rem_center] bg-no-repeat"
                    value={selectedPengolahan}
                    onChange={e => setSelectedPengolahan(e.target.value)}
                  >
                    <option value="">Status Pengolahan</option>
                    <option value="Belum Diambil">Belum Diambil</option>
                    <option value="Sudah Diambil">Sudah Diambil</option>
                  </select>
                </>
              )}
              {user?.role === UserRole.ADMIN && (
                <button 
                  onClick={() => {
                    setEditingData({
                      id: Math.random().toString(36).substr(2, 9),
                      namaPelakuUsaha: '',
                      nik: '',
                      noHp: '',
                      statusProses: 'Proses pengajuan',
                      timestamp: new Date().toLocaleDateString('id-ID'),
                      kecamatan: 'Leuwisari',
                      kbliId: '3'
                    });
                    setViewStep(3);
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 sm:py-3.5 rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20"
                >
                  <PlusCircle size={16} /> Tambah Data
                </button>
              )}
              <button className="p-3 sm:p-3.5 bg-slate-100 rounded-2xl text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-all shadow-sm">
                <Filter size={18} />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] shadow-elevation border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Pelaku Usaha</th>
                    {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN) && (
                      <>
                         <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Status Halal</th>
                         <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Pengolah Data</th>
                         <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Penginput Data</th>
                         <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">No HP</th>
                      </>
                    )}
                    {!(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN) && (
                      <>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">
                          {user?.role === UserRole.DATLAP ? 'No WA' : 'Alamat & Kecamatan'}
                        </th>
                        <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Produk & Merek</th>
                      </>
                    )}
                    <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredData.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 group transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 uppercase">{item.namaPelakuUsaha}</div>
                        <div className="text-xs font-medium text-slate-400 tracking-tight">{item.nik}</div>
                      </td>
                      {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN) ? (
                        <>
                          <td className="px-6 py-4 text-center">
                            <span className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider", getStatusColor(item.statusProses!))}>
                              {item.statusProses === 'terbit sertifikat halal' ? 'HALAL TERBIT' : item.statusProses}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2" title={item.processedByName}>
                                <div className={cn(
                                  "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter",
                                  item.processedByOldat ? "bg-purple-100 text-purple-600" : "bg-slate-100 text-slate-400"
                                )}>
                                  <UserCheck size={12} />
                                  {formatName(item.processedByName)}
                                </div>
                              </div>
                              {item.status_pengolahan === 'Sudah Diambil' && (
                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest pl-1 shrink-0">
                                  Diambil oleh: {item.diambil_oleh_name?.split(' ')[0]}
                                </div>
                              )}
                              {item.status_pengolahan === 'Belum Diambil' && (
                                <div className="text-[8px] font-black text-rose-400 uppercase tracking-widest pl-1 shrink-0 bg-rose-50 rounded px-1 w-fit">
                                  Belum Diambil
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2" title={item.createdByName}>
                              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-tighter">
                                <UserPlus size={12} />
                                {formatName(item.createdByName)}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-slate-700">
                            {item.noHp}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4">
                            {user?.role === UserRole.DATLAP ? (
                              <div className="text-sm font-bold text-slate-700">{item.noHp}</div>
                            ) : (
                              <>
                                <div className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{item.alamatUsh}</div>
                                <div className="text-[10px] font-medium text-slate-400 uppercase">{item.kecamatan} - {item.kodePos}</div>
                              </>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-slate-700">{item.namaProduk}</div>
                            <div className="text-[10px] font-medium text-slate-400 uppercase">{item.namaMerek}</div>
                          </td>
                        </>
                      )}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {user?.role === UserRole.OLDAT && (
                             <button 
                              disabled={item.status_pengolahan === 'Sudah Diambil'}
                              className={cn(
                                "p-2.5 rounded-xl transition-all shadow-lg flex items-center gap-2 group/ambil",
                                item.status_pengolahan === 'Sudah Diambil' 
                                  ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none" 
                                  : "bg-emerald-100 text-emerald-600 hover:bg-emerald-500 hover:text-white shadow-emerald-500/5 font-black uppercase text-[10px] tracking-widest px-4"
                              )}
                              title={item.status_pengolahan === 'Sudah Diambil' ? `Diambil oleh ${item.diambil_oleh_name}` : "Ambil Data"}
                              onClick={() => {
                                if(confirm('Ambil data ini untuk diproses?')) {
                                  dataService.takeData(item.id!, user);
                                  const newList = dataService.getDataList();
                                  setDataList(newList);
                                  broadcast.postMessage({ type: 'UPDATE_DATA', id: item.id });

                                  addNotification({
                                    title: 'Data Diambil',
                                    message: `Data Pelaku Usaha ${item.namaPelakuUsaha} telah diambil oleh ${user?.name} untuk diproses.`,
                                    timestamp: new Date().toISOString(),
                                    read: false,
                                    type: 'SYSTEM',
                                    userId: user?.id || 'system',
                                    actorName: user?.name || 'OLDAT',
                                    targetRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OLDAT]
                                  });
                                }
                              }}
                            >
                              <Hand size={16} className={cn(item.status_pengolahan !== 'Sudah Diambil' && "group-hover/ambil:rotate-12 transition-transform")} />
                              <span>{item.status_pengolahan === 'Sudah Diambil' ? 'Diambil' : 'Ambil'}</span>
                            </button>
                          )}

                          <button 
                            className={cn(
                              "p-2.5 rounded-xl transition-all shadow-lg",
                              (user?.role === UserRole.OLDAT && item.status_pengolahan === 'Sudah Diambil' && item.diambil_oleh_id !== user.id)
                                ? "bg-slate-50 text-slate-300 cursor-not-allowed shadow-none"
                                : "bg-primary/10 text-primary hover:bg-primary hover:text-white shadow-primary/5"
                            )}
                            title={(user?.role === UserRole.OLDAT && item.status_pengolahan === 'Sudah Diambil' && item.diambil_oleh_id !== user.id) ? `Terkunci (Sedang diproses oleh ${item.diambil_oleh_name})` : "Edit Data"}
                            onClick={() => {
                              if (user?.role === UserRole.OLDAT && item.status_pengolahan === 'Sudah Diambil' && item.diambil_oleh_id !== user.id) {
                                alert(`Data ini sedang diproses oleh ${item.diambil_oleh_name}. Anda hanya memiliki akses baca.`);
                                return;
                              }
                              if (user?.role === UserRole.DATLAP) {
                                navigate('/input', { state: { editItem: item } });
                              } else {
                                setEditingData(item);
                                setViewStep(3);
                              }
                            }}
                          >
                            {(user?.role === UserRole.OLDAT && item.status_pengolahan === 'Sudah Diambil' && item.diambil_oleh_id !== user.id) ? (
                              <Lock size={18} />
                            ) : (
                              <Edit3 size={18} />
                            )}
                          </button>
                          {(user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.ADMIN) && (
                            <button 
                              className="p-2.5 rounded-xl bg-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-500/5 group/delete"
                              title="Hapus / Verifikasi sebagai Pelaku Usaha"
                              onClick={() => {
                                if(confirm('Apakah Anda yakin ingin menghapus data ini? Tindakan ini akan menyaring data pelaku usaha.')) {
                                  dataService.deleteData(item.id!);
                                  const newList = dataService.getDataList();
                                  setDataList(newList);
                                  broadcast.postMessage({ type: 'DELETE_DATA', id: item.id });
                                  
                                  addNotification({
                                    title: 'Data Dihapus',
                                    message: `Data Pelaku Usaha ${item.namaPelakuUsaha} telah dihapus/disaring oleh ${user?.name}.`,
                                    timestamp: new Date().toISOString(),
                                    read: false,
                                    type: 'SYSTEM',
                                    userId: user?.id || 'system',
                                    actorName: user?.name || 'Admin',
                                    targetRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN]
                                  });
                                }
                              }}
                            >
                              <Trash2 size={18} className="group-hover/delete:scale-110 transition-transform" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredData.length === 0 && (
              <div className="p-20 text-center text-slate-400 font-medium">
                <ShieldAlert size={48} className="mx-auto mb-4 opacity-20" />
                Belum ada data untuk kriteria ini.
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* STEP 3: Edit Mode (Limited/Full) */}
      {viewStep === 3 && editingData && (
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-4xl mx-auto space-y-6"
        >
          <div className="flex items-center justify-between">
            <button onClick={() => setViewStep(2)} className="flex items-center gap-2 text-slate-500 font-bold hover:text-primary">
              <ChevronRight className="rotate-180" size={20} />
              KEMBALI KE LIST
            </button>
            {user?.role === UserRole.DATLAP ? (
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs font-black text-slate-400 uppercase tracking-widest">FORM INPUT DATA</div>
                  <div className="text-[10px] font-bold text-primary">Satu Data Pelaku Usaha • Step 1 of 3</div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-[10px] font-black uppercase shadow-lg shadow-primary/20">
                  <Lock size={12} /> Kunci data
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 text-amber-700 text-xs font-black uppercase">
                <Lock size={14} /> Mode Edit Terbatas
              </div>
            )}
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-elevation border border-slate-100 overflow-hidden">
             <div className="bg-primary p-8 text-white flex justify-between items-center">
                <div>
                   <h2 className="text-2xl font-black tracking-tight uppercase">{editingData.namaPelakuUsaha || 'Nama Pelaku Usaha'}</h2>
                   <p className="opacity-80 font-medium text-sm">NIK: {editingData.nik || '---'} • Terakhir Update: {editingData.timestamp || 'Baru'}</p>
                </div>
                {user?.role === UserRole.OLDAT && (
                   <button 
                    onClick={() => {
                      alert('Mode edit data diaktifkan');
                    }}
                    className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest backdrop-blur-md transition-all shadow-lg"
                   >
                     Edit data
                   </button>
                )}
             </div>

             <div className="p-8 md:p-12 space-y-10">
                {editingData.statusProses === 'Halal Terbit' ? (
                  <div className="space-y-8">
                    <div className="p-10 bg-emerald-50 border-2 border-emerald-100 rounded-[3rem] text-center space-y-6">
                      <div className="h-24 w-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-200">
                        <CheckCircle2 size={48} />
                      </div>
                      <div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight uppercase">SERTIFIKAT TERBIT</h3>
                        <p className="text-emerald-600 font-bold">Data ini sudah terkunci dan selesai diolah.</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-xl mx-auto pt-4">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 text-left">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nama Pelaku Usaha</label>
                          <div className="font-bold text-slate-800 text-lg uppercase">{editingData.namaPelakuUsaha}</div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 text-left">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nomor HP Pelaku Usaha</label>
                          <div className="font-bold text-slate-800 text-lg">{editingData.noHp}</div>
                        </div>
                      </div>

                      <div className="pt-6">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Status Proses</label>
                        <div className="inline-flex items-center gap-2 px-8 py-3 bg-emerald-500 text-white rounded-full font-black text-sm uppercase tracking-wider">
                          <CheckCircle2 size={16} /> {editingData.statusProses}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <button onClick={() => setViewStep(2)} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200">
                        KEMBALI KE DAFTAR DATA
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-10">
                      {user?.role === UserRole.OLDAT && (
                        <div className="space-y-6 pb-10 border-b border-slate-100">
                          <div className="flex items-center gap-3 text-primary">
                            <div className="h-2 w-8 bg-primary rounded-full" />
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
                              <h2 className="font-black tracking-tight text-lg uppercase whitespace-nowrap">Simpan disini emailTempnya (Temporary)</h2>
                              <button 
                                onClick={() => window.open('https://temp-mail.org/id/', '_blank')}
                                className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl font-bold text-xs hover:bg-primary hover:text-white transition-all group"
                              >
                                <ExternalLink size={14} className="group-hover:rotate-12 transition-transform" />
                                KLIK INI UNTUK MEMBUAT EMAIL
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Email Tergenerate *</label>
                              <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                  type="email" 
                                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-600"
                                  value={editingData.emailTemp || ''}
                                  onChange={e => setEditingData({...editingData, emailTemp: e.target.value})}
                                  placeholder="nama.halal@gmail.com"
                                />
                                <button 
                                  onClick={() => {
                                    const email = `${editingData.namaPelakuUsaha?.toLowerCase().replace(/\s+/g, '.')}.halal@gmail.com`;
                                    setEditingData({...editingData, emailTemp: email});
                                  }}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all"
                                  title="Auto Generate Email"
                                >
                                  <PlusCircle size={16} />
                                </button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Password Temporary *</label>
                              <div className="relative">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                  type={showPassword ? 'text' : 'password'} 
                                  className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-600"
                                  value={editingData.passwordHash || ''}
                                  onChange={e => setEditingData({...editingData, passwordHash: e.target.value})}
                                  placeholder="Min 8 karakter"
                                />
                                <button 
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-primary transition-all"
                                >
                                  {showPassword ? <X size={18} /> : <Eye size={18} />}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 text-primary">
                        <div className="h-2 w-8 bg-primary rounded-full" />
                        <h2 className="font-black tracking-tight text-lg uppercase">Identitas Pelaku Usaha</h2>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-2">
                         <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nama Lengkap *</label>
                         <input 
                          type="text" 
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-600 uppercase"
                          value={editingData.namaPelakuUsaha}
                          onChange={e => setEditingData({...editingData, namaPelakuUsaha: e.target.value})}
                          placeholder={user?.role === UserRole.DATLAP ? "Bpk. Junaedi" : ""}
                         />
                       </div>
                       <div className="space-y-2">
                         <label className="text-xs font-black text-slate-400 uppercase tracking-widest">NIK (16 Digit) *</label>
                         <input 
                          type="text" 
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-600"
                          value={editingData.nik}
                          onChange={e => setEditingData({...editingData, nik: e.target.value})}
                          placeholder={user?.role === UserRole.DATLAP ? "320101XXXXXXXXXX" : ""}
                         />
                       </div>
                       <div className="space-y-2">
                         <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nomor HP (WhatsApp) *</label>
                         <input 
                          type="text" 
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-600"
                          value={editingData.noHp}
                          onChange={e => setEditingData({...editingData, noHp: e.target.value})}
                          placeholder={user?.role === UserRole.DATLAP ? "0812XXXXXXXX" : ""}
                         />
                       </div>
                       {user?.role !== UserRole.OLDAT && (
                         <div className="space-y-2">
                           <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Upload KTP/NIK *</label>
                           <div 
                            className="w-full h-[58px] bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between px-5 cursor-pointer hover:bg-slate-100 transition-all group"
                           >
                             <span className="text-slate-400 text-xs font-bold truncate">
                               {editingData.fotoNikUrl ? '✓ KTP Terupload' : (user?.role === UserRole.DATLAP ? 'Klik untuk upload KTP' : 'Ganti/Upload KTP')}
                             </span>
                             <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-white">
                               <ImageIcon size={16} />
                             </div>
                           </div>
                         </div>
                       )}
                       <div className="space-y-2">
                         <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Tanggal Lahir *</label>
                         <input 
                          type="date" 
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-600"
                          value={editingData.tanggalLahir}
                          onChange={e => setEditingData({...editingData, tanggalLahir: e.target.value})}
                         />
                       </div>
                       <div className="space-y-4">
                          <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Kategori KBLI *</label>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-600">
                              {dataService.getKblis().find(k => k.id === editingData.kbliId)?.kode || 'BELUM DIPILIH'} - {dataService.getKblis().find(k => k.id === editingData.kbliId)?.judul || ''}
                            </div>
                            <button 
                             onClick={() => setIsEditingKbliTop(!isEditingKbliTop)}
                             className="p-4 rounded-2xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-lg"
                            >
                              <Edit3 size={20} />
                            </button>
                          </div>
                          
                          <AnimatePresence>
                            {isEditingKbliTop && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <select 
                                  className="w-full bg-white border-2 border-primary rounded-2xl px-4 py-4 font-bold text-slate-700 outline-none shadow-xl shadow-primary/5"
                                  value={editingData.kbliId}
                                  onChange={e => {
                                    setEditingData({...editingData, kbliId: e.target.value});
                                    setIsEditingKbliTop(false);
                                  }}
                                >
                                  <option value="">Pilih KBLI...</option>
                                  {dataService.getKblis().map(kbli => (
                                    <option key={kbli.id} value={kbli.id}>{kbli.kode} - {kbli.judul}</option>
                                  ))}
                                </select>
                              </motion.div>
                            )}
                          </AnimatePresence>
                       </div>
                       <div className="space-y-2">
                         <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Kecamatan *</label>
                         <input 
                          type="text" 
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-600 uppercase"
                          value={editingData.kecamatan}
                          onChange={e => setEditingData({...editingData, kecamatan: e.target.value})}
                          placeholder={user?.role === UserRole.DATLAP ? "Kecamatan..." : ""}
                         />
                       </div>

                       <div className="md:col-span-2 space-y-2">
                         <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Alamat Lengkap Usaha *</label>
                         <textarea 
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-600 h-24 resize-none"
                          value={editingData.alamatUsh}
                          onChange={e => setEditingData({...editingData, alamatUsh: e.target.value})}
                          placeholder={user?.role === UserRole.DATLAP ? "Jl. Raya No. 123, Desa..." : ""}
                         />
                       </div>
                       
                       {user?.role === UserRole.OLDAT && (
                         <>
                           <div className="md:col-span-2 bg-amber-500/10 p-6 rounded-3xl border border-amber-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 mb-2">
                             <div className="text-sm font-bold text-amber-800">
                               siapkan NIK, Email Tempt dan Passwordnya, Copy lalu daftar NIB disini
                             </div>
                             <button
                               type="button"
                               onClick={() => window.open('https://ui-login.oss.go.id/register', '_blank')}
                               className="px-6 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-all shadow-md shadow-amber-500/20 whitespace-nowrap"
                             >
                               Daftar NIB
                             </button>
                           </div>
                           <div className="md:col-span-2 space-y-2">
                             <label className="text-xs font-black text-slate-400 uppercase tracking-widest">NIB & Dokumen</label>
                             <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                               <input 
                                type="text" 
                                className="w-full sm:w-1/3 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-600"
                                value={editingData.nib || ''}
                                onChange={e => setEditingData({...editingData, nib: e.target.value})}
                                placeholder="Masukkan NIB..."
                               />
                               <div className="w-full sm:w-1/3 relative">
                                 <input 
                                   type="file" 
                                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                   onChange={(e) => {
                                     if (e.target.files && e.target.files[0]) {
                                        // Simulate file upload
                                        alert(`File ${e.target.files[0].name} terpilih`);
                                     }
                                   }}
                                 />
                                 <div className="w-full px-5 py-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl font-bold text-slate-500 text-center flex items-center justify-center gap-2 pointer-events-none hover:bg-slate-100 transition-colors">
                                   <Upload size={18} />
                                   <span>Upload NIB</span>
                                 </div>
                               </div>
                               <div className="flex gap-2 w-full sm:w-auto">
                                 <button
                                   onClick={handleSave}
                                   disabled={saving}
                                   className="flex-1 px-6 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-black transition-colors disabled:opacity-50 whitespace-nowrap"
                                 >
                                   {saving ? '...' : 'Simpan'}
                                 </button>
                                 <button
                                   onClick={() => {
                                      alert('Data NIB dan dokumen berhasil dikirim ke Admin/Penyelia');
                                      setEditingData({...editingData, statusProses: 'Proses Pengajuan Halal'});
                                      handleSave();
                                   }}
                                   disabled={saving}
                                   className="flex-1 px-6 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-colors disabled:opacity-50 whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer"
                                 >
                                   <Send className="w-4 h-4" />
                                   Kirim Ke Penyelia
                                 </button>
                               </div>
                             </div>
                             {!showHalalProcess && (
                               <div className="pt-4">
                                 <button
                                   onClick={() => setShowHalalProcess(true)}
                                   className="w-full px-6 py-4 bg-purple-500 text-white font-bold rounded-2xl hover:bg-purple-600 transition-colors flex justify-center items-center gap-2 cursor-pointer"
                                 >
                                   Lanjut Proses Halal
                                 </button>
                               </div>
                             )}
                           </div>
                         </>
                       )}
                      </div>

                      <div className={cn("space-y-10 pt-10 border-t border-slate-100", (!showHalalProcess && user?.role === UserRole.OLDAT) && "hidden")}>
                       {user?.role === UserRole.OLDAT && showHalalProcess && (
                         <div className="space-y-6">
                           <div className="bg-primary/5 p-6 rounded-3xl border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                             <div className="text-sm font-bold text-slate-700">
                               Siapkan Email Temp & Paswordnya Copy lalu klik tombol ini
                             </div>
                             <button
                               type="button"
                               onClick={() => window.open('https://ptsp.halal.go.id/login', '_blank')}
                               className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all shadow-md shadow-primary/20 whitespace-nowrap"
                             >
                               Klik mendaftar Halal
                             </button>
                           </div>

                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div className="space-y-2">
                               <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Tanggal Pengajuan *</label>
                               <input 
                                type="date" 
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-600"
                                value={editingData.tanggalPengajuan || ''}
                                onChange={e => setEditingData({...editingData, tanggalPengajuan: e.target.value})}
                               />
                             </div>
                             <div className="space-y-2">
                               <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Tanggal Datang Penyelia *</label>
                               <input 
                                type="date" 
                                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-600"
                                value={editingData.tanggalDatangPenyelia || ''}
                                onChange={e => setEditingData({...editingData, tanggalDatangPenyelia: e.target.value})}
                               />
                             </div>
                           </div>

                           <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4">
                             <div>
                               <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1 block">Untuk SK penyelia Silahkan copy dari sini</label>
                               <div className="flex items-center gap-2">
                                 <div className="flex-1 bg-white px-4 py-3 border border-slate-200 rounded-xl font-mono text-sm font-bold text-slate-700 overflow-x-auto whitespace-nowrap">
                                   {String(editingData.id || '0').padStart(3, '0')}/SP.{user?.kodeWilayah || 'KODE_WILAYAH'}/GN/{getRomanMonth(editingData.tanggalDatangPenyelia)}/{getYear(editingData.tanggalDatangPenyelia)}
                                 </div>
                                 <button
                                   type="button"
                                   onClick={() => {
                                     const sk = `${String(editingData.id || '0').padStart(3, '0')}/SP.${user?.kodeWilayah || 'KODE_WILAYAH'}/GN/${getRomanMonth(editingData.tanggalDatangPenyelia)}/${getYear(editingData.tanggalDatangPenyelia)}`;
                                     navigator.clipboard.writeText(sk);
                                     alert('SK Berhasil di Copy');
                                   }}
                                   className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-primary flex-shrink-0"
                                   title="Copy SK"
                                 >
                                   <Copy size={18} />
                                 </button>
                               </div>
                             </div>

                             </div>
                           </div>
                         )}
                         <div className="flex items-center gap-3 text-primary">
                            <div className="h-2 w-8 bg-primary rounded-full" />
                            <h2 className="font-black tracking-tight text-lg uppercase">Data Produk</h2>
                          </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <label className="text-sm font-black text-slate-400 uppercase tracking-widest">Kategori KBLI *</label>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-600">
                              {dataService.getKblis().find(k => k.id === editingData.kbliId)?.kode || 'BELUM DIPILIH'} - {dataService.getKblis().find(k => k.id === editingData.kbliId)?.judul || ''}
                            </div>
                            <button 
                             onClick={() => setIsEditingKbli(!isEditingKbli)}
                             className="p-4 rounded-2xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all shadow-lg"
                            >
                              <Edit3 size={20} />
                            </button>
                          </div>
                          
                          <AnimatePresence>
                            {isEditingKbli && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <select 
                                  className="w-full bg-white border-2 border-primary rounded-2xl px-4 py-4 font-bold text-slate-700 outline-none shadow-xl shadow-primary/5"
                                  value={editingData.kbliId}
                                  onChange={e => {
                                    setEditingData({...editingData, kbliId: e.target.value});
                                    setIsEditingKbli(false);
                                  }}
                                >
                                  <option value="">Pilih KBLI...</option>
                                  {dataService.getKblis().map(kbli => (
                                    <option key={kbli.id} value={kbli.id}>{kbli.kode} - {kbli.judul}</option>
                                  ))}
                                </select>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-600">Nama Merek / Pabrik *</label>
                          <input 
                            type="text" 
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 font-bold text-slate-700 outline-none" 
                            value={editingData.namaMerek}
                            onChange={e => setEditingData({...editingData, namaMerek: e.target.value})}
                            placeholder={user?.role === UserRole.DATLAP ? "Zeny Kerupuk" : ""}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-600">Nama Produk *</label>
                          <input 
                            type="text" 
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 font-bold text-slate-700 outline-none" 
                            value={editingData.namaProduk}
                            onChange={e => setEditingData({...editingData, namaProduk: e.target.value})}
                            placeholder={user?.role === UserRole.DATLAP ? "Kerupuk Pisang Manis" : ""}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-600">Cleaning Agent (Alat Cuci) *</label>
                          <input 
                            type="text" 
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 font-bold text-slate-700 outline-none" 
                            value={editingData.cleaningAgent}
                            onChange={e => setEditingData({...editingData, cleaningAgent: e.target.value})}
                            placeholder={user?.role === UserRole.DATLAP ? "Contoh: Sunlight, Mama Lemon" : ""}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-600">Jenis Kemasan *</label>
                          <input 
                            type="text" 
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 font-bold text-slate-700 outline-none" 
                            value={editingData.kemasan}
                            onChange={e => setEditingData({...editingData, kemasan: e.target.value})}
                            placeholder={user?.role === UserRole.DATLAP ? "Contoh: Plastik, Styrofoam, Botol Kaca" : ""}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600">Bahan Baku Utama (Pisah Koma) *</label>
                        <textarea 
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 font-bold text-slate-700 outline-none h-32 resize-none"
                          value={editingData.bahanBaku}
                          onChange={e => setEditingData({...editingData, bahanBaku: e.target.value})}
                          placeholder={user?.role === UserRole.DATLAP ? "Pisang, Minyak Goreng, Gula Pasir, Garam" : ""}
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-bold text-slate-600">Proses Produksi (Otomatis AI) *</label>
                          {user?.role === UserRole.DATLAP && (
                             <button className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest">GENERATE AI</button>
                          )}
                        </div>
                        <textarea 
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-4 font-bold text-slate-700 outline-none h-48 resize-none"
                          value={editingData.prosesProduksi}
                          onChange={e => setEditingData({...editingData, prosesProduksi: e.target.value})}
                          placeholder={user?.role === UserRole.DATLAP ? "Hasil generate AI akan muncul di sini..." : ""}
                        />
                      </div>

                      <div className="space-y-6 pt-10 border-t border-slate-100">
                        <div className="flex items-center gap-3 text-primary">
                          <div className="h-2 w-8 bg-primary rounded-full" />
                          <h2 className="font-black tracking-tight text-lg uppercase">Dokumentasi Foto</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <div className="space-y-4">
                             <div className="p-4 bg-slate-50 border border-slate-100 rounded-[2rem] overflow-hidden aspect-video flex items-center justify-center relative">
                               {editingData.fotoNikUrl || (editingData.id === '1' && 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2629&auto=format&fit=crop') ? (
                                 <img 
                                   src={editingData.fotoNikUrl || 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2629&auto=format&fit=crop'} 
                                   alt="Preview KTP" 
                                   className="w-full h-full object-cover"
                                   referrerPolicy="no-referrer"
                                 />
                               ) : (
                                 <ImageIcon size={40} className="text-slate-300" />
                               )}
                               <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">KTP Pelaku Usaha</div>
                             </div>
                             <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] text-center flex flex-col items-center gap-4">
                                <div>
                                   <div className="font-black text-slate-800 text-sm">Update KTP</div>
                                   <div className="text-[10px] font-bold text-slate-400 mt-1">Format JPEG/PNG, Maksimal 5MB</div>
                                </div>
                                <div className="flex flex-wrap justify-center gap-3">
                                  <button className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-black text-primary hover:bg-primary hover:text-white transition-all shadow-sm">
                                    GANTI FOTO
                                  </button>
                                  {user?.role === UserRole.OLDAT && (
                                    <button 
                                      onClick={() => {
                                        const url = editingData.fotoNikUrl || 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2629&auto=format&fit=crop';
                                        const filename = `KTP_${editingData.namaPelakuUsaha?.replace(/\s+/g, '_') || 'Pelaku_Usaha'}.jpg`;
                                        fetch(url)
                                          .then(response => response.blob())
                                          .then(blob => {
                                            const link = document.createElement('a');
                                            link.href = URL.createObjectURL(blob);
                                            link.download = filename;
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                          });
                                      }}
                                      className="bg-primary text-white px-4 py-2 rounded-xl text-[10px] font-black hover:bg-primary-dark transition-all shadow-md shadow-primary/20 flex items-center gap-2"
                                    >
                                      <Download size={12} />
                                      DOWNLOAD
                                    </button>
                                  )}
                                </div>
                             </div>
                           </div>

                           <div className="space-y-4">
                             <div className="p-4 bg-slate-50 border border-slate-100 rounded-[2rem] overflow-hidden aspect-video flex items-center justify-center relative">
                               {(editingData.fotoProdukUrls?.[0]) || (editingData.id === '1' && 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=2612&auto=format&fit=crop') ? (
                                 <img 
                                   src={editingData.fotoProdukUrls?.[0] || 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=2612&auto=format&fit=crop'} 
                                   alt="Preview Produk" 
                                   className="w-full h-full object-cover"
                                   referrerPolicy="no-referrer"
                                 />
                               ) : (
                                 <ImageIcon size={40} className="text-slate-300" />
                               )}
                               <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">Foto Produk</div>
                             </div>
                             <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] text-center flex flex-col items-center gap-4">
                                <div>
                                   <div className="font-black text-slate-800 text-sm">Update Foto Produk</div>
                                   <div className="text-[10px] font-bold text-slate-400 mt-1">Satu foto utama yang jelas</div>
                                </div>
                                <div className="flex flex-wrap justify-center gap-3">
                                  <button className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-black text-primary hover:bg-primary hover:text-white transition-all shadow-sm">
                                    GANTI FOTO
                                  </button>
                                  {user?.role === UserRole.OLDAT && (
                                    <button 
                                      onClick={() => {
                                        const url = editingData.fotoProdukUrls?.[0] || 'https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=2612&auto=format&fit=crop';
                                        const filename = `${editingData.namaProduk?.replace(/\s+/g, '_') || 'Produk'}_${editingData.namaMerek?.replace(/\s+/g, '_') || 'Merek'}.jpg`;
                                        fetch(url)
                                          .then(response => response.blob())
                                          .then(blob => {
                                            const link = document.createElement('a');
                                            link.href = URL.createObjectURL(blob);
                                            link.download = filename;
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                          });
                                      }}
                                      className="bg-primary text-white px-4 py-2 rounded-xl text-[10px] font-black hover:bg-primary-dark transition-all shadow-md shadow-primary/20 flex items-center gap-2"
                                    >
                                      <Download size={12} />
                                      DOWNLOAD
                                    </button>
                                  )}
                                </div>
                             </div>
                           </div>

                           <div className="space-y-4">
                             <div className="p-4 bg-slate-50 border border-slate-100 rounded-[2rem] overflow-hidden aspect-video flex items-center justify-center relative">
                               {(editingData.fotoProdukUrls?.[1]) || (editingData.id === '1' && 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2574&auto=format&fit=crop') ? (
                                 <img 
                                   src={editingData.fotoProdukUrls?.[1] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2574&auto=format&fit=crop'} 
                                   alt="Preview Pendamping" 
                                   className="w-full h-full object-cover"
                                   referrerPolicy="no-referrer"
                                 />
                               ) : (
                                 <ImageIcon size={40} className="text-slate-300" />
                               )}
                               <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">Foto Pendamping</div>
                             </div>
                             <div className="p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] text-center flex flex-col items-center gap-4">
                                <div>
                                   <div className="font-black text-slate-800 text-sm">Update Pendamping & Produk</div>
                                   <div className="text-[10px] font-bold text-slate-400 mt-1">Foto pelaku usaha & produk</div>
                                </div>
                                <div className="flex flex-wrap justify-center gap-3">
                                  <button className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-black text-primary hover:bg-primary hover:text-white transition-all shadow-sm">
                                    GANTI FOTO
                                  </button>
                                  {user?.role === UserRole.OLDAT && (
                                    <button 
                                      onClick={() => {
                                        const url = editingData.fotoProdukUrls?.[1] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2574&auto=format&fit=crop';
                                        const filename = `Pendamping_${editingData.namaProduk?.replace(/\s+/g, '_') || 'Produk'}_${editingData.namaMerek?.replace(/\s+/g, '_') || 'Merek'}.jpg`;
                                        fetch(url)
                                          .then(response => response.blob())
                                          .then(blob => {
                                            const link = document.createElement('a');
                                            link.href = URL.createObjectURL(blob);
                                            link.download = filename;
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                          });
                                      }}
                                      className="bg-primary text-white px-4 py-2 rounded-xl text-[10px] font-black hover:bg-primary-dark transition-all shadow-md shadow-primary/20 flex items-center gap-2"
                                    >
                                      <Download size={12} />
                                      DOWNLOAD
                                    </button>
                                  )}
                                </div>
                             </div>
                           </div>
                        </div>

                        {user?.role !== UserRole.OLDAT && (
                          <div className="space-y-6 pt-10 border-t border-slate-100">
                            <div className="flex items-center gap-3 text-primary">
                              <div className="h-2 w-8 bg-primary rounded-full" />
                              <h2 className="font-black tracking-tight text-lg uppercase">Akses & Login (Temporary)</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Email Tergenerate *</label>
                                <div className="relative">
                                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                  <input 
                                    type="email" 
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-600"
                                    value={editingData.emailTemp || ''}
                                    onChange={e => setEditingData({...editingData, emailTemp: e.target.value})}
                                    placeholder="nama.halal@gmail.com"
                                  />
                                  <button 
                                    onClick={() => {
                                      const email = `${editingData.namaPelakuUsaha?.toLowerCase().replace(/\s+/g, '.')}.halal@gmail.com`;
                                      setEditingData({...editingData, emailTemp: email});
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-all"
                                    title="Auto Generate Email"
                                  >
                                    <PlusCircle size={16} />
                                  </button>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Password Temporary *</label>
                                <div className="relative">
                                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                  <input 
                                    type={showPassword ? 'text' : 'password'} 
                                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-600"
                                    value={editingData.passwordHash || ''}
                                    onChange={e => setEditingData({...editingData, passwordHash: e.target.value})}
                                    placeholder="Min 8 karakter"
                                  />
                                  <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-primary transition-all"
                                  >
                                    {showPassword ? <X size={18} /> : <Eye size={18} />}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {user?.role === UserRole.ADMIN && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100">
                           <div className="space-y-2">
                             <label className="text-sm font-black text-primary uppercase tracking-widest">Status Halal (Admin)</label>
                             <select 
                              className="w-full bg-primary/5 border border-primary/20 rounded-[2rem] px-6 py-5 font-black text-primary outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer text-lg"
                              value={editingData.statusProses}
                              onChange={e => setEditingData({...editingData, statusProses: e.target.value as StatusProses})}
                             >
                               {adminHalalStatuses.map(s => (
                                 <option key={s} value={s}>{s}</option>
                               ))}
                             </select>
                           </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {user?.role === UserRole.OLDAT && showHalalProcess && (
                    <div className="space-y-4 pt-10 border-t border-slate-100 pb-2">
                      <div className="flex items-center gap-3 text-primary">
                        <div className="h-2 w-8 bg-primary rounded-full" />
                        <h2 className="font-black tracking-tight text-lg uppercase">ID Halal & Dokumen</h2>
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                        <input 
                         type="text" 
                         className="w-full sm:w-1/3 px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-600"
                         value={editingData.noDokumen || ''}
                         onChange={e => setEditingData({...editingData, noDokumen: e.target.value})}
                         placeholder="Masukkan ID Halal..."
                        />
                        <div className="w-full sm:w-1/3 relative">
                          <input 
                            type="file" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                 // Simulate file upload
                                 alert(`File ${e.target.files[0].name} terpilih`);
                              }
                            }}
                          />
                          <div className="w-full px-5 py-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl font-bold text-slate-500 text-center flex items-center justify-center gap-2 pointer-events-none hover:bg-slate-100 transition-colors">
                            <Upload size={18} />
                            <span>Upload SH</span>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 px-6 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-black transition-colors disabled:opacity-50 whitespace-nowrap"
                          >
                            {saving ? '...' : 'Simpan'}
                          </button>
                          <button
                            onClick={() => {
                               alert('Data ID Halal dan Sertifikat Halal berhasil disimpan dan dikirim ke Admin/Penyelia');
                               setEditingData({...editingData, statusProses: 'Halal Terbit'});
                               handleSave();
                            }}
                            disabled={saving}
                            className="flex-1 px-6 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition-colors disabled:opacity-50 whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Send className="w-4 h-4" />
                            Kirim Ke Penyelia
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-10 flex flex-wrap gap-4">
                       <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 py-5 rounded-[2rem] bg-primary text-white font-black text-lg shadow-xl shadow-primary/30 hover:bg-primary-dark transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-wait"
                       >
                          {saving ? (
                            <>PROSES MENYIMPAN... <Loader2 className="animate-spin" /></>
                          ) : (
                            user?.role === UserRole.DATLAP ? (
                              <>KUNCI DATA DULU SEBELUM SIMPAN <Lock /></>
                            ) : (
                              <>SIMPAN PERUBAHAN <CheckCircle2 /></>
                            )
                          )}
                       </button>
                       <button onClick={() => setViewStep(2)} className="px-8 py-5 rounded-[2rem] bg-slate-100 text-slate-600 font-black hover:bg-slate-200 transition-all">
                          BATAL
                       </button>
                    </div>
                  </>
                )}
             </div>
          </div>
        </motion.div>
      )}

      {/* SUCCESS NOTIFICATION */}
      <AnimatePresence>
        {isSaved && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-slate-900 border border-white/10 text-white px-10 py-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-6"
          >
            <div className="bg-emerald-500 p-4 rounded-2xl shadow-lg shadow-emerald-500/20">
              <CheckCircle2 size={32} className="text-white" />
            </div>
            <div>
              <div className="font-black text-xl uppercase tracking-tighter flex items-center gap-2">
                BERHASIL DISIMPAN 
                <span className="inline-block w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              </div>
              <div className="text-sm font-bold text-slate-400">Status Halal Berhasil Diperbarui & Terkirim Live!</div>
            </div>
            <div className="h-10 w-[1px] bg-white/10 mx-2" />
            <button onClick={() => setIsSaved(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <X size={24} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
