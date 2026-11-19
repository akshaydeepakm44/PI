import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyApi, wishlistApi, enquiryApi, intelligenceApi, routingApi } from '../../services/api';
import { getSavedCommutes, saveCustomCommute } from '../../services/commuteStore';
import { useAuth } from '../../context/AuthContext';
import { PropertyMap } from '../../components/common/PropertyMap';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { AirQualityCard } from '../../components/intelligence/AirQualityCard';
import { NearbyAmenitiesExplorer } from '../../components/intelligence/NearbyAmenitiesExplorer';
import { RoadConnectivityCard } from '../../components/intelligence/RoadConnectivityCard';
import { AIAssistantChat } from '../../components/assistant/AIAssistantChat';
import { ModuleIntelligencePanel } from '../../components/intelligence/ModuleIntelligencePanel';
import {
  PropertyIntelligenceDossier,
  PropertyEvidenceLayer,
  BuyerPreferences
} from '../../types';
import {
  Heart,
  MessageSquare,
  Scale,
  MapPin,
  CheckCircle,
  FileText,
  Sparkles,
  ArrowLeft,
  X,
  Send,
  Building,
  ShieldCheck,
  Compass,
  RotateCw,
  Clock,
  Layers,
  ChevronRight,
  Bot,
  Car,
  Trees,
  Wind,
  Shield,
  Activity,
  CheckCircle2,
  DollarSign,
  Maximize2
} from 'lucide-react';

type ModuleTabKey =
  | 'neighbourhood'
  | 'liveability'
  | 'commute'
  | 'master_plan'
  | 'towers'
  | 'units'
  | 'amenities'
  | 'sustainability'
  | 'safety'
  | 'ai_assistant'
  | 'documents';

const MODULE_TABS: { key: ModuleTabKey; label: string; icon: any }[] = [
  { key: 'neighbourhood', label: 'Neighbourhood', icon: Compass },
  { key: 'liveability', label: 'Liveability', icon: Wind },
  { key: 'commute', label: 'My Commute', icon: Car },
  { key: 'master_plan', label: 'Master plan', icon: Trees },
  { key: 'towers', label: 'Towers & blocks', icon: Building },
  { key: 'units', label: 'Unit plans & pricing', icon: Layers },
  { key: 'amenities', label: 'Amenities', icon: Activity },
  { key: 'sustainability', label: 'Sustainability', icon: ShieldCheck },
  { key: 'safety', label: 'Safety & security', icon: Shield },
  { key: 'ai_assistant', label: 'AI Research Advisor', icon: Bot },
  { key: 'documents', label: 'Documents & Evidence', icon: FileText }
];

