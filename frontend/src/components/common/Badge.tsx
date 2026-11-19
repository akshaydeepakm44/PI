import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'demo' | 'verified' | 'unverified' | 'published' | 'draft' | 'suspended' | 'ok' | 'warn' | 'danger' | 'info' | 'neutral' | 'calculated' | 'gap';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className = '' }) => {
  const variantStyles = {
    demo: 'bg-amber-50 text-amber-800 border-amber-300 font-medium',
    verified: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-medium',
    unverified: 'bg-slate-100 text-slate-700 border-slate-300 font-medium',
    published: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium',
    draft: 'bg-slate-100 text-slate-600 border-slate-200 font-medium',
    suspended: 'bg-rose-50 text-rose-700 border-rose-200 font-medium',
    ok: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warn: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    calculated: 'bg-purple-50 text-purple-700 border-purple-200 font-medium',
    gap: 'bg-rose-50 text-rose-700 border-rose-200 font-medium'
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs border tracking-tight ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
