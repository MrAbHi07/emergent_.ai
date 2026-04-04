// Text-to-Speech utility using Web Speech API (speechSynthesis)

class TextToSpeech {
  constructor() {
    this.synth = window.speechSynthesis || null;
    this.voices = [];
    this.isSpeaking = false;
    this.onStateChange = null;
    this._voicesLoaded = false;
  }

  isSupported() {
    return !!this.synth;
  }

  // Load voices — returns a promise that resolves once voices are available
  loadVoices() {
    return new Promise((resolve) => {
      if (!this.isSupported()) {
        resolve([]);
        return;
      }

      const voices = this.synth.getVoices();
      if (voices.length > 0) {
        this.voices = voices;
        this._voicesLoaded = true;
        resolve(voices);
        return;
      }

      // Voices load asynchronously in most browsers
      this.synth.onvoiceschanged = () => {
        this.voices = this.synth.getVoices();
        this._voicesLoaded = true;
        resolve(this.voices);
      };

      // Timeout fallback if onvoiceschanged never fires
      setTimeout(() => {
        if (!this._voicesLoaded) {
          this.voices = this.synth.getVoices();
          this._voicesLoaded = true;
          resolve(this.voices);
        }
      }, 1000);
    });
  }

  // Pick the best English voice available
  _pickVoice() {
    if (this.voices.length === 0) return null;

    // Prefer natural / enhanced voices
    const preferred = this.voices.find(
      (v) => v.lang.startsWith('en') && /natural|enhanced|premium/i.test(v.name)
    );
    if (preferred) return preferred;

    // Fallback to any English voice
    const english = this.voices.find((v) => v.lang.startsWith('en'));
    if (english) return english;

    // Last resort — first available voice
    return this.voices[0];
  }

  // Strip markdown formatting so it reads naturally
  _cleanText(text) {
    if (!text) return '';
    return text
      .replace(/#{1,6}\s?/g, '')        // headings
      .replace(/\*{1,3}(.*?)\*{1,3}/g, '$1') // bold/italic
      .replace(/`{1,3}[^`]*`{1,3}/g, '') // inline/block code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
      .replace(/[>\-*+]\s/g, '')          // list markers, blockquotes
      .replace(/\n{2,}/g, '. ')           // paragraph breaks → pause
      .replace(/\n/g, ' ')
      .trim();
  }

  // Stop any ongoing speech
  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.isSpeaking = false;
    if (this.onStateChange) this.onStateChange(false);
  }

  // Speak the given text
  async speak(rawText) {
    if (!this.isSupported()) {
      throw new Error('Text-to-Speech is not supported in this browser.');
    }

    const text = this._cleanText(rawText);

    if (!text || text.length === 0) {
      throw new Error('Nothing to read aloud.');
    }

    // Always stop previous speech first
    this.stop();

    // Ensure voices are loaded
    if (!this._voicesLoaded) {
      await this.loadVoices();
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);

      const voice = this._pickVoice();
      if (voice) utterance.voice = voice;

      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => {
        this.isSpeaking = true;
        if (this.onStateChange) this.onStateChange(true);
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        if (this.onStateChange) this.onStateChange(false);
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        if (this.onStateChange) this.onStateChange(false);

        // 'canceled' is not a real error — happens when stop() is called
        if (event.error === 'canceled') {
          resolve();
          return;
        }
        reject(new Error(`Speech failed: ${event.error || 'unknown error'}`));
      };

      this.synth.speak(utterance);

      // Chrome bug: long text pauses mid-speech. Nudge it every 10s.
      const keepAlive = setInterval(() => {
        if (!this.synth.speaking) {
          clearInterval(keepAlive);
          return;
        }
        this.synth.pause();
        this.synth.resume();
      }, 10000);

      utterance.onend = () => {
        clearInterval(keepAlive);
        this.isSpeaking = false;
        if (this.onStateChange) this.onStateChange(false);
        resolve();
      };

      utterance.onerror = (event) => {
        clearInterval(keepAlive);
        this.isSpeaking = false;
        if (this.onStateChange) this.onStateChange(false);
        if (event.error === 'canceled') {
          resolve();
          return;
        }
        reject(new Error(`Speech failed: ${event.error || 'unknown error'}`));
      };
    });
  }
}

// Singleton so the same instance is reused (prevents overlapping speech)
const tts = new TextToSpeech();
export default tts;
