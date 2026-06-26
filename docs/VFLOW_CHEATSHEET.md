# Cheat Sheet Integrasi VFlow - Kelompok 1

Dokumen ini adalah pegangan singkat agar integrasi VFlow tidak tertukar dengan
workflow lokal di backend Express.

## Kesimpulan Utama

Referensi `/home/abraham/magang/aws-test-vflow` sudah cukup secara teknis untuk
mengerjakan integrasi. Kendala utama Kelompok 1 saat ini adalah belum
mengubah contoh dan dokumentasi tersebut menjadi workflow VFlow milik
Kelompok 1 yang benar-benar diprovision ke runtime.

Saat ini aplikasi Kelompok 1 masih menjalankan workflow secara lokal di
backend Express. Itu boleh untuk aplikasi web biasa, tetapi belum sama dengan
workflow yang berjalan di server VFlow.

## Keputusan Teknis Final

Pisahkan masalah teknis dari tugas implementasi:

- Secara teknis, referensi `/home/abraham/magang/aws-test-vflow` sudah cukup
  untuk membuat workflow VFlow yang valid.
- Tugas Kelompok 1 adalah menerjemahkan alur bisnis mereka ke format runtime
  VFlow, bukan menjalankan file `workflow/workflow.yaml` yang sekarang secara
  langsung.
- SQLite tidak boleh dipakai untuk integrasi VFlow.
- Jalur data runtime VFlow harus memakai PostgreSQL melalui tunnel Kelompok 1.
- HTTP boleh dipakai hanya untuk service HTTP yang memang bisa dijangkau VFlow,
  bukan sebagai cara membaca file SQLite lokal.
- Server VFlow dipakai bersama. Semua path, workflow id, pack id, dan rule id
  Kelompok 1 wajib memakai prefix `kelompok1`.
- Jangan hapus, unprovision, overwrite, atau mengubah workflow/pack/rule milik
  `kelompok2` atau `kelompok3`.

## Referensi Yang Dipakai

Gunakan file ini sebagai rujukan utama:

```text
/home/abraham/magang/aws-test-vflow/vflow-authoring-guide/06-pack-tier.md
/home/abraham/magang/aws-test-vflow/provision-pattern/066-hot-connection-pack-provision
```

Pakai polanya, tetapi jangan menyalin namespace contoh apa adanya. Semua
identifier harus diganti menjadi milik Kelompok 1, misalnya `kelompok1-*` atau
`/webhook/kelompok1/...`.

## Istilah Yang Wajib Jelas

| Istilah | Arti Praktis |
|---|---|
| VFlow runtime | Server workflow bersama di `https://sqavflow.vastar.id` |
| Workflow VWFD | File YAML runtime VFlow dengan `version`, `metadata`, `spec.activities`, `flows`, dan `variables` |
| Provision workflow | Upload workflow YAML ke VFlow agar webhook path aktif |
| Webhook path | URL yang dipanggil client, misalnya `/webhook/kelompok1/internship/register` |
| Connection pack | Definisi koneksi DB/NATS yang dipakai workflow VFlow |
| LogStream | Fasilitas baca log runtime, bukan alat untuk mengaktifkan workflow |

## Yang Salah Dipahami

### `example_order` bukan endpoint wajib

`example_order` atau `example_orders` di referensi adalah contoh nama domain
atau tabel. Itu bukan endpoint yang otomatis tersedia.

Jika POST ke path seperti:

```bash
https://sqavflow.vastar.id/webhook/example_order
```

atau:

```bash
https://sqavflow.vastar.id/webhook/kelompok1/example_order
```

dan muncul error:

```text
no workflow for path
```

artinya workflow untuk path tersebut memang belum ada atau belum diprovision.

### LogStream tidak memperbaiki workflow

LogStream hanya membaca log. Token LogStream benar tidak akan membuat workflow
aktif. Workflow aktif hanya setelah YAML VWFD yang valid diprovision ke VFlow.

## Status Repo Kelompok 1 Saat Ini

Hal yang sudah ada:

- Aplikasi web frontend dan backend Express.
- Workflow lokal di `backend/services/workflow.service.js`.
- Log lokal di tabel SQLite `workflow_logs`.
- Desain workflow konseptual di `workflow/workflow.yaml`.
- VRule YAML lokal di `workflow/vrules/`.
- Contoh workflow test VFlow di `workflow/vflow/01-register-test.yaml`.

Hal yang belum ada:

- Workflow bisnis VWFD runtime VFlow yang valid, selain contoh test.
- Webhook bisnis final Kelompok 1 di server VFlow.
- Script provision khusus Kelompok 1.
- Connection pack Kelompok 1.
- Smoke test yang memanggil webhook VFlow.
- Integrasi backend ke webhook VFlow.

