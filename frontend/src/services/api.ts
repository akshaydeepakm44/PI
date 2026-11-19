import axios from 'axios';
import {
  AuthResponse,
  User,
  Property,
  Enquiry,
  WishlistItem,
  AIAssistanceReport,
  AdminOverview,
  ResearchJob,
  DataSource,
  DataQualityIssue,
  AuditLog,
  PropertyReportResponse,
  PropertyEvidenceLayer,
  BuyerPreferences,
  PropertyComparisonResponse
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to inject JWT Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hi_in_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to handle unauthorized / token expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if expired or invalid
      localStorage.removeItem('hi_in_token');
      localStorage.removeItem('hi_in_user');
    }
    return Promise.reject(error);
  }
);

// --- AUTH SERVICES ---
export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/login', { email, password });
    return res.data;
  },
  register: async (data: { email: string; password: string; full_name: string; role: string }): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/register', data);
    return res.data;
  },
  demoLogin: async (role: 'seller' | 'buyer' | 'admin'): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>('/auth/demo-login', { role });
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  }
};

// --- PROPERTY SERVICES ---
export const propertyApi = {
  getProperties: async (params?: Record<string, any>): Promise<Property[]> => {
    const res = await api.get<Property[]>('/properties', { params });
    return res.data;
  },
  getProperty: async (id: number): Promise<Property> => {
    const res = await api.get<Property>(`/properties/${id}`);
    return res.data;
  },
  createProperty: async (data: Partial<Property>): Promise<Property> => {
    const res = await api.post<Property>('/properties', data);
    return res.data;
  },
  updateProperty: async (id: number, data: Partial<Property>): Promise<Property> => {
    const res = await api.put<Property>(`/properties/${id}`, data);
    return res.data;
  },
  deleteProperty: async (id: number): Promise<void> => {
    await api.delete(`/properties/${id}`);
  },
  getSellerProperties: async (): Promise<Property[]> => {
    const res = await api.get<Property[]>('/seller/properties');
    return res.data;
  },
  getSellerAnalytics: async (): Promise<any> => {
    const res = await api.get('/seller/analytics');
    return res.data;
  }
};

// --- ENQUIRY SERVICES ---
export const enquiryApi = {
  submitEnquiry: async (data: { property_id: number; message: string; buyer_name?: string; buyer_email?: string; buyer_phone?: string }): Promise<Enquiry> => {
    const res = await api.post<Enquiry>('/enquiries', data);
    return res.data;
  },
  getBuyerEnquiries: async (): Promise<Enquiry[]> => {
    const res = await api.get<Enquiry[]>('/buyer/enquiries');
    return res.data;
  },
  getSellerEnquiries: async (): Promise<Enquiry[]> => {
    const res = await api.get<Enquiry[]>('/seller/enquiries');
    return res.data;
  },
  replyToEnquiry: async (id: number, reply: string): Promise<Enquiry> => {
    const res = await api.post<Enquiry>(`/seller/enquiries/${id}/reply`, { reply });
    return res.data;
  }
};

// --- WISHLIST SERVICES ---
export const wishlistApi = {
  getWishlist: async (): Promise<WishlistItem[]> => {
    const res = await api.get<WishlistItem[]>('/wishlists');
    return res.data;
  },
  addToWishlist: async (propertyId: number): Promise<WishlistItem> => {
    const res = await api.post<WishlistItem>(`/wishlists/${propertyId}`);
    return res.data;
  },
  removeFromWishlist: async (propertyId: number): Promise<void> => {
    await api.delete(`/wishlists/${propertyId}`);
  }
};

