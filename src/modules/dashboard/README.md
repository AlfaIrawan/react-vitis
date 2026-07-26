# Module 1: Dashboard

**Status**: ✅ Implemented

**Location**: `dashboard/`

## 🎯 Module Objective

Build the **Vitis Dashboard** as the landing page and executive overview of integration and process orchestration. This dashboard provides high-level visibility without operational control.

## 🧩 Core Principles (WAJIB)

- ✅ **Read-only** - All data is read-only, no mutations
- ✅ **No actions** - No buttons that mutate state
- ✅ **Executive-friendly** - Clean UI optimized for first 10-second understanding
- ✅ **High-level visibility** - Provides overview, not operational control
- ✅ **No overlap** - Does not duplicate functionality from other modules

## 📐 Dashboard Sections

### 1️⃣ Executive AI Health Snapshot (Top Summary Cards)

Displays key metrics at a glance:
- **Total Models** (by environment: Production, Staging, Development)
- **Active Deployments** (currently serving requests)
- **Training Runs** (last 24h / 7d)
- **Active Alerts** (drift, errors, compliance)
- **Overall AI Health Status** (Healthy / Attention / Critical)

Each card is clickable and navigates to the relevant module.

### 2️⃣ AI Lifecycle Overview (Visual Summary)

Horizontal lifecycle stages with counters:
- **Data** → Data preparation
- **Training** → Model training
- **Model** → Model registry
- **Deployment** → Model deployment
- **Inference** → Live inference
- **Feedback** → Ground truth
- **Governance** → Policy & audit

Each stage shows a counter badge and is clickable, navigating to its module.

### 3️⃣ Live Signals (Read-only KPIs)

Real-time metrics with lightweight sparkline charts:
- **Requests (24h)** - Total requests in last 24 hours
- **Avg Latency (P95)** - 95th percentile latency
- **Error Rate** - Percentage of failed requests
- **Drift Warnings** - Count of active drift warnings

### 4️⃣ Attention & Alerts Summary

Highlights items requiring attention:
- **Models with Active Drift Warnings** - Links to drift alerts page
- **Deployments with Elevated Error Rate** - Links to deployments page
- **Feedback Awaiting Verification** - Links to feedback page
- **Compliance Status** - Links to governance page

Each item is clickable and navigates to detailed views.

### 5️⃣ Quick Navigation Shortcuts

Fast access to common views:
- View Active Runs
- Review Drift Alerts
- Open Model Registry
- Go to Portfolio View

## 🧱 Structure

```
src/modules/dashboard/
├── components/
│   ├── ExecutiveHealthSnapshot.tsx
│   ├── LifecycleOverview.tsx
│   ├── LiveSignals.tsx
│   ├── AttentionAlertsSummary.tsx
│   └── QuickNavigationShortcuts.tsx
├── pages/
│   └── DashboardPage.tsx
├── store/
│   └── dashboardStore.ts
├── index.ts
└── README.md
```

## 🔗 Data Aggregation

The dashboard store aggregates data from:
- **Model Store** - Model counts, status
- **Deployment Store** - Active deployments, metrics, drift alerts
- **Run Store** - Training runs count
- **Feedback Store** - Pending feedback count
- **Governance Store** - Compliance status

All data is computed on-demand via `getMetrics()` method.

## 🎨 Design

- **Glassmorphism** - Consistent with app design system
- **Compact density** - High information density
- **Executive-friendly** - Clean, professional layout
- **Optimized for quick understanding** - Key metrics visible in < 30 seconds

## 📝 Routes

- `/` - Dashboard page (landing page)

## ⚠️ Important Notes

- **Read-only** - No state mutations, no actions
- **No overlap** - Does not duplicate functionality from Modules 5-11
- **Links only** - All navigation uses links, no buttons that perform actions
- **Aggregated view** - Provides overview, detailed views are in respective modules
