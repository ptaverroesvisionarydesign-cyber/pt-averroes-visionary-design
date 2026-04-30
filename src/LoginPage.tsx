/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAuth } from './AuthContext';
import { LogIn, ShieldCheck, User as UserIcon } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md overflow-hidden bg-white border border-slate-200 rounded-[2.5rem] shadow-geometric"
      >
        <div className="bg-primary p-10 text-center text-white relative overflow-hidden">
          <div className="absolute -left-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center">
  <img 
    src="/logo-bpjph.png" 
    alt="BPJPH Logo" 
    className="max-h-full max-w-full object-contain drop-shadow-lg" 
  />
</div>
          <h1 className="text-3xl font-black tracking-tight uppercase">SATDAPUS</h1>
          <p className="mt-1 text-xs font-bold text-purple-100 opacity-80 uppercase tracking-widest">Pusat Data Pelaku Usaha</p>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <UserIcon className="h-5 w-5 text-slate-300" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-2xl border border-slate-100 bg-slate-50 py-4 pl-12 pr-4 text-sm font-bold text-slate-700 transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 outline-none"
                  placeholder="admin@halal.id"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Password</label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <LogIn className="h-5 w-5 text-slate-300" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-2xl border border-slate-100 bg-slate-50 py-4 pl-12 pr-4 text-sm font-bold text-slate-700 transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/5 outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-rose-50 p-4 text-[10px] font-black text-rose-500 uppercase tracking-wider text-center"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center rounded-2xl bg-primary py-4 text-sm font-black text-white shadow-purple-glow transition-all hover:bg-primary-dark active:scale-[0.98] disabled:opacity-70 uppercase tracking-widest"
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                'Masuk ke Sistem'
              )}
            </button>
          </div>

          <div className="text-center">
             <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">© 2026 SATDAPUS Platform</span>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
