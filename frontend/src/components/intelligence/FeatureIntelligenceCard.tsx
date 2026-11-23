import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronUp,
  MessageSquare,
  RefreshCw,
  Send,
  X
} from 'lucide-react';
import { featureIntelligenceApi } from '../../services/api';

export interface EvidenceFootnote {
  type: 'verified' | 'calculated' | 'observed' | 'assumed';
  ref: string;
}

export interface FeatureFinding {
  claim: string;
  why_it_follows: string;
  what_it_changes?: string;
  flip_condition: string;
  analytical_move?: string;
  evidence_footnotes?: EvidenceFootnote[];
  assumptions_used?: string[];
  confidence?: 'high' | 'medium' | 'low';
  kind?: 'finding' | 'data_gap';
}

export interface KeyNumberItem {
  value: string;
  label: string;
  sublabel?: string | null;
  assumption?: string | null;
}

export interface FeatureIntelligenceResponse {
  status: 'ready' | 'pending';
  property_id: number;
  module: string;
  generated_by: 'llm' | 'calculation';
  llm_status: 'active' | 'unavailable';
  ai_summary_available: boolean;
  cached: boolean;
  briefing?: string | null;
  key_numbers?: KeyNumberItem[];
  questions?: string[];
  packet?: Record<string, any>;
  findings: FeatureFinding[];
}

interface FeatureIntelligenceCardProps {
  propertyId: number;
  module: 'pricing' | 'master_plan' | 'commute' | 'amenities' | 'sustainability';
  onAskFollowUp?: (initialContext: string) => void;
  className?: string;
  forceUnavailableDemo?: boolean;
}

const MODULE_LABELS: Record<string, string> = {
  pricing: 'AGENT BRIEFING • PRICING',
  master_plan: 'AGENT BRIEFING • MASTER PLAN',
  commute: 'AGENT BRIEFING • COMMUTE',
  amenities: 'AGENT BRIEFING • AMENITIES',
  sustainability: "AGENT'S NOTE • LAND × WATER × WIND"
};

