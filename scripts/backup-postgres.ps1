param(
  [string]$OutputDirectory = (Join-Path $PSScriptRoot "..\backups"),
  [string]$OffServerPath = ""
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
if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
  throw "pg_dump est introuvable dans le PATH. Installez les outils client PostgreSQL."
}

$resolvedOutput = [System.IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Force -Path $resolvedOutput | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupFile = Join-Path $resolvedOutput "djibtout-$timestamp.dump"

$env:PGPASSWORD = $env:SPRING_DATASOURCE_PASSWORD
pg_dump --host $dbHost --port $dbPort --username $databaseUser --dbname $databaseName --format custom --no-owner --file $backupFile
$dumpExitCode = $LASTEXITCODE
Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue

if ($dumpExitCode -ne 0) {
  throw "La sauvegarde PostgreSQL a échoué."
}

Write-Output "Sauvegarde créée : $backupFile"

if (-not $env:BACKUP_ENCRYPTION_PASSPHRASE) {
  throw "BACKUP_ENCRYPTION_PASSPHRASE est requis pour chiffrer la sauvegarde avant toute copie hors serveur."
}
if (-not (Get-Command openssl -ErrorAction SilentlyContinue)) {
  throw "openssl est introuvable dans le PATH. Installez OpenSSL (ex. via Git for Windows) avant de lancer cette sauvegarde."
}

$encryptedFile = "$backupFile.enc"
openssl enc -aes-256-cbc -pbkdf2 -salt -in $backupFile -out $encryptedFile -pass env:BACKUP_ENCRYPTION_PASSPHRASE
if ($LASTEXITCODE -ne 0) {
  throw "Le chiffrement de la sauvegarde a échoué."
}
Remove-Item -LiteralPath $backupFile -Force
Write-Output "Sauvegarde chiffrée : $encryptedFile"

$offServerTarget = if ($OffServerPath) { $OffServerPath } elseif ($env:BACKUP_OFFSERVER_PATH) { $env:BACKUP_OFFSERVER_PATH } else { $null }
$awsCommand = Get-Command aws -ErrorAction SilentlyContinue

if ($env:S3_BUCKET -and $awsCommand) {
  $remoteKey = "backups/$(Split-Path -Leaf $encryptedFile)"
  $awsArgs = @("s3", "cp", $encryptedFile, "s3://$($env:S3_BUCKET)/$remoteKey")
  if ($env:S3_ENDPOINT) { $awsArgs += @("--endpoint-url", $env:S3_ENDPOINT) }
  & aws @awsArgs
  if ($LASTEXITCODE -ne 0) {
    throw "La copie hors serveur vers S3 a échoué."
  }
  Write-Output "Copie hors serveur : s3://$($env:S3_BUCKET)/$remoteKey"
} elseif ($offServerTarget) {
  New-Item -ItemType Directory -Force -Path $offServerTarget | Out-Null
  Copy-Item -LiteralPath $encryptedFile -Destination $offServerTarget -Force
  Write-Output "Copie hors serveur : $(Join-Path $offServerTarget (Split-Path -Leaf $encryptedFile))"
} else {
  Write-Warning "Aucune copie hors serveur effectuée : cette sauvegarde ne reste que sur ce disque. Définissez S3_BUCKET (+ CLI 'aws' installée) ou -OffServerPath / la variable BACKUP_OFFSERVER_PATH pour respecter la politique de rétention hors site."
}
