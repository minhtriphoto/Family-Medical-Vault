/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { MedicalDocument, UserSession, DocumentType } from '../types';
import { getDocuments, saveDocument, deleteDocument, getMembers } from '../lib/db';
import { 
  UploadCloud, 
  Search, 
  Trash2, 
  Eye, 
  FileText, 
  Tag, 
  Calendar, 
  Hospital, 
  User, 
  Check, 
  AlertCircle,
  X,
  FileSpreadsheet,
  FileImage,
  Layers
} from 'lucide-react';
import { motion } from 'motion/react';
import ConfirmModal from './ConfirmModal';

interface DocumentsViewProps {
  session: UserSession;
}

const DOCUMENT_TYPES_CONFIG: { value: DocumentType; label: string; color: string }[] = [
  { value: 'prescription', label: 'Đơn thuốc', color: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400' },
  { value: 'lab', label: 'Kết quả xét nghiệm', color: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400' },
  { value: 'ultrasound', label: 'Kết quả siêu âm', color: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400' },
  { value: 'xray', label: 'Phim X-quang', color: 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400' },
  { value: 'ct_mri', label: 'Phim CT / MRI', color: 'bg-violet-50 text-violet-700 border-violet-100 dark:bg-violet-950/20 dark:text-violet-400' },
  { value: 'endoscopy', label: 'Hình soi nội tạng', color: 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400' },
  { value: 'discharge', label: 'Giấy xuất viện', color: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400' },
  { value: 'followup', label: 'Hẹn lịch tái khám', color: 'bg-cyan-50 text-cyan-700 border-cyan-100 dark:bg-cyan-950/20 dark:text-cyan-400' },
  { value: 'invoice', label: 'Hóa đơn viện phí', color: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-450' }
];

export default function DocumentsView({ session }: DocumentsViewProps) {
  const [docs, setDocs] = useState<MedicalDocument[]>(() => getDocuments(session.familyId));
  const [selectedDoc, setSelectedDoc] = useState<MedicalDocument | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{id: string; title: string} | null>(null);
  
  // Creation form state
  const [isUploading, setIsUploading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMemberId, setNewMemberId] = useState('');
  const [newType, setNewType] = useState<DocumentType>('prescription');
  const [newHospital, setNewHospital] = useState('');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newNotes, setNewNotes] = useState('');
  const [newTagsStr, setNewTagsStr] = useState('');
  
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: string; data: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [memberFilter, setMemberFilter] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const members = getMembers(session.familyId);

  const refreshList = () => {
    const list = getDocuments(session.familyId);
    setDocs(list);
    if (selectedDoc) {
      const updated = list.find(d => d.id === selectedDoc.id);
      setSelectedDoc(updated || null);
    }
  };

  // Drag and drop event handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  // Convert uploaded document to Base64 for local database persistence
  const handleFileProcess = (file: File) => {
    setErrorMsg('');
    const sizeKB = Math.round(file.size / 1024);
    const sizeStr = sizeKB > 1000 ? (sizeKB / 1024).toFixed(1) + ' MB' : sizeKB + ' KB';

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('Tập tin quá lớn (Giới hạn tối đa 8 MB) để đảm bảo bộ nhớ trình duyệt ổn định.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFile({
        name: file.name,
        size: sizeStr,
        data: reader.result as string
      });
      // Suggest general title based on file if not typed
      if (!newTitle) {
        const cleanName = file.name.split('.').slice(0, -1).join(' ').replace(/[-_]/g, ' ');
        setNewTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    };
    reader.onerror = () => {
      setErrorMsg('Không thể đọc dữ liệu file này.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedFile) {
      setErrorMsg('Vui lòng chọn hoặc kéo thả tập tin hồ sơ của bạn vào vùng tải lên.');
      return;
    }
    if (!newTitle.trim()) {
      setErrorMsg('Vui lòng điền đề mục tên tiêu đề tài liệu.');
      return;
    }
    if (!newMemberId) {
      setErrorMsg('Vui lòng gắn chọn Thành viên liên quan trong gia đình.');
      return;
    }

    // Split custom tags
    const docTags = newTagsStr
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const newDoc: MedicalDocument = {
      id: 'doc-' + Math.random().toString(36).slice(2, 9),
      familyId: session.familyId,
      memberId: newMemberId,
      title: newTitle.trim(),
      date: newDate,
      hospital: newHospital.trim() || 'Ngoại viện',
      type: newType,
      notes: newNotes.trim() || 'Không có ghi chú thêm.',
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      fileData: selectedFile.data,
      tags: docTags
    };

    const res = saveDocument(session.familyId, newDoc, session);
    if (res.success) {
      setSuccessMsg(`Tải lên tài liệu "${newDoc.title}" lưu kho thành công!`);
      setTimeout(() => setSuccessMsg(''), 3000);
      setIsUploading(false);
      resetForm();
      refreshList();
    } else {
      setErrorMsg(res.error || 'Trục trặc phát sinh khi lưu tệp.');
    }
  };

  const resetForm = () => {
    setNewTitle('');
    setNewMemberId('');
    setNewType('prescription');
    setNewHospital('');
    setNewDate(() => new Date().toISOString().split('T')[0]);
    setNewNotes('');
    setNewTagsStr('');
    setSelectedFile(null);
  };

  const handleDeleteDoc = (dId: string, titleName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (session.role !== 'admin') {
      setErrorMsg('Chỉ Admin gia đình mới có đặc quyền xóa tài liệu vĩnh viễn khỏi kho.');
      return;
    }

    setConfirmDelete({ id: dId, title: titleName });
  };

  const executeDelete = () => {
    if (!confirmDelete) return;
    const res = deleteDocument(session.familyId, confirmDelete.id, session);
    if (res.success) {
      setSuccessMsg(`Đã xóa tài liệu "${confirmDelete.title}" khỏi tủ.`);
      setTimeout(() => setSuccessMsg(''), 3000);
      refreshList();
      if (selectedDoc?.id === confirmDelete.id) {
        setSelectedDoc(null);
      }
    } else {
      setErrorMsg(res.error || 'Phát sinh lỗi xóa files.');
    }
    setConfirmDelete(null);
  };

  // Filters logic
  const filteredDocs = docs.filter(d => {
    const member = members.find(m => m.id === d.memberId);
    const mName = member ? member.name.toLowerCase() : '';
    
    const matchesSearch = 
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.hospital.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
      mName.includes(searchQuery.toLowerCase());

    const matchesType = typeFilter ? d.type === typeFilter : true;
    const matchesMember = memberFilter ? d.memberId === memberFilter : true;

    return matchesSearch && matchesType && matchesMember;
  });

  return (
    <div className="space-y-6">
      {/* Header and trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 font-sans tracking-tight">Kho lưu trữ tài liệu y tế</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            Lưu ảnh số chụp đơn kê thuốc, kết quả xét nghiệm huyết học, phiếu siêu âm, phim chụp chiếu màng cứng
          </p>
        </div>
        <button
          id="toggle-upload-btn"
          onClick={() => {
            setErrorMsg('');
            setIsUploading(!isUploading);
          }}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-medium text-xs shadow-xs cursor-pointer select-none ${
            isUploading 
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isUploading ? <X className="w-4 h-4" /> : <UploadCloud className="w-4 h-4" />}
          {isUploading ? 'Bỏ qua giao diện tải lên' : 'Tải lên tài liệu y tế mới'}
        </button>
      </div>

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

      {/* Main Upload Dropzone Area panel toggle */}
      {isUploading && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl border-2 border-dashed border-blue-200 dark:border-slate-850"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left half: Drag drop area */}
            <div className="md:col-span-5 flex flex-col justify-center">
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 py-10 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50/20' 
                    : 'border-slate-250 dark:border-slate-805 hover:bg-slate-50/50 dark:hover:bg-slate-850/10'
                }`}
              >
                <input
                  id="file-selector"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <UploadCloud className="w-10 h-10 text-slate-400 mb-2.5 animate-bounce" />
                <h4 className="font-bold text-xs text-slate-700 dark:text-slate-200 mb-1 font-sans">Kéo thả tài liệu y tế của bạn vào đây</h4>
                <p className="text-[10px] text-slate-400">hoặc nhấp chuột để lựa chọn từ bộ nhớ thiết bị</p>
                <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-400 px-2 py-0.5 rounded-sm inline-block mt-3.5 uppercase font-mono tracking-widest font-bold">PDF, JPEG, PNG (Tối đa 8MB)</span>
              </div>

              {selectedFile && (
                <div className="mt-3.5 p-3 rounded-xl bg-blue-50/30 dark:bg-slate-950 border border-blue-100/40 dark:border-slate-850 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileImage className="w-5 h-5 text-blue-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold truncate dark:text-slate-200">{selectedFile.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Dung lượng: {selectedFile.size}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-sm">Đã đọc ✓</span>
                </div>
              )}
            </div>

            {/* Right half: Annotation forms */}
            <form onSubmit={handleSubmitSave} className="md:col-span-7 space-y-4 text-xs text-slate-800 dark:text-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Đề mục Đơn thuốc / File khám <span className="text-red-500">*</span></label>
                  <input
                    id="doc-title-input"
                    type="text"
                    required
                    placeholder="Ví dụ: Đơn thuốc cao huyết áp tháng 5"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Thành viên liên đới <span className="text-red-500">*</span></label>
                  <select
                    id="doc-member-select"
                    required
                    value={newMemberId}
                    onChange={(e) => setNewMemberId(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden dark:text-slate-100"
                  >
                    <option value="">-- Chọn thành viên --</option>
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.relationship})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nhóm thuộc tính tài liệu</label>
                  <select
                    id="doc-type-select"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden dark:text-slate-100"
                  >
                    {DOCUMENT_TYPES_CONFIG.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Bệnh viện cấp</label>
                    <input
                      type="text"
                      placeholder="BV Đại học Y"
                      value={newHospital}
                      onChange={(e) => setNewHospital(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Ngày lập hồ sơ</label>
                    <input
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Ghi chú nhanh nội dung (Hàm lượng, chỉ dẫn...)</label>
                  <textarea
                    rows={2}
                    placeholder="Chỉ số men gan tăng, mỡ máu 5.2 mmol/L..."
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden dark:text-slate-100 scrollbar-thin"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Từ khóa tìm kiếm (ngăn bằng dấu phẩy)</label>
                  <textarea
                    rows={2}
                    placeholder="Máu, Tim mạch, Mỡ gan hở..."
                    value={newTagsStr}
                    onChange={(e) => setNewTagsStr(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden dark:text-slate-100 scrollbar-thin"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploading(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl"
                >
                  Bỏ qua
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Xác nhận tải lên kho
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}

      {/* Grid of items and search filter */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 text-xs">
        <div className="relative md:col-span-5">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            id="doc-search"
            type="text"
            placeholder="Tìm theo tiêu đề, bệnh viện, từ khóa hoặc tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:outline-hidden text-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="md:col-span-3">
          <select
            id="doc-type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:outline-hidden text-slate-850 dark:text-slate-50"
          >
            <option value="">Lọc theo loại hồ sơ (Tất cả)</option>
            {DOCUMENT_TYPES_CONFIG.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-3">
          <select
            id="doc-member-filter"
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold focus:outline-hidden text-slate-850 dark:text-slate-50"
          >
            <option value="">Lọc theo thành viên (Tất cả)</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-1 flex items-center justify-center">
          <button 
            onClick={() => {
              setSearchQuery('');
              setTypeFilter('');
              setMemberFilter('');
            }}
            className="text-[11px] text-slate-400 hover:text-blue-600 font-bold underline cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Grid of document Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.length > 0 ? (
          filteredDocs.map((d) => {
            const member = members.find(m => m.id === d.memberId);
            const typeCfg = DOCUMENT_TYPES_CONFIG.find(t => t.value === d.type) || DOCUMENT_TYPES_CONFIG[0];

            return (
              <div
                key={d.id}
                onClick={() => setSelectedDoc(d)}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-755 hover:shadow-xs p-4 flex flex-col justify-between cursor-pointer group text-slate-800 dark:text-slate-100"
              >
                <div>
                  <div className="flex items-start justify-between gap-2.5">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wide border ${typeCfg.color}`}>
                      {typeCfg.label}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">{d.fileSize}</span>
                  </div>

                  <h3 className="font-bold text-xs text-slate-800 dark:text-slate-100 mt-2.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate tracking-tight">{d.title}</h3>
                  
                  <div className="mt-3.5 space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <p className="flex items-center gap-1.5 font-medium truncate">
                      <User className="w-3.5 h-3.5 text-slate-400" /> Chủ sở: <span className="font-bold dark:text-slate-350">{member?.name || 'Gia đình'}</span>
                    </p>
                    <p className="flex items-center gap-1.5 truncate">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Ngày khám: {d.date}
                    </p>
                    <p className="flex items-center gap-1.5 truncate">
                      <Hospital className="w-3.5 h-3.5 text-slate-400" /> Đơn vị: {d.hospital}
                    </p>
                  </div>
                </div>

                {/* Tags collection display */}
                <div className="mt-4 pt-3 border-t border-slate-50 dark:border-slate-850 flex items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1 max-w-[130px] overflow-hidden whitespace-nowrap mask-right">
                    {d.tags && d.tags.length > 0 ? (
                      d.tags.map((tag, idx) => (
                        <span key={idx} className="text-[10px] bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 text-slate-400 dark:text-slate-500 px-1.5 py-0.5 rounded-sm">
                          #{tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-350 italic">Không tag</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setSelectedDoc(d)}
                      className="p-1 px-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-500 rounded-md text-slate-400 shrink-0 cursor-pointer"
                      title="Xem tài liệu"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {session.role === 'admin' && (
                      <button
                        onClick={(e) => handleDeleteDoc(d.id, d.title, e)}
                        className="p-1 px-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 rounded-md text-slate-400 shrink-0 cursor-pointer"
                        title="Xóa tài liệu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-3 text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-450 text-xs text-center p-6">
            <UploadCloud className="w-10 h-10 text-slate-300 mx-auto mb-2 animate-pulse" />
            <p className="font-semibold text-slate-500">Kho tài liệu trống rỗng</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">Chưa có kết quả xét nghiệm, siêu âm hay đơn thuốc nào được lưu. Hãy nhấp nút "Tải lên" ở trên để ghi số chụp chiếu hoặc tài liệu kiểm thọ cho gia đình.</p>
          </div>
        )}
      </div>

      {/* Real Scan viewer overlay module if selected */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[85vh] font-sans text-slate-850 dark:text-slate-100 cursor-default"
          >
            {/* Left Frame: Image view */}
            <div className="bg-slate-100 dark:bg-slate-950 flex-1 flex items-center justify-center p-4 relative overflow-hidden group">
              {selectedDoc.fileData ? (
                selectedDoc.fileData.startsWith('data:') ? (
                  <img
                    src={selectedDoc.fileData}
                    alt={selectedDoc.title}
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full rounded-lg object-contain shadow-md"
                  />
                ) : (
                  // Custom clean SVG graphic templates as medical documents!
                  <div className="flex flex-col items-center justify-center text-center p-6 max-w-sm">
                    <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                      <FileText className="w-8 h-8" />
                    </div>
                    <h4 className="font-bold text-sm text-slate-700 dark:text-slate-200 mb-2">Bản vẽ thiết kế & Scan mô phỏng y tê</h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                      Tài liệu "{selectedDoc.fileName}" đã được mã hóa bảo mật chuẩn nội liên thông để chống trộm cắp thông tin bệnh lý cá nhân.
                    </p>
                  </div>
                )
              ) : (
                <div className="text-center p-8 text-slate-400">
                  Không thể tìm thấy hoặc hiển thị tập tin nguồn.
                </div>
              )}
            </div>

            {/* Right Frame: Detailed indexing metadata summary */}
            <div className="w-full md:w-80 bg-white dark:bg-slate-900 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex justify-between items-start gap-4">
                  <span className="text-[10px] font-black bg-blue-50 dark:bg-blue-950 text-blue-700 px-2 py-0.5 rounded border border-blue-100 lowercase">
                    {selectedDoc.fileSize}
                  </span>
                  <button
                    onClick={() => setSelectedDoc(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg shrink-0 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-50 tracking-tight leading-snug mt-3 select-all">{selectedDoc.title}</h3>
                <p className="text-[11px] text-slate-450 dark:text-slate-500 mt-1 truncate">Tập tin: {selectedDoc.fileName}</p>

                <div className="mt-5 space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-black block mb-1">Thành viên ghi nhận</span>
                    <p className="font-extrabold text-xs text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-slate-400" />
                      {members.find(m => m.id === selectedDoc.memberId)?.name || 'Gia đình'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-black block mb-1">Bệnh viện cấp</span>
                    <p className="font-bold flex items-center gap-1.5">
                      <Hospital className="w-4 h-4 text-slate-400" />
                      {selectedDoc.hospital}
                    </p>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-black block mb-1">Ngày lập hồ sơ tài liệu</span>
                    <p className="font-medium flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {selectedDoc.date}
                    </p>
                  </div>

                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-black block mb-1">Ghi chú lâm sàng</span>
                    <p className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 text-slate-600 dark:text-slate-300 italic select-all leading-relaxed whitespace-pre-wrap">
                      "{selectedDoc.notes}"
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-xs mt-6 space-y-3">
                {selectedDoc.tags && selectedDoc.tags.length > 0 && (
                  <div>
                    <span className="text-[9px] text-slate-400 uppercase font-black block mb-1.5">Phân loại tag tìm kiếm</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedDoc.tags.map((t, i) => (
                        <span key={i} className="text-[10px] bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-sm border border-blue-100/30">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => setSelectedDoc(null)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-center text-xs shrink-0 cursor-pointer"
                >
                  Đóng tài liệu
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        title="Xóa tài liệu y khoa"
        message={`Bạn có chắc muốn xóa vĩnh viễn tài liệu "${confirmDelete?.title}"? Thao tác này không thể thu hồi.`}
        confirmText="Xóa tài liệu"
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
