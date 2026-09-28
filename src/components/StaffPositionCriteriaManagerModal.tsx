import React, { useState, useEffect, useMemo } from 'react';
import {
  StaffCriteriaConfig,
  saveStaffCriteriaConfig,
} from '../services/staffKpiService';
import {
  OFFICIAL_STAFF_POSITIONS,
  KpiCriterionItem,
} from '../data/kpiEvaluationTemplates';
import {
  Target,
  PlusCircle,
  Trash2,
  Edit2,
  Save,
  X,
  AlertCircle,
  Search,
} from 'lucide-react';

interface StaffPositionCriteriaManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  criteriaConfig: StaffCriteriaConfig;
  onConfigUpdated: (config: StaffCriteriaConfig) => void;
  initialPositionKey?: string;
  showToast?: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export const StaffPositionCriteriaManagerModal: React.FC<StaffPositionCriteriaManagerModalProps> = ({
  isOpen,
  onClose,
  criteriaConfig,
  onConfigUpdated,
  initialPositionKey = 'ketoan',
  showToast = (_msg: string, _type?: 'success' | 'error' | 'warning' | 'info') => {},
}) => {
  const [selectedPosKey, setSelectedPosKey] = useState<string>(initialPositionKey);
  const [draftConfig, setDraftConfig] = useState<StaffCriteriaConfig>(() => JSON.parse(JSON.stringify(criteriaConfig)));
  
  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Item Modal state (Add / Edit)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form fields
  const [formId, setFormId] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formMaxPoints, setFormMaxPoints] = useState<number>(10);
  const [formOrder, setFormOrder] = useState<number>(1);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      console.log('[DEBUG] Open Employee KPI Criteria Manager');
      setDraftConfig(JSON.parse(JSON.stringify(criteriaConfig)));
      if (initialPositionKey) {
        setSelectedPosKey(initialPositionKey);
        console.log('[DEBUG] Selected position:', initialPositionKey);
      }
      setSearchQuery('');
      setErrorMsg(null);
    }
  }, [isOpen, criteriaConfig, initialPositionKey]);

  useEffect(() => {
    console.log('[DEBUG] Selected position changed:', selectedPosKey);
  }, [selectedPosKey]);

  if (!isOpen) return null;

  const currentPosDef = OFFICIAL_STAFF_POSITIONS.find((p) => p.key === selectedPosKey) || OFFICIAL_STAFF_POSITIONS[0];

  const currentCriteriaList: KpiCriterionItem[] = useMemo(() => {
    const list = draftConfig.positionCriteriaMap?.[selectedPosKey] || currentPosDef.criteria || [];
    // Sort by order ASC (Requirement 20)
    return [...list].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [draftConfig, selectedPosKey, currentPosDef]);

  // Filtered list
  const filteredCriteria = useMemo(() => {
    return currentCriteriaList.filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return item.id.toLowerCase().includes(q) || item.content.toLowerCase().includes(q);
    });
  }, [currentCriteriaList, searchQuery]);

  // Total points for current position
  const currentTotalPoints = useMemo(() => {
    return Math.round(
      currentCriteriaList
        .filter((c: any) => c.isActive !== false)
        .reduce((sum, c) => sum + (c.maxPoints || 0), 0) * 10
    ) / 10;
  }, [currentCriteriaList]);

  const isPointsValid = currentTotalPoints === 70;

  // Open Add Modal
  const handleOpenAdd = () => {
    console.log('[DEBUG] Add criterion modal opened for position:', currentPosDef.name);
    setIsEditing(false);
    setEditingId(null);
    const prefix = currentPosDef.codePrefix || 'NV';
    const nextIdx = currentCriteriaList.length + 1;
    setFormId(`${prefix}-${nextIdx}`);
    setFormContent('');
    setFormMaxPoints(10);
    setFormOrder(nextIdx);
    setFormIsActive(true);
    setErrorMsg(null);
    setIsItemModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: KpiCriterionItem) => {
    console.log('[DEBUG] Edit criterion ID:', item.id);
    setIsEditing(true);
    setEditingId(item.id);
    setFormId(item.id);
    setFormContent(item.content);
    setFormMaxPoints(item.maxPoints);
    setFormOrder(item.order || 1);
    setFormIsActive((item as any).isActive !== false);
    setErrorMsg(null);
    setIsItemModalOpen(true);
  };

  // Toggle active status (Ngừng sử dụng)
  const handleToggleActive = async (id: string) => {
    console.log('[DEBUG] Deactivate / toggle criterion ID:', id);
    const updated = currentCriteriaList.map((c) => {
      if (c.id === id) {
        return { ...c, isActive: !(c as any).isActive };
      }
      return c;
    });

    const newConfig = {
      ...draftConfig,
      positionCriteriaMap: {
        ...draftConfig.positionCriteriaMap,
        [selectedPosKey]: updated,
      },
    };

    try {
      await saveStaffCriteriaConfig(newConfig);
      console.log('[DEBUG] Database result for toggle:', newConfig);
      setDraftConfig(newConfig);
      onConfigUpdated(newConfig);
      showToast('✓ Đã cập nhật trạng thái tiêu chí thành công.', 'success');
    } catch (err) {
      console.error(err);
      showToast('❌ Không thể cập nhật trạng thái tiêu chí.', 'error');
    }
  };

  // Save Item (Add or Edit) - Enforce exact 70 points rule (Requirement 14)
  const handleSaveItem = async () => {
    if (!formId.trim() || !formContent.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ Mã KPI và Nội dung tiêu chí!');
      return;
    }
    if (formMaxPoints <= 0) {
      setErrorMsg('Điểm tối đa phải lớn hơn 0!');
      return;
    }

    // Check duplicate code in this position
    if (!isEditing || editingId !== formId.trim()) {
      const isDuplicate = currentCriteriaList.some(
        (c) => c.id.toLowerCase() === formId.trim().toLowerCase() && c.id !== editingId
      );
      if (isDuplicate) {
        setErrorMsg('❌ Mã KPI đã tồn tại trong bộ tiêu chí của vị trí này.');
        return;
      }
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

    let nextList: KpiCriterionItem[];
    if (isEditing && editingId) {
      console.log('[DEBUG] Update criterion ID:', editingId);
      nextList = currentCriteriaList.map((c) => (c.id === editingId ? newItem : c));
    } else {
      console.log('[DEBUG] Add new criterion ID:', newItem.id);
      nextList = [...currentCriteriaList, newItem];
    }

    // Validate Total Points must be exactly 70 (Requirement 13 & 14)
    const previewTotal = Math.round(
      nextList.filter((c: any) => c.isActive !== false).reduce((sum, c) => sum + (c.maxPoints || 0), 0) * 10
    ) / 10;

    if (previewTotal !== 70) {
      setErrorMsg(`⚠️ Tổng điểm bộ tiêu chí phải bằng đúng 70 điểm. (Hiện tại: ${previewTotal}/70 điểm)`);
      return;
    }

    const newConfig = {
      ...draftConfig,
      positionCriteriaMap: {
        ...draftConfig.positionCriteriaMap,
        [selectedPosKey]: nextList,
      },
    };

    setIsSaving(true);
    setErrorMsg(null);

    try {
      await saveStaffCriteriaConfig(newConfig);
      console.log('[DEBUG] Database result saved successfully:', newConfig);
      setDraftConfig(newConfig);
      onConfigUpdated(newConfig);
      showToast('✓ Đã lưu thay đổi tiêu chí KPI thành công!', 'success');
      setIsItemModalOpen(false);
    } catch (err) {
      console.error(err);
      setErrorMsg('❌ Không thể lưu tiêu chí KPI. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-5xl w-full overflow-hidden my-auto animate-in fade-in zoom-in-95 flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-amber-300 font-black">
              <Target className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-purple-200">
                QUẢN TRỊ DANH MỤC • TRƯỜNG THPT PHƯƠNG XÁ
              </div>
              <h2 className="text-base sm:text-lg font-black text-white">
                ⚙️ QUẢN LÝ TIÊU CHÍ KPI NHÂN VIÊN
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

        {/* Toolbar & Position Selector */}
        <div className="bg-slate-100 p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Bộ tiêu chí:</span>
              <select
                value={selectedPosKey}
                onChange={(e) => setSelectedPosKey(e.target.value)}
                className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white font-black text-purple-900 cursor-pointer shadow-2xs"
              >
                <option value="ketoan">📊 Tiêu chí nhân viên Kế toán</option>
                <option value="vanthu">📁 Tiêu chí nhân viên Văn thư</option>
                <option value="yte">🏥 Tiêu chí nhân viên Y tế</option>
                <option value="thuvien">📚 Tiêu chí nhân viên Thư viện</option>
                <option value="baove">🛡️ Tiêu chí nhân viên Bảo vệ</option>
                <option value="phucvu">🧹 Tiêu chí nhân viên Phục vụ/Vệ sinh</option>
                <option value="thietbi">🔬 Tiêu chí nhân viên Thiết bị</option>
              </select>
            </div>

            {/* Search Box */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Tìm mã KPI hoặc nội dung..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className={`px-3 py-1.5 rounded-xl font-black text-xs border ${
              isPointsValid ? 'bg-emerald-50 border-emerald-300 text-emerald-900' : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}>
              Tổng điểm: {currentTotalPoints}/70 {isPointsValid ? '✓' : '⚠️'}
            </div>
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs shadow-md transition cursor-pointer inline-flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4 text-amber-300" />
              <span>+ THÊM TIÊU CHÍ</span>
            </button>
          </div>
        </div>

        {/* Validation banner */}
        {!isPointsValid && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-300 text-amber-900 font-bold rounded-xl flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              ⚠️ Tổng điểm bộ tiêu chí {currentPosDef.name} hiện tại là {currentTotalPoints}/70 điểm. Yêu cầu tổng điểm bộ tiêu chí phải bằng đúng 70 điểm trước khi lưu cấu hình.
            </span>
          </div>
        )}

        {/* Content Table */}
        <div className="p-6 text-xs max-h-[55vh] overflow-y-auto">
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 font-extrabold text-slate-700 border-b border-slate-200 text-[11px] uppercase">
                  <th className="py-3 px-3 text-center w-12 border-r border-slate-200">STT</th>
                  <th className="py-3 px-3 border-r border-slate-200 w-24">MÃ</th>
                  <th className="py-3 px-3 border-r border-slate-200">NỘI DUNG</th>
                  <th className="py-3 px-3 text-center border-r border-slate-200 w-24">ĐIỂM</th>
                  <th className="py-3 px-3 text-center border-r border-slate-200 w-28">TRẠNG THÁI</th>
                  <th className="py-3 px-3 text-right w-36">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCriteria.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-semibold">
                      Không tìm thấy tiêu chí KPI nào cho bộ {currentPosDef.name}.
                    </td>
                  </tr>
                ) : (
                  filteredCriteria.map((item, idx) => {
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
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] inline-flex items-center gap-1 transition cursor-pointer"
                              title="Sửa tiêu chí"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                              <span>✏️ Sửa</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleActive(item.id)}
                              className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] inline-flex items-center gap-1 transition cursor-pointer ${
                                isActive ? 'bg-rose-50 hover:bg-rose-100 text-rose-700' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                              }`}
                              title={isActive ? 'Ngừng sử dụng tiêu chí' : 'Kích hoạt lại'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{isActive ? 'Ngừng dùng' : 'Bật dùng'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 italic">
            Bộ tiêu chí hiện tại: <strong>{currentPosDef.name}</strong> ({currentCriteriaList.length} tiêu chí) • Tổng: {currentTotalPoints}/70đ
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

      {/* MODAL: ADD / EDIT CRITERION ITEM */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  {isEditing ? '✏️' : '➕'}
                </div>
                <h3 className="font-black text-sm text-slate-900">
                  {isEditing ? '✏️ SỬA TIÊU CHÍ KPI' : '➕ THÊM TIÊU CHÍ KPI'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
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
                  <label className="block font-bold text-slate-700 mb-1">MÃ KPI *</label>
                  <input
                    type="text"
                    disabled={isEditing}
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    placeholder="VD: NVKT-8"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-black text-purple-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">VỊ TRÍ (Cố định)</label>
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
                    <option value="active">Đang sử dụng</option>
                    <option value="inactive">Ngừng sử dụng</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsItemModalOpen(false)}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                HỦY
              </button>
              <button
                type="button"
                onClick={handleSaveItem}
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
      )}
    </div>
  );
};
