export interface DiagnosticLike {
  severity: number;
  message: string;
  source?: string;
  code?: string | number | { value: string | number };
}

type Counts = Map<string, number>;

function countErrors(diagnostics: readonly DiagnosticLike[]): Counts {
  const counts: Counts = new Map();
  for (const diagnostic of diagnostics) {
    // VS Code's DiagnosticSeverity.Error is 0. No runtime VS Code import is needed here.
    if (diagnostic.severity !== 0) continue;
    const code = typeof diagnostic.code === "object" ? diagnostic.code.value : diagnostic.code;
    // Exclude positions: moving an existing error down a line should stay silent.
    const key = JSON.stringify([diagnostic.source ?? "", code ?? "", diagnostic.message]);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/** Tracks new error occurrences and drops errors fixed before the debounce finishes. */
export class ErrorState {
  private readonly snapshots = new Map<string, Counts>();
  private readonly pending = new Map<string, Counts>();

  seed(resource: string, diagnostics: readonly DiagnosticLike[]): void {
    this.storeSnapshot(resource, countErrors(diagnostics));
    this.pending.delete(resource);
  }

  update(resource: string, diagnostics: readonly DiagnosticLike[]): void {
    const current = countErrors(diagnostics);
    const previous = this.snapshots.get(resource) ?? new Map<string, number>();
    const pending = this.pending.get(resource) ?? new Map<string, number>();

    for (const [key, threshold] of pending) {
      if ((current.get(key) ?? 0) < threshold) pending.delete(key);
    }

    for (const [key, count] of current) {
      const oldCount = previous.get(key) ?? 0;
      if (count > oldCount && !pending.has(key)) pending.set(key, oldCount + 1);
    }

    this.storeSnapshot(resource, current);
    if (pending.size > 0) this.pending.set(resource, pending);
    else this.pending.delete(resource);
  }

  get pendingResources(): string[] {
    return [...this.pending.keys()];
  }

  get hasPending(): boolean {
    return this.pending.size > 0;
  }

  takePending(): boolean {
    const hadPending = this.hasPending;
    this.pending.clear();
    return hadPending;
  }

  reset(): void {
    this.snapshots.clear();
    this.pending.clear();
  }

  private storeSnapshot(resource: string, counts: Counts): void {
    if (counts.size > 0) this.snapshots.set(resource, counts);
    else this.snapshots.delete(resource);
  }
}
