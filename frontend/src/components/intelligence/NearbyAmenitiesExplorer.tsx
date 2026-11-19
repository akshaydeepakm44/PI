import React, { useState } from 'react';
import {
  Compass,
  Bus,
  GraduationCap,
  HeartPulse,
  ShoppingBag,
  Coffee,
  Landmark,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { NearbyPOI } from '../../types';

interface NearbyAmenitiesExplorerProps {
  categories?: Record<string, NearbyPOI[]> | null;
  poiSummary?: Record<string, { total: number; closest_meters: number | null; closest_name: string | null }> | null;
  propertyLat: number;
  propertyLon: number;
}

export const NearbyAmenitiesExplorer: React.FC<NearbyAmenitiesExplorerProps> = ({
  categories,
  poiSummary
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [radiusFilter, setRadiusFilter] = useState<string>('all');

  const categoryIcons: Record<string, any> = {
    'Public Transport': Bus,
    'Education': GraduationCap,
    'Healthcare': HeartPulse,
    'Daily Needs': ShoppingBag,
    'Lifestyle & Recreation': Coffee,
    'Public Services': Landmark
  };

  const allCategories = categories ? Object.keys(categories) : [];
  
  // Aggregate POIs based on selection
  let displayedPois: NearbyPOI[] = [];
  if (categories) {
    if (selectedCategory === 'All') {
      displayedPois = Object.values(categories).flat();
    } else if (categories[selectedCategory]) {
      displayedPois = categories[selectedCategory];
    }
  }

  // Filter by radius tier
  if (radiusFilter !== 'all') {
    displayedPois = displayedPois.filter((p) => p.distance_tier === radiusFilter);
  }

  // Sort by closest distance
  displayedPois.sort((a, b) => a.distance_meters - b.distance_meters);

  const totalDiscovered = categories ? Object.values(categories).flat().length : 0;

  return (
    <div className="bg-white rounded-lg border border-brand-border p-5 space-y-5">
      {/* Header and Summary stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Compass size={15} className="text-brand-primary" />
            <span>Nearby Places & Neighbourhood Infrastructure</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Discovered community facilities and services within a 5 km residential radius.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-slate-100 rounded-md text-xs font-mono font-bold text-slate-800">
            {totalDiscovered} Places Mapped
          </span>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          type="button"
          onClick={() => setSelectedCategory('All')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            selectedCategory === 'All'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          All Categories ({totalDiscovered})
        </button>

        {allCategories.map((cat) => {
          const count = categories?.[cat]?.length || 0;
          const Icon = categoryIcons[cat] || MapPin;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Icon size={12} />
              <span>{cat}</span>
              <span className="text-[10px] opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Radius Filter Pills */}
      <div className="flex items-center gap-2 text-xs pt-1 border-t border-slate-100">
        <span className="text-[11px] text-slate-400 font-mono">Distance Filter:</span>
        {[
          { id: 'all', label: 'All Radii (< 5km)' },
          { id: 'under_1km', label: 'Within 1 km (Walking)' },
          { id: '1_to_3km', label: '1 - 3 km' },
          { id: '3_to_5km', label: '3 - 5 km' }
        ].map((tier) => (
          <button
            key={tier.id}
            type="button"
            onClick={() => setRadiusFilter(tier.id)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors cursor-pointer ${
              radiusFilter === tier.id
                ? 'border-brand-primary bg-sky-50 text-brand-primary'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tier.label}
          </button>
        ))}
      </div>

      {/* POI List Cards */}
      {displayedPois.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-lg text-xs text-slate-500">
          <MapPin size={24} className="mx-auto text-slate-400 mb-1" />
          <p className="font-semibold text-slate-700">No places mapped in this category or radius</p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
            Community facilities coverage reflects surveyed open data.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
          {displayedPois.map((poi) => {
            const Icon = categoryIcons[poi.category] || MapPin;

            return (
              <div
                key={poi.id}
                className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors flex items-start justify-between gap-2"
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-2 bg-white border border-slate-200 rounded-md text-slate-700 shrink-0">
                    <Icon size={14} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 leading-tight">
                      {poi.name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                      <span className="capitalize">{poi.type.replace('_', ' ')}</span>
                      <span>•</span>
                      <span className="text-slate-400 text-[10px]">{poi.category}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono font-bold text-xs text-slate-900 block">
                    {poi.distance_meters < 1000 ? `${poi.distance_meters} m` : `${poi.distance_km} km`}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium bg-emerald-50 px-1.5 py-0.5 rounded mt-1 border border-emerald-200">
                    <CheckCircle2 size={10} />
                    <span>Verified</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Coverage Notice */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-500 flex items-start gap-2">
        <span className="font-semibold text-slate-700 shrink-0 font-mono">Neighborhood Data Notice:</span>
        <span>
          Nearby community infrastructure and facilities reflect surveyed geographic nodes. Peak accessibility may vary with localized traffic and schedule conditions.
        </span>
      </div>
    </div>
  );
};
