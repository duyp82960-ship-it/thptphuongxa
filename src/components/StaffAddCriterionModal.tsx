import React, { useState, useEffect } from 'react';
import {
  StaffCriteriaConfig,
  saveStaffCriteriaConfig,
} from '../services/staffKpiService';
import {
  OFFICIAL_STAFF_POSITIONS,
  KpiCriterionItem,
} from '../data/kpiEvaluationTemplates';
import { Target, Save, X, AlertCircle } from 'lucide-react';

interface StaffAddCriterionModalProps {
  isOpen: boolean;
  onClose: () => void;
  positionKey: string;
  criteriaConfig: StaffCriteriaConfig;
  onConfigUpdated: (config: StaffCriteriaConfig) => void;
  showToast?: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const StaffAddCriterionModal: React.FC<StaffAddCriterionModalProps> = ({
  isOpen,
  onClose,
  positionKey,
  criteriaConfig,
  onConfigUpdated,
  showToast = (_msg: string, _type?: 'success' | 'error' | 'warning' | 'info') => {},
}) => {
  const currentPosDef = OFFICIAL_STAFF_POSITIONS.find((p) => p.key === positionKey) || OFFICIAL_STAFF_POSITIONS[0];
  const existingList = criteriaConfig.positionCriteriaMap?.[positionKey] || currentPosDef.criteria || [];

  const [formId, setFormId] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formMaxPoints, setFormMaxPoints] = useState<number>(10);
  const [formOrder, setFormOrder] = useState<number>(1);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const prefix = currentPosDef.codePrefix || 'NV';
      const nextIdx = existingList.length + 1;
      setFormId(`${prefix}-${nextIdx}`);
      setFormContent('');
      setFormMaxPoints(10);
      setFormOrder(nextIdx);
      setFormIsActive(true);
      setErrorMsg(null);
    }
  }, [isOpen, positionKey, existingList]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!formId.trim() || !formContent.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ Mã KPI và Nội dung tiêu chí!');
      return;
    }
    if (formMaxPoints <= 0) {
      setErrorMsg('Điểm tối đa phải lớn hơn 0!');
      return;
    }

    // Check duplicate code
    const isDuplicate = existingList.some(
      (c) => c.id.toLowerCase() === formId.trim().toLowerCase()
    );
    if (isDuplicate) {
      setErrorMsg('❌ Mã KPI đã tồn tại trong bộ tiêu chí của vị trí này.');
      return;
    }

    const newItem: KpiCriterionItem = {
      id: formId.trim(),
      section: 'B',
      sectionTitle: `B. KPI VỊ TRÍ VIỆC LÀM: ${currentPosDef.name.toUpperCase()} – 70 ĐIỂM`,
      order: formOrder,
      content: formContent.trim(),
      maxPoints: formMaxPoints,
    };
    (newItem as any).isActive = formIsActive;

    const nextList = [...existingList, newItem];

    // Check total points cannot exceed 70 (Requirement 7)
    const totalActive = Math.round(
      nextList.filter((c: any) => c.isActive !== false).reduce((sum, c) => sum + (c.maxPoints || 0), 0) * 10
    ) / 10;

    if (totalActive > 70) {
      setErrorMsg(`❌ Tổng điểm bộ tiêu chí không được vượt quá 70 điểm. (Hiện tại: ${totalActive}/70 điểm)`);
      return;
    }

    const newConfig = {
      ...criteriaConfig,
      positionCriteriaMap: {
        ...criteriaConfig.positionCriteriaMap,
        [positionKey]: nextList,
      },
    };

    setIsSaving(true);
    setErrorMsg(null);

    try {
      await saveStaffCriteriaConfig(newConfig);
      onConfigUpdated(newConfig);
      showToast('✓ Thêm tiêu chí KPI thành công!', 'success');
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('❌ Không thể thêm tiêu chí KPI.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              ➕
            </div>
            <h3 className="font-black text-sm text-slate-900">
              ➕ THÊM TIÊU CHÍ KPI NHÂN VIÊN
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 font-bold rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">BỘ TIÊU CHÍ / VỊ TRÍ</label>
              <input
                type="text"
                disabled
                value={currentPosDef.name}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">MÃ TIÊU CHÍ *</label>
              <input
                type="text"
                value={formId}
                onChange={(e) => setFormId(e.target.value)}
                placeholder="VD: KT-08"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-black text-purple-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">NỘI DUNG TIÊU CHÍ *</label>
            <textarea
              rows={3}
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="Nhập nội dung tiêu chí..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">ĐIỂM TỐI ĐA *</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="70"
                value={formMaxPoints}
                onChange={(e) => setFormMaxPoints(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-black text-emerald-800 text-center"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">THỨ TỰ</label>
              <input
                type="number"
                min="1"
                value={formOrder}
                onChange={(e) => setFormOrder(parseInt(e.target.value) || 1)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 text-center"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">TRẠNG THÁI</label>
              <select
                value={formIsActive ? 'active' : 'inactive'}
                onChange={(e) => setFormIsActive(e.target.value === 'active')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 cursor-pointer"
              >
                <option value="active">● Đang sử dụng</option>
                <option value="inactive">Ngừng sử dụng</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            HỦY
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-black text-xs shadow-md transition cursor-pointer flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-amber-300" />
                <span>💾 LƯU TIÊU CHÍ</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
