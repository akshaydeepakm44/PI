import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import { Building2, ShieldAlert, CheckCircle, Eye, AlertCircle, X } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const AdminListingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [modalProperty, setModalProperty] = useState<any>(null);
  const [targetStatus, setTargetStatus] = useState<string>('suspended');
  const [reason, setReason] = useState<string>('');

  const { data: properties, isLoading } = useQuery({
    queryKey: ['admin-properties'],
    queryFn: () => adminApi.getProperties()
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status, reason }: { id: number; status: string; reason: string }) =>
      adminApi.updateListingStatus(id, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-properties'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
      setModalProperty(null);
      setReason('');
    }
  });

  const handleOpenModal = (prop: any, newStatus: string) => {
    setModalProperty(prop);
    setTargetStatus(newStatus);
    setReason(newStatus === 'suspended' ? 'Suspicious pricing or incomplete documentation.' : 'Approved after verification.');
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading all platform properties..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-brand-border">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Listings Moderation & Hygiene</h1>
        <p className="text-xs text-slate-500 mt-1">
          Review all submitted listings, approve published properties, or suspend listings with audit documentation.
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-brand-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-brand-border uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">Property</th>
                <th className="py-3 px-4">Seller / Builder</th>
                <th className="py-3 px-4">Locality</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Views</th>
                <th className="py-3 px-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {properties?.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/60">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <Link to={`/properties/${p.id}`} className="hover:text-blue-700">
                        {p.name}
                      </Link>
                      {p.is_demo && <Badge variant="demo" className="text-[9px]">Demo</Badge>}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{p.seller_name}</td>
                  <td className="py-3 px-4 text-slate-600">{p.locality}</td>
                  <td className="py-3 px-4 font-mono font-medium text-slate-900">{p.asking_price}</td>
                  <td className="py-3 px-4">
                    <Badge
                      variant={
                        p.status === 'published'
                          ? 'published'
                          : p.status === 'suspended'
                          ? 'suspended'
                          : 'draft'
                      }
                      className="capitalize"
                    >
                      {p.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600">{p.views_count}</td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <Link
                      to={`/properties/${p.id}`}
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      View
                    </Link>
                    {p.status === 'published' ? (
                      <button
                        onClick={() => handleOpenModal(p, 'suspended')}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-800 underline"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenModal(p, 'published')}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 underline"
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Moderation Status Change Modal */}
      {modalProperty && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg border border-brand-border p-6 max-w-md w-full shadow-xl text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 capitalize">
                  {targetStatus === 'suspended' ? 'Suspend Listing' : 'Approve Listing'}
                </h3>
                <span className="text-slate-500 text-[11px]">{modalProperty.name}</span>
              </div>
              <button onClick={() => setModalProperty(null)} className="text-slate-400 hover:text-black">
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Audit Reason / Justification *</label>
              <textarea
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                This rationale will be recorded permanently in the platform audit log.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalProperty(null)}
                className="px-3 py-1.5 text-slate-600 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!reason.trim() || statusMutation.isPending}
                onClick={() =>
                  statusMutation.mutate({
                    id: modalProperty.id,
                    status: targetStatus,
                    reason: reason.trim()
                  })
                }
                className={`px-4 py-2 text-white font-semibold rounded text-xs transition-colors ${
                  targetStatus === 'suspended'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {statusMutation.isPending
                  ? 'Processing...'
                  : `Confirm ${targetStatus === 'suspended' ? 'Suspension' : 'Approval'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
