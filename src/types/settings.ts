export type AppTheme = "auto" | "light" | "dark";
export type PronunciationAccent = "US" | "UK";

export const NVIDIA_MODELS = {
  FAST: "deepseek-ai/deepseek-v4-flash-0731",
  QUALITY: "deepseek-ai/deepseek-v4-pro-0813",
} as const;

export interface AppSettings {
  defaultModel: string;
  pronunciationAccent: PronunciationAccent;
  globalShortcut: string;
  alwaysOnTop: boolean;
  startWithWindows: boolean;
  launchMinimized: boolean;
  glassIntensity: number; // 0 to 100
  blurAmount: number; // 0 to 40 px
  transparency: number; // 0 to 100
  animationIntensity: number; // 0 to 100
  theme: AppTheme;
  dailyNewWordTarget: number;
  dailyReviewTarget: number;
  useDemoDataWhenNoKey: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultModel: NVIDIA_MODELS.FAST,
  pronunciationAccent: "US",
  globalShortcut: "Ctrl + Shift + D",
  alwaysOnTop: true,
  startWithWindows: false,
  launchMinimized: false,
  glassIntensity: 75,
  blurAmount: 22,
  transparency: 72,
  animationIntensity: 80,
  theme: "dark",
  dailyNewWordTarget: 10,
  dailyReviewTarget: 25,
  useDemoDataWhenNoKey: true,
};
