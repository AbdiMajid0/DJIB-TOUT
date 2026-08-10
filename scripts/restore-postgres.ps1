param(
  [Parameter(Mandatory = $true)]
  [string]$BackupFile
)

$ErrorActionPreference = "Stop"
$resolvedBackup = (Resolve-Path -LiteralPath $BackupFile).Path
$databaseUser = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "djibtout" }
$databaseName = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "djibtout" }

Get-Content -LiteralPath $resolvedBackup -AsByteStream -Raw | docker compose exec -T db pg_restore `
  --username $databaseUser `
  --dbname $databaseName `
  --clean `
  --if-exists `
  --no-owner

if ($LASTEXITCODE -ne 0) {
  throw "La restauration PostgreSQL a échoué."
}

Write-Output "Restauration terminée depuis : $resolvedBackup"
