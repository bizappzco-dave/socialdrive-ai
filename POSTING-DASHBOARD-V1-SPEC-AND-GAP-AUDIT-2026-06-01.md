# SocialDrive Manual Posting Dashboard v1 - Spec + Gap Audit

Goal
Build a client-facing login dashboard so clients can manually publish/schedule selected SocialDrive posts via Upload-Post API, replacing dependence on Sociamonials dashboard UX.

Scope
- In scope: client auth, post queue UI, post now/schedule actions, status tracking, posting history, failure retry.
- Out of scope (v1): advanced analytics dashboards, AutoDM monitors UI.
- In scope (v1.1, immediately after phase 1): multi-user client access (staff accounts + role-based permissions).

Source references
- Upload-Post docs: /home/dpmcg/Downloads/Upload -Post.md
- SocialDrive repo: /home/dpmcg/.openclaw/workspace/socialdrive-ai

Relevant Upload-Post API capabilities (confirmed in docs)
1) Create posts
- POST /api/upload (video)
- POST /api/upload_photos (image/carousel)
- POST /api/upload_text (text)

2) Track execution
- GET /api/uploadposts/status (request_id or job_id)

3) Scheduling lifecycle
- GET /api/uploadposts/schedule
- PATCH /api/uploadposts/schedule/<job_id>
- DELETE /api/uploadposts/schedule/<job_id>

4) History and results
- GET /api/uploadposts/history
- post analytics endpoints for deeper reporting (optional in v1)

5) Target discovery for platforms
- GET /api/uploadposts/facebook/pages
- GET /api/uploadposts/linkedin/pages
- GET /api/uploadposts/pinterest/boards
- GET/POST google business locations

Current SocialDrive state (actual code)
What exists
- Agency submissions list: src/app/agency/submissions/page.tsx
- Client review page with selection/deletion: src/app/review/[token]/page.tsx
- Submission posts API: src/app/api/submissions/[id]/posts/route.ts
- Approval flow: src/app/api/submissions/[id]/approve/route.ts
- Upload + AI generation pipeline: src/app/api/submissions/upload/[token]/submit/route.ts
- Current export endpoint still Sociamonials-oriented: /api/export/sociamonials

What does not exist yet
- No client-facing manual posting dashboard with login for self-serve posting actions.
- No server routes that call Upload-Post create/upload endpoints from SocialDrive.
- No persisted Upload-Post job/request lifecycle table.
- No post-now/schedule controls in client-facing UI.
- No retry/cancel/edit schedule workflow in current product.

Important risk found during audit
- Approval route uses posts.deleted fields while recent build/debug history showed schema mismatch issues around deleted/selected columns in some environments. Before v1 release, normalize schema assumptions and avoid optional-column hard failures.

v1 product spec (what we should build)

A) Client-facing screens
1. /client/posting
- Shows all approved/selected posts ready to publish.
- Per post: media preview, caption, hashtags, target platforms, actions.
- Actions: Post now, Schedule, Skip.

2. /client/posting/scheduled
- List scheduled jobs from local DB + Upload-Post sync.
- Actions: edit time, cancel.

3. /client/posting/history
- Published/failed jobs with platform-level result and links.
- Action: retry failed posts.

B) Required backend routes (SocialDrive)
1. POST /api/client/posting/publish
- Input: submission_id, post_ids, platforms, mode(post_now|schedule), scheduled_date(optional)
- Calls Upload-Post endpoint per media type.
- Stores request_id/job_id and normalized status.

2. GET /api/client/posting/status
- Input: request_id/job_id
- Pulls Upload-Post status and updates local posting_jobs table.

3. GET /api/client/posting/scheduled
- Returns local jobs plus optional Upload-Post schedule reconciliation.

4. PATCH /api/client/posting/scheduled/:job_id
- Edits scheduled_date/title/caption via Upload-Post API.

5. DELETE /api/client/posting/scheduled/:job_id
- Cancels job via Upload-Post API and updates local status.

