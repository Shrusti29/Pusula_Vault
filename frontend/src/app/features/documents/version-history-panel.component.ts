import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  inject,
  signal,
  computed,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { DocumentVersionResponse } from '../../core/models/pusula.models';
import { RestoreConfirmDialogComponent } from './restore-confirm-dialog.component';

@Component({
  selector: 'app-version-history-panel',
  standalone: true,
  imports: [CommonModule, RestoreConfirmDialogComponent],
  template: `
    <div class="vhp-shell">
      <header class="vhp-head">
        <div class="vhp-title-group">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <h3 class="vhp-title">{{ versions().length }} version{{ versions().length === 1 ? '' : 's' }}</h3>
        </div>
        <button class="vhp-close" (click)="close.emit()" title="Close">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </header>

      <div class="vhp-body" *ngIf="!loading()">
        <div
          class="vhp-row"
          *ngFor="let v of versions(); trackBy: trackById"
          [class.current]="isCurrentVersion(v)"
          [class.selected]="selectedVersionId() === v.id"
          (click)="selectVersion(v)"
        >
          <div class="vhp-row-mark"></div>

          <div class="vhp-row-main">
            <div class="vhp-row-top">
              <span class="vhp-ver">v{{ v.versionNumber }}</span>
              <span class="pv-badge pv-badge-blue" *ngIf="isCurrentVersion(v)">Current</span>
              <span class="vhp-size" *ngIf="v.sizeBytes">{{ formatSize(v.sizeBytes) }}</span>
            </div>

            <p class="vhp-summary" *ngIf="v.changeSummary">{{ v.changeSummary }}</p>
            <p class="vhp-summary placeholder" *ngIf="!v.changeSummary">No change summary</p>

            <div class="vhp-meta">
              <div class="vhp-author">
                <div class="vhp-avatar">{{ avatarInitial(v.createdBy) }}</div>
                <span class="vhp-author-name">{{ v.createdBy ?? 'System' }}</span>
              </div>
              <span class="vhp-dot">·</span>
              <span class="vhp-time">{{ formatDate(v.createdAt) }}</span>
            </div>

            <div class="vhp-actions" *ngIf="!isCurrentVersion(v)">
              <button
                class="pv-btn pv-btn-ghost vhp-btn"
                (click)="$event.stopPropagation(); onCompare(v)"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="17 1 21 5 17 9"/>
                  <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                  <polyline points="7 23 3 19 7 15"/>
                  <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                </svg>
                Compare with current
              </button>
              <button
                class="pv-btn pv-btn-outline vhp-btn"
                (click)="$event.stopPropagation(); openRestoreDialog(v)"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="1 4 1 10 7 10"/>
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
                </svg>
                Restore
              </button>
            </div>
          </div>
        </div>

        <div class="vhp-empty" *ngIf="!versions().length">
          <div class="vhp-empty-icon">📋</div>
          <p>No versions saved yet.</p>
          <span class="vhp-empty-hint">Save changes to create version snapshots.</span>
        </div>
      </div>

      <div class="vhp-body vhp-loading" *ngIf="loading()">
        <div class="vhp-spinner"></div>
        <span>Loading versions...</span>
      </div>
    </div>

    <app-restore-confirm-dialog
      *ngIf="restoreDialogOpen()"
      [documentTitle]="restoreTargetVersion()?.changeSummary ?? 'this version'"
      [fromVersion]="restoreTargetVersion()?.versionNumber ?? 0"
      (confirm)="confirmRestore()"
      (cancel)="closeRestoreDialog()"
    ></app-restore-confirm-dialog>

    <div class="vhp-toast" *ngIf="toastVisible()" [class.success]="toastType() === 'success'" [class.error]="toastType() === 'error'">
      <svg *ngIf="toastType() === 'success'" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      <svg *ngIf="toastType() === 'error'" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      <span>{{ toastMessage() }}</span>
    </div>
  `,
  styles: [`
    .vhp-shell {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      min-height: 400px;
      background: var(--pv-bg-elevated);
      border: 1px solid var(--pv-border);
      border-radius: var(--pv-radius-lg);
      box-shadow: var(--pv-shadow-card);
      overflow: hidden;
    }

    .vhp-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--pv-border);
      background: linear-gradient(180deg, rgba(14, 165, 233, 0.04), transparent);
    }
    .vhp-title-group {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      color: var(--pv-accent-blue);
    }
    .vhp-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--pv-text-primary);
      margin: 0;
    }
    .vhp-close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--pv-radius-sm);
      color: var(--pv-text-muted);
      cursor: pointer;
      transition: all var(--pv-transition-fast);
    }
    .vhp-close:hover {
      background: var(--pv-bg-card-hover);
      border-color: var(--pv-border);
      color: var(--pv-text-primary);
    }

    .vhp-body {
      flex: 1;
      overflow-y: auto;
      padding: 0.75rem;
    }
    .vhp-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      color: var(--pv-text-muted);
      font-size: 0.85rem;
      font-weight: 500;
    }
    .vhp-spinner {
      width: 32px;
      height: 32px;
      border: 3px solid var(--pv-border);
      border-top-color: var(--pv-accent-blue);
      border-radius: 50%;
      animation: vhpSpin 0.8s linear infinite;
    }
    @keyframes vhpSpin { to { transform: rotate(360deg); } }

    .vhp-row {
      display: flex;
      gap: 0.85rem;
      padding: 0.85rem 0.85rem;
      border-radius: var(--pv-radius-md);
      cursor: pointer;
      transition: all var(--pv-transition-fast);
      position: relative;
      margin-bottom: 0.25rem;
    }
    .vhp-row:hover {
      background: var(--pv-bg-card-hover);
    }
    .vhp-row.selected {
      background: rgba(14, 165, 233, 0.06);
      border: 1px solid rgba(14, 165, 233, 0.3);
    }
    .vhp-row.current {
      background: linear-gradient(90deg, rgba(14, 165, 233, 0.1), transparent);
      border: 1px solid rgba(14, 165, 233, 0.2);
    }
    .vhp-row.current:hover {
      background: linear-gradient(90deg, rgba(14, 165, 233, 0.14), transparent);
    }
    .vhp-row-mark {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--pv-border);
      margin-top: 0.45rem;
      flex-shrink: 0;
      position: relative;
    }
    .vhp-row.current .vhp-row-mark {
      background: var(--pv-accent-blue);
      box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.2);
    }
    .vhp-row-main { flex: 1; min-width: 0; }
    .vhp-row-top {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin-bottom: 0.4rem;
      flex-wrap: wrap;
    }
    .vhp-ver {
      font-weight: 700;
      font-size: 0.92rem;
      color: var(--pv-text-primary);
    }
    .vhp-size {
      margin-left: auto;
      font-size: 0.7rem;
      font-weight: 600;
      color: var(--pv-text-subtle);
      padding: 0.15rem 0.5rem;
      background: var(--pv-bg-mid);
      border-radius: 999px;
    }
    .vhp-summary {
      font-size: 0.82rem;
      color: var(--pv-text-secondary);
      line-height: 1.5;
      margin-bottom: 0.5rem;
      word-break: break-word;
    }
    .vhp-summary.placeholder {
      color: var(--pv-text-subtle);
      font-style: italic;
    }
    .vhp-meta {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.72rem;
      color: var(--pv-text-muted);
      margin-bottom: 0.65rem;
      flex-wrap: wrap;
    }
    .vhp-author {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .vhp-avatar {
      width: 22px;
      height: 22px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--pv-accent-blue), var(--pv-accent-purple));
      color: white;
      border-radius: 50%;
      font-weight: 700;
      font-size: 0.68rem;
      flex-shrink: 0;
    }
    .vhp-author-name { font-weight: 600; color: var(--pv-text-secondary); }
    .vhp-dot { color: var(--pv-text-subtle); }
    .vhp-time { font-variant-numeric: tabular-nums; }
    .vhp-actions {
      display: flex;
      gap: 0.45rem;
      flex-wrap: wrap;
    }
    .vhp-btn {
      padding: 0.38rem 0.75rem;
      font-size: 0.74rem;
    }

    .vhp-empty {
      text-align: center;
      padding: 3rem 1.5rem;
      color: var(--pv-text-muted);
    }
    .vhp-empty-icon {
      font-size: 2.5rem;
      margin-bottom: 0.75rem;
      opacity: 0.6;
    }
    .vhp-empty p {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--pv-text-secondary);
      margin-bottom: 0.35rem;
    }
    .vhp-empty-hint {
      font-size: 0.78rem;
      color: var(--pv-text-subtle);
    }

    .vhp-toast {
      position: absolute;
      bottom: 1.25rem;
      left: 50%;
      transform: translateX(-50%);
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.75rem 1.25rem;
      border-radius: var(--pv-radius-md);
      font-size: 0.82rem;
      font-weight: 600;
      box-shadow: var(--pv-shadow-lg);
      z-index: 50;
      animation: vhpToastIn 250ms cubic-bezier(0.16, 1, 0.3, 1);
    }
    .vhp-toast.success {
      background: rgba(20, 184, 166, 0.15);
      border: 1px solid rgba(20, 184, 166, 0.4);
      color: var(--pv-accent-teal);
    }
    .vhp-toast.error {
      background: rgba(220, 38, 38, 0.15);
      border: 1px solid rgba(220, 38, 38, 0.4);
      color: var(--pv-accent-red);
    }
    @keyframes vhpToastIn {
      from { opacity: 0; transform: translate(-50%, 12px); }
      to   { opacity: 1; transform: translate(-50%, 0); }
    }
  `]
})
export class VersionHistoryPanelComponent implements OnInit, OnChanges {
  @Input() documentId!: string;

