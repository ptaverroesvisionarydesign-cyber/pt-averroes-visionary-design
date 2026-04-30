/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Upload, 
  Trash2, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Crop as CropIcon,
  FileText,
  Loader2,
  X
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { useNotifications } from '../NotificationContext';
import { dataService } from '../services/dataService';
import { UserRole } from '../types';
import { cn } from '../lib/utils';

export default function InputData() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [currentUploadTarget, setCurrentUploadTarget] = useState<'nik' | 'product' | 'supervisor'>('product');
  const [tempPhotoUrl, setTempPhotoUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form State
  const [isLocked, setIsLocked] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    noHp: '',
    tanggalPengajuan: '',
    tanggalDatangPenyelia: '',
    namaPelakuUsaha: '',
    nik: '',
    alamatUsh: '',
    tanggalLahir: '',
    kecamatan: '',
    kodePos: '',
    namaMerek: '',
    namaProduk: '',
    bahanBaku: '',
    cleaningAgent: '',
    kemasan: '',
    prosesProduksi: '',
    fotoNik: '',
    fotoProduk: '',
    fotoSupervisor: '',
    kbliId: '',
  });

  useEffect(() => {
    if (location.state?.editItem) {
      const item = location.state.editItem;
      setEditingId(item.id);
      setFormData({
        noHp: item.noHp || '',
        tanggalPengajuan: item.tanggalPengajuan || '',
        tanggalDatangPenyelia: item.tanggalDatangPenyelia || '',
        namaPelakuUsaha: item.namaPelakuUsaha || '',
        nik: item.nik || '',
        alamatUsh: item.alamatUsh || '',
        tanggalLahir: item.tanggalLahir || '',
        kecamatan: item.kecamatan || '',
        kodePos: item.kodePos || '',
        namaMerek: item.namaMerek || '',
        namaProduk: item.namaProduk || '',
        bahanBaku: item.bahanBaku || '',
        cleaningAgent: item.cleaningAgent || '',
        kemasan: item.kemasan || '',
        prosesProduksi: item.prosesProduksi || '',
        fotoNik: item.fotoNikUrl || '',
        fotoProduk: item.fotoProdukUrls?.[0] || '',
        fotoSupervisor: item.fotoProdukUrls?.[1] || '',
        kbliId: item.kbliId || '',
      });
    }
  }, [location.state]);

  const kblis = dataService.getKblis();
  const wilayahs = dataService.getWilayahs();

  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [broadcast] = useState(() => new BroadcastChannel('halal_updates'));

  // AI Generate Logic
  const handleAiGenerate = async () => {
    if (!formData.namaProduk || !formData.bahanBaku) {
      alert('Isi Nama Produk dan Bahan Baku dulu ya!');
      return;
    }
    setLoading(true);
    const result = await dataService.generateProsesProduksi(formData.namaProduk, formData.bahanBaku);
    setFormData(prev => ({ ...prev, prosesProduksi: result }));
    setLoading(false);
    setIsLocked(true);
  };

  // Photo Logic
  const triggerCamera = (target: 'nik' | 'product' | 'supervisor') => {
    setCurrentUploadTarget(target);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setTempPhotoUrl(url);
    setIsEditingPhoto(true);
  };

  const saveEditedPhoto = () => {
    if (currentUploadTarget === 'nik') {
      setFormData(prev => ({ ...prev, fotoNik: tempPhotoUrl }));
    } else if (currentUploadTarget === 'product') {
      setFormData(prev => ({ ...prev, fotoProduk: tempPhotoUrl }));
    } else if (currentUploadTarget === 'supervisor') {
      setFormData(prev => ({ ...prev, fotoSupervisor: tempPhotoUrl }));
    }
    
    setIsEditingPhoto(false);
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    // Simulate submit
    setTimeout(() => {
      const dataToSave = {
        id: editingId || Math.random().toString(36).substr(2, 9),
        ...formData,
        statusProses: 'Proses pengajuan',
        timestamp: new Date().toLocaleDateString('id-ID'),
        createdBy: user?.id,
        fotoNikUrl: formData.fotoNik,
        fotoProdukUrls: [formData.fotoProduk, formData.fotoSupervisor].filter(Boolean)
      };

      // Ensure dataService is consistent
      const currentList = dataService.getDataList();
      let newList;
      if (editingId) {
        newList = currentList.map(item => item.id === editingId ? dataToSave : item);
      } else {
        newList = [...currentList, dataToSave];
      }
      dataService.setDataList(newList);

      // Broadcast the new data live
      broadcast.postMessage({ 
        type: editingId ? 'UPDATE_DATA' : 'ADD_DATA', 
        item: dataToSave 
      });

      // Add Notification
      if (!editingId) {
        addNotification({
          type: 'INPUT_DATA',
          title: '📥 Input data baru',
          message: `Nama PU: ${dataToSave.namaPelakuUsaha}\nWilayah: ${user?.kodeWilayah || dataToSave.kecamatan}\nDiinput oleh: ${user?.name}`,
          userId: user?.id || '',
          actorName: user?.name || '',
          puName: dataToSave.namaPelakuUsaha,
          wilayah: user?.kodeWilayah || dataToSave.kecamatan,
          targetRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DATLAP, UserRole.OLDAT],
          link: '/data'
        });
      }

      setIsSubmitting(false);
      setIsSaved(true);
      
      // Reset form
      setFormData({
        noHp: '',
        tanggalPengajuan: '',
        tanggalDatangPenyelia: '',
        namaPelakuUsaha: '',
        nik: '',
        alamatUsh: '',
        tanggalLahir: '',
        kecamatan: '',
        kodePos: '',
        namaMerek: '',
        namaProduk: '',
        bahanBaku: '',
        cleaningAgent: '',
        kemasan: '',
        prosesProduksi: '',
        fotoNik: '',
        fotoProduk: '',
        fotoSupervisor: '',
        kbliId: '',
      });
      setEditingId(null);

      setTimeout(() => {
        setIsSaved(false);
      }, 3000);
    }, 1500);
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto pb-24 sm:pb-32">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="geometric-card overflow-hidden"
      >
        <div className="bg-primary p-6 sm:p-10 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-black tracking-tighter uppercase leading-tight">
              {isLocked ? 'Review Validasi Data' : 'Panel Penginputan Data'}
            </h1>
            <p className="text-[10px] opacity-80 font-black uppercase tracking-widest mt-2 bg-white/10 px-3 py-1 rounded-full inline-block">
              {isLocked ? 'Ringkasan Final' : `Tahap ${step} dari 3 • Selesai 33%`}
            </p>
          </div>
          <div className="h-14 w-14 bg-white/20 rounded-[1.5rem] flex items-center justify-center backdrop-blur-md relative z-10 self-center sm:self-auto shadow-xl">
             <FileText size={24} />
          </div>
        </div>          
        <div className="p-6 sm:p-10 md:p-12 space-y-12 text-slate-700">
            <div className="flex justify-center sm:justify-end -mb-8">
              <button 
                onClick={() => setIsLocked(!isLocked)}
                className={cn(
                  "w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-[1.5rem] font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] transition-all shadow-xl active:scale-95",
                  isLocked 
                    ? "bg-amber-100 text-amber-600 hover:bg-amber-200 shadow-amber-200/20"
                    : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-500/30"
                )}
              >
                {isLocked ? (
                  <>Buka Kunci Data <RotateCw size={14} /></>
                ) : (
                  <>Verifikasi & Kunci <CheckCircle2 size={14} /></>
                )}
              </button>
            </div>

          {/* Section 1: Pelaku Usaha */}
          <section className="space-y-8">
            <div className="flex items-center gap-3 text-primary mb-4">
              <span className="w-1.5 h-6 bg-primary rounded-full"></span>
              <h2 className="font-black tracking-tight text-sm uppercase">
                {isLocked ? 'RINGKASAN IDENTITAS PELAKU USAHA' : 'Identitas Pelaku Usaha'}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap *</label>
                <input 
                  type="text" 
                  disabled={isLocked}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-bold text-slate-700 disabled:opacity-60 disabled:bg-slate-100/50"
                  placeholder="Bpk. Junaedi"
                  value={formData.namaPelakuUsaha}
                  onChange={e => setFormData({...formData, namaPelakuUsaha: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NIK (16 Digit) *</label>
                <input 
                  type="text" 
                  maxLength={16}
                  disabled={isLocked}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-bold text-slate-700 disabled:opacity-60 disabled:bg-slate-100/50"
                  placeholder="320101XXXXXXXXXX"
                  value={formData.nik}
                  onChange={e => {
                    const value = e.target.value.replace(/\D/g, '');
                    setFormData({...formData, nik: value});
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor HP (WhatsApp) *</label>
                <input 
                  type="text" 
                  disabled={isLocked}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-bold text-slate-700 disabled:opacity-60 disabled:bg-slate-100/50"
                  placeholder="0812XXXXXXXX"
                  value={formData.noHp}
                  onChange={e => setFormData({...formData, noHp: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Lahir *</label>
                <input 
                  type="date" 
                  disabled={isLocked}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-bold text-slate-700 disabled:opacity-60 disabled:bg-slate-100/50"
                  value={formData.tanggalLahir}
                  onChange={e => setFormData({...formData, tanggalLahir: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kecamatan *</label>
                <input 
                  type="text" 
                  disabled={isLocked}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-bold text-slate-700 disabled:opacity-60 disabled:bg-slate-100/50"
                  placeholder="Kecamatan..."
                  value={formData.kecamatan}
                  onChange={e => setFormData({...formData, kecamatan: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Kategori KBLI (Wajib) *</label>
                <select 
                  disabled={isLocked}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold text-slate-700 disabled:opacity-60"
                  value={formData.kbliId}
                  onChange={e => setFormData({...formData, kbliId: e.target.value})}
                >
                  <option value="">Pilih KBLI...</option>
                  {kblis.map(k => (
                    <option key={k.id} value={k.id}>{k.kode} - {k.judul}</option>
                  ))}
                </select>
                {formData.kbliId && (
                  <p className="text-[10px] text-slate-400 font-medium px-1 leading-tight">
                    {kblis.find(k => k.id === formData.kbliId)?.deskripsi}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Pengajuan *</label>
                <input 
                  type="date" 
                  disabled={isLocked}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-bold text-slate-700 disabled:opacity-60 disabled:bg-slate-100/50"
                  value={formData.tanggalPengajuan}
                  onChange={e => setFormData({...formData, tanggalPengajuan: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Datang Penyelia *</label>
                <input 
                  type="date" 
                  disabled={isLocked}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-bold text-slate-700 disabled:opacity-60 disabled:bg-slate-100/50"
                  value={formData.tanggalDatangPenyelia}
                  onChange={e => setFormData({...formData, tanggalDatangPenyelia: e.target.value})}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Alamat Lengkap Usaha *</label>
                <textarea 
                  disabled={isLocked}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-bold text-slate-700 h-20 resize-none disabled:opacity-60 disabled:bg-slate-100/50"
                  placeholder="Jl. Raya No. 123, Desa..."
                  value={formData.alamatUsh}
                  onChange={e => setFormData({...formData, alamatUsh: e.target.value})}
                />
              </div>
            </div>
          </section>

          {/* Section 2: Produk */}
          <section className="space-y-6 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3 text-primary mb-2">
              <div className="h-2 w-8 bg-primary rounded-full" />
              <h2 className="font-black tracking-tight text-lg uppercase">
                {isLocked ? 'RINGKASAN DATA PRODUK' : 'Data Produk'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kode Pos *</label>
                <input 
                  type="text" 
                  maxLength={5}
                  disabled={isLocked}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all font-bold text-slate-700 disabled:opacity-60 disabled:bg-slate-100/50"
                  placeholder="12345"
                  value={formData.kodePos}
                  onChange={e => {
                    const value = e.target.value.replace(/\D/g, '');
                    setFormData({...formData, kodePos: value});
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Nama Merek / Pabrik *</label>
                <input 
                  type="text" 
                  disabled={isLocked}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium disabled:opacity-60"
                  placeholder="Zeny Kerupuk"
                  value={formData.namaMerek}
                  onChange={e => setFormData({...formData, namaMerek: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Nama Produk *</label>
                <input 
                  type="text" 
                  disabled={isLocked}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium disabled:opacity-60"
                  placeholder="Kerupuk Pisang Manis"
                  value={formData.namaProduk}
                  onChange={e => setFormData({...formData, namaProduk: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Cleaning Agent (Alat Cuci) *</label>
                <input 
                  type="text" 
                  disabled={isLocked}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium disabled:opacity-60"
                  placeholder="Contoh: Sunlight, Mama Lemon"
                  value={formData.cleaningAgent}
                  onChange={e => setFormData({...formData, cleaningAgent: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Jenis Kemasan *</label>
                <input 
                  type="text" 
                  disabled={isLocked}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium disabled:opacity-60"
                  placeholder="Contoh: Plastik, Styrofoam, Botol Kaca"
                  value={formData.kemasan}
                  onChange={e => setFormData({...formData, kemasan: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600">Bahan Baku Utama (Pisah Koma) *</label>
              <textarea 
                disabled={isLocked}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium h-24 resize-none disabled:opacity-60"
                placeholder="Pisang, Minyak Goreng, Gula Pasir, Garam"
                value={formData.bahanBaku}
                onChange={e => setFormData({...formData, bahanBaku: e.target.value})}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-600">Proses Produksi (Otomatis AI) *</label>
                <button 
                  onClick={handleAiGenerate}
                  disabled={loading || isLocked}
                  className="flex items-center gap-2 text-xs font-black bg-primary text-white px-4 py-2 rounded-xl shadow-lg hover:shadow-primary/40 active:scale-95 disabled:opacity-50 transition-all font-sans"
                >
                  {loading ? <Loader2 className="animate-spin h-3 w-3" /> : <Sparkles size={14} />}
                  GENERATE AI
                </button>
              </div>
              <textarea 
                disabled={isLocked}
                className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium h-48 text-slate-500 disabled:opacity-80"
                placeholder="Hasil generate AI akan muncul di sini..."
                value={formData.prosesProduksi}
                onChange={e => setFormData({...formData, prosesProduksi: e.target.value})}
              />
            </div>
          </section>

          {/* Section 3: Dokumentasi Foto */}
          <section className="space-y-6 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3 text-primary mb-2">
              <div className="h-2 w-8 bg-primary rounded-full" />
              <h2 className="font-black tracking-tight text-lg uppercase">
                {isLocked ? 'DOKUMENTASI FOTO HASIL INPUT' : 'Dokumentasi Foto'}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: KTP */}
              <div className="space-y-4">
                <div 
                  onClick={() => !isLocked && triggerCamera('nik')}
                  className={cn(
                    "w-full aspect-[4/3] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all relative overflow-hidden group",
                    formData.fotoNik ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50",
                    isLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-primary/40 hover:bg-primary/5"
                  )}
                >
                  {formData.fotoNik ? (
                    <>
                      <img src={formData.fotoNik} alt="KTP" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera size={24} className="text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Camera size={24} />
                      <span className="text-[10px] font-black uppercase text-center">Upload KTP<br/>Pelaku Usaha</span>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => !isLocked && triggerCamera('nik')}
                  disabled={isLocked}
                  className="w-full py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-primary hover:bg-primary hover:text-white transition-all shadow-sm uppercase disabled:opacity-50"
                >
                  Ganti Foto
                </button>
              </div>

              {/* Card 2: Produk */}
              <div className="space-y-4">
                <div 
                  onClick={() => !isLocked && triggerCamera('product')}
                  className={cn(
                    "w-full aspect-[4/3] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all relative overflow-hidden group",
                    formData.fotoProduk ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50",
                    isLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-primary/40 hover:bg-primary/5"
                  )}
                >
                  {formData.fotoProduk ? (
                    <>
                      <img src={formData.fotoProduk} alt="Produk" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera size={24} className="text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Camera size={24} />
                      <span className="text-[10px] font-black uppercase">Upload Foto Produk</span>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => !isLocked && triggerCamera('product')}
                  disabled={isLocked}
                  className="w-full py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-primary hover:bg-primary hover:text-white transition-all shadow-sm uppercase disabled:opacity-50"
                >
                  Ganti Foto
                </button>
              </div>

              {/* Card 3: Supervisor */}
              <div className="space-y-4">
                <div 
                  onClick={() => !isLocked && triggerCamera('supervisor')}
                  className={cn(
                    "w-full aspect-[4/3] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center transition-all relative overflow-hidden group",
                    formData.fotoSupervisor ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50",
                    isLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-primary/40 hover:bg-primary/5"
                  )}
                >
                  {formData.fotoSupervisor ? (
                    <>
                      <img src={formData.fotoSupervisor} alt="Supervisor" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Camera size={24} className="text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-400 text-center px-4">
                      <Camera size={24} />
                      <span className="text-[10px] font-black uppercase leading-tight">Foto Produk dengan<br/>Penyelia</span>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => !isLocked && triggerCamera('supervisor')}
                  disabled={isLocked}
                  className="w-full py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-primary hover:bg-primary hover:text-white transition-all shadow-sm uppercase disabled:opacity-50"
                >
                  Ganti Foto
                </button>
              </div>
            </div>
          </section>

          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || !isLocked}
            className={cn(
              "w-full py-5 rounded-[2rem] text-white font-black text-lg shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-10 disabled:grayscale disabled:opacity-70",
              isLocked 
                ? "bg-primary shadow-primary/30 hover:bg-primary-dark" 
                : "bg-slate-400 shadow-slate-200 cursor-not-allowed"
            )}
          >
            {isSubmitting ? (
              <>MENGIRIM DATA... <Loader2 className="animate-spin" /></>
            ) : (
              <>
                {isLocked ? "SIMPAN & SELESAIKAN DATA" : "KUNCI DATA DULU SEBELUM SIMPAN"}
                <CheckCircle2 />
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Photo Editor Simulation Modal */}
      <AnimatePresence>
        {isEditingPhoto && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
          >
            <motion.div className="w-full max-w-lg space-y-6">
              <div className="flex items-center justify-between text-white px-2">
                <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                  <CropIcon /> PHOTO EDITOR
                </h3>
                <button onClick={() => setIsEditingPhoto(false)} className="bg-white/10 p-2 rounded-xl">
                  <AlertCircle />
                </button>
              </div>

              <div className="aspect-square bg-slate-800 rounded-[2rem] overflow-hidden flex items-center justify-center relative border-4 border-white/20">
                <img 
                  src={tempPhotoUrl} 
                  className="w-3/4 h-3/4 object-contain transition-transform"
                />
                <div className="absolute inset-0 border-2 border-white/40 m-8 rounded-lg pointer-events-none" />
              </div>

              <div className="flex items-center justify-center gap-6 p-6 bg-white/10 rounded-[2rem] backdrop-blur-md">
                <button className="flex flex-col items-center gap-2 text-white/60 hover:text-white transition-all">
                  <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center">
                    <RotateCw />
                  </div>
                  <span className="text-[10px] font-black uppercase">Rotate</span>
                </button>
                <button className="flex flex-col items-center gap-2 text-white/60 hover:text-white transition-all">
                  <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center">
                    <CropIcon />
                  </div>
                  <span className="text-[10px] font-black uppercase">1:1 Crop</span>
                </button>
              </div>

              <button 
                onClick={saveEditedPhoto}
                className="w-full py-5 rounded-[2rem] bg-emerald-500 text-white font-black text-lg shadow-xl shadow-emerald-500/20 active:scale-95 transition-all"
              >
                SIMPAN & UPLOAD KE DRIVE
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed bottom-32 right-6">
        <button onClick={() => triggerCamera('product')} className="h-16 w-16 rounded-full bg-primary text-white shadow-2xl flex items-center justify-center animate-bounce">
          <Upload />
        </button>
      </div>

      {/* Hidden File Input for Camera */}
      <input 
        type="file" 
        ref={fileInputRef} 
        disabled={isLocked}
        className="hidden" 
        accept="image/*" 
        capture="environment"
        onChange={handleFileChange}
      />

      {/* SUCCESS NOTIFICATION */}
      <AnimatePresence>
        {isSaved && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.95, x: '-50%' }}
            className="fixed bottom-10 left-1/2 z-[200] bg-emerald-500 text-white px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-5 border-4 border-white/20 whitespace-nowrap"
          >
            <div className="bg-white text-emerald-500 p-2 rounded-2xl">
              <CheckCircle2 size={28} />
            </div>
            <div>
              <div className="font-black text-sm uppercase tracking-widest leading-none mb-1">Data Tersimpan!</div>
              <div className="text-[10px] font-black uppercase opacity-80">Terima kasih, data pelaku usaha telah masuk antrean sistem.</div>
            </div>
            <button onClick={() => setIsSaved(false)} className="ml-4 bg-white/20 p-2 rounded-xl hover:rotate-90 transition-transform">
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
