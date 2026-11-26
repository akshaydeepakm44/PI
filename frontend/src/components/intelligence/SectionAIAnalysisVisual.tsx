import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
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
  ChevronRight,
  Layers,
  Globe,
  Search,
  Loader2,
  GitFork
} from 'lucide-react';
import { geocodingApi, routingApi } from '../../services/api';
import { precomputedRoutes, neighbourhoodRoutes } from './precomputedRoutes';

// -----------------------------------------------------------------------------
// Subcomponent: Listed vs By Road Comparison (Neighbourhood)
// -----------------------------------------------------------------------------
interface ListedVsRoadVisualProps {
  visual: DemoVisualData;
}

interface NeighbourhoodPlaceDetail {
  id: string;
  name: string;
  category: string;
  listedKm: number;
  roadKm: number;
  detourFactor: number;
  coord: [number, number];
  walkTime: string;
  walkFootpath: string;
  isochroneStatus: string;
  cycleTime: string;
  cycleSafety: string;
  driveTimeOffPeak: string;
  driveTimePeak: string;
  corridorName: string;
  detourReason: string;
  infrastructure: string;
}

const NEIGHBOURHOOD_PLACES_DATA: NeighbourhoodPlaceDetail[] = [
  {
    id: 'ratnadeep',
    name: 'Ratnadeep Supermarket',
    category: 'Groceries',
    listedKm: 1.2,
    roadKm: 1.5,
    detourFactor: 1.25,
    coord: [17.45207, 78.36155],
    walkTime: '16 mins',
    walkFootpath: '78% continuous paved sidewalk · 1 pedestrian signal at JV Colony',
    isochroneStatus: 'Near 10-min errand core · Walkable daily grocery need',
    cycleTime: '5 mins',
    cycleSafety: 'Low-speed residential service lanes (<25 km/h)',
    driveTimeOffPeak: '4 mins',
    driveTimePeak: '7 mins',
    corridorName: 'JV Colony Main Road → Nallagandla Commercial Crescent',
    detourReason: 'Brochure straight-line cuts through private perimeter boundaries of gated layouts. Actual road navigation rounds the outer commercial crescent.',
    infrastructure: 'Divided 2-lane road · LED streetlights · Zero monsoon waterlogging'
  },
  {
    id: 'metro',
    name: 'Jubilee Hills Checkpost (metro)',
    category: 'Metro',
    listedKm: 3.0,
    roadKm: 4.7,
    detourFactor: 1.57,
    coord: [17.42863, 78.40611],
    walkTime: '58 mins',
    walkFootpath: 'Intermittent footpaths along flyover ramps · Pedestrian crossing difficult',
    isochroneStatus: 'Outside walking isochrone · Feeder auto or shuttle required',
    cycleTime: '22 mins',
    cycleSafety: 'High vehicular speeds on arterial corridor · Not recommended for casual cycling',
    driveTimeOffPeak: '12 mins',
    driveTimePeak: '26 mins',
    corridorName: 'Gachibowli-Miyapur Arterial → Jubilee Hills Road No. 36 Flyover',
    detourReason: 'Brochure straight-line (3.0 km) cuts directly across the Gopi Cheruvu lake basin and the main railway line. Road navigation (4.7 km) must detour south around the lake basin via the arterial flyover, causing an actual 1.57x detour.',
    infrastructure: '6-lane grade-separated arterial · Morning peak bottleneck at Checkpost junction'
  },
  {
    id: 'oakridge',
    name: 'Oakridge International',
    category: 'School',
    listedKm: 3.4,
    roadKm: 4.1,
    detourFactor: 1.21,
    coord: [17.42016, 78.3644],
    walkTime: '44 mins',
    walkFootpath: 'Dedicated pedestrian sidewalk along ISB corridor with zebra crossings',
    isochroneStatus: 'Outside pedestrian isochrone · School bus / car drop-off standard',
    cycleTime: '15 mins',
    cycleSafety: 'Dedicated bicycle shoulder along ISB campus perimeter',
    driveTimeOffPeak: '9 mins',
    driveTimePeak: '16 mins',
    corridorName: 'Old Bombay Highway → ISB Road → Khajaguda School Hub',
    detourReason: 'Brochure chord crosses protected central university woodland reserve. Paved road routing routes along the outer perimeter arterial.',
    infrastructure: '4-lane divided road · School-zone traffic calmers and dedicated bus turnouts'
  },
  {
    id: 'hospital',
    name: 'Citizens Specialty Hospital',
    category: 'Healthcare',
    listedKm: 2.4,
    roadKm: 4.0,
    detourFactor: 1.67,
    coord: [17.45796, 78.34808],
    walkTime: '48 mins',
    walkFootpath: 'Uneven shoulders near railway overbridge · High traffic during rush hour',
    isochroneStatus: 'Outside pedestrian core · 8-minute emergency ambulance transit window',
    cycleTime: '14 mins',
    cycleSafety: 'Flyover incline requires caution with heavy vehicles',
    driveTimeOffPeak: '8 mins',
    driveTimePeak: '15 mins',
    corridorName: 'Tellapur-Nallagandla Road → Nallagandla Flyover',
    detourReason: 'Railway line barrier prevents direct northern crossing. Vehicles must navigate the elevated Nallagandla Flyover, adding a 1.6 km detour.',
    infrastructure: 'Flyover grade-separated · Dedicated emergency lane access'
  },
  {
    id: 'park',
    name: 'Botanical Garden & Eco Trail',
    category: 'Parks',
    listedKm: 1.5,
    roadKm: 2.2,
    detourFactor: 1.47,
    coord: [17.4539, 78.36597],
    walkTime: '26 mins',
    walkFootpath: 'Continuous tree-canopied sidewalk along eco-trail promenade',
    isochroneStatus: 'Within 25-minute leisure walk or quick 7-minute jog',
    cycleTime: '8 mins',
    cycleSafety: 'Direct connection to ORR 23 km covered solar cycle track',
    driveTimeOffPeak: '5 mins',
    driveTimePeak: '10 mins',
    corridorName: 'Kothaguda Reserve Forest Peripheral Avenue',
    detourReason: 'Divided central median without immediate median cut requires a 500m U-turn at Kothaguda signal.',
    infrastructure: 'Scenic tree-lined avenue · Illuminated walking trails · High evening safety'
  }
];

// Interactive Leaflet Map for Neighbourhood Section
interface GeoAINeighbourhoodMapProps {
  activePlace: NeighbourhoodPlaceDetail;
  places: NeighbourhoodPlaceDetail[];
  onSelectPlace: (id: string) => void;
  basemap: 'satellite' | 'street';
}

