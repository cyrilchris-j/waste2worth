import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

const variantStyles: Record<AlertVariant, { bg: string; border: string; text: string; defaultIcon: React.ReactNode }> = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    defaultIcon: <Info size={18} className="text-blue-600 shrink-0" />,
  },
  success: {
    bg: 'bg-brand-50',
    border: 'border-brand-200',
    text: 'text-brand-800',
    defaultIcon: <CheckCircle2 size={18} className="text-brand-600 shrink-0" />,
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    defaultIcon: <AlertTriangle size={18} className="text-amber-600 shrink-0" />,
  },
  danger: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    defaultIcon: <AlertCircle size={18} className="text-red-600 shrink-0" />,
  },
};

export function Alert({ variant = 'info', title, children, icon, className = '' }: AlertProps) {
  const style = variantStyles[variant];

  return (
    <div className={`p-4 rounded-xl border ${style.bg} ${style.border} ${className} flex items-start gap-3`}>
      {icon ?? style.defaultIcon}
      <div className={`flex-1 text-sm ${style.text}`}>
        {title && <h5 className="font-bold mb-0.5">{title}</h5>}
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}
