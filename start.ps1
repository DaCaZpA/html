param(
  [string]$VBOX_PATH
)

function FailIfNoNode {
  try { node -v > $null 2>&1 } catch {
    Write-Error "Node.js wurde nicht gefunden. Bitte installiere Node.js oder füge es zum PATH hinzu."
    exit 1
  }
}

FailIfNoNode

if ($VBOX_PATH) {
  $env:VBOX_PATH = $VBOX_PATH
  Write-Host "Setze VBOX_PATH = $env:VBOX_PATH"
} elseif (-not $env:VBOX_PATH) {
  Write-Warning "VBOX_PATH ist nicht gesetzt. Wenn VBoxManage nicht im PATH ist, setze es mit -VBOX_PATH '<Pfad>'"
} else {
  Write-Host "Benutze bestehenden VBOX_PATH: $env:VBOX_PATH"
}

Write-Host "Starte API: node Api.js"
try {
  # Starten im aktuellen Terminal (blockierend), damit Logs sichtbar bleiben
  node Api.js
} catch {
  Write-Error "Fehler beim Starten von Api.js: $_"
  exit 1
}
