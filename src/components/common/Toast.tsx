import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  // Enforce strict limit: only the latest active toast is rendered
  const activeToast = toasts[toasts.length - 1];
  if (!activeToast) return null;

  const isSuccess = activeToast.type === 'success' || !activeToast.type;
  const isWarning = activeToast.type === 'warning';

  return (
    <div 
      className="fixed top-20 right-4 z-50 max-w-sm w-full pointer-events-none px-2"
      role="status"
      aria-live="polite"
    >
      <div
        key={activeToast.id}
        className="pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#2C2C2C] text-white shadow-xl border border-white/10 animate-in fade-in slide-in-from-top-2 duration-200"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {isSuccess && <CheckCircle2 className="w-5 h-5 text-[#F4E39E] shrink-0" />}
          {isWarning && <AlertCircle className="w-5 h-5 text-[#FFDAD6] shrink-0" />}
          {!isSuccess && !isWarning && <Info className="w-5 h-5 text-[#C5BEFF] shrink-0" />}
          <p className="text-xs font-medium leading-snug line-clamp-2">{activeToast.message}</p>
        </div>
        <button
          type="button"
          onClick={() => dismissToast(activeToast.id)}
          className="text-white/60 hover:text-white p-1 rounded-full shrink-0 cursor-pointer"
          aria-label="Dismiss toast"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
