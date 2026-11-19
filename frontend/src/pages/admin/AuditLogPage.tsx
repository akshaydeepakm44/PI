import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import { History, Shield } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AuditLogPage: React.FC = () => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => adminApi.getAuditLogs()
  });

  if (isLoading) {
    return <LoadingSpinner message="Retrieving platform audit logs..." />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-brand-border">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Audit Log Trail</h1>
        <p className="text-xs text-slate-500 mt-1">
          Chronological record of listing status updates, property additions, user registrations, and moderation actions.
        </p>
      </div>

      <div className="bg-white rounded-lg border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-brand-border uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">Log ID</th>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-4">Event Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {logs?.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 text-slate-400">#LOG-{log.id}</td>
                  <td className="py-3 px-4 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="py-3 px-4 text-slate-700">{log.user_id ? `User #${log.user_id}` : 'System'}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{log.action}</td>
                  <td className="py-3 px-4 text-blue-700">{log.target_type} #{log.target_id || '--'}</td>
                  <td className="py-3 px-4 font-sans text-xs text-slate-600 max-w-sm truncate">
                    {log.details || '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
