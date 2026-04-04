// Voice transcription utility with Web Speech API and OpenAI Whisper fallback

export class VoiceTranscription {
  constructor() {
    this.isRecording = false;
    this.recognition = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.recordingTimeout = null;
  }

  // Check if Web Speech API is supported
  isWebSpeechSupported() {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  }

  // Check if MediaRecorder API is supported
  isMediaRecorderSupported() {
    return 'MediaRecorder' in window && navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
  }

  // Check microphone permissions
  async checkMicrophonePermission() {
    try {
      if (!navigator.permissions) {
        // Permissions API not supported, try to request directly
        return { state: 'prompt' };
      }

      const permission = await navigator.permissions.query({ name: 'microphone' });
      return permission;
    } catch (error) {
      console.warn('Permission check not supported:', error);
      return { state: 'prompt' };
    }
  }

  // Request microphone access
  async requestMicrophoneAccess() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the stream immediately, we just needed to trigger permission
      stream.getTracks().forEach(track => track.stop());
      return { success: true, message: 'Microphone access granted' };
    } catch (error) {
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        return { success: false, message: 'Microphone access denied. Please enable microphone permissions in your browser settings.' };
      } else if (error.name === 'NotFoundError') {
        return { success: false, message: 'No microphone found. Please connect a microphone and try again.' };
      } else {
        return { success: false, message: `Microphone error: ${error.message}` };
      }
    }
  }

  // Transcribe using Web Speech API (Primary method - faster, no backend)
  async transcribeWithWebSpeech(onResult, onError, maxDuration = 10000) {
    return new Promise((resolve, reject) => {
      if (!this.isWebSpeechSupported()) {
        reject(new Error('Web Speech API not supported in this browser'));
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();

      // Configuration
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;

      let finalTranscript = '';
      let hasResult = false;

      // Handle results
      this.recognition.onresult = (event) => {
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
            hasResult = true;
          } else {
            interimTranscript += transcript;
          }
        }

        // Call callback with interim results
        if (onResult) {
          onResult(finalTranscript || interimTranscript, !finalTranscript);
        }
      };

      // Handle end
      this.recognition.onend = () => {
        this.isRecording = false;
        if (hasResult) {
          resolve(finalTranscript.trim());
        } else {
          reject(new Error('No speech detected. Please try speaking clearly.'));
        }
      };

      // Handle errors
      this.recognition.onerror = (event) => {
        this.isRecording = false;
        let errorMessage = 'Speech recognition error';

        switch (event.error) {
          case 'no-speech':
            errorMessage = 'No speech detected. Please try again.';
            break;
          case 'audio-capture':
            errorMessage = 'Microphone not available. Please check your device.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone permission denied. Please enable it in browser settings.';
            break;
          case 'network':
            errorMessage = 'Network error. Please check your internet connection.';
            break;
          case 'aborted':
            errorMessage = 'Speech recognition aborted.';
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }

        if (onError) {
          onError(errorMessage);
        }
        reject(new Error(errorMessage));
      };

      // Start recognition
      try {
        this.recognition.start();
        this.isRecording = true;

        // Auto-stop after max duration
        this.recordingTimeout = setTimeout(() => {
          if (this.isRecording) {
            this.stopTranscription();
          }
        }, maxDuration);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Transcribe using OpenAI Whisper (Fallback method - more accurate)
  async transcribeWithWhisper(apiUrl, token, maxDuration = 5000) {
    return new Promise(async (resolve, reject) => {
      if (!this.isMediaRecorderSupported()) {
        reject(new Error('Audio recording not supported in this browser'));
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.mediaRecorder = new MediaRecorder(stream, {
          mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
        });
        this.audioChunks = [];

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        };

        this.mediaRecorder.onstop = async () => {
          this.isRecording = false;
          stream.getTracks().forEach(track => track.stop());

          if (this.audioChunks.length === 0) {
            reject(new Error('No audio recorded'));
            return;
          }

          const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
          
          // Check file size (max 25MB for Whisper)
          if (audioBlob.size > 25 * 1024 * 1024) {
            reject(new Error('Audio file too large. Please record a shorter message.'));
            return;
          }

          // Send to backend
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          try {
            const response = await fetch(`${apiUrl}/voice/transcribe`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`
              },
              body: formData
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.detail || 'Transcription failed');
            }

            const data = await response.json();
            resolve(data.text);
          } catch (error) {
            reject(new Error(`Backend transcription error: ${error.message}`));
          }
        };

        this.mediaRecorder.onerror = (error) => {
          this.isRecording = false;
          stream.getTracks().forEach(track => track.stop());
          reject(new Error(`Recording error: ${error}`));
        };

        this.mediaRecorder.start();
        this.isRecording = true;

        // Auto-stop after max duration
        this.recordingTimeout = setTimeout(() => {
          if (this.isRecording && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
          }
        }, maxDuration);

      } catch (error) {
        reject(error);
      }
    });
  }

  // Stop transcription
  stopTranscription() {
    this.isRecording = false;

    if (this.recordingTimeout) {
      clearTimeout(this.recordingTimeout);
      this.recordingTimeout = null;
    }

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // Already stopped
      }
      this.recognition = null;
    }

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {
        // Already stopped
      }
    }
  }

  // Get browser compatibility info
  getBrowserSupport() {
    return {
      webSpeech: this.isWebSpeechSupported(),
      mediaRecorder: this.isMediaRecorderSupported(),
      microphone: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    };
  }
}

export default VoiceTranscription;
