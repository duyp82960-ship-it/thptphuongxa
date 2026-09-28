import React, { useState, useEffect, useRef } from 'react';
import { useKpi } from '../context/KpiContext';
import { WeeklyWorkSchedule } from '../types';
import { INITIAL_WEEKLY_SCHEDULES } from '../data/initialWorkSchedules';
import { WorkScheduleModal } from './WorkScheduleModal';
import { downloadWeeklyWorkScheduleTemplateExcel } from '../utils/exportUtils';
import * as XLSX from 'xlsx';
import {
  Calendar,
  Printer,
  Plus,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  School,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Upload,
  Download,
} from 'lucide-react';

export const WorkScheduleView: React.FC = () => {
  const { currentUser, showToast } = useKpi();
  const [schedules, setSchedules] = useState<WeeklyWorkSchedule[]>(() => {
    try {
      const saved = localStorage.getItem('thpt_phuong_xa_work_schedules');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load work schedules from localStorage:', e);
    }
    return INITIAL_WEEKLY_SCHEDULES;
  });

  const [activeScheduleId, setActiveScheduleId] = useState<string>(
    schedules.length > 0 ? schedules[0].id : ''
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<WeeklyWorkSchedule | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSchedule = schedules.find((s) => s.id === activeScheduleId) || schedules[0];

  useEffect(() => {
    try {
      localStorage.setItem('thpt_phuong_xa_work_schedules', JSON.stringify(schedules));
    } catch (e) {
      console.warn('Failed to save work schedules to localStorage:', e);
    }
  }, [schedules]);

  const handleSaveSchedule = (savedSchedule: WeeklyWorkSchedule) => {
    const exists = schedules.some((s) => s.id === savedSchedule.id);
    if (exists) {
      setSchedules(schedules.map((s) => (s.id === savedSchedule.id ? savedSchedule : s)));
      showToast(`Đã cập nhật Lịch công tác Tuần ${savedSchedule.weekNumber}!`, 'success');
    } else {
      setSchedules([savedSchedule, ...schedules]);
      setActiveScheduleId(savedSchedule.id);
      showToast(`Đã thêm Lịch công tác Tuần ${savedSchedule.weekNumber} thành công!`, 'success');
    }
  };

  const handleDeleteSchedule = (id: string) => {
    if (schedules.length <= 1) {
      showToast('Không thể xóa tuần duy nhất còn lại trong hệ thống.', 'error');
      return;
    }
    if (window.confirm('Bạn có chắc chắn muốn xóa lịch công tác tuần này?')) {
      const filtered = schedules.filter((s) => s.id !== id);
      setSchedules(filtered);
      setActiveScheduleId(filtered[0].id);
      showToast('Đã xóa lịch công tác tuần thành công.', 'success');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportWord = () => {
    showToast('Đang chuẩn bị tệp Word lịch công tác tuần...', 'info');
    setTimeout(() => {
      const content = `SỞ GIÁO DỤC VÀ ĐÀO TẠO PHÚ THỌ\nTRƯỜNG THPT PHƯƠNG XÁ\nLỊCH CÔNG TÁC TUẦN ${activeSchedule.weekNumber} NĂM HỌC ${activeSchedule.schoolYear}\nTừ ngày ${activeSchedule.fromDate} đến ngày ${activeSchedule.toDate}\nLớp trực tuần ${activeSchedule.dutyClass}: Giáo viên ${activeSchedule.dutyTeacher}\n\n` +
        activeSchedule.days.map(d => `Thứ ${d.dayOfWeek} (${d.date}):\n- Sáng: ${d.morningContent}\n- Chiều: ${d.afternoonContent}\n- Lãnh đạo: ${d.leadership}\n`).join('\n') +
        `\nGhi chú:\n` + activeSchedule.notes.map(n => `- ${n}`).join('\n') +
        `\n\n${activeSchedule.issueDate}\nHIỆU TRƯỜNG\n${activeSchedule.principalName}`;

      const blob = new Blob([content], { type: 'application/msword;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Lich_cong_tac_Tuan_${activeSchedule.weekNumber}_${activeSchedule.schoolYear.replace(/\s+/g, '_')}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Tải xuống tệp Word thành công!', 'success');
    }, 600);
  };

  const handleDownloadTemplate = () => {
    downloadWeeklyWorkScheduleTemplateExcel();
    showToast('Đã tải xuống file Excel mẫu lịch công tác tuần thành công!', 'success');
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
        dayOfWeek: String(row['Thứ'] || 'HAI'),
        date: String(row['Ngày'] || ''),
        morningContent: String(row['Sáng (Nội dung công việc)'] || row['Sáng'] || ''),
        afternoonContent: String(row['Chiều (Nội dung công việc)'] || row['Chiều'] || ''),
        leadership: String(row['Trực lãnh đạo'] || row['Lãnh đạo'] || ''),
      }));

      if (activeSchedule) {
        const updatedSchedule: WeeklyWorkSchedule = {
          ...activeSchedule,
          days: newDays.length >= 7 ? newDays.slice(0, 7) : [...newDays, ...Array(7 - newDays.length).fill({ dayOfWeek: 'Khác', date: '', morningContent: '', afternoonContent: '', leadership: '' })],
          updatedAt: new Date().toISOString(),
        };
        handleSaveSchedule(updatedSchedule);
        showToast(`Đã nhập dữ liệu từ file Excel thành công cho Tuần ${activeSchedule.weekNumber}!`, 'success');
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
          <div className="p-3 rounded-2xl bg-blue-100 text-blue-700">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Module Lịch công tác Trường học</h2>
            <p className="text-xs text-slate-500">Quản lý lịch tuần, lịch công tác Ban Giám hiệu và toàn trường</p>
          </div>
        </div>

        {/* Week Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Week Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700">Chọn tuần:</span>
            <select
              value={activeScheduleId}
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
            title="Tải xuống file Excel mẫu lịch công tác tuần"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Tải file mẫu</span>
          </button>

          <label
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md"
            title="Tải lên lịch công tác tuần từ file Excel"
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
            <span>In Lịch Công Tác</span>
          </button>
        </div>
      </div>

      {/* Official Printable Document Container */}
      {activeSchedule && (
        <div id="printable-schedule" className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-200 print:shadow-none print:border-none print:p-0">
          {/* Header Department & School */}
          <div className="grid grid-cols-2 text-center text-xs font-bold pb-4 border-b border-slate-200">
            <div>
              <p className="uppercase text-slate-800 tracking-wider">SỞ GIÁO DỤC VÀ ĐÀO TẠO PHÚ THỌ</p>
              <p className="font-black text-blue-900 text-sm mt-0.5 uppercase">TRƯỜNG THPT PHƯƠNG XÁ</p>
              <div className="w-24 h-0.5 bg-blue-600 mx-auto mt-2" />
            </div>
            <div>
              <p className="uppercase text-red-700 tracking-widest font-black text-sm">
                LỊCH CÔNG TÁC TUẦN {activeSchedule.weekNumber}
              </p>
              <p className="text-slate-800 uppercase mt-0.5 font-bold">
                NĂM HỌC {activeSchedule.schoolYear}
              </p>
            </div>
          </div>

          {/* Subtitle Dates & Duty Info */}
          <div className="text-center my-6 space-y-2">
            <p className="text-sm font-bold text-blue-900 italic">
              Từ ngày {activeSchedule.fromDate} đến ngày {activeSchedule.toDate} năm {activeSchedule.schoolYear.split(' - ')[1]}
            </p>
            <div className="inline-block bg-blue-50 border border-blue-200 px-6 py-2 rounded-full text-xs font-bold text-blue-900 shadow-xs">
              Lớp trực tuần <span className="text-red-600 font-black">{activeSchedule.dutyClass}</span>: Giáo viên{' '}
              <span className="text-slate-900 font-black">{activeSchedule.dutyTeacher}</span>
            </div>
          </div>

          {/* Main Schedule Table */}
          <div className="overflow-x-auto border-2 border-slate-800 rounded-lg">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-800 text-slate-900 font-black text-center">
                  <th className="p-3 border-r border-slate-800 w-20">THỨ</th>
                  <th className="p-3 border-r border-slate-800 w-28">NGÀY THÁNG</th>
                  <th className="p-3 border-r border-slate-800 w-1/3">BUỔI SÁNG 7h00</th>
                  <th className="p-3 border-r border-slate-800 w-1/3">BUỔI CHIỀU 14h00</th>
                  <th className="p-3 w-32">LÃNH ĐẠO</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {activeSchedule.days.map((day) => (
                  <tr key={day.dayOfWeek} className="hover:bg-slate-50">
                    <td className="p-3 border-r border-slate-800 font-black text-center text-blue-900 bg-slate-50/80 align-middle">
                      {day.dayOfWeek}
                    </td>
                    <td className="p-3 border-r border-slate-800 font-semibold text-center text-slate-800 align-middle">
                      {day.date}
                    </td>
                    <td className="p-3 border-r border-slate-800 text-slate-900 font-medium whitespace-pre-line leading-relaxed align-top">
                      {day.morningContent || ''}
                    </td>
                    <td className="p-3 border-r border-slate-800 text-slate-900 font-medium whitespace-pre-line leading-relaxed align-top">
                      {day.afternoonContent || ''}
                    </td>
                    <td className="p-3 font-bold text-slate-900 text-center align-middle bg-slate-50/30">
                      {day.leadership || ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notes Section */}
          <div className="mt-6 p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <p className="font-black text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-600" />
              <span>Ghi chú:</span>
            </p>
            <ul className="space-y-1.5 text-xs text-slate-700 font-medium list-disc pl-5">
              {activeSchedule.notes.map((note, idx) => (
                <li key={idx} className="leading-relaxed">
                  {note}
                </li>
              ))}
            </ul>
          </div>

          {/* Signature Block */}
          <div className="mt-10 grid grid-cols-2 text-center text-xs">
            <div></div>
            <div className="space-y-1">
              <p className="italic font-medium text-slate-800">{activeSchedule.issueDate}</p>
              <p className="font-black uppercase text-slate-900 text-sm pt-1">HIỆU TRƯỞNG</p>
              <div className="h-20 flex items-center justify-center">
                {/* Stamp / Signature placeholder */}
                <div className="relative text-blue-800/40 font-bold uppercase tracking-widest text-[10px] border-2 border-dashed border-blue-800/30 px-4 py-2 rounded-xl rotate-[-4deg]">
                  [Đã ký duyệt / Đóng dấu]
                </div>
              </div>
              <p className="font-black text-slate-900 text-sm uppercase pt-2">{activeSchedule.principalName}</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <WorkScheduleModal
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
