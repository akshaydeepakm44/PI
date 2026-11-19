import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Search, ArrowRight, UserCheck, Shield, Building2, Compass, MapPin } from 'lucide-react';

export const PublicLayout: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfcfc] text-[#111111] antialiased font-sans">
      {/* Top Navbar matching the portal theme */}
      <header className="w-full bg-[#ffffff]/90 backdrop-blur-md border-b border-[#eeeeee] sticky top-0 z-40 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-18 flex items-center justify-between">
          {/* Left: Brand + Navigation Links */}
          <div className="flex items-center gap-10">
            <Link to="/" className="flex items-center gap-2.5 group">
              <span className="w-8 h-8 rounded bg-[#10261a] text-[#8bcaa0] font-bold text-sm flex items-center justify-center font-heading">
                H
              </span>
              <span className="font-heading text-2xl font-bold tracking-tight text-[#10261a] group-hover:text-[#1e6b3a] transition-colors">
                HiiN
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-[#5c5c5c]">
              <Link to="/" className="hover:text-[#111111] transition-colors font-semibold">Home</Link>
              <Link to="/directory" className="hover:text-[#111111] transition-colors">Projects</Link>
              <Link to="/compare" className="hover:text-[#111111] transition-colors">Compare</Link>
              <Link to="/map" className="hover:text-[#111111] transition-colors">Map</Link>
              <Link to="/commute" className="hover:text-[#111111] transition-colors">My Commute</Link>
            </nav>
          </div>

          {/* Right: City Badge + Resident Profile Badge (No Login Wall) */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eef7f1] text-[#1e6b3a] text-xs font-semibold border border-[#8bcaa0]/40">
              <MapPin size={12} />
              <span>Hyderabad</span>
            </span>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#dedede] text-xs shadow-xs">
              <span className="w-6 h-6 rounded-full bg-[#10261a] text-[#8bcaa0] flex items-center justify-center font-bold text-[11px]">
                {user?.full_name?.charAt(0) || 'A'}
              </span>
              <span className="font-semibold text-slate-800 hidden sm:inline">
                {user?.full_name || 'Buyer'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                Resident
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Page Outlet */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer matching modern clean editorial aesthetic */}
      <footer id="about" className="bg-[#f7f7f7] border-t border-[#dedede] py-12 px-4 sm:px-8 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-3">
            <span className="font-serif text-2xl font-bold tracking-tight text-[#10261a] block">HiiN</span>
            <p className="max-w-md text-xs text-slate-500 leading-relaxed">
              An AI-assisted property intelligence and due-diligence directory for Hyderabad. Connecting buyers, investors and developers with verified coordinates, authentic OpenStreetMap amenities, OSRM drive times, and CPCB atmospheric telemetry.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono pt-2">
              <span>OSM Nominatim</span> • <span>Overpass API</span> • <span>CPCB & Open-Meteo AQI</span> • <span>Project OSRM</span>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider font-mono">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/directory" className="hover:text-black">All Projects</Link></li>
              <li><Link to="/map" className="hover:text-black">Map-First Explorer</Link></li>
              <li><Link to="/compare" className="hover:text-black">Compare Properties</Link></li>
              <li><Link to="/properties/1" className="hover:text-black">Ramky Kingston Park Orbit</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 mb-3 text-xs uppercase tracking-wider font-mono">Platform Tools</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/commute" className="hover:text-black flex items-center gap-1.5"><Compass size={12} className="text-slate-400" /><span>My Commute Calculator</span></Link></li>
              <li><Link to="/seller" className="hover:text-black flex items-center gap-1.5"><Building2 size={12} className="text-slate-400" /><span>Developer Console</span></Link></li>
              <li><Link to="/admin" className="hover:text-black flex items-center gap-1.5"><Shield size={12} className="text-slate-400" /><span>Telemetry & Pipeline Admin</span></Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-[#dedede] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>© 2026 HiiN Property Intelligence Platform. Built for authentic real-world due diligence.</p>
          <div className="flex items-center gap-4">
            <Link to="/directory" className="hover:text-slate-600">Directory</Link>
            <Link to="/compare" className="hover:text-slate-600">Compare</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
