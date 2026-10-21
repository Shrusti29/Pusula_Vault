export type Role = 'FOUNDER' | 'ADMIN' | 'MANAGER' | 'TEAM_LEAD' | 'EMPLOYEE' | 'INTERN';
export type Permission = 'VIEW' | 'EDIT' | 'COMMENT' | 'UPLOAD' | 'DOWNLOAD' | 'SHARE' | 'DELETE' | 'MANAGE_ACCESS';
export type DocumentStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'LOCKED';
export type ResourceType = 'WORKSPACE' | 'FOLDER' | 'DOCUMENT' | 'ASSET' | 'TEAM';
export type GranteeType = 'USER' | 'TEAM' | 'ROLE' | 'WORKSPACE';
export type AuditAction =
  | 'LOGIN_SUCCESS' | 'LOGIN_FAILURE' | 'LOGOUT'
  | 'DOCUMENT_CREATED' | 'DOCUMENT_VIEWED' | 'DOCUMENT_UPDATED' | 'DOCUMENT_DELETED' | 'DOCUMENT_SHARED'
  | 'DOCUMENT_VERSION_CREATED' | 'DOCUMENT_VERSION_RESTORED'
  | 'FILE_UPLOADED' | 'FILE_VIEWED' | 'FILE_DOWNLOADED' | 'FILE_DOWNLOAD_DENIED' | 'FILE_DELETED'
  | 'FOLDER_CREATED' | 'FOLDER_UPDATED' | 'FOLDER_DELETED'
  | 'WORKSPACE_CREATED' | 'WORKSPACE_UPDATED'
  | 'ACCESS_GRANTED' | 'ACCESS_REVOKED' | 'ROLE_CHANGED' | 'PERMISSION_CHANGED'
  | 'USER_CREATED' | 'USER_UPDATED'
  | 'SEARCH_PERFORMED' | 'AI_HUMANIZATION_REQUEST' | 'AI_DOCUMENT_QUERY' | 'AI_QUERY'
  | 'PASTE_EVENT' | 'UNAUTHORIZED_ACCESS_ATTEMPT' | 'EXPORT_CREATED' | 'EXCESSIVE_DOWNLOAD_ATTEMPTS';
export type SecurityEventType =
  | 'UNAUTHORIZED_ACCESS_ATTEMPT' | 'PERMISSION_DENIED' | 'EXCESSIVE_DOWNLOAD_ATTEMPTS'
  | 'BRUTE_FORCE_DETECTED' | 'HONEYTOKEN_ACCESS' | 'SUSPICIOUS_EXPORT'
  | 'TOKEN_THEFT_SUSPECTED' | 'DATA_EXFIL_ATTEMPT';
export type SaveStatus = 'SAVED' | 'SAVING' | 'ERROR' | 'CONFLICT' | 'UNSAVED';
export type TonePreset = 'Professional' | 'Technical' | 'Conversational' | 'Concise' | 'Formal';

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  role: Role;
  fullName: string;
  active: boolean;
  createdAt?: string;
  featurePermissions?: string[];
  workspaceIds?: string[];
}

export interface WorkspaceResponse {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  documentCount?: number;
  storageUsedBytes?: number;
  effectivePermissions?: Permission[];
}

export interface FolderResponse {
  id: string;
  workspaceId: string;
  parentFolderId?: string;
  name: string;
  path?: string[];
  createdAt: string;
  updatedAt: string;
  documentCount?: number;
  subfolderCount?: number;
}

export interface DocumentResponse {
  id: string;
  workspaceId: string;
  folderId?: string;
  title: string;
  content?: string;
  contentType: string;
  status: DocumentStatus;
  currentVersion: number;
  tags?: string[];
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  lastEditedAt?: string;
  effectivePermissions?: Permission[];
  copyAllowed?: boolean;
  version?: number;
  documentType?: string;
}

