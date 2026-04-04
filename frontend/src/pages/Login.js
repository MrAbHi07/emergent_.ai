import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Brain, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { API, setAuthToken } from '../App';
import { toast } from 'sonner';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      setAuthToken(response.data.token);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-8 relative overflow-hidden" style={{ background: '#05050A' }}>
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.4) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-15%] left-[-5%] w-[400px] h-[400px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 70%)' }} />

      <div data-testid="login-card" className="w-full max-w-md p-10 rounded-2xl relative z-10 fade-in" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }}>
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <Brain className="w-10 h-10" style={{ color: '#34D399' }} />
            <span className="text-2xl font-semibold tracking-tight" style={{ fontFamily: 'Outfit', color: '#F8FAFC' }}>NeuroBuddy</span>
          </div>
        </div>

        <h2 data-testid="login-title" className="text-2xl font-semibold mb-2 text-center" style={{ fontFamily: 'Outfit', color: '#F8FAFC' }}>
          Welcome Back
        </h2>
        <p className="text-center mb-8 text-sm" style={{ color: '#94A3B8' }}>
          Sign in to continue your learning journey
        </p>

        <form data-testid="login-form" onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#64748B' }} />
              <Input
                data-testid="login-email-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-11 rounded-xl border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                style={{ minHeight: '48px', background: 'rgba(255,255,255,0.04)', color: '#F8FAFC' }}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: '#64748B' }} />
              <Input
                data-testid="login-password-input"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-11 rounded-xl border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20"
                style={{ minHeight: '48px', background: 'rgba(255,255,255,0.04)', color: '#F8FAFC' }}
              />
            </div>
          </div>
          <Button
            data-testid="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full rounded-full text-base border-0"
            style={{ background: 'linear-gradient(135deg, #34D399, #059669)', color: '#05050A', minHeight: '48px', fontWeight: 600, boxShadow: '0 0 25px rgba(52,211,153,0.2)' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="text-center mt-6 text-sm" style={{ color: '#64748B' }}>
          Don't have an account?{' '}
          <button data-testid="login-register-link" onClick={() => navigate('/register')} className="font-semibold" style={{ color: '#34D399' }}>
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
