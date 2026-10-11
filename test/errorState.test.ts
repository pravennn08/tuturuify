import assert from "node:assert/strict";
import { test } from "node:test";
import { type DiagnosticLike, ErrorState } from "../src/errorState";

const file = "file:///example.ts";
const error: DiagnosticLike = { severity: 0, source: "ts", code: 2322, message: "Type mismatch" };

test("warnings, information, and hints never trigger", () => {
  const state = new ErrorState();
  state.update(
    file,
    [1, 2, 3].map((severity) => ({ ...error, severity })),
  );
  assert.equal(state.takePending(), false);
});

test("errors present at activation are seeded silently", () => {
  const state = new ErrorState();
  state.seed(file, [error]);
  state.update(file, [error]);
  assert.equal(state.takePending(), false);
});

test("a new error triggers once, and repeated diagnostics stay silent", () => {
  const state = new ErrorState();
  state.update(file, [error]);
  assert.equal(state.takePending(), true);
  state.update(file, [{ ...error }]);
  assert.equal(state.takePending(), false);
});

test("an error fixed before playback cancels the pending sound", () => {
  const state = new ErrorState();
  state.update(file, [error]);
  state.update(file, []);
  assert.equal(state.takePending(), false);
});

test("a resolved error appearing again triggers again", () => {
  const state = new ErrorState();
  state.update(file, [error]);
  state.takePending();
  state.update(file, []);
  state.update(file, [error]);
  assert.equal(state.takePending(), true);
});

test("additional occurrences of the same error are detected", () => {
  const state = new ErrorState();
  state.seed(file, [error]);
  state.update(file, [error, error]);
  assert.equal(state.takePending(), true);
});

test("fixing a new duplicate before playback keeps the old error silent", () => {
  const state = new ErrorState();
  state.seed(file, [error]);
  state.update(file, [error, error]);
  state.update(file, [error]);
  assert.equal(state.takePending(), false);
});

test("file updates cannot erase another file's pending error", () => {
  const state = new ErrorState();
  state.update(file, [error]);
  state.update("file:///other.ts", []);
  assert.equal(state.takePending(), true);
});

test("a different error triggers even when total error count stays the same", () => {
  const state = new ErrorState();
  state.seed(file, [error]);
  state.update(file, [{ ...error, code: 2304, message: "Cannot find name" }]);
  assert.equal(state.takePending(), true);
});

test("moving an existing error does not create a new sound", () => {
  const state = new ErrorState();
  const original = { ...error, range: { start: { line: 1 }, end: { line: 1 } } };
  const moved = { ...error, range: { start: { line: 9 }, end: { line: 9 } } };
  state.seed(file, [original]);
  state.update(file, [moved]);
  assert.equal(state.takePending(), false);
});

test("configuration reset clears pending and tracked errors", () => {
  const state = new ErrorState();
  state.update(file, [error]);
  state.reset();
  assert.deepEqual(state.pendingResources, []);
  state.seed(file, [error]);
  state.update(file, [error]);
  assert.equal(state.takePending(), false);
});
