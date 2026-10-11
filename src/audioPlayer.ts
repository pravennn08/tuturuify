import { type ChildProcess, spawn } from "node:child_process";
import { stat } from "node:fs/promises";
import * as path from "node:path";

export class AudioPlayer {
  private child: ChildProcess | undefined;
  private busy = false;
  private disposed = false;
  private lastPlayedAt: number | undefined;
  private playbackGeneration = 0;

  constructor(private readonly extensionPath: string) {}

  async play(
    soundPath: string,
    volume: number,
    cooldownMs: number,
    force = false,
  ): Promise<boolean> {
    if (this.disposed || this.busy) return false;
    if (!force && this.lastPlayedAt !== undefined && Date.now() - this.lastPlayedAt < cooldownMs) {
      return false;
    }
    this.busy = true;
    const generation = this.playbackGeneration;
    try {
      if (process.platform !== "win32") {
        throw new Error("This version of Tuturuify supports Windows desktop VS Code.");
      }
      if (![".mp3", ".wav"].includes(path.extname(soundPath).toLowerCase())) {
        throw new Error("Choose an MP3 or PCM WAV audio file.");
      }
      if (!(await stat(soundPath)).isFile())
        throw new Error("The sound path must point to a file.");
      if (this.disposed || generation !== this.playbackGeneration) return false;

      const powershell = path.join(
        process.env.SystemRoot ?? "C:\\Windows",
        "System32",
        "WindowsPowerShell",
        "v1.0",
        "powershell.exe",
      );
      const child = spawn(
        powershell,
        [
          "-NoProfile",
          "-NonInteractive",
          "-Sta",
          "-ExecutionPolicy",
          "Bypass",
          "-File",
          path.join(this.extensionPath, "scripts", "playSound.ps1"),
          "-AudioPath",
          soundPath,
          "-Volume",
          String(Math.max(0, Math.min(1, volume))),
        ],
        { windowsHide: true, shell: false, stdio: ["ignore", "ignore", "pipe"] },
      );
      this.child = child;
      this.lastPlayedAt = Date.now();
      await new Promise<void>((resolve, reject) => {
        let stderr = "";
        const timeout = setTimeout(() => {
          child.kill();
          reject(new Error("Audio playback timed out after 65 seconds."));
        }, 65_000);
        const finish = (error?: Error) => {
          clearTimeout(timeout);
          if (this.child === child) this.child = undefined;
          if (error) reject(error);
          else resolve();
        };
        child.stderr?.setEncoding("utf8");
        child.stderr?.on("data", (chunk: string) => {
          stderr = (stderr + chunk).slice(-4000);
        });
        child.once("error", (error) => finish(error));
        child.once("close", (code, signal) => {
          if (this.disposed || signal || code === 0) finish();
          else finish(new Error(stderr.trim() || `Audio player exited with code ${code}.`));
        });
      });
      return true;
    } finally {
      this.busy = false;
    }
  }

  stop(): void {
    this.playbackGeneration += 1;
    this.child?.kill();
  }

  dispose(): void {
    this.disposed = true;
    this.stop();
  }
}
