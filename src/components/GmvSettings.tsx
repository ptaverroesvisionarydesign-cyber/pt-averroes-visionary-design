import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Settings, Save, DollarSign, ShieldCheck, FileText, UserCheck, AlertCircle } from 'lucide-react';
import { dataService } from '../services/dataService';
import { useNotifications } from '../NotificationContext';
import { useAuth } from '../AuthContext';

export default function GmvSettings() {
  const { addNotification } = useNotifications();
  const { user } = useAuth();
  const initialSettings = dataService.getGmvSettings();
  
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      dataService.updateGmvSettings(settings);
      setIsSaving(false);
      setSuccess(true);
      
      addNotification({
        title: 'Pengaturan GMV Diperbarui',
        message: 'Nominal insentif GMV telah berhasil disimpan dan diterapkan.',
        timestamp: new Date().toISOString(),
        read: false,
        type: 'SYSTEM',
        userId: user?.id || 'system',
        targetRoles: ['SUPER_ADMIN', 'ADMIN']
      });

      setTimeout(() => setSuccess(false), 3000);
    }, 1000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-10">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <Settings size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Pengaturan GMV</h1>
            <p className="text-slate-500 font-medium text-sm tracking-tight">Konfigurasi nominal insentif per data Halal Terbit.</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Super Admin */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <ShieldCheck size={80} />
          </div>
          <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 mb-6 font-black uppercase text-[10px]">
            SA
          </div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Super Admin</h3>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</div>
            <input 
              type="number"
              value={settings.superAdmin}
              onChange={(e) => setSettings({ ...settings, superAdmin: parseInt(e.target.value) || 0 })}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-primary font-black text-lg"
            />
          </div>
          <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase leading-relaxed tracking-wider">Berlaku untuk akun dengan role Super Admin dan Admin.</p>
        </motion.div>

        {/* Oldat */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <FileText size={80} />
          </div>
          <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 mb-6 font-black uppercase text-[10px]">
            OD
          </div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Olah Data</h3>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</div>
            <input 
              type="number"
              value={settings.oldat}
              onChange={(e) => setSettings({ ...settings, oldat: parseInt(e.target.value) || 0 })}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-primary font-black text-lg"
            />
          </div>
          <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase leading-relaxed tracking-wider">Insentif untuk pendamping olah data per berkas terbit.</p>
        </motion.div>

        {/* Datlap */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <UserCheck size={80} />
          </div>
          <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 mb-6 font-black uppercase text-[10px]">
            DL
          </div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Data Lapangan</h3>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</div>
            <input 
              type="number"
              value={settings.datlap}
              onChange={(e) => setSettings({ ...settings, datlap: parseInt(e.target.value) || 0 })}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-primary font-black text-lg"
            />
          </div>
          <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase leading-relaxed tracking-wider">Insentif untuk pendamping lapangan yang mengumpulkan data.</p>
        </motion.div>
      </div>

      <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
          <AlertCircle size={20} />
        </div>
        <div>
          <h4 className="text-emerald-900 font-black text-xs uppercase tracking-widest mb-1">Penting</h4>
          <p className="text-emerald-700/80 text-xs font-medium leading-relaxed">
            Perubahan nominal GMV akan langsung berdampak pada perhitungan pendapatan di Dashboard dan halaman Manajemen Pembayaran untuk seluruh user sesuai rolenya. Perhitungan didasarkan pada data dengan status <span className="font-bold underline">"Halal Terbit"</span>.
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="px-10 py-5 bg-primary text-white rounded-[1.75rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : success ? (
            <div className="flex items-center gap-2">
              <Save size={16} />
              Tersimpan!
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Save size={16} />
              Simpan Pengaturan
            </div>
          )}
        </button>
      </div>
    </div>
  );
}
