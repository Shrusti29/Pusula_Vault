# PUSULA VAULT — Consolidated Architecture & Gap Analysis Report

> **Prepared**: After integrating Enterprise RBAC & Access Governance update. This document does NOT contain implementation code; it is the consolidated blueprint, gap/contradiction register, schema, module map, and revised plan.

---

## 1. Executive Summary of Consolidated Requirements

| Dimension | Summary |
|---|---|
| **Product** | Enterprise AI-powered secure Knowledge Management + DMS + Workspace + Document Version Control + AI/RAG/Humanizer + Founder Governance & Audit. |
| **Users (6 Roles, Hierarchical)** | FOUNDER → ADMIN → MANAGER → TEAM_LEAD → EMPLOYEE → INTERN |
| **Security Model** | RBAC + Resource-Level Permissions + Team/Workspace Scope + Immutable Audit + Security Events. RBAC is NOT enough alone; permissions are resolved per API call across (User ∪ Role ∪ Team ∪ Workspace ∪ Folder ∪ Document ∪ Asset) assignments. |
| **Permissions (8 bits)** | VIEW, EDIT, COMMENT, UPLOAD, DOWNLOAD, SHARE, DELETE, MANAGE_ACCESS |
| **Admin Visibility Rule (Critical)** | ADMIN does NOT auto-bypass scope. ADMIN can govern within scope/policy. Only FOUNDER has full-platform visibility (backend-enforced). |
| **Architecture** | Angular SPA (Standalone, Signals, Lazy) + Spring Boot REST/SSE (5-layer strict) + H2(local)/PostgreSQL(prod) + Abstracted Storage + Abstracted AI/RAG + Security/Audit Layer. |
| **Non-Negotiable Boundaries** | No business logic or entities in controllers. No Angular→FS access. Frontend guards ≠ security. No false security claims. No placeholders. |

---

## 2. Gap / Contradiction / Security Concern / Architectural Gap Register

This section compares the original 72-section Master Prompt vs. the newly provided Enterprise RBAC+Governance text, plus internal consistency. Each finding has severity and resolution.

### 2.1 Role-set Conflict (Severity: HIGH — must resolve before implementation)
- **Original master §18** defined 5 roles: `FOUNDER / ADMIN / EDITOR / RESEARCHER / VIEWER`.
- **New governance text** defines 6 roles: `FOUNDER / ADMIN / MANAGER / TEAM_LEAD / EMPLOYEE / INTERN`.
- **Conflict**: Two incompatible role inventories.
- **Resolution (proposed)**: **Adopt the NEW 6-role hierarchy as canonical**, because:
  1. It is more enterprise-realistic (resource scoping, org hierarchy).
  2. It does not prevent "Editor" behavior — Editor-style rights simply become the `EDIT + UPLOAD + COMMENT` resource-permission bit-grants assigned to MANAGER/TEAM_LEAD/EMPLOYEE on their scoped resources.
  3. `RESEARCHER` from original can still be implemented as a **Team label/tag** (e.g., "Research Team") rather than a top-level role, which is more flexible. A Research team's workspace is granted to INTERN/EMPLOYEE as needed.
  4. `VIEWER` from original is equivalent to an EMPLOYEE/INTERN with only `VIEW` on certain resources.
- **Impact**: Requires updates to Role enum, seed data, RBAC tests, analytics role filters, and all role-gated UI labels. ✓ Fully tractable.

### 2.2 Permission-set Difference (Severity: MEDIUM-HIGH — resolution straightforward)
- **Original §19**: `VIEW, EDIT, COMMENT, DOWNLOAD, SHARE, ADMIN` (6 permissions).
- **New governance**: `VIEW, EDIT, COMMENT, UPLOAD, DOWNLOAD, SHARE, DELETE, MANAGE_ACCESS` (8 permissions).
- **Delta**: New adds `UPLOAD`, `DELETE`, `MANAGE_ACCESS`; renames `ADMIN → MANAGE_ACCESS` (clearer naming, avoids confusion with the ADMIN role).
- **Resolution (proposed)**: **Adopt the new 8-permission set as canonical.**
  - `UPLOAD` was implicit before but deserves its own bit (you can VIEW a folder but not UPLOAD — e.g., an auditor role).
  - `DELETE` was conflated with EDIT; separating them is correct enterprise DMS behavior.
  - `MANAGE_ACCESS` replaces the ambiguous permission-word `ADMIN`.
- **Impact**: Update permission enum, Permission entity, PermissionService bit checks, UI permission picker strings, tests, AC-9/TR-7.3 (original 6 → 8). ✓ Tractable.

