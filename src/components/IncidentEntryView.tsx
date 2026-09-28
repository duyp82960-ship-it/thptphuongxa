import React, { useState, useEffect, useMemo } from 'react';
import { useKpi } from '../context/KpiContext';
import { PersonType, ScoreType } from '../types';
import {
  PlusCircle,
  Check,
  Calendar,
  User,
  ListOrdered,
  FileText,
  Trash2,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  Info,
  Clock,
  Printer,
  FileSpreadsheet,
  ArrowLeft,
} from 'lucide-react';
import { downloadCsv } from '../utils/exportUtils';

export const IncidentEntryView: React.FC = () => {
  const {
    staffList,
    criteriaList,
    incidentsList,
    addIncident,
    deleteIncident,
    schoolYear,
    semester,
    currentUser,
    openPrintModal,
    schoolConfig,
    setActiveTab,
  } = useKpi();

  const [personType, setPersonType] = useState<PersonType>('giaovien');
  const [personId, setPersonId] = useState<string>('');
  const [criterionId, setCriterionId] = useState<string>('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [type, setType] = useState<ScoreType>('plus');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPoints, setUnitPoints] = useState<number>(5);
  const [notes, setNotes] = useState<string>('');
  const [evidenceRef, setEvidenceRef] = useState<string>('');

  // History filters
  const [historySearch, setHistorySearch] = useState('');
  const [filterMonth, setFilterMonth] = useState<number | 'all'>('all');
  const [filterType, setFilterType] = useState<'all' | 'plus' | 'minus'>('all');

  // Filter staff by selected personType
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => s.type === personType);
  }, [staffList, personType]);

  // When personType changes, set default person
  useEffect(() => {
    if (filteredStaff.length > 0) {
      setPersonId(filteredStaff[0].id);
    } else {
      setPersonId('');
    }
  }, [personType, filteredStaff]);

  // Criteria for selected personType
  const filteredCriteria = useMemo(() => {
    return criteriaList.filter(
      (c) => c.status === 'active' && (c.targetRole === 'all' || c.targetRole === personType)
    );
  }, [criteriaList, personType]);

  // Set default criterion
  useEffect(() => {
    if (filteredCriteria.length > 0) {
      const match = filteredCriteria.find((c) => c.id === criterionId);
      if (!match) {
        const first = filteredCriteria[0];
        setCriterionId(first.id);
        setType(first.type);
        setUnitPoints(first.points);
      }
    }
  }, [filteredCriteria, criterionId]);

  // When criterion selected
  const handleCriterionChange = (cId: string) => {
    setCriterionId(cId);
    const crit = criteriaList.find((c) => c.id === cId);
    if (crit) {
      setType(crit.type);
      setUnitPoints(crit.points);
    }
  };

  const totalPoints = Math.max(0, quantity) * unitPoints;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedPerson = staffList.find((s) => s.id === personId);
    const selectedCriterion = criteriaList.find((c) => c.id === criterionId);

    if (!selectedPerson || !selectedCriterion) return;

    const eventDate = new Date(date);
    const eventMonth = eventDate.getMonth() + 1;

    addIncident({
      personId: selectedPerson.id,
      personName: selectedPerson.name,
      personType: selectedPerson.type,
      department: selectedPerson.department,
      criterionId: selectedCriterion.id,
      criterionCode: selectedCriterion.code,
      criterionName: selectedCriterion.name,
      type,
      quantity,
      unitPoints,
      totalPoints,
      date,
      month: eventMonth,
      semester,
      schoolYear,
      notes,
      evidenceRef,
      createdBy: currentUser?.name || 'Ban Giám hiệu',
    });

    // Reset notes & count
    setNotes('');
    setEvidenceRef('');
    setQuantity(1);
  };

  // Filtered incident history
  const filteredIncidents = useMemo(() => {
    return incidentsList
      .filter((inc) => inc.schoolYear === schoolYear)
      .filter((inc) => {
        const matchesSearch =
          inc.personName.toLowerCase().includes(historySearch.toLowerCase()) ||
          inc.criterionCode.toLowerCase().includes(historySearch.toLowerCase()) ||
          inc.criterionName.toLowerCase().includes(historySearch.toLowerCase()) ||
          (inc.notes && inc.notes.toLowerCase().includes(historySearch.toLowerCase()));

        const matchesMonth = filterMonth === 'all' || inc.month === filterMonth;
        const matchesType = filterType === 'all' || inc.type === filterType;

        return matchesSearch && matchesMonth && matchesType;
      });
  }, [incidentsList, schoolYear, historySearch, filterMonth, filterType]);

  const handleExportIncidents = () => {
    const headers = [
      'STT',
      'Ngày',
      'Tháng',
      'Họ và tên',
      'Tổ/Bộ phận',
      'Đối tượng',
      'Mã tiêu chí',
      'Nội dung tiêu chí',
      'Loại',
      'Số lượng',
      'Mức điểm',
      'Tổng điểm',
      'Minh chứng',
      'Ghi chú',
      'Người ghi nhận',
    ];
    const rows = filteredIncidents.map((inc, idx) => [
      idx + 1,
      inc.date,
      inc.month,
      inc.personName,
      inc.department,
      inc.personType === 'giaovien' ? 'Giáo viên' : inc.personType === 'nhanvien' ? 'Nhân viên' : 'BGH',
      inc.criterionCode,
      inc.criterionName,
      inc.type === 'plus' ? 'Cộng' : 'Trừ',
      inc.quantity,
      inc.unitPoints,
      inc.totalPoints,
      inc.evidenceRef || '',
      inc.notes || '',
      inc.createdBy,
    ]);
    downloadCsv(`Nhat_ky_phat_sinh_KPI_${schoolYear.replace(/\s+/g, '')}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Prominent Back Button to return to working module */}
      <div className="flex items-center justify-between bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={() =>
            setActiveTab(
              personType === 'bgh'
                ? 'bgh'
                : personType === 'nhanvien'
                ? 'kpi-nhanvien'
                : 'giaovien'
            )
          }
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-black text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-amber-300" />
          <span>
            ← Quay lại Module{' '}
            {personType === 'bgh'
              ? 'KPI Cán bộ Quản lý'
              : personType === 'nhanvien'
              ? 'KPI Nhân viên'
              : 'KPI Giáo viên'}
          </span>
        </button>

        <div className="text-xs font-bold text-slate-600 hidden sm:flex items-center gap-2">
          <span>Ghi nhận phát sinh KPI trường THPT Phương Xá</span>
        </div>
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shrink-0">
            <PlusCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
              NHẬP PHÁT SINH KPI NỘI BỘ
            </h2>
            <p className="text-xs text-slate-500">
              Ghi nhận điểm cộng thi đua, hoàn thành nhiệm vụ hoặc điểm trừ vi phạm nề nếp
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportIncidents}
            className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất Nhật Ký</span>
          </button>
          <button
            onClick={() =>
              openPrintModal(
                'NHẬT KÝ PHÁT SINH KPI NĂM HỌC ' + schoolYear,
                `${schoolConfig.normalName} – Danh sách các điểm cộng / trừ đã ghi nhận`
              )
            }
            className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>In nhật ký</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Form Left, Incident History Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form (5 Cols) */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-emerald-600" />
              <span>Biểu Mẫu Ghi Nhận Điểm</span>
            </h3>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {schoolYear}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* 1. Chọn Đối tượng */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                1. Nhóm đối tượng: <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'bgh', label: 'Ban Giám hiệu' },
                  { id: 'giaovien', label: 'Giáo viên' },
                  { id: 'nhanvien', label: 'Nhân viên' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPersonType(opt.id as PersonType)}
                    className={`py-2 px-2 rounded-lg border text-xs font-semibold transition cursor-pointer text-center ${
                      personType === opt.id
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Người được đánh giá */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                2. Người được đánh giá: <span className="text-rose-500">*</span>
              </label>
              <select
                value={personId}
                onChange={(e) => setPersonId(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
              >
                {filteredStaff.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name} ({p.position} - {p.department})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Ngày phát sinh */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                3. Ngày phát sinh: <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
              />
            </div>

            {/* 4. Tiêu chí KPI */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                4. Tiêu chí KPI áp dụng: <span className="text-rose-500">*</span>
              </label>
              <select
                value={criterionId}
                onChange={(e) => handleCriterionChange(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
              >
                {filteredCriteria.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.code}] - [{c.type === 'plus' ? 'Cộng' : 'Trừ'} {c.points}đ] - {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 5. Điểm số & Số lượng */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Loại điểm</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ScoreType)}
                  className={`w-full p-1.5 rounded-lg border font-bold text-xs ${
                    type === 'plus'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-rose-50 text-rose-700 border-rose-300'
                  }`}
                >
                  <option value="plus">+ Cộng</option>
                  <option value="minus">- Trừ</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Số lần</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full p-1.5 rounded-lg border border-slate-300 bg-white font-bold text-center text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Mức điểm</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={unitPoints}
                  onChange={(e) => setUnitPoints(Number(e.target.value))}
                  className="w-full p-1.5 rounded-lg border border-slate-300 bg-white font-bold text-center text-xs"
                  required
                />
              </div>
            </div>

            {/* Total Points Display */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-200">
              <span className="font-bold text-slate-700">Tổng điểm ghi nhận:</span>
              <span
                className={`text-base font-black ${
                  type === 'plus' ? 'text-emerald-700' : 'text-rose-700'
                }`}
              >
                {type === 'plus' ? '+' : '-'} {totalPoints} điểm
              </span>
            </div>

            {/* Minh chứng */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Minh chứng / Quyết định kèm theo:</label>
              <input
                type="text"
                value={evidenceRef}
                onChange={(e) => setEvidenceRef(e.target.value)}
                placeholder="Số văn bản, biên bản sinh hoạt tổ, giấy chứng nhận..."
                className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            {/* Ghi chú */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nội dung chi tiết sự việc:</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mô tả cụ thể sự việc để đảm bảo tính minh bạch khi công khai..."
                className="w-full p-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <button
              id="btn-save-incident-main"
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <Check className="w-4 h-4" />
              <span>LƯU PHÁT SINH KPI</span>
            </button>
          </form>
        </div>

        {/* Right Column: History List (7 Cols) */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Nhật Ký Phát Sinh Đã Nhập ({filteredIncidents.length})</span>
                </h3>
                <p className="text-[11px] text-slate-500">Tra cứu, đối soát và quản lý các mục đã ghi</p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
              <div className="relative flex-1 min-w-[160px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Tìm theo tên người, mã tiêu chí..."
                  className="w-full pl-8 pr-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <select
                value={filterMonth}
                onChange={(e) =>
                  setFilterMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))
                }
                className="py-1.5 px-2 rounded-lg border border-slate-300 text-xs bg-white"
              >
                <option value="all">Tất cả các tháng</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    Tháng {m}
                  </option>
                ))}
              </select>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="py-1.5 px-2 rounded-lg border border-slate-300 text-xs bg-white"
              >
                <option value="all">Tất cả loại</option>
                <option value="plus">+ Điểm cộng</option>
                <option value="minus">- Điểm trừ</option>
              </select>
            </div>

            {/* List */}
            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {filteredIncidents.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Chưa có dòng phát sinh KPI nào phù hợp với bộ lọc.
                </div>
              ) : (
                filteredIncidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 hover:border-blue-300 bg-slate-50/40 hover:bg-white transition flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-2.5 overflow-hidden">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                          inc.type === 'plus'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {inc.type === 'plus' ? '+' : '-'}
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 text-sm">{inc.personName}</span>
                          <span className="text-[10px] text-slate-500 font-medium px-1.5 py-0.2 rounded bg-slate-200/70">
                            {inc.department}
                          </span>
                        </div>
                        <div className="text-slate-700 font-medium mt-0.5">
                          <span className="font-mono font-bold text-blue-700 mr-1">
                            [{inc.criterionCode}]
                          </span>
                          <span>{inc.criterionName}</span>
                        </div>
                        {inc.notes && (
                          <div className="text-[11px] text-slate-500 italic mt-0.5">
                            Ghi chú: {inc.notes}
                          </div>
                        )}
                        {inc.evidenceRef && (
                          <div className="text-[10px] text-blue-600 font-medium mt-0.5 flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            <span>Minh chứng: {inc.evidenceRef}</span>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-1">
                          Ngày: {inc.date} • Ghi bởi: {inc.createdBy}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-base font-black ${
                          inc.type === 'plus' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {inc.type === 'plus' ? '+' : '-'}
                        {inc.totalPoints} đ
                      </div>
                      <button
                        onClick={() => deleteIncident(inc.id)}
                        className="mt-2 p-1 text-slate-400 hover:text-rose-600 rounded transition"
                        title="Xóa dòng phát sinh này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Dữ liệu được lưu trữ tự động trên thiết bị</span>
            <span className="font-semibold text-blue-700">{schoolConfig.normalName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
