param(
  [string]$Time = "02:00",
  [string]$TaskName = "DjibToutPostgresBackup"
)

$ErrorActionPreference = "Stop"
$scriptPath = Join-Path $PSScriptRoot "backup-postgres.ps1"
if (-not (Test-Path -LiteralPath $scriptPath)) {
  throw "Introuvable : $scriptPath"
}

$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""
$trigger = New-ScheduledTaskTrigger -Daily -At $Time
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings `
  -Description "Sauvegarde quotidienne PostgreSQL DjibTout (chiffrée, copiée hors serveur)." -Force | Out-Null

Write-Output "Tâche planifiée '$TaskName' enregistrée : exécution quotidienne à $Time."
Write-Output "Important : cette tâche s'exécute hors de toute session shell. Les variables POSTGRES_USER, POSTGRES_DB, BACKUP_ENCRYPTION_PASSPHRASE et, le cas échéant, S3_BUCKET / S3_ENDPOINT / BACKUP_OFFSERVER_PATH doivent être définies comme variables d'environnement systeme (pas seulement dans la session courante), sinon backup-postgres.ps1 échouera silencieusement au prochain déclenchement."
Write-Output "Pour supprimer cette planification : Unregister-ScheduledTask -TaskName '$TaskName' -Confirm:`$false"
