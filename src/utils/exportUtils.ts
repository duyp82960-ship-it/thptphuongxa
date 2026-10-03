import * as XLSX from 'xlsx';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
  VerticalAlign,
} from 'docx';

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCell = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerLine = headers.map(escapeCell).join(',');
  const rowLines = rows.map((row) => row.map(escapeCell).join(','));
  const csvContent = '\uFEFF' + [headerLine, ...rowLines].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadStaffTemplateExcel(schoolShortName?: string) {
  const templateData = [
    {
      'STT': 1,
      'Mã cán bộ (*)': 'BGH001',
      'Họ và tên (*)': 'Tạ Duy Kiên',
      'Phân loại (CBQL/GV/NV)': 'CBQL',
      'Tổ chuyên môn / Phòng ban': 'Ban Giám hiệu',
      'Chức vụ': 'Hiệu trưởng',
    },
    {
      'STT': 2,
      'Mã cán bộ (*)': 'BGH002',
      'Họ và tên (*)': 'Phạm Ngọc Châm',
      'Phân loại (CBQL/GV/NV)': 'CBQL',
      'Tổ chuyên môn / Phòng ban': 'Ban Giám hiệu',
      'Chức vụ': 'Phó Hiệu trưởng',
    },
    {
      'STT': 3,
      'Mã cán bộ (*)': 'GV001',
      'Họ và tên (*)': 'Hoàng Thị Hương Lan',
      'Phân loại (CBQL/GV/NV)': 'CBQL',
      'Tổ chuyên môn / Phòng ban': 'Ban Giám hiệu',
      'Chức vụ': 'Phó Hiệu trưởng',
    },
    {
      'STT': 4,
      'Mã cán bộ (*)': 'GV002',
      'Họ và tên (*)': 'Đỗ Quốc Đông',
      'Phân loại (CBQL/GV/NV)': 'CBQL',
      'Tổ chuyên môn / Phòng ban': 'Ban Giám hiệu',
      'Chức vụ': 'Phó Hiệu trưởng',
    },
    {
      'STT': 5,
      'Mã cán bộ (*)': 'GV003',
      'Họ và tên (*)': 'Nguyễn Văn Nam',
      'Phân loại (CBQL/GV/NV)': 'GV',
      'Tổ chuyên môn / Phòng ban': 'Tổ Toán - Lí - Tin',
      'Chức vụ': 'Tổ trưởng Chuyên môn',
    },
    {
      'STT': 6,
      'Mã cán bộ (*)': 'GV004',
      'Họ và tên (*)': 'Trần Thị Mai',
      'Phân loại (CBQL/GV/NV)': 'GV',
      'Tổ chuyên môn / Phòng ban': 'Tổ Văn - Ngoại ngữ',
      'Chức vụ': 'Giáo viên Giảng dạy',
    },
    {
      'STT': 7,
      'Mã cán bộ (*)': 'GV005',
      'Họ và tên (*)': 'Hoàng Văn Hưng',
      'Phân loại (CBQL/GV/NV)': 'GV',
      'Tổ chuyên môn / Phòng ban': 'Tổ Hóa - Sinh - CN',
      'Chức vụ': 'Giáo viên Giảng dạy',
    },
    {
      'STT': 8,
      'Mã cán bộ (*)': 'GV006',
      'Họ và tên (*)': 'Bùi Ngọc Lan',
      'Phân loại (CBQL/GV/NV)': 'GV',
      'Tổ chuyên môn / Phòng ban': 'Tổ Sử - Địa - KT&PL - TD - QPAN',
      'Chức vụ': 'Giáo viên Giảng dạy',
    },
    {
      'STT': 9,
      'Mã cán bộ (*)': 'NV001',
      'Họ và tên (*)': 'Đặng Mai Phương',
      'Phân loại (CBQL/GV/NV)': 'NV',
      'Tổ chuyên môn / Phòng ban': 'Tổ Văn phòng',
      'Chức vụ': 'Kế toán trưởng',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  ws['!cols'] = [
    { wch: 8 },  // STT
    { wch: 18 }, // Mã cán bộ (*)
    { wch: 28 }, // Họ và tên (*)
    { wch: 26 }, // Phân loại (CBQL/GV/NV)
    { wch: 34 }, // Tổ chuyên môn / Phòng ban
    { wch: 24 }, // Chức vụ
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Mau_Danh_Sach_GV_CBQL_NV');
  const safeName = (schoolShortName || 'THPT').replace(/\s+/g, '_');
  XLSX.writeFile(wb, `Mau_Danh_Sach_Giao_Vien_CBQL_NV_${safeName}.xlsx`);
}

export function getRankBadgeClass(rank: string): string {
  switch (rank) {
    case 'Xuất sắc':
    case 'Hoàn thành xuất sắc':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-1 ring-emerald-500/20';
    case 'Tốt':
    case 'Hoàn thành tốt':
      return 'bg-blue-50 text-blue-700 border-blue-200 ring-1 ring-blue-500/20';
    case 'Hoàn thành':
      return 'bg-amber-50 text-amber-700 border-amber-200 ring-1 ring-amber-500/20';
    case 'Cần cố gắng':
    case 'Chưa hoàn thành':
    default:
      return 'bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-500/20';
  }
}

export function exportKpiEvaluationToExcel(params: {
  schoolName: string;
  departmentName: string;
  teacherName: string;
  position: string;
  department: string;
  subject?: string;
  schoolYear: string;
  evaluationPeriod?: string;
  periodName?: string;
  month?: number;
  year?: number;
  criteria: Array<{
    id: string;
    section: string;
    sectionTitle: string;
    order: number;
    content: string;
    maxPoints: number;
  }>;
  scores: Record<string, {
    selfScore: number;
    deptScore?: number;
    bghScore?: number;
    isNa?: boolean;
    evidence?: string;
  }>;
  selfTotal: number;
  deptTotal?: number;
  bghTotal?: number;
  selfRank: string;
  deptRank?: string;
  bghRank?: string;
  targetType?: 'bgh' | 'giaovien' | 'nhanvien';
}) {
  const rows: any[] = [];
  const isNhanVien =
    params.targetType === 'nhanvien' ||
    params.criteria.some((c) => c.section === 'A' || c.section === 'B');

  let periodText = 'KÌ I';
  if (params.evaluationPeriod === 'ki1') periodText = 'KÌ I (HỌC KÌ I)';
  else if (params.evaluationPeriod === 'ki2') periodText = 'KÌ II (HỌC KÌ II)';
  else if (params.evaluationPeriod === 'canam') periodText = 'CẢ NĂM HỌC';
  else if (params.periodName) periodText = params.periodName.toUpperCase();
  else if (params.month) periodText = `THÁNG ${String(params.month).padStart(2, '0')}/${params.year || 2026}`;

  // Title header info
  rows.push({
    'STT': '',
    'Nội dung đánh giá / nhiệm vụ chi tiết': `SỞ GD&ĐT PHÚ THỌ - ${params.schoolName.toUpperCase()}`,
    'Điểm tối đa': '',
    'Cá nhân tự chấm': '',
    'Tổ chuyên môn đánh giá': '',
    'BGH phê duyệt': '',
    'Minh chứng / ghi chú': '',
  });
  rows.push({
    'STT': '',
    'Nội dung đánh giá / nhiệm vụ chi tiết': `PHIẾU ĐÁNH GIÁ, CHẤM ĐIỂM KPI ${isNhanVien ? 'NHÂN VIÊN' : ''} - KỲ ĐÁNH GIÁ: ${periodText} – NĂM HỌC ${params.schoolYear}`,
    'Điểm tối đa': '',
    'Cá nhân tự chấm': '',
    'Tổ chuyên môn đánh giá': '',
    'BGH phê duyệt': '',
    'Minh chứng / ghi chú': '',
  });
  rows.push({
    'STT': '',
    'Nội dung đánh giá / nhiệm vụ chi tiết': `Họ và tên: ${params.teacherName} | Chức vụ/vị trí: ${params.position} ${params.subject ? `(${params.subject})` : ''} | Tổ: ${params.department}`,
    'Điểm tối đa': '',
    'Cá nhân tự chấm': '',
    'Tổ chuyên môn đánh giá': '',
    'BGH phê duyệt': '',
    'Minh chứng / ghi chú': '',
  });
  rows.push({}); // Empty separator

  // Group by sections
  const sections = isNhanVien
    ? [
        { key: 'A', title: 'A. KPI CHUNG – 30 ĐIỂM', max: 30 },
        { key: 'B', title: `B. KPI VỊ TRÍ VIỆC LÀM: ${params.position.toUpperCase()} – 70 ĐIỂM`, max: 70 },
      ]
    : [
        { key: 'I', title: 'I. CHÍNH TRỊ TƯ TƯỞNG, ĐẠO ĐỨC LỐI SỐNG', max: 15 },
        { key: 'II', title: 'II. TÁC PHONG, LỀ LỐI LÀM VIỆC, Ý THỨC TỔ CHỨC KỶ LUẬT', max: 15 },
        { key: 'III.1', title: 'III.1 NĂNG LỰC VÀ KỸ NĂNG LÀM VIỆC', max: 10 },
        { key: 'III.2', title: 'III.2 KẾT QUẢ THỰC HIỆN NHIỆM VỤ ĐƯỢC GIAO', max: 60 },
      ];

  sections.forEach((sec) => {
    const items = params.criteria.filter((c) => c.section === sec.key || (!c.section && sec.key === (isNhanVien ? 'B' : 'III.2')));
    let selfSub = 0;
    let deptSub = 0;
    let bghSub = 0;
    const secMax = items.reduce((acc, c) => acc + c.maxPoints, 0);

    items.forEach((item) => {
      const sc = params.scores[item.id];
      if (!sc?.isNa) {
        selfSub += sc?.selfScore ?? item.maxPoints;
        deptSub += sc?.deptScore ?? item.maxPoints;
        bghSub += sc?.bghScore ?? item.maxPoints;
      }
    });

    rows.push({
      'STT': sec.key,
      'Nội dung đánh giá / nhiệm vụ chi tiết': sec.title,
      'Điểm tối đa': secMax,
      'Cá nhân tự chấm': Math.round(selfSub * 100) / 100,
      'Tổ chuyên môn đánh giá': Math.round(deptSub * 100) / 100,
      'BGH phê duyệt': Math.round(bghSub * 100) / 100,
      'Minh chứng / ghi chú': `Tối đa ${secMax} điểm`,
    });

    items.forEach((item) => {
      const sc = params.scores[item.id];
      rows.push({
        'STT': item.order,
        'Nội dung đánh giá / nhiệm vụ chi tiết': (item as any).groupTitle ? `[${(item as any).groupTitle}] ${item.content}` : item.content,
        'Điểm tối đa': item.maxPoints,
        'Cá nhân tự chấm': sc?.isNa ? 'N/A' : (sc?.selfScore ?? item.maxPoints),
        'Tổ chuyên môn đánh giá': sc?.isNa ? 'N/A' : (sc?.deptScore ?? item.maxPoints),
        'BGH phê duyệt': sc?.isNa ? 'N/A' : (sc?.bghScore ?? item.maxPoints),
        'Minh chứng / ghi chú': sc?.evidence || '',
      });
    });
  });

  // Summary Row
  rows.push({});
  rows.push({
    'STT': 'TỔNG',
    'Nội dung đánh giá / nhiệm vụ chi tiết': 'TỔNG ĐIỂM KPI (THANG ĐIỂM 100)',
    'Điểm tối đa': 100,
    'Cá nhân tự chấm': params.selfTotal,
    'Tổ chuyên môn đánh giá': params.deptTotal ?? params.selfTotal,
    'BGH phê duyệt': params.bghTotal ?? params.deptTotal ?? params.selfTotal,
    'Minh chứng / ghi chú': `Xếp loại: ${params.bghRank || params.deptRank || params.selfRank}`,
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 8 },  // STT
    { wch: 65 }, // Nội dung đánh giá
    { wch: 12 }, // Điểm tối đa
    { wch: 16 }, // Cá nhân tự chấm
    { wch: 20 }, // Tổ chuyên môn
    { wch: 16 }, // BGH
    { wch: 40 }, // Minh chứng
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, isNhanVien ? 'KPI_Nhan_Vien' : 'Phieu_Danh_Gia_KPI');
  const safeName = params.teacherName.replace(/\s+/g, '_');
  XLSX.writeFile(wb, `Phieu_KPI_${isNhanVien ? 'NV_' : ''}${safeName}_${params.schoolYear.replace(/\s+/g, '')}.xlsx`);
}

/**
 * Export official KPI Evaluation Sheet to Microsoft Word document (.doc)
 */
export function exportKpiEvaluationToWord(params: {
  schoolName: string;
  teacherName: string;
  staffCode: string;
  position: string;
  department: string;
  subject?: string;
  schoolYear: string;
  evaluationPeriod?: string;
  periodName?: string;
  month?: number;
  year?: number;
  evaluatorName?: string;
  ttcmEvaluatorName?: string;
  bghEvaluatorName?: string;
  targetType?: 'bgh' | 'giaovien' | 'nhanvien';
  criteria: Array<{
    id: string;
    section?: string;
    sectionTitle?: string;
    order: number | string;
    content: string;
    maxPoints: number;
    groupTitle?: string;
  }>;
  scores: Record<string, {
    selfScore: number;
    deptScore?: number;
    bghScore?: number;
    isNa?: boolean;
    evidence?: string;
  }>;
  selfTotal: number;
  deptTotal?: number;
  bghTotal?: number;
  selfRank: string;
  deptRank?: string;
  bghRank?: string;
  selfDate?: string;
  deptDate?: string;
  bghDate?: string;
}) {
  const isNhanVien =
    params.targetType === 'nhanvien' ||
    params.criteria.some((c) => c.section === 'A' || c.section === 'B');

  const targetTitle =
    params.targetType === 'bgh'
      ? 'CÁN BỘ QUẢN LÝ'
      : isNhanVien
      ? 'NHÂN VIÊN'
      : 'GIÁO VIÊN';

  let periodText = 'KÌ I';
  if (params.evaluationPeriod === 'ki1') periodText = 'KÌ I (HỌC KÌ I)';
  else if (params.evaluationPeriod === 'ki2') periodText = 'KÌ II (HỌC KÌ II)';
  else if (params.evaluationPeriod === 'canam') periodText = 'CẢ NĂM HỌC';
  else if (params.periodName) periodText = params.periodName.toUpperCase();
  else if (params.month) periodText = `THÁNG ${String(params.month).padStart(2, '0')}/${params.year || 2026}`;

  const periodString = `KỲ ĐÁNH GIÁ: ${periodText} – NĂM HỌC ${params.schoolYear}`;

  const todayStr = new Date().toLocaleDateString('vi-VN');

  // Define official sections for THPT Phương Xá KPI sheets
  const officialSections = isNhanVien
    ? [
        { key: 'A', title: 'A. KPI CHUNG – 30 ĐIỂM', max: 30 },
        { key: 'B', title: `B. KPI VỊ TRÍ VIỆC LÀM: ${params.position.toUpperCase()} – 70 ĐIỂM`, max: 70 },
      ]
    : [
        { key: 'I', title: 'I. CHÍNH TRỊ TƯ TƯỞNG, ĐẠO ĐỨC LỐI SỐNG', max: 15 },
        { key: 'II', title: 'II. TÁC PHONG, LỀ LỐI LÀM VIỆC, Ý THỨC TỔ CHỨC KỶ LUẬT', max: 15 },
        { key: 'III.1', title: 'III.1 NĂNG LỰC VÀ KỸ NĂNG LÀM VIỆC', max: 10 },
        {
          key: 'III.2',
          title: 'III.2 KẾT QUẢ THỰC HIỆN NHIỆM VỤ ĐƯỢC GIAO',
          max: 60,
        },
      ];

  let criteriaRowsHtml = '';

  officialSections.forEach((sec) => {
    // Find all criteria belonging to this section key
    const secItems = params.criteria.filter(
      (c) => c.section === sec.key || (!c.section && sec.key === (isNhanVien ? 'B' : 'III.2'))
    );

    // Calculate section subtotals
    let selfSub = 0;
    let deptSub = 0;
    let bghSub = 0;
    const secMax = secItems.reduce((acc, c) => acc + c.maxPoints, 0);

    secItems.forEach((item) => {
      const sc = params.scores[item.id];
      if (!sc?.isNa) {
        selfSub += sc?.selfScore ?? item.maxPoints;
        deptSub += sc?.deptScore ?? item.maxPoints;
        bghSub += sc?.bghScore ?? item.maxPoints;
      }
    });

    selfSub = Math.round(selfSub * 100) / 100;
    deptSub = Math.round(deptSub * 100) / 100;
    bghSub = Math.round(bghSub * 100) / 100;

    // 1. Section Header Row
    criteriaRowsHtml += `
      <tr style="background-color: #f1f5f9; font-weight: bold; font-size: 11pt;">
        <td style="text-align: center; border: 1px solid #000; padding: 6px; font-weight: bold;">${sec.key}</td>
        <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-transform: uppercase; color: #0f172a;">
          ${sec.title}
        </td>
        <td style="text-align: center; border: 1px solid #000; padding: 6px; font-weight: bold;">${secMax}</td>
        <td style="text-align: center; border: 1px solid #000; padding: 6px; font-weight: bold; color: #1e3a8a;">${selfSub} đ</td>
        <td style="text-align: center; border: 1px solid #000; padding: 6px; font-weight: bold; color: #3730a3;">${deptSub} đ</td>
        <td style="text-align: center; border: 1px solid #000; padding: 6px; font-weight: bold; color: #065f46;">${bghSub} đ</td>
        <td style="border: 1px solid #000; padding: 6px; font-style: italic; font-size: 10pt;">Tối đa ${secMax} điểm</td>
      </tr>
    `;

    // 2. Individual Criteria Rows
    secItems.forEach((crit) => {
      const sc = params.scores[crit.id];
      const isNa = Boolean(sc?.isNa);
      const selfVal = isNa ? 'N/A' : (sc?.selfScore ?? crit.maxPoints);
      const deptVal = isNa ? 'N/A' : (sc?.deptScore ?? crit.maxPoints);
      const bghVal = isNa ? 'N/A' : (sc?.bghScore ?? crit.maxPoints);
      const evidence = sc?.evidence || '';

      criteriaRowsHtml += `
        <tr ${isNa ? 'style="background-color: #f8fafc;"' : ''}>
          <td style="text-align: center; border: 1px solid #000; padding: 5px;">${crit.order}</td>
          <td style="border: 1px solid #000; padding: 5px;">
            ${crit.groupTitle ? `<div style="font-size: 10pt; font-weight: bold; color: #1e3a8a; margin-bottom: 2px;">[${crit.groupTitle}]</div>` : ''}
            <div>${crit.content}</div>
          </td>
          <td style="text-align: center; border: 1px solid #000; padding: 5px; font-weight: bold;">${crit.maxPoints}</td>
          <td style="text-align: center; border: 1px solid #000; padding: 5px; font-weight: bold; color: #1e3a8a;">${selfVal}</td>
          <td style="text-align: center; border: 1px solid #000; padding: 5px; font-weight: bold; color: #3730a3;">${deptVal}</td>
          <td style="text-align: center; border: 1px solid #000; padding: 5px; font-weight: bold; color: #065f46;">${bghVal}</td>
          <td style="border: 1px solid #000; padding: 5px; font-size: 10pt;">${evidence}</td>
        </tr>
      `;
    });
  });

  // Check CBQL leadership vs TTCM vs Teacher
  const isBghLeaderPerson =
    params.targetType === 'bgh' &&
    (params.position.toLowerCase().includes('hiệu trưởng') ||
      params.evaluatorName?.includes('Hội đồng') ||
      params.evaluatorName?.includes('COUNCIL'));

  const isCbqlTtcmPerson =
    params.targetType === 'bgh' && !isBghLeaderPerson;

  let evaluatorDisplay = params.evaluatorName || 'Ban Giám hiệu';
  if (isBghLeaderPerson) {
    evaluatorDisplay = 'Hội đồng Thi đua – Khen thưởng';
  } else if (isCbqlTtcmPerson && params.bghEvaluatorName) {
    evaluatorDisplay = params.bghEvaluatorName;
  }

  let signaturesHtml = '';
  if (isBghLeaderPerson) {
    signaturesHtml = `
      <table class="sig-tbl">
        <tr>
          <td style="width: 50%;">
            <div style="font-weight: bold; text-transform: uppercase;">NGƯỜI TỰ ĐÁNH GIÁ</div>
            <div style="font-style: italic; font-size: 11pt;">(Ký, ghi rõ họ tên)</div>
            <div style="height: 65px;"></div>
            <div style="font-weight: bold;">${params.teacherName}</div>
          </td>
          <td style="width: 50%;">
            <div style="font-weight: bold; text-transform: uppercase;">HỘI ĐỒNG THI ĐUA – KHEN THƯỞNG</div>
            <div style="font-style: italic; font-size: 11pt;">(Chủ tịch/Phó Chủ tịch HĐ ký, đóng dấu)</div>
            <div style="height: 65px;"></div>
            <div style="font-weight: bold;">Hội đồng Thi đua – Khen thưởng</div>
          </td>
        </tr>
      </table>
    `;
  } else if (isCbqlTtcmPerson) {
    signaturesHtml = `
      <table class="sig-tbl">
        <tr>
          <td style="width: 50%;">
            <div style="font-weight: bold; text-transform: uppercase;">NGƯỜI TỰ ĐÁNH GIÁ</div>
            <div style="font-style: italic; font-size: 11pt;">(Ký, ghi rõ họ tên)</div>
            <div style="height: 65px;"></div>
            <div style="font-weight: bold;">${params.teacherName}</div>
          </td>
          <td style="width: 50%;">
            <div style="font-weight: bold; text-transform: uppercase;">BAN GIÁM HIỆU ĐÁNH GIÁ & DUYỆT</div>
            <div style="font-style: italic; font-size: 11pt;">(Hiệu trưởng / Phó Hiệu trưởng ký tên)</div>
            <div style="height: 65px;"></div>
            <div style="font-weight: bold;">${params.bghEvaluatorName || params.evaluatorName || 'Ban Giám hiệu'}</div>
          </td>
        </tr>
      </table>
    `;
  } else {
    signaturesHtml = `
      <table class="sig-tbl">
        <tr>
          <td>
            <div style="font-weight: bold; text-transform: uppercase;">NGƯỜI TỰ ĐÁNH GIÁ</div>
            <div style="font-style: italic; font-size: 11pt;">(Ký, ghi rõ họ tên)</div>
            <div style="height: 60px;"></div>
            <div style="font-weight: bold;">${params.teacherName}</div>
          </td>
          <td>
            <div style="font-weight: bold; text-transform: uppercase;">TỔ CHUYÊN MÔN / VĂN PHÒNG</div>
            <div style="font-style: italic; font-size: 11pt;">(Ký, ghi rõ họ tên)</div>
            <div style="height: 60px;"></div>
            <div style="font-weight: bold;">${params.ttcmEvaluatorName || 'Tổ trưởng'}</div>
          </td>
          <td>
            <div style="font-weight: bold; text-transform: uppercase;">HIỆU TRƯỞNG / BGH DUYỆT</div>
            <div style="font-style: italic; font-size: 11pt;">(Ký tên, đóng dấu)</div>
            <div style="height: 60px;"></div>
            <div style="font-weight: bold;">${params.bghEvaluatorName || 'Ban Giám hiệu'}</div>
          </td>
        </tr>
      </table>
    `;
  }

  const wordContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>Phiếu Đánh Giá KPI - ${params.teacherName}</title>
<!--[if gte mso 9]>
<xml>
 <w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>100</w:Zoom>
 </w:WordDocument>
</xml>
<![endif]-->
<style>
  @page Section1 {
    size: 21.0cm 29.7cm;
    margin: 2.0cm 2.0cm 2.0cm 2.5cm;
    mso-header-margin: 36.0pt;
    mso-footer-margin: 36.0pt;
    mso-paper-source: 0;
  }
  div.Section1 { page: Section1; }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 13pt;
    line-height: 1.3;
    color: #000000;
  }
  table.header-tbl {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }
  table.header-tbl td {
    vertical-align: top;
    text-align: center;
  }
  .doc-title {
    text-align: center;
    font-weight: bold;
    font-size: 16pt;
    text-transform: uppercase;
    margin-top: 10px;
    margin-bottom: 5px;
  }
  .doc-subtitle {
    text-align: center;
    font-weight: bold;
    font-size: 14pt;
    color: #0f2d59;
    margin-bottom: 15px;
  }
  table.info-tbl {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #000000;
    margin-bottom: 20px;
  }
  table.info-tbl td {
    padding: 6px 10px;
    border: 1px solid #000000;
    font-size: 12pt;
  }
  table.kpi-tbl {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }
  table.kpi-tbl th {
    border: 1px solid #000000;
    padding: 8px 5px;
    background-color: #f1f5f9;
    font-weight: bold;
    text-align: center;
    font-size: 11pt;
  }
  table.kpi-tbl td {
    border: 1px solid #000000;
    padding: 6px 6px;
    font-size: 11pt;
  }
  table.sig-tbl {
    width: 100%;
    border-collapse: collapse;
    margin-top: 30px;
  }
  table.sig-tbl td {
    text-align: center;
    vertical-align: top;
    width: 33.33%;
  }
</style>
</head>
<body>
<div class="Section1">
  <!-- National Header -->
  <table class="header-tbl">
    <tr>
      <td style="width: 45%;">
        <div style="font-weight: bold; text-transform: uppercase; font-size: 11pt;">SỞ GD&ĐT PHÚ THỌ</div>
        <div style="font-weight: bold; text-transform: uppercase; font-size: 12pt;">TRƯỜNG THPT PHƯƠNG XÁ</div>
        <div style="width: 100px; height: 1px; background: #000; margin: 3px auto;"></div>
      </td>
      <td style="width: 55%;">
        <div style="font-weight: bold; text-transform: uppercase; font-size: 11pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
        <div style="font-weight: bold; font-style: italic; font-size: 12pt;">Độc lập – Tự do – Hạnh phúc</div>
        <div style="width: 130px; height: 1px; background: #000; margin: 3px auto;"></div>
      </td>
    </tr>
  </table>

  <!-- Title -->
  <div class="doc-title">PHIẾU ĐÁNH GIÁ, CHẤM ĐIỂM KPI ${targetTitle}</div>
  <div class="doc-subtitle">${periodString}</div>

  <!-- Info Box -->
  <table class="info-tbl">
    <tr>
      <td style="width: 25%; font-weight: bold;">Họ và tên:</td>
      <td style="width: 40%; font-weight: bold; font-size: 13pt;">${params.teacherName}</td>
      <td style="width: 15%; font-weight: bold;">Mã số:</td>
      <td style="width: 20%; font-weight: bold;">${params.staffCode}</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">Chức vụ / Môn:</td>
      <td>${params.position} ${params.subject ? `(Môn ${params.subject})` : ''}</td>
      <td style="font-weight: bold;">Tổ công tác:</td>
      <td>${params.department}</td>
    </tr>
    <tr>
      <td style="font-weight: bold;">Người/Hội đồng đánh giá:</td>
      <td colspan="3">${evaluatorDisplay}</td>
    </tr>
  </table>

  <!-- Criteria & Scores Table -->
  <table class="kpi-tbl">
    <thead>
      <tr>
        <th style="width: 6%;">STT</th>
        <th style="width: 42%;">Nội dung tiêu chí đánh giá KPI</th>
        <th style="width: 10%;">Điểm tối đa</th>
        <th style="width: 10%;">Cá nhân tự chấm</th>
        <th style="width: 10%;">${isBghLeaderPerson ? 'Hội đồng đánh giá' : isCbqlTtcmPerson ? 'BGH đánh giá' : 'Tổ đánh giá'}</th>
        <th style="width: 10%;">${isBghLeaderPerson ? 'Hội đồng duyệt' : 'BGH duyệt'}</th>
        <th style="width: 12%;">Minh chứng / Ghi chú</th>
      </tr>
    </thead>
    <tbody>
      ${criteriaRowsHtml}
      <!-- Total Summary Row -->
      <tr style="background-color: #e2e8f0; font-weight: bold;">
        <td style="text-align: center; border: 1px solid #000; padding: 8px;" colSpan="2">
          TỔNG ĐIỂM KPI (THANG ĐIỂM 100 CHUẨN)
        </td>
        <td style="text-align: center; border: 1px solid #000; padding: 8px;">100</td>
        <td style="text-align: center; border: 1px solid #000; padding: 8px; color: #1e3a8a;">${params.selfTotal} đ</td>
        <td style="text-align: center; border: 1px solid #000; padding: 8px; color: #3730a3;">${params.deptTotal ?? params.selfTotal} đ</td>
        <td style="text-align: center; border: 1px solid #000; padding: 8px; color: #065f46;">${params.bghTotal ?? params.deptTotal ?? params.selfTotal} đ</td>
        <td style="border: 1px solid #000; padding: 8px;">
          Xếp loại: <b>${params.bghRank || params.deptRank || params.selfRank}</b>
        </td>
      </tr>
    </tbody>
  </table>

  <!-- Date line -->
  <div style="text-align: right; font-style: italic; margin-top: 15px; margin-bottom: 10px;">
    Phương Xá, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}
  </div>

  <!-- Signatures -->
  ${signaturesHtml}
</div>
</body>
</html>
  `;

  // Create blob and download as .doc file
  const blob = new Blob(['\uFEFF' + wordContent], {
    type: 'application/msword;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const cleanStaffName = params.teacherName.replace(/\s+/g, '_');
  const cleanYear = params.schoolYear.replace(/\s+/g, '');
  const fileName = `Phieu_KPI_${cleanStaffName}_T${params.month || 9}_${cleanYear}.doc`;

  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Xuất sổ bộ tập hợp phiếu KPI của nhiều nhân viên (hoặc toàn bộ nhân viên) vào 1 file Word (.doc) duy nhất.
 * Mỗi nhân viên là 1 trang/phiếu riêng biệt với đầy đủ Quốc hiệu, thông tin, bảng 30đ chung + 70đ vị trí, điểm số và chữ ký.
 */
export function exportMultipleStaffKpiToSingleWord(
  staffListParams: Array<{
    schoolName: string;
    teacherName: string;
    staffCode: string;
    position: string;
    department: string;
    schoolYear: string;
    evaluationPeriod?: string;
    periodName?: string;
    month?: number;
    year?: number;
    evaluatorName?: string;
    targetType?: string;
    criteria: Array<{
      id: string;
      section?: string;
      order: number;
      content: string;
      maxPoints: number;
      groupTitle?: string;
    }>;
    scores: Record<
      string,
      {
        selfScore: number;
        deptScore?: number;
        bghScore?: number;
        isNa?: boolean;
        evidence?: string;
      }
    >;
    selfTotal: number;
    deptTotal?: number;
    bghTotal?: number;
    selfRank?: string;
    deptRank?: string;
    bghRank?: string;
  }>,
  customFileName?: string
) {
  if (!staffListParams || staffListParams.length === 0) return;

  const schoolName = staffListParams[0].schoolName || 'TRƯỜNG THPT PHƯƠNG XÁ';
  const schoolYear = staffListParams[0].schoolYear || '2026 - 2027';

  let sectionsHtml = '';

  staffListParams.forEach((params, idx) => {
    const isNhanVien = true;
    let periodText = 'KÌ I';
    if (params.evaluationPeriod === 'ki1') periodText = 'KÌ I (HỌC KÌ I)';
    else if (params.evaluationPeriod === 'ki2') periodText = 'KÌ II (HỌC KÌ II)';
    else if (params.evaluationPeriod === 'canam') periodText = 'CẢ NĂM HỌC';
    else if (params.periodName) periodText = params.periodName.toUpperCase();
    else if (params.month) periodText = `THÁNG ${String(params.month).padStart(2, '0')}/${params.year || 2026}`;

    const periodString = `KỲ ĐÁNH GIÁ: ${periodText} – NĂM HỌC ${params.schoolYear}`;

    const officialSections = [
      { key: 'A', title: 'A. KPI CHUNG – 30 ĐIỂM (Áp dụng toàn thể nhân viên Tổ Văn phòng)', max: 30 },
      { key: 'B', title: `B. KPI VỊ TRÍ VIỆC LÀM: ${params.position.toUpperCase()} – 70 ĐIỂM`, max: 70 },
    ];

    let criteriaRowsHtml = '';

    officialSections.forEach((sec) => {
      const secItems = params.criteria.filter(
        (c) => c.section === sec.key || (!c.section && sec.key === 'B')
      );

      let selfSub = 0;
      let bghSub = 0;
      const secMax = secItems.reduce((acc, c) => acc + c.maxPoints, 0) || sec.max;

      secItems.forEach((item) => {
        const sc = params.scores[item.id];
        if (!sc?.isNa) {
          selfSub += sc?.selfScore ?? item.maxPoints;
          bghSub += sc?.bghScore ?? sc?.deptScore ?? item.maxPoints;
        }
      });

      selfSub = Math.round(selfSub * 10) / 10;
      bghSub = Math.round(bghSub * 10) / 10;

      criteriaRowsHtml += `
        <tr style="background-color: #f1f5f9; font-weight: bold; font-size: 11pt;">
          <td style="text-align: center; border: 1px solid #000; padding: 6px; font-weight: bold;">${sec.key}</td>
          <td style="border: 1px solid #000; padding: 6px; font-weight: bold; text-transform: uppercase; color: #0f172a;">
            ${sec.title}
          </td>
          <td style="text-align: center; border: 1px solid #000; padding: 6px; font-weight: bold;">${secMax}</td>
          <td style="text-align: center; border: 1px solid #000; padding: 6px; font-weight: bold; color: #1e3a8a;">${selfSub} đ</td>
          <td style="text-align: center; border: 1px solid #000; padding: 6px; font-weight: bold; color: #065f46;">${bghSub} đ</td>
          <td style="border: 1px solid #000; padding: 6px; font-style: italic; font-size: 10pt;">Tối đa ${secMax} điểm</td>
        </tr>
      `;

      secItems.forEach((crit) => {
        const sc = params.scores[crit.id];
        const isNa = Boolean(sc?.isNa);
        const selfVal = isNa ? 'N/A' : (sc?.selfScore ?? crit.maxPoints);
        const bghVal = isNa ? 'N/A' : (sc?.bghScore ?? sc?.deptScore ?? crit.maxPoints);
        const evidence = sc?.evidence || '';

        criteriaRowsHtml += `
          <tr ${isNa ? 'style="background-color: #f8fafc;"' : ''}>
            <td style="text-align: center; border: 1px solid #000; padding: 5px;">${crit.order}</td>
            <td style="border: 1px solid #000; padding: 5px;">
              ${crit.groupTitle ? `<div style="font-size: 10pt; font-weight: bold; color: #1e3a8a; margin-bottom: 2px;">[${crit.groupTitle}]</div>` : ''}
              <div>${crit.content}</div>
            </td>
            <td style="text-align: center; border: 1px solid #000; padding: 5px; font-weight: bold;">${crit.maxPoints}</td>
            <td style="text-align: center; border: 1px solid #000; padding: 5px; font-weight: bold; color: #1e3a8a;">${selfVal}</td>
            <td style="text-align: center; border: 1px solid #000; padding: 5px; font-weight: bold; color: #065f46;">${bghVal}</td>
            <td style="border: 1px solid #000; padding: 5px; font-size: 10pt;">${evidence}</td>
          </tr>
        `;
      });
    });

    const isLast = idx === staffListParams.length - 1;

    sectionsHtml += `
      <div class="staff-kpi-page" style="${!isLast ? 'page-break-after: always; mso-break-type: section-break; margin-bottom: 40px;' : ''}">
        <!-- National Header -->
        <table class="header-tbl">
          <tr>
            <td style="width: 45%;">
              <div style="font-weight: bold; text-transform: uppercase; font-size: 11pt;">SỞ GD&ĐT PHÚ THỌ</div>
              <div style="font-weight: bold; text-transform: uppercase; font-size: 12pt;">${schoolName.toUpperCase()}</div>
              <div style="width: 100px; height: 1px; background: #000; margin: 3px auto;"></div>
            </td>
            <td style="width: 55%;">
              <div style="font-weight: bold; text-transform: uppercase; font-size: 11pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div style="font-weight: bold; font-style: italic; font-size: 12pt;">Độc lập – Tự do – Hạnh phúc</div>
              <div style="width: 130px; height: 1px; background: #000; margin: 3px auto;"></div>
            </td>
          </tr>
        </table>

        <!-- Document Title -->
        <div class="doc-title">PHIẾU ĐÁNH GIÁ, CHẤM ĐIỂM KPI NHÂN VIÊN</div>
        <div class="doc-subtitle">VỊ TRÍ VIỆC LÀM: ${params.position.toUpperCase()}</div>
        <div style="text-align: center; font-weight: bold; font-size: 11pt; margin-bottom: 15px; color: #334155;">
          ${periodString}
        </div>

        <!-- Staff Profile Info Table -->
        <table class="info-tbl">
          <tr>
            <td style="width: 20%; font-weight: bold; background-color: #f8fafc;">Họ và tên:</td>
            <td style="width: 35%; font-weight: bold; font-size: 13pt; color: #0f172a;">${params.teacherName.toUpperCase()}</td>
            <td style="width: 20%; font-weight: bold; background-color: #f8fafc;">Mã nhân viên:</td>
            <td style="width: 25%; font-weight: bold;">${params.staffCode}</td>
          </tr>
          <tr>
            <td style="font-weight: bold; background-color: #f8fafc;">Chức danh / Vị trí:</td>
            <td style="font-weight: bold; color: #1e3a8a;">${params.position}</td>
            <td style="font-weight: bold; background-color: #f8fafc;">Tổ / Bộ phận:</td>
            <td>Tổ Văn phòng</td>
          </tr>
          <tr>
            <td style="font-weight: bold; background-color: #f8fafc;">Người đánh giá:</td>
            <td>${params.evaluatorName || 'Ban Giám hiệu & Tổ trưởng Văn phòng'}</td>
            <td style="font-weight: bold; background-color: #f8fafc;">Cấu trúc điểm:</td>
            <td>30đ KPI chung + 70đ KPI vị trí</td>
          </tr>
        </table>

        <!-- Main KPI Criteria Table -->
        <table class="kpi-tbl">
          <thead>
            <tr>
              <th style="width: 6%;">STT</th>
              <th style="width: 46%;">Nội dung tiêu chí đánh giá KPI</th>
              <th style="width: 10%;">Điểm tối đa</th>
              <th style="width: 12%;">Cá nhân tự chấm</th>
              <th style="width: 12%;">BGH chấm</th>
              <th style="width: 14%;">Minh chứng / Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            ${criteriaRowsHtml}
            <!-- Total Summary Row -->
            <tr style="background-color: #e2e8f0; font-weight: bold;">
              <td style="text-align: center; border: 1px solid #000; padding: 8px;" colSpan="2">
                TỔNG ĐIỂM KPI (THANG ĐIỂM 100 CHUẨN)
              </td>
              <td style="text-align: center; border: 1px solid #000; padding: 8px;">100</td>
              <td style="text-align: center; border: 1px solid #000; padding: 8px; color: #1e3a8a;">${params.selfTotal} đ</td>
              <td style="text-align: center; border: 1px solid #000; padding: 8px; color: #065f46;">${params.bghTotal ?? params.selfTotal} đ</td>
              <td style="border: 1px solid #000; padding: 8px;">
                Xếp loại: <b>${params.bghRank || params.selfRank}</b>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Date line -->
        <div style="text-align: right; font-style: italic; margin-top: 15px; margin-bottom: 10px;">
          Phương Xá, ngày ${new Date().getDate()} tháng ${new Date().getMonth() + 1} năm ${new Date().getFullYear()}
        </div>

        <!-- Signatures Table -->
        <table class="sig-tbl">
          <tr>
            <td>
              <div style="font-weight: bold; text-transform: uppercase;">NGƯỜI TỰ ĐÁNH GIÁ</div>
              <div style="font-style: italic; font-size: 10pt;">(Ký và ghi rõ họ tên)</div>
              <div style="height: 65px;"></div>
              <div style="font-weight: bold;">${params.teacherName}</div>
            </td>
            <td>
              <div style="font-weight: bold; text-transform: uppercase;">TỔ TRƯỞNG VĂN PHÒNG</div>
              <div style="font-style: italic; font-size: 10pt;">(Ký và ghi rõ họ tên)</div>
              <div style="height: 65px;"></div>
              <div style="font-weight: bold;">Hoàng Mỹ Hạnh</div>
            </td>
            <td>
              <div style="font-weight: bold; text-transform: uppercase;">HIỆU TRƯỞNG PHÊ DUYỆT</div>
              <div style="font-style: italic; font-size: 10pt;">(Ký tên và đóng dấu)</div>
              <div style="height: 65px;"></div>
              <div style="font-weight: bold;">Thầy Lê Quốc Tuấn</div>
            </td>
          </tr>
        </table>
      </div>
    `;
  });

  const wordContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>So_Bo_Phieu_KPI_Nhan_Vien</title>
<!--[if gte mso 9]>
<xml>
 <w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>100</w:Zoom>
 </w:WordDocument>
</xml>
<![endif]-->
<style>
  @page Section1 {
    size: 21.0cm 29.7cm;
    margin: 2.0cm 2.0cm 2.0cm 2.5cm;
    mso-header-margin: 36.0pt;
    mso-footer-margin: 36.0pt;
    mso-paper-source: 0;
  }
  div.Section1 { page: Section1; }
  body {
    font-family: 'Times New Roman', Times, serif;
    font-size: 13pt;
    line-height: 1.3;
    color: #000000;
  }
  table.header-tbl {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }
  table.header-tbl td {
    vertical-align: top;
    text-align: center;
  }
  .doc-title {
    text-align: center;
    font-weight: bold;
    font-size: 16pt;
    text-transform: uppercase;
    margin-top: 10px;
    margin-bottom: 5px;
  }
  .doc-subtitle {
    text-align: center;
    font-weight: bold;
    font-size: 14pt;
    color: #0f2d59;
    margin-bottom: 15px;
  }
  table.info-tbl {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #000000;
    margin-bottom: 20px;
  }
  table.info-tbl td {
    padding: 6px 10px;
    border: 1px solid #000000;
    font-size: 12pt;
  }
  table.kpi-tbl {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }
  table.kpi-tbl th {
    border: 1px solid #000000;
    padding: 8px 5px;
    background-color: #f1f5f9;
    font-weight: bold;
    text-align: center;
    font-size: 11pt;
  }
  table.kpi-tbl td {
    border: 1px solid #000000;
    padding: 6px 6px;
    font-size: 11pt;
  }
  table.sig-tbl {
    width: 100%;
    border-collapse: collapse;
    margin-top: 30px;
  }
  table.sig-tbl td {
    text-align: center;
    vertical-align: top;
    width: 33.33%;
  }
</style>
</head>
<body>
<div class="Section1">
  ${sectionsHtml}
</div>
</body>
</html>
  `;

  const blob = new Blob(['\uFEFF' + wordContent], {
    type: 'application/msword;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const fileName =
    customFileName ||
    `So_Bo_Phieu_KPI_Tat_Ca_Nhan_Vien_${schoolYear.replace(/\s+/g, '')}.doc`;

  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadDeptScheduleTemplateExcel() {
  const templateData = [
    {
      'Thứ': 'Thứ Hai',
      'Ngày': '28/9/2026',
      'Sáng (Nội dung công việc)': 'Sinh hoạt chuyên môn tổ: Triển khai kế hoạch tuần.',
      'Chiều (Nội dung công việc)': 'Lên lớp theo thời khóa biểu.',
      'Ngày hoàn thành': '28/09/2026',
      'Lãnh đạo trực/đánh giá': 'Tổ trưởng trực',
      'Ghi chú': 'Nộp báo cáo',
    },
    {
      'Thứ': 'Thứ Ba',
      'Ngày': '29/9/2026',
      'Sáng (Nội dung công việc)': 'Dự giờ thăm lớp.',
      'Chiều (Nội dung công việc)': 'Họp nhóm chuyên môn.',
      'Ngày hoàn thành': '29/09/2026',
      'Lãnh đạo trực/đánh giá': 'P.HT dự giờ',
      'Ghi chú': '',
    },
    {
      'Thứ': 'Thứ Tư',
      'Ngày': '30/9/2026',
      'Sáng (Nội dung công việc)': 'Kiểm tra thiết bị phòng thực hành.',
      'Chiều (Nội dung công việc)': 'Lên lớp theo TKB.',
      'Ngày hoàn thành': '30/09/2026',
      'Lãnh đạo trực/đánh giá': 'Tổ trưởng trực',
      'Ghi chú': '',
    },
    {
      'Thứ': 'Thứ Năm',
      'Ngày': '01/10/2026',
      'Sáng (Nội dung công việc)': 'Sinh hoạt nhóm chuyên môn.',
      'Chiều (Nội dung công việc)': 'Bồi dưỡng học sinh giỏi.',
      'Ngày hoàn thành': '01/10/2026',
      'Lãnh đạo trực/đánh giá': 'Tổ trưởng duyệt',
      'Ghi chú': '',
    },
    {
      'Thứ': 'Thứ Sáu',
      'Ngày': '02/10/2026',
      'Sáng (Nội dung công việc)': 'Họp giao ban toàn trường.',
      'Chiều (Nội dung công việc)': 'Chấm bài kiểm tra, nhập điểm.',
      'Ngày hoàn thành': '02/10/2026',
      'Lãnh đạo trực/đánh giá': 'BGH duyệt',
      'Ghi chú': '',
    },
    {
      'Thứ': 'Thứ Bảy',
      'Ngày': '03/10/2026',
      'Sáng (Nội dung công việc)': 'Sinh hoạt chuyên đề phương pháp dạy học.',
      'Chiều (Nội dung công việc)': 'Vệ sinh phòng bộ môn.',
      'Ngày hoàn thành': '03/10/2026',
      'Lãnh đạo trực/đánh giá': 'Tổ trưởng kiểm tra',
      'Ghi chú': '',
    },
    {
      'Thứ': 'Chủ Nhật',
      'Ngày': '04/10/2026',
      'Sáng (Nội dung công việc)': 'Nghỉ ngơi.',
      'Chiều (Nội dung công việc)': 'Nghỉ.',
      'Ngày hoàn thành': '04/10/2026',
      'Lãnh đạo trực/đánh giá': '-',
      'Ghi chú': '',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  ws['!cols'] = [
    { wch: 15 },
    { wch: 15 },
    { wch: 35 },
    { wch: 35 },
    { wch: 20 },
    { wch: 25 },
    { wch: 20 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Mau_Lich_Giao_Viec');
  XLSX.writeFile(wb, 'Mau_Lich_Giao_Viec_To_Chuyen_Mon.xlsx');
}

export function downloadSchoolScheduleTemplateExcel() {
  const templateData = [
    {
      'Thứ': 'Thứ Hai',
      'Ngày': '28/9/2026',
      'Sáng (Nội dung công việc)': 'Chào cờ toàn trường, triển khai công tác tuần.',
      'Chiều (Nội dung công việc)': 'Họp giao ban BGH & Các Trưởng bộ phận.',
      'Ngày hoàn thành': '28/09/2026',
      'Lãnh đạo trực/đánh giá': 'Hiệu trưởng chỉ đạo',
      'Ghi chú': 'Toàn trường tham dự',
    },
    {
      'Thứ': 'Thứ Ba',
      'Ngày': '29/9/2026',
      'Sáng (Nội dung công việc)': 'BGH kiểm tra nề nếp dạy và học.',
      'Chiều (Nội dung công việc)': 'Kiểm tra cơ sở vật chất phòng học.',
      'Ngày hoàn thành': '29/09/2026',
      'Lãnh đạo trực/đánh giá': 'P.Hiệu trưởng trực',
      'Ghi chú': '',
    },
    {
      'Thứ': 'Thứ Tư',
      'Ngày': '30/9/2026',
      'Sáng (Nội dung công việc)': 'Dự giờ đột xuất môn học khối 10.',
      'Chiều (Nội dung công việc)': 'Họp Hội đồng thi đua khen thưởng.',
      'Ngày hoàn thành': '30/09/2026',
      'Lãnh đạo trực/đánh giá': 'P.Hiệu trưởng chủ trì',
      'Ghi chú': '',
    },
    {
      'Thứ': 'Thứ Năm',
      'Ngày': '01/10/2026',
      'Sáng (Nội dung công việc)': 'Kiểm tra công tác quản lý tài chính quý 3.',
      'Chiều (Nội dung công việc)': 'Thao giảng toàn trường.',
      'Ngày hoàn thành': '01/10/2026',
      'Lãnh đạo trực/đánh giá': 'Hiệu trưởng kiểm tra',
      'Ghi chú': '',
    },
    {
      'Thứ': 'Thứ Sáu',
      'Ngày': '02/10/2026',
      'Sáng (Nội dung công việc)': 'Họp giao ban toàn trường tiết 1+2.',
      'Chiều (Nội dung công việc)': 'Chấm bài kiểm tra, nhập điểm.',
      'Ngày hoàn thành': '02/10/2026',
      'Lãnh đạo trực/đánh giá': 'BGH duyệt',
      'Ghi chú': 'Nhập điểm đúng hạn',
    },
    {
      'Thứ': 'Thứ Bảy',
      'Ngày': '03/10/2026',
      'Sáng (Nội dung công việc)': 'Sinh hoạt ngoại khóa an toàn giao thông.',
      'Chiều (Nội dung công việc)': 'Tổng vệ sinh toàn trường.',
      'Ngày hoàn thành': '03/10/2026',
      'Lãnh đạo trực/đánh giá': 'Lãnh đạo trực ban',
      'Ghi chú': '',
    },
    {
      'Thứ': 'Chủ Nhật',
      'Ngày': '04/10/2026',
      'Sáng (Nội dung công việc)': 'Trực ban nhà trường.',
      'Chiều (Nội dung công việc)': 'Trực ban nhà trường.',
      'Ngày hoàn thành': '04/10/2026',
      'Lãnh đạo trực/đánh giá': 'Bảo vệ & Lãnh đạo trực',
      'Ghi chú': '',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  ws['!cols'] = [
    { wch: 15 },
    { wch: 15 },
    { wch: 35 },
    { wch: 35 },
    { wch: 20 },
    { wch: 25 },
    { wch: 20 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Lich_Giao_Viec_Nha_Truong');
  XLSX.writeFile(wb, 'Mau_Lich_Giao_Viec_Nha_Truong.xlsx');
}

export function downloadWeeklyWorkScheduleTemplateExcel() {
  const templateData = [
    {
      'Thứ': 'HAI',
      'Ngày': '28/9/2026',
      'Sáng (Nội dung công việc)': 'Chào cờ toàn trường tiết 1. BGH họp giao ban đầu tuần.',
      'Chiều (Nội dung công việc)': 'Họp sinh hoạt chuyên môn các tổ.',
      'Trực lãnh đạo': 'Thầy Kiên (HT)',
    },
    {
      'Thứ': 'BA',
      'Ngày': '29/9/2026',
      'Sáng (Nội dung công việc)': 'Dự giờ thăm lớp giáo viên trẻ khối 12.',
      'Chiều (Nội dung công việc)': 'Bồi dưỡng học sinh giỏi các môn văn hóa.',
      'Trực lãnh đạo': 'Cô Hà (P.HT)',
    },
    {
      'Thứ': 'TƯ',
      'Ngày': '30/9/2026',
      'Sáng (Nội dung công việc)': 'Kiểm tra công tác vệ sinh trường học & phòng thực hành.',
      'Chiều (Nội dung công việc)': 'Lên lớp dạy học theo thời khóa biểu.',
      'Trực lãnh đạo': 'Thầy Hùng (P.HT)',
    },
    {
      'Thứ': 'NĂM',
      'Ngày': '01/10/2026',
      'Sáng (Nội dung công việc)': 'Sinh hoạt chuyên đề nâng cao chất lượng thi tốt nghiệp THPT.',
      'Chiều (Nội dung công việc)': 'Hoạt động trải nghiệm hướng nghiệp khối 10, 11.',
      'Trực lãnh đạo': 'Thầy Kiên (HT)',
    },
    {
      'Thứ': 'SÁU',
      'Ngày': '02/10/2026',
      'Sáng (Nội dung công việc)': 'Họp Hội đồng giáo dục trường tiết 1+2.',
      'Chiều (Nội dung công việc)': 'Chấm bài kiểm tra định kỳ, nhập điểm hệ thống CSDL.',
      'Trực lãnh đạo': 'Cô Hà (P.HT)',
    },
    {
      'Thứ': 'BẢY',
      'Ngày': '03/10/2026',
      'Sáng (Nội dung công việc)': 'Sinh hoạt Câu lạc bộ TDTT, Nghệ thuật.',
      'Chiều (Nội dung công việc)': 'Lao động vệ sinh khuôn viên trường.',
      'Trực lãnh đạo': 'Thầy Hùng (P.HT)',
    },
    {
      'Thứ': 'CN',
      'Ngày': '04/10/2026',
      'Sáng (Nội dung công việc)': 'Nghỉ.',
      'Chiều (Nội dung công việc)': 'Nghỉ.',
      'Trực lãnh đạo': 'Bảo vệ trực',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  ws['!cols'] = [
    { wch: 12 },
    { wch: 15 },
    { wch: 40 },
    { wch: 40 },
    { wch: 25 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Lich_Cong_Tac_Tuan');
  XLSX.writeFile(wb, 'Mau_Lich_Cong_Tac_Tuan.xlsx');
}

export function exportCriteriaSetToExcel(params: {
  schoolName?: string;
  targetType: 'giaovien' | 'bgh' | 'nhanvien';
  targetTitle: string;
  criteriaList: {
    id: string;
    section: string;
    sectionTitle?: string;
    groupTitle?: string;
    content: string;
    maxPoints: number;
    evidenceRequirement?: string;
    evidence?: string;
    description?: string;
    status: 'active' | 'inactive';
  }[];
  scopeTitle?: string;
  version?: number;
  evalPeriod?: string;
}) {
  const {
    schoolName = 'TRƯỜNG THPT PHƯƠNG XÁ',
    targetType,
    targetTitle,
    criteriaList,
    scopeTitle = 'Toàn bộ tiêu chí',
    version = 1,
    evalPeriod = 'Năm học 2026 - 2027',
  } = params;

  const totalPoints = criteriaList.reduce((sum, item) => sum + (Number(item.maxPoints) || 0), 0);
  const roundedTotal = Math.round(totalPoints * 10) / 10;

  // Build excel sheet data with clear informative header
  const rows: any[] = [];

  // Title rows
  rows.push({
    'STT': '',
    'MÃ TC': `SỞ GIÁO DỤC VÀ ĐÀO TẠO PHÚ THỌ - ${schoolName.toUpperCase()}`,
    'NHÓM': '',
    'NỘI DUNG TIÊU CHÍ KPI': '',
    'ĐIỂM TỐI ĐA': '',
    'MINH CHỨNG YÊU CẦU': '',
    'TRẠNG THÁI': '',
  });

  rows.push({
    'STT': '',
    'MÃ TC': `BỘ TIÊU CHÍ ĐÁNH GIÁ KPI CBGVNV - ${targetTitle.toUpperCase()}`,
    'NHÓM': '',
    'NỘI DUNG TIÊU CHÍ KPI': '',
    'ĐIỂM TỐI ĐA': '',
    'MINH CHỨNG YÊU CẦU': '',
    'TRẠNG THÁI': '',
  });

  rows.push({
    'STT': '',
    'MÃ TC': `Phạm vi xuất: ${scopeTitle} | Kỳ đánh giá: ${evalPeriod} | Phiên bản: v${version} | Tổng điểm: ${roundedTotal}/100 đ`,
    'NHÓM': '',
    'NỘI DUNG TIÊU CHÍ KPI': '',
    'ĐIỂM TỐI ĐA': '',
    'MINH CHỨNG YÊU CẦU': '',
    'TRẠNG THÁI': '',
  });

  rows.push({
    'STT': '',
    'MÃ TC': '',
    'NHÓM': '',
    'NỘI DUNG TIÊU CHÍ KPI': '',
    'ĐIỂM TỐI ĐA': '',
    'MINH CHỨNG YÊU CẦU': '',
    'TRẠNG THÁI': '',
  });

  // Table criteria items
  criteriaList.forEach((c, idx) => {
    rows.push({
      'STT': idx + 1,
      'MÃ TC': c.id,
      'NHÓM': c.sectionTitle || c.groupTitle || `Mục ${c.section}`,
      'NỘI DUNG TIÊU CHÍ KPI': c.content,
      'ĐIỂM TỐI ĐA': Number(c.maxPoints) || 0,
      'MINH CHỨNG YÊU CẦU': c.evidenceRequirement || c.evidence || c.description || 'Theo phân công & hồ sơ minh chứng',
      'TRẠNG THÁI': c.status === 'inactive' ? 'Ngưng dùng' : 'Đang dùng',
    });
  });

  // Summary row
  rows.push({
    'STT': '',
    'MÃ TC': 'TỔNG CỘNG',
    'NHÓM': '',
    'NỘI DUNG TIÊU CHÍ KPI': 'TỔNG ĐIỂM BỘ TIÊU CHÍ (Chuẩn quy chế 100đ)',
    'ĐIỂM TỐI ĐA': roundedTotal,
    'MINH CHỨNG YÊU CẦU': `${roundedTotal}/100 điểm`,
    'TRẠNG THÁI': roundedTotal === 100 ? 'Hợp lệ' : 'Cần kiểm tra',
  });

  const ws = XLSX.utils.json_to_sheet(rows);

  ws['!cols'] = [
    { wch: 8 },  // STT
    { wch: 14 }, // MÃ TC
    { wch: 28 }, // NHÓM
    { wch: 65 }, // NỘI DUNG TIÊU CHÍ KPI
    { wch: 14 }, // ĐIỂM TỐI ĐA
    { wch: 38 }, // MINH CHỨNG YÊU CẦU
    { wch: 16 }, // TRẠNG THÁI
  ];

  const wb = XLSX.utils.book_new();
  const sheetName = targetType === 'giaovien' ? 'KPI_Giao_Vien' : targetType === 'bgh' ? 'KPI_Can_Bo_Quan_Ly' : 'KPI_Nhan_Vien';
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  let filename = 'Bo_tieu_chi_KPI_Giao_vien_THPT_Phuong_Xa.xlsx';
  if (targetType === 'bgh') {
    filename = 'Bo_tieu_chi_KPI_Can_bo_quan_ly_THPT_Phuong_Xa.xlsx';
  } else if (targetType === 'nhanvien') {
    filename = 'Bo_tieu_chi_KPI_Nhan_vien_THPT_Phuong_Xa.xlsx';
  }

  XLSX.writeFile(wb, filename);
}

export async function exportCriteriaSetToWord(params: {
  schoolName?: string;
  targetType: 'giaovien' | 'bgh' | 'nhanvien';
  targetTitle: string;
  criteriaList: {
    id: string;
    section: string;
    sectionTitle?: string;
    groupTitle?: string;
    content: string;
    maxPoints: number;
    evidenceRequirement?: string;
    evidence?: string;
    description?: string;
    status: 'active' | 'inactive';
  }[];
  scopeTitle?: string;
  version?: number;
  evalPeriod?: string;
}) {
  const {
    schoolName = 'TRƯỜNG THPT PHƯƠNG XÁ',
    targetType,
    targetTitle,
    criteriaList,
    scopeTitle = 'Toàn bộ tiêu chí',
    version = 1,
    evalPeriod = 'Năm học 2026 - 2027',
  } = params;

  const totalPoints = criteriaList.reduce((sum, item) => sum + (Number(item.maxPoints) || 0), 0);
  const roundedTotal = Math.round(totalPoints * 10) / 10;

  try {
    const tableHeaderRow = new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 600, type: WidthType.DXA },
          shading: { fill: 'F1F5F9' },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'STT', bold: true, size: 20 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 1200, type: WidthType.DXA },
          shading: { fill: 'F1F5F9' },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'MÃ TIÊU CHÍ', bold: true, size: 20 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 1600, type: WidthType.DXA },
          shading: { fill: 'F1F5F9' },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'NHÓM', bold: true, size: 20 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 3400, type: WidthType.DXA },
          shading: { fill: 'F1F5F9' },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'NỘI DUNG TIÊU CHÍ KPI', bold: true, size: 20 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 900, type: WidthType.DXA },
          shading: { fill: 'F1F5F9' },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'ĐIỂM TỐI ĐA', bold: true, size: 20 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 1800, type: WidthType.DXA },
          shading: { fill: 'F1F5F9' },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'MINH CHỨNG YÊU CẦU', bold: true, size: 20 })],
            }),
          ],
        }),
        new TableCell({
          width: { size: 1000, type: WidthType.DXA },
          shading: { fill: 'F1F5F9' },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: 'TRẠNG THÁI', bold: true, size: 20 })],
            }),
          ],
        }),
      ],
    });

    const dataRows = criteriaList.map((c, idx) => {
      const contentChildren: TextRun[] = [];
      if (c.groupTitle) {
        contentChildren.push(
          new TextRun({
            text: `[${c.groupTitle}]\n`,
            bold: true,
            size: 18,
            color: '1E3A8A',
          })
        );
      }
      contentChildren.push(new TextRun({ text: c.content, size: 20 }));

      return new TableRow({
        children: [
          new TableCell({
            width: { size: 600, type: WidthType.DXA },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: String(idx + 1), size: 20 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 1200, type: WidthType.DXA },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: c.id, bold: true, size: 20 })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 1600, type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: c.sectionTitle || c.groupTitle || `Mục ${c.section}`,
                    size: 19,
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 3400, type: WidthType.DXA },
            children: [new Paragraph({ children: contentChildren })],
          }),
          new TableCell({
            width: { size: 900, type: WidthType.DXA },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `${c.maxPoints}`,
                    bold: true,
                    size: 21,
                    color: '0F172A',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 1800, type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text:
                      c.evidenceRequirement ||
                      c.evidence ||
                      c.description ||
                      'Theo phân công & hồ sơ minh chứng',
                    italics: true,
                    size: 19,
                    color: '475569',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 1000, type: WidthType.DXA },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: c.status === 'inactive' ? 'Ngưng dùng' : 'Đang dùng',
                    size: 19,
                    color: c.status === 'inactive' ? '64748B' : '047857',
                    bold: c.status !== 'inactive',
                  }),
                ],
              }),
            ],
          }),
        ],
      });
    });

    const summaryRow = new TableRow({
      children: [
        new TableCell({
          columnSpan: 4,
          shading: { fill: 'F8FAFC' },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: 'TỔNG ĐIỂM BỘ TIÊU CHÍ (CHUẨN 100 ĐIỂM):',
                  bold: true,
                  size: 21,
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          shading: { fill: 'F8FAFC' },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `${roundedTotal}đ`,
                  bold: true,
                  size: 22,
                  color: roundedTotal === 100 ? '047857' : 'B45309',
                }),
              ],
            }),
          ],
        }),
        new TableCell({
          columnSpan: 2,
          shading: { fill: 'F8FAFC' },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text:
                    roundedTotal === 100
                      ? 'Đạt chuẩn quy chế 100 điểm'
                      : `Tổng điểm hiện tại: ${roundedTotal}/100đ`,
                  italics: true,
                  size: 19,
                }),
              ],
            }),
          ],
        }),
      ],
    });

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1000,
                right: 1000,
                bottom: 1000,
                left: 1200,
              },
            },
          },
          children: [
            // National Header Table
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 45, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            new TextRun({
                              text: 'SỞ GIÁO DỤC VÀ ĐÀO TẠO PHÚ THỌ',
                              bold: true,
                              size: 20,
                            }),
                          ],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            new TextRun({
                              text: schoolName.toUpperCase(),
                              bold: true,
                              underline: {},
                              size: 22,
                            }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      width: { size: 55, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            new TextRun({
                              text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM',
                              bold: true,
                              size: 20,
                            }),
                          ],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            new TextRun({
                              text: 'Độc lập - Tự do - Hạnh phúc',
                              bold: true,
                              italics: true,
                              underline: {},
                              size: 22,
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            new Paragraph({ spacing: { before: 200, after: 100 } }),

            // Title
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: 'BỘ TIÊU CHÍ ĐÁNH GIÁ KPI CBGVNV',
                  bold: true,
                  size: 30,
                  color: '0F172A',
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `ĐỐI TƯỢNG ÁP DỤNG: ${targetTitle.toUpperCase()}`,
                  bold: true,
                  size: 24,
                  color: '1E3A8A',
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `Kỳ đánh giá: ${evalPeriod}  •  Phạm vi: ${scopeTitle}  •  Phiên bản: v${version}`,
                  italics: true,
                  size: 20,
                  color: '475569',
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
              children: [
                new TextRun({
                  text: `Tổng điểm bộ tiêu chí: ${roundedTotal}/100 điểm`,
                  bold: true,
                  size: 22,
                  color: roundedTotal === 100 ? '047857' : 'B45309',
                }),
              ],
            }),

            // Table of Criteria
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [tableHeaderRow, ...dataRows, summaryRow],
            }),

            new Paragraph({ spacing: { before: 300, after: 100 } }),

            // Signatures Table
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'auto' },
                insideVertical: { style: BorderStyle.NONE, size: 0, color: 'auto' },
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            new TextRun({
                              text: 'NGƯỜI LẬP BẢNG',
                              bold: true,
                              size: 22,
                            }),
                          ],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            new TextRun({
                              text: '(Ký và ghi rõ họ tên)',
                              italics: true,
                              size: 20,
                            }),
                          ],
                        }),
                      ],
                    }),
                    new TableCell({
                      width: { size: 50, type: WidthType.PERCENTAGE },
                      children: [
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            new TextRun({
                              text: 'Phú Thọ, ngày ..... tháng ..... năm 2026',
                              italics: true,
                              size: 20,
                            }),
                          ],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            new TextRun({
                              text: 'HIỆU TRƯỞNG',
                              bold: true,
                              size: 22,
                            }),
                          ],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.CENTER,
                          children: [
                            new TextRun({
                              text: '(Phê duyệt và ký tên)',
                              italics: true,
                              size: 20,
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    let filename = 'Bo_tieu_chi_KPI_Giao_vien_THPT_Phuong_Xa.docx';
    if (targetType === 'bgh') {
      filename = 'Bo_tieu_chi_KPI_Can_bo_quan_ly_THPT_Phuong_Xa.docx';
    } else if (targetType === 'nhanvien') {
      filename = 'Bo_tieu_chi_KPI_Nhan_vien_THPT_Phuong_Xa.docx';
    }

    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error generating docx file:', err);
    throw err;
  }
}




