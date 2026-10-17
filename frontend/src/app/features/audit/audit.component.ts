import { Component, inject, signal, computed, OnInit, ViewContainerRef, TemplateRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgChartsModule } from 'ng2-charts';
import { ApiService } from '../../core/services/api.service';
import {
  AuditAction, AuditLogResponse, ResourceType, Role, SecurityEventResponse,
  AuditFilterRequest, SecurityEventFilter, WorkspaceResponse, PaginatedResponse
} from '../../core/models/pusula.models';

type ActionCategory = 'auth' | 'document' | 'file' | 'folder' | 'workspace' | 'access' | 'user' | 'search' | 'ai' | 'security' | 'export';

const ACTION_CATEGORY_MAP: Record<AuditAction, ActionCategory> = {
  LOGIN_SUCCESS: 'auth', LOGIN_FAILURE: 'auth', LOGOUT: 'auth',
  DOCUMENT_CREATED: 'document', DOCUMENT_VIEWED: 'document', DOCUMENT_UPDATED: 'document',
  DOCUMENT_DELETED: 'document', DOCUMENT_SHARED: 'document',
  DOCUMENT_VERSION_CREATED: 'document', DOCUMENT_VERSION_RESTORED: 'document',
  FILE_UPLOADED: 'file', FILE_VIEWED: 'file', FILE_DOWNLOADED: 'file',
  FILE_DOWNLOAD_DENIED: 'file', FILE_DELETED: 'file',
  FOLDER_CREATED: 'folder', FOLDER_UPDATED: 'folder', FOLDER_DELETED: 'folder',
  WORKSPACE_CREATED: 'workspace', WORKSPACE_UPDATED: 'workspace',
  ACCESS_GRANTED: 'access', ACCESS_REVOKED: 'access', ROLE_CHANGED: 'access', PERMISSION_CHANGED: 'access',
  USER_CREATED: 'user', USER_UPDATED: 'user',
  SEARCH_PERFORMED: 'search',
  AI_HUMANIZATION_REQUEST: 'ai', AI_DOCUMENT_QUERY: 'ai', AI_QUERY: 'ai',
  PASTE_EVENT: 'security', UNAUTHORIZED_ACCESS_ATTEMPT: 'security',
  EXCESSIVE_DOWNLOAD_ATTEMPTS: 'security',
  EXPORT_CREATED: 'export'
};

const CATEGORY_COLORS: Record<ActionCategory, string> = {
  auth: 'var(--pv-accent-blue)',
  document: 'var(--pv-accent-teal)',
  file: 'var(--pv-accent-amber)',
  folder: 'var(--pv-text-secondary)',
  workspace: 'var(--pv-accent-purple)',
  access: 'var(--pv-accent-amber)',
  user: 'var(--pv-accent-purple)',
  search: 'var(--pv-text-secondary)',
  ai: 'var(--pv-accent-purple)',
  security: 'var(--pv-accent-red)',
  export: 'var(--pv-text-muted)'
};

const SEVERITY_COLORS: Record<string, string> = {
  LOW: '#22c55e',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444',
  CRITICAL: '#a855f7'
};

const ROLE_BADGE_CLASS: Record<Role, string> = {
  FOUNDER: 'pv-badge-purple',
  ADMIN: 'pv-badge-red',
  MANAGER: 'pv-badge-amber',
  TEAM_LEAD: 'pv-badge-blue',
  EMPLOYEE: 'pv-badge-teal',
  INTERN: 'pv-badge-blue'
};

const ALL_ACTIONS: AuditAction[] = [
  'LOGIN_SUCCESS','LOGIN_FAILURE','LOGOUT',
  'DOCUMENT_CREATED','DOCUMENT_VIEWED','DOCUMENT_UPDATED','DOCUMENT_DELETED','DOCUMENT_SHARED',
  'DOCUMENT_VERSION_CREATED','DOCUMENT_VERSION_RESTORED',
  'FILE_UPLOADED','FILE_VIEWED','FILE_DOWNLOADED','FILE_DOWNLOAD_DENIED','FILE_DELETED',
  'FOLDER_CREATED','FOLDER_UPDATED','FOLDER_DELETED',
  'WORKSPACE_CREATED','WORKSPACE_UPDATED',
  'ACCESS_GRANTED','ACCESS_REVOKED','ROLE_CHANGED','PERMISSION_CHANGED',
  'USER_CREATED','USER_UPDATED',
  'SEARCH_PERFORMED','AI_HUMANIZATION_REQUEST','AI_DOCUMENT_QUERY','AI_QUERY',
  'PASTE_EVENT','UNAUTHORIZED_ACCESS_ATTEMPT','EXPORT_CREATED','EXCESSIVE_DOWNLOAD_ATTEMPTS'
];

