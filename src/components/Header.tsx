import React, { useState } from 'react';
import { useKpi } from '../context/KpiContext';
import {
  GraduationCap,
  Calendar,
  LogOut,
  User,
  PlusCircle,
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
  Award,
  Briefcase,
  Printer,
  Sparkles,
  Database,
  Edit2,
  Check,
  Palette,
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const {
    currentUser,
    users,
    switchUserById,
    updateBghName,
    logout,
    schoolYear,
    setSchoolYear,
    month,
    setMonth,
    semester,
    setSemester,
    setIsQuickIncidentOpen,
    openPrintModal,
    schoolConfig,
    isDbLoading,
    uiSettings,
    setActiveTab,
  } = useKpi();


  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isEditBghModalOpen, setIsEditBghModalOpen] = useState(false);
  const [newBghName, setNewBghName] = useState('');
  const [newBghPosition, setNewBghPosition] = useState('');
  const [isSavingBgh, setIsSavingBgh] = useState(false);

  const openEditBghModal = () => {
    const bghUser = users.find((u) => u.role === 'bgh') || currentUser;
    setNewBghName(bghUser?.name || 'Thầy Lê Quốc Tuấn');
    setNewBghPosition(bghUser?.position || 'Hiệu trưởng');
    setIsEditBghModalOpen(true);
    setIsUserDropdownOpen(false);
  };

  const handleSaveBgh = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBghName.trim()) return;
    setIsSavingBgh(true);
    try {
      await updateBghName(newBghName.trim(), newBghPosition.trim());
      setIsEditBghModalOpen(false);
    } finally {
      setIsSavingBgh(false);
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'bgh':
        return {
          label: 'Ban Giám hiệu',
          bg: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: ShieldCheck,
        };
      case 'giaovien':
        return {
          label: 'Giáo viên',
          bg: 'bg-blue-100 text-blue-800 border-blue-300',
          icon: Award,
        };
      case 'nhanvien':
        return {
          label: 'Nhân viên',
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: Briefcase,
        };
      default:
        return {
          label: 'Khách',
          bg: 'bg-slate-100 text-slate-800 border-slate-300',
          icon: User,
        };
    }
  };

  const roleInfo = getRoleBadge(currentUser?.role);
  const RoleIcon = roleInfo.icon;

  // Dynamic Header background style
  const headerContainerStyle: React.CSSProperties = {
    minHeight: `${uiSettings.header_height}px`,
    color: uiSettings.text_color,
  };

  if (uiSettings.header_bg_type === 'gradient') {
    headerContainerStyle.background = `linear-gradient(to right, ${uiSettings.header_gradient_from || uiSettings.primary_color}, ${uiSettings.header_gradient_to || uiSettings.secondary_color})`;
  } else if (uiSettings.header_bg_type === 'solid') {
    headerContainerStyle.backgroundColor = uiSettings.primary_color;
  } else if (uiSettings.header_bg_type === 'image' && uiSettings.header_background_url) {
    headerContainerStyle.backgroundColor = uiSettings.primary_color;
  } else {
    headerContainerStyle.background = `linear-gradient(to right, ${uiSettings.primary_color}, ${uiSettings.secondary_color})`;
  }

  return (
    <header
      style={headerContainerStyle}
      className="sticky top-0 z-30 shadow-md border-b border-black/20 relative overflow-hidden transition-all duration-200"
    >
      {/* Background Image Layer if image type selected */}
      {uiSettings.header_bg_type === 'image' && uiSettings.header_background_url && uiSettings.show_header_background && (
        <div
          className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none transition-all duration-300"
          style={{
            backgroundImage: `url(${uiSettings.header_background_url})`,
            opacity: uiSettings.header_bg_opacity / 100,
            filter: `brightness(${uiSettings.header_bg_brightness}%) blur(${uiSettings.header_bg_blur}px)`,
          }}
        />
      )}
      {/* Subtle overlay to ensure high contrast & readability */}
      <div className="absolute inset-0 bg-black/20 z-0 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative z-10">
        <div
          style={{ minHeight: `${uiSettings.header_height}px` }}
          className="flex items-center justify-between py-2 gap-3"
        >
          {/* Left: Mobile toggle + School branding */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <button
              id="btn-sidebar-toggle"
              type="button"
              onClick={onToggleSidebar}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40 transition shrink-0 cursor-pointer"
              aria-label="Toggle Navigation"
            >
              {isSidebarOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>

            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              {uiSettings.show_logo && (
                <div
                  style={{ width: `${uiSettings.logo_size}px`, height: `${uiSettings.logo_size}px` }}
                  className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-inner border border-white/30 shrink-0 overflow-hidden"
                >
                  {uiSettings.logo_url ? (
                    <img
                      src={uiSettings.logo_url}
                      alt="Logo"
                      className="w-full h-full object-contain p-0.5"
                    />
                  ) : (
                    <GraduationCap className="w-6 h-6 text-white" />
                  )}
                </div>
              )}

              <div className="min-w-0">
                {uiSettings.show_department_name && (
                  <div className="flex items-center gap-2">
                    <span
                      style={{ fontSize: `${uiSettings.department_font_size}px` }}
                      className="font-bold tracking-wider opacity-90 uppercase truncate"
                    >
                      {uiSettings.department_name}
                    </span>
                  </div>
                )}

                {uiSettings.show_school_name && (
                  <h1
                    style={{ fontSize: `${uiSettings.school_name_font_size}px` }}
                    className="font-black tracking-tight leading-tight drop-shadow-sm truncate"
                  >
                    {uiSettings.school_name}
                  </h1>
                )}

                {uiSettings.show_system_name && (
                  <p className="text-[11px] sm:text-[12px] opacity-80 hidden sm:block font-medium truncate">
                    {uiSettings.system_name}
                  </p>
                )}

                {uiSettings.show_slogan && (
                  <p
                    style={{ fontSize: `${uiSettings.slogan_font_size}px` }}
                    className="text-amber-300 font-bold tracking-wider hidden md:block uppercase truncate"
                  >
                    {uiSettings.slogan}
                  </p>
                )}
              </div>
            </div>
          </div>


          {/* Center / Controls: Academic Year & Period */}
          <div className="hidden lg:flex items-center gap-2 bg-blue-950/40 px-3 py-1.5 rounded-lg border border-blue-700/40 backdrop-blur-sm text-xs">
            <div className="flex items-center gap-1.5 text-blue-200">
              <Calendar className="w-4 h-4 text-blue-300" />
              <span className="font-semibold text-white">Năm học:</span>
            </div>
            <select
              value={schoolYear}
              onChange={(e) => setSchoolYear(e.target.value)}
              className="bg-blue-900/90 text-white font-medium rounded px-2 py-1 border border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
            >
              <option value="2026 - 2027">2026 - 2027</option>
              <option value="2025 - 2026">2025 - 2026</option>
              <option value="2027 - 2028">2027 - 2028</option>
            </select>

            <span className="text-blue-400/60">|</span>

            <span className="font-semibold text-white">Học kỳ:</span>
            <select
              value={semester}
              onChange={(e) => setSemester(Number(e.target.value) as 1 | 2)}
              className="bg-blue-900/90 text-white font-medium rounded px-2 py-1 border border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
            >
              <option value={1}>Học kỳ I</option>
              <option value={2}>Học kỳ II</option>
            </select>

            <span className="text-blue-400/60">|</span>

            <span className="font-semibold text-white">Tháng:</span>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="bg-blue-900/90 text-white font-medium rounded px-2 py-1 border border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  Tháng {m}
                </option>
              ))}
            </select>
          </div>

          {/* Right: User Menu */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick UI Settings button for Admin / BGH */}
            {currentUser?.role === 'bgh' && (
              <button
                type="button"
                onClick={() => setActiveTab('ui-settings')}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-white/15 hover:bg-white/25 border border-white/30 text-white transition shadow-sm cursor-pointer hover:scale-102"
                title="Chỉnh sửa giao diện trang chủ, logo và tiêu đề"
              >
                <Palette className="w-3.5 h-3.5 text-amber-300" />
                <span>Cấu hình giao diện</span>
              </button>
            )}

            {/* Database indicator */}
            <div
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                isDbLoading
                  ? 'bg-amber-500/20 text-amber-200 border-amber-400/30 animate-pulse'
                  : 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
              }`}
              title={isDbLoading ? 'Đang đồng bộ cơ sở dữ liệu...' : 'Cơ sở dữ liệu Firestore đã kết nối lưu trữ vĩnh viễn'}
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isDbLoading ? 'Đang tải DB...' : 'Cloud DB'}</span>
            </div>


            {/* User Profile / Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-blue-800/60 focus:outline-none transition cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center border-2 border-white/40 shadow-sm">
                  {currentUser?.name ? currentUser.name.charAt(currentUser.name.lastIndexOf(' ') + 1) : 'U'}
                </div>
                <div className="text-left hidden xl:block">
                  <div className="text-xs font-semibold text-white leading-tight">
                    {currentUser?.name || 'Đăng nhập'}
                  </div>
                  <div className="text-[11px] text-blue-200 flex items-center gap-1">
                    <RoleIcon className="w-3 h-3" />
                    <span>{roleInfo.label}</span>
                  </div>
                </div>
                <ChevronDown className="w-4 h-4 text-blue-200" />
              </button>

              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white text-slate-800 shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-[11px] text-slate-400">Đang đăng nhập với tên:</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{currentUser?.name}</p>
                    <div
                      className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border"
                      style={{ backgroundColor: '#f0fdf4', color: '#15803d', borderColor: '#bbf7d0' }}
                    >
                      <RoleIcon className="w-3 h-3" />
                      {roleInfo.label}
                    </div>
                  </div>

                  <div className="px-4 py-2 text-xs text-slate-500 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      Chức danh: <span className="font-semibold text-slate-700">{currentUser?.position}</span>
                    </div>
                  </div>

                  {/* Quick UI Customization & BGH Name Option for Admin / Users */}
                  <div className="p-2 border-b border-slate-100 bg-blue-50/60 space-y-1.5">
                    {currentUser?.role === 'bgh' && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('ui-settings');
                          setIsUserDropdownOpen(false);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-2 shadow-2xs cursor-pointer"
                      >
                        <Palette className="w-3.5 h-3.5 text-white" />
                        <span>⚙️ Cấu hình giao diện trang chủ</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={openEditBghModal}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg bg-white hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-700 text-xs font-bold transition flex items-center gap-2 shadow-2xs cursor-pointer group"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-blue-600 group-hover:text-white" />
                      <span>Đổi tên Ban Giám hiệu</span>
                    </button>
                  </div>


                  {/* Switch user demo accounts */}
                  <div className="py-1">
                    <div className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Đổi tài khoản đăng nhập:
                    </div>
                    {users.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          switchUserById(u.id);
                          setIsUserDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-1.5 flex items-center justify-between hover:bg-slate-50 text-xs transition cursor-pointer ${
                          currentUser?.id === u.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700'
                        }`}
                      >
                        <span className="truncate">{u.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {u.role === 'bgh' ? 'BGH' : u.role === 'giaovien' ? 'GV' : 'NV'}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={() => {
                        logout();
                        setIsUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-semibold transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Đăng xuất hệ thống
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL THAY ĐỔI TÊN BAN GIÁM HIỆU */}
      {isEditBghModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden text-slate-800">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center border border-white/30">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">THAY ĐỔI TÊN BAN GIÁM HIỆU</h3>
                  <p className="text-xs text-blue-200 font-medium">Hệ thống Trường THPT Phương Xá</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditBghModalOpen(false)}
                className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveBgh} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Họ và tên Lãnh đạo / Hiệu trưởng <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newBghName}
                  onChange={(e) => setNewBghName(e.target.value)}
                  placeholder="Ví dụ: Thầy Lê Quốc Tuấn, Thầy Trần Văn Bình..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-semibold text-slate-900"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Tên này sẽ hiển thị trên thanh tiêu đề người dùng, tài khoản đăng nhập và danh bạ Ban Giám hiệu.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Chức danh quản lý
                </label>
                <input
                  type="text"
                  value={newBghPosition}
                  onChange={(e) => setNewBghPosition(e.target.value)}
                  placeholder="Ví dụ: Hiệu trưởng, Phó Hiệu trưởng..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium text-slate-900"
                />
              </div>

              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 text-xs text-blue-800 leading-relaxed">
                <span className="font-bold">Lưu trữ bền vững:</span> Tên mới sẽ được cập nhật đồng bộ vào cơ sở dữ liệu Cloud Firestore, không bị mất khi tải lại trang (F5) hay đổi tài khoản.
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditBghModalOpen(false)}
                  disabled={isSavingBgh}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSavingBgh || !newBghName.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow-md flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  {isSavingBgh ? (
                    <span>Đang lưu...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Lưu thay đổi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
