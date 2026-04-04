import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API, getAuthToken } from '../../App';
import { toast } from 'sonner';

const patterns = [
  { sequence: [1, 2, 3], answer: 4 },
  { sequence: [2, 4, 6], answer: 8 },
  { sequence: [1, 1, 2, 3], answer: 5 },
  { sequence: [10, 20, 30], answer: 40 },
  { sequence: [5, 10, 15], answer: 20 },
  { sequence: [3, 6, 9], answer: 12 },
  { sequence: [1, 4, 9, 16], answer: 25 },
  { sequence: [2, 4, 8], answer: 16 }
];

const PatternGame = () => {
  const navigate = useNavigate();
  const [currentPattern, setCurrentPattern] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startTime] = useState(Date.now());
  const [responseTimes, setResponseTimes] = useState([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [gameComplete, setGameComplete] = useState(false);

  const handleSubmit = async () => {
    const responseTime = (Date.now() - questionStartTime) / 1000;
    const newTimes = [...responseTimes, responseTime];
    setResponseTimes(newTimes);

    const correct = parseInt(userAnswer) === patterns[currentPattern].answer;
    if (correct) {
      setScore(score + 1);
      toast.success('Correct!');
    } else {
      setMistakes(mistakes + 1);
      toast.error(`Wrong! The answer was ${patterns[currentPattern].answer}`);
    }

    if (currentPattern + 1 >= patterns.length) {
      await finishGame(newTimes, correct ? score + 1 : score, correct ? mistakes : mistakes + 1);
    } else {
      setCurrentPattern(currentPattern + 1);
      setUserAnswer('');
      setQuestionStartTime(Date.now());
    }
  };

  const finishGame = async (times, finalScore, finalMistakes) => {
    const totalTime = (Date.now() - startTime) / 1000;
    const avgResponseTime = times.reduce((a, b) => a + b, 0) / times.length;
    const accuracy = (finalScore / patterns.length) * 100;
    const gameScore = (finalScore / patterns.length) * 100;

    try {
      await axios.post(
        `${API}/games/session`,
        {
          game_type: 'pattern_recognition',
          score: gameScore,
          accuracy,
          response_time: avgResponseTime,
          mistakes: finalMistakes,
          completion_time: totalTime,
          metadata: { correct_answers: finalScore, total_questions: patterns.length }
        },
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );
      setGameComplete(true);
      toast.success('Game completed! Your progress has been saved.');
    } catch (error) {
      toast.error('Failed to save game progress');
    }
  };

  const restartGame = () => {
    setCurrentPattern(0);
    setUserAnswer('');
    setScore(0);
    setMistakes(0);
    setResponseTimes([]);
    setQuestionStartTime(Date.now());
    setGameComplete(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7' }}>
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <Button data-testid="back-to-dashboard-btn" variant="ghost" onClick={() => navigate('/dashboard')} className="rounded-full">
            <ArrowLeft className="mr-2 w-5 h-5" /> Back
          </Button>
          <Button data-testid="restart-game-btn" variant="outline" onClick={restartGame} className="rounded-full">
            <RotateCcw className="mr-2 w-5 h-5" /> Restart
          </Button>
        </div>

        <h1 data-testid="game-title" className="text-4xl font-bold mb-4" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>
          Pattern Recognition Game
        </h1>
        <p className="text-lg mb-8" style={{ color: '#4A4D48' }}>
          Find the pattern and predict the next number
        </p>

        {!gameComplete ? (
          <div className="max-w-2xl mx-auto">
            <div className="mb-8 p-8 rounded-3xl" style={{ backgroundColor: '#F3F5F2' }}>
              <p data-testid="progress-counter" className="text-sm mb-4" style={{ color: '#757873' }}>
                Question {currentPattern + 1} of {patterns.length}
              </p>
              <div data-testid="pattern-sequence" className="flex items-center justify-center gap-4 mb-6 text-3xl font-bold" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>
                {patterns[currentPattern].sequence.map((num, idx) => (
                  <span key={idx}>{num}</span>
                ))}
                <span style={{ color: '#8ABF9B' }}>?</span>
              </div>
              <p className="text-center mb-4" style={{ color: '#4A4D48' }}>What comes next?</p>
              <div className="flex gap-4">
                <input
                  data-testid="pattern-answer-input"
                  type="number"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && userAnswer && handleSubmit()}
                  className="flex-1 px-6 py-4 rounded-xl text-center text-2xl font-bold"
                  style={{ backgroundColor: '#FDFBF7', border: '1px solid rgba(0,0,0,0.1)', color: '#1A1C19' }}
                  placeholder="?"
                />
                <Button
                  data-testid="submit-answer-btn"
                  onClick={handleSubmit}
                  disabled={!userAnswer}
                  className="rounded-xl px-8"
                  style={{ backgroundColor: '#8ABF9B', color: '#1A1C19' }}
                >
                  Submit
                </Button>
              </div>
            </div>

            <div className="flex gap-4">
              <div data-testid="score-display" className="flex-1 p-6 rounded-2xl text-center" style={{ backgroundColor: '#A3D9A5' }}>
                <p className="text-sm mb-1" style={{ color: '#1A1C19', opacity: 0.8 }}>Correct</p>
                <p className="text-3xl font-bold" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>{score}</p>
              </div>
              <div data-testid="mistakes-display" className="flex-1 p-6 rounded-2xl text-center" style={{ backgroundColor: '#E69C9C' }}>
                <p className="text-sm mb-1" style={{ color: '#1A1C19', opacity: 0.8 }}>Mistakes</p>
                <p className="text-3xl font-bold" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>{mistakes}</p>
              </div>
            </div>
          </div>
        ) : (
          <div data-testid="game-complete-message" className="max-w-2xl mx-auto p-8 rounded-3xl text-center fade-in" style={{ backgroundColor: '#A3D9A5' }}>
            <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>Game Complete!</h2>
            <p className="text-lg mb-2" style={{ color: '#1A1C19' }}>You got {score} out of {patterns.length} correct!</p>
            <p style={{ color: '#1A1C19' }}>Accuracy: {((score / patterns.length) * 100).toFixed(0)}%</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatternGame;