# PowerShell script to install and configure PostgreSQL
Write-Host "=== PostgreSQL Installation Script ===" -ForegroundColor Cyan

# Check if PostgreSQL is already installed
$pgDir = "C:\Program Files\PostgreSQL"
if (Test-Path $pgDir) {
    $versions = Get-ChildItem $pgDir | Where-Object { $_.PSIsContainer }
    Write-Host "Found PostgreSQL versions:" -ForegroundColor Yellow
    foreach ($v in $versions) {
        Write-Host "  - $($v.Name)" -ForegroundColor Green
    }
} else {
    Write-Host "PostgreSQL not found in C:\Program Files\PostgreSQL" -ForegroundColor Red
    
    # Try to install via winget
    Write-Host "Attempting to install PostgreSQL via winget..." -ForegroundColor Yellow
    $result = winget install --id=PostgreSQL.PostgreSQL --silent 2>&1
    Write-Host "Install result: $result" -ForegroundColor Cyan
}

# If installed, set up the database
$pgVersions = Get-ChildItem "C:\Program Files\PostgreSQL" | Where-Object { $_.PSIsContainer }
if ($pgVersions) {
    $latestVersion = ($pgVersions | Sort-Object {[double]($_.Name -replace 'PostgreSQL', '')} | Select-Object -Last 1)
    $pgBin = "C:\Program Files\PostgreSQL\$($latestVersion.Name)\bin"
    
    if (Test-Path $pgBin) {
        Write-Host "Using PostgreSQL $($latestVersion.Name)" -ForegroundColor Green
        Write-Host "Path: $pgBin" -ForegroundColor Cyan
        
        # Add to path temporarily
        $oldPath = $env:PATH
        $env:PATH = $pgBin + ";" + $env:PATH
        
        # Start the service
        Write-Host "Starting PostgreSQL service..." -ForegroundColor Yellow
        Try {
            Start-Service postgresql -ErrorAction Stop
            Write-Host "PostgreSQL service started" -ForegroundColor Green
        } Catch {
            Write-Host "Could not start service: $_" -ForegroundColor Red
            # Try manual start
            & "$pgBin\pg_ctl" start -D "C:\Program Files\PostgreSQL\$($latestVersion.Name)\data" -l "C:\Program Files\PostgreSQL\$($latestVersion.Name)\log" -w -ErrorAction Stop
        }
        
        # Create the database
        Write-Host "Creating database 'trolyao'..." -ForegroundColor Yellow
        $pgBin\createdb -U postgres trolyao 2>&1
        
        # Set DATABASE_URL
        $dbsUrl = "postgres://postgres@localhost:5432/trolyao"
        [System.Environment]::SetEnvironmentVariable("DATABASE_URL", $dbsUrl, "User")
        Write-Host "DATABASE_URL set to: $dbsUrl" -ForegroundColor Green
        
        # Run migration
        Write-Host "Running migration..." -ForegroundColor Yellow
        $migrationResult = npm run db:migrate 2>&1
        Write-Host "Migration result: $migrationResult" -ForegroundColor Cyan
    }
}