import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { enquiryApi } from '../../services/api';
import { MessageSquare, Clock, CheckCircle2, Building, ArrowRight } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const BuyerEnquiriesPage: React.FC = () => {
  const { data: enquiries, isLoading } = useQuery({
    queryKey: ['buyer-enquiries'],
    queryFn: () => enquiryApi.getBuyerEnquiries()
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading your submitted enquiries..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-brand-border">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">My Property Enquiries</h1>
        <p className="text-xs text-slate-500 mt-1">
          Track the status of your site visit requests, questions, and replies received from builders.
        </p>
      </div>

      {!enquiries || enquiries.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No Enquiries Submitted Yet"
          description="When you view a property and click 'Enquire Now' or 'Schedule Site Visit', your requests will appear here."
          actionLabel="Browse Directory"
          onAction={() => (window.location.href = '/directory')}
        />
      ) : (
        <div className="space-y-4">
          {enquiries.map((enq) => (
            <div
              key={enq.id}
              className="bg-white p-5 rounded-lg border border-brand-border text-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">
                    {enq.property_name || `Property #${enq.property_id}`}
                  </span>
                  <Badge variant={enq.status === 'responded' ? 'ok' : 'warn'} className="capitalize">
                    {enq.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                  <span>Sent: {new Date(enq.created_at).toLocaleDateString()}</span>
                  <Link
                    to={`/properties/${enq.property_id}`}
                    className="text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    View Property →
                  </Link>
                </div>
              </div>

              {/* Message */}
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Your Message:</span>
                <p className="text-slate-800 font-medium">"{enq.message}"</p>
              </div>

              {/* Seller Reply */}
              {enq.seller_reply ? (
                <div className="p-3 bg-emerald-50/70 rounded border border-emerald-200 text-emerald-900">
                  <span className="text-[10px] text-emerald-700 uppercase font-mono block mb-1">Seller Response:</span>
                  <p className="leading-relaxed">"{enq.seller_reply}"</p>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px] pt-1">
                  <Clock size={12} />
                  <span>Awaiting developer response. You will also receive an email notification.</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
