import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { propertyApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  MapPin,
  Wind,
  FileText,
  Sparkles,
  ArrowRight,
  Compass,
  Building2,
  Shield,
  Layers,
  ChevronRight,
  ExternalLink,
  CheckCircle,
  Car,
  Activity,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const LandingPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const navigate = useNavigate();
  const { demoLogin, isAuthenticated, role } = useAuth();

  const { data: properties, isLoading } = useQuery({
    queryKey: ['public-properties'],
    queryFn: () => propertyApi.getProperties()
  });

  const handlePropertyClick = (propertyId: number) => {
    if (!isAuthenticated) {
      navigate('/login?role=buyer');
    } else {
      const targetRole = role === 'seller' ? 'seller' : role === 'admin' ? 'admin' : 'buyer';
      navigate(`/${targetRole}/properties/${propertyId}`);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login?role=buyer');
    } else {
      navigate(`/buyer/properties?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
    if (!isAuthenticated) {
      navigate('/login?role=buyer');
    } else {
      navigate(`/buyer/properties?property_type=${category}`);
    }
  };

  const handleRoleEnter = (targetRole: 'seller' | 'buyer' | 'admin') => {
    navigate(`/login?role=${targetRole}`);
  };

  // Filtered properties for showcase
  const displayedProperties = properties?.slice(0, 4) || [
    {
      id: 1,
      name: 'Ramez Seapoint',
      locality: 'Madhurawada',
      city: 'Visakhapatnam',
      asking_price: '₹75 L - 1.2 Cr',
      area: 1350,
      area_unit: 'sq ft',
      photos: [{ url: '/assets/ramez_seapoint.jpg' }],
      status: 'published'
    },
    {
      id: 2,
      name: 'Sreeja Ocean View',
      locality: 'Rushikonda',
      city: 'Visakhapatnam',
      asking_price: '₹68 - 1.1 Cr',
      area: 1200,
      area_unit: 'sq ft',
      photos: [{ url: '/assets/sreeja_ocean_view.jpg' }],
      status: 'published'
    },
    {
      id: 3,
      name: 'Urbanrise The Coast',
      locality: 'Madhurawada',
      city: 'Visakhapatnam',
      asking_price: '₹82 - 1.4 Cr',
      area: 1375,
      area_unit: 'sq ft',
      photos: [{ url: '/assets/urbanrise_the_coast.jpg' }],
      status: 'published'
    },
    {
      id: 4,
      name: 'MVV & MK Park',
      locality: 'MVP Colony',
      city: 'Visakhapatnam',
      asking_price: '₹64 - 95 L',
      area: 1150,
      area_unit: 'sq ft',
      photos: [{ url: '/assets/mvv_mk_park.jpg' }],
      status: 'published'
    }
  ];

  return (
    <div className="bg-[#faf8f5] text-slate-900">
      {/* ======================================================== */}
      {/* 1. HERO SECTION (MATCHING UPLOADED IMAGE TOP-LEFT)      */}
      {/* ======================================================== */}
      <section className="relative pt-6 pb-16 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Editorial Typography & Search Interface */}
          <div className="lg:col-span-6 z-10 space-y-6 pt-4 lg:pt-8">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[62px] font-normal text-slate-900 tracking-tight leading-[1.08]">
              Discover properties.<br />
              Understand places.<br />
              <span className="italic font-serif text-[#133238]">Decide with evidence.</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 max-w-lg leading-relaxed">
              An AI-assisted property intelligence platform for buyers, investors and developers.
            </p>

            {/* Floating Search Pill Bar */}
            <form onSubmit={handleSearchSubmit} className="pt-2 max-w-xl">
              <div className="relative flex items-center bg-white rounded-full pl-5 pr-2 py-2 shadow-[0_6px_25px_rgba(0,0,0,0.06)] border border-slate-200/90 hover:border-slate-300 transition-all focus-within:ring-2 focus-within:ring-[#133238]/10">
                <input
                  type="text"
                  placeholder="Search project, locality or drop a pin on the map..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 bg-transparent outline-none pr-3"
                />
                <button
                  type="submit"
                  className="w-10 h-10 rounded-full bg-[#133238] text-white flex items-center justify-center hover:bg-[#1a444c] transition-colors flex-shrink-0 shadow-sm"
                  aria-label="Search"
                >
                  <Search size={16} />
                </button>
              </div>
            </form>

            {/* Quick Filter Tag Pills directly under search */}
            <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
              <button
                type="button"
                onClick={() => navigate('/directory?search=Visakhapatnam')}
                className="px-3.5 py-1.5 rounded-full bg-white border border-slate-300 text-slate-900 font-semibold shadow-2xs hover:bg-slate-50 transition-colors"
              >
                Visakhapatnam
              </button>
              <button
                type="button"
                onClick={() => handleCategoryClick('apartment')}
                className="px-3.5 py-1.5 rounded-full bg-white/80 border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors"
              >
                Apartments
              </button>
              <button
                type="button"
                onClick={() => handleCategoryClick('villa')}
                className="px-3.5 py-1.5 rounded-full bg-white/80 border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors"
              >
                Villas
              </button>
              <button
                type="button"
                onClick={() => handleCategoryClick('residential_plot')}
                className="px-3.5 py-1.5 rounded-full bg-white/80 border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors"
              >
                Plots
              </button>
              <button
                type="button"
                onClick={() => handleCategoryClick('commercial')}
                className="px-3.5 py-1.5 rounded-full bg-white/80 border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors"
              >
                Commercial
              </button>
            </div>
          </div>

          {/* Right Column: Hero Visual Container matching Uploaded Image */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200/60 aspect-[4/3] sm:aspect-[16/11] bg-slate-900 group">
              {/* Authentic Visakhapatnam Coastal Image */}
              <img
                src="/assets/vizag_hero.jpg"
                alt="Visakhapatnam Coastal Horizon"
                className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-700 brightness-[0.98]"
              />

              {/* Subtle gradient vignette at bottom right */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

              {/* Floating Pin Card: Ramez Seapoint (Madhurawada, Visakhapatnam) */}
              <button
                type="button"
                onClick={() => handlePropertyClick(1)}
                className="absolute top-6 sm:top-10 right-6 sm:right-10 z-20 bg-white/95 backdrop-blur-md px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full shadow-lg border border-white/70 flex items-center gap-3 hover:scale-105 transition-all group/badge cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-[#133238] text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <MapPin size={13} />
                </div>
                <div className="text-left pr-1">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    Ramez Seapoint
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    Madhurawada, Visakhapatnam
                  </div>
                </div>
                <ArrowRight size={13} className="text-slate-400 group-hover/badge:text-slate-900 transition-colors" />
              </button>

              {/* Watermark in bottom right: Visakhapatnam + Subtitle */}
              <div className="absolute bottom-6 right-7 text-right z-20 pointer-events-none select-none">
                <div className="font-script text-4xl sm:text-5xl text-white drop-shadow-md tracking-wider leading-none">
                  Visakhapatnam
                </div>
                <div className="text-[9px] uppercase tracking-[0.25em] font-semibold text-white/90 drop-shadow mt-1.5 font-mono">
                  Coastal Living · Connected Opportunities
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. THE 4 FEATURE PILLARS STRIP (MATCHING UPLOADED IMAGE) */}
      {/* ======================================================== */}
      <section className="border-t border-b border-slate-200/80 bg-[#f7f5f0] py-6 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1: Live location intelligence */}
          <div className="flex items-center gap-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-[#133238] flex-shrink-0 group-hover:border-[#133238]/30 transition-colors">
              <Compass size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Live location intelligence</div>
              <div className="text-[11px] text-slate-500">Real places, real distances</div>
            </div>
          </div>

          {/* Pillar 2: Environmental context */}
          <div className="flex items-center gap-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-[#133238] flex-shrink-0 group-hover:border-[#133238]/30 transition-colors">
              <Wind size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Environmental context</div>
              <div className="text-[11px] text-slate-500">Air quality, weather and more</div>
            </div>
          </div>

          {/* Pillar 3: Document & plan analysis */}
          <div className="flex items-center gap-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-[#133238] flex-shrink-0 group-hover:border-[#133238]/30 transition-colors">
              <FileText size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Document & plan analysis</div>
              <div className="text-[11px] text-slate-500">Extract, check and flag issues</div>
            </div>
          </div>

          {/* Pillar 4: AI insights & comparison */}
          <div className="flex items-center gap-3.5 group">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-[#133238] flex-shrink-0 group-hover:border-[#133238]/30 transition-colors">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">AI insights & comparison</div>
              <div className="text-[11px] text-slate-500">Evidence-backed recommendations</div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. SHOWCASE PROPERTIES IN VISAKHAPATNAM (IMAGE TOP RIGHT) */}
      {/* ======================================================== */}
      <section className="py-16 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-mono font-semibold text-[#133238] mb-1.5">
              <span>Authentic Local Projects</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-slate-900 tracking-tight">
              Properties in Visakhapatnam
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Real data · Verified stored coordinates · Live atmospheric telemetry
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate(isAuthenticated ? '/buyer/map' : '/login?role=buyer')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-300 text-xs font-semibold text-slate-800 hover:bg-white hover:border-slate-400 transition-all self-start sm:self-auto shadow-2xs cursor-pointer"
          >
            <span>{isAuthenticated ? 'Explore All on Map' : 'Sign in to Explore on Map'}</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayedProperties.map((p) => (
            <div
              key={p.id}
              onClick={() => handlePropertyClick(p.id)}
              className="group bg-white rounded-2xl border border-slate-200/90 overflow-hidden hover:border-slate-400 hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer"
            >
              {/* Photo Area */}
              <div className="h-48 bg-slate-100 relative overflow-hidden">
                <img
                  src={p.photos?.[0]?.url || `/assets/${p.id === 1 ? 'ramez_seapoint.jpg' : p.id === 2 ? 'sreeja_ocean_view.jpg' : p.id === 3 ? 'urbanrise_the_coast.jpg' : 'mvv_mk_park.jpg'}`}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute top-3 left-3 flex items-center gap-1.5">
                  <span className="bg-white/90 backdrop-blur-xs text-[10px] font-bold text-slate-800 px-2 py-0.5 rounded-full shadow-2xs border border-white/50">
                    Verified listing
                  </span>
                </div>
              </div>

              {/* Information Area */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 group-hover:text-[#133238] transition-colors line-clamp-1">
                    {p.name}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                    <MapPin size={12} className="text-slate-400 flex-shrink-0" />
                    <span>{p.locality}, Visakhapatnam</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">ASKING PRICE</span>
                    <span className="font-bold text-slate-900">{p.asking_price}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-mono">SIZE</span>
                    <span className="text-slate-600 font-medium">{p.area} {p.area_unit || 'sq ft'}</span>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-[#133238] font-semibold flex items-center justify-between group-hover:underline">
                  <span>{isAuthenticated ? 'View Due Diligence Dossier' : 'Sign in to View Dossier & AI'}</span>
                  <ChevronRight size={13} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. PLATFORM PILLARS DEEP DIVE (REFLECTING COLLAGE PANELS) */}
      {/* ======================================================== */}
      <section className="py-16 px-4 sm:px-8 bg-white border-t border-slate-200/70">
        <div className="max-w-7xl mx-auto space-y-16">
          
          {/* Header */}
          <div className="max-w-2xl">
            <span className="text-[11px] uppercase tracking-wider font-mono font-semibold text-[#133238]">Due Diligence Framework</span>
            <h2 className="font-serif text-3xl sm:text-4xl font-normal text-slate-900 tracking-tight mt-1">
              Real telemetry, zero synthetic estimates.
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              HI IN ingests genuine municipal, atmospheric and road network graphs. Every travel time and air quality measurement links to an authentic sensor or topological coordinate.
            </p>
          </div>

          {/* 3 Core Highlights (Location, Environment, Comparison) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Box 1: Location & Commute */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-[#faf8f5] space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#133238] text-white flex items-center justify-center">
                  <Compass size={20} />
                </div>
                <h3 className="font-bold text-base text-slate-900">Map-First Spatial Search</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Interactive satellite & road maps with real-time Overpass amenity discovery across schools, hospitals, transit hubs, and IT parks within 1km, 3km, and 5km tiers.
                </p>
                <div className="space-y-1.5 pt-2 text-xs text-slate-500 font-mono">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>OSM Overpass API (6 categories)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>OSRM Topological Road Routing</span>
                  </div>
                </div>
              </div>

              <Link
                to="/directory"
                className="pt-4 text-xs font-semibold text-[#133238] flex items-center gap-1 hover:underline"
              >
                <span>Launch Interactive Directory Map</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* Box 2: Environmental Telemetry */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-[#faf8f5] space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#133238] text-white flex items-center justify-center">
                  <Wind size={20} />
                </div>
                <h3 className="font-bold text-base text-slate-900">Atmospheric Air Quality Grid</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Direct connection with Copernicus CAMS and Open-Meteo European/US atmospheric grids for hourly PM2.5, PM10, NO₂, and dominant pollutant health advisories.
                </p>
                <div className="space-y-1.5 pt-2 text-xs text-slate-500 font-mono">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>Copernicus CAMS & Open-Meteo</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>Live US AQI & European Scale</span>
                  </div>
                </div>
              </div>

              <Link
                to="/properties/1"
                className="pt-4 text-xs font-semibold text-[#133238] flex items-center gap-1 hover:underline"
              >
                <span>Inspect Ramez Seapoint Telemetry</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* Box 3: Side-by-Side Comparison */}
            <div className="p-6 rounded-2xl border border-slate-200 bg-[#faf8f5] space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#133238] text-white flex items-center justify-center">
                  <Layers size={20} />
                </div>
                <h3 className="font-bold text-base text-slate-900">Side-by-Side Property Matrix</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Compare up to 4 candidate properties on price, road distance to airport/station, nearest school, hospital, beach proximity, and overall due diligence score.
                </p>
                <div className="space-y-1.5 pt-2 text-xs text-slate-500 font-mono">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>Multi-factor comparative matrix</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>Calculated commute durations</span>
                  </div>
                </div>
              </div>

              <Link
                to="/buyer/compare"
                className="pt-4 text-xs font-semibold text-[#133238] flex items-center gap-1 hover:underline"
              >
                <span>Open Property Comparison Tool</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. 1-CLICK ROLE TESTER WORKSPACE ENTRY                  */}
      {/* ======================================================== */}
      <section className="py-16 px-4 sm:px-8 bg-[#f5f2eb] border-t border-slate-200/80">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <span className="text-[11px] uppercase tracking-wider font-mono font-semibold text-[#133238]">Instant Evaluation</span>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal text-slate-900 tracking-tight">
            Test All Platform Workspaces
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            Choose any of the three pre-configured roles below to explore the complete capabilities without needing manual account registration.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 text-left">
            {/* Role 1: Buyer */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                  <Compass size={18} />
                </div>
                <h3 className="font-bold text-sm text-slate-900 mt-3">Buyer Experience</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Filter listings, evaluate live location intelligence, compute road routes to workplaces, manage wishlists, and enquire.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRoleEnter('buyer')}
                className="w-full py-2.5 rounded-full bg-[#133238] text-white text-xs font-semibold hover:bg-[#1a444c] flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <span>Enter as Buyer</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Role 2: Seller */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-800 flex items-center justify-center font-bold">
                  <Building2 size={18} />
                </div>
                <h3 className="font-bold text-sm text-slate-900 mt-3">Seller / Builder</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Publish new developments with Nominatim address lookup, pin position accuracy, document upload, and view analytics.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRoleEnter('seller')}
                className="w-full py-2.5 rounded-full bg-[#133238] text-white text-xs font-semibold hover:bg-[#1a444c] flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <span>Enter as Seller</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Role 3: Admin */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-800 flex items-center justify-center font-bold">
                  <Shield size={18} />
                </div>
                <h3 className="font-bold text-sm text-slate-900 mt-3">Platform Admin</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Audit logs, suspend or reinstate listings, monitor background research pipelines, and live-ping all 4 open-data providers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRoleEnter('admin')}
                className="w-full py-2.5 rounded-full bg-[#133238] text-white text-xs font-semibold hover:bg-[#1a444c] flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <span>Enter as Admin</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
