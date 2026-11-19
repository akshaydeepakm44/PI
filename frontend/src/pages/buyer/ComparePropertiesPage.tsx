import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { propertyApi, wishlistApi, intelligenceApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Scale,
  Plus,
  X,
  Building,
  Check,
  ArrowRight,
  Sparkles,
  Car,
  Wind,
  ShieldAlert,
  Sliders,
  RotateCw,
  Heart,
  Search
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Award, Zap, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { BuyerPreferences, PropertyComparisonResponse } from '../../types';

export const ComparePropertiesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const addedId = searchParams.get('add');
  const { isAuthenticated, role } = useAuth();

  const [pickerModalOpen, setPickerModalOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerTab, setPickerTab] = useState<'wishlist' | 'all'>('wishlist');

  // Fetch all properties
  const { data: allProperties, isLoading: isPropsLoading } = useQuery({
    queryKey: ['public-properties'],
    queryFn: () => propertyApi.getProperties()
  });

  // Fetch wishlist
  const { data: wishlist } = useQuery({
    queryKey: ['user-wishlist'],
    queryFn: () => wishlistApi.getWishlist(),
    enabled: isAuthenticated && role === 'buyer'
  });

  // Selected property IDs for comparison (max 4, min 2)
  const [selectedIds, setSelectedIds] = useState<number[]>(() => {
    if (addedId) {
      return [parseInt(addedId, 10)];
    }
    return [];
  });

  // If user has wishlist items and no URL param, initialize with wishlist items
  useEffect(() => {
    if (!addedId && selectedIds.length === 0 && wishlist && wishlist.length >= 2) {
      setSelectedIds(wishlist.slice(0, 4).map((w) => w.property_id));
    }
  }, [wishlist, addedId]);

  // Buyer personal constraints
  const [targetBudget, setTargetBudget] = useState<number | undefined>(undefined);
  const [intendedUse, setIntendedUse] = useState<string>('family_home');
  const [schoolPrio, setSchoolPrio] = useState<number>(4);
  const [transitPrio, setTransitPrio] = useState<number>(4);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const buyerPrefs: BuyerPreferences = {
    budget_max: targetBudget || null,
    intended_use: intendedUse,
    priorities: {
      schools: schoolPrio,
      transit: transitPrio
    }
  };

  // Structured comparison query
  const {
    data: comparison,
    isLoading: isCompareLoading,
    refetch: refetchCompare,
    isFetching: isCompareFetching
  } = useQuery<PropertyComparisonResponse>({
    queryKey: ['property-comparison', selectedIds, targetBudget, intendedUse, schoolPrio, transitPrio],
    queryFn: () => intelligenceApi.compareProperties(selectedIds, buyerPrefs),
    enabled: selectedIds.length >= 2
  });

  const handleToggleProperty = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((pId) => pId !== id));
    } else {
      if (selectedIds.length < 4) {
        setSelectedIds([...selectedIds, id]);
      }
    }
  };

  const handleRemoveProperty = (id: number) => {
    setSelectedIds(selectedIds.filter((pId) => pId !== id));
  };

  if (isPropsLoading) {
    return <LoadingSpinner message="Loading properties for comparison..." />;
  }

  const comparedProps = comparison?.properties || [];
  const wishlistedPropertyIds = new Set(wishlist?.map((w) => w.property_id) || []);

  const filteredPickerProperties = (allProperties || []).filter((p) => {
    if (pickerTab === 'wishlist' && !wishlistedPropertyIds.has(p.id)) return false;
    if (pickerSearch) {
      const q = pickerSearch.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.locality.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 1. Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-lg border border-brand-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Scale size={20} className="text-blue-600" />
              <span>Multi-Property Intelligence Comparison</span>
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
              {selectedIds.length} of 4 Selected
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Compare verified coordinates, actual road commute times, air quality, and rate metrics side-by-side.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => setPickerModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <Plus size={13} />
            <span>Select Properties ({selectedIds.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sliders size={13} />
            <span>Buyer Constraints</span>
          </button>
        </div>
      </div>

      {/* 2. Personal Constraints Drawer */}
      {filtersOpen && (
        <div className="bg-white p-5 rounded-lg border border-blue-200 shadow-xs space-y-4 animate-fadeIn text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Sliders size={14} className="text-blue-600" />
              <span>Buyer Evaluation Parameters</span>
            </h3>
            <button
              onClick={() => setFiltersOpen(false)}
              className="text-slate-400 hover:text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Budget Cap (INR)</label>
              <input
                type="number"
                placeholder="e.g. 15000000"
                value={targetBudget || ''}
                onChange={(e) => setTargetBudget(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Intended Usage</label>
              <select
                value={intendedUse}
                onChange={(e) => setIntendedUse(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs"
              >
                <option value="family_home">Family Primary Residence</option>
                <option value="rental_income">Rental Yield Investment</option>
                <option value="vacation_home">Weekend Beach / Coastal Retreat</option>
                <option value="retirement">Retirement Residence</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">School Proximity Priority (1-5)</label>
              <input
                type="range"
                min="1"
                max="5"
                value={schoolPrio}
                onChange={(e) => setSchoolPrio(Number(e.target.value))}
                className="w-full mt-2 accent-blue-600"
              />
              <span className="text-[10px] text-slate-400 font-mono">Weight: {schoolPrio}/5</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Empty State if fewer than 2 properties selected */}
      {selectedIds.length < 2 ? (
        <div className="bg-white rounded-lg border border-brand-border p-8 text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Scale size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-slate-900">
              {selectedIds.length === 0 ? 'No Properties Selected for Comparison' : 'Select at Least 1 More Property'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Choose 2 to 4 properties from your wishlist or the directory to compare specifications, road travel times, and environmental quality.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setPickerModalOpen(true)}
              className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primaryHover text-white text-xs font-semibold rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>Choose Properties to Compare</span>
            </button>
          </div>

          {/* Quick Selection Cards Grid */}
          <div className="pt-6 border-t border-slate-100 max-w-4xl mx-auto">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono mb-3 text-left">
              Quick Pick from Available Listings:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              {(allProperties || []).slice(0, 6).map((p) => {
                const isSelected = selectedIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => handleToggleProperty(p.id)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-50/70 border-blue-400 ring-1 ring-blue-300'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-white'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-slate-900 text-xs block truncate">{p.name}</span>
                      <span className="text-[11px] text-slate-500 block">{p.locality}</span>
                      <span className="font-mono font-bold text-blue-700 text-xs block mt-1">{p.asking_price}</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 capitalize">{p.property_type.replace('_', ' ')}</span>
                      <span className={`font-semibold ${isSelected ? 'text-blue-700' : 'text-slate-600'}`}>
                        {isSelected ? '✓ Selected' : '+ Select'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : isCompareLoading ? (
        <LoadingSpinner message="Calculating multi-property intelligence metrics..." />
      ) : (
        /* 4. Comparison Table */
        <div className="bg-white rounded-lg border border-brand-border overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white">
                  <th className="p-4 font-mono uppercase tracking-wider text-[11px] w-64 bg-slate-950">
                    Property Specification
                  </th>
                  {comparedProps.map((p) => (
                    <th key={p.id} className="p-4 min-w-[240px] border-l border-slate-800">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-sm text-white block">{p.name}</span>
                          <span className="text-[11px] text-slate-400 block">{p.locality}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveProperty(p.id)}
                          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Remove from comparison"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </th>
                  ))}
                  {comparedProps.length < 4 && (
                    <th className="p-4 min-w-[160px] border-l border-slate-800 text-center">
                      <button
                        type="button"
                        onClick={() => setPickerModalOpen(true)}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded text-xs font-semibold border border-dashed border-slate-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus size={12} />
                        <span>Add Property</span>
                      </button>
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {/* Asking Price */}
                <tr>
                  <td className="p-4 font-semibold text-slate-600 bg-slate-50/50">Stated Asking Price</td>
                  {comparedProps.map((p) => (
                    <td key={p.id} className="p-4 font-mono font-bold text-slate-900 border-l border-brand-border">
                      {p.asking_price}
                    </td>
                  ))}
                  {comparedProps.length < 4 && <td className="border-l border-brand-border bg-slate-50/30"></td>}
                </tr>

                {/* Rate / Sq Ft */}
                <tr className="bg-blue-50/30">
                  <td className="p-4 font-bold text-blue-900 bg-blue-50/60 font-mono text-[11px]">
                    Calculated Rate / Sq Ft
                  </td>
                  {comparedProps.map((p) => (
                    <td key={p.id} className="p-4 font-mono font-bold text-blue-800 border-l border-brand-border text-sm">
                      {p.rate_per_sqft ? `₹${p.rate_per_sqft.toLocaleString()} / sq ft` : 'N/A'}
                    </td>
                  ))}
                  {comparedProps.length < 4 && <td className="border-l border-brand-border bg-slate-50/30"></td>}
                </tr>

                {/* Area */}
                <tr>
                  <td className="p-4 font-semibold text-slate-600 bg-slate-50/50">Built-up / Plot Area</td>
                  {comparedProps.map((p) => (
                    <td key={p.id} className="p-4 text-slate-800 border-l border-brand-border font-mono">
                      {p.area} {p.area_unit}
                    </td>
                  ))}
                  {comparedProps.length < 4 && <td className="border-l border-brand-border bg-slate-50/30"></td>}
                </tr>

                {/* Stage */}
                <tr>
                  <td className="p-4 font-semibold text-slate-600 bg-slate-50/50">Property Type & Stage</td>
                  {comparedProps.map((p) => (
                    <td key={p.id} className="p-4 capitalize text-slate-800 border-l border-brand-border">
                      <span className="font-semibold block">{p.property_type.replace('_', ' ')}</span>
                      <span className="text-[11px] text-slate-500 font-normal">{p.construction_status}</span>
                    </td>
                  ))}
                  {comparedProps.length < 4 && <td className="border-l border-brand-border bg-slate-50/30"></td>}
                </tr>

                {/* Copernicus CAMS Air Quality */}
                <tr>
                  <td className="p-4 font-semibold text-slate-600 bg-slate-50/50">
                    <div className="flex items-center gap-1">
                      <Wind size={13} className="text-slate-500" />
                      <span>Copernicus CAMS AQI</span>
                    </div>
                  </td>
                  {comparedProps.map((p) => (
                    <td key={p.id} className="p-4 border-l border-brand-border">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">
                          {p.air_quality.us_aqi ?? 'N/A'}
                        </span>
                        <Badge variant={p.air_quality.us_aqi && p.air_quality.us_aqi <= 100 ? 'ok' : 'warn'}>
                          {p.air_quality.category}
                        </Badge>
                      </div>
                    </td>
                  ))}
                  {comparedProps.length < 4 && <td className="border-l border-brand-border bg-slate-50/30"></td>}
                </tr>

                {/* Road Commutes */}
                <tr>
                  <td className="p-4 font-semibold text-slate-600 bg-slate-50/50">
                    <div className="flex items-center gap-1">
                      <Car size={13} className="text-slate-500" />
                      <span>Road Commutes</span>
                    </div>
                  </td>
                  {comparedProps.map((p) => (
                    <td key={p.id} className="p-4 border-l border-brand-border space-y-2">
                      {Object.entries(p.routes).map(([dest, r]) => (
                        <div key={dest} className="text-[11px] p-2 bg-slate-50 rounded border border-slate-200">
                          <span className="font-semibold text-slate-800 block truncate">{dest}</span>
                          <div className="flex justify-between font-mono text-slate-600 pt-0.5">
                            <span>{r.road_distance_km} km</span>
                            <span className="text-blue-700 font-bold">~{r.estimated_duration_mins} mins</span>
                          </div>
                        </div>
                      ))}
                    </td>
                  ))}
                  {comparedProps.length < 4 && <td className="border-l border-brand-border bg-slate-50/30"></td>}
                </tr>

                {/* Actions */}
                <tr>
                  <td className="p-4 font-semibold text-slate-600 bg-slate-50/50">Full Details</td>
                  {comparedProps.map((p) => (
                    <td key={p.id} className="p-4 border-l border-brand-border">
                      <Link
                        to={role === 'buyer' ? `/buyer/properties/${p.id}` : `/properties/${p.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold text-xs transition-colors"
                      >
                        <span>View Details & Map</span>
                        <ArrowRight size={12} />
                      </Link>
                    </td>
                  ))}
                  {comparedProps.length < 4 && <td className="border-l border-brand-border bg-slate-50/30"></td>}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4.5. AI Comparative Intelligence & Trade-Off Insights */}
      {comparedProps.length >= 2 && (
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 rounded-xl p-6 text-white border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold">
                <Sparkles size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white tracking-tight">AI Comparative Intelligence & Trade-Off Insights</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                    Live Multi-Vector Synthesis
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Autonomous cross-property synthesis analyzing actual road commute times, Copernicus CAMS air quality, municipal evidence completeness, and rate economics.
                </p>
              </div>
            </div>

            <div className="text-xs font-mono text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/60 self-start sm:self-auto">
              Analyzing {comparedProps.length} Properties
            </div>
          </div>

          {/* 4 Dimension Winner Cards */}
          {(() => {
            const bestRateProp = [...comparedProps].sort((a, b) => (a.rate_per_sqft || 999999) - (b.rate_per_sqft || 999999))[0];
            const bestAqiProp = [...comparedProps].filter(p => p.air_quality?.us_aqi).sort((a, b) => (a.air_quality.us_aqi || 999) - (b.air_quality.us_aqi || 999))[0];
            const bestCommuteProp = [...comparedProps].sort((a, b) => {
              const durA = Object.values(a.routes || {})[0]?.estimated_duration_mins || 999;
              const durB = Object.values(b.routes || {})[0]?.estimated_duration_mins || 999;
              return durA - durB;
            })[0];
            const zeroDocProps = comparedProps.filter(p => !p.evidence_count || p.evidence_count === 0);

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Value Winner */}
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <Award size={14} />
                      <span>Best Unit Rate Value</span>
                    </span>
                    <span className="text-[10px] bg-amber-400/20 px-1.5 py-0.5 rounded text-amber-300 font-mono">1st Place</span>
                  </div>
                  <div className="font-bold text-sm text-white">{bestRateProp?.name}</div>
                  <div className="text-xs text-slate-300 font-mono">
                    ₹{bestRateProp?.rate_per_sqft?.toLocaleString() || 'N/A'} / sq ft
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Offers lowest capital expenditure per square foot of built-up living space.
                  </p>
                </div>

                {/* 2. Commute Winner */}
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-blue-300">
                    <span className="flex items-center gap-1.5">
                      <Car size={14} />
                      <span>Top Commute Accessibility</span>
                    </span>
                    <span className="text-[10px] bg-blue-400/20 px-1.5 py-0.5 rounded text-blue-300 font-mono">Fastest Route</span>
                  </div>
                  <div className="font-bold text-sm text-white">{bestCommuteProp?.name}</div>
                  <div className="text-xs text-slate-300 font-mono">
                    {bestCommuteProp?.locality}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Minimizes drive time to primary urban transit and commercial hubs on actual OSRM road graphs.
                  </p>
                </div>

                {/* 3. Microclimate Winner */}
                <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <Wind size={14} />
                      <span>Cleanest Air Microclimate</span>
                    </span>
                    <span className="text-[10px] bg-emerald-400/20 px-1.5 py-0.5 rounded text-emerald-300 font-mono">Copernicus</span>
                  </div>
                  <div className="font-bold text-sm text-white">{bestAqiProp?.name || comparedProps[0]?.name}</div>
                  <div className="text-xs text-slate-300 font-mono">
                    US AQI: {bestAqiProp?.air_quality?.us_aqi ?? 'N/A'} ({bestAqiProp?.air_quality?.category ?? 'Good'})
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Benefits from maritime airflow and lower particulate matter concentration.
                  </p>
                </div>

                {/* 4. Legal Due Diligence Status */}
                <div className={`p-4 rounded-xl border space-y-2 ${
                  zeroDocProps.length > 0
                    ? 'bg-rose-950/40 border-rose-700/50 text-rose-200'
                    : 'bg-slate-800/60 border-slate-700/60 text-slate-200'
                }`}>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-1.5">
                      <ShieldAlert size={14} className={zeroDocProps.length > 0 ? 'text-rose-400' : 'text-emerald-400'} />
                      <span>Due Diligence Evidence</span>
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      zeroDocProps.length > 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {zeroDocProps.length > 0 ? 'Action Required' : 'Verified'}
                    </span>
                  </div>
                  <div className="font-bold text-sm text-white">
                    {zeroDocProps.length > 0 ? `${zeroDocProps[0].name} (0 Docs)` : 'All Corroborated'}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {zeroDocProps.length > 0
                      ? `Critical Deficit: ${zeroDocProps.map(p => p.name).join(', ')} has 0 uploaded title deeds or RERA certificates. Strict vetting required before advance.`
                      : 'All candidate listings have uploaded verified documents and municipal layout plans.'
                    }
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Persona Recommendations from Backend Comparator */}
          {comparison?.persona_recommendations && comparison.persona_recommendations.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Persona Suitability Matches:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {comparison.persona_recommendations.map((rec, idx) => {
                  const matchProp = comparedProps.find(p => p.id === rec.recommended_property_id);
                  return (
                    <div key={idx} className="p-3.5 bg-slate-800/40 rounded-lg border border-slate-700/50 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-blue-400">{rec.persona}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Match</span>
                      </div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{matchProp?.name || `Property #${rec.recommended_property_id}`}</span>
                        {matchProp?.locality && (
                          <span className="text-[11px] text-slate-400 font-normal">({matchProp.locality})</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {rec.rationale}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Trade-Offs Summary */}
          {comparison?.tradeoffs_summary && comparison.tradeoffs_summary.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                Key Comparative Findings & Trade-Offs:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300">
                {comparison.tradeoffs_summary.map((tradeoff, idx) => (
                  <div key={idx} className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/40 flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="text-blue-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{tradeoff}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buyer Action Checklist */}
          <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-800/50 space-y-2 text-xs">
            <div className="font-bold text-blue-300 flex items-center gap-1.5">
              <Zap size={14} className="text-amber-400" />
              <span>Recommended Buyer Diligence Checklist:</span>
            </div>
            <ul className="space-y-1.5 text-slate-300 text-[11px] list-disc list-inside">
              <li>Request latest sanctioned municipal layout from the builder of any property labeled <em>"Seller provided / Unverified"</em>.</li>
              <li>Verify commute times during peak morning hours (8:30 AM - 10:00 AM) along the NH16 and Beach Road corridors.</li>
              <li>Review the monthly maintenance commitment vs amenity count to forecast true 5-year total cost of ownership.</li>
            </ul>
          </div>
        </div>
      )}

      {/* 5. Property Picker Modal */}
      {pickerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Select Properties to Compare</h3>
                <p className="text-xs text-slate-500">Pick up to 4 properties from your wishlist or directory listings.</p>
              </div>
              <button
                type="button"
                onClick={() => setPickerModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs & Search */}
            <div className="space-y-3">
              <div className="flex border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setPickerTab('wishlist')}
                  className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                    pickerTab === 'wishlist'
                      ? 'border-blue-600 text-blue-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  From Wishlist ({wishlistedPropertyIds.size})
                </button>
                <button
                  type="button"
                  onClick={() => setPickerTab('all')}
                  className={`py-2 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
                    pickerTab === 'all'
                      ? 'border-blue-600 text-blue-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All Directory Properties ({allProperties?.length || 0})
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by property name or locality..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500"
                />
                <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
              {filteredPickerProperties.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  {pickerTab === 'wishlist'
                    ? 'No properties found in your wishlist. Switch to "All Directory Properties" above to select.'
                    : 'No properties match your search.'}
                </div>
              ) : (
                filteredPickerProperties.map((p) => {
                  const isSelected = selectedIds.includes(p.id);
                  const isMaxReached = selectedIds.length >= 4 && !isSelected;

                  return (
                    <div
                      key={p.id}
                      className="pt-2 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded bg-slate-100 shrink-0 overflow-hidden">
                          <img
                            src={p.photos?.[0]?.url || '/assets/ramez_seapoint.jpg'}
                            alt={p.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 block truncate">{p.name}</span>
                          <span className="text-[11px] text-slate-500 block">{p.locality}</span>
                          <span className="font-mono text-blue-700 font-bold text-[11px]">{p.asking_price}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isMaxReached}
                        onClick={() => handleToggleProperty(p.id)}
                        className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : isMaxReached
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {isSelected ? '✓ Selected' : isMaxReached ? 'Max 4' : '+ Add'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono">
                {selectedIds.length} / 4 properties selected
              </span>
              <button
                type="button"
                onClick={() => setPickerModalOpen(false)}
                className="px-4 py-2 bg-slate-900 text-white font-semibold rounded hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
