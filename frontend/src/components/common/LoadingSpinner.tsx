import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Loading...', className = '' }) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <Loader2 className="w-6 h-6 animate-spin text-slate-600 mb-2" />
      <span className="text-xs text-slate-500 font-medium">{message}</span>
    </div>
  );
};
