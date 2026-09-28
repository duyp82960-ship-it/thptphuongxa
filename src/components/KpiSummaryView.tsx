import React, { useState, useMemo } from 'react';
import { useKpi } from '../context/KpiContext';
import {
  CalendarDays,
  Search,
  Filter,
  FileSpreadsheet,
  Printer,
  Award,
  PlusCircle,
  MinusCircle,
  TrendingUp,
  ChevronRight,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { downloadCsv, getRankBadgeClass } from '../utils/exportUtils';

interface KpiSummaryViewProps {
  mode: 'monthly' | 'yearly';
}

export const KpiSummaryView: React.FC<KpiSummaryViewProps> = ({ mode }) => {
  const {
    staffList,
    schoolYear,
    month,
    setMonth,
    getAllSummaries,
    setSelectedPersonId,
    setActiveTab,
    openPrintModal,
    schoolConfig,
  } = useKpi();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedRank, setSelectedRank] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // Mode configurations
  const titleInfo = useMemo(() => {
    switch (mode) {
      case 'monthly':
        return {
          title: `BẢNG TỔNG HỢP KPI THÁNG ${month}`,
          subtitle: `Theo dõi kết quả đánh giá thi đua tháng ${month} – Năm học ${schoolYear}`,
          exportPrefix: `Bang_tong_hop_KPI_Thang_${month}`,
        };
      case 'yearly':
      default:
        return {
          title: `TỔNG HỢP & XẾP LOẠI KPI NĂM HỌC ${schoolYear}`,
          subtitle: `Báo cáo đánh giá thi đua tổng kết toàn diện năm học ${schoolConfig.normalName}`,
          exportPrefix: `Tong_ket_KPI_Nam_Hoc_${schoolYear.replace(/\s+/g, '')}`,
        };
    }
  }, [mode, month, schoolYear]);

  // Query summaries based on mode
  const summaries = useMemo(() => {
    if (mode === 'monthly') {
      return getAllSummaries({ schoolYear, month });
    } else {
      return getAllSummaries({ schoolYear });
    }
  }, [getAllSummaries, schoolYear, month, mode]);

  // Filtered summaries
  const filteredSummaries = useMemo(() => {
    return summaries.filter((item) => {
      const matchesSearch =
        item.person.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.person.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.person.subject && item.person.subject.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDept = selectedDept === 'all' || item.person.department === selectedDept;
      const matchesRank = selectedRank === 'all' || item.rank === selectedRank;
      const matchesType = selectedType === 'all' || item.person.type === selectedType;

      return matchesSearch && matchesDept && matchesRank && matchesType;
    });
  }, [summaries, searchQuery, selectedDept, selectedRank, selectedType]);

  // Unique departments
  const uniqueDepts = useMemo(() => {
    return Array.from(new Set(staffList.map((s) => s.department)));
  }, [staffList]);

  // Rank distribution for yearly / semester
  const rankStats = useMemo(() => {
    const total = summaries.length;
    const countXuatSac = summaries.filter((s) => s.rank === 'Xuất sắc').length;
    const countTot = summaries.filter((s) => s.rank === 'Tốt').length;
    const countHoanThanh = summaries.filter((s) => s.rank === 'Hoàn thành').length;
    const countCanCoGang = summaries.filter((s) => s.rank === 'Cần cố gắng').length;

    return {
      total,
      countXuatSac,
      countTot,
      countHoanThanh,
      countCanCoGang,
      pctXuatSac: total > 0 ? ((countXuatSac / total) * 100).toFixed(1) : '0',
      pctTot: total > 0 ? ((countTot / total) * 100).toFixed(1) : '0',
      pctHoanThanh: total > 0 ? ((countHoanThanh / total) * 100).toFixed(1) : '0',
      pctCanCoGang: total > 0 ? ((countCanCoGang / total) * 100).toFixed(1) : '0',
    };
  }, [summaries]);

  // Pie chart data
  const pieData = [
    { name: 'Xuất sắc (≥110đ)', value: rankStats.countXuatSac, color: '#10b981' },
    { name: 'Tốt (95-109đ)', value: rankStats.countTot, color: '#3b82f6' },
    { name: 'Hoàn thành (80-94đ)', value: rankStats.countHoanThanh, color: '#f59e0b' },
    { name: 'Cần cố gắng (<80đ)', value: rankStats.countCanCoGang, color: '#ef4444' },
  ];

  // Top 5 highest scoring
  const topHonorList = useMemo(() => {
    return [...summaries].sort((a, b) => b.finalScore - a.finalScore).slice(0, 5);
  }, [summaries]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'STT',
      'Mã cán bộ/GV',
      'Họ và tên',
      'Tổ / Bộ phận',
      'Chức vụ',
      'Điểm chuẩn ban đầu',
      'Tổng điểm cộng (+)',
      'Tổng điểm trừ (-)',
      mode === 'monthly'
        ? `Điểm KPI Tháng ${month}`
        : 'Điểm KPI Cả năm',
      'Xếp loại thi đua',
    ];

    const rows = filteredSummaries.map((item, idx) => [
      idx + 1,
      item.person.code,
      item.person.name,
      item.person.department,
      item.person.position,
      item.baseScore,
      item.totalPlus,
      item.totalMinus,
      item.finalScore,
      item.rank,
    ]);

    downloadCsv(titleInfo.exportPrefix, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shrink-0">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
              {titleInfo.title}
            </h2>
            <p className="text-xs text-slate-500">{titleInfo.subtitle}</p>
          </div>
        </div>

        {/* Action Controls & Selectors */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {mode === 'monthly' && (
            <div className="flex items-center gap-1">
              <span className="font-semibold text-slate-600">Tháng:</span>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="py-1.5 px-3 rounded-lg border border-slate-300 bg-white font-bold text-blue-700"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    Tháng {m}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={() =>
              openPrintModal(
                titleInfo.title,
                `${schoolConfig.normalName} – Tổng hợp ngày ${new Date().toLocaleDateString('vi-VN')}`
              )
            }
            className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>In bảng điểm</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Bento (For Yearly) */}
      {mode === 'yearly' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs bg-gradient-to-b from-emerald-50/30 to-white">
            <div className="flex items-center justify-between text-xs text-emerald-800 font-bold mb-1">
              <span>XUẤT SẮC (≥110đ)</span>
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-600">{rankStats.countXuatSac} người</div>
            <div className="text-[11px] text-emerald-700 mt-1">Chiếm {rankStats.pctXuatSac}% toàn trường</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs bg-gradient-to-b from-blue-50/30 to-white">
            <div className="flex items-center justify-between text-xs text-blue-800 font-bold mb-1">
              <span>TỐT (95 - 109đ)</span>
              <Sparkles className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-600">{rankStats.countTot} người</div>
            <div className="text-[11px] text-blue-700 mt-1">Chiếm {rankStats.pctTot}% toàn trường</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs bg-gradient-to-b from-amber-50/30 to-white">
            <div className="flex items-center justify-between text-xs text-amber-800 font-bold mb-1">
              <span>HOÀN THÀNH (80 - 94đ)</span>
              <Award className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-600">{rankStats.countHoanThanh} người</div>
            <div className="text-[11px] text-amber-700 mt-1">Chiếm {rankStats.pctHoanThanh}% toàn trường</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs bg-gradient-to-b from-rose-50/30 to-white">
            <div className="flex items-center justify-between text-xs text-rose-800 font-bold mb-1">
              <span>CẦN CỐ GẮNG (&lt;80đ)</span>
              <Award className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-600">{rankStats.countCanCoGang} người</div>
            <div className="text-[11px] text-rose-700 mt-1">Chiếm {rankStats.pctCanCoGang}% toàn trường</div>
          </div>
        </div>
      )}

      {/* Top 5 Honors (Yearly Mode) */}
      {mode === 'yearly' && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 p-5 rounded-2xl text-white shadow-md">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-100" />
              <span>VINH DANH TOP CÁ NHÂN XUẤT SẮC NHẤT NĂM HỌC {schoolYear}</span>
            </h3>
            <span className="text-xs bg-white/20 px-2.5 py-0.5 rounded-full font-bold">
              Đề nghị khen thưởng
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {topHonorList.map((honoree, idx) => (
              <div
                key={honoree.person.id}
                onClick={() => {
                  setSelectedPersonId(honoree.person.id);
                  setActiveTab('kpi-personal');
                }}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-xs p-3 rounded-xl border border-white/25 transition cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="w-6 h-6 rounded-full bg-white text-amber-700 font-black text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-mono font-bold">{honoree.person.code}</span>
                  </div>
                  <div className="font-bold text-sm truncate">{honoree.person.name}</div>
                  <div className="text-[11px] text-amber-100 truncate">{honoree.person.department}</div>
                </div>
                <div className="mt-2 pt-2 border-t border-white/20 flex items-center justify-between">
                  <span className="text-[11px]">Tổng điểm:</span>
                  <span className="font-black text-base">{honoree.finalScore} đ</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, mã số, bộ môn..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 font-medium">Tổ/Bộ phận:</span>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="py-1.5 px-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
          >
            <option value="all">Tất cả ({summaries.length})</option>
            {uniqueDepts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium">Nhóm:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="py-1.5 px-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
          >
            <option value="all">Toàn trường</option>
            <option value="bgh">Ban Giám hiệu</option>
            <option value="giaovien">Giáo viên</option>
            <option value="nhanvien">Nhân viên</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium">Xếp loại:</span>
          <select
            value={selectedRank}
            onChange={(e) => setSelectedRank(e.target.value)}
            className="py-1.5 px-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
          >
            <option value="all">Tất cả mức</option>
            <option value="Xuất sắc">Xuất sắc</option>
            <option value="Tốt">Tốt</option>
            <option value="Hoàn thành">Hoàn thành</option>
            <option value="Cần cố gắng">Cần cố gắng</option>
          </select>
        </div>
      </div>

      {/* Main Aggregated Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3 text-center w-12">STT</th>
                <th className="py-3 px-3">Mã</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-3">Tổ / Bộ phận</th>
                <th className="py-3 px-3">Chức vụ</th>
                <th className="py-3 px-3 text-center">Điểm chuẩn</th>
                <th className="py-3 px-3 text-center">Điểm cộng (+)</th>
                <th className="py-3 px-3 text-center">Điểm trừ (-)</th>
                <th className="py-3 px-3 text-center">
                  {mode === 'monthly'
                    ? `KPI Tháng ${month}`
                    : 'KPI Cả năm'}
                </th>
                <th className="py-3 px-3 text-center">Xếp loại</th>
                <th className="py-3 px-4 text-center">Xem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredSummaries.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    Không tìm thấy dữ liệu phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredSummaries.map((item, index) => (
                  <tr
                    key={item.person.id}
                    className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                    onClick={() => {
                      setSelectedPersonId(item.person.id);
                      setActiveTab('kpi-personal');
                    }}
                  >
                    <td className="py-3 px-3 text-center text-slate-400 font-normal">
                      {index + 1}
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-blue-700">
                      {item.person.code}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{item.person.name}</div>
                      {item.person.subject && (
                        <div className="text-[10px] text-slate-400">Môn: {item.person.subject}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                        {item.person.department}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{item.person.position}</td>
                    <td className="py-3 px-3 text-center text-slate-500 font-mono">
                      {item.baseScore}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-600">
                      +{item.totalPlus}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-rose-600">
                      -{item.totalMinus}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-black text-sm text-blue-700">
                        {item.finalScore} đ
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold inline-block ${getRankBadgeClass(
                          item.rank
                        )}`}
                      >
                        {item.rank}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPersonId(item.person.id);
                          setActiveTab('kpi-personal');
                        }}
                        className="p-1.5 rounded-md hover:bg-blue-100 text-blue-600 transition"
                        title="Xem chi tiết cá nhân"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>
            Đang hiển thị <strong className="text-slate-800">{filteredSummaries.length}</strong> / {summaries.length} nhân sự
          </span>
          <span className="text-[11px] text-slate-400">{schoolConfig.normalName}</span>
        </div>
      </div>
    </div>
  );
};
