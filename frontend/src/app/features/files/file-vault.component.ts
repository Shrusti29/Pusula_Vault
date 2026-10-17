import { Component, OnInit, OnDestroy, HostListener, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { FileAssetResponse, WorkspaceResponse, FolderResponse, Permission } from '../../core/models/pusula.models';
import { FileUploadComponent, ALLOWED_EXT, ALLOWED_MIME, MAX_SIZE_BYTES } from './file-upload.component';
import { UnifiedFileViewerComponent } from './unified-file-viewer.component';

type FilterKind = 'ALL' | 'DOCS' | 'PDFS' | 'IMAGES' | 'SHEETS' | 'OTHER';

@Component({
  selector: 'app-file-vault',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, FileUploadComponent, UnifiedFileViewerComponent],
  template: `
    <div
      class="fv-shell"
      (dragover)="onPageDragOver($event)"
      (dragleave)="onPageDragLeave($event)"
      (drop)="onPageDrop($event)"
    >
      <div class="fv-drop-overlay" *ngIf="globalDragActive()" (dragover)="$event.preventDefault()" (drop)="onPageDrop($event)">
        <div class="drop-hero">
          <div class="drop-h-icon">📥</div>
          <h2>Drop files to upload into {{ dropTargetLabel() }}</h2>
          <p>Accepted: DOCX · XLSX · CSV · PDF · PNG · JPG · WEBP · SVG · TXT · MD &nbsp;|&nbsp; Max 100 MB each</p>
          <p class="drop-warn" *ngIf="lastRejectReason()">{{ lastRejectReason() }}</p>
        </div>
      </div>

      <header class="fv-header">
        <div class="fv-head-top">
          <div class="head-left">
            <nav class="pv-breadcrumb">
              <a class="bc-item" routerLink="/dashboard">
                <span class="bc-sep">⌂</span>
                <span>Dashboard</span>
              </a>
              <span class="bc-sep">/</span>
              <a class="bc-item" [routerLink]="['/workspaces', selectedWorkspaceId()]" *ngIf="selectedWorkspaceId()">
                <span>{{ workspaceName() }}</span>
              </a>
              <span class="bc-sep" *ngIf="selectedWorkspaceId()">/</span>
              <ng-container *ngFor="let crumb of breadcrumbChain(); let last = last; let i = index">
                <button class="bc-item" [class.last]="last" (click)="navigateFolder(crumb.id, i)">
                  <span>{{ crumb.name }}</span>
                </button>
                <span class="bc-sep" *ngIf="!last">/</span>
              </ng-container>
              <span class="bc-last" *ngIf="!breadcrumbChain().length">
                <span class="bc-item last">Files</span>
              </span>
            </nav>
            <h1 class="fv-title">File Vault</h1>
            <p class="fv-subtitle">Secure uploads, role-based sharing, DLP watermarks, and unified preview</p>
          </div>
          <div class="head-right">
            <button class="pv-btn pv-btn-primary upload-trigger" (click)="toggleUploadPanel()">
              <span class="btn-icon">⬆</span>
              <span>{{ uploadPanelOpen() ? 'Hide Upload' : 'Upload Files' }}</span>
            </button>
          </div>
        </div>

        <div class="fv-head-row">
          <div class="workspace-switcher" *ngIf="workspaces().length">
            <span class="sw-label">Workspace</span>
            <div class="ws-pills">
              <button
                *ngFor="let w of workspaces()"
                class="ws-pill"
                [class.active]="selectedWorkspaceId() === w.id"
                (click)="selectWorkspace(w.id)"
              >
                <span class="ws-dot"></span>
                <span class="ws-name">{{ w.name }}</span>
              </button>
            </div>
          </div>

          <div class="type-filters">
            <span class="fl-label">Filter</span>
            <div class="filter-pills">
              <button
                *ngFor="let f of filterOptions()"
                class="fl-pill"
                [class.active]="activeFilter() === f.kind"
                (click)="setFilter(f.kind)"
              >
                <span class="fl-icon">{{ f.icon }}</span>
                <span>{{ f.label }}</span>
                <span class="fl-count">{{ f.count }}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <section class="fv-upload-section" *ngIf="uploadPanelOpen()">
        <div class="upload-card">
          <div class="upload-head-card">
            <h3><span>⬆</span> Upload files to vault</h3>
            <button class="icon-btn-close" (click)="toggleUploadPanel()" title="Close">×</button>
          </div>
          <app-file-upload
            [workspaces]="workspaces()"
            [defaultWorkspaceId]="selectedWorkspaceId()"
            [compact]="false"
            (uploaded)="onSingleUploaded($event)"
            (allCompleted)="onAllUploaded($event)"
          ></app-file-upload>
        </div>
      </section>

      <section class="fv-files-section">
        <div class="section-head">
          <h3 class="section-title"><span class="title-bar"></span>Files</h3>
          <div class="section-meta">
            <span class="meta-stat">Showing {{ filteredFiles().length }} of {{ files().length }}</span>
            <span class="meta-stat">{{ totalSizeLabel() }}</span>
          </div>
        </div>

        <ng-container *ngIf="filteredFiles().length; else emptyState">
          <div class="files-grid">
            <div
              *ngFor="let f of filteredFiles()"
              class="pv-card file-card"
              [class.card-selected]="selectedFileId() === f.id"
              (click)="openViewer(f)"
            >
              <div class="card-thumb" [class]="thumbClass(f)">
                <img *ngIf="showThumb(f)" class="th-img" [src]="api.previewUrl(f.id)" alt="" />
                <span class="th-ext">{{ ext(f) }}</span>
                <span class="type-badge" [class]="badgeClass(f)">{{ typeLabel(f) }}</span>
                <div class="thumb-menu" (click)="$event.stopPropagation()">
                  <button class="tm-btn" (click)="toggleMenu(f.id)">⋯</button>
                  <div class="tm-pop" *ngIf="openMenuId() === f.id">
                    <button class="tm-item" (click)="downloadFile(f)">⬇ Download</button>
                    <button class="tm-item" (click)="openViewer(f)">👁 Preview</button>
                    <button class="tm-item" (click)="shareFile(f)">🔗 Share</button>
                    <button class="tm-item danger" (click)="deleteFile(f)">🗑 Delete</button>
                  </div>
                </div>
              </div>
              <div class="card-body">
                <h4 class="card-file-name" [title]="f.originalName">{{ f.originalName }}</h4>
                <div class="card-meta-row">
                  <span class="meta-author">{{ authorLabel(f) }}</span>
                  <span class="dot-sep">·</span>
                  <span class="meta-size">{{ formatSize(f.sizeBytes) }}</span>
                </div>
                <div class="card-foot">
                  <span class="meta-date">{{ formatDate(f.createdAt) }}</span>
                  <div class="lock-indicator" *ngIf="f.encrypted">
                    <span title="Encrypted at rest">🔒</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ng-container>

        <ng-template #emptyState>
          <div class="empty-state-shell" (dragover)="onPageDragOver($event)" (drop)="onPageDrop($event)">
            <div class="empty-icon-wrap">
              <div class="empty-cloud">☁️</div>
              <div class="empty-illus-box">📁</div>
            </div>
            <h3 class="empty-title">Your file vault is empty</h3>
            <p class="empty-sub">Drag &amp; drop files anywhere on this page, or click the upload button to add the first asset.</p>
            <div class="empty-cta-row">
              <button class="pv-btn pv-btn-primary" (click)="toggleUploadPanel()">
                <span>⬆ Upload Files Now</span>
              </button>
              <div class="empty-tips">
                <div class="tip"><span class="tip-k">✓</span> DOCX, PDF, Sheets, Images, Markdown</div>
                <div class="tip"><span class="tip-k">✓</span> 100 MB limit per file</div>
                <div class="tip"><span class="tip-k">✓</span> End-to-end role-based permissions</div>
              </div>
            </div>
          </div>
        </ng-template>
      </section>

      <div class="viewer-wrap" *ngIf="viewerOpen()">
        <app-unified-file-viewer
          [file]="viewerFile()"
          [currentUsername]="currentUser()"
          [currentRole]="currentRole()"
          [currentTeam]="currentTeam()"
          [currentSession]="sessionId()"
          (close)="closeViewer()"
          (share)="shareFileById($event)"
        ></app-unified-file-viewer>
      </div>
    </div>
  `,
  styles: [`
    .fv-shell {
      position: relative;
      padding: 2rem 2.5rem;
      min-height: 100vh;
      max-width: 1600px;
      margin: 0 auto;
    }
    .fv-drop-overlay {
      position: fixed;
      inset: 0;
      background: rgba(14, 165, 233, 0.12);
      backdrop-filter: blur(4px);
      z-index: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 4px dashed rgba(14, 165, 233, 0.8);
      border-radius: 0;
      animation: pulse 1.2s ease-in-out infinite;
    }
    @keyframes pulse { 0%,100% { background: rgba(14,165,233,0.10); } 50% { background: rgba(14,165,233,0.18); } }
    .drop-hero { text-align: center; padding: 3rem; background: var(--pv-bg-card); border-radius: var(--pv-radius-xl); border: 2px solid var(--pv-accent-blue); box-shadow: 0 30px 80px rgba(0,0,0,0.4); }
    .drop-h-icon { font-size: 4rem; margin-bottom: 0.75rem; }
    .drop-hero h2 { font-size: 1.5rem; color: var(--pv-text-primary); margin-bottom: 0.5rem; }
    .drop-hero p { color: var(--pv-text-muted); font-size: 0.88rem; margin: 0.25rem 0; }
    .drop-warn { color: var(--pv-accent-red); font-weight: 600; margin-top: 0.75rem; }

    .fv-header { margin-bottom: 2rem; }
    .fv-head-top {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 2rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    .head-left { min-width: 0; flex: 1; }
    .pv-breadcrumb { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.75rem; font-size: 0.82rem; }
    .bc-item {
      background: none; border: none; color: var(--pv-text-secondary); cursor: pointer;
      padding: 0.25rem 0.5rem; border-radius: var(--pv-radius-sm); text-decoration: none;
      transition: all var(--pv-transition-fast); font-weight: 500;
    }
    .bc-item:hover { color: var(--pv-accent-blue); background: var(--pv-bg-card-hover); }
    .bc-item.last { color: var(--pv-text-primary); font-weight: 700; }
    .bc-last { display: inline; }
    .bc-sep { color: var(--pv-text-subtle); }
    .fv-title {
      font-size: 2.1rem; margin: 0 0 0.3rem 0;
      background: linear-gradient(135deg, var(--pv-text-primary) 0%, var(--pv-accent-blue) 60%, var(--pv-accent-purple) 100%);
      -webkit-background-clip: text; background-clip: text; color: transparent;
    }
    .fv-subtitle { color: var(--pv-text-muted); font-size: 0.9rem; margin: 0; }
    .upload-trigger { display: inline-flex; }
    .btn-icon { font-weight: 700; }

    .fv-head-row { display: flex; flex-wrap: wrap; gap: 1.25rem; align-items: center; }
    .workspace-switcher {
      flex: 1; min-width: 320px;
      display: flex; align-items: center; gap: 1rem;
      padding: 0.9rem 1.1rem;
      background: var(--pv-bg-card);
      border: 1px solid var(--pv-border);
      border-radius: var(--pv-radius-lg);
      overflow-x: auto;
    }
    .sw-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--pv-text-muted); white-space: nowrap; }
    .ws-pills { display: flex; gap: 0.45rem; flex: 1; overflow-x: auto; }
    .ws-pill {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.45rem 0.85rem;
      background: transparent; border: 1px solid var(--pv-border); border-radius: 999px;
      color: var(--pv-text-secondary); cursor: pointer; font-size: 0.84rem; font-weight: 500;
      transition: all var(--pv-transition-fast); white-space: nowrap;
    }
    .ws-pill:hover { border-color: var(--pv-accent-blue); color: var(--pv-text-primary); }
    .ws-pill.active { background: rgba(14,165,233,0.12); border-color: rgba(14,165,233,0.45); color: var(--pv-accent-blue); }
    .ws-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }

    .type-filters {
      display: flex; align-items: center; gap: 0.85rem;
      padding: 0.9rem 1.1rem;
      background: var(--pv-bg-card);
      border: 1px solid var(--pv-border);
      border-radius: var(--pv-radius-lg);
    }
    .fl-label { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--pv-text-muted); white-space: nowrap; }
    .filter-pills { display: flex; gap: 0.35rem; flex-wrap: wrap; }
    .fl-pill {
      display: inline-flex; align-items: center; gap: 0.35rem;
      padding: 0.4rem 0.75rem;
      background: transparent; border: 1px solid var(--pv-border-soft); border-radius: 999px;
      color: var(--pv-text-secondary); cursor: pointer; font-size: 0.8rem; font-weight: 500;
      transition: all var(--pv-transition-fast);
    }
    .fl-pill:hover { border-color: var(--pv-accent-purple); color: var(--pv-accent-purple); }
    .fl-pill.active { background: rgba(139,92,246,0.12); border-color: rgba(139,92,246,0.45); color: var(--pv-accent-purple); }
    .fl-icon { font-size: 0.9em; }
    .fl-count { font-size: 0.68rem; padding: 0.05rem 0.4rem; background: rgba(255,255,255,0.06); border-radius: 999px; font-variant-numeric: tabular-nums; }

    .fv-upload-section { margin-bottom: 2rem; }
    .upload-card {
      background: var(--pv-bg-card);
      border: 1px solid var(--pv-border);
      border-radius: var(--pv-radius-lg);
      overflow: hidden;
    }
    .upload-head-card { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid var(--pv-border-soft); }
    .upload-head-card h3 { display: flex; align-items: center; gap: 0.6rem; font-size: 1rem; font-weight: 700; color: var(--pv-text-primary); margin: 0; }
    .icon-btn-close { background: none; border: none; color: var(--pv-text-muted); font-size: 1.4rem; cursor: pointer; padding: 0.25rem 0.5rem; border-radius: 6px; transition: all 0.15s; line-height: 1; }
    .icon-btn-close:hover { color: var(--pv-accent-red); background: rgba(239,68,68,0.08); }

    .fv-files-section { margin-bottom: 3rem; }
    .section-head { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
    .section-title { display: flex; align-items: center; gap: 0.65rem; font-size: 0.95rem; font-weight: 700; color: var(--pv-text-primary); text-transform: uppercase; letter-spacing: 0.05em; margin: 0; }
    .title-bar { display: block; width: 3px; height: 18px; border-radius: 2px; background: linear-gradient(180deg, var(--pv-accent-blue), var(--pv-accent-purple)); }
    .section-meta { display: flex; gap: 0.75rem; margin-left: auto; flex-wrap: wrap; }
    .meta-stat { font-size: 0.78rem; padding: 0.25rem 0.7rem; background: var(--pv-bg-card); border: 1px solid var(--pv-border); border-radius: 999px; color: var(--pv-text-muted); font-weight: 600; }

    .files-grid { display: grid; gap: 1.1rem; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
    .file-card { padding: 0; overflow: hidden; cursor: pointer; display: flex; flex-direction: column; transition: all var(--pv-transition-base); }
    .file-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,0.22); border-color: rgba(14,165,233,0.35); }
    .card-selected { border-color: var(--pv-accent-blue); box-shadow: 0 0 0 2px rgba(14,165,233,0.25); }

    .card-thumb {
      position: relative;
      height: 160px;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
      background: linear-gradient(135deg, var(--pv-bg-card-hover), var(--pv-bg-dark));
      border-bottom: 1px solid var(--pv-border-soft);
    }
    .card-thumb.thumb-doc { background: linear-gradient(135deg, rgba(59,130,246,0.12), rgba(59,130,246,0.02)); }
    .card-thumb.thumb-sheet { background: linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.02)); }
    .card-thumb.thumb-pdf { background: linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.02)); }
    .card-thumb.thumb-image { background: linear-gradient(135deg, rgba(168,85,247,0.12), rgba(168,85,247,0.02)); padding: 0; }
    .card-thumb.thumb-text { background: linear-gradient(135deg, rgba(107,114,128,0.18), rgba(107,114,128,0.04)); }
    .th-img { width: 100%; height: 100%; object-fit: cover; object-position: center; }
    .th-ext {
      font-family: ui-monospace, monospace;
      font-weight: 800; font-size: 2rem; letter-spacing: 0.04em;
      text-transform: uppercase;
      opacity: 0.6;
      position: relative;
      z-index: 1;
    }
    .card-thumb.thumb-image .th-ext { display: none; }
    .type-badge {
      position: absolute; top: 0.7rem; left: 0.7rem;
      padding: 0.2rem 0.55rem; border-radius: 999px;
      font-size: 0.65rem; font-weight: 700; letter-spacing: 0.04em;
      text-transform: uppercase; z-index: 2;
      background: rgba(0,0,0,0.5); color: #fff; backdrop-filter: blur(4px);
    }
    .type-badge.b-doc { background: rgba(59,130,246,0.9); }
    .type-badge.b-sheet { background: rgba(16,185,129,0.9); }
    .type-badge.b-pdf { background: rgba(239,68,68,0.9); }
    .type-badge.b-image { background: rgba(168,85,247,0.9); }
    .type-badge.b-text { background: rgba(107,114,128,0.9); }
    .thumb-menu { position: absolute; top: 0.5rem; right: 0.5rem; z-index: 3; }
    .tm-btn {
      background: rgba(0,0,0,0.5); border: none; color: #fff; cursor: pointer;
      width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 1rem; transition: all 0.15s; backdrop-filter: blur(4px);
    }
    .tm-btn:hover { background: rgba(14,165,233,0.9); transform: scale(1.08); }
    .tm-pop {
      position: absolute; top: 32px; right: 0; min-width: 140px;
      background: var(--pv-bg-card); border: 1px solid var(--pv-border); border-radius: var(--pv-radius-md);
      box-shadow: 0 8px 24px rgba(0,0,0,0.35); overflow: hidden; z-index: 5;
    }
    .tm-item {
      display: flex; align-items: center; gap: 0.55rem;
      width: 100%; padding: 0.6rem 0.85rem;
      background: none; border: none; color: var(--pv-text-secondary); cursor: pointer;
      text-align: left; font-size: 0.82rem; font-weight: 500;
      transition: all 0.15s;
    }
    .tm-item:hover { background: var(--pv-bg-card-hover); color: var(--pv-text-primary); }
    .tm-item.danger:hover { background: rgba(239,68,68,0.1); color: var(--pv-accent-red); }

    .card-body { padding: 0.9rem 1rem 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .card-file-name { margin: 0; font-size: 0.9rem; font-weight: 600; color: var(--pv-text-primary); line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .card-meta-row { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
    .meta-author { font-size: 0.76rem; color: var(--pv-text-muted); font-weight: 500; }
    .dot-sep { color: var(--pv-text-subtle); font-size: 0.7rem; }
    .meta-size { font-size: 0.72rem; color: var(--pv-text-subtle); font-variant-numeric: tabular-nums; }
    .card-foot { display: flex; align-items: center; justify-content: space-between; margin-top: 0.25rem; }
    .meta-date { font-size: 0.7rem; color: var(--pv-text-subtle); }
    .lock-indicator { font-size: 0.8rem; opacity: 0.7; }

    .empty-state-shell {
      padding: 4.5rem 2.5rem;
      text-align: center;
      background: linear-gradient(180deg, var(--pv-bg-card) 0%, var(--pv-bg-dark) 100%);
      border: 2px dashed var(--pv-border);
      border-radius: var(--pv-radius-xl);
    }
    .empty-icon-wrap { position: relative; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1.5rem; }
    .empty-cloud { font-size: 5rem; opacity: 0.85; filter: drop-shadow(0 12px 16px rgba(14,165,233,0.25)); }
    .empty-illus-box { position: absolute; font-size: 2.2rem; transform: translateY(6px); }
    .empty-title { font-size: 1.4rem; color: var(--pv-text-primary); margin: 0 0 0.5rem 0; font-weight: 700; }
    .empty-sub { font-size: 0.9rem; color: var(--pv-text-muted); max-width: 520px; margin: 0 auto 1.75rem; line-height: 1.6; }
    .empty-cta-row { display: flex; flex-direction: column; align-items: center; gap: 1.5rem; }
    .empty-tips { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center; }
    .tip {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.45rem 0.85rem;
      background: var(--pv-bg-card); border: 1px solid var(--pv-border-soft); border-radius: 999px;
      font-size: 0.78rem; color: var(--pv-text-secondary); font-weight: 500;
    }
    .tip-k { color: var(--pv-accent-teal); font-weight: 800; }

    .viewer-wrap { position: relative; }

    .pv-btn { display: inline-flex; align-items: center; gap: 0.5rem; border: none; cursor: pointer; font-weight: 600; transition: all var(--pv-transition-base); border-radius: var(--pv-radius-md); }
    .pv-btn-primary {
      background: linear-gradient(135deg, var(--pv-accent-blue), var(--pv-accent-purple));
      color: #fff; padding: 0.65rem 1.2rem; font-size: 0.88rem;
      box-shadow: 0 4px 14px rgba(14,165,233,0.28);
    }
    .pv-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(14,165,233,0.4); }
  `]
})
export class FileVaultComponent implements OnInit, OnDestroy {
  api = inject(ApiService);

