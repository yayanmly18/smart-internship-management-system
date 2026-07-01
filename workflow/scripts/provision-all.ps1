# provision-all.ps1
# Script PowerShell untuk provision semua workflow VFlow Kelompok 1
# Usage: .\workflow\scripts\provision-all.ps1
# Jalankan dari root project: smart-internship-management-system\

param(
    [switch]$SkipPack,      # Skip install connection pack
    [switch]$SkipSmoke,     # Skip smoke test
    [switch]$Force          # Force re-provision even if already active
)

$ErrorActionPreference = "Stop"

# ─── WARNA ────────────────────────────────────────────────────────────────────
function Write-OK    { param($msg) Write-Host "  OK  $msg" -ForegroundColor Green }
function Write-WARN  { param($msg) Write-Host "  WARN $msg" -ForegroundColor Yellow }
function Write-ERR   { param($msg) Write-Host "  ERR  $msg" -ForegroundColor Red }
function Write-INFO  { param($msg) Write-Host "  >>   $msg" -ForegroundColor Cyan }
function Write-HEAD  { param($msg) Write-Host "`n=== $msg ===" -ForegroundColor Magenta }

# ─── LOKASI ───────────────────────────────────────────────────────────────────
$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$VflowTestDir = Join-Path (Split-Path -Parent $ProjectRoot) "vflow-test"
$AdminScript  = Join-Path $VflowTestDir "scripts\vflow-admin.js"
$WorkflowDir  = Join-Path $ProjectRoot "workflow\vflow"
$InstallJson  = Join-Path $VflowTestDir "install-kel1.json"

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Kelompok 1 -- VFlow Provision Script (Windows PS)"        -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# ─── LOAD ENV dari setup-all.bat ─────────────────────────────────────────────
Write-HEAD "Loading environment variables"

$SetupBat = Join-Path $ProjectRoot "setup-all.bat"
if (-not (Test-Path $SetupBat)) {
    Write-ERR "setup-all.bat not found at: $SetupBat"
    exit 1
}

# Parse env vars dari setup-all.bat (baca baris SET langsung, tanpa jalankan bat)
$envVars = @{}
Get-Content $SetupBat | ForEach-Object {
    if ($_ -match '^\s*set\s+([A-Z_][A-Z0-9_]*)=(.+)$') {
        $envVars[$Matches[1]] = $Matches[2].Trim()
    }
}

# Set ke current process env
foreach ($kv in $envVars.GetEnumerator()) {
    [System.Environment]::SetEnvironmentVariable($kv.Key, $kv.Value, "Process")
}

$VFLOW_BASE_URL          = $env:VFLOW_BASE_URL
$VFLOW_ADMIN_KEY         = $env:VFLOW_ADMIN_KEY
$LOGSTREAM_TOKEN         = $env:LOGSTREAM_TOKEN

if (-not $VFLOW_BASE_URL) {
    Write-ERR "VFLOW_BASE_URL tidak ditemukan di setup-all.bat"
    exit 1
}
if (-not $VFLOW_ADMIN_KEY) {
    Write-ERR "VFLOW_ADMIN_KEY tidak ditemukan di setup-all.bat"
    exit 1
}

Write-OK "VFLOW_BASE_URL: $VFLOW_BASE_URL"
Write-OK "VFLOW_ADMIN_KEY: [REDACTED]"
Write-OK "LOGSTREAM_TOKEN: [REDACTED]"

# ─── VERIFIKASI TOOLS ─────────────────────────────────────────────────────────
Write-HEAD "Verifikasi Tools"

if (-not (Test-Path $AdminScript)) {
    Write-ERR "vflow-admin.js tidak ditemukan: $AdminScript"
    Write-INFO "Pastikan folder vflow-test ada di sebelah project root"
    exit 1
}
Write-OK "vflow-admin.js: $AdminScript"

