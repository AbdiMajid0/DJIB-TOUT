$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
docker compose -f (Join-Path $root 'docker-compose.test.yml') up -d --wait
if ($LASTEXITCODE -ne 0) {
    throw 'Docker Desktop doit être démarré pour lancer PostgreSQL de test.'
}
try {
    $env:SPRING_PROFILES_ACTIVE = 'test'
    & (Join-Path $root 'mvnw.cmd') test
    if ($LASTEXITCODE -ne 0) { throw 'La suite de tests a échoué.' }
} finally {
    docker compose -f (Join-Path $root 'docker-compose.test.yml') down --volumes
}
