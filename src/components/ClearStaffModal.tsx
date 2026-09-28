import React, { useState } from 'react';
import { useKpi } from '../context/KpiContext';
import {
  AlertTriangle,
  Trash2,
  X,
  RotateCcw,
  CheckCircle2,
  ShieldAlert,
  Users,
} from 'lucide-react';

interface ClearStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClearStaffModal: React.FC<ClearStaffModalProps> = ({ isOpen, onClose }) => {
  const {
    staffList,
    clearAllStaff,
    restoreInitialStaff,
    schoolConfig,
  } = useKpi();

  const [confirmText, setConfirmText] = useState('');
  const [isConfirmedCheckbox, setIsConfirmedCheckbox] = useState(false);

  if (!isOpen) return null;

  const bghCount = staffList.filter((s) => s.type === 'bgh').length;
  const gvCount = staffList.filter((s) => s.type === 'giaovien').length;
  const nvCount = staffList.filter((s) => s.type === 'nhanvien').length;

  const isFormValid =
    isConfirmedCheckbox ||
    confirmText.trim().toUpperCase() === 'XOA HET' ||
    confirmText.trim().toUpperCase() === 'XÓA HẾT' ||
    confirmText.trim().toUpperCase() === 'XAC NHAN';

  const handleExecuteClear = () => {
    clearAllStaff();
    onClose();
    setConfirmText('');
    setIsConfirmedCheckbox(false);
  };

  const handleExecuteRestore = () => {
    restoreInitialStaff();
    onClose();
    setConfirmText('');
    setIsConfirmedCheckbox(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-rose-200 overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-rose-600 to-red-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <ShieldAlert className="w-5 h-5 text-rose-100" />
            </div>
            <div>
              <h3 className="text-base font-bold">XÁC NHẬN XÓA TOÀN BỘ DANH SÁCH</h3>
              <p className="text-xs text-rose-100">
                Thao tác quản trị cấp cao tại {schoolConfig.shortName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 text-xs">
          {/* Warning Banner */}
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-rose-900 text-sm">Cảnh báo hành động không thể hoàn tác!</div>
              <p className="text-rose-700 text-xs leading-relaxed">
                Hành động này sẽ xóa vĩnh viễn toàn bộ hồ sơ cán bộ, giáo viên, nhân viên hiện tại cùng toàn bộ các điểm ghi nhận phát sinh KPI liên quan.
              </p>
            </div>
          </div>

          {/* Current Counts */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="font-bold text-slate-700 mb-2">Dữ liệu sẽ bị xóa ({staffList.length} nhân sự):</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-white border border-slate-200 rounded-lg">
                <div className="text-[10px] font-semibold text-slate-500">Cán bộ Quản lý</div>
                <div className="text-base font-bold text-amber-600">{bghCount}</div>
              </div>
              <div className="p-2 bg-white border border-slate-200 rounded-lg">
                <div className="text-[10px] font-semibold text-slate-500">Giáo viên</div>
                <div className="text-base font-bold text-blue-600">{gvCount}</div>
              </div>
              <div className="p-2 bg-white border border-slate-200 rounded-lg">
                <div className="text-[10px] font-semibold text-slate-500">Nhân viên</div>
                <div className="text-base font-bold text-purple-600">{nvCount}</div>
              </div>
            </div>
          </div>

          {/* Confirmation Checkbox */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
            <input
              type="checkbox"
              checked={isConfirmedCheckbox}
              onChange={(e) => setIsConfirmedCheckbox(e.target.checked)}
              className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
            />
            <span className="text-slate-700 font-medium leading-tight">
              Tôi đã hiểu rõ và xác nhận xóa toàn bộ {staffList.length} nhân sự khỏi hệ thống.
            </span>
          </label>

          {/* Security Text Input */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Hoặc gõ chữ <span className="font-bold text-rose-600">XÓA HẾT</span> vào ô dưới đây để xác nhận:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Nhập: XÓA HẾT"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-rose-500 focus:border-rose-500 uppercase"
            />
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <button
            onClick={handleExecuteRestore}
            className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-slate-600 hover:text-blue-700 hover:bg-blue-50 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-200"
            title="Khôi phục lại danh sách cán bộ, giáo viên mẫu chuẩn của trường"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi phục dữ liệu mẫu</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              onClick={handleExecuteClear}
              disabled={!isFormValid || staffList.length === 0}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa vĩnh viễn ({staffList.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
