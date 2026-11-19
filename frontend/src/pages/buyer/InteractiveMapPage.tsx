import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { propertyApi } from '../../services/api';
import L from 'leaflet';
import { MapPin, Building, ArrowRight, RotateCw } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const InteractiveMapPage: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const [selectedType, setSelectedType] = useState<string>('All');

  const { data: properties, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['public-properties'],
    queryFn: () => propertyApi.getProperties(),
    staleTime: 0,
    refetchOnMount: 'always'
  });

  const filteredProperties = properties?.filter((p) => {
    if (selectedType === 'All') return true;
    return p.property_type === selectedType;
  });

  useEffect(() => {
    if (!mapContainerRef.current || !filteredProperties) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const defaultLat = 17.7600;
    const defaultLng = 83.3400;

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 12,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    const validMarkers = filteredProperties.filter(
      (p) =>
        typeof p.latitude === 'number' &&
        typeof p.longitude === 'number' &&
        !isNaN(p.latitude) &&
        !isNaN(p.longitude) &&
        p.latitude >= -90 &&
        p.latitude <= 90 &&
        p.longitude >= -180 &&
        p.longitude <= 180 &&
        !(p.latitude === 0 && p.longitude === 0)
    );

    validMarkers.forEach((p) => {
      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="background:#0f172a;color:#fff;padding:4px 9px;border-radius:14px;font-size:10px;font-weight:bold;display:flex;align-items:center;gap:6px;box-shadow:0 4px 10px rgba(0,0,0,0.3);border:2px solid #fff;white-space:nowrap">
            <span>${p.name}</span>
            <span style="background:#2563eb;color:#fff;padding:1px 6px;border-radius:8px;font-size:9px;font-mono">${p.asking_price || ''}</span>
          </div>
        `,
        iconSize: [160, 26],
        iconAnchor: [80, 13]
      });

      const marker = L.marker([p.latitude, p.longitude], { icon: customIcon }).addTo(map);

      marker.bindPopup(`
        <div style="font-family:sans-serif;min-width:180px;padding:4px">
          <strong style="font-size:13px;color:#0f172a;display:block">${p.name}</strong>
          <span style="font-size:11px;color:#64748b;display:block">${p.locality}, ${p.city}</span>
          <span style="font-size:12px;font-weight:bold;color:#111827;display:block;margin-top:4px">${p.asking_price}</span>
          <a href="/properties/${p.id}" style="display:inline-block;margin-top:6px;font-size:11px;color:#2563eb;text-decoration:underline">
            View Details & Dossier →
          </a>
        </div>
      `);
    });

    if (validMarkers.length > 0) {
      const bounds = L.latLngBounds(validMarkers.map(p => [p.latitude, p.longitude]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }

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
  }, [filteredProperties]);

  if (isLoading) {
    return <LoadingSpinner message="Plotting properties on OpenStreetMap canvas..." />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-lg border border-brand-border">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Interactive Spatial Directory</h1>
          <p className="text-xs text-slate-500">
            Real coordinates anchored to OpenStreetMap tiles. Showing {filteredProperties?.length || 0} properties.
          </p>
        </div>

        {/* Filter Pills & Refresh Button */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
            title="Reload all stored coordinates fresh from database"
          >
            <RotateCw size={12} className={isFetching ? 'animate-spin text-blue-600' : 'text-slate-500'} />
            <span>{isFetching ? 'Refreshing...' : 'Refresh Map Data'}</span>
          </button>
          {['All', 'apartment', 'villa', 'residential_plot'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${
                selectedType === type
                  ? 'bg-brand-primary text-white border-brand-primary'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {type.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Map Canvas */}
      <div className="bg-white rounded-lg border border-brand-border overflow-hidden relative shadow-xs">
        <div ref={mapContainerRef} style={{ height: 'calc(100vh - 220px)', width: '100%' }} className="z-0" />
      </div>
    </div>
  );
};
