import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Search, ArrowRight, UserCheck, Shield, Building2, Compass } from 'lucide-react';

export const PublicLayout: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoToLoginWithRole = (role: 'seller' | 'buyer' | 'admin') => {
    navigate(`/login?role=${role}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5] text-slate-900 antialiased font-sans">
      {/* Top Navbar matching the uploaded image */}
      <header className="w-full bg-[#faf8f5]/90 backdrop-blur-md border-b border-slate-200/70 sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between">
          {/* Left: Brand + Navigation Links */}
          <div className="flex items-center gap-10">
            <Link to="/" className="flex items-center gap-2 group">
              <span className="font-serif text-2xl font-bold tracking-tight text-slate-900 group-hover:text-[#133238] transition-colors">
                HI IN
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-600">
              <Link to="/" className="hover:text-slate-950 transition-colors font-semibold">Home</Link>
              <a
                href="#about"
                onClick={(e) => {
                  e.preventDefault();
                  if (location.pathname !== '/') {
                    navigate('/#about');
                  } else {
                    document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="hover:text-slate-950 transition-colors"
              >
                About
              </a>
            </nav>
          </div>

          {/* Right: Sign in or Workspace & Sign Out */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to={user?.role === 'seller' ? '/seller' : user?.role === 'admin' ? '/admin' : '/buyer'}
                  className="px-4 py-2 bg-[#133238] text-white text-xs font-semibold rounded-full hover:bg-[#1a444c] flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <UserCheck size={13} />
                  <span>{user?.role ? user.role.toUpperCase() : 'Workspace'}</span>
                </Link>
                <button
                  onClick={() => { logout(); navigate('/'); }}
                  className="text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-700 hover:text-slate-950 transition-colors px-4 py-2 border border-slate-200 hover:border-slate-300 rounded-full"
                >
                  Sign in
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Page Outlet */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer matching modern clean editorial aesthetic */}
      <footer id="about" className="bg-[#f5f2eb] border-t border-slate-200/80 py-12 px-4 sm:px-8 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <span className="font-serif text-2xl font-bold tracking-tight text-slate-900 block">HI IN</span>
            <p className="max-w-md text-xs text-slate-500 leading-relaxed">
              An AI-assisted property intelligence and due-diligence directory for Visakhapatnam. Connecting buyers, sellers and administrators with verified coordinates, authentic OpenStreetMap amenities, OSRM drive times, and Copernicus atmospheric telemetry.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono pt-2">
              <span>OSM Nominatim</span> • <span>Overpass API</span> • <span>Open-Meteo AQI</span> • <span>Project OSRM</span>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider font-mono">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/directory" className="hover:text-black">All Properties</Link></li>
              <li><Link to="/buyer/map" className="hover:text-black">Map-First Explorer</Link></li>
              <li><Link to="/buyer/compare" className="hover:text-black">Compare Properties</Link></li>
              <li><Link to="/properties/1" className="hover:text-black">Location Intelligence Dossier</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider font-mono">Workspace Roles</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => handleGoToLoginWithRole('buyer')}
                  className="hover:text-black text-left flex items-center gap-1.5"
                >
                  <Compass size={12} className="text-slate-400" />
                  <span>Buyer Experience</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleGoToLoginWithRole('seller')}
                  className="hover:text-black text-left flex items-center gap-1.5"
                >
                  <Building2 size={12} className="text-slate-400" />
                  <span>Seller / Builder Dashboard</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleGoToLoginWithRole('admin')}
                  className="hover:text-black text-left flex items-center gap-1.5"
                >
                  <Shield size={12} className="text-slate-400" />
                  <span>Admin Telemetry Console</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>© 2026 HI IN Property Intelligence Platform. Built for authentic real-world due diligence.</p>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hover:text-slate-600">Login</Link>
            <Link to="/register" className="hover:text-slate-600">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
