import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import { PublicLayout } from './components/layout/PublicLayout';
import { AppLayout } from './components/layout/AppLayout';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { DirectoryPage } from './pages/public/DirectoryPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';

// Buyer Pages
import { PropertyDetailPage } from './pages/buyer/PropertyDetailPage';
import { WishlistPage } from './pages/buyer/WishlistPage';
import { DashboardPage } from './pages/buyer/DashboardPage';
import { ComparePropertiesPage } from './pages/buyer/ComparePropertiesPage';
import { MyCommutePage } from './pages/buyer/MyCommutePage';
import { BuyerEnquiriesPage } from './pages/buyer/BuyerEnquiriesPage';
import { InteractiveMapPage } from './pages/buyer/InteractiveMapPage';
import { AIAssistantPage } from './pages/buyer/AIAssistantPage';
import { GlobalAIAssistantWidget } from './components/assistant/GlobalAIAssistantWidget';

// Seller Pages
import { BuilderPage } from './pages/seller/BuilderPage';
import { SellerDashboard } from './pages/seller/SellerDashboard';
import { NewListingPage } from './pages/seller/NewListingPage';
import { EditListingPage } from './pages/seller/EditListingPage';
import { SellerListingsPage } from './pages/seller/SellerListingsPage';
import { SellerEnquiriesPage } from './pages/seller/SellerEnquiriesPage';
import { ListingAnalyticsPage } from './pages/seller/ListingAnalyticsPage';

// Admin Pages
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminListingsPage } from './pages/admin/AdminListingsPage';
import { ResearchJobsPage } from './pages/admin/ResearchJobsPage';
import { DataSourcesPage } from './pages/admin/DataSourcesPage';
import { DataQualityIssuesPage } from './pages/admin/DataQualityIssuesPage';
import { AuditLogPage } from './pages/admin/AuditLogPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

// Open access without login barriers matching reference portal
const RoleGuard: React.FC<{ allowedRoles?: string[]; children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* --- Public / Main Portal Routes (Zero Login Wall) --- */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/directory" element={<DirectoryPage />} />
              <Route path="/projects" element={<DirectoryPage />} />
              <Route path="/properties/:id" element={<PropertyDetailPage />} />
              <Route path="/compare" element={<ComparePropertiesPage />} />
              <Route path="/map" element={<InteractiveMapPage />} />
              <Route path="/commute" element={<MyCommutePage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/dashboard/projects" element={<DashboardPage initialTab="projects" />} />
              <Route path="/dashboard/units" element={<DashboardPage initialTab="units" />} />
              <Route path="/dashboard/comparison" element={<DashboardPage initialTab="comparison" />} />
              <Route path="/dashboard/commute" element={<DashboardPage initialTab="commute" />} />
              <Route path="/dashboard/settings" element={<DashboardPage initialTab="settings" />} />
              <Route path="/shortlists" element={<DashboardPage initialTab="projects" />} />
              <Route path="/buyer" element={<DashboardPage initialTab="projects" />} />
              <Route path="/assistant" element={<AIAssistantPage />} />
              <Route path="/builder" element={<BuilderPage />} />
              <Route path="/builder/create" element={<BuilderPage />} />
              <Route path="/seller/create" element={<BuilderPage />} />
              <Route path="/login" element={<Navigate to="/" replace />} />
              <Route path="/register" element={<Navigate to="/" replace />} />
            </Route>

            {/* --- Authenticated App Layout Routes --- */}
            <Route element={<AppLayout />}>
              {/* Seller Workspace */}
              <Route
                path="/seller"
                element={
                  <RoleGuard allowedRoles={['seller', 'admin']}>
                    <SellerDashboard />
                  </RoleGuard>
                }
              />
              <Route
                path="/seller/properties/:id"
                element={
                  <RoleGuard allowedRoles={['seller', 'admin']}>
                    <PropertyDetailPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/seller/new-listing"
                element={
                  <RoleGuard allowedRoles={['seller', 'admin']}>
                    <NewListingPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/seller/edit-listing/:id"
                element={
                  <RoleGuard allowedRoles={['seller', 'admin']}>
                    <EditListingPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/seller/listings"
                element={
                  <RoleGuard allowedRoles={['seller', 'admin']}>
                    <SellerListingsPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/seller/enquiries"
                element={
                  <RoleGuard allowedRoles={['seller', 'admin']}>
                    <SellerEnquiriesPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/seller/analytics"
                element={
                  <RoleGuard allowedRoles={['seller', 'admin']}>
                    <ListingAnalyticsPage />
                  </RoleGuard>
                }
              />

              {/* Buyer Workspace */}
              <Route
                path="/buyer"
                element={
                  <RoleGuard allowedRoles={['buyer', 'admin']}>
                    <DirectoryPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/buyer/assistant"
                element={
                  <RoleGuard allowedRoles={['buyer', 'admin']}>
                    <AIAssistantPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/buyer/properties/:id"
                element={
                  <RoleGuard allowedRoles={['buyer', 'admin']}>
                    <PropertyDetailPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/buyer/map"
                element={
                  <RoleGuard allowedRoles={['buyer', 'admin']}>
                    <InteractiveMapPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/buyer/wishlist"
                element={
                  <RoleGuard allowedRoles={['buyer', 'admin']}>
                    <WishlistPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/buyer/compare"
                element={
                  <RoleGuard allowedRoles={['buyer', 'admin']}>
                    <ComparePropertiesPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/buyer/commute"
                element={
                  <RoleGuard allowedRoles={['buyer', 'admin']}>
                    <MyCommutePage />
                  </RoleGuard>
                }
              />
              <Route
                path="/buyer/enquiries"
                element={
                  <RoleGuard allowedRoles={['buyer', 'admin']}>
                    <BuyerEnquiriesPage />
                  </RoleGuard>
                }
              />

              {/* Platform Admin Console */}
              <Route
                path="/admin"
                element={
                  <RoleGuard allowedRoles={['admin']}>
                    <AdminOverviewPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/listings"
                element={
                  <RoleGuard allowedRoles={['admin']}>
                    <AdminListingsPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/jobs"
                element={
                  <RoleGuard allowedRoles={['admin']}>
                    <ResearchJobsPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/sources"
                element={
                  <RoleGuard allowedRoles={['admin']}>
                    <DataSourcesPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/issues"
                element={
                  <RoleGuard allowedRoles={['admin']}>
                    <DataQualityIssuesPage />
                  </RoleGuard>
                }
              />
              <Route
                path="/admin/audit-log"
                element={
                  <RoleGuard allowedRoles={['admin']}>
                    <AuditLogPage />
                  </RoleGuard>
                }
              />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <GlobalAIAssistantWidget />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