const ALL_RESOURCE_TYPES: ResourceType[] = ['WORKSPACE','FOLDER','DOCUMENT','ASSET','TEAM'];

const ALL_SEVERITIES = ['LOW','MEDIUM','HIGH','CRITICAL'];

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, FormsModule, NgChartsModule],
  providers: [DatePipe],
  template: `
    <div class="audit-page" style="padding: 1.5rem; position: relative; z-index: 1; max-height: calc(100vh - 70px); overflow-y: auto;">
      <header class="audit-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h1 style="font-size: 1.75rem; margin-bottom: 0.25rem;">Audit Explorer</h1>
          <p style="color: var(--pv-text-muted); font-size: 0.9rem;">Immutable activity and security event traceability</p>
        </div>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <span class="pv-badge pv-badge-blue" style="display: inline-flex; align-items: center; gap: 0.35rem;">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: var(--pv-accent-blue); display: inline-block;"></span>
            Live
          </span>
        </div>
      </header>

      <div class="pv-card" style="padding: 1.25rem; margin-bottom: 1.5rem;">
        <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 1rem; align-items: end;">
          <div>
            <label class="pv-label">Actor (name/id)</label>
            <input class="pv-input" type="text" [value]="filters.actor()" (input)="filters.actor.set(($any($event.target).value))" placeholder="e.g. john.doe">
          </div>
          <div>
            <label class="pv-label">Action (multi)</label>
            <div class="multi-select-wrapper" style="position: relative;">
              <div class="pv-input" style="min-height: 40px; cursor: pointer;" (click)="actionDropdownOpen.set(!actionDropdownOpen())">
                @if (filters.actions().length === 0) {
                  <span style="color: var(--pv-text-subtle);">All actions</span>
                } @else {
                  <span style="display: flex; flex-wrap: wrap; gap: 0.25rem;">
                    @for (a of filters.actions().slice(0,3); track a) {
                      <span class="pv-badge pv-badge-blue" style="font-size: 0.65rem;">{{a}}</span>
                    }
                    @if (filters.actions().length > 3) {
                      <span class="pv-badge" style="font-size: 0.65rem; background: rgba(139,92,246,0.12); color: var(--pv-accent-purple); border: 1px solid rgba(139,92,246,0.3);">+{{filters.actions().length - 3}}</span>
                    }
                  </span>
                }
              </div>
              @if (actionDropdownOpen()) {
                <div class="dropdown-panel" style="position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 50; background: var(--pv-bg-elevated); border: 1px solid var(--pv-border); border-radius: var(--pv-radius-md); box-shadow: var(--pv-shadow-lg); max-height: 260px; overflow-y: auto;">
                  @for (a of ALL_ACTIONS; track a) {
                    <div style="padding: 0.5rem 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; font-size: 0.82rem; transition: background var(--pv-transition-fast);"
                      [style.background]="filters.actions().includes(a) ? 'rgba(14,165,233,0.12)' : 'transparent'"
                      (click)="toggleAction(a)">
                      <span style="width: 8px; height: 8px; border-radius: 50%; display: inline-block; background: {{actionColor(a)}};"></span>
                      <span [style.color]="filters.actions().includes(a) ? 'var(--pv-text-primary)' : 'var(--pv-text-secondary)'">{{a}}</span>
                      @if (filters.actions().includes(a)) {
                        <span style="margin-left: auto; color: var(--pv-accent-blue);">✓</span>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>
          <div>
            <label class="pv-label">Resource Type</label>
            <select class="pv-select" [value]="filters.resourceType()" (change)="filters.resourceType.set(($any($event.target).value || null))">
              <option value="">All types</option>
              @for (rt of ALL_RESOURCE_TYPES; track rt) {
                <option [value]="rt">{{rt}}</option>
              }
            </select>
          </div>
          <div>
            <label class="pv-label">Date From</label>
            <input class="pv-input" type="date" [value]="filters.dateFrom()" (change)="filters.dateFrom.set(($any($event.target).value))">
          </div>
          <div>
            <label class="pv-label">Date To</label>
            <input class="pv-input" type="date" [value]="filters.dateTo()" (change)="filters.dateTo.set(($any($event.target).value))">
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button class="pv-btn pv-btn-primary" style="flex: 1;" (click)="runSearch()">
              🔍 Search
            </button>
            <button class="pv-btn pv-btn-ghost" (click)="resetFilters()">↺</button>
          </div>
        </div>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 1rem;">
          <div>
            <label class="pv-label">Workspace</label>
            <select class="pv-select" [value]="filters.workspaceId()" (change)="filters.workspaceId.set(($any($event.target).value || ''))">
              <option value="">All workspaces</option>
              @for (w of workspaces(); track w.id) {
                <option [value]="w.id">{{w.name}}</option>
              }
            </select>
          </div>
          <div>
            <label class="pv-label">Severity (Security)</label>
            <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
              @for (s of ALL_SEVERITIES; track s) {
                <label style="display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.35rem 0.65rem; border-radius: var(--pv-radius-md); border: 1px solid; cursor: pointer; font-size: 0.78rem; font-weight: 600; transition: all var(--pv-transition-fast);"
                  [style.border-color]="filters.severities().includes(s) ? SEVERITY_COLORS[s] : 'var(--pv-border)'"
                  [style.background]="filters.severities().includes(s) ? SEVERITY_COLORS[s] + '22' : 'transparent'"
                  [style.color]="filters.severities().includes(s) ? SEVERITY_COLORS[s] : 'var(--pv-text-muted)'">
                  <input type="checkbox" style="display: none;" [checked]="filters.severities().includes(s)" (change)="toggleSeverity(s)">
                  <span style="width: 8px; height: 8px; border-radius: 50%; background: {{SEVERITY_COLORS[s]}};"></span>
                  {{s}}
                </label>
              }
            </div>
          </div>
          <div style="display: flex; align-items: end; justify-content: flex-end;">
            <span style="color: var(--pv-text-subtle); font-size: 0.8rem;">
              {{ auditTotal() }} audit · {{ secTotal() }} security events
            </span>
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 0.25rem; border-bottom: 1px solid var(--pv-border); margin-bottom: 1.25rem;">
        @for (tab of TABS; track tab.key) {
          <button style="padding: 0.75rem 1.25rem; background: transparent; border: none; border-bottom: 2px solid transparent; cursor: pointer; color: var(--pv-text-muted); font-weight: 600; font-size: 0.9rem; transition: all var(--pv-transition-fast);"
            [style.color]="activeTab() === tab.key ? 'var(--pv-text-primary)' : 'var(--pv-text-muted)'"
            [style.border-bottom-color]="activeTab() === tab.key ? 'var(--pv-accent-blue)' : 'transparent'"
            (click)="activeTab.set(tab.key)">
            {{tab.label}}
            <span class="pv-badge" style="margin-left: 0.5rem; font-size: 0.65rem; background: rgba(14,165,233,0.12); color: var(--pv-accent-blue); border: 1px solid rgba(14,165,233,0.3);">
              {{tab.key === 'audit' ? auditTotal() : secTotal()}}
            </span>
          </button>
        }
      </div>

      @if (activeTab() === 'audit') {
        <div class="pv-card" style="overflow: hidden;">
          <div class="pv-card-header" style="display: flex; align-items: center; justify-content: space-between;">
            <h3 style="font-size: 1rem;">Audit Logs</h3>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <span style="color: var(--pv-text-muted); font-size: 0.8rem;">Page {{auditPage() + 1}} / {{auditTotalPages()}}</span>
              <div style="display: flex; gap: 0.25rem;">
                <button class="pv-btn pv-btn-ghost" style="padding: 0.4rem 0.7rem;" [disabled]="auditFirst()" (click)="gotoAuditPage(auditPage() - 1)">←</button>
                <button class="pv-btn pv-btn-ghost" style="padding: 0.4rem 0.7rem;" [disabled]="auditLast()" (click)="gotoAuditPage(auditPage() + 1)">→</button>
              </div>
            </div>
          </div>
          <div class="audit-table-wrap" style="max-height: 520px; overflow-y: auto; overflow-x: auto;">
            <table class="pv-table">
              <thead style="position: sticky; top: 0; z-index: 2;">
                <tr>
                  <th style="width: 150px;">Timestamp</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th style="width: 70px;">OK</th>
                  <th>Message</th>
                  <th style="width: 110px;">IP</th>
                  <th>State</th>
                </tr>
              </thead>
              <tbody>
                @for (log of auditLogs(); track log.id; let even = $even) {
                  <tr style="cursor: pointer;" [style.background]="even ? 'rgba(3,7,18,0.4)' : 'transparent'" (click)="toggleExpand(log.id)">
                    <td style="font-size: 0.8rem; color: var(--pv-text-muted); white-space: nowrap;">
                      {{ log.createdAt | date:'yyyy-MM-dd HH:mm:ss' }}
                    </td>
                    <td>
                      <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, var(--pv-accent-blue), var(--pv-accent-purple)); display: flex; align-items: center; justify-content: center; font-size: 0.72rem; font-weight: 700; color: white;">
                          {{ (log.actorUsername || '?').charAt(0).toUpperCase() }}
                        </div>
                        <div>
                          <div style="font-size: 0.85rem; font-weight: 600; color: var(--pv-text-primary);">{{ log.actorUsername || 'System' }}</div>
                          @if (log.actorRole) {
                            <span class="pv-badge {{ roleBadge(log.actorRole) }}" style="font-size: 0.62rem; margin-top: 2px;">{{ log.actorRole }}</span>
                          }
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style="display: flex; align-items: center; gap: 0.4rem;">
                        <span style="width: 8px; height: 8px; border-radius: 50%; display: inline-block; background: {{actionColor(log.action)}}; box-shadow: 0 0 6px {{actionColor(log.action)}}55;"></span>
                        <span style="font-size: 0.78rem; font-family: 'JetBrains Mono', monospace; color: var(--pv-text-secondary);">{{ log.action }}</span>
                      </div>
                    </td>
                    <td>
                      @if (log.resourceType) {
                        <div>
                          <div style="font-size: 0.8rem; font-weight: 600; color: var(--pv-text-primary);">
                            {{ log.resourceName || '—' }}
                          </div>
                          <div style="font-size: 0.7rem; color: var(--pv-text-subtle);">
                            <span class="pv-badge" style="font-size: 0.62rem; background: rgba(30,58,95,0.5); color: var(--pv-text-muted); border: 1px solid var(--pv-border-soft); margin-right: 0.25rem;">{{ log.resourceType }}</span>
                            <span style="font-family: monospace;">#{{ log.resourceId?.slice(0,8) }}…</span>
                          </div>
                        </div>
                      } @else {
                        <span style="color: var(--pv-text-subtle); font-size: 0.78rem;">—</span>
                      }
                    </td>
                    <td>
                      @if (log.success) {
                        <span class="pv-badge pv-badge-teal" style="font-size: 0.72rem;">✔</span>
                      } @else {
                        <span class="pv-badge pv-badge-red" style="font-size: 0.72rem;">✘</span>
                      }
                    </td>
                    <td style="max-width: 260px;">
                      <div style="font-size: 0.8rem; color: var(--pv-text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                        {{ log.message || '—' }}
                      </div>
                    </td>
                    <td style="font-size: 0.78rem; font-family: monospace; color: var(--pv-text-muted);">
                      {{ log.ipAddress || '—' }}
                    </td>
                    <td>
                      @if (log.previousState || log.newState) {
                        <div style="display: flex; gap: 0.25rem; flex-wrap: wrap;">
                          @if (log.previousState) {
                            <span class="pv-badge pv-badge-amber" style="font-size: 0.62rem;">PREV</span>
                          }
                          @if (log.newState) {
                            <span class="pv-badge pv-badge-teal" style="font-size: 0.62rem;">NEW</span>
                          }
                        </div>
                      } @else {
                        <span style="color: var(--pv-text-subtle); font-size: 0.7rem;">—</span>
                      }
                    </td>
                  </tr>
                  @if (expandedRows().includes(log.id)) {
                    <tr>
                      <td colspan="8" style="padding: 0; border-bottom: 1px solid var(--pv-border-soft);">
                        <div style="background: var(--pv-bg-mid); padding: 1rem 1.5rem; border-left: 3px solid var(--pv-accent-blue);">
                          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem;">
                            @if (log.previousState) {
                              <div>
                                <div class="pv-label" style="margin-bottom: 0.5rem;">Previous State</div>
                                <pre style="background: var(--pv-bg-dark); padding: 0.75rem; border-radius: var(--pv-radius-sm); font-size: 0.75rem; color: var(--pv-accent-amber); overflow-x: auto; font-family: 'JetBrains Mono', monospace; border: 1px solid var(--pv-border);">{{ jsonPretty(log.previousState) }}</pre>
                              </div>
                            }
                            @if (log.newState) {
                              <div>
                                <div class="pv-label" style="margin-bottom: 0.5rem;">New State</div>
                                <pre style="background: var(--pv-bg-dark); padding: 0.75rem; border-radius: var(--pv-radius-sm); font-size: 0.75rem; color: var(--pv-accent-teal); overflow-x: auto; font-family: 'JetBrains Mono', monospace; border: 1px solid var(--pv-border);">{{ jsonPretty(log.newState) }}</pre>
                              </div>
                            }
                            @if (!log.previousState && !log.newState && log.id) {
                              <div style="grid-column: 1 / -1;">
                                <div class="pv-label" style="margin-bottom: 0.5rem;">Event Metadata</div>
                                <pre style="background: var(--pv-bg-dark); padding: 0.75rem; border-radius: var(--pv-radius-sm); font-size: 0.75rem; color: var(--pv-text-secondary); overflow-x: auto; font-family: 'JetBrains Mono', monospace; border: 1px solid var(--pv-border);">{{ jsonPretty({ sessionId: log.sessionId, userAgent: log.userAgent, workspaceId: log.workspaceId }) }}</pre>
                              </div>
                            }
                          </div>
                        </div>
                      </td>
                    </tr>
                  }
                } @empty {
                  <tr>
                    <td colspan="8" style="text-align: center; padding: 3rem; color: var(--pv-text-subtle);">
                      <div style="font-size: 2rem; margin-bottom: 0.75rem;">📋</div>
                      <div>No audit logs match your filters.</div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      @if (activeTab() === 'security') {
        <div class="pv-card" style="overflow: hidden;">
          <div class="pv-card-header" style="display: flex; align-items: center; justify-content: space-between;">
            <h3 style="font-size: 1rem;">
              <span style="color: var(--pv-accent-red); margin-right: 0.5rem;">⚠</span>
              Security Events
            </h3>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <span style="color: var(--pv-text-muted); font-size: 0.8rem;">Page {{secPage() + 1}} / {{secTotalPages()}}</span>
              <div style="display: flex; gap: 0.25rem;">
                <button class="pv-btn pv-btn-ghost" style="padding: 0.4rem 0.7rem;" [disabled]="secFirst()" (click)="gotoSecPage(secPage() - 1)">←</button>
                <button class="pv-btn pv-btn-ghost" style="padding: 0.4rem 0.7rem;" [disabled]="secLast()" (click)="gotoSecPage(secPage() + 1)">→</button>
              </div>
            </div>
          </div>
          <div style="max-height: 520px; overflow-y: auto; overflow-x: auto;">
            <table class="pv-table">
              <thead style="position: sticky; top: 0; z-index: 2;">
                <tr>
                  <th style="width: 50px;">Sev</th>
                  <th>Type</th>
                  <th>Actor</th>
                  <th>Description</th>
                  <th>Detected</th>
                  <th>Resolved</th>
                </tr>
              </thead>
              <tbody>
                @for (ev of securityEvents(); track ev.id; let even = $even) {
                  <tr [style.background]="even ? 'rgba(3,7,18,0.4)' : 'transparent'">
                    <td>
                      <span style="width: 12px; height: 12px; border-radius: 50%; display: inline-block; background: {{SEVERITY_COLORS[ev.severity]}}; box-shadow: 0 0 10px {{SEVERITY_COLORS[ev.severity]}}66;"></span>
                    </td>
                    <td>
                      <div style="font-size: 0.82rem; font-weight: 600; color: var(--pv-text-primary); font-family: 'JetBrains Mono', monospace;">{{ ev.type }}</div>
                      <span class="pv-badge" style="margin-top: 3px; font-size: 0.62rem; background: {{SEVERITY_COLORS[ev.severity] + '22'}}; color: {{SEVERITY_COLORS[ev.severity]}}; border: 1px solid {{SEVERITY_COLORS[ev.severity] + '55'}};">{{ ev.severity }}</span>
                    </td>
                    <td>
                      <div style="font-size: 0.85rem; color: var(--pv-text-secondary);">{{ ev.actorId ? ('#' + ev.actorId.slice(0,8)) : 'System' }}</div>
                      @if (ev.workspaceId) {
                        <div style="font-size: 0.7rem; color: var(--pv-text-subtle);">WS #{{ev.workspaceId.slice(0,8)}}</div>
                      }
                    </td>
                    <td style="max-width: 380px;">
                      <div style="font-size: 0.82rem; color: var(--pv-text-secondary); line-height: 1.5;">
                        {{ ev.description }}
                      </div>
                      @if (ev.metadata) {
                        <div style="margin-top: 0.35rem;">
                          <details style="font-size: 0.7rem;">
                            <summary style="cursor: pointer; color: var(--pv-accent-blue);">metadata</summary>
                            <pre style="margin-top: 0.35rem; background: var(--pv-bg-dark); padding: 0.5rem; border-radius: 4px; font-size: 0.7rem; color: var(--pv-text-muted); overflow-x: auto; font-family: monospace; border: 1px solid var(--pv-border);">{{ jsonPretty(ev.metadata) }}</pre>
                          </details>
                        </div>
                      }
                    </td>
                    <td style="font-size: 0.78rem; color: var(--pv-text-muted); white-space: nowrap;">
                      {{ ev.detectedAt | date:'yyyy-MM-dd HH:mm' }}
                    </td>
                    <td>
                      @if (ev.resolvedAt) {
                        <span class="pv-badge pv-badge-teal" style="font-size: 0.72rem;">
                          ✓ {{ ev.resolvedAt | date:'MM-dd' }}
                        </span>
                      } @else {
                        <span class="pv-badge pv-badge-red" style="font-size: 0.72rem;">🔴 Open</span>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="6" style="text-align: center; padding: 3rem; color: var(--pv-text-subtle);">
                      <div style="font-size: 2rem; margin-bottom: 0.75rem;">🛡️</div>
                      <div>No security events.</div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `
})
export class AuditComponent implements OnInit {
  private api = inject(ApiService);

