# deep-debug-webhook.ps1
# Debug mendalam response kosong dari VFlow webhook
# Jalankan: powershell -ExecutionPolicy Bypass -File workflow\scripts\deep-debug-webhook.ps1

$ProjectRoot = "c:\Laptop anyar\ISAL\Kuliah\Magang\Vastar\TugasMagang\smart-internship-management-system"
$VflowTestDir = "c:\Laptop anyar\ISAL\Kuliah\Magang\Vastar\TugasMagang\vflow-test"
$AdminScript = Join-Path $VflowTestDir "scripts\vflow-admin.js"
$WorkflowDir  = Join-Path $ProjectRoot "workflow\vflow"

# Load env
$SetupBat = Join-Path $ProjectRoot "setup-all.bat"
$envMap = @{}
Get-Content $SetupBat | ForEach-Object {
    if ($_ -match '^[\s]*set\s+([A-Z_][A-Z0-9_]*)=(.+)$') {
        $envMap[$Matches[1]] = $Matches[2].Trim()
    }
}
foreach ($k in $envMap.Keys) {
    [System.Environment]::SetEnvironmentVariable($k, $envMap[$k], "Process")
}

$baseUrl  = $envMap["VFLOW_BASE_URL"]
$adminKey = $envMap["VFLOW_ADMIN_KEY"]
$logToken = $envMap["LOGSTREAM_TOKEN"]

Write-Host "=== VFlow Webhook Deep Debug ===" -ForegroundColor Cyan
Write-Host "Base URL: $baseUrl"
Write-Host ""

# ─── Test 1: HEAD request ke health ──────────────────────────────────────────
Write-Host "--- Test 1: Admin Health ---" -ForegroundColor Yellow
try {
    $healthOut = & node $AdminScript "status" 2>&1
    $healthText = $healthOut -join "`n"
    # Cari kelompok1 routes
    $lines = $healthText -split "`n" | Where-Object { $_ -match "kelompok1|k1/" }
    Write-Host "Route kelompok1 aktif:"
    if ($lines) {
        $lines | ForEach-Object { Write-Host "  $_" -ForegroundColor Green }
    } else {
        Write-Host "  (tidak ada)" -ForegroundColor Red
    }
} catch {
    Write-Host "Health check error: $_" -ForegroundColor Red
}
Write-Host ""

