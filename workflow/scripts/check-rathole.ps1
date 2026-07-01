# check-rathole.ps1
# Cek status rathole tunnel

$procs = Get-Process -Name 'rathole' -ErrorAction SilentlyContinue
if ($procs) {
    Write-Host "rathole RUNNING: $($procs.Count) process(es)" -ForegroundColor Green
    $procs | ForEach-Object { Write-Host "  PID: $($_.Id) Started: $($_.StartTime)" }
} else {
    Write-Host "rathole TIDAK berjalan!" -ForegroundColor Red
    Write-Host "Untuk mengaktifkan tunnel ke PostgreSQL local:"
    Write-Host "  cd 'c:\Laptop anyar\ISAL\Kuliah\Magang\Vastar\TugasMagang\vflow-test'"
    Write-Host "  .\rathole.exe .\kel1-client.toml"
    Write-Host ""
    Write-Host "Tanpa rathole, VFlow tidak bisa konek ke PostgreSQL dan workflow akan gagal!"
}
