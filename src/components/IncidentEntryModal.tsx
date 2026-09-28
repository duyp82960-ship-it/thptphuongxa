import React, { useState, useEffect } from 'react';
import { useKpi } from '../context/KpiContext';
import { PersonType, ScoreType } from '../types';
import { PlusCircle, X, Check, FileText, Calendar, User, Sparkles } from 'lucide-react';

interface IncidentEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPersonId?: string;
}

export const IncidentEntryModal: React.FC<IncidentEntryModalProps> = ({
  isOpen,
  onClose,
  initialPersonId,
}) => {
  const {
    staffList,
    criteriaList,
    addIncident,
    schoolYear,
    semester,
    currentUser,
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

  // Handle initial person if passed
  useEffect(() => {
    if (initialPersonId) {
      const p = staffList.find((s) => s.id === initialPersonId);
      if (p) {
        setPersonType(p.type);
        setPersonId(p.id);
      }
    } else if (!personId) {
      // Pick first matching person
      const firstPerson = staffList.find((s) => s.type === personType);
      if (firstPerson) setPersonId(firstPerson.id);
    }
  }, [initialPersonId, staffList, personType]);

  // Filter staff by selected personType
  const filteredStaff = staffList.filter((s) => s.type === personType);

  // When personType changes, ensure selected person belongs to it
  const handlePersonTypeChange = (newType: PersonType) => {
    setPersonType(newType);
    const firstInNewType = staffList.find((s) => s.type === newType);
    if (firstInNewType) {
      setPersonId(firstInNewType.id);
    } else {
      setPersonId('');
    }
  };

  // Filter criteria applicable to selected personType
  const filteredCriteria = criteriaList.filter(
    (c) => c.status === 'active' && (c.targetRole === 'all' || c.targetRole === personType)
  );

  // Set default criterion when list or type changes
  useEffect(() => {
    if (filteredCriteria.length > 0) {
      const curCrit = filteredCriteria.find((c) => c.id === criterionId);
      if (!curCrit) {
        const first = filteredCriteria[0];
        setCriterionId(first.id);
        setType(first.type);
        setUnitPoints(first.points);
      }
    }
  }, [personType, filteredCriteria, criterionId]);

  // When criterion changes, auto-fill score and type
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

    // Reset form fields
    setNotes('');
    setEvidenceRef('');
    setQuantity(1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-800 to-indigo-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-700/70 border border-blue-400/30">
              <PlusCircle className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">NHẬP PHÁT SINH KPI</h2>
              <p className="text-xs text-blue-200">Ghi nhận điểm cộng / điểm trừ cho cán bộ, giáo viên, nhân viên</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-blue-700/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          {/* 1. Chọn Đối tượng */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              1. Nhóm đối tượng đánh giá: <span className="text-rose-500">*</span>
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
                  onClick={() => handlePersonTypeChange(opt.id as PersonType)}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                    personType === opt.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 2. Người được đánh giá */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                2. Người được đánh giá: <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={personId}
                  onChange={(e) => setPersonId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  required
                >
                  {filteredStaff.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name} ({p.position} - {p.department})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 3. Ngày phát sinh */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                3. Ngày phát sinh: <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* 4. Tiêu chí KPI */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              4. Tiêu chí KPI áp dụng: <span className="text-rose-500">*</span>
            </label>
            <select
              value={criterionId}
              onChange={(e) => handleCriterionChange(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-medium focus:ring-2 focus:ring-blue-600 focus:outline-none"
              required
            >
              {filteredCriteria.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.code}] - [{c.type === 'plus' ? 'Cộng' : 'Trừ'} {c.points}đ] - {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Score adjustments: Type, Quantity, Unit Points, Total Points */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Loại điểm</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ScoreType)}
                className={`w-full p-1.5 rounded-lg border text-xs font-bold ${
                  type === 'plus'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-rose-50 text-rose-700 border-rose-300'
                }`}
              >
                <option value="plus">+ Điểm cộng</option>
                <option value="minus">- Điểm trừ</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Số lượng lần</label>
              <input
                type="number"
                min="1"
                max="20"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full p-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-center"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Mức điểm / lần</label>
              <input
                type="number"
                min="1"
                max="50"
                value={unitPoints}
                onChange={(e) => setUnitPoints(Number(e.target.value))}
                className="w-full p-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-center"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Tổng điểm</label>
              <div
                className={`p-1.5 rounded-lg border text-xs font-extrabold text-center ${
                  type === 'plus'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border-rose-300'
                }`}
              >
                {type === 'plus' ? '+' : '-'} {totalPoints} điểm
              </div>
            </div>
          </div>

          {/* Minh chứng / Số quyết định */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Minh chứng / Số công văn / Quyết định:
            </label>
            <input
              type="text"
              value={evidenceRef}
              onChange={(e) => setEvidenceRef(e.target.value)}
              placeholder="Ví dụ: QĐ số 45/QĐ-SGD&ĐT, Sổ theo dõi nề nếp tuần 3..."
              className="w-full p-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          {/* Ghi chú chi tiết */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Nội dung mô tả chi tiết sự việc:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi rõ lý do cộng hoặc trừ điểm để làm cơ sở công khai minh bạch..."
              className="w-full p-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              id="btn-submit-incident"
              type="submit"
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>LƯU PHÁT SINH KPI</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
