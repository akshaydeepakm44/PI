import React, { useState, forwardRef } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Scale,
  Target,
  CheckSquare,
  User,
  AlertCircle,
  Building2,
  Globe,
  Car,
  SlidersHorizontal
} from 'lucide-react';
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

        {/* Profile Header (if present, e.g. for My Commute) */}
        {data.profile_header && (
          <div className="mt-3.5 p-3 bg-indigo-50/80 border border-indigo-100 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs text-indigo-950 font-medium">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-700 shrink-0" />
              <span>{data.profile_header.text}</span>
            </div>
            <div className="flex items-center gap-2.5">
              {data.profile_header.hasEdit && onAddMyPlaces && (
                <button
                  type="button"
                  onClick={onAddMyPlaces}
                  className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline cursor-pointer"
                >
                  Edit
                </button>
              )}
              {data.profile_header.hasAddPlaces && onAddMyPlaces && (
                <button
                  type="button"
                  onClick={onAddMyPlaces}
                  className="px-2.5 py-1 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-md font-semibold text-indigo-800 text-[11px] shadow-xs cursor-pointer"
                >
                  Add my places
                </button>
              )}
            </div>
          </div>
        )}

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

                  {/* For you line (if present) */}
                  {f.for_you && (
                    <div className="mt-2 p-2.5 bg-indigo-50/70 border-l-2 border-indigo-500 rounded-r-lg text-sm text-indigo-950">
                      <span className="font-semibold text-indigo-900">For you:</span> {f.for_you}
                    </div>
                  )}

                  {/* My view would change if: amber bold label */}
                  {f.flip_condition && (
                    <p className="text-sm mt-1.5 text-[#475569]">
                      <span className="font-semibold text-[#b45309]">My view would change if:</span>{' '}
                      {f.flip_condition}
                    </p>
                  )}

                  {/* Source Chips by Family */}
                  {f.tags && f.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                      {f.tags.map((t, i) => {
                        let IconComp = Globe;
                        let chipStyle = 'bg-slate-50 text-slate-700 border-slate-200';
                        const tLow = t.toLowerCase();
                        if (tLow.includes('builder')) {
                          IconComp = Building2;
                          chipStyle = 'bg-slate-50 text-slate-700 border-slate-200';
                        } else if (tLow.includes('map')) {
                          IconComp = Globe;
                          chipStyle = 'bg-sky-50 text-sky-800 border-sky-200';
                        } else if (tLow.includes('traffic')) {
                          IconComp = Car;
                          chipStyle = 'bg-amber-50 text-amber-800 border-amber-200';
                        } else if (tLow.includes('you')) {
                          IconComp = User;
                          chipStyle = 'bg-indigo-50 text-indigo-800 border-indigo-200';
                        } else if (tLow.includes('assumed')) {
                          IconComp = SlidersHorizontal;
                          chipStyle = 'bg-slate-50 text-slate-700 border-slate-200';
                        } else if (tLow.includes('peer')) {
                          IconComp = Building2;
                          chipStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                        }
                        return (
                          <span
                            key={i}
                            className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border font-medium ${chipStyle}`}
                          >
                            <IconComp className="w-3 h-3 shrink-0" />
                            <span>{t}</span>
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

        {/* 6. THE TENSION (if present) */}
        {data.tension && (
          <div className="mt-6 p-4 rounded-xl bg-amber-50/70 border border-amber-200/80">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900 mb-1.5">
              <Scale className="w-4 h-4 text-amber-700 shrink-0" />
              <span>The Tension</span>
            </div>
            <p className="text-sm text-amber-950 font-medium leading-relaxed">
              {data.tension.contrast}
            </p>
          </div>
        )}

        {/* 7. SETTLE THIS FIRST (if present) */}
        {data.settle_first && (
          <div className="mt-4 p-4 rounded-xl bg-rose-50/60 border border-rose-200/80">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-900 mb-1.5">
              <Target className="w-4 h-4 text-rose-700 shrink-0" />
              <span>Settle This First</span>
            </div>
            <p className="text-sm text-rose-950 font-medium leading-relaxed">
              {data.settle_first.recommendation}
            </p>
          </div>
        )}

        {/* 8. CHECKS YOU CAN MAKE NOW (if present) */}
        {data.checks_you_can_make_now && data.checks_you_can_make_now.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-3 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-teal-700 shrink-0" />
              <span>Checks You Can Make Now</span>
            </div>
            <ul className="space-y-2">
              {data.checks_you_can_make_now.map((chk, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                  <span className="w-4 h-4 mt-0.5 rounded border border-slate-300 bg-white shrink-0 flex items-center justify-center text-[10px] text-teal-700 font-bold">✓</span>
                  <span className="leading-snug">{chk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 9. WORTH ASKING: questions for the builder */}
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

        {/* 10. Collapsible "How we worked this out" */}
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

        {/* 11. Mandatory Footer Note (Demo Mode) / Action Button (Live Mode) */}
        {mode === 'demo' ? (
          <div className="mt-6 pt-4 border-t border-slate-100 space-y-2.5">
            {data.footer_meta && (
              <p className="text-xs text-slate-600 font-medium">
                {data.footer_meta}
              </p>
            )}
            <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs font-medium text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Sample data. Not the real surroundings, peers or traffic of this project.</span>
            </div>
            <p className="text-xs text-slate-400 italic">
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
