import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, inject, signal, computed, ChangeDetectorRef, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { FileAssetResponse, WorkspaceResponse, FolderResponse } from '../../core/models/pusula.models';

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'queued' | 'uploading' | 'success' | 'error' | 'cancelled';
  errorMessage?: string;
  result?: FileAssetResponse;
  retryCount: number;
}

export const ALLOWED_EXT = ['docx', 'xlsx', 'csv', 'pdf', 'png', 'jpg', 'jpeg', 'webp', 'svg', 'txt', 'md'];
export const ALLOWED_MIME = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv', 'application/pdf',
  'image/png', 'image/jpeg', 'image/webp', 'image/svg+xml',
  'text/plain', 'text/markdown'
];
export const MAX_SIZE_BYTES = 100 * 1024 * 1024;

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div
      class="upload-shell"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
      [class.dragging]="isDragOver()"
    >
      <div class="drop-zone" *ngIf="!compact()">
        <div class="dz-inner">
          <div class="dz-icon">☁️</div>
          <h3 class="dz-title">Drop files here to upload</h3>
          <p class="dz-sub">or click to browse · DOCX / XLSX / CSV / PDF / PNG / JPG / WEBP / SVG / TXT / MD · max 100MB</p>
          <button class="pv-btn pv-btn-primary dz-btn" (click)="browseClick()">
            <span>Choose Files</span>
          </button>
          <input #fileInput type="file" class="hidden-input" multiple (change)="onFileInput($event)" [accept]="acceptAttr()" />
        </div>
      </div>

      <div class="compact-head" *ngIf="compact()">
        <button class="pv-btn pv-btn-primary compact-btn" (click)="browseClick()">
          <span class="btn-icon">⬆</span>
          <span>Upload</span>
        </button>
        <input #fileInput type="file" class="hidden-input" multiple (change)="onFileInput($event)" [accept]="acceptAttr()" />
        <span class="count-badge" *ngIf="items().length">{{ items().length }} item(s)</span>
      </div>

      <div class="attach-options" *ngIf="workspaces().length">
        <div class="opt-row">
          <label class="opt-label">Workspace</label>
          <select class="pv-select" [ngModel]="attachWorkspaceId()" (ngModelChange)="setAttachWorkspaceId($event)">
            <option *ngFor="let w of workspaces()" [value]="w.id">{{ w.name }}</option>
          </select>
        </div>
        <div class="opt-row" *ngIf="folders().length">
          <label class="opt-label">Folder</label>
          <select class="pv-select" [ngModel]="attachFolderId()" (ngModelChange)="attachFolderId.set($event)">
            <option [value]="''">— Root —</option>
            <option *ngFor="let f of folders()" [value]="f.id">{{ f.name }}</option>
          </select>
        </div>
      </div>

      <div class="upload-list" *ngIf="items().length">
        <div class="ul-head">
          <h4>Uploads ({{ activeCount() }} active / {{ queuedCount() }} queued)</h4>
          <button class="pv-btn pv-btn-ghost ul-clear" (click)="clearCompleted()" *ngIf="hasCompleted()">Clear completed</button>
        </div>
        <div class="ul-items">
          <div *ngFor="let it of items()" class="ul-item" [class.status-error]="it.status === 'error'" [class.status-success]="it.status === 'success'">
            <div class="ul-icon" [class]="iconClass(it.file)">
              <span>{{ extOf(it.file) }}</span>
            </div>
            <div class="ul-body">
              <div class="ul-meta">
                <span class="ul-name">{{ it.file.name }}</span>
                <span class="ul-size">{{ formatSize(it.file.size) }}</span>
              </div>
              <div class="progress-track" *ngIf="it.status === 'uploading' || it.status === 'queued'">
                <div class="progress-fill" [style.width.%]="it.progress"></div>
                <span class="progress-pct">{{ it.progress }}%</span>
              </div>
              <div class="ul-msg" *ngIf="it.status === 'success'">
                <span class="msg-ok">✓ Uploaded — {{ it.result?.id }}</span>
              </div>
              <div class="ul-msg" *ngIf="it.status === 'error'">
                <span class="msg-err">⚠ {{ it.errorMessage }}</span>
                <button class="pv-btn pv-btn-ghost btn-sm" (click)="retryItem(it.id)" *ngIf="it.retryCount < 3">Retry ({{ 3 - it.retryCount }} left)</button>
              </div>
              <div class="ul-msg" *ngIf="it.status === 'cancelled'">
                <span class="msg-cxl">Cancelled</span>
              </div>
            </div>
            <div class="ul-actions">
              <button class="icon-btn" (click)="cancelItem(it.id)" *ngIf="it.status === 'uploading' || it.status === 'queued'" title="Cancel">✕</button>
            </div>
          </div>
        </div>
      </div>

      <div class="reject-banner" *ngIf="rejections().length">
        <span class="reject-title">Rejected files:</span>
        <span *ngFor="let r of rejections(); let last = last">
          {{ r.name }} ({{ r.reason }}){{ last ? '' : ', ' }}
        </span>
        <button class="pv-btn pv-btn-ghost btn-sm" (click)="clearRejections()">Dismiss</button>
      </div>
    </div>
  `,
  styles: [`
    .upload-shell {
      position: relative;
      border: 2px dashed var(--pv-border);
      border-radius: var(--pv-radius-lg);
      padding: 1.5rem;
      background: var(--pv-bg-card);
      transition: all var(--pv-transition-base);
    }
    .upload-shell.dragging {
      border-color: var(--pv-accent-blue);
      background: rgba(14, 165, 233, 0.06);
      box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.08);
    }
    .drop-zone { padding: 2rem 1rem; text-align: center; }
    .dz-icon { font-size: 3rem; margin-bottom: 0.75rem; }
    .dz-title { font-size: 1.1rem; font-weight: 600; color: var(--pv-text-primary); margin-bottom: 0.35rem; }
    .dz-sub { font-size: 0.82rem; color: var(--pv-text-muted); margin-bottom: 1.25rem; }
    .dz-btn { display: inline-flex; }
    .hidden-input { position: absolute; opacity: 0; pointer-events: none; width: 0; height: 0; }
    .compact-head { display: flex; align-items: center; gap: 0.75rem; }
    .count-badge { font-size: 0.78rem; padding: 0.25rem 0.65rem; background: var(--pv-bg-dark); border: 1px solid var(--pv-border); border-radius: 999px; color: var(--pv-text-muted); font-weight: 600; }
    .attach-options { margin-top: 1rem; display: flex; flex-wrap: wrap; gap: 1rem; padding-top: 1rem; border-top: 1px solid var(--pv-border-soft); }
    .opt-row { display: flex; align-items: center; gap: 0.6rem; }
    .opt-label { font-size: 0.78rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: var(--pv-text-muted); }
    .pv-select { background: var(--pv-bg-dark); border: 1px solid var(--pv-border); color: var(--pv-text-primary); padding: 0.5rem 0.75rem; border-radius: var(--pv-radius-md); font-size: 0.85rem; }
    .upload-list { margin-top: 1.25rem; }
    .ul-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; }
    .ul-head h4 { font-size: 0.85rem; font-weight: 600; color: var(--pv-text-primary); text-transform: uppercase; letter-spacing: 0.04em; }
    .ul-clear { font-size: 0.75rem; padding: 0.35rem 0.75rem; }
    .ul-items { display: flex; flex-direction: column; gap: 0.6rem; }
    .ul-item { display: flex; align-items: center; gap: 0.85rem; padding: 0.75rem 1rem; background: var(--pv-bg-dark); border: 1px solid var(--pv-border-soft); border-radius: var(--pv-radius-md); }
    .ul-item.status-error { border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.06); }
    .ul-item.status-success { border-color: rgba(20, 184, 166, 0.4); background: rgba(20, 184, 166, 0.06); }
    .ul-icon { width: 42px; height: 42px; border-radius: var(--pv-radius-sm); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.03em; flex-shrink: 0; }
    .ul-icon.type-doc { background: rgba(59, 130, 246, 0.14); color: var(--pv-accent-blue); }
    .ul-icon.type-sheet { background: rgba(16, 185, 129, 0.14); color: #10b981; }
    .ul-icon.type-pdf { background: rgba(239, 68, 68, 0.14); color: var(--pv-accent-red); }
    .ul-icon.type-image { background: rgba(168, 85, 247, 0.14); color: #a855f7; }
    .ul-icon.type-text { background: rgba(107, 114, 128, 0.18); color: #9ca3af; }
    .ul-body { flex: 1; min-width: 0; }
    .ul-meta { display: flex; justify-content: space-between; align-items: baseline; gap: 0.5rem; margin-bottom: 0.45rem; }
    .ul-name { font-size: 0.85rem; font-weight: 600; color: var(--pv-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .ul-size { font-size: 0.72rem; color: var(--pv-text-subtle); flex-shrink: 0; }
    .progress-track { position: relative; height: 8px; background: var(--pv-border-soft); border-radius: 999px; overflow: hidden; }
    .progress-fill { position: absolute; inset: 0 auto 0 0; background: linear-gradient(90deg, var(--pv-accent-blue), var(--pv-accent-teal)); border-radius: 999px; transition: width 0.2s ease; }
    .progress-pct { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 700; color: var(--pv-text-primary); mix-blend-mode: difference; }
    .ul-msg { display: flex; align-items: center; gap: 0.5rem; font-size: 0.78rem; margin-top: 0.35rem; }
    .msg-ok { color: var(--pv-accent-teal); font-weight: 600; }
    .msg-err { color: var(--pv-accent-red); font-weight: 500; }
    .msg-cxl { color: var(--pv-text-muted); font-style: italic; }
    .ul-actions { display: flex; gap: 0.35rem; flex-shrink: 0; }
    .icon-btn { background: none; border: none; color: var(--pv-text-muted); cursor: pointer; padding: 0.35rem; border-radius: 6px; transition: all 0.15s; }
    .icon-btn:hover { color: var(--pv-accent-red); background: rgba(239, 68, 68, 0.08); }
    .btn-sm { padding: 0.3rem 0.6rem; font-size: 0.72rem; }
    .reject-banner { margin-top: 1rem; padding: 0.85rem 1rem; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: var(--pv-radius-md); font-size: 0.8rem; color: var(--pv-accent-amber); display: flex; flex-wrap: wrap; align-items: center; gap: 0.5rem; }
    .reject-title { font-weight: 700; text-transform: uppercase; font-size: 0.72rem; letter-spacing: 0.04em; }
    .reject-banner .btn-sm { margin-left: auto; }
    .pv-btn-ghost { background: transparent; border: 1px solid var(--pv-border); color: var(--pv-text-secondary); padding: 0.5rem 0.9rem; border-radius: var(--pv-radius-md); cursor: pointer; font-size: 0.85rem; transition: all var(--pv-transition-fast); }
    .pv-btn-ghost:hover { border-color: var(--pv-accent-blue); color: var(--pv-accent-blue); background: rgba(14, 165, 233, 0.06); }
  `]
})
export class FileUploadComponent implements OnInit, OnDestroy {
  compact = input(false);
  workspaces = input<WorkspaceResponse[]>([]);
  @Input() defaultWorkspaceId: string | null = null;
  @Output() uploaded = new EventEmitter<FileAssetResponse>();
  @Output() allCompleted = new EventEmitter<FileAssetResponse[]>();

  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  items = signal<UploadItem[]>([]);
  rejections = signal<{ name: string; reason: string }[]>([]);
  isDragOver = signal(false);
  folders = signal<FolderResponse[]>([]);

  attachWorkspaceId = signal('');
  attachFolderId = signal('');

  private readonly SIMULTANEOUS_LIMIT = 3;
  private processingTimer: number | null = null;

  activeCount = computed(() => this.items().filter(i => i.status === 'uploading').length);
  queuedCount = computed(() => this.items().filter(i => i.status === 'queued').length);
  hasCompleted = computed(() => this.items().some(i => i.status === 'success' || i.status === 'error' || i.status === 'cancelled'));

  acceptAttr = computed(() => ALLOWED_EXT.map(e => '.' + e).join(',') + ',' + ALLOWED_MIME.join(','));

  ngOnInit(): void {
    if (this.defaultWorkspaceId) {
      this.attachWorkspaceId.set(this.defaultWorkspaceId);
      this.refreshFolders();
    } else if (this.workspaces().length) {
      this.attachWorkspaceId.set(this.workspaces()[0].id);
      this.refreshFolders();
    }
    this.startProcessingLoop();
  }

  ngOnDestroy(): void {
    if (this.processingTimer !== null) {
      window.clearInterval(this.processingTimer);
      this.processingTimer = null;
    }
  }

  setAttachWorkspaceId(id: string): void {
    this.attachWorkspaceId.set(id);
    this.refreshFolders();
  }

  refreshFolders(): void {
    const wsId = this.attachWorkspaceId();
    if (!wsId) { this.folders.set([]); return; }
    this.api.listFolders(wsId).subscribe({
      next: f => this.folders.set(f),
      error: () => this.folders.set([])
    });
  }

  browseClick(): void {
    const input = document.querySelector('.hidden-input') as HTMLInputElement;
    input?.click();
  }

  onFileInput(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    if (!input.files) return;
    this.handleFiles(Array.from(input.files));
    input.value = '';
  }

  onDragOver(ev: DragEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(ev: DragEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(ev: DragEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.isDragOver.set(false);
    if (!ev.dataTransfer?.files) return;
    this.handleFiles(Array.from(ev.dataTransfer.files));
  }

  private handleFiles(files: File[]): void {
    const wsId = this.attachWorkspaceId();
    if (!wsId && this.workspaces().length) {
      this.attachWorkspaceId.set(this.workspaces()[0].id);
      this.refreshFolders();
    }
    const newItems: UploadItem[] = [];
    const newRejects: { name: string; reason: string }[] = [];
    for (const f of files) {
      const ext = (f.name.split('.').pop() || '').toLowerCase();
      if (f.size > MAX_SIZE_BYTES) {
        newRejects.push({ name: f.name, reason: `too large (${this.formatSize(f.size)} > 100MB)` });
        continue;
      }
      if (!ALLOWED_EXT.includes(ext) && !ALLOWED_MIME.includes(f.type)) {
        newRejects.push({ name: f.name, reason: `unsupported type (${ext || f.type})` });
        continue;
      }
      newItems.push({
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        file: f,
        progress: 0,
        status: 'queued',
        retryCount: 0
      });
    }
    if (newItems.length) this.items.update(prev => [...prev, ...newItems]);
    if (newRejects.length) this.rejections.update(prev => [...prev, ...newRejects]);
  }

  private startProcessingLoop(): void {
    this.processingTimer = window.setInterval(() => this.tickProcessing(), 200);
  }

  private tickProcessing(): void {
    const all = this.items();
    const active = all.filter(i => i.status === 'uploading');
    if (active.length >= this.SIMULTANEOUS_LIMIT) return;
    const toStart = all.filter(i => i.status === 'queued').slice(0, this.SIMULTANEOUS_LIMIT - active.length);
    for (const it of toStart) this.startUpload(it);
  }

  private startUpload(item: UploadItem): void {
    this.items.update(prev => prev.map(i => i.id === item.id ? { ...i, status: 'uploading', progress: 2 } : i));
    const wsId = this.attachWorkspaceId();
    if (!wsId) {
      this.failItem(item.id, 'No workspace selected');
      return;
    }
    const opts: { workspaceId: string; folderId?: string } = { workspaceId: wsId };
    if (this.attachFolderId()) opts.folderId = this.attachFolderId();
    this.simulateProgress(item.id);
    this.api.uploadFile(item.file, opts).subscribe({
      next: res => this.succeedItem(item.id, res),
      error: err => this.failItem(item.id, err?.message || 'Upload failed')
    });
  }

  private simulateProgress(id: string): void {
    const steps = 12;
    let step = 0;
    const inter = window.setInterval(() => {
      step++;
      const current = this.items().find(i => i.id === id);
      if (!current || current.status !== 'uploading') { window.clearInterval(inter); return; }
      const target = Math.min(95, 2 + Math.floor((step / steps) * 93));
      this.items.update(prev => prev.map(i => i.id === id ? { ...i, progress: Math.max(i.progress, target) } : i));
      if (step >= steps) window.clearInterval(inter);
    }, 250);
  }

  private succeedItem(id: string, result: FileAssetResponse): void {
    this.items.update(prev => prev.map(i => i.id === id ? { ...i, status: 'success', progress: 100, result } : i));
    this.uploaded.emit(result);
    const allDone = this.items().every(i => i.status !== 'queued' && i.status !== 'uploading');
    if (allDone) {
      const results = this.items().filter(i => i.status === 'success' && i.result).map(i => i.result!);
      if (results.length) this.allCompleted.emit(results);
    }
  }

  private failItem(id: string, msg: string): void {
    this.items.update(prev => prev.map(i => i.id === id ? { ...i, status: 'error', errorMessage: msg } : i));
  }

  cancelItem(id: string): void {
    this.items.update(prev => prev.map(i => (i.id === id && (i.status === 'queued' || i.status === 'uploading')) ? { ...i, status: 'cancelled' } : i));
  }

  retryItem(id: string): void {
    this.items.update(prev => prev.map(i => i.id === id && i.status === 'error' && i.retryCount < 3 ? { ...i, status: 'queued', progress: 0, retryCount: i.retryCount + 1, errorMessage: undefined } : i));
  }

  clearCompleted(): void {
    this.items.update(prev => prev.filter(i => i.status === 'queued' || i.status === 'uploading'));
  }

  clearRejections(): void { this.rejections.set([]); }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }

  extOf(file: File): string {
    return (file.name.split('.').pop() || 'BIN').toUpperCase().slice(0, 4);
  }

  iconClass(file: File): string {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (['docx', 'doc'].includes(ext)) return 'type-doc';
    if (['xlsx', 'xls', 'csv'].includes(ext)) return 'type-sheet';
    if (ext === 'pdf') return 'type-pdf';
    if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext)) return 'type-image';
    return 'type-text';
  }
}
