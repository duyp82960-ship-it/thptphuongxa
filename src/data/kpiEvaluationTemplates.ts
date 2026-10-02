import { StaffMember } from '../types';

export interface KpiCriterionItem {
  id: string;
  section: string;
  sectionTitle: string;
  order: number;
  content: string;
  maxPoints: number;
  canBeNa?: boolean;
  groupTitle?: string;
  status?: 'active' | 'inactive';
  evidence?: string;
  description?: string;
}

export interface KpiScoreItem {
  criterionId: string;
  selfScore: number;
  deptScore?: number;
  bghScore?: number;
  isNa?: boolean;
  evidence?: string;
}

export interface TeacherKpiEvaluation {
  id: string;
  staffId: string;
  staffCode: string;
  staffName: string;
  department: string;
  position: string;
  subject?: string;
  targetType: 'giaovien' | 'nhanvien';
  schoolYear: string;
  semester?: 1 | 2;
  scores: Record<string, KpiScoreItem>;
  selfTotalScore: number;
  deptTotalScore?: number;
  bghTotalScore?: number;
  selfRank: 'Chưa hoàn thành' | 'Hoàn thành' | 'Hoàn thành tốt' | 'Hoàn thành xuất sắc';
  deptRank?: 'Chưa hoàn thành' | 'Hoàn thành' | 'Hoàn thành tốt' | 'Hoàn thành xuất sắc';
  bghRank?: 'Chưa hoàn thành' | 'Hoàn thành' | 'Hoàn thành tốt' | 'Hoàn thành xuất sắc';
  selfRankNote?: string;
  status: 'draft' | 'self_submitted' | 'dept_reviewed' | 'bgh_approved';
  selfDate?: string;
  deptDate?: string;
  bghDate?: string;
  updatedAt: string;
}

/**
 * 30 Tiêu chí chấm điểm KPI Giáo viên chuẩn 100 điểm - Trường THPT Sơn Lương
 * Đúng từng câu từng chữ theo văn bản ban hành năm học 2026-2027
 */
