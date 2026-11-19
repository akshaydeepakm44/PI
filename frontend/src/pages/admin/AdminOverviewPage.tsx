import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import {
  ShieldAlert,
  Building2,
  Users,
  Compass,
  Database,
  AlertTriangle,
  History,
  CheckCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminOverviewPage: React.FC = () => {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => adminApi.getOverview()
  });

  const { data: auditLogs } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => adminApi.getAuditLogs()
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading platform admin metrics..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-brand-border">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Platform Administration Console</h1>
          <Badge variant="warn">Admin Access Only</Badge>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Supervise listings hygiene, monitor geospatial research jobs, check external API health, and review audit logs.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-brand-border">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Total Properties</span>
            <Building2 size={16} />
          </div>
          <div className="text-2xl font-bold text-slate-900">{overview?.total_listings || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span className="text-emerald-700 font-semibold">{overview?.published_listings || 0} Pub</span> •{' '}
            <span className="text-slate-600">{overview?.draft_listings || 0} Draft</span> •{' '}
            <span className="text-rose-600">{overview?.suspended_listings || 0} Suspended</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-brand-border">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Registered Users</span>
            <Users size={16} />
          </div>
          <div className="text-2xl font-bold text-slate-900">{overview?.total_users || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Buyers, sellers & administrators</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-brand-border">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Quality Discrepancies</span>
            <AlertTriangle size={16} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{overview?.open_quality_issues || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Flags awaiting resolution</div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-brand-border">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Research Pipeline</span>
            <Compass size={16} className="text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{overview?.active_research_jobs || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Queued / Running spatial jobs</div>
        </div>
      </div>

      {/* Quick Navigation Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/admin/listings"
          className="p-5 bg-white rounded-lg border border-brand-border hover:border-slate-400 hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div>
            <Building2 size={20} className="text-slate-800 mb-2" />
            <h3 className="font-bold text-sm text-slate-900">Listings Moderation</h3>
            <p className="text-xs text-slate-500 mt-1">
              Approve pending properties or suspend listings that fail verification guidelines.
            </p>
          </div>
          <span className="text-xs font-semibold text-brand-primary mt-4 flex items-center gap-1">
            <span>Manage Listings</span>
            <ArrowRight size={12} />
          </span>
        </Link>

        <Link
          to="/admin/sources"
          className="p-5 bg-white rounded-lg border border-brand-border hover:border-slate-400 hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div>
            <Database size={20} className="text-slate-800 mb-2" />
            <h3 className="font-bold text-sm text-slate-900">Data Sources & Latency</h3>
            <p className="text-xs text-slate-500 mt-1">
              Inspect status and roundtrip latency for OpenStreetMap, Open-Meteo, OSRM and CPCB.
            </p>
          </div>
          <span className="text-xs font-semibold text-brand-primary mt-4 flex items-center gap-1">
            <span>Inspect Health</span>
            <ArrowRight size={12} />
          </span>
        </Link>

        <Link
          to="/admin/audit-log"
          className="p-5 bg-white rounded-lg border border-brand-border hover:border-slate-400 hover:shadow-xs transition-all flex flex-col justify-between"
        >
          <div>
            <History size={20} className="text-slate-800 mb-2" />
            <h3 className="font-bold text-sm text-slate-900">Audit Trail</h3>
            <p className="text-xs text-slate-500 mt-1">
              Comprehensive tamper-evident activity log of property changes and user registrations.
            </p>
          </div>
          <span className="text-xs font-semibold text-brand-primary mt-4 flex items-center gap-1">
            <span>View Full Log</span>
            <ArrowRight size={12} />
          </span>
        </Link>
      </div>

      {/* Recent System Audit Log Preview */}
      <div className="bg-white rounded-lg border border-brand-border overflow-hidden">
        <div className="p-4 border-b border-brand-border flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Recent Platform Audit Log</h2>
          <Link to="/admin/audit-log" className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1">
            <span>View All</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-brand-border uppercase font-mono text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Target</th>
                <th className="py-2.5 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {auditLogs?.slice(0, 5).map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-4 text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-800">{log.action}</td>
                  <td className="py-2.5 px-4 text-slate-600">{log.target_type} #{log.target_id || '--'}</td>
                  <td className="py-2.5 px-4 text-slate-700 font-sans text-xs">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
