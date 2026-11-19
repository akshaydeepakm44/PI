import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  MapPinOff,
  Navigation,
  Layers,
  GraduationCap,
  Bus,
  HeartPulse,
  ShoppingCart,
  Trees,
  Building2,
  Car,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export interface MapPoiItem {
  id: string | number;
  name: string;
  category: string;
  type?: string;
  latitude: number;
  longitude: number;
  distance_meters?: number;
  distance_km?: number;
}

export interface MapRouteItem {
  name: string;
  type?: string;
  road_distance_km?: number;
  straight_line_distance_km?: number;
  estimated_duration_mins?: number;
  tortuosity_ratio?: number;
  route_geometry?: [number, number][]; // [lon, lat] pairs
}

export interface PropertyMapProps {
  latitude: number;
  longitude: number;
  propertyName: string;
  address?: string;
  zoom?: number;
  height?: string;
  className?: string;
  pois?: MapPoiItem[];
  routes?: MapRouteItem[];
  routeGeometry?: [number, number][];
  destinationName?: string;
  showControls?: boolean;
  aiActivated?: boolean;
  onActivateAi?: () => void;
  onSelectRoute?: (geometry: [number, number][], destName: string) => void;
  onComputeAmenityRoute?: (lat: number, lon: number, name: string) => void;
}

const isValidCoordinate = (lat: number, lng: number): boolean => {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
};