export const TEACHER_KPI_CRITERIA: KpiCriterionItem[] = [
  // PHẦN I: CHÍNH TRỊ TƯ TƯỞNG, ĐẠO ĐỨC LỐI SỐNG (15 ĐIỂM)
  {
    id: 'I.1',
    section: 'I',
    sectionTitle: 'CHÍNH TRỊ TƯ TƯỞNG, ĐẠO ĐỨC LỐI SỐNG',
    order: 1,
    content:
      'Chấp hành chủ trương, đường lối của Đảng, chính sách, pháp luật của Nhà nước; thực hiện đúng quy định của ngành và của nhà trường.',
    maxPoints: 2,
  },
  {
    id: 'I.2',
    section: 'I',
    sectionTitle: 'CHÍNH TRỊ TƯ TƯỞNG, ĐẠO ĐỨC LỐI SỐNG',
    order: 2,
    content:
      'Có lập trường, bản lĩnh chính trị vững vàng; có ý thức trách nhiệm, không dao động trước khó khăn; thực hiện nghiêm nhiệm vụ được giao.',
    maxPoints: 2,
  },
  {
    id: 'I.3',
    section: 'I',
    sectionTitle: 'CHÍNH TRỊ TƯ TƯỞNG, ĐẠO ĐỨC LỐI SỐNG',
    order: 3,
    content:
      'Đặt lợi ích của tập thể, học sinh và nhà trường lên trên lợi ích cá nhân; có tinh thần trách nhiệm với chất lượng giáo dục.',
    maxPoints: 1.5,
  },
  {
    id: 'I.4',
    section: 'I',
    sectionTitle: 'CHÍNH TRỊ TƯ TƯỞNG, ĐẠO ĐỨC LỐI SỐNG',
    order: 4,
    content:
      'Chủ động nghiên cứu, học tập, cập nhật nghị quyết, chỉ thị, văn bản chỉ đạo và vận dụng phù hợp vào nhiệm vụ giáo dục.',
    maxPoints: 1.5,
  },
  {
    id: 'I.5',
    section: 'I',
    sectionTitle: 'CHÍNH TRỊ TƯ TƯỞNG, ĐẠO ĐỨC LỐI SỐNG',
    order: 5,
    content:
      'Không tham ô, tham nhũng, tiêu cực, lãng phí; không gian lận trong đánh giá học sinh; không có hành vi gây ảnh hưởng quyền lợi chính đáng của học sinh.',
    maxPoints: 2,
  },
  {
    id: 'I.6',
    section: 'I',
    sectionTitle: 'CHÍNH TRỊ TƯ TƯỞNG, ĐẠO ĐỨC LỐI SỐNG',
    order: 6,
    content:
      'Trung thực, khiêm tốn, chân thành, chuẩn mực; giữ gìn phẩm chất, uy tín và danh dự nhà giáo.',
    maxPoints: 2,
  },
  {
    id: 'I.7',
    section: 'I',
    sectionTitle: 'CHÍNH TRỊ TƯ TƯỞNG, ĐẠO ĐỨC LỐI SỐNG',
    order: 7,
    content:
      'Đoàn kết, tôn trọng, hỗ trợ đồng nghiệp; phối hợp xây dựng tổ chuyên môn và nhà trường.',
    maxPoints: 2,
  },
  {
    id: 'I.8',
    section: 'I',
    sectionTitle: 'CHÍNH TRỊ TƯ TƯỞNG, ĐẠO ĐỨC LỐI SỐNG',
    order: 8,
    content:
      'Không để người thân, người quen lợi dụng vị trí công tác để trục lợi; không lợi dụng nhiệm vụ giáo dục để vụ lợi cá nhân.',
    maxPoints: 2,
  },

  // PHẦN II: TÁC PHONG, LỀ LỐI LÀM VIỆC, Ý THỨC TỔ CHỨC KỶ LUẬT (15 ĐIỂM)
  {
    id: 'II.1',
    section: 'II',
    sectionTitle: 'TÁC PHONG, LỀ LỐI LÀM VIỆC, Ý THỨC TỔ CHỨC KỶ LUẬT',
    order: 1,
    content:
      'Có trách nhiệm với công việc; chủ động, năng động, sáng tạo; hoàn thành nhiệm vụ đúng thời hạn.',
    maxPoints: 2,
  },
  {
    id: 'II.2',
    section: 'II',
    sectionTitle: 'TÁC PHONG, LỀ LỐI LÀM VIỆC, Ý THỨC TỔ CHỨC KỶ LUẬT',
    order: 2,
    content:
      'Lập kế hoạch công việc khoa học; thực hiện nhiệm vụ theo thứ tự ưu tiên; lưu trữ hồ sơ, minh chứng đầy đủ.',
    maxPoints: 1.5,
  },
  {
    id: 'II.3',
    section: 'II',
    sectionTitle: 'TÁC PHONG, LỀ LỐI LÀM VIỆC, Ý THỨC TỔ CHỨC KỶ LUẬT',
    order: 3,
    content:
      'Có tinh thần phối hợp với TTCM, GVCN, giáo viên bộ môn, BGH, Đoàn trường và các bộ phận liên quan.',
    maxPoints: 2,
  },
  {
    id: 'II.4',
    section: 'II',
    sectionTitle: 'TÁC PHONG, LỀ LỐI LÀM VIỆC, Ý THỨC TỔ CHỨC KỶ LUẬT',
    order: 4,
    content:
      'Ứng xử chuẩn mực với học sinh, cha mẹ học sinh, đồng nghiệp; thực hiện văn hóa công sở và văn hóa nhà trường.',
    maxPoints: 2,
  },
  {
    id: 'II.5',
    section: 'II',
    sectionTitle: 'TÁC PHONG, LỀ LỐI LÀM VIỆC, Ý THỨC TỔ CHỨC KỶ LUẬT',
    order: 5,
    content:
      'Chấp hành sự phân công của tổ chức; thực hiện nghiêm nhiệm vụ chuyên môn, kiêm nhiệm và nhiệm vụ đột xuất được giao.',
    maxPoints: 1.5,
  },
  {
    id: 'II.6',
    section: 'II',
    sectionTitle: 'TÁC PHONG, LỀ LỐI LÀM VIỆC, Ý THỨC TỔ CHỨC KỶ LUẬT',
    order: 6,
    content:
      'Thực hiện đúng quy chế chuyên môn, nội quy, quy chế làm việc; bảo đảm giờ giấc, thời khóa biểu, quy trình xin nghỉ, dạy thay, đổi tiết, dạy bù.',
    maxPoints: 2,
  },
  {
    id: 'II.7',
    section: 'II',
    sectionTitle: 'TÁC PHONG, LỀ LỐI LÀM VIỆC, Ý THỨC TỔ CHỨC KỶ LUẬT',
    order: 7,
    content:
      'Thực hiện đầy đủ, đúng hạn các báo cáo; cung cấp thông tin chính xác, khách quan; cập nhật dữ liệu trên các phần mềm được giao.',
    maxPoints: 2,
  },
  {
    id: 'II.8',
    section: 'II',
    sectionTitle: 'TÁC PHONG, LỀ LỐI LÀM VIỆC, Ý THỨC TỔ CHỨC KỶ LUẬT',
    order: 8,
    content:
      'Tham gia đầy đủ họp hội đồng, sinh hoạt tổ/nhóm chuyên môn, tập huấn và hoạt động chung theo phân công; có tinh thần hợp tác.',
    maxPoints: 2,
  },

  // PHẦN III.1: NĂNG LỰC VÀ KỸ NĂNG LÀM VIỆC (10 ĐIỂM)
  {
    id: 'III.1.1',
    section: 'III.1',
    sectionTitle: 'NĂNG LỰC VÀ KỸ NĂNG LÀM VIỆC',
    order: 1,
    content:
      'Năng lực chuyên môn, nghiệp vụ theo vị trí việc làm; nắm vững chương trình, nội dung môn học/hoạt động giáo dục.',
    maxPoints: 3,
  },
  {
    id: 'III.1.2',
    section: 'III.1',
    sectionTitle: 'NĂNG LỰC VÀ KỸ NĂNG LÀM VIỆC',
    order: 2,
    content:
      'Khả năng đáp ứng nhiệm vụ thường xuyên và nhiệm vụ đột xuất; chủ động xử lý công việc trong phạm vi trách nhiệm.',
    maxPoints: 2,
  },
  {
    id: 'III.1.3',
    section: 'III.1',
    sectionTitle: 'NĂNG LỰC VÀ KỸ NĂNG LÀM VIỆC',
    order: 3,
    content:
      'Sử dụng thành thạo phần mềm quản lý, hồ sơ điện tử, công cụ CNTT và công cụ số phục vụ công việc.',
    maxPoints: 2,
  },
  {
    id: 'III.1.4',
    section: 'III.1',
    sectionTitle: 'NĂNG LỰC VÀ KỸ NĂNG LÀM VIỆC',
    order: 4,
    content:
      'Có khả năng phân tích dữ liệu học tập, phát hiện vấn đề, điều chỉnh biện pháp dạy học và hỗ trợ học sinh.',
    maxPoints: 3,
  },

  // PHẦN III.2: KẾT QUẢ THỰC HIỆN NHIỆM VỤ ĐƯỢC GIAO (60 ĐIỂM)
  {
    id: 'III.2.1',
    section: 'III.2',
    sectionTitle: 'KẾT QUẢ THỰC HIỆN NHIỆM VỤ ĐƯỢC GIAO',
    order: 1,
    content:
      'Thực hiện đúng chương trình, thời khóa biểu và tiến độ dạy học; không tự ý bỏ tiết/đổi tiết; báo cáo và xử lý kịp thời khi có phát sinh.',
    maxPoints: 6,
  },
  {
    id: 'III.2.2',
    section: 'III.2',
    sectionTitle: 'KẾT QUẢ THỰC HIỆN NHIỆM VỤ ĐƯỢC GIAO',
    order: 2,
    content:
      'Xây dựng và thực hiện kế hoạch giáo dục môn học; kế hoạch bài dạy đầy đủ, đúng yêu cầu, đúng tiến độ; cập nhật kho hồ sơ điện tử theo quy định.',
    maxPoints: 6,
  },
  {
    id: 'III.2.3',
    section: 'III.2',
    sectionTitle: 'KẾT QUẢ THỰC HIỆN NHIỆM VỤ ĐƯỢC GIAO',
    order: 3,
    content:
      'Tổ chức giờ dạy hiệu quả: quản lý nền nếp, phát huy hoạt động học của học sinh, sử dụng phương pháp/kỹ thuật dạy học phù hợp đối tượng.',
    maxPoints: 6,
  },
  {
    id: 'III.2.4',
    section: 'III.2',
    sectionTitle: 'KẾT QUẢ THỰC HIỆN NHIỆM VỤ ĐƯỢC GIAO',
    order: 4,
    content:
      'Đổi mới phương pháp, ứng dụng CNTT/AI và học liệu số phù hợp, có kiểm soát; không lạm dụng công nghệ; có sản phẩm hoặc minh chứng sử dụng.',
    maxPoints: 6,
  },
  {
    id: 'III.2.5',
    section: 'III.2',
    sectionTitle: 'KẾT QUẢ THỰC HIỆN NHIỆM VỤ ĐƯỢC GIAO',
    order: 5,
    content:
      'Theo dõi sự tiến bộ của học sinh; xác định học sinh cần hỗ trợ; thực hiện phụ đạo, bồi dưỡng hoặc biện pháp hỗ trợ theo phân công.',
    maxPoints: 7,
  },
  {
    id: 'III.2.6',
    section: 'III.2',
    sectionTitle: 'KẾT QUẢ THỰC HIỆN NHIỆM VỤ ĐƯỢC GIAO',
    order: 6,
    content:
      'Thực hiện kiểm tra, đánh giá đúng kế hoạch; xây dựng ma trận/đặc tả/đề/đáp án theo thống nhất chuyên môn; bảo đảm phân hóa và công bằng.',
    maxPoints: 6,
  },
  {
    id: 'III.2.7',
    section: 'III.2',
    sectionTitle: 'KẾT QUẢ THỰC HIỆN NHIỆM VỤ ĐƯỢC GIAO',
    order: 7,
    content:
      'Chấm, chữa, nhận xét; trả bài; cập nhật điểm và hồ sơ điện tử đúng thời hạn; sửa điểm/thông tin học sinh đúng quy trình.',
    maxPoints: 6,
  },
  {
    id: 'III.2.8',
    section: 'III.2',
    sectionTitle: 'KẾT QUẢ THỰC HIỆN NHIỆM VỤ ĐƯỢC GIAO',
    order: 8,
    content:
      'Tham gia dự giờ, thao giảng, nghiên cứu bài học; tiếp thu và thực hiện điều chỉnh sau góp ý chuyên môn.',
    maxPoints: 5,
  },
  {
    id: 'III.2.9',
    section: 'III.2',
    sectionTitle: 'KẾT QUẢ THỰC HIỆN NHIỆM VỤ ĐƯỢC GIAO',
    order: 9,
    content:
      'Tham gia sinh hoạt chuyên môn, tập huấn, bồi dưỡng; có sản phẩm chia sẻ chuyên môn, học liệu, chuyên đề, sáng kiến hoặc giải pháp cải tiến.',
    maxPoints: 5,
  },
  {
    id: 'III.2.10',
    section: 'III.2',
    sectionTitle: 'KẾT QUẢ THỰC HIỆN NHIỆM VỤ ĐƯỢC GIAO',
    order: 10,
    content:
      'Hoàn thành nhiệm vụ chủ nhiệm/kiêm nhiệm/nhiệm vụ khác được giao; phối hợp với CMHS và các lực lượng giáo dục; theo dõi, hỗ trợ học sinh có nguy cơ bỏ học hoặc vi phạm.',
    maxPoints: 7,
    canBeNa: true,
  },
];

/**
 * BỘ TIÊU CHÍ ĐÁNH GIÁ, CHẤM ĐIỂM CÁN BỘ QUẢN LÝ (BGH / LÃNH ĐẠO QUẢN LÝ) - THPT PHƯƠNG XÁ
 * Căn cứ file mẫu "Mau VC Lanh dao quan ly.pdf" - Thang điểm 100
 */
