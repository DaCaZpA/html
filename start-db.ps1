param(
  [ValidateSet('up','down')]
  [string]$Action = 'up'
)

if ($Action -eq 'up') {
  Write-Host "Starting Postgres and Adminer via docker compose..."
  docker compose -f docker-compose.db.yml up -d
  if ($LASTEXITCODE -ne 0) { Write-Error "docker compose up failed with code $LASTEXITCODE"; exit $LASTEXITCODE }
  Write-Host "Containers started. Adminer: http://localhost:8080 (user=admin / password=secret)"
} else {
  Write-Host "Stopping Postgres and Adminer via docker compose..."
  docker compose -f docker-compose.db.yml down
  if ($LASTEXITCODE -ne 0) { Write-Error "docker compose down failed with code $LASTEXITCODE"; exit $LASTEXITCODE }
  Write-Host "Containers stopped."
}
