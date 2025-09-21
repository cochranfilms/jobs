## September 2025 cleanup note

- Namespaced community board helpers to prevent collisions with chat UI handlers.
- Added lazy initialization guards for `messagingService` in `user-portal.html` to avoid null derefs when posting before chat is initialized.
- Added a safe fallback implementation for `generateBusinessIntelligenceInsights` used by analytics until a dedicated module is introduced.

No data migrations required. LocalStorage key for the community board remains `cochranMessages`.
### Jan 2025 — Messaging System Implementation

- Files: `user-portal.html`, `admin-dashboard.html`, `messaging-service.js`, `firestore.rules`
- Changes:
  - Added comprehensive real-time messaging system with Firebase integration
  - Created `directMessages` Firestore collection with proper security rules
  - Implemented file attachment support using Firebase Storage
  - Added read receipts and message status tracking
  - Created admin messaging interface for user management
  - Added responsive design for mobile compatibility
  - Implemented search functionality for messages
- Database Structure:
  - `directMessages/{conversationId}`: Conversation metadata with participants array
  - `directMessages/{conversationId}/messages/{messageId}`: Individual messages with attachments
  - `messageAttachments/{conversationId}/{messageId}/{fileName}`: File attachments in Storage
- Security: Users can only access conversations they're part of; admins can access all conversations
- Testing: Use `messaging-test.js` for automated testing of all messaging features

### 2025-09-13 — Admin Messaging Enhancements (Broadcast/Search/Modal/AI Theme)

- Rollback guidance:
  - Broadcast: In `admin-dashboard.html`, replace the body of `adminBroadcastMessage()` with the previous console stub. No Firestore schema changes.
  - Search: Remove the call to `MessagingService.searchMessages()` inside `adminSearchMessages()`. No indexes added.
  - Image Modal: Remove `adminOpenImageModal()` and the `onclick` image binding in message template.
  - AI Theme: Delete the `.ai-theme` style block injected in `<head>` and the small script that adds the class to `documentElement`/`body`.
  - All changes are additive and scoped; removing them will not affect other dashboard logic.

### Sept 2025 — Jobs/Applications cleanup notes

- Enforced separation of application entry points:
  - Public `index.html` → only `Apply Now` linking to `apply.html`.
  - `user-portal.html` → supports Quick Apply; submissions stored in `quickApplications`.
- On admin approval, approved job data written to user now includes `rate` (and mirrored `pay`). This prevents "Rate to be determined" in acceptance emails.
- Admin Add Job form now pulls `jobType` options from Firestore `dropdownOptions` and restores placeholder text for empty selects.
- Approval flow attempts to create a Firebase Auth account for the applicant to avoid login denials.
  - Now guarded by an existence check via `GET /api/firebase?email=...` to prevent duplicate auth accounts.
  - Security: Do not store plaintext passwords in JSON. Contract password setting now routes through `PUT /api/firebase { email, newPassword, admin:true }` using Firebase Admin when available; otherwise the client updates password only if the user is signed in, or a password reset email is sent. No passwords are persisted in `users.json` or Firestore.
## 2025-09-12 — Contract System: Firestore Storage Integration
### Scope: `contract.html`, `user-portal.html`
- Contract PDFs now upload to Firestore Storage instead of GitHub:
  - `uploadPDFToFirestoreStorage()` replaces `uploadPDFToGitHub()` in contract signing flow.
  - PDFs organized by user email in `contracts/{email}/` folders using `storage-utils.js`.
  - Download functions prioritize `fileUrl` (Firestore Storage) over `githubUrl` (GitHub) for new contracts.
  - Legacy GitHub URLs remain as fallbacks for existing contracts.
- Email notifications now contain Firestore Storage download links instead of GitHub URLs.

### 2025-09-14 — Profile Photo picker global helper
- Exposed `window.openProfilePicker()` early in `user-portal.html` so inline `onclick` works even before initialization binds the input listener. The helper lazily calls `initializeProfilePicture()` if the input is not yet present, then clicks it.
- Keep this global when refactoring to avoid `ReferenceError: openProfilePicker is not defined` from inline buttons.

## 2025-09-12 — Multi-job timelines and all-contracts listing (portal)

## 2025-09-12 — Job Prioritization and User Experience Enhancement
- Scope: `user-portal.html`
- Changes:
  - Fixed `getSelectedJob()` function to prioritize most recent upcoming job instead of `primaryJob` or first job
  - Added tabbed interface with "Current & Upcoming" and "All Jobs" tabs for better job organization
  - Enhanced job display logic to show strategic job prioritization based on dates and status
  - Added CSS styles for new tab buttons matching existing design system
- Impact: Users can now clearly distinguish between their most important upcoming job and all their jobs
- Maintenance: Job prioritization logic uses same date parsing as `displayCurrentJobs()` for consistency
## 2025-09-13 — Community Likes inline-handler cleanup
- Firestore persistence: Likes now update `messages/<id>.likes` and `showcases/<id>.likes` with a `likedBy[]` deduped by email. When `FirestoreDataManager` is unavailable, localStorage fallback remains for dev-only.
- Notifications: After a successful like, a `notifications` doc is created for the content author via `sendUserNotification()`.


- Scope: `user-portal.html`
- Change: Inline `onclick` handlers for message/showcase likes now wrap IDs in quotes and escape single quotes. The like functions compare via `String(id)` and coerce counts.
- Reason: Prevent global-variable resolution of unquoted IDs which caused `ReferenceError: <id> is not defined` when clicking like on comments or showcases.
- Maintenance note: When templating inline handlers with dynamic IDs, always quote and escape the value or prefer `addEventListener` delegation to avoid HTML injection and global lookup pitfalls.

### 2025-09-14 — Community Messageboard re-enabled
- Scope: `user-portal.html`
- Change: Removed inline `display:none` from the Team Messaging card and aligned the input id to `messageInput`; send button now calls `sendMessage()` so existing handlers bind correctly.
- Impact: Restores Community messageboard visibility and functionality with Firestore-backed `messages` collection.
- Reversion: To hide again, add `style="display:none"` back to `.messaging-board-card` and revert input id/button onclick; note that this will disable Enter-to-send and the UI composer.

### Scope: `user-portal.html`
- Primary sections now render multiple items:
  - Jobs tab: `displayCurrentJobs()` maps all jobs to cards with timelines.
  - Contracts tab: `displayContracts()` lists all uploaded contracts for the user's email, and each Download button calls `downloadContractById()` to avoid cross-file downloads.
- Leave legacy `displayUserContracts()`/`displayJobsWithStatus()` helpers for any single-job subviews, but do not use them in the main tabs.

## 2025-09-12 — Quick Apply Cleanup & Ownership
### Scope: `user-portal.html`, `admin-dashboard.html`, `firestore-data-manager.js`
- Canonical data: Full applications live in Firestore `applications`; Quick Apply lives in `quickApplications`.
- Mirrors:
  - Standard: `users/{uid}/applications/*`, `jobs/{jobId}/applications/*`
  - Quick: `users/{uid}/quickApplications/*`, `jobs/{jobId}/quickApplications/*`
- Admin queue merges both collections but tags source; actions use the correct setter (`setQuickApplicationStatus` vs `setApplicationStatus`).
- Remove any legacy sample arrays or hardcoded lists; always load via Firestore getters.
- No JSON backups for applications; optional webhook/email triggers are non-blocking via `window.CONFIG.webhooks.applicationCreated`.
- Duplicate guard: email+job returns existing id for both collections.