export const BGH_KPI_CRITERIA: KpiCriterionItem[] = [
  // NHÓM I: CHÍNH TRỊ TƯ TƯỞNG, ĐẠO ĐỨC LỐI SỐNG (15 ĐIỂM)
  {
    id: 'I.1',
    section: 'I',
    sectionTitle: 'CHÍNH TRỊ TƯ TƯỞNG, ĐẠO ĐỨC LỐI SỐNG',
    order: 1,
    content:
      'Chấp hành chủ trương, đường lối, quy định của Đảng, chính sách, pháp luật của Nhà nước và các nguyên tắc tổ chức, kỷ luật của Đảng, nhất là nguyên tắc tập trung dân chủ, tự phê bình và phê bình.',
    maxPoints: 2,
  },
  {
    id: 'I.2',
    section: 'I',
    sectionTitle: 'CHÍNH TRỊ TƯ TƯỞNG, ĐẠO ĐỨC LỐI SỐNG',
    order: 2,
    content:
      'Có quan điểm, bản lĩnh chính trị vững vàng; kiên định lập trường; không dao động trước mọi khó khăn, thách thức.',
    maxPoints: 2,
  },
  {
    id: 'I.3',
    section: 'I',
    sectionTitle: 'CHÍNH TRỊ TƯ TƯỞNG, ĐẠO ĐỨC LỐI SỐNG',
    order: 3,
    content: 'Đặt lợi ích của Đảng, quốc gia - dân tộc, nhân dân, tập thể lên trên lợi ích cá nhân.',
    maxPoints: 1.5,
  },
  {
    id: 'I.4',
    section: 'I',
    sectionTitle: 'CHÍNH TRỊ TƯ TƯỞNG, ĐẠO ĐỨC LỐI SỐNG',
    order: 4,
    content:
      'Có ý thức nghiên cứu, học tập, vận dụng chủ nghĩa Mác - Lênin, tư tưởng Hồ Chí Minh, nghị quyết, chỉ thị, quyết định và các văn bản của Đảng.',
    maxPoints: 1.5,
  },
  {
    id: 'I.5',
    section: 'I',
    sectionTitle: 'CHÍNH TRỊ TƯ TƯỞNG, ĐẠO ĐỨC LỐI SỐNG',
    order: 5,
    content:
      'Không tham ô, tham nhũng, tiêu cực, lãng phí, quan liêu, cơ hội, vụ lợi, hách dịch, cửa quyền; không có biểu hiện suy thoái về đạo đức, lối sống, tự diễn biến, tự chuyển hóa.',
    maxPoints: 2,
  },
  {
    id: 'I.6',
    section: 'I',
    sectionTitle: 'CHÍNH TRỊ TƯ TƯỞNG, ĐẠO ĐỨC LỐI SỐNG',
    order: 6,
    content: 'Có lối sống trung thực, khiêm tốn, chân thành, trong sáng, giản dị.',
    maxPoints: 2,
  },
  {
    id: 'I.7',
    section: 'I',
    sectionTitle: 'CHÍNH TRỊ TƯ TƯỞNG, ĐẠO ĐỨC LỐI SỐNG',
    order: 7,
    content: 'Có tinh thần đoàn kết, xây dựng cơ quan, tổ chức, đơn vị trong sạch, vững mạnh.',
    maxPoints: 2,
  },
  {
    id: 'I.8',
    section: 'I',
    sectionTitle: 'CHÍNH TRỊ TƯ TƯỞNG, ĐẠO ĐỨC LỐI SỐNG',
    order: 8,
    content: 'Không để người thân, người quen lợi dụng chức vụ, quyền hạn của mình để trục lợi.',
    maxPoints: 2,
  },

  // NHÓM II: TÁC PHONG, LỀ LỐI LÀM VIỆC, Ý THỨC TỔ CHỨC KỶ LUẬT (15 ĐIỂM)
  {
    id: 'II.1',
    section: 'II',
    sectionTitle: 'TÁC PHONG, LỀ LỐI LÀM VIỆC, Ý THỨC TỔ CHỨC KỶ LUẬT',
    order: 1,
    content:
      'Có trách nhiệm với công việc; năng động, sáng tạo, dám nghĩ, dám làm, linh hoạt trong thực hiện nhiệm vụ.',
    maxPoints: 2,
  },
  {
    id: 'II.2',
    section: 'II',
    sectionTitle: 'TÁC PHONG, LỀ LỐI LÀM VIỆC, Ý THỨC TỔ CHỨC KỶ LUẬT',
    order: 2,
    content: 'Phương pháp làm việc khoa học, dân chủ, đúng nguyên tắc.',
    maxPoints: 1.5,
  },
  {
    id: 'II.3',
    section: 'II',
    sectionTitle: 'TÁC PHONG, LỀ LỐI LÀM VIỆC, Ý THỨC TỔ CHỨC KỶ LUẬT',
    order: 3,
    content: 'Có tinh thần trách nhiệm và phối hợp trong thực hiện nhiệm vụ.',
    maxPoints: 2,
  },
  {
    id: 'II.4',
    section: 'II',
    sectionTitle: 'TÁC PHONG, LỀ LỐI LÀM VIỆC, Ý THỨC TỔ CHỨC KỶ LUẬT',
    order: 4,
    content:
      'Có thái độ đúng mực và phong cách ứng xử, lề lối làm việc chuẩn mực, đáp ứng yêu cầu của văn hóa công vụ.',
    maxPoints: 2,
  },
  {
    id: 'II.5',
    section: 'II',
    sectionTitle: 'TÁC PHONG, LỀ LỐI LÀM VIỆC, Ý THỨC TỔ CHỨC KỶ LUẬT',
    order: 5,
    content: 'Chấp hành sự phân công của tổ chức.',
    maxPoints: 1.5,
  },
  {
    id: 'II.6',
    section: 'II',
    sectionTitle: 'TÁC PHONG, LỀ LỐI LÀM VIỆC, Ý THỨC TỔ CHỨC KỶ LUẬT',
    order: 6,
    content: 'Thực hiện các quy định, quy chế, nội quy của cơ quan, tổ chức, đơn vị nơi công tác.',
    maxPoints: 2,
  },
  {
    id: 'II.7',
    section: 'II',
    sectionTitle: 'TÁC PHONG, LỀ LỐI LÀM VIỆC, Ý THỨC TỔ CHỨC KỶ LUẬT',
    order: 7,
    content: 'Thực hiện việc kê khai và công khai tài sản, thu nhập theo quy định.',
    maxPoints: 2,
  },
  {
    id: 'II.8',
    section: 'II',
    sectionTitle: 'TÁC PHONG, LỀ LỐI LÀM VIỆC, Ý THỨC TỔ CHỨC KỶ LUẬT',
    order: 8,
    content:
      'Báo cáo đầy đủ, trung thực, cung cấp thông tin chính xác, khách quan về những nội dung liên quan đến việc thực hiện chức trách, nhiệm vụ được giao và hoạt động của cơ quan, tổ chức, đơn vị với cấp trên khi được yêu cầu.',
    maxPoints: 2,
  },

  // NHÓM III.1: NĂNG LỰC VÀ KỸ NĂNG LÀM VIỆC (10 ĐIỂM)
  {
    id: 'III.1.1',
    section: 'III.1',
    sectionTitle: 'NĂNG LỰC VÀ KỸ NĂNG LÀM VIỆC',
    order: 1,
    content:
      'Chủ động nghiên cứu, cập nhật kịp thời các kiến thức pháp luật và văn bản chuyên môn nghiệp vụ; tham mưu đầy đủ, có chất lượng các văn bản phục vụ công tác chỉ đạo, điều hành của đơn vị theo chỉ đạo của lãnh đạo và chương trình, kế hoạch công tác.',
    maxPoints: 2,
  },
  {
    id: 'III.1.2',
    section: 'III.1',
    sectionTitle: 'NĂNG LỰC VÀ KỸ NĂNG LÀM VIỆC',
    order: 2,
    content:
      'Chủ động đề xuất giải pháp, thực hiện hiệu quả các công việc phát sinh; có khả năng phản ứng kịp thời, đáp ứng với yêu cầu, nhiệm vụ đột xuất.',
    maxPoints: 2,
  },
  {
    id: 'III.1.3',
    section: 'III.1',
    sectionTitle: 'NĂNG LỰC VÀ KỸ NĂNG LÀM VIỆC',
    order: 3,
    content: 'Sử dụng thành thạo các phần mềm, ứng dụng công nghệ thông tin đáp ứng yêu cầu công việc.',
    maxPoints: 2,
  },
  {
    id: 'III.1.4',
    section: 'III.1',
    sectionTitle: 'NĂNG LỰC VÀ KỸ NĂNG LÀM VIỆC',
    order: 4,
    content:
      'Phân công nhiệm vụ và điều phối công việc cho cấp dưới linh hoạt, có chỉ đạo, định hướng, hướng dẫn; lãnh đạo, quản lý điều hành, giám sát việc thực hiện nhiệm vụ của cơ quan, đơn vị, bộ phận đảm bảo kịp thời, không bỏ sót nhiệm vụ.',
    maxPoints: 2,
  },
  {
    id: 'III.1.5',
    section: 'III.1',
    sectionTitle: 'NĂNG LỰC VÀ KỸ NĂNG LÀM VIỆC',
    order: 5,
    content:
      'Có năng lực tập hợp viên chức và lao động hợp đồng, xây dựng cơ quan, đơn vị đoàn kết, thống nhất; phối hợp, tạo lập mối quan hệ tốt với cá nhân, cơ quan, đơn vị có liên quan trong thực hiện nhiệm vụ.',
    maxPoints: 2,
  },

  // NHÓM III.2: KẾT QUẢ THỰC HIỆN NHIỆM VỤ ĐƯỢC GIAO (60 ĐIỂM)
  {
    id: 'III.2.1',
    section: 'III.2',
    sectionTitle: 'KẾT QUẢ THỰC HIỆN NHIỆM VỤ ĐƯỢC GIAO',
    order: 1,
    content:
      'Quán triệt, thể chế hóa và thực hiện chủ trương, đường lối của Đảng, chính sách, pháp luật của Nhà nước tại đơn vị:\n- Thực hiện tốt: 2,5 điểm\n- Có thực hiện đầy đủ: 2,0 điểm\n- Có thực hiện nhưng chưa đầy đủ: 1 điểm\n- Không thực hiện: 0 điểm',
    maxPoints: 2.5,
  },
  {
    id: 'III.2.2',
    section: 'III.2',
    sectionTitle: 'KẾT QUẢ THỰC HIỆN NHIỆM VỤ ĐƯỢC GIAO',
    order: 2,
    content:
      'Duy trì kỷ luật, kỷ cương trong cơ quan, đơn vị; không để xảy ra các vụ việc, vụ vi phạm pháp luật phải xử lý, tình trạng khiếu nại tố cáo kéo dài; phòng chống tham nhũng, lãng phí trong phạm vi đơn vị:\n- Thực hiện tốt: 2,5 điểm\n- Có thực hiện đầy đủ: 2,0 điểm\n- Có thực hiện nhưng chưa đầy đủ: 1 điểm\n- Không thực hiện: 0 điểm',
    maxPoints: 2.5,
  },
  {
    id: 'III.2.3',
    section: 'III.2',
    sectionTitle: 'KẾT QUẢ THỰC HIỆN NHIỆM VỤ ĐƯỢC GIAO',
    order: 3,
    content:
      'Lãnh đạo, chỉ đạo, tổ chức kiểm tra, thanh tra, giám sát, giải quyết khiếu nại tố cáo theo thẩm quyền; chỉ đạo thực hiện công tác cải cách hành chính, cải cách chế độ công vụ, công chức tại đơn vị:\n- Thực hiện tốt: 2,5 điểm\n- Có thực hiện đầy đủ: 2,0 điểm\n- Có thực hiện nhưng chưa đầy đủ: 1 điểm\n- Không thực hiện: 0 điểm',
    maxPoints: 2.5,
  },
  {
    id: 'III.2.4',
    section: 'III.2',
    sectionTitle: 'KẾT QUẢ THỰC HIỆN NHIỆM VỤ ĐƯỢC GIAO',
    order: 4,
    content:
      'Xây dựng chương trình, kế hoạch hoạt động hàng năm của đơn vị được giao quản lý phụ trách, trong đó xác định rõ kết quả thực hiện các chỉ tiêu, nhiệm vụ, lượng hóa bằng sản phẩm cụ thể:\n- Thực hiện tốt: 2,5 điểm\n- Có thực hiện đầy đủ: 2,0 điểm\n- Có thực hiện nhưng chưa đầy đủ: 1 điểm\n- Không thực hiện: 0 điểm',
    maxPoints: 2.5,
  },
  {
    id: 'III.2.5',
    section: 'III.2',
    sectionTitle: 'KẾT QUẢ THỰC HIỆN NHIỆM VỤ ĐƯỢC GIAO',
    order: 5,
    content:
      'Các tiêu chí về kết quả thực hiện nhiệm vụ được giao hoặc theo hợp đồng làm việc đã ký kết:\n- Thực hiện hoàn thành đúng tiến độ, bảo đảm chất lượng, hiệu quả cao: 40 điểm\n- Thực hiện hoàn thành đúng tiến độ, bảo đảm chất lượng, hiệu quả: 30 điểm\n- Thực hiện hoàn thành, trong đó có không quá 20% tiêu chí chưa đảm bảo chất lượng, tiến độ hoặc hiệu quả thấp: 20 điểm\n- Có trên 50% các tiêu chí về kết quả thực hiện nhiệm vụ chưa đảm bảo tiến độ, chất lượng, hiệu quả: 10 điểm',
    maxPoints: 40,
  },
  {
    id: 'III.2.6',
    section: 'III.2',
    sectionTitle: 'KẾT QUẢ THỰC HIỆN NHIỆM VỤ ĐƯỢC GIAO',
    order: 6,
    content:
      'Lãnh đạo, chỉ đạo, điều hành đơn vị:\n- Hoàn thành tất cả các chỉ tiêu, nhiệm vụ trong đó ít nhất 50% chỉ tiêu, nhiệm vụ hoàn thành vượt mức: 5 điểm\n- Hoàn thành tất cả các chỉ tiêu, nhiệm vụ trong đó ít nhất 80% hoàn thành đúng tiến độ, bảo đảm chất lượng: 4 điểm\n- Hoàn thành trên 70% các chỉ tiêu, nhiệm vụ: 3 điểm\n- Hoàn thành dưới 50% chỉ tiêu, nhiệm vụ: 0 điểm',
    maxPoints: 5,
  },
  {
    id: 'III.2.7',
    section: 'III.2',
    sectionTitle: 'KẾT QUẢ THỰC HIỆN NHIỆM VỤ ĐƯỢC GIAO',
    order: 7,
    content:
      'Cơ quan, tổ chức thuộc thẩm quyền phụ trách, quản lý trực tiếp thực hiện nhiệm vụ trong năm:\n- 100% được đánh giá hoàn thành nhiệm vụ trở lên, trong đó ít nhất 70% hoàn thành tốt nhiệm vụ trở lên: 5 điểm\n- 100% được đánh giá hoàn thành nhiệm vụ trở lên: 4 điểm\n- Ít nhất 70% được đánh giá hoàn thành nhiệm vụ trở lên: 3 điểm\n- Liên quan đến tham ô, tham nhũng, lãng phí và bị xử lý theo quy định của pháp luật: 0 điểm',
    maxPoints: 5,
  },
];