  readonly TABS = [
    { key: 'audit' as const, label: 'Audit Logs' },
    { key: 'security' as const, label: 'Security Events' }
  ];
  readonly ALL_ACTIONS = ALL_ACTIONS;
  readonly ALL_RESOURCE_TYPES = ALL_RESOURCE_TYPES;
  readonly ALL_SEVERITIES = ALL_SEVERITIES;
  readonly SEVERITY_COLORS = SEVERITY_COLORS;

  readonly activeTab = signal<'audit' | 'security'>('audit');
  readonly actionDropdownOpen = signal(false);

  readonly filters = {
    actor: signal(''),
    actions: signal<AuditAction[]>([]),
    resourceType: signal<ResourceType | ''>(''),
    dateFrom: signal(''),
    dateTo: signal(''),
    workspaceId: signal(''),
    severities: signal<string[]>([])
  };

  readonly workspaces = signal<WorkspaceResponse[]>([]);

  readonly auditLogs = signal<AuditLogResponse[]>([]);
  readonly auditPage = signal(0);
  readonly auditSize = signal(20);
  readonly auditTotal = signal(0);
  readonly auditTotalPages = computed(() => Math.max(1, Math.ceil(this.auditTotal() / this.auditSize())));
  readonly auditFirst = computed(() => this.auditPage() === 0);
  readonly auditLast = computed(() => this.auditPage() >= this.auditTotalPages() - 1);

