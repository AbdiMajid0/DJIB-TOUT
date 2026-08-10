param(
  [string]$OutputDirectory = (Join-Path $PSScriptRoot "..\backups")
)

$ErrorActionPreference = "Stop"
$resolvedOutput = [System.IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Force -Path $resolvedOutput | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupFile = Join-Path $resolvedOutput "djibtout-$timestamp.dump"
$databaseUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "djibtout" }
$databaseName = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "djibtout" }

docker compose exec -T db pg_dump `
  --username $databaseUser `
  --dbname $databaseName `
  --format custom `
  --no-owner > $backupFile

if ($LASTEXITCODE -ne 0) {
  throw "La sauvegarde PostgreSQL a échoué."
}

Write-Output "Sauvegarde créée : $backupFile"