### 2.3 Missing Entity: Team (Severity: HIGH — required by new governance)
- **New governance says**: "Permissions may be assigned through: Individual user / Role / **Team** / Workspace / Folder / Document / Asset".
- **Original master §4 entities list**: No `Team` entity.
- **Gap**: Missing Team + TeamMembership + TeamPermission tables.
- **Resolution (proposed)**: Add entities:
  - `Team(id, name, workspaceId nullable, description, createdAt, createdBy)` — a Team can optionally live inside a Workspace (most common) or be platform-level (e.g., "Research" platform team).
  - `TeamMembership(id, teamId, userId, roleWithinTeam:LEAD|MEMBER|CONTRIBUTOR enum?, joinedAt)` — needed for TEAM_LEAD scope checks and access reasoning.
  - Permissions are then additionally resolvable via: `User → TeamMembership → Team → TeamResourcePermission → (Workspace|Folder|Document|Asset)`.
- **Impact**: New entity + repo + service + 2 new seed teams ("Alpha Project Team", "Research Team") + analytics team filters + AC updates. ✓ Tractable.

### 2.4 Admin Scope Semantics (Severity: CRITICAL — security boundary)
- **New governance explicit rule**: "Admin should NOT automatically mean 'can see everything forever'."
- **Original master §18 example**: "ADMIN: full access - analytics - audit - user management - permissions - all documents". That phrase **contradicts the new rule directly**.
- **Resolution (proposed)**:
  - FOUNDER: Has platform-wide `*` scope; backend authorization short-circuits FOUNDER to "allow + governance visibility" (auditable as FOUNDER actions).
  - ADMIN: Has **platform-level USER/ROLE management** only; document/data visibility remains **scope-bound** unless explicitly granted a resource permission. An ADMIN cannot read Project Beta documents unless granted access; an ADMIN CAN revoke a user from Project Alpha because identity governance is a platform ADMIN capability.
  - In practice: implement a `ScopeResolver.isInScope(userId, resourceType, resourceId, action)` that returns true if: (a) user is FOUNDER, OR (b) permission graph intersects resource, OR (c) user is ADMIN AND action is a user-mgmt/identity-governance action (create user, assign role, view audit-for-their-domain-of-governance).
  - Audit: ADMIN governance actions (role changes, access grants) are themselves audited with previous/new permission state as required.
- **Impact**: Security architecture change — AC-8/AC-9 tests rewrite; `PermissionService` becomes `AuthorizationEngine` (combination of RBAC check + resource-perm check + scope + team membership resolution). This is **good, not bad** — exactly what makes this enterprise grade.

### 2.5 Audit Event Types Mismatch (Severity: MEDIUM — union resolution)
- **Original §22 list**: 20 event types.
- **New governance list**: ~20 event types with important additions: `ACCESS_GRANTED`, `ACCESS_REVOKED`, `ROLE_CHANGED`, `DOWNLOAD_DENIED`, `LOGIN_FAILURE`, `UNAUTHORIZED_ACCESS_ATTEMPT`, `AI_DOCUMENT_QUERY`, plus mandatory fields: `previousPermissionState`, `newPermissionState`.
- **Resolution (proposed)**: **Use the UNION set of events**, with the new access-governance event types and new mandatory fields added. This gives us ~27 event types and richer audit structure.
- **Impact**: AuditLog entity gains optional `previousState` / `newState` JSON columns; AC-19 updated; seed audit events updated. ✓ Tractable.

### 2.6 "RESEARCHER" role missing in new 6-role list (Severity: LOW — already addressed by 2.1)
- Original §18 had role RESEARCHER with "research workspace, documents, AI/RAG tools per permissions".
- Resolution, as 2.1: Treat Research as a Team + Workspace tag, not a top-level role. Any role (MANAGER/TEAM_LEAD/EMPLOYEE/INTERN) can be on the Research Team with appropriate VIEW/EDIT bits. ✓ Fully covered.

### 2.7 "DOWNLOAD_DENIED" audit event implies a rate-limit/excessive-attempts counter (Severity: MEDIUM — adds small module)
- New governance adds `DOWNLOAD_DENIED` event; §41 original already has rate limiting for sensitive APIs; §28 Security Event original already has `EXCESSIVE_DOWNLOAD_ATTEMPTS`.
- **Gap/Clarification**: Need a `SecurityEventRepository + ExcessiveAttemptsTracker` (in-memory bounded cache; Redis extension point) that counts denied DOWNLOAD attempts per user per doc per hour and escalates to EXCESSIVE_DOWNLOAD_ATTEMPTS security event when threshold crossed.
- **Resolution**: Add tracker as a `util.security` module; wire into File download controller before streaming.

### 2.8 "View why/through which role or team a user obtained access" — Governance UX (Severity: MEDIUM — new UI tab)
- New governance Access Governance requirement: "View why/access through which role or team a user obtained access".
- **Original master gap**: No UI surface for this, no API.
- **Resolution (proposed)**: Add **Admin → Access Inspector** page. Backend endpoint: `GET /api/v1/admin/access/user/{userId}/resource/{type}/{id}` returns:
  ```json
  {
    "effectivePermissions": ["VIEW","DOWNLOAD"],
    "sources": [
      { "via":"ROLE", "grant":"MANAGER", "workspace":"Project Alpha" },
      { "via":"TEAM", "grant":"Team Alpha Doc Edits", "team":"Alpha Engineering", "document":"..." }
    ]
  }
  ```
  This is a required admin governance tool per the new rules.
