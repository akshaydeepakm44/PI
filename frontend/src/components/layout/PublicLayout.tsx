import React, { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  ChevronDown,
  Columns,
  User,
  LogOut,
  Moon,
  Sun,
  Building2
} from 'lucide-react';

export const PublicLayout: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/directory?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/directory');
    }
  };

  const isHome = location.pathname === '/';
  const isListings = location.pathname.startsWith('/directory') || location.pathname.startsWith('/projects');
  const isBuilder = location.pathname.startsWith('/builder');

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfcfc] text-[#111111] antialiased font-sans">
      {/* Top Navbar matching Image 1 (.portal-header) */}
      <header className="portal-header">
        {/* Brand Logo matching Image 1 */}
        <Link
          to="/"
          className="portal-logo"
          onClick={() => setMenuOpen(false)}
        >
          PORTAL
        </Link>

        {/* Primary Navigation matching Image 1 */}
        <nav className="portal-primary-nav" aria-label="Main navigation">
          <Link
            to="/"
            aria-current={isHome ? 'page' : undefined}
            onClick={() => setMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            to="/directory"
            aria-current={isListings ? 'page' : undefined}
            onClick={() => setMenuOpen(false)}
          >
            Listings
          </Link>
          <Link
            to="/builder"
            aria-current={isBuilder ? 'page' : undefined}
            onClick={() => setMenuOpen(false)}
          >
            Builder
          </Link>
        </nav>

        {/* Search Input in Top Bar matching Image 1 */}
        <form className="header-search" role="search" onSubmit={handleSearchSubmit}>
          <Search size={16} />
          <input
            aria-label="Search a project, locality, city or builder"
            placeholder="Search a project, locality, city or builder"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>

        {/* User Account Trigger matching Image 1 & Dropdown matching Image 4 */}
        <div className="header-actions" ref={menuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            className="account-trigger cursor-pointer"
            aria-label="User account menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className="account-avatar font-bold font-mono">
              AR
            </span>
            <span className="account-copy">
              <strong>Ananya Rao</strong>
              <small>ananya.rao@example.com</small>
            </span>
            <ChevronDown size={14} className="text-[#5c5c5c]" />
          </button>

          {/* User Profile Dropdown Menu matching Image 4 */}
          {menuOpen && (
            <div className="account-menu">
              <strong>Ananya Rao</strong>
              <small>ananya.rao@example.com</small>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/dashboard');
                }}
              >
                <Columns size={16} className="text-[#5c5c5c]" />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/builder');
                }}
              >
                <Building2 size={16} className="text-[#5c5c5c]" />
                <span>Builder Portal</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/dashboard?tab=settings');
                }}
              >
                <User size={16} className="text-[#5c5c5c]" />
                <span>Account</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/');
                }}
              >
                <LogOut size={16} className="text-[#5c5c5c]" />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer matching Image 2 (.site-footer .portal-footer) */}
      <footer className="site-footer portal-footer">
        <div className="footer-inner">
          <div className="footer-grid">
            {/* Column 1: Brand Line */}
            <div className="footer-brand">
              <div className="footer-brand-line flex items-center justify-between">
                <h3>PORTAL</h3>
                <button
                  type="button"
                  className="footer-theme-mobile cursor-pointer p-1 text-[#767676] hover:text-[#111111]"
                  aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                  onClick={() => setIsDarkMode(!isDarkMode)}
                >
                  {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
              </div>
              <p>Homes in Hyderabad, with the details that matter before you visit.</p>
            </div>

            {/* Column 2: Explore */}
            <div className="footer-column">
              <h3>Explore</h3>
              {['Buy', 'Rent', 'New projects', 'Commercial'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => navigate('/directory')}
                >
                  {item}
                </button>
              ))}
            </div>

            {/* Column 3: Tools */}
            <div className="footer-column">
              <h3>Tools</h3>
              {[
                { name: 'My Commute', link: '/dashboard?tab=commute' },
                { name: 'Compare', link: '/dashboard?tab=comparison' },
                { name: 'Home loan calculator', link: '/directory' },
                { name: 'Saved searches', link: '/dashboard' }
              ].map(({ name, link }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => navigate(link)}
                >
                  {name}
                </button>
              ))}
            </div>

            {/* Column 4: Company */}
            <div className="footer-column">
              <h3>Company</h3>
              {[
                { name: 'About us', link: '/directory' },
                { name: 'Careers', link: '/directory' },
                { name: 'Contact', link: '/directory' },
                { name: 'Partner with us (Builder)', link: '/builder' }
              ].map(({ name, link }) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => navigate(link)}
                >
                  {name}
                </button>
              ))}
            </div>

            {/* Column 5: Help & Theme Toggle */}
            <div className="footer-column relative">
              <button
                type="button"
                className="footer-theme-toggle footer-theme-desktop absolute top-0 right-0 p-1 text-[#767676] hover:text-[#111111] cursor-pointer"
                aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                onClick={() => setIsDarkMode(!isDarkMode)}
              >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <h3>Help</h3>
              {['FAQs', 'RERA guide', 'Report a listing', 'Privacy'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => navigate('/directory')}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Bottom copyright */}
          <div className="footer-bottom">
            <p>© 2026 Portal · All rights reserved</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
