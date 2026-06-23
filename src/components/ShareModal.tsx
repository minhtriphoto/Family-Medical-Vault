import React, { useState } from 'react';
import { UserSession } from '../types';
import { createSharedRecord } from '../lib/db';
import { X, Link2, Copy, Shield, Calendar, Lock } from 'lucide-react';
import { motion } from 'motion/react';

interface ShareModalProps {
  session: UserSession;
  recordId: string;
  onClose: () => void;
}

export default function ShareModal({ session, recordId, onClose }: ShareModalProps) {
  const [expiresIn, setExpiresIn] = useState<'1' | '3' | '7'>('1');
  const [password, setPassword] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');

  const handleShare = (e: React.FormEvent) => {
    e.preventDefault();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + parseInt(expiresIn));
    const expiresAt = expiryDate.toISOString().split('T')[0];

    const shared = createSharedRecord(session, recordId, expiresAt, password);
    const link = `${window.location.origin}?share=${shared.id}`;
    setGeneratedLink(link);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    alert('Đã sao chép liên kết vào clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Link2 className="w-5 h-5 text-indigo-500" />
            Chia sẻ hồ sơ y tế
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {!generatedLink ? (
            <form onSubmit={handleShare} className="space-y-5">
              <div className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-800 dark:text-indigo-300 text-xs p-3 rounded-xl flex items-start gap-2 border border-indigo-100 dark:border-indigo-900/50">
                <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-medium">Bạn sắp tạo một liên kết truy cập công khai đến hồ sơ này. Vui lòng thiết lập mật khẩu nếu hồ sơ có tính bảo mật cao.</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                  <Calendar className="w-4 h-4" /> Thời gian tồn tại liên kết
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: '1', label: '1 Ngày' },
                    { val: '3', label: '3 Ngày' },
                    { val: '7', label: '7 Ngày' }
                  ].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setExpiresIn(opt.val as any)}
                      className={`py-2 rounded-xl text-sm font-bold border transition-colors ${expiresIn === opt.val ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'}`}
                    >
                       {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                  <Lock className="w-4 h-4" /> Mật khẩu truy cập (Tùy chọn)
                </label>
                <input
                  type="text"
                  placeholder="Để trống nếu không cần mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-[0.98]">
                  Tạo liên kết chia sẻ
                </button>
              </div>
            </form>
          ) : (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 text-center py-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-200">
                <Link2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">Tạo liên kết thành công!</h4>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Hồ sơ đã sẵn sàng để được chia sẻ.</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                <input 
                  type="text" 
                  readOnly 
                  value={generatedLink} 
                  className="w-full bg-transparent text-xs font-mono text-slate-600 dark:text-slate-300 outline-none"
                />
                <button 
                  onClick={copyToClipboard}
                  className="p-2 bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:hover:bg-indigo-800 text-indigo-700 dark:text-indigo-400 rounded-lg transition-colors shrink-0"
                  title="Sao chép"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              {password && (
                 <p className="text-xs font-bold text-amber-600 dark:text-amber-500 text-left bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg border border-amber-100/50 px-3 flex items-center gap-2">
                   <Lock className="w-3.5 h-3.5" />
                   Mật khẩu: {password}
                 </p>
              )}

              <button onClick={onClose} className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold py-3.5 rounded-xl transition-all">
                Đóng / Hoàn tất
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