Cleanup checklist:
- Remove temporary sample app stats if reintroduced during development.
- Verify Applications section binds Approve/Deny to `setApplicationStatus()` and not to local arrays.
- Keep quick-apply button in portal priority jobs; do not add it to the public landing `index.html`.

Verification:
- Create an application via portal; ensure it appears in admin without refresh (listener) and status changes persist on approval/denial.

## 2025-08-20 — Align Start Date to Job Selection
### 2025-09-08 — Portfolio Builder Integration Notes
- New files: `portfolio-builder.html`, `storage-utils.js`, `api/portfolio-theme.js`.
- User portal now includes `firebase-storage-compat.js` and uses `storage-utils.js` for uploads (avatars and showcases). Bucket URL is centralized in `firebase-config.js` as `window.FIREBASE_BUCKET_URL` (`gs://cochran-films.firebasestorage.app`).
- Data ownership: Firestore `portfolios` collection is canonical for portfolio profiles/galleries. No JSON backups.
- Cleanup guidance:
  - To disable the feature, remove the admin dashboard card link and delete `portfolios/*` docs from Firestore.
  - Remove `storage-utils.js` include from any pages if no longer needed. If reverting user portal uploads, also remove the Storage SDK include and switch profile/showcase flows back to base64 (not recommended).
  - Delete `api/portfolio-theme.js` if OpenAI theming is no longer desired.
- Security:
  - Keep `OPENAI_API_KEY` in Vercel environment variables only; never expose client-side.
  - Firebase Storage paths are namespaced under `portfolios/{ownerEmail}`; adjust rules if needed.
- Verification checklist:
  - `/portfolio-builder.html` opens, uploads work to Storage, applies AI theme, and publishes a Firestore doc.
  - Admin dashboard link opens the builder in a new tab.


## 2025-01-10 — Equipment & Resource Center Cleanup Plan

Data ownership
- Canonical: Firestore collections `equipment`, `resources`, `equipmentRequests`, `maintenance`.
- No JSON backups are maintained for these; avoid adding them to `uploaded-contracts.json` or `users.json`.

Safe removal guidance
- If reverting the feature, remove the Equipment Center nav/section in `user-portal.html` and admin cards in `admin-dashboard.html`.
- Remove the added methods and listeners in `firestore-data-manager.js` for the four new collections.

Orphaned data cleanup
- To purge test data, delete documents from the four collections via Firebase Console or an admin-only batch tool.
- For requests in `conflict` state older than 60 days, it is safe to delete after manual review.

Cross-feature interactions
- Approval sets `equipment.status = reserved` with a `reservation` payload. Check-in resets to `available` and clears `reservation`.
- Maintenance updates should not overwrite an active reservation field; prefer partial updates.

Verification checklist
- User portal Equipment Center loads without errors and renders empty states when collections are empty.
- Admin inventory/resources/requests/maintenance lists load and allow CRUD without console errors.
- Files: `user-portal.html`, `admin-dashboard.html`

### 2025-09-12 — Tab visibility fix note
- When modifying Equipment Center tabs in `user-portal.html`, keep `switchEquipmentTab()` updating both inline `style.display` and the `.active` class on `.performance-tab-content` elements. The CSS uses `.performance-tab-content { display:none }` and `.performance-tab-content.active { display:block }`; forgetting the class can leave tabs invisible.
- Ensure opening the Requests tab calls `loadEquipmentRequests()` and opening the Rented tab calls `loadRentedEquipment()` to avoid stale UI after admin approvals.
- Change: Use the selected job's start date as the single source of truth for project start across Current Jobs status/timeline and admin job assignment. This removes reliance on contract signed date or `profile.projectDate` for status transitions.
- Follow-up: Ensure `contract.html` already uses `(application.eventDate || jobs[primary].date || profile.projectDate || profile.projectStart)` for displayed `projectStart`. No contract change required today.
### 2025-09-12 — Team Messaging UI simplification
- Files: `user-portal.html`
- Cleanup: Removed the standalone "New Message" header button from the Team Messaging card. The bottom composer is the single entry point for starting messages, reducing duplicated controls.
- Action if reverting: Re-add the `<div class="messaging-controls">…</div>` block inside the Team Messaging card header and restore any modal handlers like `showNewMessageModal()` if that flow is desired again.

### 2025-09-12 — Success Stories: migrate from localStorage to Firestore
- Files: `user-portal.html`, `firestore-data-manager.js`, `admin-dashboard.html`
- Cleanup: Removed hardcoded sample stories and localStorage population. The portal now reads from the Firestore `successStories` collection and caches to localStorage only for offline fallback.
- Admin: Mini-stats prefer Firestore counts with localStorage fallback to avoid blank metrics when offline.
- Reversion guidance: If Firestore is unavailable, ensure `cochranSuccessStories` cache exists or reintroduce seed data during development only.

### 2025-09-12 — Community Tools modernization
- Replaced prompt-based Event flows with a modal Event Manager and Success Stories with a modal Story Manager in `admin-dashboard.html`.
- Keep calls to `FirestoreDataManager` (`addEvent/getEvents/updateEvent/deleteEvent`, `addSuccessStory/getSuccessStories/updateSuccessStory/deleteSuccessStory`) and the `ensureFirestoreReady()` guard when further upgrading UI.
### 2025-09-12 — Equipment Requests UX simplification
- Files: `user-portal.html`
- Cleanup: Removed duplicate manual request form from Equipment Requests tab. Requests originate exclusively via the Gear Library button; the Requests tab lists existing/pending requests only.
- Reintroduction guidance: If you bring the form back, ensure it calls the same Firestore path as the Gear Library request flow and avoids duplicating validation logic.
- Files: `admin-dashboard.html`
- Cleanup: Replaced demo button handlers with Firestore-backed flows using lightweight prompts (no heavy UI). When upgrading to full modals, keep calls to `FirestoreDataManager` (`add*/get*/update*/delete*`) and the `ensureFirestoreReady()` guard.
- Note: Mini-stat refresh uses `updateCommunityStats()` which prefers Firestore counts and falls back to localStorage.

### 2025-09-12 — Social Flyer asset (OBS Technical Assistant)
- Files: `OBS-Technical-Assistant-Flyer.html`
- Purpose: Standalone, social-ready flyer (1080×1350 portrait) for quick export.
- Style: Uses brand colors (gold on dark), glass-morphism, and `Logo.png`.
- Export: Top-right “Download as PNG” performs DOM-to-image export. If blocked, screenshot the card at 1080×1350.
- Cleanup: Safe to keep for reuse; remove just the HTML to deprecate. No other references. Preserve `CNAME` and custom domain settings.
### Firestore Integration Notes
- 2025-08-20 — `index.html` job filter derived-title fix: keep this logic when refactoring. The filter must derive a job title from multiple fields and only exclude rows that clearly look like applicant submissions. Do not revert to `job.title`-only checks.

- 2025-08-20 — User portal should reuse the default Firebase app session. Do not spin up a separate named app (e.g., `'user-portal'`) in `user-portal.html`; call `FirebaseConfig.waitForInit()` and use `FirebaseConfig.auth`/`getFirestore()`. This avoids cross-tab/session fragmentation and ensures `onAuthStateChanged` reflects the existing login.
  - Also ensure `handleLogin` rehydrates `auth` if null (waits for init, falls back to `firebase.auth()`), so early submits don’t throw on `signInWithEmailAndPassword`.

