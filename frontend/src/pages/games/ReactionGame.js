import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API, getAuthToken } from '../../App';
import { toast } from 'sonner';

const ReactionGame = () => {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState('ready');
  const [showSignal, setShowSignal] = useState(false);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [falseClicks, setFalseClicks] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [round, setRound] = useState(0);
  const totalRounds = 5;

  const startGame = () => {
    setGameState('playing');
    setReactionTimes([]);
    setFalseClicks(0);
    setRound(0);
    scheduleSignal();
  };

  const scheduleSignal = () => {
    const delay = Math.random() * 3000 + 2000;
    setTimeout(() => {
      setShowSignal(true);
      setStartTime(Date.now());
    }, delay);
  };

  const handleClick = () => {
    if (gameState !== 'playing') return;

    if (!showSignal) {
      setFalseClicks(falseClicks + 1);
      toast.error('Too early! Wait for the signal.');
      return;
    }

    const reactionTime = Date.now() - startTime;
    const newTimes = [...reactionTimes, reactionTime];
    setReactionTimes(newTimes);
    setShowSignal(false);
    setRound(round + 1);

    if (round + 1 >= totalRounds) {
      finishGame(newTimes);
    } else {
      scheduleSignal();
    }
  };

  const finishGame = async (times) => {
    setGameState('finished');
    const avgReactionTime = times.reduce((a, b) => a + b, 0) / times.length;
    const accuracy = ((totalRounds - falseClicks) / totalRounds) * 100;
    const score = Math.max(0, 100 - (avgReactionTime / 10) - (falseClicks * 10));

    try {
      await axios.post(
        `${API}/games/session`,
        {
          game_type: 'reaction_time',
          score,
          accuracy,
          response_time: avgReactionTime / 1000,
          mistakes: falseClicks,
          completion_time: totalRounds * 3,
          metadata: { reaction_times: times }
        },
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );
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
        </div>

        <h1 data-testid="game-title" className="text-4xl font-bold mb-4" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>
          Reaction Time Game
        </h1>
        <p className="text-lg mb-8" style={{ color: '#4A4D48' }}>
          Click as fast as you can when you see the signal
        </p>

        {gameState === 'ready' && (
          <div className="text-center">
            <Button data-testid="start-game-btn" onClick={startGame} className="rounded-full text-lg px-8 py-6" style={{ backgroundColor: '#8ABF9B', color: '#1A1C19' }}>
              Start Game
            </Button>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="text-center">
            <div data-testid="round-counter" className="mb-8 text-xl" style={{ color: '#4A4D48' }}>
              Round {round + 1} of {totalRounds}
            </div>
            <div
              data-testid="reaction-target"
              onClick={handleClick}
              className="w-64 h-64 mx-auto rounded-full flex items-center justify-center cursor-pointer"
              style={{
                backgroundColor: showSignal ? '#8ABF9B' : '#F3F5F2',
                border: '2px solid rgba(0,0,0,0.1)',
                transition: 'background-color 100ms'
              }}
            >
              {showSignal ? (
                <Zap className="w-24 h-24" style={{ color: '#1A1C19' }} />
              ) : (
                <span style={{ color: '#757873' }}>Wait...</span>
              )}
            </div>
          </div>
        )}

        {gameState === 'finished' && (
          <div data-testid="game-results" className="max-w-2xl mx-auto fade-in">
            <div className="p-8 rounded-3xl mb-8" style={{ backgroundColor: '#A3D9A5' }}>
              <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>Results</h2>
              <div className="space-y-4">
                <p style={{ color: '#1A1C19' }}>
                  Average Reaction Time: {(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length).toFixed(0)}ms
                </p>
                <p style={{ color: '#1A1C19' }}>False Clicks: {falseClicks}</p>
              </div>
            </div>
            <Button data-testid="play-again-btn" onClick={startGame} className="rounded-full" style={{ backgroundColor: '#8ABF9B', color: '#1A1C19' }}>
              Play Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReactionGame;