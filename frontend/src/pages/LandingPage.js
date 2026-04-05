import { useNavigate } from 'react-router-dom';
import { Brain, Sparkles, TrendingUp, MessageCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#05050A' }}>
      {/* Layered gradient background */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(52,211,153,0.12) 0%, transparent 60%)' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 60% 50% at 80% 20%, rgba(251,191,36,0.07) 0%, transparent 50%)' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 50% 40% at 20% 80%, rgba(56,189,248,0.06) 0%, transparent 50%)' }} />
      {/* Floating orbs */}
      <div className="absolute top-[5%] left-[15%] w-[300px] h-[300px] rounded-full opacity-30 blur-3xl" style={{ background: '#34D399' }} />
      <div className="absolute top-[15%] right-[10%] w-[200px] h-[200px] rounded-full opacity-15 blur-3xl" style={{ background: '#FBBF24' }} />
      <div className="absolute bottom-[20%] left-[50%] w-[250px] h-[250px] rounded-full opacity-10 blur-3xl" style={{ background: '#38BDF8' }} />

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
      <section className="relative z-10 max-w-5xl mx-auto px-8 pt-28 pb-24 text-center flex flex-col items-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-10 text-xs tracking-widest uppercase fade-in" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)', color: '#34D399' }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#34D399', boxShadow: '0 0 8px #34D399' }} />
          AI-Powered Learning for Every Mind
        </div>

        {/* Large bold heading */}
        <h1 data-testid="hero-title" className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.05] mb-8 fade-in" style={{ fontFamily: 'Outfit', color: '#F8FAFC' }}>
          Unlock Every<br />
          <span className="relative inline-block" style={{ background: 'linear-gradient(135deg, #34D399 0%, #38BDF8 50%, #FBBF24 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Student's Potential
          </span>
        </h1>

        {/* Subtext */}
        <p data-testid="hero-description" className="text-base sm:text-lg leading-relaxed mb-14 max-w-xl mx-auto slide-up" style={{ color: '#94A3B8' }}>
          Gamified cognitive assessments, AI-powered tutoring, and personalized learning — designed for students with Autism, ADHD, and Dyslexia.
        </p>

        {/* Glowing CTA */}
        <div className="relative scale-in">
          {/* Glow ring behind button */}
          <div className="absolute inset-0 rounded-full blur-xl opacity-60" style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.5), rgba(5,150,105,0.3))', transform: 'scale(1.3)' }} />
          <Button
            data-testid="hero-cta-btn"
            onClick={() => navigate('/register')}
            className="relative rounded-full text-lg px-10 py-7 border-0 font-semibold transition-all duration-300 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #34D399, #059669)',
              color: '#05050A',
              boxShadow: '0 0 50px rgba(52,211,153,0.35), 0 0 100px rgba(52,211,153,0.1)',
              letterSpacing: '-0.01em'
            }}
          >
            Start Your Journey <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </div>

        {/* Trust line */}
        <p className="mt-10 text-xs tracking-wide fade-in" style={{ color: '#475569' }}>
          Free to use &middot; No credit card required &middot; Built for accessibility
        </p>
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
