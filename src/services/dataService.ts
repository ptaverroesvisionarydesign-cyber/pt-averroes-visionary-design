/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";
import { DataPelakuUsaha, StatusProses, UserRole, User, Kbli, Wilayah, ProcessLog } from "../types";
import { format } from "date-fns";
import { db } from "../firebase";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where,
  getDoc,
  setDoc,
  onSnapshot
} from "firebase/firestore";

console.log("ENV:", import.meta.env);
console.log("API KEY:", import.meta.env.VITE_API_KEY);
const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_API_KEY
});

// Centralized Store (Simulated for this demo)
let gmvSettingsStore = {
  superAdmin: 142500,
  oldat: 35000,
  datlap: 15000
};

let notificationsStore: any[] = [
  { id: '1', title: 'Update Sistem v2.1', message: 'Fitur manajemen user super admin telah diaktifkan.', time: '2 menit yang lalu', isRead: false, type: 'system' },
  { id: '2', title: 'Data Baru Masuk', message: 'Bpk. Junaedi telah mendaftarkan produk baru.', time: '1 jam yang lalu', isRead: true, type: 'data' },
  { id: '3', title: 'Tagihan GMV', message: 'Sisa hutang Budi (DATLAP) menunggu pembayaran.', time: '3 jam yang lalu', isRead: false, type: 'payment' },
];

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

let usersStore: User[] = [
  { id: '1', email: 'superadmin@halal.id', name: 'Super Admin', noHp: '081111111111', password: 'avd2711', role: UserRole.SUPER_ADMIN, status: 'Aktif', joinDate: '2025-01-01', lastLogin: '2026-04-28 10:00' },
  { id: '2', email: 'admin.utama@halal.id', name: 'Admin Utama', noHp: '081222222222', password: 'admin', role: UserRole.ADMIN, status: 'Aktif', joinDate: '2025-02-15', lastLogin: '2026-04-29 08:30' },
  { id: '3', email: 'badudatlap@halal.id', name: 'Badu Datlap', noHp: '081333333333', password: 'useruserdatlap001', role: UserRole.DATLAP, kodeWilayah: 'LEUWISARI', status: 'Aktif', joinDate: '2025-03-20', lastLogin: '2026-04-28 16:45' },
  { id: '4', email: 'sitioldat@halal.id', name: 'Siti Oldat', noHp: '081444444444', password: 'useruseroldat001', role: UserRole.OLDAT, kodeWilayah: 'SINGAPARNA', status: 'Aktif', joinDate: '2025-04-10', lastLogin: '2026-04-29 09:15' },
  { id: '5', email: 'budidatlap@halal.id', name: 'Budi Datlap', noHp: '081555555555', password: 'useruserdatlap001', role: UserRole.DATLAP, kodeWilayah: 'MANONJAYA', status: 'Aktif', joinDate: '2025-05-05', lastLogin: '2026-04-30 07:00' },
];