const GeoAINeighbourhoodLeafletMap: React.FC<GeoAINeighbourhoodMapProps> = ({
  activePlace,
  places,
  onSelectPlace,
  basemap
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    try {
      if (!mapInstanceRef.current) {
        const map = L.map(containerRef.current, {
          center: [17.4474, 78.3582],
          zoom: 13,
          zoomControl: false,
          attributionControl: false
        });

        L.control.zoom({ position: 'bottomright' }).addTo(map);
        mapInstanceRef.current = map;
        layerGroupRef.current = L.layerGroup().addTo(map);
      }

      const map = mapInstanceRef.current;

      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }

      const tileUrl = basemap === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      const tileAttribution = basemap === 'satellite'
        ? 'GeoAI Remote Sensing · High-Res Imagery'
        : '© OpenStreetMap contributors';

      tileLayerRef.current = L.tileLayer(tileUrl, {
        maxZoom: 18,
        attribution: tileAttribution
      }).addTo(map);

      if (layerGroupRef.current) {
        layerGroupRef.current.clearLayers();
      }

      const projectCoord: [number, number] = [17.4474, 78.3582];
      const activeCoord: [number, number] = activePlace.coord;

      // 1. 10-Minute Walk Isochrone (800m)
      L.circle(projectCoord, {
        radius: 800,
        color: '#059669',
        fillColor: '#10b981',
        fillOpacity: 0.12,
        weight: 2,
        dashArray: '5, 5'
      }).addTo(layerGroupRef.current!);

      // 2. Project Gate Marker
      const originIcon = L.divIcon({
        className: 'custom-gate-pin',
        html: `<div style="background-color: #0f766e; color: white; padding: 4px 8px; border-radius: 9999px; font-weight: 700; font-size: 11px; display: flex; align-items: center; gap: 5px; box-shadow: 0 2px 6px rgba(0,0,0,0.35); border: 2px solid white; white-space: nowrap;"><span style="width: 7px; height: 7px; border-radius: 50%; background: #2dd4bf; display: inline-block;"></span>Project Gate 1 (Origin)</div>`,
        iconSize: [160, 26],
        iconAnchor: [80, 13]
      });
      L.marker(projectCoord, { icon: originIcon }).addTo(layerGroupRef.current!);

      // 3. Render other neighbourhood destination pins
      places.forEach(p => {
        if (p.id !== activePlace.id) {
          const pin = L.divIcon({
            className: 'other-dest-pin',
            html: `<div style="background: rgba(15, 23, 42, 0.88); color: #e2e8f0; padding: 2px 7px; border-radius: 6px; font-size: 10px; font-weight: 600; border: 1px solid #475569; white-space: nowrap; cursor: pointer; display: flex; align-items: center; gap: 4px;">
              <span>${p.name.split(' ')[0]}</span> <span style="color: #94a3b8; font-weight: 700;">${p.roadKm}km</span>
            </div>`,
            iconSize: [110, 22],
            iconAnchor: [55, 11]
          });
          const m = L.marker(p.coord, { icon: pin }).addTo(layerGroupRef.current!);
          m.on('click', () => onSelectPlace(p.id));
        }
      });

      // 4. Straight-line brochure chord (dashed slate line)
      L.polyline([projectCoord, activeCoord], {
        color: '#94a3b8',
        weight: 2,
        dashArray: '5, 6',
        opacity: 0.85
      }).addTo(layerGroupRef.current!);

      // 5. Authentic Mapped Road Route from OpenStreetMap (neighbourhoodRoutes)
      let roadCoords = neighbourhoodRoutes[activePlace.id] || [projectCoord, activeCoord];
      if (roadCoords.length > 0) {
        roadCoords = [projectCoord, ...roadCoords.slice(1, -1), activeCoord];
      }

      // White casing line
      L.polyline(roadCoords, {
        color: '#ffffff',
        weight: 7,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(layerGroupRef.current!);

      // Vibrant Teal road line
      L.polyline(roadCoords, {
        color: '#0f766e',
        weight: 4.5,
        opacity: 1,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(layerGroupRef.current!);

      // 6. Active Destination Marker
      const activeIcon = L.divIcon({
        className: 'active-dest-pin',
        html: `<div style="background-color: #0f172a; color: white; padding: 4px 10px; border-radius: 8px; font-weight: 700; font-size: 11px; display: flex; align-items: center; gap: 5px; box-shadow: 0 4px 12px rgba(0,0,0,0.4); border: 2px solid #2dd4bf; white-space: nowrap;">
          <span style="width: 8px; height: 8px; border-radius: 50%; background: #2dd4bf; display: inline-block;"></span>
          <span>${activePlace.name}</span>
          <span style="background: #0f766e; padding: 1px 6px; border-radius: 4px; font-size: 10px; font-weight: 800;">${activePlace.roadKm} km</span>
        </div>`,
        iconSize: [210, 28],
        iconAnchor: [105, 14]
      });
      L.marker(activeCoord, { icon: activeIcon }).addTo(layerGroupRef.current!);

      // 7. Midpoint Route Pill
      if (roadCoords.length > 2) {
        const midIdx = Math.floor(roadCoords.length / 2);
        const midPoint = roadCoords[midIdx];
        const pillIcon = L.divIcon({
          className: 'mid-route-pill',
          html: `<div style="background-color: #0f766e; color: #ffffff; padding: 3px 8px; border-radius: 9999px; font-weight: 700; font-size: 10px; box-shadow: 0 2px 6px rgba(0,0,0,0.3); border: 1.5px solid #ffffff; white-space: nowrap; display: flex; align-items: center; gap: 4px;">
            <span>🚗 ${activePlace.driveTimeOffPeak} · x${activePlace.detourFactor} detour</span>
          </div>`,
          iconSize: [160, 22],
          iconAnchor: [80, 11]
        });
        L.marker(midPoint, { icon: pillIcon }).addTo(layerGroupRef.current!);
      }

      // 8. Fit Bounds with padding
      const bounds = L.latLngBounds([projectCoord, activeCoord, ...roadCoords]);
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 15 });

    } catch (err) {
      console.error('Error rendering GeoAINeighbourhoodLeafletMap:', err);
    }
  }, [activePlace, places, basemap, onSelectPlace]);

  return (
    <div className="relative w-full h-72 sm:h-80 rounded-xl overflow-hidden border border-slate-700/80 shadow-inner">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

const ListedVsRoadVisual: React.FC<ListedVsRoadVisualProps> = ({ visual }) => {
  const [activeView, setActiveView] = useState<'bars' | 'map'>('bars');
  const [selectedPlaceId, setSelectedPlaceId] = useState<string>('ratnadeep');
  const [basemap, setBasemap] = useState<'satellite' | 'street'>('street');

  const places = NEIGHBOURHOOD_PLACES_DATA;
  const activePlace = places.find(p => p.id === selectedPlaceId) || places[0];
  const maxScaleKm = 5.0;

  return (
    <div className="bg-[#f8fafc] border border-slate-200/90 rounded-2xl p-4 sm:p-5 my-5">
      {/* Real-time Location Intelligence Banner */}
      <div className="flex items-center gap-2 p-2.5 mb-4 bg-emerald-50/90 border border-emerald-200/90 rounded-xl text-xs font-medium text-emerald-950">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
        <span>Real-time location intelligence · Grounded in OpenStreetMap road network &amp; live routing.</span>
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
            <span>GeoAI Road Map</span>
          </button>
        </div>
      </div>

      {/* Interactive Destination Chips Selector */}
      <div className="pt-3 pb-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-semibold text-slate-500 shrink-0">Select Place:</span>
        {places.map((place) => {
          const isSelected = place.id === activePlace.id;
          return (
            <button
              key={place.id}
              type="button"
              onClick={() => setSelectedPlaceId(place.id)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-teal-400' : 'bg-slate-400'}`} />
              <span>{place.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${isSelected ? 'bg-slate-800 text-teal-300' : 'bg-slate-100 text-slate-500'}`}>
                {place.roadKm} km
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Content: Bars View */}
      {activeView === 'bars' && (
        <div className="space-y-3 pt-3">
          {places.map((place: any, idx: number) => {
            const isSelected = place.id === activePlace.id;
            const listedPct = Math.min((place.listedKm / maxScaleKm) * 100, 100);
            const roadPct = Math.min((place.roadKm / maxScaleKm) * 100, 100);
            return (
              <div
                key={idx}
                onClick={() => setSelectedPlaceId(place.id)}
                className={`p-3 bg-white rounded-xl border transition-all cursor-pointer space-y-2 ${
                  isSelected
                    ? 'border-teal-600 ring-2 ring-teal-500/20 shadow-xs bg-teal-50/10'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs flex-wrap gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900">{place.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">({place.category})</span>
                    {isSelected && (
                      <span className="px-1.5 py-0.2 text-[9px] font-bold bg-teal-100 text-teal-800 rounded">
                        SELECTED FOR SUMMARY
                      </span>
                    )}
                  </div>
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
            <span>Click any destination to inspect Road Analysis Summary below</span>
            <span>Scale to 5.0 km</span>
          </div>
        </div>
      )}

      {/* Main Content: Map View */}
      {activeView === 'map' && (
        <div className="pt-3">
          <div className="bg-slate-900 rounded-xl p-3.5 text-white relative overflow-hidden space-y-3">
            <div className="flex items-center justify-between text-xs pb-2.5 border-b border-slate-800 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-teal-400" />
                  <span>GeoAI Road Network Map</span>
                </span>
                <span className="text-[11px] text-slate-400 hidden sm:inline">OpenStreetMap physical road geometry</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => setBasemap('satellite')}
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
                    basemap === 'satellite'
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Satellite
                </button>
                <button
                  type="button"
                  onClick={() => setBasemap('street')}
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded ${
                    basemap === 'street'
                      ? 'bg-slate-700 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Streets
                </button>
              </div>
            </div>

            {/* Interactive Leaflet Map Component */}
            <GeoAINeighbourhoodLeafletMap
              activePlace={activePlace}
              places={places}
              onSelectPlace={(id) => setSelectedPlaceId(id)}
              basemap={basemap}
            />

            {/* Map Legend */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800 gap-2">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-500" /> Project Gate 1 (Origin)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-[#0f766e] rounded-xs" /> Mapped Road Route</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-slate-400 border-dashed" /> Straight Line</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500/40 border border-emerald-400" /> 10-min Walk Isochrone (800m)</span>
            </div>
          </div>
        </div>
      )}

      {/* Special Road Analysis Summary Card for Active Destination */}
      <div className="mt-4 p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <span>Road Analysis Summary: {activePlace.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                  Grounded in Street Topology
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Multimodal accessibility &amp; physical detour root-cause analysis
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
              x{activePlace.detourFactor} detour ({activePlace.listedKm} km listed vs {activePlace.roadKm} km road)
            </span>
          </div>
        </div>

        {/* Multimodal Accessibility Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* 1. Walk */}
          <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-200/70 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <span className="text-sm">🚶</span> Walk
              </span>
              <span className="font-semibold text-slate-900">{activePlace.walkTime}</span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium">{activePlace.isochroneStatus}</p>
            <p className="text-[10px] text-slate-500 leading-tight">{activePlace.walkFootpath}</p>
          </div>

          {/* 2. Cycle */}
          <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-200/70 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Bike className="w-3.5 h-3.5 text-blue-600" /> Cycle
              </span>
              <span className="font-semibold text-slate-900">{activePlace.cycleTime}</span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium">Micromobility / Bike</p>
            <p className="text-[10px] text-slate-500 leading-tight">{activePlace.cycleSafety}</p>
          </div>

          {/* 3. Drive */}
          <div className="p-2.5 bg-slate-50/80 rounded-lg border border-slate-200/70 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-emerald-600" /> Drive
              </span>
              <span className="font-semibold text-slate-900">{activePlace.driveTimeOffPeak} <span className="text-[10px] text-slate-500 font-normal">({activePlace.driveTimePeak} peak)</span></span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium">Vehicular Corridor</p>
            <p className="text-[10px] text-slate-500 leading-tight">{activePlace.corridorName}</p>
          </div>
        </div>

        {/* Detour Root Cause & Physical Road Geometry */}
        <div className="p-2.5 bg-amber-50/50 rounded-lg border border-amber-200/70 space-y-1 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-amber-950">
            <GitFork className="w-3.5 h-3.5 text-amber-700" />
            <span>Physical Detour Root Cause (Brochure Straight-line vs Actual Road)</span>
          </div>
          <p className="text-[11px] text-amber-900/90 leading-relaxed">
            {activePlace.detourReason}
          </p>
        </div>

        {/* Street Infrastructure Rating */}
        <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">Street Infrastructure:</span>
            <span>{activePlace.infrastructure}</span>
          </div>
          <span className="text-teal-700 font-medium flex items-center gap-1">
            <Check className="w-3 h-3 text-teal-600" /> Snapped to OSM street topology
          </span>
        </div>
      </div>

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
// GeoAI Satellite & Interactive Commute Map (Leaflet) with Road Network Geometry
// -----------------------------------------------------------------------------
function normalizeCoordinates(coords?: any[]): [number, number][] {
  if (!coords || !Array.isArray(coords) || coords.length === 0) return [];
  return coords.map((pt: any) => {
    if (Array.isArray(pt) && pt.length >= 2) {
      if (pt[0] > 50 && pt[1] < 45) {
        return [Number(pt[1]), Number(pt[0])];
      }
      return [Number(pt[0]), Number(pt[1])];
    }
    return pt;
  });
}

interface GeoAICommuteMapProps {
  selectedTime: '08:30' | '11:00' | '18:30';
  destinations: any[];
  basemap: 'satellite' | 'street';
  selectedDestId?: string;
  onSelectDest?: (id: string) => void;
  showBfsShortest?: boolean;
  activeRouteChoice?: 'primary' | 'alternate';
  onSelectRouteChoice?: (choice: 'primary' | 'alternate') => void;
}

const GeoAICommuteLeafletMap: React.FC<GeoAICommuteMapProps> = ({
  selectedTime,
  destinations,
  basemap,
  selectedDestId,
  onSelectDest,
  showBfsShortest = true,
  activeRouteChoice = 'primary',
  onSelectRouteChoice
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    if (!containerRef.current || typeof window === 'undefined') return;

    try {
      if (!mapInstanceRef.current) {
        const map = L.map(containerRef.current, {
          center: [17.4410, 78.3650],
          zoom: 12,
          zoomControl: false,
          attributionControl: false
        });

        L.control.zoom({ position: 'bottomright' }).addTo(map);
        mapInstanceRef.current = map;
        layerGroupRef.current = L.layerGroup().addTo(map);
      }

      const map = mapInstanceRef.current;

      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
      }

      const tileUrl = basemap === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

      const tileAttribution = basemap === 'satellite'
        ? 'GeoAI Remote Sensing · High-Res Imagery'
        : '© OpenStreetMap contributors';

      tileLayerRef.current = L.tileLayer(tileUrl, {
        maxZoom: 18,
        attribution: tileAttribution
      }).addTo(map);

      if (layerGroupRef.current) {
        layerGroupRef.current.clearLayers();
      }

      const projectCoord: [number, number] = [17.4474, 78.3582];

      const destCoords: Record<string, [number, number]> = {
        dlf_cyber_city: [17.4580, 78.3780],
        oakridge_school: [17.42016, 78.3644],
        gachibowli_stadium: [17.44029, 78.34865],
        isb_hyderabad: [17.42594, 78.35818],
        rgia_airport: [17.24077, 78.42939]
      };

      // 1. Identify active selected destination
      const activeDest = destinations.find(d => d.id === selectedDestId) || destinations[0];
      const activeCoord: [number, number] = activeDest.coord
        ? [Number(activeDest.coord[0]), Number(activeDest.coord[1])]
        : (destCoords[activeDest.id] || [17.4580, 78.3780]);

      // 2. Compute Primary and Alternate road geometries (Snapped 100% to OpenStreetMap roads)
      let primaryPoints: [number, number][] = normalizeCoordinates(activeDest.routeGeometry);
      if (primaryPoints.length === 0) {
        if (activeDest.id === 'dlf_cyber_city') primaryPoints = normalizeCoordinates(precomputedRoutes.dlf_primary);
        else if (activeDest.id === 'oakridge_school') primaryPoints = normalizeCoordinates(precomputedRoutes.oak_primary);
        else if (activeDest.id === 'gachibowli_stadium') primaryPoints = normalizeCoordinates(precomputedRoutes.stadium_primary);
        else if (activeDest.id === 'isb_hyderabad') primaryPoints = normalizeCoordinates(precomputedRoutes.isb_primary);
        else if (activeDest.id === 'rgia_airport') primaryPoints = normalizeCoordinates(precomputedRoutes.rgia_primary);
        else primaryPoints = [projectCoord, activeCoord];
      }

      let altPoints: [number, number][] = normalizeCoordinates(activeDest.nearestRouteGeometry);
      if (altPoints.length === 0) {
        if (activeDest.id === 'dlf_cyber_city') altPoints = normalizeCoordinates(precomputedRoutes.dlf_nearest);
        else if (activeDest.id === 'oakridge_school') altPoints = normalizeCoordinates(precomputedRoutes.oak_nearest);
        else if (activeDest.id === 'gachibowli_stadium') altPoints = normalizeCoordinates(precomputedRoutes.stadium_nearest);
        else if (activeDest.id === 'isb_hyderabad') altPoints = normalizeCoordinates(precomputedRoutes.isb_nearest);
        else if (activeDest.id === 'rgia_airport') altPoints = normalizeCoordinates(precomputedRoutes.rgia_nearest);
        else altPoints = primaryPoints;
      }

      // Guarantee continuous origin-to-destination connection
      if (primaryPoints.length > 0) {
        primaryPoints[0] = projectCoord;
        primaryPoints[primaryPoints.length - 1] = activeCoord;
      }
      if (altPoints.length > 0) {
        altPoints[0] = projectCoord;
        altPoints[altPoints.length - 1] = activeCoord;
      }

      // 3. Google Maps Dual-Route Styling
      const isAltActive = activeRouteChoice === 'alternate';

      const primaryColor = isAltActive ? '#80868b' : '#1a73e8';
      const altColor = isAltActive ? '#1a73e8' : '#80868b';

      const primaryWeight = isAltActive ? 4.5 : 5.5;
      const altWeight = isAltActive ? 5.5 : 4.5;

      const pKm = activeDest.roadDistanceKm || 5.1;
      const pMins = activeDest.times?.[selectedTime] || activeDest.times?.['11:00'] || 20;
      const aKm = activeDest.nearestRoadDistanceKm || Math.round(pKm * 0.92 * 10) / 10;
      const aMins = activeDest.nearestDurationMins || Math.round(pMins * 1.08);

      // Render Alternate Route Polyline with white casing
      let altPolyline: L.Polyline | null = null;
      if (showBfsShortest) {
        const altCasing = L.polyline(altPoints, {
          color: '#ffffff',
          weight: altWeight + 2.5,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round'
        });
        layerGroupRef.current?.addLayer(altCasing);

        altPolyline = L.polyline(altPoints, {
          color: altColor,
          weight: altWeight,
          opacity: isAltActive ? 1.0 : 0.85,
          lineCap: 'round',
          lineJoin: 'round'
        });
        altPolyline.on('click', () => {
          if (onSelectRouteChoice) onSelectRouteChoice('alternate');
        });
        layerGroupRef.current?.addLayer(altPolyline);

        // Alternate Route Floating Pill (Google Maps Style)
        const aMidIdx = Math.floor(altPoints.length * 0.58);
        const altMidpoint = altPoints[aMidIdx] || activeCoord;
        const altPillIcon = L.divIcon({
          className: 'google-route-pill',
          html: `
            <div style="background:#ffffff;border:${isAltActive ? '2px solid #1a73e8' : '1.5px solid #cbd5e1'};border-radius:20px;padding:3.5px 10px;box-shadow:0 3px 12px rgba(0,0,0,0.35);display:flex;align-items:center;gap:5px;cursor:pointer;white-space:nowrap;transform:translate(-50%,-50%);font-family:system-ui,-apple-system,sans-serif;">
              <span style="font-size:11px;">🚗</span>
              <span style="font-weight:${isAltActive ? '800' : '700'};font-size:11px;color:${isAltActive ? '#0f172a' : '#475569'};">${aMins} min</span>
              <span style="font-size:10px;color:#94a3b8;font-weight:600;">${aKm} km</span>
            </div>
          `,
          iconSize: [0, 0]
        });
        const aPillMarker = L.marker(altMidpoint, { icon: altPillIcon, zIndexOffset: isAltActive ? 250 : 80 });
        aPillMarker.on('click', () => {
          if (onSelectRouteChoice) onSelectRouteChoice('alternate');
        });
        layerGroupRef.current?.addLayer(aPillMarker);
      }

      // Render Primary Route Polyline with white casing
      const primaryCasing = L.polyline(primaryPoints, {
        color: '#ffffff',
        weight: primaryWeight + 2.5,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round'
      });
      layerGroupRef.current?.addLayer(primaryCasing);

      const primaryPolyline = L.polyline(primaryPoints, {
        color: primaryColor,
        weight: primaryWeight,
        opacity: !isAltActive ? 1.0 : 0.85,
        lineCap: 'round',
        lineJoin: 'round'
      });
      primaryPolyline.on('click', () => {
        if (onSelectRouteChoice) onSelectRouteChoice('primary');
      });
      layerGroupRef.current?.addLayer(primaryPolyline);

      // Primary Route Floating Pill (Google Maps Style)
      const pMidIdx = Math.floor(primaryPoints.length * 0.38);
      const primaryMidpoint = primaryPoints[pMidIdx] || projectCoord;
      const primaryPillIcon = L.divIcon({
        className: 'google-route-pill',
        html: `
          <div style="background:#ffffff;border:${!isAltActive ? '2px solid #1a73e8' : '1.5px solid #cbd5e1'};border-radius:20px;padding:3.5px 10px;box-shadow:0 3px 12px rgba(0,0,0,0.35);display:flex;align-items:center;gap:5px;cursor:pointer;white-space:nowrap;transform:translate(-50%,-50%);font-family:system-ui,-apple-system,sans-serif;">
            <span style="font-size:11px;">🚗</span>
            <span style="font-weight:${!isAltActive ? '800' : '700'};font-size:11px;color:${!isAltActive ? '#0f172a' : '#475569'};">${pMins} min</span>
            <span style="font-size:10px;color:#94a3b8;font-weight:600;">${pKm} km</span>
          </div>
        `,
        iconSize: [0, 0]
      });
      const pPillMarker = L.marker(primaryMidpoint, { icon: primaryPillIcon, zIndexOffset: !isAltActive ? 250 : 80 });
      pPillMarker.on('click', () => {
        if (onSelectRouteChoice) onSelectRouteChoice('primary');
      });
      layerGroupRef.current?.addLayer(pPillMarker);

      // Bring active layer to front
      if (isAltActive) {
        altPolyline?.bringToFront();
      } else {
        primaryPolyline.bringToFront();
      }

      // 4. Origin Marker (Google Maps Style Green Dot with label)
      const originIcon = L.divIcon({
        className: 'google-origin-pin',
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);">
            <div style="background:#15803d;color:#ffffff;font-size:9px;font-weight:800;padding:2px 7px;border-radius:6px;box-shadow:0 2px 6px rgba(0,0,0,0.4);white-space:nowrap;border:1px solid #4ade80;">
              Project Gate (Origin)
            </div>
            <div style="width:14px;height:14px;background:#16a34a;border:2.5px solid #ffffff;border-radius:50%;margin-top:2px;box-shadow:0 0 8px rgba(22,163,74,0.6);"></div>
          </div>
        `,
        iconSize: [0, 0]
      });
      const originMarker = L.marker(projectCoord, { icon: originIcon, zIndexOffset: 200 });
      layerGroupRef.current?.addLayer(originMarker);

      // 5. Destination Marker (Google Maps Style Classic Red Pin with label)
      const destIcon = L.divIcon({
        className: 'google-dest-pin',
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);cursor:pointer;">
            <div style="background:#ea4335;width:22px;height:22px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #ffffff;box-shadow:0 2px 6px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;">
              <div style="width:7px;height:7px;background:#ffffff;border-radius:50%;transform:rotate(45deg);"></div>
            </div>
            <div style="background:#0f172a;color:#ffffff;font-weight:700;font-size:10px;padding:2px 7px;border-radius:6px;box-shadow:0 2px 6px rgba(0,0,0,0.5);white-space:nowrap;margin-top:2px;border:1px solid #475569;">
              ${activeDest.name}
            </div>
          </div>
        `,
        iconSize: [0, 0]
      });
      const destMarker = L.marker(activeCoord, { icon: destIcon, zIndexOffset: 200 });
      layerGroupRef.current?.addLayer(destMarker);

      // Other non-active destination pins (subtle, clickable)
      destinations.forEach(dest => {
        if (dest.id === activeDest.id) return;
        const otherCoord: [number, number] = dest.coord
          ? [Number(dest.coord[0]), Number(dest.coord[1])]
          : (destCoords[dest.id] || [17.4340, 78.3880]);

        const otherIcon = L.divIcon({
          className: 'other-dest-pin',
          html: `
            <div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);cursor:pointer;opacity:0.85;">
              <div style="background:#475569;color:#ffffff;font-weight:600;font-size:9px;padding:2px 5px;border-radius:5px;box-shadow:0 1px 4px rgba(0,0,0,0.4);white-space:nowrap;">
                ${dest.name}
              </div>
              <div style="width:10px;height:10px;background:#64748b;border:1.5px solid #ffffff;border-radius:50%;margin-top:1px;"></div>
            </div>
          `,
          iconSize: [0, 0]
        });
        const otherMarker = L.marker(otherCoord, { icon: otherIcon, zIndexOffset: 50 });
        otherMarker.on('click', () => {
          if (onSelectDest) onSelectDest(dest.id);
        });
        layerGroupRef.current?.addLayer(otherMarker);
      });

      // 6. Camera Frame: Comfortably fit both complete routes from origin to destination
      const sampledPrimary = primaryPoints.filter((_, i) => i % 4 === 0);
      const sampledAlt = altPoints.filter((_, i) => i % 4 === 0);
      const allBoundsPoints: [number, number][] = [
        projectCoord,
        activeCoord,
        ...sampledPrimary,
        ...sampledAlt
      ];
      map.fitBounds(allBoundsPoints, { padding: [40, 40], maxZoom: 14 });
    } catch {
      // Graceful fallback in non-browser/test environments
    }
  }, [selectedTime, destinations, basemap, selectedDestId, showBfsShortest, activeRouteChoice]);

  return (
    <div className="relative w-full h-72 sm:h-80 rounded-xl overflow-hidden border border-slate-700 shadow-inner">
      <div ref={containerRef} className="w-full h-full z-0" />
      <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-black/80 backdrop-blur-xs rounded-lg text-[10px] font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-md">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>GeoAI Navigation · Live Road Network</span>
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
  const [basemap, setBasemap] = useState<'satellite' | 'street'>('street');
  const [showBfsPath, setShowBfsPath] = useState(true);
  const [activeRouteChoice, setActiveRouteChoice] = useState<'primary' | 'alternate'>('primary');
  const [selectedDestId, setSelectedDestId] = useState<string>('dlf_cyber_city');
  const [customPlaces, setCustomPlaces] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [placeName, setPlaceName] = useState('');
  const [placeType, setPlaceType] = useState('office');
  const [placeKm, setPlaceKm] = useState('6.5');
  const [placeTime, setPlaceTime] = useState('18');

  // Real-time Autocomplete & Live Routing States
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<{
    name: string;
    displayName: string;
    lat: number;
    lon: number;
    type?: string;
  } | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [calculatedRoute, setCalculatedRoute] = useState<{
    roadDistanceKm: number;
    durationMins: number;
    geometry?: [number, number][];
    nearestGeometry?: [number, number][];
    nearestRoadDistanceKm?: number;
    nearestDurationMins?: number;
    roadNodesCount?: number;
    nearestNodesCount?: number;
    provider?: string;
  } | null>(null);

  // Debounced real-time geocoding query
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    if (selectedPlace && selectedPlace.name.toLowerCase() === trimmed.toLowerCase()) {
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        let results: any[] = [];
        try {
          const res = await geocodingApi.searchAddress(trimmed, 5);
          if (Array.isArray(res) && res.length > 0) {
            results = res.map(item => ({
              id: item.place_id || `${item.latitude}_${item.longitude}`,
              name: (item.display_name.split(',')[0] || trimmed).trim(),
              displayName: item.display_name,
              lat: parseFloat(item.latitude),
              lon: parseFloat(item.longitude),
              type: item.type || item.category || 'place'
            }));
          }
        } catch {
          // fallback to public OSM Nominatim
        }

        if (results.length === 0) {
          const osmRes = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&countrycodes=in&format=json&addressdetails=1&limit=5`,
            { headers: { Accept: 'application/json' } }
          );
          if (osmRes.ok) {
            const data = await osmRes.json();
            results = data.map((item: any) => ({
              id: item.place_id,
              name: (item.display_name.split(',')[0] || trimmed).trim(),
              displayName: item.display_name,
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
              type: item.type || item.category || 'place'
            }));
          }
        }

        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedPlace]);

  // Compute live OSRM road route from Project Gate (Origin: 17.4474, 78.3582)
  const handleSelectSuggestion = async (place: any) => {
    setSelectedPlace(place);
    setPlaceName(place.name);
    setSearchQuery(place.name);
    setSuggestions([]);
    setIsRouting(true);

    const originLat = 17.4474;
    const originLon = 78.3582;

    try {
      let routeData: any = null;
      try {
        routeData = await routingApi.computeRoute({
          origin_lat: originLat,
          origin_lon: originLon,
          dest_lat: place.lat,
          dest_lon: place.lon,
          destination_name: place.name
        });
      } catch {
        // Direct OSRM fallback
      }

      if (!routeData || !routeData.road_distance_km) {
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${originLon},${originLat};${place.lon},${place.lat}?overview=full&geometries=geojson`;
        const osrmRes = await fetch(osrmUrl);
        if (osrmRes.ok) {
          const data = await osrmRes.json();
          if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            routeData = {
              road_distance_km: Math.round((route.distance / 1000) * 10) / 10,
              estimated_duration_mins: Math.max(1, Math.round(route.duration / 60)),
              route_geometry: route.geometry?.coordinates || [],
              provider: 'OSRM Highway Engine'
            };
          }
        }
      }

      if (routeData && routeData.road_distance_km) {
        const distKm = routeData.road_distance_km;
        const mins = routeData.estimated_duration_mins || Math.round((distKm / 45) * 60);
        setPlaceKm(distKm.toString());
        setPlaceTime(mins.toString());
        setCalculatedRoute({
          roadDistanceKm: distKm,
          durationMins: mins,
          geometry: routeData.route_geometry,
          nearestGeometry: routeData.nearest_route_geometry,
          nearestRoadDistanceKm: routeData.nearest_road_distance_km,
          nearestDurationMins: routeData.nearest_duration_mins,
          roadNodesCount: routeData.road_nodes_count,
          nearestNodesCount: routeData.nearest_nodes_count,
          provider: routeData.provider || 'OSRM Live Road Network'
        });
      } else {
        // Haversine fallback with realistic road tortuosity factor
        const R = 6371;
        const dLat = ((place.lat - originLat) * Math.PI) / 180;
        const dLon = ((place.lon - originLon) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((originLat * Math.PI) / 180) *
            Math.cos((place.lat * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const straightKm = R * c;
        const roadKm = Math.round(straightKm * 1.35 * 10) / 10;
        const speed = roadKm > 50 ? 65 : 30; // highway vs city
        const mins = Math.max(5, Math.round((roadKm / speed) * 60));

        setPlaceKm(roadKm.toString());
        setPlaceTime(mins.toString());
        setCalculatedRoute({
          roadDistanceKm: roadKm,
          durationMins: mins,
          nearestRoadDistanceKm: Math.round(roadKm * 0.92 * 10) / 10,
          nearestDurationMins: Math.round(mins * 1.1),
          provider: 'Topological Highway Matrix'
        });
      }
    } catch {
      setPlaceKm('12.5');
      setPlaceTime('25');
    } finally {
      setIsRouting(false);
    }
  };

  const handleAddCustomPlace = async () => {
    const nameToUse = (placeName || searchQuery).trim();
    if (!nameToUse) return;

    let finalPlace = selectedPlace;
    let finalKm = parseFloat(placeKm) || 5.0;
    let finalMins = parseInt(placeTime, 10) || 15;
    let finalRouteGeometry = calculatedRoute?.geometry;
    let finalNearestRouteGeometry = calculatedRoute?.nearestGeometry;
    let finalNearestKm = calculatedRoute?.nearestRoadDistanceKm || Math.round(finalKm * 0.92 * 10) / 10;
    let finalNearestMins = calculatedRoute?.nearestDurationMins || Math.round(finalMins * 1.08);

    // If submitted without clicking suggestion, attempt instant geocode & route lookup
    if (!finalPlace && nameToUse.length >= 2) {
      try {
        const res = await geocodingApi.searchAddress(nameToUse, 1);
        if (Array.isArray(res) && res.length > 0) {
          const top = res[0];
          finalPlace = {
            name: (top.display_name.split(',')[0] || nameToUse).trim(),
            displayName: top.display_name,
            lat: parseFloat(top.latitude),
            lon: parseFloat(top.longitude)
          };
          try {
            const rData = await routingApi.computeRoute({
              origin_lat: 17.4474,
              origin_lon: 78.3582,
              dest_lat: finalPlace.lat,
              dest_lon: finalPlace.lon,
              destination_name: finalPlace.name
            });
            if (rData?.road_distance_km) {
              finalKm = rData.road_distance_km;
              finalMins = rData.estimated_duration_mins || Math.round((finalKm / 45) * 60);
              finalRouteGeometry = rData.route_geometry;
              finalNearestRouteGeometry = rData.nearest_route_geometry;
              finalNearestKm = rData.nearest_road_distance_km || Math.round(finalKm * 0.92 * 10) / 10;
              finalNearestMins = rData.nearest_duration_mins || Math.round(finalMins * 1.08);
            }
          } catch {}
        }
      } catch {}
    }

    const morningMultiplier = finalKm > 50 ? 1.05 : 1.25;
    const eveningMultiplier = finalKm > 50 ? 1.08 : 1.35;

    const tripFrequency =
      placeType === 'school'
        ? 200
        : placeType === 'gym'
        ? 150
        : finalKm > 100
        ? 24 // occasional/inter-city travel
        : 250;

    const newDest = {
      id: `custom_${Date.now()}`,
      name: nameToUse,
      type: placeType,
      roadDistanceKm: finalKm,
      nearestRoadDistanceKm: finalNearestKm,
      nearestDurationMins: finalNearestMins,
      times: {
        '08:30': Math.round(finalMins * morningMultiplier),
        '11:00': finalMins,
        '18:30': Math.round(finalMins * eveningMultiplier)
      },
      annualHours: Math.round((finalMins * 2 * tripFrequency) / 60),
      coord: finalPlace ? [finalPlace.lat, finalPlace.lon] : undefined,
      routeGeometry: finalRouteGeometry,
      nearestRouteGeometry: finalNearestRouteGeometry,
      roadNodesCount: calculatedRoute?.roadNodesCount,
      nearestNodesCount: calculatedRoute?.nearestNodesCount,
      displayName: finalPlace?.displayName
    };

    setCustomPlaces(prev => [...prev, newDest]);
    setSelectedDestId(newDest.id);
    setPlaceName('');
    setSearchQuery('');
    setSuggestions([]);
    setSelectedPlace(null);
    setCalculatedRoute(null);
    setShowAddModal(false);
  };

  const baseDestinations = [
    {
      id: 'dlf_cyber_city',
      name: 'DLF Cyber City',
      type: 'office',
      roadDistanceKm: 5.7,
      nearestRoadDistanceKm: 10.0,
      nearestDurationMins: 26,
      times: {
        '08:30': 31,
        '11:00': 22,
        '18:30': 34
      },
      annualHours: 183,
      coord: [17.4580, 78.3780],
      routeGeometry: precomputedRoutes.dlf_primary,
      nearestRouteGeometry: precomputedRoutes.dlf_nearest,
      roadNodesCount: 209,
      nearestNodesCount: 353
    },
    {
      id: 'oakridge_school',
      name: 'Oakridge International',
      type: 'school',
      roadDistanceKm: 4.9,
      nearestRoadDistanceKm: 7.8,
      nearestDurationMins: 19,
      times: {
        '08:30': 16,
        '11:00': 13,
        '18:30': 15
      },
      annualHours: 173,
      coord: [17.42016, 78.3644],
      routeGeometry: precomputedRoutes.oak_primary,
      nearestRouteGeometry: precomputedRoutes.oak_nearest,
      roadNodesCount: 135,
      nearestNodesCount: 215
    },
    {
      id: 'gachibowli_stadium',
      name: 'Gachibowli Stadium',
      type: 'sports',
      roadDistanceKm: 2.1,
      nearestRoadDistanceKm: 4.0,
      nearestDurationMins: 14,
      times: {
        '08:30': 14,
        '11:00': 8,
        '18:30': 12
      },
      annualHours: 88,
      coord: [17.44029, 78.34865],
      routeGeometry: precomputedRoutes.stadium_primary,
      nearestRouteGeometry: precomputedRoutes.stadium_nearest,
      roadNodesCount: 69,
      nearestNodesCount: 149
    },
    {
      id: 'isb_hyderabad',
      name: 'Indian School of Business',
      type: 'education',
      roadDistanceKm: 3.1,
      nearestRoadDistanceKm: 6.1,
      nearestDurationMins: 20,
      times: {
        '08:30': 18,
        '11:00': 12,
        '18:30': 16
      },
      annualHours: 94,
      coord: [17.42594, 78.35818],
      routeGeometry: precomputedRoutes.isb_primary,
      nearestRouteGeometry: precomputedRoutes.isb_nearest,
      roadNodesCount: 85,
      nearestNodesCount: 170
    },
    {
      id: 'rgia_airport',
      name: 'Rajiv Gandhi Intl Airport',
      type: 'transit',
      roadDistanceKm: 31.7,
      nearestRoadDistanceKm: 39.9,
      nearestDurationMins: 48,
      times: {
        '08:30': 42,
        '11:00': 32,
        '18:30': 38
      },
      annualHours: 76,
      coord: [17.24077, 78.42939],
      routeGeometry: precomputedRoutes.rgia_primary,
      nearestRouteGeometry: precomputedRoutes.rgia_nearest,
      roadNodesCount: 575,
      nearestNodesCount: 929
    }
  ];

  const allDestinations = [...baseDestinations, ...customPlaces];
  const activeDest = allDestinations.find(d => d.id === selectedDestId) || allDestinations[0] || baseDestinations[0];
  const activeRoadKm = activeDest?.roadDistanceKm || 8.5;
  const activeCurrentTime = activeDest?.times?.[selectedTime] || activeDest?.times?.['11:00'] || 22;
  const bfsKm = activeDest?.nearestRoadDistanceKm || Math.round(activeRoadKm * 0.88 * 10) / 10;
  const bfsNodes = activeDest?.nearestNodesCount || (activeDest?.nearestRouteGeometry ? activeDest.nearestRouteGeometry.length : Math.max(12, Math.round(activeRoadKm * 3.2)));
  const bfsDuration = activeDest?.nearestDurationMins || Math.round(activeCurrentTime * 1.12);
  const detourFactor = Math.max(1.15, Math.round((activeRoadKm / (bfsKm * 0.95)) * 100) / 100);

  let primaryCorridorName = 'Outer Ring Road (ORR) Expressway → Gachibowli Arterial Corridor';
  let bfsCorridorName = 'Telecom Nagar Grid Street Corridor (OSRM Secondary Road Graph)';
  let signalHotspot = 'Gachibowli Flyover Junction (+9m peak delay at 08:30)';

  if (activeDest?.id === 'dlf_cyber_city') {
    primaryCorridorName = 'Botanical Garden Arterial Corridor (Direct North Link)';
    bfsCorridorName = 'Telecom Nagar Grid & Gachibowli Junction Link (South Corridor)';
    signalHotspot = 'Kothaguda Junction (+9m delay)';
  } else if (activeDest?.id === 'oakridge_school') {
    primaryCorridorName = 'ORR Expressway Service Road (Direct West Link)';
    bfsCorridorName = 'Telecom Nagar & Khajaguda Road (East Alternate Corridor)';
    signalHotspot = 'Khajaguda Rotary Junction (+3m delay)';
  } else if (activeDest?.id === 'gachibowli_stadium') {
    primaryCorridorName = 'Old Bombay Road Direct West Arterial';
    bfsCorridorName = 'Research Street & HCU Perimeter Grid Link';
    signalHotspot = 'Gachibowli Stadium Crossing (+4m delay)';
  } else if (activeDest?.id === 'isb_hyderabad') {
    primaryCorridorName = 'ISB Road Direct Arterial Corridor (West Campus Gate)';
    bfsCorridorName = 'Telecom Nagar Grid Link → Road No. 12 & Nanakramguda (East Corridor)';
    signalHotspot = 'Wipro Circle / ISB Junction (+6m delay)';
  } else if (activeDest?.id === 'rgia_airport') {
    primaryCorridorName = 'Nehru Outer Ring Road (ORR) Expressway South Corridor (Toll Free Flow)';
    bfsCorridorName = 'Mehdipatnam & PVNR Elevated Expressway / NH44 Shamshabad';
    signalHotspot = 'Shamshabad Airport Interchange (+10m peak delay)';
  } else if (activeRoadKm > 100) {
    primaryCorridorName = 'NH65 Hyderabad-Suryapet Corridor → NH16 Coastal Highway';
    bfsCorridorName = 'Inland State Highway corridor via Khammam/Rajahmundry';
    signalHotspot = 'Suryapet Bypass Toll Plaza (+12m delay)';
  } else if (activeDest?.name?.toLowerCase().includes('hitec')) {
    primaryCorridorName = 'Financial District Road 2 → Cyber Towers Madhapur Arterial';
    bfsCorridorName = 'Hitec City Railway Station Grid Link';
    signalHotspot = 'Mindspace Rotary Junction (+5m delay)';
  } else if (activeDest?.id?.startsWith('custom')) {
    primaryCorridorName = `Primary Highway Arterial to ${activeDest.name}`;
    bfsCorridorName = `Nearest Street Grid Network to ${activeDest.name} (BFS Shortest Graph)`;
    signalHotspot = 'Arterial Junction Chokepoint (+5m peak delay)';
  }

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
      {/* Real-time Location Intelligence Banner */}
      <div className="flex items-center gap-2 p-2.5 mb-4 bg-emerald-50/90 border border-emerald-200/90 rounded-xl text-xs font-medium text-emerald-950">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
        <span>Real-time location intelligence · Grounded in OpenStreetMap road network &amp; live routing.</span>
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
            const isSelected = dest.id === (activeDest?.id);
            return (
              <div
                key={dest.id}
                onClick={() => setSelectedDestId(dest.id)}
                className={`p-3 bg-white rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'ring-2 ring-teal-600 border-teal-500 bg-teal-50/40 shadow-xs'
                    : 'border-slate-200 hover:border-teal-300 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    {dest.type === 'school' || dest.type === 'education' ? (
                      <GraduationCap className="w-4 h-4 text-sky-700" />
                    ) : dest.type === 'office' ? (
                      <Building2 className="w-4 h-4 text-emerald-700" />
                    ) : dest.type === 'sports' ? (
                      <Bike className="w-4 h-4 text-amber-700" />
                    ) : dest.type === 'transit' ? (
                      <Car className="w-4 h-4 text-indigo-700" />
                    ) : (
                      <MapPin className="w-4 h-4 text-purple-700" />
                    )}
                    <span className="font-bold text-xs text-[#0f172a]">{dest.name}</span>
                    {isSelected && (
                      <span className="text-[9px] font-bold text-teal-800 bg-teal-100 px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 ml-5.5">{dest.roadDistanceKm} km by road</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-[#0f2744] flex items-center justify-end gap-1">
                    <span>{currentTime >= 60 ? `${Math.floor(currentTime / 60)}h ${currentTime % 60}m` : `${currentTime} mins`}</span>
                    {isPeak && dest.times && dest.times['11:00'] && currentTime > dest.times['11:00'] && (
                      <span className="text-[10px] text-amber-700 font-semibold">(+{currentTime - dest.times['11:00']}m)</span>
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

        {/* Route Map Canvas & GeoAI Leaflet Integration with BFS Shortest Layer */}
        <div className="lg:col-span-7 bg-slate-900 rounded-xl p-3 text-white relative shadow-sm">
          {/* Map Header with Real-Time Road Controls */}
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800 gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-bold shadow-xs">
                <Globe className="w-3.5 h-3.5" />
                <span>GeoAI Road Network Map</span>
              </div>
              <button
                type="button"
                onClick={() => setShowBfsPath(!showBfsPath)}
                className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center gap-1.5 border cursor-pointer ${
                  showBfsPath
                    ? 'bg-amber-950/80 border-amber-500/60 text-amber-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
                title="Toggle BFS Nearest Road Graph Corridor"
              >
                <GitFork className="w-3 h-3 text-amber-400" />
                <span>BFS Nearest Path: {showBfsPath ? 'ON' : 'OFF'}</span>
              </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg text-[10px]">
              <button
                type="button"
                onClick={() => setBasemap('satellite')}
                className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer ${
                  basemap === 'satellite' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Satellite
              </button>
              <button
                type="button"
                onClick={() => setBasemap('street')}
                className={`px-2 py-0.5 rounded-md font-semibold cursor-pointer ${
                  basemap === 'street' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Streets
              </button>
            </div>
          </div>

          {/* Interactive GeoAI Leaflet Map */}
          <div className="mt-2.5 space-y-2">
            <GeoAICommuteLeafletMap
              selectedTime={selectedTime}
              destinations={allDestinations}
              basemap={basemap}
              selectedDestId={activeDest?.id}
              onSelectDest={id => {
                setSelectedDestId(id);
                setActiveRouteChoice('primary');
              }}
              showBfsShortest={showBfsPath}
              activeRouteChoice={activeRouteChoice}
              onSelectRouteChoice={choice => setActiveRouteChoice(choice)}
            />
            <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800 gap-2">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Origin (Project Gate)
                </span>
                <button
                  type="button"
                  onClick={() => setActiveRouteChoice('primary')}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    activeRouteChoice === 'primary' ? 'bg-blue-900/60 text-blue-300 font-bold border border-blue-500/50' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className={`w-3.5 h-1.5 rounded-full ${activeRouteChoice === 'primary' ? 'bg-[#1a73e8]' : 'bg-[#94a3b8]'}`}></span>
                  <span>Primary Route</span>
                </button>
                {showBfsPath && (
                  <button
                    type="button"
                    onClick={() => setActiveRouteChoice('alternate')}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      activeRouteChoice === 'alternate' ? 'bg-blue-900/60 text-blue-300 font-bold border border-blue-500/50' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className={`w-3.5 h-1.5 rounded-full ${activeRouteChoice === 'alternate' ? 'bg-[#1a73e8]' : 'bg-[#94a3b8]'}`}></span>
                    <span>Alternate Route</span>
                  </button>
                )}
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Destination Pin
                </span>
              </div>
              <span className="text-slate-500">Click route pills or lines on map to toggle</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Road Analysis Summary & BFS Nearest Route Intelligence */}
      {activeDest && (
        <div className="mt-4 p-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-100 text-teal-800">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <h5 className="font-bold text-xs sm:text-sm text-[#0f172a] flex items-center gap-2">
                  <span>Road Analysis Summary: {activeDest.name}</span>
                  <span className="text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200/60 px-2 py-0.5 rounded-full">
                    {activeRouteChoice === 'primary' ? 'Primary Route Selected' : 'Alternate Route Selected'}
                  </span>
                </h5>
                <p className="text-[11px] text-slate-500">
                  Continuous dual-route navigation · Grounded in OpenStreetMap physical street topology
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Google Maps Mode: Active</span>
            </div>
          </div>

          {/* Dual Route Comparison Cards (Clickable) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Primary Fastest Route Card */}
            <div
              onClick={() => setActiveRouteChoice('primary')}
              className={`p-3 rounded-xl space-y-1.5 cursor-pointer transition-all ${
                activeRouteChoice === 'primary'
                  ? 'bg-blue-50/80 border-2 border-blue-500 shadow-xs ring-1 ring-blue-500/20'
                  : 'bg-slate-50/60 border border-slate-200 hover:border-slate-300 opacity-80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1a73e8]"></span>
                  Primary Route (Fastest Arterial)
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeRouteChoice === 'primary' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {activeRouteChoice === 'primary' ? 'Selected' : 'Fastest'}
                </span>
              </div>
              <div className="flex items-baseline gap-2 pt-0.5">
                <span className="text-lg font-black text-slate-900">{activeRoadKm} km</span>
                <span className="text-slate-500 font-medium">· {activeCurrentTime >= 60 ? `${Math.floor(activeCurrentTime / 60)}h ${activeCurrentTime % 60}m` : `${activeCurrentTime} mins`} ({selectedTime} IST)</span>
              </div>
              <p className="text-[11px] text-slate-600 line-clamp-1">
                <b>Corridor:</b> {primaryCorridorName}
              </p>
              <div className="text-[10px] text-blue-900 bg-blue-100/60 p-1.5 rounded-lg">
                Multi-lane divided arterial with grade-separated flyovers; provides highest average driving speed.
              </div>
            </div>

            {/* Nearest Alternate Route Card */}
            <div
              onClick={() => setActiveRouteChoice('alternate')}
              className={`p-3 rounded-xl space-y-1.5 cursor-pointer transition-all ${
                activeRouteChoice === 'alternate'
                  ? 'bg-blue-50/80 border-2 border-blue-500 shadow-xs ring-1 ring-blue-500/20'
                  : 'bg-slate-50/60 border border-slate-200 hover:border-slate-300 opacity-80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#64748b]"></span>
                  Alternate Route (Street Network)
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeRouteChoice === 'alternate' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {activeRouteChoice === 'alternate' ? 'Selected' : 'Alternate'}
                </span>
              </div>
              <div className="flex items-baseline gap-2 pt-0.5">
                <span className="text-lg font-black text-slate-900">{bfsKm} km</span>
                <span className="text-emerald-700 font-bold text-[11px]">
                  ({bfsKm < activeRoadKm ? `${Math.round(((activeRoadKm - bfsKm) / activeRoadKm) * 100)}% shorter distance` : `${Math.round(((bfsKm - activeRoadKm) / activeRoadKm) * 100)}% alternate path`})
                </span>
                <span className="text-slate-500 font-medium">· ~{bfsDuration >= 60 ? `${Math.floor(bfsDuration / 60)}h ${bfsDuration % 60}m` : `${bfsDuration} mins`}</span>
              </div>
              <p className="text-[11px] text-slate-600 line-clamp-1">
                <b>Corridor:</b> {bfsCorridorName}
              </p>
              <div className="text-[10px] text-slate-800 bg-slate-100 p-1.5 rounded-lg">
                Authentic OpenStreetMap street network traversing <b>{bfsNodes} road intersections</b>. Snapped 100% to physical roadways.
              </div>
            </div>
          </div>

          {/* Infrastructure Diagnostics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-[11px]">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-[10px] text-slate-400 block font-medium">Road Hierarchy</span>
              <span className="font-bold text-slate-800 mt-0.5 block">4-Lane Carriageway</span>
              <span className="text-[10px] text-slate-500">Divided physical median</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-[10px] text-slate-400 block font-medium">Surface & Quality</span>
              <span className="font-bold text-slate-800 mt-0.5 block">Grade-A Bituminous</span>
              <span className="text-[10px] text-slate-500">OSRM highway: primary</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-[10px] text-slate-400 block font-medium">Peak Chokepoint</span>
              <span className="font-bold text-amber-800 mt-0.5 block truncate" title={signalHotspot}>{signalHotspot}</span>
              <span className="text-[10px] text-amber-700">Expect peak congestion</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/60">
              <span className="text-[10px] text-slate-400 block font-medium">Detour Ratio</span>
              <span className="font-bold text-slate-800 mt-0.5 block">{detourFactor}x vs straight-line</span>
              <span className="text-[10px] text-slate-500">Graph efficiency rating</span>
            </div>
          </div>

          {/* Commute Intelligence Recommendation */}
          <div className="p-2.5 bg-sky-50/70 border border-sky-200/70 rounded-xl flex items-start gap-2 text-[11px] text-sky-950">
            <AlertCircle className="w-3.5 h-3.5 text-sky-700 shrink-0 mt-0.5" />
            <span>
              <b>Commute Intelligence Tip:</b> Take the <b>Primary Arterial route</b> during the {selectedTime} departure to bypass internal intersection signal cycles. For off-peak trips, the <b>Nearest Route ({bfsKm} km)</b> reduces travel distance by {Math.round(((activeRoadKm - bfsKm) / activeRoadKm) * 100)}% via authentic street grid connectivity.
            </span>
          </div>
        </div>
      )}

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

      {/* Add Destination Modal with Real-Time Autocomplete & OSRM Routing */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-sm text-[#0f172a] flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-teal-700" />
                  Add Commute Destination
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Real-time location search &amp; OpenStreetMap highway routing
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setSuggestions([]);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              {/* Real-time Location Search with Live Autocomplete */}
              <div className="relative">
                <label className="block font-semibold text-slate-700 mb-1">
                  Search Location / Landmark / City
                </label>
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value);
                      setPlaceName(e.target.value);
                    }}
                    placeholder="Type city, hub or landmark (e.g. Visakhapatnam, HITEC City)..."
                    className="w-full pl-9 pr-9 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-700 bg-white"
                    autoFocus
                  />
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 text-teal-600 animate-spin absolute right-3 pointer-events-none" />
                  ) : searchQuery ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setPlaceName('');
                        setSuggestions([]);
                        setSelectedPlace(null);
                        setCalculatedRoute(null);
                      }}
                      className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </div>

                {/* Suggestions Dropdown */}
                {suggestions.length > 0 && (
                  <div className="absolute z-60 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto">
                    <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                      <span>Matching Locations</span>
                      <span>OSM Nominatim</span>
                    </div>
                    {suggestions.map((item, idx) => (
                      <button
                        key={item.id || idx}
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        className="w-full text-left px-3 py-2.5 hover:bg-teal-50 border-b border-slate-100 last:border-b-0 flex items-start gap-2.5 transition-colors cursor-pointer group"
                      >
                        <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs text-slate-900 truncate group-hover:text-teal-900">
                              {item.name}
                            </span>
                            <span className="text-[9px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded capitalize shrink-0">
                              {item.type || 'place'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            {item.displayName}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Destination Category */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Destination Category</label>
                <select
                  value={placeType}
                  onChange={e => setPlaceType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-700 bg-white"
                >
                  <option value="office">Workplace / Office (250 days)</option>
                  <option value="school">School / Child (200 days)</option>
                  <option value="gym">Fitness / Club (150 days)</option>
                  <option value="family">Family / Hub (Occasional)</option>
                </select>
              </div>

              {/* Live Route Calculation Status / Summary Preview */}
              {isRouting ? (
                <div className="p-3 bg-teal-50/80 border border-teal-200 rounded-xl flex items-center gap-2.5 text-xs text-teal-900">
                  <Loader2 className="w-4 h-4 text-teal-600 animate-spin shrink-0" />
                  <span>Calculating real road distance and driving times via OSRM...</span>
                </div>
              ) : selectedPlace || calculatedRoute ? (
                <div className="p-3 bg-emerald-50/90 border border-emerald-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
                      <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                      Real Road Route Grounded
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-semibold">
                      OSRM Live Network
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-emerald-200/60">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Distance by Road</span>
                      <span className="font-extrabold text-sm text-slate-900">{placeKm} km</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Estimated Drive Time</span>
                      <span className="font-extrabold text-sm text-slate-900">
                        {parseInt(placeTime, 10) >= 60
                          ? `${Math.floor(parseInt(placeTime, 10) / 60)}h ${parseInt(placeTime, 10) % 60}m`
                          : `${placeTime} mins`}
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-600 line-clamp-1 pt-0.5">
                    <b>Origin:</b> Financial District, Hyd → <b>Destination:</b> {selectedPlace?.displayName || placeName}
                  </div>
                </div>
              ) : null}

              {/* Editable Distance & Duration Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Distance (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={placeKm}
                    onChange={e => setPlaceKm(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-700 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trip Time (mins)</label>
                  <input
                    type="number"
                    value={placeTime}
                    onChange={e => setPlaceTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-teal-700 bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setSuggestions([]);
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustomPlace}
                disabled={isRouting}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-teal-800 text-white hover:bg-teal-900 disabled:opacity-50 cursor-pointer"
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
