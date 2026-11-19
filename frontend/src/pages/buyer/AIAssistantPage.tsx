import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { propertyApi } from '../../services/api';
import { Property } from '../../types';
import { AIAssistantChat } from '../../components/assistant/AIAssistantChat';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import {
  Sparkles,
  Bot,
  Building,
  MapPin,
  IndianRupee,
  ChevronRight,
  Search,
  SlidersHorizontal,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export const AIAssistantPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPropId = searchParams.get('propertyId');
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(
    urlPropId ? parseInt(urlPropId, 10) : null
  );

  // Fetch properties for the property selector
  const { data: properties, isLoading } = useQuery({
    queryKey: ['assistant-properties'],
    queryFn: () => propertyApi.getProperties()
  });

  // Auto-select first property if none selected
  useEffect(() => {
    if (properties && properties.length > 0 && selectedPropertyId === null) {
      const targetId = urlPropId ? parseInt(urlPropId, 10) : properties[0].id;
      setSelectedPropertyId(targetId);
    }
  }, [properties, urlPropId, selectedPropertyId]);

  const selectedProperty = properties?.find((p) => p.id === selectedPropertyId) || properties?.[0] || null;

  const handleSelectProperty = (id: number) => {
    setSelectedPropertyId(id);
    setSearchParams({ propertyId: id.toString() });
  };

  if (isLoading) {
    return <LoadingSpinner message="Initializing AI Property Assistant workspace..." />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 text-white rounded-xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
              <Bot size={18} />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">AI Property Assistant</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Interactive Mockup
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
            Evaluate listings using evidence-backed responses. Ask questions about physical specifications, listed amenities, local facilities, estimated acquisition fees, and due-diligence checklists.
          </p>
        </div>

        {selectedProperty && (
          <Link
            to={`/buyer/properties/${selectedProperty.id}`}
            className="self-start md:self-auto px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>View Full Property Dossier</span>
            <ExternalLink size={13} />
          </Link>
        )}
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Property Selector List (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Building size={14} className="text-indigo-600" />
              Select Property Context
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {properties?.length || 0} listings
            </span>
          </div>

          <div className="space-y-2 max-h-[660px] overflow-y-auto pr-1">
            {properties?.map((prop) => {
              const isSelected = prop.id === selectedProperty?.id;

              return (
                <div
                  key={prop.id}
                  onClick={() => handleSelectProperty(prop.id)}
                  className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-400 shadow-xs ring-1 ring-indigo-400/50'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={prop.photos?.[0]?.url || '/assets/ramez_seapoint.jpg'}
                      alt={prop.name}
                      className="w-14 h-12 object-cover rounded border border-slate-200 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className={`text-xs font-bold truncate ${isSelected ? 'text-indigo-950' : 'text-slate-900'}`}>
                          {prop.name}
                        </h3>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate flex items-center gap-0.5 mt-0.5">
                        <MapPin size={10} className="text-slate-400 shrink-0" />
                        <span>{prop.locality}, {prop.city}</span>
                      </p>
                      <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-100">
                        <span className="font-bold text-xs text-emerald-600 font-mono">
                          {prop.asking_price}
                        </span>
                        <span className="capitalize text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                          {prop.property_type.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center gap-1 font-semibold text-slate-700">
              <ShieldCheck size={12} className="text-emerald-600" />
              <span>Evidence-First Assistant</span>
            </div>
            <p>
              Switching properties re-binds the assistant context to that property's specifications, amenities, and location research.
            </p>
          </div>
        </div>

        {/* Right Column: Chat Assistant Interface (8 Cols) */}
        <div className="lg:col-span-8">
          <AIAssistantChat property={selectedProperty} />
        </div>
      </div>
    </div>
  );
};
