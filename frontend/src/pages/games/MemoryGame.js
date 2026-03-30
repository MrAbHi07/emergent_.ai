import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, RotateCcw, Star, Trophy, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API, getAuthToken } from '../../App';
import { toast } from 'sonner';

const emojis = ['🎯', '🌟', '🎨', '🚀', '🎭', '🎪', '🎸', '🎺'];

const MemoryGame = () => {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const shuffled = [...emojis, ...emojis]
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({ id: index, emoji, flipped: false }));
    setCards(shuffled);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setMistakes(0);
    setStartTime(Date.now());
    setGameComplete(false);
    setCombo(0);
    setScore(0);
    setStars(0);
  };

  const handleCardClick = (index) => {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(moves + 1);
      const [first, second] = newFlipped;
      if (cards[first].emoji === cards[second].emoji) {
        const newMatched = [...matched, first, second];
        setMatched(newMatched);
        setFlipped([]);
        
        // Combo system
        const newCombo = combo + 1;
        setCombo(newCombo);
        const comboBonus = newCombo * 10;
        const newScore = score + 100 + comboBonus;
        setScore(newScore);
        
        toast.success(`🎉 Match! +${100 + comboBonus} points${newCombo > 1 ? ` (${newCombo}x combo!)` : ''}`, {
          duration: 1500
        });
        
        if (newMatched.length === cards.length) {
          finishGame(newScore);
        }
      } else {
        setMistakes(mistakes + 1);
        setCombo(0);
        toast.error('Not a match. Try again!', { duration: 1000 });
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  const calculateStars = (finalScore, timeTaken, mistakeCount) => {
    let starCount = 0;
    if (finalScore >= 800) starCount = 5;
    else if (finalScore >= 600) starCount = 4;
    else if (finalScore >= 400) starCount = 3;
    else if (finalScore >= 200) starCount = 2;
    else starCount = 1;
    
    if (timeTaken < 30) starCount = Math.min(5, starCount + 1);
    if (mistakeCount === 0) starCount = 5;
    
    return starCount;
  };

  const finishGame = async (finalScore) => {
    const completionTime = (Date.now() - startTime) / 1000;
    const accuracy = ((cards.length / 2 - mistakes) / (cards.length / 2)) * 100;
    const starCount = calculateStars(finalScore, completionTime, mistakes);
    setStars(starCount);

    try {
      await axios.post(
        `${API}/games/session`,
        {
          game_type: 'memory',
          score: finalScore,
          accuracy,
          response_time: completionTime / moves,
          mistakes,
          completion_time: completionTime,
          metadata: { moves, combo_max: combo, stars: starCount }
        },
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );
      setGameComplete(true);
      toast.success('🏆 Game completed! Progress saved.');
    } catch (error) {
      toast.error('Failed to save game progress');
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="flex items-center justify-between mb-8 fade-in">
          <Button data-testid="back-to-dashboard-btn" variant="ghost" onClick={() => navigate('/dashboard')} className="rounded-full">
            <ArrowLeft className="mr-2 w-5 h-5" /> Back
          </Button>
          <Button data-testid="restart-game-btn" variant="outline" onClick={initializeGame} className="rounded-full">
            <RotateCcw className="mr-2 w-5 h-5" /> Restart
          </Button>
        </div>

        <div className="slide-up">
          <h1 data-testid="game-title" className="text-4xl font-bold mb-4" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>
            Memory Game
          </h1>
          <p className="text-lg mb-8" style={{ color: '#4A4D48' }}>
            Match pairs of cards to test your memory
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 slide-up">
          <div data-testid="score-display" className="card p-6 text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2" style={{ color: '#F2C48D' }} />
            <p className="text-sm uppercase tracking-wider mb-1" style={{ color: '#757873' }}>Score</p>
            <p className={`text-3xl font-bold ${score > 0 ? 'score-pop' : ''}`} style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>{score}</p>
          </div>

          <div data-testid="moves-counter" className="card p-6 text-center">
            <Zap className="w-8 h-8 mx-auto mb-2" style={{ color: '#8ABF9B' }} />
            <p className="text-sm uppercase tracking-wider mb-1" style={{ color: '#757873' }}>Moves</p>
            <p className="text-3xl font-bold" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>{moves}</p>
          </div>

          <div data-testid="combo-counter" className="card p-6 text-center">
            <Star className="w-8 h-8 mx-auto mb-2" style={{ color: '#9EADCC' }} />
            <p className="text-sm uppercase tracking-wider mb-1" style={{ color: '#757873' }}>Combo</p>
            <p className={`text-3xl font-bold ${combo > 0 ? 'celebration' : ''}`} style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>{combo}x</p>
          </div>

          <div data-testid="mistakes-counter" className="card p-6 text-center">
            <p className="text-sm uppercase tracking-wider mb-1" style={{ color: '#757873' }}>Mistakes</p>
            <p className="text-3xl font-bold" style={{ fontFamily: 'Nunito', color: mistakes > 3 ? '#E69C9C' : '#1A1C19' }}>{mistakes}</p>
          </div>
        </div>

        <div className="progress-bar mb-8">
          <div 
            className="progress-fill" 
            style={{ width: `${(matched.length / cards.length) * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto scale-in">
          {cards.map((card, index) => (
            <div
              key={card.id}
              data-testid={`memory-card-${index}`}
              className={`memory-card ${flipped.includes(index) || matched.includes(index) ? 'flipped' : ''} ${matched.includes(index) ? 'matched' : ''}`}
              onClick={() => handleCardClick(index)}
            >
              <div className="memory-card-inner">
                <div className="memory-card-front" />
                <div className="memory-card-back">{card.emoji}</div>
              </div>
            </div>
          ))}
        </div>

        {gameComplete && (
          <div data-testid="game-complete-message" className="mt-8 p-8 rounded-3xl text-center celebration" style={{ background: 'linear-gradient(135deg, #A3D9A5 0%, #8ABF9B 100%)', boxShadow: '0 8px 32px rgba(138, 191, 155, 0.4)' }}>
            <Trophy className="w-20 h-20 mx-auto mb-4" style={{ color: '#1A1C19' }} />
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>Fantastic Job!</h2>
            <div className="star-rating mb-4">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="star" style={{ color: i < stars ? '#F2C48D' : '#E0E0E0' }}>★</span>
              ))}
            </div>
            <p className="text-lg mb-2" style={{ color: '#1A1C19' }}>Final Score: <strong>{score}</strong> points</p>
            <p style={{ color: '#1A1C19' }}>Completed in {moves} moves with {mistakes} mistakes</p>
            {combo > 2 && <p className="mt-2 text-lg font-semibold" style={{ color: '#1A1C19' }}>🔥 Max Combo: {combo}x</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryGame;