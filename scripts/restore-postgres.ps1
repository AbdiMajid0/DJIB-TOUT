param(
  [Parameter(Mandatory = $true)]
  [string]$BackupFile
)

$ErrorActionPreference = "Stop"

if (-not $env:SPRING_DATASOURCE_URL) {
  throw "SPRING_DATASOURCE_URL est requis (ex: jdbc:postgresql://db.your-project-ref.supabase.co:5432/postgres)."
}
if ($env:SPRING_DATASOURCE_URL -notmatch '^jdbc:postgresql://([^:/]+):(\d+)/([^?]+)') {
  throw "SPRING_DATASOURCE_URL invalide. Format attendu : jdbc:postgresql://host:port/database"
}
$dbHost = $Matches[1]
$dbPort = $Matches[2]
$databaseName = $Matches[3]
$databaseUser = if ($env:SPRING_DATASOURCE_USERNAME) { $env:SPRING_DATASOURCE_USERNAME } else { "postgres" }
if (-not $env:SPRING_DATASOURCE_PASSWORD) {
  throw "SPRING_DATASOURCE_PASSWORD est requis."
}
if (-not (Get-Command pg_restore -ErrorAction SilentlyContinue)) {
  throw "pg_restore est introuvable dans le PATH. Installez les outils client PostgreSQL."
}

$resolvedBackup = (Resolve-Path -LiteralPath $BackupFile).Path
$dumpToRestore = $resolvedBackup
$tempDecrypted = $null

if ($resolvedBackup.ToLowerInvariant().EndsWith(".enc")) {
  if (-not $env:BACKUP_ENCRYPTION_PASSPHRASE) {
    throw "BACKUP_ENCRYPTION_PASSPHRASE est requis pour déchiffrer cette sauvegarde."
  }
  if (-not (Get-Command openssl -ErrorAction SilentlyContinue)) {
    throw "openssl est introuvable dans le PATH. Installez OpenSSL (ex. via Git for Windows) avant de restaurer cette sauvegarde."
  }
  $tempDecrypted = [System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), [System.IO.Path]::GetRandomFileName())
  openssl enc -d -aes-256-cbc -pbkdf2 -salt -in $resolvedBackup -out $tempDecrypted -pass env:BACKUP_ENCRYPTION_PASSPHRASE
  if ($LASTEXITCODE -ne 0) {
    throw "Le déchiffrement de la sauvegarde a échoué. Vérifiez BACKUP_ENCRYPTION_PASSPHRASE."
  }
  $dumpToRestore = $tempDecrypted
}

try {
  $env:PGPASSWORD = $env:SPRING_DATASOURCE_PASSWORD
  pg_restore --host $dbHost --port $dbPort --username $databaseUser --dbname $databaseName --clean --if-exists --no-owner $dumpToRestore
  $restoreExitCode = $LASTEXITCODE
  Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue

  if ($restoreExitCode -ne 0) {
    throw "La restauration PostgreSQL a échoué."
  }
} finally {
  if ($tempDecrypted -and (Test-Path -LiteralPath $tempDecrypted)) {
    Remove-Item -LiteralPath $tempDecrypted -Force
  }
}

Write-Output "Restauration terminée depuis : $resolvedBackup"
