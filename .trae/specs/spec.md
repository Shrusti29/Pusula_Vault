# PUSULA VAULT - Product Requirements Document

> **Reference Architecture**: Companion [architecture.md](file:///c:/Users/USER/Documents/trae_projects/Pusula_Vault/.trae/specs/architecture.md) contains the Gap/Contradiction Register (15 findings), Finalized Design Decisions (D1–D12), Layered Architecture diagrams, 18-Entity Text ERD, Module Dependency Map, and the Revised 22-Phase Implementation Plan. This `spec.md` is the canonical requirements and AC document; both artifacts must be read together.

## Overview
- **Summary**: PUSULA VAULT is an AI-Powered Secure Enterprise Knowledge Management Platform. Centralized secure workspace where teams create/edit knowledge documents, manage spreadsheets, upload/view PDFs/images, organize project knowledge and research, maintain document versions with diffs, search organization-wide, use AI for summarization/Q&A/humanization, track progress, maintain immutable audit history, and monitor founder/team analytics with scope-aware access governance.
- **Purpose**: Production-oriented, secure, scalable, modular platform combining: Enterprise Knowledge Base + Secure DMS + Notion-style Workspace + Google-Docs Editing + Excel Spreadsheets + AI Research Assistant + RAG Knowledge Search + Git-style Document Versioning + Founder Governance Dashboard + Enterprise Audit/DLP with explicit scope/team resource permissions.
- **Target Users**: 6 hierarchical roles — FOUNDER, ADMIN, MANAGER, TEAM_LEAD, EMPLOYEE, INTERN — plus logical Teams (e.g., "Alpha Project Team", "Research Team") that receive resource permissions independently of or in combination with role defaults.

## Goals
- Build a complete production-grade product (not a portfolio / demo / CRUD toy), demonstrably enterprise-ready.
- Deploy fully on a local Windows machine using `E:/PusulaKM_Data` while fully abstracting storage, AI providers, and DB configuration so the application can later migrate to hosted/cloud without rewriting business logic.
- Implement strict 5-layer backend (Model → Repository → Service → Controller → Mapper) plus cross-cutting (security/authz/audit/storage/ai/rag/util/exception/config) with **no** business logic or queries in controllers.
- Implement Angular SPA (Standalone, Signals, Router, Interceptors, Guards, RxJS, Lazy routes) with clean enterprise dashboard UX, TipTap editor, spreadsheet engine, unified PDF/image/text viewers.
- Implement pluggable AI/RAG/Humanizer SSE streaming (Ollama-local + OpenAI-compat extension + graceful stub fallback when not configured — NEVER fabricates AI output).
- Implement **RBAC + Resource-Level Permissions + Team/Workspace Scope + DENY-overridable inheritance** via a centralized `AuthorizationEngine` (8 permission bits: VIEW/EDIT/COMMENT/UPLOAD/DOWNLOAD/SHARE/DELETE/MANAGE_ACCESS; grantees: User/Role/Team/Workspace).
- **Critical Scope Rule**: ADMIN ⇏ full data visibility. FOUNDER = full-platform visibility + governance; ADMIN = Identity Governance (user/role/grants management + audit review within governed domain) — but NO implicit document/data visibility unless explicitly granted.
- Implement version control (inline + side-by-side diff viewer), export, founder/role-scoped analytics, audit explorer, unified search (keyword + semantic), searchable OCR for images.
- Final verification: backend compiles and starts; frontend compiles and serves; H2 schema creates cleanly; seed data demonstrates scope isolation (e.g., Manager Alpha cannot view Project Beta documents); CRUD/upload/preview/permissions/versioning/audit/humanizer/search/analytics/error handling all work end-to-end.

## Non-Goals
- Real-time WebSocket collaboration (architected as future module; NOT MVP mandatory).
- Redis mandatory for local dev (caching abstraction only; NoOp default).
- PostgreSQL mandatory for local dev (H2 for dev; PostgreSQL-ready config provided).
- KMS/Secret Manager locally (abstraction only; env vars suffice for local).
- Honeytoken module operational by default (extension point + scaffolding only).
- Mobile phone breakpoints (desktop/laptop/tablet responsive only).
- False security claims: Never assert Canvas / JS / Watermark / Copy-prevent = cryptographic boundary. Communicate realistic defense-in-depth: "Unauthorized extraction is deterred, controlled, monitored, and auditable."

## Background & Context
- Repository is empty (greenfield).
- Master System Prompt (72 detailed sections) path: `c:\Users\USER\AppData\Roaming\Trae\User\workspaceStorage\70ad5bdcd79c251805dd7666ecd09433\long-text\home\muqntaws-5ds0\# MASTER S....txt`
- Mandatory Architecture: Angular SPA + Spring Boot REST/SSE + Relational DB + Abstracted File Storage + AI/RAG + Security/Audit Layer.
- Mandatory Backend Package Root: `com.pusula.km` with 5 core layers (`model/repository/service/controller/mapper`) plus cross-cutting (`config/security/exception/audit/storage/ai/rag/util`).
- User-provided Enterprise RBAC & Access Governance supersedes/extends original §18/§19/§22 of the Master Prompt; the original 5 roles are retired in favor of 6 hierarchical roles; original 6 permissions expanded to 8; Team entity + Access Inspector API are introduced.
- Generation order mandated in 22 phases (see `architecture.md` §7 for the 22-phase matrix updated for new governance).

## Functional Requirements
- **FR-1 Enterprise Auth & RBAC + Scope**: Spring Security authentication; 6 roles (FOUNDER/ADMIN/MANAGER/TEAM_LEAD/EMPLOYEE/INTERN); FOUNDER-only full-platform visibility; ADMIN scoped to Identity Governance (user/role/grant management) only; Angular route guards + server scope enforcement on every protected call.
- **FR-2 Resource-Level Permissions (8 bits × 7 grant sources)**: VIEW, EDIT, COMMENT, UPLOAD, DOWNLOAD, SHARE, DELETE, MANAGE_ACCESS — grantable via User direct, Role default, Team, Workspace, Folder, Document, Asset. Inheritance Workspace→Folder→Document→Asset; explicit DENY on any higher source overrides lower-level GRANTs. Centralized AuthorizationEngine resolves per API call.
- **FR-3 Team Entity**: Teams (optionally workspace-scoped or platform-level); TeamMembership with memberRole (LEAD/MEMBER/CONTRIBUTOR). Permissions may be assigned to a Team, then inherited by members.
- **FR-4 Workspace/Folder/Document CRUD**: Create/read/update/delete Workspaces, nested Folders, Documents (DRAFT/ACTIVE/ARCHIVED/LOCKED); optimistic locking with conflict-resolution UX.
- **FR-5 File Management**: Upload DOCX/XLSX/CSV/PDF/PNG/JPG/JPEG/WEBP/SVG/TXT/MD; drag-drop; attach to doc; preview; versions; export PDF/DOCX/XLSX; UPLOAD/DOWNLOAD/DELETE permission bits gated separately; MIME/ext/size/checksum/path-traversal validation; secure storage keys; raw filesystem paths never exposed.
- **FR-6 TipTap Document Editor**: WYSIWYG (headings/paragraphs/bold/italic/underline/lists/tables/links/code/quotes/images/comments/metadata); autosave debounced (1500ms); version creation on meaningful save.
- **FR-7 Spreadsheet (FortuneSheet or Handsontable)**: cells/formulas/rows/cols/multi-sheet/basic Excel-compatible formulas/copy-paste authorized workspace/import XLSX/export XLSX/autosave/versioning; ExcelJS backend processing.
- **FR-8 PDF Viewer (PDF.js)**: page nav/zoom/search/thumbs/annotations-feasible/watermark-overlay; controlled streaming + auth + permission + audit + download-policy + DLP deterrents; DOWNLOAD permission bit controls stream-download button visibility AND server enforcement.
- **FR-9 Image Viewer**: zoom/pan/crop/annotate/rotate/fullscreen/OCR (Tesseract.js or backend) / watermark; OCR text indexed & searchable via RAG/keyword; DLP deterrents activate if derived COPY_ALLOWED=false (COPY_ALLOWED = DOWNLOAD ∨ MANAGE_ACCESS).
- **FR-10 Unified FileViewerComponent**: dispatches to DOC/SHEET/PDF/IMAGE/TEXT sub-viewers per mimeType/type; consistent workspace UX.
- **FR-11 Version Control**: every meaningful update versionable; author/timestamp/changeSummary/content snapshot; view history; restore; compare versions.
- **FR-12 Git-style Diff Viewer**: inline + side-by-side; additions/deletions/modifications; generated from real stored versions, no placeholder.
- **FR-13 Append-Only Immutable Audit**: 27 union-event types (LOGIN_SUCCESS/FAILURE, LOGOUT, DOCUMENT_CREATED/VIEWED/EDITED/DELETED, VERSION_CREATED/RESTORED, FILE_UPLOADED/VIEWED/DOWNLOADED, DOWNLOAD_DENIED, SEARCH_PERFORMED, AI_HUMANIZATION_REQUEST, AI_DOCUMENT_QUERY, AI_QUERY, PASTE_EVENT, ACCESS_GRANTED, ACCESS_REVOKED, ROLE_CHANGED, PERMISSION_CHANGED, USER_CREATED, USER_UPDATED, DOCUMENT_SHARED, EXPORT_CREATED, UNAUTHORIZED_ACCESS_ATTEMPT). AuditLog columns include previousState(JSON)/newState(JSON)/actorRole/entityName/sessionId where applicable. No sensitive payloads.
- **FR-14 Access Governance Toolkit**: Admins & Founder can: Grant/revoke/modify permissions; view who has access; **Access Inspector API** explains "why/through which role or team a user obtained access" (source explainability); review access history; detect suspicious access patterns; review failed authorization attempts.
- **FR-15 Self-Escalation Prevention**: TEAM_LEAD and lower cannot escalate their own permissions (MANAGE_ACCESS self-grant blocked). FOUNDER self-change is permitted but audited as FOUNDER_SELF_CHANGE (WARNING-level security event).
- **FR-16 Excessive Attempts Tracking**: Per-user-per-resource-per-action sliding window counters for denied DOWNLOAD (and similar sensitive actions); threshold crossed → EXCESSIVE_DOWNLOAD_ATTEMPTS Security Event; Redis extension point for production; bounded in-memory default.
- **FR-17 Founder/Role-Scoped Analytics Dashboard**: Overview (totals/users/docs/files/storage/created/modified/AI interactions/active users); Activity daily/weekly/monthly; GitHub-style heatmap; Audit Explorer filter (user/event/doc/date/workspace/action); Version analytics (most-edited / most-active contributors / version freq); Role-scoped visibility: FOUNDER all, ADMIN governed-domain, MANAGER/TEAM_LEAD team-only; Access Governance widgets: top grant actions, top denied events; AI Progress Synthesizer Daily/Weekly/Monthly with distinct Observed Activity vs AI-Generated Summary labels.
- **FR-18 AI Humanizer**: Floating ✨ Humanize toolbar on text selection; 5 tones (Technical/Professional/Conversational/Concise/Formal); preserves meaning/facts; NOT marketed as detector-bypass; Paste & Humanize dual-pane modal; Original/Improved sides; tone-select/stream-output/diff-highlight/regenerate/Insert-into-editor; every action auditable as AI_HUMANIZATION_REQUEST; SSE endpoint `/api/v1/ai/humanize/stream`.
- **FR-19 Right-Side Collapsible AI Agent Drawer**: Document summary (executive/key points/action items); Document Q&A with grounded, cited responses; every answer cites sources as (Title — Version — Section) citations; citations clickable to doc/version when authorized; never exposes documents the user is not authorized to view (AuthorizationEngine + RAG permission filter BEFORE chunks reach LLM).
- **FR-20 RAG Architecture**: Pipeline: Document → Extract → Chunk → Metadata → Embed → Vector Store → Similarity Search → **Permission Filter BEFORE LLM** → Grounded Response; PostgreSQL+pgvector extension point; default in-memory cosine for local.
- **FR-21 Document Ingestion**: DOCX/PDF/XLSX/CSV/TXT/MD/IMAGE(OCR) pipeline: Upload→validate→store→extract→chunk→index→audit. 7 positive types. Unsupported rejected with validation.
- **FR-22 Unified Search**: Keyword + Semantic. Ctrl+K global bar; result cards: title/type/matching snippet/author/last-modified/workspace/version. Debounced.
- **FR-23 AI Citations**: Every RAG factual answer exposes numbered sources; UI citations panel; clickable when authorized.
- **FR-24 Watermarking**: Dynamic SVG/CSS overlay (USERNAME, ROLE, TEAM, TIMESTAMP, SESSION) on protected viewers; sensitive assets optional server-side/render-level watermark.
- **FR-25 DLP Deterrents**: `appPreventCopy` directive; disables context menu/ordinary Ctrl+C/drag-out/text-selection/print on protected viewers; activation driven by derived COPY_ALLOWED; download buttons hidden when DOWNLOAD permission absent.
- **FR-26 Security Events**: 8 events: UNAUTHORIZED_DOCUMENT_ACCESS, INVALID_FILE_ACCESS, PATH_TRAVERSAL_ATTEMPT, EXCESSIVE_DOWNLOAD_ATTEMPTS, HONEYTOKEN_ACCESS, INVALID_TOKEN, PERMISSION_DENIED, FOUNDER_SELF_CHANGE. Severity levels INFO/WARNING/CRITICAL. Exposed to authorized Admin/Founder.
- **FR-27 Honeytoken Module (extension point/scaffold)**: decoy docs/IDs/test-only credentials/decoy sensitive records; unexpected access → Security Event → Audit → Founder alert. No real secrets; no harm to legitimate users. Scaffolded but NOT active by default.
- **FR-28 API Standard Envelope**: `{success,message,data,timestamp}`; consistent pagination.
- **FR-29 Global Exception Handler**: `@ControllerAdvice` for ResourceNotFound/UnauthorizedAccess/Forbidden/AuthorizationScope/PermissionDenied/Validation/Storage/FileProcessing/AiProvider/Rag/Conflict; safe messages to frontend, detailed diagnostics server-side; never stack traces to client.
- **FR-30 Validation**: Jakarta @NotNull/@NotBlank/@Email/@Size/@Positive both frontend and backend; NEVER trust frontend validation alone.
- **FR-31 CORS & Security Config**: Dedicated configuration classes; NO `allowAllOrigins="*"` for production; origins via properties/env.
- **FR-32 Rate Limiting**: login / AI requests / uploads / search / sensitive APIs; excessive attempts wired to FR-16 tracker for sensitive actions.
- **FR-33 File Upload Protection**: max size, allowed MIME + allowed extension (both, don't trust Content-Type alone); filename sanitization; path-traversal prevention; checksum generation; secure storage keys; suspicious files rejected.
- **FR-34 Encryption at Rest (abstraction)**: AES-256; keys from env vars or KMS/SecretManager abstraction; encrypt sensitive files appropriately; HTTPS production; NEVER log passwords/tokens/API keys/raw sensitive document contents.
- **FR-35 Backup Architecture**: DB / file / config backup-ready architecture; do NOT automatically delete historical versions.
- **FR-36 Config Profiles**: application.properties / application-local.properties / application-dev.properties / application-prod.properties; production secrets env or secret-manager-only.
- **FR-37 OpenAPI/Swagger**: Document Auth / Document / File / AI / Search / Analytics / Audit / Admin / Access-Inspector APIs.
- **FR-38 Structured Logging**: timestamp/requestId/userId/operation/status/duration; no sensitive data.
- **FR-39 Angular Structure**: `core/auth|guards|interceptors|services|models` + `shared/components|directives|pipes|ui` + `features/dashboard|documents|files|ai|analytics|audit|admin (users|roles|teams|access-inspector)` + `layout/sidebar|topbar|workspace`; lazy-loaded routes; `appHasPermission` structural directive; role-aware widgets.
- **FR-40 Main UI 4-Pane Layout**: Topbar (user menu + role badge + Ctrl+K trigger) + Sidebar (workspace-scoped visible nav) + Main Workspace + Collapsible Right AI Drawer; clean professional enterprise aesthetic (not student/portfolio).
- **FR-41 Dashboard**: recent docs/recently-edited/recent-files/activity/quick-create/upload/AI-assistant-entry/search/workspace-stats; role-scoped widgets.
- **FR-42 Document Workspace Page**: Title / Breadcrumb / Version indicator / Last-edited / Save-status / Share-Permissions dialog (8-bit picker, grantee User/Team/Role/Workspace) / Version history / AI-tools / Comments tabs.
- **FR-43 Notifications**: ToastService / ModalService / ConfirmDialog / LoadingState / ErrorState / EmptyState — every async action provides appropriate feedback.
- **FR-44 Performance**: lazy routes, debounced search, paginated APIs, efficient JPA queries, indexes, caching abstraction, compressed responses where appropriate, lazy-loaded heavy viewers, virtual scrolling for large audit/explorer lists.
- **FR-45 Comments & Mentions**: comments / @mentions / discussion / resolution status (realtime future extension only).
- **FR-46 Seed Data (scope-isolation demo)**: Founder, 1 Admin, 2 Managers (Alpha, Beta), 2 Team Leads, 3 Employees, 2 Interns; 2 workspaces (Project Alpha, Project Beta); 2 Teams (Alpha Engineering, Research); Alpha/Beta access intentionally split (Manager Alpha CANNOT view Project Beta documents); folders/5+ docs/versions/FileAsset metadata/audit rows.
- **FR-47 Error/Empty/Unauth/NotFound States**: Every major screen handles: loading / success / empty / error / unauthorized / not found — no blank screens ever.
- **FR-48 No Placeholders**: No TODO/implement later/dummy/empty/coming soon/pseudo-code/truncated. Each feature either fully implemented or explicit extension point with working fallback; AI stub fallback explicitly says AI not configured (never fabricated answers).
- **FR-49 SOLID visibly demonstrated**: SRP/OCP (Storage/AI replaceable impls)/LSP/ISP/DIP (services depend on abstractions, never concrete LocalDriveStorageServiceImpl directly).
- **FR-50 Future Cloud Migration Paths**: Local Storage→S3; H2→PostgreSQL; Local Ollama→Enterprise AI; In-Memory Vector→pgvector/VectorDB; NoOp Cache→Redis; Local→Hosted. All replaceable without rewriting business logic; service layer agnostic.
- **FR-51 Observability Extension Points**: health checks / metrics / tracing / audit monitoring / app monitoring. Spring Boot Actuator where appropriate.
- **FR-52 README Setup**: Java/Node/Angular versions; DB setup; env vars; Ollama setup; PostgreSQL optional; local storage setup; commands `mvn spring-boot:run` + `npm install && ng serve`; seed credentials explicitly marked DEV-ONLY.

## Non-Functional Requirements
- **NFR-1 Layer Discipline**: No business logic/queries/entity exposure in controllers. No Angular→direct filesystem access. No controller-heavy monolith.
- **NFR-2 Security Boundary**: Frontend route guards ≠ security. AuthorizationEngine enforced server-side on every protected operation. Scope rule: ADMIN identity-governance powers do not grant automatic document/data read access.
- **NFR-3 Idempotent & Auditable**: every meaningful state transition produces immutable AuditLog row with appropriate previousState/newState for grants/role changes.
- **NFR-4 Replaceable Providers**: StorageService, AiProvider, EmbeddingProvider, VectorStore, CacheService each have interface + 1 functional Local/H2/default implementation present + documented S3/PostgreSQL/Ollama-compat/Redis extension point without breaking build.
- **NFR-5 Build & Start**: `mvn spring-boot:run -Dspring-boot.run.profiles=local` backend starts cleanly. `npm install && ng serve` frontend serves. No compile errors.
- **NFR-6 H2 local works**: profile-local creates clean schema + seed data; `E:/PusulaKM_Data` subdirectories auto-created.
- **NFR-7 Professional UI Aesthetic**: enterprise dashboard; no clutter; serious internal product; consistent palette/typography/spacing.
- **NFR-8 Responsive**: desktop/laptop/tablet usable without breakage.
- **NFR-9 No False Security Claims**: Documentation/UI/text asserts defense-in-depth realistic phrasing; no strings claiming impossible extraction or JS blocks screenshots/devtools.
- **NFR-10 Deterministic local demo**: seed credentials stable; flows end-to-end observable; scope isolation demo provable (login Manager Alpha → attempt to open Project Beta doc → 403 + audit DENIED row).

## Constraints
- **Technical**: Java + Spring Boot (Web/JPA/Hibernate/Validation/Security/Lombok/AOP) + Maven; PostgreSQL-ready + H2 dev profile; SSE/SseEmitter; Angular (TypeScript, Standalone, Signals, Router, HTTP, Guards, Interceptors, RxJS, Lazy routes, Reactive Forms); TipTap; FortuneSheet or Handsontable; PDF.js; ExcelJS backend; OCR (Tesseract.js or backend); AI abstraction (Ollama/OpenAI-compat/stub).
- **Business**: First deploy local Windows; `E:/PusulaKM_Data` via property `file.upload-dir`; never hardcode in business logic.
- **Dependencies**: JDK (documented), Maven, Node.js (documented), optionally PostgreSQL, optionally Ollama.

## Assumptions
- You have or will install compatible JDK/Maven/Node.js versions.
- H2 (file-backed or in-memory) for local dev is acceptable; PostgreSQL configuration is provided but not required for MVP local run.
- Ollama optional: when unreachable or `ai.provider=stub`; graceful "AI provider not configured" message returned; no faked output.
- `E:/PusulaKM_Data` writable.
- Seed credentials are demo-only, well-known, and explicitly marked DEV-ONLY with a security warning in README.

## Open Questions (resolved in architecture.md D1–D12; reproduced here for your ratification)
- [x] **D1**: 6 roles: FOUNDER/ADMIN/MANAGER/TEAM_LEAD/EMPLOYEE/INTERN — original roles EDITOR and RESEARCHER retired (RESEARCHER becomes Team, Editor-style rights = permission bits). **Accept**?
- [x] **D2**: 8 permissions: VIEW, EDIT, COMMENT, UPLOAD, DOWNLOAD, SHARE, DELETE, MANAGE_ACCESS (COPY = derived = DOWNLOAD ∨ MANAGE_ACCESS). **Accept**?
- [x] **D3**: Permissions grantable via User/Role/Team/Workspace/Folder/Document/Asset. Inheritance Workspace→Folder→Doc→Asset; explicit DENY wins. **Accept**?
- [x] **D4**: ADMIN = Identity Governance only (no auto document/data visibility); FOUNDER = full platform visibility + governance. **Accept**?
- [x] **D5**: Team entity added; nullable workspaceId (platform-level vs workspace-level teams). **Accept**?
- [x] **D6**: AuthorizationEngine central resolver + AOP @RequirePermission on services. **Accept**?
- [x] **D7**: Access Inspector API + Admin tab explains "why" a user has access. **Accept**?
- [x] **D8**: Audit events = 27 union; previousState/newState JSON columns. **Accept**?
- [x] **D9**: Excessive attempts tracker (default in-memory bounded, Redis extension). **Accept**?
- [x] **D10**: COPY_ALLOWED = derived bit drives DLP deterrents. **Accept**?
- [x] **D11**: TEAM_LEAD+ cannot self-escalate permissions; FOUNDER self-change audited WARNING. **Accept**?
- [x] **D12**: Original 72-section Master Prompt remains baseline for all non-RBAC items (editors, viewers, AI, versioning, analytics, storage etc); RBAC update only modifies §18/§19/§22 surfaces and adds governance APIs. **Accept**?

If you disagree with any of D1–D12, specify the change before approval; these are locked post-approval (changes require approved spec amendment and regenerating tasks).

## Acceptance Criteria

> Note: Every AC below is mapped to specific implementation Tasks in `tasks.md`; AC type ∈ {rule, rubric}.

### AC-1: Strict 5-Layer Backend Architecture
- **Type**: `rule`
- **Given**: Spring Boot project under `backend/`, package root `com.pusula.km`
- **When**: Inspecting layout and controller code
- **Then**: 5 core packages exist (`model/repository/service/controller/mapper`); cross-cutting packages exist (`config/security/exception/audit/storage/ai/rag/util`); controllers contain no business logic, no JPQL/SQL strings, no JPA entity types in signatures/returns; services contain `@Transactional` logic; mappers used for entity↔dto
- **Pass Condition**: Grep for JPQL keywords in controllers returns 0 matches; grep `class .*Controller` source never references `JpaRepository` directly; compile succeeds
- **Evidence**: Directory listing + grep results + compile log

### AC-2: 18 Entities with PK/FK/Indexes/UUIDs/@Version
- **Type**: `rule`
- **Given**: Model package
- **When**: Inspecting entity list and H2 DDL
- **Then**: 18 entities present (User/Role/Workspace/Team/TeamMembership/Folder/Document/DocumentVersion/FileAsset/ResourcePermission/AuditLog/AiInteraction/Comment/Tag/DocumentTag/SearchIndexMetadata/SecurityEvent/ExcessiveAttemptRecord); all have `@Entity @Table`; PK/FK/indexes; UUIDs for major externally exposed; `Document` has `@Version`; AuditLog append-only (no cascade UPDATE/DELETE from parents)
- **Pass Condition**: 18 files compile; Hibernate DDL creates 18 tables with FKs; Document `@Version` present in source
- **Evidence**: Entity listing; `mvn compile` success; Hibernate show-sql log of CREATE TABLEs

### AC-3: Repositories (17+) + Pagination + FetchGraphs (N+1 avoided)
- **Type**: `rule`
- **Given**: Repository package
- **When**: Inspecting repositories + running sample queries
- **Then**: Repositories for all major entities incl. Team/TeamMembership/ResourcePermission/SecurityEvent/ExcessiveAttempt; permission-graph resolution methods exist; Access Inspector source-query methods exist; pagination/sorting used; Workspace/Folder/Document listing uses fetch join/entity graph (no N+1)
- **Pass Condition**: Repository count ≥17; `Page<Document>` pageable returns correct size; Hibernate debug SQL of workspace→folders→docs is 1 query with JOIN FETCH (not N+1)
- **Evidence**: Repo listing; integration test; Hibernate SQL debug

### AC-4: DTO Records (≥20) + Mappers (≥9)
- **Type**: `rule`
- **Given**: Model DTOs and Mapper package
- **When**: Inspecting DTOs and mappers
- **Then**: ≥20 Java Records as Request/Response (must include: Team, TeamMembership, PermissionGrant, EffectivePermissions, AccessInspectorExplain, SecurityEvent); ≥9 mapper classes; controllers use mappers; REST payload types never JPA entities
- **Pass Condition**: DTO count by files; mappers used in controllers; no entity in controller return types
- **Evidence**: Source grep; compile passes

### AC-5: Service Layer + AuthorizationEngine AOP Integration
- **Type**: `rule`
- **Given**: Service package + security.authz package
- **When**: Spring context loads and test method invocations run
- **Then**: Service interfaces + impls annotated @Service/@Transactional; AuthorizationEngine.hasPermission(userId,resourceType,resourceId,action) resolves 8 permissions across grant sources; AOP aspect intercepts methods annotated @RequirePermission and DENIES without calling service body; DENY produces audit row; FOUNDER scope bypass works; ADMIN identity-governance scope works (but no data bypass)
- **Pass Condition**: Spring context loads; method invocation with insufficient permission throws ForbiddenException/403; role-scope matrix tests
- **Evidence**: Spring test log; unit test asserts; scope test matrix

### AC-6: 6 Roles + 8 Permissions + Scope Isolation Demo
- **Type**: `rule`
- **Given**: Seeded database with Alpha/Beta split
- **When**: Authenticating as Manager Alpha → GET /api/v1/documents/{betaDocId} → GET workspaces list → Admin attempt Beta doc
- **Then**: 6 roles exist; role enum values = FOUNDER/ADMIN/MANAGER/TEAM_LEAD/EMPLOYEE/INTERN; Manager Alpha → Beta doc returns 403 (not in scope + no direct grant); workspaces list shows Alpha only; Admin → Beta doc ALSO returns 403 unless explicitly granted; FOUNDER → Beta doc returns 200
- **Pass Condition**: 403/200 matrix above all match; audit rows UNAUTHORIZED_ACCESS_ATTEMPT present for denied
- **Evidence**: HTTP integration tests; audit row assertions

### AC-7: ResourcePermission Unified Table + Access Inspector Explain Sources
- **Type**: `rule`
- **Given**: ResourcePermission seeded with grants via User, Team, Workspace for same user+document
- **When**: Calling `GET /api/v1/admin/access/user/{id}/resource/DOCUMENT/{docId}`
- **Then**: Returns `effectivePermissions` (set of 8 bits) AND `sources` array with via=(USER|ROLE|TEAM|WORKSPACE|FOLDER) + grantName + description
- **Pass Condition**: Response JSON keys matches spec; sources list explains actual grants stored; FOUNDER/ADMIN only can call API
- **Evidence**: HTTP response JSON; test assertions

### AC-8: StorageService Abstraction + LocalDrive Impl (auto-subdirs, path-traversal rejection, encryption, checksums)
- **Type**: `rule`
- **Given**: Storage package + LocalDriveStorageServiceImpl + storage property E:/PusulaKM_Data
- **When**: Upload valid PNG, upload with filename "../../etc/passwd", upload disallowed extension, request oversized file, round-trip encrypted sensitive file
- **Then**: Valid PNG stored with UUID secure key under auto-created subdirs; path-traversal rejected (StorageException 400); .exe rejected; oversized rejected; encrypted sensitive file decrypts correctly with env key; grep for hardcoded AES key constants = 0 matches; API response never contains "E:/PusulaKM_Data" string
- **Pass Condition**: All 5 scenarios pass; grep clean; response inspected
- **Evidence**: Unit tests + grep result + HTTP response JSON

### AC-9: File Upload Protection (MIME+extension both checked + checksums)
- **Type**: `rule`
- **Given**: File upload controller
- **When**: Upload valid DOCX vs. rename executable .png extension vs. Content-Type forged
- **Then**: Both MIME (probe content) AND extension must be allowlisted; either fails → 400; checksum SHA-256 stored matches computed on re-download
- **Pass Condition**: Negative tests 400; positive checksum match
- **Evidence**: Upload tests

### AC-10: 13 Thin Controllers (/api/v1) + Standard API Envelope
- **Type**: `rule`
- **Given**: Controller package
- **When**: Hitting success endpoint and error endpoint
- **Then**: 13 controllers (Auth, User, Workspace, Folder, Document, Version, File, Search, Humanizer, AI, Analytics, Audit, Export) plus Admin with Access-Inspector sub-routes; all under `/api/v1`; success envelope `{success: true, message, data, timestamp}`; pagination consistent; errors wrapped same envelope with success false
- **Pass Condition**: Routes present; response envelope matches JSON schema for both success and error
- **Evidence**: MockMvc integration tests; response JSON

### AC-11: Global Exception Handler, Safe Errors, Stack Traces Server-Only
- **Type**: `rule`
- **Given**: @ControllerAdvice
- **When**: Trigger 404 (unknown doc), 403 (forbidden), 400 (validation), 409 (conflict/optimistic lock)
- **Then**: All return correct status codes + envelope JSON with safe message; response body contains no "Exception", "at com.", "Caused by:" strings; server log file contains the full stack trace for same events
- **Pass Condition**: Response grep clean; log grep contains stack
- **Evidence**: HTTP responses; log file excerpt

### AC-12: TipTap Editor + Debounced Autosave + Conflict Resolution UX
- **Type**: `rule`
- **Given**: Angular document editor component
- **When**: Typing 10 keystrokes in 1s; waiting; two tabs edit + save same doc
- **Then**: Bold/italic/underline/headings/lists/tables/toolbar items rendered; autosave call count == 1 (debounce 1500ms) per interceptor spy; second tab save returns 409; conflict dialog shown, no silent overwrite
- **Pass Condition**: Toolbar present; call count; 409 response; dialog DOM element
- **Evidence**: Frontend test outputs; interceptor counts; backend 409

### AC-13: Spreadsheet Engine + XLSX Import/Export Round-Trip
- **Type**: `rule`
- **Given**: Spreadsheet component + ExcelJS backend endpoint
- **When**: =SUM(A1:A3) values 1/2/3 → export → import → save → version created
- **Then**: Cell A4 === 6; export bytes valid zip/XLSX; reimported values match; version row incremented
- **Pass Condition**: Math test; file-type magic bytes; version increment
- **Evidence**: Export file signature check; DB version count delta

### AC-14: PDF.js Viewer + Controlled Streaming + Watermark + DLP COPY-Always Prevent When Permission Absent
- **Type**: `rule`
- **Given**: PDF viewer + preview endpoint + permission DOWNLOAD=false for user
- **When**: View PDF; right-click on protected page; attempt Ctrl+C; try preview download (hidden) → direct call download endpoint
- **Pass Condition**: Pages render; watermark overlay DOM exists with USERNAME+TIMESTAMP; contextmenu/copy events preventDefault() via directive; direct download endpoint returns 403 DOWNLOAD_DENIED audit event written
- **Evidence**: DOM snapshot; synthetic event test results; HTTP 403 + audit row

### AC-15: Image Viewer + OCR Text Searchable
- **Type**: `rule`
- **Given**: Image with embedded text
- **When**: Upload → OCR pipeline runs → Search keyword from image text
- **Then**: Zoom/pan/rotate work; OCR text persisted; keyword search returns image FileAsset as result
- **Pass Condition**: Viewer operations; OCR DB row present; search returns image result
- **Evidence**: Viewer test; OCR extraction; search API

### AC-16: Versioning (Create/Restore) + Diff Viewer (Inline+Side-by-Side)
- **Type**: `rule`
- **Given**: Document with 3 versions (content A→B→C)
- **When**: GET versions; restore v1; GET diff v1 vs v2
- **Then**: 3 versions; RESTORE creates v4 with content A; diff algorithm output matches manual text diff; UI toggle between inline/side-by-side modes works; both additions and deletions highlighted with distinct classes
- **Pass Condition**: Version count; content equality; diff output inspected; UI toggle
- **Evidence**: DB rows; REST response; diff service unit test; UI test

### AC-17: Append-Only 27-Event Audit + Previous/New State JSON
- **Type**: `rule`
- **Given**: All meaningful flows
- **When**: Running scenarios: login success, login failure, create doc, view doc, upload, download denied, role change, access grant, access revoke, humanize request, AI doc query, paste event
- **Then**: 11 scenarios produce correct event types; mutation queries for AuditLog entity (UPDATE/DELETE) count = 0 in source code; ACCESS_GRANTED and ROLE_CHANGED events have previousState/newState JSON non-null
- **Pass Condition**: All events written; grep DELETE/UPDATE on AuditLogRepo/AuditService returns 0 matches; state JSON populated
- **Evidence**: Test scenarios; audit queries; grep; JSON snippet

### AC-18: Security Events (8 types) + Excessive Attempts Tracker
- **Type**: `rule`
- **Given**: SecurityEvent entity + tracker
- **When**: Trigger: path traversal attempt → denied downloads > threshold → invalid token → FOUNDER self change
- **Then**: 4 SecurityEvent rows with correct types/severity; excessive threshold exceeded → EXCESSIVE_DOWNLOAD_ATTEMPTS event logged; Admin dashboard Security Events tab shows rows; not visible to EMPLOYEE
- **Pass Condition**: Rows; severity matching; visibility check
- **Evidence**: Row assertions; role visibility test

### AC-19: Honeytoken Module Scaffolding (No Real Secrets)
- **Type**: `rule`
- **Given**: Optional module
- **When**: Enabling `pv.security.honeytoken.enabled=true`
- **Then**: Decoy doc schema defined; storage key prefix `ht_` defined; access triggers SecurityEvent.HONEYTOKEN_ACCESS; grep module files for "sk-", "AKIA", "password", or any 32+ hex constant suspicious → 0 real-looking secrets found
- **Pass Condition**: Scaffold works; no real secrets
- **Evidence**: Grep results; enable-profile test

### AC-20: Humanizer Streaming SSE + 5 Tones + Paste Modal + Insert + Audit
- **Type**: `rule`
- **Given**: Humanizer controller, components, AI stub/providers
- **When**: Select text → Humanize with Professional → SSE chunks → Paste modal open → Humanize → Insert button
- **Then**: Floating toolbar 5 tones rendered; SSE returns multiple `data:` chunks; dual-pane Original/Improved rendered with Cancel/Humanize/Insert buttons; Insert appends at editor cursor; AI_HUMANIZATION_REQUEST audit present; stub returns explicit "provider not configured" NEVER fabricated sentences
- **Pass Condition**: UI assertions; SSE curl snippet; audit row; stub response contains no fabricated prose
- **Evidence**: UI tests; HTTP; audit row; stub response

### AC-21: AI Agent Drawer (Collapsible) + Summary Fields + Grounded Q&A with Citations
- **Type**: `rule`
- **Given**: Drawer component + chat/summarize endpoints
- **When**: Summarize open doc; ask Q&A; as EMPLOYEE without scope ask about Beta doc
- **Then**: Summary has executiveSummary/keyPoints/actionItems non-empty; Q&A answer includes citations[] array with title/version/section; clickable citation router navigates; out-of-scope query answer withholds content no leak; drawer open/close toggle works
- **Pass Condition**: Field assertions; citation JSON; navigation assertion; no-leak negative test
- **Evidence**: Response JSON; UI route test; negative test 403/no-content

### AC-22: RAG Permission Filter BEFORE LLM
- **Type**: `rule`
- **Given**: RAG service
- **When**: Calling answer() with user lacking VIEW on relevant chunk
- **Then**: Call sequence (mocks or logs) shows order: similaritySearch → permissionFilter.removeUnauthorizedChunks() → llmGenerate() with filtered chunks ONLY; unauthorized chunks not included in prompt sent to LLM
- **Pass Condition**: Call order confirmed; chunk list length before/after differs; prompt length matches filtered count
- **Evidence**: Mock call sequence; log lines; prompt size assertions

### AC-23: Document Ingestion 7 Positive Types + 1 Unsupported Rejection
- **Type**: `rule`
- **Given**: Upload pipeline
- **When**: Upload 7 types (DOCX/PDF/XLSX/CSV/TXT/MD/PNG-with-OCR) + upload .exe renamed
- **Then**: 7 ingested → SearchIndexMetadata rows with chunkCount>0; OCR image has extracted text; .exe rejected 400
- **Pass Condition**: Counts; OCR text present; negative test
- **Evidence**: Upload tests; search-index rows

### AC-24: Unified Search (Ctrl+K Trigger + Keyword + Semantic Result Cards)
- **Type**: `rule`
- **Given**: Search overlay + SearchService
- **When**: Ctrl+K typed; keyword search ("founder policy"); semantic search ("security architecture of auth")
- **Then**: Overlay opens; keyword returns exact phrase hits; semantic returns related docs even if phrase absent; each result DOM card: title/type/snippet/author/last-modified/workspace/version
- **Pass Condition**: Opens; both queries return results; DOM selectors match
- **Evidence**: Keyboard test; search API responses; DOM snapshot

### AC-25: AI Progress Synthesizer (Daily/Weekly/Monthly) Labels
- **Type**: `rule`
- **Given**: Synthesizer service
- **When**: Request daily digest with existing audit rows
- **Then**: Output contains both strings "Observed Activity:" and "AI-Generated Summary:"; observed activities correlate to real DB audit entries (no invented)
- **Pass Condition**: Strings present; correlation verified (e.g., counts match)
- **Evidence**: Text output + audit counts

### AC-26: Watermark (Dynamic Values) + No False Security Claims in Project Text
- **Type**: `rule`
- **Given**: Protected viewers + docs/README/UI text corpus
- **When**: View protected asset; grep all project source/README/UI string literals (except spec/architecture documents) for false-claim phrases: "impossible to extract", "prevents screenshots", "blocks developer tools", "mathematically impossible"
- **Then**: Watermark DOM contains username/timestamp/role/team/session dynamic text; 0 matches for forbidden claim strings in runtime code + README (spec/arch docs are excluded because they contain the rule forbidding these claims)
- **Pass Condition**: Watermark fields; grep returns 0 matches in runtime directories (backend/src, frontend/src, README.md)
- **Evidence**: DOM nodes; grep results

### AC-27: DLP Directive Reacts to Derived COPY_ALLOWED (False = Stronger Deterrents Activate)
- **Type**: `rule`
- **Given**: Viewer directive + permission resolver
- **When**: Same doc viewed by user1 (DOWNLOAD=true) and user2 (DOWNLOAD=false, no MANAGE_ACCESS)
- **Then**: user1 → appPreventCopy activation weaker; user2 → context menu disabled, Ctrl+C prevented, selection disabled, download buttons hidden; both log appropriate audit
- **Pass Condition**: Event-prevent counts differ per user; download-button hidden in user2 DOM
- **Evidence**: Synthetic event tests; DOM assertions

### AC-28: 4-Pane Main Layout + Role-Aware Sidebar Workspaces
- **Type**: `rubric`
- **Dimension**: Layout coherence & enterprise visual polish
- **Scale**: 1-5
- **Anchors**: 1 = plain white pages; 3 = sidebar + content present; 5 = Topbar(user+role+search), Sidebar (scoped visible workspaces + nav Dashboard/Documents/Projects/Files/Search/Analytics/Admin), Main Workspace focused, Right AI Drawer (open/collapse toggle); consistent enterprise palette/spacing/typography
- **Pass Threshold**: >= 4
- **Evidence**: Layout screenshot; DOM selector presence; manager-alpha workspaces list scoped correctly (Beta absent)

### AC-29: Founder Analytics Dashboard Full Experience + Scope Isolation Widgets
- **Type**: `rubric`
- **Dimension**: Completeness & visual polish of founder/analytics
- **Scale**: 1-5
- **Anchors**: 1 = no page; 3 = overview numbers only; 5 = Overview (totals/storage/active/AI/doc created/modified) + Daily/Weekly/Monthly activity bars + GitHub heatmap + Audit Explorer filters (user/event/doc/date/workspace/action virtual-scroll) + Version Analytics (most-edited docs, contributors, freq) + Access Governance widgets (top grant/denied) + AI progress Daily/Weekly/Monthly buttons; FOUNDER sees all-company; ADMIN sees governed-domain only; MANAGER sees team widgets only
- **Pass Threshold**: >= 4
- **Evidence**: Screenshots per role; widget counts; filter test; role-scoped data assertions

### AC-30: Document Workspace 9 Required Areas + Share Dialog 8-Permission Picker User/Team/Role
- **Type**: `rule`
- **Given**: Workspace page
- **When**: Opening doc; clicking Share
- **Then**: Title, Breadcrumb, Version, Last-edited, Save-status, Share/Permissions, Version-history, AI-tools, Comments — 9 areas DOM present; Share dialog shows grantee picker User/Team/Role/Workspace + 8 checkboxes (VIEW EDIT COMMENT UPLOAD DOWNLOAD SHARE DELETE MANAGE_ACCESS)
- **Pass Condition**: 9 selectors all truthy; 8 permission bits rendered
- **Evidence**: DOM snapshots

### AC-31: Optimistic Lock Conflict (Backend 409 + Frontend Conflict Dialog)
- **Type**: `rule`
- **Given**: Document @Version field
- **When**: Two updates with stale version
- **Then**: Second update returns 409 ConflictException; frontend dialog "This document was modified by another user." with Reload / Merge options; no data silently overwritten
- **Pass Condition**: HTTP 409; dialog text match
- **Evidence**: HTTP test; dialog render

### AC-32: Exports PDF/DOCX/XLSX Valid Files + Audit + DOWNLOAD Permission
- **Type**: `rule`
- **Given**: Export endpoints
- **When**: Export doc PDF, doc DOCX, sheet XLSX; repeat without DOWNLOAD permission
- **Then**: 3 produced files type-valid (magic / parse); EXPORT_CREATED audit rows written; unauthorized → 403 + no bytes leaked
- **Pass Condition**: File type checks; audit rows; 403 negative
- **Evidence**: File signatures; audit; 403 test

### AC-33: Seed Data 10 Users + Scope Isolation Demo Provable
- **Type**: `rule`
- **Given**: DataInitializer + local profile startup
- **When**: Starting backend fresh
- **Then**: 10 users (1 Founder, 1 Admin, 2 Managers Alpha/Beta, 2 Team Leads, 3 Employees, 2 Interns); 2 workspaces; 2 teams; folders; ≥5 docs each workspace; ≥3 DocumentVersions for 1 doc; ≥20 AuditLog rows; login as each works with README passwords
- **Pass Condition**: Row counts; login tests pass; ManagerAlpha → BetaDoc → 403 (matches AC-6)
- **Evidence**: DB counts; login curl; scope isolation test

### AC-34: Error/Empty/Loading/Unauth/NotFound 6 States on Every Major Screen
- **Type**: `rule`
- **Given**: Dashboard/Docs list/Editor/Viewer/Search/Analytics/Audit/Admin screens
- **When**: Trigger each state
- **Then**: 6 states each have appropriate component; no empty blank screens; console 0 uncaught JS errors
- **Pass Condition**: Visual/DOM tests per state; console.error count = 0
- **Evidence**: Screenshots per state; console log count

### AC-35: Backend Compile + Starts (local profile) + Actuator Health/Swagger
- **Type**: `rule`
- **Given**: Backend project
- **When**: `mvn -q -DskipTests compile`; then `mvn spring-boot:run -Dspring-boot.run.profiles=local`
- **Then**: Compile exit 0; app log contains "Started PusulaKmApplication in ... seconds"; HTTP GET /actuator/health returns 200 status UP; /swagger-ui or /v3/api-docs responds
- **Pass Condition**: Exit codes; log line; HTTP 200s
- **Evidence**: Build logs excerpt; curl responses

### AC-36: Frontend Compile + Serves (ng serve) + Login Page Renders
- **Type**: `rule`
- **Given**: Frontend project
- **When**: `npm install` → `ng serve` → open /
- **Then**: Install exit 0; ng build dev exit 0; page title "Pusula Vault"; login form rendered; role-aware guard redirects unauthed to /login
- **Pass Condition**: Exit codes; title; redirect test
- **Evidence**: Build logs; page screenshot; redirect test

### AC-37: Config 4 Profiles; Prod CORS ≠ *; Secrets from Env
- **Type**: `rule`
- **Given**: application*.properties + SecurityConfig
- **When**: Reading property files; running prod profile simulation without env vars
- **Then**: 4 profiles exist; prod profile cors property default != "*"; datasource-password/encryption-key/AI keys not hardcoded literals in property files (use ${ENV_VAR:} placeholders)
- **Pass Condition**: Files present; cors assertion; grep for hardcoded 32+ hex = 0
- **Evidence**: Property snippets; grep

### AC-38: SOLID Visibly Demonstrated
- **Type**: `rubric`
- **Dimension**: Degree to which SOLID is evidenced in architecture
- **Scale**: 1-5
- **Anchors**: 1 = controllers contain logic; 3 = services + interfaces but concrete coupled; 5 = (SRP) each single-responsibility class; (OCP) StorageService/AiProvider/EmbeddingProvider/VectorStore/CacheService each have new impl switchable without modifying consumers; (LSP) impls substitute safely; (ISP) no God interfaces (e.g., StorageService ≠ large unrelated methods); (DIP) constructors inject interfaces, never `new LocalDriveStorageServiceImpl()` in business logic
- **Pass Threshold**: >= 4
- **Evidence**: Specific file references per principle; constructor injection inspect; interface list

### AC-39: No Placeholder Strings in Runtime Sources + AI Stub Never Fabricates
- **Type**: `rule`
- **Given**: backend/src, frontend/src, README.md (excluding .trae/specs/* because they contain spec prose about placeholders being forbidden)
- **When**: Grepping for forbidden strings: "TODO implement later", "implement later", "dummy function", "empty method", "coming soon", "pseudo-code"; stub humanize/chat endpoints queried
- **Then**: 0 matches; stub endpoint returns message that explicitly says provider not configured and does not return any subject-predicate fabricated content about user documents
- **Pass Condition**: Grep empty; stub assertions
- **Evidence**: Grep output; stub HTTP response

### AC-40: Cloud Migration Replaceable Impls (Interfaces + Extension Points)
- **Type**: `rule`
- **Given**: Packages storage/ai/rag/cache
- **When**: Inspecting dependency injection wiring
- **Then**: Interfaces StorageService/AiProvider/EmbeddingProvider/VectorStore/CacheService each injected as interface; concrete LocalDrive/InMemory/OllamaStub/NoOpCache marked @ConditionalOnProperty or @Profile; S3/Postgres/Redis extension scaffolding present (stub impls or TODO-free documented scaffold that does not break build)
- **Pass Condition**: Constructor params are interface types; @Profile/@Conditional present; extension scaffolds compile
- **Evidence**: Injection source; profile annotations; compile

### AC-41: Self-Escalation Prevention Rule Enforced
- **Type**: `rule`
- **Given**: TEAM_LEAD user
- **When**: TEAM_LEAD attempts MANAGE_ACCESS grant to self adding DOWNLOAD to a doc they originally had VIEW only
- **Then**: Request 403; audit FOUNDER_SELF_CHANGE absent; security event PERMISSION_DENIED logged; TEAM_LEAD permission remains VIEW only
- **Pass Condition**: 403; row in security events; permission DB unchanged
- **Evidence**: HTTP test; audit; permission check after

### AC-42: README Exact Steps + Dev-Only Seed Warning
- **Type**: `rule`
- **Given**: README.md
- **When**: Reading sections
- **Then**: Contains: Java/Node/Angular versions; DB; env vars; Ollama; PostgreSQL optional; storage setup; commands `mvn spring-boot:run` and `npm install && ng serve` verbatim; seed credentials listed with prominent boxed note: "⚠️ DEVELOPMENT-ONLY CREDENTIALS — CHANGE BEFORE PRODUCTION."
- **Pass Condition**: All sections present; commands literal; warning string present
- **Evidence**: README content check
