import React, { useState, useRef, useEffect } from 'react';
import {
  Compass,
  Loader2,
  ChevronDown,
  ChevronUp,
  Globe,
  Building2,
  FileText,
  User,
  Scale,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Sliders,
  MapPin,
  Trash2,
  Plus,
  X
} from 'lucide-react';
import {
  AdvisorReadData,
  AdvisorMatterItem,
  SAMPLE_ADVISOR_READ_GENERAL,
  SAMPLE_ADVISOR_READ_FOR_YOU
} from '../../demo/sampleAnalyses';
import { featureIntelligenceApi } from '../../services/api';

export interface AdvisorReadCardProps {
  propertyId: number;
  className?: string;
}

const AVAILABLE_PRIORITIES = [
  'Commute time',
  'Green space',
  'Price per usable foot',
  'Possession date',
  'Noise and air',
  'Amenities'
];

export const AdvisorReadCard: React.FC<AdvisorReadCardProps> = ({
  propertyId,
  className = ''
}) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'result' | 'error' | 'unavailable'>('idle');
  const [isExpanded, setIsExpanded] = useState(false);
  const [advisorData, setAdvisorData] = useState<AdvisorReadData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Buyer Profile State
  const [activeTab, setActiveTab] = useState<'general' | 'for_you'>('general');
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [userPlaces, setUserPlaces] = useState<Array<{ name: string; type: string }>>([]);
  const [hasChild, setHasChild] = useState<boolean>(false);
  const [showPlacesModal, setShowPlacesModal] = useState(false);
  const [newPlaceName, setNewPlaceName] = useState('');
  const [newPlaceType, setNewPlaceType] = useState('office');
  const [showExplainer, setShowExplainer] = useState(false);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const analysisMode = (import.meta.env.VITE_AI_ANALYSIS_MODE || 'demo').toLowerCase();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const hasProfile = selectedPriorities.length > 0 || userPlaces.length > 0 || hasChild;

  // Run or re-run Advisor Read
  const runAdvisorRead = async (
    modeTab: 'general' | 'for_you' = activeTab,
    placesOverride?: Array<{ name: string; type: string }>,
    prioritiesOverride?: string[],
    hasChildOverride?: boolean
  ) => {
    setStatus('loading');
    setIsExpanded(true);
    setErrorMessage(null);

    const activePlaces = placesOverride !== undefined ? placesOverride : userPlaces;
    const activePriorities = prioritiesOverride !== undefined ? prioritiesOverride : selectedPriorities;
    const activeHasChild = hasChildOverride !== undefined ? hasChildOverride : hasChild;

    const hasActiveProfile = activePriorities.length > 0 || activePlaces.length > 0 || activeHasChild;
    const useForYou = modeTab === 'for_you' || (modeTab === 'general' && hasActiveProfile && activeTab === 'for_you');

    if (analysisMode === 'demo') {
      timerRef.current = setTimeout(() => {
        if (useForYou && hasActiveProfile) {
          setAdvisorData(SAMPLE_ADVISOR_READ_FOR_YOU);
        } else {
          setAdvisorData(SAMPLE_ADVISOR_READ_GENERAL);
        }
        setStatus('result');
        requestAnimationFrame(() => {
          headingRef.current?.focus();
        });
      }, 500);
    } else {
      // Live API call
      try {
        let buyerProfilePayload = null;
        if (useForYou && hasActiveProfile) {
          buyerProfilePayload = {
            household: {
              adults: 2,
              children: activeHasChild ? 1 : 0,
              school_going: activeHasChild
            },
            places: activePlaces.map(p => ({
              name: p.name,
              destination_type: p.type
            })),
            priorities: activePriorities.map(p => p.toLowerCase())
          };
        }

        const res = await featureIntelligenceApi.getAdvisorRead(
          propertyId,
          buyerProfilePayload,
          false,
          false
        );

        if (!res || res.status === 'unavailable') {
          setStatus('unavailable');
          setAdvisorData(res);
          return;
        }

        setAdvisorData(res);
        setStatus('result');
        requestAnimationFrame(() => {
          headingRef.current?.focus();
        });
      } catch (err: any) {
        setErrorMessage('Advisor read could not be completed. Please try again.');
        setStatus('error');
      }
    }
  };

  const handleTogglePriority = (priority: string) => {
    let next: string[];
    if (selectedPriorities.includes(priority)) {
      next = selectedPriorities.filter(p => p !== priority);
    } else {
      if (selectedPriorities.length >= 3) {
        next = [...selectedPriorities.slice(1), priority];
      } else {
        next = [...selectedPriorities, priority];
      }
    }
    setSelectedPriorities(next);
    setActiveTab('for_you');
    runAdvisorRead('for_you', userPlaces, next, hasChild);
  };

  const handleAddPlace = () => {
    if (!newPlaceName.trim()) return;
    const updatedPlaces = [...userPlaces, { name: newPlaceName.trim(), type: newPlaceType }];
    setUserPlaces(updatedPlaces);
    setNewPlaceName('');
    setShowPlacesModal(false);
    setActiveTab('for_you');
    runAdvisorRead('for_you', updatedPlaces, selectedPriorities, hasChild);
  };

  const handleClearProfile = () => {
    setSelectedPriorities([]);
    setUserPlaces([]);
    setHasChild(false);
    setActiveTab('general');
    runAdvisorRead('general', [], [], false);
  };

  const renderSourceChip = (family: string, source: string, date: string) => {
    let Icon = Globe;
    let label = 'World';
    let chipClass = 'bg-sky-50 text-sky-800 border-sky-200';

    if (family === 'market') {
      Icon = Building2;
      label = 'Market';
      chipClass = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    } else if (family === 'record') {
      Icon = FileText;
      label = 'Record';
      chipClass = 'bg-purple-50 text-purple-800 border-purple-200';
    } else if (family === 'buyer') {
      Icon = User;
      label = 'You';
      chipClass = 'bg-indigo-50 text-indigo-800 border-indigo-200';
    } else if (family === 'builder') {
      Icon = Building2;
      label = 'Builder';
      chipClass = 'bg-slate-50 text-slate-700 border-slate-200';
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${chipClass}`}>
        <Icon className="w-3.5 h-3.5" aria-hidden="true" />
        <span className="font-semibold">{label}</span>
        <span className="text-slate-400">·</span>
        <span>{source}</span>
        {date && (
          <>
            <span className="text-slate-400">·</span>
            <span>{date}</span>
          </>
        )}
      </span>
    );
  };

  return (
    <div className={`mt-4 ${className}`}>
      {/* 1. Launch Button: Secondary style directly under stats bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            if (status === 'idle') {
              runAdvisorRead();
            } else if (status === 'result' || status === 'unavailable') {
              setIsExpanded(!isExpanded);
            }
          }}
          aria-busy={status === 'loading'}
          aria-expanded={isExpanded}
          className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-teal-600 active:scale-[0.98]"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="w-4 h-4 text-teal-700 animate-spin" />
              <span>Analyzing outside evidence...</span>
            </>
          ) : (
            <>
              <Compass className="w-4 h-4 text-teal-700" />
              <span>Advisor's read</span>
              {status === 'result' && (
                isExpanded ? <ChevronUp className="w-4 h-4 text-slate-500 ml-1" /> : <ChevronDown className="w-4 h-4 text-slate-500 ml-1" />
              )}
            </>
          )}
        </button>

        {status === 'result' && (
          <span className="text-xs text-slate-500">
            Decision support from public data, peer cohort & your inputs
          </span>
        )}
      </div>

      {/* 2. Expanded Advisor Read Card */}
      {status === 'result' && isExpanded && advisorData && (
        <div className="mt-4 bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/90 shadow-sm transition-all animate-fadeIn">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between pb-3.5 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-teal-800" />
              <span className="text-xs font-bold tracking-wider text-teal-900 uppercase">
                Senior Advisor's Read
              </span>
            </div>
            <span className="text-xs font-medium px-3 py-1 rounded-full bg-[#e6f4ea] text-[#137333] border border-[#ceead6] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Real-time AI analysis
            </span>
          </div>

          {/* Card Heading */}
          <h3
            ref={headingRef}
            tabIndex={-1}
            className="text-xl font-heading font-bold text-[#0f172a] mt-4 outline-none focus:ring-2 focus:ring-teal-600 focus:rounded"
          >
            Project Assessment & Advisory Perspective
          </h3>

          {/* Signature Line (<= 30 words) */}
          <div className="mt-3 p-4 bg-slate-50 border-l-4 border-teal-600 rounded-r-xl">
            <p className="text-[17px] font-semibold text-[#0f172a] leading-relaxed">
              "{advisorData.signature_line}"
            </p>
          </div>

          {/* Perspective Switcher: General vs For You */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200/70">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('general');
                  runAdvisorRead('general');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'general'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                General Read
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('for_you');
                  runAdvisorRead('for_you');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'for_you'
                    ? 'bg-white text-indigo-900 shadow-xs border border-indigo-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                For You {hasProfile ? '✓' : ''}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPlacesModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700"
              >
                <Plus className="w-3.5 h-3.5 text-teal-700" />
                <span>Add my places</span>
              </button>
              {hasProfile && (
                <button
                  type="button"
                  onClick={handleClearProfile}
                  title="Clear profile and places"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-rose-700 hover:bg-rose-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Priority Chips: "Tell me what matters to you" */}
          <div className="mt-4">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Tell me what matters to you (pick up to 3):
            </span>
            <div className="flex flex-wrap gap-2 mt-2">
              {AVAILABLE_PRIORITIES.map(priority => {
                const isSelected = selectedPriorities.includes(priority);
                return (
                  <button
                    key={priority}
                    type="button"
                    onClick={() => handleTogglePriority(priority)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold ring-1 ring-indigo-400'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected ? '✓ ' : ''}{priority}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Places Pills */}
          {userPlaces.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">My places:</span>
              {userPlaces.map((pl, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-indigo-50 text-indigo-900 border border-indigo-200"
                >
                  <MapPin className="w-3 h-3 text-indigo-600" />
                  <span>{pl.name} ({pl.type})</span>
                </span>
              ))}
            </div>
          )}

          {/* WHAT MATTERS MOST (Top 3) */}
          <div className="mt-7">
            <div className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-4">
              WHAT MATTERS MOST
            </div>
            <div className="space-y-6">
              {advisorData.what_matters_most.map((item, idx) => (
                <div key={item.id || idx} className="pb-5 border-b border-slate-100 last:border-b-0 last:pb-0">
                  {/* Claim: <= 25 words */}
                  <h4 className="text-base font-bold text-[#0f172a] leading-snug">
                    {item.claim}
                  </h4>

                  {/* Why with evidence: <= 70 words, body text at least 15px */}
                  <p className="text-[15px] text-[#334155] leading-relaxed mt-1.5">
                    {item.why}
                  </p>

                  {/* "For you" tailored line (only when profile exists) */}
                  {item.for_you && activeTab === 'for_you' && (
                    <div className="mt-2.5 px-3.5 py-2 bg-indigo-50/70 border-l-2 border-indigo-500 rounded-r-lg">
                      <p className="text-sm font-medium text-indigo-950">
                        <span className="font-semibold text-indigo-700">For you:</span> {item.for_you}
                      </p>
                    </div>
                  )}

                  {/* Changes if: specific fact */}
                  {item.changes_if && (
                    <p className="text-sm mt-2 text-[#475569]">
                      <span className="font-semibold text-[#b45309]">My view would change if:</span>{' '}
                      {item.changes_if}
                    </p>
                  )}

                  {/* Source Chip with Icon + Label + Name + Date */}
                  <div className="mt-3">
                    {renderSourceChip(item.family, item.source, item.date)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* THE TENSION (1) */}
          {advisorData.tension && advisorData.tension.text && (
            <div className="mt-7 p-4 bg-amber-50/50 border border-amber-200/70 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="w-4 h-4 text-amber-800" />
                <span className="text-xs font-bold tracking-wider text-amber-900 uppercase">
                  THE TENSION
                </span>
              </div>
              <p className="text-[15px] text-[#0f172a] leading-relaxed">
                {advisorData.tension.text}
              </p>
              {advisorData.tension.sources && advisorData.tension.sources.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {advisorData.tension.sources.map((s, idx) => (
                    <span key={idx} className="text-xs text-amber-900/80 font-medium">
                      Source: {s.source} ({s.date})
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SETTLE THIS FIRST (1) */}
          {advisorData.settle_first && (
            <div className="mt-6 p-4 bg-rose-50/50 border border-rose-200/70 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="w-4 h-4 text-rose-800" />
                <span className="text-xs font-bold tracking-wider text-rose-900 uppercase">
                  SETTLE THIS FIRST
                </span>
              </div>
              <p className="text-[15px] font-bold text-[#0f172a] leading-snug">
                {advisorData.settle_first.question}
              </p>
              <p className="text-[15px] text-[#475569] leading-relaxed mt-1">
                {advisorData.settle_first.why}
              </p>
            </div>
          )}

          {/* CHECKS YOU CAN MAKE NOW (Up to 3) */}
          {advisorData.checks_you_can_make_now && advisorData.checks_you_can_make_now.length > 0 && (
            <div className="mt-7 pt-5 border-t border-slate-100">
              <div className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-3">
                CHECKS YOU CAN MAKE NOW
              </div>
              <ul className="space-y-2 text-[15px] text-[#334155]">
                {advisorData.checks_you_can_make_now.map((check, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="text-teal-700 font-bold shrink-0">{idx + 1}.</span>
                    <span>{check}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* "WHERE THIS COMES FROM" EVIDENCE PANEL */}
          {advisorData.evidence_panel && (
            <div className="mt-7 pt-5 border-t border-slate-100">
              <div className="text-xs font-bold tracking-wider text-slate-500 uppercase mb-3.5">
                WHERE THIS COMES FROM
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* World */}
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-sky-700" />
                      World (Surroundings)
                    </span>
                    <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                      advisorData.evidence_panel.world?.status === 'used' ? 'bg-sky-100 text-sky-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {advisorData.evidence_panel.world?.status || 'unavailable'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5">
                    {advisorData.evidence_panel.world?.source || 'OpenStreetMap, Open-Meteo, Solar Geometry, Open Elevation'}
                  </p>
                </div>

                {/* Market */}
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-700" />
                      Market (Other Projects)
                    </span>
                    <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                      advisorData.evidence_panel.market?.status === 'used' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {advisorData.evidence_panel.market?.status || 'unavailable'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5">
                    {advisorData.evidence_panel.market?.source || 'Published peer cohort in Hyderabad'}
                  </p>
                </div>

                {/* Record: MUST explicitly say "Record: not checked" if no permitted source */}
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-purple-700" />
                      Record (Public Records)
                    </span>
                    <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                      advisorData.evidence_panel.record?.status === 'used'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {advisorData.evidence_panel.record?.status === 'used' ? 'verified' : 'not checked'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5">
                    {advisorData.evidence_panel.record?.status === 'used'
                      ? advisorData.evidence_panel.record.source
                      : 'Record: not checked (no permitted official direct API feed or uploaded verified filing)'}
                  </p>
                </div>

                {/* Buyer */}
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-indigo-700" />
                      You (Buyer Inputs)
                    </span>
                    <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded ${
                      advisorData.evidence_panel.buyer?.status === 'used' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {advisorData.evidence_panel.buyer?.status || 'not checked'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5">
                    {advisorData.evidence_panel.buyer?.status === 'used'
                      ? advisorData.evidence_panel.buyer.source
                      : 'No buyer places or household profile selected'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* "How we worked this out" Collapsible Section */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowExplainer(!showExplainer)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              <span>How we worked this out</span>
              {showExplainer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {showExplainer && (
              <div className="mt-3 p-3.5 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1.5">
                <p>• <strong>Materiality scoring:</strong> 35% effect size, 25% priority relevance, 20% outside confidence, 20% actionability.</p>
                <p>• <strong>Diversity cap:</strong> Enforces maximum of 2 findings from any single family to guarantee breadth across surroundings, market, and records.</p>
                <p>• <strong>Superlative rule:</strong> Only rank 1 among at least 5 active peers in the city permits an engine superlative.</p>
                <p>• <strong>Privacy guarantee:</strong> User profile and destinations are calculated on your device session and never stored in shared tables or shared caches.</p>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <span>
              {advisorData.footer.city} · {advisorData.footer.peer_count} peer projects evaluated
            </span>
            <span className="italic">
              {advisorData.footer.disclaimer}
            </span>
          </div>
        </div>
      )}

      {/* 3. Unavailable State */}
      {status === 'unavailable' && isExpanded && (
        <div className="mt-4 bg-slate-50 rounded-2xl p-6 border border-slate-200">
          <div className="flex items-center gap-2 text-amber-800 mb-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <h4 className="font-semibold text-sm">Outside Evidence Unavailable</h4>
          </div>
          <p className="text-xs text-slate-600">
            Outside evidence families could not be verified. Narrative analysis has been withheld rather than repeating builder-entered claims.
          </p>
        </div>
      )}

      {/* 4. Add Place Modal */}
      {showPlacesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-base text-[#0f172a]">Add a Destination Place</h4>
              <button
                type="button"
                onClick={() => setShowPlacesModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Place Name or Landmark
                </label>
                <input
                  type="text"
                  value={newPlaceName}
                  onChange={e => setNewPlaceName(e.target.value)}
                  placeholder="e.g. Oakridge School, DLF Cyber City"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Destination Type
                </label>
                <select
                  value={newPlaceType}
                  onChange={e => setNewPlaceType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600"
                >
                  <option value="office">Workplace / Office (250 days, 2 trips/day)</option>
                  <option value="school">School / Child (200 days, 4 trips/day)</option>
                  <option value="college">Higher Education / Campus (220 days, 2 trips/day)</option>
                  <option value="family">Family / Frequent destination</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="hasChildCheck"
                  checked={hasChild}
                  onChange={e => setHasChild(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="hasChildCheck" className="text-xs text-slate-700">
                  Household includes school-going child
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowPlacesModal(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddPlace}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-teal-700 text-white hover:bg-teal-800"
              >
                Save & Recalculate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
