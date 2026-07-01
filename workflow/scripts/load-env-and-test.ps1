# load-env-and-test.ps1
# Script sementara untuk load env dan test VFlow Phase 1
# Jalankan: powershell -ExecutionPolicy Bypass -File workflow\scripts\load-env-and-test.ps1

$ProjectRoot = "c:\Laptop anyar\ISAL\Kuliah\Magang\Vastar\TugasMagang\smart-internship-management-system"
$VflowTestDir = "c:\Laptop anyar\ISAL\Kuliah\Magang\Vastar\TugasMagang\vflow-test"
$AdminScript = Join-Path $VflowTestDir "scripts\vflow-admin.js"
$WorkflowDir = Join-Path $ProjectRoot "workflow\vflow"
$SetupBat = Join-Path $ProjectRoot "setup-all.bat"

Write-Host "Loading env dari: $SetupBat"

# Parse SET baris dari bat
$envMap = @{}
Get-Content $SetupBat | ForEach-Object {
    if ($_ -match '^[\s]*set\s+([A-Z_][A-Z0-9_]*)=(.+)$') {
        $envMap[$Matches[1]] = $Matches[2].Trim()
    }
}

# Set ke process
foreach ($k in $envMap.Keys) {
    [System.Environment]::SetEnvironmentVariable($k, $envMap[$k], "Process")
}

$baseUrl   = $envMap["VFLOW_BASE_URL"]
$adminKey  = $envMap["VFLOW_ADMIN_KEY"]
$logToken  = $envMap["LOGSTREAM_TOKEN"]

Write-Host "VFLOW_BASE_URL = $baseUrl"
Write-Host "ADMIN_KEY set  = $($adminKey.Length -gt 0)"
Write-Host "LOG_TOKEN set  = $($logToken.Length -gt 0)"
Write-Host ""

# ─── Step 1: Provision minimal workflow ───────────────────────────────────────
Write-Host "=== Step 1: Provision 08-minimal.yaml ===" -ForegroundColor Cyan
$minimalYaml = Join-Path $WorkflowDir "08-minimal.yaml"

$env:VFLOW_BASE_URL  = $baseUrl
$env:VFLOW_ADMIN_KEY = $adminKey

Write-Host "File: $minimalYaml"
if (Test-Path $minimalYaml) {
    Write-Host "File exists OK"
    $provResult = & node $AdminScript "workflows" "provision" $minimalYaml 2>&1
    Write-Host "Provision result:"
    $provResult | ForEach-Object { Write-Host "  $_" }
} else {
    Write-Host "ERROR: File tidak ditemukan!" -ForegroundColor Red
}

Write-Host ""

# ─── Step 2: Cek health & routes ──────────────────────────────────────────────
Write-Host "=== Step 2: Health Check ===" -ForegroundColor Cyan
$healthResult = & node $AdminScript "status" 2>&1
Write-Host "Health check output:"
$healthResult | Select-Object -First 50 | ForEach-Object { Write-Host "  $_" }
Write-Host ""

# ─── Step 3: POST ke minimal webhook ──────────────────────────────────────────
Write-Host "=== Step 3: Smoke Test /webhook/kelompok1/minimal ===" -ForegroundColor Cyan
$webhookUrl = "$baseUrl/webhook/kelompok1/minimal"
Write-Host "POST: $webhookUrl"

try {
    $body = [System.Text.Encoding]::UTF8.GetBytes('{"test":true,"from":"kelompok1-provision-test"}')
    $wc = [System.Net.WebClient]::new()
    $wc.Headers["Content-Type"] = "application/json"
    $respBytes = $wc.UploadData($webhookUrl, "POST", $body)
    $respText = [System.Text.Encoding]::UTF8.GetString($respBytes)
    Write-Host "Response: $respText" -ForegroundColor Green
} catch {
    $errMsg = $_.Exception.Message
    Write-Host "HTTP Error: $errMsg" -ForegroundColor Yellow
    
    # Cek apakah ada response body
    if ($_.Exception.Response) {
        $resp = $_.Exception.Response
        Write-Host "HTTP Status: $($resp.StatusCode) ($([int]$resp.StatusCode))"
        Write-Host "Content-Type: $($resp.ContentType)"
        try {
            $stream = $resp.GetResponseStream()
            $reader = [System.IO.StreamReader]::new($stream)
            $errBody = $reader.ReadToEnd()
            Write-Host "Response body: $errBody"
        } catch {}
    }
}

Write-Host ""
Write-Host "=== Done! ===" -ForegroundColor Cyan
Write-Host "Log stream command:"
Write-Host "  curl -N -H `"Authorization: Bearer $logToken`" `"$baseUrl/logs/vflow-server?tail=50&follow=true`"" -ForegroundColor Gray
