import { useNavigate } from 'react-router-dom';
import { Brain, Sparkles, TrendingUp, MessageCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1763615445546-d2280a7167fb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwyfHxtaW5pbWFsaXN0JTIwcGFzdGVsJTIwYmFja2dyb3VuZHxlbnwwfHx8fDE3NzQ4NTAzNzl8MA&ixlib=rb-4.1.0&q=85')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <nav className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <Brain className="w-10 h-10" style={{ color: '#8ABF9B' }} />
          <span className="text-2xl font-bold" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>NeuroBuddy AI</span>
        </div>
        <div className="flex gap-4">
          <Button data-testid="nav-login-btn" variant="ghost" onClick={() => navigate('/login')} className="rounded-full">
            Login
          </Button>
          <Button data-testid="nav-register-btn" onClick={() => navigate('/register')} className="rounded-full" style={{ backgroundColor: '#8ABF9B', color: '#1A1C19' }}>
            Get Started
          </Button>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-8 py-20 text-center">
        <h1 data-testid="hero-title" className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-6" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>
          Intelligent Learning<br />for Neurodiverse Students
        </h1>
        <p data-testid="hero-description" className="text-base sm:text-lg leading-relaxed mb-12 max-w-2xl mx-auto" style={{ color: '#4A4D48' }}>
          Gamified cognitive assessments, AI-powered tutoring, and personalized learning paths designed specifically for students with Autism, ADHD, and Dyslexia.
        </p>
        <Button data-testid="hero-cta-btn" onClick={() => navigate('/register')} className="rounded-full text-lg px-8 py-6" style={{ backgroundColor: '#8ABF9B', color: '#1A1C19' }}>
          Start Your Journey <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </section>

      <section className="max-w-6xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div data-testid="feature-card-games" className="p-8 rounded-3xl" style={{ backgroundColor: '#F3F5F2', border: '1px solid rgba(0,0,0,0.05)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#8ABF9B' }}>
              <Sparkles className="w-7 h-7" style={{ color: '#1A1C19' }} />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold mb-3" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>
              Cognitive Games
            </h3>
            <p className="text-base leading-relaxed" style={{ color: '#4A4D48' }}>
              Fun, interactive games that assess memory, attention, and pattern recognition.
            </p>
          </div>

          <div data-testid="feature-card-ai" className="p-8 rounded-3xl" style={{ backgroundColor: '#F3F5F2', border: '1px solid rgba(0,0,0,0.05)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#F2C48D' }}>
              <MessageCircle className="w-7 h-7" style={{ color: '#1A1C19' }} />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold mb-3" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>
              AI Tutor
            </h3>
            <p className="text-base leading-relaxed" style={{ color: '#4A4D48' }}>
              Patient AI companion that explains concepts in simple, step-by-step language.
            </p>
          </div>

          <div data-testid="feature-card-analytics" className="p-8 rounded-3xl" style={{ backgroundColor: '#F3F5F2', border: '1px solid rgba(0,0,0,0.05)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#9EADCC' }}>
              <TrendingUp className="w-7 h-7" style={{ color: '#1A1C19' }} />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold mb-3" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>
              Progress Tracking
            </h3>
            <p className="text-base leading-relaxed" style={{ color: '#4A4D48' }}>
              Visual analytics showing strengths, areas for improvement, and learning trends.
            </p>
          </div>

          <div data-testid="feature-card-personalized" className="p-8 rounded-3xl" style={{ backgroundColor: '#F3F5F2', border: '1px solid rgba(0,0,0,0.05)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: '#A3D9A5' }}>
              <Brain className="w-7 h-7" style={{ color: '#1A1C19' }} />
            </div>
            <h3 className="text-xl sm:text-2xl font-semibold mb-3" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>
              Personalized Paths
            </h3>
            <p className="text-base leading-relaxed" style={{ color: '#4A4D48' }}>
              Adaptive learning recommendations based on individual cognitive profiles.
            </p>
          </div>
        </div>
      </section>

      <footer className="text-center py-12" style={{ color: '#757873' }}>
        <p>© 2026 NeuroBuddy AI. Supporting neurodiverse learners worldwide.</p>
      </footer>
    </div>
  );
};

export default LandingPage;