- **Impact**: New controller route + service method + new UI component (AccessInspectorComponent under features/admin).

### 2.9 "Intern C cannot download/copy" implies copy-deterrent respects permission bit (Severity: LOW-MEDIUM)
- New governance: "cannot download/copy them" for Intern C.
- Original §34 already has `appPreventCopy`; but we should additionally: **drive the copy-deterrent enablement from the effective permission set, not a boolean prop**. Specifically: if `COPY` effective=false (we can either add COPY as the 9th permission OR treat it as allowed when `DOWNLOAD + EDIT` are both allowed OR treat it as a derived bit: when DOWNLOAD is disallowed, copy prevention MUST activate).
- **Resolution (proposed)**: Define derived bit:
  ```
  COPY_ALLOWED = effective(DOWNLOAD) == true OR effective(MANAGE_ACCESS) == true
  ```
  and pass this into viewer watermark/DLP components. Also audit every PASTE_EVENT already (original §22).
- **Benefit**: Intern without DOWNLOAD automatically triggers stronger copy deterrents; auditable; no new permission enum constant needed unless you want explicit COPY bit (recommended not to — keeps 8 perms canonical).

### 2.10 Architectural Gap: Unified Authorization Engine (Severity: HIGH — structural)
- Combined spec requires resolving permissions across User direct + Role default + Team + Workspace inherited + Folder inherited + Document + Asset + Scope + Founder bypass.
- Original master's §6 had a simple "PermissionService" — insufficient.
- **Resolution (proposed)**: Elevate to an `AuthorizationEngine` interface with:
  ```
  boolean hasPermission(userId, resourceType, resourceId, action); // VIEW/EDIT/...
  Set<Permission> getEffective(userId, resourceType, resourceId);
  List<AccessSource> explain(userId, resourceType, resourceId); // for Access Inspector
  boolean isInScope(userId, resourceType, resourceId, action);  // founder/admin scoping
  ```
  Wire this engine into every service method that touches a resource (via AOP `@RequirePermission` annotation pointcut is cleanest; avoids manual if-else in every service method).
- **Impact**: Cleaner architecture, less bug-prone. Recommend AOP annotation.

### 2.11 Team entity ⇒ workspace-owned vs. platform-owned ambiguity (Severity: LOW — decision needed)
- Proposed: nullable `workspaceId` on Team. If null → platform-level team.
- This is a straightforward design choice, documented below in §5 ERD.

### 2.12 Seed data expansion (Severity: LOW)
- New model needs teams + memberships + a richer grant matrix to demonstrate scope isolation (Alpha/Beta project visibility split). Seed will reflect: Founder, 1 Admin, 2 Managers (Alpha, Beta), 2 Team Leads, 3 Employees, 2 Interns, Project Alpha workspace, Project Beta workspace, cross-team visibility restrictions.
- This strengthens the demo's enterprise credibility.

### 2.13 Frontend guard updates (Severity: LOW)
- New 6 roles → role guard conditionals, topbar role badge, analytics filters update. Minor effort.

### 2.14 AI Humanizer / AI Document Query audit + new event types (Severity: LOW)
- Already covered by union audit.

### 2.15 "Can escalate their own permissions" rule (Severity: MEDIUM, security)
- New TEAM_LEAD bullet: "Cannot escalate their own permissions." → translate: `MANAGE_ACCESS` self-assignment prevented in AuthorizationEngine when acting user == target user and acting user's role is TEAM_LEAD or lower AND target grant level would exceed current. FOUNDER self-change audited with a WARNING-level security event.
- Simple rule in AuthorizationEngine.hasGrant.

---

## 3. Resolved & Finalized Design Decisions

