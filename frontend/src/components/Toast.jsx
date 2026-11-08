import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm">
      {toasts.map((toast) => {
        let Icon = Info;
        let bg = 'bg-slate-900 border-slate-700 text-slate-200';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          bg = 'bg-slate-900 border-emerald-500/50 text-emerald-200';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          bg = 'bg-slate-900 border-rose-500/50 text-rose-200';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          bg = 'bg-slate-900 border-amber-500/50 text-amber-200';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start space-x-2.5 p-3 rounded-lg border shadow-xl ${bg} backdrop-blur text-xs animate-slide-in`}
          >
            <Icon className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              {toast.title && <div className="font-semibold">{toast.title}</div>}
              <div className="text-[11px] opacity-90 leading-tight">{toast.message}</div>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

