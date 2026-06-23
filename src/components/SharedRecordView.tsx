import React, { useState, useEffect } from 'react';
import { getSharedRecordByToken, getMedicalRecordById } from '../lib/db';
import { SharedRecord, MedicalRecord } from '../types';
import { Shield, Lock, FileHeart, Calendar, Stethoscope, Hospital, Info, ChevronRight, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import Markdown from 'react-markdown';

interface SharedRecordViewProps {
  token: string;
}

export default function SharedRecordView({ token }: SharedRecordViewProps) {
  const [shared, setShared] = useState<SharedRecord | null>(null);
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const s = getSharedRecordByToken(token);
    if (!s) {
      setErrorMsg('Liên kết không tồn tại hoặc đã bị xóa.');
      setLoading(false);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    if (s.expiresAt < today) {
      setErrorMsg('Liên kết này đã hết hạn. Vui lòng liên hệ người gửi để nhận liên kết mới.');
      setLoading(false);
      return;
    }

    setShared(s);
    if (!s.password) {
      setAuthenticated(true);
      const r = getMedicalRecordById(s.recordId);
      setRecord(r);
    }
    setLoading(false);
  }, [token]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (shared && shared.password === password) {
      setAuthenticated(true);
      const r = getMedicalRecordById(shared.recordId);
      setRecord(r);
    } else {
      setErrorMsg('Mật khẩu không chính xác.');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div></div>;
  }

  if (errorMsg && !shared) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-red-50">
          <div className="bg-red-100 text-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Không thể truy cập</h1>
          <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (shared && !authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-radial from-slate-50 to-slate-200 p-4 font-sans">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border border-slate-100">
          <div className="flex justify-center mb-6">
            <div className="bg-emerald-50 w-16 h-16 rounded-full flex items-center justify-center shadow-inner border border-emerald-100">
              <Shield className="w-8 h-8 text-emerald-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">Hồ sơ được bảo vệ</h1>
          <p className="text-center text-sm text-slate-500 mb-8">Liên kết chia sẻ yêu cầu mật khẩu để xem nội dung.</p>

          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-widest pl-1">Mật khẩu truy cập</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrorMsg(''); }}
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all font-medium text-slate-800"
                  placeholder="Nhập mật khẩu..."
                />
              </div>
            </div>

            {errorMsg && (
              <div className="text-red-500 text-xs font-medium text-center bg-red-50 px-3 py-2 rounded-lg">{errorMsg}</div>
            )}

            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
              Mở khóa truy cập
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (errorMsg && shared && authenticated && !record) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">Error loading record.</div>;
  }

  if (!record) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-emerald-50 text-emerald-800 px-4 py-3 rounded-2xl flex items-center gap-3 border border-emerald-100 shadow-sm">
          <Shield className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-sm font-medium leading-relaxed">
            Bạn đang xem <b>Hồ sơ y tế được chia sẻ trực tuyến</b>. 
            Liên kết này sẽ tự động hủy kích hoạt sau ngày <b>{new Date(shared!.expiresAt).toLocaleDateString('vi-VN')}</b>.
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100">
          <div className="flex items-center gap-4 border-b border-slate-100 pb-6 mb-6">
            <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100 text-indigo-600">
              <FileHeart className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-sans tracking-tight text-slate-800">Chi tiết Bệnh án</h1>
              <p className="text-slate-500 text-sm font-medium mt-1">Được chia sẻ bởi quản trị viên gia đình</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
             <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
               <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Ngày khám</div>
               <div className="flex items-center gap-2 font-medium text-slate-800">
                 <Calendar className="w-4 h-4 text-slate-400" />
                 {new Date(record.date).toLocaleDateString('vi-VN')}
               </div>
             </div>
             
             <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
               <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Cơ sở y tế</div>
               <div className="flex items-center gap-2 font-medium text-slate-800">
                 <Hospital className="w-4 h-4 text-slate-400" />
                 {record.hospital}
                 {record.department && <span className="text-slate-400 text-sm">({record.department})</span>}
               </div>
             </div>
             
             <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 sm:col-span-2">
               <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Bác sĩ phụ trách</div>
               <div className="flex items-center gap-2 font-medium text-slate-800">
                 <Stethoscope className="w-4 h-4 text-slate-400" />
                 {record.doctor}
               </div>
             </div>
          </div>

          <div className="space-y-6">
            <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
               <div className="bg-slate-50 px-5 py-3 border-b border-slate-100 flex items-center gap-2 font-bold text-sm text-slate-700">
                 <Info className="w-4 h-4 text-indigo-500" /> Tổng quan lâm sàng
               </div>
               <div className="p-5 space-y-4 text-sm bg-white">
                 <div>
                   <span className="font-bold text-slate-800 block mb-1">Lý do đến khám:</span>
                   <div className="text-slate-600 leading-relaxed bg-slate-50/50 p-2 rounded-xl">{record.reason || 'Không ghi nhận'}</div>
                 </div>
                 <div>
                   <span className="font-bold text-slate-800 block mb-1">Triệu chứng:</span>
                   <div className="text-slate-600 leading-relaxed bg-slate-50/50 p-2 rounded-xl whitespace-pre-wrap">{record.symptoms || 'Không ghi nhận'}</div>
                 </div>
               </div>
            </div>

            <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
               <div className="bg-indigo-50/50 px-5 py-3 border-b border-indigo-100/50 flex items-center gap-2 font-bold text-sm text-indigo-800">
                 <ActivityIcon className="w-4 h-4 text-indigo-500" /> Kết quả & Điều trị
               </div>
               <div className="p-5 space-y-4 text-sm bg-white">
                 <div>
                   <span className="font-bold text-slate-800 block mb-1">Chẩn đoán xác định:</span>
                   <div className="text-slate-800 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">{record.diagnosis || 'Không ghi nhận'}</div>
                 </div>
                 {record.conclusion && (
                    <div>
                      <span className="font-bold text-slate-800 block mb-1">Kết luận của BS:</span>
                      <div className="text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50/50 p-3 rounded-xl">{record.conclusion}</div>
                    </div>
                 )}
                 {record.treatment && (
                    <div>
                      <span className="font-bold text-slate-800 block mb-1">Hướng điều trị / Dặn dò:</span>
                      <div className="text-slate-600 leading-relaxed prose prose-sm max-w-none whitespace-pre-wrap bg-slate-50/50 p-3 rounded-xl">
                        <Markdown>{record.treatment}</Markdown>
                      </div>
                    </div>
                 )}
               </div>
            </div>
          </div>
          
        </motion.div>
      </div>
    </div>
  );
}

function ActivityIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
}
