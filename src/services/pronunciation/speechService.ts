import {
  AppSettings,
  NVIDIA_TTS,
  PronunciationAccent,
  SpeechProvider,
} from "../../types/settings";
import { invokeNative, isTauriRuntime } from "../desktop/tauriInvoke";

class SpeechService {
  private voices: SpeechSynthesisVoice[] = [];
  private voicesLoaded = false;
  private provider: SpeechProvider = "nvidia-magpie";
  private voice = NVIDIA_TTS.DEFAULT_VOICE;
  private rate = 0.92;
  private activeAudio: HTMLAudioElement | null = null;
  private activeObjectUrl: string | null = null;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.initVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  public configure(
    settings: Pick<AppSettings, "speechProvider" | "speechVoice" | "speechRate">
  ) {
    this.provider = settings.speechProvider || "nvidia-magpie";
    this.voice = settings.speechVoice || NVIDIA_TTS.DEFAULT_VOICE;
    this.rate = Number.isFinite(settings.speechRate) ? settings.speechRate : 0.92;
  }

  private initVoices() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    this.voices = window.speechSynthesis.getVoices();
    if (this.voices.length > 0) this.voicesLoaded = true;
  }

  public cancel() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio.src = "";
      this.activeAudio = null;
    }
    if (this.activeObjectUrl) {
      URL.revokeObjectURL(this.activeObjectUrl);
      this.activeObjectUrl = null;
    }
  }

  public async speak(text: string, accent: PronunciationAccent = "US") {
    const cleanText = String(text || "").trim();
    if (!cleanText) return;

    this.cancel();

    // NVIDIA Magpie hosted TTS currently exposes en-US voices. Keep UK mode
    // accurate by using the OS/browser English-UK voice instead of pretending
    // that an en-US Magpie voice is British.
    if (this.provider === "nvidia-magpie" && isTauriRuntime() && accent === "US") {
      try {
        const audioBase64 = await invokeNative<string>("synthesize_nvidia_tts", {
          text: cleanText.slice(0, 2000),
          language: "en-US",
          voice: this.voice,
          sampleRateHz: 44100,
        });
        await this.playBase64Wav(audioBase64);
        return;
      } catch (error) {
        console.warn("NVIDIA Magpie TTS failed; falling back to system voice:", error);
      }
    }

    this.speakSystem(cleanText, accent);
  }

  private async playBase64Wav(base64: string) {
    if (typeof window === "undefined") return;
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const blob = new Blob([bytes], { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    this.activeObjectUrl = url;

    const audio = new Audio(url);
    this.activeAudio = audio;
    audio.playbackRate = Math.min(1.2, Math.max(0.75, this.rate));

    const cleanup = () => {
      if (this.activeAudio === audio) this.activeAudio = null;
      if (this.activeObjectUrl === url) {
        URL.revokeObjectURL(url);
        this.activeObjectUrl = null;
      }
    };
    audio.addEventListener("ended", cleanup, { once: true });
    audio.addEventListener("error", cleanup, { once: true });
    await audio.play();
  }

  private speakSystem(text: string, accent: PronunciationAccent) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      console.warn("Speech synthesis is not supported on this device.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const targetLang = accent === "US" ? "en-US" : "en-GB";
    utterance.lang = targetLang;
    utterance.rate = Math.min(1.2, Math.max(0.75, this.rate));
    utterance.pitch = 1.0;

    if (!this.voicesLoaded) this.initVoices();

    const matchedVoice =
      this.voices.find((v) => {
        if (accent === "US") {
          return (
            v.lang.startsWith("en-US") ||
            v.name.includes("US") ||
            v.name.includes("United States")
          );
        }
        return (
          v.lang.startsWith("en-GB") ||
          v.name.includes("UK") ||
          v.name.includes("British")
        );
      }) || this.voices.find((v) => v.lang.startsWith("en"));

    if (matchedVoice) utterance.voice = matchedVoice;
    window.speechSynthesis.speak(utterance);
  }
}

export const speechService = new SpeechService();
