import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyApi } from '../../services/api';
import {
  Building2,
  PlusCircle,
  Eye,
  Edit,
  Trash2,
  Filter,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';

export const SellerListingsPage: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const queryClient = useQueryClient();

  const { data: listings, isLoading } = useQuery({
    queryKey: ['seller-properties'],
    queryFn: () => propertyApi.getSellerProperties()
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => propertyApi.deleteProperty(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-properties'] });
      queryClient.invalidateQueries({ queryKey: ['seller-analytics'] });
    }
  });

  const filtered = listings?.filter((p) => {
    if (filterStatus === 'all') return true;
    return p.status === filterStatus;
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading your property portfolio..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-lg border border-brand-border">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">My Property Portfolio</h1>
          <p className="text-xs text-slate-500 mt-1">
            Review, update specifications, publish drafts, and track impressions.
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

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-brand-border pb-2 text-xs font-medium">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 rounded transition-colors ${
            filterStatus === 'all' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Listings ({listings?.length || 0})
        </button>
        <button
          onClick={() => setFilterStatus('published')}
          className={`px-3 py-1.5 rounded transition-colors ${
            filterStatus === 'published' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          Published ({listings?.filter((p) => p.status === 'published').length || 0})
        </button>
        <button
          onClick={() => setFilterStatus('draft')}
          className={`px-3 py-1.5 rounded transition-colors ${
            filterStatus === 'draft' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600 hover:bg-slate-200'
          }`}
        >
          Drafts ({listings?.filter((p) => p.status === 'draft').length || 0})
        </button>
      </div>

      {/* Listings Table */}
      {!filtered || filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No Properties Found"
          description="You don't have any properties under this filter. Create a new listing or switch filter."
          actionLabel="Create Listing"
          onAction={() => window.location.href = '/seller/new-listing'}
        />
      ) : (
        <div className="bg-white rounded-lg border border-brand-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-brand-border uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3 px-4">Property Name</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Locality</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Views</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <Link to={`/properties/${p.id}`} className="hover:text-blue-700">
                          {p.name}
                        </Link>
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
                    <td className="py-3 px-4">
                      <Badge variant="unverified">{p.verification_status}</Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{p.views_count}</td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Link
                        to={`/seller/edit-listing/${p.id}`}
                        className="p-1 text-slate-600 hover:text-black inline-flex items-center"
                        title="Edit listing"
                      >
                        <Edit size={14} />
                      </Link>
                      <Link
                        to={`/properties/${p.id}`}
                        className="p-1 text-blue-600 hover:text-blue-800 inline-flex items-center"
                        title="View public page"
                      >
                        <Eye size={14} />
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${p.name}?`)) {
                            deleteMutation.mutate(p.id);
                          }
                        }}
                        className="p-1 text-rose-500 hover:text-rose-700 inline-flex items-center"
                        title="Delete listing"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
