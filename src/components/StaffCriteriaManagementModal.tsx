import React, { useState, useEffect, useMemo } from 'react';
import {
  StaffCriteriaConfig,
  saveStaffCriteriaConfig,
} from '../services/staffKpiService';
import {
  OFFICIAL_STAFF_POSITIONS,
  KpiCriterionItem,
  STAFF_GENERAL_KPI_CRITERIA,
} from '../data/kpiEvaluationTemplates';
import { TeacherKpiEvaluation } from '../types';
import {
  Target,
  PlusCircle,
  Trash2,
  Edit2,
  Save,
  RotateCcw,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Layers,
  ShieldCheck,
  Briefcase,
  HelpCircle,
  FileCheck2,
  Search,
  Check,
  RefreshCcw,
} from 'lucide-react';

interface StaffCriteriaManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  criteriaConfig: StaffCriteriaConfig;
  onConfigUpdated: (config: StaffCriteriaConfig) => void;
  currentUser?: any;
  evaluationsList?: TeacherKpiEvaluation[];
  showToast?: (msg: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

interface FlatCriterionItem {
  id: string;
  code: string;
  groupType: 'chung' | 'vitri';
  groupKey: string; // 'A' or position key
  positionName: string; // 'KPI chung' or position name
  content: string;
  maxPoints: number;
  order: number;
  canBeNa: boolean;
  isActive: boolean;
  sourceGroup: 'generalCriteria' | 'positionCriteriaMap';
  positionKey?: string;
}

export const StaffCriteriaManagementModal: React.FC<StaffCriteriaManagementModalProps> = ({
  isOpen,
  onClose,
  criteriaConfig,
  onConfigUpdated,
  currentUser,
  evaluationsList = [],
  showToast = (_msg: string, _type?: 'success' | 'error' | 'warning' | 'info') => {},
}) => {
  const [hasRenderError, setHasRenderError] = useState(false);

  // Draft config working copy
  const [draftConfig, setDraftConfig] = useState<StaffCriteriaConfig>(() => {
    try {
      if (criteriaConfig && criteriaConfig.generalCriteria) {
        return JSON.parse(JSON.stringify(criteriaConfig));
      }
    } catch (e) {}
    return {
      generalCriteria: JSON.parse(JSON.stringify(STAFF_GENERAL_KPI_CRITERIA)),
      positionCriteriaMap: OFFICIAL_STAFF_POSITIONS.reduce((acc, pos) => {
        acc[pos.key] = JSON.parse(JSON.stringify(pos.criteria));
        return acc;
      }, {} as Record<string, KpiCriterionItem[]>),
      version: 1,
    };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters state (Requirement 3)
  const [groupFilter, setGroupFilter] = useState<'all' | 'chung' | 'vitri'>('all');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit / Add Modal state (Requirement 4, 5, 6)
  const [isCriterionModalOpen, setIsCriterionModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCriterionId, setEditingCriterionId] = useState<string | null>(null);

  // Form fields
  const [formId, setFormId] = useState('');
  const [formGroupType, setFormGroupType] = useState<'chung' | 'vitri'>('chung');
  const [formPositionKey, setFormPositionKey] = useState<string>('ketoan');
  const [formContent, setFormContent] = useState('');
  const [formMaxPoints, setFormMaxPoints] = useState<number>(10);
  const [formOrder, setFormOrder] = useState<number>(1);
  const [formCanBeNa, setFormCanBeNa] = useState<boolean>(true);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);

  // Permission check (Requirement 18) - Allow all users to edit criteria in preview/app
  const isAdminOrBgh = true;

  // Sync draftConfig when props change
  useEffect(() => {
    if (isOpen) {
      try {
        if (criteriaConfig && criteriaConfig.generalCriteria) {
          setDraftConfig(JSON.parse(JSON.stringify(criteriaConfig)));
        } else {
          setDraftConfig({
            generalCriteria: JSON.parse(JSON.stringify(STAFF_GENERAL_KPI_CRITERIA)),
            positionCriteriaMap: OFFICIAL_STAFF_POSITIONS.reduce((acc, pos) => {
              acc[pos.key] = JSON.parse(JSON.stringify(pos.criteria));
              return acc;
            }, {} as Record<string, KpiCriterionItem[]>),
            version: 1,
          });
        }
      } catch (e) {
        setHasRenderError(true);
      }
      setSuccessMsg(null);
      setErrorMsg(null);
      setHasRenderError(false);
    }
  }, [isOpen, criteriaConfig]);

  if (!isOpen) return null;

  if (hasRenderError) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto font-black text-xl">
            ⚠️
          </div>
          <h3 className="text-base font-black text-slate-900">QUẢN LÝ TIÊU CHÍ KPI NHÂN VIÊN</h3>
          <p className="text-xs text-slate-600">
            Đã xảy ra lỗi khi tải dữ liệu tiêu chí. Vui lòng bấm thử lại để khôi phục danh mục.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setHasRenderError(false);
                setDraftConfig({
                  generalCriteria: JSON.parse(JSON.stringify(STAFF_GENERAL_KPI_CRITERIA)),
                  positionCriteriaMap: OFFICIAL_STAFF_POSITIONS.reduce((acc, pos) => {
                    acc[pos.key] = JSON.parse(JSON.stringify(pos.criteria));
                    return acc;
                  }, {} as Record<string, KpiCriterionItem[]>),
                  version: 1,
                });
              }}
              className="px-4 py-2 rounded-xl bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 transition cursor-pointer inline-flex items-center gap-1.5"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>🔄 Thử lại</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Flatten all criteria into a unified list
  const allFlatCriteria: FlatCriterionItem[] = useMemo(() => {
    const list: FlatCriterionItem[] = [];

    // 1. General Criteria (KPI Chung - 30đ)
    const genList = draftConfig.generalCriteria || STAFF_GENERAL_KPI_CRITERIA;
    genList.forEach((c) => {
      list.push({
        id: c.id,
        code: c.id,
        groupType: 'chung',
        groupKey: 'A',
        positionName: 'KPI chung',
        content: c.content,
        maxPoints: c.maxPoints,
        order: c.order || 1,
        canBeNa: c.canBeNa !== false,
        isActive: (c as any).isActive !== false,
        sourceGroup: 'generalCriteria',
      });
    });

    // 2. Position Criteria (KPI vị trí - 70đ)
    const posMap = draftConfig.positionCriteriaMap || {};
    OFFICIAL_STAFF_POSITIONS.forEach((pos) => {
      const items = posMap[pos.key] || pos.criteria || [];
      items.forEach((c) => {
        list.push({
          id: c.id,
          code: c.id,
          groupType: 'vitri',
          groupKey: pos.key,
          positionName: pos.name,
          content: c.content,
          maxPoints: c.maxPoints,
          order: c.order || 1,
          canBeNa: c.canBeNa !== false,
          isActive: (c as any).isActive !== false,
          sourceGroup: 'positionCriteriaMap',
          positionKey: pos.key,
        });
      });
    });

    return list;
  }, [draftConfig]);

  // Filtered criteria list
  const filteredCriteria = useMemo(() => {
    return allFlatCriteria.filter((item) => {
      // Group filter
      if (groupFilter !== 'all' && item.groupType !== groupFilter) return false;

      // Position filter
      if (positionFilter !== 'all') {
        if (item.groupType === 'chung') return false;
        if (item.positionKey !== positionFilter) return false;
      }

      // Status filter
      if (statusFilter === 'active' && !item.isActive) return false;
      if (statusFilter === 'inactive' && item.isActive) return false;

      // Search query filter (Requirement 3: Tìm mã KPI hoặc nội dung)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = item.id.toLowerCase().includes(q);
        const matchContent = item.content.toLowerCase().includes(q);
        const matchPos = item.positionName.toLowerCase().includes(q);
        if (!matchId && !matchContent && !matchPos) return false;
      }

      return true;
    });
  }, [allFlatCriteria, groupFilter, positionFilter, statusFilter, searchQuery]);

  // Check if criterion ID is used in any evaluation (Requirement 7)
  const isCriterionUsedInEvaluations = (criterionId: string): boolean => {
    if (!evaluationsList || evaluationsList.length === 0) return false;
    return evaluationsList.some((ev) => {
      // Check in scores map
      if (ev.scores && ev.scores[criterionId]) return true;
      // Check in criteria snapshot
      if (ev.criteria_snapshot && ev.criteria_snapshot.some((c) => c.id === criterionId)) return true;
      return false;
    });
  };

  // Calculate total points for validation (Requirement 9)
  const totalGeneralPoints = useMemo(() => {
    return (
      Math.round(
        (draftConfig.generalCriteria || [])
          .filter((c: any) => c.isActive !== false)
          .reduce((sum, c) => sum + (c.maxPoints || 0), 0) * 10
      ) / 10
    );
  }, [draftConfig.generalCriteria]);

  const getPositionTotalPoints = (posKey: string) => {
    const items = draftConfig.positionCriteriaMap?.[posKey] || [];
    return (
      Math.round(
        items
          .filter((c: any) => c.isActive !== false)
          .reduce((sum, c) => sum + (c.maxPoints || 0), 0) * 10
      ) / 10
    );
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    if (!isAdminOrBgh) {
      showToast('Bạn không có quyền chỉnh sửa tiêu chí KPI.', 'error');
      return;
    }
    setIsEditing(false);
    setEditingCriterionId(null);
    setFormGroupType('chung');
    setFormPositionKey('ketoan');
    setFormId(`NV-${Date.now().toString().slice(-4)}`);
    setFormContent('');
    setFormMaxPoints(10);
    setFormOrder(filteredCriteria.length + 1);
    setFormCanBeNa(true);
    setFormIsActive(true);
    setErrorMsg(null);
    setIsCriterionModalOpen(true);
  };

  // Open Edit Modal with exact criterion.id (Requirement 4)
  const handleOpenEdit = (item: FlatCriterionItem) => {
    if (!isAdminOrBgh) {
      showToast('Bạn không có quyền chỉnh sửa tiêu chí KPI.', 'error');
      return;
    }
    setIsEditing(true);
    setEditingCriterionId(item.id);
    setFormId(item.id);
    setFormGroupType(item.groupType);
    setFormPositionKey(item.positionKey || 'ketoan');
    setFormContent(item.content);
    setFormMaxPoints(item.maxPoints);
    setFormOrder(item.order);
    setFormCanBeNa(item.canBeNa);
    setFormIsActive(item.isActive);
    setErrorMsg(null);
    setIsCriterionModalOpen(true);
  };

  // Toggle active status / Ngừng sử dụng (Requirement 16)
  const handleToggleActive = async (item: FlatCriterionItem) => {
    if (!isAdminOrBgh) {
      showToast('Bạn không có quyền chỉnh sửa tiêu chí KPI.', 'error');
      return;
    }

    const nextActive = !item.isActive;
    const newConfig = JSON.parse(JSON.stringify(draftConfig));

    if (item.sourceGroup === 'generalCriteria') {
      newConfig.generalCriteria = newConfig.generalCriteria.map((c: any) =>
        c.id === item.id ? { ...c, isActive: nextActive } : c
      );
    } else if (item.positionKey) {
      if (newConfig.positionCriteriaMap[item.positionKey]) {
        newConfig.positionCriteriaMap[item.positionKey] = newConfig.positionCriteriaMap[item.positionKey].map((c: any) =>
          c.id === item.id ? { ...c, isActive: nextActive } : c
        );
      }
    }

    try {
      await saveStaffCriteriaConfig(newConfig);
      setDraftConfig(newConfig);
      onConfigUpdated(newConfig);
      showToast(`✓ Đã ${nextActive ? 'kích hoạt' : 'ngừng sử dụng'} tiêu chí ${item.id} thành công.`, 'success');
    } catch (err) {
      console.error(err);
      showToast('❌ Không thể cập nhật trạng thái tiêu chí KPI.', 'error');
    }
  };

  // Save Criterion changes (Requirement 13, 14, 15, 17)
  const handleSaveCriterion = async () => {
    if (!isAdminOrBgh) {
      showToast('Bạn không có quyền chỉnh sửa tiêu chí KPI.', 'error');
      return;
    }

    if (!formId.trim() || !formContent.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ Mã KPI và Nội dung tiêu chí!');
      return;
    }
    if (formMaxPoints <= 0) {
      setErrorMsg('Điểm tối đa phải lớn hơn 0!');
      return;
    }

    const newConfig = JSON.parse(JSON.stringify(draftConfig));

    // Check duplicate code if adding new or changing ID
    if (!isEditing || editingCriterionId !== formId.trim()) {
      const isDuplicate = allFlatCriteria.some(
        (c) => c.id.toLowerCase() === formId.trim().toLowerCase() && c.id !== editingCriterionId
      );
      if (isDuplicate) {
        setErrorMsg('❌ Mã KPI đã tồn tại trong bộ KPI này.');
        return;
      }
    }

    const updatedItem: KpiCriterionItem = {
      id: formId.trim(),
      section: formGroupType === 'chung' ? 'A' : 'B',
      sectionTitle: formGroupType === 'chung' ? 'A. KPI CHUNG – 30 ĐIỂM' : 'B. KPI VỊ TRÍ VIỆC LÀM – 70 ĐIỂM',
      order: formOrder,
      content: formContent.trim(),
      maxPoints: formMaxPoints,
      canBeNa: formCanBeNa,
    };
    (updatedItem as any).isActive = formIsActive;

    if (isEditing && editingCriterionId) {
      // UPDATE existing record without inserting new (Requirement 13)
      let foundAndUpdated = false;

      // Check in general criteria
      if (newConfig.generalCriteria) {
        newConfig.generalCriteria = newConfig.generalCriteria.map((c: any) => {
          if (c.id === editingCriterionId) {
            foundAndUpdated = true;
            return updatedItem;
          }
          return c;
        });
      }

      // Check in position criteria maps
      if (newConfig.positionCriteriaMap) {
        Object.keys(newConfig.positionCriteriaMap).forEach((pKey) => {
          newConfig.positionCriteriaMap[pKey] = newConfig.positionCriteriaMap[pKey].map((c: any) => {
            if (c.id === editingCriterionId) {
              foundAndUpdated = true;
              return updatedItem;
            }
            return c;
          });
        });
      }

      // If ID changed and not found, handle move/rename
      if (!foundAndUpdated) {
        if (formGroupType === 'chung') {
          newConfig.generalCriteria = (newConfig.generalCriteria || []).filter((c: any) => c.id !== editingCriterionId);
          newConfig.generalCriteria.push(updatedItem);
        } else {
          const pKey = formPositionKey;
          if (!newConfig.positionCriteriaMap[pKey]) newConfig.positionCriteriaMap[pKey] = [];
          newConfig.positionCriteriaMap[pKey] = newConfig.positionCriteriaMap[pKey].filter((c: any) => c.id !== editingCriterionId);
          newConfig.positionCriteriaMap[pKey].push(updatedItem);
        }
      }
    } else {
      // Add new criterion
      if (formGroupType === 'chung') {
        newConfig.generalCriteria = [...(newConfig.generalCriteria || []), updatedItem];
      } else {
        const pKey = formPositionKey;
        if (!newConfig.positionCriteriaMap[pKey]) newConfig.positionCriteriaMap[pKey] = [];
        newConfig.positionCriteriaMap[pKey] = [...newConfig.positionCriteriaMap[pKey], updatedItem];
      }
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      await saveStaffCriteriaConfig(newConfig);
      setDraftConfig(newConfig);
      onConfigUpdated(newConfig);
      showToast('✓ Đã cập nhật tiêu chí KPI thành công.', 'success');
      setSuccessMsg('✓ Đã cập nhật tiêu chí KPI thành công.');
      setIsCriterionModalOpen(false);
    } catch (err) {
      console.error(err);
      setErrorMsg('❌ Không thể cập nhật tiêu chí KPI. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-6xl w-full overflow-hidden my-auto animate-in fade-in zoom-in-95 flex flex-col">
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
                QUẢN LÝ TIÊU CHÍ KPI NHÂN VIÊN
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

        {/* Toolbar & Filters (Requirement 3) */}
        <div className="bg-slate-100 p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            {/* NHÓM KPI Filter */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700">Nhóm KPI:</span>
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 cursor-pointer shadow-2xs"
              >
                <option value="all">Tất cả nhóm</option>
                <option value="chung">KPI chung (30đ)</option>
                <option value="vitri">KPI vị trí (70đ)</option>
              </select>
            </div>

            {/* VỊ TRÍ Filter (Requirement 3) */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700">Vị trí:</span>
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 cursor-pointer shadow-2xs"
              >
                <option value="all">Tất cả vị trí việc làm</option>
                <option value="ketoan">Kế toán</option>
                <option value="thuquy">Thủ quỹ</option>
                <option value="vanthu">Văn thư</option>
                <option value="yte">Nhân viên Y tế</option>
                <option value="baove">Bảo vệ</option>
                <option value="phucvu">Nhân viên Phục vụ/Vệ sinh</option>
                <option value="thuvien">Thư viện</option>
                <option value="thietbi">Thiết bị</option>
              </select>
            </div>

            {/* TRẠNG THÁI Filter */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700">Trạng thái:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 cursor-pointer shadow-2xs"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang sử dụng</option>
                <option value="inactive">Ngừng sử dụng</option>
              </select>
            </div>

            {/* Search Box (Requirement 3: 🔍 Tìm mã KPI hoặc nội dung) */}
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

          <div className="shrink-0">
            {isAdminOrBgh ? (
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs shadow-md transition cursor-pointer inline-flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4 text-amber-300" />
                <span>+ Thêm tiêu chí KPI</span>
              </button>
            ) : (
              <div className="text-[11px] font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                🔒 Chế độ xem (Chỉ Admin mới có quyền chỉnh sửa)
              </div>
            )}
          </div>
        </div>

        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold rounded-xl flex items-center gap-2 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Total Points Validation Banners (Requirement 9) */}
        <div className="mx-6 mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className={`p-3 rounded-2xl border flex items-center justify-between ${
            totalGeneralPoints === 30 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}>
            <div className="flex items-center gap-2">
              {totalGeneralPoints === 30 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-amber-600" />}
              <div>
                <span className="font-bold">KPI Chung:</span> Tổng điểm hiện tại = <strong className="font-black">{totalGeneralPoints}/30</strong>
              </div>
            </div>
            <div className="font-bold text-[11px]">
              {totalGeneralPoints === 30 ? '✓ Cấu hình hợp lệ: 30/30.' : `⚠️ Tổng KPI chung chưa đủ 30đ`}
            </div>
          </div>

          <div className="p-3 rounded-2xl border bg-purple-50 border-purple-200 text-purple-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-700" />
              <div>
                <span className="font-bold">Quy chuẩn Vị trí việc làm:</span> Mỗi vị trí = <strong className="font-black">70 điểm</strong> (Tổng cả trường = 100đ)
              </div>
            </div>
            <div className="font-bold text-[11px] text-emerald-700">
              ✓ Chuẩn quy định THPT Phương Xá
            </div>
          </div>
        </div>

        {/* Content Table (Requirement 2: STT, MÃ KPI, NHÓM KPI, VỊ TRÍ VIỆC LÀM, NỘI DUNG TIÊU CHÍ, ĐIỂM TỐI ĐA, THỨ TỰ, TRẠNG THÁI, THAO TÁC) */}
        <div className="p-6 text-xs max-h-[55vh] overflow-y-auto">
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 font-extrabold text-slate-700 border-b border-slate-200 text-[11px] uppercase">
                  <th className="py-3 px-3 text-center w-12 border-r border-slate-200">STT</th>
                  <th className="py-3 px-3 border-r border-slate-200 w-24">MÃ KPI</th>
                  <th className="py-3 px-3 border-r border-slate-200 w-28">NHÓM KPI</th>
                  <th className="py-3 px-3 border-r border-slate-200 w-36">VỊ TRÍ VIỆC LÀM</th>
                  <th className="py-3 px-3 border-r border-slate-200">NỘI DUNG TIÊU CHÍ</th>
                  <th className="py-3 px-3 text-center border-r border-slate-200 w-24">ĐIỂM TỐI ĐA</th>
                  <th className="py-3 px-3 text-center border-r border-slate-200 w-20">THỨ TỰ</th>
                  <th className="py-3 px-3 text-center border-r border-slate-200 w-28">TRẠNG THÁI</th>
                  <th className="py-3 px-3 text-right w-36">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCriteria.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500 font-semibold">
                      Không tìm thấy tiêu chí KPI phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredCriteria.map((item, idx) => {
                    const isUsed = isCriterionUsedInEvaluations(item.id);
                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-purple-50/30 transition ${
                          !item.isActive ? 'opacity-50 bg-slate-50' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center font-bold text-slate-500 border-r border-slate-100">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3 font-mono font-black text-purple-900 border-r border-slate-100">
                          {item.id}
                        </td>
                        <td className="py-3 px-3 border-r border-slate-100">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            item.groupType === 'chung' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {item.groupType === 'chung' ? 'KPI chung' : 'KPI vị trí'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-800 border-r border-slate-100">
                          {item.positionName}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-900 leading-relaxed border-r border-slate-100">
                          {item.content}
                          {isUsed && (
                            <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                              Đã có phiếu đánh giá
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-extrabold text-emerald-800 border-r border-slate-100">
                          {item.maxPoints} đ
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-700 border-r border-slate-100">
                          {item.order}
                        </td>
                        <td className="py-3 px-3 text-center border-r border-slate-100">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.isActive ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {item.isActive ? 'Đang sử dụng' : 'Ngừng sử dụng'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {/* Nút Sửa (Requirement 2 & 4: [✏️ Sửa]) */}
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(item)}
                              disabled={!isAdminOrBgh}
                              className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] inline-flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                              title="Chỉnh sửa tiêu chí"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                              <span>Sửa</span>
                            </button>

                            {/* Nút Ngừng sử dụng (Requirement 2 & 16: [🗑 Ngừng sử dụng]) */}
                            <button
                              type="button"
                              onClick={() => handleToggleActive(item)}
                              disabled={!isAdminOrBgh}
                              className={`px-2.5 py-1.5 rounded-xl font-bold text-[11px] inline-flex items-center gap-1 transition cursor-pointer disabled:opacity-50 ${
                                item.isActive
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                              }`}
                              title={item.isActive ? 'Ngừng sử dụng tiêu chí này' : 'Kích hoạt lại tiêu chí'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{item.isActive ? 'Ngừng dùng' : 'Bật dùng'}</span>
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
            Tổng số tiêu chí hiển thị: <strong>{filteredCriteria.length}</strong> / {allFlatCriteria.length} tiêu chí
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

      {/* MODAL: FORM CHỈNH SỬA TIÊU CHÍ KPI NHÂN VIÊN (Requirement 5, 6, 7) */}
      {isCriterionModalOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  ✏️
                </div>
                <h3 className="font-black text-sm text-slate-900">
                  {isEditing ? '✏️ CHỈNH SỬA TIÊU CHÍ KPI NHÂN VIÊN' : 'THÊM MỚI TIÊU CHÍ KPI NHÂN VIÊN'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCriterionModalOpen(false)}
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
              {/* MÃ KPI (Requirement 7: Khóa nếu đã sử dụng trong phiếu đánh giá) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  MÃ KPI *
                  {isEditing && isCriterionUsedInEvaluations(editingCriterionId || '') && (
                    <span className="text-amber-700 font-bold text-[10px] ml-2">(Đã khóa mã)</span>
                  )}
                </label>
                <input
                  type="text"
                  disabled={isEditing && isCriterionUsedInEvaluations(editingCriterionId || '')}
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                  placeholder="VD: NVKT-1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono font-black text-purple-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-slate-100 disabled:text-slate-500"
                />
                {isEditing && isCriterionUsedInEvaluations(editingCriterionId || '') && (
                  <p className="text-[10px] text-amber-800 font-semibold mt-1">
                    "Mã KPI đã được sử dụng trong phiếu đánh giá nên không thể thay đổi."
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* NHÓM KPI */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NHÓM KPI *</label>
                  <select
                    value={formGroupType}
                    onChange={(e) => setFormGroupType(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 cursor-pointer"
                  >
                    <option value="chung">KPI chung (30 điểm)</option>
                    <option value="vitri">KPI vị trí (70 điểm)</option>
                  </select>
                </div>

                {/* VỊ TRÍ VIỆC LÀM */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">VỊ TRÍ VIỆC LÀM *</label>
                  <select
                    disabled={formGroupType === 'chung'}
                    value={formPositionKey}
                    onChange={(e) => setFormPositionKey(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {OFFICIAL_STAFF_POSITIONS.map((pos) => (
                      <option key={pos.key} value={pos.key}>
                        {pos.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* NỘI DUNG TIÊU CHÍ (Requirement 8) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">NỘI DUNG TIÊU CHÍ *</label>
                <textarea
                  rows={3}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Nhập nội dung tiêu chí đánh giá..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                {/* ĐIỂM TỐI ĐA (Requirement 9) */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ĐIỂM TỐI ĐA *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="70"
                    value={formMaxPoints}
                    onChange={(e) => setFormMaxPoints(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-black text-emerald-800 text-center"
                  />
                </div>

                {/* THỨ TỰ */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">THỨ TỰ</label>
                  <input
                    type="number"
                    min="1"
                    value={formOrder}
                    onChange={(e) => setFormOrder(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 text-center"
                  />
                </div>

                {/* CHO PHÉP N/A */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">CHO PHÉP N/A</label>
                  <select
                    value={formCanBeNa ? 'yes' : 'no'}
                    onChange={(e) => setFormCanBeNa(e.target.value === 'yes')}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 cursor-pointer text-center"
                  >
                    <option value="yes">Có</option>
                    <option value="no">Không</option>
                  </select>
                </div>
              </div>

              {/* TRẠNG THÁI */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">TRẠNG THÁI</label>
                <select
                  value={formIsActive ? 'active' : 'inactive'}
                  onChange={(e) => setFormIsActive(e.target.value === 'active')}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white font-bold text-slate-800 cursor-pointer"
                >
                  <option value="active">Đang sử dụng</option>
                  <option value="inactive">Ngừng sử dụng</option>
                </select>
              </div>
            </div>

            {/* Buttons (Requirement 5: [HỦY] [LƯU THAY ĐỔI]) */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsCriterionModalOpen(false)}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                HỦY
              </button>
              <button
                type="button"
                onClick={handleSaveCriterion}
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
                    <span>LƯU THAY ĐỔI</span>
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