### 2025-08-19 — Remove legacy Quick Actions (Admin)

- The legacy Quick Actions UI and handlers have been removed from `admin-dashboard.html` to reduce surface area and eliminate deprecated flows.
- Removed buttons: Generate All Contracts, Export Users, Download Users, Download Contracts, Force Refresh Users, Migrate to Firestore, Full Migration, Verify Migration.
- Removed functions: `generateAllContracts`, `exportUsersData`, `downloadUsersJSON`, `downloadContractFiles`, `forceRefreshUsers`, `migrateToFirestore`, `runFullMigration`, `verifyMigration`.
- Removed script include: `migrate-to-firestore.js` (no longer referenced in the page).

Cleanup verification:
- Open the admin dashboard and confirm the “Quick Actions” section is not present.
- Search the repo for the removed function names to ensure no page-level references remain.

                                                                
- Canonical data source is Firestore. JSON files (`users.json`, `uploaded-contracts.json`) remain as backups to support existing APIs and GH Pages mirrors.
 - Canonical data source is Firestore. JSON files (`users.json`, `uploaded-contracts.json`) are deprecated for the user portal and remain only as archival backups.
- New writes from `apply.html` go to Firestore first, then attempt a backup write to `/api/apply`.
- Contract signing updates the Firestore `users` document and records a `contracts` document. The JSON files are updated afterward as a non-blocking backup.
- Contract deletion from the admin dashboard removes the Firestore `contracts/<id>` doc, clears the user's `contract` field, and calls `/api/delete-pdf` to remove the PDF (local/GitHub best-effort). Include this in cleanup verification when removing users or purging test contracts.
 - Firestore auto-migration from JSON backups is disabled by default to avoid accidental repopulation. To run a one-time re-seed, temporarily set `window.FIRESTORE_AUTO_MIGRATION = true;` in the dashboard, reload once, then set it back to false.
- Admin approve/deny flows persist to Firestore via `FirestoreDataManager.setUser` in addition to current GitHub JSON update routines.

### 2025-08-20 — Loading overlay control (admin modular vs main dashboard)

- Context: Both the main dashboard and the modular system referenced a shared `#loadingIndicator`. In some cases the modular code could show it while the main dashboard controlled the UI, causing the overlay to remain visible.
- Cleanup: Added guards in `admin-dashboard-modular/js/utils/loading-manager.js` and honored `window.MAIN_DASHBOARD_LOADING_OVERRIDE === false` in both modular LoadingManager and modular App show/hide calls. The modular layer now abstains from toggling the global overlay when the main dashboard owns the UI.
- Safety: The modular LoadingManager already includes a 30s stuck-state check and a 60s global safety timeout plus `emergencyClear()`; these remain as fallbacks.
- Action: When integrating additional modules, avoid calling `showGlobalLoading()` directly; prefer operation-scoped loaders or defer to the main dashboard’s built-in indicator.

### 2025-08-19 — Deep Firebase-First Cleanup
- Performance quick wins (2025-08-19)
  - Added `preconnect` for Google Fonts across `user-portal.html`, `admin-dashboard.html`, and `index.html`.
  - Marked external and local scripts as `defer` to eliminate render blocking.
  - Removed unused `html2canvas` references from `user-portal.html` and `admin-dashboard.html`.
  - Added `loading="lazy"`, `decoding="async"`, and explicit dimensions to logo images to reduce CLS and CPU.
  - Minor: added `referrerpolicy="no-referrer"` to Font Awesome CSS link to avoid referrer leakage.


- index.html
  - Removed unused PapaParse include.
  - Removed JSON/API fallback paths and local hardcoded FALLBACK_JOBS. Jobs now render only from Firestore.
  - Removed legacy Google Form field map and sticky-apply remnants.
  - Added AI-themed password gate modal (visual only) to inform users of in-progress status and route to the current landing page.

- user-portal.html
  - Enforced Firestore-only sources for jobs/contracts; no JSON fallbacks.
  - Reworded contract status helpers to reflect centralized Firestore instead of uploaded-contracts.json verbiage.
  - Payment method updates now persist to Firestore only; removed GitHub/JSON mentions in logs and toasts.

- admin-dashboard.html
  - Already Firestore-first with optional GitHub archival behind SYNC_TO_GITHUB=false. No user-visible legacy paths remain.

Verification
- Open `index.html` → confirm no network calls to `/api/jobs-data`; jobs load from Firestore via `FirestoreDataManager`.
- Confirm the AI gate modal appears once per session and closes on correct password (default `USER1234`).
- Open `user-portal.html` → change Payment Method, verify Firestore user doc updates and no `/api/update-users` or GitHub file calls are made.

### User Portal Cleanup: remove legacy JSON reads (2025-08-18)
- `user-portal.html` no longer reads `/api/users` or merges from `users.json`. All data loads from Firestore (`users`, `contracts`, `jobs`).
- The functions `loadUsersData()` and `loadUploadedContracts()` were updated to Firestore-only implementations.
- `checkUserInSystem(email)` auto-provisions a minimal user document if a Firebase-authenticated email has no profile yet, eliminating the need for the JSON gate.
- When cleaning up future code, remove any lingering fetches to `/api/users` or `/api/github/file/users.json` from portal-specific flows; admin-only tools may still call GitHub APIs intentionally.

#### Hotfix Note (2025-08-18)
- Resolved a broken async closure in `user-portal.html` that introduced JS parse errors and a 405 on login due to form fallback POST.
- Consolidated the users loading logic to use `usersLoadInFlight` with a proper `finally` cleanup to avoid duplicate loads and ensure consistent cleanup.
- Action for future cleanup: if refactoring these loaders, keep the in-flight guard + `finally { usersLoadInFlight = null; }` pattern and avoid duplicating the functions.
Cleanup Tests Utility

- Run inventory (no changes):

```bash
npm run cleanup-tests
```

- List only:

```bash
npm run cleanup-tests:list
```

- Apply (quarantines test/debug files and strips references):

```bash
npm run cleanup-tests:apply
```

Notes
- Quarantined files go to `backups/test-quarantine/<timestamp>/`.
- References removed include `<script src="test-*|debug-*">`, ``, `testMainDashboard*(`, and python servers ``/``.
- Review quarantined files as needed before deletion.
# Cleanup System Documentation

## Overview
This document outlines the cleanup procedures and systems used in the Cochran Films Landing project, including the revolutionary AI-powered Premiere Pro automation system.

### 2025-08-19 — Read-Me AI Design Alignment
- Consolidated Read-Me visual language with the AI/glass aesthetic from `popup.html` and `index2.html`.
- No legacy scripts removed elsewhere; this change is visual + UX copy only.
- Keep the particles config subtle (gold/indigo) and avoid heavy CPU usage.
- Links in “What’s New” must continue to point to production pages: `admin-dashboard.html`, `user-portal.html`.

## 🖼️ Landing Page Slideshow/Header Consolidation (2025-08-17)

- The standalone hero header in `index.html` has been consolidated into slide 1 of the slideshow to create a single creator-focused entry experience.
- Keep the logo asset and creator copy intact when refactoring; do not reintroduce a separate header block above the slideshow.
- Anchor `#jobs` is now the canonical in-page link for CTAs that jump to the jobs grid.
- When performing cleanup: ensure no duplicate hero/header remnants exist above `.slideshow-container` and that slide 1 remains the primary hero.

