import React, { useState, useMemo, useEffect } from 'react';
import { StaffMember, TeacherKpiEvaluation } from '../types';
import {
  getOfficialStaffCriteria,
  OFFICIAL_STAFF_POSITIONS,
  detectStaffPositionKey,
  STAFF_GENERAL_KPI_CRITERIA,
} from '../data/kpiEvaluationTemplates';
import {
  exportKpiEvaluationToWord,
  exportKpiEvaluationToExcel,
  exportMultipleStaffKpiToSingleWord,
} from '../utils/exportUtils';
import {
  StaffRankingTier,
  calculateStaffRank,
  getStaffRankBadgeClass,
} from '../services/staffKpiService';
import * as XLSX from 'xlsx';
import {
  X,
  FileText,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Download,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Printer,
  ChevronRight,
  UserCheck,
} from 'lucide-react';

interface StaffExportKpiFormsModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffMember[];
  evaluationsList: TeacherKpiEvaluation[];
  schoolYear: string;
  rankingTiers: StaffRankingTier[];
  schoolName?: string;
  showToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const StaffExportKpiFormsModal: React.FC<StaffExportKpiFormsModalProps> = ({
  isOpen,
  onClose,
  staffList,
  evaluationsList,
  schoolYear,
  rankingTiers,
  schoolName = 'TRƯỜNG THPT PHƯƠNG XÁ',
  showToast,
}) => {
  // Filter all staff members belonging to office / non-teaching staff (Nhân viên: Kế toán, Văn thư, Thư viện, Thiết bị, Thủ quỹ, Y tế, Bảo vệ, Phục vụ...)
  const officeStaff = useMemo(() => {
    return staffList.filter((s) => {
      if (s.is_active === false) return false;
      const typeNorm = (s.type || (s as any).employeeType || (s as any).employee_type || '').toLowerCase();
      const deptNorm = (s.department || '').toLowerCase();
      const deptId = (s.departmentId || (s as any).department_id || '').toLowerCase();
      const posNorm = (s.position || '').toLowerCase();
      const codeNorm = (s.code || '').toLowerCase();
      const idNorm = (s.id || '').toLowerCase();

      return (
        typeNorm === 'nhanvien' ||
        typeNorm === 'nhan_vien' ||
        deptId === 'to-van-phong' ||
        deptNorm.includes('văn phòng') ||
        deptNorm.includes('van phong') ||
        idNorm.startsWith('nv-') ||
        codeNorm.startsWith('nv') ||
        posNorm.includes('kế toán') ||
        posNorm.includes('thủ quỹ') ||
        posNorm.includes('văn thư') ||
        posNorm.includes('thư viện') ||
        posNorm.includes('thiết bị') ||
        posNorm.includes('y tế') ||
        posNorm.includes('bảo vệ') ||
        posNorm.includes('phục vụ') ||
        posNorm.includes('vệ sinh')
      );
    });
  }, [staffList]);

  // Single staff selected for individual export
  const [singleSelectedStaffId, setSingleSelectedStaffId] = useState<string>('');

  useEffect(() => {
    if (officeStaff.length > 0) {
      if (!singleSelectedStaffId || !officeStaff.some((s) => s.id === singleSelectedStaffId)) {
        setSingleSelectedStaffId(officeStaff[0].id);
      }
    }
  }, [officeStaff]);

  // Selected staff IDs for batch export
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>(() =>
    officeStaff.map((s) => s.id)
  );

  useEffect(() => {
    if (officeStaff.length > 0 && selectedStaffIds.length === 0) {
      setSelectedStaffIds(officeStaff.map((s) => s.id));
    }
  }, [officeStaff]);

  // Search and position filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPositionKey, setSelectedPositionKey] = useState<string>('all');
  const [exportFormat, setExportFormat] = useState<'word' | 'excel'>('word');
  const [isExporting, setIsExporting] = useState(false);

  // Filtered staff list based on search and position
  const filteredStaff = useMemo(() => {
    return officeStaff.filter((s) => {
      const pKey = detectStaffPositionKey(s.position || '');
      if (selectedPositionKey !== 'all' && pKey !== selectedPositionKey) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (s.name || '').toLowerCase().includes(q);
        const matchCode = (s.code || '').toLowerCase().includes(q);
        const matchPos = (s.position || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchPos) return false;
      }
      return true;
    });
  }, [officeStaff, selectedPositionKey, searchQuery]);

  // Helper to get evaluation for a specific staff member using employeeId as primary key (Requirement 4 & 8)
  const getStaffEvaluation = (staffId: string, staffCode: string): TeacherKpiEvaluation | undefined => {
    return evaluationsList.find(
      (e) =>
        e.staffId === staffId ||
        (e as any).employeeId === staffId ||
        (e as any).employee_id === staffId ||
        e.staffCode === staffCode ||
        (e.staffId && staffId && e.staffId.toLowerCase() === staffId.toLowerCase())
    );
  };

  // Toggle selection for one staff
  const handleToggleStaff = (id: string) => {
    setSelectedStaffIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle select all
  const handleToggleSelectAll = () => {
    if (selectedStaffIds.length === filteredStaff.length) {
      setSelectedStaffIds([]);
    } else {
      setSelectedStaffIds(filteredStaff.map((s) => s.id));
    }
  };

  // Build full evaluation data for a single staff member using employeeId
  const prepareStaffExportData = (staff: StaffMember) => {
    const existingEval = getStaffEvaluation(staff.id, staff.code);
    const pKey = detectStaffPositionKey(staff.position || '');
    const official = getOfficialStaffCriteria(staff.position || pKey);
    const criteria = official.allCriteria;

    // Build or extract scores
    const scores: Record<
      string,
      {
        selfScore: number;
        deptScore?: number;
        bghScore?: number;
        isNa?: boolean;
        evidence?: string;
      }
    > = {};

    let selfTotal = 0;
    let bghTotal = 0;
    let hasBghScores = false;

    criteria.forEach((c) => {
      const existingScore = existingEval?.scores?.[c.id];
      if (existingScore) {
        const isNa = Boolean(existingScore.isNa);
        const selfVal = isNa ? 0 : Number(existingScore.selfScore ?? c.maxPoints);
        const bghVal =
          existingScore.bghScore !== undefined && existingScore.bghScore !== null
            ? Number(existingScore.bghScore)
            : undefined;

        scores[c.id] = {
          selfScore: selfVal,
          deptScore: bghVal,
          bghScore: bghVal,
          isNa,
          evidence: existingScore.evidence || '',
        };

        if (!isNa) {
          selfTotal += selfVal;
          if (bghVal !== undefined && !isNaN(bghVal)) {
            bghTotal += bghVal;
            hasBghScores = true;
          }
        }
      } else {
        // Default initial scores if evaluation not yet created
        scores[c.id] = {
          selfScore: c.maxPoints,
          deptScore: c.maxPoints,
          bghScore: c.maxPoints,
          isNa: false,
          evidence: '',
        };
        selfTotal += c.maxPoints;
        bghTotal += c.maxPoints;
      }
    });

    selfTotal = Math.min(100, Math.round(selfTotal * 10) / 10);
    const finalBghTotal =
      existingEval?.bghTotalScore ??
      existingEval?.bgh_score ??
      (hasBghScores ? Math.min(100, Math.round(bghTotal * 10) / 10) : selfTotal);

    const selfRank = existingEval?.selfRank || calculateStaffRank(selfTotal, rankingTiers);
    const bghRank =
      existingEval?.bghRank ||
      (existingEval as any)?.bgh_rating ||
      calculateStaffRank(finalBghTotal, rankingTiers);

    const evaluatorName =
      existingEval?.evaluatorName ||
      existingEval?.evaluator_name ||
      existingEval?.bghEvaluatorName ||
      'Tạ Duy Kiên – Hiệu trưởng';

    return {
      staff,
      evaluation: existingEval,
      positionDef: official.positionDef,
      criteria,
      scores,
      selfTotal,
      bghTotal: finalBghTotal,
      selfRank,
      bghRank,
      evaluatorName,
      periodName: existingEval?.periodName || 'Tháng 09/2026',
      evaluationPeriod: existingEval?.evaluationPeriod || 'thang',
      month: existingEval?.month || 9,
      year: existingEval?.year || 2026,
    };
  };

  // Export single staff
  const handleExportSingleStaff = async (staff: StaffMember, format: 'word' | 'excel') => {
    try {
      const data = prepareStaffExportData(staff);
      const safeName = staff.name.replace(/\s+/g, '_');
      const safePos = (staff.position || 'NhanVien').replace(/\s+/g, '_');

      if (format === 'word') {
        exportKpiEvaluationToWord({
          schoolName,
          teacherName: staff.name,
          staffCode: staff.code,
          position: staff.position || data.positionDef.name,
          department: 'Tổ Văn phòng',
          schoolYear,
          evaluationPeriod: data.evaluationPeriod,
          periodName: data.periodName,
          month: data.month,
          year: data.year,
          evaluatorName: data.evaluatorName,
          targetType: 'nhanvien',
          criteria: data.criteria.map((c) => ({
            id: c.id,
            section: c.section || (c.id.startsWith('NV-A') ? 'A' : 'B'),
            order: c.order || 1,
            content: c.content,
            maxPoints: c.maxPoints,
            groupTitle: (c as any).groupTitle || data.positionDef.name,
          })),
          scores: data.scores,
          selfTotal: data.selfTotal,
          bghTotal: data.bghTotal,
          selfRank: data.selfRank,
          bghRank: data.bghRank,
        });
        showToast(`Đã xuất file Word phiếu KPI của ${staff.name} (${staff.position})!`, 'success');
      } else {
        exportKpiEvaluationToExcel({
          schoolName,
          departmentName: 'Tổ Văn phòng',
          teacherName: staff.name,
          position: staff.position || data.positionDef.name,
          department: 'Tổ Văn phòng',
          schoolYear,
          evaluationPeriod: data.evaluationPeriod,
          periodName: data.periodName,
          month: data.month,
          year: data.year,
          targetType: 'nhanvien',
          criteria: data.criteria.map((c) => ({
            id: c.id,
            section: c.section || (c.id.startsWith('NV-A') ? 'A' : 'B'),
            sectionTitle:
              c.section === 'A'
                ? 'A. KPI CHUNG – 30 ĐIỂM'
                : `B. KPI VỊ TRÍ VIỆC LÀM: ${(staff.position || data.positionDef.name).toUpperCase()} – 70 ĐIỂM`,
            order: c.order || 1,
            content: c.content,
            maxPoints: c.maxPoints,
          })),
          scores: data.scores,
          selfTotal: data.selfTotal,
          bghTotal: data.bghTotal,
          selfRank: data.selfRank,
          bghRank: data.bghRank,
        });
        showToast(`Đã xuất file Excel phiếu KPI của ${staff.name} (${staff.position})!`, 'success');
      }
    } catch (err: any) {
      console.error('Lỗi khi xuất phiếu nhân viên:', err);
      showToast(`Lỗi khi xuất phiếu: ${err.message || err}`, 'error');
    }
  };

  // Export employee KPI by employeeId (Requirement 9: exportEmployeeKPI(employeeId))
  const exportEmployeeKPI = async (employeeId: string, format: 'word' | 'excel' = exportFormat) => {
    const staff = officeStaff.find((s) => s.id === employeeId) || staffList.find((s) => s.id === employeeId);
    if (!staff) {
      showToast('❌ Không tìm thấy nhân viên trong hệ thống.', 'error');
      return;
    }
    await handleExportSingleStaff(staff, format);
  };

  // Export batch (all selected staff)
  const handleExportBatch = async () => {
    if (selectedStaffIds.length === 0) {
      showToast('Vui lòng chọn ít nhất một nhân viên để xuất phiếu.', 'warning');
      return;
    }

    setIsExporting(true);

    try {
      const selectedStaffMembers = officeStaff.filter((s) => selectedStaffIds.includes(s.id));

      if (exportFormat === 'word') {
        if (selectedStaffMembers.length === 1) {
          const s = selectedStaffMembers[0];
          const data = prepareStaffExportData(s);
          exportKpiEvaluationToWord({
            schoolName,
            teacherName: s.name,
            staffCode: s.code,
            position: s.position || data.positionDef.name,
            department: 'Tổ Văn phòng',
            schoolYear,
            evaluationPeriod: data.evaluationPeriod,
            periodName: data.periodName,
            month: data.month,
            year: data.year,
            evaluatorName: data.evaluatorName,
            targetType: 'nhanvien',
            criteria: data.criteria.map((c) => ({
              id: c.id,
              section: c.section || (c.id.startsWith('NV-A') ? 'A' : 'B'),
              order: c.order || 1,
              content: c.content,
              maxPoints: c.maxPoints,
              groupTitle: (c as any).groupTitle || data.positionDef.name,
            })),
            scores: data.scores,
            selfTotal: data.selfTotal,
            bghTotal: data.bghTotal,
            selfRank: data.selfRank,
            bghRank: data.bghRank,
          });
          showToast(`Đã xuất thành công phiếu KPI của ${s.name} ra file Word (.doc)!`, 'success');
        } else {
          // Xuất tất cả nhân viên được chọn vào một sổ bộ Word hoàn chỉnh (mỗi nhân viên 1 trang riêng biệt)
          const allParams = selectedStaffMembers.map((s) => {
            const data = prepareStaffExportData(s);
            return {
              schoolName,
              teacherName: s.name,
              staffCode: s.code,
              position: s.position || data.positionDef.name,
              department: 'Tổ Văn phòng',
              schoolYear,
              evaluationPeriod: data.evaluationPeriod,
              periodName: data.periodName,
              month: data.month,
              year: data.year,
              evaluatorName: data.evaluatorName,
              targetType: 'nhanvien',
              criteria: data.criteria.map((c) => ({
                id: c.id,
                section: c.section || (c.id.startsWith('NV-A') ? 'A' : 'B'),
                order: c.order || 1,
                content: c.content,
                maxPoints: c.maxPoints,
                groupTitle: (c as any).groupTitle || data.positionDef.name,
              })),
              scores: data.scores,
              selfTotal: data.selfTotal,
              bghTotal: data.bghTotal,
              selfRank: data.selfRank,
              bghRank: data.bghRank,
            };
          });

          exportMultipleStaffKpiToSingleWord(
            allParams,
            `So_Bo_Phieu_KPI_${selectedStaffMembers.length}_Nhan_Vien_${schoolYear.replace(/\s+/g, '')}.doc`
          );

          showToast(
            `Đã xuất thành công sổ bộ Word (.doc) gồm ${selectedStaffMembers.length} phiếu KPI nhân viên (mỗi người 1 phiếu riêng)!`,
            'success'
          );
        }
      } else {
        // In Excel, create a master multi-sheet workbook with sheets for all selected staff + an overview sheet
        const wb = XLSX.utils.book_new();

        // 1. Overview Sheet (Danh sách tổng hợp)
        const summaryRows: any[] = [];
        summaryRows.push({
          STT: '',
          'MÃ NV': `SỞ GD&ĐT PHÚ THỌ - ${schoolName.toUpperCase()}`,
          'HỌ VÀ TÊN': '',
          'VỊ TRÍ VIỆC LÀM': '',
          'ĐIỂM CÁ NHÂN': '',
          'ĐIỂM BGH': '',
          'XẾP LOẠI BGH': '',
          'TRẠNG THÁI': '',
        });
        summaryRows.push({
          STT: '',
          'MÃ NV': `TỔNG HỢP KẾT QUẢ ĐÁNH GIÁ KPI NHÂN VIÊN – NĂM HỌC ${schoolYear}`,
          'HỌ VÀ TÊN': '',
          'VỊ TRÍ VIỆC LÀM': '',
          'ĐIỂM CÁ NHÂN': '',
          'ĐIỂM BGH': '',
          'XẾP LOẠI BGH': '',
          'TRẠNG THÁI': '',
        });
        summaryRows.push({});

        selectedStaffMembers.forEach((s, idx) => {
          const d = prepareStaffExportData(s);
          summaryRows.push({
            STT: idx + 1,
            'MÃ NV': s.code,
            'HỌ VÀ TÊN': s.name,
            'VỊ TRÍ VIỆC LÀM': s.position || d.positionDef.name,
            'ĐIỂM CÁ NHÂN': `${d.selfTotal}/100`,
            'ĐIỂM BGH': `${d.bghTotal}/100`,
            'XẾP LOẠI BGH': d.bghRank,
            'TRẠNG THÁI': d.evaluation?.status === 'completed' || d.evaluation?.status === 'bgh_approved' ? 'Đã hoàn tất' : 'Đang thực hiện',
          });
        });

        const summaryWs = XLSX.utils.json_to_sheet(summaryRows);
        summaryWs['!cols'] = [
          { wch: 8 },
          { wch: 14 },
          { wch: 28 },
          { wch: 25 },
          { wch: 16 },
          { wch: 16 },
          { wch: 24 },
          { wch: 16 },
        ];
        XLSX.utils.book_append_sheet(wb, summaryWs, 'TONG_HOP_NV');

        // 2. Individual Sheet for each selected staff member
        selectedStaffMembers.forEach((s, sIdx) => {
          const d = prepareStaffExportData(s);
          const rows: any[] = [];

          rows.push({
            STT: '',
            'Nội dung đánh giá / nhiệm vụ chi tiết': `SỞ GD&ĐT PHÚ THỌ - ${schoolName.toUpperCase()}`,
            'Điểm tối đa': '',
            'Cá nhân tự chấm': '',
            'BGH chấm': '',
            'Minh chứng / ghi chú': '',
          });
          rows.push({
            STT: '',
            'Nội dung đánh giá / nhiệm vụ chi tiết': `PHIẾU ĐÁNH GIÁ KPI NHÂN VIÊN - ${s.name.toUpperCase()} (${(s.position || d.positionDef.name).toUpperCase()})`,
            'Điểm tối đa': '',
            'Cá nhân tự chấm': '',
            'BGH chấm': '',
            'Minh chứng / ghi chú': '',
          });
          rows.push({
            STT: '',
            'Nội dung đánh giá / nhiệm vụ chi tiết': `Mã NV: ${s.code} | Tổ: Tổ Văn phòng | Người đánh giá: ${d.evaluatorName} | Năm học: ${schoolYear}`,
            'Điểm tối đa': '',
            'Cá nhân tự chấm': '',
            'BGH chấm': '',
            'Minh chứng / ghi chú': '',
          });
          rows.push({});

          // Section A: 30 points
          const partACriteria = d.criteria.filter((c) => c.section === 'A');
          let selfSubA = 0;
          let bghSubA = 0;
          partACriteria.forEach((c) => {
            const sc = d.scores[c.id];
            if (!sc?.isNa) {
              selfSubA += sc?.selfScore ?? c.maxPoints;
              bghSubA += sc?.bghScore ?? c.maxPoints;
            }
          });

          rows.push({
            STT: 'A',
            'Nội dung đánh giá / nhiệm vụ chi tiết': 'A. KPI CHUNG – 30 ĐIỂM (Áp dụng toàn thể nhân viên Tổ Văn phòng)',
            'Điểm tối đa': 30,
            'Cá nhân tự chấm': Math.round(selfSubA * 10) / 10,
            'BGH chấm': Math.round(bghSubA * 10) / 10,
            'Minh chứng / ghi chú': 'Tối đa 30 điểm',
          });

          partACriteria.forEach((c) => {
            const sc = d.scores[c.id];
            rows.push({
              STT: c.order,
              'Nội dung đánh giá / nhiệm vụ chi tiết': c.content,
              'Điểm tối đa': c.maxPoints,
              'Cá nhân tự chấm': sc?.isNa ? 'N/A' : (sc?.selfScore ?? c.maxPoints),
              'BGH chấm': sc?.isNa ? 'N/A' : (sc?.bghScore ?? c.maxPoints),
              'Minh chứng / ghi chú': sc?.evidence || '',
            });
          });

          // Section B: 70 points
          const partBCriteria = d.criteria.filter((c) => c.section === 'B');
          let selfSubB = 0;
          let bghSubB = 0;
          partBCriteria.forEach((c) => {
            const sc = d.scores[c.id];
            if (!sc?.isNa) {
              selfSubB += sc?.selfScore ?? c.maxPoints;
              bghSubB += sc?.bghScore ?? c.maxPoints;
            }
          });

          rows.push({
            STT: 'B',
            'Nội dung đánh giá / nhiệm vụ chi tiết': `B. KPI VỊ TRÍ VIỆC LÀM: ${(s.position || d.positionDef.name).toUpperCase()} – 70 ĐIỂM`,
            'Điểm tối đa': 70,
            'Cá nhân tự chấm': Math.round(selfSubB * 10) / 10,
            'BGH chấm': Math.round(bghSubB * 10) / 10,
            'Minh chứng / ghi chú': d.positionDef.description,
          });

          partBCriteria.forEach((c) => {
            const sc = d.scores[c.id];
            rows.push({
              STT: c.order,
              'Nội dung đánh giá / nhiệm vụ chi tiết': c.content,
              'Điểm tối đa': c.maxPoints,
              'Cá nhân tự chấm': sc?.isNa ? 'N/A' : (sc?.selfScore ?? c.maxPoints),
              'BGH chấm': sc?.isNa ? 'N/A' : (sc?.bghScore ?? c.maxPoints),
              'Minh chứng / ghi chú': sc?.evidence || '',
            });
          });

          // Summary
          rows.push({});
          rows.push({
            STT: 'TỔNG',
            'Nội dung đánh giá / nhiệm vụ chi tiết': 'TỔNG ĐIỂM KPI (THANG ĐIỂM 100)',
            'Điểm tối đa': 100,
            'Cá nhân tự chấm': d.selfTotal,
            'BGH chấm': d.bghTotal,
            'Minh chứng / ghi chú': `Xếp loại: ${d.bghRank}`,
          });

          const ws = XLSX.utils.json_to_sheet(rows);
          ws['!cols'] = [
            { wch: 8 },
            { wch: 65 },
            { wch: 12 },
            { wch: 16 },
            { wch: 16 },
            { wch: 38 },
          ];

          // Generate safe sheet name (max 31 chars in Excel)
          const cleanName = s.name.split(' ').slice(-2).join('_');
          const sheetName = `${cleanName}_${s.code}`.substring(0, 30);
          XLSX.utils.book_append_sheet(wb, ws, sheetName);
        });

        XLSX.writeFile(
          wb,
          `Bo_phieu_KPI_Nhan_vien_THPT_Phuong_Xa_${schoolYear.replace(/\s+/g, '')}.xlsx`
        );
        showToast(
          `Đã xuất thành công sổ bộ Excel (.xlsx) gồm ${selectedStaffMembers.length} phiếu KPI nhân viên!`,
          'success'
        );
      }

      onClose();
    } catch (err: any) {
      console.error('Lỗi khi xuất phiếu hàng loạt:', err);
      showToast(`Lỗi khi xuất file: ${err.message || err}`, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 text-xs text-slate-800">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white flex items-center justify-between shrink-0 border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-amber-300 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-wide">
                XUẤT PHIẾU ĐÁNH GIÁ KPI NHÂN VIÊN
              </h2>
              <p className="text-[11px] text-purple-200">
                Xuất phiếu chi tiết theo từng nhân viên (Kế toán, Văn thư, Thư viện, Thiết bị, Thủ quỹ, Y tế...) • Chuẩn quy chế 100 điểm
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter and Format Controls */}
        <div className="p-5 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="🔍 Tìm nhân viên theo tên, mã hoặc vị trí..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white font-medium text-slate-900 text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>

            {/* Position Filter */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600">Vị trí:</span>
              <select
                value={selectedPositionKey}
                onChange={(e) => setSelectedPositionKey(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 font-bold bg-white text-slate-800 text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none"
              >
                <option value="all">Tất cả vị trí ({officeStaff.length} nhân viên)</option>
                {OFFICIAL_STAFF_POSITIONS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Format Selector */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-200/80 border border-slate-300">
              <button
                type="button"
                onClick={() => setExportFormat('word')}
                className={`px-3 py-1.5 rounded-lg font-extrabold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                  exportFormat === 'word'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Word (.docx)</span>
              </button>
              <button
                type="button"
                onClick={() => setExportFormat('excel')}
                className={`px-3 py-1.5 rounded-lg font-extrabold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                  exportFormat === 'excel'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Single Employee Quick Export (Requirement 5) */}
          <div className="bg-purple-100/70 border border-purple-300 rounded-2xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2 text-purple-950 font-black text-xs shrink-0">
              <UserCheck className="w-4 h-4 text-purple-700" />
              <span>XUẤT PHIẾU THEO TỪNG NHÂN VIÊN:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={singleSelectedStaffId}
                onChange={(e) => setSingleSelectedStaffId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-purple-400 bg-white font-bold text-slate-900 text-xs focus:ring-2 focus:ring-purple-600 focus:outline-none flex-1 md:w-72"
              >
                {officeStaff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} – {s.position} ({s.code})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => exportEmployeeKPI(singleSelectedStaffId, 'word')}
                className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                title="Xuất phiếu Word cho nhân viên được chọn"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>XUẤT PHIẾU (WORD)</span>
              </button>
              <button
                type="button"
                onClick={() => exportEmployeeKPI(singleSelectedStaffId, 'excel')}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition cursor-pointer flex items-center gap-1.5 shadow-xs"
                title="Xuất phiếu Excel cho nhân viên được chọn"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>XUẤT PHIẾU (EXCEL)</span>
              </button>
            </div>
          </div>

          {/* Select all bar */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={handleToggleSelectAll}
              className="inline-flex items-center gap-2 font-black text-purple-900 hover:text-purple-700 cursor-pointer"
            >
              {selectedStaffIds.length === filteredStaff.length && filteredStaff.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-purple-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>
                Chọn tất cả {filteredStaff.length} nhân viên hiển thị (Đang chọn {selectedStaffIds.length})
              </span>
            </button>

            <span className="text-[11px] text-slate-500 font-medium">
              Mỗi nhân viên sẽ nhận đúng bộ tiêu chí 30đ chung + 70đ vị trí của riêng mình.
            </span>
          </div>
        </div>

        {/* Staff List Table */}
        <div className="flex-1 overflow-y-auto p-5">
          {filteredStaff.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Users className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="font-bold">Không tìm thấy nhân viên nào phù hợp bộ lọc.</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 font-extrabold text-slate-700 border-b border-slate-200 text-[11px] uppercase">
                    <th className="py-2.5 px-3 text-center w-10">Chọn</th>
                    <th className="py-2.5 px-3 w-16">Mã NV</th>
                    <th className="py-2.5 px-3">Họ và tên nhân viên</th>
                    <th className="py-2.5 px-3">Vị trí việc làm</th>
                    <th className="py-2.5 px-3 text-center w-28">Bộ tiêu chí</th>
                    <th className="py-2.5 px-3 text-center w-28">Điểm BGH</th>
                    <th className="py-2.5 px-3 text-center w-36">Xếp loại</th>
                    <th className="py-2.5 px-3 text-right w-40">Xuất nhanh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.map((staff) => {
                    const isSelected = selectedStaffIds.includes(staff.id);
                    const evaluation = getStaffEvaluation(staff.id, staff.code);
                    const pKey = detectStaffPositionKey(staff.position || '');
                    const pDef = OFFICIAL_STAFF_POSITIONS.find((p) => p.key === pKey) || OFFICIAL_STAFF_POSITIONS[0];
                    const bghScore = evaluation?.bghTotalScore ?? evaluation?.bgh_score;
                    const rankLabel =
                      evaluation?.bghRank ||
                      (evaluation as any)?.bgh_rating ||
                      (bghScore !== undefined ? calculateStaffRank(bghScore, rankingTiers) : 'Chưa chấm');

                    return (
                      <tr
                        key={staff.id}
                        className={`transition ${
                          isSelected ? 'bg-purple-50/50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleStaff(staff.id)}
                            className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-600">
                          {staff.code}
                        </td>
                        <td className="py-3 px-3 font-black text-slate-900">
                          <div>{staff.name}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            Tổ Văn phòng • THPT Phương Xá
                          </div>
                        </td>
                        <td className="py-3 px-3 font-bold text-purple-900">
                          <span className="inline-flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                            {staff.position || pDef.name}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-extrabold text-[10px]">
                            {pDef.shortLabel}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-black">
                          {bghScore !== undefined ? (
                            <span className="text-emerald-700">{bghScore}/100</span>
                          ) : (
                            <span className="text-slate-400 italic">Mẫu chuẩn</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${getStaffRankBadgeClass(
                              rankLabel,
                              rankingTiers
                            )}`}
                          >
                            {rankLabel}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleExportSingleStaff(staff, 'word')}
                              className="px-2 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] inline-flex items-center gap-1 border border-blue-200 transition cursor-pointer"
                              title={`Xuất file Word phiếu KPI của ${staff.name}`}
                            >
                              <FileText className="w-3 h-3" />
                              <span>Word</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExportSingleStaff(staff, 'excel')}
                              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] inline-flex items-center gap-1 border border-emerald-200 transition cursor-pointer"
                              title={`Xuất file Excel phiếu KPI của ${staff.name}`}
                            >
                              <FileSpreadsheet className="w-3 h-3" />
                              <span>Excel</span>
                            </button>
                          </div>
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
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-600 font-medium">
            Đang chọn: <strong className="text-purple-900 font-black">{selectedStaffIds.length}</strong> / {filteredStaff.length} nhân viên đủ điều kiện đánh giá KPI.
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={selectedStaffIds.length === 0 || isExporting}
              onClick={handleExportBatch}
              className={`px-5 py-2.5 rounded-xl font-black text-xs shadow-md transition cursor-pointer inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                exportFormat === 'word'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>
                {isExporting
                  ? 'ĐANG TẠO FILE...'
                  : `XUẤT ${selectedStaffIds.length} PHIẾU KPI ĐÃ CHỌN (${exportFormat === 'word' ? '.DOCX' : '.XLSX'})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
