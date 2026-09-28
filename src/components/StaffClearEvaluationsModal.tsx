import React, { useState } from 'react';
import { TeacherKpiEvaluation } from '../types';
import { dbBulkDeleteEvaluations } from '../services/dbService';
import {
  Trash2,
  AlertTriangle,
  X,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface StaffClearEvaluationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  officeEvaluations: TeacherKpiEvaluation[];
  onEvaluationsCleared: (deletedIds: string[]) => Promise<void>;
  currentMonth: number;
  currentYear: number;
  schoolYear: string;
}

export const StaffClearEvaluationsModal: React.FC<StaffClearEvaluationsModalProps> = ({
  isOpen,
  onClose,
  officeEvaluations,
  onEvaluationsCleared,
  currentMonth,
  currentYear,
  schoolYear,
}) => {
  // Step 1: choose scope, Step 2: secondary confirmation
  const [step, setStep] = useState<1 | 2>(1);
  const [scope, setScope] = useState<'month' | 'year' | 'all'>('month');
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth || 9);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear || 2026);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter evaluations to delete based on selected scope
  const targetEvaluations = officeEvaluations.filter((ev) => {
    if (scope === 'month') {
      return (ev.month === selectedMonth && (ev.year === selectedYear || ev.schoolYear.includes(String(selectedYear)))) ||
        (ev.periodName && ev.periodName.includes(`Tháng ${String(selectedMonth).padStart(2, '0')}`));
    }
    if (scope === 'year') {
      return ev.schoolYear === schoolYear || ev.year === selectedYear;
    }
    return true; // 'all'
  });

  const scopeLabel =
    scope === 'month'
      ? `Tháng ${String(selectedMonth).padStart(2, '0')}/${selectedYear}`
      : scope === 'year'
      ? `Năm học ${schoolYear}`
      : 'Toàn bộ tất cả các kỳ';

  const handleProceedToStep2 = () => {
    if (targetEvaluations.length === 0) {
      setErrorMsg(`Không tìm thấy phiếu KPI nhân viên nào trong phạm vi: ${scopeLabel}`);
      return;
    }
    setErrorMsg(null);
    setConfirmText('');
    setStep(2);
  };

  const handleConfirmDelete = async () => {
    if (confirmText.trim() !== 'XÓA PHIẾU') {
      setErrorMsg('Vui lòng nhập chính xác chữ "XÓA PHIẾU" để xác nhận lần 2!');
      return;
    }

    setIsDeleting(true);
    setErrorMsg(null);
    try {
      const idsToDelete = targetEvaluations.map((e) => e.id);
      await onEvaluationsCleared(idsToDelete);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Lỗi khi xóa dữ liệu trên cơ sở dữ liệu Firestore.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-900 via-red-900 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300 font-black">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-rose-200">
                QUẢN TRỊ NỘI BỘ • THPT PHƯƠNG XÁ
              </div>
              <h2 className="text-base sm:text-lg font-black text-white">
                XÓA KẾT QUẢ KPI NHÂN VIÊN
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 font-bold rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 space-y-2 leading-relaxed font-medium">
                <div className="flex items-center gap-2 font-black text-amber-950 text-sm">
                  <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0" />
                  <span>Bạn có chắc chắn muốn xóa toàn bộ dữ liệu KPI nhân viên không?</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Lưu ý an toàn: Thao tác này <strong>chỉ xóa các bản ghi kết quả đánh giá KPI</strong> của nhân viên theo phạm vi được chọn. 
                  Hồ sơ danh sách nhân viên, thông tin tài khoản, danh mục tiêu chí và tổ bộ môn vẫn được giữ nguyên an toàn 100%.
                </p>
              </div>

              <div className="space-y-2.5">
                <label className="block font-black text-slate-800 uppercase tracking-wide text-[11px]">
                  Chọn phạm vi muốn xóa:
                </label>

                {/* Option 1: Xóa theo tháng */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border transition cursor-pointer ${
                    scope === 'month'
                      ? 'bg-rose-50/60 border-rose-300 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <input
                    type="radio"
                    name="clearStaffScope"
                    checked={scope === 'month'}
                    onChange={() => setScope('month')}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="font-extrabold text-slate-900">1. Xóa theo tháng cụ thể</div>
                    {scope === 'month' && (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-slate-500">Tháng:</span>
                        <select
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(Number(e.target.value))}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 bg-white font-bold"
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                            <option key={m} value={m}>
                              Tháng {String(m).padStart(2, '0')}
                            </option>
                          ))}
                        </select>
                        <span className="text-slate-500">Năm:</span>
                        <input
                          type="number"
                          value={selectedYear}
                          onChange={(e) => setSelectedYear(Number(e.target.value))}
                          className="w-20 px-2 py-1 rounded-lg border border-slate-300 bg-white font-bold text-center"
                        />
                      </div>
                    )}
                  </div>
                </label>

                {/* Option 2: Xóa theo năm */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border transition cursor-pointer ${
                    scope === 'year'
                      ? 'bg-rose-50/60 border-rose-300 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <input
                    type="radio"
                    name="clearStaffScope"
                    checked={scope === 'year'}
                    onChange={() => setScope('year')}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <div className="font-extrabold text-slate-900">
                      2. Xóa theo năm học: {schoolYear}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Xóa toàn bộ các phiếu KPI nhân viên trong cả năm học {schoolYear}.
                    </div>
                  </div>
                </label>

                {/* Option 3: Xóa toàn bộ */}
                <label
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border transition cursor-pointer ${
                    scope === 'all'
                      ? 'bg-rose-50/60 border-rose-300 shadow-2xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <input
                    type="radio"
                    name="clearStaffScope"
                    checked={scope === 'all'}
                    onChange={() => setScope('all')}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <div className="font-extrabold text-rose-700">
                      3. Xóa TOÀN BỘ kết quả KPI nhân viên
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Xóa vĩnh viễn tất cả {officeEvaluations.length} phiếu KPI của Tổ Văn phòng trong toàn hệ thống.
                    </div>
                  </div>
                </label>
              </div>

              <div className="p-3 bg-slate-100 rounded-xl text-slate-600 font-semibold flex items-center justify-between">
                <span>Số lượng phiếu sẽ bị xóa trong phạm vi này:</span>
                <span className="font-black text-rose-600 text-sm">{targetEvaluations.length} phiếu</span>
              </div>
            </div>
          ) : (
            /* STEP 2: SECONDARY CONFIRMATION */
            <div className="space-y-4 animate-in fade-in">
              <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl text-rose-900 space-y-2">
                <div className="flex items-center gap-2 font-black text-rose-950 text-sm">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>XÁC NHẬN LẦN 2 – HÀNH ĐỘNG KHÔNG THỂ HOÀN TÁC!</span>
                </div>
                <p className="text-xs leading-relaxed font-medium">
                  Hệ thống chuẩn bị xóa vĩnh viễn <strong className="text-rose-900">{targetEvaluations.length} phiếu KPI</strong> nhân viên thuộc phạm vi: <strong>{scopeLabel}</strong> khỏi cơ sở dữ liệu đám mây Firestore.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-slate-800">
                  Để đảm bảo an toàn, vui lòng gõ chính xác cụm từ <span className="font-mono text-rose-600 font-black">XÓA PHIẾU</span> vào ô bên dưới:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Gõ XÓA PHIẾU..."
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-rose-300 font-mono font-bold text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={step === 2 ? () => setStep(1) : onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer"
          >
            {step === 2 ? '← Quay lại bước 1' : 'Hủy bỏ'}
          </button>

          {step === 1 ? (
            <button
              type="button"
              onClick={handleProceedToStep2}
              disabled={targetEvaluations.length === 0}
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black text-xs shadow-md transition cursor-pointer flex items-center gap-2"
            >
              <span>Tiếp tục xác nhận</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={confirmText.trim() !== 'XÓA PHIẾU' || isDeleting}
              className="px-6 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs shadow-lg shadow-rose-700/30 transition cursor-pointer flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeleting ? 'Đang xóa...' : 'Xác nhận xóa vĩnh viễn'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