## 🎨 User Portal Login Redesign Cleanup

### New Addition: AI-Style Neural Glass Login Cleanup
The user portal login redesign includes cleanup procedures to maintain the new glass-morphism design and remove old animated elements.

#### Removed Elements
- **Old Background**: Replaced with neural network canvas + holographic particle system
- **Input Icons**: Removed old input field icons and lines
- **3D Animations**: Replaced with subtle glass effects and shadows

#### Design Cleanup
- **CSS Variables**: Updated to use modern design tokens
- **Glass Effects**: Implemented backdrop-filter blur effects with strong isolation of `#loginScreen` to avoid external overrides
- **Responsive Design**: Added mobile-first responsive breakpoints
- **Accessibility**: Improved focus states and contrast

#### Cleanup Commands
```bash
# Normalize login assets and remove legacy remnants
npm run cleanup:login
```

## 🔔 Enhanced Notification System Cleanup

### New Addition: Real-time Notification System Cleanup
The enhanced notification system includes cleanup procedures to maintain system performance and notification data integrity.

#### Notification Data Cleanup
- **Old Notifications**: Archive notifications older than 30 days
- **Read Notifications**: Clean up read notifications after 7 days
- **Duplicate Alerts**: Remove duplicate notification entries
- **Orphaned Data**: Clean up notifications for deleted users
- **Cache Cleanup**: Clear notification cache and temporary data

#### JSON Monitoring Cleanup
- **File Change Logs**: Archive file change detection logs
- **Monitoring Cache**: Clear monitoring system cache data
- **Update History**: Maintain update history for audit purposes
- **Performance Data**: Clean up monitoring performance metrics

#### Cleanup Commands
```bash
# Clean up notification system
npm run cleanup:notifications

# Clean monitoring cache
npm run cleanup:monitoring

# Archive old notifications
npm run cleanup:notification-archive

# Full notification cleanup
npm run cleanup:notification-system
```

#### Automated Cleanup Schedule
- **Daily**: Clean notifications older than 7 days
- **Weekly**: Archive notifications older than 30 days
- **Monthly**: Deep clean of monitoring cache and logs

### Maintenance Note: Admin Dashboard Inline Tests
- Fixed three anonymous inline test functions in `admin-dashboard.html` by assigning names:
  - `runAutomaticDashboardTests()`
  - `testMainDashboardLoginForm()`
  - `testMainDashboardAuthentication()`
- This resolves IDE syntax errors ("Identifier expected") and makes cleanup tools easier to target if we later decide to quarantine or strip inline test helpers.

## 🎬 AI Video Editor Cleanup

### New Addition: Automated Premiere Pro Editing System Cleanup
The AI Video Editor system includes comprehensive cleanup procedures to maintain system performance and data integrity.

## 🔧 Refactored Modules Cleanup

### New Addition: DropdownManager Module Refactoring Cleanup
The DropdownManager module refactoring includes cleanup procedures to maintain the new Component Library architecture and remove legacy code patterns.

#### Removed Elements
- **Inline Styles**: Removed all hardcoded inline CSS styles
- **HTML Strings**: Replaced HTML string concatenation with DOM element creation
- **Legacy Event Handling**: Updated to use modern event listener patterns
- **Hardcoded UI**: Replaced with modular component creation methods

#### Code Cleanup
- **Component Library Integration**: Added proper Component Library initialization waiting
- **Modular DOM Creation**: Implemented separate methods for creating UI sections
- **CSS Class Structure**: Replaced inline styles with proper CSS class-based styling
- **Event Handler Organization**: Centralized event listener setup and management
- **Responsive Design**: Added comprehensive mobile-first responsive CSS

#### Cleanup Commands
```bash
# Clean up old dropdown manager code
npm run cleanup:dropdown-manager

# Remove legacy inline styles
npm run cleanup:inline-styles

# Update component library integration
npm run cleanup:component-library

# Full module cleanup
npm run cleanup:refactored-modules
```

## 📧 EmailJS 422 Error Fix Cleanup

### New Addition: EmailJS Error Handling and Fallback System Cleanup
The EmailJS 422 error fix system includes cleanup procedures to maintain email functionality and prevent future template errors.

#### Enhanced Error Handling Cleanup
- **422 Error Handling**: Added specific handling for unprocessable entity errors
- **Parameter Validation**: Implemented comprehensive parameter validation and defaults
- **Fallback Templates**: Added automatic fallback to alternative templates
- **Error Categorization**: Improved error messages with troubleshooting guidance
- **User Feedback**: Enhanced notification system for email status

#### Template Variable Cleanup
- **Required Parameters**: Validated all required template variables
- **Default Values**: Implemented fallback values for missing parameters
- **Parameter Sanitization**: Added logging and validation before sending
- **Variable Matching**: Ensured template variables match EmailJS requirements exactly

#### Testing and Debug Tools Cleanup
- **Test Scripts**: Created comprehensive EmailJS testing tools
- **Debug Functions**: Added admin dashboard test button and functions
- **Diagnostic Pages**: Built interactive test pages for troubleshooting
- **Console Logging**: Enhanced logging for debugging and monitoring

#### Cleanup Commands
```bash
# Test EmailJS functionality
npm run test:emailjs

# Validate template variables
npm run validate:emailjs-templates

# Check EmailJS configuration
npm run check:emailjs-config

# Full EmailJS system cleanup
npm run cleanup:emailjs-system
```

#### Automated Cleanup Schedule
- **Before Sending**: Validate all email parameters
- **On Error**: Attempt fallback template automatically
- **Daily**: Check EmailJS service status and configuration
- **Weekly**: Validate template variable requirements

#### Refactoring Benefits
- **Maintainability**: Cleaner, more organized code structure
- **Consistency**: Matches architecture of other refactored modules
- **Performance**: Better DOM manipulation and event handling
- **Responsiveness**: Professional mobile-first design system
- **Extensibility**: Easier to add new features and modifications

#### Automated Cleanup Schedule
- **After Refactoring**: Clean up legacy code and inline styles
- **Component Updates**: Maintain consistency with Component Library
- **Style Updates**: Ensure CSS class structure remains clean
- **Code Reviews**: Regular cleanup of any new inline styles or legacy patterns

## 🔐 Modular Admin Dashboard Authentication System Cleanup

### New Addition: Admin Dashboard Loading Issue Fix and Cleanup
The admin dashboard loading issue fix system includes cleanup procedures to prevent infinite loading states and ensure proper module initialization.

## 🔥 Firestore Database Integration Cleanup

### New Addition: Firestore Database Integration and Data Management
The Firestore database integration system provides real-time data synchronization and cloud storage for all application data.

#### Firestore Configuration Cleanup
- **Centralized Configuration**: Single Firebase config file for all applications
- **Firestore SDK Integration**: Proper Firestore SDK loading and initialization
- **Authentication Integration**: Seamless Firebase Auth integration with existing systems
- **Error Handling**: Comprehensive error handling for Firebase operations
- **Fallback Systems**: Graceful fallback to JSON APIs when Firestore unavailable
  - Note (2025-08-18): Modular `UserManager` and `JobManager` use Firestore-first. Deprecated JSON endpoints `/api/users` and `/api/jobs-data` intentionally return 410 (Gone) and are retained only for temporary fallback. Cleanup tasks must not re-enable these endpoints. `admin-dashboard-modular/js/users/user-list.js` has also been updated to stop calling `/api/users` and to read from Firestore directly.

