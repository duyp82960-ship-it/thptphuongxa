import React, { useState, useEffect, useRef } from 'react';
import { useKpi } from '../context/KpiContext';
import { SchoolWorkSchedule } from '../types';
import { INITIAL_SCHOOL_WORK_SCHEDULES } from '../data/initialSchoolWorkSchedules';
import { SchoolWorkScheduleModal } from './SchoolWorkScheduleModal';
import { downloadSchoolScheduleTemplateExcel } from '../utils/exportUtils';
import * as XLSX from 'xlsx';
import {
  Printer,
  Plus,
  Edit3,
  Trash2,
  Building2,
  FileText,
  Upload,
  Download,
} from 'lucide-react';

export const SchoolWorkScheduleView: React.FC = () => {
  const { currentUser, showToast } = useKpi();
  const [schedules, setSchedules] = useState<SchoolWorkSchedule[]>(() => {
    try {
      const saved = localStorage.getItem('thpt_son_luong_school_schedules');
      if (saved) {
        const parsed: SchoolWorkSchedule[] = JSON.parse(saved);
        return parsed.map((s) =>
          s.schoolName === 'TRƯỜNG THPT SƠN LƯƠNG' ? { ...s, schoolName: 'TRƯỜNG THPT PHƯƠNG XÁ' } : s
        );
      }
    } catch (e) {
      console.warn('Failed to load school schedules from localStorage:', e);
    }
    return INITIAL_SCHOOL_WORK_SCHEDULES;
  });

  const [activeScheduleId, setActiveScheduleId] = useState<string>(
    schedules.length > 0 ? schedules[0].id : ''
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<SchoolWorkSchedule | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSchedule =
    schedules.find((s) => s.id === activeScheduleId) || schedules[0];

  useEffect(() => {
    try {
      localStorage.setItem('thpt_son_luong_school_schedules', JSON.stringify(schedules));
    } catch (e) {
      console.warn('Failed to save school schedules to localStorage:', e);
    }
  }, [schedules]);

  const handleSaveSchedule = (savedSchedule: SchoolWorkSchedule) => {
    const exists = schedules.some((s) => s.id === savedSchedule.id);
    if (exists) {
      setSchedules(schedules.map((s) => (s.id === savedSchedule.id ? savedSchedule : s)));
      showToast(`Đã cập nhật Lịch giao việc nhà trường thành công!`, 'success');
    } else {
      setSchedules([savedSchedule, ...schedules]);
      setActiveScheduleId(savedSchedule.id);
      showToast(`Đã thêm Lịch giao việc nhà trường thành công!`, 'success');
    }
  };

  const handleDeleteSchedule = (id: string) => {
    if (schedules.length <= 1) {
      showToast('Không thể xóa lịch giao việc duy nhất còn lại trong hệ thống.', 'error');
      return;
    }
    if (window.confirm('Bạn có chắc chắn muốn xóa lịch giao việc nhà trường này?')) {
      const filtered = schedules.filter((s) => s.id !== id);
      setSchedules(filtered);
      if (filtered.length > 0) {
        setActiveScheduleId(filtered[0].id);
      }
      showToast('Đã xóa lịch giao việc nhà trường thành công.', 'success');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportWord = () => {
    if (!activeSchedule) return;
    showToast('Đang chuẩn bị tệp Word lịch giao việc nhà trường...', 'info');
    setTimeout(() => {
      const content = `${activeSchedule.schoolName}\n${activeSchedule.titleName || 'BAN GIÁM HIỆU GIAO VIỆC NHÀ TRƯỜNG'}\n\nTUẦN: ${activeSchedule.weekNumber}\n(Từ ngày ${activeSchedule.fromDate} đến ngày ${activeSchedule.toDate} năm ${activeSchedule.year})\n\n` +
        activeSchedule.days.map(d => `${d.dayOfWeek}, ${d.date}:\n- Sáng: ${d.morningContent}\n- Chiều: ${d.afternoonContent}\n- Ngày hoàn thành: ${d.completionDate}\n- Lãnh đạo trực/đánh giá: ${d.leadershipReview}\n- Ghi chú: ${d.note}\n`).join('\n');

      const blob = new Blob([content], { type: 'application/msword;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Lich_giao_viec_Nha_Truong_Tuan_${activeSchedule.weekNumber}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Tải xuống tệp Word thành công!', 'success');
    }, 600);
  };

  const handleDownloadTemplate = () => {
    downloadSchoolScheduleTemplateExcel();
    showToast('Đã tải xuống file Excel mẫu lịch giao việc nhà trường thành công!', 'success');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    try {
      const buffer = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<any>(worksheet, { defval: '' });

      if (!rows || rows.length === 0) {
        showToast('File Excel không có dữ liệu.', 'error');
        return;
      }

      const newDays = rows.map((row: any) => ({
        dayOfWeek: String(row['Thứ'] || 'Thứ Hai'),
        date: String(row['Ngày'] || ''),
        morningContent: String(row['Sáng (Nội dung công việc)'] || row['Sáng'] || ''),
        afternoonContent: String(row['Chiều (Nội dung công việc)'] || row['Chiều'] || ''),
        completionDate: String(row['Ngày hoàn thành'] || ''),
        leadershipReview: String(row['Lãnh đạo trực/đánh giá'] || row['Lãnh đạo'] || ''),
        note: String(row['Ghi chú'] || ''),
      }));

      if (activeSchedule) {
        const updated = {
          ...activeSchedule,
          days: newDays.length >= 7 ? newDays.slice(0, 7) : [...newDays, ...Array(7 - newDays.length).fill({ dayOfWeek: 'Khác', date: '', morningContent: '', afternoonContent: '', completionDate: '', leadershipReview: '', note: '' })],
          updatedAt: new Date().toISOString(),
        };
        handleSaveSchedule(updated);
        showToast(`Đã nhập dữ liệu từ file Excel lịch giao việc nhà trường thành công!`, 'success');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error(err);
      showToast('Lỗi đọc file Excel. Vui lòng sử dụng đúng file mẫu.', 'error');
    }
  };

  const isBgh = currentUser?.role === 'bgh';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 print:p-0 print:max-w-none print:m-0">
      {/* Top Action & Navigation Bar (Hidden in Print) */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-100 text-amber-700">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Module Lịch Giao Việc Nhà Trường</h2>
            <p className="text-xs text-slate-500">Trường THPT Phương Xá • Ban Giám Hiệu phân công & chỉ đạo nhiệm vụ toàn trường</p>
          </div>
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Week Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700">Tuần:</span>
            <select
              value={activeSchedule?.id}
              onChange={(e) => setActiveScheduleId(e.target.value)}
              className="bg-transparent text-xs font-black text-blue-700 outline-none cursor-pointer"
            >
              {schedules.map((s) => (
                <option key={s.id} value={s.id}>
                  Tuần {s.weekNumber} ({s.fromDate} - {s.toDate})
                </option>
              ))}
            </select>
          </div>

          {isBgh && (
            <button
              onClick={() => {
                setEditingSchedule(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Tuần mới</span>
            </button>
          )}

          {isBgh && activeSchedule && (
            <button
              onClick={() => {
                setEditingSchedule(activeSchedule);
                setIsModalOpen(true);
              }}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Sửa</span>
            </button>
          )}

          {isBgh && schedules.length > 1 && activeSchedule && (
            <button
              onClick={() => handleDeleteSchedule(activeSchedule.id)}
              className="px-3.5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa</span>
            </button>
          )}

          {/* Excel Template Upload & Download */}
          <button
            onClick={handleDownloadTemplate}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Tải xuống file Excel mẫu lịch giao việc nhà trường"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Tải file mẫu</span>
          </button>

          <label
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
            title="Tải lên lịch giao việc nhà trường từ file Excel"
          >
            <Upload className="w-4 h-4" />
            <span>Tải lên từ file</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            onClick={handleExportWord}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Xuất Word</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 shadow-md transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>In Lịch Giao Việc</span>
          </button>
        </div>
      </div>

      {/* Official Printable Document Container */}
      {activeSchedule ? (
        <div id="printable-school-schedule" className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-200 print:shadow-none print:border-none print:p-0">
          {/* Header School Name */}
          <div className="space-y-1 pb-4">
            <p className="uppercase text-slate-900 font-bold text-xs tracking-wider">
              {activeSchedule.schoolName || 'TRƯỜNG THPT PHƯƠNG XÁ'}
            </p>
            <p className="uppercase text-amber-900 font-black text-sm tracking-wide">
              {activeSchedule.titleName || 'BAN GIÁM HIỆU GIAO VIỆC NHÀ TRƯỜNG'}
            </p>
          </div>

          {/* Week & Date Range Header */}
          <div className="text-center my-6 space-y-2">
            <h3 className="text-base font-black uppercase text-slate-900 tracking-wider">
              TUẦN: {activeSchedule.weekNumber}
            </h3>
            <p className="text-xs font-bold text-slate-700 italic">
              (Từ ngày {activeSchedule.fromDate} đến ngày {activeSchedule.toDate} năm {activeSchedule.year || 2026})
            </p>
          </div>

          {/* Table matching template exactly with Ngày hoàn thành column */}
          <div className="overflow-x-auto border-2 border-slate-800 rounded-lg mt-4">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-800 text-slate-900 font-black text-center">
                  <th className="p-3 border-r border-slate-800 w-28">Thứ, ngày</th>
                  <th className="p-3 border-r border-slate-800 w-1/3">
                    Sáng
                    <div className="font-normal text-[11px] text-slate-600 mt-0.5">Nội dung công việc</div>
                  </th>
                  <th className="p-3 border-r border-slate-800 w-1/3">
                    Chiều
                    <div className="font-normal text-[11px] text-slate-600 mt-0.5">Nội dung công việc</div>
                  </th>
                  <th className="p-3 border-r border-slate-800 w-28">Ngày hoàn thành</th>
                  <th className="p-3 border-r border-slate-800 w-36">Lãnh đạo trực/đánh giá</th>
                  <th className="p-3 w-28">Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {activeSchedule.days.map((day) => (
                  <tr key={day.dayOfWeek} className="hover:bg-slate-50">
                    <td className="p-3 border-r border-slate-800 font-bold text-center text-blue-900 bg-slate-50/80 align-middle">
                      <div>{day.dayOfWeek}</div>
                      <div className="text-[11px] font-semibold text-slate-700 mt-0.5">{day.date}</div>
                    </td>
                    <td className="p-3 border-r border-slate-800 text-slate-900 font-medium whitespace-pre-line leading-relaxed align-top">
                      {day.morningContent || ''}
                    </td>
                    <td className="p-3 border-r border-slate-800 text-slate-900 font-medium whitespace-pre-line leading-relaxed align-top">
                      {day.afternoonContent || ''}
                    </td>
                    <td className="p-3 border-r border-slate-800 text-slate-800 font-semibold text-center align-middle">
                      {day.completionDate || ''}
                    </td>
                    <td className="p-3 border-r border-slate-800 text-slate-900 font-semibold text-center align-middle bg-slate-50/30">
                      {day.leadershipReview || ''}
                    </td>
                    <td className="p-3 text-slate-700 font-medium text-center align-middle">
                      {day.note || ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-500">
          Chưa có lịch giao việc nhà trường. Vui lòng bấm "Thêm Tuần mới" để tạo lịch.
        </div>
      )}

      {/* Modal */}
      <SchoolWorkScheduleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSchedule(null);
        }}
        onSave={handleSaveSchedule}
        initialSchedule={editingSchedule}
      />
    </div>
  );
};
