import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistApi } from '../../services/api';
import { Heart, Trash2, Scale, MapPin, Building2, ArrowRight } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export const WishlistPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: wishlist, isLoading } = useQuery({
    queryKey: ['user-wishlist'],
    queryFn: () => wishlistApi.getWishlist()
  });

  const removeMutation = useMutation({
    mutationFn: (propertyId: number) => wishlistApi.removeFromWishlist(propertyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-wishlist'] });
    }
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading your saved wishlist..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-lg border border-brand-border">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">My Saved Wishlist</h1>
          <p className="text-xs text-slate-500 mt-1">
            Track properties you are interested in, compare specifications, and request site inspections.
          </p>
        </div>

        {wishlist && wishlist.length >= 2 && (
          <Link
            to="/buyer/compare"
            className="px-4 py-2 bg-brand-primary text-white text-xs font-semibold rounded hover:bg-brand-primaryHover flex items-center gap-1.5 self-start sm:self-auto transition-colors"
          >
            <Scale size={14} />
            <span>Compare Saved ({wishlist.length})</span>
          </Link>
        )}
      </div>

      {!wishlist || wishlist.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your Wishlist is Empty"
          description="Browse the property directory and click the heart icon on any listing to save it here for comparison."
          actionLabel="Browse Directory"
          onAction={() => (window.location.href = '/directory')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlist.map((item) => {
            const p = item.property;
            if (!p) return null;

            return (
              <div
                key={item.id}
                className="bg-white rounded-lg border border-brand-border overflow-hidden hover:border-slate-400 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="h-44 bg-slate-100 relative">
                    <img
                      src={p.photos?.[0]?.url || '/assets/ramez_seapoint.jpg'}
                      alt={p.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      {p.is_demo && <Badge variant="demo">Demo data</Badge>}
                      <Badge variant="unverified">Seller provided</Badge>
                    </div>
                    <button
                      onClick={() => removeMutation.mutate(p.id)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white text-rose-600 hover:bg-rose-50 flex items-center justify-center shadow-xs"
                      title="Remove from wishlist"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/properties/${p.id}`} className="hover:text-blue-700">
                        <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{p.name}</h3>
                      </Link>
                      <span className="font-bold text-sm text-slate-900 whitespace-nowrap">{p.asking_price}</span>
                    </div>

                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <MapPin size={12} className="text-slate-400 flex-shrink-0" />
                      <span className="truncate">{p.locality}, {p.city}</span>
                    </p>

                    <div className="mt-3 flex items-center gap-3 text-xs text-slate-500 font-mono">
                      <span>{p.area} {p.area_unit}</span>
                      <span>•</span>
                      <span>{p.construction_status}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border-t border-brand-border flex items-center justify-between text-xs">
                  <Link
                    to={`/buyer/compare?add=${p.id}`}
                    className="text-slate-600 hover:text-black font-medium flex items-center gap-1"
                  >
                    <Scale size={13} />
                    <span>Compare</span>
                  </Link>
                  <Link
                    to={`/properties/${p.id}`}
                    className="font-semibold text-brand-primary hover:underline flex items-center gap-1"
                  >
                    <span>View Dossier</span>
                    <ArrowRight size={12} />
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
