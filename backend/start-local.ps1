# Backend DJIB TOUT sur la base LOCALE (jamais Supabase).
#
# Le .env de la racine n'est volontairement PAS charge : il pointe sur Supabase.
# Ses valeurs par defaut suffisent (postgres/password sur localhost:5432/djibtout,
# secret JWT de developpement).
#
# Le profil `local` est en ddl-auto=validate, comme test, staging et production :
# Flyway est la seule source du schema. Une entite qui ne correspond pas aux
# migrations empeche le demarrage ici, au lieu d'attendre le deploiement.
#
# Prerequis : une base `djibtout` sur le Postgres local. La creer si besoin :
#   psql -U postgres -c "CREATE DATABASE djibtout"
#
# Donnees de demonstration : ajouter le profil `seed` au premier demarrage.
#   .\start-local.ps1 -Seed
# Les semeurs ne s'executent pas si les tables contiennent deja quelque chose.

param([switch]$Seed)

$ErrorActionPreference = 'Stop'

$env:SPRING_PROFILES_ACTIVE     = if ($Seed) { 'local,seed' } else { 'local' }
$env:SERVER_PORT                = '8083'
$env:SPRING_DATASOURCE_URL      = 'jdbc:postgresql://localhost:5432/djibtout'
$env:SPRING_DATASOURCE_USERNAME = 'postgres'
$env:SPRING_DATASOURCE_PASSWORD = 'password'
$env:MAIL_ENABLED               = 'false'
# Promeut un compte existant a l'adresse admin@djibtout.local. Sans effet si
# le compte n'existe pas : AdminBootstrap ne cree jamais de compte.
$env:ADMIN_BOOTSTRAP_ENABLED    = 'true'
$env:APP_CORS_ALLOWED_ORIGINS   = 'http://localhost:5181,http://127.0.0.1:5181,http://localhost:5173,http://localhost:5174,http://localhost:3000'

Write-Host "Backend LOCAL sur 8083 -> $($env:SPRING_DATASOURCE_URL)" -ForegroundColor Green
Write-Host "Profils : $($env:SPRING_PROFILES_ACTIVE)" -ForegroundColor DarkGray
Write-Host "Note : /actuator/health repond DOWN sans SMTP. Sonder /api/products." -ForegroundColor DarkGray

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