Catatan penting: `workflow/workflow.yaml` dan `workflow/README.md` masih tetap
berguna sebagai desain proses bisnis. Namun file tersebut harus ditulis ulang
menjadi workflow VWFD sebelum bisa hidup di runtime VFlow.

## Target Minimal Yang Harus Dikerjakan

Jangan langsung memindahkan semua workflow. Ambil satu alur dulu sampai
berhasil end-to-end.

Target minimal yang disarankan:

1. Buat workflow test Kelompok 1 dengan path:

```text
/webhook/kelompok1/internship/register-test
```

2. Provision workflow ke VFlow.
3. POST payload sederhana ke webhook tersebut.
4. Pastikan response keluar dari VFlow.
5. Cek route sudah muncul di health VFlow.
6. Baru lanjutkan integrasi ke aplikasi backend.

## Bukti Step Minimal Sudah Diuji

Step minimal di atas sudah pernah diuji pada server SQA untuk namespace
Kelompok 1:

- Path test: `/webhook/kelompok1/internship/register-test`.
- Workflow test berhasil diprovision.
- POST payload sederhana berhasil mendapat response dari VFlow.
- LogStream dengan token lengkap berhasil menampilkan log eksekusi dengan
  `ok=true`.

Ini membuktikan bahwa runtime VFlow, admin API, webhook, dan LogStream bisa
dipakai. Yang belum selesai adalah migrasi workflow bisnis dan database
Kelompok 1 ke bentuk yang benar.

## Environment Wajib

Jalankan dari toolkit VFlow:

```bash
cd /home/abraham/magang/aws-test-vflow

export VFLOW_BASE_URL="https://sqavflow.vastar.id"
export VFLOW_TENANT="_default"
export VFLOW_ADMIN_KEY="<minta-ke-pembimbing>"
```

Untuk install connection pack:

```bash
export VFLOW_PACK_SECRET_KEY_B64="<minta-ke-pembimbing>"
```

Untuk LogStream:

```bash
export LOGSTREAM_TOKEN="<minta-ke-pembimbing>"
```

Jangan commit token ke GitHub. Token LogStream bisa berakhir dengan karakter
`=`, jadi copy nilainya utuh dan jangan dipotong.

## Cek Kesehatan Runtime

```bash
curl -sS "$VFLOW_BASE_URL/api/admin/health" | jq .
```

Cek route Kelompok 1:

```bash
curl -sS "$VFLOW_BASE_URL/api/admin/health" \
  | jq -r '.webhook_routes[]?[0]' \
  | grep 'kelompok1' || true
```

Jika belum ada output, berarti belum ada workflow Kelompok 1 yang aktif.

## Bentuk Workflow VFlow Yang Benar

File `workflow/workflow.yaml` Kelompok 1 saat ini masih konseptual, contohnya:

```yaml
system:
  name: Smart Internship Management System

event_flow:
  start: InternshipSubmitted
```

Format seperti itu tidak bisa langsung diprovision ke VFlow.

Workflow VFlow harus berbentuk seperti ini:

```yaml
version: "3.0"
metadata:
  id: kelompok1-internship-register-test
  name: "Kelompok 1 - Internship Register Test"
  dialect: vflow
  tags: [kelompok1, internship, test]

spec:
  activities:
    - id: trigger
      activity_type: Trigger
      trigger_config:
        trigger_type: webhook
        runtime_mode: fastpath
        webhook_config:
          path: /webhook/kelompok1/internship/register-test
          method: POST
        response_framing: length_prefixed
        end_activity: respond
      output_variable: trigger_payload

    - id: shape_response
      activity_type: Transform
      input_mappings:
        - target: response
          source:
            language: v-cel
            source: '{"status":"received","source":"vflow","name":trigger_payload.name,"nim":trigger_payload.nim,"email":trigger_payload.email}'
      output_variable: final_response

    - id: respond
      activity_type: EndTrigger
      end_trigger_config:
        trigger_ref: trigger
        final_response:
          language: spv1
          source: "$.final_response"

    - id: end
      activity_type: End

  flows:
    - { id: f01, from: { node: trigger }, to: { node: shape_response } }
    - { id: f02, from: { node: shape_response }, to: { node: respond } }
    - { id: f03, from: { node: respond }, to: { node: end } }

  variables:
    - { name: trigger_payload, type: object }
    - { name: final_response, type: object }
```

Simpan sebagai contoh:

```text
workflow/vflow/01-register-test.yaml
```

## Provision Workflow

Dari folder toolkit:

```bash
cd /home/abraham/magang/aws-test-vflow

./scripts/vflow-admin.sh workflows provision \
  /home/abraham/magang/kelompok1/workflow/vflow/01-register-test.yaml
```