// --- ADMIN SERVICES ---
export const adminApi = {
  getOverview: async (): Promise<AdminOverview> => {
    const res = await api.get<AdminOverview>('/admin/overview');
    return res.data;
  },
  getProperties: async (): Promise<Property[]> => {
    const res = await api.get<Property[]>('/admin/properties');
    return res.data;
  },
  updateListingStatus: async (propertyId: number, status: string, reason?: string): Promise<Property> => {
    const res = await api.patch<Property>(`/admin/properties/${propertyId}/status`, { status, reason });
    return res.data;
  },
  getResearchJobs: async (): Promise<ResearchJob[]> => {
    const res = await api.get<ResearchJob[]>('/admin/jobs');
    return res.data;
  },
  retryResearchJob: async (jobId: number): Promise<ResearchJob> => {
    const res = await api.post<ResearchJob>(`/admin/jobs/${jobId}/retry`);
    return res.data;
  },
  getDataSources: async (): Promise<DataSource[]> => {
    const res = await api.get<DataSource[]>('/admin/sources');
    return res.data;
  },
  pingLiveSources: async (): Promise<DataSource[]> => {
    const res = await api.post<DataSource[]>('/admin/sources/live-check');
    return res.data;
  },
  getQualityIssues: async (): Promise<DataQualityIssue[]> => {
    const res = await api.get<DataQualityIssue[]>('/admin/issues');
    return res.data;
  },
  resolveQualityIssue: async (issueId: number): Promise<DataQualityIssue> => {
    const res = await api.patch<DataQualityIssue>(`/admin/issues/${issueId}/resolve`);
    return res.data;
  },
  getAuditLogs: async (): Promise<AuditLog[]> => {
    const res = await api.get<AuditLog[]>('/admin/audit-logs');
    return res.data;
  }
};

// --- PHASE 2 LOCATION INTELLIGENCE SERVICES ---
export const intelligenceApi = {
  getPropertyIntelligence: async (propertyId: number): Promise<any> => {
    const res = await api.get(`/intelligence/properties/${propertyId}`);
    return res.data;
  },
  refreshPropertyIntelligence: async (propertyId: number): Promise<any> => {
    const res = await api.post(`/intelligence/properties/${propertyId}/refresh`);
    return res.data;
  },
  getPropertyEvidence: async (propertyId: number): Promise<PropertyEvidenceLayer> => {
    const res = await api.get<PropertyEvidenceLayer>(`/intelligence/properties/${propertyId}/evidence`);
    return res.data;
  },
  getPropertyReport: async (propertyId: number): Promise<PropertyReportResponse> => {
    const res = await api.get<PropertyReportResponse>(`/intelligence/properties/${propertyId}/report`);
    return res.data;
  },
  generatePropertyReport: async (
    propertyId: number,
    buyerPreferences?: BuyerPreferences,
    forceRefresh: boolean = false
  ): Promise<PropertyReportResponse> => {
    const res = await api.post<PropertyReportResponse>(`/intelligence/properties/${propertyId}/report/generate`, {
      buyer_preferences: buyerPreferences,
      force_refresh: forceRefresh
    });
    return res.data;
  },
  getPricingIntelligence: async (propertyId: number): Promise<any> => {
    const res = await api.get(`/intelligence/properties/${propertyId}/pricing-intelligence`);
    return res.data;
  },
  getModuleIntelligence: async (propertyId: number, module: string): Promise<any> => {
    const res = await api.get(`/intelligence/properties/${propertyId}/module-intelligence`, {
      params: { module }
    });
    return res.data;
  },
  compareProperties: async (
    propertyIds: number[],
    buyerPreferences?: BuyerPreferences
  ): Promise<PropertyComparisonResponse> => {
    const res = await api.post<PropertyComparisonResponse>('/intelligence/compare', {
      property_ids: propertyIds,
      buyer_preferences: buyerPreferences
    });
    return res.data;
  }
};

// --- PHASE 2 GEOCODING SERVICES ---
export const geocodingApi = {
  searchAddress: async (q: string, limit: number = 5): Promise<any[]> => {
    const res = await api.get('/geocoding/search', { params: { q, limit } });
    return res.data;
  },
  reverseGeocode: async (lat: number, lon: number): Promise<any> => {
    const res = await api.get('/geocoding/reverse', { params: { lat, lon } });
    return res.data;
  }
};

// --- PHASE 2 ROUTING SERVICES ---
export const routingApi = {
  computeRoute: async (data: {
    origin_lat: number;
    origin_lon: number;
    dest_lat: number;
    dest_lon: number;
    destination_name?: string;
  }): Promise<any> => {
    const res = await api.post('/routing/route', data);
    return res.data;
  }
};


// --- UPLOAD SERVICES ---
export const uploadApi = {
  uploadPhoto: async (file: File): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/uploads/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  uploadDocument: async (file: File): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/uploads/document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};

export default api;
