param(
  [Parameter(Mandatory = $true)]
  [string]$AudioPath,

  [ValidateRange(0, 1)]
  [double]$Volume = 0.8
)

$ErrorActionPreference = 'Stop'
$player = $null
$timer = $null

try {
  Add-Type -AssemblyName PresentationCore
  Add-Type -AssemblyName WindowsBase

  $resolvedAudioPath = (Resolve-Path -LiteralPath $AudioPath).ProviderPath
  $player = New-Object System.Windows.Media.MediaPlayer
  $player.Volume = $Volume
  $frame = New-Object System.Windows.Threading.DispatcherFrame
  $playbackState = @{ ErrorMessage = $null }

  $player.add_MediaOpened({ $player.Play() })
  $player.add_MediaEnded({ $frame.Continue = $false })
  $player.add_MediaFailed({
    param($sender, $eventArgs)
    $playbackState.ErrorMessage = $eventArgs.ErrorException.Message
    $frame.Continue = $false
  })

  $timer = New-Object System.Windows.Threading.DispatcherTimer
  $timer.Interval = [TimeSpan]::FromSeconds(60)
  $timer.add_Tick({
    $playbackState.ErrorMessage = 'Audio playback timed out. Use a short MP3 or PCM WAV clip.'
    $frame.Continue = $false
  })

  $player.Open([System.Uri]::new($resolvedAudioPath))
  $timer.Start()
  [System.Windows.Threading.Dispatcher]::PushFrame($frame)

  if ($playbackState.ErrorMessage) {
    throw $playbackState.ErrorMessage
  }
} catch {
  [Console]::Error.WriteLine($_.Exception.Message)
  exit 1
} finally {
  if ($timer) { $timer.Stop() }
  if ($player) { $player.Close() }
}
