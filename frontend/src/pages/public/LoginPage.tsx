import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Building2,
  Compass,
  Shield,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Lock,
  ChevronDown,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRoleParam = searchParams.get('role');
  const validInitialRole = (initialRoleParam === 'seller' || initialRoleParam === 'admin' || initialRoleParam === 'buyer')
    ? initialRoleParam
    : 'buyer';

  const [selectedRole, setSelectedRole] = useState<'buyer' | 'seller' | 'admin'>(validInitialRole);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login, demoLogin, isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  // Update selectedRole if query param changes
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'seller' || roleParam === 'admin' || roleParam === 'buyer') {
      setSelectedRole(roleParam);
    }
  }, [searchParams]);

  // Handle Role-Based Login Execution
  const handleRoleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await demoLogin(selectedRole);
      if (selectedRole === 'seller') {
        navigate('/seller');
      } else if (selectedRole === 'admin') {
        navigate('/admin');
      } else {
        navigate('/buyer');
      }
    } catch (err: any) {
      setError('Authentication failed. Please verify that the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Standard Email/Password Form Submission
  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roleDetails = {
    buyer: {
      title: 'Buyer & Investor',
      badge: 'Buyer Mode',
      icon: Compass,
      description: 'Search properties on map, review authentic Overpass POIs, calculate commute times and compare listings.',
      targetWorkspace: '/buyer',
      email: 'test_buyer@hi-in.com'
    },
    seller: {
      title: 'Seller / Builder',
      badge: 'Developer Mode',
      icon: Building2,
      description: 'Publish developments with Nominatim reverse-geocoding, manage intake documents and respond to buyer enquiries.',
      targetWorkspace: '/seller',
      email: 'test_seller@hi-in.com'
    },
    admin: {
      title: 'Platform Administrator',
      badge: 'Super Admin',
      icon: Shield,
      description: 'Monitor research pipeline queues, ping live external data sources, review quality issues and inspect audit logs.',
      targetWorkspace: '/admin',
      email: 'test_admin@hi-in.com'
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
      {/* Header */}
      <div className="text-center mb-8 space-y-2">
        <Link to="/" className="inline-block font-serif text-3xl font-bold tracking-tight text-slate-900 hover:text-[#133238] transition-colors">
          HI IN
        </Link>
        <h1 className="text-2xl sm:text-3xl font-serif font-normal text-slate-900 tracking-tight">
          Select your role to sign in
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
          Choose a workspace role below, then click login to enter the platform.
        </p>
      </div>

      {/* Already logged in banner if applicable */}
      {isAuthenticated && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <UserCheck size={16} className="text-emerald-700" />
            <span>Currently logged in as <strong>{user?.email}</strong> ({user?.role?.toUpperCase()})</span>
          </div>
          <button
            onClick={logout}
            className="text-xs text-emerald-800 underline hover:text-emerald-950 font-medium"
          >
            Switch Account
          </button>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2.5">
          <AlertCircle size={15} className="flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Role Selection Container */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
        
        {/* Step 1: Role Selection Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider font-semibold text-slate-400">
              1. Select Workspace Role
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Role: <strong className="text-slate-800 capitalize">{selectedRole}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* Role 1: Buyer */}
            <button
              type="button"
              onClick={() => setSelectedRole('buyer')}
              className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start justify-between gap-4 ${
                selectedRole === 'buyer'
                  ? 'border-[#133238] bg-[#133238]/[0.03] ring-2 ring-[#133238]/10 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                  selectedRole === 'buyer' ? 'bg-[#133238] text-white shadow-2xs' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Compass size={20} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">Buyer & Investor</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full font-mono">
                      Buyer Mode
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-md">
                    Explore map listings, inspect real Overpass amenities, compute road commute times and create comparison matrices.
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono block pt-0.5">
                    Account: test_buyer@hi-in.com
                  </span>
                </div>
              </div>

              <div className="pt-1 flex-shrink-0">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                  selectedRole === 'buyer'
                    ? 'border-[#133238] bg-[#133238] text-white'
                    : 'border-slate-300 bg-white'
                }`}>
                  {selectedRole === 'buyer' && <CheckCircle2 size={13} />}
                </div>
              </div>
            </button>

            {/* Role 2: Seller */}
            <button
              type="button"
              onClick={() => setSelectedRole('seller')}
              className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start justify-between gap-4 ${
                selectedRole === 'seller'
                  ? 'border-[#133238] bg-[#133238]/[0.03] ring-2 ring-[#133238]/10 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                  selectedRole === 'seller' ? 'bg-[#133238] text-white shadow-2xs' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Building2 size={20} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">Seller / Builder</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded-full font-mono">
                      Developer Mode
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-md">
                    Publish new properties with Nominatim address lookup & pin-point accuracy, upload deeds, and respond to incoming buyer enquiries.
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono block pt-0.5">
                    Account: test_seller@hi-in.com
                  </span>
                </div>
              </div>

              <div className="pt-1 flex-shrink-0">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                  selectedRole === 'seller'
                    ? 'border-[#133238] bg-[#133238] text-white'
                    : 'border-slate-300 bg-white'
                }`}>
                  {selectedRole === 'seller' && <CheckCircle2 size={13} />}
                </div>
              </div>
            </button>

            {/* Role 3: Admin */}
            <button
              type="button"
              onClick={() => setSelectedRole('admin')}
              className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start justify-between gap-4 ${
                selectedRole === 'admin'
                  ? 'border-[#133238] bg-[#133238]/[0.03] ring-2 ring-[#133238]/10 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                  selectedRole === 'admin' ? 'bg-[#133238] text-white shadow-2xs' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Shield size={20} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">Platform Administrator</span>
                    <span className="text-[10px] bg-purple-100 text-purple-800 font-semibold px-2 py-0.5 rounded-full font-mono">
                      Super Admin
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-md">
                    Monitor location intelligence research pipeline queues, test live provider ping latency, moderate listings and inspect audit logs.
                  </p>
                  <span className="text-[10px] text-slate-400 font-mono block pt-0.5">
                    Account: test_admin@hi-in.com
                  </span>
                </div>
              </div>

              <div className="pt-1 flex-shrink-0">
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                  selectedRole === 'admin'
                    ? 'border-[#133238] bg-[#133238] text-white'
                    : 'border-slate-300 bg-white'
                }`}>
                  {selectedRole === 'admin' && <CheckCircle2 size={13} />}
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Step 2: Login Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleRoleLogin}
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-full bg-[#133238] text-white font-semibold text-sm hover:bg-[#1a444c] flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating as {roleDetails[selectedRole].title}...</span>
            ) : (
              <>
                <span>Sign in as {roleDetails[selectedRole].title}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
          <p className="text-center text-[11px] text-slate-400 mt-2 font-mono">
            Will redirect directly to {roleDetails[selectedRole].targetWorkspace}
          </p>
        </div>

        {/* Optional Collapsible: Manual Email & Password */}
        <div className="pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowCustomForm(!showCustomForm)}
            className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-slate-800 py-1"
          >
            <span>Or sign in with custom credentials</span>
            <ChevronDown size={14} className={`transform transition-transform ${showCustomForm ? 'rotate-180' : ''}`} />
          </button>

          {showCustomForm && (
            <form onSubmit={handleCustomSubmit} className="mt-4 space-y-3 pt-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-[#133238]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-[#133238]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-slate-800 text-white font-semibold rounded-xl text-xs hover:bg-slate-900 transition-colors"
              >
                {loading ? 'Authenticating...' : 'Sign In with Email'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
