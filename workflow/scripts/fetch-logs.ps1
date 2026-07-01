# fetch-logs.ps1
# Fetch VFlow logstream untuk melihat internal errors

$bat = Get-Content (Join-Path $PSScriptRoot "..\..\setup-all.bat")
$envMap = @{}
$bat | ForEach-Object {
    if ($_ -match '^\s*set\s+([A-Z_][A-Z0-9_]*)=(.+)$') {
        $envMap[$Matches[1]] = $Matches[2].Trim()
    }
}
$baseUrl   = $envMap["VFLOW_BASE_URL"]
$logToken  = $envMap["LOGSTREAM_TOKEN"]
$adminKey  = $envMap["VFLOW_ADMIN_KEY"]

Write-Host "Base URL: $baseUrl"
Write-Host "LogToken set: $($logToken.Length -gt 0)"
Write-Host ""

# ─── Coba fetch log ─────────────────────────────────────────────────────────
$logUrl = "${baseUrl}/logs/vflow-server?tail=50"
Write-Host "GET: $logUrl"

try {
    $req = [System.Net.HttpWebRequest]::Create($logUrl)
    $req.Method = "GET"
    $req.Headers["Authorization"] = "Bearer $logToken"
    $req.Timeout = 12000
    $req.ReadWriteTimeout = 12000
    
    $resp = $req.GetResponse()
    Write-Host "HTTP: $([int]$resp.StatusCode) $($resp.StatusCode)"
    Write-Host "ContentType: $($resp.ContentType)"
    
    $stream = $resp.GetResponseStream()
    $reader = [System.IO.StreamReader]::new($stream)
    $text = $reader.ReadToEnd()
    
    if ($text.Length -gt 0) {
        Write-Host "Log output ($($text.Length) chars):"
        Write-Host $text
    } else {
        Write-Host "Response kosong (stream closed without data)"
    }
} catch [System.Net.WebException] {
    $we = $_
    Write-Host "HTTP Error: $($we.Exception.Message)"
    if ($we.Exception.Response) {
        Write-Host "Status: $([int]$we.Exception.Response.StatusCode)"
        $s = $we.Exception.Response.GetResponseStream()
        $r = [System.IO.StreamReader]::new($s)
        Write-Host "Body: $($r.ReadToEnd())"
    }
} catch {
    Write-Host "Error: $_"
}

Write-Host ""

# ─── Test GET ke /webhook/kelompok1/minimal (harusnya 405) ────────────────────
Write-Host "--- Test GET /webhook/kelompok1/minimal ---"
$testUrl = "${baseUrl}/webhook/kelompok1/minimal"
try {
    $req2 = [System.Net.HttpWebRequest]::Create($testUrl)
    $req2.Method = "GET"
    $req2.Timeout = 8000
    try {
        $resp2 = $req2.GetResponse()
        Write-Host "GET status: $([int]$resp2.StatusCode) (expected 405)"
    } catch [System.Net.WebException] {
        $we2 = $_.Exception
        if ($we2.Response) {
            Write-Host "GET status: $([int]$we2.Response.StatusCode) (expected 405)" -ForegroundColor Green
        } else {
            Write-Host "GET network error: $($we2.Message)"
        }
    }
} catch {
    Write-Host "GET error: $_"
}

Write-Host ""

# ─── Ambil logstream via node (native http yang lebih baik) ──────────────────
Write-Host "--- Fetch log via Node.js (SSE-aware) ---"
$adminScript = "c:\Laptop anyar\ISAL\Kuliah\Magang\Vastar\TugasMagang\vflow-test\scripts\vflow-admin.js"

$env:VFLOW_BASE_URL  = $baseUrl
$env:VFLOW_ADMIN_KEY = $adminKey

# Admin health
$healthOut = & node $adminScript "status" 2>&1
$healthText = $healthOut -join "`n"

# Extract kelompok1 routes lebih detail
Write-Host ""
Write-Host "=== Kelompok1 Routes dari Health ===" -ForegroundColor Cyan
$lines = $healthText -split "`n"
for ($i = 0; $i -lt $lines.Length; $i++) {
    $line = $lines[$i]
    if ($line -match "kelompok1|k1/") {
        # Print also the next line (workflow ID)
        Write-Host "  $($line.Trim())" -ForegroundColor Green
        if ($i + 1 -lt $lines.Length) {
            Write-Host "    $($lines[$i+1].Trim())" -ForegroundColor DarkGray
        }
    }
}

Write-Host ""
Write-Host "=== Workflows terdaftar (filter kelompok1) ===" -ForegroundColor Cyan
$env:VFLOW_TENANT = "_default"
$wfOut = & node $adminScript "workflows" "list" 2>&1
$wfText = $wfOut -join "`n"
$wfLines = $wfText -split "`n" | Where-Object { $_ -match "kelompok1|k1-" }
$wfLines | ForEach-Object { Write-Host "  $_" -ForegroundColor Green }

Write-Host ""
Write-Host "Done." -ForegroundColor Cyan