#### Data Management Cleanup
- **Real-time Listeners**: Automatic data synchronization across all clients
- **Data Migration**: Tools to migrate existing JSON data to Firestore
- **Batch Operations**: Efficient batch write operations for multiple documents
- **Collection Management**: Organized collection structure for users, jobs, and options
- **Data Validation**: Input validation and data integrity checks

#### Application Integration Cleanup
- **Admin Dashboard**: Full Firestore integration with optional GitHub archival (controlled by `SYNC_TO_GITHUB`)
- **User Portal**: Real-time data updates and cloud storage
- **Modular System**: Compatible with existing modular architecture
- **Performance Optimization**: Efficient data loading and caching strategies
 - **Assignments Alignment**: Per-user job progression stored under `users/{userId}/assignments/*`; global listings in `jobs` collection. JSON write-backs are disabled by default.
 - **UI Shell**: `admin-dashboard-modular/index.html` now renders a sidebar/header shell via `AdminDashboardApp.buildLayout()`; legacy inline test sections are hidden at runtime by `showDashboard()`.

### Dropdown Options Canonical Shape
- Collection `dropdownOptions`, document `default` with array fields: `roles`, `rates`, `locations`, `projectTypes`.
- Sanitization now runs on read and normalizes legacy numeric-keyed fields into `projectTypes`, then merges the corrected doc back to Firestore.

#### Loading State Management Cleanup
- **Infinite Loading Prevention**: Added safety timeouts and emergency clear functions
- **Module Loading Failures**: Implemented graceful handling of failed module loads
- **Loading State Tracking**: Added timestamps and duration monitoring for all loading operations
- **Safety Mechanisms**: Implemented automatic cleanup of stuck loading states
- **Emergency Controls**: Added manual emergency clear functions for debugging

#### Module Initialization Cleanup
- **Timeout Handling**: Added configurable timeouts for module loading operations
- **Error Recovery**: Implemented graceful fallback when modules fail to load
- **Circular Dependency Prevention**: Added checks to prevent infinite waiting loops
- **Module Availability Checks**: Enhanced validation of required module dependencies
- **Initialization Logging**: Improved logging for debugging module loading issues

#### Safety Mechanism Cleanup
- **Global Safety Timeout**: Force clear all loading states after 60 seconds
- **Stuck State Detection**: Automatically detect and clear loading states stuck for 30+ seconds
- **Periodic Health Checks**: Run health checks every 10 seconds to prevent stuck states
- **Emergency Clear Functions**: Provide manual emergency clear for stuck loading states
- **Loading State Reset**: Complete reset of all loading state tracking

#### Debug and Testing Cleanup
- **Loading Debug Script**: Created comprehensive debugging tools for loading issues
- **Test Pages**: Built interactive test pages for loading state validation
- **Console Monitoring**: Enhanced console logging for loading state tracking
- **Performance Metrics**: Track loading duration and identify bottlenecks
- **Error Reporting**: Improved error reporting for loading-related issues

#### Cleanup Commands
```bash
# Test loading manager functionality
open admin-dashboard-modular/test-loading-fix.html

# Emergency clear loading states (browser console)
LoadingManager.emergencyClear()

# Check loading state health (browser console)
LoadingManager.checkForStuckLoadingStates()

# Clear all loading states (browser console)
LoadingManager.clearAllLoadingStates()

# Debug loading issues (browser console)
DebugLoading.runDebug()
```

#### Automated Cleanup Schedule
- **Every 10 seconds**: Check for stuck loading states
- **Every 30 seconds**: Clear loading states stuck for too long
- **After 60 seconds**: Force clear all loading states globally
- **On initialization**: Set safety timeout to prevent infinite loading
- **On errors**: Automatically clear loading states and continue

#### Refactoring Benefits
- **Reliability**: Prevents infinite loading states that block user interaction
- **Performance**: Faster initialization with graceful fallbacks for failed modules
- **Debugging**: Comprehensive tools for identifying and resolving loading issues
- **User Experience**: Users can always access the dashboard, even with module failures
- **Maintainability**: Cleaner error handling and module initialization logic

### New Addition: Dual Authentication System Cleanup
The modular admin dashboard authentication system includes cleanup procedures to maintain both Firebase and fallback authentication systems.

#### Authentication Data Cleanup
- **Firebase Sessions**: Clean up expired Firebase authentication sessions
- **Fallback Sessions**: Remove old fallback authentication data
- **Admin User Cache**: Clear cached admin user information
- **Session Storage**: Clean up session storage data older than 24 hours
- **Authentication Logs**: Archive authentication attempt logs

#### System Integration Cleanup
- **Firebase Events**: Clean up Firebase initialization event listeners
- **Module Dependencies**: Remove unused authentication module dependencies
- **Test Files**: Archive old authentication test files
- **Configuration Cache**: Clear Firebase configuration cache
- **Error Logs**: Clean up authentication error logs

#### Security Cleanup
- **Password Reset**: Rotate fallback admin password regularly
- **Admin List**: Update admin email list and remove old entries
- **Access Logs**: Archive access logs for security auditing
- **Session Validation**: Clean up invalid session data
- **Privilege Cache**: Clear cached privilege information

#### Cleanup Commands
```bash
# Clean up authentication system
npm run cleanup:auth-system

# Clean Firebase sessions
npm run cleanup:firebase-sessions

# Clean fallback auth data
npm run cleanup:fallback-auth

# Clean authentication logs
npm run cleanup:auth-logs

# Full authentication cleanup
npm run cleanup:auth-full
```

#### Automated Cleanup Schedule
- **Hourly**: Clean expired sessions and invalid data
- **Daily**: Clean authentication logs and cache
- **Weekly**: Rotate fallback passwords and update admin lists
- **Monthly**: Deep clean of authentication system data

### New Addition: DashboardManager Module Creation Cleanup
The DashboardManager module creation includes cleanup procedures to maintain the new centralized dashboard architecture and ensure proper integration with other modules.

#### Removed Elements
- **Scattered Dashboard Logic**: Consolidated dashboard functionality from multiple files
- **Inline Scripts**: Replaced with proper module structure and Component Library integration
- **Hardcoded Stats**: Replaced with dynamic stats calculation from real data
- **Legacy Authentication**: Updated to use proper session management and Firebase integration

#### Added Elements
- **Centralized Dashboard Management**: Single module for all dashboard functionality
- **Component Library Integration**: Full integration with Component Library architecture
- **Professional UI Design**: Modern, responsive dashboard interface with proper CSS classes
- **Real-time Stats**: Dynamic calculation of creators, jobs, reviews, and contracts
- **Authentication System**: Proper session management and admin privilege checking
- **Event System**: Comprehensive event system for dashboard interactions
- **Testing Suite**: Complete testing integration with test-refactored-modules.html

#### Maintenance Procedures
- **Regular Testing**: Run test-refactored-modules.html to verify functionality
- **CSS Updates**: Update components.css for any styling changes
- **Stats Monitoring**: Monitor real-time stats calculation and display
- **Authentication Checks**: Verify admin privileges and session management
- **Event Monitoring**: Monitor custom events for proper integration
- **Status Indicators**: Check status indicators for real-time monitoring

