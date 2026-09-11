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
  glassIntensity: number;
  blurAmount: number;
  transparency: number;
  animationIntensity: number;
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
  // Neutral misted glass by default: visible desktop shapes, readable foreground.
  glassIntensity: 55,
  blurAmount: 26,
  transparency: 80,
  animationIntensity: 70,
  theme: "dark",
  // A small daily new-word budget works better with spaced retrieval than
  // introducing 10+ words at once.
  dailyNewWordTarget: 5,
  dailyReviewTarget: 25,
  useDemoDataWhenNoKey: true,
};
