import React, { useState } from 'react';
import { useKpi } from '../context/KpiContext';
import {
  ShieldCheck,
  GraduationCap,
  Briefcase,
  Users,
  Award,
  PlusCircle,
  PieChart as PieChartIcon,
  Settings,
  FlaskConical,
  Calculator,
  BookOpen,
  Landmark,
  Building2,
  Upload,
  Sliders,
  ChevronRight,
  School,
  Palette,
  CalendarDays,
} from 'lucide-react';
import { HomepageBackgroundManager } from './HomepageBackgroundManager';

export const DashboardView: React.FC = () => {
  const {
    staffList,
    schoolYear,
    semester,
    setActiveTab,
    currentUser,
    activeBackground,
    schoolConfig,
    uiSettings,
  } = useKpi();


  const [isBgManagerOpen, setIsBgManagerOpen] = useState(false);
  const isAdmin = currentUser?.role === 'bgh';

  // Counts for each module
  const bghCount = staffList.filter((s) => s.type === 'bgh').length;
  const gvCount = staffList.filter((s) => s.type === 'giaovien').length;
  const nvCount = staffList.filter((s) => s.type === 'nhanvien').length;
  const totalStaff = staffList.length;

  const hoaSinhCount = staffList.filter((s) => s.department === 'Tổ Hóa - Sinh - CN').length;
  const toanLiTinCount = staffList.filter((s) => s.department === 'Tổ Toán - Lí - Tin').length;
  const vanNnCount = staffList.filter((s) => s.department === 'Tổ Văn - Ngoại ngữ').length;
  const suDiaCount = staffList.filter((s) => s.department === 'Tổ Sử - Địa - KT&PL - TD - QPAN').length;
  const vanPhongCount = staffList.filter((s) => s.department === 'Tổ Văn phòng').length;

  // Main system modules (Compact & Sleek)
  const coreModules = [
    {
      id: 'bgh',
      name: 'KPI Ban Giám Hiệu',
      icon: ShieldCheck,
      badge: `${bghCount} CB`,
      bgIcon: 'bg-amber-100 text-amber-700 border-amber-300',
      accentBorder: 'hover:border-amber-400',
    },
    {
      id: 'giaovien',
      name: 'KPI Giáo Viên',
      icon: GraduationCap,
      badge: `${gvCount} GV`,
      bgIcon: 'bg-blue-100 text-blue-700 border-blue-300',
      accentBorder: 'hover:border-blue-400',
    },
    {
      id: 'nhanvien',
      name: 'KPI Nhân Viên',
      icon: Briefcase,
      badge: `${nvCount} NV`,
      bgIcon: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      accentBorder: 'hover:border-emerald-400',
    },
    {
      id: 'evaluation',
      name: 'Đánh Giá & Phê Duyệt',
      icon: Award,
      badge: 'Thẩm định',
      bgIcon: 'bg-indigo-100 text-indigo-700 border-indigo-300',
      accentBorder: 'hover:border-indigo-400',
    },
    {
      id: 'cbql-gv-nv',
      name: 'Hồ Sơ Nhân Sự Toàn Trường',
      icon: Users,
      badge: `${totalStaff} người`,
      bgIcon: 'bg-cyan-100 text-cyan-700 border-cyan-300',
      accentBorder: 'hover:border-cyan-400',
    },
    {
      id: 'incident-entry',
      name: 'Nhật Ký Phát Sinh KPI',
      icon: PlusCircle,
      badge: 'Cộng / Trừ',
      bgIcon: 'bg-rose-100 text-rose-700 border-rose-300',
      accentBorder: 'hover:border-rose-400',
    },
    {
      id: 'leave-management',
      name: 'Xin Phép & Quản Lý Nghỉ',
      icon: CalendarDays,
      badge: 'Trực tuyến',
      bgIcon: 'bg-amber-100 text-amber-700 border-amber-300',
      accentBorder: 'hover:border-amber-400',
    },
    {
      id: 'reports',
      name: 'Báo Cáo & Thống Kê',
      icon: PieChartIcon,
      badge: 'Excel / In',
      bgIcon: 'bg-purple-100 text-purple-700 border-purple-300',
      accentBorder: 'hover:border-purple-400',
    },
    {
      id: 'ui-settings',
      name: 'Cấu hình giao diện & Header',
      icon: Palette,
      badge: '⚙️ UI',
      bgIcon: 'bg-indigo-100 text-indigo-700 border-indigo-300',
      accentBorder: 'hover:border-indigo-400',
    },
    {
      id: 'settings',
      name: 'Cài Đặt Hệ Thống',
      icon: Settings,
      badge: 'BGH',
      bgIcon: 'bg-slate-200 text-slate-800 border-slate-300',
      accentBorder: 'hover:border-slate-400',
    },
  ];

  // Department modules (Compact)
  const deptModules = [
    {
      id: 'to-hoa-sinh-cn',
      name: 'Tổ Hóa - Sinh - CN',
      icon: FlaskConical,
      color: 'text-emerald-700',
      bg: 'bg-emerald-100 border-emerald-300',
      count: hoaSinhCount,
      badge: `${hoaSinhCount} GV`,
    },
    {
      id: 'to-toan-li-tin',
      name: 'Tổ Toán - Lí - Tin',
      icon: Calculator,
      color: 'text-blue-700',
      bg: 'bg-blue-100 border-blue-300',
      count: toanLiTinCount,
      badge: `${toanLiTinCount} GV`,
    },
    {
      id: 'to-van-nn',
      name: 'Tổ Văn - Ngoại ngữ',
      icon: BookOpen,
      color: 'text-indigo-700',
      bg: 'bg-indigo-100 border-indigo-300',
      count: vanNnCount,
      badge: `${vanNnCount} GV`,
    },
    {
      id: 'to-su-dia',
      name: 'Tổ Sử - Địa - KT&PL - TD - QPAN',
      icon: Landmark,
      color: 'text-amber-700',
      bg: 'bg-amber-100 border-amber-300',
      count: suDiaCount,
      badge: `${suDiaCount} GV`,
    },
    {
      id: 'to-van-phong',
      name: 'Tổ Văn phòng',
      icon: Building2,
      color: 'text-purple-700',
      bg: 'bg-purple-100 border-purple-300',
      count: vanPhongCount,
      badge: `${vanPhongCount} NV`,
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-9.5rem)] -m-4 sm:-m-6 lg:-m-8 p-3 sm:p-5 lg:p-6 flex flex-col justify-between">
      {/* 1. HOMEPAGE BACKGROUND LAYER WITH OBJECT-FIT: COVER & OVERLAY */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <img
          src={activeBackground.image_url}
          alt={activeBackground.file_name || 'Ảnh nền THPT Phương Xá'}
          className="w-full h-full object-cover transition-all duration-700 select-none"
          style={{
            objectPosition: activeBackground.position || 'center center',
          }}
        />
        {/* Dark overlay layer (0% -> 80%, default 30%) */}
        <div
          className="absolute inset-0 bg-slate-950 transition-opacity duration-300"
          style={{
            opacity: (activeBackground.overlay_opacity ?? 30) / 100,
          }}
        />
        {/* Subtle light/vignette gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-slate-900/30" />
      </div>

      {/* 2. TOP HEADER BAR: Compact identification & Admin controls */}
      <div className="relative z-10 w-full max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-blue-900/80 backdrop-blur-md text-white font-extrabold text-[11px] tracking-wide uppercase border border-blue-400/40 flex items-center gap-1.5 shadow-md">
            <School className="w-3.5 h-3.5 text-blue-300 shrink-0" />
            <span>{schoolConfig.fullName}</span>
          </span>
          <span className="text-xs text-white/90 font-semibold bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20 hidden sm:inline-block shadow-xs">
            Năm học {schoolYear} • Học kỳ {semester}
          </span>
        </div>

        {/* Admin Background & UI Control Bar */}
        {isAdmin && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('ui-settings')}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 backdrop-blur-md text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition cursor-pointer border border-indigo-400/30"
              title="Chỉnh sửa logo, tên trường, khẩu hiệu, màu sắc và giao diện Header"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>⚙️ Cấu hình giao diện</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBgManagerOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-blue-600/90 hover:bg-blue-600 backdrop-blur-md text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition cursor-pointer border border-blue-400/30"
              title="Tải lên và quản lý ảnh nền Trang chủ"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>+ Tải ảnh nền</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBgManagerOpen(true)}
              className="p-1.5 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-md text-white text-xs transition cursor-pointer border border-white/20 shadow-md"
              title="Căn chỉnh vị trí & độ tối ảnh nền"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

      </div>

      {/* 3. SPACER / HERO OPEN AREA: Giữ thông thoáng trọn vẹn khoảng trung tâm để hiển thị rõ ảnh nền, tượng đài, cổng trường, lễ ký kết */}
      <div className="flex-1 min-h-[140px] sm:min-h-[220px]" />

      {/* 4. BOTTOM DOCK: CÁC MODULE XUẤT HIỆN TẠI PHÍA DƯỚI GIAO DIỆN TRANG CHỦ */}
      <div className="relative z-10 w-full max-w-7xl mx-auto space-y-3 pt-4">
        {/* Featured Work Schedule Quick Banner */}
        <div
          onClick={() => setActiveTab('lich-cong-tac')}
          className="bg-gradient-to-r from-blue-900/95 via-indigo-900/95 to-blue-800/95 backdrop-blur-md border border-cyan-400/50 rounded-2xl p-3.5 sm:p-4 text-white shadow-2xl cursor-pointer hover:scale-[1.01] transition-all flex items-center justify-between gap-4 group"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-500/25 text-cyan-300 border border-cyan-400/40 group-hover:bg-cyan-500/35 transition">
              <CalendarDays className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-red-600 text-white font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-bounce">
                  ⚡ Mới nhất
                </span>
                <h3 className="font-black text-sm sm:text-base tracking-tight text-white uppercase">
                  Lịch Công Tác Tuần 4 (28/9 - 04/10/2026) - Trường THPT Phương Xá
                </h3>
              </div>
              <p className="text-xs text-blue-200 mt-0.5">
                Trực tuần: Lớp 10A4 • GV: Trần Quang Vinh • Xem chi tiết lịch sáng, chiều & phân công lãnh đạo trực
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-400 text-slate-950 font-black text-xs shadow-md group-hover:bg-cyan-300 transition shrink-0">
            <span>Xem Lịch Ngay</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>

        {/* SECTION 1: CÁC MODULE CHỨC NĂNG CHÍNH */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400 shadow-xs"></span>
              <h2 className="text-xs font-black uppercase tracking-wider text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                CÁC MODULE CHỨC NĂNG CHÍNH
              </h2>
            </div>
            <span className="text-[10px] font-bold text-white/90 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20 shadow-xs">
              {coreModules.length} Modules
            </span>
          </div>

          {/* Grid 4 columns on desktop/tablet, 2 columns on mobile */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2">
            {coreModules.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`group bg-white/95 hover:bg-white backdrop-blur-md rounded-xl p-2 sm:p-2.5 border border-white/80 shadow-md hover:shadow-xl transition-all duration-150 cursor-pointer flex items-center gap-2 text-left ${item.accentBorder} hover:-translate-y-0.5`}
                >
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center border shrink-0 group-hover:scale-105 transition-transform ${item.bgIcon}`}
                  >
                    <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 leading-none mb-0.5">
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-tight">
                        MODULE
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[9px] font-bold border border-slate-200">
                        {item.badge}
                      </span>
                    </div>
                    <div className="text-[11px] sm:text-xs font-black text-slate-900 group-hover:text-blue-700 truncate transition-colors">
                      {item.name}
                    </div>
                  </div>

                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transform group-hover:translate-x-0.5 transition-all shrink-0 hidden sm:block" />
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: CÁC MODULE TỔ CHUYÊN MÔN & VĂN PHÒNG */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs"></span>
              <h2 className="text-xs font-black uppercase tracking-wider text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                TỔ CHUYÊN MÔN & VĂN PHÒNG
              </h2>
            </div>
            <span className="text-[10px] font-bold text-white/90 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/20 shadow-xs">
              5 Tổ
            </span>
          </div>

          {/* Grid 5 columns on desktop/tablet, 2 on mobile */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {deptModules.map((dept) => {
              const Icon = dept.icon;
              return (
                <button
                  key={dept.id}
                  type="button"
                  onClick={() => setActiveTab(dept.id)}
                  className="group bg-white/95 hover:bg-white backdrop-blur-md rounded-xl p-2 border border-white/80 shadow-md hover:shadow-xl transition-all duration-150 cursor-pointer flex items-center gap-2 text-left hover:border-emerald-400 hover:-translate-y-0.5"
                >
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center border shrink-0 group-hover:scale-105 transition-transform ${dept.bg}`}
                  >
                    <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${dept.color}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] sm:text-xs font-black text-slate-900 group-hover:text-emerald-700 truncate transition-colors leading-tight">
                      {dept.name}
                    </div>
                    <span className="text-[9px] font-bold text-slate-500">
                      {dept.badge}
                    </span>
                  </div>

                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transform group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. BACKGROUND MANAGER MODAL */}
      <HomepageBackgroundManager
        isOpen={isBgManagerOpen}
        onClose={() => setIsBgManagerOpen(false)}
      />
    </div>
  );
};
