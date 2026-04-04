import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, BookOpen, Trophy, Star, Clock, Target, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API, getAuthToken } from '../../App';
import { toast } from 'sonner';

const passage = {
  text: "The ocean is home to many amazing creatures. Dolphins are intelligent marine mammals that live in groups called pods. They use echolocation to find food and navigate through the water. Dolphins communicate with each other through clicks and whistles. They are known for their playful behavior and can often be seen jumping out of the water.",
  questions: [
    {
      question: "What are groups of dolphins called?",
      options: ["Schools", "Pods", "Herds", "Flocks"],
      answer: 1
    },
    {
      question: "How do dolphins find food?",
      options: ["By smell", "By sight", "By echolocation", "By taste"],
      answer: 2
    },
    {
      question: "What are dolphins known for?",
      options: ["Being shy", "Being aggressive", "Being playful", "Being slow"],
      answer: 2
    }
  ]
};

const ReadingGame = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState('reading');
  const [startTime] = useState(Date.now());
  const [readingEndTime, setReadingEndTime] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [points, setPoints] = useState(0);
  const [streak, setStreak] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [stars, setStars] = useState(0);

  const handleReadingComplete = () => {
    const readingTime = (Date.now() - startTime) / 1000;
    setReadingEndTime(Date.now());
    
    // Reading speed bonus
    let speedBonus = 0;
    if (readingTime < 30) {
      speedBonus = 100;
      toast.success('🚀 Speed Reader! +100 bonus', { duration: 2000 });
    } else if (readingTime < 45) {
      speedBonus = 50;
      toast.success('⚡ Quick Reader! +50 bonus', { duration: 2000 });
    } else if (readingTime < 60) {
      speedBonus = 25;
      toast.success('Good reading pace! +25 bonus', { duration: 2000 });
    }
    
    setPoints(speedBonus);
    setStage('questions');
  };

  const handleAnswerSelect = (index) => {
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = async () => {
    const correct = selectedAnswer === passage.questions[currentQuestion].answer;
    const newAnswers = [...answers, { correct }];
    setAnswers(newAnswers);

    let earnedPoints = 0;
    let newStreak = streak;

    if (correct) {
      // Base points for correct answer
      const basePoints = 100;
      
      // Streak bonus
      newStreak = streak + 1;
      const streakBonus = newStreak * 25;
      
      earnedPoints = basePoints + streakBonus;
      setScore(score + 1);
      setPoints(points + earnedPoints);
      setStreak(newStreak);
      
      toast.success(`✨ Correct! +${earnedPoints} points${newStreak > 1 ? ` (${newStreak}x streak!)` : ''}`, {
        duration: 2000
      });
    } else {
      setStreak(0);
      toast.error('❌ Incorrect. Keep trying!', { duration: 2000 });
    }

    if (currentQuestion + 1 >= passage.questions.length) {
      await finishGame(newAnswers, correct ? score + 1 : score, correct ? points + earnedPoints : points);
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    }
  };

  const calculateStars = (finalScore, readingSpeed, accuracy) => {
    let starCount = 0;
    
    // Base on accuracy
    if (accuracy >= 100) starCount = 5;
    else if (accuracy >= 66) starCount = 4;
    else if (accuracy >= 33) starCount = 3;
    else starCount = 2;
    
    // Bonus for reading speed (words per minute)
    const wordCount = passage.text.split(' ').length;
    const wpm = (wordCount / readingSpeed) * 60;
    if (wpm > 200) starCount = Math.min(5, starCount + 1);
    
    return Math.max(1, starCount);
  };

  const finishGame = async (allAnswers, finalScore, finalPoints) => {
    const readingTime = (readingEndTime - startTime) / 1000;
    const totalTime = (Date.now() - startTime) / 1000;
    const accuracy = (finalScore / passage.questions.length) * 100;
    const starCount = calculateStars(finalScore, readingTime, accuracy);
    const mistakes = passage.questions.length - finalScore;
    
    setStars(starCount);

    try {
      await axios.post(
        `${API}/games/session`,
        {
          game_type: 'reading',
          score: finalPoints,
          accuracy,
          response_time: totalTime / passage.questions.length,
          mistakes,
          completion_time: totalTime,
          metadata: { 
            reading_time: readingTime, 
            correct_answers: finalScore,
            max_streak: streak,
            stars: starCount 
          }
        },
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );
      setGameComplete(true);
      toast.success('🏆 Assessment completed!');
    } catch (error) {
      toast.error('Failed to save results');
    }
  };

  const getReadingSpeedLabel = () => {
    const readingTime = (readingEndTime - startTime) / 1000;
    const wordCount = passage.text.split(' ').length;
    const wpm = Math.round((wordCount / readingTime) * 60);
    
    if (wpm > 250) return { text: 'Speed Reader', wpm, color: '#8ABF9B' };
    if (wpm > 200) return { text: 'Fast Reader', wpm, color: '#F2C48D' };
    if (wpm > 150) return { text: 'Good Pace', wpm, color: '#9EADCC' };
    return { text: 'Steady Reader', wpm, color: '#A3D9A5' };
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7', backgroundImage: "url('https://images.unsplash.com/photo-1774462367455-b5a0e942384b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzN8MHwxfHNlYXJjaHwzfHxjYWxtaW5nJTIwc29mdCUyMG5hdHVyZXxlbnwwfHx8fDE3NzQ4NTAzNzB8MA&ixlib=rb-4.1.0&q=85')", backgroundSize: 'cover', backgroundBlendMode: 'overlay' }}>
      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="flex items-center mb-8 fade-in">
          <Button data-testid="back-to-dashboard-btn" variant="ghost" onClick={() => navigate('/dashboard')} className="rounded-full">
            <ArrowLeft className="mr-2 w-5 h-5" /> Back
          </Button>
        </div>

        <div className="slide-up">
          <h1 data-testid="game-title" className="text-4xl font-bold mb-4" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>
            Reading Assessment
          </h1>
        </div>

        {stage === 'reading' && (
          <div data-testid="reading-stage" className="scale-in">
            <p className="text-lg mb-8" style={{ color: '#4A4D48' }}>
              Read the passage carefully, then answer the comprehension questions
            </p>

            <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl" style={{ backgroundColor: 'rgba(138, 191, 155, 0.1)' }}>
              <Clock className="w-6 h-6" style={{ color: '#8ABF9B' }} />
              <div>
                <p className="font-semibold" style={{ color: '#1A1C19' }}>Reading Speed Matters!</p>
                <p className="text-sm" style={{ color: '#4A4D48' }}>Read carefully but quickly for bonus points</p>
              </div>
            </div>

            <div className="p-12 rounded-3xl mb-8 glass" style={{ border: '1px solid rgba(138, 191, 155, 0.2)' }}>
              <BookOpen className="w-12 h-12 mb-6" style={{ color: '#8ABF9B' }} />
              <p data-testid="reading-passage" className="text-lg leading-relaxed text-left" style={{ color: '#1A1C19', lineHeight: '2' }}>
                {passage.text}
              </p>
            </div>

            <Button
              data-testid="continue-to-questions-btn"
              onClick={handleReadingComplete}
              className="btn-primary"
              style={{ fontSize: '18px', padding: '16px 40px' }}
            >
              Continue to Questions
            </Button>
          </div>
        )}

        {stage === 'questions' && !gameComplete && (
          <div data-testid="questions-stage" className="scale-in">
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="card p-6 text-center">
                <Trophy className="w-8 h-8 mx-auto mb-2" style={{ color: '#F2C48D' }} />
                <p className="text-sm uppercase tracking-wider mb-1" style={{ color: '#757873' }}>Points</p>
                <p className={`text-3xl font-bold ${points > 0 ? 'score-pop' : ''}`} style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>{points}</p>
              </div>

              <div className="card p-6 text-center">
                <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#8ABF9B' }} />
                <p className="text-sm uppercase tracking-wider mb-1" style={{ color: '#757873' }}>Streak</p>
                <p className={`text-3xl font-bold ${streak > 0 ? 'celebration' : ''}`} style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>{streak}x</p>
              </div>

              <div className="card p-6 text-center">
                <Target className="w-8 h-8 mx-auto mb-2" style={{ color: '#9EADCC' }} />
                <p className="text-sm uppercase tracking-wider mb-1" style={{ color: '#757873' }}>Question</p>
                <p className="text-3xl font-bold" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>{currentQuestion + 1}/{passage.questions.length}</p>
              </div>
            </div>

            <div className="progress-bar mb-8">
              <div 
                className="progress-fill" 
                style={{ width: `${(currentQuestion / passage.questions.length) * 100}%` }}
              />
            </div>

            <div className="p-10 rounded-3xl mb-8 glass" style={{ border: '1px solid rgba(138, 191, 155, 0.2)' }}>
              <h3 data-testid="question-text" className="text-2xl font-semibold mb-8" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>
                {passage.questions[currentQuestion].question}
              </h3>
              <div className="space-y-4">
                {passage.questions[currentQuestion].options.map((option, index) => (
                  <button
                    key={index}
                    data-testid={`answer-option-${index}`}
                    onClick={() => handleAnswerSelect(index)}
                    className="w-full p-5 rounded-2xl text-left transition-all duration-300"
                    style={{
                      background: selectedAnswer === index 
                        ? 'linear-gradient(135deg, #8ABF9B 0%, #78AB89 100%)' 
                        : 'rgba(243, 245, 242, 0.95)',
                      border: selectedAnswer === index ? '2px solid #8ABF9B' : '1px solid rgba(0,0,0,0.05)',
                      color: '#1A1C19',
                      fontSize: '17px',
                      fontWeight: selectedAnswer === index ? '600' : '400',
                      transform: selectedAnswer === index ? 'translateX(8px) scale(1.02)' : 'translateX(0)',
                      boxShadow: selectedAnswer === index ? '0 8px 24px rgba(138, 191, 155, 0.3)' : '0 2px 8px rgba(0,0,0,0.05)'
                    }}
                  >
                    <span className="flex items-center">
                      <span 
                        className="w-8 h-8 rounded-full flex items-center justify-center mr-4"
                        style={{ 
                          backgroundColor: selectedAnswer === index ? 'rgba(255, 255, 255, 0.3)' : 'rgba(138, 191, 155, 0.1)',
                          fontWeight: 'bold'
                        }}
                      >
                        {String.fromCharCode(65 + index)}
                      </span>
                      {option}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <Button
              data-testid="submit-answer-btn"
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null}
              className="btn-primary"
              style={{ width: '100%', fontSize: '18px', padding: '16px' }}
            >
              Submit Answer
            </Button>
          </div>
        )}

        {gameComplete && (
          <div data-testid="game-complete-message" className="p-12 rounded-3xl text-center celebration" style={{ background: 'linear-gradient(135deg, #A3D9A5 0%, #8ABF9B 100%)', boxShadow: '0 8px 32px rgba(138, 191, 155, 0.4)' }}>
            <BookOpen className="w-24 h-24 mx-auto mb-6" style={{ color: '#1A1C19' }} />
            <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>
              {getReadingSpeedLabel().text}!
            </h2>
            
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
                <p className="text-sm uppercase tracking-wider mb-2" style={{ color: '#1A1C19', opacity: 0.8 }}>Reading Speed</p>
                <p className="text-4xl font-bold" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>{getReadingSpeedLabel().wpm} <span className="text-xl">wpm</span></p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center p-4 rounded-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}>
                <span style={{ color: '#1A1C19' }}>Comprehension Score</span>
                <strong style={{ color: '#1A1C19' }}>{((score / passage.questions.length) * 100).toFixed(0)}%</strong>
              </div>
              <div className="flex justify-between items-center p-4 rounded-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}>
                <span style={{ color: '#1A1C19' }}>Correct Answers</span>
                <strong style={{ color: '#1A1C19' }}>{score} / {passage.questions.length}</strong>
              </div>
              {streak > 1 && (
                <div className="flex justify-between items-center p-4 rounded-xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}>
                  <span style={{ color: '#1A1C19' }}>Max Streak</span>
                  <strong style={{ color: '#1A1C19' }}>🔥 {streak}x</strong>
                </div>
              )}
            </div>

            <Button 
              onClick={() => navigate('/dashboard')} 
              className="btn-primary" 
              style={{ width: '100%', fontSize: '18px', padding: '16px' }}
            >
              Back to Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadingGame;
