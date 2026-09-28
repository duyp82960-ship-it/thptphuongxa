import React, { useState, useEffect } from 'react';
import { SchoolWorkSchedule, SchoolTaskDay } from '../types';
import { X, Save, Calendar, Building2 } from 'lucide-react';

interface SchoolWorkScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedule: SchoolWorkSchedule) => void;
  initialSchedule?: SchoolWorkSchedule | null;
}

const DEFAULT_DAYS_TEMPLATE: SchoolTaskDay[] = [
  { dayOfWeek: 'Thứ Hai', date: '', morningContent: '', afternoonContent: '', completionDate: '', leadershipReview: '', note: '' },
  { dayOfWeek: 'Thứ Ba', date: '', morningContent: '', afternoonContent: '', completionDate: '', leadershipReview: '', note: '' },
  { dayOfWeek: 'Thứ Tư', date: '', morningContent: '', afternoonContent: '', completionDate: '', leadershipReview: '', note: '' },
  { dayOfWeek: 'Thứ Năm', date: '', morningContent: '', afternoonContent: '', completionDate: '', leadershipReview: '', note: '' },
  { dayOfWeek: 'Thứ Sáu', date: '', morningContent: '', afternoonContent: '', completionDate: '', leadershipReview: '', note: '' },
  { dayOfWeek: 'Thứ Bảy', date: '', morningContent: '', afternoonContent: '', completionDate: '', leadershipReview: '', note: '' },
  { dayOfWeek: 'Chủ Nhật', date: '', morningContent: '', afternoonContent: '', completionDate: '', leadershipReview: '', note: '' },
];

export const SchoolWorkScheduleModal: React.FC<SchoolWorkScheduleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSchedule,
}) => {
  const [schoolName, setSchoolName] = useState<string>('TRƯỜNG THPT PHƯƠNG XÁ');
  const [titleName, setTitleName] = useState<string>('BAN GIÁM HIỆU GIAO VIỆC NHÀ TRƯỜNG');
  const [weekNumber, setWeekNumber] = useState<number>(4);
  const [fromDate, setFromDate] = useState<string>('28/9/2026');
  const [toDate, setToDate] = useState<string>('04/10/2026');
  const [month, setMonth] = useState<number>(9);
  const [year, setYear] = useState<number>(2026);
  const [days, setDays] = useState<SchoolTaskDay[]>(DEFAULT_DAYS_TEMPLATE);

  useEffect(() => {
    if (initialSchedule) {
      setSchoolName(initialSchedule.schoolName || 'TRƯỜNG THPT PHƯƠNG XÁ');
      setTitleName(initialSchedule.titleName || 'BAN GIÁM HIỆU GIAO VIỆC NHÀ TRƯỜNG');
      setWeekNumber(initialSchedule.weekNumber || 4);
      setFromDate(initialSchedule.fromDate || '28/9/2026');
      setToDate(initialSchedule.toDate || '04/10/2026');
      setMonth(initialSchedule.month || 9);
      setYear(initialSchedule.year || 2026);
      setDays(initialSchedule.days || DEFAULT_DAYS_TEMPLATE);
    } else {
      setSchoolName('TRƯỜNG THPT PHƯƠNG XÁ');
      setTitleName('BAN GIÁM HIỆU GIAO VIỆC NHÀ TRƯỜNG');
      setWeekNumber(4);
      setFromDate('28/9/2026');
      setToDate('04/10/2026');
      setMonth(9);
      setYear(2026);
      setDays(DEFAULT_DAYS_TEMPLATE);
    }
  }, [initialSchedule, isOpen]);

  if (!isOpen) return null;

  const handleDayChange = (index: number, field: keyof SchoolTaskDay, value: string) => {
    const updated = [...days];
    updated[index] = { ...updated[index], [field]: value };
    setDays(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const schedule: SchoolWorkSchedule = {
      id: initialSchedule ? initialSchedule.id : `school-sched-${Date.now()}`,
      schoolName,
      titleName,
      weekNumber: Number(weekNumber),
      fromDate,
      toDate,
      month: Number(month),
      year: Number(year),
      days,
      updatedAt: new Date().toISOString(),
    };
    onSave(schedule);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md">
              <Building2 className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-wide">
                {initialSchedule ? `Chỉnh sửa Lịch giao việc Nhà Trường` : 'Thêm Lịch giao việc Nhà Trường'}
              </h3>
              <p className="text-xs text-blue-200">Trường THPT Phương Xá - Tuần {weekNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* General Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tên Trường</label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cơ quan / Tiêu đề giao việc</label>
              <input
                type="text"
                value={titleName}
                onChange={(e) => setTitleName(e.target.value)}
                placeholder="BAN GIÁM HIỆU GIAO VIỆC NHÀ TRƯỜNG"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Số Tuần</label>
              <input
                type="number"
                value={weekNumber}
                onChange={(e) => setWeekNumber(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Từ ngày</label>
              <input
                type="text"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                placeholder="28/9/2026"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Đến ngày</label>
              <input
                type="text"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                placeholder="04/10/2026"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tháng</label>
                <input
                  type="number"
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Năm</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Table Editor */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 uppercase mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Nội dung giao việc nhà trường các ngày trong tuần</span>
            </h4>
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-center">
                    <th className="p-3 w-28">Thứ, ngày</th>
                    <th className="p-3">Sáng (Nội dung công việc)</th>
                    <th className="p-3">Chiều (Nội dung công việc)</th>
                    <th className="p-3 w-32">Ngày hoàn thành</th>
                    <th className="p-3 w-36">Lãnh đạo trực/đánh giá</th>
                    <th className="p-3 w-28">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {days.map((day, idx) => (
                    <tr key={day.dayOfWeek} className="hover:bg-slate-50">
                      <td className="p-3 align-top">
                        <div className="font-bold text-blue-900">{day.dayOfWeek}</div>
                        <input
                          type="text"
                          value={day.date}
                          onChange={(e) => handleDayChange(idx, 'date', e.target.value)}
                          placeholder="28/9/2026"
                          className="w-full mt-1 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-600 outline-none"
                        />
                      </td>
                      <td className="p-3 align-top">
                        <textarea
                          rows={3}
                          value={day.morningContent}
                          onChange={(e) => handleDayChange(idx, 'morningContent', e.target.value)}
                          placeholder="Nội dung công việc buổi sáng..."
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-600 outline-none resize-y"
                        />
                      </td>
                      <td className="p-3 align-top">
                        <textarea
                          rows={3}
                          value={day.afternoonContent}
                          onChange={(e) => handleDayChange(idx, 'afternoonContent', e.target.value)}
                          placeholder="Nội dung công việc buổi chiều..."
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-600 outline-none resize-y"
                        />
                      </td>
                      <td className="p-3 align-top">
                        <input
                          type="text"
                          value={day.completionDate}
                          onChange={(e) => handleDayChange(idx, 'completionDate', e.target.value)}
                          placeholder="28/09/2026"
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-600 outline-none"
                        />
                      </td>
                      <td className="p-3 align-top">
                        <textarea
                          rows={3}
                          value={day.leadershipReview}
                          onChange={(e) => handleDayChange(idx, 'leadershipReview', e.target.value)}
                          placeholder="Lãnh đạo trực/đánh giá..."
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-600 outline-none resize-y"
                        />
                      </td>
                      <td className="p-3 align-top">
                        <input
                          type="text"
                          value={day.note}
                          onChange={(e) => handleDayChange(idx, 'note', e.target.value)}
                          placeholder="Ghi chú..."
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-600 outline-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-100 transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Lịch Giao Việc Nhà Trường</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
