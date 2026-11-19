import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Search, Loader2, MapPin } from 'lucide-react';
import { geocodingApi } from '../../services/api';

interface MapPickerProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
  onAddressSelected?: (addressData: { locality?: string; city?: string; address?: string }) => void;
  height?: string;
  className?: string;
}

export const MapPicker: React.FC<MapPickerProps> = ({
  latitude,
  longitude,
  onChange,
  onAddressSelected,
  height = '320px',
  className = ''
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Address search autocomplete state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const defaultLat = latitude && !isNaN(latitude) ? latitude : 17.7280;
    const defaultLng = longitude && !isNaN(longitude) ? longitude : 83.3250;

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 13,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    const customIcon = L.divIcon({
      className: 'picker-pin',
      html: `
        <div style="background:#2563eb;color:#fff;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(37,99,235,0.4);border:2px solid #fff;cursor:grab">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
      `,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      popupAnchor: [0, -34]
    });

    const marker = L.marker([defaultLat, defaultLng], {
      icon: customIcon,
      draggable: true
    }).addTo(map);

    marker.bindPopup('<span style="font-size:11px;font-family:sans-serif">Drag pin or click map to set exact coordinates</span>').openPopup();

    const handleCoordChange = async (lat: number, lng: number) => {
      const fixedLat = parseFloat(lat.toFixed(5));
      const fixedLng = parseFloat(lng.toFixed(5));
      onChange(fixedLat, fixedLng);

      // Optional reverse geocode to assist seller
      if (onAddressSelected) {
        try {
          const rev = await geocodingApi.reverseGeocode(fixedLat, fixedLng);
          if (rev?.address) {
            onAddressSelected({
              locality: rev.address.locality || rev.address.neighbourhood,
              city: rev.address.city,
              address: rev.display_name
            });
          }
        } catch {
          // Non-blocking
        }
      }
    };

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      handleCoordChange(pos.lat, pos.lng);
    });

    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      handleCoordChange(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker position when prop values change externally
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current && latitude && longitude) {
      const cur = markerRef.current.getLatLng();
      if (Math.abs(cur.lat - latitude) > 0.0001 || Math.abs(cur.lng - longitude) > 0.0001) {
        markerRef.current.setLatLng([latitude, longitude]);
        mapInstanceRef.current.panTo([latitude, longitude]);
      }
    }
  }, [latitude, longitude]);

  // Handle Geocoding Search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || searchQuery.length < 2) return;

    setIsSearching(true);
    setShowDropdown(true);
    try {
      const results = await geocodingApi.searchAddress(searchQuery.trim(), 5);
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectPlace = (place: any) => {
    const lat = place.latitude;
    const lon = place.longitude;
    onChange(lat, lon);

    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([lat, lon]);
      mapInstanceRef.current.setView([lat, lon], 15);
    }

    if (onAddressSelected && place.address) {
      onAddressSelected({
        locality: place.address.neighbourhood || place.address.locality || place.address.road,
        city: place.address.city,
        address: place.display_name
      });
    }

    setShowDropdown(false);
    setSearchQuery(place.display_name.split(',')[0]);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Geocoding Search Autocomplete Bar */}
      <div className="relative z-20">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search address or landmark on OpenStreetMap (e.g. Rushikonda, Madhurawada)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.length >= 3) {
                  geocodingApi.searchAddress(e.target.value, 4).then((res) => {
                    setSearchResults(res);
                    setShowDropdown(true);
                  }).catch(() => {});
                }
              }}
              onFocus={() => {
                if (searchResults.length > 0) setShowDropdown(true);
              }}
              className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:border-brand-primary"
            />
            <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
            {isSearching && (
              <Loader2 size={13} className="animate-spin absolute right-2.5 top-2.5 text-brand-primary" />
            )}
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-3 py-2 bg-slate-900 text-white rounded text-xs font-semibold hover:bg-slate-800 shrink-0"
          >
            Locate
          </button>
        </form>

        {/* Dropdown Results */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-30 max-h-60 overflow-y-auto">
            {searchResults.map((place) => (
              <button
                key={place.place_id || place.osm_id}
                type="button"
                onClick={() => selectPlace(place)}
                className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 border-b border-slate-100 last:border-0 flex items-start gap-2"
              >
                <MapPin size={13} className="text-brand-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900 block">{place.display_name.split(',')[0]}</span>
                  <span className="text-[10px] text-slate-500 block truncate">{place.display_name}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="relative rounded-lg border border-brand-border overflow-hidden">
        <div
          ref={mapContainerRef}
          style={{ height, width: '100%' }}
          className="z-0"
        />
        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded text-xs border border-slate-200 z-10 shadow-sm font-mono text-slate-700">
          Lat: {latitude ? latitude.toFixed(4) : '--'}, Lng: {longitude ? longitude.toFixed(4) : '--'}
        </div>
      </div>
    </div>
  );
};
