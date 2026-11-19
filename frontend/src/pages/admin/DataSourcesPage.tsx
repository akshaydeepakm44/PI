import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api';
import { Database, CheckCircle, Activity, Wifi, RotateCw, AlertTriangle, ShieldCheck, ExternalLink, Info } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const DataSourcesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isPinging, setIsPinging] = useState(false);

  const { data: sources, isLoading } = useQuery({
    queryKey: ['admin-sources'],
    queryFn: () => adminApi.getDataSources()
  });

  const pingMutation = useMutation({
    mutationFn: () => adminApi.pingLiveSources(),
    onMutate: () => setIsPinging(true),
    onSuccess: (updatedSources) => {
      queryClient.setQueryData(['admin-sources'], updatedSources);
    },
    onSettled: () => setIsPinging(false)
  });

  if (isLoading) {
    return <LoadingSpinner message="Checking external data providers status..." />;
  }

  // Provider documentation & access policies mapping
  const providerPolicies: Record<string, {
    attribution: string;
    rateLimit: string;
    auth: string;
    caching: string;
    docUrl: string;
  }> = {
    'OpenStreetMap Nominatim': {
      attribution: 'OpenStreetMap contributors under ODbL license',
      rateLimit: 'Max 1 request / second (strictly enforced via backend RateLimiter)',
      auth: 'Custom User-Agent header (HI-IN-PropertyDirectory/2.0); no client secret exposed',
      caching: 'Results cached for 7 days in memory and database',
      docUrl: 'https://operations.osmfoundation.org/policies/nominatim/'
    },
    'OpenStreetMap Overpass API': {
      attribution: 'OpenStreetMap contributors under ODbL license',
      rateLimit: '2 concurrent slots, 10s query timeout with automatic public mirror fallbacks',
      auth: 'Anonymous HTTP POST with bounded QL queries',
      caching: 'POIs cached per property coordinate radius',
      docUrl: 'https://wiki.openstreetmap.org/wiki/Overpass_API'
    },
    'OSRM Road Routing Engine': {
      attribution: 'Project OSRM / OpenStreetMap routing graph',
      rateLimit: 'Demonstration public endpoint; bounded requests with road graph caching',
      auth: 'No secret required; strictly vehicular road graph without live traffic',
      caching: 'Route distances and turn geometry cached for 3 days',
      docUrl: 'http://project-osrm.org/'
    },
    'Open-Meteo Air Quality (CAMS)': {
      attribution: 'Copernicus Atmosphere Monitoring Service (CAMS) & Open-Meteo',
      rateLimit: 'Free non-commercial tier: up to 10,000 daily API calls',
      auth: 'No API key required for non-commercial research tier',
      caching: 'Hourly air quality observations cached for 3 hours',
      docUrl: 'https://open-meteo.com/en/docs/air-quality-api'
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Live Ping Action */}
      <div className="bg-white p-6 rounded-lg border border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">External Geospatial & Environmental Providers</h1>
          <p className="text-xs text-slate-500 mt-1">
            Live operational status, measured round-trip latencies, access policies, and compliance attributions.
          </p>
        </div>

        <button
          onClick={() => pingMutation.mutate()}
          disabled={isPinging}
          className="px-4 py-2 bg-brand-primary text-white font-semibold rounded text-xs flex items-center gap-2 hover:bg-brand-primaryHover disabled:opacity-50 self-start sm:self-auto"
        >
          <RotateCw size={13} className={isPinging ? 'animate-spin' : ''} />
          <span>{isPinging ? 'Pinging All Providers...' : 'Ping All Live Providers'}</span>
        </button>
      </div>

      {/* Security & Access Policy Notice */}
      <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-start gap-2.5">
        <ShieldCheck size={16} className="text-emerald-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold block">Zero-Secret Exposure Architecture</span>
          <p className="text-[11px] text-emerald-800 leading-relaxed">
            All external API interactions are orchestrated exclusively through backend micro-services (`backend/app/services/`). API keys, custom user-agents, and private headers are protected by server-side environment variables and are never forwarded to the browser or stored in client-side bundles.
          </p>
        </div>
      </div>

      {/* Providers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources?.map((src) => {
          const policy = providerPolicies[src.name] || {
            attribution: 'Open-access public provider',
            rateLimit: 'Bounded with rate limiter',
            auth: 'Server-side only',
            caching: 'In-memory TTL cache',
            docUrl: '#'
          };

          return (
            <div key={src.id} className="bg-white p-5 rounded-lg border border-brand-border text-xs space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Database size={16} className="text-slate-700" />
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{src.name}</h3>
                    <span className="text-[10px] text-slate-400 font-mono uppercase">{src.source_type}</span>
                  </div>
                </div>
                <Badge
                  variant={src.status === 'healthy' ? 'verified' : src.status === 'degraded' ? 'warn' : 'unverified'}
                  className="capitalize"
                >
                  {src.status}
                </Badge>
              </div>

              {/* Observed Latency & Health */}
              <div className="p-3 bg-slate-50 rounded border border-slate-200 grid grid-cols-2 gap-3 text-[11px] font-mono">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase">Measured Round-Trip</span>
                  <span className={`font-bold flex items-center gap-1 ${
                    src.latency_ms > 2000 ? 'text-amber-600' : 'text-emerald-700'
                  }`}>
                    <Activity size={12} /> {src.latency_ms} ms
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase">Last Health Verification</span>
                  <span className="text-slate-800 font-semibold">
                    {new Date(src.last_checked).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Access Policy & Attribution */}
              <div className="space-y-1.5 pt-1 text-[11px] text-slate-600">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-400 text-[10px] font-mono uppercase shrink-0">Rate Policy:</span>
                  <span className="text-right text-slate-700">{policy.rateLimit}</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-400 text-[10px] font-mono uppercase shrink-0">Attribution:</span>
                  <span className="text-right text-slate-700">{policy.attribution}</span>
                </div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-400 text-[10px] font-mono uppercase shrink-0">Caching:</span>
                  <span className="text-right text-slate-700">{policy.caching}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Endpoint: {src.source_type}</span>
                <a
                  href={policy.docUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  <span>Policy Docs</span>
                  <ExternalLink size={10} />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
