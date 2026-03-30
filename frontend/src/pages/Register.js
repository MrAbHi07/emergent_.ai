import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Brain, Mail, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { API, setAuthToken } from '../App';
import { toast } from 'sonner';

const Register = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/register`, { name, email, password, role });
      setAuthToken(response.data.token);
      toast.success('Welcome to NeuroBuddy!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-8" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1763615445546-d2280a7167fb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwyfHxtaW5pbWFsaXN0JTIwcGFzdGVsJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3NzQ4NTAzNzl8MA&ixlib=rb-4.1.0&q=85')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div data-testid="register-card" className="w-full max-w-md p-12 rounded-3xl" style={{ backgroundColor: '#FDFBF7', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <Brain className="w-12 h-12" style={{ color: '#8ABF9B' }} />
            <span className="text-3xl font-bold" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>NeuroBuddy</span>
          </div>
        </div>

        <h2 data-testid="register-title" className="text-2xl sm:text-3xl font-bold mb-2 text-center" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>
          Create Account
        </h2>
        <p className="text-center mb-8" style={{ color: '#4A4D48' }}>
          Start your personalized learning journey
        </p>

        <form data-testid="register-form" onSubmit={handleRegister} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1C19' }}>
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#757873' }} />
              <Input
                data-testid="register-name-input"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="pl-12 rounded-xl"
                style={{ minHeight: '48px', backgroundColor: '#F3F5F2' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1C19' }}>
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5" style={{ color: '#757873' }} />
              <Input
                data-testid="register-email-input"
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
                data-testid="register-password-input"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="pl-12 rounded-xl"
                style={{ minHeight: '48px', backgroundColor: '#F3F5F2' }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1C19' }}>
              I am a...
            </label>
            <Select data-testid="register-role-select" value={role} onValueChange={setRole}>
              <SelectTrigger className="rounded-xl" style={{ minHeight: '48px', backgroundColor: '#F3F5F2' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            data-testid="register-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full rounded-full text-lg"
            style={{ backgroundColor: '#8ABF9B', color: '#1A1C19', minHeight: '48px' }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        <p className="text-center mt-6" style={{ color: '#4A4D48' }}>
          Already have an account?{' '}
          <button
            data-testid="register-login-link"
            onClick={() => navigate('/login')}
            className="font-semibold"
            style={{ color: '#8ABF9B' }}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;