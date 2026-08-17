# Reinitialise la base LOCALE djibtout, puis demarre le backend avec le semis.
#
# Trouve psql tout seul. S'il n'est pas installe, se rabat sur Docker Desktop
# (le meme que run-tests.cmd utilise deja). Aucune saisie de chemin.
#
#   .\scripts\reinitialiser-base-locale.ps1
#
# Ne touche JAMAIS a Supabase : tout est cable en dur sur localhost:5432,
# avec les identifiants par defaut du profil local (postgres / password).

$ErrorActionPreference = 'Stop'

$racine = Split-Path -Parent $PSScriptRoot
$base   = 'djibtout'
$hote   = 'localhost'
$user   = 'postgres'
$pass   = 'password'

function Invoke-Sql([string]$sql, [string]$surBase) {
    if ($script:psqlExe) {
        $env:PGPASSWORD = $pass
        & $script:psqlExe -h $hote -p 5432 -U $user -d $surBase -v ON_ERROR_STOP=1 -c $sql
    } else {
        # host.docker.internal designe la machine hote depuis un conteneur.
        docker run --rm -e PGPASSWORD=$pass postgres:17-alpine `
            psql -h host.docker.internal -p 5432 -U $user -d $surBase -v ON_ERROR_STOP=1 -c $sql
    }
    if ($LASTEXITCODE -ne 0) { throw "Echec de : $sql" }
}

# --- Trouver psql, ou Docker ------------------------------------------------
$script:psqlExe = (Get-Command psql -ErrorAction SilentlyContinue).Source
if (-not $script:psqlExe) {
    $script:psqlExe = Get-ChildItem 'C:\Program Files\PostgreSQL\*\bin\psql.exe' -ErrorAction SilentlyContinue |
        Sort-Object FullName -Descending | Select-Object -First 1 -ExpandProperty FullName
}

if ($script:psqlExe) {
    Write-Host "psql trouve : $script:psqlExe" -ForegroundColor DarkGray
} elseif (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "psql absent : passage par Docker." -ForegroundColor DarkGray
} else {
    throw @"
Ni psql ni Docker ne sont disponibles.

Il n'y a probablement pas de PostgreSQL sur cette machine. Deux options :
  - demarrer Docker Desktop puis relancer ce script ;
  - travailler directement sur Supabase avec backend\start-supabase.ps1,
    qui n'a besoin d'aucune base locale.
"@
}

# --- Recreer la base --------------------------------------------------------
Write-Host "Suppression de $base ..." -ForegroundColor Cyan
# WITH (FORCE) coupe les connexions restees ouvertes (pgAdmin, un backend oublie).
# Sans lui, DROP DATABASE echoue des qu'une session traine.
Invoke-Sql "DROP DATABASE IF EXISTS $base WITH (FORCE)" 'postgres'

Write-Host "Creation de $base ..." -ForegroundColor Cyan
Invoke-Sql "CREATE DATABASE $base" 'postgres'

Write-Host "Base $base recreee. Flyway va la batir depuis les migrations." -ForegroundColor Green
Write-Host ""

# --- Demarrer le backend avec le semis --------------------------------------
& (Join-Path $racine 'backend\start-local.ps1') -Seed
exit $LASTEXITCODE
