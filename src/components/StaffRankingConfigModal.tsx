import React, { useState, useEffect } from 'react';
import {
  StaffRankingTier,
  saveStaffRankingTiers,
  DEFAULT_STAFF_RANKING_TIERS,
} from '../services/staffKpiService';
import {
  Award,
  PlusCircle,
  Trash2,
  Save,
  RotateCcw,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Palette,
  ShieldCheck,
} from 'lucide-react';

interface StaffRankingConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTiers: StaffRankingTier[];
  onTiersUpdated: (tiers: StaffRankingTier[]) => void;
}

const COLOR_OPTIONS: Array<{ key: StaffRankingTier['color']; label: string; badgeClass: string }> = [
  { key: 'emerald', label: 'Xanh lục (Xuất sắc)', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { key: 'blue', label: 'Xanh dương (Tốt)', badgeClass: 'bg-blue-100 text-blue-800 border-blue-300' },
  { key: 'amber', label: 'Vàng cam (Hoàn thành)', badgeClass: 'bg-amber-100 text-amber-800 border-amber-300' },
  { key: 'rose', label: 'Đỏ hồng (Chưa đạt)', badgeClass: 'bg-rose-100 text-rose-800 border-rose-300' },
  { key: 'purple', label: 'Tím (Đặc biệt)', badgeClass: 'bg-purple-100 text-purple-800 border-purple-300' },
];

export const StaffRankingConfigModal: React.FC<StaffRankingConfigModalProps> = ({
  isOpen,
  onClose,
  currentTiers,
  onTiersUpdated,
}) => {
  const [tiers, setTiers] = useState<StaffRankingTier[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTiers(JSON.parse(JSON.stringify(currentTiers)));
      setSuccessMsg(null);
      setErrorMsg(null);
    }
  }, [isOpen, currentTiers]);

  if (!isOpen) return null;

  // Handle tier value updates
  const handleUpdateTier = (id: string, updates: Partial<StaffRankingTier>) => {
    setTiers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  // Add new tier
  const handleAddTier = () => {
    const newId = `tier-${Date.now()}`;
    const nextOrder = tiers.length + 1;
    const newTier: StaffRankingTier = {
      id: newId,
      name: `Mức xếp loại ${nextOrder}`,
      minScore: 60,
      maxScore: 70,
      color: 'amber',
      order: nextOrder,
      isActive: true,
      description: 'Mô tả mức xếp loại mới',
    };
    setTiers([...tiers, newTier]);
  };

  // Delete tier
  const handleDeleteTier = (id: string) => {
    if (tiers.length <= 1) {
      setErrorMsg('Hệ thống phải có tối thiểu 1 mức xếp loại!');
      return;
    }
    setTiers((prev) => prev.filter((t) => t.id !== id));
  };

  // Move tier order
  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === tiers.length - 1)
    ) {
      return;
    }
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const copy = [...tiers];
    const temp = copy[index];
    copy[index] = copy[targetIdx];
    copy[targetIdx] = temp;

    // Re-index order numbers
    const reordered = copy.map((t, idx) => ({ ...t, order: idx + 1 }));
    setTiers(reordered);
  };

  // Save to database
  const handleSave = async () => {
    setErrorMsg(null);

    // Validate tiers
    for (const t of tiers) {
      if (!t.name.trim()) {
        setErrorMsg('Vui lòng nhập tên cho tất cả các mức xếp loại!');
        return;
      }
      if (t.minScore < 0 || t.maxScore > 100 || t.minScore > t.maxScore) {
        setErrorMsg(`Khoảng điểm của mức "${t.name}" không hợp lệ (Phải từ 0 đến 100 điểm, Điểm tối thiểu <= Điểm tối đa)!`);
        return;
      }
    }

    setIsSaving(true);
    try {
      await saveStaffRankingTiers(tiers);
      onTiersUpdated(tiers);
      setSuccessMsg('Đã lưu cấu hình xếp loại KPI nhân viên vào cơ sở dữ liệu thành công!');
      setTimeout(() => {
        setSuccessMsg(null);
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
      setErrorMsg('Lỗi khi lưu cấu hình vào cơ sở dữ liệu. Vui lòng thử lại!');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default tiers
  const handleResetDefault = async () => {
    if (window.confirm('Bạn có chắc chắn muốn khôi phục danh mục xếp loại về mặc định chuẩn THPT Phương Xá?')) {
      setIsSaving(true);
      try {
        await saveStaffRankingTiers(DEFAULT_STAFF_RANKING_TIERS);
        setTiers(DEFAULT_STAFF_RANKING_TIERS);
        onTiersUpdated(DEFAULT_STAFF_RANKING_TIERS);
        setSuccessMsg('Đã khôi phục mức xếp loại mặc định thành công!');
        setTimeout(() => setSuccessMsg(null), 2000);
      } catch (err) {
        console.error(err);
        setErrorMsg('Lỗi khi khôi phục dữ liệu mặc định.');
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-amber-300 font-black">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-purple-200">
                QUẢN TRỊ HỆ THỐNG • THPT PHƯƠNG XÁ
              </div>
              <h2 className="text-base sm:text-lg font-black text-white">
                CẤU HÌNH XẾP LOẠI KPI NHÂN VIÊN
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
          <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 text-purple-900 leading-relaxed font-medium">
            💡 Thiết lập động các mức kết quả xếp loại KPI nhân viên. Hệ thống tự động áp dụng khoảng điểm này khi tính toán và hiển thị xếp loại trên phiếu và danh sách, không hard-code trong code.
          </div>

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 font-bold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Tiers List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold uppercase text-slate-700 tracking-wide text-[11px]">
                Danh sách mức xếp loại ({tiers.length} mức)
              </span>
              <button
                type="button"
                onClick={handleAddTier}
                className="px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-purple-700" />
                <span>+ Thêm mức xếp loại</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {tiers.map((tier, idx) => (
                <div
                  key={tier.id}
                  className={`p-4 rounded-2xl border transition ${
                    tier.isActive
                      ? 'bg-slate-50/70 border-slate-200 shadow-2xs'
                      : 'bg-slate-100/50 border-slate-200/60 opacity-60'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Left: Order & Name */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-[200px]">
                      {/* Order buttons */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleMoveOrder(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                          title="Di chuyển lên"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveOrder(idx, 'down')}
                          disabled={idx === tiers.length - 1}
                          className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                          title="Di chuyển xuống"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 font-black flex items-center justify-center text-xs shrink-0">
                        {idx + 1}
                      </span>

                      {/* Name input */}
                      <input
                        type="text"
                        value={tier.name}
                        onChange={(e) => handleUpdateTier(tier.id, { name: e.target.value })}
                        placeholder="Tên mức xếp loại..."
                        className="flex-1 font-bold text-slate-900 px-3 py-1.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-xs"
                      />
                    </div>

                    {/* Middle: Min - Max Scores */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-slate-500 font-medium">Từ:</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={tier.minScore}
                          onChange={(e) =>
                            handleUpdateTier(tier.id, { minScore: parseFloat(e.target.value) || 0 })
                          }
                          className="w-16 px-2 py-1.5 rounded-lg border border-slate-300 font-black text-center text-slate-900 bg-white"
                        />
                      </div>
                      <span className="text-slate-400">→</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-slate-500 font-medium">Đến:</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={tier.maxScore}
                          onChange={(e) =>
                            handleUpdateTier(tier.id, { maxScore: parseFloat(e.target.value) || 0 })
                          }
                          className="w-16 px-2 py-1.5 rounded-lg border border-slate-300 font-black text-center text-slate-900 bg-white"
                        />
                      </div>
                    </div>

                    {/* Color picker dropdown */}
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={tier.color}
                        onChange={(e) =>
                          handleUpdateTier(tier.id, {
                            color: e.target.value as StaffRankingTier['color'],
                          })
                        }
                        className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-slate-800 cursor-pointer"
                      >
                        {COLOR_OPTIONS.map((c) => (
                          <option key={c.key} value={c.key}>
                            {c.label}
                          </option>
                        ))}
                      </select>

                      {/* Active toggle */}
                      <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tier.isActive}
                          onChange={(e) => handleUpdateTier(tier.id, { isActive: e.target.checked })}
                          className="rounded text-purple-600 focus:ring-purple-500"
                        />
                        <span>Kích hoạt</span>
                      </label>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteTier(tier.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        title="Xóa mức xếp loại này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetDefault}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Khôi phục mặc định</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-black text-xs shadow-md transition cursor-pointer flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>{isSaving ? 'Đang lưu...' : 'Lưu cấu hình'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
