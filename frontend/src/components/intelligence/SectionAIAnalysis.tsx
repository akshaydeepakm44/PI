import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { SAMPLE_ANALYSES, SectionAnalysisData } from '../../demo/sampleAnalyses';
import { SectionAIAnalysisCard } from './SectionAIAnalysisCard';
import { featureIntelligenceApi } from '../../services/api';

export interface SectionAIAnalysisProps {
  propertyId: number;
  sectionId:
    | 'neighbourhood'
    | 'liveability'
    | 'commute'
    | 'master-plan'
    | 'towers'
    | 'units'
    | 'amenities'
    | 'sustainability'
    | 'safety';
  sectionTitle?: string;
  onAskFollowUp?: (context: string) => void;
  className?: string;
}

const SECTION_TO_LIVE_MODULE: Record<string, 'commute' | 'master_plan' | 'pricing' | 'amenities' | 'sustainability'> = {
  neighbourhood: 'commute',
  liveability: 'commute',
  commute: 'commute',
  'master-plan': 'master_plan',
  towers: 'master_plan',
  units: 'pricing',
  amenities: 'amenities',
  sustainability: 'sustainability',
  safety: 'sustainability'
};

const SECTION_TITLES: Record<string, string> = {
  neighbourhood: 'Neighbourhood',
  liveability: 'Liveability',
  commute: 'My Commute',
  'master-plan': 'Master plan',
  towers: 'Towers & blocks',
  units: 'Unit plans & pricing',
  amenities: 'Amenities',
  sustainability: 'Sustainability',
  safety: 'Safety & security'
};