export const FeatureIntelligenceCard: React.FC<FeatureIntelligenceCardProps> = ({
  propertyId,
  module,
  onAskFollowUp,
  className = '',
  forceUnavailableDemo = false
}) => {
  const [showExplanation, setShowExplanation] = useState(false);
  const [showRawPacket, setShowRawPacket] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Single-agent inline follow-up state
  const [followupOpen, setFollowupOpen] = useState(false);
  const [followupQuestion, setFollowupQuestion] = useState('');
  const [followupAnswer, setFollowupAnswer] = useState<string | null>(null);
  const [isSubmittingFollowup, setIsSubmittingFollowup] = useState(false);
  const [followupError, setFollowupError] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  } = useQuery<FeatureIntelligenceResponse>({
    queryKey: ['feature-intelligence', propertyId, module, forceUnavailableDemo],
    queryFn: () => featureIntelligenceApi.getFeatureIntelligence(propertyId, module, false, forceUnavailableDemo),
    staleTime: 1000 * 60 * 30, // 30 minutes
    refetchOnWindowFocus: false
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await featureIntelligenceApi.getFeatureIntelligence(propertyId, module, true, false);
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFollowupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followupQuestion.trim() || isSubmittingFollowup) return;
    setIsSubmittingFollowup(true);
    setFollowupError(null);
    try {
      const claimContext = data?.findings?.[0]?.claim || data?.briefing || `${module} intelligence`;
      const res = await featureIntelligenceApi.askFeatureFollowup(propertyId, {
        module,
        finding_claim: claimContext,
        question: followupQuestion.trim()
      });
      setFollowupAnswer(res.answer);
    } catch (err: any) {
      setFollowupError(err?.message || 'Failed to retrieve answer from intelligence agent');
    } finally {
      setIsSubmittingFollowup(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs animate-pulse ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-40 bg-slate-200 rounded" />
          <div className="h-6 w-36 bg-slate-200 rounded-full" />
        </div>
        <div className="space-y-3 mt-4">
          <div className="h-4 w-full bg-slate-200 rounded" />
          <div className="h-4 w-5/6 bg-slate-200 rounded" />
          <div className="h-12 w-full bg-slate-100 rounded-xl mt-4" />
        </div>
      </div>
    );
  }

  const isAiWritten = Boolean(data?.ai_summary_available && data?.briefing);
  const moduleLabel = MODULE_LABELS[module] || `AGENT BRIEFING • ${module.toUpperCase()}`;

  // Helper to format briefing text with green highlight tags for bolded items
  const renderFormattedBriefing = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p className="text-[15px] leading-relaxed text-[#0f172a] mt-3 mb-5 font-normal">
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

  // Plain language explainer formulas and assumptions for each module
  const getExplainerContent = () => {
    switch (module) {
      case 'pricing':
        return {
          formulas: [
            'Carpet sq ft rate = Quoted unit price ÷ carpet area inside walls (₹1.12 Cr ÷ 897 sq ft = ₹12,486/sq ft).',
            'Carpet efficiency = Carpet area ÷ super built-up brochure area (897 sq ft ÷ 1,300 sq ft = 69.0%).',
            'Marginal expansion rate = Difference in price ÷ difference in carpet area (₹50 L ÷ 400 sq ft = ₹12,500/sq ft).',
            'Floor rise waiver savings = Total floors above start floor × floor rise rate × super built-up area.'
          ],
          assumptions: [
            'Start floor: floor rise charges commence on floor 5 (floors 1–4 are flat).',
            'Area breakdown: 897 sq ft carpet, 104 sq ft private balcony, 299 sq ft common/shared circulation.'
          ]
        };
      case 'commute':
        return {
          formulas: [
            'Annual transit hours = One-way duration × 2 trips daily × 250 working days ÷ 60 minutes (22 min × 500 trips ÷ 60 = 183.3 hours).',
            'Equivalent work weeks = Annual transit hours ÷ standard 40-hour work week (183.3 hrs ÷ 40 hrs = 4.6 weeks).',
            'Implied travel speed = Road distance km ÷ travel duration hours (8.5 km ÷ [22 ÷ 60] hrs = 23.2 km/h).'
          ],
          assumptions: [
            'Working year: 250 office days per calendar year (assuming 5-day week, excluding public holidays).',
            'Frequency: 2 one-way trips per office day (morning outbound and evening return).'
          ]
        };
      case 'master_plan':
        return {
          formulas: [
            'Homes per passenger lift = Total residential units ÷ total passenger lifts across towers (1,406 homes ÷ 18 lifts = 78.1 homes/lift).',
            'Tower unit discrepancy = (Floors × declared units per floor × towers) - actual tower sum (24 × 10 × 6 = 1,440 vs 1,406 actual).',
            'Single-level parking footprint = Total units × 1 slot × 30 sq m per car (1,406 × 30 = 42,180 sq m).',
            'Parking share of site = Required parking area ÷ total site area (42,180 sq m ÷ 66,773 sq m = 63.2%).'
          ],
          assumptions: [
            'Site area: 16.5 acres = 66,773.13 square metres.',
            'Parking allotment: 1 standard vehicular bay per home with 30 sq m per slot (including internal drive aisles and structural columns).'
          ]
        };
      case 'amenities':
        return {
          formulas: [
            'Clubhouse allocation = Total clubhouse footprint ÷ total residential units (50,000 sq ft ÷ 1,406 units = 35.6 sq ft/home).'
          ],
          assumptions: [
            'Clubhouse footprint: 50,000 sq ft indoor amenity space.',
            'Central open space: 68% of 16.5-acre site maintained as vehicle-free community park.'
          ]
        };
      case 'sustainability':
      default:
        return {
          formulas: [
            'Solar shadow throw length = Tower structural height ÷ tan(solar elevation angle) (72 m ÷ tan(18°) ≈ 270 m at winter solstice).'
          ],
          assumptions: [
            'Tower structural height: 24 floors at 3.0 m floor-to-floor = 72 metres.',
            'Solar azimuth range: Hyderabad latitude 17.4° N yields winter sunrise 115° ESE to summer sunrise 65° ENE.'
          ]
        };
    }
  };

  const explainer = getExplainerContent();

  // =========================================================================
  // MODULE: SUSTAINABILITY (LAND, WATER AND WIND) SPECIAL LAYOUT
  // Matches uploaded reference design media_1795412771927_1f462691.png
  // =========================================================================
  if (module === 'sustainability') {
    return (
      <div className={`bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs ${className}`}>
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-xs font-semibold tracking-wider text-teal-800 uppercase">
            AGENT'S NOTE • LAND × WATER × WIND
          </span>
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            Needs open data and plan
          </span>
        </div>

        <h3 className="text-xl font-heading font-bold text-[#0f172a] mt-4 mb-5">
          Land, water and wind
        </h3>

        {/* 2x2 Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Card 1: Where the rain goes */}
          <div className="bg-[#f8fafc] border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                ELEVATION DATA
              </span>
              <h4 className="text-base font-bold text-[#0f172a] mt-2 mb-1.5">Where the rain goes</h4>
              <p className="text-[14px] text-[#334155] leading-relaxed">
                “The site sits [X] m above or below its 1 km surroundings. The nearest flow path passes [N] m from Tower [x].” From open elevation data. Not a flood certificate.
              </p>
            </div>
            <p className="text-xs text-slate-500 italic mt-3">
              Data: free elevation model. Local drains are not in it.
            </p>
          </div>

          {/* Card 2: Cars go underground */}
          <div className="bg-[#f8fafc] border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                ELEVATION × PARKING
              </span>
              <h4 className="text-base font-bold text-[#0f172a] mt-2 mb-1.5">Cars go underground, so water matters</h4>
              <p className="text-[14px] text-[#334155] leading-relaxed">
                With a car-free podium and parked cars below, the question is whether the basement sits at a low point. Needs site elevation and the basement depth.
              </p>
            </div>
            <p className="text-xs text-slate-500 italic mt-3">
              Ask: basement depth and the pumping and drainage design.
            </p>
          </div>

          {/* Card 3: Which openings catch the breeze */}
          <div className="bg-[#f8fafc] border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                WIND × PLAN
              </span>
              <h4 className="text-base font-bold text-[#0f172a] mt-2 mb-1.5">Which openings catch the breeze</h4>
              <p className="text-[14px] text-[#334155] leading-relaxed">
                The page says towers face east and north. Hyderabad's monsoon winds mostly come from the west and southwest, so those openings are probably on the lee side in the monsoon.
              </p>
            </div>
            <p className="text-xs text-slate-500 italic mt-3">
              Needs wind data and opening positions. Indicative only.
            </p>
          </div>

          {/* Card 4: What you can see from the 18th floor */}
          <div className="bg-[#f8fafc] border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-700">
                LAKES × VIEW
              </span>
              <h4 className="text-base font-bold text-[#0f172a] mt-2 mb-1.5">What you can see from the 18th floor</h4>
              <p className="text-[14px] text-[#334155] leading-relaxed">
                Open map building heights plus floor height give a line of sight to the green or a lake. Future construction on empty plots is unknown.
              </p>
            </div>
            <p className="text-xs text-slate-500 italic mt-3">
              Data: building heights, floor level.
            </p>
          </div>
        </div>

        {/* 2 Dark Bottom Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#0f2744] text-white rounded-xl p-4">
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-300">
              NOT CLAIMED
            </span>
            <p className="text-sm font-medium mt-1 leading-snug">
              Flood safety, wind comfort or views. Each needs data we do not have yet.
            </p>
          </div>
          <div className="bg-[#0f2744] text-white rounded-xl p-4">
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-300">
              TO CONFIRM
            </span>
            <p className="text-sm font-medium mt-1 leading-snug">
              Exact site pin, elevation data, wind data, plan openings.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STANDARD MODULES: PRICING, COMMUTE, MASTER PLAN
  // =========================================================================
  return (
    <div className={`bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs ${className}`}>
      {/* 1. Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <span className="text-xs font-semibold tracking-wider text-teal-800 uppercase">
          {moduleLabel}
        </span>
        {isAiWritten ? (
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#e6f4ea] text-[#137333] border border-[#ceead6]">
            Written by AI from calculated numbers
          </span>
        ) : (
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#fef3c7] text-[#92400e] border border-[#fde68a]">
            AI summary unavailable
          </span>
        )}
      </div>

      {/* 2. Main Content Area */}
      {isAiWritten ? (
        // ---------------------------------------------------------------------
        // STATE A: AI WRITTEN BRIEFING & FINDINGS
        // ---------------------------------------------------------------------
        <div>
          {/* Executive Briefing with styled bold highlights */}
          {renderFormattedBriefing(data?.briefing || '')}

          {/* Module-Specific Single Visual (One Only per module) */}
          {module === 'pricing' && (
            <div className="bg-[#f8fafc] border border-slate-200/80 rounded-xl p-4 my-5">
              <div className="text-xs font-medium text-slate-600 mb-2.5">
                What the 1,300 sq ft in the ₹1.12 Cr pays for
              </div>
              {/* Stacked Horizontal Bar */}
              <div className="h-8 w-full rounded-lg overflow-hidden flex items-stretch text-white text-xs font-semibold">
                <div
                  className="bg-[#15803d] flex items-center px-3 truncate"
                  style={{ width: '69%' }}
                  title="897 sq ft carpet inside the walls (69%)"
                >
                  897 inside the walls
                </div>
                <div
                  className="bg-[#0f766e] flex items-center justify-center px-1"
                  style={{ width: '8%' }}
                  title="104 sq ft private balcony (8%)"
                />
                <div
                  className="bg-[#475569] flex items-center justify-end px-3 truncate"
                  style={{ width: '23%' }}
                  title="299 sq ft shared circulation (23%)"
                >
                  299 shared
                </div>
              </div>
              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#15803d]" />
                  <span>897 sq ft carpet (69%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#0f766e]" />
                  <span>104 sq ft balcony (8%)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#475569]" />
                  <span>299 sq ft shared (23%)</span>
                </div>
              </div>
            </div>
          )}

          {module === 'commute' && (
            <div className="bg-[#f8fafc] border border-slate-200/80 rounded-xl p-4 my-5">
              <div className="text-xs font-medium text-slate-600 mb-2.5">
                183 hours a year, in 40-hour work weeks (2 trips a day, 250 days: assumed)
              </div>
              {/* 40-hour work week blocks */}
              <div className="flex items-center gap-2 max-w-md">
                <div className="h-8 flex-1 rounded-md bg-[#15803d]" title="Week 1: 40 hours" />
                <div className="h-8 flex-1 rounded-md bg-[#15803d]" title="Week 2: 40 hours" />
                <div className="h-8 flex-1 rounded-md bg-[#15803d]" title="Week 3: 40 hours" />
                <div className="h-8 flex-1 rounded-md bg-[#15803d]" title="Week 4: 40 hours" />
                <div className="h-8 flex-1 rounded-md bg-slate-200 overflow-hidden flex" title="Week 5: 23 hours">
                  <div className="h-full bg-[#15803d]" style={{ width: '58%' }} />
                </div>
                <div className="h-8 flex-1 rounded-md bg-slate-200" title="Week 6: 0 hours" />
              </div>
              <div className="text-xs text-slate-600 mt-2">
                4.6 work weeks a year
              </div>
            </div>
          )}

          {module === 'master_plan' && (
            <div className="bg-[#f8fafc] border border-slate-200/80 rounded-xl p-4 my-5">
              <div className="text-xs font-medium text-slate-600 mb-2.5">
                Parking area as a share of the 66,773 sq m site, on one level (1 slot per home, 30 sq m per slot: assumed)
              </div>
              {/* Single Level Parking Share Bar */}
              <div className="h-8 w-full rounded-lg bg-slate-200 overflow-hidden flex items-stretch">
                <div
                  className="bg-[#475569] text-white text-xs font-semibold flex items-center px-3"
                  style={{ width: '63%' }}
                >
                  63%
                </div>
              </div>
              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#475569]" />
                  <span>42,180 sq m of parking</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-slate-200" />
                  <span>rest of the site</span>
                </div>
              </div>
            </div>
          )}

          {/* WORTH KNOWING: All findings visible (NO TABS!) */}
          {data?.findings && data.findings.length > 0 && (
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

                    {/* Small tag pills */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="bg-slate-100 text-slate-600 border border-slate-200 text-xs px-2 py-0.5 rounded">
                        builder data
                      </span>
                      <span className="bg-sky-50 text-sky-700 border border-sky-200 text-xs px-2 py-0.5 rounded">
                        calculated
                      </span>
                      {f.assumptions_used && f.assumptions_used.length > 0 && (
                        f.assumptions_used.map((a, i) => (
                          <span
                            key={i}
                            className="bg-amber-50 text-amber-800 border border-amber-200 text-xs px-2 py-0.5 rounded"
                          >
                            assumed: {a.replace(/_/g, ' ')}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* WORTH ASKING: Bullet list of builder questions */}
          {data?.questions && data.questions.length > 0 && (
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
        </div>
      ) : (
        // ---------------------------------------------------------------------
        // STATE B: AI SUMMARY UNAVAILABLE (NUMBERS ONLY, NO NARRATIVE)
        // Matches uploaded reference design media_1795412794813_18c8d7c7.png
        // ---------------------------------------------------------------------
        <div>
          <p className="text-[15px] leading-relaxed text-[#0f172a] mt-3 mb-5">
            We couldn't write the summary just now. These numbers are calculated directly from the project data. Try again in a moment.
          </p>

          {/* 3 Plain Calculated Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-5">
            {data?.key_numbers && data.key_numbers.length > 0 ? (
              data.key_numbers.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#f8fafc] border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between"
                >
                  <div className="text-2xl font-extrabold text-[#0f172a]">
                    {item.value}
                  </div>
                  <div className="mt-1">
                    <div className="text-xs font-semibold text-slate-700 leading-snug">
                      {item.label}
                    </div>
                    {item.sublabel && (
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        {item.sublabel}
                      </div>
                    )}
                    {item.assumption && (
                      <div className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                        ({item.assumption})
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-xs text-slate-500 italic p-3 bg-slate-50 rounded-lg">
                Calculated metrics are being updated.
              </div>
            )}
          </div>

          {/* WORTH ASKING in unavailable state */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-3">
              WORTH ASKING
            </div>
            <ul className="list-disc pl-5 space-y-1.5 text-[15px] text-[#334155]">
              <li>
                Nothing here is a finding yet. No explanation or comparison is shown until the agent has written and checked it.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* 3. Collapsible Explainer Accordion ("How we worked this out") */}
      {showExplanation && (
        <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-3">
          <div className="font-semibold text-slate-900 border-b border-slate-200 pb-1.5">
            Formulas &amp; Method:
          </div>
          <ul className="list-disc pl-5 space-y-1">
            {explainer.formulas.map((form, i) => (
              <li key={i}>{form}</li>
            ))}
          </ul>

          <div className="font-semibold text-slate-900 border-b border-slate-200 pt-2 pb-1.5">
            Key Assumptions:
          </div>
          <ul className="list-disc pl-5 space-y-1">
            {explainer.assumptions.map((assump, i) => (
              <li key={i}>{assump}</li>
            ))}
          </ul>

          {/* Developer / Admin Raw JSON Packet link */}
          <div className="pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowRawPacket(!showRawPacket)}
              className="text-[11px] text-teal-800 hover:underline"
            >
              {showRawPacket ? 'Hide calculation packet JSON' : 'Developer: view raw calculation packet'}
            </button>
            {showRawPacket && data?.packet && (
              <pre className="mt-2 p-2 bg-slate-900 text-emerald-400 rounded-lg text-[10px] overflow-x-auto max-h-48 font-mono">
                {JSON.stringify(data.packet, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* 4. Single-Agent Inline Follow-up Form */}
      {followupOpen && (
        <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#0f2744] flex items-center gap-1.5">
              <MessageSquare size={14} />
              <span>Ask the Intelligence Agent about this {module} briefing</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setFollowupOpen(false);
                setFollowupAnswer(null);
                setFollowupError(null);
              }}
              className="text-slate-400 hover:text-slate-700"
            >
              <X size={14} />
            </button>
          </div>

          <form onSubmit={handleFollowupSubmit} className="space-y-2">
            <input
              type="text"
              value={followupQuestion}
              onChange={(e) => setFollowupQuestion(e.target.value)}
              placeholder="e.g. Does the 5th floor pay floor rise, or does it start at the 6th?"
              className="w-full px-3 py-2 rounded-lg bg-white text-slate-800 placeholder-slate-400 text-xs border border-slate-300 focus:outline-hidden focus:border-[#0f2744]"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmittingFollowup || !followupQuestion.trim()}
                className="py-1.5 px-4 rounded-lg bg-[#0f2744] hover:bg-[#0a1b30] disabled:opacity-50 text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                {isSubmittingFollowup ? 'Querying agent...' : 'Submit question'}
              </button>
            </div>
          </form>

          {followupAnswer && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-slate-800 space-y-1">
              <div className="text-[10px] font-bold tracking-wider uppercase text-emerald-800">
                Agent Grounded Answer
              </div>
              <p className="leading-relaxed whitespace-pre-line">{followupAnswer}</p>
            </div>
          )}

          {followupError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {followupError}
            </div>
          )}
        </div>
      )}

      {/* 5. Footer Action Buttons */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: How we worked this out toggle */}
        <button
          type="button"
          onClick={() => setShowExplanation(!showExplanation)}
          className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer"
        >
          <span>How we worked this out</span>
          {showExplanation ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          {!isAiWritten && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing || isFetching}
              className="py-2 px-4 rounded-lg bg-white hover:bg-slate-50 text-[#0f172a] border border-slate-300 font-semibold text-sm shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw size={13} className={isRefreshing || isFetching ? 'animate-spin' : ''} />
              <span>Try again</span>
            </button>
          )}

          {module === 'commute' && (
            <button
              type="button"
              onClick={() => alert('Add places dialog opened')}
              className="py-2 px-4 rounded-lg bg-white hover:bg-slate-50 text-[#0f172a] border border-slate-300 font-semibold text-sm shadow-xs transition-colors cursor-pointer"
            >
              Add my places
            </button>
          )}

          <button
            type="button"
            onClick={() => setFollowupOpen(!followupOpen)}
            className="py-2 px-4 rounded-lg bg-[#0f2744] hover:bg-[#0a1b30] text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer focus:ring-2 focus:ring-offset-2 focus:ring-[#0f2744]"
          >
            Ask a follow-up
          </button>
        </div>
      </div>
    </div>
  );
};
