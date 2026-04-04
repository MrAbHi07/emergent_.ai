import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, RotateCcw, Brain, Trophy, Zap, Star, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API, getAuthToken } from '../../App';
import { toast } from 'sonner';

const patterns = [
  { sequence: [1, 2, 3], answer: 4, difficulty: 'easy' },
  { sequence: [2, 4, 6], answer: 8, difficulty: 'easy' },
  { sequence: [1, 1, 2, 3], answer: 5, difficulty: 'medium' },
  { sequence: [10, 20, 30], answer: 40, difficulty: 'easy' },
  { sequence: [5, 10, 15], answer: 20, difficulty: 'easy' },
  { sequence: [3, 6, 9], answer: 12, difficulty: 'easy' },
  { sequence: [1, 4, 9, 16], answer: 25, difficulty: 'hard' },
  { sequence: [2, 4, 8], answer: 16, difficulty: 'medium' }
];

const PatternGame = () => {
  const navigate = useNavigate();
  const [currentPattern, setCurrentPattern] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [points, setPoints] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startTime] = useState(Date.now());
  const [responseTimes, setResponseTimes] = useState([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [gameComplete, setGameComplete] = useState(false);
  const [streak, setStreak] = useState(0);
  const [stars, setStars] = useState(0);

  const handleSubmit = async () => {
    if (!userAnswer.trim()) return;

    const responseTime = (Date.now() - questionStartTime) / 1000;
    const newTimes = [...responseTimes, responseTime];
    setResponseTimes(newTimes);

    const correct = parseInt(userAnswer) === patterns[currentPattern].answer;
    let earnedPoints = 0;
    let newStreak = streak;

    if (correct) {
      // Base points by difficulty
      const basePoints = patterns[currentPattern].difficulty === 'hard' ? 150 : 
                        patterns[currentPattern].difficulty === 'medium' ? 100 : 75;
      
      // Time bonus (faster = more points)
      const timeBonus = responseTime < 5 ? 50 : responseTime < 10 ? 25 : 0;
      
      // Streak bonus
      newStreak = streak + 1;
      const streakBonus = newStreak * 10;
      
      earnedPoints = basePoints + timeBonus + streakBonus;
      
      setScore(score + 1);
      setPoints(points + earnedPoints);
      setStreak(newStreak);
      
      toast.success(`✨ Correct! +${earnedPoints} points${newStreak > 1 ? ` (${newStreak}x streak!)` : ''}`, {
        duration: 2000
      });
    } else {
      setMistakes(mistakes + 1);
      setStreak(0);
      toast.error(`❌ Wrong! The answer was ${patterns[currentPattern].answer}`, {
        duration: 2000
      });
    }

    if (currentPattern + 1 >= patterns.length) {
      await finishGame(newTimes, correct ? score + 1 : score, correct ? mistakes : mistakes + 1, correct ? points + earnedPoints : points);
    } else {
      setCurrentPattern(currentPattern + 1);
      setUserAnswer('');
      setQuestionStartTime(Date.now());
    }
  };

  const calculateStars = (finalScore, accuracy, avgTime) => {
    let starCount = 0;
    
    // Base on accuracy
    if (accuracy >= 90) starCount = 5;
    else if (accuracy >= 75) starCount = 4;
    else if (accuracy >= 60) starCount = 3;
    else if (accuracy >= 40) starCount = 2;
    else starCount = 1;
    
    // Bonus for speed
    if (avgTime < 8) starCount = Math.min(5, starCount + 1);
    
    // Perfect score
    if (finalScore === patterns.length && avgTime < 10) starCount = 5;
    
    return starCount;
  };

  const finishGame = async (times, finalScore, finalMistakes, finalPoints) => {
    const totalTime = (Date.now() - startTime) / 1000;
    const avgResponseTime = times.reduce((a, b) => a + b, 0) / times.length;
    const accuracy = (finalScore / patterns.length) * 100;
    const starCount = calculateStars(finalScore, accuracy, avgResponseTime);
    setStars(starCount);

    try {
      await axios.post(
        `${API}/games/session`,
        {
          game_type: 'pattern_recognition',
          score: finalPoints,
          accuracy,
          response_time: avgResponseTime,
          mistakes: finalMistakes,
          completion_time: totalTime,
          metadata: { 
            correct_answers: finalScore, 
            total_questions: patterns.length,
            max_streak: streak,
            stars: starCount 
          }
        },
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );
      setGameComplete(true);
      toast.success('🏆 Game completed! Progress saved.');
    } catch (error) {
      toast.error('Failed to save game progress');
    }
  };

  const restartGame = () => {
    setCurrentPattern(0);
    setUserAnswer('');
    setScore(0);
    setPoints(0);
    setMistakes(0);
    setResponseTimes([]);
    setQuestionStartTime(Date.now());
    setGameComplete(false);
    setStreak(0);
    setStars(0);
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'easy': return '#A3D9A5';
      case 'medium': return '#F2C48D';
      case 'hard': return '#E69C9C';
      default: return '#9EADCC';
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="flex items-center justify-between mb-8 fade-in">
          <Button data-testid="back-to-dashboard-btn" variant="ghost" onClick={() => navigate('/dashboard')} className="rounded-full">
            <ArrowLeft className="mr-2 w-5 h-5" /> Back
          </Button>
          <Button data-testid="restart-game-btn" variant="outline" onClick={restartGame} className="rounded-full">
            <RotateCcw className="mr-2 w-5 h-5" /> Restart
          </Button>
        </div>

        <div className="slide-up">
          <h1 data-testid="game-title" className="text-4xl font-bold mb-4" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>
            Pattern Recognition Game
          </h1>
          <p className="text-lg mb-8" style={{ color: '#4A4D48' }}>
            Find the pattern and predict the next number
          </p>
        </div>

        {!gameComplete ? (
          <div className="max-w-3xl mx-auto">
            <div className="grid grid-cols-3 gap-4 mb-8 scale-in">
              <div className="card p-6 text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2" style={{ color: '#F2C48D' }} />
                <p className="text-sm uppercase tracking-wider mb-1" style={{ color: '#757873' }}>Points</p>
                <p className={`text-3xl font-bold ${points > 0 ? 'score-pop' : ''}`} style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>{points}</p>
              </div>

              <div className="card p-6 text-center">
                <Zap className="w-8 h-8 mx-auto mb-2" style={{ color: '#8ABF9B' }} />
                <p className="text-sm uppercase tracking-wider mb-1" style={{ color: '#757873' }}>Streak</p>
                <p className={`text-3xl font-bold ${streak > 0 ? 'celebration' : ''}`} style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>{streak}x</p>
              </div>

              <div className="card p-6 text-center">
                <Target className="w-8 h-8 mx-auto mb-2" style={{ color: '#9EADCC' }} />
                <p className="text-sm uppercase tracking-wider mb-1" style={{ color: '#757873' }}>Correct</p>
                <p className="text-3xl font-bold" style={{ fontFamily: 'Nunito', color: '#8ABF9B' }}>{score}/{patterns.length}</p>
              </div>
            </div>

            <div className="progress-bar mb-8">
              <div 
                className="progress-fill" 
                style={{ width: `${(currentPattern / patterns.length) * 100}%` }}
              />
            </div>

            <div className="mb-8 p-10 rounded-3xl card slide-up">
              <div className="flex items-center justify-between mb-6">
                <p data-testid="progress-counter" className="text-base" style={{ color: '#757873' }}>
                  Question {currentPattern + 1} of {patterns.length}
                </p>
                <span 
                  className="px-4 py-2 rounded-full text-sm font-semibold"
                  style={{ 
                    backgroundColor: getDifficultyColor(patterns[currentPattern].difficulty), 
                    color: '#1A1C19' 
                  }}
                >
                  {patterns[currentPattern].difficulty.toUpperCase()}
                </span>
              </div>

              <div data-testid="pattern-sequence" className="flex items-center justify-center gap-6 mb-8">
                {patterns[currentPattern].sequence.map((num, idx) => (
                  <div 
                    key={idx}
                    className="w-20 h-20 rounded-2xl flex items-center justify-center scale-in"
                    style={{ 
                      background: 'linear-gradient(135deg, #8ABF9B 0%, #78AB89 100%)',
                      animationDelay: `${idx * 100}ms`,
                      boxShadow: '0 4px 12px rgba(138, 191, 155, 0.3)'
                    }}
                  >
                    <span className="text-3xl font-bold" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>{num}</span>
                  </div>
                ))}
                <div 
                  className="w-20 h-20 rounded-2xl flex items-center justify-center pulse-ring"
                  style={{ 
                    border: '3px dashed #8ABF9B',
                    backgroundColor: 'rgba(138, 191, 155, 0.1)'
                  }}
                >
                  <span className="text-4xl" style={{ color: '#8ABF9B' }}>?</span>
                </div>
              </div>

              <p className="text-center text-xl mb-6 font-semibold" style={{ color: '#1A1C19' }}>
                What comes next?
              </p>

              <div className="flex gap-4">
                <input
                  data-testid="pattern-answer-input"
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && userAnswer && handleSubmit()}
                  className="flex-1 px-8 py-5 rounded-2xl text-center text-3xl font-bold"
                  style={{ 
                    backgroundColor: '#F3F5F2', 
                    border: '2px solid rgba(0,0,0,0.1)', 
                    color: '#1A1C19',
                    fontFamily: 'Nunito'
                  }}
                  placeholder="?"
                  autoFocus
                />
                <Button
                  data-testid="submit-answer-btn"
                  onClick={handleSubmit}
                  disabled={!userAnswer}
                  className="rounded-2xl px-10 text-lg"
                  style={{ 
                    background: 'linear-gradient(135deg, #8ABF9B, #78AB89)', 
                    color: '#1A1C19',
                    minHeight: '70px'
                  }}
                >
                  Submit
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 scale-in">
              <div data-testid="score-display" className="p-6 rounded-2xl text-center" style={{ background: 'linear-gradient(135deg, #A3D9A5 0%, #8ABF9B 100%)' }}>
                <p className="text-sm mb-1" style={{ color: '#1A1C19', opacity: 0.8 }}>Correct</p>
                <p className="text-4xl font-bold" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>{score}</p>
              </div>
              <div data-testid="mistakes-display" className="p-6 rounded-2xl text-center" style={{ background: 'linear-gradient(135deg, #E69C9C 0%, #D88A8A 100%)' }}>
                <p className="text-sm mb-1" style={{ color: '#1A1C19', opacity: 0.8 }}>Mistakes</p>
                <p className="text-4xl font-bold" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>{mistakes}</p>
              </div>
            </div>
          </div>
        ) : (
          <div data-testid="game-complete-message" className="max-w-2xl mx-auto p-12 rounded-3xl text-center celebration" style={{ background: 'linear-gradient(135deg, #A3D9A5 0%, #8ABF9B 100%)', boxShadow: '0 8px 32px rgba(138, 191, 155, 0.4)' }}>
            <Brain className="w-24 h-24 mx-auto mb-6" style={{ color: '#1A1C19' }} />
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>Pattern Master!</h2>
            
            <div className="star-rating mb-6">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="star" style={{ color: i < stars ? '#F2C48D' : '#E0E0E0', fontSize: '40px' }}>★</span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="p-6 rounded-2xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}>
                <p className="text-sm uppercase tracking-wider mb-2" style={{ color: '#1A1C19', opacity: 0.8 }}>Total Points</p>
                <p className="text-4xl font-bold" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>{points}</p>
              </div>

              <div className="p-6 rounded-2xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}>
                <p className="text-sm uppercase tracking-wider mb-2" style={{ color: '#1A1C19', opacity: 0.8 }}>Accuracy</p>
                <p className="text-4xl font-bold" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>{((score / patterns.length) * 100).toFixed(0)}%</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center p-4 rounded-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}>
                <span style={{ color: '#1A1C19' }}>Correct Answers</span>
                <strong style={{ color: '#1A1C19' }}>{score} / {patterns.length}</strong>
              </div>
              {streak > 2 && (
                <div className="flex justify-between items-center p-4 rounded-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}>
                  <span style={{ color: '#1A1C19' }}>Max Streak</span>
                  <strong style={{ color: '#1A1C19' }}>🔥 {streak}x</strong>
                </div>
              )}
              <div className="flex justify-between items-center p-4 rounded-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}>
                <span style={{ color: '#1A1C19' }}>Avg Response Time</span>
                <strong style={{ color: '#1A1C19' }}>{(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1)}s</strong>
              </div>
            </div>

            <Button data-testid="play-again-btn" onClick={restartGame} className="btn-primary" style={{ width: '100%', fontSize: '18px', padding: '16px' }}>
              Play Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatternGame;
