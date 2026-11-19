import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AlertCircle } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'seller' | 'buyer'>('buyer');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({
        full_name: fullName,
        email,
        password,
        role
      });
      if (role === 'seller') navigate('/seller');
      else navigate('/buyer');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create an Account</h1>
        <p className="text-xs text-slate-500 mt-1">Join HI IN as a property buyer or builder/seller.</p>
      </div>

      <div className="bg-white p-6 rounded-lg border border-brand-border shadow-xs">
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded flex items-center gap-2">
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Full Name / Organization</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Ramesh Varma or Prime Builders"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:bg-white focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:bg-white focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs outline-none focus:bg-white focus:border-brand-primary"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Select Primary Role</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <label
                className={`p-3 rounded border cursor-pointer flex flex-col justify-between transition-colors ${
                  role === 'buyer'
                    ? 'border-brand-primary bg-slate-50 text-slate-900 font-semibold'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Buyer</span>
                  <input
                    type="radio"
                    name="role"
                    value="buyer"
                    checked={role === 'buyer'}
                    onChange={() => setRole('buyer')}
                    className="accent-slate-900"
                  />
                </div>
                <span className="text-[10px] font-normal text-slate-500 mt-1">Browse, wishlist & enquire</span>
              </label>

              <label
                className={`p-3 rounded border cursor-pointer flex flex-col justify-between transition-colors ${
                  role === 'seller'
                    ? 'border-brand-primary bg-slate-50 text-slate-900 font-semibold'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Seller / Builder</span>
                  <input
                    type="radio"
                    name="role"
                    value="seller"
                    checked={role === 'seller'}
                    onChange={() => setRole('seller')}
                    className="accent-slate-900"
                  />
                </div>
                <span className="text-[10px] font-normal text-slate-500 mt-1">Publish listings & deeds</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand-primary text-white font-semibold rounded hover:bg-brand-primaryHover transition-colors mt-2"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="mt-4 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-slate-800 hover:underline">
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
};