export const MANAGER_KPI_CRITERIA = BGH_KPI_CRITERIA;

/**
 * CẤU TRÚC ĐIỂM KPI NHÂN VIÊN CHUẨN THPT PHƯƠNG XÁ (2026-2027)
 * Căn cứ trực tiếp theo file: "KPI_Nhan_vien_THPT_Phương xá(1).pdf"
 * Cấu trúc điểm: 30 điểm KPI chung + 70 điểm KPI theo đúng vị trí việc làm.
 * Chỉ kích hoạt một bộ KPI vị trí cho mỗi nhân viên. Tổng điểm tối đa = 100 điểm.
 */

// A. KPI CHUNG – 30 ĐIỂM (Đúng 7 tiêu chí NV-A1 đến NV-C1 theo file PDF)
export const STAFF_GENERAL_KPI_CRITERIA: KpiCriterionItem[] = [
  {
    id: 'NV-A1',
    section: 'A',
    sectionTitle: 'A. KPI CHUNG – 30 ĐIỂM',
    order: 1,
    content: 'Chấp hành chủ trương, pháp luật, quy định; trung thực, đoàn kết, có ý thức phục vụ',
    maxPoints: 5,
    groupTitle: 'Chấp hành & Phục vụ',
  },
  {
    id: 'NV-A2',
    section: 'A',
    sectionTitle: 'A. KPI CHUNG – 30 ĐIỂM',
    order: 2,
    content: 'Không tham ô, tiêu cực, lãng phí; giữ gìn uy tín và tài sản của nhà trường',
    maxPoints: 5,
    groupTitle: 'Uy tín & Tài sản',
  },
  {
    id: 'NV-B1',
    section: 'A',
    sectionTitle: 'A. KPI CHUNG – 30 ĐIỂM',
    order: 3,
    content: 'Chấp hành thời gian, phân công, nội quy và quy chế làm việc',
    maxPoints: 4,
    groupTitle: 'Thời gian & Quy chế',
  },
  {
    id: 'NV-B2',
    section: 'A',
    sectionTitle: 'A. KPI CHUNG – 30 ĐIỂM',
    order: 4,
    content: 'Báo cáo đầy đủ, chính xác; phối hợp với đồng nghiệp và bộ phận liên quan',
    maxPoints: 4,
    groupTitle: 'Báo cáo & Phối hợp',
  },
  {
    id: 'NV-B3',
    section: 'A',
    sectionTitle: 'A. KPI CHUNG – 30 ĐIỂM',
    order: 5,
    content: 'Sử dụng hiệu quả thời gian; giữ nơi làm việc gọn gàng, an toàn, tiết kiệm',
    maxPoints: 4,
    groupTitle: 'Nơi làm việc & Tiết kiệm',
  },
  {
    id: 'NV-B4',
    section: 'A',
    sectionTitle: 'A. KPI CHUNG – 30 ĐIỂM',
    order: 6,
    content: 'Thực hiện nhiệm vụ đột xuất và các công việc khác do lãnh đạo phân công',
    maxPoints: 4,
    groupTitle: 'Nhiệm vụ đột xuất',
  },
  {
    id: 'NV-C1',
    section: 'A',
    sectionTitle: 'A. KPI CHUNG – 30 ĐIỂM',
    order: 7,
    content: 'Năng lực chuyên môn theo vị trí việc làm; sử dụng phần mềm, ứng dụng phục vụ công việc',
    maxPoints: 4,
    groupTitle: 'Chuyên môn & Phần mềm',
  },
];

