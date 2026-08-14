$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $projectRoot '.env'

if (-not (Test-Path -LiteralPath $envFile)) {
    throw "Fichier .env introuvable à la racine du projet."
}

Get-Content -LiteralPath $envFile | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith('#')) { return }
    $parts = $line -split '=', 2
    if ($parts.Count -eq 2 -and $parts[0] -match '^[A-Za-z_][A-Za-z0-9_]*$') {
        [Environment]::SetEnvironmentVariable($parts[0], $parts[1], 'Process')
    }
}

$env:SPRING_PROFILES_ACTIVE = 'local'
$env:APP_CORS_ALLOWED_ORIGINS = 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:3000,http://127.0.0.1:3000'

Write-Host 'Démarrage de DJIB TOUT avec la base Supabase…' -ForegroundColor Cyan
& "$PSScriptRoot\mvnw.cmd" spring-boot:run
exit $LASTEXITCODE
