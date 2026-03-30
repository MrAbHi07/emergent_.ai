import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, RotateCcw } from 'lucide-react';
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
  };

  const handleCardClick = (index) => {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(index)) return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(moves + 1);
      const [first, second] = newFlipped;
      if (cards[first].emoji === cards[second].emoji) {
        setMatched([...matched, first, second]);
        setFlipped([]);
        if (matched.length + 2 === cards.length) {
          finishGame();
        }
      } else {
        setMistakes(mistakes + 1);
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  const finishGame = async () => {
    const completionTime = (Date.now() - startTime) / 1000;
    const accuracy = ((cards.length / 2 - mistakes) / (cards.length / 2)) * 100;
    const score = Math.max(0, 100 - mistakes * 5);

    try {
      await axios.post(
        `${API}/games/session`,
        {
          game_type: 'memory',
          score,
          accuracy,
          response_time: completionTime / moves,
          mistakes,
          completion_time: completionTime,
          metadata: { moves }
        },
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );
      setGameComplete(true);
      toast.success('Game completed! Your progress has been saved.');
    } catch (error) {
      toast.error('Failed to save game progress');
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <Button data-testid="back-to-dashboard-btn" variant="ghost" onClick={() => navigate('/dashboard')} className="rounded-full">
            <ArrowLeft className="mr-2 w-5 h-5" /> Back
          </Button>
          <Button data-testid="restart-game-btn" variant="outline" onClick={initializeGame} className="rounded-full">
            <RotateCcw className="mr-2 w-5 h-5" /> Restart
          </Button>
        </div>

        <h1 data-testid="game-title" className="text-4xl font-bold mb-4" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>
          Memory Game
        </h1>
        <p className="text-lg mb-8" style={{ color: '#4A4D48' }}>
          Match pairs of cards to test your memory
        </p>

        <div className="flex gap-8 mb-8">
          <div data-testid="moves-counter" className="px-6 py-3 rounded-2xl" style={{ backgroundColor: '#F3F5F2' }}>
            <span className="font-semibold" style={{ color: '#1A1C19' }}>Moves: {moves}</span>
          </div>
          <div data-testid="mistakes-counter" className="px-6 py-3 rounded-2xl" style={{ backgroundColor: '#F3F5F2' }}>
            <span className="font-semibold" style={{ color: '#1A1C19' }}>Mistakes: {mistakes}</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 max-w-2xl">
          {cards.map((card, index) => (
            <div
              key={card.id}
              data-testid={`memory-card-${index}`}
              className={`memory-card ${flipped.includes(index) || matched.includes(index) ? 'flipped' : ''}`}
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
          <div data-testid="game-complete-message" className="mt-8 p-8 rounded-3xl text-center fade-in" style={{ backgroundColor: '#A3D9A5' }}>
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>Great Job!</h2>
            <p style={{ color: '#1A1C19' }}>You completed the game in {moves} moves with {mistakes} mistakes.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryGame;