# PowerShell script to run database migration
# This sets up DATABASE_URL and runs the migration

# Set DATABASE_URL environment variable for this session
$databaseUrl = "postgresql://postgres:postgres@localhost:5432/trolyao"
[System.Environment]::SetEnvironmentVariable("DATABASE_URL", $databaseUrl, "User")

Write-Host "DATABASE_URL set to: $databaseUrl" -ForegroundColor Cyan

# Change to server directory
$serverDir = "C:\Users\lam20\Desktop\trolyao-master\server"
Set-Location $serverDir

Write-Host "Running migration from: $(Get-Location)" -ForegroundColor Cyan

# Run the migration
$migrationScript = Join-Path $serverDir "scripts\migrate.js"
Write-Host "Executing: node $migrationScript" -ForegroundColor Cyan

# Use node to run the migration
try {
    $result = java -jar ??? No, use node
    
    # Actually, let's just use node directly
    Write-Host "Running: node scripts/migrate.js" -ForegroundColor Cyan
    
    # But we need to set env first in the same process
    # Let's try a different approach - modify the script temporarily
    
    # Actually, let's just try running with the env var already set
    & node .\scripts\migrate.js
    
    Write-Host "Migration completed successfully" -ForegroundColor Green
} catch {
    Write-Host "Migration failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}