  workspaces = signal<WorkspaceResponse[]>([]);
  folders = signal<FolderResponse[]>([]);
  files = signal<FileAssetResponse[]>([]);

  selectedWorkspaceId = signal<string | null>(null);
  selectedFolderId = signal<string | null>(null);
  breadcrumbStack = signal<{ id: string; name: string }[]>([]);

  activeFilter = signal<FilterKind>('ALL');
  uploadPanelOpen = signal(false);
  openMenuId = signal<string | null>(null);

  globalDragActive = signal(false);
  lastRejectReason = signal('');
  private dragCounter = 0;

  viewerOpen = signal(false);
  viewerFile = signal<FileAssetResponse | null>(null);
  selectedFileId = signal<string | null>(null);

  currentUser = signal('alex.doe@pusula.vault');
  currentRole = signal('EDITOR');
  currentTeam = signal('Vault Core');
  sessionId = signal('SESS-' + Math.floor(Math.random() * 999999).toString().padStart(6, '0'));

  breadcrumbChain = computed(() => this.breadcrumbStack());
  workspaceName = computed(() => this.workspaces().find(w => w.id === this.selectedWorkspaceId())?.name ?? 'Workspace');
  dropTargetLabel = computed(() => this.workspaceName());

  filterOptions = computed(() => {
    const all = this.files();
    return [
      { kind: 'ALL' as FilterKind, label: 'All', icon: '📂', count: all.length },
      { kind: 'DOCS' as FilterKind, label: 'Docs', icon: '📄', count: all.filter(this.isDoc.bind(this)).length },
      { kind: 'PDFS' as FilterKind, label: 'PDFs', icon: '📕', count: all.filter(this.isPdf.bind(this)).length },
      { kind: 'IMAGES' as FilterKind, label: 'Images', icon: '🖼️', count: all.filter(this.isImage.bind(this)).length },
      { kind: 'SHEETS' as FilterKind, label: 'Sheets', icon: '📊', count: all.filter(this.isSheet.bind(this)).length },
      { kind: 'OTHER' as FilterKind, label: 'Other', icon: '📦', count: all.filter(f => !this.isDoc(f) && !this.isPdf(f) && !this.isImage(f) && !this.isSheet(f)).length }
    ];
  });

