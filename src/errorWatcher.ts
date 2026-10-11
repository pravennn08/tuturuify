import * as vscode from "vscode";
import { readSettings } from "./configuration";
import { ErrorState } from "./errorState";

export class ErrorWatcher implements vscode.Disposable {
  private readonly state = new ErrorState();
  private readonly subscriptions: vscode.Disposable[];
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly onNewError: () => void) {
    this.seedCurrentDiagnostics();
    this.subscriptions = [
      vscode.languages.onDidChangeDiagnostics((event) => {
        const settings = readSettings();
        for (const uri of event.uris) {
          const diagnostics = vscode.languages.getDiagnostics(uri);
          if (settings.enabled) this.state.update(uri.toString(), diagnostics);
          else this.state.seed(uri.toString(), diagnostics);
        }

        this.clearTimer();
        if (settings.enabled && this.state.hasPending) {
          this.timer = setTimeout(() => this.flush(), settings.debounceMs);
        }
      }),
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (!event.affectsConfiguration("tuturuify")) return;
        this.clearTimer();
        this.state.reset();
        this.seedCurrentDiagnostics();
      }),
    ];
  }

  dispose(): void {
    this.clearTimer();
    this.state.reset();
    for (const subscription of this.subscriptions) subscription.dispose();
  }

  private seedCurrentDiagnostics(): void {
    for (const [uri, diagnostics] of vscode.languages.getDiagnostics()) {
      this.state.seed(uri.toString(), diagnostics);
    }
  }

  private clearTimer(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
  }

  private flush(): void {
    this.timer = undefined;
    if (!readSettings().enabled) {
      this.state.takePending();
      return;
    }
    // Diagnostics may have changed again before VS Code delivered the next event.
    for (const resource of this.state.pendingResources) {
      this.state.update(resource, vscode.languages.getDiagnostics(vscode.Uri.parse(resource)));
    }
    if (this.state.takePending()) this.onNewError();
  }
}
