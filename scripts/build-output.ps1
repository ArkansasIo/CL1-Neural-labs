# Build the release exe and copy it into the project output/ folder.
Write-Host "[1/3] Building release..." -ForegroundColor Cyan
Push-Location "$PSScriptRoot\..\rust_backend"
cargo build --release
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "cargo build failed" }
Pop-Location

Write-Host "[2/3] Creating output folder..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force "$PSScriptRoot\..\output" | Out-Null

Write-Host "[3/3] Copying exe..." -ForegroundColor Cyan
Copy-Item "$PSScriptRoot\..\rust_backend\target\release\cl1-server.exe" "$PSScriptRoot\..\output\" -Force
Get-Item "$PSScriptRoot\..\output\cl1-server.exe" | Format-Table Name, Length, LastWriteTime
Write-Host "Done. Run with: .\output\cl1-server.exe" -ForegroundColor Green