  readonly securityEvents = signal<SecurityEventResponse[]>([]);
  readonly secPage = signal(0);
  readonly secSize = signal(20);
  readonly secTotal = signal(0);
  readonly secTotalPages = computed(() => Math.max(1, Math.ceil(this.secTotal() / this.secSize())));
  readonly secFirst = computed(() => this.secPage() === 0);
  readonly secLast = computed(() => this.secPage() >= this.secTotalPages() - 1);

  readonly expandedRows = signal<number[]>([]);

  ngOnInit(): void {
    this.api.listWorkspaces().subscribe(w => this.workspaces.set(w));
    this.loadAudit();
    this.loadSecurity();
  }

  actionColor(action: AuditAction): string {
    return CATEGORY_COLORS[ACTION_CATEGORY_MAP[action] || 'document'];
  }

  roleBadge(role: Role): string {
    return ROLE_BADGE_CLASS[role] || 'pv-badge-blue';
  }

  toggleAction(a: AuditAction): void {
    const cur = this.filters.actions();
    if (cur.includes(a)) {
      this.filters.actions.set(cur.filter(x => x !== a));
    } else {
      this.filters.actions.set([...cur, a]);
    }
  }

  toggleSeverity(s: string): void {
    const cur = this.filters.severities();
    if (cur.includes(s)) {
      this.filters.severities.set(cur.filter(x => x !== s));
    } else {
      this.filters.severities.set([...cur, s]);
    }
  }

