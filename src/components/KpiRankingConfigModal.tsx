import React, { useState } from 'react';
import {
  KpiRankingTier,
  getStoredRankingTiers,
  saveStoredRankingTiers,
  DEFAULT_KPI_RANKING_TIERS,
} from '../utils/rankingUtils';
import { Award, Save, RotateCcw, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface KpiRankingConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export const KpiRankingConfigModal: React.FC<KpiRankingConfigModalProps> = ({
  isOpen,
  onClose,
  onUpdated,
}) => {
  const [tiers, setTiers] = useState<KpiRankingTier[]>(() => getStoredRankingTiers());
  const [msg, setMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleScoreChange = (index: number, field: 'minScore' | 'maxScore', val: number) => {
    setTiers((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleSave = () => {
    saveStoredRankingTiers(tiers);
    setMsg('Đã lưu cấu hình danh mục xếp loại KPI thành công!');
    if (onUpdated) onUpdated();
    setTimeout(() => {
      setMsg(null);
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    setTiers(DEFAULT_KPI_RANKING_TIERS);
    saveStoredRankingTiers(DEFAULT_KPI_RANKING_TIERS);
    setMsg('Đã khôi phục ngưỡng điểm mặc định chuẩn THPT Phương Xá!');
    if (onUpdated) onUpdated();
    setTimeout(() => setMsg(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
                CẤU HÌNH HỆ THỐNG
              </div>
              <h3 className="font-black text-base sm:text-lg">
                DANH MỤC XẾP LOẠI KPI
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed font-medium">
            Thiết lập ngưỡng điểm chuẩn hóa cho 4 mức kết quả xếp loại KPI theo quy chế của Trường THPT Phương Xá. 
            Kết quả xếp loại được tính tự động từ <strong>Tổng điểm do BGH đánh giá / duyệt</strong>.
          </p>

          {msg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{msg}</span>
            </div>
          )}

          {/* Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 font-extrabold text-slate-800 border-b border-slate-200 text-center">
                  <th className="py-2.5 px-3 w-20 border-r border-slate-200">Mã</th>
                  <th className="py-2.5 px-3 text-left border-r border-slate-200">
                    Kết quả xếp loại
                  </th>
                  <th className="py-2.5 px-2 w-24 border-r border-slate-200">Điểm từ</th>
                  <th className="py-2.5 px-2 w-24">Điểm đến</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {tiers.map((t, idx) => {
                  return (
                    <tr key={t.code} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 text-center font-mono font-black text-blue-900 border-r border-slate-200">
                        {t.code}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 border-r border-slate-200">
                        {t.name}
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">
                          {t.description}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center border-r border-slate-200">
                        <input
                          type="number"
                          step={1}
                          min={0}
                          max={100}
                          value={t.minScore}
                          onChange={(e) =>
                            handleScoreChange(idx, 'minScore', parseFloat(e.target.value) || 0)
                          }
                          className="w-16 p-1 text-center font-bold text-slate-900 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                        />
                      </td>
                      <td className="py-2 px-2 text-center">
                        <input
                          type="number"
                          step={1}
                          min={0}
                          max={100}
                          value={t.maxScore}
                          onChange={(e) =>
                            handleScoreChange(idx, 'maxScore', parseFloat(e.target.value) || 0)
                          }
                          className="w-16 p-1 text-center font-bold text-slate-900 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 bg-white"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
            💡 <strong>Quy tắc xác định:</strong> Phiếu KPI chỉ được xếp loại khi BGH đã hoàn tất đánh giá/duyệt. Nếu BGH chưa đánh giá, cột Kết quả xếp loại sẽ luôn hiển thị là <strong>"Chưa xếp loại"</strong>.
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-between">
            <button
              onClick={handleReset}
              type="button"
              className="px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục mặc định</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                type="button"
                className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleSave}
                type="button"
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Lưu cấu hình</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