// B. KPI VỊ TRÍ VIỆC LÀM (70 ĐIỂM) - Đúng 8 vị trí việc làm trong file mẫu

// 1. Kế toán (70 điểm - NVKT-1 đến NVKT-7)
export const ACCOUNTANT_POSITION_CRITERIA: KpiCriterionItem[] = [
  {
    id: 'NVKT-1',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: KẾ TOÁN – 70 ĐIỂM',
    order: 1,
    content: 'Chứng từ, sổ sách, hồ sơ kế toán đầy đủ; trình ký đúng quy trình',
    maxPoints: 12,
  },
  {
    id: 'NVKT-2',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: KẾ TOÁN – 70 ĐIỂM',
    order: 2,
    content: 'Tham mưu kịp thời chế độ đối với CBGVNV; theo dõi dự toán được duyệt',
    maxPoints: 10,
  },
  {
    id: 'NVKT-3',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: KẾ TOÁN – 70 ĐIỂM',
    order: 3,
    content: 'Công khai tài chính định kỳ; báo cáo tháng/quý và đối chiếu đúng hạn',
    maxPoints: 10,
  },
  {
    id: 'NVKT-4',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: KẾ TOÁN – 70 ĐIỂM',
    order: 4,
    content: 'Theo dõi tài sản, kiểm kê học kỳ/năm; hồ sơ bảo quản đầy đủ',
    maxPoints: 10,
  },
  {
    id: 'NVKT-5',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: KẾ TOÁN – 70 ĐIỂM',
    order: 5,
    content: 'Đối chiếu thu-chi hằng tháng; hướng dẫn hồ sơ quyết toán của các bộ phận',
    maxPoints: 8,
  },
  {
    id: 'NVKT-6',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: KẾ TOÁN – 70 ĐIỂM',
    order: 6,
    content: 'Hạn chế tối đa sai sót; bảo mật hồ sơ, dữ liệu, chứng từ',
    maxPoints: 8,
  },
  {
    id: 'NVKT-7',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: KẾ TOÁN – 70 ĐIỂM',
    order: 7,
    content: 'Hoàn thành nhiệm vụ tài chính phát sinh/đột xuất đúng yêu cầu',
    maxPoints: 12,
  },
];

// 2. Thủ quỹ (70 điểm - NVTQ-1 đến NVTQ-7)
export const TREASURER_POSITION_CRITERIA: KpiCriterionItem[] = [
  {
    id: 'NVTQ-1',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: THỦ QUỸ – 70 ĐIỂM',
    order: 1,
    content: 'Thu, chi đúng chứng từ và phê duyệt; không chi khi chưa được phép',
    maxPoints: 12,
  },
  {
    id: 'NVTQ-2',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: THỦ QUỸ – 70 ĐIỂM',
    order: 2,
    content: 'Lập sổ quỹ, chốt sổ hằng tháng, đối chiếu với kế toán đúng hạn',
    maxPoints: 12,
  },
  {
    id: 'NVTQ-3',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: THỦ QUỸ – 70 ĐIỂM',
    order: 3,
    content: 'Báo cáo Hiệu trưởng định kỳ về các khoản thu chi ngân sách và ngoài ngân sách',
    maxPoints: 10,
  },
  {
    id: 'NVTQ-4',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: THỦ QUỸ – 70 ĐIỂM',
    order: 4,
    content: 'Lưu trữ chứng từ, hồ sơ thu-chi đầy đủ, dễ kiểm tra',
    maxPoints: 8,
  },
  {
    id: 'NVTQ-5',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: THỦ QUỸ – 70 ĐIỂM',
    order: 5,
    content: 'Bảo đảm an toàn tiền mặt; không để thất thoát do chủ quan',
    maxPoints: 10,
  },
  {
    id: 'NVTQ-6',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: THỦ QUỸ – 70 ĐIỂM',
    order: 6,
    content: 'Phối hợp kế toán thu, nộp các khoản phí đúng quy định',
    maxPoints: 8,
  },
  {
    id: 'NVTQ-7',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: THỦ QUỸ – 70 ĐIỂM',
    order: 7,
    content: 'Hoàn thành nhiệm vụ thu-chi, kiểm kê, đối soát phát sinh đúng yêu cầu',
    maxPoints: 10,
  },
];

// 3. Văn thư (70 điểm - NVVT-1 đến NVVT-7)
export const CLERK_POSITION_CRITERIA: KpiCriterionItem[] = [
  {
    id: 'NVVT-1',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: VĂN THƯ – 70 ĐIỂM',
    order: 1,
    content: 'Tiếp nhận, vào sổ, phân loại, chuyển văn bản kịp thời đến đúng bộ phận',
    maxPoints: 12,
  },
  {
    id: 'NVVT-2',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: VĂN THƯ – 70 ĐIỂM',
    order: 2,
    content: 'Kiểm tra thể thức trước khi trình ký; phát hành đúng quy trình',
    maxPoints: 12,
  },
  {
    id: 'NVVT-3',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: VĂN THƯ – 70 ĐIỂM',
    order: 3,
    content: 'Bảo quản hồ sơ đầy đủ; sắp xếp, lưu trữ dễ tìm, không tự ý cho mượn',
    maxPoints: 12,
  },
  {
    id: 'NVVT-4',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: VĂN THƯ – 70 ĐIỂM',
    order: 4,
    content: 'Bảo quản và sử dụng con dấu đúng quy định, đúng thẩm quyền',
    maxPoints: 10,
  },
  {
    id: 'NVVT-5',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: VĂN THƯ – 70 ĐIỂM',
    order: 5,
    content: 'Chuyển tải thông tin, báo cáo kịp thời; bảo đảm bí mật hồ sơ',
    maxPoints: 8,
  },
  {
    id: 'NVVT-6',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: VĂN THƯ – 70 ĐIỂM',
    order: 6,
    content: 'Cập nhật dữ liệu, văn bản điện tử chính xác, đúng thời hạn',
    maxPoints: 6,
  },
  {
    id: 'NVVT-7',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: VĂN THƯ – 70 ĐIỂM',
    order: 7,
    content: 'Hoàn thành công tác văn thư phát sinh, hội họp, hồ sơ theo phân công',
    maxPoints: 10,
  },
];

