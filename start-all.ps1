# start-all.ps1 - Start all Car Rental App services (frontend + backend) in parallel

$ErrorActionPreference = "Stop"

$services = @(
    @{ Name = "frontend"; Path = "frontend"; Port = 3000 },
    @{ Name = "backend"; Path = "backend/gateway-service"; Port = 3001 }
)

function Get-NetworkAddresses($port) {
    $addresses = @()
    $ifaces = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne '127.0.0.1' -and $_.PrefixOrigin -ne 'WellKnown' }
    foreach ($iface in $ifaces) {
        $addresses += "http://$($iface.IPAddress):$port"
    }
    return $addresses
}

Write-Host "Starting all Car Rental App services...`n" -ForegroundColor Cyan

foreach ($svc in $services) {
    $svcName = $svc.Name
    $svcPath = $svc.Path
    $svcPort = $svc.Port
    Write-Host "Launching $svcName on port $svcPort..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$svcPath'; npm run dev" -WindowStyle Minimized
    Start-Sleep -Milliseconds 500
    Write-Host "  Local:   http://localhost:$svcPort" -ForegroundColor Green
    $netAddrs = Get-NetworkAddresses $svcPort
    foreach ($addr in $netAddrs) {
        Write-Host "  Network: $addr" -ForegroundColor Green
    }
    Write-Host ""
}

Write-Host "All services started in new PowerShell windows. Press Ctrl+C to stop this script.\n" -ForegroundColor Cyan

powershell -ExecutionPolicy Bypass -File .\start-all.ps1