# ─── Test 2: GET ke webhook path (harusnya 405) ───────────────────────────────
Write-Host "--- Test 2: GET /webhook/kelompok1/minimal (expect 405) ---" -ForegroundColor Yellow
$testUrl = "$baseUrl/webhook/kelompok1/minimal"
try {
    $req = [System.Net.HttpWebRequest]::Create($testUrl)
    $req.Method = "GET"
    $req.Timeout = 10000
    try {
        $resp = $req.GetResponse()
        Write-Host "GET Response: HTTP $([int]$resp.StatusCode) $($resp.StatusCode)"
        Write-Host "Content-Type: $($resp.ContentType)"
    } catch [System.Net.WebException] {
        $we = $_
        if ($we.Response) {
            Write-Host "GET Response: HTTP $([int]$we.Response.StatusCode) $($we.Response.StatusCode)" -ForegroundColor Green
            Write-Host "Content-Type: $($we.Response.ContentType)"
            # Read body
            $stream = $we.Response.GetResponseStream()
            $reader = [System.IO.StreamReader]::new($stream)
            $body = $reader.ReadToEnd()
            Write-Host "Body: $body"
        } else {
            Write-Host "GET Error: $($we.Message)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "GET Error: $_" -ForegroundColor Red
}
Write-Host ""

# ─── Test 3: POST raw HttpWebRequest dengan full response info ────────────────
Write-Host "--- Test 3: POST /webhook/kelompok1/minimal (raw HttpWebRequest) ---" -ForegroundColor Yellow
try {
    $req = [System.Net.HttpWebRequest]::Create($testUrl)
    $req.Method = "POST"
    $req.ContentType = "application/json"
    $req.Timeout = 15000
    $req.ReadWriteTimeout = 15000
    $req.AllowAutoRedirect = $false
    
    $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes('{"test":true,"from":"deep-debug"}')
    $req.ContentLength = $bodyBytes.Length
    $reqStream = $req.GetRequestStream()
    $reqStream.Write($bodyBytes, 0, $bodyBytes.Length)
    $reqStream.Close()
    
    $resp = $req.GetResponse()
    $statusCode = [int]$resp.StatusCode
    $contentType = $resp.ContentType
    $contentLength = $resp.ContentLength
    $transferEncoding = $resp.Headers["Transfer-Encoding"]
    
    Write-Host "HTTP Status: $statusCode" -ForegroundColor Green
    Write-Host "Content-Type: $contentType"
    Write-Host "Content-Length: $contentLength"
    Write-Host "Transfer-Encoding: $transferEncoding"
    Write-Host "All Headers:"
    foreach ($h in $resp.Headers.AllKeys) {
        Write-Host "  $h : $($resp.Headers[$h])"
    }
    
    # Read response body
    $stream = $resp.GetResponseStream()
    $ms = [System.IO.MemoryStream]::new()
    $buf = [byte[]]::new(4096)
    $totalRead = 0
    $attempts = 0
    do {
        $n = $stream.Read($buf, 0, $buf.Length)
        if ($n -gt 0) {
            $ms.Write($buf, 0, $n)
            $totalRead += $n
        }
        $attempts++
    } while ($n -gt 0 -and $attempts -lt 100)
    
    $rawBytes = $ms.ToArray()
    Write-Host ""
    Write-Host "Response body bytes: $($rawBytes.Length)"
    
    if ($rawBytes.Length -gt 0) {
        $bodyText = [System.Text.Encoding]::UTF8.GetString($rawBytes)
        Write-Host "Body text: $bodyText" -ForegroundColor Green
        
        # Show hex of first 64 bytes
        $hexStr = ($rawBytes | Select-Object -First 64 | ForEach-Object { $_.ToString("X2") }) -join " "
        Write-Host "First 64 bytes HEX: $hexStr"
    } else {
        Write-Host "Body is EMPTY (0 bytes)" -ForegroundColor Red
        Write-Host ""
        Write-Host "DIAGNOSIS: VFlow merespons HTTP 200 tapi body kosong."
        Write-Host "Kemungkinan:"
        Write-Host "  1. Workflow 08-minimal.yaml tidak punya response_framing dan"
        Write-Host "     VFlow menggunakan streaming yang stream langsung ditutup"
        Write-Host "  2. Coba workflow dengan response_framing: chunked"
        Write-Host "  3. Atau baca LogStream untuk melihat error internal"
    }
    
    $stream.Close()
    $resp.Close()
} catch [System.Net.WebException] {
    $we = $_
    if ($we.Response) {
        Write-Host "HTTP Error: $([int]$we.Response.StatusCode) $($we.Response.StatusCode)" -ForegroundColor Yellow
        $stream = $we.Response.GetResponseStream()
        $reader = [System.IO.StreamReader]::new($stream)
        $errBody = $reader.ReadToEnd()
        Write-Host "Error Body: $errBody"
    } else {
        Write-Host "Network Error: $($we.Message)" -ForegroundColor Red
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# ─── Test 4: POST ke echo-standard (dengan response_framing: chunked) ─────────
Write-Host "--- Test 4: POST /webhook/kelompok1/test/echo-standard ---" -ForegroundColor Yellow
$echoUrl = "$baseUrl/webhook/kelompok1/test/echo-standard"

# Cek apakah echo-standard sudah diprovision
Write-Host "Provisioning echo-standard dulu..."
$env:VFLOW_BASE_URL  = $baseUrl
$env:VFLOW_ADMIN_KEY = $adminKey
$echoYaml = Join-Path $WorkflowDir "00-test-echo-standard.yaml"
if (Test-Path $echoYaml) {
    $provOut = & node $AdminScript "workflows" "provision" $echoYaml 2>&1
    Write-Host "Provision: $($provOut | Select-Object -First 3 | Out-String)" -ForegroundColor Gray
} else {
    Write-Host "File tidak ditemukan: $echoYaml" -ForegroundColor Red
}
Write-Host ""
Start-Sleep -Seconds 2

try {
    $req2 = [System.Net.HttpWebRequest]::Create($echoUrl)
    $req2.Method = "POST"
    $req2.ContentType = "application/json"
    $req2.Timeout = 15000
    
    $bodyBytes2 = [System.Text.Encoding]::UTF8.GetBytes('{"test":true}')
    $req2.ContentLength = $bodyBytes2.Length
    $reqStream2 = $req2.GetRequestStream()
    $reqStream2.Write($bodyBytes2, 0, $bodyBytes2.Length)
    $reqStream2.Close()
    
    $resp2 = $req2.GetResponse()
    Write-Host "Echo HTTP Status: $([int]$resp2.StatusCode)"
    Write-Host "Echo Content-Type: $($resp2.ContentType)"
    Write-Host "Echo Transfer-Encoding: $($resp2.Headers["Transfer-Encoding"])"
    
    $stream2 = $resp2.GetResponseStream()
    $ms2 = [System.IO.MemoryStream]::new()
    $buf2 = [byte[]]::new(4096)
    do {
        $n2 = $stream2.Read($buf2, 0, $buf2.Length)
        if ($n2 -gt 0) { $ms2.Write($buf2, 0, $n2) }
    } while ($n2 -gt 0)
    
    $rawBytes2 = $ms2.ToArray()
    Write-Host "Echo body bytes: $($rawBytes2.Length)"
    if ($rawBytes2.Length -gt 0) {
        Write-Host "Echo body: $([System.Text.Encoding]::UTF8.GetString($rawBytes2))" -ForegroundColor Green
        $hex2 = ($rawBytes2 | Select-Object -First 32 | ForEach-Object { $_.ToString("X2") }) -join " "
        Write-Host "First 32 bytes HEX: $hex2"
    } else {
        Write-Host "Echo body EMPTY too!" -ForegroundColor Red
    }
    $stream2.Close()
    $resp2.Close()
} catch [System.Net.WebException] {
    $we2 = $_
    if ($we2.Response) {
        Write-Host "HTTP $([int]$we2.Response.StatusCode): $($we2.Response.StatusCode)"
        $stream2e = $we2.Response.GetResponseStream()
        $r2 = [System.IO.StreamReader]::new($stream2e)
        Write-Host "Body: $($r2.ReadToEnd())"
    } else {
        Write-Host "Error: $($we2.Message)" -ForegroundColor Red
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Debug selesai ===" -ForegroundColor Cyan
Write-Host "Lihat LogStream untuk detail internal VFlow:"
Write-Host "  curl -N -H `"Authorization: Bearer $logToken`" `"$baseUrl/logs/vflow-server?tail=100&follow=true`"" -ForegroundColor Gray
