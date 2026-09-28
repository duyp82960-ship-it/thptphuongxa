import React, { useState } from 'react';
import { KpiProvider, useKpi } from './context/KpiContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { CbqlGvNvDirectoryView } from './components/CbqlGvNvDirectoryView';
import { KpiModuleView } from './components/KpiModuleView';
import { IncidentEntryView } from './components/IncidentEntryView';
import { ReportsView } from './components/ReportsView';
import { DepartmentModuleView } from './components/DepartmentModuleView';
import { KpiEvaluationSheet } from './components/KpiEvaluationSheet';
import { StaffKpiModuleView } from './components/StaffKpiModuleView';
import { IncidentEntryModal } from './components/IncidentEntryModal';
import { PrintModal } from './components/PrintModal';
import { ToastContainer } from './components/Toast';
import { UiSettingsView } from './components/UiSettingsView';
import { LeaveManagementView } from './components/LeaveManagementView';
import { WorkScheduleView } from './components/WorkScheduleView';
import { DepartmentWorkScheduleView } from './components/DepartmentWorkScheduleView';
import { SchoolWorkScheduleView } from './components/SchoolWorkScheduleView';
import { School, MapPin, Phone, Mail, Award, ShieldCheck } from 'lucide-react';

const MainContent: React.FC = () => {
  const { currentUser, activeTab, schoolYear, schoolConfig } = useKpi();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!currentUser) {
    return (
      <>
        <LoginView />
        <ToastContainer />
      </>
    );
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'cbql-gv-nv':
        return <CbqlGvNvDirectoryView />;
      case 'bgh':
        return <KpiModuleView targetType="bgh" />;
      case 'giaovien':
        return <KpiModuleView targetType="giaovien" />;
      case 'kpi-nhanvien':
      case 'nhanvien':
        return <StaffKpiModuleView />;
      case 'to-hoa-sinh-cn':
        return <DepartmentModuleView key="to-hoa-sinh-cn" initialDeptName="Tổ Hóa - Sinh - CN" />;
      case 'to-toan-li-tin':
        return <DepartmentModuleView key="to-toan-li-tin" initialDeptName="Tổ Toán - Lí - Tin" />;
      case 'to-van-nn':
        return <DepartmentModuleView key="to-van-nn" initialDeptName="Tổ Văn - Ngoại ngữ" />;
      case 'to-su-dia':
        return <DepartmentModuleView key="to-su-dia" initialDeptName="Tổ Sử - Địa - KT&PL - TD - QPAN" />;
      case 'to-van-phong':
        return <DepartmentModuleView key="to-van-phong" initialDeptName="Tổ Văn phòng" />;
      case 'to-chuyen-mon':
        return <DepartmentModuleView />;
      case 'incident-entry':
        return <IncidentEntryView />;
      case 'leave-management':
      case 'nghi-phep':
        return <LeaveManagementView />;
      case 'lich-cong-tac':
      case 'work-schedule':
        return <WorkScheduleView />;
      case 'school-work-schedule':
      case 'lich-giao-viec-truong':
        return <SchoolWorkScheduleView />;
      case 'dept-work-schedule':
      case 'lich-giao-viec':
        return <DepartmentWorkScheduleView />;
      case 'kpi-evaluation':
        return <KpiEvaluationSheet />;
      case 'reports':
        return <ReportsView />;
      case 'ui-settings':
      case 'settings':
        return <UiSettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <Header
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Content Container */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {renderActiveView()}
          </main>

          {/* Official Footer */}
          <footer
            id="app-footer"
            className="bg-white border-t border-slate-200 mt-12 py-8 px-4 sm:px-8 text-xs text-slate-600 print:hidden"
          >
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2 font-bold text-blue-900 text-sm">
                  <School className="w-4 h-4 text-blue-700" />
                  <span>{schoolConfig.fullName}</span>
                </div>
                <p className="text-slate-500 leading-relaxed text-[11px]">
                  Hệ thống Quản lý và Đánh giá Thi đua KPI Cán bộ, Giáo viên, Nhân viên trực tuyến. Chuẩn hóa quy trình ghi nhận thành tích, minh chứng và thi đua nội bộ năm học {schoolYear}.
                </p>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="font-bold text-slate-800 text-xs mb-2">THÔNG TIN LIÊN HỆ</div>
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>{schoolConfig.subLocation}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Điện thoại văn phòng: {schoolConfig.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Email: {schoolConfig.email}</span>
                </div>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="font-bold text-slate-800 text-xs mb-2">CHÍNH SÁCH ĐÁNH GIÁ</div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Minh bạch thông tin & minh chứng số</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600">
                  <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Khích lệ nỗ lực đổi mới sáng tạo giảng dạy</span>
                </div>
                <div className="text-[10px] text-slate-400 pt-1">
                  © 2025 - 2026 Bản quyền thuộc {schoolConfig.normalName}. Phiên bản hệ thống v2.4 Pro.
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Floating Modals & Notifications */}
      <IncidentEntryModal />
      <PrintModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <KpiProvider>
      <MainContent />
    </KpiProvider>
  );
}
