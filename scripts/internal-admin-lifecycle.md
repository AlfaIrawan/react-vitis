# Internal administration lifecycle checks

These checks use mocked browser APIs or a disposable synthetic database. They do not authorize live account/grant changes, deployment, bootstrap retirement, or account deletion.

## Frontend checks

Run from the application directory:

- `node scripts/check-internal-users.cjs`: existing API, role-isolation and visibility checks.
- `node scripts/check-internal-lifecycle.cjs`: DOM interaction and transport checks. Requires an already installed `jsdom` package. If the test harness supplies it separately, set `ADMIN_TEST_JSDOM` to that package directory. No package is installed by the test.
- `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.app.json`.
- `node node_modules/eslint/bin/eslint.js src/pages/InternalUsersPage.tsx src/lib/api/internalUsersApi.ts src/lib/internalUserLifecycle.ts`.
- Run the normal application build with the repository-supported Node version.

The DOM checks cover network interruption, abort, 5xx and incomplete success responses; repeated submission; failed and unmatched directory refreshes; reload recovery; unavailable recovery storage; password omission from recovery metadata; definitive rejection; and root successor readiness.

## Recovery behavior

Before POST/PUT, the tab stores only the intended identity selector, application roles and enabled state, scoped to the current actor and application. Passwords and tokens are never stored by this recovery mechanism. When recovery storage is unavailable, no mutation is sent.

An uncertain result blocks further saves. Refreshing the directory may reconcile a matching requested state only when the returned grant revision is newer than the captured baseline. Unchanged saves are rejected without sending, and saves are blocked while a directory read is in flight. Earlier directory responses are invalidated before submission. An unavailable directory or a different state keeps the lock: absence is not evidence that a timed-out server transaction will never commit. An authorized identity administrator must investigate unresolved cases. No automatic retry, expiry-based unlock or cross-tab synchronization is provided.

Readiness is advisory at the last directory refresh. Only a durable, enabled, active, non-bootstrap application root with recorded fresh login and subsequent administration proof can be shown as ready for server verification. Server-side authorization and bootstrap/last-admin protections remain authoritative.

## Backend synthetic acceptance

The Identity Lite repository's `python scripts/check_internal_access_integration.py` creates its own temporary loopback PostgreSQL cluster and a separate synthetic lifecycle database. It covers the four applications, role changes, disable/re-enable, old-session rejection, fresh login, bootstrap successor proof and last-root protections. Do not point it at a configured application database.

These checks are not evidence that a deployed browser and backend have been accepted together. Live acceptance requires separately authorized test identities and grants.