  filteredFiles = computed(() => {
    const f = this.activeFilter();
    const list = this.files();
    switch (f) {
      case 'DOCS': return list.filter(this.isDoc.bind(this));
      case 'PDFS': return list.filter(this.isPdf.bind(this));
      case 'IMAGES': return list.filter(this.isImage.bind(this));
      case 'SHEETS': return list.filter(this.isSheet.bind(this));
      case 'OTHER': return list.filter(x => !this.isDoc(x) && !this.isPdf(x) && !this.isImage(x) && !this.isSheet(x));
      default: return list;
    }
  });

  totalSizeLabel = computed(() => {
    const total = this.filteredFiles().reduce((s, f) => s + (f.sizeBytes || 0), 0);
    return 'Total ' + this.formatSize(total);
  });

  private documentClickCleanup: (() => void) | null = null;

  ngOnInit(): void {
    this.loadWorkspaces();
    const handler = () => {
      if (this.openMenuId()) this.openMenuId.set(null);
    };
    document.addEventListener('click', handler);
    this.documentClickCleanup = () => document.removeEventListener('click', handler);
  }

  ngOnDestroy(): void {
    this.documentClickCleanup?.();
  }

  private loadWorkspaces(): void {
    this.api.listWorkspaces().subscribe({
      next: ws => {
        this.workspaces.set(ws);
        if (ws.length) this.selectWorkspace(ws[0].id);
      },
      error: () => this.workspaces.set([])
    });
  }

