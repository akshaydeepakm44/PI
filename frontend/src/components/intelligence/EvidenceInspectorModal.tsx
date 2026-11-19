import React from 'react';
import { X, ExternalLink, ShieldCheck, AlertCircle, Database, Calendar, Info } from 'lucide-react';
import { EvidenceItem } from '../../types';
import { Badge } from '../common/Badge';

interface EvidenceInspectorModalProps {
  evidenceItem: EvidenceItem | null;
  onClose: () => void;
}

export const EvidenceInspectorModal: React.FC<EvidenceInspectorModalProps> = ({
  evidenceItem,
  onClose
}) => {
  if (!evidenceItem) return null;

  const getReliabilityBadge = (rel: string) => {
    switch (rel) {
      case 'high':
        return <Badge variant="verified">High Reliability (Independent Source)</Badge>;
      case 'moderate':
        return <Badge variant="info">Moderate Reliability (Crowdsourced OSM)</Badge>;
      case 'unverified':
        return <Badge variant="unverified">Seller provided / Unverified</Badge>;
      case 'gap':
        return <Badge variant="warn">Missing / Due Diligence Gap</Badge>;
      default:
        return <Badge variant="neutral">{rel}</Badge>;
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'seller_fact':
        return 'Group A: Seller-Provided Property Fact';
      case 'location_spatial':
        return 'Group B: Spatial & Cadastral Location Evidence';
      case 'environmental':
        return 'Group C: Environmental & Atmospheric Observation';
      case 'calculated':
        return 'Group D: System-Derived Analytic Calculation';
      case 'evidence_gap':
        return 'Group E: Evidence Gap / Due-Diligence Uncertainty';
      default:
        return cat;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-lg border border-slate-200 max-w-lg w-full shadow-2xl overflow-hidden text-xs space-y-4">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-blue-400 font-mono tracking-wider uppercase block">
              {getCategoryLabel(evidenceItem.category)}
            </span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 bg-slate-800 rounded border border-slate-700 text-amber-300 font-bold">
                {evidenceItem.id}
              </span>
              <h3 className="font-bold text-sm text-white line-clamp-1">{evidenceItem.label}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Reliability & Provenance */}
          <div className="flex items-center justify-between gap-2 p-3 bg-slate-50 rounded border border-slate-200">
            <span className="text-slate-500 font-medium">Reliability Tier:</span>
            {getReliabilityBadge(evidenceItem.reliability)}
          </div>

          {/* Value Display */}
          <div className="space-y-1.5">
            <label className="text-slate-500 font-semibold block text-[11px] uppercase tracking-wider font-mono">
              Recorded Evidence Value
            </label>
            <div className="p-3 bg-slate-50 rounded border border-slate-200 font-mono text-slate-900 break-words">
              {typeof evidenceItem.value === 'object' && evidenceItem.value !== null ? (
                <pre className="text-[11px] whitespace-pre-wrap leading-relaxed">
                  {JSON.stringify(evidenceItem.value, null, 2)}
                </pre>
              ) : (
                <span className="font-bold text-sm text-slate-950">
                  {String(evidenceItem.value)} {evidenceItem.unit ? `(${evidenceItem.unit})` : ''}
                </span>
              )}
            </div>
          </div>

          {/* Provenance & Retrival Source */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded border border-slate-200 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
                <Database size={12} />
                <span>Source Provenance</span>
              </span>
              <span className="font-semibold text-slate-800 block text-xs">
                {evidenceItem.provenance}
              </span>
            </div>

            <div className="p-3 bg-white rounded border border-slate-200 space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
                <Calendar size={12} />
                <span>Observed / Retrieved At</span>
              </span>
              <span className="font-mono text-slate-700 block text-[11px]">
                {evidenceItem.retrieved_at
                  ? new Date(evidenceItem.retrieved_at).toLocaleString()
                  : 'System Recorded'}
              </span>
            </div>
          </div>

          {/* Known Limitations & Uncertainty */}
          {evidenceItem.limitations && (
            <div className="p-3 bg-amber-50/60 rounded border border-amber-200 space-y-1">
              <span className="text-[10px] font-mono text-amber-900 font-bold uppercase flex items-center gap-1">
                <Info size={12} className="text-amber-700" />
                <span>Known Limitations & Methodology Caveats</span>
              </span>
              <p className="text-slate-700 text-[11px] leading-relaxed">
                {evidenceItem.limitations}
              </p>
            </div>
          )}

          {/* Evidence Disclaimer */}
          <div className="border-t border-slate-100 pt-3 text-[10px] text-slate-400 leading-normal">
            Every factual citation in the HI IN Property Intelligence Report references a permanent evidence item in this dossier. Absence of corroborating records does not confirm physical non-existence.
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded font-semibold text-xs hover:bg-slate-800"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
