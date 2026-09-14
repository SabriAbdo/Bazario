param(
    [string]$BaseUrl = "http://localhost:8081",
    [string]$AdminUsername = "admin",
    [string]$AdminPassword = "Admin@123"
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not (Test-Path "$scriptDir\.venv")) {
    python -m venv "$scriptDir\.venv"
}

& "$scriptDir\.venv\Scripts\pip.exe" install -q -r "$scriptDir\requirements.txt"

$env:BAZARIO_API_BASE_URL = $BaseUrl
$env:BAZARIO_ADMIN_USERNAME = $AdminUsername
$env:BAZARIO_ADMIN_PASSWORD = $AdminPassword

# Make sure the backend is reachable before fuzzing it
try {
    Invoke-WebRequest -UseBasicParsing -Uri "$BaseUrl/v3/api-docs" -TimeoutSec 5 | Out-Null
} catch {
    Write-Error "Backend not reachable at $BaseUrl (start it with 'mvn spring-boot:run' first)."
    exit 1
}

& "$scriptDir\.venv\Scripts\python.exe" -m pytest "$scriptDir\test_api_schema.py" -v --tb=short