  selectWorkspace(id: string): void {
    this.selectedWorkspaceId.set(id);
    this.selectedFolderId.set(null);
    this.breadcrumbStack.set([]);
    this.refreshFolders();
    this.refreshFiles();
  }

  navigateFolder(id: string, index: number): void {
    this.selectedFolderId.set(id);
    this.breadcrumbStack.set(this.breadcrumbStack().slice(0, index + 1));
    this.refreshFolders();
    this.refreshFiles();
  }

  private refreshFolders(): void {
    const wsId = this.selectedWorkspaceId();
    if (!wsId) { this.folders.set([]); return; }
    this.api.listFolders(wsId, this.selectedFolderId() ?? undefined).subscribe({
      next: f => this.folders.set(f),
      error: () => this.folders.set([])
    });
  }

  private refreshFiles(): void {
    const wsId = this.selectedWorkspaceId();
    if (!wsId) { this.files.set([]); return; }
    this.api.listFiles({
      workspaceId: wsId,
      folderId: this.selectedFolderId() ?? undefined,
      page: 0,
      size: 200
    }).subscribe({
      next: p => this.files.set(p.content),
      error: () => this.files.set([])
    });
  }

  setFilter(k: FilterKind): void { this.activeFilter.set(k); }
  toggleUploadPanel(): void { this.uploadPanelOpen.update(o => !o); }

