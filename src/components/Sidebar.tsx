import React from 'react';
import { useKpi } from '../context/KpiContext';
import { isCbqlEvaluation } from '../utils/cbqlUtils';
import { getDepartmentId } from '../types';
import {
  Home,
  Award,
  GraduationCap,
  Users,
  PlusCircle,
  PieChart,
  Settings,
  HelpCircle,
  BookOpen,
  FlaskConical,
  Calculator,
  Landmark,
  Building2,
  FileCheck2,
  Briefcase,
  X,
  Palette,
  CalendarDays,
  Calendar,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  roles: ('bgh' | 'giaovien' | 'nhanvien')[];
  badge?: string | number;
  sectionHeader?: string;
}

/**
 * Mascot badge styled after the circular educator emblem in the design prototype
 */
const EducatorMascotEmblem: React.FC = () => (
  <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
    {/* Soft Glow */}
    <div className="absolute inset-0 rounded-full bg-cyan-400/30 blur-md animate-pulse" />

    {/* Outer Gradient Ring */}
    <div className="relative w-full h-full rounded-full p-1 bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 shadow-md flex items-center justify-center">
      <div className="w-full h-full rounded-full bg-white p-0.5 flex items-center justify-center overflow-hidden">
        <svg
          viewBox="0 0 120 120"
          className="w-full h-full rounded-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Radial Background */}
          <circle cx="60" cy="60" r="60" fill="url(#bgGradientMascot)" />
          {/* Dotted Aura */}
          <circle cx="60" cy="60" r="48" stroke="#bae6fd" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
          <path d="M60 8 L60 20 M60 100 L60 112 M8 60 L20 60 M100 60 L112 60" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" opacity="0.8" />

          {/* Shoulders & Suit */}
          <path
            d="M24 118 C24 94 36 82 60 82 C84 82 96 94 96 118 Z"
            fill="#1e3a8a"
          />
          {/* White Collar & Red Tie */}
          <path d="M49 82 L60 100 L71 82 Z" fill="#ffffff" />
          <path d="M57 87 L63 87 L64 104 L60 108 L56 104 Z" fill="#ef4444" />
          {/* Neck */}
          <path d="M52 74 H68 V84 H52 Z" fill="#fed7aa" />
          {/* Face */}
          <ellipse cx="60" cy="64" rx="18" ry="19" fill="#fde68a" />
          {/* Hair */}
          <path
            d="M40 56 C40 42 48 38 60 38 C72 38 80 42 80 56 C80 63 78 68 76 72 C73 64 72 49 60 49 C48 49 47 64 44 72 C42 68 40 63 40 56 Z"
            fill="#78350f"
          />
          {/* Glasses */}
          <circle cx="53" cy="63" r="5.5" stroke="#0284c7" strokeWidth="2" fill="#e0f2fe" fillOpacity="0.5" />
          <circle cx="67" cy="63" r="5.5" stroke="#0284c7" strokeWidth="2" fill="#e0f2fe" fillOpacity="0.5" />
          <path d="M58.5 63 H61.5" stroke="#0284c7" strokeWidth="2" />
          {/* Eyes & Smile */}
          <circle cx="53" cy="63" r="1.8" fill="#0f172a" />
          <circle cx="67" cy="63" r="1.8" fill="#0f172a" />
          <path d="M56 73 Q60 77 64 73" stroke="#b91c1c" strokeWidth="1.8" strokeLinecap="round" fill="none" />

          {/* Mortarboard Graduation Cap */}
          <path d="M60 24 L90 38 L60 52 L30 38 Z" fill="#1d4ed8" stroke="#93c5fd" strokeWidth="1.5" />
          <path d="M43 44 V52 C43 57 50 61 60 61 C70 61 77 57 77 52 V44" fill="#1e40af" />
          {/* Gold Button & Tassel */}
          <circle cx="60" cy="38" r="3" fill="#f59e0b" />
          <path d="M60 38 Q74 41 76 53" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" fill="none" />
          <circle cx="76" cy="54" r="2.5" fill="#f59e0b" />

          {/* Gradient Definition */}
          <defs>
            <radialGradient id="bgGradientMascot" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#bae6fd" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#2563eb" />
            </radialGradient>
          </defs>
        </svg>
      </div>
    </div>
  </div>
);

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    staffList,
    evaluationsList,
    incidentsList,
    leaveRequestsList,
    schoolConfig,
    uiSettings,
  } = useKpi();

  const userRole = currentUser?.role || 'giaovien';

  const bghEvalCount = evaluationsList.filter(
    (e) => isCbqlEvaluation(e, staffList) || e.targetType === 'bgh'
  ).length;
  const gvEvalCount = evaluationsList.filter((e) => e.targetType === 'giaovien').length;
  const nvEvalCount = evaluationsList.filter((e) => e.targetType === 'nhanvien').length;
  const pendingLeaveCount = leaveRequestsList.filter(
    (r) => r.status === 'pending_dept' || r.status === 'pending_bgh'
  ).length;

  const hoaSinhCount = staffList.filter(
    (s) => (s.is_active !== false) && (s.department_id === 'to-hoa-sinh-cn' || getDepartmentId(s.department, s.type) === 'to-hoa-sinh-cn')
  ).length;
  const toanLiTinCount = staffList.filter(
    (s) => (s.is_active !== false) && (s.department_id === 'to-toan-li-tin' || getDepartmentId(s.department, s.type) === 'to-toan-li-tin')
  ).length;
  const vanNnCount = staffList.filter(
    (s) => (s.is_active !== false) && (s.department_id === 'to-van-nn' || getDepartmentId(s.department, s.type) === 'to-van-nn')
  ).length;
  const suDiaCount = staffList.filter(
    (s) => (s.is_active !== false) && (s.department_id === 'to-su-dia' || getDepartmentId(s.department, s.type) === 'to-su-dia')
  ).length;
  const vanPhongCount = staffList.filter(
    (s) => (s.is_active !== false) && (s.department_id === 'to-van-phong' || getDepartmentId(s.department, s.type) === 'to-van-phong')
  ).length;

  /**
   * Navigation items list ordered vertically exactly according to the visual sample prototype
   */
  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Trang chủ',
      icon: Home,
      roles: ['bgh', 'giaovien', 'nhanvien'],
    },
    {
      id: 'lich-cong-tac',
      label: 'Lịch công tác tuần',
      icon: CalendarDays,
      roles: ['bgh', 'giaovien', 'nhanvien'],
      badge: 'Tuần 4',
      sectionHeader: 'LỊCH CÔNG TÁC & HOẠT ĐỘNG',
    },
    {
      id: 'school-work-schedule',
      label: 'Lịch giao việc nhà trường',
      icon: Calendar,
      roles: ['bgh', 'giaovien', 'nhanvien'],
      badge: 'Cấp trường',
    },
    {
      id: 'dept-work-schedule',
      label: 'Lịch giao việc tổ chuyên môn',
      icon: Building2,
      roles: ['bgh', 'giaovien', 'nhanvien'],
      badge: 'Tổ CM',
    },
    {
      id: 'bgh',
      label: 'KPI Cán bộ Quản lý',
      icon: Award,
      roles: ['bgh'],
      badge: `${bghEvalCount} phiếu`,
      sectionHeader: 'KPI & THI ĐUA NỘI BỘ',
    },
    {
      id: 'giaovien',
      label: 'KPI Giáo viên',
      icon: GraduationCap,
      roles: ['bgh', 'giaovien', 'nhanvien'],
      badge: `${gvEvalCount} phiếu`,
    },
    {
      id: 'kpi-nhanvien',
      label: 'KPI Nhân viên (30đ + 70đ)',
      icon: Briefcase,
      roles: ['bgh', 'giaovien', 'nhanvien'],
      badge: `${nvEvalCount} phiếu`,
    },
    {
      id: 'kpi-evaluation',
      label: 'Chấm điểm KPI (100đ)',
      icon: FileCheck2,
      roles: ['bgh', 'giaovien', 'nhanvien'],
      badge: 'Mẫu chuẩn',
    },
    {
      id: 'cbql-gv-nv',
      label: 'Danh sách CBQL - GV - NV',
      icon: Users,
      roles: ['bgh', 'giaovien', 'nhanvien'],
      badge: staffList.length,
    },
    // 5 Module Tổ Chuyên Môn & Văn Phòng
    {
      id: 'to-hoa-sinh-cn',
      label: 'Tổ Hóa - Sinh - CN',
      icon: FlaskConical,
      roles: ['bgh', 'giaovien', 'nhanvien'],
      badge: hoaSinhCount,
      sectionHeader: 'TỔ CHUYÊN MÔN & VĂN PHÒNG',
    },
    {
      id: 'to-toan-li-tin',
      label: 'Tổ Toán - Lí - Tin',
      icon: Calculator,
      roles: ['bgh', 'giaovien', 'nhanvien'],
      badge: toanLiTinCount,
    },
    {
      id: 'to-van-nn',
      label: 'Tổ Văn - Ngoại ngữ',
      icon: BookOpen,
      roles: ['bgh', 'giaovien', 'nhanvien'],
      badge: vanNnCount,
    },
    {
      id: 'to-su-dia',
      label: 'Tổ Sử - Địa - KT&PL - TD - QPAN',
      icon: Landmark,
      roles: ['bgh', 'giaovien', 'nhanvien'],
      badge: suDiaCount,
    },
    {
      id: 'to-van-phong',
      label: 'Tổ Văn phòng',
      icon: Building2,
      roles: ['bgh', 'giaovien', 'nhanvien'],
      badge: vanPhongCount,
    },
    {
      id: 'leave-management',
      label: 'Xin phép & Quản lý nghỉ',
      icon: CalendarDays,
      roles: ['bgh', 'giaovien', 'nhanvien'],
      badge: pendingLeaveCount > 0 ? `${pendingLeaveCount} chờ duyệt` : `${leaveRequestsList.length} đơn`,
      sectionHeader: 'NGHIỆP VỤ & ĐÁNH GIÁ',
    },
    {
      id: 'incident-entry',
      label: 'Nhập phát sinh KPI',
      icon: PlusCircle,
      roles: ['bgh'],
      badge: incidentsList.length,
    },
    {
      id: 'reports',
      label: 'Báo cáo – Thống kê',
      icon: PieChart,
      roles: ['bgh', 'giaovien', 'nhanvien'],
    },
    {
      id: 'ui-settings',
      label: 'Cấu hình giao diện',
      icon: Palette,
      roles: ['bgh', 'giaovien', 'nhanvien'],
      badge: '⚙️ UI',
      sectionHeader: 'CẤU HÌNH & HỆ THỐNG',
    },
    {
      id: 'settings',
      label: 'Cài đặt hệ thống',
      icon: Settings,
      roles: ['bgh'],
    },
    {
      id: 'guide',
      label: 'Hướng dẫn sử dụng',
      icon: HelpCircle,
      roles: ['bgh', 'giaovien', 'nhanvien'],
    },
  ];

  // Filter items allowed by role
  const accessibleItems = navItems.filter((item) => item.roles.includes(userRole));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Vertical Navigation Drawer / Sidebar */}
      <aside
        style={{ backgroundColor: uiSettings.sidebar_color || '#ffffff' }}
        className={`fixed top-0 bottom-0 left-0 z-50 w-80 max-w-[85vw] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out lg:static lg:z-10 lg:w-76 xl:w-80 lg:shadow-none lg:border-r lg:border-slate-200/80 shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-6 space-y-6 relative scrollbar-thin scrollbar-thumb-blue-200">
          {/* Top Section with Mascot & School Title */}
          <div className="relative pt-2 text-center">
            {/* Close Button (mobile/drawer) */}
            <button
              onClick={onClose}
              className="absolute top-0 right-0 p-2 rounded-xl border border-slate-200/80 bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-50 shadow-xs transition cursor-pointer lg:hidden"
              aria-label="Đóng thanh điều hướng"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Circular Mascot Emblem */}
            {uiSettings.show_school_image && (
              <div className="relative mx-auto flex items-center justify-center">
                {uiSettings.school_image_url ? (
                  <div
                    style={{
                      width: `${uiSettings.school_image_size}px`,
                      height: `${uiSettings.school_image_size}px`,
                    }}
                    className="rounded-full p-1 bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 shadow-md flex items-center justify-center overflow-hidden transition-all duration-200"
                  >
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                      <img
                        src={uiSettings.school_image_url}
                        alt="Biểu tượng trường"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <EducatorMascotEmblem />
                )}
              </div>
            )}

            {/* School Title */}
            {uiSettings.show_school_name && (
              <h2
                style={{
                  fontSize: `${Math.min(Math.max(uiSettings.school_name_font_size + 2, 16), 24)}px`,
                }}
                className="font-black text-[#0f2d59] tracking-tight uppercase mt-3.5"
              >
                {schoolConfig.shortName}
              </h2>
            )}

            {/* Slogan */}
            {uiSettings.show_slogan && (
              <p
                style={{
                  fontSize: `${uiSettings.slogan_font_size}px`,
                  color: uiSettings.secondary_color || '#1d4ed8',
                }}
                className="font-bold tracking-widest uppercase mt-1"
              >
                {uiSettings.slogan}
              </p>
            )}
          </div>


          {/* Vertical Scroll Navigation List */}
          <nav className="space-y-1.5 pt-1" aria-label="Thanh điều khiển dọc">
            {accessibleItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeTab === item.id ||
                (item.id === 'kpi-nhanvien' && activeTab === 'nhanvien');

              return (
                <React.Fragment key={item.id}>
                  {item.sectionHeader && (
                    <div className="pt-4 pb-1 px-4 text-[11px] font-extrabold text-[#0f2d59]/60 tracking-wider flex items-center justify-between border-t border-slate-100 mt-2">
                      <span>{item.sectionHeader}</span>
                    </div>
                  )}

                  <button
                    id={`nav-item-${item.id}`}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (window.innerWidth < 1024) {
                        onClose();
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-[14px] font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#1d4ed8] text-white shadow-md shadow-blue-600/25 ring-1 ring-blue-600'
                        : 'text-[#0f2d59] hover:bg-blue-50/80 hover:text-[#1d4ed8]'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <Icon
                        className={`w-5 h-5 shrink-0 transition-colors ${
                          isActive ? 'text-white' : 'text-[#1d4ed8]'
                        }`}
                        strokeWidth={2.2}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-blue-100 text-[#1d4ed8]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                </React.Fragment>
              );
            })}
          </nav>

          {/* Bottom Motto Quote & Branding Section */}
          <div className="pt-8 pb-4 text-center border-t border-slate-100 mt-6">
            <BookOpen className="w-8 h-8 text-blue-400 mx-auto stroke-[1.8] mb-3" />
            <p className="italic text-xs sm:text-[13px] text-[#0f2d59] font-medium max-w-[210px] mx-auto text-center leading-relaxed">
              “Vì một ngôi trường hạnh phúc, chất lượng và phát triển bền vững”
            </p>
            <div className="w-16 h-0.5 bg-blue-100 mx-auto my-3" />
            <p className="text-xs font-black text-[#1d4ed8] uppercase tracking-wider">
              {schoolConfig.shortName}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
