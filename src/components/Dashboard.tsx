/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  FileCheck, 
  Loader2, 
  TrendingUp, 
  DollarSign, 
  UserCheck,
  Briefcase,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { UserRole } from '../types';
import { cn } from '../lib/utils';
import { dataService } from '../services/dataService';
import NotificationDropdown from './NotificationDropdown';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(dataService.getStats());
  const [myGmv, setMyGmv] = useState(0);
  const [broadcast] = useState(() => new BroadcastChannel('halal_updates'));

  const updateStats = () => {
    setStats(dataService.getStats());
  };

  useEffect(() => {
    updateStats();
    
    broadcast.onmessage = (event) => {
      if (['UPDATE_DATA', 'ADD_DATA', 'DELETE_DATA'].includes(event.data.type)) {
        // Since dataService also needs to be updated, we assume the broadcaster 
        // updated the underlying store or we update it here if it's shared.
        // In this simulation, components update their own view but we need a global sync.
        
        // Let's ensure dataService is consistent. 
        // Note: In a real app, we'd use a store like Redux/Zustand or Firestore.
        const currentList = dataService.getDataList();
        if (event.data.type === 'ADD_DATA') {
          if (!currentList.find(d => d.id === event.data.item.id)) {
            dataService.setDataList([...currentList, event.data.item]);
          }
        } else if (event.data.type === 'UPDATE_DATA') {
          dataService.setDataList(currentList.map(d => d.id === event.data.item.id ? event.data.item : d));
        } else if (event.data.type === 'DELETE_DATA') {
          dataService.setDataList(currentList.filter(d => d.id !== event.data.id));
        }
        
        updateStats();
      }
    };

    return () => broadcast.close();
  }, [broadcast]);

  useEffect(() => {
    // Simulated realtime GMV data based on actual store
    const list = dataService.getDataList();
    if (user) {
      setMyGmv(dataService.calculateUserGmv(user, list as any));
    }
  }, [user, stats]);

  const cards = [
    { label: 'Data Masuk', value: stats.totalData, icon: Users, color: 'bg-blue-500' },
    { label: 'Proses NIB', value: stats.nibProses, icon: Loader2, color: 'bg-amber-500' },
    { label: 'Halal on Proses', value: stats.halalProses, icon: Briefcase, color: 'bg-purple-500' },
    { label: 'Halal Terbit', value: stats.halalTerbit, icon: FileCheck, color: 'bg-emerald-500' },
  ];

  return (
    <div className="p-4 sm:px-8 sm:py-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight uppercase">Dashboard Overview</h1>
          <p className="text-slate-400 font-bold text-[9px] uppercase tracking-widest mt-0.5">Status Sistem: <span className="text-emerald-500">Aktif & Berjalan</span></p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-3 justify-between sm:justify-start">
             <NotificationDropdown />
             <div className="md:hidden text-[9px] font-black text-slate-400 uppercase tracking-widest">Akses Cepat</div>
          </div>
          <div className="bg-slate-900 px-5 py-3 sm:px-6 sm:py-2.5 rounded-[1.5rem] shadow-xl shadow-purple-200 text-white flex items-center gap-4 relative overflow-hidden group flex-1 sm:flex-none">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-purple-500/20 rounded-full blur-2xl group-hover:bg-purple-500/30 transition-all"></div>
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white relative z-10 shrink-0">
              <DollarSign size={16} />
            </div>
            <div className="relative z-10 w-full">
              <div className="text-[9px] font-bold text-purple-300 uppercase tracking-widest">Total GMV Anda</div>
              <div className="text-lg sm:text-xl font-black text-white leading-none">
                Rp {myGmv.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="geometric-card p-3 sm:p-3.5 flex flex-col group hover:border-primary/50"
          >
            <span className="text-slate-400 text-[10px] sm:text-[11px] font-black uppercase tracking-wider">{card.label}</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl sm:text-4xl font-black text-slate-800 tracking-tighter leading-none">{card.value}</span>
              <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-1 py-0.5 rounded-md self-center">+12%</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4 sm:gap-6 pb-12">
        <div className="col-span-12 lg:col-span-8 geometric-card overflow-hidden flex flex-col min-h-[400px]">
          <div className="p-5 sm:p-6 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
            <h3 className="font-black text-xs uppercase text-slate-800 flex items-center gap-3 tracking-widest">
              <span className="w-1.5 h-6 bg-primary rounded-full shadow-purple-glow"></span>
              Aktivitas Data Terbaru
            </h3>
            <button className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest shadow-sm">
              Lihat Detail
            </button>
          </div>
          <div className="flex-1 p-4 sm:p-6 space-y-3 sm:space-y-4">
            {[
              { name: 'Bpk. Junaedi', produk: 'Kerupuk Pisang', status: 'Proses NIB & Halal', time: '5m ago' },
              { name: 'Ibu Siti', produk: 'Peyek Kacang', status: 'Proses NIB & Halal', time: '25m ago' },
              { name: 'Bpk. Ahmad', produk: 'Kripik Singkong', status: 'Halal Terbit', time: '1h ago' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 group hover:border-primary/20 transition-all gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center font-black shadow-inner">
                    {item.name[0]}
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-800 uppercase tracking-tight">{item.name}</div>
                    <div className="text-[10px] font-bold text-slate-400 capitalize">{item.produk} • {item.time}</div>
                  </div>
                </div>
                <div className={cn(
                  "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest self-start sm:self-center",
                  item.status === 'Halal Terbit' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 
                  item.status === 'Proses NIB & Halal' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                )}>
                  {item.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-4 sm:space-y-6">
          <div className="geometric-card p-6 sm:p-8 border-none bg-slate-900 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="p-2.5 bg-primary rounded-xl shadow-purple-glow">
                <Sparkles size={20} className="text-white" />
              </div>
              <span className="font-black text-xs uppercase tracking-widest">AI Insights</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed mb-8 font-bold relative z-10">
              Berdasarkan tren <span className="text-white">7 hari terakhir</span>, pengolahan NIB meningkat <span className="font-black text-primary">22%</span>. Rekomendasi alokasi pendamping untuk wilayah Anda sedang dioptimasi.
            </p>
            <button className="w-full py-4 bg-primary text-white rounded-2xl text-[10px] font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest relative z-10 border border-white/10">
              Update Report AI
            </button>
          </div>

          <div className="geometric-card p-6 sm:p-8">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Informasi Akun</h4>
            <div className="space-y-5">
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Hak Akses</span>
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg font-black text-[10px] uppercase border border-primary/10">{user?.role}</span>
              </div>
              <div className="h-px bg-slate-50 w-full"></div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Wilayah Operasi</span>
                <span className="font-black text-slate-800 text-xs tracking-tight uppercase">{user?.kodeWilayah || 'PUSAT'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
