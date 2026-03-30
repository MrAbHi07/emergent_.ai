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
    <div className="min-h-screen flex items-center justify-center px-8" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1763615445546-d2280a7167fb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwyfHxtaW5pbWFsaXN0JTIwcGFzdGVsJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3NzQ4NTAzNzl8MA&ixlib=rb-4.1.0&q=85')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div data-testid="login-card" className="w-full max-w-md p-12 rounded-3xl" style={{ backgroundColor: '#FDFBF7', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <Brain className="w-12 h-12" style={{ color: '#8ABF9B' }} />
            <span className="text-3xl font-bold" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>NeuroBuddy</span>
          </div>
        </div>

        <h2 data-testid="login-title" className="text-2xl sm:text-3xl font-bold mb-2 text-center" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>
          Welcome Back
        </h2>
        <p className="text-center mb-8" style={{ color: '#4A4D48' }}>
          Sign in to continue your learning journey
        </p>

        <form data-testid="login-form" onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1C19' }}>
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#757873' }} />
              <Input
                data-testid="login-email-input"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="pl-12 rounded-xl"
                style={{ minHeight: '48px', backgroundColor: '#F3F5F2' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1C19' }}>
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#757873' }} />
              <Input
                data-testid="login-password-input"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-12 rounded-xl"
                style={{ minHeight: '48px', backgroundColor: '#F3F5F2' }}
              />
            </div>
          </div>

          <Button
            data-testid="login-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full rounded-full text-lg"
            style={{ backgroundColor: '#8ABF9B', color: '#1A1C19', minHeight: '48px' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <p className="text-center mt-6" style={{ color: '#4A4D48' }}>
          Don't have an account?{' '}
          <button
            data-testid="login-register-link"
            onClick={() => navigate('/register')}
            className="font-semibold"
            style={{ color: '#8ABF9B' }}
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;