// Initialize real-time sync for users if possible, or just load them
const initUsers = async () => {
  try {
    const q = query(collection(db, "users"));
    const querySnapshot = await getDocs(q);
    const dbUsers: User[] = [];
    querySnapshot.forEach((doc) => {
      dbUsers.push({ id: doc.id, ...doc.data() } as User);
    });
    
    // Always ensure Super Admin specifically exists with the right credentials in DB
    const saEmail = 'superadmin@halal.id'.toLowerCase();
    const saInDb = dbUsers.find(u => u.email.toLowerCase() === saEmail);
    
    if (!saInDb) {
      // Add Super Admin if missing
      const saDefault = {
        email: saEmail,
        name: 'Super Admin',
        password: 'avd2711',
        role: UserRole.SUPER_ADMIN,
        status: 'Aktif',
        joinDate: '2025-01-01',
        lastLogin: '-',
        noHp: '081234567890',
        kodeWilayah: 'Pusat'
      };
      await setDoc(doc(db, "users", "1"), saDefault);
      dbUsers.push({ id: "1", ...saDefault } as User);
    } else if (saInDb.password !== 'avd2711') {
      // Update password if it doesn't match the new requirement
      await updateDoc(doc(db, "users", saInDb.id), { password: 'avd2711' });
      const found = dbUsers.find(u => u.id === saInDb.id);
      if (found) found.password = 'avd2711';
    }

    // Seed other default users if collection only contains our newly added/fixed Super Admin
    if (dbUsers.length <= 1) {
      const defaultData = [
        { name: 'Admin Operasional', email: 'admin@halal.id', password: 'admin', role: UserRole.ADMIN, status: 'Aktif', noHp: '081122334455', kodeWilayah: 'Provinsi', joinDate: '2025-01-10', lastLogin: '-' },
        { name: 'Ahmad Datlap', email: 'datlap@halal.id', password: 'datlap', role: UserRole.DATLAP, status: 'Aktif', noHp: '082233445566', kodeWilayah: 'Kabupaten A', joinDate: '2025-02-15', lastLogin: '-' },
        { name: 'Siti Oldat', email: 'oldat@halal.id', password: 'oldat', role: UserRole.OLDAT, status: 'Aktif', noHp: '083344556677', kodeWilayah: 'Pusat', joinDate: '2025-03-20', lastLogin: '-' }
      ];

      for (const u of defaultData) {
        if (!dbUsers.find(du => du.email.toLowerCase() === u.email.toLowerCase())) {
          const docRef = await addDoc(collection(db, "users"), u);
          dbUsers.push({ id: docRef.id, ...u } as User);
        }
      }
    }
    
    usersStore = dbUsers;
    console.log("Users Store initialized from Firestore");
  } catch (err) {
    console.error("Error initializing users from Firestore:", err);
  }
};

// Start initialization
initUsers();