  @Output() close = new EventEmitter<void>();
  @Output() versionSelected = new EventEmitter<DocumentVersionResponse>();
  @Output() restoreSuccess = new EventEmitter<void>();
  @Output() compareWithCurrent = new EventEmitter<number>();

  private api = inject(ApiService);

  versions = signal<DocumentVersionResponse[]>([]);
  loading = signal(true);
  selectedVersionId = signal<string | null>(null);

  restoreDialogOpen = signal(false);
  restoreTargetVersion = signal<DocumentVersionResponse | null>(null);

  toastVisible = signal(false);
  toastMessage = signal('');
  toastType = signal<'success' | 'error'>('success');

  currentVersionNumber = computed(() => {
    const v = this.versions();
    return v.length ? v[0].versionNumber : 0;
  });

  ngOnInit(): void {
    this.loadVersions();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['documentId'] && !changes['documentId'].firstChange) {
      this.loadVersions();
    }
  }

  private loadVersions(): void {
    if (!this.documentId) return;
    this.loading.set(true);
    this.api.listVersions(this.documentId).subscribe({
      next: v => {
        this.versions.set(v.sort((a, b) => b.versionNumber - a.versionNumber));
        this.loading.set(false);
      },
      error: () => {
        this.versions.set([]);
        this.loading.set(false);
      }
    });
  }

  isCurrentVersion(v: DocumentVersionResponse): boolean {
    return v.versionNumber === this.currentVersionNumber();
  }

  selectVersion(v: DocumentVersionResponse): void {
    this.selectedVersionId.set(v.id);
    this.versionSelected.emit(v);
  }

  openRestoreDialog(v: DocumentVersionResponse): void {
    this.restoreTargetVersion.set(v);
    this.restoreDialogOpen.set(true);
  }

  closeRestoreDialog(): void {
    this.restoreDialogOpen.set(false);
    this.restoreTargetVersion.set(null);
  }

  confirmRestore(): void {
    const target = this.restoreTargetVersion();
    if (!target) return;

    this.closeRestoreDialog();

    this.api.restoreVersion(target.id).subscribe({
      next: () => {
        this.showToast('Version restored successfully. New version created.', 'success');
        this.restoreSuccess.emit();
        this.loadVersions();
      },
      error: () => {
        this.showToast('Failed to restore version. Please try again.', 'error');
      }
    });
  }

  onCompare(v: DocumentVersionResponse): void {
    this.compareWithCurrent.emit(v.versionNumber);
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 3200);
  }

  trackById(_index: number, item: DocumentVersionResponse): string {
    return item.id;
  }

  avatarInitial(name: string | undefined): string {
    if (!name) return 'S';
    return name.charAt(0).toUpperCase();
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return ''; }
  }
}