| # | Topic | Decision |
|---|---|---|
| D1 | Roles | 6 hierarchical: FOUNDER / ADMIN / MANAGER / TEAM_LEAD / EMPLOYEE / INTERN. (Original 5 roles retired; Researcher and Viewer become Team+Permission combinations.) |
| D2 | Permissions | 8 canonical: VIEW, EDIT, COMMENT, UPLOAD, DOWNLOAD, SHARE, DELETE, MANAGE_ACCESS. (COPY = derived, section 2.9.) |
| D3 | Permission Assignment Granters | User direct, Role default, Team, Workspace, Folder, Document, Asset. (Inheritance: Workspace → Folder → Document → Asset unless overridden with explicit DENY flag.) |
| D4 | Admin Scope | ADMIN has Identity Governance (user/role creation, access grant/revoke, audit review of governed domain). ADMIN has NO implicit document/data visibility. FOUNDER has platform-wide visibility + governance. |
| D5 | Team Entity | Yes (§2.3) — added with optional workspaceId. |
| D6 | Authorization Resolution Engine | Yes — centralized `AuthorizationEngine` + AOP `@RequirePermission` pointcut for services. |
| D7 | Access Inspector | Yes (§2.8) — explains "why" a user has access. |
| D8 | Audit Events | Union (~27 events) + `previousState/newState` JSON columns. |
| D9 | Excessive Attempts Tracker | Yes (§2.7), bounded cache, extension to Redis. |
| D10 | COPY Deterrent | Derived bit (§2.9); viewer components react to it. |
| D11 | Self-escalation Prevention | Rule in engine per §2.15. |
| D12 | Original 72-section Master Prompt | Remains the baseline specification for all non-RBAC items (editor, spreadsheet, PDF, image, AI/RAG, humanizer, versioning, diff, analytics, RAG pipeline, watermark, encryption, storage, config, performance, etc.). This update ONLY augments §18/§19/§22 and §4 Access Governance surfaces. |

---

## 4. Final Layered Architecture

### 4.1 Backend (Spring Boot) — Strict 5-Layer + Cross-Cutting

```
                      ┌───────────────────────────────────────────┐
                      │            REST Controllers               │  ← Thin. Validates, auth ctx, calls services, ApiResponse envelope.
                      │  (13 controllers: Auth/User/Workspace/    │     /api/v1/...  No business logic.
                      │   Folder/Document/Version/File/ Search/   │
                      │   Humanizer/Ai/Analytics/Audit/Export/    │
                      │   Admin+AccessInspector )                 │
                      └──────────────┬────────────────────────────┘
                                     │ calls
                      ┌──────────────▼────────────────────────────┐
                      │          Services (interfaces+impl)        │  ← Business logic, @Transactional.
                      │  Document/DocumentVersion/FileAsset/      │     Uses AuthorizationEngine via AOP.
                      │  User/Workspace/Permission+Authorization  │
                      │  Audit/SecurityEvent/ExcessiveAttempts/    │
                      │  Storage/AI/Humanizer/RAG/Search/          │
                      │  Analytics/Diff/Export/DataInitializer/    │
                      │  AccessInspector/TeamService               │
                      └──────────────┬────────────────────────────┘
                                     │ uses
                                     │
          ┌──────────────────────────┴──────────────────────────────┐
          │                                                          │
 ┌────────▼─────────┐  ┌──────────────┴────────────┐  ┌──────────────▼──────────────┐
 │     Mappers      │  │  AuthorizationEngine AOP  │  │     Cross-Cutting Modules    │
 │ (Entity↔DTO/Rec) │  │ @RequirePermission(...)   │  │  config  security  exception │
 │ User/Doc/Version/│  │ Resolves 8-perm graph     │  │  audit  storage  ai  rag     │
 │ File/Audit/WS/   │  │ incl Teams + scope rules  │  │  util  logging  swagger      │
 │ Folder/Team      │  │                          │  │  event-publisher  rate-limit │
 └────────┬─────────┘  └──────────────┬────────────┘  └──────────────┬──────────────┘
          │                           │                              │
          └───────────────────────────┼──────────────────────────────┘
                                      │ uses
                      ┌───────────────▼────────────────────────────┐
                      │              Repositories (JPA)             │  ← Derived/JPQL/Pagination/FetchGraphs.
                      │  User/Role/Workspace/Team/TeamMembership/  │
                      │  Folder/Document/DocumentVersion/FileAsset/│
                      │  DocumentPermission/TeamPermission/         │
                      │  AuditLog/AiInteraction/Comment/Tag/        │
                      │  DocumentTag/SearchIndexMetadata/           │
                      │  SecurityEvent                             │
                      └───────────────┬────────────────────────────┘
                                      │ manages
                      ┌───────────────▼────────────────────────────┐
                      │       Model (Entity / DTO / Request / Resp)│
                      │  Entity: 16 + DTO records (Request/Resp) + │
                      │  enums (6 Roles, 8 Perms, 27 Audit events, │
                      │  8 Security Events, Doc Status, Resource   │
                      │  Type).                                     │
                      └────────────────────────────────────────────┘
```

### 4.2 Authorization Resolution Flow (per protected call)