6. GET /api/client/posting/history
- Returns posting history with status buckets: queued, processing, posted, failed, cancelled.

C) Data model additions (Supabase)
1. posting_jobs
- id (uuid)
- client_id
- submission_id
- post_id (nullable for batch)
- uploadpost_request_id (nullable)
- uploadpost_job_id (nullable)
- mode (post_now|scheduled)
- scheduled_date_utc (nullable)
- platform_targets (jsonb)
- media_type (image|carousel|video|text)
- status (queued|processing|posted|failed|cancelled)
- error_message (nullable)
- posted_at (nullable)
- created_at / updated_at

2. posting_job_results
- id
- posting_job_id
- platform
- success
- platform_post_id (nullable)
- post_url (nullable)
- raw_response (jsonb)
- created_at

D) Auth/permissions (v1 minimum)
- Reuse existing client auth/session boundaries.
- Enforce client_id scoping for all posting routes.
- API keys/secrets only server-side.

Gap audit (current vs required)
1. UI gap: HIGH
- Missing client posting dashboard pages entirely.

2. API integration gap: HIGH
- No Upload-Post publishing routes currently integrated.

3. Data model gap: HIGH
- No job lifecycle persistence for publish/schedule/status.

4. Reliability gap: MEDIUM-HIGH
- Status polling + reconciliation loops missing.

5. Security gap: MEDIUM
- Need strict client ownership checks on new routes.

Phased implementation plan
Phase 1 (fastest functional baseline)
- Add posting_jobs + posting_job_results tables
- Implement publish endpoint (post now only)
- Build /client/posting queue with Post now action
- Add status polling endpoint

Phase 2 (scheduling + controls)
- Add schedule create/edit/cancel routes
- Build /client/posting/scheduled page
- Add timezone-safe date handling and validation

Phase 3 (history + operational hardening)
- Build /client/posting/history
- Retry failed jobs
- Add reconciliation cron/worker to re-check stale processing jobs

Acceptance criteria for v1
- Client can log in and manually post approved content from dashboard.
- User can schedule a post and later edit/cancel it.
- Every action records local job state and platform results.
- Failed jobs are visible with retry option.
- No client can access another client’s posting jobs.

v1.1 extension: users-per-account (staff access)
Why this is required
- This is a standard SMB/agency requirement and fits your exact risk case (staff turnover without losing account ownership).

Data model additions
1) client_members
- id (uuid)
- client_id (uuid, fk clients)
- user_id (uuid, fk auth.users)
- role (owner|manager|editor|viewer)
- status (invited|active|disabled)
- invited_by (uuid, fk auth.users, nullable)
- invited_at, joined_at, disabled_at
- created_at, updated_at
- unique(client_id, user_id)

2) Optional invites table (if email-invite workflow is needed)
- client_member_invites: invite_token, client_id, email, role, expires_at, accepted_at

Role behavior (minimum)
- owner: billing/admin/member management + posting
- manager: posting + schedule edits + member invite/remove (except owner)
- editor: create/post/schedule content
- viewer: read-only queue/history

Required routes
- GET /api/client/members
- POST /api/client/members/invite
- PATCH /api/client/members/:id (role/status)
- DELETE /api/client/members/:id

Security model
- Enforce all client resources by membership lookup (not just raw client_id in request).
- Never use service-role shortcuts in client-facing member actions.
- Apply RLS policies keyed to auth.uid() and client_members mapping.

Acceptance criteria for v1.1
- One client account supports multiple staff users with role-based permissions.
- Offboarding a staff member disables their access without touching connected social accounts.
- Audit trail exists for member add/remove/role changes.

Recommended immediate next build step
Start Phase 1 now:
1) create DB migration for posting_jobs + posting_job_results
2) implement POST /api/client/posting/publish and GET /api/client/posting/status
3) add /client/posting page with queue + Post now button wired to API
4) verify against production-like environment with one real test post flow

Then start v1.1 immediately:
5) add client_members table + RLS policies
6) build member management UI for owner/manager
7) gate posting routes by membership role checks
