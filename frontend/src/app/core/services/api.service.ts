import { Injectable, inject, Inject, InjectionToken } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiResponse, WorkspaceResponse, CreateWorkspaceRequest, UpdateWorkspaceRequest, PaginatedResponse, FolderResponse, CreateFolderRequest, MoveFolderRequest, DocumentResponse, CreateDocumentRequest, UpdateDocumentRequest, SaveDraftRequest, DocumentVersionResponse, DocumentDiffResponse, CommentResponse, CreateCommentRequest, ResolveCommentRequest, FileAssetResponse, SharePermissionGrantRequest, SharePermissionRevokeRequest, AccessInspectorExplainResponse, AuditLogResponse, AuditFilterRequest, OverviewMetrics, ActivityPeriodBucket, HeatmapCell, TopGrantItem, ProgressDigest, SummaryResponse, AiChatRequest, ChatResponse, SearchResultItem, HumanizeRequest, TeamResponse, CreateTeamRequest, TeamMembershipResponse, AddTeamMemberRequest, UserResponse, CreateUserRequest, ChangeRoleRequest, LoginRequest, LoginResponse, SecurityEventResponse, SecurityEventFilter, TagResponse, ExportRequest, EffectivePermissionsDTO } from '../models/pusula.models';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

type HttpBody = Record<string, unknown> | unknown;

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private apiBase = inject(API_BASE_URL);

  private unwrap<T>(obs: Observable<ApiResponse<T>>): Observable<T> {
    return obs.pipe(map(r => r.data));
  }

  private p<T>(obs: Observable<ApiResponse<PaginatedResponse<T>>>): Observable<PaginatedResponse<T>> {
    return obs.pipe(map(r => r.data));
  }

  private paramsFrom(filter: Record<string, unknown> | AuditFilterRequest | SecurityEventFilter): HttpParams {
    let p = new HttpParams();
    Object.entries(filter as Record<string, unknown>).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return;
      if (Array.isArray(v)) v.forEach(x => p = p.append(k, String(x)));
      else p = p.set(k, String(v));
    });
    return p;
  }

  // Generic HTTP methods for custom endpoints
  get<T>(url: string): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.apiBase}${url}`);
  }

  post<T>(url: string, body: HttpBody): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.apiBase}${url}`, body);
  }

  put<T>(url: string, body: HttpBody): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.apiBase}${url}`, body);
  }

  delete<T>(url: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(`${this.apiBase}${url}`);
  }

  // ==== AUTH ====
  login(req: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http.post<ApiResponse<LoginResponse>>(`${this.apiBase}/auth/login`, req);
  }
  logout(): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.apiBase}/auth/logout`, {});
  }

  // ==== WORKSPACES ====
  listWorkspaces(): Observable<WorkspaceResponse[]> {
    return this.unwrap(this.http.get<ApiResponse<WorkspaceResponse[]>>(`${this.apiBase}/workspaces`));
  }
  getWorkspace(id: string): Observable<WorkspaceResponse> {
    return this.unwrap(this.http.get<ApiResponse<WorkspaceResponse>>(`${this.apiBase}/workspaces/${id}`));
  }
  createWorkspace(req: CreateWorkspaceRequest): Observable<WorkspaceResponse> {
    return this.unwrap(this.http.post<ApiResponse<WorkspaceResponse>>(`${this.apiBase}/workspaces`, req));
  }
  updateWorkspace(id: string, req: UpdateWorkspaceRequest): Observable<WorkspaceResponse> {
    return this.unwrap(this.http.put<ApiResponse<WorkspaceResponse>>(`${this.apiBase}/workspaces/${id}`, req));
  }
  deleteWorkspace(id: string): Observable<void> {
    return this.unwrap(this.http.delete<ApiResponse<void>>(`${this.apiBase}/workspaces/${id}`));
  }

  // ==== FOLDERS ====
  listFolders(workspaceId: string, parentFolderId?: string): Observable<FolderResponse[]> {
    return this.unwrap(this.http.get<ApiResponse<FolderResponse[]>>(`${this.apiBase}/folders`, { params: this.paramsFrom({ workspaceId, parentFolderId }) }));
  }
  getFolder(id: string): Observable<FolderResponse> {
    return this.unwrap(this.http.get<ApiResponse<FolderResponse>>(`${this.apiBase}/folders/${id}`));
  }
  createFolder(req: CreateFolderRequest): Observable<FolderResponse> {
    return this.unwrap(this.http.post<ApiResponse<FolderResponse>>(`${this.apiBase}/folders`, req));
  }
  moveFolder(req: MoveFolderRequest): Observable<FolderResponse> {
    return this.unwrap(this.http.post<ApiResponse<FolderResponse>>(`${this.apiBase}/folders/move`, req));
  }
  deleteFolder(id: string): Observable<void> {
    return this.unwrap(this.http.delete<ApiResponse<void>>(`${this.apiBase}/folders/${id}`));
  }

  // ==== DOCUMENTS ====
  listDocuments(filter: { workspaceId?: string; folderId?: string; page?: number; size?: number; }): Observable<PaginatedResponse<DocumentResponse>> {
    return this.p(this.http.get<ApiResponse<PaginatedResponse<DocumentResponse>>>(`${this.apiBase}/documents`, { params: this.paramsFrom(filter) }));
  }
  getDocument(id: string): Observable<DocumentResponse> {
    return this.unwrap(this.http.get<ApiResponse<DocumentResponse>>(`${this.apiBase}/documents/${id}`));
  }
  createDocument(req: CreateDocumentRequest): Observable<DocumentResponse> {
    return this.unwrap(this.http.post<ApiResponse<DocumentResponse>>(`${this.apiBase}/documents`, req));
  }
  updateDocument(id: string, req: UpdateDocumentRequest): Observable<DocumentResponse> {
    return this.unwrap(this.http.put<ApiResponse<DocumentResponse>>(`${this.apiBase}/documents/${id}`, req));
  }
  saveDraft(id: string, req: SaveDraftRequest): Observable<DocumentResponse> {
    return this.unwrap(this.http.post<ApiResponse<DocumentResponse>>(`${this.apiBase}/documents/${id}/draft`, req));
  }
  saveVersion(id: string, summary?: string): Observable<DocumentVersionResponse> {
    return this.unwrap(this.http.post<ApiResponse<DocumentVersionResponse>>(`${this.apiBase}/documents/${id}/version`, { changeSummary: summary }));
  }
  deleteDocument(id: string): Observable<void> {
    return this.unwrap(this.http.delete<ApiResponse<void>>(`${this.apiBase}/documents/${id}`));
  }
  getEffectivePermissions(id: string): Observable<EffectivePermissionsDTO> {
    return this.unwrap(this.http.get<ApiResponse<EffectivePermissionsDTO>>(`${this.apiBase}/documents/${id}/permissions`));
  }

  // ==== VERSIONS ====
  listVersions(documentId: string): Observable<DocumentVersionResponse[]> {
    return this.unwrap(this.http.get<ApiResponse<DocumentVersionResponse[]>>(`${this.apiBase}/documents/${documentId}/versions`));
  }
  getVersion(id: string): Observable<DocumentVersionResponse> {
    return this.unwrap(this.http.get<ApiResponse<DocumentVersionResponse>>(`${this.apiBase}/versions/${id}`));
  }
  restoreVersion(versionId: string): Observable<DocumentVersionResponse> {
    return this.unwrap(this.http.post<ApiResponse<DocumentVersionResponse>>(`${this.apiBase}/versions/${versionId}/restore`, {}));
  }
  diffVersions(documentId: string, leftVersion: number, rightVersion: number): Observable<DocumentDiffResponse> {
    return this.unwrap(this.http.get<ApiResponse<DocumentDiffResponse>>(`${this.apiBase}/documents/${documentId}/diff`, { params: this.paramsFrom({ leftVersion, rightVersion }) }));
  }

  // ==== COMMENTS ====
  listComments(documentId: string): Observable<CommentResponse[]> {
    return this.unwrap(this.http.get<ApiResponse<CommentResponse[]>>(`${this.apiBase}/documents/${documentId}/comments`));
  }
  createComment(req: CreateCommentRequest): Observable<CommentResponse> {
    return this.unwrap(this.http.post<ApiResponse<CommentResponse>>(`${this.apiBase}/comments`, req));
  }
  resolveComment(commentId: string, resolved: boolean): Observable<CommentResponse> {
    const req: ResolveCommentRequest = { commentId, resolved };
    return this.unwrap(this.http.post<ApiResponse<CommentResponse>>(`${this.apiBase}/comments/${commentId}/resolve`, req));
  }

  // ==== FILE ASSETS ====
  uploadFile(file: File, opts: { documentId?: string; folderId?: string; workspaceId: string; encrypt?: boolean }): Observable<FileAssetResponse> {
    const fd = new FormData();
    fd.append('file', file);
    if (opts.documentId) fd.append('documentId', opts.documentId);
    if (opts.folderId) fd.append('folderId', opts.folderId);
    fd.append('workspaceId', opts.workspaceId);
    if (opts.encrypt) fd.append('encrypt', 'true');
    return this.unwrap(this.http.post<ApiResponse<FileAssetResponse>>(`${this.apiBase}/files/upload`, fd));
  }
  listFiles(filter: { workspaceId?: string; folderId?: string; documentId?: string; page?: number; size?: number; }): Observable<PaginatedResponse<FileAssetResponse>> {
    return this.p(this.http.get<ApiResponse<PaginatedResponse<FileAssetResponse>>>(`${this.apiBase}/files`, { params: this.paramsFrom(filter) }));
  }
  getFile(id: string): Observable<FileAssetResponse> {
    return this.unwrap(this.http.get<ApiResponse<FileAssetResponse>>(`${this.apiBase}/files/${id}`));
  }
  deleteFile(id: string): Observable<void> {
    return this.unwrap(this.http.delete<ApiResponse<void>>(`${this.apiBase}/files/${id}`));
  }
  previewUrl(id: string): string {
    return `${this.apiBase}/files/${id}/preview`;
  }
  downloadUrl(id: string): string {
    return `${this.apiBase}/files/${id}/download`;
  }

  // ==== SHARING / PERMISSIONS ====
  grantPermission(req: SharePermissionGrantRequest): Observable<void> {
    return this.unwrap(this.http.post<ApiResponse<void>>(`${this.apiBase}/access/grant`, req));
  }
  revokePermission(req: SharePermissionRevokeRequest): Observable<void> {
    return this.unwrap(this.http.post<ApiResponse<void>>(`${this.apiBase}/access/revoke`, req));
  }

  // ==== ACCESS INSPECTOR ====
  explainAccess(userId: string, resourceType: string, resourceId: string): Observable<AccessInspectorExplainResponse> {
    return this.unwrap(this.http.get<ApiResponse<AccessInspectorExplainResponse>>(`${this.apiBase}/access/explain`, { params: this.paramsFrom({ userId, resourceType, resourceId }) }));
  }

  // ==== TAGS ====
  listTags(workspaceId?: string): Observable<TagResponse[]> {
    return this.unwrap(this.http.get<ApiResponse<TagResponse[]>>(`${this.apiBase}/tags`, workspaceId ? { params: { workspaceId } } : {}));
  }

  // ==== AUDIT ====
  listAudit(filter: AuditFilterRequest): Observable<PaginatedResponse<AuditLogResponse>> {
    return this.p(this.http.get<ApiResponse<PaginatedResponse<AuditLogResponse>>>(`${this.apiBase}/audit`, { params: this.paramsFrom(filter) }));
  }

  // ==== SECURITY EVENTS ====
  listSecurityEvents(filter: SecurityEventFilter): Observable<PaginatedResponse<SecurityEventResponse>> {
    return this.p(this.http.get<ApiResponse<PaginatedResponse<SecurityEventResponse>>>(`${this.apiBase}/security-events`, { params: this.paramsFrom(filter) }));
  }

  // ==== ANALYTICS ====
  analyticsOverview(): Observable<OverviewMetrics> {
    return this.unwrap(this.http.get<ApiResponse<OverviewMetrics>>(`${this.apiBase}/analytics/overview`));
  }
  analyticsActivity(period: 'day' | 'week' | 'month' = 'day', from?: string, to?: string): Observable<ActivityPeriodBucket[]> {
    return this.unwrap(this.http.get<ApiResponse<ActivityPeriodBucket[]>>(`${this.apiBase}/analytics/activity`, { params: this.paramsFrom({ period, from, to }) }));
  }
  analyticsHeatmap(from?: string, to?: string): Observable<HeatmapCell[]> {
    return this.unwrap(this.http.get<ApiResponse<HeatmapCell[]>>(`${this.apiBase}/analytics/heatmap`, { params: this.paramsFrom({ from, to }) }));
  }
  topEditedVersions(limit = 10): Observable<Array<{ documentId: string; title: string; versionsCount: number; lastEdited: string; }>> {
    return this.unwrap(this.http.get<ApiResponse<Array<{ documentId: string; title: string; versionsCount: number; lastEdited: string; }>>>(`${this.apiBase}/analytics/versions/top-edited`, { params: { limit } }));
  }
  topContributors(limit = 10): Observable<Array<{ userId: string; fullName: string; role: string; edits: number; }>> {
    return this.unwrap(this.http.get<ApiResponse<Array<{ userId: string; fullName: string; role: string; edits: number; }>>>(`${this.apiBase}/analytics/contributors/top-active`, { params: { limit } }));
  }
  topGrantsLast30(limit = 10): Observable<TopGrantItem[]> {
    return this.unwrap(this.http.get<ApiResponse<TopGrantItem[]>>(`${this.apiBase}/analytics/access/top-grants`, { params: { limit } }));
  }
  topDeniedLast30(limit = 10): Observable<Array<{ actorId: string; actorName: string; resourceLabel: string; action: string; count: number; }>> {
    return this.unwrap(this.http.get<ApiResponse<Array<{ actorId: string; actorName: string; resourceLabel: string; action: string; count: number; }>>>(`${this.apiBase}/analytics/access/top-denied`, { params: { limit } }));
  }
  suspiciousAccess(): Observable<Array<{ actorId: string; actorName: string; resourceLabel: string; reason: string; at: string; }>> {
    return this.unwrap(this.http.get<ApiResponse<Array<{ actorId: string; actorName: string; resourceLabel: string; reason: string; at: string; }>>>(`${this.apiBase}/analytics/access/suspicious`));
  }
  progressDigest(period: 'daily' | 'weekly' | 'monthly' = 'daily'): Observable<ProgressDigest> {
    return this.unwrap(this.http.get<ApiResponse<ProgressDigest>>(`${this.apiBase}/analytics/progress-${period}`));
  }

  // ==== AI ====
  humanizeStream(req: HumanizeRequest): Observable<string> {
    return new Observable(sub => {
      const body = JSON.stringify(req);
      const token = localStorage.getItem('pv_auth_token');
      fetch(`${this.apiBase}/ai/humanize/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body
      }).then(async res => {
        if (!res.ok) { sub.error(res.statusText); return; }
        const rd = res.body?.getReader();
        if (!rd) { sub.complete(); return; }
        const dec = new TextDecoder();
        let buffer = '';
        try {
          while (true) {
            const { done, value } = await rd.read();
            if (done) break;
            buffer += dec.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith('data:')) continue;
              const data = trimmed.slice(5).trim();
              if (data === '[DONE]') continue;
              sub.next(data);
            }
          }
          sub.complete();
        } catch (e) { sub.error(e); }
      }).catch(e => sub.error(e));
    });
  }
  summarizeDocument(documentId: string): Observable<SummaryResponse> {
    return this.unwrap(this.http.post<ApiResponse<SummaryResponse>>(`${this.apiBase}/ai/summarize`, { documentId }));
  }
  chat(req: AiChatRequest): Observable<ChatResponse> {
    return this.unwrap(this.http.post<ApiResponse<ChatResponse>>(`${this.apiBase}/ai/chat`, req));
  }

  // ==== SEARCH ====
  search(params: { q: string; type?: string; workspaceId?: string; page?: number; size?: number; semantic?: boolean; }): Observable<PaginatedResponse<SearchResultItem>> {
    return this.p(this.http.get<ApiResponse<PaginatedResponse<SearchResultItem>>>(`${this.apiBase}/search`, { params: this.paramsFrom(params) }));
  }

  // ==== TEAMS ====
  listTeams(): Observable<TeamResponse[]> {
    return this.unwrap(this.http.get<ApiResponse<TeamResponse[]>>(`${this.apiBase}/teams`));
  }
  createTeam(req: CreateTeamRequest): Observable<TeamResponse> {
    return this.unwrap(this.http.post<ApiResponse<TeamResponse>>(`${this.apiBase}/teams`, req));
  }
  listMembers(teamId: string): Observable<TeamMembershipResponse[]> {
    return this.unwrap(this.http.get<ApiResponse<TeamMembershipResponse[]>>(`${this.apiBase}/teams/${teamId}/members`));
  }
  addMember(teamId: string, req: AddTeamMemberRequest): Observable<TeamMembershipResponse> {
    return this.unwrap(this.http.post<ApiResponse<TeamMembershipResponse>>(`${this.apiBase}/teams/${teamId}/members`, req));
  }
  removeMember(teamId: string, userId: string): Observable<void> {
    return this.unwrap(this.http.delete<ApiResponse<void>>(`${this.apiBase}/teams/${teamId}/members/${userId}`));
  }

  // ==== ADMIN USERS ====
  listUsers(page = 0, size = 20): Observable<PaginatedResponse<UserResponse>> {
    return this.p(this.http.get<ApiResponse<PaginatedResponse<UserResponse>>>(`${this.apiBase}/admin/users`, { params: { page, size } }));
  }
  createUser(req: CreateUserRequest): Observable<UserResponse> {
    return this.unwrap(this.http.post<ApiResponse<UserResponse>>(`${this.apiBase}/admin/users`, req));
  }
  changeRole(req: ChangeRoleRequest): Observable<UserResponse> {
    return this.unwrap(this.http.post<ApiResponse<UserResponse>>(`${this.apiBase}/admin/users/role`, req));
  }
  toggleUserActive(userId: string, active: boolean): Observable<UserResponse> {
    return this.unwrap(this.http.put<ApiResponse<UserResponse>>(`${this.apiBase}/admin/users/${userId}/active`, { active }));
  }

  // ==== EXPORT ====
  exportResources(req: ExportRequest): Observable<{ downloadUrl: string }> {
    return this.unwrap(this.http.post<ApiResponse<{ downloadUrl: string }>>(`${this.apiBase}/export`, req));
  }
}
