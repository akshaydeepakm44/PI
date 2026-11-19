import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { propertyApi } from '../../services/api';
import { BarChart3, Eye, TrendingUp, Users } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const ListingAnalyticsPage: React.FC = () => {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['seller-analytics'],
    queryFn: () => propertyApi.getSellerAnalytics()
  });

  if (isLoading) {
    return <LoadingSpinner message="Calculating listing analytics..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-brand-border">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Listing Analytics & Engagement</h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor public directory views, buyer reach, and inquiry conversion metrics.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-lg border border-brand-border">
          <span className="text-xs text-slate-500 font-mono block">TOTAL ENGAGED VIEWS</span>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">{analytics?.total_views || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Direct property page inspections</div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-brand-border">
          <span className="text-xs text-slate-500 font-mono block">TOTAL ENQUIRIES</span>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">{analytics?.total_enquiries || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">Site visit and brochure requests</div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-brand-border">
          <span className="text-xs text-slate-500 font-mono block">PORTFOLIO CONVERSION</span>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">
            {analytics?.total_views ? ((analytics.total_enquiries / analytics.total_views) * 100).toFixed(1) : 0}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Inquiry-to-impression ratio</div>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="bg-white rounded-lg border border-brand-border overflow-hidden">
        <div className="p-4 border-b border-brand-border">
          <h2 className="text-sm font-bold text-slate-900">Per-Listing Performance Breakdown</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-brand-border uppercase font-mono text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Property</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Asking Price</th>
                <th className="py-2.5 px-4">Directory Views</th>
                <th className="py-2.5 px-4">Traffic Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics?.listings_breakdown?.map((item: any) => {
                const totalViews = analytics.total_views || 1;
                const share = Math.round((item.views / totalViews) * 100);

                return (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-semibold text-slate-900">{item.name}</td>
                    <td className="py-3 px-4">
                      <Badge variant={item.status === 'published' ? 'published' : 'draft'} className="capitalize">
                        {item.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-800">{item.price}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{item.views}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div className="bg-slate-900 h-full rounded-full" style={{ width: `${share}%` }}></div>
                        </div>
                        <span className="font-mono text-[11px] text-slate-500">{share}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
