# Vitis — react-vitis

Vitis adalah frontend React dan Vite untuk integrasi dan orkestrasi proses. Rebuild ini memakai fondasi UI React Tectona dari revisi `ebcb6fc` dan memulihkan fitur Vitis dari backup sebelum migrasi.

## Capability Vitis

| Area | Deskripsi |
|------|-----------|
| **Workspaces** | Proyek sebagai ruang kerja orkestrasi |
| **Integrations** | Konektor ke API, layanan, sumber data |
| **Workflows** | Definisi alur proses |
| **Executions** | Meninjau status dan hasil eksekusi yang tersedia di Vitis |
| **Schedules / Policies** | Placeholder untuk jadwal & kebijakan integrasi |

## Hasil asesmen baseline

| Bagian | Keputusan |
|---|---|
| Tema, komponen UI, indikator loading, dan penanganan error Tectona | Dipakai sebagai fondasi UI Vitis, dengan nama dan aset Vitis |
| Project management, idea backlog, portfolio, planning, resource, dan dokumentasi Tectona | Dikeluarkan karena berfokus pada pengelolaan proyek Tectona |
| Integrasi, workflow automation, dan monitoring Tectona | Kebutuhannya relevan. Vitis mempertahankan implementasi dan data kontraknya sendiri agar workspace, konektor, workflow, dan riwayat yang sudah ada tetap terbaca |
| Login, register, profil, notifikasi, dan todo | Dipulihkan dari Vitis. Kontrak Identity Lite yang dipakai bersama tetap menggunakan konfigurasi backend yang sudah ada |
| Model registry, deployment model, feedback, dan governance AI | Source halaman dan aksi AI lifecycle dibuang. Adapter dataset, trainer, dan compute dipertahankan untuk kompatibilitas rekaman eksekusi lama |

## Menjalankan

```bash
npm install
npm run dev
```

Login menggunakan akun Identity Lite sesuai konfigurasi environment Vitis.

## Build

CI/CD TeamCity dan deployment Docker ke server Linux: lihat [panduan TeamCity](deploy/TEAMCITY.md).

Karena path folder induk mengandung karakter `&`, di Windows gunakan perintah dalam tanda kutip:

```cmd
cd /d "...\Integration & Process Orchestration Management\react-vitis"
npm run build
```

## Pemisahan data lokal

- `localStorage`: `vitis_session`, `vitis-project-storage`, `vitis-connector-storage`, `vitis_workflows_*`, notifikasi/todo app ID Vitis.

## Struktur

Frontend React + Vite dengan penyesuaian `App.tsx`, sidebar, dashboard, workspace proyek, dan branding **Vitis**.
