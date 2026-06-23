/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserSession {
  email: string;
  familyId: string;
  role: 'admin' | 'member';
  memberName?: string;
  memberId?: string; // linked member ID if applicable
}

export interface FamilyMember {
  id: string;
  familyId: string;
  name: string;
  birthDate: string;
  gender: 'Nam' | 'Nữ' | 'Khác';
  relationship: 'Ông' | 'Bà' | 'Bố' | 'Mẹ' | 'Con trai' | 'Con gái' | 'Vợ' | 'Chồng' | 'Khác';
  bloodType: 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';
  height: number; // cm
  weight: number; // kg
  chronicDiseases: string; // bệnh nền
  allergies: string; // dị ứng thuốc/thức ăn
  longTermMeds: string; // thuốc đang sử dụng dài hạn
  healthNotes: string; // ghi chú sức khỏe
  avatar: string; // base64 or custom static avatar key
}

export type DocumentType =
  | 'prescription'  // Đơn thuốc
  | 'lab'           // Kết quả xét nghiệm
  | 'ultrasound'    // Siêu âm
  | 'xray'          // X-quang
  | 'ct_mri'        // CT/MRI
  | 'endoscopy'     // Nội soi
  | 'discharge'     // Giấy ra viện
  | 'followup'      // Giấy hẹn tái khám
  | 'invoice';      // Hóa đơn viện phí

export interface MedicalDocument {
  id: string;
  familyId: string;
  memberId: string; // tag theo người
  title: string;
  date: string; // YYYY-MM-DD
  hospital: string; // tag theo bệnh viện
  type: DocumentType; // tag theo loại hồ sơ
  notes: string;
  fileName: string;
  fileSize: string;
  fileData: string; // base64 image representation or SVG component indicator
  tags: string[]; // custom tags
}

export interface Medication {
  id: string;
  name: string;
  strength: string; // hàm lượng (e.g., 500mg)
  dosage: string; // liều dùng (e.g., 1 viên)
  timesPerDay: number; // số lần / ngày
  timing: string; // thời điểm uống (e.g., Sau ăn sáng, trước ăn tối)
  days: number; // số ngày uống
  status: 'active' | 'ceased' | 'chronic'; // đang dùng / đã ngưng / dùng dài hạn
}

export interface MedicalRecord {
  id: string;
  familyId: string;
  memberId: string;
  date: string; // ngày khám YYYY-MM-DD
  hospital: string;
  department: string; // chuyên khoa
  doctor: string;
  reason: string; // lý do khám
  symptoms: string; // triệu chứng
  diagnosis: string; // chẩn đoán bác sĩ
  conclusion: string; // kết luận
  treatment: string; // hướng điều trị
  followUpDate?: string; // ngày tái khám YYYY-MM-DD
  cost: number; // chi phí khám
  attachmentIds: string[]; // linked document IDs
}

export interface Prescription {
  id: string;
  familyId: string;
  memberId: string;
  date: string; // ngày kê đơn
  doctor: string;
  hospital: string;
  imageAttached?: string; // Base64 of image
  meds: Medication[];
}

export interface MedicalReminder {
  id: string;
  familyId: string;
  memberId: string;
  type: 'appointment' | 'medication' | 'vaccination' | 'routine'; // nhắc tái khám, nhắc uống thuốc, nhắc tiêm chủng, nhắc xét nghiệm định kỳ
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  status: 'pending' | 'completed' | 'missed';
  notes: string;
}

export interface HealthMetric {
  id: string;
  familyId: string;
  memberId: string;
  date: string; // YYYY-MM-DD HH:mm or just YYYY-MM-DD
  bpSystolic?: number; // Huyết áp tâm thu
  bpDiastolic?: number; // Huyết áp tâm trương
  bloodSugar?: number; // Đường huyết (mg/dL)
  weight?: number; // Cân nặng (kg)
  temperature?: number; // Thân nhiệt (C)
  heartRate?: number; // Nhịp tim (bpm)
  cholesterol?: number; // Cholesterol (mmol/L)
  uricAcid?: number; // Acid uric (umol/L)
  hba1c?: number; // HbA1c (%)
  customName?: string;
  customValue?: number;
}

export interface Expense {
  id: string;
  familyId: string;
  memberId: string;
  date: string; // YYYY-MM-DD
  category: 'visit' | 'lab' | 'meds' | 'hospitalization' | 'other'; // chi phí khám, xét nghiệm, thuốc, nhập viện, khác
  description: string;
  insuranceAmount: number; // Bảo hiểm chi trả
  selfPaidAmount: number; // Tự chi trả
  totalAmount: number; // Tổng chi phí
  hospital: string;
}

export interface ActivityLog {
  id: string;
  familyId: string;
  userEmail: string;
  action: string; // Thêm / Sửa / Xóa + Loại đối tượng
  timestamp: string; // YYYY-MM-DD HH:mm:ss
  details: string; // Chi tiết thao tác
}

export interface ScreeningMessage {
  role: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface ScreeningSession {
  id: string;
  familyId: string;
  memberId?: string; // Tùy chọn tag vào member nào đó
  date: string;
  messages: ScreeningMessage[];
  summary?: string; // Tóm tắt do AI tạo ở cuối
  status: 'active' | 'completed';
}

export interface SharedRecord {
  id: string; // share token
  familyId: string;
  recordId: string; // The medical record ID being shared
  createdBy: string; // email of creator
  createdAt: string; 
  expiresAt: string; // Expiration date YYYY-MM-DD
  password: string; // optional password for protection
}
