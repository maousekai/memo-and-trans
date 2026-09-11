export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && Boolean((window as any).__TAURI_INTERNALS__?.invoke);
}

export async function invokeNative<T = unknown>(command: string, args: Record<string, unknown> = {}): Promise<T> {
  if (!isTauriRuntime()) {
    throw new Error("Native Tauri runtime is not available");
  }

  return (window as any).__TAURI_INTERNALS__.invoke(command, args) as Promise<T>;
}
