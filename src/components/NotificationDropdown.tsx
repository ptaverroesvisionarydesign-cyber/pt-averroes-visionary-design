import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, ExternalLink, Clock, Trash2, CheckCheck } from 'lucide-react';
import { useNotifications } from '../NotificationContext';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-3 rounded-2xl transition-all",
          isOpen ? "bg-primary/10 text-primary shadow-inner" : "bg-white border border-slate-200 text-slate-400 hover:text-primary hover:border-primary/50"
        )}
      >
        <Bell size={20} className={isOpen ? "animate-wiggle" : ""} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white px-1 shadow-lg shadow-red-500/30">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-3xl shadow-3xl border border-slate-100 z-50 overflow-hidden"
          >
            <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div>
                <h4 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                  Notifikasi
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {unreadCount} Baru
                    </span>
                  )}
                </h4>
                <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">Sistem Monitoring SATDAPUS</p>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  markAllAsRead();
                }}
                className="p-2 text-slate-400 hover:text-primary hover:bg-white rounded-xl transition-all"
                title="Tandai semua sudah dibaca"
              >
                <CheckCheck size={18} />
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
              {notifications.length === 0 ? (
                <div className="p-10 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <Bell size={32} />
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tidak ada notifikasi</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => {
                        markAsRead(notif.id);
                        if (notif.link) navigate(notif.link);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "w-full text-left p-6 transition-all group flex gap-4",
                        notif.read ? "bg-white opacity-60" : "bg-primary/5 border-l-4 border-l-primary"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                        notif.type === 'INPUT_DATA' ? "bg-blue-50 text-blue-500" :
                        notif.type === 'PROSES_DATA' ? "bg-amber-50 text-amber-500" : "bg-purple-50 text-purple-500"
                      )}>
                        {notif.type === 'INPUT_DATA' ? '📥' : notif.type === 'PROSES_DATA' ? '⚙️' : '🔔'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="text-xs font-black text-slate-800 uppercase tracking-tight leading-none mb-1 group-hover:text-primary transition-colors">
                            {notif.title}
                          </h5>
                          {!notif.read && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 leading-relaxed line-clamp-3 whitespace-pre-line">
                          {notif.message}
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase">
                            <Clock size={10} />
                            {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true, locale: id })}
                          </div>
                          {notif.link && (
                            <div className="text-[9px] font-black text-primary uppercase flex items-center gap-1">
                              <ExternalLink size={10} />
                              Klik Detail
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
              <button 
                onClick={() => {
                  navigate('/data');
                  setIsOpen(false);
                }}
                className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-100 transition-all"
              >
                Lihat Semua
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  clearAll();
                }}
                className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all font-bold"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
