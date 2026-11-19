import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Compass,
  Car,
  Wind,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCw,
  Sliders,
  DollarSign,
  TrendingUp,
  FileQuestion,
  Info,
  Check,
  ExternalLink,
  Target,
  MapPin,
  Navigation,
  Plus,
  Search,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { geocodingApi, routingApi } from '../../services/api';
import {
  PropertyReportResponse,
  PropertyEvidenceLayer,
  EvidenceItem,
  BuyerPreferences
} from '../../types';
import { Badge } from '../common/Badge';
import { EvidenceInspectorModal } from './EvidenceInspectorModal';
import { PropertyMap, MapPoiItem, MapRouteItem } from '../common/PropertyMap';

interface AIPropertyIntelligenceCardProps {
  reportData: PropertyReportResponse | null;
  evidenceLayer: PropertyEvidenceLayer | null;
  isLoading: boolean;
  aiRequested?: boolean;
  onGenerateReport?: () => void;
  onRefreshReport: (prefs?: BuyerPreferences) => Promise<void>;
  isRefreshing: boolean;
  propertyLat?: number;
  propertyLon?: number;
  propertyName?: string;
  propertyAddress?: string;
  pois?: MapPoiItem[];
  routes?: MapRouteItem[];
  onAddCustomCommute?: (newRoute: any) => void;
  onSelectRouteOnMap?: (geometry: [number, number][], destName: string) => void;
}

