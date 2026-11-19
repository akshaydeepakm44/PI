import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { enquiryApi } from '../../services/api';
import { MessageSquare, Mail, Phone, CheckCircle, Send } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const SellerEnquiriesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedEnquiry, setSelectedEnquiry] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const { data: enquiries, isLoading } = useQuery({
    queryKey: ['seller-enquiries'],
    queryFn: () => enquiryApi.getSellerEnquiries()
  });

  const replyMutation = useMutation({
    mutationFn: ({ id, reply }: { id: number; reply: string }) =>
      enquiryApi.replyToEnquiry(id, reply),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-enquiries'] });
      setStatusMsg('Reply sent successfully to buyer!');
      setSelectedEnquiry(null);
      setReplyText('');
      setTimeout(() => setStatusMsg(null), 3000);
    }
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading buyer inquiries..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-brand-border">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Buyer Enquiries & Site Visit Requests</h1>
        <p className="text-xs text-slate-500 mt-1">
          Respond directly to verified buyer inquiries interested in your developments.
        </p>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-center gap-2">
          <CheckCircle size={15} />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Enquiries List */}
      {!enquiries || enquiries.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No Inbound Enquiries Yet"
          description="When buyers browse your published properties in the directory and request site visits or brochures, their enquiries will appear here."
        />
      ) : (
        <div className="space-y-4">
          {enquiries.map((enq) => (
            <div
              key={enq.id}
              className="bg-white p-5 rounded-lg border border-brand-border text-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{enq.buyer_name}</span>
                    <Badge variant={enq.status === 'responded' ? 'ok' : 'warn'} className="capitalize">
                      {enq.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-slate-500 text-[11px] mt-1">
                    <span className="flex items-center gap-1 font-mono">
                      <Mail size={12} /> {enq.buyer_email}
                    </span>
                    {enq.buyer_phone && (
                      <span className="flex items-center gap-1 font-mono">
                        <Phone size={12} /> {enq.buyer_phone}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-semibold text-slate-800 block text-xs">
                    {enq.property_name || `Property #${enq.property_id}`}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Received: {new Date(enq.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Message from Buyer */}
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Buyer Message:</span>
                <p className="text-slate-800 leading-relaxed font-medium">"{enq.message}"</p>
              </div>

              {/* Existing Seller Reply */}
              {enq.seller_reply ? (
                <div className="p-3 bg-emerald-50/60 rounded border border-emerald-200 text-emerald-900">
                  <span className="text-[10px] uppercase font-mono text-emerald-700 block mb-1">Your Sent Reply:</span>
                  <p className="leading-relaxed">"{enq.seller_reply}"</p>
                </div>
              ) : (
                <div>
                  {selectedEnquiry?.id === enq.id ? (
                    <div className="space-y-2 mt-2">
                      <textarea
                        rows={3}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your response to the buyer..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:bg-white focus:border-brand-primary"
                      />
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setSelectedEnquiry(null)}
                          className="px-3 py-1.5 text-slate-600 hover:text-black font-semibold text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={!replyText.trim() || replyMutation.isPending}
                          onClick={() => replyMutation.mutate({ id: enq.id, reply: replyText.trim() })}
                          className="px-4 py-1.5 bg-brand-primary text-white font-semibold rounded text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <Send size={12} />
                          <span>Send Reply</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setSelectedEnquiry(enq);
                        setReplyText('');
                      }}
                      className="px-3.5 py-1.5 bg-brand-primary text-white font-semibold rounded text-xs hover:bg-brand-primaryHover transition-colors"
                    >
                      Reply to Buyer
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
