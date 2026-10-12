# Tuturuify support

Ask questions, report bugs, and suggest improvements through
[GitHub Issues](https://github.com/pravennn08/tuturuify/issues).
Use the [issue form chooser](https://github.com/pravennn08/tuturuify/issues/new/choose) to select:

- **Support question** for installation, configuration, or usage help.
- **Bug report** when the extension behaves incorrectly.
- **Feature request** for a proposed improvement.

## Check sound playback

1. Use Windows desktop VS Code. This version supports Windows and MP3 or PCM WAV audio.
2. Open the Command Palette and run **Tuturuify: Test Sound**.
3. Check **Settings > Tuturuify**. Enable automatic playback and set volume above zero.
4. If you chose a custom sound, make sure the file still exists and plays on Windows.
   Clear **Tuturuify: Sound Path** to return to the bundled MP3.
5. Open **View > Output**, select **Tuturuify**, and check for a playback failure message.

## Check automatic error sounds

Tuturuify reacts to new **Error** diagnostics in VS Code's Problems panel. Your language's
extension or language server must report the diagnostic. Warnings, information, and hints
stay silent; terminal output and debugger exceptions are not monitored.

Try introducing a TypeScript error after Tuturuify has activated:

```ts
const greeting: string = 123;
```

Wait for the red squiggle and Error diagnostic. Errors fixed during the debounce delay stay
silent. Existing unchanged errors stay silent, and errors arriving during playback or the
cooldown are skipped. Fix the error, wait for the cooldown, then introduce it again to retry.

## Include helpful details

For a bug report, include your Tuturuify version, VS Code version, operating system,
programming language and language extension, reproduction steps, and whether **Test Sound**
works. Relevant lines from the **Tuturuify** Output channel help diagnose playback failures.
Omit personal file paths from logs and screenshots.
