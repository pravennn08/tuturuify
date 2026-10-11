import * as vscode from "vscode";
import { AudioPlayer } from "./audioPlayer";
import { readSettings, resolveSoundPath } from "./configuration";
import { ErrorWatcher } from "./errorWatcher";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel("Tuturuify");
  const player = new AudioPlayer(context.extensionPath);

  async function playSound(manual: boolean): Promise<void> {
    try {
      const settings = readSettings();
      if (!manual && !settings.enabled) return;
      const played = await player.play(
        resolveSoundPath(settings, context.extensionPath),
        settings.volume,
        settings.cooldownMs,
        manual,
      );
      if (played) output.appendLine(`Played tuturu (${manual ? "manual test" : "new error"}).`);
      else if (manual) {
        await vscode.window.showInformationMessage("Tuturuify is already playing a sound.");
      }
    } catch (error) {
      const message = errorMessage(error);
      output.appendLine(`Playback failed: ${message}`);
      if (manual) await vscode.window.showErrorMessage(`Tuturuify: ${message}`);
    }
  }

  const watcher = new ErrorWatcher(() => {
    void playSound(false);
  });

  context.subscriptions.push(
    player,
    watcher,
    output,
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("tuturuify.enabled") && !readSettings().enabled) player.stop();
    }),
    vscode.commands.registerCommand("tuturuify.testSound", () => playSound(true)),
    vscode.commands.registerCommand("tuturuify.chooseSound", async () => {
      try {
        const selected = await vscode.window.showOpenDialog({
          canSelectFiles: true,
          canSelectFolders: false,
          canSelectMany: false,
          openLabel: "Use Tuturu Sound",
          filters: { "Audio files": ["mp3", "wav"] },
        });
        const uri = selected?.[0];
        if (!uri) return;
        if (uri.scheme !== "file") throw new Error("Choose a sound file on your local computer.");
        await vscode.workspace
          .getConfiguration("tuturuify")
          .update("soundPath", uri.fsPath, vscode.ConfigurationTarget.Global);
        await vscode.window.showInformationMessage(
          "Tuturuify sound selected. Run Test Sound to hear it.",
        );
      } catch (error) {
        await vscode.window.showErrorMessage(`Tuturuify: ${errorMessage(error)}`);
      }
    }),
    vscode.commands.registerCommand("tuturuify.toggle", async () => {
      try {
        const enabled = !readSettings().enabled;
        const config = vscode.workspace.getConfiguration("tuturuify");
        const inspection = config.inspect<boolean>("enabled");
        const target =
          inspection?.workspaceValue !== undefined
            ? vscode.ConfigurationTarget.Workspace
            : vscode.ConfigurationTarget.Global;
        await config.update("enabled", enabled, target);
        await vscode.window.showInformationMessage(
          `Tuturuify ${enabled ? "enabled" : "disabled"}.`,
        );
      } catch (error) {
        await vscode.window.showErrorMessage(`Tuturuify: ${errorMessage(error)}`);
      }
    }),
  );
  output.appendLine("Tuturuify activated. Watching for new Error diagnostics.");
}
