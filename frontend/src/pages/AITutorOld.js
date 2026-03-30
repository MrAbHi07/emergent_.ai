import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Send, Mic, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { API, getAuthToken } from '../App';
import { toast } from 'sonner';

const AITutor = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [sessionId] = useState(`session_${Date.now()}`);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = { role: 'user', content: inputMessage };
    setMessages([...messages, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await axios.post(
        `${API}/chat/send`,
        { session_id: sessionId, message: inputMessage },
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );

      const aiMessage = { role: 'assistant', content: response.data.response };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      toast.error('Failed to get response from tutor');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceInput = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Voice input not supported in your browser');
        return;
      }

      setRecording(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        try {
          const response = await axios.post(
            `${API}/voice/transcribe`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${getAuthToken()}`,
                'Content-Type': 'multipart/form-data'
              }
            }
          );
          setInputMessage(response.data.text);
          toast.success('Voice transcribed!');
        } catch (error) {
          toast.error('Failed to transcribe voice');
        }

        stream.getTracks().forEach(track => track.stop());
        setRecording(false);
      };

      mediaRecorder.start();
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 5000);

      toast.info('Recording... (5 seconds)');
    } catch (error) {
      toast.error('Failed to access microphone');
      setRecording(false);
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
      <div className="max-w-4xl mx-auto w-full px-8 py-12 flex flex-col flex-1">
        <div className="flex items-center mb-8">
          <Button data-testid="back-to-dashboard-btn" variant="ghost" onClick={() => navigate('/dashboard')} className="rounded-full">
            <ArrowLeft className="mr-2 w-5 h-5" /> Back
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <img
            src="https://images.unsplash.com/photo-1659018966820-de07c94e0d01?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzV8MHwxfHNlYXJjaHwyfHxjdXRlJTIwM2QlMjByb2JvdCUyMGNoYXJhY3RlcnxlbnwwfHx8fDE3NzQ4NTAzNzV8MA&ixlib=rb-4.1.0&q=85"
            alt="AI Tutor"
            className="w-20 h-20 rounded-full"
          />
          <div>
            <h1 data-testid="tutor-title" className="text-4xl font-bold" style={{ fontFamily: 'Nunito', color: '#1A1C19' }}>
              AI Tutor
            </h1>
            <p style={{ color: '#4A4D48' }}>Your personal learning companion</p>
          </div>
        </div>

        <div data-testid="chat-container" className="flex-1 p-8 rounded-3xl mb-6 overflow-y-auto" style={{ backgroundColor: '#F3F5F2', minHeight: '400px', maxHeight: '500px' }}>
          {messages.length === 0 ? (
            <div className="text-center" style={{ color: '#757873' }}>
              <p>Hi! I'm NeuroBuddy, your AI learning companion.</p>
              <p className="mt-2">Ask me anything about your lessons or subjects you're studying!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  data-testid={`chat-message-${msg.role}-${index}`}
                  className={`chat-bubble ${msg.role}`}
                  style={{
                    backgroundColor: msg.role === 'user' ? '#8ABF9B' : '#FDFBF7',
                    marginLeft: msg.role === 'user' ? 'auto' : '0',
                    color: '#1A1C19'
                  }}
                >
                  {msg.content}
                </div>
              ))}
              {loading && (
                <div data-testid="typing-indicator" className="chat-bubble assistant" style={{ backgroundColor: '#FDFBF7' }}>
                  <span className="pulse-ring">Thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <Input
            data-testid="chat-input"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !loading && handleSendMessage()}
            placeholder="Ask me anything..."
            disabled={loading}
            className="flex-1 rounded-2xl"
            style={{ minHeight: '56px', backgroundColor: '#F3F5F2' }}
          />
          <Button
            data-testid="send-message-btn"
            onClick={handleSendMessage}
            disabled={loading || !inputMessage.trim()}
            className="rounded-2xl px-6"
            style={{ backgroundColor: '#8ABF9B', color: '#1A1C19', minHeight: '56px' }}
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>

        <div className="mt-4 flex gap-4">
          <Button 
            data-testid="voice-input-btn" 
            variant="outline" 
            className="rounded-2xl" 
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
            className="rounded-2xl" 
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