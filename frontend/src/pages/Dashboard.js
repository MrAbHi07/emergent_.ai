import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Brain, Gamepad2, MessageCircle, TrendingUp, LogOut, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API, getAuthToken, clearAuthToken } from '../App';
import { toast } from 'sonner';

const GLASS = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' };

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const token = getAuthToken();
      const [userRes, statsRes] = await Promise.all([
        axios.get(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/games/stats`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setUser(userRes.data);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#05050A' }}>
        <div className="text-center">
          <Brain className="w-14 h-14 mx-auto mb-4 pulse-ring" style={{ color: '#34D399' }} />
          <p style={{ color: '#94A3B8' }}>Loading...</p>
        </div>
      </div>
    );
  }

  const games = [
    { id: 'memory', title: 'Memory Game', desc: 'Match pairs of cards to test your memory and concentration', icon: Sparkles, path: '/games/memory', color: '#34D399', glow: 'rgba(52,211,153,0.15)' },
    { id: 'reaction', title: 'Reaction Time', desc: 'Test your response speed and attention to visual signals', icon: Gamepad2, path: '/games/reaction', color: '#FBBF24', glow: 'rgba(251,191,36,0.15)' },
    { id: 'pattern', title: 'Pattern Recognition', desc: 'Identify sequences and predict the next pattern', icon: Brain, path: '/games/pattern', color: '#38BDF8', glow: 'rgba(56,189,248,0.15)' },
    { id: 'reading', title: 'Reading Assessment', desc: 'Test comprehension and reading speed with engaging passages', icon: TrendingUp, path: '/games/reading', color: '#A78BFA', glow: 'rgba(167,139,250,0.15)' },
  ];

  const statCards = [
    { id: 'total-games', label: 'Total Games', value: stats?.total_games || 0 },
    { id: 'avg-score', label: 'Avg Score', value: stats?.average_score ? stats.average_score.toFixed(0) : 0 },
    { id: 'avg-accuracy', label: 'Avg Accuracy', value: `${stats?.average_accuracy ? stats.average_accuracy.toFixed(0) : 0}%` },
  ];

  return (
    <div className="min-h-screen relative" style={{ background: '#05050A' }}>
      {/* Background orbs */}
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.3) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[20%] left-[-5%] w-[350px] h-[350px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 70%)' }} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <Brain className="w-9 h-9" style={{ color: '#34D399' }} />
          <span className="text-xl font-semibold tracking-tight" style={{ fontFamily: 'Outfit', color: '#F8FAFC' }}>NeuroBuddy AI</span>
        </div>
        <div className="flex items-center gap-5">
          <span className="text-sm" style={{ color: '#94A3B8' }}>Welcome, {user?.name}</span>
          <Button data-testid="logout-btn" variant="ghost" onClick={handleLogout} className="rounded-full text-slate-400 hover:text-white hover:bg-white/10">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </nav>

      <div data-testid="dashboard-container" className="relative z-10 max-w-6xl mx-auto px-8 py-10">
        <h1 className="text-4xl sm:text-5xl font-light tracking-tight mb-2 fade-in" style={{ fontFamily: 'Outfit', color: '#F8FAFC' }}>
          Your Learning Dashboard
        </h1>
        <p className="text-base mb-10" style={{ color: '#94A3B8' }}>Track your progress and continue your personalized journey</p>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {statCards.map(({ id, label, value }) => (
            <div key={id} data-testid={`stat-card-${id}`} className="p-6 rounded-2xl slide-up" style={GLASS}>
              <p className="text-xs uppercase tracking-widest mb-2" style={{ color: '#64748B' }}>{label}</p>
              <p className="text-4xl font-light tracking-tight" style={{ fontFamily: 'Outfit', color: '#F8FAFC' }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Games */}
        <h2 className="text-2xl font-light tracking-tight mb-5" style={{ fontFamily: 'Outfit', color: '#F8FAFC' }}>Cognitive Games</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {games.map(({ id, title, desc, icon: Icon, path, color, glow }) => (
            <button key={id} data-testid={`game-card-${id}`} onClick={() => navigate(path)} className="p-6 rounded-2xl text-left card" style={GLASS}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: glow, boxShadow: `0 0 20px ${glow}` }}>
                <Icon className="w-6 h-6" style={{ color }} />
              </div>
              <h3 className="text-lg font-semibold mb-1.5" style={{ fontFamily: 'Outfit', color: '#F8FAFC' }}>{title}</h3>
              <p className="text-sm" style={{ color: '#94A3B8' }}>{desc}</p>
            </button>
          ))}
        </div>

        {/* Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button data-testid="nav-tutor-btn" onClick={() => navigate('/tutor')} className="p-6 rounded-2xl text-left card" style={GLASS}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(251,191,36,0.15)', boxShadow: '0 0 20px rgba(251,191,36,0.15)' }}>
              <MessageCircle className="w-6 h-6" style={{ color: '#FBBF24' }} />
            </div>
            <h3 className="text-lg font-semibold mb-1.5" style={{ fontFamily: 'Outfit', color: '#F8FAFC' }}>AI Tutor</h3>
            <p className="text-sm" style={{ color: '#94A3B8' }}>Chat with your personal AI learning companion</p>
          </button>
          <button data-testid="nav-analytics-btn" onClick={() => navigate('/analytics')} className="p-6 rounded-2xl text-left card" style={GLASS}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(56,189,248,0.15)', boxShadow: '0 0 20px rgba(56,189,248,0.15)' }}>
              <TrendingUp className="w-6 h-6" style={{ color: '#38BDF8' }} />
            </div>
            <h3 className="text-lg font-semibold mb-1.5" style={{ fontFamily: 'Outfit', color: '#F8FAFC' }}>Analytics & Progress</h3>
            <p className="text-sm" style={{ color: '#94A3B8' }}>View detailed insights and learning recommendations</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