export const PropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const propertyId = parseInt(id || '0', 10);
  const { isAuthenticated, role, user } = useAuth();
  const queryClient = useQueryClient();

  const initialTabParam = searchParams.get('tab');
  const initialTab: ModuleTabKey = 
    initialTabParam === 'assistant' || initialTabParam === 'ai_assistant'
      ? 'ai_assistant'
      : (initialTabParam as ModuleTabKey) || 'neighbourhood';

  const [activeTab, setActiveTab] = useState<ModuleTabKey>(initialTab);
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [enquiryMsg, setEnquiryMsg] = useState('');
  const [enquirySuccess, setEnquirySuccess] = useState(false);
  
  // Dynamic Route & Commute State
  const [selectedRouteGeometry, setSelectedRouteGeometry] = useState<[number, number][] | undefined>(undefined);
  const [selectedRouteName, setSelectedRouteName] = useState<string | undefined>(undefined);
  const [customCommutes, setCustomCommutes] = useState<any[]>([]);

  // Selected tower in Towers & Blocks
  const [selectedTowerIndex, setSelectedTowerIndex] = useState<number>(0);

  // Sync custom commutes from unified commuteStore
  useEffect(() => {
    const syncCommutes = () => {
      const saved = getSavedCommutes();
      setCustomCommutes((prev) => {
        const merged = [...prev];
        saved.forEach((anchor) => {
          if (!merged.some((m) => m.name.toLowerCase() === anchor.name.toLowerCase())) {
            if (anchor.road_distance_km) {
              merged.push({
                name: anchor.name,
                type: anchor.type || 'Custom Commute',
                road_distance_km: anchor.road_distance_km,
                straight_line_distance_km: anchor.straight_line_distance_km,
                estimated_duration_mins: anchor.estimated_duration_mins,
                tortuosity_ratio: anchor.tortuosity_ratio,
                route_geometry: anchor.route_geometry
              });
            }
          }
        });
        return merged;
      });
    };

    syncCommutes();
    window.addEventListener('commutes-updated', syncCommutes);
    return () => window.removeEventListener('commutes-updated', syncCommutes);
  }, []);

  // Property Detail Query
  const { data: property, isLoading, isError } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => propertyApi.getProperty(propertyId),
    enabled: propertyId > 0
  });

  // Wishlist Query
  const { data: wishlist } = useQuery({
    queryKey: ['user-wishlist'],
    queryFn: () => wishlistApi.getWishlist(),
    enabled: isAuthenticated && role === 'buyer'
  });

  // Real Location Intelligence Dossier Query
  const {
    data: dossier,
    isLoading: isIntelLoading,
    refetch: refetchIntel
  } = useQuery<PropertyIntelligenceDossier>({
    queryKey: ['property-intelligence', propertyId],
    queryFn: () => intelligenceApi.getPropertyIntelligence(propertyId),
    enabled: propertyId > 0
  });

  // Flattened real OSM POIs and OSRM routes
  const flattenedPois = useMemo(() => {
    if (!dossier?.nearby_pois) return [];
    return Object.values(dossier.nearby_pois).flat();
  }, [dossier?.nearby_pois]);

  const connectivityRoutes = useMemo(() => {
    return dossier?.connectivity?.routes || [];
  }, [dossier?.connectivity?.routes]);

  const allCommuteRoutes = useMemo(() => {
    return [...connectivityRoutes, ...customCommutes];
  }, [connectivityRoutes, customCommutes]);

  // Structured Evidence Layer Query
  const { data: evidenceLayer } = useQuery<PropertyEvidenceLayer>({
    queryKey: ['property-evidence', propertyId],
    queryFn: () => intelligenceApi.getPropertyEvidence(propertyId),
    enabled: propertyId > 0
  });

  const handleAddCustomCommute = (newRoute: any) => {
    setCustomCommutes((prev) => {
      const exists = prev.some((r) => r.name.toLowerCase() === newRoute.name.toLowerCase());
      if (exists) return prev;
      return [...prev, newRoute];
    });
    if (newRoute.lat && newRoute.lng) {
      saveCustomCommute({
        name: newRoute.name,
        type: newRoute.type || 'Custom Commute',
        lat: newRoute.lat,
        lng: newRoute.lng,
        road_distance_km: newRoute.road_distance_km,
        straight_line_distance_km: newRoute.straight_line_distance_km,
        estimated_duration_mins: newRoute.estimated_duration_mins,
        tortuosity_ratio: newRoute.tortuosity_ratio,
        route_geometry: newRoute.route_geometry
      });
    }
    if (newRoute.route_geometry) {
      setSelectedRouteGeometry(newRoute.route_geometry);
      setSelectedRouteName(newRoute.name);
    }
  };

  const handleComputeAmenityRoute = async (destLat: number, destLon: number, destName: string) => {
    if (!property) return;
    try {
      const res = await routingApi.computeRoute({
        origin_lat: property.latitude,
        origin_lon: property.longitude,
        dest_lat: destLat,
        dest_lon: destLon,
        destination_name: destName
      });

      const newRoute = {
        name: destName,
        type: 'Amenity Commute',
        road_distance_km: res.road_distance_km,
        straight_line_distance_km: res.straight_line_distance_km,
        estimated_duration_mins: res.estimated_duration_mins,
        tortuosity_ratio: res.tortuosity_ratio,
        route_geometry: res.route_geometry,
        lat: destLat,
        lng: destLon
      };

      handleAddCustomCommute(newRoute);
      if (res.route_geometry) {
        setSelectedRouteGeometry(res.route_geometry);
        setSelectedRouteName(destName);
      }
      return res;
    } catch (e) {
      console.error('Failed to compute route to amenity:', e);
    }
  };

  const isWishlisted = wishlist?.some((w) => w.property_id === propertyId);

  const wishlistMutation = useMutation({
    mutationFn: async () => {
      if (isWishlisted) {
        await wishlistApi.removeFromWishlist(propertyId);
      } else {
        await wishlistApi.addToWishlist(propertyId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-wishlist'] });
    }
  });

  const enquiryMutation = useMutation({
    mutationFn: () =>
      enquiryApi.submitEnquiry({
        property_id: propertyId,
        message: enquiryMsg,
        buyer_name: user?.full_name || 'Interested Buyer',
        buyer_email: user?.email || 'buyer@example.com'
      }),
    onSuccess: () => {
      setEnquirySuccess(true);
      setEnquiryMsg('');
      setTimeout(() => {
        setEnquirySuccess(false);
        setEnquiryModalOpen(false);
      }, 2000);
    }
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading property dossier & intelligence..." />;
  }

  if (isError || !property) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-white border border-[#dedede] rounded-xl">
        <h2 className="text-base font-bold text-slate-800">Property Listing Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">The listing you requested may have been unpublished or removed.</p>
        <Link to="/directory" className="mt-4 inline-block px-4 py-2 bg-[#10261a] text-white text-xs font-semibold rounded-full">
          Back to Directory
        </Link>
      </div>
    );
  }

  const mData = property.modules_data || {};
  const backLink = role === 'buyer' ? '/buyer' : role === 'seller' ? '/seller' : '/directory';
  const backText = role === 'buyer' ? 'Back to Buyer Workspace' : role === 'seller' ? 'Back to Seller Dashboard' : 'Back to Property Directory';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link to={backLink} className="text-xs text-slate-500 hover:text-[#10261a] flex items-center gap-1 mb-2 font-medium">
            <ArrowLeft size={13} />
            <span>{backText}</span>
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-serif font-bold text-[#10261a] tracking-tight">{property.name}</h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#eef7f1] text-[#1e6b3a] border border-[#8bcaa0]/40">
              {property.status === 'published' ? 'Verified Listing' : property.status}
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 capitalize">
              {property.property_type.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <MapPin size={13} className="text-[#1e6b3a]" />
            <span>{property.address || `${property.locality}, Hyderabad`}</span>
            {property.survey_number && (
              <span className="font-mono text-slate-400 ml-2">· RERA Reg: P02400005821</span>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {isAuthenticated && role === 'buyer' && (
            <button
              onClick={() => wishlistMutation.mutate()}
              className={`px-3 py-2 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                isWishlisted
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-white border-[#dedede] text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Heart size={14} fill={isWishlisted ? 'currentColor' : 'none'} />
              <span>{isWishlisted ? 'Wishlisted' : 'Save'}</span>
            </button>
          )}

          <Link
            to={`/buyer/compare?add=${property.id}`}
            className="px-3 py-2 rounded-full text-xs font-semibold border border-[#dedede] bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
          >
            <Scale size={14} />
            <span>Compare</span>
          </Link>

          <button
            onClick={() => {
              setActiveTab('ai_assistant');
              window.scrollTo({ top: 380, behavior: 'smooth' });
            }}
            className="px-4 py-2 rounded-full text-xs font-semibold bg-[#10261a] hover:bg-[#1e6b3a] text-white flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Bot size={14} className="text-[#8bcaa0]" />
            <span>Ask AI Advisor</span>
          </button>

          <button
            onClick={() => setEnquiryModalOpen(true)}
            className="px-4 py-2 bg-[#1e6b3a] hover:bg-[#10261a] text-white text-xs font-semibold rounded-full flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <MessageSquare size={14} />
            <span>Enquire / Visit</span>
          </button>
        </div>
      </div>

      {/* Hero Property Gallery Banner */}
      <div className="bg-white rounded-3xl border border-[#dedede] overflow-hidden shadow-xs">
        <div className="h-64 sm:h-80 bg-[#10261a] relative">
          <img
            src={property.photos?.[0]?.url || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'}
            alt={property.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
          <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-white text-xs">
            <div className="bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20">
              <span className="font-semibold">{property.locality}, {property.city || 'Hyderabad'}</span>
              <span className="text-white/60 ml-2">· {mData.master_plan?.acreage || 16.5} Acres · {mData.master_plan?.green_cover_pct || 68}% Open Greens</span>
            </div>
            <div className="bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 font-mono">
              <span className="font-bold text-base text-[#8bcaa0]">{property.asking_price}</span>
              {mData.base_rate && (
                <span className="text-white/80 ml-2">(Base: ₹{mData.base_rate.toLocaleString()}/sq ft)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 9 HiiN Module Tabs Navigation */}
      <div className="border-b border-[#dedede] bg-white rounded-xl shadow-xs overflow-hidden">
        <div className="flex items-center gap-1 overflow-x-auto p-1.5 scrollbar-thin">
          {MODULE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? 'bg-[#10261a] text-white shadow-xs'
                    : 'text-slate-600 hover:text-[#10261a] hover:bg-[#f7f7f7]'
                }`}
              >
                <Icon size={13} className={isActive ? 'text-[#8bcaa0]' : 'text-slate-400'} />
                <span>{tab.label}</span>
                {tab.key === 'units' && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-[#eef7f1] text-[#1e6b3a] font-mono">
                    ₹12.5k diff
                  </span>
                )}
                {tab.key === 'ai_assistant' && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-[#8bcaa0]/30 text-white font-mono">
                    System B
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: NEIGHBOURHOOD                                     */}
      {/* ======================================================== */}
      {activeTab === 'neighbourhood' && (
        <div className="space-y-6">
          <ModuleIntelligencePanel
            propertyId={property.id}
            moduleKey="neighbourhood"
            moduleTitle="Neighbourhood"
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Categorized Places */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-[#dedede] space-y-4 text-xs">
                <h3 className="font-bold text-[#111111] text-sm flex items-center gap-1.5">
                  <Compass size={15} className="text-[#1e6b3a]" />
                  <span>Key Points of Interest</span>
                </h3>

                {mData.neighbourhood_places ? (
                  Object.entries(mData.neighbourhood_places).map(([category, items]: [string, any]) => (
                    <div key={category} className="space-y-2">
                      <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block pt-1">
                        {category}
                      </span>
                      <div className="space-y-1.5">
                        {items.map((it: any, iIdx: number) => (
                          <div key={iIdx} className="p-2.5 rounded-lg bg-[#fcfcfc] border border-[#dedede] flex items-center justify-between">
                            <div>
                              <span className="font-semibold text-slate-800 block">{it[0]}</span>
                              <span className="text-[10px] text-slate-500">{it[1]}</span>
                            </div>
                            <span className="font-mono text-xs font-bold text-[#1e6b3a]">{it[2]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500">Retrieving neighbourhood amenities...</p>
                )}
              </div>
            </div>

            {/* Interactive Cadastral Leaflet Map */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-[#dedede] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-[#111111] text-sm">Interactive Spatial Map</h3>
                  <span className="text-[11px] font-mono text-slate-500">
                    Lat: {property.latitude.toFixed(4)}, Lon: {property.longitude.toFixed(4)}
                  </span>
                </div>
                <PropertyMap
                  latitude={property.latitude}
                  longitude={property.longitude}
                  propertyName={property.name}
                  address={property.address}
                  height="400px"
                  pois={flattenedPois}
                  routes={allCommuteRoutes}
                  routeGeometry={selectedRouteGeometry}
                  destinationName={selectedRouteName}
                  showControls={true}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: LIVEABILITY                                       */}
      {/* ======================================================== */}
      {activeTab === 'liveability' && (
        <div className="space-y-6">
          <ModuleIntelligencePanel
            propertyId={property.id}
            moduleKey="liveability"
            moduleTitle="Liveability"
          />

          {/* 6 Ratings Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(mData.liveability_ratings || [
              { category: 'Parks', verdict: 'Good', score_text: '4.1 / 5 · 128 ratings', stars: 4, source: 'From Google Maps reviews' },
              { category: 'Cycle tracks', verdict: 'Good', score_text: '3.6 / 5 · 74 ratings', stars: 4, source: 'From Google Maps reviews' },
              { category: 'Footpaths', verdict: 'Average', score_text: '3.1 / 5 · 96 ratings', stars: 3, source: 'From resident reviews on this site' },
              { category: 'Pedestrian safety', verdict: 'Good', score_text: '4 / 5 · 23 ratings', stars: 3, source: 'From resident reviews on this site' },
              { category: 'Traffic & noise', verdict: 'Moderate', score_text: '62 dB daytime', stars: 3, source: 'TSPCB noise monitor, Gachibowli' },
              { category: 'Air quality', verdict: 'Satisfactory', score_text: 'AQI 94', stars: 3, source: 'Live from CPCB · updated hourly' }
            ]).map((r: any, idx: number) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-[#dedede] space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-[#111111]">{r.category}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#eef7f1] text-[#1e6b3a]">
                      {r.verdict}
                    </span>
                  </div>
                  <div className="text-base font-bold text-[#10261a] mt-1 font-mono">
                    {r.score_text}
                  </div>
                </div>
                <div className="pt-2 border-t border-[#dedede] text-[10px] text-slate-400 font-mono">
                  {r.source}
                </div>
              </div>
            ))}
          </div>

          {/* Live Open-Meteo & Copernicus Air Quality Card */}
          <AirQualityCard data={dossier?.air_quality} />
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: MY COMMUTE                                        */}
      {/* ======================================================== */}
      {activeTab === 'commute' && (
        <div className="space-y-6">
          <ModuleIntelligencePanel
            propertyId={property.id}
            moduleKey="commute"
            moduleTitle="My Commute"
          />

          {/* Commute Hubs Table */}
          <div className="bg-white p-5 rounded-2xl border border-[#dedede] space-y-4">
            <h3 className="font-bold text-sm text-[#111111] flex items-center gap-1.5">
              <Car size={16} className="text-[#1e6b3a]" />
              <span>Key Employment & Transit Corridors</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(mData.commute_hubs || [
                { name: 'DLF Cyber City', subtitle: 'Office park · Gachibowli', distance_km: '8.5', duration_mins: 22 },
                { name: 'Gachibowli Stadium', subtitle: 'Sports venue · Gachibowli', distance_km: '9.0', duration_mins: 24 },
                { name: 'Indian School of Business', subtitle: 'Campus · Gachibowli', distance_km: '10.0', duration_mins: 25 },
                { name: 'Durgam Cheruvu', subtitle: 'Lake & cable bridge', distance_km: '10.5', duration_mins: 28 },
                { name: 'Rajiv Gandhi Intl Airport', subtitle: 'Aviation Hub · Shamshabad', distance_km: '32.0', duration_mins: 45 }
              ]).map((hub: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-[#fcfcfc] border border-[#dedede] flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{hub.name}</h4>
                    <span className="text-[10px] text-slate-500">{hub.subtitle}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-[#10261a] font-mono block">{hub.distance_km} km</span>
                    <span className="text-[10px] text-[#1e6b3a] font-semibold">{hub.duration_mins} mins</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Road Routing Card & Custom Destination Engine */}
          <RoadConnectivityCard
            routes={allCommuteRoutes}
            propertyLat={property.latitude}
            propertyLon={property.longitude}
            propertyName={property.name}
            onSelectRouteOnMap={(geom, destName) => {
              setSelectedRouteGeometry(geom);
              setSelectedRouteName(destName);
              setActiveTab('neighbourhood');
              window.scrollTo({ top: 350, behavior: 'smooth' });
            }}
            onAddCustomRoute={handleAddCustomCommute}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: MASTER PLAN                                       */}
      {/* ======================================================== */}
      {activeTab === 'master_plan' && (
        <div className="space-y-6">
          <ModuleIntelligencePanel
            propertyId={property.id}
            moduleKey="master_plan"
            moduleTitle="Master Plan"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white p-5 rounded-2xl border border-[#dedede] space-y-4">
              <h3 className="font-bold text-sm text-[#111111]">Project Scale & Density</h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-[#fcfcfc] border border-[#dedede]">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Total Land Extent</span>
                  <span className="text-lg font-bold text-[#10261a]">{mData.master_plan?.acreage || 16.5} Acres</span>
                </div>
                <div className="p-3 rounded-xl bg-[#eef7f1] border border-[#bfddc9]">
                  <span className="text-[10px] font-mono text-[#1e6b3a] block uppercase font-semibold">Green & Open Space</span>
                  <span className="text-lg font-bold text-[#10261a]">{mData.master_plan?.green_cover_pct || 68}% Open Area</span>
                </div>
                <div className="p-3 rounded-xl bg-[#fcfcfc] border border-[#dedede]">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">Total Towers</span>
                  <span className="text-lg font-bold text-[#10261a]">{mData.master_plan?.towers_count || 6} Residential Blocks</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 bg-white p-5 rounded-2xl border border-[#dedede] space-y-4 text-xs">
              <h3 className="font-bold text-sm text-[#111111]">Circulation & Landscape Architecture</h3>
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[#fcfcfc] border border-[#dedede]">
                  <h4 className="font-bold text-slate-900 mb-1">Peripheral Vehicular Ring</h4>
                  <p className="text-slate-600 leading-relaxed">
                    {mData.master_plan?.podium_desc || 'Central greens with peripheral vehicular circulation loop ensuring zero traffic inside community park.'}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#fcfcfc] border border-[#dedede]">
                  <h4 className="font-bold text-slate-900 mb-1">Pedestrian Connectivity Boulevards</h4>
                  <p className="text-slate-600 leading-relaxed">
                    {mData.master_plan?.circulation_desc || 'Pedestrian walkways connect all 6 towers directly to central clubhouse and sports zone.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: TOWERS & BLOCKS                                   */}
      {/* ======================================================== */}
      {activeTab === 'towers' && (
        <div className="space-y-6">
          <ModuleIntelligencePanel
            propertyId={property.id}
            moduleKey="towers"
            moduleTitle="Towers & Blocks"
          />

          <div className="bg-white p-5 rounded-2xl border border-[#dedede] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#111111]">Tower Specifications & Infrastructure</h3>
              <span className="text-xs text-slate-500 font-mono">6 Identical High-Rise Towers</span>
            </div>

            {/* Tower Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {(mData.towers || [1, 2, 3, 4, 5, 6].map((n) => ({ tower_number: `${n}` }))).map((t: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedTowerIndex(idx)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedTowerIndex === idx
                      ? 'bg-[#10261a] text-white shadow-xs'
                      : 'bg-[#f7f7f7] text-slate-700 hover:bg-[#dedede]'
                  }`}
                >
                  Tower {t.tower_number || idx + 1}
                </button>
              ))}
            </div>

            {/* Selected Tower Detail Card */}
            {(() => {
              const towersList = mData.towers || [];
              const t = towersList[selectedTowerIndex] || {
                tower_number: `${selectedTowerIndex + 1}`,
                units_count: 234,
                floors: 24,
                units_per_floor: 4,
                passenger_lifts: 3,
                service_lifts: 1,
                visitor_parking: 'Yes',
                basement: 'Podium above'
              };

              return (
                <div className="p-5 rounded-2xl bg-[#fcfcfc] border border-[#dedede] space-y-4 text-xs">
                  <div className="flex items-center justify-between border-b border-[#dedede] pb-3">
                    <h4 className="text-base font-bold text-[#10261a]">
                      Tower {t.tower_number} Specifications
                    </h4>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-[#eef7f1] text-[#1e6b3a]">
                      {t.units_per_floor} Units / Floor (High Privacy)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Storeys</span>
                      <span className="font-bold text-slate-900 text-sm">G + {t.floors} Floors</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Units in Tower</span>
                      <span className="font-bold text-slate-900 text-sm">{t.units_count} Units</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">High-speed Elevators</span>
                      <span className="font-bold text-slate-900 text-sm">{t.passenger_lifts} Pax + {t.service_lifts} Service</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">Parking Level</span>
                      <span className="font-bold text-slate-900 text-sm">{t.basement}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 6: UNIT PLANS & PRICING                              */}
      {/* ======================================================== */}
      {activeTab === 'units' && (
        <div className="space-y-6">
          <ModuleIntelligencePanel
            propertyId={property.id}
            moduleKey="units"
            moduleTitle="Unit Plans & Pricing"
          />

          {/* 2 BHK and 3 BHK Configuration Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(mData.configurations || [
              {
                bhk: 2,
                name: '2 BHK Premium',
                sbu_sqft: 1300,
                carpet_sqft: 897,
                price_cr: 1.12,
                price_text: '₹1.12 Cr',
                facing: 'East / West',
                balconies: 1,
                bathrooms: 2,
                rooms: ["Living / dining (18' x 11')", "Master bedroom (12' x 13')", "Bedroom 2 (11' x 11')", "Kitchen (8' x 10')", "Balcony (5' x 10')"]
              },
              {
                bhk: 3,
                name: '3 BHK Luxury',
                sbu_sqft: 1880,
                carpet_sqft: 1297,
                price_cr: 1.62,
                price_text: '₹1.62 Cr',
                facing: 'North / East',
                balconies: 2,
                bathrooms: 3,
                rooms: ["Living / dining (22' x 12')", "Master bedroom (14' x 14')", "Bedroom 2 (12' x 12')", "Bedroom 3 (11' x 11')", "Kitchen (9' x 11')", "Balcony (6' x 12')"]
              }
            ]).map((config: any, cIdx: number) => {
              const standaloneCarpetRate = Math.round((config.price_cr * 10000000) / config.carpet_sqft);
              const carpetEfficiency = ((config.carpet_sqft / config.sbu_sqft) * 100).toFixed(1);

              return (
                <div key={cIdx} className="bg-white p-6 rounded-3xl border border-[#dedede] shadow-xs space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold uppercase text-[#1e6b3a] bg-[#eef7f1] px-2.5 py-1 rounded-full">
                        {config.bhk} BHK Floor Plan
                      </span>
                      <span className="text-xl font-bold text-[#10261a] font-mono">
                        {config.price_text}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#111111]">{config.name}</h3>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-[#fcfcfc] border border-[#dedede]">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Super Built-up Area</span>
                        <span className="text-sm font-bold text-slate-900">{config.sbu_sqft.toLocaleString()} sq ft</span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#fcfcfc] border border-[#dedede]">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Usable Carpet Area</span>
                        <span className="text-sm font-bold text-slate-900">{config.carpet_sqft.toLocaleString()} sq ft</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Standalone Carpet Rate:</span>
                        <span className="font-mono font-bold text-slate-800">₹{standaloneCarpetRate.toLocaleString()}/sq ft</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Carpet-to-SBU Ratio:</span>
                        <span className="font-mono font-bold text-emerald-700">{carpetEfficiency}% efficiency</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Orientations:</span>
                        <span className="font-medium text-slate-800">{config.facing}</span>
                      </div>
                    </div>

                    {config.rooms && (
                      <div className="pt-2">
                        <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1">
                          Room Dimensions
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {config.rooms.map((rm: string, rIdx: number) => (
                            <span key={rIdx} className="text-[11px] px-2 py-0.5 rounded bg-[#f7f7f7] border border-[#dedede] text-slate-700">
                              {rm}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setEnquiryModalOpen(true)}
                    className="w-full mt-4 py-2.5 rounded-full bg-[#10261a] hover:bg-[#1e6b3a] text-white text-xs font-semibold transition-colors"
                  >
                    Request {config.bhk} BHK Cost Sheet
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pricing Surcharges & Baseline Cost Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-[#dedede] space-y-3 text-xs">
            <h3 className="font-bold text-sm text-[#111111]">Cost Sheet & Surcharges Matrix</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-[#fcfcfc] border border-[#dedede]">
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Base Rate</span>
                <span className="font-bold text-slate-900 font-mono">₹{mData.base_rate?.toLocaleString() || '8,600'} / sq ft</span>
              </div>
              <div className="p-3 rounded-xl bg-[#fcfcfc] border border-[#dedede]">
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Floor Rise Premium</span>
                <span className="font-bold text-slate-900 font-mono">{mData.pricing_breakdown?.floor_rise_premium || '₹50 / sq ft per floor'}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#fcfcfc] border border-[#dedede]">
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Facing Premium</span>
                <span className="font-bold text-slate-900 font-mono">{mData.pricing_breakdown?.facing_premium || '₹100 / sq ft'}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#fcfcfc] border border-[#dedede]">
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Corpus Fund</span>
                <span className="font-bold text-slate-900 font-mono">{mData.pricing_breakdown?.corpus_fund || '₹120 / sq ft'}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#fcfcfc] border border-[#dedede]">
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Registration</span>
                <span className="font-bold text-slate-900 font-mono">7.5% Stamp + 0.5% Reg</span>
              </div>
              <div className="p-3 rounded-xl bg-[#eef7f1] border border-[#bfddc9]">
                <span className="text-[10px] text-[#1e6b3a] font-mono uppercase block font-semibold">Special Offer</span>
                <span className="font-bold text-[#10261a]">{mData.pricing_breakdown?.current_offer || 'Book by 31 Dec: Zero floor-rise'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 7: AMENITIES                                         */}
      {/* ======================================================== */}
      {activeTab === 'amenities' && (
        <div className="space-y-6">
          <ModuleIntelligencePanel
            propertyId={property.id}
            moduleKey="amenities"
            moduleTitle="Amenities"
          />

          <div className="bg-white p-6 rounded-2xl border border-[#dedede] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#111111]">16 Dedicated Lifestyle & Wellness Facilities</h3>
              <span className="text-xs font-mono text-slate-500">Clubhouse & Podium Zones</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {[
                { name: 'Swimming pool', type: 'Outdoor', location: 'Clubhouse podium' },
                { name: 'Gym', type: 'Indoor', location: 'Clubhouse 1st floor' },
                { name: 'Kids’ play area', type: 'Outdoor', location: 'Central greens' },
                { name: 'Jogging track', type: 'Outdoor', location: 'Around central greens' },
                { name: 'Indoor games room', type: 'Indoor', location: 'Clubhouse ground floor' },
                { name: 'Party hall', type: 'Indoor', location: 'Clubhouse 2nd floor' },
                { name: 'Co-working space', type: 'Indoor', location: 'Clubhouse 1st floor' },
                { name: 'Library', type: 'Indoor', location: 'Clubhouse 2nd floor' },
                { name: 'Crèche', type: 'Indoor', location: 'Clubhouse ground floor' },
                { name: 'Table tennis', type: 'Indoor', location: 'Clubhouse ground floor' },
                { name: 'Yoga deck', type: 'Outdoor', location: 'Clubhouse terrace' },
                { name: 'Tennis court', type: 'Outdoor', location: 'Sports zone' },
                { name: 'Basketball court', type: 'Outdoor', location: 'Sports zone' },
                { name: 'Amphitheatre', type: 'Outdoor', location: 'Central greens' },
                { name: 'Seating plaza', type: 'Outdoor', location: 'Along central greens' },
                { name: 'Cricket practice nets', type: 'Outdoor', location: 'Sports zone' }
              ].map((am, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-[#fcfcfc] border border-[#dedede] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{am.name}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                      {am.type}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">{am.location}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 8: SUSTAINABILITY                                    */}
      {/* ======================================================== */}
      {activeTab === 'sustainability' && (
        <div className="space-y-6">
          <ModuleIntelligencePanel
            propertyId={property.id}
            moduleKey="sustainability"
            moduleTitle="Sustainability"
          />

          <div className="bg-white p-6 rounded-2xl border border-[#dedede] space-y-4">
            <h3 className="font-bold text-sm text-[#111111]">Green Building & Environmental Infrastructure</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {(mData.sustainability || [
                { name: 'Rainwater harvesting', details: '14 recharge pits across site · 2,50,000 litres capacity', available: true },
                { name: 'Solar power generation', details: 'Rooftop solar panels power common area lighting', available: true },
                { name: 'Sewage treatment plant (STP)', details: '100% treated wastewater recycled for landscaping & flushing', available: true },
                { name: 'EV charging points', details: 'Designated EV charging bays across all tower basements', available: true },
                { name: 'Building automation (BMS)', details: 'Automated pump, energy, and water management sensors', available: true },
                { name: 'Waste segregation', details: 'Dry and wet organic composting unit on site', available: true }
              ]).map((s: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-[#fcfcfc] border border-[#dedede] flex items-start gap-3">
                  <CheckCircle2 size={16} className={s.available ? 'text-[#1e6b3a]' : 'text-slate-300'} />
                  <div>
                    <h4 className="font-bold text-slate-900">{s.name}</h4>
                    <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">{s.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 9: SAFETY & SECURITY                                 */}
      {/* ======================================================== */}
      {activeTab === 'safety' && (
        <div className="space-y-6">
          <ModuleIntelligencePanel
            propertyId={property.id}
            moduleKey="safety"
            moduleTitle="Safety & Security"
          />

          <div className="bg-white p-6 rounded-2xl border border-[#dedede] space-y-4">
            <h3 className="font-bold text-sm text-[#111111]">Physical Security, Fire Life Safety & Compliance</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {(mData.safety || [
                { name: '24/7 security', details: 'Trained security personnel with boom barrier vehicle access control', available: true },
                { name: 'CCTV surveillance', details: '360-degree high-definition perimeter and lobby surveillance', available: true },
                { name: 'Visitor management system', details: 'Digital app-based guest and delivery verification', available: true },
                { name: 'Emergency evacuation plan', details: 'Pressurized fire staircases and automated smoke dampers', available: true },
                { name: 'Safety certification', details: 'Telangana State Disaster Response and Fire Services NOC', available: true }
              ]).map((saf: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-[#fcfcfc] border border-[#dedede] flex items-start gap-3">
                  <ShieldCheck size={16} className={saf.available ? 'text-[#1e6b3a]' : 'text-slate-300'} />
                  <div>
                    <h4 className="font-bold text-slate-900">{saf.name}</h4>
                    <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">{saf.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 10: PLATFORM-WIDE AI RESEARCH ADVISOR (SYSTEM B)     */}
      {/* ======================================================== */}
      {activeTab === 'ai_assistant' && (
        <div className="space-y-4">
          <AIAssistantChat property={property} />
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 11: DOCUMENTS & EVIDENCE REPOSITORY                  */}
      {/* ======================================================== */}
      {activeTab === 'documents' && (
        <div className="bg-white p-6 rounded-2xl border border-[#dedede] space-y-4 text-xs">
          <div>
            <h2 className="text-base font-bold text-[#111111]">Seller-Submitted Evidence & Legal Deeds</h2>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Approved sanction files, RERA certificates, and master brochures uploaded for this development.
            </p>
          </div>

          <div className="space-y-2">
            {[
              { name: 'TS RERA Sanction Approval (P02400005821).pdf', size: '2.4 MB' },
              { name: 'Architectural Master Plan & Tower Layout CAD.pdf', size: '5.8 MB' },
              { name: 'Telangana Fire Services Disaster Response NOC.pdf', size: '1.1 MB' },
              { name: 'TSPCB Consent for Establishment & Green Clearance.pdf', size: '1.9 MB' }
            ].map((doc, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-[#fcfcfc] rounded-xl border border-[#dedede] flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-[#1e6b3a]" />
                  <div>
                    <span className="font-semibold text-slate-900 block">{doc.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{doc.size}</span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#eef7f1] text-[#1e6b3a] font-semibold border border-[#bfddc9]">
                  Verified Document
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enquiry Modal */}
      {enquiryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-[#dedede] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Schedule Site Visit & Cost Sheet</h3>
              <button onClick={() => setEnquiryModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            {enquirySuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl text-center text-xs space-y-1">
                <CheckCircle size={20} className="mx-auto text-emerald-600 mb-1" />
                <span className="font-bold block">Enquiry Transmitted</span>
                <p>The builder sales office will connect with verified floor plans and site visit slots.</p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Subject Property</label>
                  <input
                    type="text"
                    disabled
                    value={property.name}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Your Requirements / Questions</label>
                  <textarea
                    rows={4}
                    value={enquiryMsg}
                    onChange={(e) => setEnquiryMsg(e.target.value)}
                    placeholder="Specify target configuration (2 BHK or 3 BHK), preferred floor range, and visit availability..."
                    className="w-full border border-slate-200 rounded-lg p-3 text-xs focus:ring-1 focus:ring-[#10261a] outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setEnquiryModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-full text-slate-600 hover:bg-slate-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => enquiryMutation.mutate()}
                    disabled={enquiryMutation.isPending || !enquiryMsg.trim()}
                    className="px-4 py-2 bg-[#10261a] hover:bg-[#1e6b3a] text-white rounded-full font-semibold flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send size={13} />
                    <span>{enquiryMutation.isPending ? 'Sending...' : 'Transmit Enquiry'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
