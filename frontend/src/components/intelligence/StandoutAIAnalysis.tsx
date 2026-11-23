import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Loader2, RefreshCw, ChevronDown, ChevronUp, AlertCircle, Info, ShieldAlert } from 'lucide-react';
import { SAMPLE_STANDOUT, StandoutAnalysisData } from '../../demo/sampleAnalyses';
import { featureIntelligenceApi } from '../../services/api';

export interface StandoutAIAnalysisProps {
  propertyId: number;
  city?: string;
  className?: string;
}

export const StandoutAIAnalysis: React.FC<StandoutAIAnalysisProps> = ({
  propertyId,
  city = 'Hyderabad',
  className = ''
}) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'result' | 'error'>('idle');
  const [isExpanded, setIsExpanded] = useState(false);
  const [data, setData] = useState<StandoutAnalysisData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSellerStrengthen, setShowSellerStrengthen] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const analysisMode = (import.meta.env.VITE_AI_ANALYSIS_MODE || 'demo').toLowerCase();

  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, []);

  const runAnalysis = async () => {
    setStatus('loading');
    setIsExpanded(true);
    setErrorMessage(null);

    if (analysisMode === 'demo') {
      loadingTimerRef.current = setTimeout(() => {
        setData(SAMPLE_STANDOUT);
        setStatus('result');
        requestAnimationFrame(() => {
          cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
      }, 1500);
    } else {
      try {
        const liveRes = await featureIntelligenceApi.getFeatureIntelligence(propertyId, 'standout', false, false);
        if (liveRes && liveRes.signature_line) {
          setData({
            signature_line: liveRes.signature_line,
            standouts: liveRes.standouts || [],
            worth_weighing: liveRes.worth_weighing || {
              id: 'worth_weighing_default',
              metric: 'data_completeness',
              claim: 'Data completeness blocks additional comparison',
              why: 'Several detailed architectural specifications were not listed in the prospectus.',
              changes_if: 'The builder uploads comprehensive architectural filings.'
            },
            questions: liveRes.questions || [],
            data_that_would_strengthen: liveRes.data_that_would_strengthen || [],
            footer: liveRes.footer || {
              peer_count: 6,
              city: city,
              date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
              peer_set_definition: `Published residential projects in ${city} under construction or new launch (excludes completed and self)`,
              mode: 'ranked'
            }
          });
          setStatus('result');
          requestAnimationFrame(() => {
            cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          });
        } else {
          setErrorMessage('Peer standout analysis is not ready for this property.');
          setStatus('error');
        }
      } catch (err: any) {
        setErrorMessage('Unable to load standout analysis. Please try again.');
        setStatus('error');
      }
    }
  };

  const handleToggle = () => {
    if (status === 'idle') {
      runAnalysis();
    } else if (status === 'result') {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className={`my-4 ${className}`}>
      {/* 1. Action Button Bar (Directly below project stats bar) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          {status === 'idle' && (
            <>
              <button
                type="button"
                onClick={handleToggle}
                aria-expanded={false}
                aria-busy={false}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-teal-600 bg-teal-50 hover:bg-teal-100/80 text-teal-900 font-semibold text-sm shadow-xs transition-colors cursor-pointer focus:ring-2 focus:ring-teal-700 focus:outline-hidden"
              >
                <Sparkles size={16} className="text-teal-700" />
                <span>What stands out</span>
              </button>
              <span className="text-xs text-slate-500 font-normal">
                Compare against active peer projects in {city}
              </span>
            </>
          )}

          {status === 'loading' && (
            <>
              <button
                type="button"
                disabled
                aria-busy={true}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-100 text-slate-400 font-semibold text-sm shadow-xs cursor-not-allowed"
              >
                <Loader2 size={16} className="animate-spin text-teal-700" />
                <span>Computing peer distribution...</span>
              </button>
              <span className="text-xs text-slate-500 font-normal" aria-live="polite">
                Evaluating peer cohort rankings across {city}...
              </span>
            </>
          )}

          {status === 'result' && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggle}
                aria-expanded={isExpanded}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-teal-700 bg-teal-50 text-teal-900 font-semibold text-sm shadow-xs hover:bg-teal-100 transition-colors cursor-pointer"
              >
                <Sparkles size={16} className="text-teal-700" />
                <span>{isExpanded ? 'Hide standouts' : 'What stands out'}</span>
                {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
              <button
                type="button"
                onClick={runAnalysis}
                className="text-xs text-teal-800 hover:text-teal-950 font-semibold underline cursor-pointer flex items-center gap-1"
              >
                <RefreshCw size={12} />
                <span>Recalculate</span>
              </button>
            </div>
          )}
        </div>

        {status === 'result' && data && (
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span className="font-medium text-slate-700">Cohort:</span>
            <span>{data.footer.peer_count} peers in {data.footer.city}</span>
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {status === 'loading' && (
        <div
          role="status"
          aria-live="polite"
          className="mt-3 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs animate-pulse space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="h-5 w-48 bg-slate-200 rounded" />
            <div className="h-6 w-32 bg-slate-200 rounded-full" />
          </div>
          <div className="h-8 w-3/4 bg-slate-200 rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="h-32 bg-slate-100 rounded-xl" />
            <div className="h-32 bg-slate-100 rounded-xl" />
            <div className="h-32 bg-slate-100 rounded-xl" />
          </div>
          <div className="h-20 bg-amber-50 rounded-xl" />
        </div>
      )}

      {/* Error Message */}
      {status === 'error' && (
        <div className="mt-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600" />
            <span>{errorMessage || 'Failed to compute peer analysis.'}</span>
          </div>
          <button
            type="button"
            onClick={runAnalysis}
            className="underline font-semibold hover:text-rose-950 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Result Card */}
      {status === 'result' && isExpanded && data && (
        <div
          ref={cardRef}
          className="mt-3 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs transition-opacity duration-200"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-semibold tracking-wider text-teal-800 uppercase flex items-center gap-1.5">
              <Sparkles size={13} className="text-teal-700" />
              What stands out · Page-level peer analysis
            </span>
            {analysisMode === 'demo' ? (
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Sample analysis
              </span>
            ) : (
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">
                Written by AI from calculated numbers
              </span>
            )}
          </div>

          {/* Signature Line (Prominent & Distinctive, <= 25 words) */}
          <div className="mt-4 mb-6 p-4 rounded-xl bg-gradient-to-r from-teal-50/70 via-slate-50 to-white border border-teal-100/80">
            <div className="text-[11px] font-bold tracking-wider text-teal-800 uppercase mb-1">
              Distinctive signature
            </div>
            <p className="text-lg font-heading font-bold text-[#0f172a] leading-snug">
              {data.signature_line}
            </p>
          </div>

          {/* STANDOUTS (Up to 3 cards) */}
          <div className="mb-6">
            <div className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-3 flex items-center gap-1.5">
              <span>STANDOUT METRICS ({data.standouts.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.standouts.map((st, idx) => (
                <div
                  key={st.id || idx}
                  className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between"
                >
                  <div>
                    {/* Peer Context Badge */}
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100/80 text-teal-900 border border-teal-200">
                        {st.peer_context}
                      </span>
                    </div>

                    {/* Claim (1 line bold) */}
                    <h4 className="text-sm font-bold text-[#0f172a] leading-snug">
                      {st.claim}
                    </h4>

                    {/* Why (reasoning chain) */}
                    <p className="text-xs text-[#334155] leading-relaxed mt-2">
                      {st.why}
                    </p>
                  </div>

                  {/* Changes if */}
                  {st.changes_if && (
                    <div className="mt-3 pt-2 border-t border-slate-200/70 text-[11px] text-[#475569]">
                      <span className="font-semibold text-[#b45309]">Changes if:</span>{' '}
                      {st.changes_if}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* WORTH WEIGHING (1 item extreme or trade-off) */}
          {data.worth_weighing && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50/60 border border-amber-200/80">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-bold tracking-wider text-amber-900 uppercase">
                  WORTH WEIGHING (OPPOSITE EXTREME)
                </span>
              </div>
              <h4 className="text-sm font-bold text-amber-950">
                {data.worth_weighing.claim}
              </h4>
              <p className="text-xs text-amber-900/90 mt-1.5 leading-relaxed">
                {data.worth_weighing.why}
              </p>
              {data.worth_weighing.changes_if && (
                <div className="mt-2.5 pt-2 border-t border-amber-200/60 text-[11px] text-amber-950">
                  <span className="font-semibold text-amber-800">Changes if:</span>{' '}
                  {data.worth_weighing.changes_if}
                </div>
              )}
            </div>
          )}

          {/* QUESTIONS FOR BUILDER */}
          {data.questions && data.questions.length > 0 && (
            <div className="mb-6 pt-4 border-t border-slate-100">
              <div className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-2.5">
                QUESTIONS FOR THE BUILDER
              </div>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#334155]">
                {data.questions.map((q, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* SELLER VIEW: Data That Would Strengthen This */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowSellerStrengthen(!showSellerStrengthen)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <Info size={14} className="text-slate-500" />
                <span>Seller view: Data that would strengthen this analysis</span>
                {showSellerStrengthen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
            </div>

            {showSellerStrengthen && (
              <div className="mt-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2">
                <p className="text-slate-600 font-medium">
                  Missing specifications that blocked an extreme stand-out metric or required an assumption:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-700">
                  {data.data_that_would_strengthen.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* FOOTER */}
          <div className="mt-6 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>
              Cohort: {data.footer.peer_count} peers in {data.footer.city} ({data.footer.mode} mode) · {data.footer.peer_set_definition}
            </span>
            <span>Evaluated: {data.footer.date}</span>
          </div>
        </div>
      )}
    </div>
  );
};
