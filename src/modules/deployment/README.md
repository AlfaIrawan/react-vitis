# Module 8 — Deployment & Inference Monitoring

## Tujuan Modul

Module ini digunakan untuk:

- ✅ Mengaktifkan model AI yang sudah berstatus Production
- ✅ Memantau performa inferensi secara real-time
- ✅ Menyediakan observability pasca-deployment

## Ruang Lingkup

### Deployment Management
- ✅ Activate / Pause / Retire deployments
- ✅ Hanya model berstatus Production yang bisa dideploy
- ✅ Endpoint read-only (observational)

### Inference Metrics
- ✅ Request volume (24h history)
- ✅ Success & error rate
- ✅ Average, P95, P99 latency
- ✅ Confidence distribution (optional)

### Inference Logs
- ✅ Read-only log viewer
- ✅ Timestamp, model version, status, latency
- ✅ Error messages (jika ada)
- ✅ Search & filter capabilities

### Data & Prediction Drift
- ✅ Drift status: Normal / Warning / Alert
- ✅ Alert severity: Info / Warning / Critical
- ✅ Observational & governance-oriented

## Aturan Penting

❌ **Tidak boleh ada konfigurasi training**
❌ **Tidak boleh edit model atau hyperparameter**
❌ **Tidak mengatur infra (Kubernetes, autoscaling, dsb)**

✅ **Hanya model berstatus Production yang bisa dideploy**
✅ **Semua informasi bersifat observasional & governance-oriented**

## Struktur Halaman

### 1. Deployments Page (`/deployments`)
- List semua deployments
- Model name & version
- Deployment status (Active / Paused / Retired)
- Endpoint (read-only)
- Environment
- Actions: Activate / Pause / Retire

### 2. Inference Monitoring (`/deployments/:id/monitoring`)
- Request volume chart (24h)
- Success & error rate metrics
- Average, P95, P99 latency
- Confidence distribution visualization
- Links to Logs & Drift pages

### 3. Inference Logs (`/deployments/:id/logs`)
- Read-only log table
- Timestamp, model version, status
- Latency, request ID
- Error message (jika ada)
- Search & filter by status

### 4. Drift & Alerts (`/deployments/:id/drift` or `/deployments/drift`)
- Drift status badges
- Alert severity indicators
- Alert messages (non-technical)
- Detection & resolution timestamps

## Data & State Management

### Store: `deploymentStore.ts`
- Zustand store dengan persist middleware
- Mock data untuk development/demo
- Deployment state management (activate/pause/retire)
- Metrics & logs queries
- Alert filtering

### Mock Data
- Deployments: 2 sample deployments (1 active, 1 paused)
- Metrics: 24h history (hourly samples)
- Logs: 100 recent entries per deployment
- Alerts: 3 sample drift alerts

## UI & UX

### Design Principles
- ✅ Modern, professional design
- ✅ Glassmorphism styling (consistent with Module 5 & 7)
- ✅ Compact density
- ✅ Read-only for sensitive data
- ✅ Enterprise-oriented mental model

### Components
- `DeploymentCard` - Card display dengan actions
- `DeploymentStatusBadge` - Status indicator
- `DriftStatusBadge` - Drift status indicator
- `AlertSeverityBadge` - Alert severity indicator
- `EmptyState` - Empty state placeholder

## Routes

```typescript
/deployments                          // Deployments list page
/deployments/:id/monitoring           // Inference monitoring
/deployments/:id/logs                 // Inference logs
/deployments/:id/drift                // Drift & alerts (specific deployment)
/deployments/drift                    // All drift & alerts
```

## Integration

### With Module 7 (Model Registry)
- Deployments hanya untuk model dengan status `production`
- Deployments menggunakan model ID & version ID
- Link dari Model Detail page bisa ditambahkan di masa depan

### Navigation
- Added to Sidebar navigation with Rocket icon
- Accessible from Models page for Production models

## Catatan Teknis

1. **Mock Data**: Semua data menggunakan mock/dummy data untuk UI visualization
2. **No Backend**: Tidak perlu backend real, fokus pada struktur & UX
3. **Observational**: Semua data read-only, tidak ada konfigurasi training
4. **Governance-Oriented**: Informasi untuk observability & compliance

## Future Enhancements (Out of Scope)

- Real-time WebSocket updates
- Advanced drift detection algorithms
- Custom alert rules configuration
- Deployment history & audit logs
- A/B testing capabilities
- Canary deployments