// Initial Data List
let dataListStore: Partial<DataPelakuUsaha>[] = [
  { 
    id: '1', 
    createdBy: '3', 
    createdByName: 'Badu Datlap', 
    createdRole: UserRole.DATLAP,
    pendampingOlahDataId: '4', 
    processedByOldat: '4',
    processedByName: 'Siti Oldat',
    processedAt: '28-04-2026',
    namaPelakuUsaha: 'Bpk. Junaedi', 
    nik: '3201012345678901', 
    statusProses: 'Proses Pengolahan NIB & Halal', 
    noHp: '08123456789', 
    timestamp: '26-04-2026', 
    namaProduk: 'Kerupuk Pisang', 
    namaMerek: 'Juna Snack', 
    kecamatan: 'Leuwisari', 
    kbliId: '3', 
    cleaningAgent: 'Sunlight', 
    kemasan: 'Plastik PP', 
    bahanBaku: 'Pisang, Tepung, Gula, Garam', 
    prosesProduksi: '1. Kupas pisang, 2. Iris tipis, 3. Campur bumbu, 4. Goreng hingga matang.', 
    emailTemp: 'junaedi.halal@gmail.com', 
    passwordHash: 'HALAL123', 
    nib: '9120001234567',
    status_pengolahan: 'Sudah Diambil',
    diambil_oleh_id: '4',
    diambil_oleh_name: 'Siti Oldat',
    waktu_diambil: '28-04-2026 09:00',
    processHistory: [
      { user: '3', userName: 'Badu Datlap', role: UserRole.DATLAP, action: 'input', time: '26-04-2026 10:00' },
      { user: '4', userName: 'Siti Oldat', role: UserRole.OLDAT, action: 'edit', time: '28-04-2026 09:00' }
    ]
  },
  { 
    id: '2', 
    createdBy: '3', 
    createdByName: 'Badu Datlap', 
    createdRole: UserRole.DATLAP,
    pendampingOlahDataId: '4', 
    processedByOldat: '4',
    processedByName: 'Siti Oldat',
    processedAt: '29-04-2026',
    namaPelakuUsaha: 'Ibu Siti', 
    nik: '3201019876543210', 
    statusProses: 'Verifikasi BPJPH', 
    noHp: '08571234567', 
    timestamp: '25-04-2026', 
    namaProduk: 'Peyek Kacang', 
    namaMerek: 'Siti Peyek', 
    kecamatan: 'Ciawi', 
    kbliId: '3', 
    cleaningAgent: 'Mama Lemon', 
    kemasan: 'Plastik Mika', 
    bahanBaku: 'Kacang Tanah, Tepung Beras, Santan', 
    prosesProduksi: '1. Rebus santan, 2. Campur tepung, 3. Masukkan kacang, 4. Goreng per sendok.', 
    emailTemp: 'siti.halal@gmail.com', 
    passwordHash: 'PEYEK88', 
    nib: '9120009876543',
    status_pengolahan: 'Sudah Diambil',
    diambil_oleh_id: '4',
    diambil_oleh_name: 'Siti Oldat',
    waktu_diambil: '29-04-2026 11:00',
    processHistory: [
      { user: '3', userName: 'Badu Datlap', role: UserRole.DATLAP, action: 'input', time: '25-04-2026 14:00' },
      { user: '4', userName: 'Siti Oldat', role: UserRole.OLDAT, action: 'verifikasi', time: '29-04-2026 11:00' }
    ]
  },
  { 
    id: '3', 
    createdBy: '5', 
    createdByName: 'Budi Datlap', 
    createdRole: UserRole.DATLAP,
    namaPelakuUsaha: 'Bpk. Ahmad', 
    nik: '3201011122334455', 
    statusProses: 'terbit sertifikat halal', 
    noHp: '08139988776', 
    timestamp: '24-04-2026', 
    namaProduk: 'Kripik Singkong', 
    namaMerek: 'Ahmad Chips', 
    kecamatan: 'Leuwisari', 
    kbliId: '3', 
    cleaningAgent: 'Sunlight', 
    kemasan: 'Standing Pouch', 
    bahanBaku: 'Singkong, Minyak Goreng, Penyedap', 
    prosesProduksi: '1. Pilih singkong, 2. Iris, 3. Rendam bumbu, 4. Goreng garing.', 
    emailTemp: 'ahmad.halal@gmail.com', 
    passwordHash: 'SINGKONG1', 
    nib: '9120005544332',
    status_pengolahan: 'Belum Diambil',
    processHistory: [
      { user: '5', userName: 'Budi Datlap', role: UserRole.DATLAP, action: 'input', time: '24-04-2026 09:30' }
    ]
  },
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

  // User Management
  getUsers: () => usersStore,
  getUserByEmail: async (email: string) => {
    try {
      const q = query(collection(db, "users"), where("email", "==", email.toLowerCase()));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const d = querySnapshot.docs[0];
        return { id: d.id, ...d.data() } as User;
      }
      return null;
    } catch (err) {
      console.error("Error getting user by email:", err);
      return null;
    }
  },
  addUser: async (user: Omit<User, 'id' | 'joinDate' | 'lastLogin'>) => {
    try {
      const userData = { 
        ...user, 
        email: user.email.toLowerCase(),
        joinDate: new Date().toISOString().split('T')[0],
        lastLogin: '-'
      };
      const docRef = await addDoc(collection(db, "users"), userData);
      const newUser = { id: docRef.id, ...userData } as User;
      usersStore = [...usersStore, newUser];
      return newUser;
    } catch (err) {
      console.error("Error adding user:", err);
      throw err;
    }
  },
  updateUser: async (id: string, user: Partial<User>) => {
    try {
      const { id: _, ...userData } = user;
      // Filter out empty password if provided and lowercase email
      const finalUpdate: any = { ...userData };
      if (finalUpdate.email) {
        finalUpdate.email = finalUpdate.email.toLowerCase();
      }
      if (finalUpdate.password === "") {
        delete finalUpdate.password;
      }
      
      const userRef = doc(db, "users", id);
      await updateDoc(userRef, finalUpdate);
      
      usersStore = usersStore.map(u => u.id === id ? { ...u, ...finalUpdate } : u);
    } catch (err) {
      console.error("Error updating user:", err);
      throw err;
    }
  },
  deleteUser: async (id: string) => {
    try {
      const userRef = doc(db, "users", id);
      await deleteDoc(userRef);
      usersStore = usersStore.filter(u => u.id !== id);
    } catch (err) {
      console.error("Error deleting user:", err);
      throw err;
    }
  },

  // Data List Management
  deleteData: (id: string) => {
    dataListStore = dataListStore.filter(d => d.id !== id);
  },

  // Notification Management
  getNotifications: () => notificationsStore,
  
  // Tracking & Metadata
  updateDataMetadata: (data: DataPelakuUsaha, user: any, action: string) => {
    const now = format(new Date(), 'dd-MM-yyyy HH:mm');
    const updatedData: Partial<DataPelakuUsaha> = {
      updatedAt: now,
    };

    if (user.role === UserRole.OLDAT) {
      updatedData.processedByOldat = user.id;
      updatedData.processedByName = user.name;
      updatedData.processedAt = now;
      updatedData.pendampingOlahDataId = user.id;
      // If OLDAT is editing, we assume they took it or it becomes taken
      updatedData.status_pengolahan = 'Sudah Diambil';
      updatedData.diambil_oleh_id = user.id;
      updatedData.diambil_oleh_name = user.name;
    }

    const newLog: ProcessLog = {
      user: user.id,
      userName: user.name,
      role: user.role,
      action: action,
      time: now
    };

    updatedData.processHistory = [...(data.processHistory || []), newLog];

    return { ...data, ...updatedData };
  },

  takeData: (id: string, user: User) => {
    const now = format(new Date(), 'dd-MM-yyyy HH:mm');
    dataListStore = dataListStore.map(d => {
      if (d.id !== id) return d;
      
      const history = [...(d.processHistory || [])];
      history.push({
        user: user.id,
        userName: user.name,
        role: user.role,
        action: 'Ambil Data',
        time: now
      });

      return {
        ...d,
        status_pengolahan: 'Sudah Diambil',
        diambil_oleh_id: user.id,
        diambil_oleh_name: user.name,
        waktu_diambil: now,
        processedByOldat: user.id,
        processedByName: user.name,
        processedAt: now,
        pendampingOlahDataId: user.id,
        updatedAt: now,
        processHistory: history
      };
    });
  },

  addNotification: (notification: any) => {
    const newNotif = { 
      ...notification, 
      id: Math.random().toString(36).substr(2, 9),
      isRead: false,
      time: 'Baru saja'
    };
    notificationsStore = [newNotif, ...notificationsStore];
    return newNotif;
  },
  markNotifAsRead: (id: string) => {
    notificationsStore = notificationsStore.map(n => n.id === id ? { ...n, isRead: true } : n);
  },
  clearAllNotifs: () => {
    notificationsStore = [];
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
  getGmvSettings: () => gmvSettingsStore,
  updateGmvSettings: (settings: typeof gmvSettingsStore) => {
    gmvSettingsStore = { ...settings };
  },
  calculateUserGmv: (user: User, dataList: DataPelakuUsaha[]) => {
    const isHalalTerbit = (status?: string) => 
      status?.toLowerCase() === 'halal terbit' || 
      status?.toLowerCase() === 'terbit sertifikat halal';

    // Logika GMV sesuai pengaturan:
    const settings = gmvSettingsStore;
    
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
      const count = dataList.filter(d => isHalalTerbit(d.statusProses)).length;
      return count * settings.superAdmin;
    }

    if (user.role === UserRole.DATLAP) {
      const count = dataList.filter(d => d.createdBy === user.id && isHalalTerbit(d.statusProses)).length;
      return count * settings.datlap;
    }

    if (user.role === UserRole.OLDAT) {
      const count = dataList.filter(d => 
        d.pendampingOlahDataId === user.id && isHalalTerbit(d.statusProses)
      ).length;
      return count * settings.oldat;
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
