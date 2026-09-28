import React, { useState, useMemo } from 'react';
import { useKpi } from '../context/KpiContext';
import {
  BarChart3,
  Award,
  AlertTriangle,
  TrendingUp,
  FileSpreadsheet,
  Printer,
  PieChart as PieIcon,
  Layers,
  Sparkles,
  ChevronRight,
  ExternalLink,
  ArrowLeft,
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
  Legend,
} from 'recharts';
import { downloadCsv, getRankBadgeClass } from '../utils/exportUtils';

export const ReportsView: React.FC = () => {
  const {
    staffList,
    incidentsList,
    criteriaList,
    schoolYear,
    semester,
    month,
    getAllSummaries,
    setSelectedPersonId,
    setActiveTab,
    openPrintModal,
    schoolConfig,
  } = useKpi();

  const [period, setPeriod] = useState<'year' | 'month'>('year');

  const summaries = useMemo(() => {
    if (period === 'month') return getAllSummaries({ schoolYear, month });
    return getAllSummaries({ schoolYear });
  }, [getAllSummaries, period, schoolYear, month]);

  // Top 5 Highest
  const topPerformers = useMemo(() => {
    return [...summaries].sort((a, b) => b.finalScore - a.finalScore).slice(0, 5);
  }, [summaries]);

  // Needs Improvement (< 85 or lowest 5)
  const lowPerformers = useMemo(() => {
    return [...summaries]
      .filter((s) => s.finalScore < 95)
      .sort((a, b) => a.finalScore - b.finalScore)
      .slice(0, 5);
  }, [summaries]);

  // Department comparative chart
  const departments = Array.from(new Set(staffList.map((s) => s.department)));
  const deptComparison = useMemo(() => {
    return departments.map((dept) => {
      const deptItems = summaries.filter((s) => s.person.department === dept);
      const avg =
        deptItems.length > 0
          ? Number(
              (
                deptItems.reduce((acc, curr) => acc + curr.finalScore, 0) / deptItems.length
              ).toFixed(1)
            )
          : 100;
      const plusSum = deptItems.reduce((acc, curr) => acc + curr.totalPlus, 0);
      const minusSum = deptItems.reduce((acc, curr) => acc + curr.totalMinus, 0);

      return {
        dept: dept.replace('Tổ ', ''),
        avgScore: avg,
        plus: plusSum,
        minus: minusSum,
        count: deptItems.length,
      };
    });
  }, [departments, summaries]);

  // Incidents grouped by Criteria group
  const criteriaGroupStats = useMemo(() => {
    const groupMap: Record<string, { count: number; points: number }> = {};
    incidentsList
      .filter((inc) => inc.schoolYear === schoolYear)
      .forEach((inc) => {
        const crit = criteriaList.find((c) => c.id === inc.criterionId);
        const gName = crit?.group || 'Khác';
        if (!groupMap[gName]) {
          groupMap[gName] = { count: 0, points: 0 };
        }
        groupMap[gName].count += inc.quantity;
        groupMap[gName].points += inc.totalPoints;
      });

    return Object.entries(groupMap).map(([group, data]) => ({
      group,
      count: data.count,
      points: data.points,
    }));
  }, [incidentsList, criteriaList, schoolYear]);

  // Rank distribution
  const rankDistribution = useMemo(() => {
    const xuatSac = summaries.filter((s) => s.rank === 'Xuất sắc').length;
    const tot = summaries.filter((s) => s.rank === 'Tốt').length;
    const hoanThanh = summaries.filter((s) => s.rank === 'Hoàn thành').length;
    const canCoGang = summaries.filter((s) => s.rank === 'Cần cố gắng').length;

    return [
      { name: 'Xuất sắc (≥110)', value: xuatSac, color: '#10b981' },
      { name: 'Tốt (95-109)', value: tot, color: '#3b82f6' },
      { name: 'Hoàn thành (80-94)', value: hoanThanh, color: '#f59e0b' },
      { name: 'Cần cố gắng (<80)', value: canCoGang, color: '#ef4444' },
    ];
  }, [summaries]);

  // Export full report CSV
  const handleExportCsv = () => {
    const headers = [
      'STT',
      'Mã nhân sự',
      'Họ và tên',
      'Tổ / Bộ phận',
      'Chức vụ',
      'Điểm chuẩn',
      'Tổng điểm cộng',
      'Tổng điểm trừ',
      'Điểm tổng kết',
      'Xếp loại',
    ];
    const rows = summaries.map((s, idx) => [
      idx + 1,
      s.person.code,
      s.person.name,
      s.person.department,
      s.person.position,
      s.baseScore,
      s.totalPlus,
      s.totalMinus,
      s.finalScore,
      s.rank,
    ]);

    downloadCsv(`Bao_cao_thong_ke_KPI_THPT_Phuong_Xa_${period}`, headers, rows);
  };

  return (
    <div className="space-y-6">
      {/* Prominent Back Button to return to working module */}
      <div className="flex items-center justify-between bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={() => setActiveTab('giaovien')}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-black text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-amber-300" />
          <span>← Quay lại Module Đang Làm Việc</span>
        </button>

        <div className="text-xs font-bold text-slate-600 hidden sm:flex items-center gap-2">
          <span>Báo cáo & Thống kê KPI trường THPT Phương Xá</span>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
              BÁO CÁO & THỐNG KÊ TOÀN DIỆN
            </h2>
            <p className="text-xs text-slate-500">
              Phân tích chỉ số thi đua chuyên môn, nề nếp và xếp loại {schoolConfig.normalName}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Period selector */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                period === 'month' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Tháng {month}
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                period === 'year' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
              }`}
            >
              Cả năm ({schoolYear})
            </button>
          </div>

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
                'BÁO CÁO TỔNG KẾT & PHÂN TÍCH KPI',
                `${schoolConfig.normalName} – Thống kê đánh giá thi đua kỳ: ${period === 'year' ? 'Cả năm' : `Tháng ${month}`}`
              )
            }
            className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>In báo cáo</span>
          </button>
        </div>
      </div>

      {/* Top vs Needs-Improvement Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Honors */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Top 5 Cán Bộ / Giáo Viên Xuất Sắc Nhất</span>
            </h3>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
              Khen thưởng
            </span>
          </div>

          <div className="space-y-2">
            {topPerformers.map((item, idx) => (
              <div
                key={item.person.id}
                onClick={() => {
                  setSelectedPersonId(item.person.id);
                  setActiveTab('kpi-evaluation');
                }}
                className="p-3 rounded-xl border border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/30 transition flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-bold text-xs text-slate-800">{item.person.name}</div>
                    <div className="text-[11px] text-slate-400">
                      {item.person.position} • {item.person.department}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-emerald-600">{item.finalScore} đ</span>
                  <div className="text-[10px] text-emerald-700 font-semibold">+{item.totalPlus} đ cộng</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Needs Improvement */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Cá Nhân Cần Cố Gắng & Tăng Cường Đôn Đốc</span>
            </h3>
            <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
              Hỗ trợ & giám sát
            </span>
          </div>

          <div className="space-y-2">
            {lowPerformers.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Toàn trường đều đạt từ mức Tốt trở lên trong giai đoạn này!
              </div>
            ) : (
              lowPerformers.map((item) => (
                <div
                  key={item.person.id}
                  onClick={() => {
                    setSelectedPersonId(item.person.id);
                    setActiveTab('kpi-evaluation');
                  }}
                  className="p-3 rounded-xl border border-slate-100 hover:border-rose-300 hover:bg-rose-50/30 transition flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 font-black text-xs flex items-center justify-center">
                      !
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-800">{item.person.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {item.person.position} • {item.person.department}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-rose-600">{item.finalScore} đ</span>
                    <div className="text-[10px] text-rose-700 font-semibold">-{item.totalMinus} đ trừ</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Department Comparison Chart */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>So Sánh Điểm Thi Đua KPI Giữa Các Tổ Chuyên Môn</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Điểm trung bình và tổng điểm cộng/trừ phân bổ theo từng đơn vị
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptComparison} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="dept" tick={{ fontSize: 11, fill: '#64748b' }} angle={-15} textAnchor="end" />
              <YAxis domain={[80, 130]} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                formatter={(value: any, name: string) => [
                  `${value} ${name === 'avgScore' ? 'điểm' : 'đ'}`,
                  name === 'avgScore' ? 'KPI Trung Bình' : name === 'plus' ? 'Tổng điểm cộng' : 'Tổng điểm trừ',
                ]}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="avgScore" fill="#2563eb" radius={[6, 6, 0, 0]} name="avgScore" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Criteria Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2">
            <PieIcon className="w-4 h-4 text-blue-600" />
            <span>Tỷ Lệ Xếp Loại Thi Đua Toàn Trường</span>
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={rankDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={45}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {rankDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Criteria Groups Stats */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Thống Kê Theo Nhóm Tiêu Chí</span>
          </h3>

          <div className="space-y-3">
            {criteriaGroupStats.map((item) => (
              <div key={item.group} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-800">{item.group}</div>
                  <div className="text-[11px] text-slate-500">Số lượt phát sinh: {item.count} lần</div>
                </div>
                <div className="text-right font-black text-sm text-blue-700">
                  {item.points} điểm
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
