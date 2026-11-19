import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-white border border-brand-border rounded-lg ${className}`}>
      <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200 text-slate-500 mb-3">
        <Icon className="w-6 h-6" strokeWidth={1.75} />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm mb-4">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded hover:bg-brand-primaryHover transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
