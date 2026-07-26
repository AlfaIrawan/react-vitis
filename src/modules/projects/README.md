# Module 2: Projects & Workspace

## 🎯 Tujuan Modul

Module ini berfungsi sebagai **container konseptual** untuk training AI, di mana:

- **Project = workspace**
- **Run akan selalu berada di dalam Project**
- Belum ada training logic, engine call, atau metrics

## 🚫 Batasan Keras (WAJIB DIPATUHI)

❌ **Jangan implement training**
❌ **Jangan implement run execution**
❌ **Jangan panggil API engine / CLI**
❌ **Jangan tampilkan metrics** (loss, accuracy, dll)
❌ **Jangan buat asumsi framework ML**

Ini murni **UI + state management level workspace**.

## 🧭 Posisi Modul di Sidebar

Menu baru di sidebar:
- Dashboard
- **Projects** ← MODULE 2 (aktif)
- Runs (placeholder, jangan diubah)
- Settings (placeholder, jangan diubah)

⚠️ **Jangan ubah konsep placeholder Runs & Settings dari Module 1.**

## 🧩 Ruang Lingkup MODULE 2

### 1️⃣ Project List Page

Halaman untuk menampilkan seluruh project.

**Fitur:**
- List project (card atau table, compact)
- Field minimal:
  - Project Name
  - Description (optional)
  - Created At
  - Status (Active / Archived)
- Search project
- Empty state: "Belum ada project. Buat project untuk mulai mengelola training AI."
- UI: Glassmorphism card, compact density
- Action minimal (View / Archive)

### 2️⃣ Create Project (Modal / Page)

Form sederhana untuk membuat project.

**Field:**
- Project Name (required)
- Description (optional)
- Tags (optional, free text)

**Catatan:**
- Validasi sederhana (required name)
- Setelah create → redirect ke Project Detail

### 3️⃣ Project Detail Page

Halaman detail satu project.

**Isi halaman:**
- Project header: Name, Description, Created date
- Section "Runs" → placeholder text: "Training runs akan muncul di modul Training (Module 4–5)."
- Section "Connectors" → placeholder: "Connector akan dikaitkan di modul Connector Management."

⚠️ **Jangan tampilkan list run asli. Ini hanya anchor konseptual.**

### 4️⃣ Project State Management

- Project disimpan di state lokal / mock store
- Tidak perlu backend
- Gunakan Zustand / local mock data

## 🧱 Struktur Folder

```
src/modules/projects/
├── pages/
│   ├── ProjectListPage.tsx
│   ├── ProjectCreatePage.tsx
│   └── ProjectDetailPage.tsx
├── components/
│   ├── ProjectCard.tsx
│   └── EmptyState.tsx
├── store/
│   └── projectStore.ts
├── index.ts
└── README.md
```

## 🎨 UI / UX RULES

- Glassmorphism
- Compact density
- Konsisten dengan Core Shell
- Jangan tambahkan layout baru (pakai AppShell existing)
- Gunakan shadcn/ui + Tailwind
- Jangan buat visual yang "terlalu hidup" (ini workspace, bukan monitoring)

## 📝 Copy & Wording

Gunakan wording yang jujur & enterprise:

- "Project adalah workspace untuk mengelola training AI."
- "Training Run akan tersedia di modul Training."

Hindari kata:
- "Start training"
- "Execute"
- "Monitor"

## ❗ Reminder Konseptual

- **Project ≠ Run**
- **Project ≠ Training**
- **Project = container & boundary**
- Semua training logic **BELUM BOLEH ADA** di modul ini

## 🔗 Hubungan Project dengan Run

- Run akan selalu berada di dalam Project
- Setiap training run akan dikaitkan dengan project
- Project adalah workspace container untuk training activities
- Training runs akan diimplementasikan di modul Training (Module 4–5)
