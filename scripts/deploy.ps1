param(
    [ValidateSet('init', 'deploy', 'status', 'logs', 'stop')]
    [string]$Action = 'deploy'
)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Push-Location -LiteralPath $projectRoot
try {
    if ($Action -eq 'init') {
        foreach ($name in @('server', 'frontend')) {
            $target = Join-Path $projectRoot "deploy/$name.env"
            if (-not (Test-Path -LiteralPath $target)) {
                Copy-Item -LiteralPath "$target.example" -Destination $target
                Write-Host "Created deploy/$name.env"
            }
        }
        Write-Host 'Review deploy/server.env and deploy/frontend.env, then run: ./scripts/deploy.ps1 deploy'
        return
    }
    foreach ($name in @('server', 'frontend')) {
        if (-not (Test-Path -LiteralPath "deploy/$name.env")) {
            throw "Missing deploy/$name.env. Run ./scripts/deploy.ps1 init first."
        }
    }
    function Invoke-Docker {
        & docker @args
        if ($LASTEXITCODE -ne 0) { throw "Docker exited with code $LASTEXITCODE" }
    }
    $composeArgs = @('compose', '--env-file', "$projectRoot/deploy/server.env", '-f', "$projectRoot/compose.yaml")
    Invoke-Docker compose version
    Invoke-Docker @composeArgs config --quiet
    switch ($Action) {
        'deploy' {
            Invoke-Docker info
            Invoke-Docker @composeArgs build --pull
            Invoke-Docker @composeArgs up -d --wait --wait-timeout 120
            Invoke-Docker @composeArgs ps
        }
        'status' { Invoke-Docker @composeArgs ps }
        'logs' { Invoke-Docker @composeArgs logs --tail 100 -f web }
        'stop' { Invoke-Docker @composeArgs stop web }
    }
} finally {
    Pop-Location
}
