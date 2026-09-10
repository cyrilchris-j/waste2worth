import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input } from '../../components/ui';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const { role }                = useAuth();
  const navigate                = useNavigate();

  if (role === 'RECYCLER') { navigate('/recycler/dashboard', { replace: true }); return null; }
  if (role === 'ADMIN')    { navigate('/admin/verification', { replace: true }); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Enter your email and password');
      return;
    }
    setLoading(true);
    try {
      await loginUser(email.trim(), password);
      toast.success('Welcome back!');
      // AuthContext observer will update role; navigate after short delay
      setTimeout(() => navigate('/recycler/dashboard'), 400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      if (msg.includes('wrong-password') || msg.includes('user-not-found') || msg.includes('invalid-credential')) {
        toast.error('Invalid email or password');
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-700 to-brand-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg">
            ♻️
          </div>
          <h1 className="text-2xl font-bold text-white">Waste2Worth</h1>
          <p className="text-brand-200 text-sm mt-1">E-Waste Recycling Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-5">
          <h2 className="text-xl font-bold text-gray-900">Sign In</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              id="login-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            <Input
              label="Password"
              type="password"
              id="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              autoComplete="current-password"
              required
            />
            <Button type="submit" fullWidth loading={loading}>
              Sign In
            </Button>
          </form>

          <div className="border-t border-gray-100 pt-4 text-center space-y-2">
            <p className="text-sm text-gray-600">
              New recycler?{' '}
              <Link to="/recycler/register" className="text-brand-700 font-semibold hover:underline">
                Register your facility
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-brand-200 text-xs mt-6">
          Digital Platform for Formal E-Waste Recycling
        </p>
      </div>
    </div>
  );
}
