/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MedicalRecord, UserSession, FamilyMember } from '../types';
import { 
  getMedicalRecords, 
  saveMedicalRecord, 
  deleteMedicalRecord, 
  getMembers,
  getDocuments 
} from '../lib/db';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Stethoscope, 
  Hospital, 
  User, 
  ChevronDown, 
  DollarSign, 
  FileText, 
  Info,
  Trash2,
  Edit2,
  X,
  Share2
} from 'lucide-react';
import { motion } from 'motion/react';
import ShareModal from './ShareModal';
import DictationTextarea from './DictationTextarea';
import ConfirmModal from './ConfirmModal';

interface RecordsViewProps {
  session: UserSession;
}

export default function RecordsView({ session }: RecordsViewProps) {
  const [records, setRecords] = useState<MedicalRecord[]>(() => getMedicalRecords(session.familyId));
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<Partial<MedicalRecord> | null>(null);
  const [shareRecordId, setShareRecordId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{id: string; doctorName: string; date: string} | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const members = getMembers(session.familyId);
  const docs = getDocuments(session.familyId);

  const refreshList = () => {
    const list = getMedicalRecords(session.familyId);
    setRecords(list);
    if (selectedRecord) {
      const updated = list.find(r => r.id === selectedRecord.id);
      setSelectedRecord(updated || null);
    }
  };

  // Get list of unique Departments for filtration
  const departments = Array.from(new Set(records.map(r => r.department).filter(Boolean)));

  // Filter logic
  const filteredRecords = records.filter(r => {
    const member = members.find(m => m.id === r.memberId);
    const mName = member ? member.name.toLowerCase() : '';
    
    const matchesSearch = 
      r.hospital.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.diagnosis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mName.includes(searchQuery.toLowerCase());
      
    const matchesMember = selectedMemberFilter ? r.memberId === selectedMemberFilter : true;
    const matchesDept = selectedDeptFilter ? r.department === selectedDeptFilter : true;

    return matchesSearch && matchesMember && matchesDept;
  });

  const handleCreateNew = () => {
    setErrorMsg('');
    setEditingRecord({
      id: '',
      memberId: members[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      hospital: '',
      department: '',
      doctor: '',
      reason: '',
      symptoms: '',
      diagnosis: '',
      conclusion: '',
      treatment: '',
      followUpDate: '',
      cost: 0,
      attachmentIds: []
    });
  };

  const handleEdit = (r: MedicalRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    setErrorMsg('');
    setEditingRecord({ ...r });
  };

  const handleDelete = (rId: string, doctorName: string, date: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (session.role !== 'admin' && session.role !== 'member') {
      setErrorMsg('Bạn cần đăng nhập để thực hiện xóa dữ liệu.');
      return;
    }

    setConfirmDelete({ id: rId, doctorName, date });
  };

  const executeDelete = () => {
    if (!confirmDelete) return;
    const res = deleteMedicalRecord(session.familyId, confirmDelete.id, session);
    if (res.success) {
      setSuccessMsg('Đã xóa bỏ bản ghi bệnh án thành công.');
      setTimeout(() => setSuccessMsg(''), 3000);
      refreshList();
      if (selectedRecord?.id === confirmDelete.id) {
        setSelectedRecord(null);
      }
    } else {
      setErrorMsg(res.error || 'Xảy ra trục trặc trong quá trình xóa dữ liệu.');
    }
    setConfirmDelete(null);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    setErrorMsg('');

    if (!editingRecord.hospital?.trim()) {
      setErrorMsg('Vui lòng nhập tên Bệnh viện hoặc Phòng khám.');
      return;
    }
    if (!editingRecord.diagnosis?.trim()) {
      setErrorMsg('Chẩn đoán của bác sĩ là trường thông tin cực kỳ quan trọng, vui lòng không bỏ trống.');
      return;
    }

    const res = saveMedicalRecord(session.familyId, editingRecord as MedicalRecord, session);
    if (res.success) {
      setSuccessMsg('Đã ghi lục lâm sàng thành công.');
      setEditingRecord(null);
      setTimeout(() => setSuccessMsg(''), 3000);
      refreshList();
    } else {
      setErrorMsg(res.error || 'Trục trặc phát sinh khi lưu bệnh án.');
    }
  };

  const handleToggleAttachmentInForm = (dId: string) => {
    if (!editingRecord) return;
    const current = editingRecord.attachmentIds || [];
    let updated: string[];
    if (current.includes(dId)) {
      updated = current.filter(id => id !== dId);
    } else {
      updated = [...current, dId];
    }
    setEditingRecord({ ...editingRecord, attachmentIds: updated });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' ₫';
  };

  return (
    <div className="space-y-6">
      {/* Header and Add logic */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-sans tracking-tight">Lịch sử khám bệnh</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Lưu vết và tra cứu hồ sơ các lần đi khám sức khỏe, ý kiến bác sĩ, bảng dịch tễ và đơn điều trị
          </p>
        </div>
        <button
          id="add-record-btn"
          onClick={handleCreateNew}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-xs cursor-pointer select-none"
        >
          <Plus className="w-4 h-4" /> Ghi chép đột khám mới
        </button>
      </div>

      {/* Message alerts */}
      {successMsg && (
        <div className="p-3 bg-emerald-100/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs rounded-xl border border-emerald-100 dark:border-emerald-900 font-medium">
          ✓ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-100/40 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-xs rounded-xl border border-red-100 dark:border-red-900 font-medium">
          ⚠ {errorMsg}
        </div>
      )}

      {/* Filter and Query bar layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80">
        <div className="relative md:col-span-5">
          <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
          <input
            id="record-search"
            type="text"
            placeholder="Tìm theo tên thuốc, bác sĩ, chẩn đoán, triệu chứng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-hidden text-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="md:col-span-3">
          <select
            id="member-filter"
            value={selectedMemberFilter}
            onChange={(e) => setSelectedMemberFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-hidden text-slate-800 dark:text-slate-100"
          >
            <option value="">Lọc theo thành viên (Tất cả)</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.relationship})</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            id="dept-filter"
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium focus:outline-hidden text-slate-800 dark:text-slate-100"
          >
            <option value="">Lọc theo chuyên khoa (Tất cả)</option>
            {departments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-1 flex items-center justify-center">
          <button 
            onClick={() => {
              setSearchQuery('');
              setSelectedMemberFilter('');
              setSelectedDeptFilter('');
            }}
            className="text-[11px] text-slate-400 hover:text-blue-600 font-bold underline cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main panel columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Records listings column */}
        <div className="lg:col-span-6 space-y-3.5">
          {filteredRecords.length > 0 ? (
            filteredRecords.map((r) => {
              const member = members.find(m => m.id === r.memberId);
              const isSelected = selectedRecord?.id === r.id;

              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRecord(r)}
                  className={`p-4 bg-white dark:bg-slate-900 rounded-2xl border transition-all cursor-pointer text-slate-800 dark:text-slate-100 relative ${
                    isSelected 
                      ? 'border-blue-500 shadow-sm ring-2 ring-blue-500/10' 
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-750 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-sm uppercase tracking-wide">
                          {member?.name || 'Thành viên'}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {r.date}
                        </span>
                      </div>
                      <h3 className="font-bold text-xs text-slate-800 dark:text-slate-100 leading-snug mt-2">{r.reason}</h3>
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <Stethoscope className="w-3.5 h-3.5 text-slate-350 shrink-0" /> {r.doctor}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-[10px] text-slate-400 flex items-center justify-end gap-1 font-mono">
                        <Hospital className="w-3.5 h-3.5" /> {r.hospital.split(' ').slice(-2).join(' ')}
                      </p>
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block mt-1 uppercase">
                        {r.department}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3.5 flex justify-between items-center border-t border-slate-50 dark:border-slate-850 pt-2.5">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 flex items-center gap-1 font-mono">
                      💰 {formatCurrency(r.cost)}
                    </span>
                    <div className="flex items-center gap-1">
                      {r.attachmentIds && r.attachmentIds.length > 0 && (
                        <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5 flex items-center gap-1">
                          <FileText className="w-3 h-3" /> {r.attachmentIds.length} t/l
                        </span>
                      )}
                      
                      <button
                        onClick={(e) => handleEdit(r, e)}
                        className="p-1 px-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 rounded-md transition-colors"
                        title="Chỉnh sửa bệnh án"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(r.id, r.doctor, r.date, e)}
                        className="p-1 px-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 rounded-md transition-colors"
                        title="Xóa bệnh án"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-450 text-xs">
              Mục lục trống hoặc không tìm thấy trường khớp bộ lọc.
            </div>
          )}
        </div>

        {/* Right Side: Consultation Detail board */}
        <div className="lg:col-span-6">
          {selectedRecord ? (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-5 animate-fade-in text-slate-800 dark:text-slate-100">
              <div className="flex justify-between items-start gap-4 border-b border-slate-50 dark:border-slate-850 pb-3">
                <div className="min-w-0">
                  <span className="text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded uppercase">
                    {members.find(m => m.id === selectedRecord.memberId)?.name || 'Thành viên'}
                  </span>
                  <h2 className="text-sm font-bold mt-2 font-sans tracking-tight leading-snug">{selectedRecord.reason}</h2>
                  <p className="text-xs text-slate-400 mt-1 font-medium">Khám ngày {selectedRecord.date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShareRecordId(selectedRecord.id)}
                    className="p-1 px-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 dark:hover:border-indigo-800 rounded-lg shrink-0 flex items-center gap-1.5 transition-colors shadow-sm"
                    title="Tạo liên kết chia sẻ bảo mật"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold hidden sm:inline">Chia sẻ</span>
                  </button>
                  <button
                    onClick={() => setSelectedRecord(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Doctors & Hospital credentials */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Cơ sở khám chữa</p>
                  <p className="font-bold flex items-center gap-1 pb-1">
                    <Hospital className="w-4 h-4 text-slate-400 shrink-0" /> {selectedRecord.hospital}
                  </p>
                  <p className="text-slate-400 pl-5">Chuyên khoa: {selectedRecord.department}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Bác sĩ khám</p>
                  <p className="font-bold flex items-center gap-1 font-sans">
                    <User className="w-4 h-4 text-slate-400 shrink-0" /> {selectedRecord.doctor}
                  </p>
                  <p className="text-slate-400 pl-5">Đơn vị công tác</p>
                </div>
              </div>

              {/* Diagnostics blocks */}
              <div className="space-y-3 pt-2 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Triệu chứng của bệnh nhân</span>
                  <p className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl leading-relaxed text-slate-700 dark:text-slate-300">
                    {selectedRecord.symptoms || 'Bệnh nhân có thể trạng mệt mỏi, mỏi gáy nhưng không sốt.'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 uppercase font-bold tracking-wider flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" /> Chẩn đoán chính thức
                  </span>
                  <p className="p-3 bg-blue-50/20 dark:bg-blue-950/20 border border-blue-100/30 text-slate-800 dark:text-slate-200 font-bold rounded-xl leading-relaxed select-all">
                    {selectedRecord.diagnosis}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Kết luận lâm sàng</span>
                  <p className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl leading-relaxed text-slate-700 dark:text-slate-300">
                    {selectedRecord.conclusion || 'Huyết áp chưa kiểm soát đúng liều, khuyên giảm muối.'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold tracking-wider block">Hướng điều trị & Hướng dẫn sử dụng thuốc</span>
                  <p className="p-3 bg-emerald-50/20 dark:bg-emerald-950/20 border border-emerald-100/30 text-slate-700 dark:text-slate-300 rounded-xl leading-relaxed select-all font-medium">
                    {selectedRecord.treatment}
                  </p>
                </div>
              </div>

              {/* Financial block and Attached docs */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div className="flex gap-4">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-bold block mb-1">Tổng chi phí khám</span>
                    <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-450">{formatCurrency(selectedRecord.cost)}</span>
                  </div>
                  {selectedRecord.followUpDate && (
                    <div>
                      <span className="text-[9px] text-indigo-500 uppercase font-bold block mb-1">Lịch hẹn tái khám</span>
                      <span className="font-bold text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-600 px-2 py-0.5 rounded-sm">{selectedRecord.followUpDate}</span>
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[9px] text-slate-400 uppercase font-bold block mb-1.5">Tài liệu bệnh án đính kèm</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedRecord.attachmentIds && selectedRecord.attachmentIds.length > 0 ? (
                      selectedRecord.attachmentIds.map(dId => {
                        const d = docs.find(doc => doc.id === dId);
                        return d ? (
                          <span key={dId} className="text-[10px] text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-750 px-2 py-1 rounded-md block max-w-[130px] truncate" title={d.title}>
                            📄 {d.title}
                          </span>
                        ) : null;
                      })
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Không có tài liệu đính kèm</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden lg:flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-950/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs text-center p-6 h-full">
              <Stethoscope className="w-10 h-10 text-slate-300 mb-2 animate-bounce" />
              <p className="font-semibold text-slate-500">Chưa mở bản ghi điều trị</p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs">Nhấp chọn bất cứ đợt khám bệnh nào trong danh sách bên trái để mở rộng toàn bộ chẩn đoán, kết luận của bác sĩ, hướng kê đơn thuốc và biểu phí bệnh viện chi tiết.</p>
            </div>
          )}
        </div>
      </div>

      {/* Write & Modification popup form */}
      {editingRecord && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden font-sans text-slate-800 dark:text-slate-100 cursor-default"
          >
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Stethoscope className="w-5 h-5 animate-pulse" />
                {editingRecord.id ? 'Hiệu chỉnh bệnh án lâm sàng' : 'Khai trương bệnh án / Ghi ca khám bệnh lâm nghiệp'}
              </h3>
              <button
                onClick={() => setEditingRecord(null)}
                className="p-1 hover:bg-white/10 rounded-lg text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Chủ hồ sơ bệnh án</label>
                  <select
                    value={editingRecord.memberId || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, memberId: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden dark:text-slate-100"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.relationship})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ngày đi khám <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    required
                    value={editingRecord.date || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Chuyên khoa khám</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Nội tim mạch, Tiêu hóa..."
                    value={editingRecord.department || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, department: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden dark:text-slate-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cơ sở khám / Bệnh viện <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Bệnh viện Đại học Y Dược, Lâm sàng..."
                    value={editingRecord.hospital || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, hospital: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bác sĩ phụ trách chính</label>
                  <input
                    type="text"
                    placeholder="BS. Nguyễn Văn B"
                    value={editingRecord.doctor || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, doctor: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Lý do khám / Triệu chứng khởi nguồn</label>
                  <input
                    type="text"
                    placeholder="Mệt mỏi, đau rát mạn sườn phải..."
                    value={editingRecord.reason || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, reason: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Chi phí khám / Hóa đơn đợt khám (đ)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ví dụ: 350000"
                    value={editingRecord.cost || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, cost: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-indigo-500 uppercase mb-1">Có hẹn tái khám không?</label>
                  <input
                    type="date"
                    value={editingRecord.followUpDate || ''}
                    onChange={(e) => setEditingRecord({ ...editingRecord, followUpDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-indigo-50/20 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden dark:text-indigo-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mô tả triệu chứng lâm sàng chi tiết</label>
                <DictationTextarea
                  rows={2}
                  placeholder="Khám gầy gộc, móng tay thâm nhẹ, huyết áp cao nhẹ,..."
                  value={editingRecord.symptoms || ''}
                  onChange={(val) => setEditingRecord({ ...editingRecord, symptoms: val })}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden dark:text-slate-100 scrollbar-thin"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-blue-600 dark:text-blue-400 uppercase mb-1">Chẩn đoán chính của bác sĩ <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Dạ dày nhiễm HP hoạt động, tăng huyết áp vô căn..."
                  value={editingRecord.diagnosis || ''}
                  onChange={(e) => setEditingRecord({ ...editingRecord, diagnosis: e.target.value })}
                  className="w-full px-3.5 py-2 bg-blue-50/10 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden font-bold dark:text-slate-50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kết luận chung</label>
                  <DictationTextarea
                    rows={2}
                    placeholder="Tổng trạng ổn, đề phòng xơ cứng mạch vành..."
                    value={editingRecord.conclusion || ''}
                    onChange={(val) => setEditingRecord({ ...editingRecord, conclusion: val })}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden dark:text-slate-100 scrollbar-thin"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-600 uppercase mb-1">Hướng điều trị / Kê thuốc uống hằng ngày</label>
                  <DictationTextarea
                    rows={2}
                    placeholder="Uống thuốc hạ áp đúng 7h sáng, tránh thức khuya..."
                    value={editingRecord.treatment || ''}
                    onChange={(val) => setEditingRecord({ ...editingRecord, treatment: val })}
                    className="w-full px-3.5 py-2 bg-emerald-50/10 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden dark:text-slate-100 scrollbar-thin"
                  />
                </div>
              </div>

              {/* Tagging files in repository */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Liên kết tài liệu lưu trữ trong kho</label>
                {docs.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200/60 dark:border-slate-850 scrollbar-thin">
                    {docs.map(d => {
                      const isLinked = (editingRecord.attachmentIds || []).includes(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => handleToggleAttachmentInForm(d.id)}
                          className={`p-2 rounded-lg text-left text-[11px] font-medium border transition-colors flex justify-between items-center ${
                            isLinked 
                              ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-400 text-blue-700 dark:text-blue-400' 
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850'
                          }`}
                        >
                          <span className="truncate max-w-[170px]">📄 {d.title}</span>
                          <span className="text-[10px] font-bold">{isLinked ? 'Đã ghim ✓' : '+' }</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">Kho hồ sơ tài liệu trống. Nhập tài liệu ở tab "Tài liệu y tế" để liên kết hồ sơ.</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-150 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Xác nhận lưu
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Share Modal */}
      {shareRecordId && (
        <ShareModal 
          session={session} 
          recordId={shareRecordId} 
          onClose={() => setShareRecordId(null)} 
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Xóa hồ sơ bệnh án"
        message={`Bạn có chắc chắn muốn xóa vĩnh viễn hồ sơ khám bệnh ngày ${confirmDelete?.date} với bác sĩ ${confirmDelete?.doctorName}? Thao tác này không thể hoàn tác.`}
        confirmText="Xóa hồ sơ"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
