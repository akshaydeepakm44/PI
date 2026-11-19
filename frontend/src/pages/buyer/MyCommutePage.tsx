import { getSavedCommutes, saveCustomCommute, removeCustomCommute, SavedCommuteAnchor } from '../../services/commuteStore';
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { propertyApi, geocodingApi, routingApi } from '../../services/api';
import { PropertyMap } from '../../components/common/PropertyMap';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { RouteResult, GeocodingResult } from '../../types';
import {
  Navigation,
  Plus,
  MapPin,
  Trash2,
  Search,
  Loader2,
  Clock,
  Route,
  AlertCircle,
  Car,
  Info,
  CheckCircle
} from 'lucide-react';



const POPULAR_HUBS = [
  { name: 'Madhurawada', lat: 17.8102, lon: 83.3540, type: 'Workplace' },
  { name: 'Rushikonda IT SEZ', lat: 17.8180, lon: 83.3850, type: 'Workplace' },
  { name: 'Visakhapatnam Railway Station', lat: 17.7210, lon: 83.2965, type: 'Transit Hub' },
  { name: 'Visakhapatnam Airport (VTZ)', lat: 17.7215, lon: 83.2245, type: 'Transit Hub' },
  { name: 'MVP Colony', lat: 17.7420, lon: 83.3325, type: 'Residential & Commercial' },
  { name: 'Gajuwaka Industrial Hub', lat: 17.6905, lon: 83.2095, type: 'Workplace' },
  { name: 'Siripuram Junction', lat: 17.7218, lon: 83.3155, type: 'Commercial' },
  { name: 'GITAM University', lat: 17.7812, lon: 83.3768, type: 'Education' }
];

