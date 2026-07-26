# Module 9: Feedback & Ground Truth

## 🎯 Tujuan Modul

Module ini menyediakan **observability pasca deployment** dan **feedback collection** sebagai referensi peningkatan model di siklus berikutnya.

**Prinsip Desain:**
- ✅ **Non-blocking** (boleh kosong)
- ✅ **Read-only** terhadap inference history
- ✅ **Feedback ≠ label final** (status terpisah)
- ✅ **Enterprise & audit-friendly**
- ❌ **No ML logic** di frontend
- ❌ **TIDAK mengontrol model**
- ❌ **TIDAK memicu proses peningkatan model otomatis**

## 🧩 Ruang Lingkup MODULE 9

### 1️⃣ Feedback List Page

Halaman utama untuk melihat feedback yang terkumpul.

**Fitur:**
- ✅ Tabel dengan kolom: Timestamp, Request ID, Model Name, Model Version, Prediction, Feedback Type, Status, Source
- ✅ Filter by: Model, Version, Status, Type, Source
- ✅ Search by Request ID
- ✅ Pagination
- ✅ Read-only table (click untuk detail)

### 2️⃣ Feedback Detail Page

Detail satu feedback item.

**Section:**
- ✅ Inference Summary (Request ID, Timestamp, Model + Version, Prediction)
- ✅ Feedback Information (Type, Value, Comment, Source)
- ✅ Verification Status (Pending/Verified/Rejected, Verified by, Verified timestamp)
- ✅ Traceability (Linked Run, Linked Deployment) - read-only

**Tidak ada:**
- ❌ Tombol untuk memicu proses peningkatan model
- ❌ Aksi yang memicu proses apapun
- ❌ Edit prediction

### 3️⃣ Feedback Submission (Optional UI)

Form sederhana & opsional untuk mengumpulkan feedback.

**Field:**
- Request ID (required)
- Model Name (required)
- Model Version (required)
- Prediction (required)
- Feedback Type (Correct/Incorrect/Outcome) (required)
- Optional label/outcome
- Optional comment

**Catatan:**
- ⚠️ TIDAK WAJIB diaktifkan
- Boleh hanya disiapkan UI-nya

### 4️⃣ Summary Panel (Read-only)

Panel ringkasan agregat.

**KPI Cards:**
- Total feedback collected
- % verified
- % incorrect predictions
- Feedback per model version

**Tidak perlu:**
- ❌ Grafik kompleks
- ❌ Chart interaktif

## 🎨 UI / UX Guidelines

- ✅ Glassmorphism design
- ✅ Density compact
- ✅ Clean enterprise look
- ✅ Status colors:
  - Green (Verified / Correct)
  - Yellow (Pending)
  - Red (Incorrect / Rejected)
- ❌ Tidak ada CTA besar
- ❌ Tidak ada destructive action

## 🔒 Governance Rules

- ✅ Semua feedback **immutable**
- ✅ Verification status hanya **simulasi UI** (tanpa backend logic)
- ❌ Tidak ada edit prediction
- ❌ Tidak ada auto action

## 🧱 Struktur Folder

```
src/modules/feedback/
├── pages/
│   ├── FeedbackListPage.tsx
│   ├── FeedbackDetailPage.tsx
│   └── FeedbackSubmissionPage.tsx
├── components/
│   ├── FeedbackStatusBadge.tsx
│   ├── FeedbackTypeBadge.tsx
│   └── FeedbackSummaryPanel.tsx
├── store/
│   └── feedbackStore.ts
├── index.ts
└── README.md
```

## 📝 Routes

- `/feedback` - Feedback list page
- `/feedback/:id` - Feedback detail page
- `/feedback/submit` - Feedback submission page (optional)

## 🔗 Hubungan dengan Modul Lain

- **Module 8 (Deployment)**: Feedback dikaitkan dengan deployment via `linkedDeploymentId`
- **Module 4 (Runs)**: Feedback dikaitkan dengan run via `linkedRunId`
- **Module 7 (Models)**: Feedback dikaitkan dengan model name & version

## ✅ Definition of Done (DoD)

Module 9 dianggap **DONE** jika:

- ✅ Feedback list page tampil stabil
- ✅ Detail feedback bisa dibuka
- ✅ Filter & search berfungsi (mock)
- ✅ Tidak ada aksi operasional model
- ✅ UI konsisten dengan modul lain
- ✅ Aman ditampilkan ke stakeholder non-teknis
