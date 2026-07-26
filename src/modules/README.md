# Modules Structure

This directory contains feature modules for the AI Training Monitoring Console.

## Module 1: Core Shell & Navigation ✅

**Status**: Implemented

**Location**: `core-shell/`

**Components**:
- `Sidebar` - Collapsible navigation sidebar
- `Topbar` - Global search, environment indicator, user menu, theme toggle
- `AppLayout` - Main layout wrapper
- `PlaceholderPage` - Placeholder component for Module 1 routes

**Routes**:
- `/` - Dashboard (placeholder)
- `/runs` - Runs (placeholder navigation entry - NOT a module)
- `/settings` - Settings (placeholder navigation entry - NOT a module)

**Important Notes**:
- "Runs" and "Settings" are **placeholder navigation entries only** in Module 1
- They have **no domain logic, no submenus, and no implied capabilities**
- "Runs" represents a future **Training module** entry point
- "Settings" represents a future **System/Cross-cutting module** entry point
- They exist solely as navigation placeholders for future modules

## Module 2: Projects & Workspace ✅

**Status**: Implemented

**Location**: `projects/`

**Purpose**: Container konseptual untuk training AI, di mana Project = workspace dan Run akan selalu berada di dalam Project.

**Components**:
- `ProjectListPage` - List semua project dengan search dan filter
- `ProjectCreatePage` - Form untuk membuat project baru
- `ProjectDetailPage` - Detail project dengan placeholder untuk Runs dan Connectors
- `ProjectCard` - Card component untuk menampilkan project
- `EmptyState` - Empty state component

**Store**:
- `projectStore` - Zustand store untuk state management (local/mock data)

**Routes**:
- `/projects` - Project list page
- `/projects/create` - Create project page
- `/projects/:id` - Project detail page

**Key Features**:
- ✅ Project CRUD operations (local state)
- ✅ Search and filter projects
- ✅ Archive/unarchive projects
- ✅ Tags support
- ✅ Placeholder sections for Runs and Connectors

**Hard Boundaries** (WAJIB DIPATUHI):
- ❌ No training logic
- ❌ No run execution
- ❌ No engine API/CLI calls
- ❌ No metrics display
- ❌ No ML framework assumptions

**Conceptual Relationship**:
- Project = workspace container
- Run akan selalu berada di dalam Project
- Training runs akan diimplementasikan di modul Training (Module 4–5)

## Future Modules (Not Implemented)

### Training Module (will implement /runs functionality)
**Location**: `training/` (to be created)
- Route: `/runs` (will replace placeholder)
- Features: Training run management, monitoring, control

### System/Cross-cutting Module (will implement /settings functionality)
**Location**: `system/` (to be created)
- Route: `/settings` (will replace placeholder)
- Features: Application settings, system configuration, cross-cutting concerns

### Module 3: Analytics
**Location**: `analytics/` (to be created)
- Route: `/analytics`
- Features: Training metrics visualization, performance charts

### Module 4: Reports
**Location**: `reports/` (to be created)
- Route: `/reports`
- Features: Report generation, export functionality

### Module 5: Engines Management
**Location**: `engines/` (to be created)
- Route: `/engines`
- Features: Engine registration, configuration, status monitoring

### Module 6: Data Sources
**Location**: `data-sources/` (to be created)
- Route: `/data`
- Features: Data source connections, validation

### Module 7: Models
**Location**: `models/` (to be created)
- Route: `/models`
- Features: Model registry, version management

### Module 8: History
**Location**: `history/` (to be created)
- Route: `/history`
- Features: Run history, audit logs

## Module Development Guidelines

1. Each module should be self-contained in its own directory
2. Modules should export their routes for integration in `App.tsx`
3. Use the `PlaceholderPage` pattern for initial implementation
4. Follow the glassmorphism design system established in Module 1
5. Maintain compact, high-density information display
