import React from 'react';
import { useKpi } from '../context/KpiContext';
import { Printer, X, Download } from 'lucide-react';
import { getRankBadgeClass } from '../utils/exportUtils';

export const PrintModal: React.FC = () => {
  const {
    isPrintModalOpen,
    setIsPrintModalOpen,
    printData,
    staffList,
    schoolYear,
    semester,
    month,
    getAllSummaries,
    currentUser,
    schoolConfig,
  } = useKpi();

  if (!isPrintModalOpen) return null;

  const summaries = getAllSummaries({ schoolYear, semester });

  const currentDate = new Date();
  const day = currentDate.getDate();
  const m = currentDate.getMonth() + 1;
  const y = currentDate.getFullYear();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Modal Action Bar (Hidden when printing) */}
        <div className="px-6 py-3.5 bg-slate-800 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 text-sm font-bold">
            <Printer className="w-4 h-4 text-blue-400" />
            <span>Xem trước bản in văn bản hành chính</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>In ngay (Print)</span>
            </button>
            <button
              onClick={() => setIsPrintModalOpen(false)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="p-8 sm:p-12 overflow-y-auto print:p-0 print:overflow-visible font-serif text-slate-900 leading-relaxed bg-white">
          {/* Header 2 cột Quốc hiệu - Đơn vị theo thể thức văn bản hành chính Việt Nam */}
          <div className="grid grid-cols-2 gap-4 pb-6 border-b border-slate-300">
            <div className="text-center">
              <div className="text-xs uppercase font-semibold tracking-wider">
                {schoolConfig.department}
              </div>
              <div className="text-sm font-bold uppercase tracking-wider text-blue-900 mt-0.5">
                {schoolConfig.fullName}
              </div>
              <div className="text-[11px] italic mt-0.5 text-slate-600">
                Mã định danh: {schoolConfig.code}
              </div>
              <div className="w-24 h-0.5 bg-slate-800 mx-auto mt-1.5" />
            </div>

            <div className="text-center">
              <div className="text-xs font-bold uppercase tracking-wider">
                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
              </div>
              <div className="text-xs font-bold underline tracking-wider mt-0.5">
                Độc lập - Tự do - Hạnh phúc
              </div>
              <div className="text-[11px] italic mt-2 text-slate-600">
                Phương Xá, ngày {day} tháng {m} năm {y}
              </div>
            </div>
          </div>

          {/* Title */}
          <div className="text-center my-6">
            <h1 className="text-xl sm:text-2xl font-black uppercase text-slate-900 tracking-tight">
              {printData?.title || 'BẢNG TỔNG HỢP KẾT QUẢ ĐÁNH GIÁ THI ĐUA KPI'}
            </h1>
            <p className="text-xs sm:text-sm italic text-slate-700 mt-1">
              {printData?.subtitle || `Năm học ${schoolYear} – Học kỳ ${semester === 1 ? 'I' : 'II'}`}
            </p>
          </div>

          {/* Table Data */}
          <div className="my-6">
            <table className="w-full text-left text-xs border border-slate-400 border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400 text-center">
                  <th className="p-2 border-r border-slate-400 w-10">STT</th>
                  <th className="p-2 border-r border-slate-400 w-16">Mã CB/GV</th>
                  <th className="p-2 border-r border-slate-400 text-left">Họ và tên</th>
                  <th className="p-2 border-r border-slate-400 text-left">Tổ / Bộ phận</th>
                  <th className="p-2 border-r border-slate-400 text-left">Chức vụ</th>
                  <th className="p-2 border-r border-slate-400 w-14">Điểm chuẩn</th>
                  <th className="p-2 border-r border-slate-400 w-14 text-emerald-800">Cộng (+)</th>
                  <th className="p-2 border-r border-slate-400 w-14 text-rose-800">Trừ (-)</th>
                  <th className="p-2 border-r border-slate-400 w-16 font-black">Điểm KPI</th>
                  <th className="p-2 w-20">Xếp loại</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((item, index) => (
                  <tr key={item.person.id} className="border-b border-slate-300">
                    <td className="p-2 text-center border-r border-slate-300 font-sans">
                      {index + 1}
                    </td>
                    <td className="p-2 text-center border-r border-slate-300 font-mono font-bold">
                      {item.person.code}
                    </td>
                    <td className="p-2 border-r border-slate-300 font-bold text-slate-900">
                      {item.person.name}
                    </td>
                    <td className="p-2 border-r border-slate-300">{item.person.department}</td>
                    <td className="p-2 border-r border-slate-300">{item.person.position}</td>
                    <td className="p-2 text-center border-r border-slate-300 font-sans">
                      {item.baseScore}
                    </td>
                    <td className="p-2 text-center border-r border-slate-300 font-bold font-sans text-emerald-700">
                      +{item.totalPlus}
                    </td>
                    <td className="p-2 text-center border-r border-slate-300 font-bold font-sans text-rose-700">
                      -{item.totalMinus}
                    </td>
                    <td className="p-2 text-center border-r border-slate-300 font-black font-sans text-blue-900">
                      {item.finalScore}
                    </td>
                    <td className="p-2 text-center font-bold">{item.rank}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Notes */}
          <div className="text-xs italic text-slate-600 mb-8">
            * Bảng tổng hợp được xuất trực tiếp từ Hệ thống Quản lý KPI {schoolConfig.normalName}. Các trường hợp có thắc mắc hoặc kiến nghị về kết quả đánh giá, đề nghị liên hệ Ban Giám hiệu trong vòng 03 ngày làm việc kể từ ngày công bố.
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-4 text-center text-xs mt-8 pt-4">
            <div>
              <div className="font-bold uppercase">NGƯỜI LẬP BIỂU</div>
              <div className="italic text-slate-500 text-[11px] mt-0.5">(Ký và ghi rõ họ tên)</div>
              <div className="h-20" />
              <div className="font-bold text-slate-800">{currentUser?.name || 'Văn thư nhà trường'}</div>
            </div>

            <div>
              <div className="font-bold uppercase">TỔ TRƯỞNG CHUYÊN MÔN</div>
              <div className="italic text-slate-500 text-[11px] mt-0.5">(Ký và ghi rõ họ tên)</div>
              <div className="h-20" />
              <div className="font-bold text-slate-800">Xác nhận của Tổ</div>
            </div>

            <div>
              <div className="font-bold uppercase">HIỆU TRƯỞNG</div>
              <div className="italic text-slate-500 text-[11px] mt-0.5">(Ký tên và đóng dấu)</div>
              <div className="h-20" />
              <div className="font-bold text-slate-800">ThS. Hà Văn Long</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
