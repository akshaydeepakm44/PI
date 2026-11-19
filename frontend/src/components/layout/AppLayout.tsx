import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  Compass,
  MapPin,
  Heart,
  Scale,
  Navigation,
  MessageSquare,
  PlusCircle,
  LayoutDashboard,
  BarChart3,
  ShieldAlert,
  Database,
  AlertTriangle,
  History,
  Menu,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  Sparkles,
  ArrowRightLeft,
  Bot
} from 'lucide-react';
import { Badge } from '../common/Badge';

export const AppLayout: React.FC = () => {
  const { user, role, logout, demoLogin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  // Dynamic Navigation definitions based on active role
  const getNavItems = () => {
    if (role === 'seller') {
      return [
        { label: 'Dashboard', path: '/seller', icon: LayoutDashboard },
        { label: 'New Listing', path: '/seller/new-listing', icon: PlusCircle },
        { label: 'My Listings', path: '/seller/listings', icon: Building2 },
        { label: 'Buyer Enquiries', path: '/seller/enquiries', icon: MessageSquare },
        { label: 'Listing Analytics', path: '/seller/analytics', icon: BarChart3 }
      ];
    }

    if (role === 'admin') {
      return [
        { label: 'Admin Overview', path: '/admin', icon: LayoutDashboard },
        { label: 'All Listings', path: '/admin/listings', icon: Building2 },
        { label: 'Research Jobs', path: '/admin/jobs', icon: Compass },
        { label: 'Data Sources', path: '/admin/sources', icon: Database },
        { label: 'Quality Issues', path: '/admin/issues', icon: AlertTriangle },
        { label: 'Audit Log', path: '/admin/audit-log', icon: History }
      ];
    }

    // Default: Buyer navigation
    return [
      { label: 'Property Discovery', path: '/buyer', icon: Compass },
      { label: 'AI Assistant', path: '/buyer/assistant', icon: Bot },
      { label: 'Interactive Map', path: '/buyer/map', icon: MapPin },
      { label: 'My Wishlist', path: '/buyer/wishlist', icon: Heart },
      { label: 'Compare Properties', path: '/buyer/compare', icon: Scale },
      { label: 'My Commute', path: '/buyer/commute', icon: Navigation },
      { label: 'My Enquiries', path: '/buyer/enquiries', icon: MessageSquare }
    ];
  };

  const navItems = getNavItems();

  const handleRoleSwitch = async (targetRole: 'seller' | 'buyer' | 'admin') => {
    await demoLogin(targetRole);
    setUserDropdownOpen(false);
    if (targetRole === 'seller') navigate('/seller');
    else if (targetRole === 'admin') navigate('/admin');
    else navigate('/buyer');
  };

  return (
    <div className="flex h-screen bg-brand-canvas overflow-hidden">
      {/* --- DESKTOP SIDEBAR --- */}
      <aside
        className={`hidden md:flex flex-col bg-brand-sidebar text-white transition-all duration-300 relative z-30 select-none ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#8bcaa0] text-[#10261a] font-extrabold flex items-center justify-center text-sm font-heading tracking-tighter shadow-xs">
              HiiN
            </div>
            {!isCollapsed && (
              <div>
                <span className="font-bold text-base tracking-tight text-white block leading-tight font-heading">HiiN</span>
                <span className="text-[10px] text-brand-mint font-mono tracking-widest uppercase block">Property Intelligence</span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Current Active Workspace Role Pill */}
        <div className="p-4 border-b border-slate-800/80">
          {!isCollapsed ? (
            <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">Workspace</span>
                <span className="text-xs font-semibold text-white capitalize">{role || 'Guest'} Mode</span>
              </div>
              <Badge variant="demo" className="text-[10px]">Demo mode</Badge>
            </div>
          ) : (
            <div className="flex justify-center" title={`${role || 'Guest'} Workspace`}>
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-amber-300">
                {role ? role[0].toUpperCase() : 'G'}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon size={18} strokeWidth={isActive ? 2.25 : 1.75} className="flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Quick Role Switcher Panel in Sidebar */}
        {!isCollapsed && (
          <div className="p-3 border-t border-slate-800 text-xs">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-2 font-mono flex items-center gap-1.5">
              <ArrowRightLeft size={11} /> Switch Role:
            </span>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => handleRoleSwitch('seller')}
                className={`px-2 py-1.5 rounded text-[11px] font-medium text-center border transition-colors ${
                  role === 'seller' ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' : 'bg-slate-800/50 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                Seller
              </button>
              <button
                onClick={() => handleRoleSwitch('buyer')}
                className={`px-2 py-1.5 rounded text-[11px] font-medium text-center border transition-colors ${
                  role === 'buyer' ? 'bg-blue-500/20 text-blue-300 border-blue-500/50' : 'bg-slate-800/50 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                Buyer
              </button>
              <button
                onClick={() => handleRoleSwitch('admin')}
                className={`px-2 py-1.5 rounded text-[11px] font-medium text-center border transition-colors ${
                  role === 'admin' ? 'bg-rose-500/20 text-rose-300 border-rose-500/50' : 'bg-slate-800/50 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                Admin
              </button>
            </div>
          </div>
        )}

        {/* User Footer */}
        <div className="p-3 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user?.full_name ? user.full_name[0] : 'U'}
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <span className="text-xs font-medium text-white block truncate">{user?.full_name || 'Guest'}</span>
                <span className="text-[10px] text-slate-400 block truncate">{user?.email || 'Not logged in'}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-brand-border px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-md"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-900 tracking-tight">HI IN Property Directory</span>
              <span className="text-slate-300">/</span>
              <span className="text-xs text-slate-500 font-medium capitalize">{role || 'Public'} Workspace</span>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-3">


            {/* Notification Icon */}
            <div className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full relative transition-colors"
                title="Notifications"
              >
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"></span>
              </button>

              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-slate-200 p-3 z-50 text-xs">
                  <div className="font-semibold text-slate-800 border-b border-slate-100 pb-2 mb-2">Notifications</div>
                  <div className="space-y-2">
                    <div className="p-2 bg-slate-50 rounded border border-slate-100">
                      <span className="font-medium text-slate-800 block">System Initialized</span>
                      <span className="text-slate-500 text-[11px] block mt-0.5">Phase 1 database and test records ready.</span>
                    </div>
                    <div className="p-2 bg-blue-50/50 rounded border border-blue-100">
                      <span className="font-medium text-blue-900 block">AI Assistance Placeholder</span>
                      <span className="text-blue-700 text-[11px] block mt-0.5">Typed report interface ready for Phase 2 integration.</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-brand-primary text-white flex items-center justify-center text-xs font-bold">
                  {user?.full_name ? user.full_name[0] : 'U'}
                </div>
                <span className="text-xs font-medium text-slate-700 hidden sm:inline">{user?.full_name || 'Guest'}</span>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-50 text-xs">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <span className="font-semibold text-slate-800 block">{user?.full_name}</span>
                    <span className="text-slate-500 block text-[11px]">{user?.email}</span>
                    <Badge variant="demo" className="mt-1.5 text-[10px]">Role: {role}</Badge>
                  </div>
                  <div className="py-1">
                    <div className="px-3 py-1 text-[10px] uppercase font-mono text-slate-400">Switch Demo Role</div>
                    <button
                      onClick={() => handleRoleSwitch('seller')}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center justify-between"
                    >
                      <span>Seller / Builder</span>
                      {role === 'seller' && <span className="text-emerald-600 font-bold">✓</span>}
                    </button>
                    <button
                      onClick={() => handleRoleSwitch('buyer')}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center justify-between"
                    >
                      <span>Buyer</span>
                      {role === 'buyer' && <span className="text-emerald-600 font-bold">✓</span>}
                    </button>
                    <button
                      onClick={() => handleRoleSwitch('admin')}
                      className="w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center justify-between"
                    >
                      <span>Platform Admin</span>
                      {role === 'admin' && <span className="text-emerald-600 font-bold">✓</span>}
                    </button>
                  </div>
                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={() => { logout(); navigate('/'); }}
                      className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <LogOut size={13} />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Body Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