const CATEGORY_STYLES: Record<string, { bg: string; border: string; svg: string; label: string }> = {
  'Public Transport': {
    bg: '#2563eb',
    border: '#1d4ed8',
    label: 'Transit',
    svg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="15" rx="2"></rect><path d="M4 11h16"></path><path d="M8 15h.01"></path><path d="M16 15h.01"></path><path d="M6 18v2"></path><path d="M18 18v2"></path></svg>`
  },
  'Education': {
    bg: '#d97706',
    border: '#b45309',
    label: 'Education',
    svg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path></svg>`
  },
  'Healthcare': {
    bg: '#e11d48',
    border: '#be123c',
    label: 'Healthcare',
    svg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20"></path></svg>`
  },
  'Daily Needs': {
    bg: '#059669',
    border: '#047857',
    label: 'Daily Needs',
    svg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>`
  },
  'Lifestyle & Recreation': {
    bg: '#7c3aed',
    border: '#6d28d9',
    label: 'Recreation',
    svg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L4 12h5v8h6v-8h5z"></path></svg>`
  },
  'Public Services': {
    bg: '#475569',
    border: '#334155',
    label: 'Services',
    svg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="18" rx="2"></rect><line x1="2" y1="9" x2="22" y2="9"></line><line x1="6" y1="21" x2="6" y2="9"></line><line x1="10" y1="21" x2="10" y2="9"></line><line x1="14" y1="21" x2="14" y2="9"></line><line x1="18" y1="21" x2="18" y2="9"></line></svg>`
  }
};

const DEFAULT_STYLE = {
  bg: '#64748b',
  border: '#475569',
  label: 'Point of Interest',
  svg: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>`
};

export const PropertyMap: React.FC<PropertyMapProps> = ({
  latitude,
  longitude,
  propertyName,
  address,
  zoom = 14,
  height = '380px',
  className = '',
  pois = [],
  routes = [],
  routeGeometry,
  destinationName,
  showControls = true,
  aiActivated = true,
  onActivateAi,
  onSelectRoute,
  onComputeAmenityRoute
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);

  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedRouteIdx, setSelectedRouteIdx] = useState<number | null>(null);

  const valid = isValidCoordinate(latitude, longitude);

  // Robust document-delegated click listener for amenity popup "Calculate Driving Route"
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest('.btn-calc-amenity-commute') as HTMLButtonElement | null;
      if (!btn) return;

      e.preventDefault();
      e.stopPropagation();

      const lat = parseFloat(btn.getAttribute('data-lat') || '0');
      const lon = parseFloat(btn.getAttribute('data-lon') || '0');
      const name = btn.getAttribute('data-name') || 'Amenity Destination';

      btn.disabled = true;
      btn.innerHTML = '⏳ Computing Route...';
      btn.style.background = '#d97706';

      if (onComputeAmenityRoute) {
        Promise.resolve(onComputeAmenityRoute(lat, lon, name))
          .then((res: any) => {
            const distText = res?.road_distance_km ? ` (${res.road_distance_km} km • ~${res.estimated_duration_mins}m)` : '';
            btn.innerHTML = `✓ Route Plotted${distText}`;
            btn.style.background = '#059669';

            if (res?.route_geometry && mapInstanceRef.current && routeLayerRef.current) {
              const layer = routeLayerRef.current;
              layer.clearLayers();
              const latLngs: L.LatLngExpression[] = res.route_geometry.map((c: number[]) => [c[1], c[0]]);
              const glow = L.polyline(latLngs, { color: '#93c5fd', weight: 8, opacity: 0.5, lineCap: 'round', lineJoin: 'round' });
              layer.addLayer(glow);
              const line = L.polyline(latLngs, { color: '#2563eb', weight: 5, opacity: 0.95, lineCap: 'round', lineJoin: 'round' });
              layer.addLayer(line);
              mapInstanceRef.current.fitBounds(line.getBounds(), { padding: [40, 40] });
            }
          })
          .catch((err) => {
            console.error('Failed to compute amenity route:', err);
            btn.disabled = false;
            btn.innerHTML = '⚠️ Retry Route Calculation';
            btn.style.background = '#dc2626';
          });
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [onComputeAmenityRoute]);

  // Sync selectedRouteIdx if external destinationName matches
  useEffect(() => {
    if (destinationName && routes.length > 0) {
      const idx = routes.findIndex(
        (r) => r.name.toLowerCase() === destinationName.toLowerCase()
      );
      if (idx !== -1) {
        setSelectedRouteIdx(idx);
      }
    }
  }, [destinationName, routes]);

  // Available categories from POIs
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    pois.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats);
  }, [pois]);

  // Filtered POIs based on active filter
  const filteredPois = useMemo(() => {
    if (activeCategory === 'All') return pois;
    return pois.filter((p) => p.category === activeCategory);
  }, [pois, activeCategory]);

  // Active route to render (prioritize explicitly passed routeGeometry)
  const activeRoute = useMemo(() => {
    if (routeGeometry && routeGeometry.length > 1) {
      return {
        name: destinationName || 'Commute Destination',
        route_geometry: routeGeometry
      };
    }
    if (selectedRouteIdx !== null && routes[selectedRouteIdx]) {
      return routes[selectedRouteIdx];
    }
    return null;
  }, [selectedRouteIdx, routes, routeGeometry, destinationName]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!valid || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [latitude, longitude],
      zoom: zoom,
      zoomControl: true,
      scrollWheelZoom: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Origin Pin
    const originIcon = L.divIcon({
      className: 'property-origin-pin',
      html: `
        <div style="background:#0f172a;color:#fff;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(15,23,42,0.45);border:2.5px solid #fff;cursor:pointer;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      popupAnchor: [0, -34]
    });

    const originMarker = L.marker([latitude, longitude], { icon: originIcon, zIndexOffset: 1000 }).addTo(map);
    originMarker.bindPopup(`
      <div style="font-family:sans-serif;padding:6px;min-width:180px">
        <div style="display:inline-block;padding:2px 6px;background:#0f172a;color:#fff;border-radius:4px;font-size:10px;font-weight:700;margin-bottom:4px">
          SUBJECT PROPERTY
        </div>
        <strong style="font-size:13px;color:#0f172a;display:block">${propertyName}</strong>
        ${address ? `<span style="font-size:11px;color:#64748b;display:block;margin-top:2px">${address}</span>` : ''}
        <span style="font-size:10px;color:#2563eb;display:block;margin-top:4px;font-family:monospace">GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}</span>
      </div>
    `);

    const markersLayer = L.layerGroup().addTo(map);
    const routeLayer = L.layerGroup().addTo(map);

    markersLayerRef.current = markersLayer;
    routeLayerRef.current = routeLayer;
    mapInstanceRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [valid, latitude, longitude, propertyName, address, zoom]);

  // Update POI markers with in-app driving route button
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    const layer = markersLayerRef.current;
    layer.clearLayers();

    filteredPois.forEach((poi) => {
      if (!isValidCoordinate(poi.latitude, poi.longitude)) return;

      const style = CATEGORY_STYLES[poi.category] || DEFAULT_STYLE;

      const poiIcon = L.divIcon({
        className: 'custom-poi-pin',
        html: `
          <div style="background:${style.bg};color:#fff;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,0.25);border:2px solid #fff;cursor:pointer;">
            ${style.svg}
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 26],
        popupAnchor: [0, -26]
      });

      const distLabel =
        poi.distance_meters !== undefined
          ? poi.distance_meters >= 1000
            ? `${(poi.distance_meters / 1000).toFixed(1)} km`
            : `${poi.distance_meters} m`
          : '';

      const escapedName = poi.name.replace(/'/g, "\\'");

      const marker = L.marker([poi.latitude, poi.longitude], { icon: poiIcon });
      marker.bindPopup(`
        <div style="font-family:sans-serif;padding:6px;min-width:190px">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:4px">
            <span style="background:${style.bg};color:#fff;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700">
              ${poi.category}
            </span>
            ${distLabel ? `<span style="font-size:11px;font-weight:700;color:#0f172a;font-family:monospace">${distLabel}</span>` : ''}
          </div>
          <strong style="font-size:12px;color:#0f172a;display:block">${poi.name}</strong>
          ${poi.type ? `<span style="font-size:11px;color:#64748b;display:block;margin-top:2px;text-transform:capitalize">${poi.type.replace('_', ' ')}</span>` : ''}
          <div style="margin-top:8px;padding-top:6px;border-top:1px solid #e2e8f0">
            <button
              type="button"
              class="btn-calc-amenity-commute"
              data-lat="${poi.latitude}"
              data-lon="${poi.longitude}"
              data-name="${escapedName}"
              style="width:100%;padding:6px 10px;background:#2563eb;color:#fff;border:none;border-radius:5px;font-size:11px;font-weight:600;cursor:pointer;display:block;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.15);"
            >
              🚗 Calculate Commute to this Place
            </button>
          </div>
        </div>
      `);
      layer.addLayer(marker);
    });
  }, [filteredPois]);

  // Update Route Polyline & Destination Pin
  useEffect(() => {
    if (!mapInstanceRef.current || !routeLayerRef.current) return;

    const layer = routeLayerRef.current;
    layer.clearLayers();

    if (activeRoute && activeRoute.route_geometry && activeRoute.route_geometry.length > 1) {
      const latLngs: L.LatLngExpression[] = activeRoute.route_geometry.map((coord) => [coord[1], coord[0]]);

      const glowPolyline = L.polyline(latLngs, {
        color: '#93c5fd',
        weight: 8,
        opacity: 0.5,
        lineCap: 'round',
        lineJoin: 'round'
      });
      layer.addLayer(glowPolyline);

      const polyline = L.polyline(latLngs, {
        color: '#2563eb',
        weight: 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      });
      layer.addLayer(polyline);

      const lastCoord = activeRoute.route_geometry[activeRoute.route_geometry.length - 1];
      const destIcon = L.divIcon({
        className: 'custom-dest-pin',
        html: `
          <div style="background:#2563eb;color:#fff;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(37,99,235,0.4);border:2.5px solid #fff;cursor:pointer;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
      });

      const destMarker = L.marker([lastCoord[1], lastCoord[0]], { icon: destIcon, zIndexOffset: 999 });
      destMarker.bindPopup(`
        <div style="font-family:sans-serif;padding:6px;min-width:180px">
          <div style="display:inline-block;padding:2px 6px;background:#2563eb;color:#fff;border-radius:4px;font-size:10px;font-weight:700;margin-bottom:4px">
            COMMUTE DESTINATION
          </div>
          <strong style="font-size:13px;color:#0f172a;display:block">${activeRoute.name}</strong>
          ${activeRoute.type ? `<span style="font-size:11px;color:#64748b;display:block;margin-top:2px">${activeRoute.type}</span>` : ''}
          <div style="display:flex;gap:10px;margin-top:6px;padding-top:6px;border-top:1px solid #e2e8f0;font-size:11px">
            ${activeRoute.road_distance_km ? `<span>Road: <strong>${activeRoute.road_distance_km} km</strong></span>` : ''}
            ${activeRoute.estimated_duration_mins ? `<span>Drive: <strong style="color:#2563eb">~${activeRoute.estimated_duration_mins} mins</strong></span>` : ''}
          </div>
        </div>
      `);
      layer.addLayer(destMarker);

      mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [40, 40] });
    } else if (mapInstanceRef.current && valid) {
      if (filteredPois.length > 0) {
        const bounds = L.latLngBounds([[latitude, longitude]]);
        filteredPois.slice(0, 15).forEach((p) => {
          if (isValidCoordinate(p.latitude, p.longitude)) {
            bounds.extend([p.latitude, p.longitude]);
          }
        });
        mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      } else {
        mapInstanceRef.current.setView([latitude, longitude], zoom);
      }
    }
  }, [activeRoute, valid, latitude, longitude, zoom, filteredPois]);

  const handleRouteClick = (idx: number, rt: MapRouteItem) => {
    if (selectedRouteIdx === idx) {
      setSelectedRouteIdx(null);
      if (onSelectRoute) {
        onSelectRoute([], '');
      }
    } else {
      setSelectedRouteIdx(idx);
      if (rt.route_geometry && onSelectRoute) {
        onSelectRoute(rt.route_geometry, rt.name);
      }
    }
  };

  if (!valid) {
    return (
      <div
        style={{ height, width: '100%' }}
        className={`rounded-lg border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center p-6 text-center text-slate-500 ${className}`}
      >
        <MapPinOff size={28} className="text-slate-400 mb-2" />
        <p className="text-xs font-semibold text-slate-700">GPS Coordinates Not Available</p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Cadastral location is pending confirmation by the seller.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Controls Bar: Driving Routes & Nearest Amenities */}
      {showControls && (
        <div className="bg-slate-900 text-white rounded-lg p-3 text-xs space-y-2.5 shadow-sm">
          {/* 1. Commute Routes: Only shown if AI intelligence is activated or routes exist */}
          {(aiActivated || routes.length > 0) ? (
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px] font-bold">
                <Car size={14} className="text-blue-400" />
                <span>Driving Commute Routes ({routes.length}):</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {routes.map((rt, idx) => {
                  const isSelected =
                    selectedRouteIdx === idx ||
                    (activeRoute?.name && activeRoute.name.toLowerCase() === rt.name.toLowerCase());
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleRouteClick(idx, rt)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600 border-blue-400 text-white shadow-xs ring-1 ring-white/30'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                      title={rt.type || 'Commute Route'}
                    >
                      <Navigation size={11} className={isSelected ? 'text-white' : 'text-blue-400'} />
                      <span>{rt.name}</span>
                      {rt.road_distance_km && (
                        <span className="font-mono text-[10px] opacity-80">
                          ({rt.road_distance_km} km • ~{rt.estimated_duration_mins}m)
                        </span>
                      )}
                    </button>
                  );
                })}

                {(selectedRouteIdx !== null || activeRoute !== null) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRouteIdx(null);
                      if (onSelectRoute) {
                        onSelectRoute([], '');
                      }
                    }}
                    className="px-2 py-1 rounded text-[10px] bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700 flex items-center gap-1 cursor-pointer"
                    title="Clear route selection and show neighborhood pins"
                  >
                    <RotateCcw size={11} />
                    <span>Reset Route</span>
                  </button>
                )}
              </div>
            </div>
          ) : !aiActivated ? (
            /* Prompt to activate AI Intelligence to compute routes */
            <div className="flex items-center justify-between flex-wrap gap-2 py-1">
              <div className="flex items-center gap-2 text-slate-300 text-xs">
                <Sparkles size={14} className="text-amber-400" />
                <span>Commute routing analysis activates after generating AI Intelligence.</span>
              </div>
              {onActivateAi && (
                <button
                  type="button"
                  onClick={onActivateAi}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer shadow-xs"
                >
                  <Sparkles size={11} className="text-amber-300" />
                  <span>Activate Commute Intelligence</span>
                </button>
              )}
            </div>
          ) : null}

          {/* 2. OpenStreetMap Category Filter Pills */}
          {pois.length > 0 && (
            <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px] font-bold">
                <Layers size={13} className="text-emerald-400" />
                <span>Nearest Amenities ({filteredPois.length}):</span>
              </div>

              <div className="flex items-center gap-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveCategory('All')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                    activeCategory === 'All'
                      ? 'bg-slate-100 text-slate-900 border-white'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  All ({pois.length})
                </button>

                {availableCategories.map((cat) => {
                  const count = pois.filter((p) => p.category === cat).length;
                  const isSelected = activeCategory === cat;
                  const style = CATEGORY_STYLES[cat] || DEFAULT_STYLE;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'border-white text-white'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                      style={{
                        backgroundColor: isSelected ? style.bg : undefined
                      }}
                    >
                      <span>{style.label}</span>
                      <span className="font-mono text-[9px] opacity-75">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leaflet Canvas Container */}
      <div
        ref={mapContainerRef}
        style={{ height, width: '100%' }}
        className="rounded-lg border border-brand-border overflow-hidden shadow-xs relative z-10"
      />
    </div>
  );
};
