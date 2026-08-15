# Backend DJIB TOUT sur la base LOCALE (jamais Supabase).
#
# Le .env de la racine n'est volontairement PAS charge : il pointe sur Supabase,
# et le profil `local` a ddl-auto=update. Ses valeurs par defaut suffisent
# (postgres/password sur localhost:5432/djibtout, secret JWT de developpement).
#
# Prerequis : une base `djibtout` sur le Postgres local. La creer si besoin :
#   psql -U postgres -c "CREATE DATABASE djibtout"
# Flyway applique ensuite les migrations et le DataSeeder cree des produits.

$ErrorActionPreference = 'Stop'

$env:SPRING_PROFILES_ACTIVE     = 'local'
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
Write-Host "Note : /actuator/health repond DOWN sans SMTP. Sonder /api/products." -ForegroundColor DarkGray

& "$PSScriptRoot\mvnw.cmd" spring-boot:run
exit $LASTEXITCODE
