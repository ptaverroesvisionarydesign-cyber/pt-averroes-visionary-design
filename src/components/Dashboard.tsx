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
    { label: 'Total Data Masuk', value: stats.totalData, icon: Users, color: 'bg-blue-500' },
    { label: 'Proses NIB', value: stats.nibProses, icon: Loader2, color: 'bg-amber-500' },
    { label: 'Halal On Process', value: stats.halalProses, icon: Briefcase, color: 'bg-purple-500' },
    { label: 'Halal Terbit', value: stats.halalTerbit, icon: FileCheck, color: 'bg-emerald-500' },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 font-medium text-sm">System Status: <span className="text-emerald-500 font-bold">Online</span></p>
        </div>
        
        <div className="flex items-center gap-4">
          <NotificationDropdown />
          <div className="bg-slate-900 px-6 py-4 rounded-3xl shadow-xl shadow-purple-200 text-white flex items-center gap-4 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/20 rounded-full blur-2xl group-hover:bg-purple-500/30 transition-all"></div>
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white relative z-10">
              <DollarSign size={20} />
            </div>
            <div className="relative z-10">
              <div className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">Total GMV Anda</div>
              <div className="text-2xl font-black text-white">
                Rp {myGmv.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="geometric-card p-6 flex flex-col group hover:border-primary/50"
          >
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{card.label}</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-800">{card.value}</span>
              <span className="text-xs font-bold text-emerald-500">+12%</span>
            </div>
            <div className="mt-4 h-1 w-full bg-slate-50 rounded-full overflow-hidden">
               <div className={cn("h-full transition-all duration-1000", card.color)} style={{ width: '65%' }}></div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 geometric-card overflow-hidden flex flex-col h-[400px]">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-primary rounded-full"></span>
              Aktivitas Data Terbaru
            </h3>
            <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-wider">
              Lihat Detail
            </button>
          </div>
          <div className="flex-1 p-6 space-y-4 overflow-auto">
            {[
              { name: 'Bpk. Junaedi', produk: 'Kerupuk Pisang', status: 'Proses Pengolahan NIB & Halal', time: '5m ago' },
              { name: 'Ibu Siti', produk: 'Peyek Kacang', status: 'Proses Pengolahan NIB & Halal', time: '25m ago' },
              { name: 'Bpk. Ahmad', produk: 'Kripik Singkong', status: 'Halal Terbit', time: '1h ago' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:bg-white hover:border-primary/20 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
                    {item.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-800">{item.name}</div>
                    <div className="text-[10px] font-medium text-slate-400 capitalize">{item.produk} • {item.time}</div>
                  </div>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider",
                  item.status === 'Halal Terbit' ? 'bg-emerald-100 text-emerald-600' : 
                  item.status === 'Proses Pengolahan NIB & Halal' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                )}>
                  {item.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="geometric-card p-6 border-none bg-primary text-white shadow-purple-glow">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <Sparkles size={20} />
              </div>
              <span className="font-bold tracking-tight">AI Insights</span>
            </div>
            <p className="text-xs text-purple-100 leading-relaxed mb-6 font-medium">
              Berdasarkan tren 7 hari terakhir, pengolahan NIB meningkat <span className="font-black text-white">22%</span>. Rekomendasi alokasi pendamping untuk wilayah Anda.
            </p>
            <button className="w-full py-3 bg-white text-primary rounded-xl text-xs font-black shadow-lg hover:scale-[1.02] transition-all uppercase tracking-wider">
              Generate AI Report
            </button>
          </div>

          <div className="geometric-card p-6">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Profil Pendamping</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-slate-50">
                <span className="text-slate-400 text-xs font-bold uppercase">Role Access</span>
                <span className="bg-purple-50 text-primary px-3 py-1 rounded-lg font-black text-[10px] uppercase">{user?.role}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400 text-xs font-bold uppercase">Wilayah</span>
                <span className="font-black text-slate-700 text-sm tracking-tight">{user?.kodeWilayah || 'PUSAT'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
