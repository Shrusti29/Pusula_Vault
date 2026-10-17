import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  inject,
  signal,
  computed,
  viewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, Subscription, catchError, of } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import {
  DocumentResponse,
  DocumentVersionResponse,
  CommentResponse,
  WorkspaceResponse,
  FolderResponse,
  SaveStatus,
  Permission,
  GranteeType,
  UserResponse,
  TeamResponse,
  SharePermissionGrantRequest,
  SharePermissionRevokeRequest,
} from '../../core/models/pusula.models';
import { TiptapEditorComponent } from './tiptap-editor.component';
import { FormatEditorComponent } from './format-editor.component';
import { AuthService } from '../../core/auth/auth.service';

type SaveState = 'SAVING' | 'SAVED' | 'ERROR' | 'CONFLICT';

@Component({
  selector: 'app-document-workspace',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, FormatEditorComponent],
  template: `
    <div class="ws-shell">
      <!-- Top bar: Area 1-9 grid shell -->
      <header class="ws-topbar">
        <div class="tb-col tb-crumb">
          <button class="pv-btn pv-btn-ghost back-btn" routerLink="/documents">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <nav class="crumb-trail" *ngIf="breadcrumbItems().length">
            <a class="crumb" routerLink="/documents">Documents</a>
            <span class="sep">/</span>
            <a class="crumb" *ngIf="workspace()?.id" [routerLink]="['/documents']" [queryParams]="{workspace: workspace()?.id}">
              {{ workspace()?.name }}
            </a>
            <span class="sep" *ngIf="workspace()?.id">/</span>
            <span class="crumb last">{{ document()?.title ?? 'Untitled' }}</span>
          </nav>
        </div>

        <div class="tb-col tb-title">
          <input
            #titleInput
            type="text"
            class="title-input"
            [value]="document()?.title ?? ''"
            (input)="onTitleChange(titleInput.value)"
            placeholder="Untitled document"
          />
        </div>

        <div class="tb-col tb-version">
          <span class="version-label">Version</span>
          <span class="version-num">{{ document()?.currentVersion ?? 1 }}</span>
        </div>

        <div class="tb-col tb-edited">
          <span class="edited-label">Last edited</span>
          <span class="edited-time">{{ formatLastEdited() }}</span>
        </div>

        <div class="tb-col tb-status" [class.status-saving]="saveStatus() === 'SAVING'"
             [class.status-saved]="saveStatus() === 'SAVED'"
             [class.status-error]="saveStatus() === 'ERROR'"
             [class.status-conflict]="saveStatus() === 'CONFLICT'">
          <span class="status-dot"></span>
          <span class="status-text">{{ saveStatusLabel() }}</span>
        </div>

        <div class="tb-col tb-actions">
          <button class="pv-btn pv-btn-primary sm-btn" (click)="humanize()" [disabled]="humanizing()">
            Humanize
          </button>
          <button class="pv-btn pv-btn-ghost sm-btn" (click)="toggleVersionPanel()" [class.active]="versionPanelOpen()">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            <span>History</span>
          </button>
          <button class="pv-btn pv-btn-outline sm-btn" (click)="openShareDialog()" *ngIf="!auth.isRestricted()">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>Share</span>
          </button>
        </div>
      </header>

      <!-- Main area: editor + sidebar (AI Tools / Comments) -->
      <div class="ws-main">
        <div class="ws-editor-col">
          <app-format-editor
            [docType]="document()?.documentType || 'TEXT'"
            [content]="editorContent()"
            (contentChange)="onEditorContentChange($event)"
          ></app-format-editor>

          <!-- Floating selection humanizer toolbar -->
          <div class="humanizer-toolbar" *ngIf="humanizerToolbarVisible()" [style.top.px]="toolbarPos().y" [style.left.px]="toolbarPos().x">
            <div class="ht-inner">
              <span class="ht-label">Rewrite:</span>
              <button class="ht-btn">Professional</button>
              <button class="ht-btn">Technical</button>
              <button class="ht-btn">Conversational</button>
              <span class="ht-sep"></span>
              <button class="ht-btn ht-short">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
                Humanize
              </button>
            </div>
          </div>
        </div>

        <!-- Right side panel: AI / Comments tabs + optional version panel -->
        <aside class="ws-sidebar">
          <div class="sidebar-tabs">
            <button class="s-tab" [class.active]="activeSidebarTab() === 'ai'" (click)="activeSidebarTab.set('ai')">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2a5 5 0 0 1 5 5v2a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5z"/>
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
              </svg>
              AI Tools
            </button>
            <button class="s-tab" [class.active]="activeSidebarTab() === 'comments'" (click)="activeSidebarTab.set('comments')">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Comments
              <span class="comment-count" *ngIf="comments().length">{{ unresolvedComments() }}</span>
            </button>
          </div>

          <div class="sidebar-body">
            <div class="ai-panel" *ngIf="activeSidebarTab() === 'ai'">
              <div class="panel-section">
                <h4 class="panel-title">Quick actions</h4>
                <button class="ai-action">
                  <span class="ai-ic">📝</span>
                  <span>Summarize document</span>
                </button>
                <button class="ai-action">
                  <span class="ai-ic">✅</span>
                  <span>Extract action items</span>
                </button>
                <button class="ai-action">
                  <span class="ai-ic">🔗</span>
                  <span>Find citations</span>
                </button>
                <button class="ai-action">
                  <span class="ai-ic">🔍</span>
                  <span>Proofread &amp; suggest</span>
                </button>
              </div>
              <div class="panel-section">
                <h4 class="panel-title">Ask about this document</h4>
                <textarea class="pv-textarea" placeholder="Type your question..."></textarea>
                <button class="pv-btn pv-btn-primary full-btn mt-sm">
                  Ask Pusula AI
                </button>
              </div>
            </div>

            <div class="comments-panel" *ngIf="activeSidebarTab() === 'comments'">
              <div class="panel-section">
                <h4 class="panel-title">New comment</h4>
                <textarea
                  class="pv-textarea"
                  [(ngModel)]="newCommentText"
                  placeholder="Add a comment or suggestion..."
                ></textarea>
                <button class="pv-btn pv-btn-primary full-btn mt-sm" (click)="submitComment()" [disabled]="!newCommentText.trim()">
                  Post comment
                </button>
              </div>
              <div class="panel-section comments-list" *ngIf="comments().length">
                <div class="comment-thread" *ngFor="let c of comments()">
                  <div class="comment-head">
                    <div class="avatar">{{ (c.authorName ?? 'U').charAt(0).toUpperCase() }}</div>
                    <div class="comment-meta">
                      <span class="c-name">{{ c.authorName ?? 'Unknown user' }}</span>
                      <span class="c-date">{{ formatDate(c.createdAt) }}</span>
                    </div>
                    <button
                      class="resolve-btn"
                      [class.resolved]="c.resolved"
                      (click)="toggleResolve(c)"
                    >
                      {{ c.resolved ? 'Reopen' : 'Resolve' }}
                    </button>
                  </div>
                  <p class="comment-body">{{ c.content }}</p>
                </div>
              </div>
              <div class="empty-panel" *ngIf="!comments().length">
                <div class="empty-icon">💬</div>
                <p>No comments yet. Start the conversation.</p>
              </div>
            </div>
          </div>
        </aside>

        <!-- Version history slide-in panel -->
        <aside class="version-panel" *ngIf="versionPanelOpen()">
          <div class="vp-head">
            <h3>Version History</h3>
            <button class="modal-close" (click)="toggleVersionPanel()">×</button>
          </div>
          <div class="vp-body">
            <div class="version-item" *ngFor="let v of versions(); let i = index" [class.current]="i === 0">
              <div class="vi-mark"></div>
              <div class="vi-main">
                <div class="vi-toprow">
                  <span class="vi-ver">v{{ v.versionNumber }}</span>
                  <span class="pv-badge pv-badge-blue" *ngIf="i === 0">Latest</span>
                  <span class="pv-badge pv-badge-green" *ngIf="v.priority">Priority</span>
                </div>
                <p class="vi-summary" *ngIf="v.changeSummary">{{ v.changeSummary }}</p>
                <p class="vi-summary placeholder" *ngIf="!v.changeSummary">No change summary</p>
                <div class="vi-meta">
                  <span>{{ v.createdBy ?? 'System' }}</span>
                  <span class="vi-dot">·</span>
                  <span>{{ formatDate(v.createdAt) }}</span>
                </div>
                <p class="vi-summary" *ngIf="v.priorityNote">{{ v.priorityNote }}</p>
                <div class="vi-actions">
                  <button class="pv-btn pv-btn-outline xs-btn" *ngIf="auth.isLeadership()" (click)="prioritise(v.id, !!v.priority)">
                    {{ v.priority ? 'Clear priority' : 'Prioritise' }}
                  </button>
                  <button class="pv-btn pv-btn-outline xs-btn" *ngIf="i > 0" (click)="restoreVersion(v.id)">Restore</button>
                </div>
              </div>
            </div>
            <div class="empty-panel" *ngIf="!versions().length">
              <p>No versions saved yet.</p>
            </div>
          </div>
        </aside>
      </div>

      <!-- Conflict Dialog -->
      <div class="pv-modal-overlay" *ngIf="conflictDialogOpen()">
        <div class="pv-modal conflict-modal">
          <div class="modal-head conflict-head">
            <div class="conflict-ic">⚠️</div>
            <div class="conflict-heading">
              <h3>Document modified by another user</h3>
              <p>The document was updated remotely while you were editing. What would you like to do?</p>
            </div>
          </div>
          <div class="modal-body conflict-body">
            <div class="conflict-actions">
              <button class="pv-btn pv-btn-ghost" (click)="closeConflictDialog()">
                Keep editing locally
              </button>
              <button class="pv-btn pv-btn-outline" (click)="compareVersions()">
                Compare versions
              </button>
              <button class="pv-btn pv-btn-primary" (click)="reloadDocument()">
                Reload document
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Share Dialog -->
      <div class="pv-modal-overlay" *ngIf="shareDialogOpen()" (click.self)="closeShareDialog()">
        <div class="pv-modal pv-modal-lg share-modal">
          <div class="modal-head">
            <div>
              <h3>Share document</h3>
              <p class="modal-subtitle">Manage access for this document</p>
            </div>
            <button class="modal-close" (click)="closeShareDialog()">×</button>
          </div>
          <div class="modal-body share-body">
            <div class="share-row grantee-row">
              <label class="pv-label">Grantee type</label>
              <div class="grantee-types">
                <button
                  *ngFor="let gt of granteeTypes"
                  class="gt-btn"
                  [class.active]="selectedGranteeType() === gt.value"
                  (click)="selectedGranteeType.set(gt.value)"
                >
                  <span class="gt-ic">{{ gt.icon }}</span>
                  <span>{{ gt.label }}</span>
                </button>
              </div>
            </div>

            <div class="share-row">
              <label class="pv-label">{{ granteeLabel() }}</label>
              <select class="pv-select" [(ngModel)]="selectedGranteeId">
                <option [value]="''">-- Select --</option>
                <option *ngFor="let g of granteeList()" [value]="g.id">{{ g.label }}</option>
              </select>
            </div>

            <div class="share-row">
              <label class="pv-label">Permissions</label>
              <div class="perms-grid">
                <label class="perm-item" *ngFor="let p of permissionDefs">
                  <input
                    type="checkbox"
                    [checked]="selectedPermissions().includes(p.value)"
                    (change)="togglePermission(p.value, $any($event.target).checked)"
                  />
                  <div class="perm-body">
                    <span class="perm-name">{{ p.label }}</span>
                    <span class="perm-desc">{{ p.desc }}</span>
                  </div>
                </label>
              </div>
            </div>

            <div class="share-actions">
              <button class="pv-btn pv-btn-outline" (click)="revokeSelectedGrantee()" [disabled]="!selectedGranteeId()">
                Revoke access
              </button>
              <button class="pv-btn pv-btn-primary" (click)="grantSelectedPermissions()" [disabled]="!selectedGranteeId() || !selectedPermissions().length">
                Grant access
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ws-shell {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: var(--pv-bg-dark);
    }
    .ws-topbar {
      display: grid;
      grid-template-columns: minmax(260px, 1fr) 2fr auto auto auto auto;
      gap: 1rem;
      align-items: center;
      padding: 0.75rem 1.5rem;
      background: var(--pv-bg-elevated);
      border-bottom: 1px solid var(--pv-border);
      backdrop-filter: blur(16px);
    }
    .tb-col { display: flex; align-items: center; gap: 0.5rem; min-width: 0; }
    .back-btn { padding: 0.5rem; }
    .crumb-trail {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.82rem;
      flex-wrap: wrap;
    }
    .crumb { color: var(--pv-text-muted); text-decoration: none; transition: color var(--pv-transition-fast); }
    .crumb:hover { color: var(--pv-accent-blue); }
    .crumb.last { color: var(--pv-text-primary); font-weight: 600; }
    .sep { color: var(--pv-text-subtle); font-size: 0.7rem; }

    .title-input {
      width: 100%;
      background: transparent;
      border: 1px solid transparent;
      padding: 0.5rem 0.75rem;
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--pv-text-primary);
      border-radius: var(--pv-radius-sm);
      outline: none;
      transition: all var(--pv-transition-fast);
    }
    .title-input:focus {
      background: var(--pv-bg-mid);
      border-color: var(--pv-border);
      box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
    }

    .version-label, .edited-label {
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--pv-text-subtle);
      font-weight: 600;
    }
    .version-num {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--pv-accent-purple);
      padding: 0.2rem 0.55rem;
      background: rgba(139, 92, 246, 0.1);
      border: 1px solid rgba(139, 92, 246, 0.3);
      border-radius: 6px;
    }
    .edited-time { font-size: 0.82rem; color: var(--pv-text-secondary); font-weight: 500; }

    .tb-status {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.85rem;
      border-radius: var(--pv-radius-md);
      border: 1px solid var(--pv-border);
      background: var(--pv-bg-card);
    }
    .status-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--pv-text-subtle);
      transition: all var(--pv-transition-fast);
    }
    .status-text { font-size: 0.78rem; font-weight: 600; color: var(--pv-text-muted); }
    .status-saving .status-dot { background: var(--pv-accent-amber); animation: pulseGlow 1.2s infinite; }
    .status-saving .status-text { color: var(--pv-accent-amber); }
    .status-saved .status-dot { background: var(--pv-accent-teal); }
    .status-saved .status-text { color: var(--pv-accent-teal); }
    .status-error .status-dot { background: var(--pv-accent-red); }
    .status-error .status-text { color: var(--pv-accent-red); }
    .status-conflict .status-dot { background: var(--pv-accent-red); animation: pulseGlow 0.8s infinite; }
    .status-conflict { border-color: rgba(220, 38, 38, 0.4); background: rgba(220, 38, 38, 0.08); }
    .status-conflict .status-text { color: var(--pv-accent-red); }

    .tb-actions { display: flex; gap: 0.5rem; }
    .sm-btn { padding: 0.45rem 0.85rem; font-size: 0.78rem; }
    .sm-btn.active { background: rgba(14, 165, 233, 0.12); border-color: rgba(14, 165, 233, 0.4); }

    .ws-main {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 360px;
      min-height: 0;
      position: relative;
    }
    .ws-editor-col {
      position: relative;
      padding: 1.5rem 2rem;
      overflow-y: auto;
      display: flex;
      justify-content: center;
    }
    .ws-editor-col ::ng-deep app-tiptap-editor {
      width: 100%;
      max-width: 900px;
    }

    .ws-sidebar {
      display: flex;
      flex-direction: column;
      background: var(--pv-bg-elevated);
      border-left: 1px solid var(--pv-border);
      min-height: 0;
    }
    .sidebar-tabs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      border-bottom: 1px solid var(--pv-border);
    }
    .s-tab {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.85rem 1rem;
      background: transparent;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--pv-text-muted);
      cursor: pointer;
      font-size: 0.82rem;
      font-weight: 600;
      transition: all var(--pv-transition-fast);
    }
    .s-tab:hover { color: var(--pv-text-primary); background: var(--pv-bg-card-hover); }
    .s-tab.active {
      color: var(--pv-accent-blue);
      border-bottom-color: var(--pv-accent-blue);
      background: rgba(14, 165, 233, 0.06);
    }
    .comment-count {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.1rem 0.4rem;
      background: var(--pv-accent-red);
      color: white;
      border-radius: 999px;
    }

    .sidebar-body { flex: 1; overflow-y: auto; padding: 1.25rem; }
    .panel-section { margin-bottom: 1.5rem; }
    .panel-title {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--pv-text-muted);
      font-weight: 700;
      margin-bottom: 0.75rem;
    }
    .ai-action {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.75rem 1rem;
      background: var(--pv-bg-card);
      border: 1px solid var(--pv-border);
      border-radius: var(--pv-radius-md);
      color: var(--pv-text-secondary);
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 500;
      text-align: left;
      margin-bottom: 0.5rem;
      transition: all var(--pv-transition-fast);
    }
    .ai-action:hover {
      border-color: var(--pv-accent-blue);
      color: var(--pv-text-primary);
      background: var(--pv-bg-card-hover);
      transform: translateX(3px);
    }
    .ai-ic { font-size: 1.05rem; }

    .full-btn { width: 100%; }
    .mt-sm { margin-top: 0.75rem; }

    .comments-list { max-height: none; }
    .comment-thread {
      padding: 1rem;
      background: var(--pv-bg-card);
      border: 1px solid var(--pv-border);
      border-radius: var(--pv-radius-md);
      margin-bottom: 0.75rem;
      transition: all var(--pv-transition-fast);
    }
    .comment-thread:hover { border-color: var(--pv-border-soft); }
    .comment-head {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 0.6rem;
    }
    .avatar {
      width: 34px; height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--pv-accent-blue), var(--pv-accent-purple));
      color: white;
      border-radius: 50%;
      font-weight: 700;
      font-size: 0.85rem;
      flex-shrink: 0;
    }
    .comment-meta { flex: 1; min-width: 0; }
    .c-name { display: block; font-size: 0.85rem; font-weight: 600; color: var(--pv-text-primary); }
    .c-date { font-size: 0.72rem; color: var(--pv-text-subtle); }
    .resolve-btn {
      padding: 0.25rem 0.6rem;
      font-size: 0.72rem;
      background: transparent;
      border: 1px solid var(--pv-border);
      border-radius: 999px;
      color: var(--pv-text-muted);
      cursor: pointer;
      font-weight: 600;
      transition: all var(--pv-transition-fast);
    }
    .resolve-btn:hover { border-color: var(--pv-accent-teal); color: var(--pv-accent-teal); }
    .resolve-btn.resolved { background: rgba(20, 184, 166, 0.12); border-color: rgba(20, 184, 166, 0.3); color: var(--pv-accent-teal); }
    .comment-body { font-size: 0.85rem; color: var(--pv-text-secondary); line-height: 1.6; }

    .empty-panel {
      text-align: center;
      padding: 2rem 1rem;
      color: var(--pv-text-muted);
      font-size: 0.85rem;
    }
    .empty-panel .empty-icon { font-size: 2rem; margin-bottom: 0.5rem; }

    .version-panel {
      position: absolute;
      top: 0; right: 360px;
      bottom: 0;
      width: 360px;
      background: var(--pv-bg-elevated);
      border-left: 1px solid var(--pv-border);
      z-index: 10;
      display: flex;
      flex-direction: column;
      animation: slideInRight 250ms cubic-bezier(0.16, 1, 0.3, 1);
    }
    .vp-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--pv-border);
    }
    .vp-head h3 { font-size: 1rem; }
    .vp-body { flex: 1; overflow-y: auto; padding: 1rem; }
    .version-item {
      display: flex;
      gap: 0.85rem;
      padding: 0.85rem 0;
      border-bottom: 1px solid var(--pv-border-soft);
    }
    .version-item.current {
      background: linear-gradient(90deg, rgba(14, 165, 233, 0.08), transparent);
      border-radius: var(--pv-radius-md);
      padding-left: 0.75rem;
      padding-right: 0.75rem;
      margin: 0 -0.75rem;
    }
    .vi-mark {
      width: 10px; height: 10px;
      border-radius: 50%;
      background: var(--pv-border);
      margin-top: 0.45rem;
      flex-shrink: 0;
      position: relative;
    }
    .version-item.current .vi-mark { background: var(--pv-accent-blue); box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.2); }
    .vi-main { flex: 1; min-width: 0; }
    .vi-toprow { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem; }
    .vi-ver { font-weight: 700; font-size: 0.9rem; color: var(--pv-text-primary); }
    .vi-summary { font-size: 0.82rem; color: var(--pv-text-secondary); line-height: 1.5; margin-bottom: 0.4rem; }
    .vi-summary.placeholder { color: var(--pv-text-subtle); font-style: italic; }
    .vi-meta {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.72rem;
      color: var(--pv-text-muted);
      margin-bottom: 0.5rem;
    }
    .vi-dot { color: var(--pv-text-subtle); }
    .vi-actions { display: flex; gap: 0.4rem; }
    .xs-btn { padding: 0.3rem 0.65rem; font-size: 0.72rem; }

    .humanizer-toolbar {
      position: absolute;
      z-index: 50;
      pointer-events: auto;
    }
    .ht-inner {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.4rem 0.5rem;
      background: var(--pv-bg-elevated);
      border: 1px solid var(--pv-border);
      border-radius: var(--pv-radius-md);
      box-shadow: var(--pv-shadow-lg);
    }
    .ht-label { font-size: 0.7rem; color: var(--pv-text-muted); font-weight: 600; padding-right: 0.25rem; }
    .ht-btn {
      padding: 0.3rem 0.55rem;
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--pv-radius-sm);
      color: var(--pv-text-secondary);
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--pv-transition-fast);
    }
    .ht-btn:hover { background: var(--pv-bg-card-hover); color: var(--pv-text-primary); }
    .ht-btn.ht-short {
      background: linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(139, 92, 246, 0.15));
      color: var(--pv-accent-blue);
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      font-weight: 600;
    }
    .ht-sep { width: 1px; height: 18px; background: var(--pv-border); margin: 0 0.25rem; }

    .conflict-head {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.5rem;
      border-bottom: 1px solid var(--pv-border);
    }
    .conflict-ic {
      width: 48px; height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(220, 38, 38, 0.12);
      border-radius: var(--pv-radius-lg);
      font-size: 1.6rem;
      flex-shrink: 0;
    }
    .conflict-heading h3 { color: var(--pv-text-primary); margin-bottom: 0.35rem; }
    .conflict-heading p { font-size: 0.85rem; color: var(--pv-text-muted); line-height: 1.5; }
    .conflict-body { padding: 1.5rem; }
    .conflict-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
    }

    .share-modal { max-width: 720px; }
    .modal-subtitle { font-size: 0.82rem; color: var(--pv-text-muted); margin-top: 0.25rem; }
    .share-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
    .share-row { display: flex; flex-direction: column; gap: 0.6rem; }
    .grantee-types {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.5rem;
    }
    .gt-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.3rem;
      padding: 0.85rem 0.5rem;
      background: var(--pv-bg-card);
      border: 1px solid var(--pv-border);
      border-radius: var(--pv-radius-md);
      color: var(--pv-text-secondary);
      cursor: pointer;
      transition: all var(--pv-transition-fast);
      font-size: 0.78rem;
      font-weight: 500;
    }
    .gt-btn:hover { border-color: var(--pv-accent-blue); color: var(--pv-text-primary); }
    .gt-btn.active {
      background: rgba(14, 165, 233, 0.1);
      border-color: rgba(14, 165, 233, 0.4);
      color: var(--pv-accent-blue);
    }
    .gt-ic { font-size: 1.3rem; }
    .perms-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
    }
    .perm-item {
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
      padding: 0.75rem;
      background: var(--pv-bg-card);
      border: 1px solid var(--pv-border);
      border-radius: var(--pv-radius-md);
      cursor: pointer;
      transition: all var(--pv-transition-fast);
    }
    .perm-item:hover { border-color: var(--pv-border-soft); }
    .perm-item input[type="checkbox"] {
      margin-top: 0.2rem;
      accent-color: var(--pv-accent-blue);
      cursor: pointer;
    }
    .perm-body { flex: 1; min-width: 0; }
    .perm-name { display: block; font-size: 0.85rem; font-weight: 600; color: var(--pv-text-primary); }
    .perm-desc { font-size: 0.72rem; color: var(--pv-text-muted); line-height: 1.4; }
    .share-actions {
      display: flex;
      justify-content: space-between;
      gap: 0.75rem;
      padding-top: 0.5rem;
      border-top: 1px solid var(--pv-border);
    }
  `]
})
export class DocumentWorkspaceComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  auth = inject(AuthService);

  editorRef = viewChild(TiptapEditorComponent);

  document = signal<DocumentResponse | null>(null);
  workspace = signal<WorkspaceResponse | null>(null);
  breadcrumbItems = signal<{ id: string; label: string }[]>([]);
  editorContent = signal<string>('');
  versions = signal<DocumentVersionResponse[]>([]);
  comments = signal<CommentResponse[]>([]);

  saveStatus = signal<SaveState>('SAVED');
  saveStatusLabel = computed(() => {
    switch (this.saveStatus()) {
      case 'SAVING': return 'Saving...';
      case 'SAVED': return 'All changes saved';
      case 'ERROR': return 'Save failed';
      case 'CONFLICT': return 'Conflict detected';
      default: return 'Saved';
    }
  });

  versionPanelOpen = signal(false);
  conflictDialogOpen = signal(false);
  shareDialogOpen = signal(false);

  activeSidebarTab = signal<'ai' | 'comments'>('ai');
  newCommentText = '';

  unresolvedComments = computed(() => this.comments().filter(c => !c.resolved).length);

  humanizerToolbarVisible = signal(false);
  humanizing = signal(false);
  toolbarPos = signal({ x: 0, y: 0 });

  selectedGranteeType = signal<GranteeType>('USER');
  selectedGranteeId = signal<string>('');
  selectedPermissions = signal<Permission[]>(['VIEW']);
  granteeList = signal<{ id: string; label: string }[]>([]);

  users = signal<UserResponse[]>([]);
  teams = signal<TeamResponse[]>([]);
  allWorkspaces = signal<WorkspaceResponse[]>([]);

  readonly granteeTypes: { label: string; value: GranteeType; icon: string }[] = [
    { label: 'User', value: 'USER', icon: '👤' },
    { label: 'Team', value: 'TEAM', icon: '👥' },
    { label: 'Role', value: 'ROLE', icon: '🎖️' },
    { label: 'Workspace', value: 'WORKSPACE', icon: '🗂️' },
  ];

  readonly permissionDefs: { label: string; value: Permission; desc: string }[] = [
    { label: 'View', value: 'VIEW', desc: 'Read the document' },
    { label: 'Edit', value: 'EDIT', desc: 'Modify content' },
    { label: 'Comment', value: 'COMMENT', desc: 'Post comments' },
    { label: 'Upload', value: 'UPLOAD', desc: 'Attach files' },
    { label: 'Download', value: 'DOWNLOAD', desc: 'Export / download' },
    { label: 'Share', value: 'SHARE', desc: 'Manage sharing' },
    { label: 'Delete', value: 'DELETE', desc: 'Remove document' },
    { label: 'Manage access', value: 'MANAGE_ACCESS', desc: 'Full permission control' },
  ];

  readonly roles: { id: string; label: string }[] = [
    { id: 'FOUNDER', label: 'Founder' },
    { id: 'ADMIN', label: 'Admin' },
    { id: 'MANAGER', label: 'Manager' },
    { id: 'TEAM_LEAD', label: 'Team Lead' },
    { id: 'EMPLOYEE', label: 'Employee' },
    { id: 'INTERN', label: 'Intern' },
  ];

  granteeLabel = computed(() => {
    switch (this.selectedGranteeType()) {
      case 'USER': return 'Select user';
      case 'TEAM': return 'Select team';
      case 'ROLE': return 'Select role';
      case 'WORKSPACE': return 'Select workspace';
      default: return 'Select grantee';
    }
  });

  private autosave$ = new Subject<{ title?: string; content: string }>();
  private autosaveSub: Subscription | null = null;
  private docId: string | null = null;
  private routeSub: Subscription | null = null;
  private presenceTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.routeSub = this.route.params.subscribe(p => {
      this.docId = p['documentId'] || p['id'];
      if (this.docId) this.loadDocument(this.docId);
    });

    this.autosaveSub = this.autosave$
      .pipe(debounceTime(1500))
      .subscribe(payload => this.executeSave(payload));

    this.api.listTeams().subscribe({
      next: t => this.teams.set(t),
      error: () => {}
    });
    this.api.listWorkspaces().subscribe({
      next: w => this.allWorkspaces.set(w),
      error: () => {}
    });
    this.presenceTimer = setInterval(() => this.pingPresence(), 20000);
    this.pingPresence();
    this.api.listUsers(0, 100).subscribe({
      next: u => this.users.set(u.content),
      error: () => {}
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.autosaveSub?.unsubscribe();
    if (this.presenceTimer) clearInterval(this.presenceTimer);
  }

  private pingPresence(): void {
    if (!this.docId) return;
    this.api.post('/vault/presence', { documentId: this.docId }).subscribe({ error: () => {} });
  }

  prioritise(versionId: string, current: boolean): void {
    const note = current ? '' : (prompt('Why is this version the one to keep?', 'Preferred draft') || '');
    this.api.post(`/versions/${versionId}/priority`, { priority: !current, note }).subscribe({
      next: () => this.loadVersions()
    });
  }

  private loadDocument(id: string): void {
    this.api.getDocument(id).subscribe({
      next: doc => {
        this.document.set(doc);
        this.editorContent.set(doc.content ?? '');
        this.saveStatus.set('SAVED');
        if (doc.workspaceId) {
          this.api.getWorkspace(doc.workspaceId).subscribe({
            next: w => this.workspace.set(w),
            error: () => {}
          });
        }
        this.loadVersions();
        this.loadComments();
      },
      error: () => {}
    });
  }

  private loadVersions(): void {
    if (!this.docId) return;
    this.api.listVersions(this.docId).subscribe({
      next: v => this.versions.set(v),
      error: () => this.versions.set([])
    });
  }

  private loadComments(): void {
    if (!this.docId) return;
    this.api.listComments(this.docId).subscribe({
      next: c => this.comments.set(c),
      error: () => this.comments.set([])
    });
  }

  onTitleChange(title: string): void {
    this.document.update(d => d ? { ...d, title } : d);
    this.scheduleSave({ title, content: this.editorContent() });
  }

  onEditorContentChange(content: string): void {
    this.editorContent.set(content);
    const doc = this.document();
    this.scheduleSave({ title: doc?.title, content });
  }

  humanize(): void {
    const doc = this.document();
    this.humanizing.set(true);
    this.api.post<{ text: string }>('/ai/humanize', {
      text: this.editorContent(),
      documentType: doc?.documentType || 'TEXT',
      tone: 'Professional'
    }).subscribe({
      next: (res) => {
        const text = res.data?.text ?? this.editorContent();
        this.onEditorContentChange(text);
        this.humanizing.set(false);
      },
      error: () => this.humanizing.set(false)
    });
  }

  private scheduleSave(payload: { title?: string; content: string }): void {
    this.saveStatus.set('SAVING');
    this.autosave$.next(payload);
  }

  private executeSave(payload: { title?: string; content: string }): void {
    if (!this.docId) return;
    this.api.saveDraft(this.docId, { content: payload.content, title: payload.title }).subscribe({
      next: updated => {
        this.saveStatus.set('SAVED');
        this.document.update(d => d ? { ...d, ...updated, lastEditedAt: new Date().toISOString() } : d);
      },
      error: err => {
        if (err?.status === 409) {
          this.saveStatus.set('CONFLICT');
          this.conflictDialogOpen.set(true);
        } else {
          this.saveStatus.set('ERROR');
        }
      }
    });
  }

  submitComment(): void {
    if (!this.docId || !this.newCommentText.trim()) return;
    this.api.createComment({
      documentId: this.docId,
      content: this.newCommentText.trim(),
    }).subscribe({
      next: c => {
        this.comments.update(prev => [c, ...prev]);
        this.newCommentText = '';
      }
    });
  }

  toggleResolve(c: CommentResponse): void {
    this.api.resolveComment(c.id, !c.resolved).subscribe({
      next: updated => {
        this.comments.update(prev => prev.map(x => x.id === c.id ? updated : x));
      }
    });
  }

  restoreVersion(versionId: string): void {
    if (!confirm('Restore this version? Current draft will be overwritten.')) return;
    this.api.restoreVersion(versionId).subscribe({
      next: () => {
        this.loadDocument(this.docId!);
        this.toggleVersionPanel();
      }
    });
  }

  toggleVersionPanel(): void {
    this.versionPanelOpen.update(v => !v);
  }

  reloadDocument(): void {
    this.conflictDialogOpen.set(false);
    if (this.docId) this.loadDocument(this.docId);
  }

  compareVersions(): void {
    this.conflictDialogOpen.set(false);
    this.activeSidebarTab.set('ai');
  }

  closeConflictDialog(): void {
    this.conflictDialogOpen.set(false);
  }

  openShareDialog(): void {
    this.selectedGranteeType.set('USER');
    this.selectedGranteeId.set('');
    this.selectedPermissions.set(['VIEW']);
    this.refreshGranteeList();
    this.shareDialogOpen.set(true);
  }

  closeShareDialog(): void {
    this.shareDialogOpen.set(false);
  }

  refreshGranteeList(): void {
    switch (this.selectedGranteeType()) {
      case 'USER':
        this.granteeList.set(this.users().map(u => ({ id: u.id, label: `${u.fullName} (${u.username})` })));
        break;
      case 'TEAM':
        this.granteeList.set(this.teams().map(t => ({ id: t.id, label: t.name })));
        break;
      case 'ROLE':
        this.granteeList.set(this.roles);
        break;
      case 'WORKSPACE':
        this.granteeList.set(this.allWorkspaces().map(w => ({ id: w.id, label: w.name })));
        break;
    }
    this.selectedGranteeId.set('');
  }

  togglePermission(p: Permission, checked: boolean): void {
    if (checked) {
      this.selectedPermissions.update(prev => prev.includes(p) ? prev : [...prev, p]);
    } else {
      this.selectedPermissions.update(prev => prev.filter(x => x !== p));
    }
  }

  grantSelectedPermissions(): void {
    const doc = this.document();
    if (!doc || !this.selectedGranteeId()) return;
    const req: SharePermissionGrantRequest = {
      resourceType: 'DOCUMENT',
      resourceId: doc.id,
      granteeType: this.selectedGranteeType(),
      granteeId: this.selectedGranteeId(),
      permissions: this.selectedPermissions(),
      allow: true,
    };
    this.api.grantPermission(req).subscribe({
      next: () => {
        alert('Permissions granted');
      }
    });
  }

  revokeSelectedGrantee(): void {
    const doc = this.document();
    if (!doc || !this.selectedGranteeId()) return;
    const req: SharePermissionRevokeRequest = {
      resourceType: 'DOCUMENT',
      resourceId: doc.id,
      granteeType: this.selectedGranteeType(),
      granteeId: this.selectedGranteeId(),
    };
    this.api.revokePermission(req).subscribe({
      next: () => {
        alert('Access revoked');
      }
    });
  }

  formatLastEdited(): string {
    const doc = this.document();
    if (!doc) return '—';
    return this.formatDate(doc.lastEditedAt ?? doc.updatedAt);
  }

  formatDate(iso: string): string {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diff = now.getTime() - d.getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      if (days < 7) return `${days}d ago`;
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch { return ''; }
  }
}
