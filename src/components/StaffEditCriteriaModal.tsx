import React, { useState, useEffect, useMemo } from 'react';
import {
  StaffCriteriaConfig,
  saveStaffCriteriaConfig,
} from '../services/staffKpiService';
import {
  OFFICIAL_STAFF_POSITIONS,
  KpiCriterionItem,
} from '../data/kpiEvaluationTemplates';
import { Edit2, Save, X, AlertCircle } from 'lucide-react';

interface StaffEditCriteriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  positionKey: string;
  criteriaConfig: StaffCriteriaConfig;
  onConfigUpdated: (config: StaffCriteriaConfig) => void;
  showToast?: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const StaffEditCriteriaModal: React.FC<StaffEditCriteriaModalProps> = ({
  isOpen,
  onClose,
  positionKey,
  criteriaConfig,
  onConfigUpdated,
  showToast = (_msg: string, _type?: 'success' | 'error' | 'warning' | 'info') => {},
}) => {
  const currentPosDef = OFFICIAL_STAFF_POSITIONS.find((p) => p.key === positionKey) || OFFICIAL_STAFF_POSITIONS[0];
  const criteriaList: KpiCriterionItem[] = useMemo(() => {
    const list = criteriaConfig.positionCriteriaMap?.[positionKey] || currentPosDef.criteria || [];
    return [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [criteriaConfig, positionKey, currentPosDef]);

  // Selected criterion for editing individual row
  const [editingItem, setEditingItem] = useState<KpiCriterionItem | null>(null);

  // Form fields
  const [formContent, setFormContent] = useState('');
  const [formMaxPoints, setFormMaxPoints] = useState<number>(10);
  const [formOrder, setFormOrder] = useState<number>(1);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEditingItem(null);
      setErrorMsg(null);
    }
  }, [isOpen, positionKey]);

  if (!isOpen) return null;

  const handleOpenEditItem = (item: KpiCriterionItem) => {
    setEditingItem(item);
    setFormContent(item.content);
    setFormMaxPoints(item.maxPoints);
    setFormOrder(item.order || 1);
    setFormIsActive((item as any).isActive !== false);
    setErrorMsg(null);
  };

  const handleSaveItemUpdate = async () => {
    if (!editingItem) return;
    if (!formContent.trim()) {
      setErrorMsg('Vui lòng nhập nội dung tiêu chí!');
      return;
    }
    if (formMaxPoints <= 0) {
      setErrorMsg('Điểm tối đa phải lớn hơn 0!');
      return;
    }

    const updatedItem: KpiCriterionItem = {
      ...editingItem,
      content: formContent.trim(),
      maxPoints: formMaxPoints,
      order: formOrder,
    };
    (updatedItem as any).isActive = formIsActive;

    const nextList = criteriaList.map((c) => (c.id === editingItem.id ? updatedItem : c));

    // Check total points cannot exceed 70 (Requirement 12 & 13)
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
      showToast(`✓ Cập nhật tiêu chí ${editingItem.id} thành công!`, 'success');
      setEditingItem(null);
    } catch (err) {
      console.error(err);
      setErrorMsg('❌ Không thể cập nhật tiêu chí KPI.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full overflow-hidden my-auto animate-in fade-in zoom-in-95 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-amber-300 font-black">
              ✏️
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-purple-200">
                QUẢN TRỊ DANH MỤC • TRƯỜNG THPT PHƯƠNG XÁ
              </div>
              <h2 className="text-base sm:text-lg font-black text-white">
                ✏️ SỬA TIÊU CHÍ KPI – {currentPosDef.name.toUpperCase()}
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

        {/* Content List or Edit Form */}
        <div className="p-6 text-xs max-h-[60vh] overflow-y-auto">
          {editingItem ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4 max-w-xl mx-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="font-black text-sm text-slate-900">✏️ CHỈNH SỬA TIÊU CHÍ KPI: {editingItem.id}</h3>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="text-xs font-bold text-purple-700 hover:underline cursor-pointer"
                >
                  ← Quay lại danh sách
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
                    <label className="block font-bold text-slate-700 mb-1">MÃ KPI (Cố định)</label>
                    <input
                      type="text"
                      disabled
                      value={editingItem.id}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 font-mono font-bold text-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">VỊ TRÍ</label>
                    <input
                      type="text"
                      disabled
                      value={currentPosDef.name}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 font-bold text-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">NỘI DUNG TIÊU CHÍ *</label>
                  <textarea
                    rows={3}
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
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

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  disabled={isSaving}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  HỦY
                </button>
                <button
                  type="button"
                  onClick={handleSaveItemUpdate}
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
                      <span>💾 LƯU THAY ĐỔI</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 font-extrabold text-slate-700 border-b border-slate-200 text-[11px] uppercase">
                    <th className="py-3 px-3 text-center w-12 border-r border-slate-200">STT</th>
                    <th className="py-3 px-3 border-r border-slate-200 w-24">MÃ</th>
                    <th className="py-3 px-3 border-r border-slate-200">NỘI DUNG</th>
                    <th className="py-3 px-3 text-center border-r border-slate-200 w-24">ĐIỂM</th>
                    <th className="py-3 px-3 text-center border-r border-slate-200 w-28">TRẠNG THÁI</th>
                    <th className="py-3 px-3 text-right w-28">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {criteriaList.map((item, idx) => {
                    const isActive = (item as any).isActive !== false;
                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-purple-50/30 transition ${!isActive ? 'opacity-50 bg-slate-50' : ''}`}
                      >
                        <td className="py-3 px-3 text-center font-bold text-slate-500 border-r border-slate-100">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3 font-mono font-black text-purple-900 border-r border-slate-100">
                          {item.id}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-900 leading-relaxed border-r border-slate-100">
                          {item.content}
                        </td>
                        <td className="py-3 px-3 text-center font-extrabold text-emerald-800 border-r border-slate-100">
                          {item.maxPoints} đ
                        </td>
                        <td className="py-3 px-3 text-center border-r border-slate-100">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {isActive ? 'Đang sử dụng' : 'Ngừng dùng'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenEditItem(item)}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] inline-flex items-center gap-1 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>✏️ Sửa</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 italic">
            Danh mục vị trí: <strong>{currentPosDef.name}</strong> ({criteriaList.length} tiêu chí)
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
