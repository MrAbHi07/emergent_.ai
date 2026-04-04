import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Send, Mic, Volume2, VolumeX, Sparkles, BookOpen, Calculator, Globe, Lightbulb, Smile, HelpCircle, Eye, Dumbbell, ArrowRight, Pause, Play, Square, Settings2, Loader2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { API, getAuthToken } from '../App';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import VoiceTranscription from '../utils/voiceTranscription';
import tts, { TTS_STATE } from '../utils/textToSpeech';

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
  const [ttsState, setTtsState] = useState(TTS_STATE.IDLE);
  const [ttsVoices, setTtsVoices] = useState([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState('');
  const [speechRate, setSpeechRate] = useState(1.0);
  const [showTtsPanel, setShowTtsPanel] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    fetchSuggestedTopics();
    if (tts.isSupported()) {
      tts.onStateChange = (state) => setTtsState(state);
      tts.loadVoices().then((voices) => {
        setTtsVoices(voices.filter(v => v.lang.startsWith('en')));
        const picked = tts._pickVoice();
        if (picked) setSelectedVoiceURI(picked.voiceURI);
      });
    }
    return () => { tts.stop(); };
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

  const handleVoiceChange = useCallback((voiceURI) => {
    setSelectedVoiceURI(voiceURI);
    tts.setVoice(voiceURI);
  }, []);

  const handleRateChange = useCallback((rate) => {
    const r = parseFloat(rate);
    setSpeechRate(r);
    tts.setRate(r);
  }, []);

  const handleReadAloud = async (textOverride) => {
    if (ttsState === TTS_STATE.SPEAKING || ttsState === TTS_STATE.LOADING) {
      tts.stop();
      return;
    }
    if (ttsState === TTS_STATE.PAUSED) {
      tts.resume();
      return;
    }

    if (!tts.isSupported()) {
      toast.error('Text-to-Speech is not supported in your browser. Try Chrome, Edge, or Safari.');
      return;
    }

    const text = textOverride || (() => {
      const lastAI = [...messages].reverse().find(m => m.role === 'assistant');
      return lastAI?.content;
    })();

    if (!text) {
      toast.error('No message to read aloud yet.');
      return;
    }

    try {
      await tts.speak(text);
    } catch (err) {
      toast.error(err.message || 'Speech failed. Please try again.');
    }
  };

  const handlePause = () => tts.pause();
  const handleResume = () => tts.resume();
  const handleStop = () => tts.stop();

  const isTtsActive = ttsState !== TTS_STATE.IDLE;
  const hasAssistantMsg = messages.some(m => m.role === 'assistant');

  return (
    <div className="min-h-screen flex flex-col relative" style={{ background: '#05050A' }}>
      {/* Background orbs */}
      <div className="absolute top-[-5%] right-[-5%] w-[400px] h-[400px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[10%] left-[-5%] w-[350px] h-[350px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.3) 0%, transparent 70%)' }} />

      <div className="relative z-10 max-w-5xl mx-auto w-full px-8 py-10 flex flex-col flex-1">
        <div className="flex items-center mb-6 fade-in">
          <Button data-testid="back-to-dashboard-btn" variant="ghost" onClick={() => navigate('/dashboard')} className="rounded-full text-slate-400 hover:text-white hover:bg-white/10">
            <ArrowLeft className="mr-2 w-5 h-5" /> Back
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-6 slide-up">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(251,191,36,0.1))', border: '1px solid rgba(52,211,153,0.2)', boxShadow: '0 0 30px rgba(52,211,153,0.15)' }}>
              <Sparkles className="w-8 h-8" style={{ color: '#34D399' }} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center pulse-ring" style={{ background: '#34D399' }}>
              <Sparkles className="w-2.5 h-2.5" style={{ color: '#05050A' }} />
            </div>
          </div>
          <div>
            <h1 data-testid="tutor-title" className="text-3xl font-light tracking-tight" style={{ fontFamily: 'Outfit', color: '#F8FAFC' }}>
              NeuroBuddy AI Tutor
            </h1>
            <p className="text-sm" style={{ color: '#94A3B8' }}>Your personal adaptive learning companion</p>
          </div>
        </div>

        {/* Chat container */}
        <div data-testid="chat-container" className="flex-1 p-6 rounded-2xl mb-5 overflow-y-auto" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', minHeight: '400px', maxHeight: '500px' }}>
          {messages.length === 0 ? (
            <div className="text-center fade-in">
              <Sparkles className="w-14 h-14 mx-auto mb-4" style={{ color: '#34D399' }} />
              <p className="text-lg font-medium mb-1" style={{ color: '#F8FAFC' }}>Hi! I'm NeuroBuddy</p>
              <p className="text-sm mb-1" style={{ color: '#94A3B8' }}>Your AI learning companion ready to help!</p>
              <p className="text-xs mb-6" style={{ color: '#64748B' }}>I'll adapt my explanations to your learning style.</p>
              
              {showSuggestions && suggestedTopics.length > 0 && (
                <div className="mt-6 grid grid-cols-1 gap-2.5">
                  {suggestedTopics.map((topic, idx) => {
                    const colors = ['#34D399', '#FBBF24', '#38BDF8', '#A78BFA'];
                    const Icons = [Calculator, BookOpen, Globe, Sparkles];
                    const TopicIcon = Icons[idx] || Sparkles;
                    return (
                      <button key={idx} onClick={() => handleTopicClick(topic)} className="p-3.5 rounded-xl text-left flex items-center gap-3 transition-all hover:-translate-y-0.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
                        <TopicIcon className="w-4 h-4" style={{ color: colors[idx] }} />
                        <span className="text-sm" style={{ color: '#CBD5E1' }}>{topic}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div key={index} data-testid={`chat-message-${msg.role}-${index}`} className={`chat-bubble ${msg.role}`}>
                  {msg.role === 'assistant' ? (
                    <div>
                      <ReactMarkdown
                        components={{
                          strong: ({node, ...props}) => <strong style={{ color: '#34D399', fontWeight: 600 }} {...props} />,
                          em: ({node, ...props}) => <em style={{ fontStyle: 'italic', color: '#94A3B8' }} {...props} />,
                          p: ({node, ...props}) => <p style={{ marginBottom: '0.5rem' }} {...props} />,
                          ul: ({node, ...props}) => <ul style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }} {...props} />,
                          ol: ({node, ...props}) => <ol style={{ marginLeft: '1.5rem', marginBottom: '0.5rem' }} {...props} />,
                          li: ({node, ...props}) => <li style={{ marginBottom: '0.25rem' }} {...props} />,
                          h3: ({node, ...props}) => <h3 style={{ fontSize: '1.05rem', fontWeight: '600', marginTop: '0.75rem', marginBottom: '0.5rem', color: '#34D399' }} {...props} />
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                      <button data-testid={`read-msg-${index}`} onClick={() => handleReadAloud(msg.content)} className="mt-2 flex items-center gap-1 text-xs hover:opacity-80 transition-opacity" style={{ color: '#64748B' }} title="Read this message aloud">
                        <Volume2 className="w-3.5 h-3.5" /> Read
                      </button>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              ))}
              {loading && (
                <div data-testid="typing-indicator" className="chat-bubble assistant">
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

        {/* Quick Actions */}
        {messages.length > 0 && !loading && (
          <div className="mb-3 flex flex-wrap gap-2 scale-in">
            {[
              { action: 'simpler', label: 'Explain Simpler', icon: Smile, color: '#34D399' },
              { action: 'example', label: 'Give Example', icon: Lightbulb, color: '#FBBF24' },
              { action: 'visual', label: 'Show Visually', icon: Eye, color: '#38BDF8' },
              { action: 'practice', label: 'Practice Problem', icon: Dumbbell, color: '#A78BFA' },
              { action: 'confused', label: "I'm Confused", icon: HelpCircle, color: '#FB7185' },
            ].map(({ action, label, icon: Icon, color }) => (
              <button key={action} onClick={() => handleQuickAction(action)} className="px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all hover:-translate-y-0.5" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer' }}>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
                <span style={{ color: '#CBD5E1' }}>{label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Follow-up Suggestions */}
        {followUpSuggestions.length > 0 && !loading && (
          <div className="mb-3 flex flex-wrap gap-2 scale-in">
            <span className="text-xs font-medium self-center mr-1" style={{ color: '#64748B' }}>Ask next:</span>
            {followUpSuggestions.map((suggestion, idx) => (
              <button key={idx} onClick={() => handleFollowUpClick(suggestion)} className="px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all hover:-translate-y-0.5" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', cursor: 'pointer', color: '#94A3B8' }}>
                {suggestion}
                <ArrowRight className="w-3 h-3" style={{ color: '#34D399' }} />
              </button>
            ))}
          </div>
        )}

        {/* Chat input */}
        <div className="flex gap-3 scale-in">
          <Input
            data-testid="chat-input"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
            placeholder="Ask me anything..."
            disabled={loading}
            className="flex-1 rounded-xl border-white/10"
            style={{ minHeight: '52px', background: 'rgba(255,255,255,0.04)', color: '#F8FAFC', fontSize: '15px' }}
          />
          <Button
            data-testid="send-message-btn"
            onClick={() => handleSendMessage()}
            disabled={loading || !inputMessage.trim()}
            className="rounded-xl px-5 border-0"
            style={{ background: 'linear-gradient(135deg, #34D399, #059669)', color: '#05050A', minHeight: '52px', boxShadow: '0 0 20px rgba(52,211,153,0.2)' }}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>

        {/* Voice controls */}
        <div className="mt-3 flex gap-3 scale-in">
          <Button data-testid="voice-input-btn" variant="outline" className="rounded-xl flex-1 border-white/10 hover:bg-white/5" style={{ color: recording ? '#34D399' : '#94A3B8' }} onClick={handleVoiceInput} disabled={recording}>
            <Mic className={`w-4 h-4 mr-2 ${recording ? 'pulse-ring' : ''}`} />
            {recording ? 'Recording...' : 'Voice Input'}
          </Button>
          <Button data-testid="voice-output-btn" variant="outline" className="rounded-xl flex-1 border-white/10 hover:bg-white/5" style={{ color: isTtsActive ? '#FB7185' : '#94A3B8' }} onClick={() => { if (isTtsActive) handleStop(); else handleReadAloud(); }} disabled={!hasAssistantMsg}>
            {ttsState === TTS_STATE.LOADING ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Preparing...</>
            ) : isTtsActive ? (
              <><VolumeX className="w-4 h-4 mr-2" /> Stop</>
            ) : (
              <><Volume2 className="w-4 h-4 mr-2" /> Read Aloud</>
            )}
          </Button>
          <Button data-testid="tts-settings-btn" variant="outline" className="rounded-xl border-white/10 hover:bg-white/5" style={{ color: showTtsPanel ? '#34D399' : '#94A3B8', minWidth: '44px' }} onClick={() => setShowTtsPanel(p => !p)} title="Voice settings">
            <Settings2 className="w-4 h-4" />
            <ChevronDown className={`w-3 h-3 ml-1 transition-transform ${showTtsPanel ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* TTS Panel */}
        {showTtsPanel && (
          <div data-testid="tts-control-panel" className="mt-3 p-5 rounded-2xl scale-in" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
            {isTtsActive && (
              <div className="flex items-center gap-2 mb-4 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-xs font-medium mr-2" style={{ color: '#64748B' }}>Now playing</span>
                {ttsState === TTS_STATE.LOADING && <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#34D399' }} />}
                {ttsState === TTS_STATE.SPEAKING && (
                  <Button data-testid="tts-pause-btn" size="sm" variant="outline" className="rounded-lg h-7 px-2.5 border-amber-500/30 hover:bg-amber-500/10" onClick={handlePause} style={{ color: '#FBBF24' }}>
                    <Pause className="w-3.5 h-3.5 mr-1" /> Pause
                  </Button>
                )}
                {ttsState === TTS_STATE.PAUSED && (
                  <Button data-testid="tts-resume-btn" size="sm" variant="outline" className="rounded-lg h-7 px-2.5 border-emerald-500/30 hover:bg-emerald-500/10" onClick={handleResume} style={{ color: '#34D399' }}>
                    <Play className="w-3.5 h-3.5 mr-1" /> Resume
                  </Button>
                )}
                {(ttsState === TTS_STATE.SPEAKING || ttsState === TTS_STATE.PAUSED) && (
                  <Button data-testid="tts-stop-btn" size="sm" variant="outline" className="rounded-lg h-7 px-2.5 border-rose-500/30 hover:bg-rose-500/10" onClick={handleStop} style={{ color: '#FB7185' }}>
                    <Square className="w-3 h-3 mr-1" /> Stop
                  </Button>
                )}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748B' }}>Voice</label>
                <select data-testid="tts-voice-select" value={selectedVoiceURI} onChange={e => handleVoiceChange(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#F8FAFC', outline: 'none' }}>
                  {ttsVoices.length === 0 && <option value="">Loading voices...</option>}
                  {ttsVoices.map(v => (
                    <option key={v.voiceURI} value={v.voiceURI}>{v.name} {v.localService ? '' : '(online)'}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#64748B' }}>
                  Speed: <span style={{ color: '#34D399' }}>{speechRate.toFixed(1)}x</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: '#64748B' }}>0.5x</span>
                  <input data-testid="tts-speed-slider" type="range" min="0.5" max="2.0" step="0.1" value={speechRate} onChange={e => handleRateChange(e.target.value)} className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #34D399 ${((speechRate - 0.5) / 1.5) * 100}%, rgba(255,255,255,0.1) ${((speechRate - 0.5) / 1.5) * 100}%)`, accentColor: '#34D399' }} />
                  <span className="text-xs" style={{ color: '#64748B' }}>2.0x</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AITutor;