```
Method Invocation
   │
   ▼  AOP @RequirePermission(action=EDIT, resourceType=DOCUMENT, resourceIdArg="docId")
   │
   ├─► 1. Resolve userId from SecurityContextHolder
   │
   ├─► 2. Scope short-circuit:
   │       if user.role == FOUNDER → allow (audit FOUNDER_ACTION event)
   │       if action in {USER_MGMT, ROLE_MGMT, ACCESS_GOVERNANCE} AND user.role == ADMIN → allow + audit governance action
   │
   ├─► 3. Build candidate grants graph:
   │       (a) User direct: SELECT FROM DocumentPermission WHERE user_id=?
   │       (b) Team: SELECT FROM TeamPermission WHERE team_id IN (user's teams)
   │       (c) Role default: Role defaultPerms for role=EMPLOYEE etc
   │       (d) Workspace inherited: resource→folder→workspace WorkspacePermission
   │       (e) Folder chain: resource folder hierarchy FolderPermission (DENY wins over GRANT on same level)
   │       (f) Document-level
   │       (g) Asset-level (for assets only)
   │
   ├─► 4. Apply DENY-overrides (if any explicit DENY found in higher priority source for this action, stop → DENIED)
   │
   ├─► 5. Derived bit resolution (e.g., COPY_ALLOWED ↔ DOWNLOAD or MANAGE_ACCESS)
   │
   ├─► 6. Decision GRANT/DENY
   │
   ├─► 7. DENY → audit UNAUTHORIZED_ACCESS_ATTEMPT / DOWNLOAD_DENIED; return 403/ForbiddenException
   │
   └─► 8. GRANT → proceed; calling service then records domain audit (DOCUMENT_EDITED etc.)
```

### 4.3 Frontend (Angular) Structure

Unchanged in overall layout from spec §47; updated role-aware guards and added Admin → Access Inspector feature module.

```
src/app/
├── core/
│   ├── auth/                (LoginService, UserService, TokenInterceptor)
│   ├── guards/              (AuthGuard, RoleGuard, PermissionGuard)
│   ├── interceptors/        (AuthInterceptor, ErrorInterceptor, Csrf if session)
│   ├── services/            (DocumentService, TeamService, AccessInspectorService, AnalyticsService...)
│   └── models/              (User/Role/Team/Permission/Document/Workspace/FileAsset/AuditEvent models)
│
├── shared/
│   ├── components/          (ConfirmDialog, Toast, Modal, LoadingState, ErrorState, EmptyState, PermissionPicker)
│   ├── directives/          (appPreventCopy, appHasPermission structural directive)
│   ├── pipes/
│   └── ui/                  (Buttons, Inputs, Cards, Tables, Tag chips, Role badges)
│
├── features/
│   ├── dashboard/           (founder/admin/manager role-conditional widgets)
│   ├── documents/           (list, editor with TipTap, viewer, version-history, diff-viewer, share-dialog)
│   ├── files/               (file-upload, unified file-viewer dispatcher, spreadsheet, pdf-viewer, image-viewer)
│   ├── ai/                  (agent-drawer collapsible, humanizer floating toolbar + paste modal, citations panel)
│   ├── analytics/           (overview, activity, heatmap, version analytics, progress synthesizer)
│   ├── audit/               (audit log explorer with filters, security events view)
│   └── admin/               (users, roles, teams, team membership, ACCESS INSPECTOR tab §2.8)
│
└── layout/
    ├── sidebar/             (nav aware of role + scoped visible workspaces)
    ├── topbar/              (user menu, role badge, Ctrl+K search trigger)
    └── workspace/           (main content router-outlet)
```

---

## 5. Final Database Schema / Entity Relationships (Text ERD)

### 5.1 Entity Inventory: 18 Entities

