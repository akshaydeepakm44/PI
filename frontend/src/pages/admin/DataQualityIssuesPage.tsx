import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import { AlertTriangle, CheckCircle, CheckCircle2 } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const DataQualityIssuesPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: issues, isLoading } = useQuery({
    queryKey: ['admin-issues'],
    queryFn: () => adminApi.getQualityIssues()
  });

  const resolveMutation = useMutation({
    mutationFn: (id: number) => adminApi.resolveQualityIssue(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-issues'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    }
  });

  if (isLoading) {
    return <LoadingSpinner message="Querying data quality flags..." />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg border border-brand-border">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Data Quality & Document Discrepancies</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review discrepancies identified during intake: missing environmental clearances, deed mismatches, or coordinate drifts.
        </p>
      </div>

      {!issues || issues.length === 0 ? (
        <EmptyState
          icon={CheckCircle}
          title="All Quality Checks Clear"
          description="There are currently zero open discrepancies or document flags on the platform."
        />
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className="bg-white p-4 rounded-lg border border-brand-border text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle
                  size={18}
                  className={issue.severity === 'high' ? 'text-rose-600' : 'text-amber-500'}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">Property #{issue.property_id}</span>
                    <Badge variant={issue.severity === 'high' ? 'danger' : 'warn'}>
                      {issue.severity} severity
                    </Badge>
                    <Badge variant={issue.status === 'resolved' ? 'ok' : 'draft'}>
                      {issue.status}
                    </Badge>
                  </div>
                  <p className="text-slate-700 mt-1">{issue.issue_description}</p>
                  <span className="text-slate-400 text-[10px] font-mono mt-1 block">
                    Flagged: {new Date(issue.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {issue.status === 'open' && (
                <button
                  type="button"
                  disabled={resolveMutation.isPending}
                  onClick={() => resolveMutation.mutate(issue.id)}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 transition-colors self-start sm:self-auto flex-shrink-0"
                >
                  Mark Resolved
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
