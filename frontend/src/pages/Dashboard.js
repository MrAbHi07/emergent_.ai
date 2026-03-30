import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Brain, Gamepad2, MessageCircle, TrendingUp, LogOut, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API, getAuthToken, clearAuthToken } from '../App';
import { toast } from 'sonner';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FDFBF7' }}>
        <div className="text-center">
          <Brain className="w-16 h-16 mx-auto mb-4 pulse-ring" style={{ color: '#8ABF9B' }} />
          <p style={{ color: '#4A4D48' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      <nav className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <Brain className="w-10 h-10" style={{ color: '#8ABF9B' }} />
          <span className="text-2xl font-bold" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>NeuroBuddy AI</span>
        </div>
        <div className="flex items-center gap-6">
          <span style={{ color: '#4A4D48' }}>Welcome, {user?.name}!</span>
          <Button data-testid="logout-btn" variant="ghost" onClick={handleLogout} className="rounded-full">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </nav>

      <div data-testid="dashboard-container" className="max-w-6xl mx-auto px-8 py-12">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>
          Your Learning Dashboard
        </h1>
        <p className="text-lg mb-12" style={{ color: '#4A4D48' }}>
          Track your progress and continue your personalized learning journey
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div data-testid="stat-card-total-games" className="p-8 rounded-3xl" style={{ backgroundColor: '#F3F5F2', border: '1px solid rgba(0,0,0,0.05)' }}>
            <p className="text-sm uppercase tracking-wider mb-2" style={{ color: '#757873' }}>Total Games</p>
            <p className="text-4xl font-bold" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>{stats?.total_games || 0}</p>
          </div>

          <div data-testid="stat-card-avg-score" className="p-8 rounded-3xl" style={{ backgroundColor: '#F3F5F2', border: '1px solid rgba(0,0,0,0.05)' }}>
            <p className="text-sm uppercase tracking-wider mb-2" style={{ color: '#757873' }}>Avg Score</p>
            <p className="text-4xl font-bold" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>{stats?.average_score ? stats.average_score.toFixed(0) : 0}</p>
          </div>

          <div data-testid="stat-card-avg-accuracy" className="p-8 rounded-3xl" style={{ backgroundColor: '#F3F5F2', border: '1px solid rgba(0,0,0,0.05)' }}>
            <p className="text-sm uppercase tracking-wider mb-2" style={{ color: '#757873' }}>Avg Accuracy</p>
            <p className="text-4xl font-bold" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>{stats?.average_accuracy ? stats.average_accuracy.toFixed(0) : 0}%</p>
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold mb-6" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>
          Cognitive Games
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <button
            data-testid="game-card-memory"
            onClick={() => navigate('/games/memory')}
            className="p-8 rounded-3xl text-left card"
            style={{ backgroundColor: '#F3F5F2', border: '1px solid rgba(0,0,0,0.05)' }}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#8ABF9B' }}>
              <Sparkles className="w-8 h-8" style={{ color: '#1A1C19' }} />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>Memory Game</h3>
            <p className="text-base" style={{ color: '#4A4D48' }}>Match pairs of cards to test your memory and concentration</p>
          </button>

          <button
            data-testid="game-card-reaction"
            onClick={() => navigate('/games/reaction')}
            className="p-8 rounded-3xl text-left card"
            style={{ backgroundColor: '#F3F5F2', border: '1px solid rgba(0,0,0,0.05)' }}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#F2C48D' }}>
              <Gamepad2 className="w-8 h-8" style={{ color: '#1A1C19' }} />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>Reaction Time</h3>
            <p className="text-base" style={{ color: '#4A4D48' }}>Test your response speed and attention to visual signals</p>
          </button>

          <button
            data-testid="game-card-pattern"
            onClick={() => navigate('/games/pattern')}
            className="p-8 rounded-3xl text-left card"
            style={{ backgroundColor: '#F3F5F2', border: '1px solid rgba(0,0,0,0.05)' }}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#9EADCC' }}>
              <Brain className="w-8 h-8" style={{ color: '#1A1C19' }} />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>Pattern Recognition</h3>
            <p className="text-base" style={{ color: '#4A4D48' }}>Identify sequences and predict the next pattern</p>
          </button>

          <button
            data-testid="game-card-reading"
            onClick={() => navigate('/games/reading')}
            className="p-8 rounded-3xl text-left card"
            style={{ backgroundColor: '#F3F5F2', border: '1px solid rgba(0,0,0,0.05)' }}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#A3D9A5' }}>
              <TrendingUp className="w-8 h-8" style={{ color: '#1A1C19' }} />
            </div>
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>Reading Assessment</h3>
            <p className="text-base" style={{ color: '#4A4D48' }}>Test comprehension and reading speed with engaging passages</p>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button
            data-testid="nav-tutor-btn"
            onClick={() => navigate('/tutor')}
            className="p-8 rounded-3xl text-left card"
            style={{ backgroundColor: '#F3F5F2', border: '1px solid rgba(0,0,0,0.05)' }}
          >
            <MessageCircle className="w-12 h-12 mb-4" style={{ color: '#F2C48D' }} />
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>AI Tutor</h3>
            <p className="text-base" style={{ color: '#4A4D48' }}>Chat with your personal AI learning companion</p>
          </button>

          <button
            data-testid="nav-analytics-btn"
            onClick={() => navigate('/analytics')}
            className="p-8 rounded-3xl text-left card"
            style={{ backgroundColor: '#F3F5F2', border: '1px solid rgba(0,0,0,0.05)' }}
          >
            <TrendingUp className="w-12 h-12 mb-4" style={{ color: '#9EADCC' }} />
            <h3 className="text-xl font-bold mb-2" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>Analytics & Progress</h3>
            <p className="text-base" style={{ color: '#4A4D48' }}>View detailed insights and learning recommendations</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;