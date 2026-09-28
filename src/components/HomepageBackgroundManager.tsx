import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { useKpi } from '../context/KpiContext';
import {
  Upload,
  Image as ImageIcon,
  Check,
  Trash2,
  Eye,
  Sliders,
  Sparkles,
  AlertTriangle,
  X,
  FileImage,
  RefreshCw,
  Info,
  Maximize2,
} from 'lucide-react';
import { HomepageBackground, BackgroundPosition } from '../types';
import { compressAndValidateImage } from '../services/backgroundService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const POSITION_OPTIONS: { label: string; value: BackgroundPosition }[] = [
  { label: 'Trung tâm', value: 'center center' },
  { label: 'Trên', value: 'center top' },
  { label: 'Dưới', value: 'center bottom' },
  { label: 'Trái', value: 'left center' },
  { label: 'Phải', value: 'right center' },
];

export const HomepageBackgroundManager: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    activeBackground,
    backgroundsList,
    saveBackground,
    activateBackground,
    updateBackgroundConfig,
    deleteBackground,
    isBackgroundLoading,
    currentUser,
    showToast,
  } = useKpi();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Upload & preview state
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingImage, setPendingImage] = useState<{
    dataUrl: string;
    fileName: string;
    originalSize: number;
    compressedSize: number;
  } | null>(null);

  // Pending settings before save
  const [selectedPosition, setSelectedPosition] = useState<BackgroundPosition>('center center');
  const [overlayOpacity, setOverlayOpacity] = useState<number>(30); // 30% default

  // Lightbox view state
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Delete confirmation modal state
  const [deletingBg, setDeletingBg] = useState<HomepageBackground | null>(null);

  // Edit active settings quick mode
  const [isEditingActiveConfig, setIsEditingActiveConfig] = useState(false);
  const [activePositionInput, setActivePositionInput] = useState<BackgroundPosition>(
    activeBackground?.position || 'center center'
  );
  const [activeOpacityInput, setActiveOpacityInput] = useState<number>(
    activeBackground?.overlay_opacity ?? 30
  );

  const isAdmin = currentUser?.role === 'bgh';

  if (!isOpen) return null;

  // Process a selected or dropped file
  const handleProcessFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const result = await compressAndValidateImage(file);
      setPendingImage(result);
      setSelectedPosition('center center');
      setOverlayOpacity(30);
      showToast('Đã tải và tối ưu ảnh xem trước! Bấm "Lưu làm ảnh nền" để áp dụng.', 'info');
    } catch (err: any) {
      console.error('File process error:', err);
      const msg = err instanceof Error ? err.message : 'Không thể tải ảnh lên. Vui lòng thử lại.';
      showToast(msg, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
    // Reset input
    e.target.value = '';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
  };

  // Confirm save
  const handleSavePendingBackground = async () => {
    if (!pendingImage) return;

    try {
      await saveBackground({
        file_name: pendingImage.fileName,
        file_path: `backgrounds/${pendingImage.fileName}`,
        image_url: pendingImage.dataUrl,
        position: selectedPosition,
        overlay_opacity: overlayOpacity,
        is_active: true,
        uploaded_by: currentUser?.name || 'Quản trị viên',
      });

      // Clear pending
      setPendingImage(null);
    } catch (err) {
      console.error('Save background error:', err);
    }
  };

  // Save quick config changes to active background
  const handleSaveActiveConfig = async () => {
    if (!activeBackground) return;
    if (activeBackground.id === 'default-system-bg') {
      showToast('Ảnh nền mặc định hệ thống. Vui lòng tải ảnh nền mới để tùy biến riêng.', 'info');
      setIsEditingActiveConfig(false);
      return;
    }

    await updateBackgroundConfig(activeBackground.id, {
      position: activePositionInput,
      overlay_opacity: activeOpacityInput,
    });
    setIsEditingActiveConfig(false);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!deletingBg) return;
    await deleteBackground(deletingBg.id);
    setDeletingBg(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-900 to-indigo-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <ImageIcon className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">ẢNH NỀN TRANG CHỦ</h2>
              <p className="text-xs text-blue-200">
                Tải lên và quản lý hình ảnh hiển thị làm nền cho trang chủ hệ thống.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {!isAdmin && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-800 text-xs">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Quyền hạn chế:</span> Bạn đang đăng nhập với vai trò Giáo viên / Nhân viên. Chỉ Quản trị viên (BGH) mới có quyền tải lên, thay đổi hoặc xóa ảnh nền trang chủ.
              </div>
            </div>
          )}

          {/* PREVIEW CONTAINER WHEN FILE IS CHOSEN (SECTION 3 & 4) */}
          {pendingImage && (
            <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-4 border-2 border-blue-500 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-bold text-amber-300">
                    Xem trước ảnh nền (Tỷ lệ Trang chủ)
                  </span>
                </div>
                <div className="text-xs text-slate-300">
                  {pendingImage.fileName} • {Math.round(pendingImage.compressedSize / 1024)} KB (WebP)
                </div>
              </div>

              {/* Responsive Mockup Preview */}
              <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex flex-col justify-between p-4 shadow-inner">
                {/* Background Image Preview with object-fit: cover */}
                <img
                  src={pendingImage.dataUrl}
                  alt="Preview"
                  className="absolute inset-0 w-full h-full object-cover z-0 transition-all duration-300"
                  style={{ objectPosition: selectedPosition }}
                />

                {/* Overlay Preview */}
                <div
                  className="absolute inset-0 bg-slate-950 z-1 pointer-events-none transition-opacity duration-200"
                  style={{ opacity: overlayOpacity / 100 }}
                />

                {/* Simulated Mockup UI Header */}
                <div className="relative z-2 flex items-center justify-between text-[11px] bg-slate-900/80 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-white/10">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>TRƯỜNG THPT PHƯƠNG XÁ • Giao diện mẫu</span>
                  </div>
                  <span className="text-slate-300">Độ tối nền: {overlayOpacity}%</span>
                </div>

                {/* Simulated Mockup UI Cards */}
                <div className="relative z-2 grid grid-cols-3 gap-2">
                  <div className="bg-white/95 backdrop-blur-sm p-2 rounded-lg text-slate-900 shadow-xs border border-white/30">
                    <div className="text-[10px] text-slate-500 font-semibold truncate">Tổng số giáo viên</div>
                    <div className="text-base font-extrabold text-blue-700">48</div>
                  </div>
                  <div className="bg-white/95 backdrop-blur-sm p-2 rounded-lg text-slate-900 shadow-xs border border-white/30">
                    <div className="text-[10px] text-slate-500 font-semibold truncate">KPI Trung bình</div>
                    <div className="text-base font-extrabold text-emerald-600">101.4 đ</div>
                  </div>
                  <div className="bg-white/95 backdrop-blur-sm p-2 rounded-lg text-slate-900 shadow-xs border border-white/30">
                    <div className="text-[10px] text-slate-500 font-semibold truncate">Thành tích tốt</div>
                    <div className="text-base font-extrabold text-amber-600">+128</div>
                  </div>
                </div>
              </div>

              {/* Adjustments in Preview (Position & Darkness) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 text-xs">
                {/* Position selection */}
                <div>
                  <label className="block font-bold text-slate-200 mb-1.5">
                    Vị trí căn chỉnh hiển thị (object-position):
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {POSITION_OPTIONS.map((pos) => (
                      <button
                        key={pos.value}
                        type="button"
                        onClick={() => setSelectedPosition(pos.value)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                          selectedPosition === pos.value
                            ? 'bg-blue-600 text-white shadow-xs ring-1 ring-blue-400'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Overlay Darkness Slider */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-200">
                      Độ tối lớp phủ (Overlay Opacity):
                    </label>
                    <span className="font-black text-amber-400">{overlayOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="80"
                    step="5"
                    value={overlayOpacity}
                    onChange={(e) => setOverlayOpacity(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>0% (Sáng rõ)</span>
                    <span>30% (Khuyên dùng)</span>
                    <span>80% (Tối hẳn)</span>
                  </div>
                </div>
              </div>

              {/* Preview Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPendingImage(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSavePendingBackground}
                  disabled={isBackgroundLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition cursor-pointer"
                >
                  {isBackgroundLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Lưu làm ảnh nền</span>
                </button>
              </div>
            </div>
          )}

          {/* UPLOAD SECTION (SECTION 2 & 15) */}
          {isAdmin && !pendingImage && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Tải ảnh nền mới lên
              </label>

              {/* Styled Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition cursor-pointer ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50/70 scale-[0.99]'
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
                    <Upload className="w-6 h-6 animate-bounce" />
                  </div>
                  <div className="font-bold text-slate-800 text-sm">
                    {isProcessing ? 'Đang xử lý và nén ảnh...' : 'Tải ảnh lên'}
                  </div>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Kéo thả ảnh vào đây hoặc bấm để chọn file từ máy tính
                  </p>
                  <div className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                    JPG • JPEG • PNG • WEBP • Tối đa 10MB
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE BACKGROUND CARD (SECTION 10) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Ảnh nền hiện tại đang sử dụng
              </label>
              {activeBackground?.id !== 'default-system-bg' && isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsEditingActiveConfig((prev) => !prev)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{isEditingActiveConfig ? 'Đóng chỉnh sửa' : 'Căn chỉnh vị trí & độ tối'}</span>
                </button>
              )}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between shadow-xs">
              <div className="flex items-center gap-4">
                {/* Thumbnail Preview */}
                <div
                  onClick={() => setLightboxUrl(activeBackground.image_url)}
                  className="relative w-24 h-16 sm:w-32 sm:h-20 rounded-xl overflow-hidden border border-slate-300 shrink-0 bg-slate-950 group cursor-pointer"
                  title="Bấm để xem ảnh phóng to"
                >
                  <img
                    src={activeBackground.image_url}
                    alt={activeBackground.file_name}
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                    style={{ objectPosition: activeBackground.position }}
                  />
                  <div
                    className="absolute inset-0 bg-slate-950 pointer-events-none"
                    style={{ opacity: (activeBackground.overlay_opacity || 30) / 100 }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <Maximize2 className="w-4 h-4 text-white" />
                  </div>
                </div>

                {/* Metadata info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[200px] sm:max-w-xs">
                      {activeBackground.file_name}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Đang sử dụng</span>
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500">
                    Người tải lên: <strong className="text-slate-700">{activeBackground.uploaded_by}</strong>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Ngày tải lên: <strong className="text-slate-700">{new Date(activeBackground.created_at).toLocaleDateString('vi-VN')}</strong>
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Vị trí: {activeBackground.position} • Độ tối: {activeBackground.overlay_opacity}%
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => setLightboxUrl(activeBackground.image_url)}
                  className="p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 hover:bg-white text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  title="Xem ảnh đầy đủ"
                >
                  <Eye className="w-4 h-4 text-slate-500" />
                  <span className="hidden sm:inline">Xem ảnh</span>
                </button>

                {isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Thay ảnh</span>
                    </button>

                    {activeBackground.id !== 'default-system-bg' && (
                      <button
                        type="button"
                        onClick={() => setDeletingBg(activeBackground)}
                        className="p-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
                        title="Xóa ảnh nền này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Quick Edit Active Position & Darkness Form */}
            {isEditingActiveConfig && activeBackground.id !== 'default-system-bg' && (
              <div className="p-4 rounded-xl bg-white border border-blue-200 shadow-sm space-y-3 animate-in fade-in duration-150">
                <div className="text-xs font-bold text-blue-900">
                  Căn chỉnh trực tiếp ảnh nền đang dùng
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">
                      Vị trí hiển thị:
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {POSITION_OPTIONS.map((pos) => (
                        <button
                          key={pos.value}
                          type="button"
                          onClick={() => setActivePositionInput(pos.value)}
                          className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                            activePositionInput === pos.value
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          {pos.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-600 font-semibold">Độ tối lớp phủ:</label>
                      <span className="font-bold text-blue-600">{activeOpacityInput}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      step="5"
                      value={activeOpacityInput}
                      onChange={(e) => setActiveOpacityInput(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingActiveConfig(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveActiveConfig}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Lưu cấu hình
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* BACKGROUND HISTORY / GALLERY LIST */}
          {backgroundsList.length > 1 && (
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Thư viện ảnh nền đã tải lên ({backgroundsList.length})
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {backgroundsList.map((bg) => (
                  <div
                    key={bg.id}
                    className={`p-3 rounded-xl border transition ${
                      bg.is_active
                        ? 'border-emerald-300 bg-emerald-50/30 ring-1 ring-emerald-300'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-950 mb-2">
                      <img
                        src={bg.image_url}
                        alt={bg.file_name}
                        className="w-full h-full object-cover"
                        style={{ objectPosition: bg.position }}
                      />
                      <div
                        className="absolute inset-0 bg-slate-950 pointer-events-none"
                        style={{ opacity: (bg.overlay_opacity || 30) / 100 }}
                      />
                      {bg.is_active && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[9px] font-black uppercase shadow-xs">
                          Đang dùng
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-bold text-slate-800 truncate mb-1">
                      {bg.file_name}
                    </div>
                    <div className="text-[10px] text-slate-400 mb-2">
                      {new Date(bg.created_at).toLocaleDateString('vi-VN')} • {bg.uploaded_by}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setLightboxUrl(bg.image_url)}
                        className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Xem</span>
                      </button>

                      {isAdmin && (
                        <div className="flex items-center gap-1.5">
                          {!bg.is_active && (
                            <button
                              type="button"
                              onClick={() => activateBackground(bg.id)}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-bold transition cursor-pointer"
                            >
                              Kích hoạt
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDeletingBg(bg)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Xóa ảnh"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Hệ thống Quản lý Đánh giá Thi đua • THPT Phương Xá</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* LIGHTBOX MODAL */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-150"
        >
          <div className="relative max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl">
            <img
              src={lightboxUrl}
              alt="Ảnh phóng to"
              className="w-full h-full object-contain max-h-[85vh] rounded-2xl"
            />
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingBg && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl p-5 max-w-sm w-full border border-slate-200 space-y-4 text-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Xác nhận xóa ảnh nền?</h3>
              <p className="text-xs text-slate-500">
                Bạn có chắc chắn muốn xóa file <strong>"{deletingBg.file_name}"</strong> khỏi hệ thống?
                {deletingBg.is_active && (
                  <span className="block mt-1 text-rose-600 font-semibold">
                    Ảnh này đang được dùng làm ảnh nền chính. Sau khi xóa, hệ thống sẽ sử dụng ảnh mặc định của nhà trường.
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingBg(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
