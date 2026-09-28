import React, { useState } from 'react';
import { useKpi } from '../context/KpiContext';
import {
  GraduationCap,
  Lock,
  User,
  ShieldCheck,
  Award,
  Briefcase,
  ArrowRight,
  Info,
  CheckCircle2,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, users, showToast, schoolConfig } = useKpi();

  const [username, setUsername] = useState('bgh_hieutruong');
  const [password, setPassword] = useState('123456');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim()) {
      setError('Vui lòng nhập tên đăng nhập');
      return;
    }
    const success = login(username, password);
    if (!success) {
      setError('Tên đăng nhập hoặc mật khẩu không đúng (Thử tài khoản mẫu bên dưới)');
    }
  };

  const handleSelectDemo = (userUsername: string) => {
    setUsername(userUsername);
    setPassword('123456');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Decorative background blurs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white shadow-xl mb-3 border border-blue-300/30">
            <GraduationCap className="w-9 h-9" />
          </div>
          <div className="text-xs uppercase tracking-widest text-blue-300 font-semibold mb-1">
            {schoolConfig.department}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-sm">
            {schoolConfig.fullName}
          </h1>
          <div className="inline-block mt-2 px-3 py-1 rounded-full bg-blue-800/60 border border-blue-500/40 text-blue-200 text-xs font-semibold tracking-wide shadow-sm">
            HỆ THỐNG QUẢN LÝ KPI
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-slate-800 mb-1 text-center">ĐĂNG NHẬP HỆ THỐNG</h2>
          <p className="text-xs text-slate-500 text-center mb-6">
            Dành cho Ban Giám hiệu, Cán bộ, Giáo viên và Nhân viên
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="login-username">
                Tên đăng nhập
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ví dụ: bgh_hieutruong, gv_nguyenana"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5" htmlFor="login-password">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mật khẩu"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Ghi nhớ tài khoản</span>
              </label>
              <a href="#demo" onClick={(e) => { e.preventDefault(); showToast('Vui lòng chọn tài khoản mẫu bên dưới để đăng nhập nhanh!', 'info'); }} className="text-blue-600 hover:underline">
                Quên mật khẩu?
              </a>
            </div>

            <button
              id="btn-login-submit"
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>Đăng nhập</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Accounts Selection */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
              <span>Tài khoản demo mẫu (Bấm để điền nhanh):</span>
              <span className="text-[10px] text-blue-600 lowercase font-normal">mật khẩu: 123456</span>
            </div>
            <div className="space-y-1.5">
              {users.map((u) => {
                const isSelected = username === u.username;
                let RoleIcon = User;
                let roleColor = 'text-blue-600 bg-blue-50';
                if (u.role === 'bgh') {
                  RoleIcon = ShieldCheck;
                  roleColor = 'text-amber-700 bg-amber-50';
                } else if (u.role === 'nhanvien') {
                  RoleIcon = Briefcase;
                  roleColor = 'text-emerald-700 bg-emerald-50';
                } else {
                  RoleIcon = Award;
                  roleColor = 'text-blue-700 bg-blue-50';
                }

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectDemo(u.username)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg border text-left text-xs transition cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/70 font-semibold ring-1 ring-blue-500'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded ${roleColor}`}>
                        <RoleIcon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800">{u.name}</span>
                        <span className="text-slate-400 text-[11px] ml-1">({u.position})</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">{u.username}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Required Text */}
        <div className="text-center mt-6">
          <p className="text-xs text-blue-200/90 font-medium">
            Quản lý KPI – {schoolConfig.normalName}
          </p>
          <p className="text-[11px] text-blue-300/60 mt-1">
            {schoolConfig.subLocation} • Năm học 2026 - 2027
          </p>
        </div>
      </div>
    </div>
  );
};