export interface DocumentVersionResponse {
  id: string;
  documentId: string;
  versionNumber: number;
  content?: string;
  changeSummary?: string;
  sizeBytes?: number;
  createdBy?: string;
  createdAt: string;
  priority?: boolean;
  priorityNote?: string;
}

export interface FileAssetResponse {
  id: string;
  documentId?: string;
  workspaceId: string;
  folderId?: string;
  originalName: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  checksum?: string;
  encrypted: boolean;
  storageKey: string;
  ocrText?: string;
  ocrStatus?: 'PENDING' | 'COMPLETE' | 'FAILED';
  createdBy?: string;
  createdAt: string;
  effectivePermissions?: Permission[];
  downloadAllowed?: boolean;
}

export interface CommentResponse {
  id: string;
  documentId: string;
  authorId?: string;
  authorName?: string;
  anchorPosition?: string;
  content: string;
  resolved: boolean;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
  replies?: CommentResponse[];
}

export interface TeamResponse {
  id: string;
  name: string;
  description?: string;
  workspaceId?: string;
  memberCount?: number;
  createdAt: string;
}

export interface TeamMembershipResponse {
  teamId: string;
  userId: string;
  userFullName?: string;
  role: 'LEAD' | 'MEMBER' | 'CONTRIBUTOR';
  joinedAt: string;
}

export interface TagResponse {
  id: string;
  name: string;
  usageCount: number;
}

export interface SharePermissionGrantRequest {
  resourceType: ResourceType;
  resourceId: string;
  granteeType: GranteeType;
  granteeId: string;
  permissions: Permission[];
  allow: boolean;
}

export interface SharePermissionRevokeRequest {
  resourceType: ResourceType;
  resourceId: string;
  granteeType: GranteeType;
  granteeId: string;
}

export interface EffectivePermissionsDTO {
  permissions: Permission[];
  copyAllowed: boolean;
  downloadAllowed: boolean;
  shareAllowed: boolean;
  editAllowed: boolean;
  deleteAllowed: boolean;
  manageAllowed: boolean;
}

export interface AccessSource {
  via: 'DIRECT_GRANT' | 'TEAM_MEMBERSHIP' | 'ROLE_DEFAULT' | 'WORKSPACE_INHERITED' | 'FOLDER_INHERITED' | 'DOCUMENT_INHERITED' | 'FOUNDER_BYPASS';
  sourceId: string;
  sourceLabel: string;
  description: string;
}

export interface AccessInspectorExplainResponse {
  userId: string;
  resourceType: ResourceType;
  resourceId: string;
  effective: EffectivePermissionsDTO;
  sources: AccessSource[];
  deniedSources?: AccessSource[];
}

export interface AuditLogResponse {
  id: number;
  action: AuditAction;
  actorId?: string;
  actorUsername?: string;
  actorRole?: Role;
  sessionId?: string;
  resourceType?: ResourceType;
  resourceId?: string;
  resourceName?: string;
  workspaceId?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  message?: string;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  createdAt: string;
}

export interface SecurityEventResponse {
  id: number;
  type: SecurityEventType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  actorId?: string;
  workspaceId?: string;
  resourceType?: ResourceType;
  resourceId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  detectedAt: string;
  resolvedAt?: string;
}

export interface DocumentDiffResponse {
  documentId: string;
  leftVersion: number;
  rightVersion: number;
  added: DiffRange[];
  deleted: DiffRange[];
  modified: DiffRange[];
  unifiedText?: string;
}

export interface DiffRange {
  type: 'added' | 'deleted' | 'modified';
  leftStart?: number;
  leftEnd?: number;
  rightStart?: number;
  rightEnd?: number;
  leftText?: string;
  rightText?: string;
}

export interface AiInteractionResponse {
  id: string;
  type: 'HUMANIZE' | 'CHAT' | 'SUMMARIZE' | 'CITE';
  userId: string;
  documentId?: string;
  tone?: TonePreset;
  snippetLength?: number;
  createdAt: string;
}

export interface HumanizeRequest {
  text: string;
  tone: TonePreset;
  documentId?: string;
  preserveMeaning: boolean;
}

