export type WindowMode = "bubble" | "lookup" | "study";

export interface WindowPosition {
  x: number;
  y: number;
}

export interface DesktopBridge {
  isTauri: boolean;
  getWindowMode: () => Promise<WindowMode>;
  setWindowMode: (mode: WindowMode) => Promise<void>;
  setAlwaysOnTop: (alwaysOnTop: boolean) => Promise<void>;
  setPosition: (pos: WindowPosition) => Promise<void>;
  getPosition: () => Promise<WindowPosition>;
  startDragging: () => Promise<void>;
  captureSelectedText: () => Promise<string | null>;
  registerGlobalShortcut: (shortcut: string, callback: () => void) => Promise<boolean>;
  unregisterGlobalShortcut: (shortcut: string) => Promise<void>;
  minimizeToBubble: () => Promise<void>;
  closeWindow: () => Promise<void>;
  savePosition: (pos: WindowPosition) => Promise<void>;
  loadSavedPosition: () => Promise<WindowPosition | null>;
}