// 4. Nhân viên Y tế (70 điểm - NVYT-1 đến NVYT-7)
export const NURSE_POSITION_CRITERIA: KpiCriterionItem[] = [
  {
    id: 'NVYT-1',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: NHÂN VIÊN Y TẾ – 70 ĐIỂM',
    order: 1,
    content: 'Trực phòng y tế; khám sức khỏe ban đầu, cấp thuốc/sơ cứu theo quy định',
    maxPoints: 12,
  },
  {
    id: 'NVYT-2',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: NHÂN VIÊN Y TẾ – 70 ĐIỂM',
    order: 2,
    content: 'Phát hiện, báo ngay lãnh đạo khi học sinh bệnh nặng/tai nạn; phối hợp xử lý',
    maxPoints: 10,
  },
  {
    id: 'NVYT-3',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: NHÂN VIÊN Y TẾ – 70 ĐIỂM',
    order: 3,
    content: 'Đầy đủ hồ sơ, sổ sách, cơ số thuốc và trang thiết bị theo quy định',
    maxPoints: 10,
  },
  {
    id: 'NVYT-4',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: NHÂN VIÊN Y TẾ – 70 ĐIỂM',
    order: 4,
    content: 'Lập kế hoạch và báo cáo tháng, học kỳ, năm đúng hạn',
    maxPoints: 10,
  },
  {
    id: 'NVYT-5',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: NHÂN VIÊN Y TẾ – 70 ĐIỂM',
    order: 5,
    content: 'Theo dõi hồ sơ BHYT/BHTN; chăm sóc sức khỏe học sinh và CBGVNV',
    maxPoints: 10,
  },
  {
    id: 'NVYT-6',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: NHÂN VIÊN Y TẾ – 70 ĐIỂM',
    order: 6,
    content: 'Giám sát vệ sinh trường học, phối hợp hoạt động chăm sóc sức khỏe',
    maxPoints: 8,
  },
  {
    id: 'NVYT-7',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: NHÂN VIÊN Y TẾ – 70 ĐIỂM',
    order: 7,
    content: 'Hoàn thành nhiệm vụ y tế phát sinh/đột xuất theo phân công',
    maxPoints: 10,
  },
];

// 5. Bảo vệ (70 điểm - NVBV-1 đến NVBV-7)
export const SECURITY_POSITION_CRITERIA: KpiCriterionItem[] = [
  {
    id: 'NVBV-1',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: BẢO VỆ – 70 ĐIỂM',
    order: 1,
    content: 'Thực hiện đúng ca trực theo phân công; bảo đảm giờ giấc trực',
    maxPoints: 12,
  },
  {
    id: 'NVBV-2',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: BẢO VỆ – 70 ĐIỂM',
    order: 2,
    content: 'Quan sát, ghi nhận diễn biến bất thường; báo cáo kịp thời',
    maxPoints: 12,
  },
  {
    id: 'NVBV-3',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: BẢO VỆ – 70 ĐIỂM',
    order: 3,
    content: 'Hướng dẫn khách, kiểm soát ra vào và bố trí phương tiện theo quy định',
    maxPoints: 10,
  },
  {
    id: 'NVBV-4',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: BẢO VỆ – 70 ĐIỂM',
    order: 4,
    content: 'Phòng ngừa mất mát, hư hỏng; phát hiện và báo cáo nguy cơ',
    maxPoints: 12,
  },
  {
    id: 'NVBV-5',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: BẢO VỆ – 70 ĐIỂM',
    order: 5,
    content: 'Thực hiện yêu cầu PCCC, phối hợp xử lý tình huống an toàn',
    maxPoints: 8,
  },
  {
    id: 'NVBV-6',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: BẢO VỆ – 70 ĐIỂM',
    order: 6,
    content: 'Ghi chép ca trực, bàn giao đầy đủ, trung thực',
    maxPoints: 6,
  },
  {
    id: 'NVBV-7',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: BẢO VỆ – 70 ĐIỂM',
    order: 7,
    content: 'Hỗ trợ hội họp, sự kiện, xử lý tình huống phát sinh theo phân công',
    maxPoints: 10,
  },
];

// 6. Nhân viên Phục vụ/Vệ sinh (70 điểm - NVPV-1 đến NVPV-7)
export const CUSTODIAN_POSITION_CRITERIA: KpiCriterionItem[] = [
  {
    id: 'NVPV-1',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: NHÂN VIÊN PHỤC VỤ/VỆ SINH – 70 ĐIỂM',
    order: 1,
    content: 'Vệ sinh phòng lãnh đạo, phòng họp, khuôn viên, công trình vệ sinh theo phân công',
    maxPoints: 15,
  },
  {
    id: 'NVPV-2',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: NHÂN VIÊN PHỤC VỤ/VỆ SINH – 70 ĐIỂM',
    order: 2,
    content: 'Thực hiện vệ sinh đúng lịch, bảo đảm sạch sẽ, gọn gàng',
    maxPoints: 12,
  },
  {
    id: 'NVPV-3',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: NHÂN VIÊN PHỤC VỤ/VỆ SINH – 70 ĐIỂM',
    order: 3,
    content: 'Sử dụng, bảo quản dụng cụ và vật tư vệ sinh tiết kiệm',
    maxPoints: 8,
  },
  {
    id: 'NVPV-4',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: NHÂN VIÊN PHỤC VỤ/VỆ SINH – 70 ĐIỂM',
    order: 4,
    content: 'Thực hiện yêu cầu an toàn, PCCC, tiết kiệm điện nước',
    maxPoints: 10,
  },
  {
    id: 'NVPV-5',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: NHÂN VIÊN PHỤC VỤ/VỆ SINH – 70 ĐIỂM',
    order: 5,
    content: 'Chuẩn bị phòng, cơ sở phục vụ các cuộc họp/sự kiện theo phân công',
    maxPoints: 10,
  },
  {
    id: 'NVPV-6',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: NHÂN VIÊN PHỤC VỤ/VỆ SINH – 70 ĐIỂM',
    order: 6,
    content: 'Kịp thời báo hỏng hóc, mất an toàn, thiếu vật tư cho người phụ trách',
    maxPoints: 5,
  },
  {
    id: 'NVPV-7',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: NHÂN VIÊN PHỤC VỤ/VỆ SINH – 70 ĐIỂM',
    order: 7,
    content: 'Hoàn thành nhiệm vụ phát sinh theo phân công',
    maxPoints: 10,
  },
];

// 7. Thư viện (70 điểm - NVTV-1 đến NVTV-7)
export const LIBRARY_POSITION_CRITERIA: KpiCriterionItem[] = [
  {
    id: 'NVTV-1',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: THƯ VIỆN – 70 ĐIỂM',
    order: 1,
    content: 'Lập thư mục, sắp xếp, bảo quản sách; thực hiện đầy đủ sổ sách thư viện',
    maxPoints: 12,
  },
  {
    id: 'NVTV-2',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: THƯ VIỆN – 70 ĐIỂM',
    order: 2,
    content: 'Quản lý thẻ, thời gian mượn-trả, ký nhận; thu hồi sách cuối năm',
    maxPoints: 10,
  },
  {
    id: 'NVTV-3',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: THƯ VIỆN – 70 ĐIỂM',
    order: 3,
    content: 'Kiểm tra sách báo; lập danh mục mất, hỏng, cần thanh lý',
    maxPoints: 10,
  },
  {
    id: 'NVTV-4',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: THƯ VIỆN – 70 ĐIỂM',
    order: 4,
    content: 'Lập kế hoạch, nội quy phòng đọc; phối hợp phát triển văn hóa đọc',
    maxPoints: 10,
  },
  {
    id: 'NVTV-5',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: THƯ VIỆN – 70 ĐIỂM',
    order: 5,
    content: 'Cập nhật sách chuyên môn, giới thiệu sách mới, bài viết phù hợp',
    maxPoints: 8,
  },
  {
    id: 'NVTV-6',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: THƯ VIỆN – 70 ĐIỂM',
    order: 6,
    content: 'Báo cáo lượt đọc, mượn, tình hình sách và bổ sung hằng tháng',
    maxPoints: 10,
  },
  {
    id: 'NVTV-7',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: THƯ VIỆN – 70 ĐIỂM',
    order: 7,
    content: 'Hoàn thành mua/bổ sung sách và nhiệm vụ thư viện theo phân công',
    maxPoints: 10,
  },
];

