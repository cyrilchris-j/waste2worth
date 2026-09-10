import React from 'react';
import { AlertTriangle, Inbox } from 'lucide-react';

export function LoadingSpinner({ size = 'md', label = 'Loading…' }: { size?: 'sm' | 'md' | 'lg'; label?: string }) {
  const sizeMap = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' };
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <svg
        className={`animate-spin text-brand-600 ${sizeMap[size]}`}
        viewBox="0 0 24 24"
        fill="none"
        aria-label={label}
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner size="lg" />
    </div>
  );
}

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ title = 'Something went wrong', message, onRetry }: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
        <AlertTriangle className="text-red-600" size={24} />
      </div>
      <div>
        <p className="font-semibold text-gray-800">{title}</p>
        <p className="text-sm text-gray-500 mt-1">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon, title, message }: { icon?: React.ReactNode; title: string; message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center">
      <div className="flex items-center justify-center mb-1 text-gray-400">
        {icon || <Inbox size={40} className="text-gray-400" />}
      </div>
      <p className="font-semibold text-gray-700">{title}</p>
      {message && <p className="text-sm text-gray-500 max-w-sm">{message}</p>}
    </div>
  );
}
