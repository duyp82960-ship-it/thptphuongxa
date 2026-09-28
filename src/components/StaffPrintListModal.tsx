import React, { useRef } from 'react';
import { TeacherKpiEvaluation } from '../types';
import { StaffRankingTier, calculateStaffRank, getStaffRankBadgeClass } from '../services/staffKpiService';
import { Printer, X, Download, FileSpreadsheet, Building2, Calendar, Award } from 'lucide-react';

interface StaffPrintListModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluations: TeacherKpiEvaluation[];
  monthFilter: number | 'all';
  schoolYear: string;
  rankingTiers: StaffRankingTier[];
}

export const StaffPrintListModal: React.FC<StaffPrintListModalProps> = ({
  isOpen,
  onClose,
  evaluations,
  monthFilter,
  schoolYear,
  rankingTiers,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const monthLabel =
    monthFilter === 'all'
      ? 'Tất cả các tháng (Năm học)'
      : `Tháng ${String(monthFilter).padStart(2, '0')}/2026`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Container */}
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
        {/* Header Controls (Hidden during print) */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-sky-300">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-purple-200 uppercase tracking-wider">
                XEM TRƯỚC BẢN IN KHỔ A4 • CHUẨN HÀNH CHÍNH
              </div>
              <h2 className="text-base sm:text-lg font-black text-white">
                DANH SÁCH ĐÁNH GIÁ KPI NHÂN VIÊN
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-xs shadow-md flex items-center gap-2 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In / Lưu PDF (A4)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content Area */}
        <div
          ref={printAreaRef}
          id="staff-kpi-printable-list"
          className="p-8 sm:p-10 overflow-y-auto flex-1 bg-white text-slate-900 font-serif leading-relaxed text-xs print:p-0 print:m-0"
        >
          {/* Print Style Fix */}
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #staff-kpi-printable-list, #staff-kpi-printable-list * {
                visibility: visible;
              }
              #staff-kpi-printable-list {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 15mm;
                box-shadow: none;
                border: none;
              }
              @page {
                size: A4 portrait;
                margin: 10mm;
              }
            }
          `}</style>

          {/* National Header */}
          <div className="grid grid-cols-2 text-center pb-6 border-b border-slate-300">
            <div>
              <div className="font-bold text-[11px] uppercase tracking-wide">SỞ GD&ĐT PHÚ THỌ</div>
              <div className="font-extrabold text-xs uppercase tracking-wide text-slate-900">TRƯỜNG THPT PHƯƠNG XÁ</div>
              <div className="w-20 h-0.5 bg-slate-400 mx-auto mt-1" />
            </div>
            <div>
              <div className="font-bold text-[11px] uppercase tracking-wide">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div className="font-bold text-xs italic">Độc lập – Tự do – Hạnh phúc</div>
              <div className="w-28 h-0.5 bg-slate-400 mx-auto mt-1" />
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center my-6 space-y-1">
            <h1 className="text-lg sm:text-xl font-black uppercase text-slate-950 tracking-wider">
              DANH SÁCH ĐÁNH GIÁ KPI NHÂN VIÊN
            </h1>
            <div className="text-sm font-bold uppercase text-slate-800">
              TRƯỜNG THPT PHƯƠNG XÁ
            </div>
            <p className="text-xs italic text-slate-600">
              Kỳ đánh giá: <strong>{monthLabel}</strong> • Năm học: <strong>{schoolYear}</strong> • Bộ phận: <strong>Tổ Văn phòng</strong>
            </p>
          </div>

          {/* Table */}
          <div className="border border-slate-800 rounded-xs overflow-hidden mt-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-800 font-bold text-slate-900 text-center">
                  <th className="py-2.5 px-2 border-r border-slate-800 w-10">STT</th>
                  <th className="py-2.5 px-3 border-r border-slate-800 text-left">Họ và tên</th>
                  <th className="py-2.5 px-3 border-r border-slate-800 text-left">Chức vụ / Vị trí</th>
                  <th className="py-2.5 px-3 border-r border-slate-800 text-center">Bộ phận/Tổ</th>
                  <th className="py-2.5 px-2 border-r border-slate-800 text-center">Tháng</th>
                  <th className="py-2.5 px-2 border-r border-slate-800 text-center w-20">Tổng điểm</th>
                  <th className="py-2.5 px-3 border-r border-slate-800 text-center w-28">Xếp loại</th>
                  <th className="py-2.5 px-3 border-r border-slate-800 text-left">Người đánh giá</th>
                  <th className="py-2.5 px-2 text-center w-24">Ngày đánh giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-400">
                {evaluations.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-6 text-center italic text-slate-500">
                      Không có phiếu đánh giá nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ) : (
                  evaluations.map((item, idx) => {
                    const totalScore = item.bghTotalScore ?? item.selfTotalScore ?? 100;
                    const rankLabel = item.bghRank || item.selfRank || calculateStaffRank(totalScore, rankingTiers);
                    const mText = item.month
                      ? `Tháng ${String(item.month).padStart(2, '0')}`
                      : (item.periodName || 'Tháng 09/2026');
                    const evalDate =
                      item.bghDate || item.deptDate || item.selfDate || (item.updatedAt ? item.updatedAt.split('T')[0] : '2026-09-24');

                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-2 px-2 text-center font-bold border-r border-slate-400">{idx + 1}</td>
                        <td className="py-2 px-3 border-r border-slate-400 font-bold text-slate-900">
                          {item.staffName}
                          <div className="text-[10px] text-slate-500 font-mono font-normal">{item.staffCode}</div>
                        </td>
                        <td className="py-2 px-3 border-r border-slate-400 font-semibold">{item.position}</td>
                        <td className="py-2 px-3 border-r border-slate-400 text-center">Tổ Văn phòng</td>
                        <td className="py-2 px-2 border-r border-slate-400 text-center font-semibold">{mText}</td>
                        <td className="py-2 px-2 border-r border-slate-400 text-center font-bold text-slate-900">
                          {Math.round(totalScore * 10) / 10}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-400 text-center font-extrabold text-slate-900">
                          {rankLabel}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-400 text-slate-700">
                          {(() => {
                            const isTt =
                              item.evaluator_role === 'Tổ trưởng' ||
                              item.evaluatorRole === 'Tổ trưởng' ||
                              item.evaluatorType === 'TOTRUONG' ||
                              item.evaluator_type === 'TOTRUONG' ||
                              !!item.ttcmEvaluatorName;
                            const evalName =
                              item.evaluator_name ||
                              (isTt ? item.ttcmEvaluatorName : item.bghEvaluatorName) ||
                              item.evaluatorName?.split('–')[0]?.split('(')[0]?.trim() ||
                              (isTt ? 'Tổ trưởng' : 'Ban Giám hiệu');
                            const evalRole =
                              item.evaluator_role ||
                              item.evaluatorRole ||
                              (isTt
                                ? item.ttcmEvaluatorRole || `Tổ trưởng ${item.department_name || item.department || 'Tổ Văn phòng'}`
                                : item.bghEvaluatorRole || 'Hiệu trưởng');
                            return (
                              <div>
                                <div className="font-bold text-slate-900">
                                  {evalName}
                                </div>
                                <div className="text-[10px] text-slate-500">
                                  {evalRole}
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="py-2 px-2 text-center text-slate-600 font-mono text-[11px]">{evalDate}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Statistical Summary */}
          <div className="mt-4 p-3 bg-slate-50 rounded-xs border border-slate-300 text-xs flex justify-between items-center">
            <div>
              Tổng số nhân viên đánh giá: <strong>{evaluations.length}</strong> nhân sự
            </div>
            <div className="text-slate-600 italic">
              Danh sách được trích xuất từ Hệ thống Quản lý KPI – Trường THPT Phương Xá
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-6 pt-10 text-center text-xs">
            <div className="space-y-1">
              <div className="font-bold text-slate-900 uppercase">NGƯỜI LẬP DANH SÁCH</div>
              <div className="text-[11px] text-slate-500 italic">(Ký và ghi rõ họ tên)</div>
              <div className="h-16 flex items-end justify-center font-bold text-slate-800">
                Thư ký Hội đồng
              </div>
            </div>
            <div className="space-y-1">
              <div className="font-bold text-slate-900 uppercase">TỔ TRƯỞNG VĂN PHÒNG</div>
              <div className="text-[11px] text-slate-500 italic">(Ký và ghi rõ họ tên)</div>
              <div className="h-16 flex items-end justify-center font-bold text-slate-800">
                Hoàng Mỹ Hạnh
              </div>
            </div>
            <div className="space-y-1">
              <div className="font-bold text-slate-900 uppercase">HIỆU TRƯỞNG PHÊ DUYỆT</div>
              <div className="text-[11px] text-slate-500 italic">(Ký tên và đóng dấu)</div>
              <div className="h-16 flex items-end justify-center font-bold text-slate-900">
                Lê Quốc Tuấn
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer (Hidden during print) */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0 print:hidden">
          <div className="text-xs text-slate-600 font-semibold">
            Bản in đã được thiết lập định dạng A4 chuẩn hành chính không bị cắt cột.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md transition cursor-pointer flex items-center gap-2"
            >
              <Printer className="w-4 h-4 text-sky-200" />
              <span>In danh sách / Lưu PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