// 8. Thiết bị (70 điểm - NVTB-1 đến NVTB-7)
export const EQUIPMENT_POSITION_CRITERIA: KpiCriterionItem[] = [
  {
    id: 'NVTB-1',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: THIẾT BỊ – 70 ĐIỂM',
    order: 1,
    content: 'Sắp xếp, bảo quản thiết bị an toàn, dễ tìm; hồ sơ quản lý đầy đủ',
    maxPoints: 12,
  },
  {
    id: 'NVTB-2',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: THIẾT BỊ – 70 ĐIỂM',
    order: 2,
    content: 'Phục vụ giáo viên mượn/trả thiết bị; theo dõi tình trạng sử dụng',
    maxPoints: 10,
  },
  {
    id: 'NVTB-3',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: THIẾT BỊ – 70 ĐIỂM',
    order: 3,
    content: 'Bảo đảm chuẩn bị thiết bị phục vụ các tiết thực hành theo kế hoạch',
    maxPoints: 12,
  },
  {
    id: 'NVTB-4',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: THIẾT BỊ – 70 ĐIỂM',
    order: 4,
    content: 'Lập danh mục cần bổ sung, thay thế, thanh lý; kiểm kê đúng kỳ',
    maxPoints: 10,
  },
  {
    id: 'NVTB-5',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: THIẾT BỊ – 70 ĐIỂM',
    order: 5,
    content: 'Báo cáo tình hình sử dụng, bảo quản thiết bị và thực hành hằng tháng',
    maxPoints: 10,
  },
  {
    id: 'NVTB-6',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: THIẾT BỊ – 70 ĐIỂM',
    order: 6,
    content: 'Đề xuất giải pháp phát huy hiệu quả thiết bị, thí nghiệm',
    maxPoints: 6,
  },
  {
    id: 'NVTB-7',
    section: 'B',
    sectionTitle: 'B. KPI VỊ TRÍ VIỆC LÀM: THIẾT BỊ – 70 ĐIỂM',
    order: 7,
    content: 'Hoàn thành chuẩn bị thiết bị, hỗ trợ sự kiện/thực hành phát sinh',
    maxPoints: 10,
  },
];

export interface StaffPositionDefinition {
  key: string;
  name: string;
  shortLabel: string;
  points: number;
  criteria: KpiCriterionItem[];
  codePrefix: string;
  description: string;
  defaultPositionTitle: string;
}

export const OFFICIAL_STAFF_POSITIONS: StaffPositionDefinition[] = [
  {
    key: 'ketoan',
    name: 'Kế toán',
    shortLabel: 'Kế toán (70đ)',
    points: 70,
    criteria: ACCOUNTANT_POSITION_CRITERIA,
    codePrefix: 'NVKT',
    description: 'Quản lý tài chính, dự toán ngân sách, tiền lương, báo cáo tài chính Kho bạc và tài sản công.',
    defaultPositionTitle: 'Kế toán trưởng',
  },
  {
    key: 'thuquy',
    name: 'Thủ quỹ',
    shortLabel: 'Thủ quỹ (70đ)',
    points: 70,
    criteria: TREASURER_POSITION_CRITERIA,
    codePrefix: 'NVTQ',
    description: 'Quản lý an toàn quỹ tiền mặt, thu chi đúng chứng từ và phê duyệt, lập sổ quỹ và đối chiếu định kỳ.',
    defaultPositionTitle: 'Thủ quỹ',
  },
  {
    key: 'vanthu',
    name: 'Văn thư',
    shortLabel: 'Văn thư (70đ)',
    points: 70,
    criteria: CLERK_POSITION_CRITERIA,
    codePrefix: 'NVVT',
    description: 'Tiếp nhận, xử lý văn bản đi/đến, quản lý con dấu, hồ sơ lưu trữ và công nghệ văn bản điện tử.',
    defaultPositionTitle: 'Văn thư - Lưu trữ',
  },
  {
    key: 'yte',
    name: 'Nhân viên Y tế',
    shortLabel: 'Nhân viên Y tế (70đ)',
    points: 70,
    criteria: NURSE_POSITION_CRITERIA,
    codePrefix: 'NVYT',
    description: 'Chăm sóc sức khỏe, sơ cấp cứu ban đầu, quản lý tủ thuốc, hồ sơ BHYT và phòng chống dịch bệnh.',
    defaultPositionTitle: 'Cán bộ Y tế học đường',
  },
  {
    key: 'baove',
    name: 'Bảo vệ',
    shortLabel: 'Bảo vệ (70đ)',
    points: 70,
    criteria: SECURITY_POSITION_CRITERIA,
    codePrefix: 'NVBV',
    description: 'Trực ca 24/24, kiểm soát an ninh trật tự, trông giữ xe, tuần tra đêm và thực hiện PCCC.',
    defaultPositionTitle: 'Nhân viên Bảo vệ trường',
  },
  {
    key: 'phucvu',
    name: 'Nhân viên Phục vụ/Vệ sinh',
    shortLabel: 'Phục vụ/Vệ sinh (70đ)',
    points: 70,
    criteria: CUSTODIAN_POSITION_CRITERIA,
    codePrefix: 'NVPV',
    description: 'Vệ sinh phòng lãnh đạo, phòng học, khử khuẩn nhà vệ sinh, phục vụ nước uống và hội nghị.',
    defaultPositionTitle: 'Nhân viên Phục vụ/Vệ sinh',
  },
  {
    key: 'thuvien',
    name: 'Thư viện',
    shortLabel: 'Thư viện (70đ)',
    points: 70,
    criteria: LIBRARY_POSITION_CRITERIA,
    codePrefix: 'NVTV',
    description: 'Quản lý sổ sách thư viện, phục vụ mượn trả sách, tổ chức ngày hội đọc và phát triển văn hóa đọc.',
    defaultPositionTitle: 'Nhân viên Thư viện',
  },
  {
    key: 'thietbi',
    name: 'Thiết bị',
    shortLabel: 'Thiết bị (70đ)',
    points: 70,
    criteria: EQUIPMENT_POSITION_CRITERIA,
    codePrefix: 'NVTB',
    description: 'Quản lý phòng bộ môn, chuẩn bị thiết bị thí nghiệm phục vụ tiết thực hành và bảo dưỡng tài sản.',
    defaultPositionTitle: 'Nhân viên Thiết bị',
  },
];

/**
 * 6 NGUYÊN TẮC CHẤM VÀ TỔNG HỢP (PHẦN C - Chuẩn theo file PDF mẫu)
 */
export const KPI_OFFICE_PRINCIPLES: string[] = [
  '1. Tổng điểm tối đa = 100 điểm: 30 điểm KPI chung + 70 điểm KPI vị trí việc làm.',
  '2. Chỉ kích hoạt một bộ KPI vị trí cho mỗi nhân viên; không yêu cầu nhân viên thực hiện KPI của vị trí khác.',
  '3. Nếu một nhiệm vụ không được giao hoặc không phát sinh theo vị trí việc làm, đánh dấu N/A và không quy thành lỗi; nhà trường chuẩn hóa lại tổng điểm theo các KPI áp dụng.',
  '4. Điểm KPI là công cụ quản trị nội bộ; việc đánh giá, xếp loại viên chức vẫn thực hiện theo quy định và thẩm quyền hiện hành.',
  '5. Khi đánh giá phải có minh chứng phù hợp; ưu tiên tiến độ, chất lượng, hiệu quả và mức độ hoàn thành thực chất, không chạy theo số lượng.',
  '6. Với vi phạm, điểm trừ chỉ thực hiện theo quy định KPI đã được nhà trường ban hành; không tự ý trừ điểm ngoài khung.',
];

/**
 * Nhận diện key vị trí việc làm dựa trên chức vụ hoặc tên
 */
export function detectStaffPositionKey(positionStr: string): string {
  const norm = (positionStr || '').toLowerCase();
  if (norm.includes('kế toán') || norm === 'ketoan') return 'ketoan';
  if (norm.includes('thủ quỹ') || norm === 'thuquy') return 'thuquy';
  if (norm.includes('văn thư') || norm.includes('lưu trữ') || norm === 'vanthu') return 'vanthu';
  if (norm.includes('y tế') || norm.includes('bác sĩ') || norm === 'yte') return 'yte';
  if (norm.includes('bảo vệ') || norm === 'baove') return 'baove';
  if (norm.includes('phục vụ') || norm.includes('vệ sinh') || norm.includes('lao công') || norm === 'phucvu') return 'phucvu';
  if (norm.includes('thư viện') || norm === 'thuvien') return 'thuvien';
  if (norm.includes('thiết bị') || norm.includes('thí nghiệm') || norm === 'thietbi') return 'thietbi';
  // Mặc định kế toán nếu không nhận diện được
  return 'ketoan';
}

/**
 * Lấy trọn vẹn bộ tiêu chí KPI Nhân viên: 30 điểm Chung + 70 điểm Vị trí việc làm = 100 điểm
 */