| # | Entity | Purpose | Key Fields |
|---|---|---|---|
| E1 | **User** | Identity | id(UUID), username(UK), email(UK), passwordHash, displayName, role(Role enum, 6 values), active, createdAt, updatedAt |
| E2 | **Role** | Role metadata (optional but useful for display / future dynamic) | id, name(UK)=FOUNDER/ADMIN/... |
| E3 | **Workspace** | Top-level project container | id(UUID), name, description, createdBy(FK→User), createdAt, updatedAt |
| E4 | **Team** | Team, optionally within workspace | id(UUID), name, description, workspaceId(FK nullable→Workspace), createdBy, createdAt |
| E5 | **TeamMembership** | Users in Teams + role-in-team | id, teamId(FK), userId(FK), memberRole(LEAD\|MEMBER\|CONTRIBUTOR), joinedAt, UNIQUE(teamId,userId) |
| E6 | **Folder** | Nested folder tree | id(UUID), workspaceId(FK), parentFolderId(FK self nullable), name, createdAt, createdBy |
| E7 | **Document** | Doc (TipTap / sheet / text) | id(UUID), workspaceId, folderId(FK nullable), title, content, contentType, createdBy, updatedBy, createdAt, updatedAt, currentVersion INT, status(DRAFT\|ACTIVE\|ARCHIVED\|LOCKED), @Version optimisticLock INT |
| E8 | **DocumentVersion** | Snapshot history | id, documentId(FK), versionNumber, content, createdBy, createdAt, changeSummary |
| E9 | **FileAsset** | BLOB reference (storage abstraction) | id(UUID), documentId(FK nullable), fileName, fileType, mimeType, fileSize, storageKey(UK), checksum(SHA256), version INT, uploadedBy(FK), createdAt, encrypted BOOLEAN |
| E10 | **ResourcePermission** | Unified permission assignment (EAV-ish) for any resource via discriminator | id, granteeType(USER\|ROLE\|TEAM\|WORKSPACE), granteeId, resourceType(WORKSPACE\|FOLDER\|DOCUMENT\|ASSET), resourceId, permission(VIEW\|EDIT\|COMMENT\|UPLOAD\|DOWNLOAD\|SHARE\|DELETE\|MANAGE_ACCESS), allow(BOOLEAN true→GRANT false→DENY), assignedBy(FK), assignedAt |
| E11 | **AuditLog** | Append-only immutable | id, actorUserId, actorRole, action(27 enum union), entityType, entityId, entityName, ip, userAgent, sessionId, success(BOOLEAN), previousState(JSON nullable), newState(JSON nullable), timestamp(UTC) |
| E12 | **AiInteraction** | AI calls log | id, userId, type(HUMANIZE\|SUMMARIZE\|CHAT\|RAG_ANSWER\|PROGRESS_SYNC), providerName, modelName, promptTokens, completionTokens, inputSnippet, outputSnippet, inputTokensTruncated(flag so full prompt not logged), durationMs, createdAt, targetDocumentId(FK nullable), citations(JSON) |
| E13 | **Comment** | Doc comments / mentions | id, documentId(FK), authorId(FK), content, resolved(BOOLEAN), parentCommentId(FK self), mentions(JSON array of userIds), createdAt, updatedAt |
| E14 | **Tag** | Taxonomy | id, name(UK), color |
| E15 | **DocumentTag** | M:N doc↔tag | documentId, tagId (PK composite) |
| E16 | **SearchIndexMetadata** | Ingestion pipeline metadata | id, resourceType, resourceId, chunkCount, embeddingProvider, vectorStoreRef, lastIndexedAt, fingerprint |
| E17 | **SecurityEvent** | Security events (§28) | id, eventType(8 enum), severity(INFO\|WARNING\|CRITICAL), actorUserId, resourceType, resourceId, details(JSON), detectedAt, reviewedAt, reviewedBy(FK nullable) |
| E18 | **ExcessiveAttemptRecord** | Track denied actions for rate-limit (§2.7) | id, actorUserId, resourceType, resourceId, action (e.g. DOWNLOAD), windowStart(TS), deniedCount(INT) |
| Note on E10: | ResourcePermission | Unified design reduces 8 separate permission tables into 1 with clear discriminators. | Backend indexes on (granteeType, granteeId) and (resourceType, resourceId) make it fast. |

### 5.2 Relationships (text ERD lines)
```
User 1—N TeamMembership N—1 Team
Team N—1 Workspace (optional)
Workspace 1—N Folder (parentFolderId self-referential N—1)
Workspace 1—N Document
Folder 1—N Document
Document 1—N DocumentVersion
Document 1—N FileAsset
Document 1—N Comment
Document M—N DocumentTag — N Tag
Document 1—N SearchIndexMetadata (polymorphic via resourceType actually; E16 covers all)
User 1—N AuditLog (actor)
User 1—N AiInteraction
User 1—N SecurityEvent (actor)
User 1—N ExcessiveAttemptRecord
ResourcePermission relates grantee(User/Role/Team/Workspace) to resource(Workspace/Folder/Document/Asset)
```

### 5.3 Key Indexes (performance-critical)
- `AuditLog(actorUserId, timestamp DESC)`
- `AuditLog(action, timestamp DESC)`
- `AuditLog(entityType, entityId)`
- `ResourcePermission(granteeType, granteeId)`
- `ResourcePermission(resourceType, resourceId, permission)`
- `Document(workspaceId, folderId, status)`
- `DocumentVersion(documentId, versionNumber DESC)`
- `FileAsset(storageKey UNIQUE)`
- `SearchIndexMetadata(resourceType, resourceId, lastIndexedAt)`
- `SecurityEvent(eventType, detectedAt DESC)`
- `ExcessiveAttemptRecord(actorUserId, action, windowStart)`

---

## 6. Module Dependency Map (Backend)

Rules: Controllers depend on Services only. Services depend on (Repos + other Service Interfaces + Engine/Util) — never on controllers. Models are a leaf package depended on by all.

