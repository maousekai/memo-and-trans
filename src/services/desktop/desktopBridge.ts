import { DesktopBridge, WindowMode, WindowPosition } from "../../types/desktop";

const POS_KEY = "lexiglass_window_position";

export class BrowserDesktopBridge implements DesktopBridge {
  public isTauri = false;
  private currentMode: WindowMode = "lookup";
  private isAlwaysOnTop = true;
  private position: WindowPosition = { x: 100, y: 100 };
  private shortcutCallbacks: Map<string, () => void> = new Map();
  private simulatedClipboardText: string = "mitigate";

  constructor() {
    this.initKeyboardListener();
    this.loadSavedPosition().then(pos => {
      if (pos) this.position = pos;
    });
  }

  private initKeyboardListener() {
    if (typeof window === "undefined") return;

    window.addEventListener("keydown", (e) => {
      // Global shortcut mock: Ctrl + Shift + D
      if (e.ctrlKey && e.shiftKey && (e.key === "D" || e.key === "d")) {
        e.preventDefault();
        const cb = this.shortcutCallbacks.get("Ctrl + Shift + D");
        if (cb) cb();
      }
    });
  }

  async getWindowMode(): Promise<WindowMode> {
    return this.currentMode;
  }

  async setWindowMode(mode: WindowMode): Promise<void> {
    this.currentMode = mode;
  }

  async setAlwaysOnTop(alwaysOnTop: boolean): Promise<void> {
    this.isAlwaysOnTop = alwaysOnTop;
  }

  async setPosition(pos: WindowPosition): Promise<void> {
    this.position = pos;
    await this.savePosition(pos);
  }

  async getPosition(): Promise<WindowPosition> {
    return this.position;
  }

  async captureSelectedText(): Promise<string | null> {
    if (typeof window === "undefined") return null;

    // 1. Check browser active text selection
    const selection = window.getSelection()?.toString().trim();
    if (selection) {
      return selection;
    }

    // 2. Check navigator.clipboard if permitted
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text && text.trim().length > 0 && text.trim().length < 60) {
          return text.trim();
        }
      }
    } catch {
      // Clipboard permission denied or unavailable in iframe
    }

    // 3. Fallback to simulated clipboard text
    return this.simulatedClipboardText;
  }

  public setSimulatedClipboardText(text: string) {
    this.simulatedClipboardText = text;
  }

  async registerGlobalShortcut(shortcut: string, callback: () => void): Promise<boolean> {
    this.shortcutCallbacks.set(shortcut, callback);
    return true;
  }

  async unregisterGlobalShortcut(shortcut: string): Promise<void> {
    this.shortcutCallbacks.delete(shortcut);
  }

  async minimizeToBubble(): Promise<void> {
    this.currentMode = "bubble";
  }

  async closeWindow(): Promise<void> {
    this.currentMode = "bubble";
  }

  async savePosition(pos: WindowPosition): Promise<void> {
    try {
      localStorage.setItem(POS_KEY, JSON.stringify(pos));
    } catch {
      // Ignore
    }
  }

  async loadSavedPosition(): Promise<WindowPosition | null> {
    try {
      const raw = localStorage.getItem(POS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // Ignore
    }
    return null;
  }
}

export class TauriDesktopBridge implements DesktopBridge {
  public isTauri = true;
  private fallback: BrowserDesktopBridge;

  constructor() {
    this.fallback = new BrowserDesktopBridge();
  }

  async getWindowMode(): Promise<WindowMode> {
    return this.fallback.getWindowMode();
  }

  async setWindowMode(mode: WindowMode): Promise<void> {
    try {
      // Native Tauri window resizing
      // @ts-ignore
      if (window.__TAURI__?.window) {
        // @ts-ignore
        const appWindow = window.__TAURI__.window.getCurrentWindow();
        if (mode === "bubble") {
          await appWindow.setSize({ width: 56, height: 56 });
        } else if (mode === "lookup") {
          await appWindow.setSize({ width: 440, height: 580 });
        } else if (mode === "study") {
          await appWindow.setSize({ width: 920, height: 660 });
        }
      }
    } catch (e) {
      console.warn("Tauri window resize fallback:", e);
    }
    await this.fallback.setWindowMode(mode);
  }

  async setAlwaysOnTop(alwaysOnTop: boolean): Promise<void> {
    try {
      // @ts-ignore
      if (window.__TAURI__?.window) {
        // @ts-ignore
        const appWindow = window.__TAURI__.window.getCurrentWindow();
        await appWindow.setAlwaysOnTop(alwaysOnTop);
      }
    } catch {
      // fallback
    }
    await this.fallback.setAlwaysOnTop(alwaysOnTop);
  }

  async setPosition(pos: WindowPosition): Promise<void> {
    try {
      // @ts-ignore
      if (window.__TAURI__?.window) {
        // @ts-ignore
        const appWindow = window.__TAURI__.window.getCurrentWindow();
        await appWindow.setPosition(pos);
      }
    } catch {
      // fallback
    }
    await this.fallback.setPosition(pos);
  }

  async getPosition(): Promise<WindowPosition> {
    return this.fallback.getPosition();
  }

  async captureSelectedText(): Promise<string | null> {
    try {
      // In Tauri, can invoke native clipboard or key simulation (Ctrl+C)
      // @ts-ignore
      if (window.__TAURI__?.clipboard) {
        // @ts-ignore
        return await window.__TAURI__.clipboard.readText();
      }
    } catch {
      // fallback
    }
    return this.fallback.captureSelectedText();
  }

  async registerGlobalShortcut(shortcut: string, callback: () => void): Promise<boolean> {
    try {
      // @ts-ignore
      if (window.__TAURI__?.globalShortcut) {
        // @ts-ignore
        await window.__TAURI__.globalShortcut.register(shortcut, callback);
        return true;
      }
    } catch {
      // fallback
    }
    return this.fallback.registerGlobalShortcut(shortcut, callback);
  }

  async unregisterGlobalShortcut(shortcut: string): Promise<void> {
    try {
      // @ts-ignore
      if (window.__TAURI__?.globalShortcut) {
        // @ts-ignore
        await window.__TAURI__.globalShortcut.unregister(shortcut);
      }
    } catch {
      // fallback
    }
    await this.fallback.unregisterGlobalShortcut(shortcut);
  }

  async minimizeToBubble(): Promise<void> {
    await this.setWindowMode("bubble");
  }

  async closeWindow(): Promise<void> {
    await this.setWindowMode("bubble");
  }

  async savePosition(pos: WindowPosition): Promise<void> {
    return this.fallback.savePosition(pos);
  }

  async loadSavedPosition(): Promise<WindowPosition | null> {
    return this.fallback.loadSavedPosition();
  }
}

// Singleton factory
function createDesktopBridge(): DesktopBridge {
  if (
    typeof window !== "undefined" &&
    (Boolean((window as any).__TAURI_INTERNALS__) || Boolean((window as any).__TAURI__))
  ) {
    return new TauriDesktopBridge();
  }
  return new BrowserDesktopBridge();
}

export const desktopBridge = createDesktopBridge();
