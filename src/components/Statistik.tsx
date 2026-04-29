import React from 'react';
import { motion } from 'motion/react';
import { Download } from 'lucide-react';
import { dataService } from '../services/dataService';
import { DataPelakuUsaha } from '../types';

const Statistik = () => {
  const [dataList, setDataList] = React.useState<Partial<DataPelakuUsaha>[]>([]);
  const [stats, setStats] = React.useState({ totalData: 0, nibProses: 0, halalProses: 0, halalTerbit: 0 });

  React.useEffect(() => {
    setDataList(dataService.getDataList());
    setStats(dataService.getStats());
  }, []);

  return (
    <div className="p-8 pb-32 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-800">Statistik & Kinerja</h1>
          <p className="text-slate-500 font-medium mt-1">Laporan data pelaku usaha dan status sertifikasi</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-2">
          <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Total Data</span>
          <span className="text-4xl font-black text-slate-800">{stats.totalData}</span>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-2">
          <span className="text-sm font-black text-amber-500 uppercase tracking-widest">Proses NIB</span>
          <span className="text-4xl font-black text-amber-600">{stats.nibProses}</span>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-2">
          <span className="text-sm font-black text-sky-500 uppercase tracking-widest">Proses Halal</span>
          <span className="text-4xl font-black text-sky-600">{stats.halalProses}</span>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col gap-2 relative">
          <div className="flex justify-between items-start">
            <span className="text-sm font-black text-emerald-500 uppercase tracking-widest">Halal Terbit</span>
            <button 
              className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer flex items-center gap-2 text-xs font-bold"
              title="Download Data Sertifikasi Halal"
              onClick={() => alert('Downloading Data Sertifikasi Halal...')}
            >
              <Download className="w-3.5 h-3.5" />
              DOWNLOAD
            </button>
          </div>
          <span className="text-4xl font-black text-emerald-600">{stats.halalTerbit}</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Nama Pelaku Usaha</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Nomor WA</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">NIB</th>
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-widest">Sertifikat Halal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dataList.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 border-l-4 border-transparent hover:border-primary">
                    <span className="font-bold text-slate-700">{item.namaPelakuUsaha || '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-600">{item.noHp || '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium inline-block bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-sm">{item.nib || '-'}</span>
                      {item.nib && (
                        <button 
                          className="p-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-white transition-colors cursor-pointer"
                          title="Download NIB"
                          onClick={() => {
                            // Placeholder download interaction
                            alert(`Downloading NIB: ${item.nib}`);
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {item.noDokumen ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-bold bg-emerald-100 text-emerald-700">
                          {item.noDokumen}
                        </span>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          (item.statusProses === 'Halal Terbit' || item.statusProses === 'terbit sertifikat halal') 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : item.statusProses?.toLowerCase().includes('tolak')
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {item.statusProses || '-'}
                        </span>
                      )}
                      {(item.noDokumen || item.statusProses === 'Halal Terbit' || item.statusProses === 'terbit sertifikat halal') && (
                        <button 
                          className="p-1.5 bg-emerald-100/50 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer"
                          title="Download Sertifikat Halal"
                          onClick={() => {
                            alert(`Downloading Sertifikat Halal: ${item.noDokumen || item.namaPelakuUsaha}`);
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {dataList.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">
                    Belum ada data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Statistik;
