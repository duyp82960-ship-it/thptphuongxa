import React, { useState, useMemo, useEffect } from 'react';
import { useKpi } from '../context/KpiContext';
import { KpiCriterionItem } from '../data/kpiEvaluationTemplates';
import {
  X,
  PlusCircle,
  Edit2,
  Trash2,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  ListOrdered,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Layers,
  HelpCircle,
  FileText,
  Shield,
  Briefcase,
  GraduationCap,
  FileSpreadsheet,
} from 'lucide-react';
import {
  exportCriteriaSetToExcel,
  exportCriteriaSetToWord,
} from '../utils/exportUtils';

interface CriteriaEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTargetType?: 'bgh' | 'giaovien' | 'nhanvien';
}

export const CriteriaEditorModal: React.FC<CriteriaEditorModalProps> = ({
  isOpen,
  onClose,
  initialTargetType = 'giaovien',
}) => {
  const {
    getCriteriaListForTarget,
    updateCriteriaSetForTarget,
    getCriteriaVersion,
    evaluationsList,
    showToast,
    currentUser,
    schoolConfig,
  } = useKpi();

  const [targetType, setTargetType] = useState<'bgh' | 'giaovien' | 'nhanvien'>(initialTargetType);

  // Synchronize target type when modal opens or prop changes
  useEffect(() => {
    if (isOpen) {
      setTargetType(initialTargetType);
    }
  }, [isOpen, initialTargetType]);

  const currentVersion = useMemo(() => {
    return getCriteriaVersion(targetType);
  }, [getCriteriaVersion, targetType]);

  // Working draft list for criteria items
  const [workingList, setWorkingDraft] = useState<KpiCriterionItem[]>([]);
  const [filterSection, setFilterSection] = useState<string>('all');
  const [showInactive, setShowInactive] = useState<boolean>(false);

  // Form modal state
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<KpiCriterionItem | null>(null);

  // Delete confirmation modal state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Export modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [exportTargetType, setExportTargetType] = useState<'bgh' | 'giaovien' | 'nhanvien'>('giaovien');
  const [exportScope, setExportScope] = useState<'all' | 'section' | 'display'>('all');
  const [exportSelectedSection, setExportSelectedSection] = useState<string>('all');
  const [exportFormat, setExportFormat] = useState<'word' | 'excel'>('excel');

  // Form fields
  const [formSection, setFormSection] = useState<string>('I');
  const [formSectionTitle, setFormSectionTitle] = useState<string>('CHÍNH TRỊ TƯ TƯỞNG, ĐẠO ĐỨC LỐI SỐNG');
  const [formGroupTitle, setFormGroupTitle] = useState<string>('');
  const [formOrder, setFormOrder] = useState<number>(1);
  const [formId, setFormId] = useState<string>('');
  const [formContent, setFormContent] = useState<string>('');
  const [formMaxPoints, setFormMaxPoints] = useState<number>(5);
  const [formEvidence, setFormEvidence] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');

  // Load criteria for targetType into working draft whenever modal opens or targetType changes
  useEffect(() => {
    if (isOpen) {
      const activeList = getCriteriaListForTarget(targetType);
      setWorkingDraft(JSON.parse(JSON.stringify(activeList)));
    }
  }, [isOpen, targetType, getCriteriaListForTarget]);

  // Available sections based on targetType
  const sectionOptions = useMemo(() => {
    if (targetType === 'nhanvien') {
      return [
        { key: 'A', title: 'A. KPI CHUNG (30 ĐIỂM)' },
        { key: 'B', title: 'B. KPI VỊ TRÍ VIỆC LÀM (70 ĐIỂM)' },
      ];
    }
    return [
      { key: 'I', title: 'I. CHÍNH TRỊ TƯ TƯỞNG, ĐẠO ĐỨC LỐI SỐNG (15 ĐIỂM)' },
      { key: 'II', title: 'II. TÁC PHONG, LỀ LỐI LÀM VIỆC, Ý THỨC TỔ CHỨC KỶ LUẬT (15 ĐIỂM)' },
      { key: 'III.1', title: 'III.1 NĂNG LỰC VÀ KỸ NĂNG LÀM VIỆC (10 ĐIỂM)' },
      {
        key: 'III.2',
        title:
          targetType === 'bgh'
            ? 'III.2 KẾT QUẢ THỰC HIỆN NHIỆM VỤ QUẢN LÝ (60 ĐIỂM)'
            : 'III.2 KẾT QUẢ THỰC HIỆN NHIỆM VỤ ĐƯỢC GIAO (60 ĐIỂM)',
      },
    ];
  }, [targetType]);

  // Live Section Breakdown Subtotals
  const sectionTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    sectionOptions.forEach((sec) => {
      totals[sec.key] = 0;
    });

    workingList.forEach((item) => {
      if (item.status !== 'inactive') {
        const secKey = item.section || 'III.2';
        totals[secKey] = (totals[secKey] || 0) + (Number(item.maxPoints) || 0);
      }
    });

    // Round values to 1 decimal place
    Object.keys(totals).forEach((k) => {
      totals[k] = Math.round(totals[k] * 10) / 10;
    });

    return totals;
  }, [workingList, sectionOptions]);

  const grandTotal = useMemo(() => {
    const vals = Object.values(sectionTotals) as number[];
    const sum = vals.reduce((a: number, b: number) => a + b, 0);
    return Math.round(sum * 10) / 10;
  }, [sectionTotals]);

  // Check validation rules
  const validationStatus = useMemo(() => {
    if (targetType === 'nhanvien') {
      const isAValid = sectionTotals['A'] === 30;
      const isBValid = sectionTotals['B'] === 70;
      const isGrandValid = grandTotal === 100;
      return {
        isValid: isAValid && isBValid && isGrandValid,
        sectionIII2Max: 0,
        grandTotal,
        message: !isGrandValid
          ? `CẢNH BÁO: Tổng điểm KPI Nhân viên = ${grandTotal}/100 điểm (Nhóm A = ${sectionTotals['A'] || 0}/30, Nhóm B = ${sectionTotals['B'] || 0}/70).`
          : '',
      };
    }

    const isIValid = sectionTotals['I'] === 15;
    const isIIValid = sectionTotals['II'] === 15;
    const isIII1Valid = sectionTotals['III.1'] === 10;
    const isIII2Valid = sectionTotals['III.2'] === 60;
    const isGrandValid = grandTotal === 100;

    let message = '';
    if (!isIII2Valid) {
      message = `CẢNH BÁO: Nhóm III.2 hiện có ${sectionTotals['III.2'] || 0}/60 điểm (Yêu cầu bắt buộc bằng đúng 60 điểm).`;
    } else if (!isGrandValid) {
      message = `CẢNH BÁO: Tổng điểm KPI hiện tại = ${grandTotal}/100 điểm (I=${sectionTotals['I'] || 0}, II=${sectionTotals['II'] || 0}, III.1=${sectionTotals['III.1'] || 0}, III.2=${sectionTotals['III.2'] || 0}).`;
    }

    return {
      isValid: isIValid && isIIValid && isIII1Valid && isIII2Valid && isGrandValid,
      sectionIII2Max: sectionTotals['III.2'] || 0,
      grandTotal,
      message,
    };
  }, [targetType, sectionTotals, grandTotal]);

  // Display criteria list filtered by section
  const displayCriteria = useMemo(() => {
    return workingList.filter((item) => {
      const matchesSection = filterSection === 'all' || item.section === filterSection;
      const matchesActive = showInactive || item.status !== 'inactive';
      return matchesSection && matchesActive;
    });
  }, [workingList, filterSection, showInactive]);

  // Available sections for export modal based on exportTargetType
  const exportSectionOptions = useMemo(() => {
    if (exportTargetType === 'nhanvien') {
      return [
        { key: 'A', title: 'Mục A. KPI CHUNG (30 ĐIỂM)' },
        { key: 'B', title: 'Mục B. KPI VỊ TRÍ VIỆC LÀM (70 ĐIỂM)' },
      ];
    }
    return [
      { key: 'I', title: 'Mục I. CHÍNH TRỊ TƯ TƯỞNG, ĐẠO ĐỨC LỐI SỐNG (15 ĐIỂM)' },
      { key: 'II', title: 'Mục II. TÁC PHONG, LỀ LỐI LÀM VIỆC, Ý THỨC TỔ CHỨC KỶ LUẬT (15 ĐIỂM)' },
      { key: 'III.1', title: 'Mục III.1 NĂNG LỰC VÀ KỸ NĂNG LÀM VIỆC (10 ĐIỂM)' },
      {
        key: 'III.2',
        title:
          exportTargetType === 'bgh'
            ? 'Mục III.2 KẾT QUẢ THỰC HIỆN NHIỆM VỤ QUẢN LÝ (60 ĐIỂM)'
            : 'Mục III.2 KẾT QUẢ THỰC HIỆN NHIỆM VỤ ĐƯỢC GIAO (60 ĐIỂM)',
      },
    ];
  }, [exportTargetType]);

  // Target criteria list for export calculation
  const exportCriteriaListToExport = useMemo(() => {
    const base = exportTargetType === targetType ? workingList : getCriteriaListForTarget(exportTargetType);
    if (exportScope === 'all') {
      return base;
    }
    if (exportScope === 'section') {
      if (exportSelectedSection === 'all') return base;
      return base.filter((c) => c.section === exportSelectedSection);
    }
    if (exportScope === 'display') {
      if (exportTargetType === targetType) return displayCriteria;
      return base.filter((c) => c.status !== 'inactive');
    }
    return base;
  }, [exportTargetType, targetType, workingList, getCriteriaListForTarget, exportScope, exportSelectedSection, displayCriteria]);

  // Entire target set total points
  const entireTargetSetTotalPoints = useMemo(() => {
    const base = exportTargetType === targetType ? workingList : getCriteriaListForTarget(exportTargetType);
    const sum = base.reduce((acc, item) => {
      if (item.status !== 'inactive') {
        return acc + (Number(item.maxPoints) || 0);
      }
      return acc;
    }, 0);
    return Math.round(sum * 10) / 10;
  }, [exportTargetType, targetType, workingList, getCriteriaListForTarget]);

  // Open Export Modal
  const handleOpenExportModal = () => {
    setExportTargetType(targetType);
    setExportScope('all');
    if (filterSection !== 'all') {
      setExportSelectedSection(filterSection);
    } else {
      setExportSelectedSection(targetType === 'nhanvien' ? 'A' : 'I');
    }
    setExportFormat('excel');
    setIsExportModalOpen(true);
  };

  // Execute Export File
  const handleExecuteExport = async () => {
    if (exportCriteriaListToExport.length === 0) {
      showToast('Không có tiêu chí nào thỏa mãn phạm vi đã chọn.', 'error');
      return;
    }

    const targetTitle =
      exportTargetType === 'giaovien'
        ? 'KPI Giáo viên'
        : exportTargetType === 'bgh'
        ? 'KPI Cán bộ Quản lý'
        : 'KPI Nhân viên';

    let scopeTitle = 'Toàn bộ tiêu chí';
    if (exportScope === 'section') {
      const secObj = exportSectionOptions.find((s) => s.key === exportSelectedSection);
      scopeTitle = secObj ? secObj.title : `Nhóm ${exportSelectedSection}`;
    } else if (exportScope === 'display') {
      scopeTitle = 'Các tiêu chí đang hiển thị';
    }

    const schoolName = schoolConfig?.fullName || 'TRƯỜNG THPT PHƯƠNG XÁ';
    const targetVersion = getCriteriaVersion(exportTargetType);

    try {
      if (exportFormat === 'excel') {
        exportCriteriaSetToExcel({
          schoolName,
          targetType: exportTargetType,
          targetTitle,
          criteriaList: exportCriteriaListToExport,
          scopeTitle,
          version: targetVersion,
          evalPeriod: 'Năm học 2026 - 2027',
        });
        showToast(`Đã xuất thành công bộ tiêu chí [${targetTitle}] ra file Excel (.xlsx)!`, 'success');
      } else {
        await exportCriteriaSetToWord({
          schoolName,
          targetType: exportTargetType,
          targetTitle,
          criteriaList: exportCriteriaListToExport,
          scopeTitle,
          version: targetVersion,
          evalPeriod: 'Năm học 2026 - 2027',
        });
        showToast(`Đã xuất thành công bộ tiêu chí [${targetTitle}] ra file Word (.docx)!`, 'success');
      }

      setIsExportModalOpen(false);
    } catch (err) {
      console.error('Lỗi khi xuất file bộ tiêu chí:', err);
      showToast('Có lỗi xảy ra khi tạo file xuất. Vui lòng thử lại.', 'error');
    }
  };

  // Open Form to Add New Criterion
  const handleOpenAdd = (secKey?: string) => {
    setEditingItem(null);
    const targetSec = secKey || (sectionOptions[0] ? sectionOptions[0].key : 'I');
    const secObj = sectionOptions.find((s) => s.key === targetSec);

    setFormSection(targetSec);
    setFormSectionTitle(secObj ? secObj.title : '');
    setFormGroupTitle('');

    // Generate next order number
    const maxOrd = workingList.reduce((max, c) => (c.order > max ? c.order : max), 0);
    setFormOrder(maxOrd + 1);

    // Auto generate code
    setFormId(`${targetSec}.${maxOrd + 1}`);
    setFormContent('');
    setFormMaxPoints(5);
    setFormEvidence('Hồ sơ minh chứng cập nhật đầy đủ trên phần mềm quản lý');
    setFormDescription('');
    setFormStatus('active');
    setIsFormOpen(true);
  };

  // Open Form to Edit Existing Criterion
  const handleOpenEdit = (item: KpiCriterionItem) => {
    setEditingItem(item);
    setFormSection(item.section || 'I');
    setFormSectionTitle(item.sectionTitle || '');
    setFormGroupTitle(item.groupTitle || '');
    setFormOrder(item.order || 1);
    setFormId(item.id);
    setFormContent(item.content);
    setFormMaxPoints(item.maxPoints);
    setFormEvidence(item.evidence || '');
    setFormDescription(item.description || '');
    setFormStatus(item.status || 'active');
    setIsFormOpen(true);
  };

  // Handle Form Submit (Add or Edit)
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formContent.trim()) {
      showToast('Nội dung tiêu chí không được để trống.', 'error');
      return;
    }

    if (formMaxPoints <= 0) {
      showToast('Điểm tối đa phải lớn hơn 0.', 'error');
      return;
    }

    // Check Section III.2 score limit rule
    if (
      (targetType === 'giaovien' || targetType === 'bgh') &&
      formSection === 'III.2' &&
      formStatus === 'active'
    ) {
      const otherItemsIII2Sum = workingList
        .filter(
          (c) =>
            c.section === 'III.2' &&
            c.status !== 'inactive' &&
            (!editingItem || c.id !== editingItem.id)
        )
        .reduce((sum, c) => sum + Number(c.maxPoints), 0);

      const potentialNewIII2Sum = Math.round((otherItemsIII2Sum + Number(formMaxPoints)) * 10) / 10;

      if (potentialNewIII2Sum > 60) {
        showToast(
          `Không thể lưu tiêu chí! Tổng điểm nhóm III.2 sẽ vượt quá 60 điểm (Hiện tại: ${otherItemsIII2Sum} + ${formMaxPoints} = ${potentialNewIII2Sum}đ).`,
          'error'
        );
        return;
      }
    }

    const newItem: KpiCriterionItem = {
      id: formId.trim() || `TC_${Date.now()}`,
      section: formSection,
      sectionTitle: formSectionTitle,
      groupTitle: formGroupTitle.trim() || undefined,
      order: Number(formOrder) || 1,
      content: formContent.trim(),
      maxPoints: Number(formMaxPoints) || 1,
      evidence: formEvidence.trim() || undefined,
      description: formDescription.trim() || undefined,
      status: formStatus,
    };

    if (editingItem) {
      // Edit existing
      setWorkingDraft((prev) =>
        prev.map((item) => (item.id === editingItem.id ? newItem : item))
      );
      showToast(`Đã cập nhật tiêu chí [${newItem.id}]!`, 'success');
    } else {
      // Check duplicate ID
      if (workingList.some((c) => c.id === newItem.id)) {
        showToast(`Mã tiêu chí [${newItem.id}] đã tồn tại. Vui lòng chọn mã khác.`, 'error');
        return;
      }
      setWorkingDraft((prev) => [...prev, newItem]);
      showToast(`Đã thêm tiêu chí mới [${newItem.id}] vào nhóm ${formSection}!`, 'success');
    }

    setIsFormOpen(false);
  };

  // Handle Delete Criterion
  const handleDeleteCriterion = (idToDelete: string) => {
    const item = workingList.find((c) => c.id === idToDelete);
    if (!item) return;

    // Check if criterion ID is referenced in existing evaluation sheets
    const isUsedInEvaluations = evaluationsList.some((ev) => {
      if (ev.targetType !== targetType) return false;
      return ev.scores && ev.scores[idToDelete] !== undefined;
    });

    if (isUsedInEvaluations) {
      // Soft delete: set status to inactive to preserve evaluation history
      setWorkingDraft((prev) =>
        prev.map((c) => (c.id === idToDelete ? { ...c, status: 'inactive' } : c))
      );
      showToast(
        `Tiêu chí [${idToDelete}] đã được sử dụng trong phiếu đánh giá nên được chuyển sang trạng thái Ngưng sử dụng (Inactive) để bảo toàn lịch sử!`,
        'info'
      );
    } else {
      // Hard delete from working draft
      setWorkingDraft((prev) => prev.filter((c) => c.id !== idToDelete));
      showToast(`Đã xóa tiêu chí [${idToDelete}] khỏi bộ tiêu chí!`, 'success');
    }

    setDeletingId(null);
  };

  // Move Order Up or Down
  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= displayCriteria.length) return;

    const listCopy = [...workingList];
    const currentId = displayCriteria[index].id;
    const swapId = displayCriteria[targetIdx].id;

    const currentRealIdx = listCopy.findIndex((c) => c.id === currentId);
    const swapRealIdx = listCopy.findIndex((c) => c.id === swapId);

    if (currentRealIdx !== -1 && swapRealIdx !== -1) {
      const tempOrder = listCopy[currentRealIdx].order;
      listCopy[currentRealIdx].order = listCopy[swapRealIdx].order;
      listCopy[swapRealIdx].order = tempOrder;

      // Sort list by order
      listCopy.sort((a, b) => a.order - b.order);
      setWorkingDraft(listCopy);
    }
  };

  // Save New Criteria Set Version
  const handleSaveCriteriaVersion = async () => {
    // Validate list before committing
    if (workingList.length === 0) {
      showToast('Bộ tiêu chí không được để trống.', 'error');
      return;
    }

    if (!validationStatus.isValid) {
      const confirmSave = window.confirm(
        `${validationStatus.message}\n\nBạn có chắc chắn muốn lưu phiên bản bộ tiêu chí này không?`
      );
      if (!confirmSave) return;
    }

    try {
      await updateCriteriaSetForTarget(targetType, workingList);
      showToast(
        `Đã lưu thành công bộ tiêu chí KPI ${
          targetType === 'bgh'
            ? 'Cán bộ Quản lý'
            : targetType === 'nhanvien'
            ? 'Nhân viên'
            : 'Giáo viên'
        } (Phiên bản v${currentVersion + 1})!`,
        'success'
      );
      onClose();
    } catch (err) {
      console.error('Error saving criteria template:', err);
      showToast('Có lỗi xảy ra khi lưu bộ tiêu chí.', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300 shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-400 text-slate-950">
                  Phiên bản v{currentVersion}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Đang áp dụng cho các phiếu KPI tạo mới
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white mt-1">
                QUẢN LÝ VÀ CHỈNH SỬA BỘ TIÊU CHÍ ĐÁNH GIÁ KPI
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer self-start sm:self-auto"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Module Switcher Tabs */}
        <div className="bg-slate-100 p-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTargetType('giaovien')}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
                targetType === 'giaovien'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>KPI Giáo viên</span>
            </button>

            <button
              onClick={() => setTargetType('bgh')}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
                targetType === 'bgh'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>KPI Cán bộ Quản lý</span>
            </button>

            <button
              onClick={() => setTargetType('nhanvien')}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
                targetType === 'nhanvien'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
              }`}
            >
              <Briefcase className="w-4 h-4 text-purple-500" />
              <span>KPI Nhân viên</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenAdd()}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-amber-300" />
              <span>+ THÊM TIÊU CHÍ</span>
            </button>

            <button
              onClick={handleOpenExportModal}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <FileText className="w-4 h-4 text-amber-200" />
              <span>📄 XUẤT TIÊU CHÍ</span>
            </button>

            <button
              onClick={handleSaveCriteriaVersion}
              className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Save className="w-4 h-4 text-blue-200" />
              <span>LƯU BỘ TIÊU CHÍ (v{currentVersion + 1})</span>
            </button>
          </div>
        </div>

        {/* Dynamic Section Subtotal & Validation Banner */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs space-y-3 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {sectionOptions.map((sec) => {
              const currentSecMax = sectionTotals[sec.key] || 0;
              const isIII2 = sec.key === 'III.2';
              const isError = isIII2 && currentSecMax !== 60;

              return (
                <div
                  key={sec.key}
                  className={`p-2.5 rounded-xl border font-sans ${
                    isError
                      ? 'bg-rose-50 border-rose-300 text-rose-900'
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="text-[10px] font-bold text-slate-500 truncate uppercase">
                    Mục {sec.key}
                  </div>
                  <div className="text-base font-black flex items-center justify-between mt-0.5">
                    <span className={isError ? 'text-rose-700' : 'text-blue-900'}>
                      {currentSecMax} đ
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {sec.key === 'I' || sec.key === 'II'
                        ? '/ 15đ'
                        : sec.key === 'III.1'
                        ? '/ 10đ'
                        : sec.key === 'III.2'
                        ? '/ 60đ'
                        : sec.key === 'A'
                        ? '/ 30đ'
                        : '/ 70đ'}
                    </span>
                  </div>
                </div>
              );
            })}

            <div
              className={`p-2.5 rounded-xl border font-sans col-span-2 sm:col-span-1 ${
                grandTotal === 100
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wide">TỔNG ĐIỂM TOÀN BỘ</div>
              <div className="text-base font-black flex items-center justify-between mt-0.5">
                <span>{grandTotal} đ</span>
                <span className="text-xs font-bold">/ 100 đ</span>
              </div>
            </div>
          </div>

          {/* Alert Banner if structure is invalid */}
          {!validationStatus.isValid && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-medium flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>{validationStatus.message}</span>
            </div>
          )}
        </div>

        {/* Section Filters & Controls */}
        <div className="p-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <label className="font-bold text-slate-700">Lọc theo nhóm:</label>
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="py-1.5 px-3 rounded-lg border border-slate-300 font-semibold bg-white text-slate-800 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
            >
              <option value="all">Tất cả các nhóm tiêu chí</option>
              {sectionOptions.map((sec) => (
                <option key={sec.key} value={sec.key}>
                  {sec.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 font-semibold text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Hiển thị tiêu chí đã ẩn (Inactive)</span>
            </label>
          </div>
        </div>

        {/* Criteria Table */}
        <div className="overflow-y-auto flex-1 p-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold border-b border-slate-800 uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 text-center w-12 border-r border-slate-800">STT</th>
                <th className="py-3 px-3 border-r border-slate-800 w-24">MÃ TC</th>
                <th className="py-3 px-3 border-r border-slate-800 w-24 text-center">NHÓM</th>
                <th className="py-3 px-4 border-r border-slate-800 min-w-[280px]">
                  NỘI DUNG TIÊU CHÍ KPI
                </th>
                <th className="py-3 px-3 border-r border-slate-800 text-center w-24">ĐIỂM TỐI ĐA</th>
                <th className="py-3 px-3 border-r border-slate-800 min-w-[200px]">
                  MINH CHỨNG YÊU CẦU
                </th>
                <th className="py-3 px-3 border-r border-slate-800 text-center w-28">TRẠNG THÁI</th>
                <th className="py-3 px-3 text-center w-28">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {displayCriteria.map((item, idx) => {
                const isInactive = item.status === 'inactive';

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-blue-50/50 transition-colors ${
                      isInactive ? 'bg-slate-100/70 text-slate-400' : ''
                    }`}
                  >
                    {/* STT */}
                    <td className="py-3 px-3 text-center font-bold border-r border-slate-200">
                      {item.order}
                    </td>

                    {/* MÃ TC */}
                    <td className="py-3 px-3 font-mono font-bold text-blue-800 border-r border-slate-200">
                      {item.id}
                    </td>

                    {/* NHÓM */}
                    <td className="py-3 px-3 text-center border-r border-slate-200">
                      <span className="inline-block px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-700 border border-slate-200">
                        {item.section}
                      </span>
                    </td>

                    {/* NỘI DUNG TIÊU CHÍ */}
                    <td className="py-3 px-4 border-r border-slate-200 leading-relaxed font-medium">
                      {item.groupTitle && (
                        <div className="text-[10px] font-bold text-indigo-700 uppercase mb-0.5">
                          [{item.groupTitle}]
                        </div>
                      )}
                      <div>{item.content}</div>
                    </td>

                    {/* ĐIỂM TỐI ĐA */}
                    <td className="py-3 px-3 text-center font-black text-blue-900 border-r border-slate-200 text-sm">
                      {item.maxPoints} đ
                    </td>

                    {/* MINH CHỨNG */}
                    <td className="py-3 px-3 border-r border-slate-200 italic text-slate-500 text-[11px]">
                      {item.evidence || '—'}
                    </td>

                    {/* TRẠNG THÁI */}
                    <td className="py-3 px-3 text-center border-r border-slate-200 font-bold">
                      {isInactive ? (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 text-[10px]">
                          Ngưng dùng
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
                          Đang dùng
                        </span>
                      )}
                    </td>

                    {/* THAO TÁC */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleMoveOrder(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded text-slate-500 hover:text-blue-600 disabled:opacity-20 cursor-pointer"
                          title="Chuyển lên"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleMoveOrder(idx, 'down')}
                          disabled={idx === displayCriteria.length - 1}
                          className="p-1 rounded text-slate-500 hover:text-blue-600 disabled:opacity-20 cursor-pointer"
                          title="Chuyển xuống"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                          title="Chỉnh sửa tiêu chí"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setDeletingId(item.id)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Xóa tiêu chí"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 text-xs">
          <div className="text-slate-500">
            Hiển thị <strong className="text-slate-800">{displayCriteria.length}</strong> tiêu chí
            trong bộ dữ liệu
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition cursor-pointer"
            >
              Đóng / Hủy thay đổi
            </button>

            <button
              onClick={handleSaveCriteriaVersion}
              className="px-5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-black shadow-md shadow-blue-700/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-4 h-4 text-blue-200" />
              <span>LƯU BỘ TIÊU CHÍ (v{currentVersion + 1})</span>
            </button>
          </div>
        </div>
      </div>

      {/* FORM MODAL FOR ADDING / EDITING CRITERION */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 text-xs text-slate-800 space-y-4 animate-in fade-in zoom-in-95 my-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                <span>{editingItem ? 'CHỈNH SỬA TIÊU CHÍ KPI' : 'THÊM TIÊU CHÍ KPI MỚI'}</span>
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Section Dropdown */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nhóm tiêu chí (*):</label>
                  <select
                    value={formSection}
                    onChange={(e) => {
                      const secKey = e.target.value;
                      setFormSection(secKey);
                      const match = sectionOptions.find((s) => s.key === secKey);
                      if (match) setFormSectionTitle(match.title);
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    {sectionOptions.map((sec) => (
                      <option key={sec.key} value={sec.key}>
                        {sec.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sub Group Title */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tiêu đề nhóm nhỏ (Tùy chọn):</label>
                  <input
                    type="text"
                    value={formGroupTitle}
                    onChange={(e) => setFormGroupTitle(e.target.value)}
                    placeholder="Ví dụ: I. Ý thức tổ chức kỷ luật"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                {/* Order STT */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Thứ tự hiển thị (STT) (*):</label>
                  <input
                    type="number"
                    min={1}
                    value={formOrder}
                    onChange={(e) => setFormOrder(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                {/* Criterion Code / ID */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã tiêu chí (*):</label>
                  <input
                    type="text"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    placeholder="Ví dụ: III.2.11"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-mono font-bold text-blue-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                {/* Max Points */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Điểm tối đa (*):</label>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={formMaxPoints}
                    onChange={(e) => setFormMaxPoints(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-black text-blue-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trạng thái (*):</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'active' | 'inactive')}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-bold bg-white text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="active">Đang sử dụng (Active)</option>
                    <option value="inactive">Ngưng sử dụng (Inactive)</option>
                  </select>
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nội dung tiêu chí KPI (*):
                </label>
                <textarea
                  rows={3}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Nhập nội dung chi tiết tiêu chí đánh giá..."
                  className="w-full p-3 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Evidence */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Minh chứng yêu cầu (Tùy chọn):
                </label>
                <input
                  type="text"
                  value={formEvidence}
                  onChange={(e) => setFormEvidence(e.target.value)}
                  placeholder="Ví dụ: Kế hoạch bài dạy, sổ theo dõi học sinh..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingItem ? 'LƯU CẬP NHẬT' : 'THÊM TIÊU CHÍ'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 text-center text-xs space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h4 className="font-extrabold text-slate-900 text-sm mb-1">
                Xác nhận xóa tiêu chí KPI
              </h4>
              <p className="text-slate-500 leading-relaxed">
                Bạn có chắc chắn muốn xóa tiêu chí <strong className="text-slate-800">[{deletingId}]</strong> không?
              </p>
            </div>

            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                HỦY
              </button>
              <button
                onClick={() => handleDeleteCriterion(deletingId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold cursor-pointer"
              >
                XÓA TIÊU CHÍ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXPORT CRITERIA MODAL DIALOG */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden text-xs text-slate-800 animate-in fade-in zoom-in-95 my-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 p-4 text-white flex items-center justify-between border-b border-indigo-800/40 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wide text-white">
                    XUẤT BỘ TIÊU CHÍ ĐÁNH GIÁ KPI
                  </h3>
                  <p className="text-[10px] text-blue-200">
                    Trường THPT Phương Xá • Năm học 2026 - 2027
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* 1. Chọn bộ tiêu chí */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                  Chọn bộ tiêu chí:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setExportTargetType('giaovien');
                      setExportSelectedSection('I');
                    }}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                      exportTargetType === 'giaovien'
                        ? 'bg-blue-50 border-blue-600 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <GraduationCap className={`w-4 h-4 ${exportTargetType === 'giaovien' ? 'text-blue-600' : 'text-slate-500'}`} />
                    <span className="font-extrabold text-[11px]">KPI Giáo viên</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setExportTargetType('bgh');
                      setExportSelectedSection('I');
                    }}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                      exportTargetType === 'bgh'
                        ? 'bg-blue-50 border-blue-600 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <Shield className={`w-4 h-4 ${exportTargetType === 'bgh' ? 'text-emerald-600' : 'text-slate-500'}`} />
                    <span className="font-extrabold text-[11px]">KPI Cán bộ Quản lý</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setExportTargetType('nhanvien');
                      setExportSelectedSection('A');
                    }}
                    className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                      exportTargetType === 'nhanvien'
                        ? 'bg-blue-50 border-blue-600 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <Briefcase className={`w-4 h-4 ${exportTargetType === 'nhanvien' ? 'text-purple-600' : 'text-slate-500'}`} />
                    <span className="font-extrabold text-[11px]">KPI Nhân viên</span>
                  </button>
                </div>
              </div>

              {/* 2. Phạm vi xuất */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                  Phạm vi xuất:
                </label>
                <div className="space-y-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <label className="flex items-center gap-2.5 font-medium text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="exportScopeOption"
                      checked={exportScope === 'all'}
                      onChange={() => setExportScope('all')}
                      className="text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                    />
                    <span className="font-semibold">Toàn bộ tiêu chí (Toàn bộ các nhóm)</span>
                  </label>

                  <label className="flex items-center gap-2.5 font-medium text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="exportScopeOption"
                      checked={exportScope === 'section'}
                      onChange={() => setExportScope('section')}
                      className="text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                    />
                    <span className="font-semibold">Chỉ nhóm đang chọn:</span>
                  </label>

                  {exportScope === 'section' && (
                    <div className="pl-6 pt-1">
                      <select
                        value={exportSelectedSection}
                        onChange={(e) => setExportSelectedSection(e.target.value)}
                        className="w-full p-2 rounded-xl border border-slate-300 font-semibold bg-white text-slate-800 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      >
                        <option value="all">Tất cả các nhóm</option>
                        {exportSectionOptions.map((sec) => (
                          <option key={sec.key} value={sec.key}>
                            {sec.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <label className="flex items-center gap-2.5 font-medium text-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="exportScopeOption"
                      checked={exportScope === 'display'}
                      onChange={() => setExportScope('display')}
                      className="text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                    />
                    <span className="font-semibold">Chỉ các tiêu chí đang hiển thị trên bảng</span>
                  </label>
                </div>
              </div>

              {/* 3. Kiểm tra tổng điểm & Cảnh báo (Requirement 7) */}
              {entireTargetSetTotalPoints !== 100 ? (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 flex items-start gap-2 text-[11px] leading-relaxed">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-amber-950">
                      CẢNH BÁO TỔNG ĐIỂM BỘ TIÊU CHÍ:
                    </div>
                    <div>
                      Bộ tiêu chí hiện có tổng điểm là <strong className="text-rose-700 font-black">{entireTargetSetTotalPoints}/100</strong>. Vui lòng kiểm tra trước khi sử dụng.
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 flex items-center gap-2 text-[11px]">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Bộ tiêu chí hợp lệ: Tổng điểm đạt chuẩn <strong className="font-black">100/100 điểm</strong> ({exportCriteriaListToExport.length} tiêu chí sẽ xuất).
                  </span>
                </div>
              )}

              {/* 4. Định dạng xuất */}
              <div className="space-y-2">
                <label className="block font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                  Định dạng:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setExportFormat('word')}
                    className={`p-3 rounded-2xl border text-center transition cursor-pointer flex items-center justify-center gap-2.5 ${
                      exportFormat === 'word'
                        ? 'bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-600/20 font-black ring-2 ring-blue-400/30'
                        : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 font-bold'
                    }`}
                  >
                    <FileText className={`w-4 h-4 ${exportFormat === 'word' ? 'text-blue-100' : 'text-blue-600'}`} />
                    <span>Word (.docx)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFormat('excel')}
                    className={`p-3 rounded-2xl border text-center transition cursor-pointer flex items-center justify-center gap-2.5 ${
                      exportFormat === 'excel'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow-md shadow-emerald-700/20 font-black ring-2 ring-emerald-400/30'
                        : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 font-bold'
                    }`}
                  >
                    <FileSpreadsheet className={`w-4 h-4 ${exportFormat === 'excel' ? 'text-emerald-100' : 'text-emerald-600'}`} />
                    <span>Excel (.xlsx)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                HỦY
              </button>

              <button
                type="button"
                onClick={handleExecuteExport}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black shadow-md shadow-blue-600/25 transition cursor-pointer flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-amber-300" />
                <span>XUẤT FILE</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
