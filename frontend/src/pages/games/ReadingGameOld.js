import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, BookOpen } from 'lucide-react';
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
  const [gameComplete, setGameComplete] = useState(false);

  const handleReadingComplete = () => {
    setReadingEndTime(Date.now());
    setStage('questions');
  };

  const handleAnswerSelect = (index) => {
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = async () => {
    const correct = selectedAnswer === passage.questions[currentQuestion].answer;
    const newAnswers = [...answers, { correct }];
    setAnswers(newAnswers);
    if (correct) {
      setScore(score + 1);
    }

    if (currentQuestion + 1 >= passage.questions.length) {
      await finishGame(newAnswers, correct ? score + 1 : score);
    } else {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    }
  };

  const finishGame = async (allAnswers, finalScore) => {
    const readingTime = (readingEndTime - startTime) / 1000;
    const totalTime = (Date.now() - startTime) / 1000;
    const accuracy = (finalScore / passage.questions.length) * 100;
    const gameScore = (finalScore / passage.questions.length) * 100;
    const mistakes = passage.questions.length - finalScore;

    try {
      await axios.post(
        `${API}/games/session`,
        {
          game_type: 'reading',
          score: gameScore,
          accuracy,
          response_time: totalTime / passage.questions.length,
          mistakes,
          completion_time: totalTime,
          metadata: { reading_time: readingTime, correct_answers: finalScore }
        },
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );
      setGameComplete(true);
      toast.success('Reading assessment completed!');
    } catch (error) {
      toast.error('Failed to save results');
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FDFBF7', backgroundImage: "url('https://images.unsplash.com/photo-1774462367455-b5a0e942384b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzN8MHwxfHNlYXJjaHwzfHxjYWxtaW5nJTIwc29mdCUyMG5hdHVyZXxlbnwwfHx8fDE3NzQ4NTAzNzB8MA&ixlib=rb-4.1.0&q=85')", backgroundSize: 'cover', backgroundBlendMode: 'overlay' }}>
      <div className="max-w-4xl mx-auto px-8 py-12">
        <div className="flex items-center mb-8">
          <Button data-testid="back-to-dashboard-btn" variant="ghost" onClick={() => navigate('/dashboard')} className="rounded-full">
            <ArrowLeft className="mr-2 w-5 h-5" /> Back
          </Button>
        </div>

        <h1 data-testid="game-title" className="text-4xl font-bold mb-4" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>
          Reading Assessment
        </h1>

        {stage === 'reading' && (
          <div data-testid="reading-stage" className="fade-in">
            <p className="text-lg mb-8" style={{ color: '#4A4D48' }}>
              Read the passage carefully, then answer the comprehension questions
            </p>
            <div className="p-12 rounded-3xl mb-8" style={{ backgroundColor: 'rgba(253, 251, 247, 0.95)', border: '1px solid rgba(0,0,0,0.05)' }}>
              <BookOpen className="w-12 h-12 mb-6" style={{ color: '#8ABF9B' }} />
              <p data-testid="reading-passage" className="text-lg leading-relaxed text-left" style={{ color: '#1A1C19', lineHeight: '1.8' }}>
                {passage.text}
              </p>
            </div>
            <Button
              data-testid="continue-to-questions-btn"
              onClick={handleReadingComplete}
              className="rounded-full text-lg px-8 py-6"
              style={{ backgroundColor: '#8ABF9B', color: '#1A1C19' }}
            >
              Continue to Questions
            </Button>
          </div>
        )}

        {stage === 'questions' && !gameComplete && (
          <div data-testid="questions-stage" className="fade-in">
            <p className="text-lg mb-8" style={{ color: '#4A4D48' }}>
              Question {currentQuestion + 1} of {passage.questions.length}
            </p>
            <div className="p-8 rounded-3xl mb-8" style={{ backgroundColor: 'rgba(253, 251, 247, 0.95)' }}>
              <h3 data-testid="question-text" className="text-xl font-semibold mb-6" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>
                {passage.questions[currentQuestion].question}
              </h3>
              <div className="space-y-4">
                {passage.questions[currentQuestion].options.map((option, index) => (
                  <button
                    key={index}
                    data-testid={`answer-option-${index}`}
                    onClick={() => handleAnswerSelect(index)}
                    className="w-full p-4 rounded-2xl text-left"
                    style={{
                      backgroundColor: selectedAnswer === index ? '#8ABF9B' : '#F3F5F2',
                      border: '1px solid rgba(0,0,0,0.05)',
                      color: '#1A1C19',
                      transition: 'background-color 200ms'
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <Button
              data-testid="submit-answer-btn"
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null}
              className="rounded-full"
              style={{ backgroundColor: '#8ABF9B', color: '#1A1C19' }}
            >
              Submit Answer
            </Button>
          </div>
        )}

        {gameComplete && (
          <div data-testid="game-complete-message" className="p-8 rounded-3xl text-center fade-in" style={{ backgroundColor: '#A3D9A5' }}>
            <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>Assessment Complete!</h2>
            <p className="text-lg" style={{ color: '#1A1C19' }}>
              You answered {score} out of {passage.questions.length} questions correctly!
            </p>
            <p style={{ color: '#1A1C19' }}>Comprehension Score: {((score / passage.questions.length) * 100).toFixed(0)}%</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadingGame;