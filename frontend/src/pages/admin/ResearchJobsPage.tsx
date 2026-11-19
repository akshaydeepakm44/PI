import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import { Compass, RotateCw, CheckCircle2, Clock, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const ResearchJobsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [retryingJobId, setRetryingJobId] = useState<number | null>(null);

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['admin-jobs'],
    queryFn: () => adminApi.getResearchJobs()
  });

  const retryMutation = useMutation({
    mutationFn: (jobId: number) => adminApi.retryResearchJob(jobId),
    onMutate: (jobId) => setRetryingJobId(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
    },
    onSettled: () => setRetryingJobId(null)
  });

  if (isLoading) {
    return <LoadingSpinner message="Querying geospatial research queue..." />;
  }

  const completedCount = jobs?.filter((j) => j.status === 'completed').length || 0;
  const failedCount = jobs?.filter((j) => j.status === 'failed').length || 0;
  const inProgressCount = jobs?.filter((j) => j.status === 'in_progress' || j.status === 'queued').length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-brand-border">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Geospatial Research Jobs Queue</h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor automated background tasks that extract spatial context, nearby POIs, air quality, and route matrices.
        </p>

        {/* Metric Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100 font-mono text-xs">
          <div className="p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-[10px] text-slate-400 uppercase block">Total Dispatched</span>
            <span className="text-base font-bold text-slate-900">{jobs?.length || 0}</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded border border-emerald-200">
            <span className="text-[10px] text-emerald-700 uppercase block">Completed</span>
            <span className="text-base font-bold text-emerald-800">{completedCount}</span>
          </div>
          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <span className="text-[10px] text-blue-700 uppercase block">Queued / Active</span>
            <span className="text-base font-bold text-blue-800">{inProgressCount}</span>
          </div>
          <div className="p-3 bg-rose-50 rounded border border-rose-200">
            <span className="text-[10px] text-rose-700 uppercase block">Failed</span>
            <span className="text-base font-bold text-rose-800">{failedCount}</span>
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-lg border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-brand-border uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">Job ID</th>
                <th className="py-3 px-4">Target Property</th>
                <th className="py-3 px-4">Pipeline Task</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Execution Summary & Errors</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4">Dispatched At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {jobs?.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 text-slate-400">#JOB-{job.id}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 font-sans">
                    <a
                      href={`/properties/${job.property_id}`}
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <span>Property #{job.property_id}</span>
                      <ExternalLink size={10} />
                    </a>
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-sans">{job.job_type}</td>
                  <td className="py-3 px-4 font-sans">
                    <Badge
                      variant={
                        job.status === 'completed'
                          ? 'verified'
                          : job.status === 'in_progress' || job.status === 'queued'
                          ? 'info'
                          : job.status === 'partially_completed'
                          ? 'warn'
                          : 'unverified'
                      }
                      className="capitalize"
                    >
                      {job.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 font-sans text-xs max-w-sm">
                    <span className="text-slate-800 block truncate">
                      {job.result_summary || 'Processing pipeline stages...'}
                    </span>
                    {(job as any).error_message && (
                      <span className="text-[10px] text-rose-600 block truncate font-mono mt-0.5">
                        Err: {(job as any).error_message}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {(job as any).execution_time_ms ? `${(job as any).execution_time_ms} ms` : '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[10px]">
                    {new Date(job.created_at).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => retryMutation.mutate(job.id)}
                      disabled={retryingJobId === job.id || job.status === 'in_progress'}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-sans font-semibold text-[11px] disabled:opacity-50 inline-flex items-center gap-1 transition-colors"
                    >
                      {retryingJobId === job.id ? (
                        <Loader2 size={11} className="animate-spin text-blue-600" />
                      ) : (
                        <RotateCw size={11} />
                      )}
                      <span>Retry</span>
                    </button>
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
