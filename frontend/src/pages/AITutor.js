import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Send, Mic, Volume2, Sparkles, BookOpen, Calculator, Globe, Lightbulb, Smile, HelpCircle, Eye, Dumbbell, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { API, getAuthToken } from '../App';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import VoiceTranscription from '../utils/voiceTranscription';

const AITutor = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [sessionId] = useState(`session_${Date.now()}`);
  const [suggestedTopics, setSuggestedTopics] = useState([]);
  const [followUpSuggestions, setFollowUpSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [lastAIResponse, setLastAIResponse] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchSuggestedTopics();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSuggestedTopics = async () => {
    try {
      const response = await axios.get(`${API}/chat/suggested-topics`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` }
      });
      setSuggestedTopics(response.data.topics || []);
    } catch (error) {
      console.error('Failed to fetch suggested topics');
    }
  };

  const handleSendMessage = async (messageText = null) => {
    const textToSend = messageText || inputMessage;
    if (!textToSend.trim()) return;

    const userMessage = { role: 'user', content: textToSend };
    setMessages([...messages, userMessage]);
    setInputMessage('');
    setLoading(true);
    setShowSuggestions(false);

    try {
      const response = await axios.post(
        `${API}/chat/send`,
        { session_id: sessionId, message: textToSend },
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );

      const aiMessage = { role: 'assistant', content: response.data.response };
      setMessages(prev => [...prev, aiMessage]);
      setLastAIResponse(response.data.response);
      
      if (response.data.follow_ups) {
        setFollowUpSuggestions(response.data.follow_ups);
      }
    } catch (error) {
      toast.error('Failed to get response from tutor');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (action) => {
    if (!lastAIResponse) return;
    
    setLoading(true);
    try {
      const response = await axios.post(
        `${API}/chat/quick-action`,
        {
          action,
          last_response: lastAIResponse,
          session_id: sessionId
        },
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );

      const aiMessage = { role: 'assistant', content: response.data.response };
      setMessages(prev => [...prev, aiMessage]);
      setLastAIResponse(response.data.response);
      
      toast.success('Got it! Here\'s a different way to explain it.');
    } catch (error) {
      toast.error('Failed to process quick action');
    } finally {
      setLoading(false);
    }
  };

  const handleTopicClick = (topic) => {
    setInputMessage(topic);
    handleSendMessage(topic);
  };

  const handleFollowUpClick = (followUp) => {
    handleSendMessage(followUp);
  };

  const handleVoiceInput = async () => {
    try {
      // Check browser support
      const voiceTranscription = new VoiceTranscription();
      const support = voiceTranscription.getBrowserSupport();

      if (!support.webSpeech && !support.mediaRecorder) {
        toast.error('Voice input not supported in your browser. Please try Chrome, Edge, or Safari.');
        return;
      }

      if (!support.microphone) {
        toast.error('Microphone access not available. Please check your device.');
        return;
      }

      // Check and request microphone permission
      const permissionStatus = await voiceTranscription.checkMicrophonePermission();
      
      if (permissionStatus.state === 'denied') {
        toast.error('Microphone permission denied. Please enable it in your browser settings.', {
          duration: 5000
        });
        return;
      }

      if (permissionStatus.state === 'prompt') {
        const accessResult = await voiceTranscription.requestMicrophoneAccess();
        if (!accessResult.success) {
          toast.error(accessResult.message, { duration: 5000 });
          return;
        }
      }

      setRecording(true);
      let transcriptionMethod = 'Web Speech API';

      try {
        // Try Web Speech API first (faster, browser-native)
        if (support.webSpeech) {
          toast.info('🎤 Listening... Speak clearly into your microphone', {
            duration: 10000,
            id: 'recording-toast'
          });

          const text = await voiceTranscription.transcribeWithWebSpeech(
            (interimText, isInterim) => {
              // Show interim results
              if (isInterim) {
                setInputMessage(interimText);
              }
            },
            (error) => {
              console.error('Web Speech error:', error);
            },
            10000 // 10 seconds max
          );

          setInputMessage(text);
          toast.success('✓ Voice transcribed successfully!');
        } else {
          // Fallback to OpenAI Whisper
          transcriptionMethod = 'OpenAI Whisper';
          toast.info('🎤 Recording... (5 seconds)', {
            duration: 5000,
            id: 'recording-toast'
          });

          const text = await voiceTranscription.transcribeWithWhisper(API, getAuthToken(), 5000);
          setInputMessage(text);
          toast.success('✓ Voice transcribed successfully!');
        }
      } catch (error) {
        console.error(`${transcriptionMethod} transcription error:`, error);
        
        // If Web Speech failed, try Whisper as fallback
        if (transcriptionMethod === 'Web Speech API' && support.mediaRecorder) {
          try {
            toast.info('Trying alternative transcription method...', { duration: 3000 });
            const text = await voiceTranscription.transcribeWithWhisper(API, getAuthToken(), 5000);
            setInputMessage(text);
            toast.success('✓ Voice transcribed successfully!');
          } catch (whisperError) {
            toast.error(`Transcription failed: ${whisperError.message}`, { duration: 5000 });
          }
        } else {
          toast.error(`Transcription failed: ${error.message}`, { duration: 5000 });
        }
      } finally {
        setRecording(false);
        toast.dismiss('recording-toast');
      }

    } catch (error) {
      setRecording(false);
      console.error('Voice input error:', error);
      toast.error(`Voice input error: ${error.message}`, { duration: 5000 });
    }
  };

  const handleReadAloud = async () => {
    if (messages.length === 0) return;

    const lastAIMessage = [...messages].reverse().find(m => m.role === 'assistant');
    if (!lastAIMessage) {
      toast.error('No AI message to read');
      return;
    }

    try {
      const response = await axios.post(
        `${API}/voice/synthesize?text=${encodeURIComponent(lastAIMessage.content)}`,
        {},
        {
          headers: { Authorization: `Bearer ${getAuthToken()}` },
          responseType: 'blob'
        }
      );

      const audioUrl = URL.createObjectURL(response.data);
      const audio = new Audio(audioUrl);
      audio.play();
      toast.success('Playing audio...');
    } catch (error) {
      toast.error('Failed to generate speech');
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FDFBF7' }}>
      <div className="max-w-5xl mx-auto w-full px-8 py-12 flex flex-col flex-1">
        <div className="flex items-center mb-8 fade-in">
          <Button data-testid="back-to-dashboard-btn" variant="ghost" onClick={() => navigate('/dashboard')} className="rounded-full">
            <ArrowLeft className="mr-2 w-5 h-5" /> Back
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-8 slide-up">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1659018966820-de07c94e0d01?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzV8MHwxfHNlYXJjaHwyfHxjdXRlJTIwM2QlMjByb2JvdCUyMGNoYXJhY3RlcnxlbnwwfHx8fDE3NzQ4NTAzNzV8MA&ixlib=rb-4.1.0&q=85"
              alt="AI Tutor"
              className="w-20 h-20 rounded-full"
              style={{ boxShadow: '0 8px 24px rgba(138, 191, 155, 0.3)' }}
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center pulse-ring" style={{ background: 'linear-gradient(135deg, #8ABF9B, #78AB89)' }}>
              <Sparkles className="w-3 h-3" style={{ color: '#FFF' }} />
            </div>
          </div>
          <div>
            <h1 data-testid="tutor-title" className="text-4xl font-bold" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>
              NeuroBuddy AI Tutor
            </h1>
            <p style={{ color: '#4A4D48' }}>Your personal adaptive learning companion</p>
          </div>
        </div>

        <div data-testid="chat-container" className="flex-1 p-8 rounded-3xl mb-6 overflow-y-auto glass" style={{ minHeight: '450px', maxHeight: '550px' }}>
          {messages.length === 0 ? (
            <div className="text-center fade-in">
              <Sparkles className="w-16 h-16 mx-auto mb-4" style={{ color: '#8ABF9B' }} />
              <p className="text-xl font-semibold mb-2" style={{ color: '#1A1C19' }}>Hi! I'm NeuroBuddy 👋</p>
              <p className="mb-2" style={{ color: '#757873' }}>Your AI learning companion ready to help!</p>
              <p className="text-sm mb-6" style={{ color: '#757873' }}>
                I'll adapt my explanations to your learning style and help you understand any topic.
              </p>
              
              {showSuggestions && suggestedTopics.length > 0 && (
                <div className="mt-6 grid grid-cols-1 gap-3">
                  {suggestedTopics.map((topic, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleTopicClick(topic)}
                      className="card p-4 text-left flex items-center gap-3 hover:scale-105 transition-all"
                      style={{ cursor: 'pointer' }}
                    >
                      {idx === 0 && <Calculator className="w-5 h-5" style={{ color: '#8ABF9B' }} />}
                      {idx === 1 && <BookOpen className="w-5 h-5" style={{ color: '#F2C48D' }} />}
                      {idx === 2 && <Globe className="w-5 h-5" style={{ color: '#9EADCC' }} />}
                      {idx === 3 && <Sparkles className="w-5 h-5" style={{ color: '#A3D9A5' }} />}
                      <span style={{ color: '#1A1C19' }}>{topic}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  data-testid={`chat-message-${msg.role}-${index}`}
                  className={`chat-bubble ${msg.role}`}
                  style={{
                    backgroundColor: msg.role === 'user' ? '#8ABF9B' : 'rgba(253, 251, 247, 0.95)',
                    marginLeft: msg.role === 'user' ? 'auto' : '0',
                    color: '#1A1C19',
                    backdropFilter: msg.role === 'assistant' ? 'blur(10px)' : 'none'
                  }}
                >
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown
                      components={{
                        strong: ({node, ...props}) => <strong style={{ color: '#8ABF9B', fontWeight: 700 }} {...props} />,
                        em: ({node, ...props}) => <em style={{ fontStyle: 'italic', color: '#4A4D48' }} {...props} />,
                        p: ({node, ...props}) => <p style={{ marginBottom: '0.5rem' }} {...props} />,
                        ul: ({node, ...props}) => <ul style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }} {...props} />,
                        ol: ({node, ...props}) => <ol style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }} {...props} />,
                        li: ({node, ...props}) => <li style={{ marginBottom: '0.25rem' }} {...props} />,
                        h3: ({node, ...props}) => <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginTop: '0.75rem', marginBottom: '0.5rem', color: '#8ABF9B' }} {...props} />
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
              ))}
              {loading && (
                <div data-testid="typing-indicator" className="chat-bubble assistant" style={{ backgroundColor: 'rgba(253, 251, 247, 0.95)', backdropFilter: 'blur(10px)' }}>
                  <div className="typing-indicator">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Quick Action Buttons */}
        {messages.length > 0 && !loading && (
          <div className="mb-4 flex flex-wrap gap-2 scale-in">
            <button
              onClick={() => handleQuickAction('simpler')}
              className="px-4 py-2 rounded-full text-sm flex items-center gap-2 card hover:scale-105 transition-all"
              style={{ cursor: 'pointer' }}
            >
              <Smile className="w-4 h-4" style={{ color: '#8ABF9B' }} />
              <span style={{ color: '#1A1C19' }}>Explain Simpler</span>
            </button>

            <button
              onClick={() => handleQuickAction('example')}
              className="px-4 py-2 rounded-full text-sm flex items-center gap-2 card hover:scale-105 transition-all"
              style={{ cursor: 'pointer' }}
            >
              <Lightbulb className="w-4 h-4" style={{ color: '#F2C48D' }} />
              <span style={{ color: '#1A1C19' }}>Give Example</span>
            </button>

            <button
              onClick={() => handleQuickAction('visual')}
              className="px-4 py-2 rounded-full text-sm flex items-center gap-2 card hover:scale-105 transition-all"
              style={{ cursor: 'pointer' }}
            >
              <Eye className="w-4 h-4" style={{ color: '#9EADCC' }} />
              <span style={{ color: '#1A1C19' }}>Show Visually</span>
            </button>

            <button
              onClick={() => handleQuickAction('practice')}
              className="px-4 py-2 rounded-full text-sm flex items-center gap-2 card hover:scale-105 transition-all"
              style={{ cursor: 'pointer' }}
            >
              <Dumbbell className="w-4 h-4" style={{ color: '#A3D9A5' }} />
              <span style={{ color: '#1A1C19' }}>Practice Problem</span>
            </button>

            <button
              onClick={() => handleQuickAction('confused')}
              className="px-4 py-2 rounded-full text-sm flex items-center gap-2 card hover:scale-105 transition-all"
              style={{ cursor: 'pointer' }}
            >
              <HelpCircle className="w-4 h-4" style={{ color: '#E69C9C' }} />
              <span style={{ color: '#1A1C19' }}>I'm Confused</span>
            </button>
          </div>
        )}

        {/* Follow-up Suggestions */}
        {followUpSuggestions.length > 0 && !loading && (
          <div className="mb-4 flex flex-wrap gap-2 scale-in">
            <span className="text-sm font-semibold" style={{ color: '#757873', alignSelf: 'center', marginRight: '8px' }}>Ask next:</span>
            {followUpSuggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleFollowUpClick(suggestion)}
                className="px-3 py-1.5 rounded-full text-sm flex items-center gap-2 hover:scale-105 transition-all"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(138, 191, 155, 0.1), rgba(158, 173, 204, 0.1))',
                  border: '1px solid rgba(138, 191, 155, 0.3)',
                  cursor: 'pointer',
                  color: '#1A1C19'
                }}
              >
                {suggestion}
                <ArrowRight className="w-3 h-3" style={{ color: '#8ABF9B' }} />
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-4 scale-in">
          <Input
            data-testid="chat-input"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
            placeholder="Ask me anything..."
            disabled={loading}
            className="flex-1 rounded-2xl"
            style={{ minHeight: '56px', backgroundColor: '#F3F5F2', fontSize: '16px' }}
          />
          <Button
            data-testid="send-message-btn"
            onClick={() => handleSendMessage()}
            disabled={loading || !inputMessage.trim()}
            className="rounded-2xl px-6"
            style={{ background: 'linear-gradient(135deg, #8ABF9B, #78AB89)', color: '#1A1C19', minHeight: '56px' }}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>

        <div className="mt-4 flex gap-4 scale-in">
          <Button 
            data-testid="voice-input-btn" 
            variant="outline" 
            className="rounded-2xl flex-1" 
            style={{ color: recording ? '#8ABF9B' : '#757873' }}
            onClick={handleVoiceInput}
            disabled={recording}
          >
            <Mic className={`w-5 h-5 mr-2 ${recording ? 'pulse-ring' : ''}`} /> 
            {recording ? 'Recording...' : 'Voice Input'}
          </Button>
          <Button 
            data-testid="voice-output-btn" 
            variant="outline" 
            className="rounded-2xl flex-1" 
            style={{ color: '#757873' }}
            onClick={handleReadAloud}
          >
            <Volume2 className="w-5 h-5 mr-2" /> Read Aloud
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AITutor;
