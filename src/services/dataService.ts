/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { DataPelakuUsaha, StatusProses, UserRole, User, Kbli, Wilayah } from "../types";
import { format } from "date-fns";

console.log("ENV:", import.meta.env);
console.log("API KEY:", import.meta.env.VITE_API_KEY);

// Centralized Store (Simulated for this demo)
let kblisStore: Kbli[] = [
  { id: '1', kode: '10710', judul: 'Industri Produk Roti dan Kue', deskripsi: 'Mencakup industri berbagai jenis roti, kue, biskuit, dan sejenisnya.' },
  { id: '2', kode: '56101', judul: 'Restoran', deskripsi: 'Usaha penyediaan makanan dan minuman untuk dikonsumsi di tempat.' },
  { id: '3', kode: '10794', judul: 'Industri Kerupuk, Keripik, Peyek dan Sejenisnya', deskripsi: 'Mencakup usaha industri berbagai jenis kerupuk, keripik, peyek dan sejenisnya, seperti kerupuk udang, kerupuk ikan, keripik tempe, keripik ubi, keripik pisang, keripik kentang dan paru goreng.' },
  { id: '4', kode: '47111', judul: 'Perdagangan Eceran Berbagai Macam Barang Yang Utamanya Makanan, Minuman Atau Tembakau Di Minimarket', deskripsi: 'Usaha perdagangan eceran berbagai macam barang kebutuhan sehari-hari yang utamanya makanan, minuman atau tembakau di minimarket.' },
];

let wilayahsStore: Wilayah[] = [
  { id: '1', kode: 'LEUWISARI', nama: 'Kecamatan Leuwisari' },
  { id: '2', kode: 'SINGAPARNA', nama: 'Kecamatan Singaparna' },
  { id: '3', kode: 'MANGUNREJA', nama: 'Kecamatan Mangunreja' },
  { id: '4', kode: 'SUKARAJA', nama: 'Kecamatan Sukaraja' },
];

// Initial Data List
let dataListStore: Partial<DataPelakuUsaha>[] = [
  { id: '1', namaPelakuUsaha: 'Bpk. Junaedi', nik: '3201012345678901', statusProses: 'Proses Pengolahan NIB & Halal', noHp: '08123456789', timestamp: '26-04-2026', namaProduk: 'Kerupuk Pisang', namaMerek: 'Juna Snack', kecamatan: 'Leuwisari', kbliId: '3', cleaningAgent: 'Sunlight', kemasan: 'Plastik PP', bahanBaku: 'Pisang, Tepung, Gula, Garam', prosesProduksi: '1. Kupas pisang, 2. Iris tipis, 3. Campur bumbu, 4. Goreng hingga matang.', emailTemp: 'junaedi.halal@gmail.com', passwordHash: 'HALAL123', nib: '9120001234567' },
  { id: '2', namaPelakuUsaha: 'Ibu Siti', nik: '3201019876543210', statusProses: 'Verifikasi BPJPH', noHp: '08571234567', timestamp: '25-04-2026', namaProduk: 'Peyek Kacang', namaMerek: 'Siti Peyek', kecamatan: 'Ciawi', kbliId: '3', cleaningAgent: 'Mama Lemon', kemasan: 'Plastik Mika', bahanBaku: 'Kacang Tanah, Tepung Beras, Santan', prosesProduksi: '1. Rebus santan, 2. Campur tepung, 3. Masukkan kacang, 4. Goreng per sendok.', emailTemp: 'siti.halal@gmail.com', passwordHash: 'PEYEK88', nib: '9120009876543' },
  { id: '3', namaPelakuUsaha: 'Bpk. Ahmad', nik: '3201011122334455', statusProses: 'terbit sertifikat halal', noHp: '08139988776', timestamp: '24-04-2026', namaProduk: 'Kripik Singkong', namaMerek: 'Ahmad Chips', kecamatan: 'Leuwisari', kbliId: '3', cleaningAgent: 'Sunlight', kemasan: 'Standing Pouch', bahanBaku: 'Singkong, Minyak Goreng, Penyedap', prosesProduksi: '1. Pilih singkong, 2. Iris, 3. Rendam bumbu, 4. Goreng garing.', emailTemp: 'ahmad.halal@gmail.com', passwordHash: 'SINGKONG1', nib: '9120005544332' },
];

