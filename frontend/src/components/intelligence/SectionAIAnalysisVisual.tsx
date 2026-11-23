import React from 'react';
import { DemoVisualData } from '../../demo/sampleAnalyses';

interface SectionAIAnalysisVisualProps {
  visual: DemoVisualData;
  onAddMyPlaces?: () => void;
}

export const SectionAIAnalysisVisual: React.FC<SectionAIAnalysisVisualProps> = ({
  visual,
  onAddMyPlaces
}) => {
  switch (visual.type) {
    // -------------------------------------------------------------------------
    // 1. NEIGHBOURHOOD: Distance Ladder
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
    // 3. COMMUTE: Work Week Blocks
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

    default:
      return null;
  }
};