#### Cleanup Commands
```bash
# Clean up old dashboard code
npm run cleanup:dashboard-manager

# Verify dashboard integration
npm run test:dashboard-manager

# Clean dashboard styles
npm run cleanup:dashboard-styles
```

#### Temporary File Cleanup
- **ExtendScript Files**: Clean up temporary ExtendScript execution files
- **Configuration Files**: Remove temporary config files after processing
- **Media Cache**: Clear Premiere Pro media cache files
- **Export Logs**: Archive and clean export log files
- **Project Files**: Clean up temporary Premiere Pro project files

#### Cleanup Commands
```bash
# Clean up AI Video Editor temporary files
npm run cleanup:ai-editor

# Clean specific components
npm run cleanup:styles
npm run cleanup:media
npm run cleanup:premiere
npm run cleanup:bridge

# Full system cleanup
npm run cleanup:all
```

#### Automated Cleanup Schedule
- **Daily**: Clean temporary files older than 24 hours
- **Weekly**: Archive and compress log files
- **Monthly**: Deep clean of media cache and project files

## 🔌 API Infrastructure Cleanup

### New Addition: API Endpoint System Cleanup
The API infrastructure includes cleanup procedures to maintain system performance and ensure proper endpoint functionality.

#### API Endpoint Cleanup
- **Missing Endpoints**: Added missing API endpoints for local development
- **Environment Detection**: Implemented automatic environment detection system
- **API Base URL**: Added dynamic API base URL configuration
- **Response Validation**: Ensured all endpoints return proper JSON responses
- **Error Handling**: Improved error handling and logging for all endpoints

#### Server Configuration Cleanup
- **Port Conflicts**: Resolved port 8000 conflicts and server restart issues
- **Route Configuration**: Fixed API route definitions and middleware setup
- **CORS Handling**: Ensured proper CORS configuration for all endpoints
- **File Paths**: Fixed file path resolution for JSON data files
- **GitHub Integration**: Added mock GitHub API responses for local testing

#### Cleanup Commands
```bash
# Clean up server configuration
npm run cleanup:server-config

# Clean API endpoints
npm run cleanup:api-endpoints

# Clean server logs
npm run cleanup:server-logs

# Full API cleanup
npm run cleanup:api-system
```

#### Automated Cleanup Schedule
- **Daily**: Clean server logs and temporary files
- **Weekly**: Verify all API endpoints are functioning
- **Monthly**: Deep clean of server configuration and logs

#### API Endpoints Maintained
- ✅ `/api/health` - Server health check
- ✅ `/api/users` - User data retrieval  
- ✅ `/api/jobs-data` - Job listings data
- ✅ `/api/update-job-status` - Job status toggle (Active/Inactive)
- ✅ `/api/notifications` - User notifications
- ✅ `/api/uploaded-contracts` - Contract file data
- ✅ `/api/github/info` - GitHub repository info
- ✅ `/api/github/file/:filename` - GitHub file operations
- ✅ `/api/dropdown-options` - Form dropdown data

## 🧹 General Cleanup Procedures

### Core Cleanup Functions

#### User Data Cleanup
- **User Deletion**: Complete removal of user data and associated files
- **PDF Cleanup**: Automatic deletion of user-specific PDF contracts
- **Profile Cleanup**: Removal of user profile data and preferences
- **Session Cleanup**: Clear expired user sessions and authentication data

#### Authentication Cleanup (2025-01-10)
- User authentication is handled by Firebase; do not persist plaintext `profile.password` in `users.json`.
- Contract signing should only update contract status fields in `users.json` and ensure the Firebase account exists/updated via `/api/firebase`.
- The user portal validates the user by email against `/api/users` after Firebase login; if missing, onboard via admin flows rather than writing a password field.

#### File System Cleanup
- **Backup Management**: Rotate and compress backup files
- **Log Cleanup**: Archive and remove old log files
- **Cache Cleanup**: Clear browser and application cache files
- **Temporary Files**: Remove temporary files and downloads

#### Database Cleanup
- **Orphaned Records**: Remove records without associated users
- **Duplicate Data**: Clean up duplicate entries
- **Expired Data**: Remove expired contracts and notifications
- **Performance Optimization**: Reindex and optimize database

### Cleanup Procedures

#### Automatic Cleanup
```javascript
// Daily cleanup routine
function dailyCleanup() {
    cleanupTemporaryFiles();
    cleanupExpiredSessions();
    cleanupOldLogs();
    cleanupOrphanedRecords();
}

// Weekly cleanup routine
function weeklyCleanup() {
    archiveLogFiles();
    compressBackups();
    optimizeDatabase();
    cleanupMediaCache();
}

// Monthly cleanup routine
function monthlyCleanup() {
    deepCleanup();
    performanceOptimization();
    securityAudit();
    systemHealthCheck();
}
```

#### Manual Cleanup
```bash
# Run cleanup procedures
npm run cleanup

# Clean specific areas
npm run cleanup:users
npm run cleanup:files
npm run cleanup:database
npm run cleanup:logs

# Force cleanup (ignore warnings)
npm run cleanup:force
```

### Cleanup Categories

#### User Management Cleanup
- **User Deletion**: Complete removal of user accounts
- **Profile Cleanup**: Remove user profile data
- **Session Cleanup**: Clear expired sessions
- **Authentication Cleanup**: Remove old auth tokens

#### File Management Cleanup
- **PDF Cleanup**: Remove generated PDF contracts
- **Backup Cleanup**: Rotate and compress backups
- **Media Cleanup**: Remove unused media files
- **Cache Cleanup**: Clear application cache

#### Database Cleanup
- **Orphaned Records**: Remove unlinked data
- **Duplicate Cleanup**: Remove duplicate entries
- **Performance Cleanup**: Optimize database performance
- **Integrity Cleanup**: Fix data integrity issues

#### System Cleanup
- **Log Cleanup**: Archive and remove old logs
- **Temporary Cleanup**: Remove temp files
- **Session Cleanup**: Clear expired sessions
- **Cache Cleanup**: Clear system cache

### Cleanup Verification

#### Verification Procedures
```javascript
// Verify cleanup completion
function verifyCleanup() {
    checkFileRemoval();
    checkDatabaseIntegrity();
    checkSystemPerformance();
    checkSecurityStatus();
}

// Generate cleanup report
function generateCleanupReport() {
    const report = {
        filesRemoved: countRemovedFiles(),
        databaseOptimized: checkDatabaseStatus(),
        performanceImproved: measurePerformance(),
        securityEnhanced: auditSecurity()
    };
    return report;
}
```

#### Cleanup Monitoring
- **Real-time Monitoring**: Track cleanup progress
- **Error Reporting**: Log cleanup errors and issues
- **Performance Tracking**: Monitor system performance impact
- **Security Auditing**: Verify security after cleanup

### Cleanup Safety Measures

#### Data Protection
- **Backup Before Cleanup**: Create backups before major cleanup
- **Verification Steps**: Verify data integrity after cleanup
- **Rollback Capability**: Ability to restore if cleanup fails
- **Audit Trail**: Log all cleanup activities

#### Safety Checks
```javascript
// Safety checks before cleanup
function safetyChecks() {
    checkBackupStatus();
    verifyDataIntegrity();
    checkSystemHealth();
    validatePermissions();
}

// Emergency rollback
function emergencyRollback() {
    restoreFromBackup();
    notifyAdministrators();
    logEmergencyAction();
    suspendCleanup();
}
```

