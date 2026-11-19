import { saveCustomCommute } from '../../services/commuteStore';
import React, { useState } from 'react';
import { Route, Navigation, Search, Loader2, ArrowRight, Clock, AlertCircle, MapPin, CheckCircle } from 'lucide-react';
import { geocodingApi, routingApi } from '../../services/api';

interface RoadConnectivityCardProps {
  routes?: {
    name: string;
    type: string;
    road_distance_km: number;
    straight_line_distance_km: number;
    estimated_duration_mins: number;
    tortuosity_ratio: number;
    route_geometry?: [number, number][];
  }[];
  propertyLat: number;
  propertyLon: number;
  propertyName: string;
  onSelectRouteOnMap: (geometry: [number, number][], destName: string) => void;
  onAddCustomRoute?: (route: any) => void;
}

const POPULAR_HUBS = [
  { name: 'Madhurawada', lat: 17.8102, lon: 83.3540 },
  { name: 'Rushikonda IT SEZ', lat: 17.8180, lon: 83.3850 },
  { name: 'Visakhapatnam Railway Station', lat: 17.7210, lon: 83.2965 },
  { name: 'Visakhapatnam Airport (VTZ)', lat: 17.7215, lon: 83.2245 },
  { name: 'MVP Colony', lat: 17.7420, lon: 83.3325 },
  { name: 'Gajuwaka Industrial Hub', lat: 17.6905, lon: 83.2095 },
  { name: 'Siripuram Junction', lat: 17.7218, lon: 83.3155 },
  { name: 'GITAM University', lat: 17.7812, lon: 83.3768 }
];

