import { PronunciationAccent } from "../../types/settings";

class SpeechService {
  private voices: SpeechSynthesisVoice[] = [];
  private voicesLoaded = false;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.initVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    this.voices = window.speechSynthesis.getVoices();
    if (this.voices.length > 0) {
      this.voicesLoaded = true;
    }
  }

  public speak(text: string, accent: PronunciationAccent = "US") {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      console.warn("Speech synthesis is not supported on this browser.");
      return;
    }

    // Stop current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const targetLang = accent === "US" ? "en-US" : "en-GB";
    utterance.lang = targetLang;
    utterance.rate = 0.9; // Slightly slower for clear pronunciation learning
    utterance.pitch = 1.0;

    if (!this.voicesLoaded) {
      this.initVoices();
    }

    // Find best matching voice
    const matchedVoice = this.voices.find(v => {
      if (accent === "US") {
        return v.lang.startsWith("en-US") || v.name.includes("US") || v.name.includes("United States");
      } else {
        return v.lang.startsWith("en-GB") || v.name.includes("UK") || v.name.includes("British");
      }
    }) || this.voices.find(v => v.lang.startsWith("en"));

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    window.speechSynthesis.speak(utterance);
  }
}

export const speechService = new SpeechService();
