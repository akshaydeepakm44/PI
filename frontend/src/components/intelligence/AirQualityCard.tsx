import React from 'react';
import { Wind, AlertTriangle, ShieldCheck, Info, Clock, MapPin } from 'lucide-react';
import { AirQualityData } from '../../types';

interface AirQualityCardProps {
  data?: AirQualityData | null;
}

export const AirQualityCard: React.FC<AirQualityCardProps> = ({ data }) => {
  if (!data || data.status === 'unavailable') {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center text-xs">
        <Wind size={28} className="mx-auto text-slate-400 mb-2" />
        <h3 className="font-bold text-slate-800">Air-quality data unavailable for this location</h3>
        <p className="text-slate-500 mt-1 max-w-md mx-auto">
          {data?.reason || 'Atmospheric sensors and Copernicus CAMS model readings could not be retrieved for these coordinates.'}
        </p>
      </div>
    );
  }

  const aqi = data.us_aqi ?? 0;
  
  // Color configuration
  const colorMap: Record<string, { bg: string; text: string; border: string; bar: string }> = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200', bar: 'bg-emerald-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', bar: 'bg-amber-500' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200', bar: 'bg-orange-500' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200', bar: 'bg-rose-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200', bar: 'bg-purple-500' },
    red: { bg: 'bg-red-50', text: 'text-red-900', border: 'border-red-300', bar: 'bg-red-600' },
    slate: { bg: 'bg-slate-50', text: 'text-slate-800', border: 'border-slate-200', bar: 'bg-slate-500' }
  };

  const theme = colorMap[data.color_theme] || colorMap.amber;

  return (
    <div className="bg-white rounded-lg border border-brand-border p-5 space-y-6">
      {/* Header with US EPA AQI Visual Meter */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-lg border bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-center gap-4">
          {/* Circular Graphic Gauge */}
          <div className={`w-20 h-20 rounded-full flex flex-col items-center justify-center font-bold border-4 ${theme.bg} ${theme.border} ${theme.text} shadow-sm shrink-0`}>
            <span className="text-2xl leading-none font-mono">{aqi}</span>
            <span className="text-[10px] font-mono tracking-wider uppercase mt-0.5">US AQI</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${theme.bg} ${theme.text} border ${theme.border}`}>
                {data.category}
              </span>
              {data.european_aqi && (
                <span className="text-[11px] text-slate-500 font-mono">
                  European AQI: {data.european_aqi}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-700 mt-1.5 font-medium max-w-lg">
              {data.health_advice}
            </p>
          </div>
        </div>

        {/* Provenance Badge */}
        <div className="text-right text-[11px] text-slate-500 space-y-0.5 shrink-0 font-mono">
          <div className="flex items-center md:justify-end gap-1">
            <Clock size={12} className="text-slate-400" />
            <span>Observed: {data.observation_time?.replace('T', ' ') || 'Live'}</span>
          </div>
          <div className="flex items-center md:justify-end gap-1">
            <MapPin size={12} className="text-slate-400" />
            <span>Grid: {data.location?.latitude?.toFixed(2)}°N, {data.location?.longitude?.toFixed(2)}°E</span>
          </div>
        </div>
      </div>

      {/* Graphical Breakdown of Key Pollutants */}
      <div>
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Wind size={13} className="text-brand-primary" />
          <span>Individual Pollutant Measurements vs WHO Guidelines</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.pollutants.map((p) => {
            const pTheme = colorMap[p.color] || colorMap.slate;

            return (
              <div key={p.code} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">{p.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${pTheme.bg} ${pTheme.text}`}>
                    {p.status}
                  </span>
                </div>

                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-lg font-bold text-slate-900">{p.value ?? '--'}</span>
                  <span className="text-[11px] text-slate-500">{p.unit}</span>
                </div>

                {/* Progress bar relative to guideline */}
                <div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full ${pTheme.bar}`}
                      style={{ width: `${Math.min(100, Math.max(5, p.percentage_of_limit))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                    <span>0</span>
                    <span>WHO Guideline: {p.who_guideline}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 24-Hour Historical Hourly Trend Visual Chart */}
      {data.hourly_trend && data.hourly_trend.length > 0 && (
        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              24-Hour Diurnal AQI Trend
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">Hourly US AQI variation</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg overflow-x-auto">
            <div className="flex items-end gap-1.5 h-20 min-w-[500px] pt-4">
              {data.hourly_trend.slice(0, 24).map((h, i) => {
                const heightPercent = Math.min(100, Math.max(10, (h.aqi / 200) * 100));
                const barColor = h.aqi <= 50 ? 'bg-emerald-400' : (h.aqi <= 100 ? 'bg-amber-400' : (h.aqi <= 150 ? 'bg-orange-400' : 'bg-rose-500'));

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="w-full flex items-end justify-center h-12">
                      <div
                        className={`w-full rounded-t transition-all ${barColor}`}
                        style={{ height: `${heightPercent}%` }}
                        title={`${h.hour}: AQI ${h.aqi}`}
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">{h.hour}</span>

                    {/* Tooltip */}
                    <div className="absolute -top-7 bg-slate-900 text-white text-[9px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 font-mono">
                      {h.aqi} AQI
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Scientific Methodology & Limitations Disclaimer */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600 space-y-1">
        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
          <Info size={12} className="text-slate-500" />
          <span>Measurement Provenance & Environmental Limitations</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          {data.methodology_disclaimer}
        </p>
        <p className="text-[10px] text-slate-400 font-mono">
          Data source: {data.provider} • Attribution: {data.licensing}
        </p>
      </div>
    </div>
  );
};
