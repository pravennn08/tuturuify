<div align="center">

<h1>Tuturuify</h1>

<p>Play your tuturu sound when a new **Error** diagnostic appears in VS Code's Problems panel.
Warnings, information, and hints stay silent. This first version runs on Windows desktop VS Code.</p>

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22%2B-5FA04E?logo=nodedotjs&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white)
![Biome](https://img.shields.io/badge/Biome-60A5FA?logo=biome&logoColor=white)
![PowerShell](https://img.shields.io/badge/PowerShell-.ps1-red)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?logo=githubactions&logoColor=white)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE.md)

</div>

## Develop

Requirements: Node.js 22 or newer, pnpm, and VS Code 1.96 or newer.

```powershell
pnpm install
pnpm verify
```

Open this folder in VS Code and press **F5**. Choose **Run Tuturuify** if asked. In the new
Extension Development Host window, open the Command Palette and run **Tuturuify: Test Sound**.
For automatic playback, open a TypeScript file and add a type error, for example:

```ts
const greeting: string = 123;
```

Wait for the red squiggle. Fix it, then introduce it again to hear another sound.
Your language's extension or language server must report an Error diagnostic for automatic playback.

## Sound file

The default audio is **media/tuturu.mp3**, which is included in the packaged extension.
Replace that file to change the bundled sound, then compile/reload or repackage.

For a personal alternative, run **Tuturuify: Choose Sound** and select a local MP3 or PCM WAV.
The extension stores its absolute path in your user settings; the selected file must remain there.
Clear **Tuturuify: Sound Path** in Settings to return to the bundled MP3.

## Commands

| Command                       | Action                                                       |
| ----------------------------- | ------------------------------------------------------------ |
| Tuturuify: Test Sound         | Play manually, including when automatic playback is disabled |
| Tuturuify: Choose Sound       | Select a local MP3 or WAV                                    |
| Tuturuify: Toggle Error Sound | Enable or disable automatic playback                         |

## Settings

| Setting                | Default | Purpose                                                |
| ---------------------- | ------- | ------------------------------------------------------ |
| `tuturuify.enabled`    | `true`  | Enable automatic error sounds                          |
| `tuturuify.soundPath`  | Empty   | Use bundled audio, or provide an absolute MP3/WAV path |
| `tuturuify.volume`     | `0.8`   | Volume from 0 to 1                                     |
| `tuturuify.debounceMs` | `400`   | Wait for diagnostics to settle                         |
| `tuturuify.cooldownMs` | `2000`  | Minimum time between automatic sounds                  |

Errors already reported when Tuturuify activates are recorded silently. Errors subsequently
reported by a language server can trigger, including when that language server first starts.
Unchanged errors and errors moved to another line stay silent. A new occurrence of the same
error can trigger. Errors fixed during the debounce stay silent. Playback never overlaps;
errors arriving during playback or cooldown are skipped rather than queued.

This version watches diagnostics. Terminal exit codes, raw terminal output, and debugger
exceptions are separate sources and are not monitored.

## Tooling

```powershell
pnpm check       # Biome formatting, linting, and import checks
pnpm check:fix   # Apply safe fixes and formatting
pnpm typecheck   # Strict TypeScript checking
pnpm test        # Error detection regression tests
pnpm compile    # Compile src/ into dist/
pnpm watch      # Recompile as you edit
pnpm verify     # Run all checks and compile
pnpm package    # Create releases/tuturuify-1.0.0.vsix
```

The workspace recommends the official Biome VS Code extension and uses it for format-on-save.
Install that recommendation to enable the editor integration; the pnpm commands work without it.

To install a package, open Extensions, select **... > Install from VSIX...**, and choose the
file from `releases/`. The publisher ID `tuturuify-local` is a local packaging placeholder.
Choose your registered publisher ID before publishing to the Marketplace.

## Continuous integration

`.github/workflows/ci.yml` runs on pushes, pull requests, and manual dispatches in GitHub Actions.
It uses a Windows runner, Node.js 22, and the pnpm version declared in `package.json`.
Dependencies are installed with `--frozen-lockfile`, with the pnpm store cached between runs.

The workflow checks Biome formatting/linting, checks TypeScript, runs the error detection tests,
then compiles and packages the extension. Successful runs upload `releases/*.vsix` as the
**tuturuify-vsix** artifact, retained for 14 days. Audio-device playback is checked manually in
desktop VS Code.

To test the CI-built extension:

1. Open your GitHub repository's **Actions** tab and select a successful **CI** run.
2. On the run's summary page, scroll to **Artifacts** and download **tuturuify-vsix**.
3. Extract the ZIP to find `tuturuify-1.0.0.vsix`.
4. In your normal VS Code window, press **Ctrl+Shift+P**, run **Extensions: Install from VSIX...**,
   and select the extracted `.vsix`. Reload if prompted.
5. Run **Tuturuify: Test Sound**, then introduce a new TypeScript error to check automatic playback.

Runs that fail a check before packaging do not produce a VSIX artifact. To test a local build
while fixing CI, run `pnpm package` and install the `.vsix` from `releases/` instead.

`.gitattributes` keeps text files checked out with LF line endings, matching Biome and
`.editorconfig`. Without this rule, Windows Git can convert files to CRLF and cause Biome
formatting failures in CI even when local checks pass. Commit `.gitattributes` with the fix;
re-running an old failed commit will still use its old checkout rules. Audio files stay binary.

Commit `pnpm-lock.yaml` with dependency changes so CI can install the same versions. The workflow
builds an installable package; Marketplace publishing is a separate release step.

## Architecture

The source project's `docs/ARCHITECTURE.md` documents component responsibilities, lifecycle,
error identity, and packaging details.

## Troubleshooting

Open **View > Output > Tuturuify** for playback failures. Try **Test Sound** first. Check that
the MP3 or PCM WAV plays on Windows, the file still exists, and volume is above zero.
Audio playback uses a hidden Windows PowerShell process and the built-in WPF MediaPlayer;
there are no runtime npm dependencies or external audio players to install. A machine policy
that blocks PowerShell or Windows media components can prevent playback.

The MIT license in LICENSE.md applies to the extension code and documentation.
The bundled audio (`media/tuturu.mp3`) is excluded from that license and remains subject to
its rights holder's terms. A public release must have permission to redistribute the clip.
