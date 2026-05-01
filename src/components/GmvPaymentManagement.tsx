/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, 
  User as UserIcon, 
  DollarSign, 
  History, 
  Plus, 
  ArrowUpRight, 
  Clock,
  ChevronRight,
  TrendingUp,
  Briefcase,
  MapPin,
  X,
  CheckCircle2,
  Printer
} from 'lucide-react';
import { User, UserRole, DataPelakuUsaha } from '../types';
import { cn } from '../lib/utils';
import UserDetailModal from './UserDetailModal';
import { dataService } from '../services/dataService';
import { useAuth } from '../AuthContext';
import { useNotifications } from '../NotificationContext';

interface PaymentUser {
  id: string;
  name: string;
  role: string;
  totalGmv: number;
  dibayar: number;
  sisaHutang: number;
}

interface PaymentHistory {
  id: string;
  tanggal: string;
  namaUser: string;
  metode: string;
  jumlah: number;
}

export default function GmvPaymentManagement() {
  const { user: currentUser } = useAuth();
  const { addNotification } = useNotifications();
  const allUsers = dataService.getUsers();
  const dataList = dataService.getDataList() as DataPelakuUsaha[];
  
  // Map real users to PaymentUser format
  const initialUsers: PaymentUser[] = allUsers
    .filter(u => [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.DATLAP, UserRole.OLDAT].includes(u.role))
    .map(u => {
      const totalGmv = dataService.calculateUserGmv(u, dataList);
      let roleLabel = '';
      if (u.role === UserRole.SUPER_ADMIN) roleLabel = 'super admin';
      else if (u.role === UserRole.ADMIN) roleLabel = 'admin';
      else if (u.role === UserRole.DATLAP) roleLabel = 'lapangan';
      else if (u.role === UserRole.OLDAT) roleLabel = 'olahdata';

      return {
        id: u.id,
        name: u.name,
        role: roleLabel,
        totalGmv: totalGmv,
        dibayar: 0, // In a real app this would come from a payment store
        sisaHutang: totalGmv
      };
    });

  const [users, setUsers] = useState<PaymentUser[]>(initialUsers);
  const [history, setHistory] = useState<PaymentHistory[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<User | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Form State
  const [selectedUserId, setSelectedUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Transfer Bank');

  const handleOpenDetail = (pUser: PaymentUser) => {
    const realUser = allUsers.find(u => u.id === pUser.id);
    if (!realUser) return;
    
    setSelectedUserForDetail(realUser);
    setIsDetailModalOpen(true);
  };

  const handleSavePayment = () => {
    if (!selectedUserId || !amount) return;

    const user = users.find(u => u.id === selectedUserId);
    if (!user) return;

    const paymentAmount = parseInt(amount);
    
    // Update users
    setUsers(prev => prev.map(u => 
      u.id === selectedUserId 
        ? { ...u, dibayar: u.dibayar + paymentAmount, sisaHutang: Math.max(0, u.sisaHutang - paymentAmount) }
        : u
    ));

    // Add to history
    const newHistory: PaymentHistory = {
      id: Math.random().toString(36).substr(2, 9),
      tanggal: new Date().toLocaleDateString('id-ID'),
      namaUser: user.name,
      metode: method,
      jumlah: paymentAmount
    };
    setHistory(prev => [newHistory, ...prev]);

    addNotification({
      title: 'Pembayaran Berhasil',
      message: `Hutang ${user.name} sebesar Rp ${paymentAmount.toLocaleString('id-ID')} telah dibayar.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: 'PAYMENT',
      userId: currentUser?.id || 'system',
      targetRoles: [UserRole.SUPER_ADMIN, UserRole.ADMIN]
    });

    // Show success and close modal
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setShowModal(false);
      // Reset form
      setSelectedUserId('');
      setAmount('');
      setMethod('Transfer Bank');
    }, 2000);
  };

  const handlePrintSlip = (pUser: PaymentUser) => {
    const realUser = allUsers.find(u => u.id === pUser.id);
    if (!realUser) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const transactionId = Math.random().toString(36).substr(2, 10).toUpperCase();
    const printDate = new Date().toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>Slip GMV - ${pUser.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap');
            * { box-sizing: border-box; }
            @page {
              size: A6;
              margin: 0;
            }
            body { 
              font-family: 'Inter', -apple-system, sans-serif; 
              padding: 0; 
              margin: 0;
              color: #0f172a;
              background-color: #ffffff;
              -webkit-print-color-adjust: exact;
            }
            .page {
              width: 105mm;
              height: 148mm;
              padding: 8mm;
              margin: 0 auto;
              position: relative;
              background: white;
              overflow: hidden;
              display: flex;
              flex-direction: column;
            }
            .header { 
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 12px;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 8px;
            }
            .brand h1 { 
              margin: 0; 
              font-size: 16px; 
              font-weight: 900; 
              letter-spacing: -0.05em;
              color: #0f172a;
            }
            .brand p { 
              margin: 2px 0 0; 
              color: #64748b; 
              font-size: 7px; 
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            .invoice-title {
              text-align: right;
            }
            .invoice-title h2 { 
              margin: 0; 
              font-size: 10px; 
              font-weight: 900; 
              color: #6366f1;
              text-transform: uppercase;
              letter-spacing: 0.1em;
            }
            .invoice-title p { margin: 2px 0 0; color: #94a3b8; font-size: 7px; font-weight: 700; }
            
            .info-grid {
              display: grid;
              grid-template-cols: 1fr 1fr;
              gap: 15px;
              margin-bottom: 15px;
            }
            .info-section h3 {
              font-size: 6px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              color: #94a3b8;
              margin-bottom: 4px;
              border-bottom: 1px solid #f1f5f9;
              padding-bottom: 2px;
            }
            .info-content {
              font-size: 9px;
              font-weight: 700;
              color: #1e293b;
              line-height: 1.2;
            }
            .info-content span { font-weight: 400; color: #64748b; display: block; font-size: 7.5px; margin-top: 1px; }

            .table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
            }
            .table th {
              text-align: left;
              font-size: 6px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              color: #64748b;
              padding: 5px 8px;
              border-bottom: 1.5px solid #f1f5f9;
            }
            .table td {
              padding: 8px 8px;
              border-bottom: 1px solid #f1f5f9;
              font-size: 8.5px;
              font-weight: 700;
            }
            .table td .desc { font-weight: 400; color: #64748b; font-size: 7px; margin-top: 2px; }

            .totals {
              margin-left: auto;
              width: 100%;
              max-width: 180px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
              font-size: 8.5px;
            }
            .total-row.grand {
              border-top: 1.5px solid #0f172a;
              margin-top: 4px;
              padding-top: 8px;
              font-size: 11px;
              font-weight: 900;
            }
            .label { font-weight: 600; color: #64748b; }
            .amount { font-weight: 800; text-align: right; }

            .stamp-container {
              margin-top: 10px;
              position: relative;
              text-align: center;
            }
            .stamp {
              border: 2px solid #10b981;
              color: #10b981;
              display: inline-block;
              padding: 4px 12px;
              font-weight: 900;
              font-size: 10px;
              text-transform: uppercase;
              border-radius: 2px;
              transform: rotate(-8deg);
              opacity: 0.7;
            }
            
            .footer {
              margin-top: auto;
              text-align: center;
              font-size: 7px;
              color: #94a3b8;
              border-top: 1px solid #f1f5f9;
              padding-top: 8px;
              line-height: 1.4;
            }

            @media print {
              body { background: white; }
              .page { margin: 0; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <div class="brand">
                <img src="input_file_0.png" alt="SATDAPUS Logo" style="height: 32px; width: auto; object-fit: contain; margin-bottom: 2px;" />
              </div>
              <div class="invoice-title">
                <h2>SLIP GMV</h2>
                <p>#${transactionId}</p>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-section">
                <h3>PENERIMA</h3>
                <div class="info-content">
                  <div>${pUser.name}</div>
                  <span>ROLE: ${pUser.role.toUpperCase()}</span>
                </div>
              </div>
              <div class="info-section">
                <h3>TRANSAKSI</h3>
                <div class="info-content">
                  <div>${printDate}</div>
                  <span>WIL: ${realUser.kodeWilayah || 'PUSAT'}</span>
                </div>
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th style="width: 70%;">DESKRIPSI</th>
                  <th style="text-align: right;">JUMLAH</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    Akumulasi GMV
                    <div class="desc">Input data tervalidasi.</div>
                  </td>
                  <td style="text-align: right;">Rp ${pUser.totalGmv.toLocaleString('id-ID')}</td>
                </tr>
                <tr>
                  <td>
                    Potongan Pembayaran
                    <div class="desc">Telah dibayarkan sebelumnya.</div>
                  </td>
                  <td style="text-align: right; color: #10b981;">(Rp ${pUser.dibayar.toLocaleString('id-ID')})</td>
                </tr>
              </tbody>
            </table>

            <div class="totals">
              <div class="total-row">
                <span class="label">Subtotal</span>
                <span class="amount">Rp ${pUser.totalGmv.toLocaleString('id-ID')}</span>
              </div>
              <div class="total-row grand">
                <span class="label" style="color: #0f172a;">SISA</span>
                <span class="amount" style="color: #e11d48;">Rp ${pUser.sisaHutang.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div class="stamp-container">
              <div class="stamp">VERIFIED BY SYSTEM</div>
            </div>

            <div class="footer">
              Dokumen otomatis SATDAPUS.<br>
              Validitas data terverifikasi di server utama.
            </div>
          </div>
          <script>
            window.onload = function() { 
              window.print(); 
              setTimeout(function() { window.close(); }, 500); 
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="p-8 space-y-10 max-w-7xl mx-auto relative">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-3 bg-primary rounded-2xl text-white shadow-lg shadow-primary/20">
              <CreditCard size={28} />
            </div>
            Manajemen Pembayaran GMV
          </h1>
          <p className="text-slate-500 font-bold mt-1 ml-16">Monitor & Kelola Insentif Pendamping</p>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-2xl shadow-slate-900/10 hover:translate-y-[-2px] active:translate-y-[0px]"
        >
          <Plus size={20} />
          Catat Pembayaran
        </button>
      </header>

      {/* User GMV Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {users.map((item) => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative"
          >
            <div className="absolute inset-0 bg-white rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 hover:border-primary/20 transition-all h-full flex flex-col">
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center font-black text-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {item.name[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">{item.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      item.role === 'lapangan' ? 'bg-blue-100 text-blue-600' : 
                      item.role === 'olahdata' ? 'bg-purple-100 text-purple-600' :
                      'bg-orange-100 text-orange-600'
                    )}>
                      {item.role}
                    </div>
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="text-slate-200 group-hover:text-primary transition-colors" size={24} />
              </div>

              <div className="grid grid-cols-3 gap-4 mt-auto">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total GMV</p>
                  <p className="text-lg font-black text-slate-900">Rp {item.totalGmv.toLocaleString('id-ID')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dibayar</p>
                  <p className="text-lg font-black text-emerald-600">Rp {item.dibayar.toLocaleString('id-ID')}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sisa Hutang</p>
                  <p className="text-lg font-black text-rose-600 transition-colors">Rp {item.sisaHutang.toLocaleString('id-ID')}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-8">
                <button 
                  onClick={() => handleOpenDetail(item)}
                  className="w-full py-4 bg-slate-50 rounded-2xl text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-primary/5 hover:text-primary transition-all flex items-center justify-center gap-2"
                >
                  Lihat Detail Akun
                  <ChevronRight size={14} />
                </button>

                {(currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.ADMIN) && (
                  <button 
                    onClick={() => handlePrintSlip(item)}
                    className="w-full py-4 bg-transparent border-2 border-purple-200/50 rounded-2xl text-purple-600 font-black text-xs uppercase tracking-widest hover:bg-purple-50 hover:border-purple-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Printer size={14} />
                    Cetak Slip Pembayaran
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Payment History Table */}
      <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-4">
            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
              <History size={20} />
            </div>
            Riwayat Pembayaran Terbaru
          </h3>
          <button className="text-xs font-black text-primary uppercase tracking-widest hover:underline">Lihat Semua</button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama User</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Metode</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {history.length > 0 ? (
                history.map((h) => (
                  <tr key={h.id} className="border-t border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-8 py-5 text-sm font-bold text-slate-600">{h.tanggal}</td>
                    <td className="px-8 py-5 text-sm font-black text-slate-900 uppercase">{h.namaUser}</td>
                    <td className="px-8 py-5 text-center text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-50/50 m-2 rounded-xl">
                      {h.metode}
                    </td>
                    <td className="px-8 py-5 text-sm font-black text-emerald-600 text-right">
                      Rp {h.jumlah.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-40">
                      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-2">
                        <History size={40} />
                      </div>
                      <p className="text-sm font-bold text-slate-500 italic">Belum ada riwayat pembayaran.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Payment Input Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-10">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Input Pembayaran</h2>
                  <button 
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X size={24} className="text-slate-400" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Select User */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <UserIcon size={12} /> Pilih Penerima (User)
                    </label>
                    <select 
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary/10 transition-all cursor-pointer"
                    >
                      <option value="">-- Pilih User --</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <DollarSign size={12} /> Jumlah Bayar (Rp)
                    </label>
                    <input 
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Contoh: 150000"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 font-bold text-slate-700 outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                    />
                  </div>

                  {/* Method */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <CreditCard size={12} /> Metode
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['Transfer Bank', 'Tf Dana', 'Cash'].map((m) => (
                        <button
                          key={m}
                          onClick={() => setMethod(m)}
                          className={cn(
                            "py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border",
                            method === m 
                              ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" 
                              : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                          )}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit */}
                  <button 
                    onClick={handleSavePayment}
                    disabled={!selectedUserId || !amount || isSuccess}
                    className={cn(
                      "w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all mt-4 flex items-center justify-center gap-3",
                      isSuccess 
                        ? "bg-emerald-500 text-white" 
                        : "bg-primary text-white hover:bg-primary-dark shadow-xl shadow-primary/20 hover:scale-[1.02]"
                    )}
                  >
                    {isSuccess ? (
                      <>
                        <CheckCircle2 size={20} />
                        Berhasil Disimpan
                      </>
                    ) : (
                      <>
                        <Plus size={20} />
                        Simpan Pembayaran
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isDetailModalOpen && selectedUserForDetail && (
          <UserDetailModal 
            user={selectedUserForDetail} 
            onClose={() => setIsDetailModalOpen(false)}
            onUpdateUser={(updated) => {
              // In this view, we just update local state if needed
              setSelectedUserForDetail(updated);
            }}
            onDeleteUser={(id) => {
              setUsers(users.filter(u => u.id !== id));
              setIsDetailModalOpen(false);
            }}
            onEdit={() => {
              // Edit functionality can be added here if needed
              console.log('Edit from GMV Management triggered');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
