import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { useKpi } from '../context/KpiContext';
import { StaffMember, PersonType, DepartmentType } from '../types';
import { downloadStaffTemplateExcel } from '../utils/exportUtils';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  X,
  RefreshCw,
  Users,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  AlertCircle,
  FileText,
  Check,
} from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: PersonType;
}

// Helper to remove accents for ultra-robust column and value matching
function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  defaultType,
}) => {
  const { bulkAddStaff, showToast, schoolConfig, schoolYear } = useKpi();

  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Omit<StaffMember, 'id'>[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Reset state
  const handleReset = () => {
    setFile(null);
    setParsedData([]);
    setParseErrors([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Download official sample Excel template
  const handleDownloadTemplate = () => {
    downloadStaffTemplateExcel(schoolConfig.shortName);
    showToast('Đã tải xuống file Excel mẫu 6 cột chuẩn thành công!', 'success');
  };

  // Normalize column header keys for lookup
  const normalizeKey = (key: string): string => {
    return key
      .toLowerCase()
      .trim()
      .replace(/[*()#_:/\\-]/g, ' ')
      .replace(/\s+/g, ' ');
  };

  // Parse Excel file (.xlsx, .xls, .csv)
  const processFile = async (uploadedFile: File) => {
    setIsLoading(true);
    setParseErrors([]);
    try {
      const buffer = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error('File Excel không có trang dữ liệu (sheet) nào.');
      }

      const worksheet = workbook.Sheets[firstSheetName];

      // Convert sheet to 2D array of rows to reliably detect header row even if there is school title on top
      const allRows = XLSX.utils.sheet_to_json<any[]>(worksheet, {
        header: 1,
        defval: '',
        blankrows: false,
      });

      if (!allRows || allRows.length === 0) {
        throw new Error('File Excel không có dữ liệu hoặc để trống các ô.');
      }

      // Find the header row (the row containing "họ và tên" or "mã cán bộ" or "họ tên" or "stt" or "cbql")
      let headerRowIndex = -1;
      for (let r = 0; r < Math.min(allRows.length, 15); r++) {
        const rowValues = (allRows[r] || []).map((cell: any) =>
          removeVietnameseTones(String(cell || '').toLowerCase().trim())
        );
        const hasNameCol = rowValues.some((val) =>
          val.includes('ho va ten') || val.includes('ho ten') || val === 'ten' || val.includes('can bo') || val.includes('giao vien')
        );
        const hasCodeCol = rowValues.some((val) =>
          val.includes('ma') || val.includes('so the') || val.includes('code')
        );
        const hasTypeCol = rowValues.some((val) =>
          val.includes('phan loai') || val.includes('cbql') || val.includes('chuc vu') || val.includes('to')
        );

        if (hasNameCol || (hasCodeCol && hasTypeCol)) {
          headerRowIndex = r;
          break;
        }
      }

      // If no explicit header row detected, assume row 0
      if (headerRowIndex === -1) {
        headerRowIndex = 0;
      }

      const headerCells: string[] = (allRows[headerRowIndex] || []).map((c: any) => String(c || '').trim());
      const dataRows = allRows.slice(headerRowIndex + 1);

      if (dataRows.length === 0) {
        throw new Error('File Excel không có dữ liệu nhân sự bên dưới dòng tiêu đề cột.');
      }

      const errors: string[] = [];
      const parsedMembers: Omit<StaffMember, 'id'>[] = [];

      dataRows.forEach((rowArray, index) => {
        const rowNum = headerRowIndex + 2 + index;
        if (!rowArray || rowArray.length === 0) return;

        // Check if row is completely empty
        const hasAnyContent = rowArray.some((cell: any) => String(cell || '').trim() !== '');
        if (!hasAnyContent) return;

        // Build mapped row by column header
        const mappedRow: Record<string, string> = {};
        const noToneRow: Record<string, string> = {};

        headerCells.forEach((origHeader, colIdx) => {
          if (!origHeader) return;
          const val = String(rowArray[colIdx] ?? '').trim();
          const normH = normalizeKey(origHeader);
          const noToneH = removeVietnameseTones(normH);
          mappedRow[normH] = val;
          noToneRow[noToneH] = val;
        });

        // 1. Extract Name (flexible key lookup)
        let name =
          mappedRow['họ và tên'] ||
          mappedRow['họ tên'] ||
          mappedRow['tên'] ||
          mappedRow['họ và tên giáo viên'] ||
          mappedRow['họ tên giáo viên'] ||
          mappedRow['cán bộ'] ||
          mappedRow['họ tên cán bộ'] ||
          mappedRow['giáo viên'] ||
          mappedRow['nhân viên'] ||
          mappedRow['name'] ||
          mappedRow['full name'] ||
          noToneRow['ho va ten'] ||
          noToneRow['ho ten'] ||
          noToneRow['ten'] ||
          noToneRow['ho va ten giao vien'] ||
          noToneRow['can bo'] ||
          noToneRow['giao vien'] ||
          noToneRow['nhan vien'] ||
          '';

        // Fallback: If 3rd column exists and looks like a name (contains space or letters, not purely numbers)
        if (!name && rowArray[2] && isNaN(Number(rowArray[2]))) {
          name = String(rowArray[2]).trim();
        }

        // If still no name, check column 1 or 2
        if (!name && rowArray[1] && isNaN(Number(rowArray[1])) && String(rowArray[1]).length > 2) {
          name = String(rowArray[1]).trim();
        }

        if (!name || name.trim() === '' || name.toLowerCase().includes('tổng cộng') || name.toLowerCase().includes('người lập biểu')) {
          // Skip total rows or empty rows
          return;
        }

        // 2. Extract Code
        let code = String(
          mappedRow['mã cán bộ'] ||
            mappedRow['mã cb'] ||
            mappedRow['mã số'] ||
            mappedRow['mã'] ||
            mappedRow['mã gv'] ||
            mappedRow['mã nv'] ||
            mappedRow['số hiệu'] ||
            mappedRow['code'] ||
            noToneRow['ma can bo'] ||
            noToneRow['ma cb'] ||
            noToneRow['ma so'] ||
            noToneRow['ma'] ||
            noToneRow['ma gv'] ||
            noToneRow['ma nv'] ||
            ''
        ).trim();

        // 3. Extract Type
        const typeRaw = String(
          mappedRow['phân loại cbql/gv/nv'] ||
            mappedRow['phân loại cbqlgvnv'] ||
            mappedRow['phân loại'] ||
            mappedRow['cbql/gv/nv'] ||
            mappedRow['cbqlgvnv'] ||
            mappedRow['loại'] ||
            mappedRow['đối tượng'] ||
            mappedRow['chức danh'] ||
            mappedRow['nhóm'] ||
            mappedRow['type'] ||
            noToneRow['phan loai cbql/gv/nv'] ||
            noToneRow['phan loai cbqlgvnv'] ||
            noToneRow['phan loai'] ||
            noToneRow['cbql/gv/nv'] ||
            noToneRow['cbqlgvnv'] ||
            noToneRow['loai'] ||
            noToneRow['doi tuong'] ||
            ''
        )
          .toLowerCase()
          .trim();

        // 4. Extract Department
        let deptRaw = String(
          mappedRow['tổ chuyên môn / phòng ban'] ||
            mappedRow['tổ chuyên môn phòng ban'] ||
            mappedRow['tổ chuyên môn'] ||
            mappedRow['tổ'] ||
            mappedRow['phòng ban'] ||
            mappedRow['bộ phận'] ||
            mappedRow['đơn vị'] ||
            mappedRow['khoa'] ||
            mappedRow['department'] ||
            noToneRow['to chuyen mon / phong ban'] ||
            noToneRow['to chuyen mon'] ||
            noToneRow['to'] ||
            noToneRow['phong ban'] ||
            noToneRow['bo phan'] ||
            noToneRow['don vi'] ||
            ''
        ).trim();

        // 5. Extract Position
        const position = String(
          mappedRow['chức vụ'] ||
            mappedRow['vị trí'] ||
            mappedRow['nhiệm vụ'] ||
            mappedRow['chức danh nghề nghiệp'] ||
            mappedRow['position'] ||
            noToneRow['chuc vu'] ||
            noToneRow['vi tri'] ||
            noToneRow['nhiem vu'] ||
            ''
        ).trim();

        // Fallback positional indexing if standard 6-column format
        if (!code && rowArray[1] && String(rowArray[1]).length < 15) {
          code = String(rowArray[1]).trim();
        }
        if (!deptRaw && rowArray[4]) {
          deptRaw = String(rowArray[4]).trim();
        }

        // Determine memberType
        const noToneType = removeVietnameseTones(typeRaw);
        const noTonePosition = removeVietnameseTones(position.toLowerCase());
        const noToneDept = removeVietnameseTones(deptRaw.toLowerCase());

        let memberType: PersonType = defaultType || 'giaovien';
        if (
          noToneType === 'cbql' ||
          noToneType.includes('cbql') ||
          noToneType.includes('bgh') ||
          noToneType.includes('quan ly') ||
          noToneType.includes('lanh dao') ||
          noToneType.includes('hieu truong') ||
          noToneDept.includes('ban giam hieu') ||
          noTonePosition.includes('hieu truong') ||
          (code && code.toUpperCase().startsWith('BGH'))
        ) {
          memberType = 'bgh';
        } else if (
          noToneType === 'nv' ||
          noToneType.includes('nhan vien') ||
          noToneType.includes('van phong') ||
          noToneType.includes('ke toan') ||
          noToneType.includes('bao ve') ||
          noToneType.includes('y te') ||
          noToneType.includes('thu vien') ||
          noToneDept.includes('van phong') ||
          noTonePosition.includes('ke toan') ||
          noTonePosition.includes('van thu') ||
          (code && code.toUpperCase().startsWith('NV'))
        ) {
          memberType = 'nhanvien';
        } else if (
          noToneType === 'gv' ||
          noToneType.includes('giao vien') ||
          noToneType.includes('giang day') ||
          (code && code.toUpperCase().startsWith('GV'))
        ) {
          memberType = 'giaovien';
        }

        // Generate smart code if missing
        if (!code) {
          const prefix = memberType === 'bgh' ? 'BGH' : memberType === 'giaovien' ? 'GV' : 'NV';
          code = `${prefix}${String(index + 1).padStart(3, '0')}`;
        }

        // Normalize department
        const normalizeDept = (raw: string): DepartmentType => {
          const lower = removeVietnameseTones(raw.toLowerCase());
          if (lower.includes('giam hieu') || lower.includes('bgh') || lower.includes('hieu truong')) {
            return 'Ban Giám hiệu';
          }
          if (lower.includes('hoa') || lower.includes('sinh') || lower.includes('cong nghe') || lower.includes('cn')) {
            return 'Tổ Hóa - Sinh - CN';
          }
          if (lower.includes('toan') || lower.includes('li') || lower.includes('ly') || lower.includes('tin')) {
            return 'Tổ Toán - Lí - Tin';
          }
          if (lower.includes('ngoai ngu') || lower.includes('tieng anh') || lower.includes('anh') || lower.includes('ngu van') || lower.includes('van')) {
            return 'Tổ Văn - Ngoại ngữ';
          }
          if (
            lower.includes('su') ||
            lower.includes('dia') ||
            lower.includes('kt&pl') ||
            lower.includes('kinh te') ||
            lower.includes('phap luat') ||
            lower.includes('gdcd') ||
            lower.includes('the duc') ||
            lower.includes('gdtc') ||
            lower.includes('td') ||
            lower.includes('qpan') ||
            lower.includes('quoc phong')
          ) {
            return 'Tổ Sử - Địa - KT&PL - TD - QPAN';
          }
          if (
            lower.includes('van phong') ||
            lower.includes('ke toan') ||
            lower.includes('hanh chinh') ||
            lower.includes('y te') ||
            lower.includes('bao ve') ||
            lower.includes('thu vien')
          ) {
            return 'Tổ Văn phòng';
          }
          return memberType === 'bgh'
            ? 'Ban Giám hiệu'
            : memberType === 'nhanvien'
            ? 'Tổ Văn phòng'
            : 'Tổ Toán - Lí - Tin';
        };

        const finalDept = normalizeDept(deptRaw);

        const finalPosition =
          position ||
          (rowArray[5] ? String(rowArray[5]).trim() : '') ||
          (memberType === 'bgh'
            ? 'Phó Hiệu trưởng'
            : memberType === 'nhanvien'
            ? 'Nhân viên Văn phòng'
            : 'Giáo viên Giảng dạy');

        // 6. Subject & Class
        const subject = String(
          mappedRow['bộ môn giảng dạy'] ||
            mappedRow['môn giảng dạy'] ||
            mappedRow['môn'] ||
            mappedRow['chuyên môn'] ||
            mappedRow['subject'] ||
            noToneRow['bo mon giang day'] ||
            noToneRow['mon giang day'] ||
            noToneRow['mon'] ||
            noToneRow['chuyen mon'] ||
            ''
        ).trim();

        const classAssigned = String(
          mappedRow['lớp chủ nhiệm'] ||
            mappedRow['lớp phụ trách'] ||
            mappedRow['lớp'] ||
            mappedRow['class'] ||
            noToneRow['lop chu nhiem'] ||
            noToneRow['lop'] ||
            ''
        ).trim();

        // 7. Degree
        const degree = String(
          mappedRow['trình độ đào tạo'] ||
            mappedRow['trình độ'] ||
            mappedRow['bằng cấp'] ||
            mappedRow['degree'] ||
            noToneRow['trinh do dao tao'] ||
            noToneRow['trinh do'] ||
            (memberType === 'bgh' ? 'Thạc sĩ' : 'Đại học')
        ).trim();

        // 8. Contact
        const phone = String(
          mappedRow['số điện thoại'] ||
            mappedRow['điện thoại'] ||
            mappedRow['sđt'] ||
            mappedRow['phone'] ||
            mappedRow['tel'] ||
            noToneRow['so dien thoai'] ||
            noToneRow['dien thoai'] ||
            noToneRow['sdt'] ||
            ''
        ).trim();

        const email = String(
          mappedRow['email'] ||
            mappedRow['thư điện tử'] ||
            mappedRow['hòm thư'] ||
            mappedRow['mail'] ||
            ''
        ).trim();

        // 9. Status
        const statusRaw = String(
          mappedRow['trạng thái'] ||
            mappedRow['tình trạng'] ||
            mappedRow['status'] ||
            noToneRow['trang thai'] ||
            noToneRow['tinh trang'] ||
            'Đang công tác'
        ).trim();

        let status: 'Đang công tác' | 'Nghỉ chế độ' | 'Tạm hoãn' = 'Đang công tác';
        const noToneStatus = removeVietnameseTones(statusRaw.toLowerCase());
        if (noToneStatus.includes('nghi')) {
          status = 'Nghỉ chế độ';
        } else if (noToneStatus.includes('hoan')) {
          status = 'Tạm hoãn';
        }

        // 10. Base Score
        const scoreRaw = Number(
          mappedRow['điểm kpi khởi điểm'] ||
            mappedRow['điểm khởi điểm'] ||
            mappedRow['điểm chuẩn'] ||
            mappedRow['điểm'] ||
            noToneRow['diem kpi khoi diem'] ||
            noToneRow['diem khoi diem'] ||
            noToneRow['diem'] ||
            100
        );
        const baseScore = isNaN(scoreRaw) ? 100 : scoreRaw;

        const defaultSubject =
          subject ||
          (memberType === 'giaovien'
            ? finalDept === 'Tổ Toán - Lí - Tin'
              ? 'Toán học'
              : finalDept === 'Tổ Văn - Ngoại ngữ'
              ? 'Ngữ văn'
              : finalDept === 'Tổ Hóa - Sinh - CN'
              ? 'Hóa học'
              : finalDept === 'Tổ Sử - Địa - KT&PL - TD - QPAN'
              ? 'Lịch sử'
              : 'Bộ môn'
            : undefined);

        const defaultEmail =
          email ||
          `${code.toLowerCase()}@${
            schoolConfig.shortName
              ? schoolConfig.shortName.toLowerCase().replace(/[^a-z0-9]/g, '') + '.edu.vn'
              : 'thptphuongxa.edu.vn'
          }`;

        parsedMembers.push({
          code,
          name: String(name).trim(),
          type: memberType,
          department: finalDept,
          position: finalPosition,
          subject: defaultSubject,
          classAssigned: classAssigned || undefined,
          degree: degree || (memberType === 'bgh' ? 'Thạc sĩ' : 'Đại học'),
          phone: phone || '',
          email: defaultEmail,
          status,
          baseScore,
        });
      });

      if (parsedMembers.length === 0) {
        throw new Error('Không đọc được nhân sự hợp lệ nào từ file. Vui lòng kiểm tra lại cấu trúc cột hoặc tải file mẫu chuẩn.');
      }

      setFile(uploadedFile);
      setParsedData(parsedMembers);
      setParseErrors(errors);
      showToast(`Đã nhận diện thành công ${parsedMembers.length} cán bộ/giáo viên/nhân viên!`, 'info');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Lỗi đọc file Excel. Vui lòng thử lại!', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Commit import
  const handleCommitImport = async () => {
    if (parsedData.length === 0) return;
    setIsLoading(true);
    try {
      await bulkAddStaff(parsedData, importMode);
      onClose();
      handleReset();
    } catch (err: any) {
      console.error('Error in handleCommitImport:', err);
      showToast('Lỗi khi nạp dữ liệu: ' + (err.message || 'Không xác định'), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Stats of parsed data
  const bghCount = parsedData.filter((m) => m.type === 'bgh').length;
  const gvCount = parsedData.filter((m) => m.type === 'giaovien').length;
  const nvCount = parsedData.filter((m) => m.type === 'nhanvien').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-700 via-teal-700 to-blue-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <FileSpreadsheet className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">NHẬP DANH SÁCH GIÁO VIÊN & CÁN BỘ TỪ EXCEL</h3>
              <p className="text-xs text-emerald-100">
                Chỉ cần tải theo file mẫu chuẩn 6 cột đơn giản: STT, Mã cán bộ, Họ và tên, Phân loại, Tổ, Chức vụ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Top Banner Guide & Download Template */}
          <div className="space-y-3 p-4 rounded-xl bg-emerald-50/80 border border-emerald-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <FileText className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-emerald-900 text-sm">
                    Mẫu Excel 6 cột chuẩn theo quy định
                  </div>
                  <div className="text-emerald-800 text-xs mt-0.5">
                    Hệ thống chỉ cần 6 cột tối giản như hình mẫu dưới đây (các trường khác hệ thống sẽ tự động gán mặc định):
                  </div>
                </div>
              </div>

              <button
                onClick={handleDownloadTemplate}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer shrink-0"
                title="Tải file Excel mẫu đúng 6 cột chuẩn"
              >
                <Download className="w-4 h-4" />
                <span>Tải file Excel mẫu chuẩn</span>
              </button>
            </div>

            {/* Visual Sample Table */}
            <div className="bg-white rounded-lg border border-emerald-300/80 overflow-hidden shadow-2xs">
              <div className="px-3 py-1.5 bg-emerald-100/60 border-b border-emerald-200 flex items-center justify-between text-[11px] font-bold text-emerald-900">
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Mẫu trực quan 6 cột chuẩn:
                </span>
                <span className="text-emerald-700 font-normal">Hỗ trợ .xlsx, .xls, .csv</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] font-sans">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-1.5 text-center w-12 border-r border-slate-200">STT</th>
                      <th className="px-3 py-1.5 border-r border-slate-200">Mã cán bộ (*)</th>
                      <th className="px-3 py-1.5 border-r border-slate-200">Họ và tên (*)</th>
                      <th className="px-3 py-1.5 border-r border-slate-200">Phân loại (CBQL/GV/NV)</th>
                      <th className="px-3 py-1.5 border-r border-slate-200">Tổ chuyên môn / Phòng ban</th>
                      <th className="px-3 py-1.5">Chức vụ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                    <tr className="hover:bg-slate-50/80">
                      <td className="px-3 py-1 text-center font-medium text-slate-400 border-r border-slate-100">1</td>
                      <td className="px-3 py-1 font-mono font-bold text-blue-700 border-r border-slate-100">BGH001</td>
                      <td className="px-3 py-1 font-bold text-slate-900 border-r border-slate-100">Tạ Duy Kiên</td>
                      <td className="px-3 py-1 font-semibold text-amber-800 border-r border-slate-100">CBQL</td>
                      <td className="px-3 py-1 border-r border-slate-100">Ban Giám hiệu</td>
                      <td className="px-3 py-1 font-medium">Hiệu trưởng</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80">
                      <td className="px-3 py-1 text-center font-medium text-slate-400 border-r border-slate-100">2</td>
                      <td className="px-3 py-1 font-mono font-bold text-blue-700 border-r border-slate-100">GV001</td>
                      <td className="px-3 py-1 font-bold text-slate-900 border-r border-slate-100">Hoàng Thị Hương Lan</td>
                      <td className="px-3 py-1 font-semibold text-blue-800 border-r border-slate-100">GV</td>
                      <td className="px-3 py-1 border-r border-slate-100">Tổ Toán - Lí - Tin</td>
                      <td className="px-3 py-1 font-medium">Tổ trưởng chuyên môn</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80">
                      <td className="px-3 py-1 text-center font-medium text-slate-400 border-r border-slate-100">3</td>
                      <td className="px-3 py-1 font-mono font-bold text-blue-700 border-r border-slate-100">NV001</td>
                      <td className="px-3 py-1 font-bold text-slate-900 border-r border-slate-100">Đặng Mai Phương</td>
                      <td className="px-3 py-1 font-semibold text-purple-800 border-r border-slate-100">NV</td>
                      <td className="px-3 py-1 border-r border-slate-100">Tổ Văn phòng</td>
                      <td className="px-3 py-1 font-medium">Kế toán trưởng</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* File Upload Drag & Drop Area */}
          {!file && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                dragOver
                  ? 'border-emerald-500 bg-emerald-50/60 scale-[0.99]'
                  : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner">
                <Upload className="w-7 h-7" />
              </div>

              <div>
                <p className="text-sm font-bold text-slate-800">
                  Kéo thả file Excel vào đây hoặc <span className="text-emerald-600 underline">bấm để chọn file</span>
                </p>
                <p className="text-slate-400 text-xs mt-1">Hỗ trợ định dạng .xlsx, .xls, .csv (tối đa 10MB)</p>
              </div>
            </div>
          )}

          {/* Parse Result & Preview Area */}
          {file && (
            <div className="space-y-4">
              {/* File Info Bar */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 text-sm">{file.name}</div>
                    <div className="text-slate-400 text-xs">
                      {(file.size / 1024).toFixed(1)} KB • Nhận diện {parsedData.length} nhân sự
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 font-semibold text-xs flex items-center gap-1 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Chọn file khác</span>
                </button>
              </div>

              {/* Statistics Pill */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center">
                  <div className="text-[11px] font-bold text-blue-700 uppercase">Tổng nhân sự</div>
                  <div className="text-xl font-black text-blue-900 mt-0.5">{parsedData.length}</div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                  <div className="text-[11px] font-bold text-amber-700 uppercase">Cán bộ Quản lý</div>
                  <div className="text-xl font-black text-amber-900 mt-0.5">{bghCount}</div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <div className="text-[11px] font-bold text-emerald-700 uppercase">Giáo viên</div>
                  <div className="text-xl font-black text-emerald-900 mt-0.5">{gvCount}</div>
                </div>

                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-center">
                  <div className="text-[11px] font-bold text-purple-700 uppercase">Nhân viên</div>
                  <div className="text-xl font-black text-purple-900 mt-0.5">{nvCount}</div>
                </div>
              </div>

              {/* Mode Selector */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                  Chế độ nhập dữ liệu:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    onClick={() => setImportMode('append')}
                    className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                      importMode === 'append'
                        ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-bold text-slate-800 text-xs">
                        Bổ sung vào danh sách hiện tại (Khuyên dùng)
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Giữ nguyên nhân sự cũ. Nếu trùng Mã cán bộ sẽ tự động cập nhật thông tin mới nhất.
                      </div>
                    </div>
                  </label>

                  <label
                    onClick={() => setImportMode('replace')}
                    className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition ${
                      importMode === 'replace'
                        ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <div className="font-bold text-amber-900 text-xs">
                        Thay thế toàn bộ (Ghi đè hoàn toàn)
                      </div>
                      <div className="text-[11px] text-amber-700 mt-0.5">
                        Xóa danh sách nhân sự hiện tại và thay thế hoàn toàn bằng {parsedData.length} nhân sự từ file này.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Warnings / Errors */}
              {parseErrors.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-amber-800 text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Lưu ý trong quá trình đọc ({parseErrors.length})</span>
                  </div>
                  <div className="max-h-24 overflow-y-auto space-y-0.5 text-[11px] text-amber-700">
                    {parseErrors.map((err, i) => (
                      <div key={i}>• {err}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Preview Table */}
              <div>
                <div className="font-bold text-slate-700 text-xs mb-2 flex items-center justify-between">
                  <span>Xem trước danh sách đọc được (hiển thị 10 người đầu tiên):</span>
                  <span className="text-slate-400">Hiển thị {Math.min(10, parsedData.length)} / {parsedData.length} dòng</span>
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-center w-12 border-r border-slate-200">STT</th>
                        <th className="px-3 py-2 border-r border-slate-200">Mã cán bộ (*)</th>
                        <th className="px-3 py-2 border-r border-slate-200">Họ và tên (*)</th>
                        <th className="px-3 py-2 text-center border-r border-slate-200">Phân loại</th>
                        <th className="px-3 py-2 border-r border-slate-200">Tổ chuyên môn / Phòng ban</th>
                        <th className="px-3 py-2">Chức vụ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {parsedData.slice(0, 10).map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-1.5 text-center text-slate-400 font-medium border-r border-slate-100">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-1.5 font-bold font-mono text-blue-700 border-r border-slate-100">
                            {m.code}
                          </td>
                          <td className="px-3 py-1.5 font-bold text-slate-800 border-r border-slate-100">
                            {m.name}
                          </td>
                          <td className="px-3 py-1.5 text-center border-r border-slate-100">
                            {m.type === 'bgh' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                CBQL
                              </span>
                            ) : m.type === 'giaovien' ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                GV
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                NV
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-1.5 font-medium text-slate-700 border-r border-slate-100">
                            {m.department}
                          </td>
                          <td className="px-3 py-1.5 font-medium text-slate-600">
                            {m.position}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition cursor-pointer"
          >
            Đóng
          </button>

          <div className="flex items-center gap-2">
            {file && (
              <button
                onClick={handleCommitImport}
                disabled={isLoading || parsedData.length === 0}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang lưu vào Database...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {importMode === 'replace'
                        ? `Xác nhận thay thế toàn bộ (${parsedData.length} người)`
                        : `Xác nhận nạp dữ liệu (${parsedData.length} người)`}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