export const dataService = {
  // Data Management
  getDataList: () => dataListStore,
  setDataList: (newList: Partial<DataPelakuUsaha>[]) => {
    dataListStore = newList;
  },
  
  // Stats Calculation
  getStats: () => {
    return {
      totalData: dataListStore.length,
      nibProses: dataListStore.filter(d => d.statusProses === 'Proses Pengolahan NIB & Halal').length,
      halalProses: dataListStore.filter(d => d.statusProses === 'Proses Pengolahan Halal' || d.statusProses === 'Proses pengajuan' || d.statusProses === 'Verifikasi BPJPH').length,
      halalTerbit: dataListStore.filter(d => d.statusProses === 'Halal Terbit' || d.statusProses === 'terbit sertifikat halal').length,
    };
  },
  // KBLI Management
  getKblis: () => kblisStore,
  addKbli: (kbli: Omit<Kbli, 'id'>) => {
    const newKbli = { ...kbli, id: Math.random().toString(36).substr(2, 9) };
    kblisStore = [...kblisStore, newKbli];
    return newKbli;
  },
  updateKbli: (id: string, kbli: Partial<Kbli>) => {
    kblisStore = kblisStore.map(k => k.id === id ? { ...k, ...kbli } : k);
  },
  deleteKbli: (id: string) => {
    kblisStore = kblisStore.filter(k => k.id !== id);
  },

  // Wilayah Management
  getWilayahs: () => wilayahsStore,
  addWilayah: (wilayah: Omit<Wilayah, 'id'>) => {
    const newWilayah = { ...wilayah, id: Math.random().toString(36).substr(2, 9) };
    wilayahsStore = [...wilayahsStore, newWilayah];
    return newWilayah;
  },
  updateWilayah: (id: string, wilayah: Partial<Wilayah>) => {
    wilayahsStore = wilayahsStore.map(w => w.id === id ? { ...w, ...wilayah } : w);
  },
  deleteWilayah: (id: string) => {
    wilayahsStore = wilayahsStore.filter(w => w.id !== id);
  },
  // Generate AI Production Process
  generateProsesProduksi: async (namaProduk: string, bahanBaku: string) => {
    const prompt = `Buatkan narasi langkah-langkah proses produksi yang profesional, singkat, dan memenuhi standar halal untuk produk "${namaProduk}" dengan bahan utama: ${bahanBaku}. Format dalam poin-poin langkah produksi.`;
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      
      return response.text;
    } catch (error) {
      console.error("AI Generation Error:", error);
      return "Gagal mengenerate proses produksi. Silakan isi manual.";
    }
  },

  // Auto Increment Document Number
  generateNoDokumen: (kodeWilayah: string, count: number) => {
    const now = new Date();
    const months = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    const romanMonth = months[now.getMonth()];
    const year = now.getFullYear();
    const sequence = String(count + 1).padStart(3, '0');
    return `${sequence}/SP.${kodeWilayah}/GN/${romanMonth}/${year}`;
  },

  // Calculate GMV
  calculateUserGmv: (user: User, dataList: DataPelakuUsaha[]) => {
    if (user.role === UserRole.DATLAP) {
      const count = dataList.filter(d => d.createdBy === user.id).length;
      return count * 15000;
    }
    if (user.role === UserRole.OLDAT) {
      const count = dataList.filter(d => 
        d.pendampingOlahDataId === user.id && 
        (d.statusProses === 'Proses Pengolahan NIB & Halal' || d.statusProses === 'Halal Terbit')
      ).length;
      return count * 35000;
    }
    return 0;
  },

  // Security: Check if field is editable by role
  isFieldLocked: (fieldName: string, userRole: UserRole) => {
    if (userRole === UserRole.ADMIN) return false;
    
    const lockedForOldat = ['nik', 'namaPelakuUsaha', 'tanggalLahir', 'fotoNikUrl', 'alamatUsh'];
    if (userRole === UserRole.OLDAT && lockedForOldat.includes(fieldName)) return true;
    
    return false;
  },

  // AI Generator KBLI
  generateKbliSuggestion: async (deskripsiUsaha: string) => {
    const prompt = `Berdasarkan deskripsi usaha berikut: "${deskripsiUsaha}", berikan 3 saran kode KBLI (5 digit) beserta judul KBLI yang paling relevan. Format: Kode - Judul.`;
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      
      return response.text;
    } catch (error) {
      console.error("AI KBLI Error:", error);
      return "Gagal mengenerate saran KBLI.";
    }
  },
};
