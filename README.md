# Vitis — react-vitis

**Integration & Process Orchestration Management** — antarmuka web (React + Vite) dengan pola UI/UX Digicorp yang selaras antar platform, namun **bukan** platform AI Lifecycle.

## Capability Vitis

| Area | Deskripsi |
|------|-----------|
| **Workspaces** | Proyek sebagai ruang kerja orkestrasi |
| **Integrations** | Konektor ke API, layanan, sumber data |
| **Workflows** | Definisi alur proses |
| **Executions** | Menjalankan / memantau instansi alur |
| **Schedules / Policies** | Placeholder untuk jadwal & kebijakan integrasi |

Menu global **Models, Feedback, Governance, Portfolio** (AI Lifecycle) **tidak** tersedia; URL lama dialihkan ke workspace atau monitor.

## Menjalankan

```bash
npm install
npm run dev
```

Login demo: `admin@vitis.local` / `admin`

## Build

Karena path folder induk mengandung karakter `&`, di Windows gunakan perintah dalam tanda kutip:

```cmd
cd /d "...\Integration & Process Orchestration Management\react-vitis"
npm run build
```

## Pemisahan data lokal

- `localStorage`: `vitis_session`, `vitis-project-storage`, `vitis-connector-storage`, `vitis_workflows_*`, notifikasi/todo app ID Vitis.

## Struktur

Frontend React + Vite dengan penyesuaian `App.tsx`, sidebar, dashboard, workspace proyek, dan branding **Vitis**.