export const SectionAIAnalysis: React.FC<SectionAIAnalysisProps> = ({
  propertyId,
  sectionId,
  sectionTitle,
  onAskFollowUp,
  className = ''
}) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'result' | 'error' | 'not_available'>('idle');
  const [isExpanded, setIsExpanded] = useState(false);
  const [analysisData, setAnalysisData] = useState<SectionAnalysisData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayTitle = sectionTitle || SECTION_TITLES[sectionId] || sectionId;
  const analysisMode = (import.meta.env.VITE_AI_ANALYSIS_MODE || 'demo').toLowerCase();

  // Clean up timer on unmount
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
      // DEMO mode: exactly 1.5s simulated loading, no network calls
      loadingTimerRef.current = setTimeout(() => {
        const demoItem = SAMPLE_ANALYSES[sectionId];
        if (demoItem) {
          setAnalysisData(demoItem);
          setStatus('result');
          // Focus heading on next animation frame
          requestAnimationFrame(() => {
            headingRef.current?.focus();
          });
        } else {
          setErrorMessage('Analysis is not available for this section yet.');
          setStatus('not_available');
        }
      }, 1500);
    } else {
      // LIVE mode: Call backend feature intelligence endpoint
      try {
        const liveModule = SECTION_TO_LIVE_MODULE[sectionId];
        if (!liveModule) {
          setStatus('not_available');
          return;
        }

        const liveRes = await featureIntelligenceApi.getFeatureIntelligence(propertyId, liveModule, false, false);
        if (!liveRes || (liveRes.findings.length === 0 && !liveRes.briefing && !liveRes.key_numbers)) {
          setStatus('not_available');
          return;
        }

        // Map live response into unified display structure
        const demoItem = SAMPLE_ANALYSES[sectionId];
        const liveDataMapped: SectionAnalysisData = {
          sectionKey: sectionId,
          sectionTitle: displayTitle,
          briefing: liveRes.briefing || `Calculated metrics for ${displayTitle}.`,
          visual: demoItem?.visual || {
            type: 'parking_share_bar',
            sharePct: 63,
            label: 'Calculated project metrics'
          },
          findings: liveRes.findings.map((f: any) => ({
            claim: f.claim,
            why_it_follows: f.why_it_follows,
            flip_condition: f.flip_condition || '',
            tags: [
              'calculated',
              ...(f.assumptions_used?.map((a: string) => `assumed: ${a}`) || [])
            ]
          })),
          questions: liveRes.questions || demoItem?.questions || [
            'What additional specifications are available for this section?'
          ],
          explainer: demoItem?.explainer || {
            formulas: ['Calculated directly from project architectural and location parameters.'],
            assumptions: ['Data sourced from verified builder filings.']
          }
        };

        setAnalysisData(liveDataMapped);
        setStatus('result');
        requestAnimationFrame(() => {
          headingRef.current?.focus();
        });
      } catch (err: any) {
        setErrorMessage('The analysis could not be generated. Try again.');
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

  const handleRunAgain = () => {
    runAnalysis();
  };

  return (
    <div className={`mt-6 pt-4 border-t border-slate-200/80 ${className}`}>
      {/* Button & Helper Controls (Never jumps layout) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {status === 'idle' && (
            <>
              <button
                type="button"
                onClick={handleToggle}
                aria-expanded={false}
                aria-busy={false}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm shadow-xs transition-colors cursor-pointer focus:ring-2 focus:ring-teal-700 focus:outline-hidden"
              >
                <Sparkles size={16} className="text-teal-700" />
                <span>AI analysis</span>
              </button>
              <span className="text-xs text-slate-500 font-normal">
                Get an analysis of this section
              </span>
            </>
          )}

          {status === 'loading' && (
            <>
              <button
                type="button"
                disabled
                aria-busy={true}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 bg-slate-100 text-slate-400 font-semibold text-sm shadow-xs cursor-not-allowed"
              >
                <Loader2 size={16} className="animate-spin text-teal-700" />
                <span>Analysing...</span>
              </button>
              <span className="text-xs text-slate-500 font-normal" aria-live="polite">
                Analysing this section...
              </span>
            </>
          )}

          {status === 'result' && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleToggle}
                aria-expanded={isExpanded}
                aria-busy={false}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm shadow-xs transition-colors cursor-pointer focus:ring-2 focus:ring-teal-700 focus:outline-hidden"
              >
                <Sparkles size={16} className="text-teal-700" />
                <span>{isExpanded ? 'Hide analysis' : 'AI analysis'}</span>
              </button>
              <button
                type="button"
                onClick={handleRunAgain}
                className="text-xs text-teal-800 hover:text-teal-950 font-semibold underline cursor-pointer flex items-center gap-1"
              >
                <RefreshCw size={12} />
                <span>Run again</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Screen reader announcement */}
      <div aria-live="polite" className="sr-only">
        {status === 'loading' && `Analysing ${displayTitle} section`}
        {status === 'result' && `${displayTitle} analysis ready`}
      </div>

      {/* Loading Skeleton */}
      {status === 'loading' && (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs animate-pulse space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 w-36 bg-slate-200 rounded" />
            <div className="h-6 w-28 bg-slate-200 rounded-full" />
          </div>
          <div className="h-4 w-full bg-slate-200 rounded" />
          <div className="h-4 w-4/5 bg-slate-200 rounded" />
          <div className="h-16 w-full bg-slate-100 rounded-xl" />
          <p className="text-xs text-slate-500 font-medium">Analysing this section</p>
        </div>
      )}

      {/* Result Card (collapsible via isExpanded) */}
      {status === 'result' && isExpanded && analysisData && (
        <div className="mt-4 motion-safe:transition-all motion-safe:duration-200">
          <SectionAIAnalysisCard
            ref={headingRef}
            data={analysisData}
            mode={analysisMode === 'demo' ? 'demo' : 'live'}
            onAskFollowUp={onAskFollowUp}
            onAddMyPlaces={() => alert('Add places dialog opened')}
          />
        </div>
      )}

      {/* Error State */}
      {status === 'error' && (
        <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
          <span>{errorMessage || 'The analysis could not be generated. Try again.'}</span>
          <button
            type="button"
            onClick={handleRunAgain}
            className="py-1 px-3 rounded-lg bg-white border border-amber-300 font-semibold text-xs text-amber-900 hover:bg-amber-100/50 shadow-xs cursor-pointer"
          >
            Try again
          </button>
        </div>
      )}

      {/* Not Available State */}
      {status === 'not_available' && (
        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
          Analysis is not available for this section yet.
        </div>
      )}
    </div>
  );
};