  toggleExpand(id: number): void {
    const cur = this.expandedRows();
    if (cur.includes(id)) {
      this.expandedRows.set(cur.filter(x => x !== id));
    } else {
      this.expandedRows.set([...cur, id]);
    }
  }

  jsonPretty(obj: unknown): string {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  }

  resetFilters(): void {
    this.filters.actor.set('');
    this.filters.actions.set([]);
    this.filters.resourceType.set('');
    this.filters.dateFrom.set('');
    this.filters.dateTo.set('');
    this.filters.workspaceId.set('');
    this.filters.severities.set([]);
    this.auditPage.set(0);
    this.secPage.set(0);
    this.runSearch();
  }

  runSearch(): void {
    this.actionDropdownOpen.set(false);
    this.auditPage.set(0);
    this.secPage.set(0);
    this.loadAudit();
    this.loadSecurity();
  }

  gotoAuditPage(p: number): void {
    if (p < 0 || p >= this.auditTotalPages()) return;
    this.auditPage.set(p);
    this.loadAudit();
  }

  gotoSecPage(p: number): void {
    if (p < 0 || p >= this.secTotalPages()) return;
    this.secPage.set(p);
    this.loadSecurity();
  }

  private loadAudit(): void {
    const filter: AuditFilterRequest = {
      page: this.auditPage(),
      size: this.auditSize()
    };
    if (this.filters.actor()) filter.actorId = this.filters.actor();
    if (this.filters.actions().length) filter.action = this.filters.actions();
    if (this.filters.resourceType() && this.filters.resourceType() !== '') {
      filter.resourceType = this.filters.resourceType() as any;
    }
    if (this.filters.workspaceId()) filter.workspaceId = this.filters.workspaceId();
    if (this.filters.dateFrom()) filter.from = this.filters.dateFrom();
    if (this.filters.dateTo()) filter.to = this.filters.dateTo();
    this.api.listAudit(filter).subscribe((r: PaginatedResponse<AuditLogResponse>) => {
      this.auditLogs.set(r.content || []);
      this.auditTotal.set(r.totalElements || 0);
    });
  }

  private loadSecurity(): void {
    const filter: SecurityEventFilter = {
      page: this.secPage(),
      size: this.secSize()
    };
    if (this.filters.severities().length) filter.severity = this.filters.severities();
    if (this.filters.actor()) filter.actorId = this.filters.actor();
    if (this.filters.dateFrom()) filter.from = this.filters.dateFrom();
    if (this.filters.dateTo()) filter.to = this.filters.dateTo();
    this.api.listSecurityEvents(filter).subscribe((r: PaginatedResponse<SecurityEventResponse>) => {
      this.securityEvents.set(r.content || []);
      this.secTotal.set(r.totalElements || 0);
    });
  }
}
