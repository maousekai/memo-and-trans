import type { SavedPhrase, SavedWord } from "../../types/study";
import type { AppSettings } from "../../types/settings";
import { invokeNative, isTauriRuntime } from "../desktop/tauriInvoke";

export interface GitHubAuthStatus {
  configured: boolean;
  login: string | null;
}

export interface GitHubDeviceCode {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

interface LearningSyncPayload {
  schemaVersion: 1;
  exportedAt: string;
  source: "LexiGlass";
  words: SavedWord[];
  phrases: SavedPhrase[];
}

let syncTimer: number | null = null;
let syncInFlight = false;
let pendingPayload: LearningSyncPayload | null = null;
let lastSyncedJson = "";

function assertDesktop() {
  if (!isTauriRuntime()) {
    throw new Error("GitHub Sync chỉ khả dụng trong bản Desktop.");
  }
}

async function pushPayload(payload: LearningSyncPayload, settings: AppSettings): Promise<string | null> {
  if (!settings.githubSyncEnabled || !settings.githubSyncRepo.trim()) return null;
  assertDesktop();

  const json = JSON.stringify(payload, null, 2);
  if (json === lastSyncedJson) return null;

  syncInFlight = true;
  try {
    const repo = await invokeNative<string>("github_ensure_sync_repo", {
      repoName: settings.githubSyncRepo.trim(),
    });

    const url = await invokeNative<string>("github_sync_json", {
      repoName: repo,
      path: "data/learning-data.json",
      content: json,
    });
    lastSyncedJson = json;
    return url;
  } finally {
    syncInFlight = false;
  }
}

export const githubSyncService = {
  async getStatus(): Promise<GitHubAuthStatus> {
    if (!isTauriRuntime()) return { configured: false, login: null };
    return invokeNative<GitHubAuthStatus>("github_auth_status");
  },

  async beginLogin(clientId: string): Promise<GitHubDeviceCode> {
    assertDesktop();
    return invokeNative<GitHubDeviceCode>("github_begin_device_login", {
      clientId: clientId.trim(),
    });
  },

  async pollLogin(clientId: string, deviceCode: string): Promise<GitHubAuthStatus> {
    assertDesktop();
    return invokeNative<GitHubAuthStatus>("github_poll_device_login", {
      clientId: clientId.trim(),
      deviceCode,
    });
  },

  async disconnect(): Promise<void> {
    assertDesktop();
    await invokeNative("github_disconnect");
    lastSyncedJson = "";
  },

  async syncNow(words: SavedWord[], phrases: SavedPhrase[], settings: AppSettings): Promise<string | null> {
    const payload: LearningSyncPayload = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      source: "LexiGlass",
      words,
      phrases,
    };
    return pushPayload(payload, settings);
  },

  schedule(words: SavedWord[], phrases: SavedPhrase[], settings: AppSettings) {
    if (!settings.githubSyncEnabled || !isTauriRuntime()) return;

    pendingPayload = {
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      source: "LexiGlass",
      words,
      phrases,
    };

    if (syncTimer !== null) window.clearTimeout(syncTimer);
    syncTimer = window.setTimeout(async () => {
      syncTimer = null;
      if (syncInFlight || !pendingPayload) return;
      const payload = pendingPayload;
      pendingPayload = null;
      try {
        await pushPayload(payload, settings);
      } catch (error) {
        console.warn("GitHub auto sync failed:", error);
      }
    }, 1800);
  },
};
