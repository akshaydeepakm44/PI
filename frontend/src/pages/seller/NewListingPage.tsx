import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { propertyApi, uploadApi } from '../../services/api';
import { MapPicker } from '../../components/common/MapPicker';
import { Badge } from '../../components/common/Badge';
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
  Eye
} from 'lucide-react';

export const NewListingPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('A');
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    // A. Identity
    name: '',
    property_type: 'apartment',
    state: 'Andhra Pradesh',
    district: 'Visakhapatnam',
    city: 'Visakhapatnam',
    locality: '',
    address: '',
    latitude: 17.7944,
    longitude: 83.3574,
    area: 1500,
    area_unit: 'sq ft',
    road_access_m: 15,
    frontage_m: 35,
    survey_number: '',

    // B. Pricing
    asking_price: '',
    price_unit: 'INR',
    total_price: 7500000,
    payment_terms: '20% booking milestone',
    additional_charges: 'Parking & Clubhouse: ₹3.0 Lakhs',
    maintenance_charges: '₹2.5 / sq ft / month',
    availability_date: 'Dec 2026',

    // C. Property details
    description: '',
    amenities: 'Swimming Pool, Gymnasium, 24/7 Security, Covered Parking',
    utilities: '100% Power Backup, Municipal Water, STP Plant',
    floors: 12,
    towers: 2,
    unit_count: 120,
    construction_status: 'Under Construction',

    // D. Evidence
    photos: [] as { url: string; caption?: string }[],
    site_plan_url: '',
    brochure_url: '',
    survey_sketch_url: '',
    documents: [] as { name: string; url: string; tag?: string; size?: string }[],

    // E. Seller Information
    seller_name: '',
    seller_contact: '',
    possession_date: 'Dec 2026',
    developer_profile: ''
  });

  // Photo upload handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadApi.uploadPhoto(file);
      setFormData((prev) => ({
        ...prev,
        photos: [...prev.photos, { url: res.url, caption: file.name }]
      }));
      setStatusMessage({ type: 'success', text: `Uploaded photo: ${file.name}` });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Photo upload failed. Try again.' });
    }
  };

  // Document upload handler
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadApi.uploadDocument(file);
      setFormData((prev) => ({
        ...prev,
        documents: [
          ...prev.documents,
          {
            name: file.name,
            url: res.url,
            tag: 'info',
            size: `${(file.size / 1024 / 1024).toFixed(1)} MB`
          }
        ]
      }));
      setStatusMessage({ type: 'success', text: `Uploaded document: ${file.name}` });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Document upload failed. Try again.' });
    }
  };

  const createMutation = useMutation({
    mutationFn: (status: 'draft' | 'published') => {
      const payload: any = {
        ...formData,
        status,
        amenities: formData.amenities.split(',').map((s) => s.trim()).filter(Boolean),
        utilities: formData.utilities.split(',').map((s) => s.trim()).filter(Boolean)
      };
      return propertyApi.createProperty(payload);
    },
    onSuccess: (data, status) => {
      setStatusMessage({
        type: 'success',
        text: `Listing successfully ${status === 'published' ? 'published' : 'saved as draft'}!`
      });
      setTimeout(() => navigate('/seller/listings'), 1200);
    },
    onError: (err: any) => {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.detail || 'Failed to save property listing.'
      });
    }
  });

  const handleSubmit = (status: 'draft' | 'published') => {
    // Basic validation
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

    createMutation.mutate(status);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title Header */}
      <div className="bg-white p-6 rounded-lg border border-brand-border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">New Property Listing Form</h1>
              <Badge variant="unverified">Seller provided / Unverified</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Provide complete identity, pricing, specifications, and evidence. Information is clearly labelled unverified until independent checking.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleSubmit('draft')}
              disabled={createMutation.isPending}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs flex items-center gap-1.5 transition-colors"
            >
              <Save size={13} />
              <span>Save Draft</span>
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('published')}
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-brand-primary hover:bg-brand-primaryHover text-white font-semibold rounded text-xs flex items-center gap-1.5 transition-colors"
            >
              <Send size={13} />
              <span>Publish Listing</span>
            </button>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="mt-6 flex items-center gap-1 border-b border-slate-200 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveSection('A')}
            className={`px-3 py-2 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeSection === 'A' ? 'border-brand-primary text-slate-900 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>A. Identity & Map Pin</span>
          </button>
          <button
            onClick={() => setActiveSection('B')}
            className={`px-3 py-2 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeSection === 'B' ? 'border-brand-primary text-slate-900 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>B. Pricing & Terms</span>
          </button>
          <button
            onClick={() => setActiveSection('C')}
            className={`px-3 py-2 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeSection === 'C' ? 'border-brand-primary text-slate-900 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>C. Details & Specs</span>
          </button>
          <button
            onClick={() => setActiveSection('D')}
            className={`px-3 py-2 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeSection === 'D' ? 'border-brand-primary text-slate-900 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>D. Evidence & Photos</span>
          </button>
          <button
            onClick={() => setActiveSection('E')}
            className={`px-3 py-2 border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeSection === 'E' ? 'border-brand-primary text-slate-900 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>E. Developer Profile</span>
          </button>
        </div>
      </div>

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`p-3 rounded text-xs flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {statusMessage.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Multi-Section Form Container */}
      <div className="bg-white p-6 rounded-lg border border-brand-border space-y-6 text-xs">
        {/* SECTION A: PROPERTY IDENTITY */}
        {activeSection === 'A' && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-900">Section A · Property Identity & Stored Coordinates</h2>
              <p className="text-[11px] text-slate-500">Provide verified project identifiers, road access, and drop an exact GPS pin on the map.</p>
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
                  onChange={(e) => setFormData({ ...formData, property_type: e.target.value as any })}
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
                  placeholder="e.g. Madhurawada, Rushikonda, MVP Colony"
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
                <label className="block font-semibold text-slate-700 mb-1">Optional Survey / Revenue Plot Number</label>
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
                <label className="block font-semibold text-slate-700 mb-1">
                  Stored GPS Coordinates (Drag pin or click map)
                </label>
                <MapPicker
                  latitude={formData.latitude}
                  longitude={formData.longitude}
                  onChange={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveSection('B')}
                className="px-4 py-2 bg-brand-primary text-white font-semibold rounded"
              >
                Continue to Section B: Pricing →
              </button>
            </div>
          </div>
        )}

        {/* SECTION B: PRICING */}
        {activeSection === 'B' && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-900">Section B · Pricing & Payment Terms</h2>
              <p className="text-[11px] text-slate-500">Specify asking price, additional charges, and payment schedule.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Asking Price (Display string) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ₹75 L - 1.2 Cr or ₹85 Lakhs"
                  value={formData.asking_price}
                  onChange={(e) => setFormData({ ...formData, asking_price: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estimated Total Price (Numeric for sorting)</label>
                <input
                  type="number"
                  placeholder="e.g. 8500000"
                  value={formData.total_price}
                  onChange={(e) => setFormData({ ...formData, total_price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
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
                  placeholder="e.g. Clubhouse & Car Parking: ₹3.5 Lakhs"
                  value={formData.additional_charges}
                  onChange={(e) => setFormData({ ...formData, additional_charges: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Maintenance Charges</label>
                <input
                  type="text"
                  placeholder="e.g. ₹2.5 / sq ft / month"
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

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveSection('A')}
                className="px-3 py-1.5 text-slate-600 hover:text-black font-semibold"
              >
                ← Back to Section A
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('C')}
                className="px-4 py-2 bg-brand-primary text-white font-semibold rounded"
              >
                Continue to Section C: Details →
              </button>
            </div>
          </div>
        )}

        {/* SECTION C: DETAILS */}
        {activeSection === 'C' && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-900">Section C · Property Details & Specifications</h2>
              <p className="text-[11px] text-slate-500">Description, amenities, utilities, floor and tower counts.</p>
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amenities (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="Swimming Pool, Gymnasium, 24/7 Security"
                    value={formData.amenities}
                    onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Utilities (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="100% Power Backup, Municipal Water"
                    value={formData.utilities}
                    onChange={(e) => setFormData({ ...formData, utilities: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs"
                  />
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

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveSection('B')}
                className="px-3 py-1.5 text-slate-600 hover:text-black font-semibold"
              >
                ← Back to Section B
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('D')}
                className="px-4 py-2 bg-brand-primary text-white font-semibold rounded"
              >
                Continue to Section D: Evidence →
              </button>
            </div>
          </div>
        )}

        {/* SECTION D: EVIDENCE */}
        {activeSection === 'D' && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-900">Section D · Evidence, Photos & Documents</h2>
              <p className="text-[11px] text-slate-500">Upload site photographs, brochures, sanction plans and title deeds.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Property Photographs</label>
                <div className="p-4 border-2 border-dashed border-slate-200 rounded-lg text-center bg-slate-50">
                  <Upload size={20} className="mx-auto text-slate-400 mb-1" />
                  <span className="text-xs text-slate-600 block">Upload Project Photos (JPG, PNG, WebP)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="mt-2 text-xs"
                  />
                </div>
                {formData.photos.length > 0 && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {formData.photos.map((ph, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded border border-slate-300 overflow-hidden">
                        <img src={ph.url} alt="Uploaded" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Legal & Technical Documents</label>
                <div className="p-4 border-2 border-dashed border-slate-200 rounded-lg text-center bg-slate-50">
                  <FileText size={20} className="mx-auto text-slate-400 mb-1" />
                  <span className="text-xs text-slate-600 block">Upload Sanction Plan, RERA Certificate or Brochure (PDF)</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleDocUpload}
                    className="mt-2 text-xs"
                  />
                </div>
                {formData.documents.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {formData.documents.map((d, idx) => (
                      <div key={idx} className="p-2 bg-slate-50 rounded border border-slate-200 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800">{d.name}</span>
                        <span className="text-slate-400 text-[10px]">{d.size}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveSection('C')}
                className="px-3 py-1.5 text-slate-600 hover:text-black font-semibold"
              >
                ← Back to Section C
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('E')}
                className="px-4 py-2 bg-brand-primary text-white font-semibold rounded"
              >
                Continue to Section E: Seller Profile →
              </button>
            </div>
          </div>
        )}

        {/* SECTION E: SELLER / DEVELOPER INFO */}
        {activeSection === 'E' && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h2 className="text-sm font-bold text-slate-900">Section E · Seller & Developer Information</h2>
              <p className="text-[11px] text-slate-500">Developer identity, official contact channel and track record.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Developer / Builder Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Ramez Infra Developers Pvt Ltd"
                  value={formData.seller_name}
                  onChange={(e) => setFormData({ ...formData, seller_name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Contact Information *</label>
                <input
                  type="text"
                  placeholder="+91 891 222 3333 / sales@developer.com"
                  value={formData.seller_contact}
                  onChange={(e) => setFormData({ ...formData, seller_contact: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs"
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
              <strong>Mandatory Disclosure:</strong> Upon publishing, this listing will be labeled <em>"Seller provided / Unverified"</em> until independent municipal and cadastral checks are performed.
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveSection('D')}
                className="px-3 py-1.5 text-slate-600 hover:text-black font-semibold"
              >
                ← Back to Section D
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSubmit('draft')}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-xs"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit('published')}
                  className="px-5 py-2 bg-brand-primary hover:bg-brand-primaryHover text-white font-semibold rounded text-xs"
                >
                  Publish Listing Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
