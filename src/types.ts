/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  DATLAP = 'DATLAP', // Pendamping Data Lapangan
  OLDAT = 'OLDAT',   // Pendamping Olah Data
}

export interface Kbli {
  id: string;
  kode: string;
  judul: string;
  deskripsi: string;
}

export interface Wilayah {
  id: string;
  kode: string; // e.g., LEUWISARI
  nama: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  noHp?: string;
  role: UserRole;
  kodeWilayah?: string;
  status: 'Aktif' | 'Nonaktif' | 'Suspend';
  joinDate: string;
  lastLogin: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  type: string;
  description: string;
  timestamp: string;
  device?: string;
  ip?: string;
}

export type StatusProses = string;

export interface DataPelakuUsaha {
  id: string;
  timestamp: string;
  noHp: string;
  namaPelakuUsaha: string;
  nik: string;
  tanggalLahir: string;
  tanggalPengajuan?: string;
  tanggalDatangPenyelia?: string;
  fotoNikUrl: string;
  alamatUsh: string;
  kecamatan: string;
  kodePos: string;
  
  // Data Produk
  namaMerek: string;
  namaProduk: string;
  bahanBaku: string;
  cleaningAgent: string;
  kemasan: string;
  fotoProdukUrls: string[];
  
  // Data Usaha Lanjutan
  kbliId?: string;
  kbli: string;
  nib: string;
  prosesProduksi: string; // AI Generated
  emailTemp: string;
  passwordHash: string;
  statusProses: StatusProses;
  noDokumen: string;
  noSkPenyelia?: string;
  
  // Pendamping
  pendampingLapanganId: string;
  pendampingOlahDataId: string;
  
  createdBy: string;
  updatedAt: string;
}

export interface GmvData {
  userId: string;
  role: UserRole;
  jumlahInput: number;
  jumlahNib: number;
  jumlahHalal: number;
  totalGmv: number;
}

export type NotificationType = 'INPUT_DATA' | 'PROSES_DATA' | 'SYSTEM';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  userId: string;
  actorName: string;
  puName?: string;
  wilayah?: string;
  timestamp: string;
  read: boolean;
  targetRoles: UserRole[];
  link?: string;
}

export interface Pembayaran {
  id: string;
  timestamp: string;
  userId: string;
  role: UserRole;
  totalGmv: number;
  jumlahDibayar: number;
  sisa: number;
  status: 'Belum Dibayar' | 'Sebagian' | 'Lunas';
  metode: 'Cash' | 'Transfer' | 'E-Wallet';
  keterangan: string;
}