Jika berhasil, cek route:

```bash
curl -sS "$VFLOW_BASE_URL/api/admin/health" \
  | jq -r '.webhook_routes[]?[0]' \
  | grep 'kelompok1'
```

## Trigger Webhook

```bash
curl -sS -X POST \
  "$VFLOW_BASE_URL/webhook/kelompok1/internship/register-test" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Budi",
    "nim": "22031234",
    "email": "budi@example.com"
  }' | jq .
```

Expected response minimal:

```json
{
  "status": "received",
  "source": "vflow",
  "name": "Budi",
  "nim": "22031234",
  "email": "budi@example.com"
}
```

Catatan: pada runtime SQA saat dokumen ini diuji, body JSON webhook terbaca
sebagai field top-level di `trigger_payload`, misalnya `trigger_payload.name`,
bukan `trigger_payload.body.name`.

## Membaca LogStream

```bash
curl -N \
  -H "Authorization: Bearer $LOGSTREAM_TOKEN" \
  "$VFLOW_BASE_URL/logs/vflow-server?tail=100&follow=true&timestamps=true"
```

Gunakan LogStream setelah workflow diprovision dan webhook dipanggil.

Jika LogStream error:

| Error | Arti |
|---|---|
| `missing bearer token` | Header `Authorization: Bearer ...` belum dikirim |
| `401 unauthorized` | Token salah atau expired |
| Tidak ada log terkait Kelompok 1 | Route belum dipanggil atau workflow belum aktif |

Jika token yang diberikan terlihat mirip tetapi LogStream tetap `401`, cek
lagi apakah karakter terakhir `=` ikut tersalin.

## Integrasi Database Yang Diizinkan

Untuk tugas ini, SQLite tidak dipakai untuk integrasi VFlow.

VFlow hanya boleh mengakses upstream service/database melalui endpoint yang bisa
dijangkau runtime VFlow. File SQLite lokal seperti `backend/data.sqlite` tidak
bisa dijadikan upstream VFlow karena file itu berada di node aplikasi, bukan di
node runtime VFlow.

Karena itu, Kelompok 1 harus mengganti database workflow dari SQLite ke
PostgreSQL yang diekspos lewat tunnel Kelompok 1.

Alurnya:

```text
Frontend/backend -> VFlow webhook -> DB connector -> database Kelompok 1
```

Syarat:

- Database harus PostgreSQL.
- Jalankan rathole client `kel1-client.toml`.
- DSN VFlow harus memakai:

```text
db-tunnel.vastar.id:15431
```

Contoh:

```bash
export KELOMPOK1_DATABASE_URL="postgresql://USER:PASS@db-tunnel.vastar.id:15431/DB_NAME"
```

Jangan pakai:

```text
localhost
127.0.0.1
```

di connection pack VFlow.

Catatan penting:

- `remote_addr` di file `kel1-client.toml` tetap `db-tunnel.vastar.id:15430`.
- DSN runtime VFlow untuk database Kelompok 1 memakai host publik
  `db-tunnel.vastar.id:15431`.
- Jangan memakai `localhost` atau `127.0.0.1` di connection pack VFlow.
- `localhost:5432` hanya boleh ada di sisi rathole client, karena itu menunjuk
  PostgreSQL lokal milik Kelompok 1.
- Jangan membuat workflow VFlow yang membaca `backend/data.sqlite`; runtime
  VFlow tidak berada di node aplikasi Kelompok 1.

## Migrasi Wajib Dari SQLite Ke PostgreSQL

Repo Kelompok 1 saat ini masih memakai SQLite di:

```text
backend/integrations/database.client.js
backend/config/db.config.js
backend/data.sqlite
```

Yang harus diperbaiki:

1. Tambahkan dependency PostgreSQL di backend:

```bash
cd backend
npm install pg
```

2. Ganti konfigurasi database agar membaca `DATABASE_URL`:

```bash
DATABASE_URL="postgresql://USER:PASS@127.0.0.1:5432/DB_NAME"
```

3. Pindahkan schema tabel dari SQLite ke PostgreSQL.

4. Sesuaikan SQL yang tidak kompatibel:

```text
SQLite ? placeholder       -> PostgreSQL $1, $2, $3
AUTOINCREMENT              -> SERIAL atau GENERATED ... AS IDENTITY
PRAGMA foreign_keys        -> hapus, PostgreSQL tidak memakai PRAGMA ini
datetime('now')            -> NOW()
```

5. Pastikan backend aplikasi lokal/deploy memakai PostgreSQL, bukan
   `backend/data.sqlite`.

6. Jalankan rathole client Kelompok 1:

```bash
rathole kel1-client.toml
```

7. Untuk connection pack VFlow, pakai DSN tunnel:

```bash
KELOMPOK1_DATABASE_URL="postgresql://USER:PASS@db-tunnel.vastar.id:15431/DB_NAME"
```

8. Baru buat workflow VFlow yang memakai:

```yaml
connector_ref: "pack://kelompok1-internship/primary"
```

Backend lokal boleh memakai `127.0.0.1:5432` karena backend berjalan di mesin
yang sama dengan PostgreSQL. Connection pack VFlow tidak boleh memakai host itu
karena runtime VFlow berada di server lain.

## Struktur Minimal Agar Setara Kelompok 3

Kelompok 1 tidak perlu menyalin domain Kelompok 3, tetapi struktur kerjanya
harus serupa:

```text
workflow/vflow/
  01-register-test.yaml
  02-registration.yaml
  pack.yaml
  schemas/
    registration-request.yaml
  rules/
    registration-policy.vdicl
scripts/
  smoke-vflow.sh
  provision-vflow.sh
```

Minimal yang harus ada sebelum dianggap selesai:

- Satu workflow test tanpa DB yang bisa diprovision dan dipanggil.
- Satu workflow bisnis dengan prefix `/webhook/kelompok1/...`.
- Connection pack PostgreSQL dengan id/prefix `kelompok1`.
- Script provision yang hanya menyentuh file Kelompok 1.
- Smoke test `curl` yang bisa dijalankan ulang.
- Catatan env var tanpa nilai rahasia.

## Batas Aman Di Server Bersama

Yang boleh dilakukan Kelompok 1:

- Provision workflow dengan `metadata.id` prefix `kelompok1`.
- Install/update pack dengan id prefix `kelompok1`.
- Baca LogStream untuk memastikan request Kelompok 1 berjalan.
- Cek health route lalu filter `kelompok1`.

Yang tidak boleh dilakukan:

- Unprovision workflow yang tidak berprefix `kelompok1`.
- Menghapus pack/rule milik kelompok lain.
- Mengubah path webhook kelompok lain.
- Memakai credential tunnel kelompok lain.

## Checklist Bebas Hambatan

Sebelum bertanya bahwa VFlow tidak berjalan, pastikan semua ini sudah benar:

- Workflow YAML memakai format VWFD, bukan YAML konseptual.
- `metadata.id` unik dan memakai prefix `kelompok1`.
- `webhook_config.path` memakai prefix `/webhook/kelompok1/...`.
- Workflow sudah diprovision dengan `VFLOW_ADMIN_KEY`.
- Route muncul di `api/admin/health`.
- POST dilakukan ke path webhook yang sama persis.
- Jika memakai VRule runtime, rule pack sudah dicompile.
- Connection pack PostgreSQL sudah diinstall.
- DSN connection pack memakai `db-tunnel.vastar.id:15431`.
- Backend aplikasi sudah tidak bergantung pada `backend/data.sqlite`.
- LogStream dipakai untuk membaca log, bukan untuk mengaktifkan workflow.

## Error Cepat

| Error | Penyebab Umum | Tindakan |
|---|---|---|
| `no workflow for path` | Workflow belum diprovision atau path salah | Cek `webhook_config.path`, provision ulang, cek route health |
| `unauthorized: invalid or missing admin API key` | `VFLOW_ADMIN_KEY` belum diset/salah | Set ulang env key |
| `missing bearer token` | Request LogStream tanpa bearer token | Kirim header `Authorization: Bearer $LOGSTREAM_TOKEN` |
| `graph error: workflow failed` | Workflow aktif tapi node di dalamnya gagal | Baca LogStream dan cek activity yang gagal |
| Connector DB gagal | Tunnel mati, DSN salah, schema belum ada | Jalankan rathole, cek DSN, cek tabel |
| Response kosong/tidak sesuai | `EndTrigger` atau `final_response` salah | Cek `end_activity`, `trigger_ref`, dan output variable |

## Rekomendasi Urutan Kerja

1. Buat workflow test tanpa DB.
2. Provision dan trigger sampai response VFlow berhasil.
3. Tambahkan validasi payload.
4. Migrasikan backend dari SQLite ke PostgreSQL.
5. Jalankan rathole client Kelompok 1.
6. Install connection pack PostgreSQL Kelompok 1.
7. Tambahkan satu workflow bisnis, misalnya registration.
8. Buat smoke test `curl`.
9. Baru integrasikan frontend/backend.

Jangan mulai dari semua workflow sekaligus. Satu webhook yang benar-benar hidup
di VFlow lebih bernilai daripada banyak file YAML yang belum bisa diprovision.
