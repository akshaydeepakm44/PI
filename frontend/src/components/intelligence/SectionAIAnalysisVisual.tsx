import React, { useState } from 'react';
import { DemoVisualData } from '../../demo/sampleAnalyses';
import {
  AlertCircle,
  MapPin,
  Clock,
  Car,
  Bike,
  Plus,
  X,
  Navigation,
  Building2,
  GraduationCap,
  ShoppingBag,
  Coffee,
  Bus,
  HeartPulse,
  Pill,
  Home,
  Check,
  ChevronRight
} from 'lucide-react';

// -----------------------------------------------------------------------------
// Subcomponent: Listed vs By Road Comparison (Neighbourhood)
// -----------------------------------------------------------------------------
interface ListedVsRoadVisualProps {
  visual: DemoVisualData;
}

const ListedVsRoadVisual: React.FC<ListedVsRoadVisualProps> = ({ visual }) => {
  const [activeView, setActiveView] = useState<'bars' | 'map'>('bars');
  const places = visual.places || [
    { name: 'Ratnadeep Supermarket', listedKm: 1.2, roadKm: 1.5, detourFactor: 1.25, category: 'Groceries' },
    { name: 'Jubilee Hills Checkpost (metro)', listedKm: 3.0, roadKm: 4.7, detourFactor: 1.57, category: 'Metro' },
    { name: 'Oakridge International', listedKm: 3.4, roadKm: 4.1, detourFactor: 1.21, category: 'School' }
  ];
  const maxScaleKm = 5.0;

  return (
    <div className="bg-[#f8fafc] border border-slate-200/90 rounded-2xl p-4 sm:p-5 my-5">
      {/* Sample Banner */}
      <div className="flex items-center gap-2 p-2.5 mb-4 bg-amber-50/90 border border-amber-200/90 rounded-xl text-xs font-medium text-amber-900">
        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
        <span>Sample data. Not the real surroundings, peers or traffic of this project.</span>
      </div>

      {/* Header & View Switcher */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 gap-2 flex-wrap">
        <div>
          <h4 className="text-sm font-bold text-[#0f172a]">Listed vs by road</h4>
          <p className="text-xs text-slate-500">Straight-line brochure distance against actual navigation road route</p>
        </div>
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveView('bars')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
              activeView === 'bars'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Comparison Bars
          </button>
          <button
            type="button"
            onClick={() => setActiveView('map')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
              activeView === 'map'
                ? 'bg-white text-teal-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-teal-700" />
            <span>Show on Map</span>
          </button>
        </div>
      </div>

      {/* Main Content: Bars View */}
      {activeView === 'bars' && (
        <div className="space-y-4 pt-4">
          {places.map((place: any, idx: number) => {
            const listedPct = Math.min((place.listedKm / maxScaleKm) * 100, 100);
            const roadPct = Math.min((place.roadKm / maxScaleKm) * 100, 100);
            return (
              <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-xs flex-wrap gap-1">
                  <span className="font-bold text-slate-900">{place.name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                    x{place.detourFactor} detour (+{Math.round((place.detourFactor - 1) * 100)}%)
                  </span>
                </div>

                {/* Double Bar Comparison */}
                <div className="space-y-1.5">
                  {/* Listed Straight-line Bar */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-20 text-[11px] text-slate-500 shrink-0">Listed:</span>
                    <div className="flex-1 h-4 bg-slate-100 rounded-md overflow-hidden flex items-center">
                      <div
                        className="bg-slate-400 h-full rounded-md flex items-center px-2 text-[10px] font-semibold text-white"
                        style={{ width: `${listedPct}%` }}
                      >
                        {place.listedKm} km
                      </div>
                    </div>
                  </div>

                  {/* Actual Road Bar */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-20 text-[11px] text-teal-900 font-semibold shrink-0">By Road:</span>
                    <div className="flex-1 h-5 bg-slate-100 rounded-md overflow-hidden flex items-center">
                      <div
                        className="bg-[#0f766e] h-full rounded-md flex items-center px-2 text-[11px] font-bold text-white transition-all duration-300"
                        style={{ width: `${roadPct}%` }}
                      >
                        {place.roadKm} km
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
            <span>0 km (Project Gate)</span>
            <span>Scale to 5.0 km</span>
          </div>
        </div>
      )}

      {/* Main Content: Map View */}
      {activeView === 'map' && (
        <div className="pt-4">
          <div className="bg-slate-900 rounded-xl p-4 text-white relative overflow-hidden">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-800">
              <span className="font-semibold text-slate-300">Surrounding Route Geometry</span>
              <span className="text-[11px] text-slate-400">OpenStreetMap Coordinates</span>
            </div>

            <svg viewBox="0 0 500 240" className="w-full h-56 mt-2">
              {/* Background grid lines */}
              <line x1="50" y1="40" x2="450" y2="40" stroke="#1e293b" strokeDasharray="4 4" />
              <line x1="50" y1="120" x2="450" y2="120" stroke="#1e293b" strokeDasharray="4 4" />
              <line x1="50" y1="200" x2="450" y2="200" stroke="#1e293b" strokeDasharray="4 4" />

              {/* Project Origin */}
              <circle cx="160" cy="140" r="10" fill="#0f766e" stroke="#2dd4bf" strokeWidth="2.5" />
              <text x="160" y="165" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#ffffff">Project Gate</text>

              {/* Ratnadeep Supermarket (North) */}
              <line x1="160" y1="140" x2="160" y2="40" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
              <path d="M 160 140 L 180 90 L 160 40" fill="none" stroke="#2dd4bf" strokeWidth="2.5" />
              <circle cx="160" cy="40" r="7" fill="#0284c7" />
              <text x="160" y="28" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#bae6fd">Ratnadeep (1.5 km)</text>

              {/* Jubilee Hills Checkpost Metro (East) */}
              <line x1="160" y1="140" x2="420" y2="70" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
              <path d="M 160 140 L 260 140 L 320 100 L 420 70" fill="none" stroke="#f59e0b" strokeWidth="3" />
              <circle cx="420" cy="70" r="7" fill="#f59e0b" />
              <text x="420" y="58" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#fef08a">Jubilee Metro (4.7 km)</text>

              {/* Oakridge International (South-East) */}
              <line x1="160" y1="140" x2="380" y2="200" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
              <path d="M 160 140 L 220 180 L 380 200" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
              <circle cx="380" cy="200" r="7" fill="#38bdf8" />
              <text x="380" y="218" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#e0f2fe">Oakridge (4.1 km)</text>
            </svg>

            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-slate-400 border-dashed" /> Straight line</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-[#2dd4bf] rounded-xs" /> Mapped road route</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-[#f59e0b] rounded-xs" /> Metro corridor (x1.57 detour)</span>
            </div>
          </div>
        </div>
      )}

      {/* 10-Minute Walk Errand Core Strip */}
      <div className="mt-4 pt-3.5 border-t border-slate-200">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center justify-between">
          <span>10-minute walk (800 m) errand core</span>
          <span className="text-[11px] font-normal text-slate-500">Pedestrian isochrone</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200">
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-700" />
            <span>3 grocery</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-teal-50 text-teal-900 border border-teal-200">
            <Pill className="w-3.5 h-3.5 text-teal-700" />
            <span>1 pharmacy</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
            <Coffee className="w-3.5 h-3.5 text-amber-700" />
            <span>2 cafés</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-900 border border-blue-200">
            <Bus className="w-3.5 h-3.5 text-blue-700" />
            <span>1 bus stop</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
            <HeartPulse className="w-3.5 h-3.5 text-slate-400" />
            <span>0 clinics</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
            <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
            <span>0 schools</span>
          </span>
        </div>
      </div>

      {/* Footer Line */}
      <div className="mt-3.5 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
        Sample map data, Nov 2026. Peer set: 14 projects within 5 km (sample).
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Subcomponent: Commute Route Map + Time Toggle + Transit Bar (My Commute)
// -----------------------------------------------------------------------------
interface CommuteRouteMapVisualProps {
  visual: DemoVisualData;
  onAddMyPlaces?: () => void;
}

const CommuteRouteMapVisual: React.FC<CommuteRouteMapVisualProps> = ({ visual, onAddMyPlaces }) => {
  const [selectedTime, setSelectedTime] = useState<'08:30' | '11:00' | '18:30'>('08:30');
  const [customPlaces, setCustomPlaces] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [placeName, setPlaceName] = useState('');
  const [placeType, setPlaceType] = useState('office');
  const [placeKm, setPlaceKm] = useState('6.5');
  const [placeTime, setPlaceTime] = useState('18');

  const baseDestinations = [
    {
      id: 'dlf_cyber_city',
      name: 'DLF Cyber City',
      type: 'office',
      roadDistanceKm: 8.5,
      times: {
        '08:30': 31,
        '11:00': 22,
        '18:30': 34
      },
      annualHours: 183
    },
    {
      id: 'oakridge_school',
      name: 'Oakridge International',
      type: 'school',
      roadDistanceKm: 4.1,
      times: {
        '08:30': 16,
        '11:00': 13,
        '18:30': 15
      },
      annualHours: 173
    }
  ];

  const handleAddCustomPlace = () => {
    if (!placeName.trim()) return;
    const km = parseFloat(placeKm) || 5.0;
    const mins = parseInt(placeTime, 10) || 15;
    const newDest = {
      id: `custom_${Date.now()}`,
      name: placeName.trim(),
      type: placeType,
      roadDistanceKm: km,
      times: {
        '08:30': Math.round(mins * 1.3),
        '11:00': mins,
        '18:30': Math.round(mins * 1.4)
      },
      annualHours: Math.round((mins * 2 * 220) / 60)
    };
    setCustomPlaces([...customPlaces, newDest]);
    setPlaceName('');
    setShowAddModal(false);
  };

  const allDestinations = [...baseDestinations, ...customPlaces];

  // Stacked Bar Calculation
  const officeHours = 183;
  const schoolHours = 173;
  const customTotalHours = customPlaces.reduce((acc, p) => acc + (p.annualHours || 50), 0);
  const peakExtraHours = 38;
  const totalBaseHours = officeHours + schoolHours + customTotalHours;
  const totalWithPeak = totalBaseHours + peakExtraHours;

  const officePct = Math.round((officeHours / totalWithPeak) * 100);
  const schoolPct = Math.round((schoolHours / totalWithPeak) * 100);
  const customPct = customTotalHours > 0 ? Math.round((customTotalHours / totalWithPeak) * 100) : 0;
  const peakPct = 100 - officePct - schoolPct - customPct;

  return (
    <div className="bg-[#f8fafc] border border-slate-200/90 rounded-2xl p-4 sm:p-5 my-5">
      {/* Sample Banner */}
      <div className="flex items-center gap-2 p-2.5 mb-4 bg-amber-50/90 border border-amber-200/90 rounded-xl text-xs font-medium text-amber-900">
        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
        <span>Sample data. Not the real surroundings, peers or traffic of this project.</span>
      </div>

      {/* Header & Departure Time Toggle */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 gap-3 flex-wrap">
        <div>
          <h4 className="text-sm font-bold text-[#0f172a]">Route Travel Times &amp; Peak Congestion</h4>
          <p className="text-xs text-slate-500">Live traffic simulation by time of departure</p>
        </div>

        {/* Time Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-xl">
          {(['08:30', '11:00', '18:30'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedTime(t)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedTime === t
                  ? 'bg-[#0f2744] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t} {t === '08:30' ? '(Morning Peak)' : t === '11:00' ? '(Mid-day)' : '(Evening Peak)'}
            </button>
          ))}
        </div>
      </div>

      {/* Destinations & Stylised Route Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-4 items-center">
        {/* Destinations List */}
        <div className="lg:col-span-5 space-y-2.5">
          {allDestinations.map((dest: any) => {
            const currentTime = dest.times[selectedTime] || dest.times['11:00'];
            const isPeak = selectedTime === '08:30' || selectedTime === '18:30';
            return (
              <div key={dest.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    {dest.type === 'school' ? (
                      <GraduationCap className="w-4 h-4 text-sky-700" />
                    ) : dest.type === 'office' ? (
                      <Building2 className="w-4 h-4 text-emerald-700" />
                    ) : (
                      <MapPin className="w-4 h-4 text-purple-700" />
                    )}
                    <span className="font-bold text-xs text-[#0f172a]">{dest.name}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 ml-5.5">{dest.roadDistanceKm} km by road</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-[#0f2744] flex items-center justify-end gap-1">
                    <span>{currentTime} mins</span>
                    {isPeak && dest.id === 'dlf_cyber_city' && (
                      <span className="text-[10px] text-amber-700 font-semibold">(+9m)</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">one way</span>
                </div>
              </div>
            );
          })}

          {/* Add Commute Button */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="w-full py-2.5 px-3 rounded-xl border border-dashed border-teal-600 bg-teal-50/50 hover:bg-teal-50 text-teal-900 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-teal-700" />
            <span>Add a commute destination</span>
          </button>
        </div>

        {/* Route Map Canvas */}
        <div className="lg:col-span-7 bg-slate-900 rounded-xl p-3 text-white relative">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
            <span className="font-semibold text-slate-300">Route Map &amp; Transit Corridor</span>
            <span className="text-[11px] text-emerald-400 font-mono">Time: {selectedTime} IST</span>
          </div>

          <svg viewBox="0 0 450 180" className="w-full h-44 mt-1">
            {/* Arterial Corridor Roadway */}
            <path d="M 40 90 Q 150 90 220 50 T 400 40" fill="none" stroke="#334155" strokeWidth="8" />
            <path d="M 40 90 Q 150 90 220 50 T 400 40" fill="none" stroke="#2dd4bf" strokeWidth="3" />

            {/* School branch roadway */}
            <path d="M 40 90 Q 120 120 220 145" fill="none" stroke="#38bdf8" strokeWidth="3" />

            {/* Project Origin Pin */}
            <circle cx="40" cy="90" r="10" fill="#0f766e" stroke="#ffffff" strokeWidth="2" />
            <text x="40" y="115" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#ffffff">Project Gate</text>

            {/* DLF Cyber City Pin */}
            <circle cx="400" cy="40" r="9" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
            <text x="390" y="24" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#a7f3d0">
              DLF Cyber City ({selectedTime === '08:30' ? '31m' : selectedTime === '11:00' ? '22m' : '34m'})
            </text>

            {/* Oakridge International Pin */}
            <circle cx="220" cy="145" r="9" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
            <text x="220" y="165" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#bae6fd">
              Oakridge School ({selectedTime === '08:30' ? '16m' : selectedTime === '11:00' ? '13m' : '15m'})
            </text>

            {/* Custom Places Pins */}
            {customPlaces.map((cp, idx) => (
              <g key={cp.id}>
                <line x1="40" y1="90" x2={280 + idx * 40} y2={95 + idx * 25} stroke="#c084fc" strokeWidth="2" strokeDasharray="3 3" />
                <circle cx={280 + idx * 40} cy={95 + idx * 25} r="7" fill="#a855f7" stroke="#ffffff" strokeWidth="1.5" />
                <text x={280 + idx * 40} y={115 + idx * 25} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#f3e8ff">
                  {cp.name} ({cp.times[selectedTime] || 20}m)
                </text>
              </g>
            ))}
          </svg>

          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
            <span>Project (Gate 1)</span>
            <span>8.5 km to Cyber City · 4.1 km to School</span>
          </div>
        </div>
      </div>

      {/* "Your year in transit" Stacked Bar */}
      <div className="mt-5 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
          <span>Your year in transit</span>
          <span className="text-teal-900 font-semibold">{totalBaseHours} h + {peakExtraHours} h peak = {totalWithPeak} h / yr</span>
        </div>

        {/* Stacked Bar with Striped Peak Segment */}
        <div className="h-8 w-full rounded-xl overflow-hidden flex items-stretch border border-slate-200 shadow-xs bg-slate-100">
          {/* Office Segment */}
          <div
            className="bg-[#0f766e] text-white text-[11px] font-bold flex items-center justify-center transition-all duration-300"
            style={{ width: `${officePct}%` }}
            title={`Office: ${officeHours} hours`}
          >
            Office: {officeHours} h
          </div>

          {/* School Segment */}
          <div
            className="bg-[#0284c7] text-white text-[11px] font-bold flex items-center justify-center transition-all duration-300"
            style={{ width: `${schoolPct}%` }}
            title={`School: ${schoolHours} hours`}
          >
            School: {schoolHours} h
          </div>

          {/* Custom Segment (if any) */}
          {customPct > 0 && (
            <div
              className="bg-[#7c3aed] text-white text-[11px] font-bold flex items-center justify-center transition-all duration-300"
              style={{ width: `${customPct}%` }}
              title={`Added Places: ${customTotalHours} hours`}
            >
              Places: {customTotalHours} h
            </div>
          )}

          {/* Morning Peak Extra Segment (Hatched diagonal amber stripes) */}
          <div
            className="text-amber-950 text-[10px] font-extrabold flex items-center justify-center transition-all duration-300"
            style={{
              width: `${peakPct}%`,
              backgroundImage: 'repeating-linear-gradient(45deg, #f59e0b, #f59e0b 8px, #d97706 8px, #d97706 16px)'
            }}
            title={`Morning Peak Extra Delay: ${peakExtraHours} hours`}
          >
            +38 h Peak
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#0f766e]" />
            <span>Office 183 h (22 min × 2 trips × 250 days)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#0284c7]" />
            <span>School 173 h (13 min × 4 trips × 200 days)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-xs"
              style={{ backgroundImage: 'repeating-linear-gradient(45deg, #f59e0b, #f59e0b 4px, #d97706 4px, #d97706 8px)' }}
            />
            <span className="font-semibold text-amber-900">Morning-peak extra 38 h (+9 min delay across 250 mornings)</span>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-3.5 pt-2 border-t border-slate-200/60 text-[11px] text-slate-500">
        Sample traffic and map data, Nov 2026. Trips per day and days per year are assumptions you can edit.
      </div>

      {/* Add Destination Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-sm text-[#0f172a]">Add Commute Destination</h4>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Destination Name</label>
                <input
                  type="text"
                  value={placeName}
                  onChange={e => setPlaceName(e.target.value)}
                  placeholder="e.g. Inorbit Mall, Mindspace, Gym"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Destination Category</label>
                <select
                  value={placeType}
                  onChange={e => setPlaceType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-700"
                >
                  <option value="office">Workplace / Office (250 days)</option>
                  <option value="school">School / Child (200 days)</option>
                  <option value="gym">Fitness / Club (200 days)</option>
                  <option value="family">Family / Frequent Hub</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Distance (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={placeKm}
                    onChange={e => setPlaceKm(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trip Time (mins)</label>
                  <input
                    type="number"
                    value={placeTime}
                    onChange={e => setPlaceTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustomPlace}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-teal-800 text-white hover:bg-teal-900"
              >
                Add Destination
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const SectionAIAnalysisVisual: React.FC<SectionAIAnalysisVisualProps> = ({
  visual,
  onAddMyPlaces
}) => {
  switch (visual.type) {
    // -------------------------------------------------------------------------
    // 1. NEIGHBOURHOOD: Listed vs by Road Comparison
    // -------------------------------------------------------------------------
    case 'listed_vs_road': {
      return <ListedVsRoadVisual visual={visual} />;
    }

    // -------------------------------------------------------------------------
    // 1b. Fallback: Distance Ladder
    // -------------------------------------------------------------------------
    case 'distance_ladder': {
      const items: Array<{ name: string; distance: string; category: string }> =
        visual.items || [];
      return (
        <div className="bg-[#f8fafc] border border-slate-200/80 rounded-xl p-4 my-5">
          <div className="text-xs font-semibold text-slate-700 mb-3">
            Key Daily Distances from Site Gate
          </div>
          <div className="space-y-3">
            {items.map((item, idx) => {
              const kmVal = parseFloat(item.distance);
              const maxKm = 4.0;
              const pct = Math.min(Math.round((kmVal / maxKm) * 100), 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#0f172a]">{item.name}</span>
                    <span className="font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {item.distance}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
                    <div
                      className="bg-[#0f766e] h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-200 flex justify-between">
            <span>0 km (Gate)</span>
            <span>Scale up to 4.0 km</span>
          </div>
        </div>
      );
    }

    // -------------------------------------------------------------------------
    // 2. LIVEABILITY: Rating Bars
    // -------------------------------------------------------------------------
    case 'rating_bars': {
      const items: Array<{ label: string; score: number; ratingsCount: number }> =
        visual.items || [];
      const maxRatings = 140;
      return (
        <div className="bg-[#f8fafc] border border-slate-200/80 rounded-xl p-4 my-5">
          <div className="text-xs font-semibold text-slate-700 mb-3">
            Community Review Sample Sizes &amp; Scores
          </div>
          <div className="space-y-2.5">
            {items.map((item, idx) => {
              const widthPct = Math.min(Math.round((item.ratingsCount / maxRatings) * 100), 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800">{item.label}</span>
                    <span className="font-bold text-[#0f172a]">
                      Score: {item.score.toFixed(1)} <span className="font-normal text-slate-500">({item.ratingsCount} ratings)</span>
                    </span>
                  </div>
                  <div className="h-5 w-full bg-slate-200 rounded-md overflow-hidden flex items-center">
                    <div
                      className="bg-[#15803d] h-full rounded-md flex items-center px-2 text-[10px] font-bold text-white transition-all duration-300"
                      style={{ width: `${widthPct}%` }}
                    >
                      {item.score.toFixed(1)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-200">
            Bar length represents total resident ratings (sample size weight).
          </div>
        </div>
      );
    }

    // -------------------------------------------------------------------------
    // 3. COMMUTE: Route Map + Departure Time Toggle + Transit Bar
    // -------------------------------------------------------------------------
    case 'commute_route_map': {
      return <CommuteRouteMapVisual visual={visual} onAddMyPlaces={onAddMyPlaces} />;
    }

    // -------------------------------------------------------------------------
    // 3b. Legacy Fallback: Work Week Blocks
    // -------------------------------------------------------------------------
    case 'work_week_blocks': {
      return (
        <div className="bg-[#f8fafc] border border-slate-200/80 rounded-xl p-4 my-5">
          <div className="text-xs font-medium text-slate-600 mb-2.5">
            {visual.caption || '183 hours a year (2 trips a day, 250 days: assumed)'}
          </div>
          {/* 5 Blocks of 40-hour work weeks */}
          <div className="flex items-center gap-2 max-w-md">
            <div className="h-8 flex-1 rounded-md bg-[#15803d]" title="Week 1: 40 hours" />
            <div className="h-8 flex-1 rounded-md bg-[#15803d]" title="Week 2: 40 hours" />
            <div className="h-8 flex-1 rounded-md bg-[#15803d]" title="Week 3: 40 hours" />
            <div className="h-8 flex-1 rounded-md bg-[#15803d]" title="Week 4: 40 hours" />
            <div className="h-8 flex-1 rounded-md bg-slate-200 overflow-hidden flex" title="Week 5: 23 hours">
              <div className="h-full bg-[#15803d]" style={{ width: '60%' }} />
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600 mt-2.5">
            <span>4.6 work weeks a year</span>
            {onAddMyPlaces && (
              <button
                type="button"
                onClick={onAddMyPlaces}
                className="py-1 px-3 rounded-lg bg-white hover:bg-slate-50 text-[#0f172a] border border-slate-300 font-semibold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Add my places
              </button>
            )}
          </div>
        </div>
      );
    }

    // -------------------------------------------------------------------------
    // 4. MASTER PLAN: Parking Share Bar
    // -------------------------------------------------------------------------
    case 'parking_share_bar': {
      return (
        <div className="bg-[#f8fafc] border border-slate-200/80 rounded-xl p-4 my-5">
          <div className="text-xs font-medium text-slate-600 mb-2.5">
            {visual.label || '42,180 sq m of parking on a 66,773 sq m site, one level (1 slot per home, 30 sq m per slot: assumed)'}
          </div>
          <div className="h-8 w-full rounded-lg bg-slate-200 overflow-hidden flex items-stretch">
            <div
              className="bg-[#475569] text-white text-xs font-semibold flex items-center px-3"
              style={{ width: `${visual.sharePct || 63}%` }}
            >
              {visual.sharePct || 63}%
            </div>
          </div>
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
      );
    }

    // -------------------------------------------------------------------------
    // 5. TOWERS: Homes Per Floor by Tower
    // -------------------------------------------------------------------------
    case 'homes_per_floor_bars': {
      const towers: Array<{ letter: string; homesPerFloor: number }> =
        visual.towers || [];
      return (
        <div className="bg-[#f8fafc] border border-slate-200/80 rounded-xl p-4 my-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-3">
            <span>Average Homes per Floor by Tower</span>
            <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-mono">
              Target: 10 homes/floor
            </span>
          </div>

          <div className="grid grid-cols-6 gap-2 text-center">
            {towers.map((t) => (
              <div key={t.letter} className="flex flex-col items-center">
                <div className="h-24 w-full bg-slate-100 rounded-md relative flex items-end justify-center p-1 border border-slate-200">
                  {/* Dashed line marking 10 */}
                  <div
                    className="absolute w-full border-b border-dashed border-amber-500 z-10"
                    style={{ bottom: '90%' }}
                    title="Declared: 10 homes/floor"
                  />
                  {/* Actual bar */}
                  <div
                    className="w-full bg-[#0f766e] rounded-xs flex items-center justify-center text-[10px] font-bold text-white transition-all duration-300"
                    style={{ height: `${(t.homesPerFloor / 11) * 100}%` }}
                  >
                    {t.homesPerFloor}
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-800 mt-1.5">Tower {t.letter}</span>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-200">
            Dashed line indicates 10 units/floor declared in listing prospectus. Tower sums average 9.75–9.79.
          </div>
        </div>
      );
    }

    // -------------------------------------------------------------------------
    // 6. UNITS: Stacked Bar (Carpet, Balcony, Shared)
    // -------------------------------------------------------------------------
    case 'unit_stacked_bar': {
      return (
        <div className="bg-[#f8fafc] border border-slate-200/80 rounded-xl p-4 my-5">
          <div className="text-xs font-medium text-slate-600 mb-2.5">
            What the 1,300 sq ft in the ₹1.12 Cr pays for
          </div>
          <div className="h-8 w-full rounded-lg overflow-hidden flex items-stretch text-white text-xs font-semibold">
            <div
              className="bg-[#15803d] flex items-center px-3 truncate"
              style={{ width: `${visual.carpetPct || 69}%` }}
              title="897 sq ft carpet inside the walls (69%)"
            >
              897 inside the walls
            </div>
            <div
              className="bg-[#0f766e] flex items-center justify-center px-1"
              style={{ width: `${visual.balconyPct || 8}%` }}
              title="104 sq ft private balcony (8%)"
            />
            <div
              className="bg-[#475569] flex items-center justify-end px-3 truncate"
              style={{ width: `${visual.sharedPct || 23}%` }}
              title="299 sq ft shared circulation (23%)"
            >
              299 shared
            </div>
          </div>
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
      );
    }

    // -------------------------------------------------------------------------
    // 7. AMENITIES: Split Bar (Indoor vs Outdoor)
    // -------------------------------------------------------------------------
    case 'amenity_split_bar': {
      return (
        <div className="bg-[#f8fafc] border border-slate-200/80 rounded-xl p-4 my-5">
          <div className="text-xs font-semibold text-slate-700 mb-2.5">
            16 Total Amenities Breakdown (7 Indoor · 9 Outdoor)
          </div>
          <div className="h-8 w-full rounded-lg overflow-hidden flex items-stretch text-white text-xs font-semibold">
            <div
              className="bg-[#0f766e] flex items-center px-3"
              style={{ width: '44%' }}
              title="7 indoor amenities (44%)"
            >
              7 Indoor
            </div>
            <div
              className="bg-[#15803d] flex items-center justify-end px-3"
              style={{ width: '56%' }}
              title="9 outdoor amenities (56%)"
            >
              9 Outdoor
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-2.5">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#0f766e]" />
              <span>7 Indoor (40,000 sq ft clubhouse across 3 floors)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#15803d]" />
              <span>9 Outdoor (Podium pool, sports courts &amp; central park)</span>
            </div>
          </div>
        </div>
      );
    }

    // -------------------------------------------------------------------------
    // 8. SUSTAINABILITY: Feature Chips
    // -------------------------------------------------------------------------
    case 'sustainability_chips': {
      const available: string[] = visual.available || [];
      const notAvailable: string[] = visual.notAvailable || [];
      return (
        <div className="bg-[#f8fafc] border border-slate-200/80 rounded-xl p-4 my-5">
          <div className="text-xs font-semibold text-slate-700 mb-2.5">
            Sustainability &amp; Infrastructure Provisions
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block mb-1.5">
                Available Features (6)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {available.map((feat, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 bg-[#e6f4ea] text-[#137333] border border-[#ceead6] text-xs px-2.5 py-1 rounded-full font-medium"
                  >
                    <span>✓</span> {feat}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Not in this project (2)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {notAvailable.map((feat, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 border border-slate-200 text-xs px-2.5 py-1 rounded-full line-through"
                  >
                    <span>−</span> {feat}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-200">
            Note: None of the available provisions cite specific capacity metrics (e.g. kWp solar, KLD STP).
          </div>
        </div>
      );
    }

    // -------------------------------------------------------------------------
    // 9. SAFETY: Timeline
    // -------------------------------------------------------------------------
    case 'safety_timeline': {
      return (
        <div className="bg-[#f8fafc] border border-slate-200/80 rounded-xl p-4 my-5">
          <div className="text-xs font-semibold text-slate-700 mb-3">
            Statutory Fire Compliance &amp; Handover Timeline
          </div>
          <div className="relative pt-2 pb-6">
            {/* Timeline line */}
            <div className="h-2 w-full bg-slate-200 rounded-full" />

            {/* Marker 1: Provisional NOC 2024 */}
            <div className="absolute left-0 top-0 flex flex-col items-start">
              <div className="w-3.5 h-3.5 rounded-full bg-[#0f766e] border-2 border-white shadow-xs" />
              <span className="text-[11px] font-bold text-slate-800 mt-1">2024</span>
              <span className="text-[10px] text-slate-500">Provisional Fire NOC</span>
            </div>

            {/* Marker 2: Today */}
            <div className="absolute left-1/2 top-0 -translate-x-1/2 flex flex-col items-center">
              <div className="w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white shadow-xs" />
              <span className="text-[11px] font-bold text-amber-800 mt-1">Today</span>
              <span className="text-[10px] text-amber-700">~7 mos to possession</span>
            </div>

            {/* Marker 3: Target Jun 2027 */}
            <div className="absolute right-0 top-0 flex flex-col items-end">
              <div className="w-3.5 h-3.5 rounded-full bg-[#15803d] border-2 border-white shadow-xs" />
              <span className="text-[11px] font-bold text-slate-800 mt-1">Jun 2027</span>
              <span className="text-[10px] text-emerald-700 font-semibold text-right">
                final fire NOC due before this
              </span>
            </div>
          </div>
        </div>
      );
    }

    // -------------------------------------------------------------------------
    // 10. AIR QUALITY: 24-Hour Diurnal Strip Chart
    // -------------------------------------------------------------------------
    case 'air_quality_strip': {
      const hourly: number[] = visual.hourly || [
        42, 40, 38, 37, 39, 44, 49, 53, 48, 41, 35, 31, 28, 27, 29, 33, 38, 45, 52, 58, 62, 59, 51, 46
      ];
      const maxVal = Math.max(...hourly, 75);
      const cleanestStr = visual.cleanestWindow || '13:00–16:00 (cleanest: 28 µg/m³)';
      const worstStr = visual.worstWindow || '19:00–22:00 (highest: 59 µg/m³)';
      const medianVal = visual.medianPm25 || 41;
      const station = visual.stationName || visual.monitorInfo || 'Central University TSPCB';
      const dist = visual.distanceKm || 1.8;

      return (
        <div className="bg-[#f8fafc] border border-slate-200/80 rounded-xl p-4 my-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-700 mb-3">
            <span>24-Hour Diurnal PM2.5 Profile (7-Day Average)</span>
            <span className="text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              7-Day Median: {medianVal} µg/m³
            </span>
          </div>

          {/* 24-hour bars */}
          <div className="h-28 w-full bg-slate-50 border border-slate-200/60 rounded-lg p-2.5 flex items-end gap-1">
            {hourly.map((val, h) => {
              const heightPct = Math.max(8, Math.min(100, Math.round((val / maxVal) * 100)));
              const isCleanest = h >= 13 && h <= 15;
              const isWorst = h >= 19 && h <= 21;

              let barBg = 'bg-slate-400 hover:bg-slate-500';
              if (isCleanest) barBg = 'bg-[#15803d] hover:bg-emerald-700';
              else if (isWorst) barBg = 'bg-[#e11d48] hover:bg-rose-700';

              return (
                <div
                  key={h}
                  className="flex-1 flex flex-col items-center h-full justify-end group relative"
                >
                  <div className="absolute -top-7 hidden group-hover:flex bg-slate-800 text-white text-[10px] py-0.5 px-1.5 rounded whitespace-nowrap z-20">
                    {String(h).padStart(2, '0')}:00 · {val} µg/m³
                  </div>
                  <div
                    className={`w-full rounded-xs transition-all duration-300 ${barBg}`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* X-axis hour labels */}
          <div className="flex justify-between text-[10px] text-slate-500 mt-1.5 px-1">
            <span>00:00</span>
            <span>06:00</span>
            <span>12:00</span>
            <span>18:00</span>
            <span>23:00</span>
          </div>

          {/* Legend and Windows */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs mt-3 pt-2.5 border-t border-slate-200">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#15803d]" />
                <span className="text-emerald-800 font-medium">Cleanest: {cleanestStr}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#e11d48]" />
                <span className="text-rose-800 font-medium">Worst: {worstStr}</span>
              </div>
            </div>
            <div className="text-[11px] text-slate-500">
              Nearest station: {station} ({dist} km)
            </div>
          </div>
        </div>
      );
    }

    // -------------------------------------------------------------------------
    // 11. SUNLIGHT: Mini Sun-Path Diagram & Shadow Geometry
    // -------------------------------------------------------------------------
    case 'sun_path_diagram': {
      const decRise = visual.decSunriseAz || 114.6;
      const decSet = visual.decSunsetAz || 245.4;
      const junRise = visual.junSunriseAz || 65.4;
      const junSet = visual.junSunsetAz || 294.6;
      const decShadow = visual.decNoonShadow || 62.3;
      const junShadow = visual.junNoonShadow || 7.6;
      const siteWidth = visual.siteWidth || 258;
      const towerH = visual.towerHeight || 72;

      const azToCoord = (azDeg: number, radius = 70) => {
        const rad = ((azDeg - 90) * Math.PI) / 180;
        return {
          x: 100 + radius * Math.cos(rad),
          y: 100 + radius * Math.sin(rad)
        };
      };

      const decRisePt = azToCoord(decRise);
      const decSetPt = azToCoord(decSet);
      const eqRisePt = azToCoord(90);
      const eqSetPt = azToCoord(270);
      const junRisePt = azToCoord(junRise);
      const junSetPt = azToCoord(junSet);

      return (
        <div className="bg-[#f8fafc] border border-slate-200/80 rounded-xl p-4 my-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-700 mb-3">
            <span>Solar Path &amp; Seasonal Shadow Geometry</span>
            <span className="text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
              Latitude: 17.45° N · Clock: IST
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* SVG Compass Sun-Path Diagram */}
            <div className="flex flex-col items-center justify-center p-2 bg-white rounded-lg border border-slate-200">
              <svg viewBox="0 0 200 200" className="w-44 h-44">
                <circle cx="100" cy="100" r="70" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
                <circle cx="100" cy="100" r="45" fill="none" stroke="#e2e8f0" strokeDasharray="3 3" />
                <circle cx="100" cy="100" r="4" fill="#0f766e" />

                <text x="100" y="20" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0f172a">N</text>
                <text x="185" y="104" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0f172a">E</text>
                <text x="100" y="190" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0f172a">S</text>
                <text x="15" y="104" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0f172a">W</text>

                {/* 21 Jun Solstice Arc (Summer: 65.4° to 294.6°) */}
                <path
                  d={`M ${junRisePt.x} ${junRisePt.y} A 70 70 0 0 0 ${junSetPt.x} ${junSetPt.y}`}
                  fill="none"
                  stroke="#eab308"
                  strokeWidth="2.5"
                />

                {/* Equinox Line (Spring/Autumn: 90° to 270°) */}
                <line
                  x1={eqRisePt.x}
                  y1={eqRisePt.y}
                  x2={eqSetPt.x}
                  y2={eqSetPt.y}
                  stroke="#94a3b8"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />

                {/* 21 Dec Solstice Arc (Winter: 114.6° to 245.4°) */}
                <path
                  d={`M ${decRisePt.x} ${decRisePt.y} A 70 70 0 0 1 ${decSetPt.x} ${decSetPt.y}`}
                  fill="none"
                  stroke="#ea580c"
                  strokeWidth="2.5"
                />
              </svg>
              <div className="flex items-center gap-3 text-[10px] text-slate-600 mt-1">
                <span className="flex items-center gap-1"><span className="w-2.5 h-1 bg-[#ea580c] rounded-xs" /> 21 Dec</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-1 bg-[#94a3b8] rounded-xs" /> Equinox</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-1 bg-[#eab308] rounded-xs" /> 21 Jun</span>
              </div>
            </div>

            {/* Geometry Findings Comparison */}
            <div className="space-y-2.5 text-xs">
              <div className="p-2.5 bg-orange-50/70 border border-orange-200/80 rounded-lg">
                <div className="font-bold text-orange-950 flex items-center justify-between">
                  <span>21 Dec (Winter Solstice)</span>
                  <span className="font-mono text-orange-800">49.1° Noon Alt</span>
                </div>
                <p className="text-orange-900 mt-1 text-[11px] leading-relaxed">
                  Tallest {towerH} m tower casts a <strong>{decShadow} m</strong> noon shadow. Shadow remains within the {siteWidth} m site boundary from 08:32 to 15:28 IST.
                </p>
              </div>

              <div className="p-2.5 bg-yellow-50/70 border border-yellow-200/80 rounded-lg">
                <div className="font-bold text-yellow-950 flex items-center justify-between">
                  <span>21 Jun (Summer Solstice)</span>
                  <span className="font-mono text-yellow-800">84.0° Noon Alt</span>
                </div>
                <p className="text-yellow-900 mt-1 text-[11px] leading-relaxed">
                  Tower noon shadow contracts to <strong>{junShadow} m</strong> (8.2× shorter than winter). High solar elevation reduces cross-building shadows.
                </p>
              </div>

              <div className="text-[11px] text-slate-500 pt-1">
                Sunrise range: 65.4° (summer) to 114.6° (winter). Day length: 11.0 h to 13.2 h.
              </div>
            </div>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
};
