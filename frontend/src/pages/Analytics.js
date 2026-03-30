import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, TrendingUp, Award, Target, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { API, getAuthToken } from '../App';
import { toast } from 'sonner';

const Analytics = () => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#FDFBF7' }}>
        <div className="text-center">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 pulse-ring" style={{ color: '#9EADCC' }} />
          <p style={{ color: '#4A4D48' }}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  const profile = analytics?.learning_profile;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="flex items-center mb-8">
          <Button data-testid="back-to-dashboard-btn" variant="ghost" onClick={() => navigate('/dashboard')} className="rounded-full">
            <ArrowLeft className="mr-2 w-5 h-5" /> Back
          </Button>
        </div>

        <h1 data-testid="analytics-title" className="text-4xl sm:text-5xl font-bold mb-4" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>
          Learning Analytics
        </h1>
        <p className="text-lg mb-12" style={{ color: '#4A4D48' }}>
          Track your progress and get personalized insights
        </p>

        {!profile ? (
          <div data-testid="no-profile-message" className="p-12 rounded-3xl text-center" style={{ backgroundColor: '#F3F5F2' }}>
            <Award className="w-16 h-16 mx-auto mb-4" style={{ color: '#8ABF9B' }} />
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>
              Build Your Profile
            </h2>
            <p style={{ color: '#4A4D48' }}>
              Play at least 3 games to generate your personalized learning profile and insights.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div data-testid="profile-attention" className="p-8 rounded-3xl" style={{ backgroundColor: '#F3F5F2' }}>
                <Target className="w-10 h-10 mb-4" style={{ color: '#8ABF9B' }} />
                <p className="text-sm uppercase tracking-wider mb-2" style={{ color: '#757873' }}>Attention Level</p>
                <p className="text-3xl font-bold" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>{profile.attention_level}</p>
              </div>

              <div data-testid="profile-learning-style" className="p-8 rounded-3xl" style={{ backgroundColor: '#F3F5F2' }}>
                <Lightbulb className="w-10 h-10 mb-4" style={{ color: '#F2C48D' }} />
                <p className="text-sm uppercase tracking-wider mb-2" style={{ color: '#757873' }}>Learning Style</p>
                <p className="text-3xl font-bold" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>{profile.learning_style}</p>
              </div>

              <div data-testid="profile-reading" className="p-8 rounded-3xl" style={{ backgroundColor: '#F3F5F2' }}>
                <TrendingUp className="w-10 h-10 mb-4" style={{ color: '#9EADCC' }} />
                <p className="text-sm uppercase tracking-wider mb-2" style={{ color: '#757873' }}>Reading Difficulty</p>
                <p className="text-3xl font-bold" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>{profile.reading_difficulty}</p>
              </div>
            </div>

            {analytics.recent_progress && analytics.recent_progress.length > 0 && (
              <div data-testid="progress-chart" className="p-8 rounded-3xl" style={{ backgroundColor: '#F3F5F2' }}>
                <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>Recent Progress</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analytics.recent_progress}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                    <XAxis dataKey="date" stroke="#757873" />
                    <YAxis stroke="#757873" />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#8ABF9B" strokeWidth={3} />
                    <Line type="monotone" dataKey="accuracy" stroke="#9EADCC" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {profile.strengths && profile.strengths.length > 0 && (
                <div data-testid="strengths-section" className="p-8 rounded-3xl" style={{ backgroundColor: '#A3D9A5' }}>
                  <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>Strengths</h3>
                  <ul className="space-y-2">
                    {profile.strengths.map((strength, index) => (
                      <li key={index} className="flex items-center gap-2" style={{ color: '#1A1C19' }}>
                        <Award className="w-5 h-5" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {profile.weaknesses && profile.weaknesses.length > 0 && (
                <div data-testid="weaknesses-section" className="p-8 rounded-3xl" style={{ backgroundColor: '#F2D588' }}>
                  <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>Areas to Improve</h3>
                  <ul className="space-y-2">
                    {profile.weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-center gap-2" style={{ color: '#1A1C19' }}>
                        <Target className="w-5 h-5" />
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {profile.recommendations && profile.recommendations.length > 0 && (
              <div data-testid="recommendations-section" className="p-8 rounded-3xl" style={{ backgroundColor: '#9EADCC' }}>
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>Personalized Recommendations</h3>
                <ul className="space-y-3">
                  {profile.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-3" style={{ color: '#1A1C19' }}>
                      <Lightbulb className="w-5 h-5 mt-1 flex-shrink-0" />
                      <span>{rec}</span>
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