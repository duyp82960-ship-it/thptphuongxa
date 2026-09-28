import React, { useState, useMemo } from 'react';
import { useKpi } from '../context/KpiContext';
import { KpiCriterion, ScoreType } from '../types';
import {
  ListOrdered,
  Plus,
  Search,
  Edit2,
  Trash2,
  Power,
  Info,
  CheckCircle2,
  PlusCircle,
  MinusCircle,
  X,
  FileSpreadsheet,
  Printer,
  Sparkles,
  Shield,
  Layers,
} from 'lucide-react';
import { downloadCsv } from '../utils/exportUtils';

export const CriteriaManagementView: React.FC = () => {
  const {
    criteriaList,
    addCriterion,
    updateCriterion,
    deleteCriterion,
    toggleCriterionStatus,
    currentUser,
    openPrintModal,
    schoolConfig,
  } = useKpi();

  const isBgh = currentUser?.role === 'bgh';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCrit, setEditingCrit] = useState<KpiCriterion | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [code, setCode] = useState('');
  const [group, setGroup] = useState('Chuyên môn sư phạm');
  const [name, setName] = useState('');
  const [targetRole, setTargetRole] = useState<'all' | 'bgh' | 'giaovien' | 'nhanvien'>('all');
  const [type, setType] = useState<ScoreType>('plus');
  const [points, setPoints] = useState<number>(5);
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  const groups = useMemo(() => {
    return Array.from(new Set(criteriaList.map((c) => c.group)));
  }, [criteriaList]);

  const filteredCriteria = useMemo(() => {
    return criteriaList.filter((crit) => {
      const matchesSearch =
        crit.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        crit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        crit.group.toLowerCase().includes(searchQuery.toLowerCase()) ||
        crit.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesGroup = selectedGroup === 'all' || crit.group === selectedGroup;
      const matchesRole = selectedRole === 'all' || crit.targetRole === selectedRole || crit.targetRole === 'all';
      const matchesType = selectedType === 'all' || crit.type === selectedType;

      return matchesSearch && matchesGroup && matchesRole && matchesType;
    });
  }, [criteriaList, searchQuery, selectedGroup, selectedRole, selectedType]);

  const handleOpenAdd = () => {
    setEditingCrit(null);
    setCode(`TC${String(criteriaList.length + 1).padStart(2, '0')}`);
    setGroup('Chuyên môn sư phạm');
    setName('');
    setTargetRole('giaovien');
    setType('plus');
    setPoints(5);
    setDescription('');
    setStatus('active');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (crit: KpiCriterion) => {
    setEditingCrit(crit);
    setCode(crit.code);
    setGroup(crit.group);
    setName(crit.name);
    setTargetRole(crit.targetRole);
    setType(crit.type);
    setPoints(crit.points);
    setDescription(crit.description);
    setStatus(crit.status);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;

    if (editingCrit) {
      updateCriterion({
        ...editingCrit,
        code,
        group,
        name,
        targetRole,
        type,
        points: Math.max(1, points),
        description,
        status,
      });
    } else {
      addCriterion({
        code,
        group,
        name,
        targetRole,
        type,
        points: Math.max(1, points),
        description,
        status,
      });
    }
    setIsModalOpen(false);
  };

  const handleExportCsv = () => {
    const headers = ['STT', 'Mã KPI', 'Nhóm tiêu chí', 'Tên tiêu chí', 'Đối tượng áp dụng', 'Loại điểm', 'Mức điểm', 'Mô tả', 'Trạng thái'];
    const rows = filteredCriteria.map((c, idx) => [
      idx + 1,
      c.code,
      c.group,
      c.name,
      c.targetRole === 'all' ? 'Toàn trường' : c.targetRole === 'giaovien' ? 'Giáo viên' : c.targetRole === 'nhanvien' ? 'Nhân viên' : 'Ban Giám hiệu',
      c.type === 'plus' ? 'Điểm cộng (+)' : 'Điểm trừ (-)',
      c.points,
      c.description,
      c.status === 'active' ? 'Đang áp dụng' : 'Tạm ngưng',
    ]);
    downloadCsv('Danh_muc_tieu_chi_KPI_THPT_Phuong_Xa', headers, rows);
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shrink-0">
            <ListOrdered className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
              DANH MỤC & BẢNG ĐIỂM TIÊU CHÍ KPI
            </h2>
            <p className="text-xs text-slate-500">
              Quy định hệ thống điểm chuẩn, điểm thưởng và điểm trừ áp dụng tại {schoolConfig.normalName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={() =>
              openPrintModal(
                'DANH MỤC TIÊU CHÍ KPI NỘI BỘ',
                `Ban hành theo Quy chế Đánh giá & Xếp loại Thi đua ${schoolConfig.normalName}`
              )
            }
            className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>In danh mục</span>
          </button>

          {isBgh && (
            <button
              id="btn-add-criterion"
              onClick={handleOpenAdd}
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm tiêu chí</span>
            </button>
          )}
        </div>
      </div>

      {/* Note Notice */}
      <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold">Lưu ý cấu hình:</strong> Các tiêu chí, mức điểm và nhóm phân loại dưới đây mang tính chất minh họa và có thể được Ban Giám hiệu thay đổi, bổ sung linh hoạt để phù hợp với đặc thù quy chế thực tế của nhà trường từng năm học.
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã, tên tiêu chí, nội dung..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium">Nhóm:</span>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="py-1.5 px-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
          >
            <option value="all">Tất cả nhóm ({criteriaList.length})</option>
            {groups.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium">Đối tượng:</span>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="py-1.5 px-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
          >
            <option value="all">Tất cả đối tượng</option>
            <option value="all">Áp dụng chung</option>
            <option value="giaovien">Chỉ Giáo viên</option>
            <option value="nhanvien">Chỉ Nhân viên</option>
            <option value="bgh">Ban Giám hiệu</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium">Loại điểm:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="py-1.5 px-2 rounded-lg border border-slate-300 text-xs bg-white font-medium"
          >
            <option value="all">Tất cả (+/-)</option>
            <option value="plus">+ Điểm cộng</option>
            <option value="minus">- Điểm trừ</option>
          </select>
        </div>
      </div>

      {/* Criteria Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3 text-center w-12">STT</th>
                <th className="py-3 px-3">Mã KPI</th>
                <th className="py-3 px-3">Nhóm KPI</th>
                <th className="py-3 px-4">Tên tiêu chí</th>
                <th className="py-3 px-3">Đối tượng áp dụng</th>
                <th className="py-3 px-3 text-center">Loại điểm</th>
                <th className="py-3 px-3 text-center">Mức điểm</th>
                <th className="py-3 px-4">Mô tả chi tiết</th>
                <th className="py-3 px-3 text-center">Trạng thái</th>
                {isBgh && <th className="py-3 px-4 text-center">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredCriteria.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Không tìm thấy tiêu chí nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredCriteria.map((crit, index) => {
                  return (
                    <tr
                      key={crit.id}
                      className={`hover:bg-blue-50/30 transition-colors ${
                        crit.status === 'inactive' ? 'opacity-50 bg-slate-50/60' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center text-slate-400 font-normal">
                        {index + 1}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">
                        {crit.code}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          {crit.group}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {crit.name}
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        {crit.targetRole === 'all' ? (
                          <span className="text-slate-700 font-medium">Tất cả cán bộ GV NV</span>
                        ) : crit.targetRole === 'giaovien' ? (
                          <span className="text-blue-700 font-semibold">Giáo viên</span>
                        ) : crit.targetRole === 'nhanvien' ? (
                          <span className="text-emerald-700 font-semibold">Nhân viên</span>
                        ) : (
                          <span className="text-amber-700 font-semibold">Ban Giám hiệu</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            crit.type === 'plus'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {crit.type === 'plus' ? (
                            <>
                              <PlusCircle className="w-3 h-3" />
                              <span>Điểm cộng</span>
                            </>
                          ) : (
                            <>
                              <MinusCircle className="w-3 h-3" />
                              <span>Điểm trừ</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-extrabold text-sm">
                        <span className={crit.type === 'plus' ? 'text-emerald-600' : 'text-rose-600'}>
                          {crit.type === 'plus' ? '+' : '-'}
                          {crit.points}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-slate-500 max-w-xs truncate" title={crit.description}>
                        {crit.description || '—'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          disabled={!isBgh}
                          onClick={() => toggleCriterionStatus(crit.id)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition ${
                            crit.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          } ${isBgh ? 'cursor-pointer' : 'cursor-default'}`}
                          title={isBgh ? 'Bấm để bật / tắt tiêu chí này' : ''}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              crit.status === 'active' ? 'bg-emerald-600' : 'bg-slate-500'
                            }`}
                          />
                          <span>{crit.status === 'active' ? 'Đang áp dụng' : 'Tạm ngưng'}</span>
                        </button>
                      </td>
                      {isBgh && (
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(crit)}
                              className="p-1.5 rounded-md hover:bg-amber-100 text-amber-600 transition"
                              title="Chỉnh sửa tiêu chí"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingId(crit.id)}
                              className="p-1.5 rounded-md hover:bg-rose-100 text-rose-600 transition"
                              title="Xóa tiêu chí"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>
            Tổng cộng: <strong className="text-slate-800">{filteredCriteria.length}</strong> tiêu chí
          </span>
          <span className="text-[11px] text-slate-400">{schoolConfig.normalName}</span>
        </div>
      </div>

      {/* MODAL: ADD/EDIT CRITERION */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-800 to-indigo-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm sm:text-base">
                {editingCrit ? 'Chỉnh sửa tiêu chí KPI' : 'Thêm mới tiêu chí KPI'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-blue-200 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mã tiêu chí:</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="VP01, CM01..."
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nhóm tiêu chí:</label>
                  <input
                    type="text"
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                    placeholder="Nề nếp, Chuyên môn, Chủ nhiệm..."
                    className="w-full p-2 rounded-lg border border-slate-300"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên tiêu chí đánh giá:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mô tả ngắn gọn hành vi / thành tích..."
                  className="w-full p-2 rounded-lg border border-slate-300 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Đối tượng:</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="all">Tất cả</option>
                    <option value="giaovien">Giáo viên</option>
                    <option value="nhanvien">Nhân viên</option>
                    <option value="bgh">Ban Giám hiệu</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Loại điểm:</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ScoreType)}
                    className={`w-full p-2 rounded-lg border font-bold ${
                      type === 'plus' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    <option value="plus">+ Điểm cộng</option>
                    <option value="minus">- Điểm trừ</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mức điểm:</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    className="w-full p-2 rounded-lg border border-slate-300 font-bold text-center"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mô tả và quy định minh chứng:</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Quy định rõ điều kiện được cộng hoặc trừ, các loại minh chứng cần nộp..."
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Trạng thái áp dụng:</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full p-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="active">Đang áp dụng</option>
                  <option value="inactive">Tạm ngưng áp dụng</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
                >
                  {editingCrit ? 'Lưu thay đổi' : 'Tạo tiêu chí'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deletingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-5 text-center animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-base text-slate-800 mb-1">Xác nhận xóa tiêu chí</h3>
            <p className="text-xs text-slate-500 mb-4">
              Bạn có chắc chắn muốn xóa tiêu chí này khỏi hệ thống?
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  deleteCriterion(deletingId);
                  setDeletingId(null);
                }}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
