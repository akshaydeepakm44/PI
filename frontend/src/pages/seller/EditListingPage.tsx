import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyApi, uploadApi } from '../../services/api';
import { MapPicker } from '../../components/common/MapPicker';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Building2,
  MapPin,
  DollarSign,
  FileText,
  Upload,
  User,
  CheckCircle,
  AlertCircle,
  Save,
  Send,
  Eye,
  Trash2,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';

export const EditListingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const propertyId = parseInt(id || '0', 10);

  const [activeSection, setActiveSection] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('A');
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [formData, setFormData] = useState<any>(null);

  const { data: property, isLoading, error } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => propertyApi.getProperty(propertyId),
    enabled: propertyId > 0
  });

  useEffect(() => {
    if (property) {
      setFormData({
        // A. Identity & Map Pin
        name: property.name || '',
        property_type: property.property_type || 'apartment',
        state: property.state || 'Andhra Pradesh',
        district: property.district || 'Visakhapatnam',
        city: property.city || 'Visakhapatnam',
        locality: property.locality || '',
        address: property.address || '',
        latitude: property.latitude || 17.7944,
        longitude: property.longitude || 83.3574,
        area: property.area || 1500,
        area_unit: property.area_unit || 'sq ft',
        road_access_m: property.road_access_m ?? 15,
        frontage_m: property.frontage_m ?? 35,
        survey_number: property.survey_number || '',

        // B. Pricing & Terms
        asking_price: property.asking_price || '',
        price_unit: property.price_unit || 'INR',
        total_price: property.total_price || 7500000,
        payment_terms: property.payment_terms || '20% booking milestone',
        additional_charges: property.additional_charges || '',
        maintenance_charges: property.maintenance_charges || '',
        availability_date: property.availability_date || 'Dec 2026',

        // C. Details & Specs
        description: property.description || '',
        amenities: Array.isArray(property.amenities) ? property.amenities.join(', ') : (property.amenities || ''),
        utilities: Array.isArray(property.utilities) ? property.utilities.join(', ') : (property.utilities || ''),
        floors: property.floors ?? 12,
        towers: property.towers ?? 2,
        unit_count: property.unit_count ?? 120,
        construction_status: property.construction_status || 'Under Construction',

        // D. Evidence & Photos
        photos: Array.isArray(property.photos) ? property.photos : [],
        site_plan_url: property.site_plan_url || '',
        brochure_url: property.brochure_url || '',
        survey_sketch_url: property.survey_sketch_url || '',
        documents: Array.isArray(property.documents) ? property.documents : [],

        // E. Developer Profile
        seller_name: property.seller_name || '',
        seller_contact: property.seller_contact || '',
        possession_date: property.possession_date || 'Dec 2026',
        developer_profile: property.developer_profile || '',
        status: property.status || 'published'
      });
    }
  }, [property]);

  // Photo upload handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadApi.uploadPhoto(file);
      setFormData((prev: any) => ({
        ...prev,
        photos: [...(prev.photos || []), { url: res.url, caption: file.name }]
      }));
      setStatusMessage({ type: 'success', text: `Uploaded photo: ${file.name}` });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Photo upload failed. Try again.' });
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    setFormData((prev: any) => ({
      ...prev,
      photos: prev.photos.filter((_: any, idx: number) => idx !== indexToRemove)
    }));
  };

  const handlePhotoCaptionChange = (index: number, newCaption: string) => {
    setFormData((prev: any) => {
      const updated = [...prev.photos];
      updated[index] = { ...updated[index], caption: newCaption };
      return { ...prev, photos: updated };
    });
  };

  // Document upload handler
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadApi.uploadDocument(file);
      setFormData((prev: any) => ({
        ...prev,
        documents: [
          ...(prev.documents || []),
          {
            name: file.name,
            url: res.url,
            tag: 'ok',
            size: `${(file.size / 1024 / 1024).toFixed(1)} MB`
          }
        ]
      }));
      setStatusMessage({ type: 'success', text: `Uploaded document: ${file.name}` });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Document upload failed. Try again.' });
    }
  };

  const handleRemoveDoc = (indexToRemove: number) => {
    setFormData((prev: any) => ({
      ...prev,
      documents: prev.documents.filter((_: any, idx: number) => idx !== indexToRemove)
    }));
  };

  const handleDocTagChange = (index: number, newTag: string) => {
    setFormData((prev: any) => {
      const updated = [...prev.documents];
      updated[index] = { ...updated[index], tag: newTag };
      return { ...prev, documents: updated };
    });
  };

  const updateMutation = useMutation({
    mutationFn: (newStatus?: string) => {
      if (!formData) throw new Error('No form data');
      const payload: any = {
        ...formData,
        amenities: typeof formData.amenities === 'string'
          ? formData.amenities.split(',').map((s: string) => s.trim()).filter(Boolean)
          : formData.amenities,
        utilities: typeof formData.utilities === 'string'
          ? formData.utilities.split(',').map((s: string) => s.trim()).filter(Boolean)
          : formData.utilities
      };
      if (newStatus) {
        payload.status = newStatus;
      }
      return propertyApi.updateProperty(propertyId, payload);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['seller-properties'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      setStatusMessage({
        type: 'success',
        text: `Property "${updated.name}" updated successfully!`
      });
      setFormData((prev: any) => ({
        ...prev,
        ...updated,
        amenities: Array.isArray(updated.amenities) ? updated.amenities.join(', ') : updated.amenities || '',
        utilities: Array.isArray(updated.utilities) ? updated.utilities.join(', ') : updated.utilities || ''
      }));
    },
    onError: (err: any) => {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to update property listing.'
      });
    }
  });

  const handleSave = (status?: string) => {
    if (!formData) return;
    if (!formData.name.trim()) {
      setActiveSection('A');
      setStatusMessage({ type: 'error', text: 'Please provide a property/project name in Section A.' });
      return;
    }
    if (!formData.locality.trim() || !formData.address.trim()) {
      setActiveSection('A');
      setStatusMessage({ type: 'error', text: 'Please specify locality and full address in Section A.' });
      return;
    }
    if (!formData.asking_price.trim()) {
      setActiveSection('B');
      setStatusMessage({ type: 'error', text: 'Please enter asking price in Section B.' });
      return;
    }
    if (!formData.description.trim()) {
      setActiveSection('C');
      setStatusMessage({ type: 'error', text: 'Please write a description in Section C.' });
      return;
    }
    updateMutation.mutate(status);
  };

  if (isLoading || !formData) {
    return <LoadingSpinner message="Loading listing details for editing..." />;
  }

  if (error || !property) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg border border-red-200 text-center space-y-3">
        <AlertCircle size={32} className="mx-auto text-red-500" />
        <h2 className="text-lg font-bold text-slate-900">Property Not Found</h2>
        <p className="text-xs text-slate-500">The property you are trying to edit does not exist or you do not have permission.</p>
        <button
          onClick={() => navigate('/seller/listings')}
          className="px-4 py-2 bg-slate-900 text-white rounded text-xs font-semibold"
        >
          Return to My Listings
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="bg-white p-6 rounded-lg border border-brand-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <button
                onClick={() => navigate('/seller/listings')}
                className="text-xs text-slate-500 hover:text-black flex items-center gap-1 font-medium transition-colors"
              >
                <ArrowLeft size={13} />
                <span>Back to My Listings</span>
              </button>
              <span className="text-slate-300">|</span>
              <Link
                to={`/properties/${property.id}`}
                target="_blank"
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
              >
                <Eye size={12} />
                <span>View Public Page</span>
                <ExternalLink size={10} />
              </Link>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Edit: {property.name}</h1>
              <Badge variant={formData.status === 'published' ? 'published' : 'draft'} className="capitalize">
                {formData.status}
              </Badge>
              <Badge variant="unverified">{property.verification_status}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Edit all 5 listing dimensions: Identity, Pricing, Specs, Documents/Photos, and Developer Profile.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {formData.status === 'draft' ? (
              <button
                type="button"
                onClick={() => handleSave('published')}
                disabled={updateMutation.isPending}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Send size={13} />
                <span>Publish Listing</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSave('draft')}
                disabled={updateMutation.isPending}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs flex items-center gap-1.5 transition-colors"
              >
                <span>Move to Draft</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSave()}
              disabled={updateMutation.isPending}
              className="px-4 py-2 bg-brand-primary hover:bg-brand-primaryHover text-white font-semibold rounded text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Save size={13} />
              <span>{updateMutation.isPending ? 'Saving...' : 'Save All Changes'}</span>
            </button>
          </div>
        </div>

        {/* Section Tabs A, B, C, D, E */}
        <div className="mt-6 flex items-center gap-1 border-b border-slate-200 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveSection('A')}
            className={`px-3 py-2.5 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeSection === 'A'
                ? 'border-brand-primary text-slate-900 font-bold bg-blue-50/50 rounded-t'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 size={13} />
            <span>A. Identity & Map Pin</span>
          </button>
          <button
            onClick={() => setActiveSection('B')}
            className={`px-3 py-2.5 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeSection === 'B'
                ? 'border-brand-primary text-slate-900 font-bold bg-blue-50/50 rounded-t'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <DollarSign size={13} />
            <span>B. Pricing & Terms</span>
          </button>
          <button
            onClick={() => setActiveSection('C')}
            className={`px-3 py-2.5 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeSection === 'C'
                ? 'border-brand-primary text-slate-900 font-bold bg-blue-50/50 rounded-t'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText size={13} />
            <span>C. Details & Specs</span>
          </button>
          <button
            onClick={() => setActiveSection('D')}
            className={`px-3 py-2.5 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeSection === 'D'
                ? 'border-brand-primary text-slate-900 font-bold bg-blue-50/50 rounded-t'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload size={13} />
            <span>D. Evidence & Photos</span>
            {formData.photos?.length + formData.documents?.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px]">
                {formData.photos?.length + formData.documents?.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSection('E')}
            className={`px-3 py-2.5 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeSection === 'E'
                ? 'border-brand-primary text-slate-900 font-bold bg-blue-50/50 rounded-t'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User size={13} />
            <span>E. Developer Profile</span>
          </button>
        </div>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`p-3 rounded text-xs flex items-center justify-between gap-2 shadow-sm ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
            <span className="font-medium">{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-[11px] underline opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Multi-Section Form Container */}
      <div className="bg-white p-6 rounded-lg border border-brand-border space-y-6 text-xs shadow-sm">
        {/* SECTION A: PROPERTY IDENTITY */}
        {activeSection === 'A' && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-900">Section A • Property Identity & Stored Coordinates</h2>
              <p className="text-[11px] text-slate-500">
                Update project identifiers, municipal road access width, plot frontage, and exact GPS pin coordinates.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Project / Property Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marina Bay Heights"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Property Type *</label>
                <select
                  value={formData.property_type}
                  onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:border-brand-primary"
                >
                  <option value="apartment">Apartment / Gated Community</option>
                  <option value="villa">Independent Villa</option>
                  <option value="residential_plot">Residential Plot</option>
                  <option value="agricultural_land">Agricultural Land</option>
                  <option value="commercial">Commercial Space</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Locality *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Madhurawada, Rushikonda, MVP Colony, Gajuwaka"
                  value={formData.locality}
                  onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">City & District</label>
                <input
                  type="text"
                  value={`${formData.city}, ${formData.district}`}
                  readOnly
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded text-xs text-slate-600 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Complete Physical Address *</label>
                <input
                  type="text"
                  required
                  placeholder="Door No, Street Name, Landmark, Postal Code"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Property Area & Unit *</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:border-brand-primary"
                  />
                  <select
                    value={formData.area_unit}
                    onChange={(e) => setFormData({ ...formData, area_unit: e.target.value })}
                    className="w-28 px-2 py-2 bg-slate-50 border border-slate-200 rounded text-xs"
                  >
                    <option value="sq ft">sq ft</option>
                    <option value="sq yds">sq yds</option>
                    <option value="acres">acres</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Road Access & Frontage (meters)</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Road width (m)"
                    value={formData.road_access_m}
                    onChange={(e) => setFormData({ ...formData, road_access_m: parseFloat(e.target.value) || 0 })}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs"
                  />
                  <input
                    type="number"
                    placeholder="Frontage (m)"
                    value={formData.frontage_m}
                    onChange={(e) => setFormData({ ...formData, frontage_m: parseFloat(e.target.value) || 0 })}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Survey / Revenue Plot Number</label>
                <input
                  type="text"
                  placeholder="e.g. Survey No. 128/3A, Village Block 4"
                  value={formData.survey_number}
                  onChange={(e) => setFormData({ ...formData, survey_number: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs"
                />
              </div>

              {/* Map Coordinate Picker */}
              <div className="sm:col-span-2 pt-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">
                    Stored GPS Coordinates (Drag pin or click map)
                  </label>
                  <span className="font-mono text-[11px] text-slate-500">
                    Lat: {Number(formData.latitude).toFixed(6)}, Lng: {Number(formData.longitude).toFixed(6)}
                  </span>
                </div>
                <MapPicker
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onChange={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleSave()}
                disabled={updateMutation.isPending}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs flex items-center gap-1.5 transition-colors"
              >
                <Save size={13} />
                <span>Save Progress</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('B')}
                className="px-4 py-2 bg-brand-primary hover:bg-brand-primaryHover text-white font-semibold rounded text-xs transition-colors"
              >
                Continue to Section B: Pricing & Terms →
              </button>
            </div>
          </div>
        )}

        {/* SECTION B: PRICING & TERMS */}
        {activeSection === 'B' && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-900">Section B • Pricing & Payment Terms</h2>
              <p className="text-[11px] text-slate-500">Update asking price, payment milestones, extra charges, and maintenance terms.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Asking Price (Display string) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ₹ 1.75 Cr or ₹ 85 Lakhs"
                  value={formData.asking_price}
                  onChange={(e) => setFormData({ ...formData, asking_price: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estimated Total Price (Numeric for sorting)</label>
                <input
                  type="number"
                  placeholder="e.g. 8500000"
                  value={formData.total_price}
                  onChange={(e) => setFormData({ ...formData, total_price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono focus:bg-white focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Payment Terms</label>
                <input
                  type="text"
                  placeholder="e.g. 20% booking milestone, 80% on slab"
                  value={formData.payment_terms}
                  onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Additional Charges (if any)</label>
                <input
                  type="text"
                  placeholder="e.g. Clubhouse & Car Parking: ₹ 3.5 Lakhs"
                  value={formData.additional_charges}
                  onChange={(e) => setFormData({ ...formData, additional_charges: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Maintenance Charges</label>
                <input
                  type="text"
                  placeholder="e.g. ₹ 2.5 / sq ft / month"
                  value={formData.maintenance_charges}
                  onChange={(e) => setFormData({ ...formData, maintenance_charges: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Availability / Possession Date</label>
                <input
                  type="text"
                  placeholder="e.g. Immediate or Dec 2026"
                  value={formData.availability_date}
                  onChange={(e) => setFormData({ ...formData, availability_date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveSection('A')}
                className="px-3 py-1.5 text-slate-600 hover:text-black font-semibold text-xs"
              >
                ← Back to Section A
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSave()}
                  disabled={updateMutation.isPending}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Save size={13} />
                  <span>Save Progress</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('C')}
                  className="px-4 py-2 bg-brand-primary hover:bg-brand-primaryHover text-white font-semibold rounded text-xs transition-colors"
                >
                  Continue to Section C: Details & Specs →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION C: DETAILS & SPECS */}
        {activeSection === 'C' && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-900">Section C • Property Details & Specifications</h2>
              <p className="text-[11px] text-slate-500">Edit project description, amenities, utilities, floor and tower counts.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide an overview of the residential/commercial project, architecture, views and location."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amenities (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="Swimming Pool, Gymnasium, 24/7 Security, Clubhouse"
                    value={formData.amenities}
                    onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Separate individual amenities with commas.</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Utilities (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="100% Power Backup, Municipal Water, STP Plant"
                    value={formData.utilities}
                    onChange={(e) => setFormData({ ...formData, utilities: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">e.g. 100% DG Backup, Solar Lighting, Municipal Water</span>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Floors & Towers</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Floors"
                      value={formData.floors}
                      onChange={(e) => setFormData({ ...formData, floors: parseInt(e.target.value) || 0 })}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs"
                    />
                    <input
                      type="number"
                      placeholder="Towers"
                      value={formData.towers}
                      onChange={(e) => setFormData({ ...formData, towers: parseInt(e.target.value) || 0 })}
                      className="px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Construction / Possession Status</label>
                  <select
                    value={formData.construction_status}
                    onChange={(e) => setFormData({ ...formData, construction_status: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs"
                  >
                    <option value="Ready to Move">Ready to Move</option>
                    <option value="Under Construction">Under Construction</option>
                    <option value="Newly Launched">Newly Launched</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveSection('B')}
                className="px-3 py-1.5 text-slate-600 hover:text-black font-semibold text-xs"
              >
                ← Back to Section B
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSave()}
                  disabled={updateMutation.isPending}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Save size={13} />
                  <span>Save Progress</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('D')}
                  className="px-4 py-2 bg-brand-primary hover:bg-brand-primaryHover text-white font-semibold rounded text-xs transition-colors"
                >
                  Continue to Section D: Evidence & Photos →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION D: EVIDENCE & PHOTOS */}
        {activeSection === 'D' && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-900">Section D • Evidence, Photos & Due Diligence Documents</h2>
              <p className="text-[11px] text-slate-500">
                Upload or remove site photographs, sanction plans, title deeds, and official brochures.
              </p>
            </div>

            {/* Photos */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block font-semibold text-slate-700">
                  Property Photographs ({formData.photos?.length || 0})
                </label>
                <label className="cursor-pointer px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors">
                  <Upload size={12} />
                  <span>Upload New Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {formData.photos && formData.photos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {formData.photos.map((ph: any, idx: number) => (
                    <div key={idx} className="group relative rounded-lg border border-slate-200 overflow-hidden bg-slate-50 shadow-xs flex flex-col">
                      <div className="h-28 w-full bg-slate-100 overflow-hidden relative">
                        <img src={ph.url} alt={ph.caption || 'Property'} className="w-full h-full object-cover group-hover:scale-105 transition duration-200" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute top-1.5 right-1.5 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full shadow transition-all"
                          title="Remove photo"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                      <div className="p-1.5">
                        <input
                          type="text"
                          value={ph.caption || ''}
                          placeholder="Caption (e.g. Master Bedroom)"
                          onChange={(e) => handlePhotoCaptionChange(idx, e.target.value)}
                          className="w-full px-1.5 py-1 text-[11px] bg-white border border-slate-200 rounded"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 border-2 border-dashed border-slate-200 rounded-lg text-center bg-slate-50">
                  <Upload size={24} className="mx-auto text-slate-400 mb-1" />
                  <span className="text-xs text-slate-600 block font-medium">No photos uploaded yet</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">Upload high-res JPG, PNG, or WebP images</span>
                </div>
              )}
            </div>

            {/* Documents */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block font-semibold text-slate-700">
                  Legal & Technical Documents ({formData.documents?.length || 0})
                </label>
                <label className="cursor-pointer px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors">
                  <Upload size={12} />
                  <span>Upload Document (PDF)</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleDocUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {formData.documents && formData.documents.length > 0 ? (
                <div className="space-y-2">
                  {formData.documents.map((d: any, idx: number) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <FileText size={18} className="text-blue-600 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold text-slate-900 block truncate">{d.name}</span>
                          <span className="text-slate-400 text-[10px]">{d.size || 'PDF'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={d.tag || 'ok'}
                          onChange={(e) => handleDocTagChange(idx, e.target.value)}
                          className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-medium"
                        >
                          <option value="ok">Valid (OK)</option>
                          <option value="warn">Discrepancy (Warn)</option>
                          <option value="info">Informational</option>
                          <option value="missing">Incomplete</option>
                        </select>
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-blue-600 hover:text-blue-800 bg-white border border-slate-200 rounded"
                          title="Open document"
                        >
                          <ExternalLink size={12} />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(idx)}
                          className="p-1.5 text-red-600 hover:text-red-800 bg-white border border-slate-200 rounded"
                          title="Delete document"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 border-2 border-dashed border-slate-200 rounded-lg text-center bg-slate-50">
                  <FileText size={24} className="mx-auto text-slate-400 mb-1" />
                  <span className="text-xs text-slate-600 block font-medium">No documents attached</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">Upload RERA approval, municipal layout, or encumbrance certificates</span>
                </div>
              )}
            </div>

            {/* Blueprint URLs */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <label className="block font-semibold text-slate-700">Digital Brochure & Site Plan URLs</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Site Plan / Master Layout URL</span>
                  <input
                    type="text"
                    placeholder="https://... or /assets/siteplan.pdf"
                    value={formData.site_plan_url}
                    onChange={(e) => setFormData({ ...formData, site_plan_url: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs"
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Project Brochure URL</span>
                  <input
                    type="text"
                    placeholder="https://... or /assets/brochure.pdf"
                    value={formData.brochure_url}
                    onChange={(e) => setFormData({ ...formData, brochure_url: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveSection('C')}
                className="px-3 py-1.5 text-slate-600 hover:text-black font-semibold text-xs"
              >
                ← Back to Section C
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSave()}
                  disabled={updateMutation.isPending}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Save size={13} />
                  <span>Save Progress</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('E')}
                  className="px-4 py-2 bg-brand-primary hover:bg-brand-primaryHover text-white font-semibold rounded text-xs transition-colors"
                >
                  Continue to Section E: Developer Profile →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION E: SELLER / DEVELOPER INFO */}
        {activeSection === 'E' && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-900">Section E • Seller & Developer Information</h2>
              <p className="text-[11px] text-slate-500">Update developer identity, official contact channels, and historical track record.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Developer / Builder Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Ramez Infra Developers Pvt Ltd"
                  value={formData.seller_name}
                  onChange={(e) => setFormData({ ...formData, seller_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Contact Information *</label>
                <input
                  type="text"
                  placeholder="+91 891 222 3333 / sales@developer.com"
                  value={formData.seller_contact}
                  onChange={(e) => setFormData({ ...formData, seller_contact: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Possession / Handover Date</label>
                <input
                  type="text"
                  placeholder="e.g. Dec 2026 or Ready"
                  value={formData.possession_date}
                  onChange={(e) => setFormData({ ...formData, possession_date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:border-brand-primary"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Developer Profile & Prior Projects</label>
                <textarea
                  rows={3}
                  placeholder="Brief summary of track record, completed units and corporate profile."
                  value={formData.developer_profile}
                  onChange={(e) => setFormData({ ...formData, developer_profile: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs"
                />
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
              <strong>Mandatory Disclosure:</strong> All seller-provided data is verified against municipal cadastral databases and telemetry before receiving full verification clearance.
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveSection('D')}
                className="px-3 py-1.5 text-slate-600 hover:text-black font-semibold text-xs"
              >
                ← Back to Section D
              </button>
              <div className="flex items-center gap-2">
                {formData.status === 'draft' ? (
                  <button
                    type="button"
                    onClick={() => handleSave('published')}
                    disabled={updateMutation.isPending}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-xs transition-colors shadow-sm"
                  >
                    Publish Listing Now
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSave('draft')}
                    disabled={updateMutation.isPending}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs transition-colors"
                  >
                    Save as Draft
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleSave()}
                  disabled={updateMutation.isPending}
                  className="px-5 py-2 bg-brand-primary hover:bg-brand-primaryHover text-white font-semibold rounded text-xs shadow-sm"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save All Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
