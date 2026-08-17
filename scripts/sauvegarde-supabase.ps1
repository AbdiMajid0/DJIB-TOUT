# Sauvegarde de la base SUPABASE avant que Flyway n'y applique ses migrations.
#
# Aucune installation requise : pg_dump est execute dans un conteneur Docker,
# celui-la meme qui sert deja a run-tests.cmd. Les identifiants sont lus dans
# le .env et ne transitent ni par la ligne de commande ni par l'historique
# PowerShell.
#
#   .\scripts\sauvegarde-supabase.ps1
#
# Le fichier obtenu se restaure avec :
#   pg_restore --clean --if-exists -d "<url>" <fichier>.dump

$ErrorActionPreference = 'Stop'

$racine  = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $racine '.env'
if (-not (Test-Path -LiteralPath $envFile)) { throw "Fichier .env introuvable a la racine." }

$valeurs = @{}
Get-Content -LiteralPath $envFile | ForEach-Object {
    $ligne = $_.Trim()
    if (-not $ligne -or $ligne.StartsWith('#')) { return }
    $paire = $ligne -split '=', 2
    if ($paire.Count -eq 2) { $valeurs[$paire[0].Trim()] = $paire[1].Trim() }
}

$jdbc = $valeurs['SPRING_DATASOURCE_URL']
$user = $valeurs['SPRING_DATASOURCE_USERNAME']
$pass = $valeurs['SPRING_DATASOURCE_PASSWORD']
if (-not $jdbc -or -not $user -or -not $pass) { throw "Le .env ne contient pas les trois variables SPRING_DATASOURCE_*." }

# jdbc:postgresql://hote:port/base  ->  hote:port/base
if ($jdbc -notmatch '^jdbc:postgresql://(.+)$') { throw "URL JDBC inattendue : $jdbc" }
$cible = $Matches[1] -replace '\?.*$', ''

# Le mot de passe peut contenir @ / : # — il doit etre encode pour tenir dans une URL.
$url = 'postgresql://{0}:{1}@{2}' -f [uri]::EscapeDataString($user), [uri]::EscapeDataString($pass), $cible

$horodatage = Get-Date -Format 'yyyyMMdd-HHmm'
$fichier    = "sauvegarde-supabase-$horodatage.dump"

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker est introuvable. Demarre Docker Desktop, ou installe les outils clients PostgreSQL."
}

Write-Host "Sauvegarde vers $fichier ..." -ForegroundColor Cyan
# -Fc : format compresse, restaurable table par table avec pg_restore.
# La version 17 de pg_dump lit les serveurs 15, 16 et 17 ; l'inverse est faux.
docker run --rm -v "${racine}:/sortie" -e PGPASSWORD_UNUSED=1 postgres:17-alpine `
    pg_dump $url -Fc -f "/sortie/$fichier"
if ($LASTEXITCODE -ne 0) { throw "pg_dump a echoue (code $LASTEXITCODE)." }

$taille = (Get-Item (Join-Path $racine $fichier)).Length
Write-Host ("Termine : {0} ({1:N1} Mo)" -f $fichier, ($taille / 1MB)) -ForegroundColor Green
Write-Host "Ce fichier contient toutes tes donnees. Ne le versionne pas." -ForegroundColor DarkGray