export interface AiChatRequest {
  question: string;
  workspaceId?: string;
  includeDocumentIds?: string[];
  topK?: number;
}

export interface AiCitation {
  documentId: string;
  documentTitle: string;
  version: number;
  section?: string;
  page?: number;
  snippet?: string;
}

export interface SummaryResponse {
  executiveSummary: string;
  keyPoints: string[];
  actionItems: string[];
  sources: AiCitation[];
}

export interface ChatResponse {
  answer: string;
  citations: AiCitation[];
  confidence: number;
}

export interface SearchResultItem {
  type: ResourceType;
  id: string;
  workspaceId?: string;
  title: string;
  snippet: string;
  author?: string;
  lastModified: string;
  version?: number;
  workspaceName?: string;
  tags?: string[];
  score?: number;
}

export interface ActivityPeriodBucket {
  date: string;
  created: number;
  edited: number;
  viewed: number;
  uploaded: number;
  downloaded: number;
  aiInteractions: number;
}

export interface OverviewMetrics {
  totalUsers: number;
  totalDocuments: number;
  totalFiles: number;
  storageUsedBytes: number;
  docsCreatedToday: number;
  docsModifiedToday: number;
  aiInteractionsLast7d: number;
  activeUsersLast7d: number;
  workspaces: number;
}

export interface HeatmapCell {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  weekIndex?: number;
  key?: string;
}

export interface TopGrantItem {
  id: string;
  granteeType: GranteeType;
  granteeLabel: string;
  resourceLabel: string;
  permissions: Permission[];
  grantedAt: string;
  grantedBy?: string;
}

export interface ProgressDigest {
  observedActivity: string[];
  aiGeneratedSummary?: string;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  errors?: { field: string; message: string }[];
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface LoginRequest { email: string; password: string; rememberMe?: boolean; deviceId?: string; deviceLabel?: string; }
export interface LoginResponse { token: string | null; user: UserResponse; visibleWorkspaceIds: string[]; role: Role; deviceStatus?: string; deviceMessage?: string; }
export interface ChangeRoleRequest { userId: string; newRole: Role; }
export interface CreateUserRequest { email: string; fullName: string; role: Role; password: string; featurePermissions?: string[]; workspaceIds?: string[]; }
export interface CreateWorkspaceRequest { name: string; description: string; }
export interface UpdateWorkspaceRequest { name?: string; description?: string; }
export interface CreateFolderRequest { workspaceId: string; parentFolderId?: string; name: string; }
export interface MoveFolderRequest { folderId: string; targetFolderId?: string; targetWorkspaceId?: string; }
export interface CreateDocumentRequest { workspaceId: string; folderId?: string; title: string; content?: string; contentType?: string; }
export interface UpdateDocumentRequest { title?: string; content?: string; status?: DocumentStatus; tags?: string[]; changeSummary?: string; }
export interface SaveDraftRequest { content: string; title?: string; }
export interface CreateCommentRequest { documentId: string; anchorPosition?: string; content: string; }
export interface ResolveCommentRequest { commentId: string; resolved: boolean; }
export interface UploadFileRequest { documentId?: string; folderId?: string; }
export interface ExportRequest { type: 'PDF' | 'DOCX' | 'XLSX' | 'CSV' | 'ZIP'; resourceIds?: string[]; includeHistory?: boolean; }
export interface AuditFilterRequest { actorId?: string; action?: AuditAction[]; resourceType?: ResourceType; resourceId?: string; workspaceId?: string; from?: string; to?: string; page?: number; size?: number; }
export interface SecurityEventFilter { type?: SecurityEventType[]; severity?: string[]; actorId?: string; from?: string; to?: string; resolved?: boolean; page?: number; size?: number; }
export interface CreateTeamRequest { name: string; description?: string; workspaceId?: string; }
export interface AddTeamMemberRequest { userId: string; role: 'LEAD' | 'MEMBER' | 'CONTRIBUTOR'; }
