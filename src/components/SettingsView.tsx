/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserSession, ActivityLog } from '../types';
import { 
  getLogs as getActivityLogs, 
  getMembers, 
  getMedicalRecords, 
  getPrescriptions, 
  getReminders, 
  getHealthMetrics as getMetrics, 
  getExpenses, 
  getDocuments,
  clearFamilyDemoData,
  restoreBackupData,
  clearLogs
} from '../lib/db';
import { initAuth, googleSignIn, logoutGoogle, exportDataToGoogleSheets } from '../lib/gapi';
import { User as FirebaseUser } from 'firebase/auth';
import { 
  History, 
  User, 
  Settings, 
  ShieldAlert, 
  Download, 
  FileJson,
  Upload,
  Eye, 
  Trash2, 
  Moon, 
  Sun,
  Laptop,
  AlertTriangle,
  UploadCloud,
  CheckCircle2,
  LogOut
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';

interface SettingsViewProps {
  session: UserSession;
  onLogout: () => void;
  darkMode: boolean;
  onToggleTheme: () => void;
}

export default function SettingsView({ session, onLogout, darkMode, onToggleTheme }: SettingsViewProps) {
  const [logs, setLogs] = useState<ActivityLog[]>(() => getActivityLogs(session.familyId));
  
  // Google Auth states
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const [confirmAction, setConfirmAction] = useState<{id: string; title: string; message: string; onConfirm: () => void} | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth((user, token) => {
      setGoogleUser(user);
      setGoogleToken(token);
    }, () => {
      setGoogleUser(null);
      setGoogleToken(null);
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
      }
    } catch (err: any) {
      alert('Không thể đăng nhập Google: ' + err.message);
    }
  };

  const handleGoogleLogout = async () => {
    await logoutGoogle();
    setGoogleUser(null);
    setGoogleToken(null);
  };

  const handleExportToGoogleSheets = async () => {
    let token = googleToken;
    let user = googleUser;

    const runExport = async (accessToken: string) => {
      setIsExporting(true);
      try {
        const url = await exportDataToGoogleSheets(session.familyId, accessToken);
        alert(`Xuất dữ liệu thành công! Mở Google Sheets tại:\n${url}`);
        window.open(url, '_blank');
      } catch (err: any) {
        console.error(err);
        alert('Có lỗi khi lưu lên Google Sheets. Nếu bạn chưa cấp quyền "Google Sheets", hãy đăng xuất và đăng nhập lại để cấp quyền. Lỗi: ' + err.message);
      } finally {
        setIsExporting(false);
      }
    };

    if (!token) {
      setConfirmAction({
        id: 'google-login',
        title: 'Đăng nhập Google',
        message: 'Bạn cần đăng nhập Google để lưu dữ liệu Bệnh án hiện tại lên Google Sheets. Tiếp tục?',
        onConfirm: async () => {
          try {
            const result = await googleSignIn();
            if (result) {
              setGoogleUser(result.user);
              setGoogleToken(result.accessToken);
              token = result.accessToken;
              user = result.user;
              await runExport(token);
            } else {
              return;
            }
          } catch (err: any) {
            alert('Không thể đăng nhập Google: ' + err.message);
            return;
          }
        }
      });
      return;
    } else {
      setConfirmAction({
        id: 'export',
        title: 'Lưu dữ liệu Bệnh án hiện tại lên Google Sheets',
        message: 'Lưu dữ liệu Bệnh án hiện tại lên Google Sheets không? Hệ thống sẽ tạo một bảng tính mới trong Google Drive của bạn.',
        onConfirm: async () => {
          if (!googleToken) return;
          await runExport(googleToken);
        }
      });
      return;
    }
  };

  const handleExportDataBak = () => {
    // Collect all local family records to create a beautiful JSON backup file
    const backupObj = {
      familyId: session.familyId,
      exportedAt: new Date().toISOString(),
      familyMembers: getMembers(session.familyId),
      medicalRecords: getMedicalRecords(session.familyId),
      prescriptions: getPrescriptions(session.familyId),
      reminders: getReminders(session.familyId),
      metrics: getMetrics(session.familyId),
      expenses: getExpenses(session.familyId),
      documents: getDocuments(session.familyId)
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `family_medical_vault_backup_${session.familyId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportDataBak = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const backupObj = JSON.parse(content);
        
        if (!backupObj || !backupObj.familyId || !backupObj.familyMembers) {
          throw new Error('Tệp không đúng định dạng sao lưu của Family Medical Vault.');
        }

        const result = restoreBackupData(session.familyId, backupObj, session);
        if (result.success) {
          alert('Khôi phục dữ liệu thành công! Trang web sẽ được tải lại.');
          window.location.reload();
        } else {
          alert(result.error);
        }
      } catch (err: any) {
        alert('Lỗi khi đọc file JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
    // Reset file input
    event.target.value = '';
  };

  const clearAllLocalLogs = () => {
    if (session.role !== 'admin') {
      alert('Chỉ quản trị viên mới có quyền dọn dẹp lịch sử hệ thống.');
      return;
    }
    
    setConfirmAction({
      id: 'clear-logs',
      title: 'Làm sạch nhật ký',
      message: 'Bạn có chắc chắn muốn làm sạch toàn bộ nhật ký kiểm toán không? Thao tác này xóa vĩnh viễn các nhật ký hành vi cũ.',
      onConfirm: () => {
        const res = clearLogs(session.familyId, session);
        if (res.success) {
          setLogs(getActivityLogs(session.familyId));
        } else {
          alert(res.error);
        }
      }
    });
  };

  const handleClearDemoData = () => {
    if (session.role !== 'admin') {
      alert('Chỉ quản trị viên mới có quyền xoá dữ liệu.');
      return;
    }
    const message = '⚠️ CẢNH BÁO NGUY HIỂM ⚠️\n\nBạn có chắc chắn muốn XÓA TOÀN BỘ dữ liệu của gia đình này không? (Bao gồm hồ sơ khám, đơn thuốc, lịch nhắc, viện phí...)\n\nChỉ giữ lại tài khoản đăng nhập hiện tại.\nHành động này KHÔNG THỂ HOÀN TÁC!';
    
    setConfirmAction({
      id: 'clear-demo',
      title: 'CẢNH BÁO NGUY HIỂM XÓA TOÀN BỘ',
      message,
      onConfirm: () => {
        const res = clearFamilyDemoData(session.familyId, session);
        if (res.success) {
          alert('Đã xóa dữ liệu thành công. Vui lòng tải lại trang (F5) để có trải nghiệm trống sạch sẽ nhất.');
          window.location.reload();
        } else {
          alert(res.error || 'Có lỗi xảy ra.');
        }
      }
    });
  };

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 font-sans">
      {/* Title block */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-xl font-bold dark:text-slate-50 font-sans tracking-tight">Cài đặt & Nhật ký kiểm toán</h1>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          Xem thông tin phân biệt tài khoản hiện hành, xuất tệp sao lưu hoặc tra cứu vết hành động của thành viên gia đình
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left column: Account & controls settings */}
        <div className="lg:col-span-5 space-y-6">
          {/* Account Card info */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-850 pb-2.5">
              <User className="w-4 h-4 text-slate-400" /> Hồ sơ bảo mật
            </h3>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-black block">Tài khoản đăng nhập</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200 block mt-0.5">{session.email}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-black block">Mã gia quyến (Family ID)</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-250 bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded inline-block mt-0.5">{session.familyId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-black block">Vai trò bảo vệ</span>
                  <span className={`px-2 py-0.5 rounded-sm inline-block mt-0.5 text-[9px] font-extrabold uppercase tracking-widest border ${
                    session.role === 'admin' 
                      ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950 dark:text-blue-400' 
                      : 'bg-slate-100 text-slate-500 border-slate-205'
                  }`}>
                    {session.role === 'admin' ? 'Quản trị viên (Admin)' : 'Thành viên thường'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3.5 border-t border-slate-50 dark:border-slate-850">
              <button
                onClick={onLogout}
                className="w-full py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-center text-xs cursor-pointer shadow-xs"
              >
                Đăng xuất tài khoản
              </button>
            </div>
          </div>

          {/* Settings / System options */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-850 pb-2.5">
              <Settings className="w-4 h-4 text-slate-400" /> Cài đặt hiển thị
            </h3>

            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${darkMode ? 'bg-indigo-900/50 text-indigo-400' : 'bg-amber-100 text-amber-500'}`}>
                  {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-100">Giao diện (Sáng/Tối)</div>
                  <div className="text-[10px] text-slate-500">Chuyển đổi giao diện hiển thị phù hợp</div>
                </div>
              </div>
              <button
                onClick={onToggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${darkMode ? 'bg-indigo-500' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {/* Backup & utility actions */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4 text-xs">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-50 dark:border-slate-850 pb-2.5">
              <Download className="w-4 h-4 text-slate-404" /> Xuất bản & Hồi phủ phục hồi
            </h3>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Tệp sao lưu của Family Medical Vault chứa đựng đầy đủ hồ sơ bệnh án khám bệnh, kho file ảnh chụp đính kèm (dạng Base64 bảo mật), bốc đơn thuốc hằng tháng và lịch đỗi cảnh báo. Bạn có thể lưu trữ tệp này làm hồ sơ dự phòng cá nhân độc lập.
            </p>

            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleExportDataBak}
                  className="w-full px-4 py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-bold border border-blue-200/50 dark:border-blue-900 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                >
                  <FileJson className="w-4 h-4" /> Xuất tệp dự phòng (.json)
                </button>
                <label className="w-full px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-bold border border-indigo-200/50 dark:border-indigo-900 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors">
                  <Upload className="w-4 h-4" /> Phục hồi tệp dự phòng (.json)
                  <input type="file" accept=".json" className="hidden" onChange={handleImportDataBak} />
                </label>
              </div>

              <div className="border border-emerald-100 dark:border-emerald-900/50 rounded-xl p-3 bg-emerald-50/50 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="bg-emerald-100 dark:bg-emerald-900/50 p-1.5 rounded-lg">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg" alt="Sheets" className="w-4 h-4 opacity-80" />
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Google Sheets Tích Hợp</span>
                  </div>
                  {googleUser ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Đã kết nối
                      </span>
                      <button onClick={handleGoogleLogout} className="text-slate-400 hover:text-red-500" title="Ngắt kết nối">
                        <LogOut className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={handleGoogleLogin}
                      className="text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded shadow-xs hover:bg-slate-50 cursor-pointer"
                    >
                      Kết nối Google
                    </button>
                  )}
                </div>

                <button
                  onClick={handleExportToGoogleSheets}
                  disabled={isExporting}
                  className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20 transition-all font-sans"
                >
                  {isExporting ? (
                     <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                  ) : (
                    <UploadCloud className="w-4 h-4" /> 
                  )}
                  {googleUser ? 'Lưu Dữ Liệu Lên Bảng Tính Mới' : 'Đăng nhập Google để Lưu'}
                </button>
              </div>
            </div>

            {session.role === 'admin' && (
              <div className="pt-3 mt-3 border-t border-slate-50 dark:border-slate-850">
                <button
                  onClick={handleClearDemoData}
                  className="w-full px-4 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-bold border border-red-200/50 dark:border-red-900/30 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <AlertTriangle className="w-4 h-4" /> Xóa toàn bộ dữ liệu (Reset)
                </button>
              </div>
            )}
          </div>

          {/* Legal and compliance footnotes */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-dashed border-slate-205 dark:border-slate-850 space-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-slate-500">
              <ShieldAlert className="w-4 h-4 text-slate-455 shrink-0" />
              Chính sách an toàn y tế số hóa
            </div>
            <p className="leading-relaxed text-[10.5px]">
              Tất cả dược mịch lý luận và chuẩn chẩn đoán lưu trữ trong Family Medical Vault được mã hóa tại chỗ (Local storage Sandbox) không chia sẻ cho bên thứ ba. Hệ thống tuân thủ nghị trình bảo vệ sức khỏe gia đình trực tuyến.
            </p>
          </div>
        </div>

        {/* Right column: Audit activity timeline */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-4">
          <div className="border-b border-slate-50 dark:border-slate-855 pb-2.5 flex justify-between items-center flex-wrap gap-2">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4.5 h-4.5 text-blue-600 animate-pulse" />
              Nhật ký kiểm toán hoạt động ({logs.length})
            </h3>
            {session.role === 'admin' && (
              <button
                onClick={clearAllLocalLogs}
                className="text-[10px] text-red-600 font-bold hover:underline cursor-pointer"
              >
                Làm sạch nhật ký logs ✖
              </button>
            )}
          </div>

          {/* Timeline scrollbox */}
          <div className="space-y-4 max-h-[480px] overflow-y-auto scrollbar-thin pr-1 text-xs">
            {logs.length > 0 ? (
              <div className="relative border-l-2 border-slate-100 dark:border-slate-800 pl-4 space-y-4 mt-2">
                {logs.map((log) => (
                  <div key={log.id} className="relative">
                    {/* Circle marker on line */}
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white dark:ring-slate-900" />
                    
                    <div className="bg-slate-50/55 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100 dark:border-slate-850/80">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="text-[10.5px] font-bold text-slate-800 dark:text-slate-205">{log.action}</span>
                        <span className="text-[10px] text-slate-400 font-medium font-mono">{log.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-450 dark:text-slate-500 mt-1">{log.details}</p>
                      <span className="text-[9px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded inline-block mt-2">vết bởi: {log.userEmail}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-400 italic">
                Chưa có lịch sử vết thao tác nào được ghi nhận.
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!confirmAction}
        title={confirmAction?.title || ''}
        message={confirmAction?.message || ''}
        confirmText="Xác nhận"
        cancelText="Hủy"
        onConfirm={() => {
          if (confirmAction?.onConfirm) confirmAction.onConfirm();
          setConfirmAction(null);
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