try {
    $nodeVer = & node --version 2>&1
    Write-OK "Node.js: $nodeVer"
} catch {
    Write-ERR "Node.js tidak ditemukan. Install dulu dari nodejs.org"
    exit 1
}

# ─── FUNGSI HELPER ────────────────────────────────────────────────────────────
function Invoke-VFlowAdmin {
    param([string[]]$CmdArgs)
    return & node $AdminScript @CmdArgs 2>&1
}

function Provision-Workflow {
    param([string]$Name, [string]$FilePath)
    if (-not (Test-Path $FilePath)) {
        Write-WARN "$Name : file tidak ditemukan ($FilePath) -- SKIP"
        return $false
    }
    Write-INFO "Provisioning: $Name"
    try {
        $out = Invoke-VFlowAdmin "workflows", "provision", $FilePath
        Write-OK "$Name -- berhasil diprovision"
        return $true
    } catch {
        Write-ERR "$Name -- gagal: $_"
        return $false
    }
}

function Test-Webhook {
    param(
        [string]$Path,
        [string]$Payload = '{"test":true}',
        [string]$Label = ""
    )
    $url = "$VFLOW_BASE_URL$Path"
    $label = if ($Label) { $Label } else { $Path }
    Write-INFO "Smoke: POST $label"
    try {
        $body = [System.Text.Encoding]::UTF8.GetBytes($Payload)
        $webClient = [System.Net.WebClient]::new()
        $webClient.Headers["Content-Type"] = "application/json"
        $webClient.Headers["User-Agent"]   = "kelompok1-smoketest/1.0"
        $response = $webClient.UploadData($url, "POST", $body)
        $respText = [System.Text.Encoding]::UTF8.GetString($response)
        if ($respText) {
            Write-OK "OK ($Path) -- Response: $($respText.Substring(0, [Math]::Min(200, $respText.Length)))"
            return $true
        } else {
            Write-WARN "Response kosong! ($Path)"
            return $false
        }
    } catch {
        Write-WARN "Gagal ($Path): $($_.Exception.Message)"
        return $false
    }
}

# ─── CEK HEALTH VFLOW ────────────────────────────────────────────────────────
Write-HEAD "Cek Health VFlow"
try {
    $healthOut = Invoke-VFlowAdmin "status"
    Write-OK "VFlow reachable"
    # Cari routes kelompok1
    $healthText = $healthOut -join "`n"
    $kel1Lines = ($healthText -split "`n") | Where-Object { $_ -like "*kelompok1*" -or $_ -like "*k1/*" }
    if ($kel1Lines) {
        Write-INFO "Route kelompok1 yang sudah aktif:"
        $kel1Lines | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
    } else {
        Write-INFO "Belum ada route kelompok1 yang aktif (akan diprovision sekarang)"
    }
} catch {
    Write-ERR "VFlow tidak bisa dihubungi: $_"
    Write-INFO "Cek koneksi internet dan VFLOW_BASE_URL"
    exit 1
}

# ─── PHASE 1: PROVISION WORKFLOW TEST ───────────────────────────────────────
Write-HEAD "Phase 1: Provision Test Workflows"

$results = @{}
$results["minimal"]       = Provision-Workflow "Minimal"            "$WorkflowDir\08-minimal.yaml"
$results["echo-standard"] = Provision-Workflow "Echo Standard"      "$WorkflowDir\00-test-echo-standard.yaml"
$results["register-test"] = Provision-Workflow "Register Test"      "$WorkflowDir\01-register-test.yaml"

