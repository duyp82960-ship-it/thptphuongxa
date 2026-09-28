import React from 'react';
import { useKpi } from '../context/KpiContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast } = useKpi();

  if (!toast) return null;

  const getStyle = () => {
    switch (toast.type) {
      case 'success':
        return {
          bg: 'bg-slate-900/95 text-white border-emerald-500/50',
          icon: CheckCircle2,
          iconColor: 'text-emerald-400',
        };
      case 'error':
        return {
          bg: 'bg-slate-900/95 text-white border-rose-500/50',
          icon: AlertCircle,
          iconColor: 'text-rose-400',
        };
      case 'warning':
        return {
          bg: 'bg-slate-900/95 text-white border-amber-500/50',
          icon: AlertTriangle,
          iconColor: 'text-amber-400',
        };
      default:
        return {
          bg: 'bg-slate-900/95 text-white border-blue-500/50',
          icon: Info,
          iconColor: 'text-blue-400',
        };
    }
  };

  const style = getStyle();
  const Icon = style.icon;

  return (
    <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200 pointer-events-none">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md max-w-md ${style.bg}`}
      >
        <Icon className={`w-5 h-5 shrink-0 ${style.iconColor}`} />
        <p className="text-xs sm:text-sm font-medium leading-relaxed">{toast.message}</p>
      </div>
    </div>
  );
};

export const ToastContainer = Toast;