  toggleMenu(id: string): void {
    this.openMenuId.update(cur => cur === id ? null : id);
  }

  onSingleUploaded(asset: FileAssetResponse): void {
    this.files.update(prev => {
      if (prev.some(p => p.id === asset.id)) return prev.map(p => p.id === asset.id ? asset : p);
      return [asset, ...prev];
    });
  }
  onAllUploaded(assets: FileAssetResponse[]): void {
    if (assets.length) setTimeout(() => this.refreshFiles(), 250);
  }

  @HostListener('document:dragover', ['$event'])
  onDocDragOver(ev: DragEvent): void {
    if (ev.dataTransfer?.types?.includes('Files')) ev.preventDefault();
  }

  onPageDragOver(ev: DragEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.dragCounter++;
    if (ev.dataTransfer) {
      const dt = ev.dataTransfer;
      const ok = ALLOWED_MIME.some(m => Array.from(dt.types || []).includes(m))
        || dt.types?.includes('Files');
      dt.dropEffect = ok ? 'copy' : 'none';
    }
    if (!this.globalDragActive()) {
      this.globalDragActive.set(true);
      this.lastRejectReason.set('');
    }
  }

  onPageDragLeave(ev: DragEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.dragCounter = Math.max(0, this.dragCounter - 1);
    if (this.dragCounter === 0) this.globalDragActive.set(false);
  }

