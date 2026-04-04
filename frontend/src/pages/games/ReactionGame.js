import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Zap, Trophy, Target, Star } from 'lucide-react';
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
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [stars, setStars] = useState(0);
  const totalRounds = 5;

  const startGame = () => {
    setGameState('playing');
    setReactionTimes([]);
    setFalseClicks(0);
    setRound(0);
    setCombo(0);
    setScore(0);
    setStars(0);
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
      setCombo(0);
      toast.error('⚡ Too early! Wait for the signal.', { duration: 1500 });
      return;
    }

    const reactionTime = Date.now() - startTime;
    const newTimes = [...reactionTimes, reactionTime];
    setReactionTimes(newTimes);
    setShowSignal(false);
    setRound(round + 1);

    // Scoring system
    let points = 0;
    let feedback = '';
    let newCombo = combo;

    if (reactionTime < 200) {
      points = 200;
      feedback = '🚀 Lightning Fast! +200';
      newCombo = combo + 1;
    } else if (reactionTime < 300) {
      points = 150;
      feedback = '⚡ Super Quick! +150';
      newCombo = combo + 1;
    } else if (reactionTime < 500) {
      points = 100;
      feedback = '✨ Nice! +100';
      newCombo = combo + 1;
    } else {
      points = 50;
      feedback = '👍 Good! +50';
      newCombo = 0;
    }

    const comboBonus = newCombo * 20;
    const totalPoints = points + comboBonus;
    const newScore = score + totalPoints;
    
    setCombo(newCombo);
    setScore(newScore);

    toast.success(`${feedback}${newCombo > 1 ? ` (${newCombo}x combo +${comboBonus}!)` : ''}`, {
      duration: 1500
    });

    if (round + 1 >= totalRounds) {
      finishGame(newTimes, newScore, falseClicks);
    } else {
      scheduleSignal();
    }
  };

  const calculateStars = (avgTime, mistakes) => {
    let starCount = 0;
    if (avgTime < 250) starCount = 5;
    else if (avgTime < 350) starCount = 4;
    else if (avgTime < 500) starCount = 3;
    else if (avgTime < 700) starCount = 2;
    else starCount = 1;
    
    if (mistakes > 2) starCount = Math.max(1, starCount - 1);
    if (mistakes === 0) starCount = Math.min(5, starCount + 1);
    
    return starCount;
  };

  const finishGame = async (times, finalScore, mistakes) => {
    const avgReactionTime = times.reduce((a, b) => a + b, 0) / times.length;
    const accuracy = ((totalRounds - mistakes) / totalRounds) * 100;
    const starCount = calculateStars(avgReactionTime, mistakes);
    setStars(starCount);
    setGameState('finished');

    try {
      await axios.post(
        `${API}/games/session`,
        {
          game_type: 'reaction_time',
          score: finalScore,
          accuracy,
          response_time: avgReactionTime / 1000,
          mistakes,
          completion_time: totalRounds * 3,
          metadata: { reaction_times: times, avg_reaction_time: avgReactionTime, combo_max: combo, stars: starCount }
        },
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );
      toast.success('🏆 Game completed! Progress saved.');
    } catch (error) {
      toast.error('Failed to save game progress');
    }
  };

  const getRankLabel = () => {
    const avgTime = reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length;
    if (avgTime < 250) return { text: 'Pro Gamer', color: '#8ABF9B' };
    if (avgTime < 350) return { text: 'Lightning Fast', color: '#F2C48D' };
    if (avgTime < 500) return { text: 'Quick Thinker', color: '#9EADCC' };
    if (avgTime < 700) return { text: 'Getting Better', color: '#A3D9A5' };
    return { text: 'Keep Practicing', color: '#E69C9C' };
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="flex items-center justify-between mb-8 fade-in">
          <Button data-testid="back-to-dashboard-btn" variant="ghost" onClick={() => navigate('/dashboard')} className="rounded-full">
            <ArrowLeft className="mr-2 w-5 h-5" /> Back
          </Button>
        </div>

        <div className="slide-up">
          <h1 data-testid="game-title" className="text-4xl font-bold mb-4" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>
            Reaction Time Game
          </h1>
          <p className="text-lg mb-8" style={{ color: '#4A4D48' }}>
            Click as fast as you can when you see the signal!
          </p>
        </div>

        {gameState === 'ready' && (
          <div className="text-center scale-in">
            <div className="p-12 rounded-3xl mb-8 card">
              <Zap className="w-20 h-20 mx-auto mb-6 pulse-ring" style={{ color: '#F2C48D' }} />
              <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>
                Ready to Test Your Reflexes?
              </h2>
              <p className="mb-6" style={{ color: '#4A4D48' }}>
                Wait for the lightning signal, then click as fast as possible!<br />
                <span className="text-sm">Don't click too early or you'll lose your combo!</span>
              </p>
              <Button data-testid="start-game-btn" onClick={startGame} className="btn-primary" style={{ fontSize: '18px', padding: '16px 40px' }}>
                Start Game
              </Button>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="scale-in">
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="card p-6 text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2" style={{ color: '#F2C48D' }} />
                <p className="text-sm uppercase tracking-wider mb-1" style={{ color: '#757873' }}>Score</p>
                <p className={`text-3xl font-bold ${score > 0 ? 'score-pop' : ''}`} style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>{score}</p>
              </div>

              <div className="card p-6 text-center">
                <Zap className="w-8 h-8 mx-auto mb-2" style={{ color: '#8ABF9B' }} />
                <p className="text-sm uppercase tracking-wider mb-1" style={{ color: '#757873' }}>Combo</p>
                <p className={`text-3xl font-bold ${combo > 0 ? 'celebration' : ''}`} style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>{combo}x</p>
              </div>

              <div className="card p-6 text-center">
                <Target className="w-8 h-8 mx-auto mb-2" style={{ color: '#9EADCC' }} />
                <p className="text-sm uppercase tracking-wider mb-1" style={{ color: '#757873' }}>Round</p>
                <p className="text-3xl font-bold" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>{round + 1}/{totalRounds}</p>
              </div>
            </div>

            <div className="progress-bar mb-8">
              <div 
                className="progress-fill" 
                style={{ width: `${(round / totalRounds) * 100}%` }}
              />
            </div>

            <div className="text-center">
              <div
                data-testid="reaction-target"
                onClick={handleClick}
                className="w-80 h-80 mx-auto rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300"
                style={{
                  background: showSignal 
                    ? 'linear-gradient(135deg, #F2C48D 0%, #E5B87A 100%)' 
                    : 'linear-gradient(135deg, #F3F5F2 0%, #E8EBE8 100%)',
                  border: showSignal ? '4px solid #F2C48D' : '2px solid rgba(0,0,0,0.1)',
                  boxShadow: showSignal ? '0 0 60px rgba(242, 196, 141, 0.8), 0 0 120px rgba(242, 196, 141, 0.4)' : '0 4px 12px rgba(0,0,0,0.1)',
                  transform: showSignal ? 'scale(1.05)' : 'scale(1)'
                }}
              >
                {showSignal ? (
                  <>
                    <Zap className="w-32 h-32 mb-4" style={{ color: '#1A1C19' }} />
                    <p className="text-2xl font-bold" style={{ color: '#1A1C19' }}>CLICK NOW!</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-full mb-4 pulse-ring" style={{ backgroundColor: '#757873' }} />
                    <p className="text-xl" style={{ color: '#757873' }}>Wait for signal...</p>
                  </>
                )}
              </div>

              {reactionTimes.length > 0 && (
                <div className="mt-6 fade-in">
                  <p className="text-sm" style={{ color: '#757873' }}>
                    Last reaction: <strong style={{ color: '#8ABF9B' }}>{reactionTimes[reactionTimes.length - 1]}ms</strong>
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {gameState === 'finished' && (
          <div data-testid="game-results" className="max-w-2xl mx-auto scale-in">
            <div className="p-12 rounded-3xl celebration" style={{ background: 'linear-gradient(135deg, #A3D9A5 0%, #8ABF9B 100%)', boxShadow: '0 8px 32px rgba(138, 191, 155, 0.4)' }}>
              <Trophy className="w-24 h-24 mx-auto mb-6" style={{ color: '#1A1C19' }} />
              <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>
                {getRankLabel().text}!
              </h2>
              
              <div className="star-rating mb-6">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="star" style={{ color: i < stars ? '#F2C48D' : '#E0E0E0', fontSize: '40px' }}>★</span>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="p-6 rounded-2xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}>
                  <p className="text-sm uppercase tracking-wider mb-2" style={{ color: '#1A1C19', opacity: 0.8 }}>Final Score</p>
                  <p className="text-4xl font-bold" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>{score}</p>
                </div>

                <div className="p-6 rounded-2xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}>
                  <p className="text-sm uppercase tracking-wider mb-2" style={{ color: '#1A1C19', opacity: 0.8 }}>Avg Reaction</p>
                  <p className="text-4xl font-bold" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>
                    {(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length).toFixed(0)}ms
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center p-4 rounded-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}>
                  <span style={{ color: '#1A1C19' }}>Fastest Reaction</span>
                  <strong style={{ color: '#1A1C19' }}>{Math.min(...reactionTimes)}ms</strong>
                </div>
                <div className="flex justify-between items-center p-4 rounded-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}>
                  <span style={{ color: '#1A1C19' }}>False Clicks</span>
                  <strong style={{ color: falseClicks > 0 ? '#E69C9C' : '#1A1C19' }}>{falseClicks}</strong>
                </div>
                {combo > 2 && (
                  <div className="flex justify-between items-center p-4 rounded-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}>
                    <span style={{ color: '#1A1C19' }}>Max Combo</span>
                    <strong style={{ color: '#1A1C19' }}>🔥 {combo}x</strong>
                  </div>
                )}
              </div>

              <Button data-testid="play-again-btn" onClick={startGame} className="btn-primary" style={{ width: '100%', fontSize: '18px', padding: '16px' }}>
                Play Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReactionGame;
