// Text-to-Speech utility using Web Speech API (speechSynthesis)

// Possible TTS states
export const TTS_STATE = {
  IDLE: 'idle',
  LOADING: 'loading',   // between speak() call and onstart
  SPEAKING: 'speaking',
  PAUSED: 'paused',
};

class TextToSpeech {
  constructor() {
    this.synth = window.speechSynthesis || null;
    this.voices = [];
    this.state = TTS_STATE.IDLE;
    this.onStateChange = null;       // (state) => void
    this._voicesLoaded = false;
    this._selectedVoiceURI = null;   // user-chosen voice URI
    this._rate = 1.0;                // speech rate
    this._keepAlive = null;
  }

  isSupported() {
    return !!this.synth;
  }

  _setState(s) {
    this.state = s;
    if (this.onStateChange) this.onStateChange(s);
  }

  // --- Voice management ---

  loadVoices() {
    return new Promise((resolve) => {
      if (!this.isSupported()) { resolve([]); return; }

      const grab = () => {
        this.voices = this.synth.getVoices();
        this._voicesLoaded = true;
        resolve(this.voices);
      };

      const v = this.synth.getVoices();
      if (v.length > 0) { this.voices = v; this._voicesLoaded = true; resolve(v); return; }

      this.synth.onvoiceschanged = grab;
      setTimeout(() => { if (!this._voicesLoaded) grab(); }, 1500);
    });
  }

  getEnglishVoices() {
    return this.voices.filter(v => v.lang.startsWith('en'));
  }

  setVoice(voiceURI) {
    this._selectedVoiceURI = voiceURI;
  }

  setRate(rate) {
    this._rate = Math.max(0.5, Math.min(2.0, rate));
  }

  _pickVoice() {
    if (this._selectedVoiceURI) {
      const match = this.voices.find(v => v.voiceURI === this._selectedVoiceURI);
      if (match) return match;
    }
    const preferred = this.voices.find(v => v.lang.startsWith('en') && /natural|enhanced|premium/i.test(v.name));
    if (preferred) return preferred;
    const english = this.voices.find(v => v.lang.startsWith('en'));
    if (english) return english;
    return this.voices[0] || null;
  }

  // --- Text cleaning ---

  _cleanText(text) {
    if (!text) return '';
    return text
      .replace(/#{1,6}\s?/g, '')
      .replace(/\*{1,3}(.*?)\*{1,3}/g, '$1')
      .replace(/`{1,3}[^`]*`{1,3}/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[>\-*+]\s/g, '')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .trim();
  }

  // --- Playback controls ---

  stop() {
    if (this._keepAlive) { clearInterval(this._keepAlive); this._keepAlive = null; }
    if (this.synth) this.synth.cancel();
    this._setState(TTS_STATE.IDLE);
  }

  pause() {
    if (this.synth && this.state === TTS_STATE.SPEAKING) {
      this.synth.pause();
      this._setState(TTS_STATE.PAUSED);
    }
  }

  resume() {
    if (this.synth && this.state === TTS_STATE.PAUSED) {
      this.synth.resume();
      this._setState(TTS_STATE.SPEAKING);
    }
  }

  async speak(rawText) {
    if (!this.isSupported()) {
      throw new Error('Text-to-Speech is not supported in this browser.');
    }

    const text = this._cleanText(rawText);
    if (!text) throw new Error('Nothing to read aloud.');

    this.stop();

    if (!this._voicesLoaded) await this.loadVoices();

    // Enter loading state — user sees spinner until audio actually starts
    this._setState(TTS_STATE.LOADING);

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);

      const voice = this._pickVoice();
      if (voice) utterance.voice = voice;

      utterance.rate = this._rate;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const cleanup = () => {
        if (this._keepAlive) { clearInterval(this._keepAlive); this._keepAlive = null; }
        this._setState(TTS_STATE.IDLE);
      };

      utterance.onstart = () => {
        this._setState(TTS_STATE.SPEAKING);
      };

      utterance.onend = () => { cleanup(); resolve(); };

      utterance.onerror = (event) => {
        cleanup();
        if (event.error === 'canceled' || event.error === 'interrupted') { resolve(); return; }
        const friendly = {
          'synthesis-failed': 'Could not play audio. Please check your speakers or try a different browser.',
          'language-unavailable': 'No voice available for this language.',
          'voice-unavailable': 'Selected voice is unavailable. Try a different one.',
          'audio-busy': 'Audio device is busy. Try again in a moment.',
          'network': 'Network error during speech synthesis.',
          'not-allowed': 'Speech was blocked. Allow audio in your browser settings.'
        };
        reject(new Error(friendly[event.error] || `Speech failed: ${event.error || 'unknown'}`));
      };

      this.synth.speak(utterance);

      // Chrome long-text workaround
      this._keepAlive = setInterval(() => {
        if (!this.synth.speaking) { clearInterval(this._keepAlive); this._keepAlive = null; return; }
        this.synth.pause();
        this.synth.resume();
      }, 10000);
    });
  }
}

const tts = new TextToSpeech();
export default tts;