### Cleanup Scheduling

#### Automated Scheduling
```javascript
// Schedule cleanup tasks
const cleanupSchedule = {
    daily: {
        time: '02:00',
        tasks: ['tempFiles', 'sessions', 'logs']
    },
    weekly: {
        day: 'Sunday',
        time: '03:00',
        tasks: ['backups', 'database', 'media']
    },
    monthly: {
        day: 1,
        time: '04:00',
        tasks: ['deepCleanup', 'optimization', 'audit']
    }
};
```

#### Manual Scheduling
```bash
# Schedule cleanup tasks
npm run schedule:cleanup

# View cleanup schedule
npm run schedule:view

# Modify cleanup schedule
npm run schedule:modify
```

### Cleanup Performance

#### Performance Monitoring
- **Execution Time**: Track cleanup duration
- **Resource Usage**: Monitor CPU and memory usage
- **Impact Assessment**: Measure system performance impact
- **Optimization**: Continuously improve cleanup efficiency

#### Performance Metrics
```javascript
// Performance tracking
const performanceMetrics = {
    executionTime: measureExecutionTime(),
    resourceUsage: monitorResourceUsage(),
    systemImpact: assessSystemImpact(),
    efficiencyScore: calculateEfficiency()
};
```

### Cleanup Reporting

#### Report Generation
```javascript
// Generate cleanup reports
function generateCleanupReport() {
    return {
        summary: {
            totalFilesRemoved: countRemovedFiles(),
            databaseOptimizations: countOptimizations(),
            performanceImprovements: measureImprovements(),
            securityEnhancements: countEnhancements()
        },
        details: {
            fileCleanup: getFileCleanupDetails(),
            databaseCleanup: getDatabaseCleanupDetails(),
            systemCleanup: getSystemCleanupDetails(),
            aiEditorCleanup: getAIEditorCleanupDetails()
        },
        recommendations: {
            nextSteps: generateRecommendations(),
            optimizations: suggestOptimizations(),
            maintenance: scheduleMaintenance()
        }
    };
}
```

#### Report Distribution
- **Email Reports**: Send cleanup reports via email
- **Dashboard Integration**: Display reports in admin dashboard
- **Log Archiving**: Archive reports for historical tracking
- **Alert System**: Notify administrators of issues

## 🎬 AI Video Editor Integration

The AI Video Editor system integrates with the existing cleanup framework:

### New Cleanup Categories
1. **Style Cleanup** - Remove unused style configurations
2. **Media Cleanup** - Clean up temporary media files
3. **Premiere Pro Cleanup** - Clean ExtendScript and project files
4. **Bridge Cleanup** - Clean Node.js bridge temporary files
5. **Export Cleanup** - Clean up exported video files

### AI Editor Cleanup Commands
```bash
# Clean AI Video Editor components
npm run cleanup:ai-editor

# Clean specific AI components
npm run cleanup:styles
npm run cleanup:media
npm run cleanup:premiere
npm run cleanup:bridge
npm run cleanup:exports

# Full AI Editor cleanup
npm run cleanup:ai-full
```

### Integration Points
- Uses existing backup and verification systems
- Integrates with current logging infrastructure
- Leverages existing notification system
- Utilizes current performance monitoring

This comprehensive cleanup system ensures both the original Cochran Films Landing functionality and the revolutionary AI Video Editor system maintain optimal performance and data integrity. 

## Recent Cleanup Notes (2025-01-09)

### CSS Overflow and Absolute Normalization (Login)
- Context: Some decorative/absolute elements were escaping the viewport on the login route, causing right-edge clipping and horizontal scroll.
- Action: Added a scoped normalization block at the end of `styles/user-portal-theme.css` titled "LAYOUT FIXES: LOGIN + OVERFLOW/ABSOLUTE NORMALIZATION".
- Effect: Neutralizes absolute/fixed and transform-based elements inside `#loginScreen`, prevents overflow, and disables portal-only effects on the login route without impacting `#userPortal`.
- Cleanup Impact: Reduces visual noise and layout drift; no removal of assets required.

---

## Data Hygiene: Archived Users Exclusion (2025-08-10)

- Dashboard metrics now intentionally exclude users in the `_archived` bucket and any underscore-prefixed keys in `users`.
- When cleaning datasets, ensure archived users remain under `users._archived` to keep counts accurate.
- If restoring a user, move their record from `users._archived` back to the root and remove any leading-underscore keys.

## UI Consistency: Card Contrast (2025-08-10)

- To prevent readability regressions, the user portal now enforces a dark background on the `profile-card`, `project-card`, and `payment-card` containers.
- If adding new dashboard cards that display white text, apply the same pattern or reuse these classes to maintain contrast.

## Login Overlay Centering Hardening (2025-08-13)

- Files: `styles/user-portal-theme.css`
- Change: Added a final override to enforce `#loginScreen { position: fixed; inset: 0; display: grid; place-items: center; }` and constrain `.login-container` width.
- Purpose: Prevent late-arriving styles/JS from shifting the login panel left.
- Cleanup guidance: If future layout systems add grids/rows at the root, ensure `#loginScreen` remains isolated and loaded last. Remove any duplicated `.login-screen` rules in inline `<style>` blocks when consolidating.

---

## User Portal Race Condition Hardening (2025-08-17)

- Hardened `user-portal.html` against sign-out races during data refresh.
- Change: `loadUserData()` now snapshots `currentUser.email` before awaits and re-validates after `loadUsersData()`/`loadPerformanceReviews()`.
- Effect: Prevents `Cannot read properties of null (reading 'email')` when a sign-out occurs mid-refresh.
- Cleanup impact: None. Defensive checks only; no behavior change for normal flows.

---

## Modular System Fixes (2025-01-09)

### Critical Issues Resolved
1. **Safety Timeout Scope Error**: Fixed `safetyTimeout` variable scope issue in `AdminDashboardApp.init()` that was causing "ReferenceError: safetyTimeout is not defined"
2. **EmailJS Test Function**: Fixed `testParams` undefined error in `testEmailJS()` function
3. **Firebase Authentication Conflicts**: Resolved duplicate auth state listeners causing unexpected user sign-outs

### Code Changes Made

#### 1. Safety Timeout Fix (`admin-dashboard-modular/js/app.js`)
- **Problem**: `safetyTimeout` was declared as local variable but referenced in `finally` block
- **Solution**: Moved `safetyTimeout` to class-level property and added proper null checking
- **Impact**: Prevents modular system initialization failure

#### 2. EmailJS Test Function Fix (`admin-dashboard.html`)
- **Problem**: `testParams` variable was undefined in error handling
- **Solution**: Fixed variable scope and corrected error message for 403 status
- **Impact**: EmailJS testing now works correctly

#### 3. Firebase Authentication Coordination (`admin-dashboard-modular/js/app.js` & `admin-dashboard-modular/js/auth/auth-manager.js`)
- **Problem**: Multiple auth state listeners causing conflicts and unexpected sign-outs
- **Solution**: Added `isHandlingAuth` flag to prevent duplicate listener setup
- **Impact**: Eliminates authentication conflicts between modular and main dashboard systems

