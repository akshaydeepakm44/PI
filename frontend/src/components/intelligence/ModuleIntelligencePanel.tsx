import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { intelligenceApi } from '../../services/api';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  ShieldAlert,
  Compass,
  ArrowRight,
  RotateCw,
  Info
} from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ModuleIntelligencePanelProps {
  propertyId: number;
  moduleKey: string;
  moduleTitle: string;
}

export const ModuleIntelligencePanel: React.FC<ModuleIntelligencePanelProps> = ({
  propertyId,
  moduleKey,
  moduleTitle
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const {
    data: intel,
    isLoading,
    isRefetching,
    refetch
  } = useQuery({
    queryKey: ['module-intelligence', propertyId, moduleKey],
    queryFn: () => intelligenceApi.getModuleIntelligence(propertyId, moduleKey),
    enabled: propertyId > 0
  });

  return (
    <div className="bg-white rounded-2xl border border-[#dedede] overflow-hidden shadow-xs">
      {/* Top Banner */}
      <div className="bg-[#10261a] p-4 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#1e6b3a] flex items-center justify-center text-[#8bcaa0]">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-wider uppercase font-semibold text-[#8bcaa0]">
                Property Intelligence Engine
              </span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-white font-mono">
                System A
              </span>
            </div>
            <h3 className="text-sm font-bold tracking-tight text-white">
              {intel?.title || `${moduleTitle} Contextual Analysis`}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isRefetching || isLoading}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#8bcaa0] transition-colors"
            title="Refresh Analysis"
          >
            <RotateCw size={13} className={isRefetching || isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-xs px-2.5 py-1 rounded bg-white/15 hover:bg-white/25 text-white font-medium transition-colors"
          >
            {isOpen ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-5 space-y-5 text-xs text-slate-700">
          {isLoading ? (
            <div className="py-8 text-center text-slate-500">
              <LoadingSpinner message={`Generating evidence-backed ${moduleTitle.toLowerCase()} intelligence...`} />
            </div>
          ) : (
            <>
              {/* Executive Summary Box */}
              <div className="p-4 rounded-xl bg-[#eef7f1] border border-[#bfddc9] text-[#10261a]">
                <div className="flex items-start gap-2.5">
                  <Compass size={16} className="text-[#1e6b3a] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wide text-[#1e6b3a] font-mono">
                      Key AI Finding
                    </h4>
                    <p className="text-xs leading-relaxed mt-1 font-medium">
                      {intel?.summary}
                    </p>
                  </div>
                </div>
              </div>

              {/* Special Mathematical Matrix for Units/Pricing */}
              {moduleKey === 'units' && intel?.calculation_details?.findings && (
                <div className="space-y-3 pt-1">
                  <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wide font-mono flex items-center gap-1.5">
                    <TrendingUp size={13} className="text-[#1e6b3a]" />
                    <span>Configuration & Incremental Cost Calculations</span>
                  </h4>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-[#fcfcfc] border border-[#dedede]">
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">
                        SBU Difference
                      </span>
                      <span className="text-base font-bold text-[#10261a]">
                        +{intel.calculation_details.findings.sbu_difference_sqft} sq ft
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">1,880 − 1,300 sq ft</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#fcfcfc] border border-[#dedede]">
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">
                        Carpet Difference
                      </span>
                      <span className="text-base font-bold text-[#10261a]">
                        +{intel.calculation_details.findings.carpet_difference_sqft} sq ft
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">1,297 − 897 sq ft</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#fcfcfc] border border-[#dedede]">
                      <span className="text-[10px] font-mono text-slate-400 block uppercase">
                        Starting Price Diff
                      </span>
                      <span className="text-base font-bold text-[#10261a]">
                        ₹{intel.calculation_details.findings.price_difference_lakh} Lakh
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">₹1.62 Cr − ₹1.12 Cr</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#eef7f1] border border-[#8bcaa0]">
                      <span className="text-[10px] font-mono text-[#1e6b3a] block uppercase font-bold">
                        Incremental Carpet Rate
                      </span>
                      <span className="text-base font-bold text-[#10261a]">
                        ₹{intel.calculation_details.findings.incremental_price_per_carpet_sqft?.toLocaleString()}/sq ft
                      </span>
                      <span className="text-[10px] text-[#1e6b3a] block mt-0.5 font-medium">₹50L ÷ 400 sq ft</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Findings Table */}
              {intel?.findings && intel.findings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wide font-mono">
                    Evidence & Discovered Facts
                  </h4>
                  <div className="border border-[#dedede] rounded-xl overflow-hidden divide-y divide-[#dedede]">
                    {intel.findings.map((f: any, idx: number) => (
                      <div key={idx} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 hover:bg-[#fcfcfc]">
                        <span className="font-semibold text-slate-800 text-xs sm:w-1/3">
                          {f.label}
                        </span>
                        <span className="text-slate-600 sm:w-2/3 text-left">
                          {f.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Strategic Recommendation */}
              {intel?.recommendation && (
                <div className="p-4 rounded-xl bg-[#fcfcfc] border border-[#dedede] space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#10261a]">
                    <CheckCircle2 size={14} className="text-[#1e6b3a]" />
                    <span>Advisor Recommendation</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-5">
                    {intel.recommendation}
                  </p>
                </div>
              )}

              {/* Verified Disclosures & Footnotes */}
              {intel?.disclosures && intel.disclosures.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5 text-amber-900">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold">
                    <Info size={13} className="text-amber-700 shrink-0" />
                    <span>Important Mathematical Disclosures</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800 pl-1">
                    {intel.disclosures.map((d: string, dIdx: number) => (
                      <li key={dIdx}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Unverified Gaps / Limitations */}
              {intel?.limitations && intel.limitations.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-slate-600">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                    <AlertTriangle size={13} className="text-slate-500 shrink-0" />
                    <span>What Is Missing / Needs Verification</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500 pl-1">
                    {intel.limitations.map((lim: string, lIdx: number) => (
                      <li key={lIdx}>{lim}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Footer Confidence Metadata */}
              <div className="pt-2 border-t border-[#dedede] flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Confidence: <strong className="text-slate-600">{intel?.confidence}</strong></span>
                <span>Contextual Engine · HiiN Verified</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
