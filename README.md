# Vitis — react-vitis

Vitis adalah frontend React dan Vite untuk integrasi dan orkestrasi proses. Rebuild dimulai dari salinan utuh pohon Git React Tectona revisi `31192d0`. Setelah seleksi modul, fitur Vitis dipulihkan dari backup sebelum rebuild.

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
| Shell Tectona, topbar, launcher desktop dan mobile, tema, indikator loading, dan penanganan error | Diadopsi dengan navigasi dan branding Vitis. Skala viewport dan latar video memakai implementasi Tectona |
| Project management, idea backlog, portfolio, planning, resource, dan dokumentasi Tectona | Dikeluarkan karena berfokus pada pengelolaan proyek Tectona |
| Integrasi, workflow automation, dan monitoring | Workspace proyek, katalog konektor, designer, dan process monitor dipulihkan dari Vitis. Canvas memakai pratinjau garis dan routing dari Tectona. Runtime Tectona memerlukan format dan cakupan workspace tersendiri |
| Login dan register | Struktur formulir Tectona disambungkan ke handler Identity Lite Vitis. Profil, notifikasi, dan todo dipulihkan dari Vitis |
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
- URL editor lama `/projects/:projectId/workflows/:workflowId` dan penyimpanan workflow serta grup dipertahankan. Buka workflow pada profil browser dan origin yang sama dengan tempat ia disimpan. Port HTTP `5182` dan URL HTTPS Dev mempunyai penyimpanan browser terpisah.

## Struktur

Frontend React + Vite dengan penyesuaian `App.tsx`, sidebar, dashboard, workspace proyek, dan branding **Vitis**.


## Internal application access

Sign-in only: administrators provision identities and application entitlements. Public registration and access-request routes show access denied. Password, configured identity providers, and enrolled passkeys remain supported.

The app uses `vitis-spa` (`VITE_VITIS_OIDC_CLIENT_ID`). Do not reuse a Tectona client configuration. Existing sessions must pass `POST /api/identity-lite/v1/internal-access/check` before protected content is mounted; unavailable checks fail closed. Deploy the matching Identity Lite entitlement API and provision grants before releasing this frontend. No existing identity or grant data is migrated by this frontend change.

Application administrators can open **Users & Access** from the app launcher (`/internal-users`). Navigation and the page require current app admin/root roles from the live entitlement check. Provision new identities (federated-only or optional local password), grant an existing UUID, and edit roles/enabled access. Root/bootstrap/last-admin constraints are enforced by the server. No global identity search or user deletion is exposed.

Vitis projects require an explicitly selected authorized workspace. Configure `VITE_VITIS_AUTHZ_APP_ID` with the Vitis-owned WAC app UUID, matching server `INTERNAL_APP_WAC_IDS`; no default/Tectona UUID is used. The list/create selector reads only the signed-in subject’s active memberships. Empty mapping or membership shows administrator setup guidance. No membership is created automatically. Workspace IDs are displayed until a scoped workspace-name API is available. Resource calls use authenticated transport; new project owner is the current subject.
