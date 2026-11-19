import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyApi, wishlistApi, enquiryApi, intelligenceApi, routingApi } from '../../services/api';
import { getSavedCommutes, saveCustomCommute, SavedCommuteAnchor } from '../../services/commuteStore';
import { useAuth } from '../../context/AuthContext';
import { PropertyMap } from '../../components/common/PropertyMap';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { AirQualityCard } from '../../components/intelligence/AirQualityCard';
import { NearbyAmenitiesExplorer } from '../../components/intelligence/NearbyAmenitiesExplorer';
import { RoadConnectivityCard } from '../../components/intelligence/RoadConnectivityCard';
import { AIPropertyIntelligenceCard } from '../../components/intelligence/AIPropertyIntelligenceCard';
import { AIAssistantChat } from '../../components/assistant/AIAssistantChat';
import {
  PropertyIntelligenceDossier,
  PropertyReportResponse,
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
  Bot
} from 'lucide-react';

export const PropertyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const propertyId = parseInt(id || '0', 10);
  const { isAuthenticated, role, user } = useAuth();
  const queryClient = useQueryClient();

  const initialTab = searchParams.get('tab') === 'assistant' || searchParams.get('tab') === 'ai_assistant'
    ? 'ai_assistant'
    : 'overview';
  const [activeTab, setActiveTab] = useState<'overview' | 'ai_assistant' | 'ai_engine' | 'location' | 'documents' | 'raw_dossier'>(initialTab);
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [enquiryMsg, setEnquiryMsg] = useState('');
  const [enquirySuccess, setEnquirySuccess] = useState(false);
  
  // Dynamic Route & Commute State
  const [selectedRouteGeometry, setSelectedRouteGeometry] = useState<[number, number][] | undefined>(undefined);
  const [selectedRouteName, setSelectedRouteName] = useState<string | undefined>(undefined);
  const [customCommutes, setCustomCommutes] = useState<any[]>([]);

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

  // On-demand AI generation flag (strictly wait for user to click button)
  const [aiRequested, setAiRequested] = useState(false);
  const [isRefreshingIntel, setIsRefreshingIntel] = useState(false);
  const [isRefreshingReport, setIsRefreshingReport] = useState(false);

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

  // Combined routes: default regional routes + user-added custom commute routes
  const allCommuteRoutes = useMemo(() => {
    return [...connectivityRoutes, ...customCommutes];
  }, [connectivityRoutes, customCommutes]);

  // Structured Evidence Layer Query
  const {
    data: evidenceLayer,
    refetch: refetchEvidence
  } = useQuery<PropertyEvidenceLayer>({
    queryKey: ['property-evidence', propertyId],
    queryFn: () => intelligenceApi.getPropertyEvidence(propertyId),
    enabled: propertyId > 0
  });

  // AI Property Intelligence Report Query - ONLY runs when user explicitly requests it
  const {
    data: aiReport,
    isLoading: isReportLoading,
    refetch: refetchReport
  } = useQuery<PropertyReportResponse>({
    queryKey: ['property-ai-report', propertyId],
    queryFn: () => intelligenceApi.getPropertyReport(propertyId),
    enabled: propertyId > 0 && aiRequested
  });

  const handleTriggerAiReport = async (prefs?: BuyerPreferences) => {
    setAiRequested(true);
    try {
      setIsRefreshingReport(true);
      await intelligenceApi.generatePropertyReport(propertyId, prefs, true);
      await refetchReport();
      await refetchEvidence();
      queryClient.invalidateQueries({ queryKey: ['property-ai-report', propertyId] });
    } catch (e) {
      console.error('Failed to generate/refresh AI report:', e);
    } finally {
      setIsRefreshingReport(false);
    }
  };

  const handleRefreshIntel = async () => {
    try {
      setIsRefreshingIntel(true);
      await intelligenceApi.refreshPropertyIntelligence(propertyId);
      await refetchIntel();
      await refetchEvidence();
      if (aiRequested) {
        await refetchReport();
      }
    } catch (e) {
      console.error('Failed to refresh intelligence:', e);
    } finally {
      setIsRefreshingIntel(false);
    }
  };

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
    setAiRequested(true);
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

  // Wishlist toggle mutation
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

  // Submit Enquiry Mutation
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
    return <LoadingSpinner message="Loading property dossier & map coordinates..." />;
  }

  if (isError || !property) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center bg-white border border-brand-border rounded-lg">
        <h2 className="text-base font-bold text-slate-800">Property Listing Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">The listing you requested may have been unpublished or removed.</p>
        <Link to="/directory" className="mt-4 inline-block px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded">
          Back to Directory
        </Link>
      </div>
    );
  }

  // Determine back navigation based on authenticated role
  const backLink = role === 'buyer' ? '/buyer' : role === 'seller' ? '/seller' : '/directory';
  const backText = role === 'buyer' ? 'Back to Buyer Workspace' : role === 'seller' ? 'Back to Seller Dashboard' : 'Back to Property Directory';

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link to={backLink} className="text-xs text-slate-500 hover:text-black flex items-center gap-1 mb-2 font-medium">
            <ArrowLeft size={13} />
            <span>{backText}</span>
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{property.name}</h1>
            {property.is_demo && <Badge variant="demo">Demo data</Badge>}
            <Badge variant="unverified">{property.verification_status}</Badge>
            <Badge variant="published" className="capitalize">{property.property_type.replace('_', ' ')}</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <MapPin size={13} className="text-slate-400" />
            <span>{property.address}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {isAuthenticated && role === 'buyer' && (
            <button
              onClick={() => wishlistMutation.mutate()}
              className={`px-3 py-2 rounded text-xs font-semibold border flex items-center gap-1.5 transition-colors ${
                isWishlisted
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Heart size={14} fill={isWishlisted ? 'currentColor' : 'none'} />
              <span>{isWishlisted ? 'Wishlisted' : 'Save'}</span>
            </button>
          )}

          <Link
            to={`/buyer/compare?add=${property.id}`}
            className="px-3 py-2 rounded text-xs font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
          >
            <Scale size={14} />
            <span>Compare</span>
          </Link>

          <button
            onClick={() => {
              setActiveTab('ai_assistant');
              window.scrollTo({ top: 380, behavior: 'smooth' });
            }}
            className="px-3.5 py-2 rounded text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Bot size={14} className="text-white" />
            <span>Ask AI</span>
            <span className="text-[10px] px-1 py-0.2 rounded bg-indigo-500/50 text-indigo-100 font-normal">Demo</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('ai_engine');
              if (!aiRequested) {
                setAiRequested(true);
              }
            }}
            className="px-3.5 py-2 rounded text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Sparkles size={14} className="text-amber-300" />
            <span>AI Property Intelligence</span>
          </button>

          <button
            onClick={() => setEnquiryModalOpen(true)}
            className="px-4 py-2 bg-brand-primary hover:bg-brand-primaryHover text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <MessageSquare size={14} />
            <span>Enquire Now</span>
          </button>
        </div>
      </div>

      {/* Photo Gallery Banner */}
      <div className="bg-white rounded-lg border border-brand-border overflow-hidden">
        <div className="h-72 sm:h-96 bg-slate-900 relative">
          <img
            src={property.photos?.[0]?.url || '/assets/ramez_seapoint.jpg'}
            alt={property.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs">
            <div className="bg-slate-950/80 backdrop-blur-xs px-3 py-1.5 rounded border border-white/20">
              <span className="font-semibold">{property.locality}, Visakhapatnam</span>
            </div>
            <div className="bg-slate-950/80 backdrop-blur-xs px-3 py-1.5 rounded border border-white/20 font-mono">
              <span className="font-bold text-base text-emerald-400">{property.asking_price}</span>
              {property.rate_per_sqft && (
                <span className="text-slate-300 ml-2">(₹{property.rate_per_sqft.toLocaleString()}/sq.ft)</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-brand-border">
        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-4 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'overview' ? 'border-brand-primary text-slate-900 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Overview & Specifications
          </button>
          <button
            onClick={() => setActiveTab('ai_assistant')}
            className={`py-3 px-4 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'ai_assistant' ? 'border-indigo-600 text-indigo-900 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bot size={13} className={activeTab === 'ai_assistant' ? 'text-indigo-600' : 'text-slate-400'} />
            <span>AI Property Assistant</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-semibold bg-indigo-100 text-indigo-700">Demo</span>
          </button>
          <button
            onClick={() => setActiveTab('ai_engine')}
            className={`py-3 px-4 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'ai_engine' ? 'border-blue-600 text-blue-900 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles size={13} className="text-amber-500" />
            <span>AI Property Intelligence</span>
            {aiReport && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" title="AI Report Active"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('location')}
            className={`py-3 px-4 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'location' ? 'border-brand-primary text-slate-900 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Map & Road Access
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3 px-4 border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'documents' ? 'border-brand-primary text-slate-900 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Documents & Evidence ({property.documents?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('raw_dossier')}
            className={`py-3 px-4 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'raw_dossier' ? 'border-brand-primary text-slate-900 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Compass size={13} className="text-slate-500" />
            <span>Location Research Telemetry</span>
            {dossier?.status === 'completed' && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" title="Research Completed"></span>
            )}
          </button>
        </div>
      </div>

      {/* TAB CONTENT: AI PROPERTY ASSISTANT (CHAT MOCKUP) */}
      {activeTab === 'ai_assistant' && (
        <div className="space-y-4">
          <AIAssistantChat property={property} />
        </div>
      )}

      {/* TAB CONTENT 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Description Card */}
            <div className="bg-white p-5 rounded-lg border border-brand-border text-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900">Project Description</h2>
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">{property.description}</p>
            </div>

            {/* Specifications Matrix */}
            <div className="bg-white p-5 rounded-lg border border-brand-border text-xs space-y-3">
              <h2 className="text-sm font-bold text-slate-900">Structured Specifications</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Property Type</span>
                  <span className="font-semibold text-slate-800 capitalize">{property.property_type.replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Built-up / Plot Area</span>
                  <span className="font-semibold text-slate-800">{property.area} {property.area_unit}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Construction Status</span>
                  <span className="font-semibold text-slate-800">{property.construction_status}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Road Access</span>
                  <span className="font-semibold text-slate-800">{property.road_access_m ? `${property.road_access_m} meters` : 'Standard access'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Frontage</span>
                  <span className="font-semibold text-slate-800">{property.frontage_m ? `${property.frontage_m} meters` : 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Possession Date</span>
                  <span className="font-semibold text-slate-800">{property.possession_date}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Floors / Towers</span>
                  <span className="font-semibold text-slate-800">{property.floors || '--'} Floors / {property.towers || '--'} Towers</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Total Units</span>
                  <span className="font-semibold text-slate-800">{property.unit_count || 'Unspecified'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Survey Number</span>
                  <span className="font-semibold text-slate-800 font-mono">{property.survey_number || 'Under verification'}</span>
                </div>
              </div>
            </div>

            {/* Amenities & Utilities */}
            <div className="bg-white p-5 rounded-lg border border-brand-border text-xs space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 mb-2">Amenities Provided</h3>
                <div className="flex gap-1.5 flex-wrap">
                  {property.amenities?.map((am, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded bg-slate-100 text-slate-700 text-xs border border-slate-200">
                      {am}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <h3 className="font-bold text-slate-900 mb-2">Utilities & Infrastructure</h3>
                <div className="flex gap-1.5 flex-wrap">
                  {property.utilities?.map((ut, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded bg-blue-50 text-blue-800 text-xs border border-blue-200">
                      {ut}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Developer & Location Map Preview */}
          <div className="space-y-6">
            {/* Developer Contact Card */}
            <div className="bg-white p-5 rounded-lg border border-brand-border text-xs space-y-3">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Seller / Builder Information</span>
              <h3 className="font-bold text-sm text-slate-900">{property.seller_name}</h3>
              <p className="text-slate-500 text-[11px] font-mono">{property.seller_contact}</p>
              {property.developer_profile && (
                <p className="text-slate-600 leading-relaxed border-t border-slate-100 pt-2">{property.developer_profile}</p>
              )}
              <button
                onClick={() => setEnquiryModalOpen(true)}
                className="w-full mt-3 py-2 bg-brand-primary text-white font-semibold rounded text-center hover:bg-brand-primaryHover transition-colors"
              >
                Schedule Site Visit
              </button>
            </div>

            {/* Mini Map Preview */}
            <div className="bg-white p-4 rounded-lg border border-brand-border space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">Stored Cadastral Coordinates</span>
                <span className="font-mono text-[10px] text-blue-700">
                  {property.latitude.toFixed(4)}, {property.longitude.toFixed(4)}
                </span>
              </div>
              <PropertyMap
                latitude={property.latitude}
                longitude={property.longitude}
                propertyName={property.name}
                address={property.address}
                height="220px"
              />
              <span className="text-[10px] text-slate-400 block text-center font-mono">
                Actual stored coordinates • Leaflet Map Canvas
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: LOCATION & MAP */}
      {activeTab === 'location' && (
        <div className="bg-white p-6 rounded-lg border border-brand-border space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">Cadastral Location & Road Connectivity</h2>
              <p className="text-xs text-slate-500 mt-0.5">Stored coordinates displayed on standard Leaflet OpenStreetMap canvas.</p>
            </div>
            <div className="font-mono text-xs bg-slate-100 px-3 py-1 rounded border border-slate-200">
              Lat: {property.latitude.toFixed(5)}, Lng: {property.longitude.toFixed(5)}
            </div>
          </div>

          <PropertyMap
            latitude={property.latitude}
            longitude={property.longitude}
            propertyName={property.name}
            address={property.address}
            height="460px"
            pois={flattenedPois}
            routes={allCommuteRoutes}
            routeGeometry={selectedRouteGeometry}
            destinationName={selectedRouteName}
            showControls={true}
            aiActivated={aiRequested}
            onActivateAi={() => {
              setActiveTab('ai_engine');
              handleTriggerAiReport();
            }}
            onSelectRoute={(geom, destName) => {
              setSelectedRouteGeometry(geom);
              setSelectedRouteName(destName);
            }}
            onComputeAmenityRoute={handleComputeAmenityRoute}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">Road Access</span>
              <span className="font-bold text-slate-900">{property.road_access_m || '15'} Meter Municipal Road</span>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">Frontage</span>
              <span className="font-bold text-slate-900">{property.frontage_m || '30'} Meters Plot Frontage</span>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">Locality Node</span>
              <span className="font-bold text-slate-900">{property.locality}, Visakhapatnam</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="bg-white p-6 rounded-lg border border-brand-border space-y-4 text-xs">
          <div>
            <h2 className="text-base font-bold text-slate-900">Seller-Submitted Evidence & Legal Deeds</h2>
            <p className="text-slate-500 text-[11px] mt-0.5">
              Files uploaded by developer. Clearly labeled unverified until third-party legal vetting.
            </p>
          </div>

          {!property.documents || property.documents.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-50 rounded border border-slate-200">
              No legal documents uploaded yet by the developer.
            </div>
          ) : (
            <div className="space-y-2">
              {property.documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50 rounded border border-slate-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-slate-500" />
                    <div>
                      <span className="font-semibold text-slate-900 block">{doc.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{doc.size || 'PDF'}</span>
                    </div>
                  </div>
                  <Badge variant="unverified">Seller provided</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 4: AI PROPERTY INTELLIGENCE ENGINE (ON-DEMAND) */}
      {activeTab === 'ai_engine' && (
        <AIPropertyIntelligenceCard
          reportData={aiReport || null}
          evidenceLayer={evidenceLayer || null}
          isLoading={isReportLoading || isRefreshingReport}
          aiRequested={aiRequested}
          onGenerateReport={() => handleTriggerAiReport()}
          onRefreshReport={handleTriggerAiReport}
          isRefreshing={isRefreshingReport}
          propertyLat={property.latitude}
          propertyLon={property.longitude}
          propertyName={property.name}
          propertyAddress={property.address}
          pois={flattenedPois}
          routes={allCommuteRoutes}
          onAddCustomCommute={handleAddCustomCommute}
          onSelectRouteOnMap={(geom, destName) => {
            setSelectedRouteGeometry(geom);
            setSelectedRouteName(destName);
            setActiveTab('location');
            window.scrollTo({ top: 350, behavior: 'smooth' });
          }}
        />
      )}

      {/* TAB CONTENT 5: LOCATION RESEARCH TELEMETRY */}
      {activeTab === 'raw_dossier' && (
        <div className="space-y-6">
          {/* Research Status & Action Header */}
          <div className="bg-white p-5 rounded-lg border border-brand-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900 text-sm">Location Intelligence Dossier</span>
                {dossier?.status === 'completed' && <Badge variant="verified">Research Completed</Badge>}
                {dossier?.status === 'partially_completed' && <Badge variant="warn">Partially Completed</Badge>}
                {dossier?.status === 'queued' && <Badge variant="info">Research Queued</Badge>}
                {dossier?.status === 'failed' && <Badge variant="unverified">Failed</Badge>}
              </div>
              <p className="text-slate-500 text-xs">
                Real geospatial and environmental intelligence gathered from OpenStreetMap, OSRM road graph, and Copernicus CAMS.
              </p>
              <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono pt-1">
                <span>Last checked: {dossier?.last_researched_at ? new Date(dossier.last_researched_at).toLocaleString() : 'Pending'}</span>
              </div>
            </div>

            <button
              onClick={handleRefreshIntel}
              disabled={isRefreshingIntel || isIntelLoading}
              className="px-4 py-2 bg-brand-primary text-white font-semibold rounded text-xs flex items-center gap-2 hover:bg-brand-primaryHover disabled:opacity-50 self-start md:self-auto"
            >
              <RotateCw size={13} className={isRefreshingIntel ? 'animate-spin' : ''} />
              <span>{isRefreshingIntel ? 'Running Research Pipeline...' : 'Refresh Research'}</span>
            </button>
          </div>

          {/* Environmental & Air Quality Intelligence */}
          <AirQualityCard data={dossier?.air_quality} />

          {/* Actual Road Routing & Custom Commute */}
          <RoadConnectivityCard
            routes={allCommuteRoutes}
            propertyLat={property.latitude}
            propertyLon={property.longitude}
            propertyName={property.name}
            onSelectRouteOnMap={(geom, destName) => {
              setSelectedRouteGeometry(geom);
              setSelectedRouteName(destName);
              setActiveTab('location');
              window.scrollTo({ top: 350, behavior: 'smooth' });
            }}
            onAddCustomRoute={handleAddCustomCommute}
          />

          {/* OpenStreetMap Nearby Amenities & Neighbourhood Explorer */}
          <NearbyAmenitiesExplorer
            categories={dossier?.nearby_pois}
            poiSummary={dossier?.poi_summary}
            propertyLat={property.latitude}
            propertyLon={property.longitude}
          />
        </div>
      )}

      {/* Enquiry Modal */}
      {enquiryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Send Enquiry to Seller</h3>
              <button onClick={() => setEnquiryModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            {enquirySuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded text-center text-xs space-y-1">
                <CheckCircle size={20} className="mx-auto text-emerald-600 mb-1" />
                <span className="font-bold block">Enquiry Transmitted</span>
                <p>The seller will contact you via email or phone.</p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Subject Property</label>
                  <input
                    type="text"
                    disabled
                    value={property.name}
                    className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-slate-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Your Message</label>
                  <textarea
                    rows={4}
                    value={enquiryMsg}
                    onChange={(e) => setEnquiryMsg(e.target.value)}
                    placeholder="Ask about floor plans, possession date, or schedule a physical site visit..."
                    className="w-full border border-slate-200 rounded p-3 text-xs focus:ring-1 focus:ring-brand-primary outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setEnquiryModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => enquiryMutation.mutate()}
                    disabled={enquiryMutation.isPending || !enquiryMsg.trim()}
                    className="px-4 py-2 bg-brand-primary hover:bg-brand-primaryHover text-white rounded font-semibold flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send size={13} />
                    <span>{enquiryMutation.isPending ? 'Sending...' : 'Send Enquiry'}</span>
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
