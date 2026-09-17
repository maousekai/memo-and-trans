import { BackgroundSample, DesktopBridge, WindowMode, WindowPosition } from "../../types/desktop";
import { invokeNative, isTauriRuntime } from "./tauriInvoke";

const POS_KEY = "lexiglass_window_position";
const NATIVE_LOOKUP_EVENT = "lexiglass-global-lookup";

export class BrowserDesktopBridge implements DesktopBridge {
  public isTauri = false;
  private currentMode: WindowMode = "lookup";
  private isAlwaysOnTop = true;
  private position: WindowPosition = { x: 100, y: 100 };
  private shortcutCallbacks: Map<string, (selectedText?: string) => void> = new Map();
  private simulatedClipboardText = "mitigate";

  constructor() {
    this.initKeyboardListener();
    this.loadSavedPosition().then((pos) => {
      if (pos) this.position = pos;
    });
  }

  private initKeyboardListener() {
    if (typeof window === "undefined") return;
    window.addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "D" || e.key === "d")) {
        e.preventDefault();
        this.shortcutCallbacks.get("Ctrl + Shift + D")?.();
      }
    });
  }

  async getWindowMode() { return this.currentMode; }
  async setWindowMode(mode: WindowMode) { this.currentMode = mode; }
  async setAlwaysOnTop(alwaysOnTop: boolean) { this.isAlwaysOnTop = alwaysOnTop; }
  async setPosition(pos: WindowPosition) { this.position = pos; await this.savePosition(pos); }
  async getPosition() { return this.position; }
  async startDragging() { /* Browser preview cannot drag the OS window. */ }

  async captureSelectedText(): Promise<string | null> {
    if (typeof window === "undefined") return null;
    const selection = window.getSelection()?.toString().trim();
    if (selection) return selection;
    try {
      const text = await navigator.clipboard?.readText?.();
      if (text && text.trim().length > 0 && text.trim().length < 12_000) return text.trim();
    } catch {
      // Browser/iframe may deny clipboard access.
    }
    return this.simulatedClipboardText;
  }

  async sampleBackgroundTone(): Promise<BackgroundSample> {
    return { tone: "medium", luminance: 0.42, samples: 0 };
  }

  setSimulatedClipboardText(text: string) { this.simulatedClipboardText = text; }
  async registerGlobalShortcut(shortcut: string, callback: (selectedText?: string) => void) {
    this.shortcutCallbacks.set(shortcut, callback);
    return true;
  }
  async unregisterGlobalShortcut(shortcut: string) { this.shortcutCallbacks.delete(shortcut); }
  async minimizeToBubble() { this.currentMode = "bubble"; }
  async closeWindow() { this.currentMode = "bubble"; }

  async savePosition(pos: WindowPosition) {
    try { localStorage.setItem(POS_KEY, JSON.stringify(pos)); } catch { /* ignore */ }
  }

  async loadSavedPosition(): Promise<WindowPosition | null> {
    try {
      const raw = localStorage.getItem(POS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}

export class TauriDesktopBridge implements DesktopBridge {
  public isTauri = true;
  private fallback = new BrowserDesktopBridge();
  private nativeShortcutCallback: ((selectedText?: string) => void) | null = null;
  private nativeLookupListenerInstalled = false;

  async getWindowMode() { return this.fallback.getWindowMode(); }

  async setWindowMode(mode: WindowMode): Promise<void> {
    const size = mode === "bubble"
      ? { width: 72, height: 72 }
      : mode === "study"
        ? { width: 960, height: 680 }
        : { width: 440, height: 620 };

    try {
      await invokeNative("set_window_size", size);
    } catch (error) {
      console.warn("Native resize failed:", error);
    }
    await this.fallback.setWindowMode(mode);
  }

  async setAlwaysOnTop(alwaysOnTop: boolean): Promise<void> {
    try {
      await invokeNative("set_always_on_top", { alwaysOnTop });
    } catch (error) {
      console.warn("Always-on-top update failed:", error);
    }
    await this.fallback.setAlwaysOnTop(alwaysOnTop);
  }

  async setPosition(pos: WindowPosition): Promise<void> {
    await this.fallback.setPosition(pos);
  }

  async getPosition(): Promise<WindowPosition> {
    return this.fallback.getPosition();
  }

  async startDragging(): Promise<void> {
    try {
      await invokeNative("start_dragging");
    } catch (error) {
      console.warn("Window drag failed:", error);
    }
  }

  async captureSelectedText(): Promise<string | null> {
    try {
      const text = await invokeNative<string>("capture_selected_text");
      return text?.trim() || null;
    } catch (error) {
      console.warn("Native selected-text capture failed:", error);
      return null;
    }
  }

  async sampleBackgroundTone(): Promise<BackgroundSample> {
    try {
      return await invokeNative<BackgroundSample>("sample_background_tone");
    } catch (error) {
      console.warn("Background tone sampling failed:", error);
      return { tone: "light", luminance: 0.75, samples: 0 };
    }
  }

  async registerGlobalShortcut(_shortcut: string, callback: (selectedText?: string) => void): Promise<boolean> {
    // The system-wide Ctrl+Shift+D shortcut is registered in Rust so it can
    // capture text from Chrome/PDF/other apps before LexiGlass takes focus.
    this.nativeShortcutCallback = callback;
    if (!this.nativeLookupListenerInstalled && typeof window !== "undefined") {
      window.addEventListener(NATIVE_LOOKUP_EVENT, ((event: Event) => {
        const selected = (event as CustomEvent<string>).detail;
        this.nativeShortcutCallback?.(typeof selected === "string" ? selected : undefined);
      }) as EventListener);
      this.nativeLookupListenerInstalled = true;
    }
    return true;
  }

  async unregisterGlobalShortcut(_shortcut: string): Promise<void> {
    this.nativeShortcutCallback = null;
  }

  async minimizeToBubble() { await this.setWindowMode("bubble"); }
  async closeWindow() { await this.setWindowMode("bubble"); }
  async savePosition(pos: WindowPosition) { return this.fallback.savePosition(pos); }
  async loadSavedPosition() { return this.fallback.loadSavedPosition(); }
}

function createDesktopBridge(): DesktopBridge {
  return isTauriRuntime() ? new TauriDesktopBridge() : new BrowserDesktopBridge();
}

export const desktopBridge = createDesktopBridge();
