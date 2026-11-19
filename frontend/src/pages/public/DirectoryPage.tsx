import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyApi, wishlistApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Heart,
  Building,
  ArrowUpDown,
  Filter,
  X,
  ArrowRight,
  IndianRupee,
  Layers,
  Bot
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

const POPULAR_LOCALITIES = [
  'Gopanapally',
  'Gachibowli',
  'Kokapet',
  'Tellapur',
  'Narsingi',
  'Puppalaguda',
  'Financial District',
  'Kondapur'
];

const PRICE_BANDS = [
  { id: 'all', label: 'All Prices' },
  { id: 'under_50l', label: 'Under ₹50 L', min: 0, max: 5000000 },
  { id: '50l_to_1cr', label: '₹50 L - ₹1 Cr', min: 5000000, max: 10000000 },
  { id: '1cr_to_2cr', label: '₹1 Cr - ₹2 Cr', min: 10000000, max: 20000000 },
  { id: 'above_2cr', label: 'Above ₹2 Cr', min: 20000000, max: 999999999 }
];

const BHK_OPTIONS = ['All', '1 BHK', '2 BHK', '3 BHK', '4+ BHK'];

export const DirectoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, role } = useAuth();
  const queryClient = useQueryClient();

  // Filters state with auto-apply
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [locality, setLocality] = useState(searchParams.get('locality') || 'All');
  const [propertyType, setPropertyType] = useState(searchParams.get('property_type') || 'All');
  const [priceBand, setPriceBand] = useState(searchParams.get('price_band') || 'all');
  const [bhk, setBhk] = useState(searchParams.get('bhk') || 'All');
  const [constructionStatus, setConstructionStatus] = useState(searchParams.get('construction_status') || 'All');
  const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'newest');

  // Fetch properties from backend
  const { data: properties, isLoading, isError } = useQuery({
    queryKey: ['directory-properties', search, propertyType, sortBy, constructionStatus],
    queryFn: () =>
      propertyApi.getProperties({
        search: search || undefined,
        property_type: propertyType !== 'All' ? propertyType : undefined,
        construction_status: constructionStatus !== 'All' ? constructionStatus : undefined,
        sort_by: sortBy
      })
  });

  // Wishlist query
  const { data: wishlist } = useQuery({
    queryKey: ['user-wishlist'],
    queryFn: () => wishlistApi.getWishlist(),
    enabled: isAuthenticated && role === 'buyer'
  });

  const wishlistMap = new Set(wishlist?.map((w) => w.property_id));

  // Toggle wishlist mutation
  const toggleWishlistMutation = useMutation({
    mutationFn: async (propertyId: number) => {
      if (wishlistMap.has(propertyId)) {
        await wishlistApi.removeFromWishlist(propertyId);
      } else {
        await wishlistApi.addToWishlist(propertyId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-wishlist'] });
    }
  });

  // Client-side auto-filtering for rich criteria (Locality, Price Bands, BHK)
  const filteredProperties = useMemo(() => {
    if (!properties) return [];

    return properties.filter((p) => {
      // Locality filter
      if (locality !== 'All') {
        const matchesLoc = p.locality?.toLowerCase().includes(locality.toLowerCase()) ||
          p.address?.toLowerCase().includes(locality.toLowerCase());
        if (!matchesLoc) return false;
      }

      // Price band filter
      if (priceBand !== 'all') {
        const band = PRICE_BANDS.find((b) => b.id === priceBand);
        if (band && band.min !== undefined && band.max !== undefined && p.total_price !== undefined && p.total_price !== null) {
          if (p.total_price < band.min || p.total_price > band.max) return false;
        }
      }

      // BHK filter
      if (bhk !== 'All') {
        const pDesc = `${p.name} ${p.description || ''} ${p.amenities?.join(' ') || ''}`.toLowerCase();
        if (bhk === '1 BHK' && !pDesc.includes('1 bhk') && !pDesc.includes('1bhk')) return false;
        if (bhk === '2 BHK' && !pDesc.includes('2 bhk') && !pDesc.includes('2bhk')) return false;
        if (bhk === '3 BHK' && !pDesc.includes('3 bhk') && !pDesc.includes('3bhk')) return false;
        if (bhk === '4+ BHK' && !pDesc.includes('4 bhk') && !pDesc.includes('4bhk') && !pDesc.includes('5 bhk')) return false;
      }

      return true;
    });
  }, [properties, locality, priceBand, bhk]);

  const handleResetFilters = () => {
    setSearch('');
    setLocality('All');
    setPropertyType('All');
    setPriceBand('all');
    setBhk('All');
    setConstructionStatus('All');
    setSortBy('newest');
    setSearchParams({});
  };

  const hasActiveFilters =
    search !== '' ||
    locality !== 'All' ||
    propertyType !== 'All' ||
    priceBand !== 'all' ||
    bhk !== 'All' ||
    constructionStatus !== 'All' ||
    sortBy !== 'newest';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Property Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse verified Hyderabad properties with stored cadastral coordinates and multi-source due diligence.
          </p>
        </div>

        {/* Quick count badge */}
        <div className="text-xs font-mono text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto shadow-2xs">
          Showing <span className="font-bold text-slate-900">{filteredProperties.length}</span> of {properties?.length || 0} listings
        </div>
      </div>

      {/* Rich Auto-Applying Filter Control Panel */}
      <div className="bg-white p-5 rounded-xl border border-brand-border shadow-xs space-y-4">
        {/* Row 1: Search, Property Type, Construction Status, Sort */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Global Search (Manual Locality / Area / Property Name) */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search any locality, area, address, or property..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-brand-primary transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* 2. Property Type */}
          <div>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-brand-primary transition-colors cursor-pointer"
            >
              <option value="All">All Property Types</option>
              <option value="apartment">Apartments</option>
              <option value="villa">Villas</option>
              <option value="residential_plot">Residential Plots</option>
              <option value="agricultural_land">Agricultural Land</option>
              <option value="commercial">Commercial</option>
            </select>
          </div>

          {/* 3. Construction Status */}
          <div>
            <select
              value={constructionStatus}
              onChange={(e) => setConstructionStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-brand-primary transition-colors cursor-pointer"
            >
              <option value="All">All Stages</option>
              <option value="Ready to Move">Ready to Move</option>
              <option value="Under Construction">Under Construction</option>
            </select>
          </div>

          {/* 4. Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-brand-primary transition-colors cursor-pointer"
            >
              <option value="newest">Sort: Newest Listings</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="area_asc">Size: Smallest First</option>
              <option value="area_desc">Size: Largest First</option>
            </select>
          </div>
        </div>

        {/* Row 2: Price Bands Chips & BHK Quick Select */}
        <div className="pt-2 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Price Range Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono text-slate-400 mr-1 flex items-center gap-0.5">
              <IndianRupee size={12} />
              <span>Budget:</span>
            </span>
            {PRICE_BANDS.map((band) => (
              <button
                key={band.id}
                type="button"
                onClick={() => setPriceBand(band.id)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                  priceBand === band.id
                    ? 'bg-brand-primary text-white border-brand-primary shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {band.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* BHK Configuration Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-mono text-slate-400 mr-1">BHK:</span>
              {BHK_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setBhk(opt)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                    bhk === opt
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <X size={12} />
                <span>Reset All</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Property Cards Grid */}
      {isLoading ? (
        <LoadingSpinner message="Querying property directory..." />
      ) : isError ? (
        <div className="p-8 text-center text-rose-600 bg-rose-50 border border-rose-200 rounded-lg text-sm">
          Failed to load properties. Ensure the backend server is running.
        </div>
      ) : filteredProperties.length === 0 ? (
        <EmptyState
          icon={Building}
          title="No Published Properties Found"
          description="There are currently no published properties matching your selected filter criteria. Try adjusting your query."
          actionLabel="Clear Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((p) => {
            const isWishlisted = wishlistMap.has(p.id);

            // Context-aware link: if buyer is logged in, link to /buyer/properties/:id; if seller, /seller/properties/:id
            const detailLink =
              role === 'buyer'
                ? `/buyer/properties/${p.id}`
                : role === 'seller'
                ? `/seller/properties/${p.id}`
                : `/properties/${p.id}`;

            return (
              <div
                key={p.id}
                className="group bg-white rounded-xl border border-brand-border overflow-hidden hover:border-slate-400 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Photo Container */}
                  <div className="h-48 bg-slate-100 relative overflow-hidden">
                    <img
                      src={p.photos?.[0]?.url || '/assets/ramez_seapoint.jpg'}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    {/* Badges Overlay */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                      {p.is_demo && <Badge variant="demo">Demo data</Badge>}
                      <Badge variant="unverified">Seller provided</Badge>
                      <Badge variant="published" className="capitalize">{p.property_type.replace('_', ' ')}</Badge>
                    </div>

                    {/* Wishlist Button (for authenticated buyers) */}
                    {isAuthenticated && role === 'buyer' && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          toggleWishlistMutation.mutate(p.id);
                        }}
                        className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                          isWishlisted
                            ? 'bg-rose-500 text-white shadow-xs'
                            : 'bg-white/90 text-slate-600 hover:text-rose-500 hover:bg-white'
                        }`}
                        title={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                      >
                        <Heart size={16} fill={isWishlisted ? 'currentColor' : 'none'} />
                      </button>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block">
                        {p.locality}, {p.city || 'Hyderabad'}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors mt-0.5">
                        <Link to={detailLink}>{p.name}</Link>
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                        {p.description}
                      </p>
                    </div>

                    {/* Price and Area specs */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Asking Price</span>
                        <span className="font-bold text-slate-900 text-sm font-mono">{p.asking_price}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase font-mono block">Area</span>
                        <span className="font-semibold text-slate-700 font-mono">{p.area} {p.area_unit}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 pt-0 grid grid-cols-5 gap-2">
                  <Link
                    to={detailLink}
                    className="col-span-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>View Details</span>
                    <ArrowRight size={13} />
                  </Link>
                  <Link
                    to={`/buyer/properties/${p.id}?tab=ai_assistant`}
                    className="col-span-2 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors"
                    title="Ask AI Assistant about this property"
                  >
                    <Bot size={13} className="text-indigo-600" />
                    <span>Ask AI</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