export const AIPropertyIntelligenceCard: React.FC<AIPropertyIntelligenceCardProps> = ({
  reportData,
  evidenceLayer,
  isLoading,
  aiRequested = true,
  onGenerateReport,
  onRefreshReport,
  isRefreshing,
  propertyLat,
  propertyLon,
  propertyName = 'Subject Property',
  propertyAddress,
  pois = [],
  routes = [],
  onAddCustomCommute,
  onSelectRouteOnMap
}) => {
  // Custom Commute Destination Form State
  const [commuteSearchQuery, setCommuteSearchQuery] = useState('');
  const [commuteSuggestions, setCommuteSuggestions] = useState<any[]>([]);
  const [isSearchingCommute, setIsSearchingCommute] = useState(false);
  const [isComputingCommute, setIsComputingCommute] = useState(false);
  const [userAddedCommutes, setUserAddedCommutes] = useState<any[]>([]);
  const [commuteError, setCommuteError] = useState<string | null>(null);
  const [showAddCommuteForm, setShowAddCommuteForm] = useState(false);
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);
  const [personalizationOpen, setPersonalizationOpen] = useState(false);

  // Buyer preference state
  const [targetBudget, setTargetBudget] = useState<number | undefined>(
    reportData?.preferences_applied?.budget_max || undefined
  );
  const [intendedUse, setIntendedUse] = useState<string>(
    reportData?.preferences_applied?.intended_use || 'self_occupation'
  );
  const [commuteDest, setCommuteDest] = useState<string>(
    reportData?.preferences_applied?.preferred_commute_destination || ''
  );
  const [commuteTol, setCommuteTol] = useState<number>(
    reportData?.preferences_applied?.commute_tolerance_mins || 30
  );
  const [schoolPrio, setSchoolPrio] = useState<number>(
    reportData?.preferences_applied?.priorities?.schools || 4
  );
  const [transitPrio, setTransitPrio] = useState<number>(
    reportData?.preferences_applied?.priorities?.transit || 4
  );
  const [envPrio, setEnvPrio] = useState<number>(
    reportData?.preferences_applied?.priorities?.air_quality || 3
  );

  const selectedEvidenceItem: EvidenceItem | null =
    selectedEvidenceId && evidenceLayer?.items
      ? evidenceLayer.items[selectedEvidenceId] || null
      : null;

  const handleApplyPreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    const prefs: BuyerPreferences = {
      budget_max: targetBudget ? Number(targetBudget) : null,
      intended_use: intendedUse,
      preferred_commute_destination: commuteDest.trim() || null,
      commute_tolerance_mins: commuteTol,
      priorities: {
        schools: schoolPrio,
        transit: transitPrio,
        air_quality: envPrio
      }
    };
    await onRefreshReport(prefs);
    setPersonalizationOpen(false);
  };

  const renderCitationPill = (evidenceId: string) => {
    const item = evidenceLayer?.items?.[evidenceId];
    const isGap = evidenceId.startsWith('EVID-GAP');
    const isSeller = evidenceId.startsWith('EVID-SELLER');
    const isCalc = evidenceId.startsWith('EVID-CALC');
    const isEnv = evidenceId.startsWith('EVID-ENV');

    let badgeColor = 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300';
    if (isGap) badgeColor = 'bg-rose-50 text-rose-800 hover:bg-rose-100 border-rose-200';
    else if (isSeller) badgeColor = 'bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200';
    else if (isCalc) badgeColor = 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border-indigo-200';
    else if (isEnv) badgeColor = 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200';

    let pillText = 'Verified Data';
    if (evidenceId.startsWith('EVID-ROUTE')) pillText = 'Verified Road Route';
    else if (isGap) pillText = 'Unverified Gap';
    else if (isSeller) pillText = 'Seller Submitted';
    else if (isCalc) pillText = 'Calculated Metric';
    else if (isEnv) pillText = 'Copernicus AQI Sensor';

    return (
      <span
        key={evidenceId}
        className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-medium border ${badgeColor}`}
        title={item ? `${item.label} (${item.provenance})` : 'Verified Evidence Item'}
      >
        <span>✓ {pillText}</span>
      </span>
    );
  };

  if (!aiRequested && !reportData && !isLoading) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white p-8 rounded-xl border border-slate-800 shadow-md text-center space-y-5 animate-fadeIn">
        <div className="w-16 h-16 mx-auto rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner">
          <Sparkles size={28} />
        </div>
        <div className="space-y-1.5 max-w-lg mx-auto">
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono text-[10px] uppercase font-bold tracking-wider inline-block mb-1 border border-blue-500/30">
            On-Demand AI Due-Diligence
          </span>
          <h3 className="text-xl font-bold tracking-tight">AI Property Location Intelligence</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Generate an empirical intelligence dossier strictly cross-referencing cadastral boundaries, verified community amenities, actual road network drive times, and Copernicus atmospheric telemetry.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => onGenerateReport && onGenerateReport()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg shadow-md transition-all inline-flex items-center gap-2 cursor-pointer transform hover:scale-[1.02]"
          >
            <Sparkles size={15} className="text-amber-300" />
            <span>Generate AI Property Intelligence Report</span>
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !reportData) {
    return (
      <div className="bg-white p-10 rounded-lg border border-brand-border text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 flex items-center justify-center text-blue-600 animate-spin">
          <RotateCw size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-sm text-slate-900">Synthesizing Location Intelligence Dossier...</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            AI reasoning engine is cross-referencing cadastral geocoding, verified community facilities, road commute times, and Copernicus CAMS atmospheric measurements.
          </p>
        </div>
      </div>
    );
  }

  const report = reportData.report;
  const audit = report.evidence_citations_audit;
  const personalized = report.personalized_buyer_assessment;

  // Quick suggested hubs in Visakhapatnam
  const POPULAR_VIZAG_HUBS = [
    { name: 'Madhurawada', lat: 17.8102, lon: 83.3540 },
    { name: 'Rushikonda IT SEZ', lat: 17.8180, lon: 83.3850 },
    { name: 'Visakhapatnam Railway Station', lat: 17.7210, lon: 83.2965 },
    { name: 'Visakhapatnam Airport (VTZ)', lat: 17.7215, lon: 83.2245 },
    { name: 'MVP Colony', lat: 17.7420, lon: 83.3325 },
    { name: 'Gajuwaka Industrial Hub', lat: 17.6905, lon: 83.2095 },
    { name: 'Siripuram Junction', lat: 17.7218, lon: 83.3155 },
    { name: 'GITAM University', lat: 17.7812, lon: 83.3768 }
  ];

  const handleSearchCommuteInput = async (val: string) => {
    setCommuteSearchQuery(val);
    setCommuteError(null);
    if (!val.trim()) {
      setCommuteSuggestions([]);
      return;
    }

    // Instant local matches
    const localMatches = POPULAR_VIZAG_HUBS.filter((h) =>
      h.name.toLowerCase().includes(val.toLowerCase())
    ).map((h) => ({
      display_name: `${h.name}, Visakhapatnam, Andhra Pradesh`,
      latitude: h.lat,
      longitude: h.lon,
      place_id: `local_${h.name}`
    }));

    setCommuteSuggestions(localMatches);

    // Call geocoding API with fallback
    try {
      setIsSearchingCommute(true);
      const apiResults = await geocodingApi.searchAddress(val.trim(), 4);
      if (apiResults && apiResults.length > 0) {
        const combined = [...localMatches];
        apiResults.forEach((res) => {
          if (!combined.some((c) => Math.abs(c.latitude - res.latitude) < 0.005)) {
            combined.push(res);
          }
        });
        setCommuteSuggestions(combined);
      }
    } catch {
      // keep local matches
    } finally {
      setIsSearchingCommute(false);
    }
  };

  const handleCalculateCustomCommute = async (destPlace: { display_name: string; latitude: number; longitude: number }) => {
    if (!resolvedLat || !resolvedLon) {
      setCommuteError('Property coordinates not available for road routing.');
      return;
    }

    const shortName = destPlace.display_name.split(',')[0].trim();
    setIsComputingCommute(true);
    setCommuteError(null);
    setCommuteSuggestions([]);
    setCommuteSearchQuery(shortName);

    try {
      const res = await routingApi.computeRoute({
        origin_lat: resolvedLat,
        origin_lon: resolvedLon,
        dest_lat: destPlace.latitude,
        dest_lon: destPlace.longitude,
        destination_name: shortName
      });

      const newEval = {
        destination: shortName,
        road_distance_km: res.road_distance_km,
        straight_line_distance_km: res.straight_line_distance_km,
        estimated_duration_mins: res.estimated_duration_mins,
        tortuosity_ratio: res.tortuosity_ratio,
        connectivity_verdict: `Road distance is ${res.road_distance_km} km with ~${res.estimated_duration_mins} mins estimated drive time from ${propertyName}.`,
        evidence_ids: ['EVID-ROUTE-CUSTOM'],
        route_geometry: res.route_geometry
      };

      setUserAddedCommutes((prev) => [newEval, ...prev]);

      if (onAddCustomCommute) {
        onAddCustomCommute({
          name: shortName,
          type: 'User Custom Destination',
          road_distance_km: res.road_distance_km,
          straight_line_distance_km: res.straight_line_distance_km,
          estimated_duration_mins: res.estimated_duration_mins,
          tortuosity_ratio: res.tortuosity_ratio,
          route_geometry: res.route_geometry
        });
      }

      if (res.route_geometry && onSelectRouteOnMap) {
        onSelectRouteOnMap(res.route_geometry, shortName);
      }

      setShowAddCommuteForm(false);
      setCommuteSearchQuery('');
    } catch (err: any) {
      setCommuteError(err?.response?.data?.detail || 'Unable to compute road route to this destination.');
    } finally {
      setIsComputingCommute(false);
    }
  };

  const coordsItem = evidenceLayer?.items?.['EVID-LOC-COORDS']?.value as { lat?: number; lon?: number } | undefined;
  const resolvedLat = propertyLat ?? (coordsItem && typeof coordsItem === 'object' ? coordsItem.lat : undefined);
  const resolvedLon = propertyLon ?? (coordsItem && typeof coordsItem === 'object' ? coordsItem.lon : undefined);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Model Provenance */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-6 rounded-lg border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-600/30 border border-blue-500/40 text-blue-300 font-mono text-[10px] uppercase font-bold tracking-wider">
                <Sparkles size={11} className="text-blue-400" />
                <span>Evidence-Based AI Intelligence</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] uppercase font-bold tracking-wider border border-emerald-500/30">
                Verified Intelligence Dossier
              </span>
              {reportData.is_stale && (
                <Badge variant="warn">Report Outdated (Underlying Coordinates Changed)</Badge>
              )}
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Property Intelligence & Buyer Due-Diligence Dossier
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              Synthesised strictly from cadastral geocoding, OpenStreetMap amenity nodes, OSRM vehicular road topology, and Copernicus CAMS atmospheric reanalysis. Zero market speculation or ungrounded claims.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              onClick={() => setPersonalizationOpen(!personalizationOpen)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Sliders size={13} className="text-amber-400" />
              <span>Tailor to My Profile</span>
            </button>

            <button
              onClick={() => onRefreshReport(reportData.preferences_applied || undefined)}
              disabled={isRefreshing}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-semibold text-xs flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-xs"
            >
              <RotateCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
              <span>{isRefreshing ? 'Analyzing...' : 'Refresh Report'}</span>
            </button>
          </div>
        </div>

        {/* Audit metrics stripe */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-4 text-[11px] text-slate-400 font-mono flex-wrap">
          <span>Generated: {new Date(reportData.created_at).toLocaleString()}</span>

          {audit && (
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck size={13} />
              <span>{audit.valid_citations_verified} Evidence Citations Verified</span>
            </span>
          )}
          {audit?.numerical_corrections_made ? (
            <span className="text-amber-400 font-bold">
              • {audit.numerical_corrections_made} Numerical Mismatches Auto-Repaired
            </span>
          ) : null}
        </div>
      </div>

      {/* 2. Buyer Personalization Drawer (Collapsible) */}
      {personalizationOpen && (
        <form
          onSubmit={handleApplyPreferences}
          className="bg-white p-5 rounded-lg border border-blue-200 shadow-sm space-y-4 animate-fadeIn text-xs"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <Sliders size={15} className="text-blue-600" />
                <span>Buyer Personalization & Suitability Criteria</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Specify your personal constraints to see how well this property matches your intended use and budget.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPersonalizationOpen(false)}
              className="text-slate-400 hover:text-slate-700 text-xs font-semibold"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Budget Ceiling (INR)</label>
              <input
                type="number"
                placeholder="e.g. 9000000 for 90 Lakhs"
                value={targetBudget || ''}
                onChange={(e) => setTargetBudget(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Primary Intended Use</label>
              <select
                value={intendedUse}
                onChange={(e) => setIntendedUse(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-blue-500"
              >
                <option value="self_occupation">Self-Occupation (Personal Residence)</option>
                <option value="family_home">Family Home (Kids & Healthcare Centric)</option>
                <option value="investment">Long-Term Investment / Capital Preservation</option>
                <option value="rental">Rental Income / Tenancy</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Preferred Commute Destination</label>
              <input
                type="text"
                placeholder="e.g. Visakhapatnam Railway Station, Rushikonda IT SEZ"
                value={commuteDest}
                onChange={(e) => setCommuteDest(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            <div>
              <div className="flex justify-between text-slate-700 font-semibold mb-1">
                <span>Schools & Education Priority</span>
                <span className="font-mono text-blue-600">{schoolPrio} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={schoolPrio}
                onChange={(e) => setSchoolPrio(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-700 font-semibold mb-1">
                <span>Public Transit Priority</span>
                <span className="font-mono text-blue-600">{transitPrio} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={transitPrio}
                onChange={(e) => setTransitPrio(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-700 font-semibold mb-1">
                <span>Clean Air & Environment Priority</span>
                <span className="font-mono text-blue-600">{envPrio} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={envPrio}
                onChange={(e) => setEnvPrio(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              disabled={isRefreshing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded text-xs flex items-center gap-1.5"
            >
              <Check size={13} />
              <span>Apply Preferences & Recalculate Suitability</span>
            </button>
          </div>
        </form>
      )}

      {/* 3. Personalized Buyer Assessment (if calculated) */}
      {personalized && (
        <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blue-200 pb-3">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-blue-700" />
              <div>
                <h3 className="font-bold text-sm text-blue-950">
                  Buyer Profile Alignment: {personalized.intended_use_evaluation}
                </h3>
                <span className="text-[11px] text-blue-800">
                  Custom evaluation matching your stated constraints and priority weights.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-blue-900">Decision Aid Fit Index:</span>
              <div className="px-3 py-1 bg-white rounded-full border border-blue-300 font-mono font-bold text-sm text-blue-700 shadow-xs">
                {personalized.decision_aid_score} / 100
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-white rounded border border-blue-200 space-y-1">
              <span className="font-bold text-slate-800 block">Budget Alignment</span>
              <p className="text-slate-600">{personalized.budget_evaluation}</p>
            </div>
            <div className="p-3 bg-white rounded border border-blue-200 space-y-1">
              <span className="font-bold text-slate-800 block">Commute Alignment</span>
              <p className="text-slate-600">{personalized.commute_evaluation}</p>
            </div>
          </div>

          {/* Scoring Components Breakdown */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-700 uppercase font-mono block">
              Transparent Scoring Heuristics & Weight Distribution
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {personalized.scoring_components.map((comp, idx) => (
                <div key={idx} className="p-2.5 bg-white rounded border border-slate-200 space-y-1 text-[11px]">
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span className="line-clamp-1">{comp.dimension}</span>
                    <span className="font-mono text-blue-600">{comp.component_score}</span>
                  </div>
                  <p className="text-slate-500 text-[10px] leading-tight line-clamp-2">
                    {comp.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-slate-500 italic border-t border-blue-200 pt-2">
            {personalized.score_methodology_disclaimer}
          </p>
        </div>
      )}

      {/* 4. Executive Assessment */}
      <div className="bg-white p-6 rounded-lg border border-brand-border space-y-5 text-xs">
        <div className="space-y-1">
          <h3 className="font-bold text-base text-slate-900 tracking-tight flex items-center gap-2">
            <span>Executive Analyst Assessment</span>
            <Badge variant="verified">Evidence Grounded</Badge>
          </h3>
          <p className="text-slate-600 leading-relaxed text-xs">
            {report.executive_assessment.summary}
          </p>
        </div>

        {/* Advantages & Trade-offs 2-column grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Evidence-Backed Advantages */}
          <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-200 space-y-3">
            <h4 className="font-bold text-xs text-emerald-950 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>Evidence-Backed Advantages</span>
            </h4>
            <div className="space-y-2.5">
              {report.executive_assessment.evidence_backed_advantages.map((adv, idx) => (
                <div key={idx} className="text-slate-800 leading-relaxed">
                  <div className="flex items-start gap-1.5">
                    <span className="text-emerald-600 font-bold">•</span>
                    <div>
                      <span>{adv.claim}</span>
                      <div className="mt-1 flex items-center gap-1 flex-wrap">
                        {adv.evidence_ids.map((id) => renderCitationPill(id))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Practical Disadvantages & Trade-offs */}
          <div className="p-4 bg-amber-50/50 rounded-lg border border-amber-200 space-y-3">
            <h4 className="font-bold text-xs text-amber-950 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-amber-600" />
              <span>Disadvantages, Trade-offs & Missing Proof</span>
            </h4>
            <div className="space-y-2.5">
              {report.executive_assessment.disadvantages_and_tradeoffs.map((tradeoff, idx) => (
                <div key={idx} className="text-slate-800 leading-relaxed">
                  <div className="flex items-start gap-1.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <div>
                      <span>{tradeoff.claim}</span>
                      <div className="mt-1 flex items-center gap-1 flex-wrap">
                        {tradeoff.evidence_ids.map((id) => renderCitationPill(id))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ideal Buyer & Critical Questions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div className="p-3.5 bg-slate-50 rounded border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 block text-xs">Ideal Buyer Profile</span>
            <p className="text-slate-600 leading-relaxed">
              {report.executive_assessment.ideal_buyer_summary}
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded border border-slate-200 space-y-1">
            <span className="font-bold text-slate-800 block text-xs">Top Due-Diligence Priorities</span>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              {report.executive_assessment.critical_unresolved_questions.map((q, idx) => (
                <li key={idx} className="line-clamp-2">{q}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 5. Location and Daily Life */}
      <div className="bg-white p-6 rounded-lg border border-brand-border space-y-4 text-xs">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Compass size={16} className="text-blue-600" />
              <span>Location & Daily-Life Analysis</span>
            </h3>
            <p className="text-slate-500 text-[11px]">{report.location_and_daily_life.summary}</p>
          </div>
          <Badge variant="neutral">{report.location_and_daily_life.spatial_convenience_verdict}</Badge>
        </div>

        {report.location_and_daily_life.amenity_breakdown &&
        report.location_and_daily_life.amenity_breakdown.filter((cat) => (cat.count || 0) > 0 && cat.closest_name).length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {report.location_and_daily_life.amenity_breakdown
              .filter((cat) => (cat.count || 0) > 0 && cat.closest_name)
              .map((cat, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs">{cat.category}</span>
                    <span className="px-2 py-0.5 bg-white rounded border border-slate-300 font-mono font-bold text-blue-700 text-[10px]">
                      {cat.count} mapped
                    </span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-snug">{cat.practical_utility}</p>
                  {cat.closest_name && (
                    <span className="text-[10px] text-slate-500 font-mono block">
                      Closest: {cat.closest_name} ({cat.closest_meters}m)
                    </span>
                  )}
                  <div className="pt-1 flex items-center gap-1 flex-wrap">
                    {cat.evidence_ids.map((id) => renderCitationPill(id))}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center space-y-1.5">
            <span className="font-bold text-slate-800 text-xs block">
              Zero Community Facilities Mapped in OpenStreetMap (within 5km)
            </span>
            <p className="text-slate-500 text-[11px] max-w-xl mx-auto leading-relaxed">
              OpenStreetMap currently has 0 registered public transit stops, schools, clinics, or daily need markets mapped within a 5km radius of these coordinates.
              This indicates either an emerging residential development or an unsurveyed sector. Physical on-site inspection is required to verify actual neighborhood infrastructure.
            </p>
          </div>
        )}

        <div className="p-3 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-500 space-y-1">
          <span className="font-bold text-slate-700 block font-mono uppercase text-[10px]">
            Coverage Limitations Notice:
          </span>
          <p>{report.location_and_daily_life.coverage_limitations_explained}</p>
        </div>
      </div>

      {/* 5B. Spatial Intelligence Map: Nearest OpenStreetMap Points & OSRM Routes */}
      {resolvedLat !== undefined && resolvedLon !== undefined && (
        <div className="bg-white p-6 rounded-lg border border-brand-border space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <MapPin size={16} className="text-blue-600" />
                <span>Spatial Due-Diligence Map: Nearest OpenStreetMap Points & OSRM Road Routes</span>
              </h3>
              <p className="text-slate-500 text-[11px]">
                Interactive OpenStreetMap canvas displaying discovered community facilities and physical road network driving paths.
              </p>
            </div>
            <span className="font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-slate-700">
              {pois.length} Nearest Points &bull; {routes.length} OSRM Routes
            </span>
          </div>

          <PropertyMap
            latitude={resolvedLat}
            longitude={resolvedLon}
            propertyName={propertyName || reportData.property_name || 'Subject Property'}
            address={propertyAddress}
            pois={pois}
            routes={routes}
            height="420px"
            showControls={true}
          />
        </div>
      )}

      {/* 6. Connectivity and Commute */}
      <div className="bg-white p-6 rounded-lg border border-brand-border space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Car size={16} className="text-blue-600" />
              <span>Connectivity & Road Commute Analysis</span>
            </h3>
            <p className="text-slate-500 text-[11px]">
              Vehicular road connectivity and verified drive times to primary transit hubs and employment corridors.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddCommuteForm(!showAddCommuteForm)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs self-start sm:self-auto cursor-pointer"
          >
            <Plus size={13} />
            <span>Add Custom Commute Destination</span>
          </button>
        </div>

        {/* Custom Commute Destination Form */}
        {showAddCommuteForm && (
          <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-lg space-y-3 animate-fadeIn">
            <div>
              <span className="font-bold text-slate-900 text-xs block">
                Calculate Driving Commute from {propertyName}
              </span>
              <p className="text-[11px] text-slate-500">
                Enter your workplace, school, or residential area to calculate exact road driving distance and AI commute suitability.
              </p>
            </div>

            {/* Quick suggested hub chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-500 font-mono">Quick Suggestions:</span>
              {POPULAR_VIZAG_HUBS.map((hub) => (
                <button
                  key={hub.name}
                  type="button"
                  onClick={() => handleCalculateCustomCommute({ display_name: hub.name, latitude: hub.lat, longitude: hub.lon })}
                  className="px-2 py-0.5 bg-white border border-slate-200 hover:border-blue-400 rounded-full text-[10px] text-slate-700 font-medium transition-colors cursor-pointer"
                >
                  + {hub.name}
                </button>
              ))}
            </div>

            {/* Input with live suggestions */}
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={commuteSearchQuery}
                    onChange={(e) => handleSearchCommuteInput(e.target.value)}
                    placeholder="Search any destination (e.g. 'vsnr residency, madhurawada', 'Rushikonda', 'Gitam')..."
                    className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                  <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (commuteSuggestions.length > 0) {
                      handleCalculateCustomCommute(commuteSuggestions[0]);
                    }
                  }}
                  disabled={isComputingCommute || isSearchingCommute || !commuteSearchQuery.trim()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs rounded transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  {isComputingCommute ? <Loader2 size={13} className="animate-spin" /> : <Navigation size={13} />}
                  <span>{isComputingCommute ? 'Analyzing...' : 'Calculate Route'}</span>
                </button>
              </div>

              {/* Suggestions Dropdown */}
              {commuteSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-30 max-h-52 overflow-y-auto divide-y divide-slate-100">
                  {commuteSuggestions.map((place, idx) => (
                    <button
                      key={place.place_id || idx}
                      type="button"
                      onClick={() => handleCalculateCustomCommute(place)}
                      className="w-full text-left p-2.5 hover:bg-blue-50/50 flex items-start gap-2 text-xs transition-colors cursor-pointer"
                    >
                      <MapPin size={13} className="text-blue-600 mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-slate-900 block truncate">
                          {place.display_name.split(',')[0]}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">
                          {place.display_name}
                        </span>
                      </div>
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded shrink-0">
                        Calculate
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {commuteError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700">
                {commuteError}
              </div>
            )}
          </div>
        )}

        {/* All Commute Cards Grid (Preserves User Added Custom Commutes) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[...userAddedCommutes, ...report.connectivity_and_commute.route_evaluations].map((route: any, idx: number) => {
            const hasGeometry = Boolean(route.route_geometry);
            return (
              <div key={idx} className="p-3.5 bg-slate-50 rounded border border-slate-200 space-y-2 hover:border-slate-300 transition-colors">
                <div className="flex items-start justify-between gap-1">
                  <span className="font-bold text-slate-900 block text-xs">{route.destination}</span>
                  {route.evidence_ids?.includes('EVID-ROUTE-CUSTOM') && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-bold shrink-0">
                      Custom
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-center py-1">
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-mono block">Road Distance</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">{route.road_distance_km} km</span>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-mono block">Estimated Drive</span>
                    <span className="font-mono font-bold text-blue-700 text-sm">~{route.estimated_duration_mins} mins</span>
                  </div>
                </div>

                <p className="text-slate-600 text-[11px] leading-tight">{route.connectivity_verdict}</p>
                
                <div className="pt-1 flex items-center justify-between gap-1 flex-wrap">
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    ✓ Verified Road Route
                  </span>

                  {hasGeometry && onSelectRouteOnMap && (
                    <button
                      type="button"
                      onClick={() => onSelectRouteOnMap(route.route_geometry, route.destination)}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>View on Map</span>
                      <ArrowRight size={11} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 bg-amber-50/60 rounded border border-amber-200 text-[11px] text-amber-900 space-y-0.5">
          <span className="font-bold block font-mono uppercase text-[10px]">
            Traffic Uncertainty Note:
          </span>
          <p>{report.connectivity_and_commute.traffic_uncertainty_note}</p>
        </div>
      </div>

      {/* 7. Environmental Assessment */}
      <div className="bg-white p-6 rounded-lg border border-brand-border space-y-4 text-xs">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Wind size={16} className="text-blue-600" />
              <span>Environmental & Atmospheric Quality Assessment</span>
            </h3>
            <p className="text-slate-500 text-[11px]">{report.environmental_assessment.summary}</p>
          </div>
          <Badge variant={report.environmental_assessment.aqi_reading && report.environmental_assessment.aqi_reading <= 100 ? 'ok' : 'warn'}>
            AQI {report.environmental_assessment.aqi_reading || 'N/A'} ({report.environmental_assessment.aqi_category})
          </Badge>
        </div>

        {/* Pollutants Bar Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {report.environmental_assessment.who_pollutant_compliance.map((pol, idx) => (
            <div key={idx} className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-800 text-xs">{pol.pollutant}</span>
                <Badge variant={pol.status === 'Safe' ? 'ok' : 'warn'}>{pol.status}</Badge>
              </div>
              <div className="flex items-baseline gap-1 font-mono text-slate-900">
                <span className="text-base font-bold">{pol.concentration ?? 'N/A'}</span>
                <span className="text-[10px] text-slate-500">{pol.unit}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block">
                WHO 24h Guideline: {pol.who_guideline} {pol.unit}
              </span>
              <div className="pt-1 flex items-center gap-1 flex-wrap">
                {pol.evidence_ids.map((id) => renderCitationPill(id))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-500 space-y-1">
          <span className="font-bold text-slate-700 block font-mono uppercase text-[10px]">
            Spatial Resolution & Model Boundary Caveat:
          </span>
          <p>{report.environmental_assessment.model_vs_hyperlocal_disclaimer}</p>
        </div>
      </div>

      {/* 8. Price and Value Context */}
      <div className="bg-white p-6 rounded-lg border border-brand-border space-y-4 text-xs">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <DollarSign size={16} className="text-blue-600" />
              <span>Price & Valuation Evidence Context</span>
            </h3>
            <p className="text-slate-500 text-[11px]">{report.price_and_value_context.summary}</p>
          </div>
          {report.price_and_value_context.rate_per_sqft && (
            <span className="px-3 py-1 bg-slate-900 text-white rounded font-mono font-bold text-xs">
              ₹{Number(report.price_and_value_context.rate_per_sqft).toLocaleString()} / sq ft
            </span>
          )}
        </div>

        <div className="p-3.5 bg-slate-50 rounded border border-slate-200 space-y-2">
          <span className="font-bold text-slate-800 block text-xs">Locality Directory Benchmark</span>
          <p className="text-slate-600 leading-relaxed">
            {report.price_and_value_context.comparables_context}
          </p>
          <div className="pt-1 flex items-center gap-1 flex-wrap">
            {report.price_and_value_context.evidence_ids.map((id) => renderCitationPill(id))}
          </div>
        </div>

        <div className="p-3 bg-amber-50/60 rounded border border-amber-200 text-[11px] text-amber-900">
          <strong>Valuation Notice:</strong> {report.price_and_value_context.valuation_disclaimer}
        </div>
      </div>

      {/* 9. Buyer Suitability Profiles */}
      <div className="bg-white p-6 rounded-lg border border-brand-border space-y-4 text-xs">
        <div>
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <ShieldCheck size={16} className="text-blue-600" />
            <span>Buyer Persona Suitability Analysis</span>
          </h3>
          <p className="text-slate-500 text-[11px] mt-0.5">
            Evidence-based suitability evaluations across common homebuyer profiles. Not guarantees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.buyer_suitability_profiles.map((profile, idx) => (
            <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">{profile.profile_name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={profile.fit_level === 'High' ? 'ok' : (profile.fit_level === 'Moderate' ? 'info' : 'warn')}>
                    {profile.fit_level} Fit
                  </Badge>
                  <span className="font-mono font-bold text-xs text-slate-700">{profile.fit_score}/100</span>
                </div>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">{profile.fit_rationale}</p>
              <div className="space-y-1 pt-1 border-t border-slate-200">
                <span className="text-[10px] font-mono text-slate-500 uppercase block font-semibold">
                  Key Buyer Trade-offs to Consider:
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px]">
                  {profile.key_tradeoffs.map((t, tIdx) => (
                    <li key={tIdx}>{t}</li>
                  ))}
                </ul>
              </div>
              <div className="pt-1 flex items-center gap-1 flex-wrap">
                {profile.evidence_ids.map((id) => renderCitationPill(id))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 10. Due-Diligence Checklist & Questions for Seller */}
      <div className="bg-white p-6 rounded-lg border border-brand-border space-y-4 text-xs">
        <div>
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <HelpCircle size={16} className="text-blue-600" />
            <span>Evidence-Grounded Due-Diligence Questions</span>
          </h3>
          <p className="text-slate-500 text-[11px] mt-0.5">
            Specific questions formulated from identified evidence gaps that the buyer should independently verify.
          </p>
        </div>

        <div className="space-y-3">
          {report.due_diligence_checklist.map((item, idx) => (
            <div key={idx} className="p-3.5 bg-slate-50 rounded border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-bold text-slate-900 text-xs">{item.topic}</span>
                <span className="text-[10px] text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                  Verify via: {item.verification_source}
                </span>
              </div>
              <p className="text-slate-800 font-medium leading-relaxed">
                "{item.question_to_ask_seller}"
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 font-mono">Linked Evidence Gap:</span>
                {renderCitationPill(item.evidence_gap_id)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 11. Missing Evidence Audit */}
      <div className="bg-white p-6 rounded-lg border border-brand-border space-y-4 text-xs">
        <div>
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <FileQuestion size={16} className="text-rose-600" />
            <span>Missing Evidence & Uncertainty Audit</span>
          </h3>
          <p className="text-slate-500 text-[11px] mt-0.5">
            Transparent disclosure of facts that have NOT been corroborated by this directory.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {report.missing_evidence_audit.map((gap, idx) => (
            <div key={idx} className="p-3 bg-rose-50/50 rounded border border-rose-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-950 text-xs">{gap.item_name}</span>
                <Badge variant={gap.impact === 'high' ? 'warn' : 'neutral'} className="uppercase text-[9px]">
                  {gap.impact} impact
                </Badge>
              </div>
              <p className="text-slate-700 text-[11px] leading-snug">{gap.why_it_matters}</p>
              <div className="pt-1">
                {renderCitationPill(gap.evidence_gap_id)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Evidence Inspector Modal */}
      <EvidenceInspectorModal
        evidenceItem={selectedEvidenceItem}
        onClose={() => setSelectedEvidenceId(null)}
      />
    </div>
  );
};
