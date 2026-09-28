import React, { useState, useRef, useEffect } from 'react';
import { useKpi } from '../context/KpiContext';
import { SchoolUiSettings, SchoolUiElementId } from '../types';
import { uploadSchoolUiImage } from '../services/schoolUiStorageService';
import {
  Palette,
  Sliders,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Save,
  Eye,
  GripVertical,
  MoveUp,
  MoveDown,
  Check,
  X,
  Sparkles,
  Smartphone,
  Tablet,
  Monitor,
  CheckCircle2,
  Trash2,
  ShieldAlert,
  Type,
  Lock,
  Layers,
  GraduationCap,
  Menu,
  ChevronDown,
  Calendar,
  Crop,
  Sun,
  Contrast,
  RefreshCw,
} from 'lucide-react';

interface UiSettingsViewProps {
  onBackToHome?: () => void;
}

const ELEMENT_LABELS: Record<SchoolUiElementId, { label: string; desc: string; icon: string }> = {
  logo: { label: 'Logo trường / Hệ thống', desc: 'Biểu trưng chính hiển thị trên góc trái thanh Header', icon: '🏫' },
  department_name: { label: 'Tên cơ quan quản lý', desc: 'Dòng trên cùng (VD: SỞ GD&ĐT PHÚ THỌ)', icon: '🏛️' },
  school_name: { label: 'Tên trường học', desc: 'Dòng tiêu đề chính (VD: TRƯỜNG THPT PHƯƠNG XÁ)', icon: '🎓' },
  system_name: { label: 'Tên hệ thống', desc: 'Dòng mô tả chức năng dưới tên trường', icon: '💻' },
  slogan: { label: 'Khẩu hiệu trường', desc: 'Triết lý giáo dục (VD: TRI THỨC - NHÂN CÁCH - TƯƠNG LAI)', icon: '🌟' },
  school_image: { label: 'Ảnh biểu tượng trường', desc: 'Ảnh tròn bo 50% hiển thị tại Sidebar & bảng vinh danh', icon: '👤' },
};

const COLOR_PRESETS = [
  { name: 'Xanh Lam Sư Phạm (Mặc định)', primary: '#1e3a8a', secondary: '#0284c7', bg: '#f8fafc', sidebar: '#ffffff', button: '#2563eb' },
  { name: 'Xanh Navy Trí Tuệ', primary: '#0f172a', secondary: '#3b82f6', bg: '#f1f5f9', sidebar: '#1e293b', button: '#1d4ed8' },
  { name: 'Xanh Ngọc Tri Thức', primary: '#064e3b', secondary: '#0d9488', bg: '#f0fdf4', sidebar: '#ffffff', button: '#059669' },
  { name: 'Đỏ Rượu Vang Truyền Thống', primary: '#881337', secondary: '#e11d48', bg: '#fff1f2', sidebar: '#ffffff', button: '#be123c' },
  { name: 'Tím Hoàng Gia Đổi Mới', primary: '#4c1d95', secondary: '#7c3aed', bg: '#faf5ff', sidebar: '#ffffff', button: '#6d28d9' },
];

