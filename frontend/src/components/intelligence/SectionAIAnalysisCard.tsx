import React, { useState, forwardRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { SectionAnalysisData } from '../../demo/sampleAnalyses';
import { SectionAIAnalysisVisual } from './SectionAIAnalysisVisual';

export interface SectionAIAnalysisCardProps {
  data: SectionAnalysisData;
  mode?: 'demo' | 'live';
  onAskFollowUp?: (context: string) => void;
  onAddMyPlaces?: () => void;
  className?: string;
}

export const SectionAIAnalysisCard = forwardRef<HTMLHeadingElement, SectionAIAnalysisCardProps>(
  ({ data, mode = 'demo', onAskFollowUp, onAddMyPlaces, className = '' }, ref) => {
    const [showExplanation, setShowExplanation] = useState(false);

    // Format briefing text with green highlight tags for bolded items
    const renderFormattedBriefing = (text: string) => {
      if (!text) return null;
      const parts = text.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p className="text-[16px] leading-relaxed text-[#0f172a] mt-3 mb-5 font-normal">
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              const inner = part.slice(2, -2);
              return (
                <strong
                  key={i}
                  className="font-bold bg-[#dcfce7] text-[#14532d] px-1 py-0.5 rounded mx-0.5"
                >
                  {inner}
                </strong>
              );
            }
            return <span key={i}>{part}</span>;
          })}
        </p>
      );
    };

    return (
      <div
        className={`bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs transition-opacity duration-200 ${className}`}
      >
        {/* 1. Header Bar: Small label & Badge */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-xs font-semibold tracking-wider text-teal-800 uppercase">
            Agent briefing · {data.sectionTitle}
          </span>
          {mode === 'demo' ? (
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Sample analysis
            </span>
          ) : (
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">
              Written by AI from calculated numbers
            </span>
          )}
        </div>

        {/* 2. Heading (receives keyboard focus) */}
        <h3
          ref={ref}
          tabIndex={-1}
          className="text-lg font-heading font-bold text-[#0f172a] mt-3 outline-none focus:ring-2 focus:ring-teal-600 focus:rounded"
        >
          {data.sectionTitle} Intelligence Briefing
        </h3>

        {/* 3. Executive Briefing Paragraph (16-17px, numbers highlighted) */}
        {renderFormattedBriefing(data.briefing)}

        {/* 4. Exactly One Tailored Visual */}
        {data.visual && (
          <SectionAIAnalysisVisual
            visual={data.visual}
            onAddMyPlaces={onAddMyPlaces}
          />
        )}

        {/* 5. WORTH KNOWING: All findings visible, no tabs */}
        {data.findings && data.findings.length > 0 && (
          <div className="mt-6">
            <div className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-4">
              WORTH KNOWING
            </div>
            <div className="space-y-5">
              {data.findings.map((f, idx) => (
                <div key={idx} className="pb-4 border-b border-slate-100 last:border-b-0 last:pb-0">
                  {/* Claim: 1 line, 16px bold */}
                  <h4 className="text-base font-bold text-[#0f172a] leading-snug">
                    {f.claim}
                  </h4>

                  {/* Why it follows: up to 2 lines, 15px body */}
                  <p className="text-[15px] text-[#334155] leading-relaxed mt-1">
                    {f.why_it_follows}
                  </p>

                  {/* Changes if: amber bold label */}
                  {f.flip_condition && (
                    <p className="text-sm mt-1 text-[#475569]">
                      <span className="font-semibold text-[#b45309]">Changes if:</span>{' '}
                      {f.flip_condition}
                    </p>
                  )}

                  {/* Tags */}
                  {f.tags && f.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      {f.tags.map((t, i) => {
                        let colorClass = 'bg-slate-100 text-slate-600 border-slate-200';
                        if (t.includes('calculated')) {
                          colorClass = 'bg-sky-50 text-sky-700 border-sky-200';
                        } else if (t.includes('assumed')) {
                          colorClass = 'bg-amber-50 text-amber-800 border-amber-200';
                        }
                        return (
                          <span
                            key={i}
                            className={`border text-xs px-2 py-0.5 rounded ${colorClass}`}
                          >
                            {t}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. WORTH ASKING: 2-3 questions for the builder */}
        {data.questions && data.questions.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-3">
              WORTH ASKING
            </div>
            <ul className="list-disc pl-5 space-y-1.5 text-[15px] text-[#334155]">
              {data.questions.map((q, idx) => (
                <li key={idx} className="leading-relaxed">
                  {q}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 7. Collapsible "How we worked this out" */}
        <div className="mt-6 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowExplanation(!showExplanation)}
            className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>How we worked this out</span>
            {showExplanation ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showExplanation && data.explainer && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-3">
              {data.explainer.formulas && data.explainer.formulas.length > 0 && (
                <>
                  <div className="font-semibold text-slate-900 border-b border-slate-200 pb-1.5">
                    Formulas &amp; Method:
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    {data.explainer.formulas.map((form, i) => (
                      <li key={i}>{form}</li>
                    ))}
                  </ul>
                </>
              )}

              {data.explainer.assumptions && data.explainer.assumptions.length > 0 && (
                <>
                  <div className="font-semibold text-slate-900 border-b border-slate-200 pt-2 pb-1.5">
                    Key Assumptions:
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    {data.explainer.assumptions.map((assump, i) => (
                      <li key={i}>{assump}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>

        {/* 8. Mandatory Footer Note (Demo Mode) / Action Button (Live Mode) */}
        {mode === 'demo' ? (
          <div className="mt-6 pt-4 border-t border-slate-100 text-center sm:text-left">
            <p className="text-xs text-slate-500 italic">
              Sample content shown to demonstrate how analysis will appear. Not a verified analysis of this property.
            </p>
          </div>
        ) : (
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end">
            {onAskFollowUp && (
              <button
                type="button"
                onClick={() => onAskFollowUp(data.briefing)}
                className="py-2 px-4 rounded-lg bg-[#0f2744] hover:bg-[#0a1b30] text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer focus:ring-2 focus:ring-offset-2 focus:ring-[#0f2744]"
              >
                Ask a follow-up
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
);

SectionAIAnalysisCard.displayName = 'SectionAIAnalysisCard';
