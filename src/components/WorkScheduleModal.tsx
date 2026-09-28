import React, { useState, useEffect } from 'react';
import { WeeklyWorkSchedule, DailySchedule } from '../types';
import { X, Plus, Trash2, Save, Calendar } from 'lucide-react';

interface WorkScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedule: WeeklyWorkSchedule) => void;
  initialSchedule?: WeeklyWorkSchedule | null;
}

const DEFAULT_DAYS_TEMPLATE = [
  { dayOfWeek: 'HAI', date: '', morningContent: 'Học theo TKB', afternoonContent: 'Học theo TKB', leadership: 'Kiên + Lan' },
  { dayOfWeek: 'BA', date: '', morningContent: 'Học theo TKB', afternoonContent: 'Học theo TKB', leadership: 'Kiên + Châm' },
  { dayOfWeek: 'TƯ', date: '', morningContent: 'Học theo TKB', afternoonContent: 'Học theo TKB', leadership: 'Kiên + Đông' },
  { dayOfWeek: 'NĂM', date: '', morningContent: 'Học theo TKB', afternoonContent: 'Học theo TKB', leadership: 'Kiên + Châm' },
  { dayOfWeek: 'SÁU', date: '', morningContent: 'Học theo TKB', afternoonContent: 'Học theo TKB', leadership: 'Kiên + Lan' },
  { dayOfWeek: 'BẢY', date: '', morningContent: 'Học theo TKB', afternoonContent: 'Học theo TKB', leadership: 'Kiên + Đông' },
  { dayOfWeek: 'CN', date: '', morningContent: '', afternoonContent: '', leadership: '' },
];

