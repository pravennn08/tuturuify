import * as path from "node:path";
import * as vscode from "vscode";

export interface Settings {
  enabled: boolean;
  soundPath: string;
  volume: number;
  debounceMs: number;
  cooldownMs: number;
}

function bounded(value: number, fallback: number, maximum: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(maximum, value)) : fallback;
}

export function readSettings(): Settings {
  const config = vscode.workspace.getConfiguration("tuturuify");
  return {
    enabled: config.get<boolean>("enabled", true),
    soundPath: config.get<string>("soundPath", "").trim(),
    volume: bounded(config.get<number>("volume", 0.8), 0.8, 1),
    debounceMs: bounded(config.get<number>("debounceMs", 400), 400, 5000),
    cooldownMs: bounded(config.get<number>("cooldownMs", 2000), 2000, 60000),
  };
}

export function resolveSoundPath(settings: Settings, extensionPath: string): string {
  if (!settings.soundPath) {
    return path.join(extensionPath, "media", "tuturu.mp3");
  }
  if (!path.isAbsolute(settings.soundPath)) {
    throw new Error("Tuturuify: Sound Path must be an absolute path to an MP3 or WAV file.");
  }
  return settings.soundPath;
}