```
               ┌────────────────┐
               │    controller  │  (Auth, Admin, AccessInspector, Doc, File, ...)
               └───────┬────────┘
                       │ uses
               ┌───────▼──────────────┬────────────────────────────────────────────┐
               │       service        │                                            │
               │   (interfaces+impl)  │                                            │
               │ Doc / WS / Folder /  │                                            │
               │ File / Version /     │   AuthorizationEngine (+AOP aspect)        │
               │ Audit / Analytics /  │   AccessInspectorSvc                       │
               │ Export / Diff /      │   ExcessiveAttemptsTracker                 │
               │ Humanizer / Search/  │   EventPublisher(audit events)             │
               │ RAG / AI / Team /    │                                            │
               │ UserMgmt / Storage   │                                            │
               └──────┬───────────────┴─────────────────┬──────────────────────────┘
                      │                                 │ uses
          ┌───────────▼──────┐           ┌──────────────▼───────────┐
          │   mapper         │           │   cross-cutting packages │
          │ (entity↔dto)     │           │ config/security/exception │
          └──┬───────────────┘           │ audit/storage/ai/rag/util │
             │                           │ rate-limit/swagger/logging│
             └─────────┐                 └────────┬─────────────────┘
                       │ depends                   │
               ┌───────▼───────────────────────────▼────┐
               │              repository                │   ← 17 JPA repos (E1..E18, Role is small)
               └───────┬────────────────────────────────┘
                       │
               ┌───────▼──────────────┐
               │  model (entities/    │
               │  records/enums)      │   ← leaf package, all above depend on it
               └──────────────────────┘
```

### 6.1 AI / Storage Abstraction Extension Points (Cloud Migration — §67 original)
```
StorageService ────┬── LocalDriveStorageServiceImpl (MVP active)
                   └── S3StorageServiceImpl  (extension impl scaffold w/ properties)

AiProvider     ────┬── OllamaAiProvider (MVP active, SSE streaming)
                   ├── OpenAiCompatibleProvider (extension impl)
                   └── StubFallbackAiProvider (graceful "not configured", NEVER fabricates)

EmbeddingProvider ─┬── OllamaEmbeddings (local)
                   └── OpenAiEmbeddings (extension)

VectorStore    ────┬── InMemoryVectorStore (MVP, cosine)
                   └── PgVectorStore (extension, PostgreSQL schema migration sql included but optional)

CacheService   ────┬── NoOpCacheService (MVP default)
                   └── RedisCacheService (extension)
```

---

## 7. Revised 22-Phase Implementation Plan (Updated for 6 Roles + Team + Authz Engine)

This plan mirrors Master §70's generation philosophy but updates items affected by the RBAC+Governance update. Phases are dependency-ordered.

