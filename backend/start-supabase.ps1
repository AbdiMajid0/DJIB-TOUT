# Backend DJIB TOUT sur la base SUPABASE, celle qui porte les vraies donnees.
#
# Depuis le passage du profil `local` en ddl-auto=validate, Hibernate ne peut
# plus modifier ce schema, et les semeurs sont sur le profil `seed` : un
# demarrage ordinaire n'ecrit rien de lui-meme. Restent deux effets reels.
#
# 1. Flyway applique ici les migrations en attente. C'est une modification du
#    schema de la base principale. Faire une sauvegarde avant le premier
#    demarrage :
#      pg_dump "<SPRING_DATASOURCE_URL>" -Fc -f sauvegarde-avant-flyway.dump
#
# 2. Le profil `local` garde app.payments.simulated=true : un paiement de test
#    depuis l'interface creera une vraie ligne Payment marquee comme acceptee.
#    A ne pas confondre plus tard avec un encaissement.
#
# MAIL_ENABLED=true dans le .env : les e-mails partent pour de bon.

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
# Meme port que start-local.ps1 : le proxy de developpement de Vite vise 8083.
# Sans cette ligne, le backend ecoutait sur 8082 et le navigateur ne le voyait
# pas — c'est le port qui doit etre le meme partout en developpement, pas la base.
$env:SERVER_PORT = '8083'
$env:APP_CORS_ALLOWED_ORIGINS = 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:3000,http://127.0.0.1:3000'

Write-Host 'Base SUPABASE (donnees reelles) sur le port 8083.' -ForegroundColor Yellow
Write-Host 'Flyway peut appliquer des migrations. Sauvegarde faite ?' -ForegroundColor Yellow
# Verifie le port avant de laisser Spring echouer huit secondes plus tard sur un
# message noye dans la trace. Un backend oublie dans un autre terminal est le cas
# le plus frequent : il continue de repondre au navigateur, ce qui donne
# l illusion que le nouveau demarrage a fonctionne.
$occupe = Get-NetTCPConnection -LocalPort $env:SERVER_PORT -State Listen -ErrorAction SilentlyContinue
if ($occupe) {
    $pids = $occupe | Select-Object -ExpandProperty OwningProcess -Unique
    $noms = $pids | ForEach-Object {
        $p = Get-Process -Id $_ -ErrorAction SilentlyContinue
        if ($p) { "$($p.ProcessName) (PID $($p.Id))" } else { "PID $_" }
    }
    Write-Host ""
    Write-Host "Le port $($env:SERVER_PORT) est deja pris par : $($noms -join ', ')" -ForegroundColor Red
    Write-Host "Pour l arreter :" -ForegroundColor Yellow
    Write-Host "  Get-NetTCPConnection -LocalPort $($env:SERVER_PORT) -State Listen | ForEach-Object { Stop-Process -Id `$_.OwningProcess -Force }" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Maven resout le pom.xml depuis le repertoire courant, pas depuis le chemin
# du script : lance depuis la racine du depot, il ne trouvait aucun projet et
# echouait sur « No plugin found for prefix spring-boot ». On se place donc
# dans backend/ le temps de la commande, quel que soit l appelant.
Push-Location $PSScriptRoot
try {
    & "$PSScriptRoot\mvnw.cmd" spring-boot:run
    $code = $LASTEXITCODE
} finally {
    Pop-Location
}
exit $code