  onPageDrop(ev: DragEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.dragCounter = 0;
    this.globalDragActive.set(false);
    const list = ev.dataTransfer?.files ? Array.from(ev.dataTransfer.files) : [];
    const wsId = this.selectedWorkspaceId();
    if (!wsId) {
      this.lastRejectReason.set('⚠ Select a workspace before uploading.');
      return;
    }
    const rejected = list.filter(f => {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      return f.size > MAX_SIZE_BYTES || (!ALLOWED_EXT.includes(ext) && !ALLOWED_MIME.includes(f.type));
    });
    if (rejected.length === list.length && list.length > 0) {
      this.lastRejectReason.set(`⚠ All ${rejected.length} file(s) rejected: unsupported type or >100MB.`);
      return;
    }
    if (!this.uploadPanelOpen()) this.uploadPanelOpen.set(true);
    setTimeout(() => {
      const dropTarget = document.querySelector('app-file-upload .upload-shell');
      if (!dropTarget) return;
      const dt = new DataTransfer();
      list.forEach(f => dt.items.add(f));
      const fake = new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: dt });
      dropTarget.dispatchEvent(fake);
    }, 100);
  }

  openViewer(f: FileAssetResponse): void {
    this.selectedFileId.set(f.id);
    this.viewerFile.set(f);
    this.viewerOpen.set(true);
    this.openMenuId.set(null);
  }
  closeViewer(): void {
    this.viewerOpen.set(false);
    this.viewerFile.set(null);
    this.selectedFileId.set(null);
  }

  downloadFile(f: FileAssetResponse): void {
    this.openMenuId.set(null);
    if (!f.downloadAllowed) { alert('Download blocked by DLP policy. Contact workspace admin.'); return; }
    window.open(this.api.downloadUrl(f.id), '_blank');
  }
  shareFile(f: FileAssetResponse): void {
    this.openMenuId.set(null);
    this.shareFileById(f.id);
  }
  shareFileById(id: string): void {
    const link = `${location.origin}/files/${id}`;
    try { navigator.clipboard.writeText(link); alert('Share link copied to clipboard:\n' + link); }
    catch { prompt('Copy share link:', link); }
  }
  deleteFile(f: FileAssetResponse): void {
    this.openMenuId.set(null);
    if (!confirm(`Delete "${f.originalName}"? This action cannot be undone.`)) return;
    this.api.deleteFile(f.id).subscribe({
      next: () => { this.files.update(prev => prev.filter(x => x.id !== f.id)); },
      error: () => alert('Delete failed — permissions or backend error.')
    });
  }

  private kindOf(f: FileAssetResponse): 'doc' | 'sheet' | 'pdf' | 'image' | 'text' {
    const ext = (f.extension || '').toLowerCase();
    const mime = f.mimeType || '';
    if (ext === 'pdf' || mime === 'application/pdf') return 'pdf';
    if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext) || mime.startsWith('image/')) return 'image';
    if (['xlsx', 'xls', 'csv'].includes(ext) || mime.includes('spreadsheet') || mime === 'text/csv') return 'sheet';
    if (['docx', 'doc'].includes(ext)) return 'doc';
    return 'text';
  }

  isDoc(f: FileAssetResponse): boolean {
    const k = this.kindOf(f);
    return k === 'doc';
  }
  isPdf(f: FileAssetResponse): boolean { return this.kindOf(f) === 'pdf'; }
  isImage(f: FileAssetResponse): boolean { return this.kindOf(f) === 'image'; }
  isSheet(f: FileAssetResponse): boolean { return this.kindOf(f) === 'sheet'; }

  showThumb(f: FileAssetResponse): boolean { return this.isImage(f); }
  thumbClass(f: FileAssetResponse): string { return 'thumb-' + this.kindOf(f); }
  badgeClass(f: FileAssetResponse): string { return 'b-' + this.kindOf(f); }

  typeLabel(f: FileAssetResponse): string {
    const k = this.kindOf(f);
    return { doc: 'DOC', sheet: 'SHEET', pdf: 'PDF', image: 'IMAGE', text: 'TEXT' }[k];
  }

  ext(f: FileAssetResponse): string { return (f.extension || 'BIN').toUpperCase().slice(0, 5); }

  authorLabel(f: FileAssetResponse): string {
    return f.createdBy || (this.currentUser().split('@')[0].replace('.', ' '));
  }

  formatSize(bytes: number): string {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
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
      return d.toLocaleDateString();
    } catch { return ''; }
  }

  can(perms: Permission[] | undefined, p: Permission): boolean { return !!perms?.includes(p); }
}