export const MyCommutePage: React.FC = () => {
  // Saved destinations via unified commuteStore
  const [destinations, setDestinations] = useState<SavedCommuteAnchor[]>(getSavedCommutes);

  // Keep state synced across tabs / page navigations
  useEffect(() => {
    const handleSync = () => {
      setDestinations(getSavedCommutes());
    };
    window.addEventListener('commutes-updated', handleSync);
    return () => window.removeEventListener('commutes-updated', handleSync);
  }, []);

  // Geocoding search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
  const [anchorType, setAnchorType] = useState('Workplace');
  const [customName, setCustomName] = useState('');

  // Selected property for detailed routing preview
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  
  // Real road routes state: key is `${propertyId}_${anchorId}`
  const [routeResults, setRouteResults] = useState<Record<string, RouteResult>>({});
  const [loadingRoutes, setLoadingRoutes] = useState<Record<string, boolean>>({});

  // Active route for map polyline inspection
  const [activeMapRoute, setActiveMapRoute] = useState<{
    geometry: [number, number][];
    destinationName: string;
    propertyLat: number;
    propertyLon: number;
    propertyName: string;
  } | null>(null);



  // Fetch properties
  const { data: properties, isLoading: isPropertiesLoading } = useQuery({
    queryKey: ['public-properties'],
    queryFn: () => propertyApi.getProperties()
  });

  // Select first property by default once loaded
  useEffect(() => {
    if (properties && properties.length > 0 && selectedPropertyId === null) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId]);

  // Live input change with instant suggestion matching and geocoding fallback
  const handleInputChange = async (val: string) => {
    setSearchQuery(val);
    setSelectedPlace(null);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }

    // 1. Instant local matches
    const localMatches = POPULAR_HUBS.filter((h) =>
      h.name.toLowerCase().includes(val.toLowerCase())
    ).map((h) => ({
      place_id: `local_${h.name}`,
      display_name: `${h.name}, Visakhapatnam, Andhra Pradesh`,
      latitude: h.lat,
      longitude: h.lon,
      type: h.type
    }));

    setSearchResults(localMatches);

    // 2. Query geocoding API with smart fallback
    try {
      setIsSearching(true);
      const results = await geocodingApi.searchAddress(val.trim(), 5);
      if (results && results.length > 0) {
        const merged = [...localMatches];
        results.forEach((r) => {
          if (!merged.some((m) => Math.abs(m.latitude - r.latitude) < 0.005)) {
            merged.push(r);
          }
        });
        setSearchResults(merged);
      }
    } catch (err) {
      console.error('Geocoding search failed:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectPlace = (place: any) => {
    setSelectedPlace(place);
    const placeName = place.display_name.split(',')[0].trim();
    setCustomName(placeName);
    setSearchResults([]);
  };

  const handleAddAnchor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlace && !customName.trim()) return;

    const lat = selectedPlace ? selectedPlace.latitude : 17.72;
    const lng = selectedPlace ? selectedPlace.longitude : 83.30;
    const name = customName.trim() || (selectedPlace ? selectedPlace.display_name.split(',')[0] : 'Custom Anchor');

    const updated = saveCustomCommute({
      name,
      type: anchorType,
      lat,
      lng,
      address: selectedPlace?.display_name
    });

    setDestinations(updated);
    setSelectedPlace(null);
    setSearchQuery('');
    setCustomName('');
  };

  const handleRemoveAnchor = (id: string) => {
    const updated = removeCustomCommute(id);
    setDestinations(updated);
  };

  // Calculate road route on-demand
  const handleCalculateRoadRoute = async (property: any, anchor: SavedCommuteAnchor) => {
    const key = `${property.id}_${anchor.id}`;
    if (loadingRoutes[key]) return;

    setLoadingRoutes((prev) => ({ ...prev, [key]: true }));

    try {
      const result = await routingApi.computeRoute({
        origin_lat: property.latitude,
        origin_lon: property.longitude,
        dest_lat: anchor.lat,
        dest_lon: anchor.lng,
        destination_name: anchor.name
      });

      setRouteResults((prev) => ({ ...prev, [key]: result }));

      saveCustomCommute({
        ...anchor,
        road_distance_km: result.road_distance_km,
        straight_line_distance_km: result.straight_line_distance_km,
        estimated_duration_mins: result.estimated_duration_mins,
        tortuosity_ratio: result.tortuosity_ratio,
        route_geometry: result.route_geometry
      });

      if (result.route_geometry) {
        setActiveMapRoute({
          geometry: result.route_geometry,
          destinationName: anchor.name,
          propertyLat: property.latitude,
          propertyLon: property.longitude,
          propertyName: property.name
        });
      }
    } catch (e) {
      console.error('Road routing calculation failed:', e);
    } finally {
      setLoadingRoutes((prev) => ({ ...prev, [key]: false }));
    }
  };

  const selectedProperty = properties?.find((p) => p.id === selectedPropertyId);

  if (isPropertiesLoading) {
    return <LoadingSpinner message="Loading properties and commute matrix..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-brand-border space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              My Commute & Road Connectivity Intelligence
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Add private work, school, or transit destinations and calculate genuine road driving routes to all properties.
            </p>
          </div>
          <Badge variant="verified">OSRM Road Graph Integrated</Badge>
        </div>

        {/* Technical Notice */}
        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-md text-[11px] text-blue-900 flex items-start gap-2">
          <Info size={16} className="text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold block">Vehicular Road Distance vs Straight-Line Geodesic Distance</span>
            <p className="leading-relaxed text-blue-800">
              Unlike straight-line calculations, road graph routing computes the actual driving network and route geometry. Durations represent standard road speed limits on the static highway graph.
            </p>
          </div>
        </div>
      </div>

      {/* Add Custom Destination with Autocomplete */}
      <div className="bg-white p-5 rounded-lg border border-brand-border text-xs space-y-4">
        <h2 className="font-bold text-slate-900 flex items-center gap-1.5">
          <Search size={14} className="text-brand-primary" />
          <span>Search & Save Destination</span>
        </h2>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-400 font-mono">Popular Visakhapatnam Anchors:</span>
          {POPULAR_HUBS.map((hub) => (
            <button
              key={hub.name}
              type="button"
              onClick={() => handleSelectPlace({ display_name: `${hub.name}, Visakhapatnam`, latitude: hub.lat, longitude: hub.lon })}
              className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-full text-[10px] text-slate-700 font-medium transition-colors cursor-pointer"
            >
              + {hub.name}
            </button>
          ))}
        </div>

        {/* Search input with live autocomplete */}
        <div className="relative">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search address, area, or building (e.g., 'vsnr residency, madhurawada', 'Gajuwaka', 'GITAM')..."
              value={searchQuery}
              onChange={(e) => handleInputChange(e.target.value)}
              className="w-full px-3 py-2 pl-8 bg-slate-50 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-brand-primary focus:bg-white focus:outline-none"
            />
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            {isSearching && (
              <Loader2 size={13} className="animate-spin absolute right-3 top-2.5 text-slate-400" />
            )}
          </div>

          {/* Search Results Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 border border-slate-200 rounded-lg p-2 bg-white shadow-lg space-y-1.5 max-h-56 overflow-y-auto z-30">
              <span className="text-[10px] text-slate-400 uppercase font-mono px-2 block">
                Found Locations ({searchResults.length})
              </span>
              {searchResults.map((place, idx) => (
                <button
                  key={place.place_id || idx}
                  type="button"
                  onClick={() => handleSelectPlace(place)}
                  className="w-full text-left p-2 rounded hover:bg-blue-50/60 transition-colors border border-transparent hover:border-blue-200 flex items-start gap-2 cursor-pointer"
                >
                  <MapPin size={14} className="text-blue-600 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-slate-900 block truncate text-xs">
                      {place.display_name.split(',')[0]}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">
                      {place.display_name}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono block">
                      Lat: {place.latitude.toFixed(4)}, Lon: {place.longitude.toFixed(4)}
                    </span>
                  </div>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded self-center">
                    Select
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Place Confirmation & Save */}
        {selectedPlace && (
          <form onSubmit={handleAddAnchor} className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg flex flex-col sm:flex-row sm:items-center gap-3 animate-fadeIn">
            <div className="flex-1 space-y-1">
              <span className="text-[10px] uppercase font-mono text-emerald-800 font-bold block">
                ✓ Location Selected & Geocoded
              </span>
              <input
                type="text"
                required
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Anchor label (e.g., Office, Home, College)"
                className="px-2.5 py-1.5 bg-white border border-emerald-300 rounded text-xs font-semibold text-slate-900 w-full sm:w-64"
              />
              <span className="text-[10px] text-slate-500 block truncate font-mono">
                {selectedPlace.latitude.toFixed(5)}, {selectedPlace.longitude.toFixed(5)} — {selectedPlace.display_name}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={anchorType}
                onChange={(e) => setAnchorType(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs"
              >
                <option value="Workplace">Workplace</option>
                <option value="School / College">School / College</option>
                <option value="Transit Hub">Transit Hub</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Recreation">Recreation</option>
              </select>

              <button
                type="submit"
                className="px-4 py-2 bg-emerald-700 text-white font-semibold rounded text-xs hover:bg-emerald-800 flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Plus size={13} />
                <span>Save to My Anchors</span>
              </button>
            </div>
          </form>
        )}

        {/* Active Anchors Pills */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-slate-400 font-mono">Saved Destinations ({destinations.length}):</span>
          {destinations.map((d) => (
            <div
              key={d.id}
              className="px-3 py-1 bg-slate-100 rounded-full border border-slate-200 text-xs flex items-center gap-2"
            >
              <span className="font-semibold text-slate-800">{d.name}</span>
              <span className="text-[10px] text-slate-400">({d.type})</span>
              <button
                type="button"
                onClick={() => handleRemoveAnchor(d.id)}
                className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                title="Remove destination"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Property Route Analysis & Map Polyline */}
      {selectedProperty && (
        <div className="bg-white p-6 rounded-lg border border-brand-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Active Property Context</span>
              <h3 className="text-base font-bold text-slate-900">{selectedProperty.name}</h3>
              <p className="text-xs text-slate-500">{selectedProperty.address}</p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-600">Switch Property:</label>
              <select
                value={selectedPropertyId || ''}
                onChange={(e) => setSelectedPropertyId(Number(e.target.value))}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-800"
              >
                {properties?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.locality})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Commute Cards Matrix for this property */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {destinations.map((anchor) => {
              const routeKey = `${selectedProperty.id}_${anchor.id}`;
              const route = routeResults[routeKey];
              const isLoading = loadingRoutes[routeKey];

              return (
                <div
                  key={anchor.id}
                  className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{anchor.name}</h4>
                      <span className="text-[10px] text-slate-500 font-mono block">{anchor.type}</span>
                    </div>
                  </div>

                  {route ? (
                    <div className="space-y-2 pt-1 border-t border-slate-200/60 font-mono text-xs">
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-2 bg-white rounded border border-slate-200">
                          <span className="text-[10px] text-slate-400 block uppercase">Road Distance</span>
                          <span className="font-bold text-slate-900 text-sm">{route.road_distance_km} km</span>
                        </div>
                        <div className="p-2 bg-white rounded border border-slate-200">
                          <span className="text-[10px] text-slate-400 block uppercase">Drive Time</span>
                          <span className="font-bold text-brand-primary text-sm">~{route.estimated_duration_mins} mins</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (route.route_geometry) {
                            setActiveMapRoute({
                              geometry: route.route_geometry,
                              destinationName: anchor.name,
                              propertyLat: selectedProperty.latitude,
                              propertyLon: selectedProperty.longitude,
                              propertyName: selectedProperty.name
                            });
                          }
                        }}
                        className="w-full py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Route size={12} />
                        <span>View Route on Map</span>
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleCalculateRoadRoute(selectedProperty, anchor)}
                        disabled={isLoading}
                        className="w-full py-2 bg-brand-primary hover:bg-brand-primaryHover text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Navigation size={13} />}
                        <span>{isLoading ? 'Computing Route...' : 'Calculate Commute'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Interactive Route Polyline Map */}
          {activeMapRoute && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800">
                  Driving Route to: <span className="text-blue-700">{activeMapRoute.destinationName}</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  OSRM Turn-by-Turn Network Polyline
                </span>
              </div>
              <PropertyMap
                latitude={activeMapRoute.propertyLat}
                longitude={activeMapRoute.propertyLon}
                propertyName={activeMapRoute.propertyName}
                routeGeometry={activeMapRoute.geometry}
                destinationName={activeMapRoute.destinationName}
                height="380px"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