export const RoadConnectivityCard: React.FC<RoadConnectivityCardProps> = ({
  routes = [],
  propertyLat,
  propertyLon,
  propertyName,
  onSelectRouteOnMap,
  onAddCustomRoute
}) => {
  // Custom destination state
  const [destinationQuery, setDestinationQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDest, setSelectedDest] = useState<any | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [calculatedRoute, setCalculatedRoute] = useState<any | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  const handleInputChange = async (val: string) => {
    setDestinationQuery(val);
    setRouteError(null);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }

    // Instant local matches
    const localMatches = POPULAR_HUBS.filter((h) =>
      h.name.toLowerCase().includes(val.toLowerCase())
    ).map((h) => ({
      display_name: `${h.name}, Visakhapatnam, Andhra Pradesh`,
      latitude: h.lat,
      longitude: h.lon,
      place_id: `local_${h.name}`
    }));

    setSearchResults(localMatches);

    // Dynamic geocoding
    try {
      setIsSearching(true);
      const places = await geocodingApi.searchAddress(val.trim(), 4);
      if (places && places.length > 0) {
        const merged = [...localMatches];
        places.forEach((p) => {
          if (!merged.some((m) => Math.abs(m.latitude - p.latitude) < 0.005)) {
            merged.push(p);
          }
        });
        setSearchResults(merged);
      }
    } catch {
      // keep local matches
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectDest = async (place: any) => {
    const destName = place.display_name.split(',')[0].trim();
    setSelectedDest(place);
    setSearchResults([]);
    setDestinationQuery(destName);
    setIsCalculatingRoute(true);
    setRouteError(null);

    try {
      const res = await routingApi.computeRoute({
        origin_lat: propertyLat,
        origin_lon: propertyLon,
        dest_lat: place.latitude,
        dest_lon: place.longitude,
        destination_name: destName
      });

      setCalculatedRoute(res);

      saveCustomCommute({
        name: destName,
        type: 'Custom Commute',
        lat: place.latitude,
        lng: place.longitude,
        address: place.display_name,
        road_distance_km: res.road_distance_km,
        straight_line_distance_km: res.straight_line_distance_km,
        estimated_duration_mins: res.estimated_duration_mins,
        tortuosity_ratio: res.tortuosity_ratio,
        route_geometry: res.route_geometry
      });

      if (onAddCustomRoute) {
        onAddCustomRoute({
          name: destName,
          type: 'Custom Commute',
          road_distance_km: res.road_distance_km,
          straight_line_distance_km: res.straight_line_distance_km,
          estimated_duration_mins: res.estimated_duration_mins,
          tortuosity_ratio: res.tortuosity_ratio,
          route_geometry: res.route_geometry,
          lat: place.latitude,
          lng: place.longitude
        });
      }

      if (res.route_geometry) {
        onSelectRouteOnMap(res.route_geometry, destName);
      }
    } catch (err: any) {
      setRouteError(err?.response?.data?.detail || 'Unable to calculate road route to this destination.');
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-brand-border p-5 space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <Route size={15} className="text-brand-primary" />
          <span>Vehicular Road Commute Analysis</span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Calculates physical vehicular road distance and duration to key employment and transit corridors.
        </p>
      </div>

      {/* Regional Road Anchors Grid */}
      {routes && routes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
              Available Commute Destinations ({routes.length})
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">Click any route to view on map</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {routes.map((route, i) => (
              <div
                key={i}
                className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-lg space-y-3 hover:border-blue-400 transition-colors"
              >
                <div>
                  <h5 className="text-xs font-bold text-slate-900">{route.name}</h5>
                  <span className="text-[10px] text-slate-500 font-mono block">{route.type || 'Commute Route'}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Road Distance</span>
                    <span className="text-sm font-bold text-slate-900">{route.road_distance_km} km</span>
                    <span className="text-[10px] text-slate-400 block">
                      (Line: {route.straight_line_distance_km} km)
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Est. Drive Time</span>
                    <span className="text-sm font-bold text-brand-primary">~{route.estimated_duration_mins} mins</span>
                    <span className="text-[10px] text-slate-400 block">
                      Route Curve: {route.tortuosity_ratio}x
                    </span>
                  </div>
                </div>

                {route.route_geometry && (
                  <button
                    type="button"
                    onClick={() => onSelectRouteOnMap(route.route_geometry!, route.name)}
                    className="w-full py-1.5 px-2 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>View Route on Map</span>
                    <ArrowRight size={11} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Buyer Commute Destination Search */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
        <div>
          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Navigation size={13} className="text-brand-primary" />
            <span>Add Custom Commute Destination</span>
          </h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Enter your workplace or residential area to calculate exact road navigation from {propertyName}.
          </p>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-slate-400 font-mono">Quick Add:</span>
          {POPULAR_HUBS.map((hub) => (
            <button
              key={hub.name}
              type="button"
              onClick={() => handleSelectDest({ display_name: hub.name, latitude: hub.lat, longitude: hub.lon })}
              className="px-2 py-0.5 bg-white border border-slate-200 hover:border-blue-400 rounded-full text-[10px] text-slate-700 font-medium transition-colors cursor-pointer"
            >
              + {hub.name}
            </button>
          ))}
        </div>

        <div className="relative">
          <div className="relative">
            <input
              type="text"
              placeholder="Search destination (e.g. 'vsnr residency, madhurawada', 'Rushikonda', 'GITAM')..."
              value={destinationQuery}
              onChange={(e) => handleInputChange(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded text-xs focus:border-brand-primary focus:outline-none"
            />
            <Search size={13} className="absolute left-2.5 top-2.5 text-slate-400" />
          </div>

          {/* Autocomplete Dropdown List */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 shadow-md text-xs z-30 max-h-52 overflow-y-auto">
              {searchResults.map((place, idx) => (
                <button
                  key={place.place_id || idx}
                  type="button"
                  onClick={() => handleSelectDest(place)}
                  className="w-full text-left p-2.5 hover:bg-blue-50/50 flex items-start gap-2 text-xs transition-colors cursor-pointer"
                >
                  <MapPin size={13} className="text-brand-primary mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-slate-900 block truncate">
                      {place.display_name.split(',')[0]}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">{place.display_name}</span>
                  </div>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded shrink-0">
                    Calculate
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {isCalculatingRoute && (
          <div className="flex items-center gap-2 text-xs text-brand-primary p-2">
            <Loader2 size={13} className="animate-spin" />
            <span>Calculating road route navigation...</span>
          </div>
        )}

        {routeError && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center gap-1.5">
            <AlertCircle size={13} />
            <span>{routeError}</span>
          </div>
        )}

        {/* Calculated Custom Route Card */}
        {calculatedRoute && calculatedRoute.status === 'success' && (
          <div className="p-3.5 bg-white border border-brand-primary/40 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs animate-fadeIn">
            <div>
              <span className="text-[10px] font-mono uppercase text-brand-primary font-bold">✓ Route Calculated</span>
              <h5 className="text-xs font-bold text-slate-900 mt-0.5">{calculatedRoute.destination_name}</h5>
              <span className="text-[10px] text-slate-500 font-mono block">
                Plotted on interactive map canvas
              </span>
            </div>

            <div className="flex items-center gap-6 font-mono text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Road Distance</span>
                <span className="font-bold text-slate-900 text-sm">{calculatedRoute.road_distance_km} km</span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Est. Duration</span>
                <span className="font-bold text-brand-primary text-sm flex items-center gap-1">
                  <Clock size={12} />
                  <span>~{calculatedRoute.estimated_duration_mins} mins</span>
                </span>
              </div>

              {calculatedRoute.route_geometry && (
                <button
                  type="button"
                  onClick={() => onSelectRouteOnMap(calculatedRoute.route_geometry, calculatedRoute.destination_name)}
                  className="px-3 py-1.5 bg-brand-primary text-white font-semibold text-xs rounded hover:bg-brand-primaryHover flex items-center gap-1 cursor-pointer"
                >
                  <span>Focus Map</span>
                  <ArrowRight size={11} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