export const WorkScheduleModal: React.FC<WorkScheduleModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSchedule,
}) => {
  const [weekNumber, setWeekNumber] = useState<number>(4);
  const [schoolYear, setSchoolYear] = useState<string>('2026 - 2027');
  const [fromDate, setFromDate] = useState<string>('28/9/2026');
  const [toDate, setToDate] = useState<string>('04/10/2026');
  const [dutyClass, setDutyClass] = useState<string>('10A4');
  const [dutyTeacher, setDutyTeacher] = useState<string>('Trần Quang Vinh');
  const [principalName, setPrincipalName] = useState<string>('Tạ Duy Kiên');
  const [issueDate, setIssueDate] = useState<string>('Cẩm Khê, ngày 28 tháng 9 năm 2026');
  const [notes, setNotes] = useState<string[]>([
    'Học sinh có mặt buổi sáng lúc 6h 50, buổi chiều 13h55.',
    'GVCN sử dụng EnetViet nhắn tin gửi thông báo hàng ngày cho phụ huynh trường hợp cần hỗ trợ cài đặt, hướng dẫn sử dụng liên hệ Đ/c Hoàng và nhóm CNTT hỗ trợ. (Hệ thống EnetViet đã được kích hoạt).',
    'Thời gian tính giờ buổi sáng tiết 1 từ 7h00. Buổi chiều từ 14h.',
    'Lịch công tác có thể thay đổi và điều chỉnh theo Hướng dẫn của Sở và xã Cẩm Khê.',
  ]);
  const [days, setDays] = useState<DailySchedule[]>(DEFAULT_DAYS_TEMPLATE);
  const [newNote, setNewNote] = useState<string>('');

  useEffect(() => {
    if (initialSchedule) {
      setWeekNumber(initialSchedule.weekNumber);
      setSchoolYear(initialSchedule.schoolYear);
      setFromDate(initialSchedule.fromDate);
      setToDate(initialSchedule.toDate);
      setDutyClass(initialSchedule.dutyClass);
      setDutyTeacher(initialSchedule.dutyTeacher);
      setPrincipalName(initialSchedule.principalName || 'Tạ Duy Kiên');
      setIssueDate(initialSchedule.issueDate || 'Cẩm Khê, ngày 28 tháng 9 năm 2026');
      setNotes(initialSchedule.notes || []);
      setDays(initialSchedule.days || DEFAULT_DAYS_TEMPLATE);
    } else {
      setWeekNumber(4);
      setSchoolYear('2026 - 2027');
      setFromDate('28/9/2026');
      setToDate('04/10/2026');
      setDutyClass('10A4');
      setDutyTeacher('Trần Quang Vinh');
      setPrincipalName('Tạ Duy Kiên');
      setIssueDate('Cẩm Khê, ngày 28 tháng 9 năm 2026');
      setNotes([
        'Học sinh có mặt buổi sáng lúc 6h 50, buổi chiều 13h55.',
        'GVCN sử dụng EnetViet nhắn tin gửi thông báo hàng ngày cho phụ huynh.',
        'Thời gian tính giờ buổi sáng tiết 1 từ 7h00. Buổi chiều từ 14h.',
      ]);
      setDays(DEFAULT_DAYS_TEMPLATE);
    }
  }, [initialSchedule, isOpen]);

  if (!isOpen) return null;

  const handleDayChange = (index: number, field: keyof DailySchedule, value: string) => {
    const updated = [...days];
    updated[index] = { ...updated[index], [field]: value };
    setDays(updated);
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    setNotes([...notes, newNote.trim()]);
    setNewNote('');
  };

  const handleRemoveNote = (idx: number) => {
    setNotes(notes.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const schedule: WeeklyWorkSchedule = {
      id: initialSchedule ? initialSchedule.id : `week-${weekNumber}-${Date.now()}`,
      weekNumber: Number(weekNumber),
      schoolYear,
      fromDate,
      toDate,
      dutyClass,
      dutyTeacher,
      principalName,
      issueDate,
      notes,
      days,
      updatedAt: new Date().toISOString(),
    };
    onSave(schedule);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-800 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md">
              <Calendar className="w-6 h-6 text-cyan-300" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-wide">
                {initialSchedule ? `Chỉnh sửa Lịch công tác Tuần ${weekNumber}` : 'Thêm Lịch công tác Tuần mới'}
              </h3>
              <p className="text-xs text-blue-200">Trường THPT Phương Xá - Năm học {schoolYear}</p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
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
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Năm học</label>
              <input
                type="text"
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
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

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Lớp trực tuần</label>
              <input
                type="text"
                value={dutyClass}
                onChange={(e) => setDutyClass(e.target.value)}
                placeholder="10A4"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">GV trực tuần</label>
              <input
                type="text"
                value={dutyTeacher}
                onChange={(e) => setDutyTeacher(e.target.value)}
                placeholder="Trần Quang Vinh"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Hiệu trưởng ký</label>
              <input
                type="text"
                value={principalName}
                onChange={(e) => setPrincipalName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Địa điểm & Ngày ký</label>
              <input
                type="text"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600 outline-none"
                required
              />
            </div>
          </div>

          {/* Daily Schedule Table Editor */}
          <div>
            <h4 className="text-sm font-bold text-slate-800 uppercase mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Nội dung công tác các ngày trong tuần</span>
            </h4>
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <th className="p-3 w-24">Thứ</th>
                    <th className="p-3 w-28">Ngày tháng</th>
                    <th className="p-3">Buổi Sáng 7h00</th>
                    <th className="p-3">Buổi Chiều 14h00</th>
                    <th className="p-3 w-36">Lãnh đạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {days.map((day, idx) => (
                    <tr key={day.dayOfWeek} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-blue-900 bg-slate-50/50">
                        {day.dayOfWeek}
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={day.date}
                          onChange={(e) => handleDayChange(idx, 'date', e.target.value)}
                          placeholder="28/9/2026"
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-600 outline-none"
                        />
                      </td>
                      <td className="p-3">
                        <textarea
                          rows={3}
                          value={day.morningContent}
                          onChange={(e) => handleDayChange(idx, 'morningContent', e.target.value)}
                          placeholder="Nội dung buổi sáng..."
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-600 outline-none resize-y"
                        />
                      </td>
                      <td className="p-3">
                        <textarea
                          rows={3}
                          value={day.afternoonContent}
                          onChange={(e) => handleDayChange(idx, 'afternoonContent', e.target.value)}
                          placeholder="Nội dung buổi chiều..."
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-600 outline-none resize-y"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          type="text"
                          value={day.leadership}
                          onChange={(e) => handleDayChange(idx, 'leadership', e.target.value)}
                          placeholder="Kiên + Lan"
                          className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium focus:ring-1 focus:ring-blue-600 outline-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes Editor */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-800 uppercase">Ghi chú (Lưu ý)</h4>
            <div className="space-y-2">
              {notes.map((note, index) => (
                <div key={index} className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-blue-600 shrink-0">-</span>
                  <span className="flex-1 text-xs text-slate-700">{note}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveNote(index)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Thêm ghi chú mới..."
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-600 outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNote();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddNote}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm ghi chú</span>
              </button>
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
              <span>Lưu Lịch công tác</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