export function getOfficialStaffCriteria(positionOrKey: string): {
  generalCriteria: KpiCriterionItem[];
  positionCriteria: KpiCriterionItem[];
  allCriteria: KpiCriterionItem[];
  positionDef: StaffPositionDefinition;
} {
  const key = detectStaffPositionKey(positionOrKey);
  const positionDef = OFFICIAL_STAFF_POSITIONS.find((p) => p.key === key) || OFFICIAL_STAFF_POSITIONS[0];
  const allCriteria = [...STAFF_GENERAL_KPI_CRITERIA, ...positionDef.criteria];

  return {
    generalCriteria: STAFF_GENERAL_KPI_CRITERIA,
    positionCriteria: positionDef.criteria,
    allCriteria,
    positionDef,
  };
}

// Giữ lại alias tương thích ngược
export const STAFF_KPI_CRITERIA = [...STAFF_GENERAL_KPI_CRITERIA, ...ACCOUNTANT_POSITION_CRITERIA];
export const EQUIPMENT_STAFF_KPI_CRITERIA = [...STAFF_GENERAL_KPI_CRITERIA, ...EQUIPMENT_POSITION_CRITERIA];
export const LIBRARY_STAFF_KPI_CRITERIA = [...STAFF_GENERAL_KPI_CRITERIA, ...LIBRARY_POSITION_CRITERIA];
export const ACCOUNTANT_STAFF_KPI_CRITERIA = [...STAFF_GENERAL_KPI_CRITERIA, ...ACCOUNTANT_POSITION_CRITERIA];

export function getStaffCriteriaByPosition(positionOrKey: string): KpiCriterionItem[] {
  return getOfficialStaffCriteria(positionOrKey).allCriteria;
}

/**
 * 6 Quy tắc chấm điểm đề xuất chuẩn theo văn bản gửi kèm
 */
export const KPI_EVALUATION_RULES: string[] = [
  '1. Giáo viên / Nhân viên tự chấm dựa trên kết quả thực hiện thực tế và minh chứng; không tự chấm chỉ dựa vào cảm nhận.',
  '2. Mỗi nhiệm vụ được chấm trong phạm vi điểm tối đa của dòng đó; không cộng vượt 100 điểm.',
  '3. Nhiệm vụ không được giao hoặc không phát sinh theo vị trí việc làm được đánh dấu “N/A – Không áp dụng”, không quy về 0 điểm; tổng điểm được chuẩn hóa theo các nhiệm vụ áp dụng.',
  '4. Kết quả học tập của học sinh chỉ là một nguồn minh chứng cho chất lượng và sự tiến bộ, không sử dụng điểm thi/điểm trung bình của học sinh làm tiêu chí duy nhất để quy trách nhiệm cho giáo viên.',
  '5. Nhiệm vụ chủ nhiệm/kiêm nhiệm chỉ áp dụng đối với giáo viên được phân công.',
  '6. Khi có vi phạm nghiêm trọng, việc xử lý điểm phải căn cứ quy định của nhà trường và quy định hiện hành; không tự động suy diễn từ một chỉ số đơn lẻ.',
];

/**
 * Gợi ý xếp loại KPI nội bộ (CẦN NHÀ TRƯỜNG XÁC NHẬN)
 */
export const KPI_RANKING_GUIDE = [
  { min: 0, max: 70, label: 'Chưa hoàn thành', desc: 'Dưới 70 điểm', color: 'rose' },
  { min: 70, max: 85, label: 'Hoàn thành', desc: '70 đến dưới 85 điểm', color: 'amber' },
  { min: 85, max: 95, label: 'Hoàn thành tốt', desc: '85 đến dưới 95 điểm', color: 'blue' },
  { min: 95, max: 100, label: 'Hoàn thành xuất sắc', desc: '95 đến 100 điểm', color: 'emerald' },
];

export function calculateKpiRank(score: number): 'Chưa hoàn thành' | 'Hoàn thành' | 'Hoàn thành tốt' | 'Hoàn thành xuất sắc' {
  if (score >= 95) return 'Hoàn thành xuất sắc';
  if (score >= 85) return 'Hoàn thành tốt';
  if (score >= 70) return 'Hoàn thành';
  return 'Chưa hoàn thành';
}

/**
 * Tính toán tổng điểm theo quy tắc chuẩn hóa Quy tắc 3
 */
export function computeTotalKpiScore(
  items: KpiCriterionItem[],
  scores: Record<string, { score: number; isNa?: boolean }>
): {
  rawScore: number;
  maxApplicable: number;
  normalizedScore: number;
  hasNa: boolean;
  sectionBreakdown: Record<string, { raw: number; max: number }>;
} {
  let rawScore = 0;
  let maxApplicable = 0;
  let hasNa = false;

  const sectionBreakdown: Record<string, { raw: number; max: number }> = {
    'I': { raw: 0, max: 0 },
    'II': { raw: 0, max: 0 },
    'III.1': { raw: 0, max: 0 },
    'III.2': { raw: 0, max: 0 },
    'A': { raw: 0, max: 0 },
    'B': { raw: 0, max: 0 },
  };

  items.forEach((item) => {
    if (!sectionBreakdown[item.section]) {
      sectionBreakdown[item.section] = { raw: 0, max: 0 };
    }
    // Dynamically sum maxPoints from the actual criteria list
    sectionBreakdown[item.section].max += item.maxPoints;

    const sc = scores[item.id];
    if (sc?.isNa) {
      hasNa = true;
    } else {
      maxApplicable += item.maxPoints;
      const given = Math.min(item.maxPoints, Math.max(0, sc ? sc.score : 0));
      rawScore += given;
      sectionBreakdown[item.section].raw += given;
    }
  });

  const normalizedScore =
    maxApplicable > 0
      ? Math.round((rawScore / maxApplicable) * 100 * 10) / 10
      : 0;

  return {
    rawScore: Math.round(rawScore * 10) / 10,
    maxApplicable: Math.round(maxApplicable * 10) / 10,
    normalizedScore: hasNa ? normalizedScore : Math.round(rawScore * 10) / 10,
    hasNa,
    sectionBreakdown,
  };
}

/**
 * Tự động kiểm tra cấu trúc tổng điểm KPI
 */
export function validateKpiCriteriaStructure(criteriaList: KpiCriterionItem[]): {
  isValid: boolean;
  totalMaxScore: number;
  sectionIII2MaxScore: number;
  errorMessage?: string;
} {
  let totalMaxScore = 0;
  let sectionIII2MaxScore = 0;

  criteriaList.forEach((crit) => {
    if (crit.status !== 'inactive') {
      const pts = Number(crit.maxPoints || 0);
      totalMaxScore += pts;
      if (crit.section === 'III.2') {
        sectionIII2MaxScore += pts;
      }
    }
  });

  totalMaxScore = Math.round(totalMaxScore * 10) / 10;
  sectionIII2MaxScore = Math.round(sectionIII2MaxScore * 10) / 10;

  const isTeacherKpi = criteriaList.some((c) => c.section === 'I' || c.section === 'III.2');

  if (isTeacherKpi) {
    if (sectionIII2MaxScore !== 60) {
      return {
        isValid: false,
        totalMaxScore,
        sectionIII2MaxScore,
        errorMessage: `Tổng điểm cấu hình của III.2 hiện là ${sectionIII2MaxScore}, chưa đủ 60; cần bổ sung ${60 - sectionIII2MaxScore} điểm theo cấu trúc phiếu.`,
      };
    }
    if (totalMaxScore !== 100) {
      return {
        isValid: false,
        totalMaxScore,
        sectionIII2MaxScore,
        errorMessage: `Cấu hình KPI chưa hợp lệ. Tổng điểm tối đa phải bằng 100 điểm (Hiện tại: ${totalMaxScore} điểm).`,
      };
    }
  }

  return {
    isValid: true,
    totalMaxScore,
    sectionIII2MaxScore,
  };
}

/**
 * Lấy danh sách tiêu chí mặc định theo đối tượng đánh giá (bgh, giaovien, nhanvien)
 */
export function getCriteriaForTarget(
  targetType: 'bgh' | 'giaovien' | 'nhanvien',
  position?: string
): KpiCriterionItem[] {
  if (targetType === 'bgh') {
    return BGH_KPI_CRITERIA;
  }
  if (targetType === 'nhanvien') {
    return getOfficialStaffCriteria(position || 'ketoan').allCriteria;
  }
  return TEACHER_KPI_CRITERIA;
}
