import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { propertyApi, enquiryApi } from '../../services/api';
import {
  Building2,
  PlusCircle,
  Eye,
  MessageSquare,
  TrendingUp,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const SellerDashboard: React.FC = () => {
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['seller-analytics'],
    queryFn: () => propertyApi.getSellerAnalytics()
  });

  const { data: listings, isLoading: listingsLoading } = useQuery({
    queryKey: ['seller-properties'],
    queryFn: () => propertyApi.getSellerProperties()
  });

  const { data: enquiries, isLoading: enquiriesLoading } = useQuery({
    queryKey: ['seller-enquiries'],
    queryFn: () => enquiryApi.getSellerEnquiries()
  });

  if (analyticsLoading || listingsLoading || enquiriesLoading) {
    return <LoadingSpinner message="Loading seller dashboard..." />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-lg border border-brand-border">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Seller / Builder Workspace</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your developments, upload site plans and legal deeds, and respond to qualified buyer enquiries.
          </p>
        </div>
        <Link
          to="/seller/new-listing"
          className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-brand-primaryHover flex items-center gap-1.5 self-start sm:self-auto transition-colors"
        >
          <PlusCircle size={15} />
          <span>New Property Listing</span>
        </Link>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-brand-border">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Total Listings</span>
            <Building2 size={16} className="text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{analytics?.total_listings || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            <span className="text-emerald-700 font-semibold">{analytics?.published_listings || 0} Published</span> • {analytics?.draft_listings || 0} Draft
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-brand-border">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Total Views</span>
            <Eye size={16} className="text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{analytics?.total_views || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <TrendingUp size={12} className="text-emerald-600" />
            <span>Across all directory cards</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-brand-border">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Buyer Enquiries</span>
            <MessageSquare size={16} className="text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{analytics?.total_enquiries || 0}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Direct buyer site visit inquiries
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-brand-border">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Evidence Status</span>
            <Clock size={16} className="text-slate-400" />
          </div>
          <div className="text-sm font-bold text-slate-900 mt-1">Phase 1 Standard</div>
          <div className="text-[11px] text-slate-500 mt-1">
            <Badge variant="unverified">Seller provided / Unverified</Badge>
          </div>
        </div>
      </div>

      {/* Listings Table Preview */}
      <div className="bg-white rounded-lg border border-brand-border overflow-hidden">
        <div className="p-4 border-b border-brand-border flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Your Property Listings</h2>
          <Link to="/seller/listings" className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1">
            <span>View All</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-brand-border uppercase font-mono text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Property</th>
                <th className="py-2.5 px-4">Type</th>
                <th className="py-2.5 px-4">Locality</th>
                <th className="py-2.5 px-4">Price</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Views</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listings?.slice(0, 5).map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span>{p.name}</span>
                      {p.is_demo && <Badge variant="demo" className="text-[9px]">Demo</Badge>}
                    </div>
                  </td>
                  <td className="py-3 px-4 capitalize text-slate-600">{p.property_type.replace('_', ' ')}</td>
                  <td className="py-3 px-4 text-slate-600">{p.locality}</td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-900">{p.asking_price}</td>
                  <td className="py-3 px-4">
                    <Badge variant={p.status === 'published' ? 'published' : 'draft'} className="capitalize">
                      {p.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{p.views_count}</td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <Link
                      to={`/seller/edit-listing/${p.id}`}
                      className="text-xs font-medium text-slate-700 hover:text-black underline"
                    >
                      Edit
                    </Link>
                    <Link
                      to={`/properties/${p.id}`}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800 underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inbound Buyer Enquiries Preview */}
      <div className="bg-white rounded-lg border border-brand-border overflow-hidden">
        <div className="p-4 border-b border-brand-border flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Recent Inbound Buyer Enquiries</h2>
          <Link to="/seller/enquiries" className="text-xs font-semibold text-brand-primary hover:underline flex items-center gap-1">
            <span>Manage All Enquiries</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        <div className="p-4">
          {!enquiries || enquiries.length === 0 ? (
            <div className="text-xs text-slate-500 text-center py-4">No enquiries received yet.</div>
          ) : (
            <div className="space-y-3">
              {enquiries.slice(0, 3).map((enq) => (
                <div key={enq.id} className="p-3 bg-slate-50 rounded border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-900 flex items-center gap-2">
                      <span>{enq.buyer_name}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-500 font-mono text-[11px]">{enq.buyer_email}</span>
                      <Badge variant={enq.status === 'responded' ? 'ok' : 'warn'} className="text-[10px]">
                        {enq.status}
                      </Badge>
                    </div>
                    <div className="text-slate-700 mt-1 italic">"{enq.message}"</div>
                    <div className="text-slate-400 text-[10px] mt-1 font-mono">
                      Property: {enq.property_name || `Property #${enq.property_id}`}
                    </div>
                  </div>
                  <Link
                    to="/seller/enquiries"
                    className="px-3 py-1.5 bg-brand-primary text-white text-[11px] font-semibold rounded hover:bg-brand-primaryHover transition-colors self-start sm:self-auto flex-shrink-0"
                  >
                    Reply
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