#### 4. Firebase Configuration Enhancement (`firebase-config.js`)
- **Problem**: Missing `waitForInit()` method required by auth-manager
- **Solution**: Added `waitForInit()` method for proper initialization coordination
- **Impact**: Improves Firebase initialization reliability

### Testing and Verification
- **Test Pages**: Created comprehensive test pages to verify all fixes in browser
  - `test-modular-system-fixes.html` - Dynamic loading test page
  - `test-modular-system-complete.html` - Complete modular system test page
- **Manual Testing**: Modular system now loads without errors
- **Authentication**: Single auth state listener prevents conflicts

### Maintenance Notes
- **Future Development**: When adding new auth components, check `isHandlingAuth` flag first
- **Firebase Integration**: Use `waitForInit()` method for proper initialization coordination
- **Error Handling**: Always check for existing listeners before setting up new ones

### Cleanup Commands
```bash
# Test modular system fixes
# Open test-modular-system-complete.html in browser for comprehensive testing
# Or use test-modular-system-fixes.html for dynamic loading tests

# Verify Firebase configuration
curl http://localhost:8000/api/health

# Check for duplicate auth listeners in console
# Look for multiple "Firebase auth state observer setup complete" messages
```

---

## Contracts API Endpoint Enhancement (2025-01-09)

### API Behavior Cleanup
- **Dual-Purpose Handling**: Enhanced GET endpoint to handle both contract listing and PDF serving
- **Error Handling**: Added proper error handling for missing contract data files
- **Backward Compatibility**: Maintained existing PDF download functionality
- **Data Validation**: Integrated with uploaded-contracts.json for consistent data structure

### Code Cleanup
- **Enhanced GET Handler**: Modified to gracefully handle both parameter scenarios
- **File System Integration**: Seamless integration with existing contract data
- **Logging Enhancement**: Added comprehensive logging for debugging and monitoring
- **Response Format**: Standardized response format for contract listings

### Maintenance Procedures
- **Daily**: Verify API endpoint availability and response times
- **Weekly**: Check contract data integrity and file consistency  
- **Monthly**: Review API logs and performance metrics

### Cleanup Commands
```bash
# Test contracts API functionality
curl http://localhost:8000/api/contracts

# Validate PDF serving
curl "http://localhost:8000/api/contracts?filename=test.pdf"

# Check API health
curl http://localhost:8000/api/health
```

## 2025-08-18 — Modular Portal Firestore-Only Cleanup
- Removed remaining `/api/users` reads from modular portal managers; now query Firestore `users` by `profile.email`.
- Managers updated:
  - `user-portal-modular/js/auth/auth-manager.js`
  - `user-portal-modular/js/users/user-manager.js`
  - `user-portal-modular/js/contracts/contract-manager.js`
  - `user-portal-modular/js/jobs/job-manager.js`
  - `user-portal-modular/js/users/performance-manager.js`
  - `user-portal-modular/js/users/payment-manager.js` (also persists payment fields + history to Firestore)
- Ensure `user-portal-modular/index.html` includes:
  - Firebase SDKs (app/auth/firestore)
  - `../firebase-config.js`
  - `../firestore-data-manager.js`
- Admin strict mode (optional): add `window.STRICT_FIRESTORE_MODE = true;` before loading admin modules to disable JSON fallbacks in `admin-dashboard-modular/js/utils/realtime-data-manager.js`.
 
## 2025-08-19 — Admin Init Overlay Removal & User Portal Theme Harmonization
- Admin: Modular loader overlay is now suppressed when main dashboard controls display/loading via flags (`MAIN_DASHBOARD_USER_DISPLAY_OVERRIDE === false`, `MAIN_DASHBOARD_LOADING_OVERRIDE === false`). This prevents flicker and preserves existing admin styling from first paint.
- Files: `admin-dashboard-modular/js/app.js`
- Cleanup note: Do not reintroduce any modal/overlay that blocks first paint in the admin. Any loading indicators should be inline and non-intrusive.
- User Portal: Introduced `.ai-theme` overrides to harmonize legacy gold accents and heavy dark overlays with the AI theme (reference `index2.html`) without modifying the reference file itself.
- Files: `user-portal.html`
- Cleanup note: When adding new UI in the portal, avoid inline `#FFB200` or gold gradients; rely on CSS variables within `.ai-theme`.
 
## 2025-08-19 — Admin Dashboard Roles Removal
## 2025-08-20 — User Portal Logout Hardening
- Files: `user-portal.html`
- Change: Centralized logout via `FirebaseConfig.signOut()` with fallbacks, and full cleanup of session/local storage keys to prevent residual auto-login state. Converted the Sign Out button to `type="button"` to avoid unintended form submission.
- Reason: Users could not reliably sign out due to auth/state races and lingering cached email/session values. This ensures UI flips to login and prevents cross-tab rehydration from stale storage.

- Removed the Roles block from Dropdown Management in `admin-dashboard.html`.
- Role fields in Add User and Edit User are now free-text inputs; no central `roles` list is managed.
- Any code that previously populated `dropdownOptions.roles` into UI has been neutralized; keep `locations`, `rates`, and `projectTypes` only.

## 2025-08-19 — Project Start Date Resolution
- Files: `user-portal.html`, `contract.html`
- Change: Centralized start date resolution via `getEffectiveProjectStartDate()` and updated PDF generation to use broader fallbacks (`jobs[*].projectStart|date`, `profile.projectDate|projectStart`, `application.eventDate`).
- Result: UI and generated PDFs show the actual date when available instead of "TBD".
- Rollback: Remove the helper and revert fallbacks in `contract.html` if needed.

### 2025-09-08 — Modal padding/overflow policy (admin UI)
- For all admin inline modals (including Edit User), the overlay must include safe-area padding and allow vertical scrolling. Modal panels should use a viewport-constrained max-height with the form body scrolling. This prevents headers/footers from being clipped on small screens.
- Reference implementation: `admin-dashboard.html` Edit User modal uses overlay padding with `env(safe-area-inset-*)`, `overflow:auto` on the overlay, `max-height: calc(100vh - 48px)` on the panel, and `overflow:auto` on the content body.

### 2025-09-13 — iOS App addition and config handling
- Files: `MobileApp/CF-Job-Listings/CF-Job-Listings/*`
- Native app mirrors web job listings and apply flow.
- Configuration: `Config.plist` holds `API_BASE_URL` and optional `FIREBASE_*` keys. Keep these synchronized with Vercel environment variables and Firebase project settings. Do not commit secrets elsewhere.
- Data ownership: Firestore is canonical for jobs and applications; the iOS app uses Firestore first (if Firebase SDK present) and posts a non-blocking backup to `/api/apply`. Jobs fallback to `/api/jobs-data` only when Firestore unavailable.
- Branding: Reuse existing branding/colors; keep font families aligned with web (system stacks acceptable on iOS).

## Sept 2025 — Auth data handling notes (Phase 0–2)
- Do not store plaintext passwords in any JSON or Firestore fields. Contract flows only attempt account creation or send a password reset email; passwords are never persisted.
- Contract signing writes `profile.name` (and preserves existing fields) on the user doc when updating `contract.*`. If the portal detects a missing name on first login and finds a cached recent signature, it backfills `profile.name` once and clears the cache.
- The portal login UI maps `auth/invalid-credential` to a clear message and provides a built‑in password reset action.
- Current Jobs uses a compact horizontal stepper and small action buttons; avoid reintroducing tall, full-height buttons in redesigns.