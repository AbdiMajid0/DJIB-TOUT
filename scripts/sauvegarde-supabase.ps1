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

# jdbc:postgresql://hote:port/base?parametres -> hote, port, base, parametres.
if ($jdbc -notmatch '^jdbc:postgresql://([^/:?]+)(?::(\d+))?/([^?]+)(?:\?(.*))?$') { throw "URL JDBC inattendue : $jdbc" }
$hote  = $Matches[1]
$port  = if ($Matches[2]) { $Matches[2] } else { '5432' }
$base  = $Matches[3]

# Supabase exige TLS : ignorer les parametres de l'URL revenait a retomber sur
# sslmode=prefer, qui accepte une connexion en clair si le serveur le permet.
$sslmode = 'require'
if ($Matches[4]) {
    foreach ($param in $Matches[4] -split '&') {
        $kv = $param -split '=', 2
        if ($kv.Count -eq 2 -and $kv[0] -eq 'sslmode') { $sslmode = $kv[1] }
        if ($kv.Count -eq 2 -and $kv[0] -eq 'user'   -and -not $user) { $user = $kv[1] }
        if ($kv.Count -eq 2 -and $kv[0] -eq 'password' -and -not $pass) { $pass = $kv[1] }
    }
}

$horodatage = Get-Date -Format 'yyyyMMdd-HHmm'
$fichier    = "sauvegarde-supabase-$horodatage.dump"

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker est introuvable. Demarre Docker Desktop, ou installe les outils clients PostgreSQL."
}

Write-Host "Sauvegarde vers $fichier ..." -ForegroundColor Cyan
# -Fc : format compresse, restaurable table par table avec pg_restore.
# La version 17 de pg_dump lit les serveurs 15, 16 et 17 ; l'inverse est faux.
# Le mot de passe passe par la variable d'environnement PGPASSWORD, que docker
# herite avec `-e PGPASSWORD` sans valeur : il n'apparait ni dans les arguments
# du processus hote ni dans /proc/cmdline du conteneur.
$env:PGPASSWORD = $pass
try {
    docker run --rm -v "${racine}:/sortie" -e PGPASSWORD -e PGSSLMODE=$sslmode postgres:17-alpine `
        pg_dump -h $hote -p $port -U $user -d $base -Fc -f "/sortie/$fichier"
} finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
if ($LASTEXITCODE -ne 0) { throw "pg_dump a echoue (code $LASTEXITCODE)." }

$taille = (Get-Item (Join-Path $racine $fichier)).Length
Write-Host ("Termine : {0} ({1:N1} Mo)" -f $fichier, ($taille / 1MB)) -ForegroundColor Green
Write-Host "Ce fichier contient toutes tes donnees. Ne le versionne pas." -ForegroundColor DarkGray
