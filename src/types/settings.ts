export type AppTheme = "auto" | "light" | "dark";
export type PronunciationAccent = "US" | "UK";
export type SpeechProvider = "nvidia-magpie" | "system";
export type TranslationProviderPreference = "auto" | "gemini" | "nvidia";

export const NVIDIA_MODELS = {
  FAST: "deepseek-ai/deepseek-v4-flash-0731",
  QUALITY: "deepseek-ai/deepseek-v4-pro-0813",
} as const;

export const NVIDIA_TTS = {
  MODEL: "nvidia/magpie-tts-multilingual",
  FUNCTION_ID: "877104f7-e885-42b9-8de8-f6e4c6303969",
  DEFAULT_VOICE: "Magpie-Multilingual.EN-US.Aria",
  VOICES: [
    "Magpie-Multilingual.EN-US.Aria",
    "Magpie-Multilingual.EN-US.Jason",
  ],
} as const;

export interface AppSettings {
  defaultModel: string;
  pronunciationAccent: PronunciationAccent;
  speechProvider: SpeechProvider;
  speechVoice: string;
  speechRate: number;
  globalShortcut: string;
  alwaysOnTop: boolean;
  startWithWindows: boolean;
  launchMinimized: boolean;
  liquidGlassEnabled: boolean;
  glassIntensity: number;
  blurAmount: number;
  transparency: number;
  animationIntensity: number;
  theme: AppTheme;
  dailyNewWordTarget: number;
  dailyReviewTarget: number;
  useDemoDataWhenNoKey: boolean;
  translationProvider: TranslationProviderPreference;
  translationOfflineOnly: boolean;
  translationAnalysisEnabled: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultModel: NVIDIA_MODELS.FAST,
  pronunciationAccent: "US",
  speechProvider: "nvidia-magpie",
  speechVoice: NVIDIA_TTS.DEFAULT_VOICE,
  speechRate: 0.92,
  globalShortcut: "Ctrl + Shift + D",
  alwaysOnTop: true,
  startWithWindows: false,
  launchMinimized: false,
  liquidGlassEnabled: true,
  glassIntensity: 46,
  blurAmount: 14,
  transparency: 72,
  animationIntensity: 70,
  theme: "dark",
  dailyNewWordTarget: 5,
  dailyReviewTarget: 25,
  useDemoDataWhenNoKey: true,
  translationProvider: "auto",
  translationOfflineOnly: false,
  translationAnalysisEnabled: true,
};
