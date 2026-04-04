import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, TrendingUp, Award, Target, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { API, getAuthToken } from '../App';
import { toast } from 'sonner';

const GLASS = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' };

const Analytics = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get(`${API}/analytics/dashboard`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      setAnalytics(response.data);
    } catch (error) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#05050A' }}>
        <div className="text-center">
          <TrendingUp className="w-14 h-14 mx-auto mb-4 pulse-ring" style={{ color: '#38BDF8' }} />
          <p style={{ color: '#94A3B8' }}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  const profile = analytics?.learning_profile;

  return (
    <div className="min-h-screen relative" style={{ background: '#05050A' }}>
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.3) 0%, transparent 70%)' }} />

      <div className="relative z-10 max-w-6xl mx-auto px-8 py-10">
        <div className="flex items-center mb-8 fade-in">
          <Button data-testid="back-to-dashboard-btn" variant="ghost" onClick={() => navigate('/dashboard')} className="rounded-full text-slate-400 hover:text-white hover:bg-white/10">
            <ArrowLeft className="mr-2 w-5 h-5" /> Back
          </Button>
        </div>

        <h1 data-testid="analytics-title" className="text-4xl sm:text-5xl font-light tracking-tight mb-2 fade-in" style={{ fontFamily: 'Outfit', color: '#F8FAFC' }}>
          Learning Analytics
        </h1>
        <p className="text-base mb-10" style={{ color: '#94A3B8' }}>Track your progress and get personalized insights</p>

        {!profile ? (
          <div data-testid="no-profile-message" className="p-10 rounded-2xl text-center" style={GLASS}>
            <Award className="w-14 h-14 mx-auto mb-4" style={{ color: '#34D399' }} />
            <h2 className="text-2xl font-semibold mb-2" style={{ fontFamily: 'Outfit', color: '#F8FAFC' }}>Build Your Profile</h2>
            <p style={{ color: '#94A3B8' }}>Play at least 3 games to generate your personalized learning profile and insights.</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { id: 'attention', icon: Target, label: 'Attention Level', value: profile.attention_level, color: '#34D399', glow: 'rgba(52,211,153,0.15)' },
                { id: 'learning-style', icon: Lightbulb, label: 'Learning Style', value: profile.learning_style, color: '#FBBF24', glow: 'rgba(251,191,36,0.15)' },
                { id: 'reading', icon: TrendingUp, label: 'Reading Difficulty', value: profile.reading_difficulty, color: '#38BDF8', glow: 'rgba(56,189,248,0.15)' },
              ].map(({ id, icon: Icon, label, value, color, glow }) => (
                <div key={id} data-testid={`profile-${id}`} className="p-6 rounded-2xl slide-up" style={GLASS}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ background: glow }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#64748B' }}>{label}</p>
                  <p className="text-2xl font-semibold" style={{ fontFamily: 'Outfit', color: '#F8FAFC' }}>{value}</p>
                </div>
              ))}
            </div>

            {analytics.recent_progress && analytics.recent_progress.length > 0 && (
              <div data-testid="progress-chart" className="p-6 rounded-2xl" style={GLASS}>
                <h2 className="text-xl font-semibold mb-5" style={{ fontFamily: 'Outfit', color: '#F8FAFC' }}>Recent Progress</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={analytics.recent_progress}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="date" stroke="#64748B" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#64748B" tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: '#0F111A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#F8FAFC' }} />
                    <Line type="monotone" dataKey="score" stroke="#34D399" strokeWidth={2} dot={{ fill: '#34D399', r: 3 }} />
                    <Line type="monotone" dataKey="accuracy" stroke="#38BDF8" strokeWidth={2} dot={{ fill: '#38BDF8', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profile.strengths && profile.strengths.length > 0 && (
                <div data-testid="strengths-section" className="p-6 rounded-2xl" style={{ ...GLASS, borderColor: 'rgba(52,211,153,0.15)' }}>
                  <h3 className="text-lg font-semibold mb-3" style={{ fontFamily: 'Outfit', color: '#34D399' }}>Strengths</h3>
                  <ul className="space-y-2">
                    {profile.strengths.map((s, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm" style={{ color: '#CBD5E1' }}>
                        <Award className="w-4 h-4" style={{ color: '#34D399' }} />{s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {profile.weaknesses && profile.weaknesses.length > 0 && (
                <div data-testid="weaknesses-section" className="p-6 rounded-2xl" style={{ ...GLASS, borderColor: 'rgba(251,191,36,0.15)' }}>
                  <h3 className="text-lg font-semibold mb-3" style={{ fontFamily: 'Outfit', color: '#FBBF24' }}>Areas to Improve</h3>
                  <ul className="space-y-2">
                    {profile.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm" style={{ color: '#CBD5E1' }}>
                        <Target className="w-4 h-4" style={{ color: '#FBBF24' }} />{w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {profile.recommendations && profile.recommendations.length > 0 && (
              <div data-testid="recommendations-section" className="p-6 rounded-2xl" style={{ ...GLASS, borderColor: 'rgba(56,189,248,0.15)' }}>
                <h3 className="text-lg font-semibold mb-3" style={{ fontFamily: 'Outfit', color: '#38BDF8' }}>Personalized Recommendations</h3>
                <ul className="space-y-2">
                  {profile.recommendations.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#CBD5E1' }}>
                      <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#38BDF8' }} /><span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
