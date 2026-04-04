import { useNavigate } from 'react-router-dom';
import { Brain, Sparkles, TrendingUp, MessageCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#05050A' }}>
      {/* Gradient orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20" style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.4) 0%, transparent 70%)' }} />
      <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15" style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.4) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-10%] left-[30%] w-[400px] h-[400px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.4) 0%, transparent 70%)' }} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <Brain className="w-9 h-9" style={{ color: '#34D399' }} />
          <span className="text-xl font-semibold tracking-tight" style={{ fontFamily: 'Outfit', color: '#F8FAFC' }}>NeuroBuddy AI</span>
        </div>
        <div className="flex gap-3">
          <Button data-testid="nav-login-btn" variant="ghost" onClick={() => navigate('/login')} className="rounded-full text-slate-300 hover:text-white hover:bg-white/10">
            Login
          </Button>
          <Button data-testid="nav-register-btn" onClick={() => navigate('/register')} className="rounded-full border-0" style={{ background: 'linear-gradient(135deg, #34D399, #059669)', color: '#05050A', fontWeight: 600 }}>
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-6xl mx-auto px-8 pt-24 pb-20 text-center">
        <div className="inline-block px-4 py-1.5 rounded-full mb-8 text-sm tracking-wide" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', color: '#34D399' }}>
          AI-Powered Learning for Every Mind
        </div>
        <h1 data-testid="hero-title" className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight leading-tight mb-6" style={{ fontFamily: 'Outfit', color: '#F8FAFC' }}>
          Intelligent Learning<br />
          <span style={{ background: 'linear-gradient(135deg, #34D399, #FBBF24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>for Neurodiverse Students</span>
        </h1>
        <p data-testid="hero-description" className="text-base sm:text-lg leading-relaxed mb-12 max-w-2xl mx-auto" style={{ color: '#94A3B8' }}>
          Gamified cognitive assessments, AI-powered tutoring, and personalized learning paths designed specifically for students with Autism, ADHD, and Dyslexia.
        </p>
        <Button data-testid="hero-cta-btn" onClick={() => navigate('/register')} className="rounded-full text-lg px-8 py-6 border-0" style={{ background: 'linear-gradient(135deg, #34D399, #059669)', color: '#05050A', fontWeight: 600, boxShadow: '0 0 40px rgba(52,211,153,0.3)' }}>
          Start Your Journey <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </section>

      {/* Feature cards */}
      <section className="relative z-10 max-w-6xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Sparkles, title: 'Cognitive Games', desc: 'Fun, interactive games that assess memory, attention, and pattern recognition.', color: '#34D399', glow: 'rgba(52,211,153,0.15)' },
            { icon: MessageCircle, title: 'AI Tutor', desc: 'Patient AI companion that explains concepts in simple, step-by-step language.', color: '#FBBF24', glow: 'rgba(251,191,36,0.15)' },
            { icon: TrendingUp, title: 'Progress Tracking', desc: 'Visual analytics showing strengths, areas for improvement, and learning trends.', color: '#38BDF8', glow: 'rgba(56,189,248,0.15)' },
            { icon: Brain, title: 'Personalized Paths', desc: 'Adaptive learning recommendations based on individual cognitive profiles.', color: '#A78BFA', glow: 'rgba(167,139,250,0.15)' },
          ].map(({ icon: Icon, title, desc, color, glow }, idx) => (
            <div
              key={idx}
              data-testid={`feature-card-${['games','ai','analytics','personalized'][idx]}`}
              className="p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: glow, boxShadow: `0 0 20px ${glow}` }}>
                <Icon className="w-6 h-6" style={{ color }} />
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Outfit', color: '#F8FAFC' }}>{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 text-center py-12" style={{ color: '#475569' }}>
        <p className="text-sm">&copy; 2026 NeuroBuddy AI. Supporting neurodiverse learners worldwide.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