# ─── PHASE 2: INSTALL CONNECTION PACK ────────────────────────────────────────
if (-not $SkipPack) {
    Write-HEAD "Phase 2: Install Connection Pack"
    
    if (-not (Test-Path $InstallJson)) {
        Write-WARN "install-kel1.json tidak ditemukan: $InstallJson"
        Write-INFO "Jalankan: cd vflow-test && node encrypt-kel1.js"
        $results["pack"] = $false
    } else {
        Write-INFO "Install pack dari: $InstallJson"
        try {
            $packBody = Get-Content $InstallJson -Raw -Encoding UTF8
            $packBytes = [System.Text.Encoding]::UTF8.GetBytes($packBody)
            $wc = [System.Net.WebClient]::new()
            $wc.Headers["x-api-key"]    = $VFLOW_ADMIN_KEY
            $wc.Headers["content-type"] = "application/json"
            $packRespBytes = $wc.UploadData("$VFLOW_BASE_URL/api/admin/pack/install", "POST", $packBytes)
            $packResp = [System.Text.Encoding]::UTF8.GetString($packRespBytes)
            Write-OK "Pack installed: $($packResp.Substring(0, [Math]::Min(300, $packResp.Length)))"
            $results["pack"] = $true
        } catch {
            Write-ERR "Pack install gagal: $($_.Exception.Message)"
            if ($_.Exception.Response) {
                $respStream = $_.Exception.Response.GetResponseStream()
                $reader = [System.IO.StreamReader]::new($respStream)
                Write-INFO "Error detail: $($reader.ReadToEnd())"
            }
            $results["pack"] = $false
        }
    }
} else {
    Write-WARN "SkipPack: lewati install connection pack"
}

# ─── PHASE 3: PROVISION WORKFLOW BISNIS ──────────────────────────────────────
Write-HEAD "Phase 3: Provision Business Workflows"

$results["registration"]    = Provision-Workflow "Registration (DB)"    "$WorkflowDir\02-registration.yaml"
$results["eligibility"]     = Provision-Workflow "Eligibility"          "$WorkflowDir\03-eligibility.yaml"
$results["admin-verify"]    = Provision-Workflow "Admin Verification"   "$WorkflowDir\04-admin-verification.yaml"
$results["approval"]        = Provision-Workflow "Supervisor Approval"  "$WorkflowDir\05-supervisor-approval.yaml"
$results["placement"]       = Provision-Workflow "Company Placement"    "$WorkflowDir\06-company-placement.yaml"
$results["progress"]        = Provision-Workflow "Progress Monitoring"  "$WorkflowDir\07-progress-monitoring.yaml"
$results["evaluation"]      = Provision-Workflow "Performance Eval"     "$WorkflowDir\08-performance-evaluation.yaml"
$results["certification"]   = Provision-Workflow "Certification"        "$WorkflowDir\09-certification.yaml"

# ─── SMOKE TESTS ─────────────────────────────────────────────────────────────
if (-not $SkipSmoke) {
    Write-HEAD "Smoke Tests"

    # Test 1: Minimal webhook (paling penting -- diagnosa utama)
    $s1 = Test-Webhook "/webhook/kelompok1/minimal"               '{"test":true}'               "Minimal"
    
    # Test 2: Register test (tanpa DB)
    $s2 = Test-Webhook "/webhook/kelompok1/internship/register-test" `
        '{"name":"Test Kel1","nim":"22030001","email":"test@kel1.com"}'  "Register-Test"

    Write-INFO "Logstream untuk debug lebih lanjut:"
    Write-Host "  curl -N -H ""Authorization: Bearer $LOGSTREAM_TOKEN"" ""$VFLOW_BASE_URL/logs/vflow-server?tail=50&follow=true""" -ForegroundColor DarkGray
}

# ─── SUMMARY ──────────────────────────────────────────────────────────────────
Write-HEAD "Summary"

$ok = 0; $fail = 0
foreach ($kv in $results.GetEnumerator() | Sort-Object Key) {
    if ($kv.Value -eq $true) {
        Write-OK "$($kv.Key)"
        $ok++
    } else {
        Write-ERR "$($kv.Key)"
        $fail++
    }
}

Write-Host ""
Write-Host "  Berhasil: $ok  |  Gagal/Skip: $fail" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Yellow" })
Write-Host ""
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Done! Cek health: node vflow-test/scripts/vflow-admin.js status" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
