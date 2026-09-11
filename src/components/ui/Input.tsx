import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, id, className = '', ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        className={[
          'w-full rounded-xl border px-4 py-3 text-base text-gray-900 placeholder-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
          'disabled:bg-gray-100 disabled:text-gray-500',
          error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white',
          className,
        ].join(' ')}
      />
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, id, className = '', ...props }: TextareaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        rows={3}
        {...props}
        className={[
          'w-full rounded-xl border px-4 py-3 text-base text-gray-900 placeholder-gray-400 resize-y',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
          error ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white',
          className,
        ].join(' ')}
      />
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ label, error, hint, id, options, placeholder, className = '', ...props }: SelectProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        id={inputId}
        {...props}
        className={[
          'w-full rounded-xl border px-4 py-3 text-base text-gray-900 bg-white',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
          error ? 'border-red-400 bg-red-50' : 'border-gray-300',
          className,
        ].join(' ')}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