| Phase | Title | Scope Changes vs Original | Deliverables |
|---|---|---|---|
| **P1** | Project Structure | Minor: add admin/access-inspector placeholder folders; backend packages add `security.authz` for AuthorizationEngine/AOP; `audit.securityevent` package | Full skeleton + compile |
| **P2** | Spring Boot Config + Profiles | Minor: `pv.team.*`, `pv.security.authz.deny-wins-by-default=true`; `pv.audit.capture-previous-state=true` properties | 4 profiles; actuator; swagger; cors env-driven; startup green |
| **P3** | Entities & Relationships | **MAJOR UPDATE**: Add E4 Team, E5 TeamMembership; redesign E10 ResourcePermission (unified discriminator); add E17 SecurityEvent, E18 ExcessiveAttemptRecord; update AuditLog previousState/newState JSON + 27 action enum; User.role enum 6 values; 8 permission enum | 18 entities compile; H2 DDL validates FK + indexes |
| **P4** | Repositories | Add TeamRepo, TeamMembershipRepo, ResourcePermissionRepo, SecurityEventRepo, ExcessiveAttemptRepo; new derived queries for permission-graph resolution, access-inspector explain | 17 Repo interfaces; pagination/fetch joins work |
| **P5** | DTOs & Mappers | New: TeamRequest/Response, TeamMembershipResponse, PermissionGrantRequest/DTO, EffectivePermissionsDTO, AccessInspectorExplainResponse, SecurityEventResponse | ≥15 records; mappers cover new entities |
| **P6** | Services & Implementations | **MAJOR UPDATE**: Introduce AuthorizationEngine interface + InMemoryAuthorizationEngine impl; introduce AOP @RequirePermission aspect + integration tests; add TeamService, AccessInspectorService, SecurityEventService, ExcessiveAttemptsTracker; wire Document/File services to go through authz engine | All services; AOP gating active; scope tests pass |
| **P7** | Security & RBAC | **MAJOR UPDATE**: 6 roles; scope resolver (FOUNDER bypass, ADMIN identity-only); authz engine wired to method security; login/logout audit events (LOGIN_SUCCESS/FAILURE); tests for scope isolation: Admin cannot see Project Beta unless granted | Spring Security chain; scope matrix tests green |
| **P8** | Storage Abstraction + Local impl | Minor: encryption extension + storage-key convention + audit FILE_UPLOADED | Subdirs auto-created; path-traversal rejected; encrypted round-trip |
| **P9** | REST Controllers | **Addition**: AdminController → routes for Access Inspector `GET /admin/access/user/{id}/resource/{type}/{rid}`; new team management routes | 13 controllers; envelope; status codes |
| **P10** | Exception Handling + API Envelope | Add new `AuthorizationScopeException`, `PermissionDeniedException` subtypes; better message keys | @ControllerAdvice; safe messages; detailed logs |
| **P11** | Angular Core Architecture | New: AccessInspector API service; TeamService; `appHasPermission` structural directive (hides/show UI); role-guard updated for 6 roles | Core modules + lazy routes compile |
| **P12** | Dashboard + Navigation | Sidebar shows only authorized scoped workspaces (no Beta for Alpha-only Manager); topbar role badge | 4-pane layout + responsive |
| **P13** | Document Editor (TipTap) | Share/Permissions dialog now 8-permission picker + assignment to (User/Team/Role) | Editor + autosave + conflict UX + perms dialog |
| **P14** | File Mgmt + Unified Viewers | ExcessiveAttemptsTracker hooked before download stream; appPreventCopy reacts to derived COPY_ALLOWED; watermark includes role+team; permission check for UPLOAD/DOWNLOAD/DELETE independent bits | All 5 viewers; XLSX roundtrip; Intern without DOWNLOAD triggers strong deterrents |
| **P15** | Versioning + Diff Viewer | No change; audit VERSION_RESTORED remains | Restore + inline + side-by-side diffs |
| **P16** | AI Humanizer | Audit events AI_HUMANIZATION_REQUEST; stub fallback "not configured" never fabricates; floating toolbar permission-visible only if EDIT + humanize granted | SSE streaming + Paste & Humanize dual-pane |
| **P17** | RAG / AI Agent Drawer | Permission filter before LLM (no change); add AI_DOCUMENT_QUERY audit + citations; Team-level scoped retrieval | Summary/Q&A + grounded citations |
| **P18** | Search (Keyword + Semantic) | Minor: workspace/team filter chips in results | Ctrl+K global + endpoint |
| **P19** | Audit + Security Events System | **MAJOR UPDATE**: Union 27 events; previousState/newState JSON where applicable; Security Events admin sub-tab; excessive-attempts counter; honeytoken module scaffolding documented; 8 security event types wired | Audit log explorer + filters + event row count validation |
| **P20** | Founder Analytics Dashboard | Founder-only: All-company visibility. Admin sees only governed-domain. Manager/TeamLead: team-only widgets. + Access Inspector tab under Admin. Access Governance widget: top 10 grant actions, top 10 denied events. Progress Synthesizer Daily/Weekly/Monthly (observed vs AI summary). | Full dashboard + heatmap + audit explorer + access gov |
| **P21** | Testing | **Major additions**: AuthorizationEngine scope matrix test (Alpha/Beta visibility split per roles); permission inheritance tests; self-escalation prevention test; Access Inspector explain-source test; excessive-attempts threshold test | Backend ≥40 tests pass; frontend ≥20 specs pass |
| **P22** | Seed Data + README + Final Verification | **Major Seed Expansion**: 4→10 users (Founder/Admin, 2 Managers(Alpha/Beta), 2 Team Leads, 3 Employees, 2 Interns); 2 workspaces; 2 teams; Alpha-only/Beta-only permissions intentionally split so you CAN prove scope isolation in demo; README documents: 6 roles, 8 perms, Access Inspector, Admin≠full-read, seed creds + DEV-ONLY warning; verification 17-point checklist (Master §71) with new point: "Admin cannot view Project Beta documents" | All green; seed demonstrates scope isolation; README complete with architecture.md reference |

---

## 8. Critical Security Principles Summary (Reminder — no false claims)

Per Master §69 + Enterprise Governance rules combined:
1. No statement that Canvas / JS / Watermark / Copy-Prevent are cryptographic boundaries.
2. Actual security boundary: Authentication + AuthorizationEngine (resolved server-side, scope-aware, team-aware, DENY-overridable) + Backend access control + Storage encryption at rest + Append-only immutable audit + Security-event alerting + Excessive attempts tracking.
3. Communicate: "Unauthorized extraction is deterred, controlled, monitored and auditable."
4. FOUNDER visibility bypass is audited as FOUNDER_ACTION events to maintain governance traceability.
5. ADMIN identity-governance actions (grant/revoke/role change) each create audit log rows with `previousState` + `newState` JSON. Auditable by FOUNDER.
6. Explicit deny in ResourcePermission wins over any inherited grant at lower scope.

---

## 9. Next Steps Proposed

1. **Your review of this document** — confirm D1..D12 decisions, confirm E1..E18 schema, confirm 22-phase plan.
2. I then **rewrite `spec.md` and `tasks.md`** to fully reflect:
   - 6 roles, 8 permissions, 18 entities, AuthorizationEngine design, Access Inspector API, scope rules, 27 audit events with state columns, excessive attempts tracker, team entity & permissions, updated seed matrix, Admin visibility rule.
3. **Second round of approval** on the regenerated spec/tasks artifacts.
4. **Then, and only then**, proceed to implementation Phase 1→22 per the plan (with concurrent delegation for independent non-overlapping subtasks during implementation phases as Spec Mode permits).