export const UiSettingsView: React.FC<UiSettingsViewProps> = () => {
  const { uiSettings, updateUiSettings, resetUiSettings, currentUser, setActiveTab } = useKpi();

  const isBgh = currentUser?.role === 'bgh';

  // Local draft state for live preview
  const [draft, setDraft] = useState<SchoolUiSettings>(() => ({ ...uiSettings }));
  const [activeSubTab, setActiveSubTab] = useState<'branding' | 'images' | 'colors' | 'dimensions' | 'visibility' | 'ordering'>('branding');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // File input refs
  const logoInputRef = useRef<HTMLInputElement>(null);
  const emblemInputRef = useRef<HTMLInputElement>(null);
  const headerBgInputRef = useRef<HTMLInputElement>(null);

  // Sync draft whenever global uiSettings change
  useEffect(() => {
    setDraft({ ...uiSettings });
  }, [uiSettings]);

  // Handle direct text/boolean change
  const handleChange = <K extends keyof SchoolUiSettings>(key: K, value: SchoolUiSettings[K]) => {
    if (!isBgh) return;
    setDraft((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Reorder elements
  const moveElement = (index: number, direction: 'up' | 'down') => {
    if (!isBgh) return;
    const newOrder = [...draft.elements_order];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;
    setDraft((prev) => ({ ...prev, elements_order: newOrder }));
  };

  // Upload logo
  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isBgh || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploading('logo');
    try {
      const url = await uploadSchoolUiImage(file, 'logo', {
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.9,
      });
      handleChange('logo_url', url);
      handleChange('show_logo', true);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tải ảnh logo');
    } finally {
      setIsUploading(null);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  // Upload emblem
  const handleUploadEmblem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isBgh || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploading('emblem');
    try {
      const url = await uploadSchoolUiImage(file, 'emblem', {
        maxWidth: 512,
        maxHeight: 512,
        quality: 0.9,
        squareCrop: true,
      });
      handleChange('school_image_url', url);
      handleChange('show_school_image', true);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tải ảnh biểu tượng');
    } finally {
      setIsUploading(null);
      if (emblemInputRef.current) emblemInputRef.current.value = '';
    }
  };

  // Upload header background
  const handleUploadHeaderBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isBgh || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setIsUploading('header');
    try {
      const url = await uploadSchoolUiImage(file, 'header', {
        maxWidth: 1920,
        maxHeight: 800,
        quality: 0.85,
      });
      setDraft((prev) => ({
        ...prev,
        header_background_url: url,
        header_bg_type: 'image',
        show_header_background: true,
      }));
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tải ảnh nền header');
    } finally {
      setIsUploading(null);
      if (headerBgInputRef.current) headerBgInputRef.current.value = '';
    }
  };

  // Save changes to database and global context
  const handleSave = async () => {
    if (!isBgh) return;
    setIsSaving(true);
    try {
      await updateUiSettings({
        ...draft,
        updated_at: new Date().toISOString(),
        updated_by: currentUser?.name || 'Hiệu trưởng',
      });
      setSaveSuccessMsg('Đã lưu và đồng bộ toàn bộ giao diện thành công!');
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default settings
  const handleReset = async () => {
    if (!isBgh) return;
    if (window.confirm('Bạn có chắc chắn muốn khôi phục toàn bộ giao diện về cấu hình ban đầu của trường THPT Phương Xá?')) {
      setIsSaving(true);
      try {
        await resetUiSettings();
        setSaveSuccessMsg('Đã khôi phục cấu hình mặc định ban đầu');
        setTimeout(() => setSaveSuccessMsg(null), 4000);
      } finally {
        setIsSaving(false);
      }
    }
  };

  // Compute live Header style for preview
  const getHeaderStyle = (s: SchoolUiSettings) => {
    const style: React.CSSProperties = {
      minHeight: `${s.header_height}px`,
      color: s.text_color,
    };

    if (s.header_bg_type === 'gradient') {
      style.background = `linear-gradient(135deg, ${s.header_gradient_from || s.primary_color} 0%, ${s.header_gradient_to || s.secondary_color} 100%)`;
    } else if (s.header_bg_type === 'solid') {
      style.backgroundColor = s.primary_color;
    } else if (s.header_bg_type === 'image' && s.header_background_url) {
      style.backgroundColor = s.primary_color;
    } else {
      style.backgroundColor = s.primary_color;
    }

    return style;
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. TOP HEADER & BREADCRUMB */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-1">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="hover:underline cursor-pointer"
            >
              Trang chủ
            </button>
            <span>/</span>
            <span className="text-slate-500">Cấu hình hệ thống</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/80">
              <Palette className="w-6 h-6" />
            </span>
            <span>CHỈNH SỬA GIAO DIỆN TRANG CHỦ & HEADER</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tùy biến tên trường, cơ quan, khẩu hiệu, logo, ảnh biểu tượng, màu sắc và giao diện theo thời gian thực mà không cần sửa mã nguồn.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleReset}
            disabled={!isBgh || isSaving}
            className="px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer disabled:opacity-50"
            title="Khôi phục thông số mặc định ban đầu"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Khôi phục mặc định</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!isBgh || isSaving}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black flex items-center gap-2 shadow-md shadow-blue-500/20 transition cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Đang lưu...' : '💾 LƯU CẤU HÌNH'}</span>
          </button>
        </div>
      </div>

      {/* Permission alert if not BGH */}
      {!isBgh && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-center gap-3 text-amber-900 text-xs sm:text-sm font-medium">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">Chế độ xem chỉ đọc:</span> Tài khoản của bạn ({currentUser?.name} - {currentUser?.position}) không thuộc Ban Giám hiệu. Bạn có thể xem cấu hình giao diện hiện tại nhưng không thể thực hiện lưu hoặc thay đổi.
          </div>
        </div>
      )}

      {/* Success Notification */}
      {saveSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center gap-2.5 text-emerald-900 text-xs sm:text-sm font-bold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* 2. MAIN 2-COLUMN WORKSPACE: LEFT (CONFIGURATION) & RIGHT (LIVE PREVIEW) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* ========================================================
            LEFT COLUMN (7 cols): CONFIGURATION CONTROLS
        ======================================================== */}
        <div className="xl:col-span-7 space-y-4">
          {/* Subtabs navigation */}
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveSubTab('branding')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'branding'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>🏛️ Tên trường & Khẩu hiệu</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('images')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'images'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>🖼️ Logo & Biểu tượng</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('colors')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'colors'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>🎨 Màu sắc & Nền</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('dimensions')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'dimensions'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>📏 Kích thước & Font</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('visibility')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'visibility'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>👁️ Bật/Tắt thành phần</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('ordering')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeSubTab === 'ordering'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>↕️ Thứ tự sắp xếp</span>
            </button>
          </div>

          {/* TAB 1: TÊN TRƯỜNG & KHẨU HIỆU */}
          {activeSubTab === 'branding' && (
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span>🏛️ CHỈNH SỬA THÔNG TIN CƠ QUAN & TÊN TRƯỜNG</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tất cả các dòng này hiển thị ngay trên thanh Header và Sidebar, cập nhật theo thời gian thực.
                </p>
              </div>

              {/* Tên cơ quan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  1. Tên cơ quan cấp quản lý
                </label>
                <input
                  type="text"
                  disabled={!isBgh}
                  value={draft.department_name}
                  onChange={(e) => handleChange('department_name', e.target.value)}
                  placeholder="Ví dụ: SỞ GD&ĐT PHÚ THỌ"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-slate-900 disabled:bg-slate-50"
                />
                <p className="text-[11px] text-slate-400 mt-1">Dòng chữ nhỏ trên cùng bên phải logo</p>
              </div>

              {/* Tên trường */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  2. Tên đơn vị trường học
                </label>
                <input
                  type="text"
                  disabled={!isBgh}
                  value={draft.school_name}
                  onChange={(e) => handleChange('school_name', e.target.value)}
                  placeholder="Ví dụ: TRƯỜNG THPT PHƯƠNG XÁ"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base font-black text-blue-900 disabled:bg-slate-50"
                />
                <p className="text-[11px] text-slate-400 mt-1">Dòng tiêu đề chính nổi bật nhất trên toàn hệ thống</p>
              </div>

              {/* Tên hệ thống */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  3. Tên phân hệ / Phần mềm quản lý
                </label>
                <input
                  type="text"
                  disabled={!isBgh}
                  value={draft.system_name}
                  onChange={(e) => handleChange('system_name', e.target.value)}
                  placeholder="Ví dụ: HỆ THỐNG QUẢN LÝ KPI & ĐÁNH GIÁ THI ĐUA NỘI BỘ"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold text-slate-800 disabled:bg-slate-50"
                />
              </div>

              {/* Khẩu hiệu */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  4. Khẩu hiệu trường học (Slogan)
                </label>
                <input
                  type="text"
                  disabled={!isBgh}
                  value={draft.slogan}
                  onChange={(e) => handleChange('slogan', e.target.value)}
                  placeholder="Ví dụ: TRI THỨC - NHÂN CÁCH - TƯƠNG LAI"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-bold text-blue-700 tracking-wider disabled:bg-slate-50"
                />
                <p className="text-[11px] text-slate-400 mt-1">Hiển thị dưới tên trường tại thanh menu dọc và trang chủ</p>
              </div>
            </div>
          )}

          {/* TAB 2: LOGO & ẢNH BIỂU TƯỢNG & NỀN HEADER */}
          {activeSubTab === 'images' && (
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span>🖼️ QUẢN LÝ LOGO & HÌNH ẢNH BIỂU TƯỢNG</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tải lên ảnh định dạng PNG, JPG, JPEG, WEBP. Ảnh được lưu trữ bền vững vào cơ sở dữ liệu.
                </p>
              </div>

              {/* SECTION A: LOGO TRƯỜNG */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      A. Logo hệ thống / Logo trường
                    </h3>
                    <p className="text-[11px] text-slate-500">Hiển thị tại góc trái thanh Header</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                    PNG / WEBP / JPG
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Logo preview */}
                  <div
                    style={{ width: `${draft.logo_size}px`, height: `${draft.logo_size}px` }}
                    className="rounded-xl bg-blue-800 flex items-center justify-center border-2 border-blue-300/40 shadow-sm overflow-hidden shrink-0"
                  >
                    {draft.logo_url ? (
                      <img src={draft.logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
                    ) : (
                      <GraduationCap className="w-6 h-6 text-white" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleUploadLogo}
                      className="hidden"
                    />

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={!isBgh || isUploading === 'logo'}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                      >
                        {isUploading === 'logo' ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>{draft.logo_url ? 'Thay đổi Logo' : '📤 Tải Logo lên'}</span>
                      </button>

                      {draft.logo_url && isBgh && (
                        <button
                          type="button"
                          onClick={() => handleChange('logo_url', '')}
                          className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa logo</span>
                        </button>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-500">
                      {draft.logo_url ? 'Đang dùng logo tùy chỉnh' : 'Đang dùng biểu trưng tốt nghiệp mặc định'}
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION B: ẢNH BIỂU TƯỢNG TRƯỜNG (EMBLEM CIRCULAR) */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      B. Ảnh biểu tượng / Linh vật giáo dục trường
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Hiển thị tại khu vực tròn lớn (Sidebar & Trang chủ), mặc định bo tròn 50%
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                    Bo tròn 50%
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Emblem preview */}
                  <div
                    style={{ width: `${draft.school_image_size}px`, height: `${draft.school_image_size}px` }}
                    className="rounded-full bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 p-1 shadow-md shrink-0 flex items-center justify-center overflow-hidden"
                  >
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                      {draft.school_image_url ? (
                        <img
                          src={draft.school_image_url}
                          alt="Biểu tượng trường"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-700 font-black text-xs">
                          EMBLEM
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      ref={emblemInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleUploadEmblem}
                      className="hidden"
                    />

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => emblemInputRef.current?.click()}
                        disabled={!isBgh || isUploading === 'emblem'}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                      >
                        {isUploading === 'emblem' ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>{draft.school_image_url ? 'Thay đổi biểu tượng' : '📤 Tải ảnh biểu tượng'}</span>
                      </button>

                      {draft.school_image_url && isBgh && (
                        <button
                          type="button"
                          onClick={() => handleChange('school_image_url', '')}
                          className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Dùng biểu tượng SVG gốc</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Tự động cắt ảnh vuông 1:1 và bo tròn 50%, sắc nét khi phóng to hoặc thu nhỏ.
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION C: ẢNH NỀN HEADER */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      C. Ảnh nền & Hiệu ứng Header
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Cấu hình kiểu nền (Gradient, Màu đơn sắc, hoặc Ảnh chụp cổng trường / lễ hội)
                    </p>
                  </div>
                </div>

                {/* Background Type Selector */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'gradient', label: 'Gradient chuyển sắc', icon: Sparkles },
                    { id: 'solid', label: 'Màu đơn sắc', icon: Palette },
                    { id: 'image', label: 'Ảnh nền tùy biến', icon: ImageIcon },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      disabled={!isBgh}
                      onClick={() => handleChange('header_bg_type', t.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                        draft.header_bg_type === t.id
                          ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-2xs ring-1 ring-blue-500'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <t.icon className="w-4 h-4" />
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>

                {/* If Image Background is selected */}
                {draft.header_bg_type === 'image' && (
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <input
                      ref={headerBgInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleUploadHeaderBg}
                      className="hidden"
                    />

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => headerBgInputRef.current?.click()}
                        disabled={!isBgh || isUploading === 'header'}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>📤 Tải ảnh nền Header mới</span>
                      </button>

                      {draft.header_background_url && (
                        <button
                          type="button"
                          onClick={() => handleChange('header_background_url', '')}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-bold"
                        >
                          Xóa ảnh
                        </button>
                      )}
                    </div>

                    {/* Sliders for Opacity, Brightness, Blur */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div>
                        <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                          <span>Độ mờ / tối (Opacity)</span>
                          <span>{draft.header_bg_opacity}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          disabled={!isBgh}
                          value={draft.header_bg_opacity}
                          onChange={(e) => handleChange('header_bg_opacity', Number(e.target.value))}
                          className="w-full accent-blue-600"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                          <span>Độ sáng (Brightness)</span>
                          <span>{draft.header_bg_brightness}%</span>
                        </div>
                        <input
                          type="range"
                          min="50"
                          max="150"
                          disabled={!isBgh}
                          value={draft.header_bg_brightness}
                          onChange={(e) => handleChange('header_bg_brightness', Number(e.target.value))}
                          className="w-full accent-blue-600"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                          <span>Độ nhòe (Blur)</span>
                          <span>{draft.header_bg_blur}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="15"
                          disabled={!isBgh}
                          value={draft.header_bg_blur}
                          onChange={(e) => handleChange('header_bg_blur', Number(e.target.value))}
                          className="w-full accent-blue-600"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MÀU SẮC GIAO DIỆN */}
          {activeSubTab === 'colors' && (
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span>🎨 BẢNG MÀU GIAO DIỆN HỆ THỐNG</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chọn bảng màu chuẩn giáo dục có sẵn hoặc nhập mã màu HEX tùy ý.
                </p>
              </div>

              {/* Color Presets */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Gợi ý bảng màu phong cách trường học:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {COLOR_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      disabled={!isBgh}
                      onClick={() => {
                        setDraft((prev) => ({
                          ...prev,
                          primary_color: p.primary,
                          secondary_color: p.secondary,
                          background_color: p.bg,
                          sidebar_color: p.sidebar,
                          button_color: p.button,
                          header_gradient_from: p.primary,
                          header_gradient_to: p.secondary,
                        }));
                      }}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/50 flex items-center justify-between text-left transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-1 shrink-0">
                          <span className="w-5 h-5 rounded-full border border-white shadow-xs" style={{ backgroundColor: p.primary }} />
                          <span className="w-5 h-5 rounded-full border border-white shadow-xs" style={{ backgroundColor: p.secondary }} />
                        </div>
                        <span className="text-xs font-bold text-slate-800">{p.name}</span>
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 -rotate-90" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Individual Color Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Primary Color */}
                <div className="p-3 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Màu chính (Primary Color)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      disabled={!isBgh}
                      value={draft.primary_color}
                      onChange={(e) => handleChange('primary_color', e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300"
                    />
                    <input
                      type="text"
                      disabled={!isBgh}
                      value={draft.primary_color}
                      onChange={(e) => handleChange('primary_color', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs font-semibold uppercase"
                    />
                  </div>
                </div>

                {/* Secondary Color */}
                <div className="p-3 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Màu phụ (Secondary Color)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      disabled={!isBgh}
                      value={draft.secondary_color}
                      onChange={(e) => handleChange('secondary_color', e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300"
                    />
                    <input
                      type="text"
                      disabled={!isBgh}
                      value={draft.secondary_color}
                      onChange={(e) => handleChange('secondary_color', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs font-semibold uppercase"
                    />
                  </div>
                </div>

                {/* Text Color */}
                <div className="p-3 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Màu chữ Header (Text Color)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      disabled={!isBgh}
                      value={draft.text_color}
                      onChange={(e) => handleChange('text_color', e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300"
                    />
                    <input
                      type="text"
                      disabled={!isBgh}
                      value={draft.text_color}
                      onChange={(e) => handleChange('text_color', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs font-semibold uppercase"
                    />
                  </div>
                </div>

                {/* Button Color */}
                <div className="p-3 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Màu nút hành động (Button Color)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      disabled={!isBgh}
                      value={draft.button_color}
                      onChange={(e) => handleChange('button_color', e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300"
                    />
                    <input
                      type="text"
                      disabled={!isBgh}
                      value={draft.button_color}
                      onChange={(e) => handleChange('button_color', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs font-semibold uppercase"
                    />
                  </div>
                </div>

                {/* Sidebar Color */}
                <div className="p-3 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Màu nền Sidebar</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      disabled={!isBgh}
                      value={draft.sidebar_color}
                      onChange={(e) => handleChange('sidebar_color', e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300"
                    />
                    <input
                      type="text"
                      disabled={!isBgh}
                      value={draft.sidebar_color}
                      onChange={(e) => handleChange('sidebar_color', e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 font-mono text-xs font-semibold uppercase"
                    />
                  </div>
                </div>

                {/* Header Gradient From / To */}
                <div className="p-3 rounded-xl border border-slate-200 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Màu dải Gradient Header</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      disabled={!isBgh}
                      value={draft.header_gradient_from}
                      onChange={(e) => handleChange('header_gradient_from', e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300"
                      title="Màu bắt đầu"
                    />
                    <span className="text-xs text-slate-400">→</span>
                    <input
                      type="color"
                      disabled={!isBgh}
                      value={draft.header_gradient_to}
                      onChange={(e) => handleChange('header_gradient_to', e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300"
                      title="Màu kết thúc"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: KÍCH THƯỚC & TYPOGRAPHY */}
          {activeSubTab === 'dimensions' && (
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <span>📏 KÍCH THƯỚC KHUNG & CỠ CHỮ</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Điều chỉnh độ cao thanh Header, kích thước logo và các cỡ chữ.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!isBgh}
                  onClick={() => {
                    setDraft((prev) => ({
                      ...prev,
                      header_height: 76,
                      logo_size: 44,
                      school_image_size: 96,
                      school_name_font_size: 18,
                      department_font_size: 12,
                      slogan_font_size: 12,
                    }));
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
                >
                  ↩ Về mặc định
                </button>
              </div>

              <div className="space-y-4">
                {/* Header Height */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Chiều cao thanh Header</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-blue-700 font-mono">
                      {draft.header_height} px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="60"
                    max="110"
                    disabled={!isBgh}
                    value={draft.header_height}
                    onChange={(e) => handleChange('header_height', Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Nhỏ gọn (60px)</span>
                    <span>Tiêu chuẩn (76px)</span>
                    <span>Lớn (110px)</span>
                  </div>
                </div>

                {/* Logo Size */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Kích thước Logo</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-blue-700 font-mono">
                      {draft.logo_size} px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="32"
                    max="80"
                    disabled={!isBgh}
                    value={draft.logo_size}
                    onChange={(e) => handleChange('logo_size', Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                {/* School Image / Emblem Size */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Kích thước Ảnh biểu tượng tròn</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-blue-700 font-mono">
                      {draft.school_image_size} px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="64"
                    max="140"
                    disabled={!isBgh}
                    value={draft.school_image_size}
                    onChange={(e) => handleChange('school_image_size', Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                {/* School Name Font Size */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Cỡ chữ Tên trường (Tiêu đề chính)</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-blue-700 font-mono">
                      {draft.school_name_font_size} px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="14"
                    max="26"
                    disabled={!isBgh}
                    value={draft.school_name_font_size}
                    onChange={(e) => handleChange('school_name_font_size', Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                {/* Department Font Size */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Cỡ chữ Tên cơ quan</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-blue-700 font-mono">
                      {draft.department_font_size} px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="16"
                    disabled={!isBgh}
                    value={draft.department_font_size}
                    onChange={(e) => handleChange('department_font_size', Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>

                {/* Slogan Font Size */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Cỡ chữ Khẩu hiệu (Slogan)</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-blue-700 font-mono">
                      {draft.slogan_font_size} px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="18"
                    disabled={!isBgh}
                    value={draft.slogan_font_size}
                    onChange={(e) => handleChange('slogan_font_size', Number(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: BẬT / TẮT THÀNH PHẦN */}
          {activeSubTab === 'visibility' && (
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span>👁️ HIỂN THỊ / ẨN TỪNG THÀNH PHẦN</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bỏ chọn để ẩn thành phần tương ứng khỏi giao diện hệ thống.
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  { key: 'show_logo' as const, label: 'Hiển thị Logo trường / Hệ thống', desc: 'Góc trái Header' },
                  { key: 'show_department_name' as const, label: 'Hiển thị Tên cơ quan quản lý', desc: 'Dòng SỞ GD&ĐT PHÚ THỌ' },
                  { key: 'show_school_name' as const, label: 'Hiển thị Tên trường học', desc: 'Dòng TRƯỜNG THPT PHƯƠNG XÁ' },
                  { key: 'show_system_name' as const, label: 'Hiển thị Tên hệ thống phần mềm', desc: 'Dòng HỆ THỐNG QUẢN LÝ KPI...' },
                  { key: 'show_slogan' as const, label: 'Hiển thị Khẩu hiệu trường học', desc: 'Dòng TRI THỨC - NHÂN CÁCH - TƯƠNG LAI' },
                  { key: 'show_school_image' as const, label: 'Hiển thị Ảnh biểu tượng trường', desc: 'Khối tròn trên Sidebar & Trang chủ' },
                  { key: 'show_header_background' as const, label: 'Hiển thị Ảnh/Màu nền Header tùy biến', desc: 'Áp dụng hiệu ứng nền đã chọn' },
                ].map((item) => (
                  <label
                    key={item.key}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
                      draft[item.key]
                        ? 'bg-blue-50/60 border-blue-200 text-blue-900'
                        : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    <input
                      type="checkbox"
                      disabled={!isBgh}
                      checked={Boolean(draft[item.key])}
                      onChange={(e) => handleChange(item.key, e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 accent-blue-600"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-bold">{item.label}</div>
                      <div className="text-[11px] text-slate-400">{item.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: KÉO THẢ SẮP XẾP */}
          {activeSubTab === 'ordering' && (
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 animate-in fade-in duration-150">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span>↕️ KÉO THẢ / THAY ĐỔI THỨ TỰ THÀNH PHẦN</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sắp xếp lại vị trí ưu tiên xuất hiện của các thành phần giao diện.
                </p>
              </div>

              <div className="space-y-2">
                {draft.elements_order.map((elemKey, idx) => {
                  const meta = ELEMENT_LABELS[elemKey] || { label: elemKey, desc: '', icon: '📌' };
                  return (
                    <div
                      key={elemKey}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-blue-400 transition shadow-2xs group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-lg">{meta.icon}</span>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{meta.label}</div>
                          <div className="text-[11px] text-slate-400">{meta.desc}</div>
                        </div>
                      </div>

                      {/* Reorder Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={!isBgh || idx === 0}
                          onClick={() => moveElement(idx, 'up')}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30 cursor-pointer"
                          title="Di chuyển lên"
                        >
                          <MoveUp className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={!isBgh || idx === draft.elements_order.length - 1}
                          onClick={() => moveElement(idx, 'down')}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 hover:text-blue-600 disabled:opacity-30 cursor-pointer"
                          title="Di chuyển xuống"
                        >
                          <MoveDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            RIGHT COLUMN (5 cols): LIVE INTERACTIVE PREVIEW
        ======================================================== */}
        <div className="xl:col-span-5 sticky top-20 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-md">
            {/* Header of Preview Box */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span>XEM TRƯỚC GIAO DIỆN REAL-TIME</span>
                </h3>
              </div>

              {/* Device Selector */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    previewDevice === 'desktop' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Xem trước Desktop"
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('tablet')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    previewDevice === 'tablet' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Xem trước Máy tính bảng"
                >
                  <Tablet className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    previewDevice === 'mobile' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Xem trước Di động"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Simulated Frame Container */}
            <div
              className={`mx-auto transition-all duration-300 rounded-xl overflow-hidden border border-slate-300/80 shadow-inner bg-slate-100 ${
                previewDevice === 'mobile'
                  ? 'max-w-[340px]'
                  : previewDevice === 'tablet'
                  ? 'max-w-[500px]'
                  : 'w-full'
              }`}
            >
              {/* 1. SIMULATED LIVE HEADER */}
              <div
                style={getHeaderStyle(draft)}
                className="relative overflow-hidden px-3.5 py-3 transition-all duration-200 border-b border-white/20 flex flex-col justify-center"
              >
                {/* Optional background image layer */}
                {draft.header_bg_type === 'image' && draft.header_background_url && draft.show_header_background && (
                  <div
                    className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none transition-all"
                    style={{
                      backgroundImage: `url(${draft.header_background_url})`,
                      opacity: draft.header_bg_opacity / 100,
                      filter: `brightness(${draft.header_bg_brightness}%) blur(${draft.header_bg_blur}px)`,
                    }}
                  />
                )}

                {/* Dark overlay for contrast */}
                <div className="absolute inset-0 bg-black/25 z-0 pointer-events-none" />

                {/* Content */}
                <div className="relative z-10 flex items-center justify-between gap-2">
                  {/* Left: Menu toggle + Logo + Texts */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      className="p-1 rounded-lg bg-white/10 hover:bg-white/20 transition text-white shrink-0"
                    >
                      <Menu className="w-4 h-4" />
                    </button>

                    {draft.show_logo && (
                      <div
                        style={{ width: `${draft.logo_size}px`, height: `${draft.logo_size}px` }}
                        className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border border-white/30 shadow-xs shrink-0 overflow-hidden"
                      >
                        {draft.logo_url ? (
                          <img src={draft.logo_url} alt="Logo" className="w-full h-full object-contain p-0.5" />
                        ) : (
                          <GraduationCap className="w-5 h-5 text-white" />
                        )}
                      </div>
                    )}

                    <div className="min-w-0">
                      {draft.show_department_name && (
                        <div
                          style={{ fontSize: `${draft.department_font_size}px` }}
                          className="font-bold tracking-wider opacity-90 uppercase truncate"
                        >
                          {draft.department_name}
                        </div>
                      )}

                      {draft.show_school_name && (
                        <div
                          style={{ fontSize: `${draft.school_name_font_size}px` }}
                          className="font-black tracking-tight leading-tight truncate drop-shadow-xs"
                        >
                          {draft.school_name}
                        </div>
                      )}

                      {draft.show_system_name && previewDevice !== 'mobile' && (
                        <div className="text-[10px] opacity-80 font-medium truncate">
                          {draft.system_name}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Academic Year Pill & User Profile */}
                  <div className="flex items-center gap-2 shrink-0">
                    {previewDevice === 'desktop' && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/30 border border-white/20 text-[10px] text-white">
                        <Calendar className="w-3 h-3 text-blue-300" />
                        <span>2026-2027</span>
                      </div>
                    )}
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center border border-white/50 shadow-xs">
                      T
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. SIMULATED EMBLEM & HOMEPAGE BANNER SECTION */}
              <div className="p-6 bg-white text-center space-y-3">
                {/* Circular Mascot Emblem */}
                {draft.show_school_image && (
                  <div
                    style={{ width: `${draft.school_image_size}px`, height: `${draft.school_image_size}px` }}
                    className="mx-auto rounded-full p-1 bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 shadow-md flex items-center justify-center overflow-hidden transition-all duration-200"
                  >
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                      {draft.school_image_url ? (
                        <img
                          src={draft.school_image_url}
                          alt="Biểu tượng trường"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50 p-2 text-blue-800">
                          <GraduationCap className="w-8 h-8 text-blue-600" />
                          <span className="text-[9px] font-black uppercase mt-0.5">THPT PHƯƠNG XÁ</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* School Title in Emblem area */}
                {draft.show_school_name && (
                  <div
                    style={{ fontSize: `${Math.max(draft.school_name_font_size + 2, 18)}px` }}
                    className="font-black text-slate-900 tracking-tight uppercase"
                  >
                    {draft.school_name}
                  </div>
                )}

                {/* Slogan */}
                {draft.show_slogan && (
                  <div
                    style={{
                      fontSize: `${draft.slogan_font_size}px`,
                      color: draft.secondary_color || '#1d4ed8',
                    }}
                    className="font-bold tracking-widest uppercase"
                  >
                    {draft.slogan}
                  </div>
                )}

                {/* Sample Action Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    style={{ backgroundColor: draft.button_color || '#2563eb' }}
                    className="px-4 py-1.5 rounded-xl text-white text-xs font-bold shadow-sm"
                  >
                    Truy cập Trang chủ
                  </button>
                </div>
              </div>

              {/* Simulated Footer strip */}
              <div className="bg-slate-50 border-t border-slate-200 px-3 py-2 text-[10px] text-slate-400 text-center">
                Mô phỏng hiển thị trên {previewDevice === 'desktop' ? 'Máy tính' : previewDevice === 'tablet' ? 'Máy tính bảng' : 'Điện thoại'}
              </div>
            </div>

            {/* Quick Summary list of active customizations */}
            <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-1.5 text-slate-500">
              <div className="flex justify-between">
                <span>Tên trường:</span>
                <span className="font-bold text-slate-800 truncate max-w-[200px]">{draft.school_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Cơ quan:</span>
                <span className="font-bold text-slate-800 truncate max-w-[200px]">{draft.department_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Khẩu hiệu:</span>
                <span className="font-bold text-blue-700 truncate max-w-[200px]">{draft.slogan}</span>
              </div>
              <div className="flex justify-between">
                <span>Logo tùy biến:</span>
                <span className="font-bold">{draft.logo_url ? 'Có tải ảnh' : 'Mặc định'}</span>
              </div>
              <div className="flex justify-between">
                <span>Ảnh biểu tượng tròn:</span>
                <span className="font-bold">{draft.school_image_url ? 'Có tải ảnh' : 'Mặc định SVG'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
