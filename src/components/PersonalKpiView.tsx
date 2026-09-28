import React, { useState, useMemo } from 'react';
import { useKpi } from '../context/KpiContext';
import {
  UserCheck,
  Calendar,
  PlusCircle,
  MinusCircle,
  Award,
  FileSpreadsheet,
  Printer,
  TrendingUp,
  Clock,
  FileText,
  User,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { downloadCsv, getRankBadgeClass } from '../utils/exportUtils';

export const PersonalKpiView: React.FC = () => {
  const {
    staffList,
    incidentsList,
    currentUser,
    selectedPersonId,
    setSelectedPersonId,
    schoolYear,
    semester,
    month,
    getPersonKpiSummary,
    openPrintModal,
  } = useKpi();

  const isBgh = currentUser?.role === 'bgh';

  // Selected person: if user is not BGH, force to themselves unless BGH
  const activePersonId = useMemo(() => {
    if (!isBgh && currentUser?.personId) {
      return currentUser.personId;
    }
    return selectedPersonId || (staffList.length > 0 ? staffList[0].id : '');
  }, [isBgh, currentUser, selectedPersonId, staffList]);

  // Local filter states
  const [filterMonth, setFilterMonth] = useState<number | 'all'>('all');
  const [filterSemester, setFilterSemester] = useState<1 | 2 | 'all'>('all');

  const selectedPerson = staffList.find((s) => s.id === activePersonId);

  // Summaries
  const currentSummary = getPersonKpiSummary(activePersonId, {
    schoolYear,
    semester: filterSemester === 'all' ? undefined : filterSemester,
    month: filterMonth === 'all' ? undefined : filterMonth,
  });

  // Incidents for this person
  const personIncidents = useMemo(() => {
    return incidentsList
      .filter((inc) => inc.personId === activePersonId && inc.schoolYear === schoolYear)
      .filter((inc) => {
        const matchesSemester = filterSemester === 'all' || inc.semester === filterSemester;
        const matchesMonth = filterMonth === 'all' || inc.month === filterMonth;
        return matchesSemester && matchesMonth;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [incidentsList, activePersonId, schoolYear, filterSemester, filterMonth]);

  // Monthly timeline chart data for this person
  const chartData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
      const summaryAtMonth = getPersonKpiSummary(activePersonId, {
        schoolYear,
        month: m,
      });
      return {
        monthName: `T${m}`,
        score: summaryAtMonth ? summaryAtMonth.finalScore : 100,
        plus: summaryAtMonth ? summaryAtMonth.totalPlus : 0,
        minus: summaryAtMonth ? summaryAtMonth.totalMinus : 0,
      };
    });
  }, [activePersonId, schoolYear, getPersonKpiSummary]);

  const handleExportCsv = () => {
    if (!selectedPerson || !currentSummary) return;
    const headers = ['STT', 'Ngày', 'Tháng', 'Học kỳ', 'Nội dung tiêu chí', 'Mã tiêu chí', 'Loại điểm', 'Số lượng', 'Mức điểm', 'Tổng điểm', 'Minh chứng', 'Ghi chú'];
    const rows = personIncidents.map((inc, idx) => [
      idx + 1,
      inc.date,
      inc.month,
      `Học kỳ ${inc.semester}`,
      inc.criterionName,
      inc.criterionCode,
      inc.type === 'plus' ? 'Cộng' : 'Trừ',
      inc.quantity,
      inc.unitPoints,
      inc.totalPoints,
      inc.evidenceRef || '',
      inc.notes || '',
    ]);

    downloadCsv(
      `Bang_KPI_ca_nhan_${selectedPerson.code}_${selectedPerson.name.replace(/\s+/g, '_')}`,
      headers,
      rows
    );
  };

  if (!selectedPerson) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
        Chưa có dữ liệu nhân sự được chọn.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Controls & Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
              BẢNG ĐIỂM KPI CÁ NHÂN
            </h2>
            <p className="text-xs text-slate-500">
              Chi tiết các chỉ số thi đua, minh chứng và lịch sử biến động điểm số
            </p>
          </div>
        </div>

        {/* Person Selector for BGH / Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {isBgh && (
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700">Chọn cá nhân:</span>
              <select
                value={activePersonId}
                onChange={(e) => setSelectedPersonId(e.target.value)}
                className="py-1.5 px-3 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.code}] {s.name} - {s.department}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Month filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-medium">Tháng:</span>
            <select
              value={filterMonth}
              onChange={(e) =>
                setFilterMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="py-1.5 px-2 rounded-lg border border-slate-300 bg-white text-xs"
            >
              <option value="all">Cả năm ({schoolYear})</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  Tháng {m}
                </option>
              ))}
            </select>
          </div>

          {/* Semester filter */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-medium">Kỳ:</span>
            <select
              value={filterSemester}
              onChange={(e) =>
                setFilterSemester(e.target.value === 'all' ? 'all' : (Number(e.target.value) as 1 | 2))
              }
              className="py-1.5 px-2 rounded-lg border border-slate-300 bg-white text-xs"
            >
              <option value="all">Tất cả kỳ</option>
              <option value={1}>Học kỳ I</option>
              <option value={2}>Học kỳ II</option>
            </select>
          </div>

          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={() =>
              openPrintModal(
                `PHIẾU ĐÁNH GIÁ KPI CÁ NHÂN: ${selectedPerson.name.toUpperCase()}`,
                `Mã số: ${selectedPerson.code} – Đơn vị: ${selectedPerson.department} – Năm học: ${schoolYear}`
              )
            }
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>In phiếu KPI</span>
          </button>
        </div>
      </div>

      {/* Person Summary Profile Card */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/10 border-2 border-white/40 flex items-center justify-center font-extrabold text-2xl text-white shadow-inner">
            {selectedPerson.name.charAt(selectedPerson.name.lastIndexOf(' ') + 1) || 'GV'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-blue-200 bg-blue-700/60 px-2 py-0.5 rounded font-bold">
                {selectedPerson.code}
              </span>
              <span className="text-xs text-blue-200">• {selectedPerson.department}</span>
            </div>
            <h3 className="text-xl font-black tracking-tight text-white mt-0.5">
              {selectedPerson.name}
            </h3>
            <p className="text-xs text-blue-200 mt-0.5">
              {selectedPerson.position}
              {selectedPerson.subject && ` • Bộ môn: ${selectedPerson.subject}`}
              {selectedPerson.classAssigned && ` • Chủ nhiệm: ${selectedPerson.classAssigned}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-blue-200">Xếp loại thi đua</div>
            <div className="text-lg font-black text-amber-300">
              {currentSummary?.rank || 'Hoàn thành'}
            </div>
          </div>
          <div className="w-px h-10 bg-blue-700" />
          <div className="text-right">
            <div className="text-xs text-blue-200">Điểm tổng kết</div>
            <div className="text-2xl font-black text-white">
              {currentSummary?.finalScore || 100} <span className="text-sm font-normal">điểm</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Score Key Metric Cards (Section 11) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Điểm đầu kỳ */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 font-semibold mb-1">Điểm KPI đầu kỳ</div>
          <div className="text-2xl font-black text-slate-800">
            {currentSummary?.baseScore ?? 100} đ
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Điểm chuẩn xuất phát ban đầu</div>
        </div>

        {/* 2. Tổng điểm cộng */}
        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs bg-gradient-to-b from-emerald-50/20 to-white">
          <div className="text-xs text-emerald-800 font-semibold mb-1 flex items-center justify-between">
            <span>Tổng điểm cộng</span>
            <PlusCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            +{currentSummary?.totalPlus ?? 0} đ
          </div>
          <div className="text-[11px] text-emerald-700 mt-1">Từ các thành tích & nhiệm vụ tốt</div>
        </div>

        {/* 3. Tổng điểm trừ */}
        <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs bg-gradient-to-b from-rose-50/20 to-white">
          <div className="text-xs text-rose-800 font-semibold mb-1 flex items-center justify-between">
            <span>Tổng điểm trừ</span>
            <MinusCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600">
            -{currentSummary?.totalMinus ?? 0} đ
          </div>
          <div className="text-[11px] text-rose-700 mt-1">Vi phạm nề nếp hoặc chậm trễ</div>
        </div>

        {/* 4. Điểm KPI hiện tại */}
        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs bg-gradient-to-b from-blue-50/20 to-white">
          <div className="text-xs text-blue-800 font-semibold mb-1 flex items-center justify-between">
            <span>Điểm KPI hiện tại</span>
            <Award className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-700">
            {currentSummary?.finalScore ?? 100} đ
          </div>
          <div className="text-[11px] text-blue-700 mt-1 font-semibold">
            {currentSummary?.rank}
          </div>
        </div>
      </div>

      {/* Chart: KPI fluctuation over months */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Biểu Đồ Biến Động Điểm KPI Qua 12 Tháng Năm Học {schoolYear}</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Theo dõi sự cải thiện và mức độ ổn định của cá nhân theo thời gian
            </p>
          </div>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="monthName" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis domain={[80, 130]} tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                formatter={(val: any) => [`${val} điểm`, 'Điểm KPI']}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 4, fill: '#2563eb' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detail Table: Ngày | Nội dung | Loại | Số lượng | Điểm | Ghi chú */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Lịch Sử Chi Tiết Các Sự Việc Phát Sinh KPI ({personIncidents.length})</span>
          </h3>
          <span className="text-xs text-slate-500">
            Dữ liệu công khai, minh bạch theo từng mục
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3 text-center w-12">STT</th>
                <th className="py-3 px-3">Ngày</th>
                <th className="py-3 px-4">Nội dung tiêu chí</th>
                <th className="py-3 px-3 text-center">Loại</th>
                <th className="py-3 px-3 text-center">Số lượng</th>
                <th className="py-3 px-3 text-center">Mức điểm</th>
                <th className="py-3 px-3 text-center">Tổng điểm</th>
                <th className="py-3 px-4">Minh chứng & Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {personIncidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Trong khoảng thời gian này không có sự việc phát sinh (duy trì điểm chuẩn 100).
                  </td>
                </tr>
              ) : (
                personIncidents.map((inc, index) => (
                  <tr key={inc.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 text-center text-slate-400 font-normal">
                      {index + 1}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-600 whitespace-nowrap">
                      {inc.date}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="font-mono text-blue-700 font-semibold">[{inc.criterionCode}]</span>
                        <span>{inc.criterionName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inc.type === 'plus'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {inc.type === 'plus' ? '+ Điểm cộng' : '- Điểm trừ'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold">{inc.quantity}</td>
                    <td className="py-3 px-3 text-center font-medium">{inc.unitPoints} đ</td>
                    <td className="py-3 px-3 text-center font-black">
                      <span className={inc.type === 'plus' ? 'text-emerald-600' : 'text-rose-600'}>
                        {inc.type === 'plus' ? '+' : '-'}
                        {inc.totalPoints} đ
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {inc.evidenceRef && (
                        <div className="text-[11px] font-semibold text-blue-700 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          <span>{inc.evidenceRef}</span>
                        </div>
                      )}
                      {inc.notes && <div className="text-[11px] text-slate-500 italic mt-0.5">{inc.notes}</div>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
