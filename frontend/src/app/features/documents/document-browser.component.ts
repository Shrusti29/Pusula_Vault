import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { WorkspaceResponse, FolderResponse, DocumentResponse, Permission } from '../../core/models/pusula.models';

@Component({
  selector: 'app-document-browser',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="browser-shell">
      <header class="browser-header">
        <div class="header-left">
          <h1 class="page-title">Documents</h1>
          <p class="page-subtitle">Browse workspaces, folders, and vault documents</p>
        </div>
        <div class="header-right">
          <div class="search-wrap">
            <input
              type="text"
              class="pv-input search-input"
              placeholder="Search workspaces, folders, docs..."
              [(ngModel)]="searchQuery"
            />
          </div>
          <button class="pv-btn pv-btn-primary" (click)="openCreateMenu()">
            <span class="btn-icon">+</span>
            <span>New</span>
          </button>
        </div>
      </header>

      <div class="workspace-switcher" *ngIf="workspaces().length">
        <span class="switcher-label">Workspace:</span>
        <div class="workspace-pills">
          <button
            *ngFor="let ws of workspaces()"
            class="ws-pill"
            [class.active]="selectedWorkspaceId() === ws.id"
            (click)="selectWorkspace(ws.id)"
          >
            <span class="ws-dot"></span>
            <span>{{ ws.name }}</span>
            <span class="ws-count">{{ ws.documentCount ?? 0 }}</span>
          </button>
        </div>
      </div>

      <div class="breadcrumb-row" *ngIf="breadcrumbChain().length">
        <button class="crumb" (click)="navigateRoot()">
          <span>All</span>
        </button>
        <span class="crumb-sep">/</span>
        <ng-container *ngFor="let crumb of breadcrumbChain(); let last = last; let i = index">
          <button
            class="crumb"
            [class.last]="last"
            (click)="navigateToFolder(crumb.id, i)"
          >
            {{ crumb.name }}
          </button>
          <span class="crumb-sep" *ngIf="!last">/</span>
        </ng-container>
      </div>

      <section class="section-block">
        <div class="section-head">
          <h3 class="section-title">
            <span class="title-bar"></span>
            Folders
          </h3>
          <span class="section-count">{{ folders().length }}</span>
        </div>
        <div class="grid grid-folders" *ngIf="folders().length; else noFolders">
          <div
            *ngFor="let folder of folders()"
            class="pv-card card-folder"
            (click)="openFolder(folder.id)"
          >
            <div class="card-icon folder-icon">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div class="card-meta">
              <h4 class="card-title">{{ folder.name }}</h4>
              <div class="card-subrow">
                <span class="sub-item">{{ folder.subfolderCount ?? 0 }} subfolders</span>
                <span class="dot-sep">·</span>
                <span class="sub-item">{{ folder.documentCount ?? 0 }} docs</span>
              </div>
              <span class="card-date">{{ formatDate(folder.updatedAt) }}</span>
            </div>
          </div>
        </div>
        <ng-template #noFolders>
          <div class="empty-state">
            <div class="empty-icon">📁</div>
            <p class="empty-title">No folders yet</p>
            <p class="empty-sub">Create the first folder to organize your documents</p>
          </div>
        </ng-template>
      </section>

      <section class="section-block">
        <div class="section-head">
          <h3 class="section-title">
            <span class="title-bar"></span>
            Documents
          </h3>
          <span class="section-count">{{ documents().length }}</span>
        </div>
        <div class="grid grid-docs" *ngIf="documents().length; else noDocs">
          <div
            *ngFor="let doc of documents()"
            class="pv-card card-doc"
            (click)="openDocument(doc.id)"
          >
            <div class="doc-head">
              <div class="doc-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <span class="pv-badge" [ngClass]="statusBadgeClass(doc.status)">
                {{ doc.status }}
              </span>
            </div>
            <h4 class="card-title doc-title">{{ doc.title }}</h4>
            <p class="doc-preview">{{ (doc.content ?? 'No content yet') | slice:0:120 }}{{ (doc.content ?? '').length > 120 ? '...' : '' }}</p>
            <div class="doc-foot">
              <div class="version-chip">v{{ doc.currentVersion }}</div>
              <span class="doc-date">{{ formatDate(doc.lastEditedAt ?? doc.updatedAt) }}</span>
            </div>
            <div class="tags-row" *ngIf="doc.tags?.length">
              <span *ngFor="let tag of doc.tags" class="tag-pill">{{ tag }}</span>
            </div>
          </div>
        </div>
        <ng-template #noDocs>
          <div class="empty-state">
            <div class="empty-icon">📄</div>
            <p class="empty-title">No documents here</p>
            <p class="empty-sub">Click New to create your first document</p>
          </div>
        </ng-template>
      </section>

      <div class="pv-modal-overlay" *ngIf="createMenuOpen()" (click.self)="closeCreateMenu()">
        <div class="pv-modal create-menu">
          <div class="modal-head">
            <h3>Create new</h3>
            <button class="modal-close" (click)="closeCreateMenu()">×</button>
          </div>
          <div class="modal-body">
            <div class="create-grid">
              <button class="create-item" (click)="createWorkspace()">
                <div class="ci-icon ci-blue">🗂️</div>
                <div class="ci-info">
                  <h4>Workspace</h4>
                  <p>Top-level container for projects</p>
                </div>
              </button>
              <button class="create-item" (click)="createFolder()" [disabled]="!selectedWorkspaceId()">
                <div class="ci-icon ci-purple">📁</div>
                <div class="ci-info">
                  <h4>Folder</h4>
                  <p>Group documents inside a workspace</p>
                </div>
              </button>
              <button class="create-item" (click)="createDocument()" [disabled]="!selectedWorkspaceId()">
                <div class="ci-icon ci-teal">📝</div>
                <div class="ci-info">
                  <h4>Document</h4>
                  <p>Rich-text collaborative document</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .browser-shell {
      position: relative;
      z-index: 1;
      padding: 2rem 2.5rem;
      min-height: 100vh;
      max-width: 1600px;
      margin: 0 auto;
    }
    .browser-header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 2rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
    }
    .page-title {
      font-size: 2rem;
      background: linear-gradient(135deg, var(--pv-text-primary) 0%, var(--pv-accent-blue) 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      margin-bottom: 0.35rem;
    }
    .page-subtitle {
      color: var(--pv-text-muted);
      font-size: 0.9rem;
    }
    .header-right {
      display: flex;
      gap: 1rem;
      align-items: center;
    }
    .search-wrap { width: 320px; }
    .search-input { padding-left: 2.5rem; }
    .btn-icon {
      font-size: 1.1rem;
      font-weight: 700;
      line-height: 1;
    }
    .workspace-switcher {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: var(--pv-bg-card);
      border: 1px solid var(--pv-border);
      border-radius: var(--pv-radius-lg);
      margin-bottom: 1.5rem;
      overflow-x: auto;
    }
    .switcher-label {
      font-size: 0.72rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--pv-text-muted);
      white-space: nowrap;
    }
    .workspace-pills {
      display: flex;
      gap: 0.5rem;
      flex: 1;
      overflow-x: auto;
    }
    .ws-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.9rem;
      background: transparent;
      border: 1px solid var(--pv-border);
      border-radius: 999px;
      color: var(--pv-text-secondary);
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 500;
      transition: all var(--pv-transition-fast);
      white-space: nowrap;
    }
    .ws-pill:hover {
      border-color: var(--pv-accent-blue);
      color: var(--pv-text-primary);
    }
    .ws-pill.active {
      background: rgba(14, 165, 233, 0.12);
      border-color: rgba(14, 165, 233, 0.4);
      color: var(--pv-accent-blue);
    }
    .ws-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: currentColor;
    }
    .ws-count {
      font-size: 0.72rem;
      padding: 0.1rem 0.45rem;
      background: rgba(255,255,255,0.06);
      border-radius: 999px;
    }
    .breadcrumb-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      padding: 0.6rem 1rem;
      background: var(--pv-bg-dark);
      border: 1px solid var(--pv-border-soft);
      border-radius: var(--pv-radius-md);
      width: fit-content;
    }
    .crumb {
      background: none;
      border: none;
      color: var(--pv-text-secondary);
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 500;
      padding: 0.25rem 0.5rem;
      border-radius: var(--pv-radius-sm);
      transition: all var(--pv-transition-fast);
    }
    .crumb:hover { color: var(--pv-accent-blue); background: var(--pv-bg-card-hover); }
    .crumb.last { color: var(--pv-text-primary); font-weight: 600; }
    .crumb-sep { color: var(--pv-text-subtle); }

    .section-block { margin-bottom: 2.5rem; }
    .section-head {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .section-title {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      font-size: 1rem;
      font-weight: 700;
      color: var(--pv-text-primary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .title-bar {
      display: block;
      width: 3px;
      height: 18px;
      border-radius: 2px;
      background: linear-gradient(180deg, var(--pv-accent-blue), var(--pv-accent-purple));
    }
    .section-count {
      margin-left: auto;
      font-size: 0.75rem;
      padding: 0.2rem 0.65rem;
      background: var(--pv-bg-card);
      border: 1px solid var(--pv-border);
      border-radius: 999px;
      color: var(--pv-text-muted);
      font-weight: 600;
    }
    .grid {
      display: grid;
      gap: 1.25rem;
    }
    .grid-folders {
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    }
    .grid-docs {
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    }
    .card-folder {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.25rem;
      cursor: pointer;
    }
    .card-icon {
      width: 52px; height: 52px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--pv-radius-md);
      flex-shrink: 0;
    }
    .folder-icon {
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.05));
      color: var(--pv-accent-purple);
    }
    .card-meta { flex: 1; min-width: 0; }
    .card-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--pv-text-primary);
      margin-bottom: 0.4rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .card-subrow {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.4rem;
    }
    .sub-item { font-size: 0.78rem; color: var(--pv-text-muted); }
    .dot-sep { color: var(--pv-text-subtle); }
    .card-date { font-size: 0.72rem; color: var(--pv-text-subtle); }

    .card-doc {
      padding: 1.25rem;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      min-height: 200px;
    }
    .doc-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .doc-icon {
      width: 38px; height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(14, 165, 233, 0.05));
      border-radius: var(--pv-radius-md);
      color: var(--pv-accent-blue);
    }
    .doc-title { margin: 0; }
    .doc-preview {
      font-size: 0.82rem;
      color: var(--pv-text-muted);
      line-height: 1.6;
      flex: 1;
    }
    .doc-foot {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 0.5rem;
      border-top: 1px solid var(--pv-border-soft);
    }
    .version-chip {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 0.2rem 0.55rem;
      background: rgba(20, 184, 166, 0.12);
      color: var(--pv-accent-teal);
      border: 1px solid rgba(20, 184, 166, 0.3);
      border-radius: 6px;
    }
    .doc-date { font-size: 0.72rem; color: var(--pv-text-subtle); }
    .tags-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }
    .tag-pill {
      font-size: 0.68rem;
      padding: 0.18rem 0.55rem;
      background: rgba(245, 158, 11, 0.1);
      color: var(--pv-accent-amber);
      border: 1px solid rgba(245, 158, 11, 0.25);
      border-radius: 999px;
      font-weight: 500;
    }
    .empty-state {
      padding: 3rem 2rem;
      text-align: center;
      background: var(--pv-bg-card);
      border: 1px dashed var(--pv-border);
      border-radius: var(--pv-radius-lg);
    }
    .empty-icon { font-size: 2.5rem; margin-bottom: 0.75rem; }
    .empty-title {
      font-weight: 600;
      color: var(--pv-text-primary);
      margin-bottom: 0.3rem;
    }
    .empty-sub { font-size: 0.85rem; color: var(--pv-text-muted); }

    .modal-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--pv-border);
    }
    .modal-head h3 { font-size: 1.1rem; }
    .modal-close {
      background: none;
      border: none;
      color: var(--pv-text-muted);
      font-size: 1.5rem;
      cursor: pointer;
      line-height: 1;
      padding: 0.25rem;
    }
    .modal-close:hover { color: var(--pv-text-primary); }
    .modal-body { padding: 1.5rem; }
    .create-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }
    .create-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--pv-bg-card);
      border: 1px solid var(--pv-border);
      border-radius: var(--pv-radius-md);
      cursor: pointer;
      transition: all var(--pv-transition-base);
      text-align: left;
    }
    .create-item:hover:not(:disabled) {
      border-color: var(--pv-accent-blue);
      background: var(--pv-bg-card-hover);
      transform: translateX(4px);
    }
    .create-item:disabled { opacity: 0.5; cursor: not-allowed; }
    .ci-icon {
      width: 46px; height: 46px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--pv-radius-md);
      font-size: 1.4rem;
      flex-shrink: 0;
    }
    .ci-blue { background: rgba(14, 165, 233, 0.12); }
    .ci-purple { background: rgba(139, 92, 246, 0.12); }
    .ci-teal { background: rgba(20, 184, 166, 0.12); }
    .ci-info h4 {
      font-size: 0.95rem;
      color: var(--pv-text-primary);
      margin-bottom: 0.2rem;
    }
    .ci-info p { font-size: 0.78rem; color: var(--pv-text-muted); }
  `]
})
export class DocumentBrowserComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  workspaces = signal<WorkspaceResponse[]>([]);
  folders = signal<FolderResponse[]>([]);
  documents = signal<DocumentResponse[]>([]);
  selectedWorkspaceId = signal<string | null>(null);
  selectedFolderId = signal<string | null>(null);
  breadcrumbStack = signal<{ id: string; name: string }[]>([]);
  searchQuery = signal('');
  createMenuOpen = signal(false);

  breadcrumbChain = computed(() => this.breadcrumbStack());

  ngOnInit(): void {
    this.api.listWorkspaces().subscribe({
      next: ws => {
        this.workspaces.set(ws);
        if (ws.length) {
          this.selectWorkspace(ws[0].id);
        }
      },
      error: () => {}
    });
  }

  selectWorkspace(id: string): void {
    this.selectedWorkspaceId.set(id);
    this.selectedFolderId.set(null);
    this.breadcrumbStack.set([]);
    this.refresh();
  }

  openFolder(id: string): void {
    const folder = this.folders().find(f => f.id === id);
    if (folder) {
      this.breadcrumbStack.update(stack => [...stack, { id: folder.id, name: folder.name }]);
    }
    this.selectedFolderId.set(id);
    this.refresh();
  }

  navigateToFolder(id: string, index: number): void {
    this.selectedFolderId.set(id);
    this.breadcrumbStack.set(this.breadcrumbStack().slice(0, index + 1));
    this.refresh();
  }

  navigateRoot(): void {
    this.selectedFolderId.set(null);
    this.breadcrumbStack.set([]);
    this.refresh();
  }

  openDocument(id: string): void {
    this.router.navigate(['/documents', id]);
  }

  refresh(): void {
    const wsId = this.selectedWorkspaceId();
    if (!wsId) return;
    this.api.listFolders(wsId, this.selectedFolderId() ?? undefined).subscribe({
      next: f => this.folders.set(f),
      error: () => this.folders.set([])
    });
    this.api.listDocuments({
      workspaceId: wsId,
      folderId: this.selectedFolderId() ?? undefined,
      page: 0,
      size: 50
    }).subscribe({
      next: d => this.documents.set(d.content),
      error: () => this.documents.set([])
    });
  }

  openCreateMenu(): void { this.createMenuOpen.set(true); }
  closeCreateMenu(): void { this.createMenuOpen.set(false); }

  createWorkspace(): void {
    const name = prompt('Workspace name:');
    if (!name) return;
    const desc = prompt('Workspace description (optional):', '') ?? '';
    this.api.createWorkspace({ name, description: desc }).subscribe({
      next: ws => {
        this.workspaces.update(prev => [...prev, ws]);
        this.selectWorkspace(ws.id);
        this.closeCreateMenu();
      }
    });
  }

  createFolder(): void {
    const wsId = this.selectedWorkspaceId();
    if (!wsId) return;
    const name = prompt('Folder name:');
    if (!name) return;
    this.api.createFolder({
      workspaceId: wsId,
      parentFolderId: this.selectedFolderId() ?? undefined,
      name
    }).subscribe({
      next: () => {
        this.refresh();
        this.closeCreateMenu();
      }
    });
  }

  createDocument(): void {
    const wsId = this.selectedWorkspaceId();
    if (!wsId) return;
    const title = prompt('Document title:', 'Untitled Document');
    if (!title) return;
    this.api.createDocument({
      workspaceId: wsId,
      folderId: this.selectedFolderId() ?? undefined,
      title,
      contentType: 'tiptap/html',
      content: ''
    }).subscribe({
      next: doc => {
        this.closeCreateMenu();
        this.router.navigate(['/documents', doc.id]);
      }
    });
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

  statusBadgeClass(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'pv-badge-blue';
      case 'DRAFT': return 'pv-badge-amber';
      case 'ARCHIVED': return 'pv-badge-purple';
      case 'LOCKED': return 'pv-badge-red';
      default: return 'pv-badge-teal';
    }
  }

  can(perms: Permission[] | undefined, p: Permission): boolean {
    return !!perms?.includes(p);
  }
}
