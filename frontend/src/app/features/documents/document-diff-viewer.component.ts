import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
  ElementRef,
  inject,
  signal,
  computed,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { DocumentDiffResponse, DocumentVersionResponse, DiffRange } from '../../core/models/pusula.models';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

declare const diff_match_patch: any;

type DiffMode = 'inline' | 'sidebyside';

interface LineDiffChunk {
  op: 'equal' | 'delete' | 'insert';
  text: string;
}

interface LineWithDiff {
  leftNum: number | null;
  rightNum: number | null;
  left: LineDiffChunk[];
  right: LineDiffChunk[];
}

@Component({
  selector: 'app-document-diff-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ddv-shell">
      <header class="ddv-head">
        <div class="ddv-head-main">
          <div class="ddv-icon">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="17 1 21 5 17 9"/>
              <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
              <polyline points="7 23 3 19 7 15"/>
              <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
            </svg>
          </div>
          <div class="ddv-title-group">
            <h3 class="ddv-title">Comparing versions</h3>
            <div class="ddv-compare-label">
              <span class="ddv-ver ddv-ver-old">v{{ leftVersion }}</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" class="ddv-arrow">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
              <span class="ddv-ver ddv-ver-new">v{{ rightVersion }}</span>
            </div>
          </div>
        </div>

        <div class="ddv-controls">
          <div class="ddv-version-pickers">
            <div class="ddv-picker">
              <label class="ddv-picker-label">Left</label>
              <select
                class="pv-select ddv-select"
                [ngModel]="leftVersion"
                (ngModelChange)="onLeftChange($event)"
                [disabled]="loading()"
              >
                <option *ngFor="let n of availableVersions" [value]="n">v{{ n }}</option>
              </select>
            </div>
            <div class="ddv-picker">
              <label class="ddv-picker-label">Right</label>
              <select
                class="pv-select ddv-select"
                [ngModel]="rightVersion"
                (ngModelChange)="onRightChange($event)"
                [disabled]="loading()"
              >
                <option *ngFor="let n of availableVersions" [value]="n">v{{ n }}</option>
              </select>
            </div>
          </div>

          <div class="ddv-mode-toggle">
            <button
              class="ddv-mode-btn"
              [class.active]="diffMode() === 'inline'"
              (click)="diffMode.set('inline')"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
              Inline
            </button>
            <button
              class="ddv-mode-btn"
              [class.active]="diffMode() === 'sidebyside'"
              (click)="diffMode.set('sidebyside')"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="18"/>
                <rect x="14" y="3" width="7" height="18"/>
              </svg>
              Side-by-side
            </button>
          </div>
        </div>
      </header>

      <div class="ddv-stats" *ngIf="stats()">
        <div class="ddv-stat">
          <span class="ddv-stat-num additions">{{ stats()!.additions }}</span>
          <span class="ddv-stat-label">additions</span>
        </div>
        <div class="ddv-stat-sep"></div>
        <div class="ddv-stat">
          <span class="ddv-stat-num deletions">{{ stats()!.deletions }}</span>
          <span class="ddv-stat-label">deletions</span>
        </div>
        <div class="ddv-stat-sep"></div>
        <div class="ddv-stat">
          <span class="ddv-stat-num changes">{{ stats()!.changes }}</span>
          <span class="ddv-stat-label">changes</span>
        </div>
      </div>

      <div class="ddv-body" *ngIf="!loading()">
        <div class="ddv-inline" *ngIf="diffMode() === 'inline'">
          <div class="ddv-scroll-pane">
            <table class="ddv-table ddv-inline-table" cellspacing="0" cellpadding="0">
              <tbody>
                <tr
                  *ngFor="let line of inlineLines(); trackBy: trackByLine"
                  [class.ddv-line-delete]="lineHasOp(line, 'delete')"
                  [class.ddv-line-insert]="lineHasOp(line, 'insert')"
                >
                  <td class="ddv-lineno ddv-lineno-left" *ngIf="line.leftNum !== null">{{ line.leftNum }}</td>
                  <td class="ddv-lineno ddv-lineno-empty" *ngIf="line.leftNum === null"></td>
                  <td class="ddv-lineno ddv-lineno-right" *ngIf="line.rightNum !== null">{{ line.rightNum }}</td>
                  <td class="ddv-lineno ddv-lineno-empty" *ngIf="line.rightNum === null"></td>
                  <td class="ddv-line-content">
                    <span *ngIf="line.left.length" class="ddv-inline-side ddv-inline-left">
                      <ng-container *ngFor="let chunk of line.left; trackBy: trackByChunk">
                        <span
                          [class.ddv-chunk-delete]="chunk.op === 'delete'"
                          [class.ddv-chunk-equal]="chunk.op === 'equal'"
                          >{{ chunk.text }}
                        </span>
                      </ng-container>
                    </span>
                    <span *ngIf="line.right.length" class="ddv-inline-side ddv-inline-right">
                      <ng-container *ngFor="let chunk of line.right; trackBy: trackByChunk">
                        <span
                          [class.ddv-chunk-insert]="chunk.op === 'insert'"
                          [class.ddv-chunk-equal]="chunk.op === 'equal'"
                          >{{ chunk.text }}
                        </span>
                      </ng-container>
                    </span>
                    <span *ngIf="!line.left.length && !line.right.length" class="ddv-empty-line">&nbsp;</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="ddv-sbs" *ngIf="diffMode() === 'sidebyside'">
          <div class="ddv-sbs-pane ddv-sbs-left">
            <div class="ddv-pane-header">
              <div class="ddv-pane-label">
                <span class="ddv-pane-dot old"></span>
                Version {{ leftVersion }}
              </div>
            </div>
            <div
              class="ddv-scroll-pane ddv-scroll-left"
              #scrollLeft
              (scroll)="onScrollLeft()"
            >
              <table class="ddv-table ddv-sbs-table" cellspacing="0" cellpadding="0">
                <tbody>
                  <tr
                    *ngFor="let line of sbsLeftLines(); trackBy: trackByLine"
                    [class.ddv-line-delete]="lineHasOpSide(line, 'delete', 'left')"
                  >
                    <td class="ddv-lineno ddv-lineno-left" *ngIf="line.leftNum !== null">{{ line.leftNum }}</td>
                    <td class="ddv-lineno ddv-lineno-empty" *ngIf="line.leftNum === null"></td>
                    <td class="ddv-line-content">
                      <ng-container *ngIf="line.left.length">
                        <span *ngFor="let chunk of line.left; trackBy: trackByChunk"
                          [class.ddv-chunk-delete]="chunk.op === 'delete'"
                          [class.ddv-chunk-equal]="chunk.op === 'equal'"
                          >{{ chunk.text }}
                        </span>
                      </ng-container>
                      <span *ngIf="!line.left.length" class="ddv-empty-line">&nbsp;</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="ddv-sbs-divider"></div>

          <div class="ddv-sbs-pane ddv-sbs-right">
            <div class="ddv-pane-header">
              <div class="ddv-pane-label">
                <span class="ddv-pane-dot new"></span>
                Version {{ rightVersion }}
              </div>
            </div>
            <div
              class="ddv-scroll-pane ddv-scroll-right"
              #scrollRight
              (scroll)="onScrollRight()"
            >
              <table class="ddv-table ddv-sbs-table" cellspacing="0" cellpadding="0">
                <tbody>
                  <tr
                    *ngFor="let line of sbsRightLines(); trackBy: trackByLine"
                    [class.ddv-line-insert]="lineHasOpSide(line, 'insert', 'right')"
                  >
                    <td class="ddv-lineno ddv-lineno-right" *ngIf="line.rightNum !== null">{{ line.rightNum }}</td>
                    <td class="ddv-lineno ddv-lineno-empty" *ngIf="line.rightNum === null"></td>
                    <td class="ddv-line-content">
                      <ng-container *ngIf="line.right.length">
                        <span *ngFor="let chunk of line.right; trackBy: trackByChunk"
                          [class.ddv-chunk-insert]="chunk.op === 'insert'"
                          [class.ddv-chunk-equal]="chunk.op === 'equal'"
                          >{{ chunk.text }}
                        </span>
                      </ng-container>
                      <span *ngIf="!line.right.length" class="ddv-empty-line">&nbsp;</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="ddv-empty" *ngIf="!loading() && inlineLines().length === 0 && sbsLeftLines().length === 0">
          <div class="ddv-empty-icon">🔍</div>
          <p>No differences found between these versions.</p>
        </div>
      </div>

      <div class="ddv-body ddv-loading" *ngIf="loading()">
        <div class="ddv-spinner"></div>
        <span>Computing diff...</span>
      </div>
    </div>
  `,
  styles: [`
    .ddv-shell {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      min-height: 520px;
      background: var(--pv-bg-elevated);
      border: 1px solid var(--pv-border);
      border-radius: var(--pv-radius-lg);
      box-shadow: var(--pv-shadow-card);
      overflow: hidden;
    }

    .ddv-head {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 1.1rem 1.25rem 0.9rem;
      border-bottom: 1px solid var(--pv-border);
      background: linear-gradient(180deg, rgba(139, 92, 246, 0.06), transparent);
    }
    .ddv-head-main {
      display: flex;
      align-items: center;
      gap: 0.8rem;
    }
    .ddv-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, rgba(14, 165, 233, 0.16), rgba(139, 92, 246, 0.16));
      border: 1px solid rgba(14, 165, 233, 0.32);
      color: var(--pv-accent-blue);
      border-radius: var(--pv-radius-md);
      flex-shrink: 0;
    }
    .ddv-title-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .ddv-title { font-size: 1.05rem; margin: 0; }
    .ddv-compare-label {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    .ddv-ver {
      display: inline-flex;
      align-items: center;
      padding: 0.18rem 0.6rem;
      font-size: 0.78rem;
      font-weight: 700;
      border-radius: 8px;
    }
    .ddv-ver-old {
      background: rgba(220, 38, 38, 0.12);
      color: var(--pv-accent-red);
      border: 1px solid rgba(220, 38, 38, 0.3);
    }
    .ddv-ver-new {
      background: rgba(20, 184, 166, 0.12);
      color: var(--pv-accent-teal);
      border: 1px solid rgba(20, 184, 166, 0.3);
    }
    .ddv-arrow { color: var(--pv-text-subtle); }

    .ddv-controls {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .ddv-version-pickers {
      display: flex;
      gap: 0.75rem;
    }
    .ddv-picker {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }
    .ddv-picker-label {
      font-size: 0.68rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--pv-text-muted);
    }
    .ddv-select {
      min-width: 110px;
      padding: 0.45rem 0.75rem;
      font-size: 0.82rem;
    }

    .ddv-mode-toggle {
      display: inline-flex;
      background: var(--pv-bg-mid);
      border: 1px solid var(--pv-border);
      border-radius: var(--pv-radius-md);
      padding: 3px;
      gap: 2px;
    }
    .ddv-mode-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.42rem 0.85rem;
      background: transparent;
      border: none;
      border-radius: calc(var(--pv-radius-md) - 4px);
      color: var(--pv-text-muted);
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--pv-transition-fast);
    }
    .ddv-mode-btn:hover { color: var(--pv-text-secondary); }
    .ddv-mode-btn.active {
      background: var(--pv-bg-elevated);
      color: var(--pv-accent-blue);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
    }

    .ddv-stats {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1.25rem;
      border-bottom: 1px solid var(--pv-border-soft);
      background: rgba(10, 22, 40, 0.5);
    }
    .ddv-stat {
      display: inline-flex;
      align-items: baseline;
      gap: 0.4rem;
    }
    .ddv-stat-num {
      font-size: 1.15rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    .ddv-stat-num.additions { color: var(--pv-accent-teal); }
    .ddv-stat-num.deletions { color: var(--pv-accent-red); }
    .ddv-stat-num.changes { color: var(--pv-accent-amber); }
    .ddv-stat-label {
      font-size: 0.72rem;
      color: var(--pv-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      font-weight: 600;
    }
    .ddv-stat-sep {
      width: 1px;
      height: 22px;
      background: var(--pv-border-soft);
    }

    .ddv-body {
      flex: 1;
      min-height: 0;
      position: relative;
    }
    .ddv-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.85rem;
      color: var(--pv-text-muted);
      font-size: 0.85rem;
      font-weight: 500;
    }
    .ddv-spinner {
      width: 34px;
      height: 34px;
      border: 3px solid var(--pv-border);
      border-top-color: var(--pv-accent-purple);
      border-radius: 50%;
      animation: ddvSpin 0.8s linear infinite;
    }
    @keyframes ddvSpin { to { transform: rotate(360deg); } }

    .ddv-inline {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .ddv-sbs {
      display: grid;
      grid-template-columns: 1fr 1px 1fr;
      height: 100%;
      min-height: 0;
    }
    .ddv-sbs-pane {
      display: flex;
      flex-direction: column;
      min-width: 0;
      min-height: 0;
      overflow: hidden;
    }
    .ddv-sbs-divider {
      background: var(--pv-border);
    }

    .ddv-pane-header {
      padding: 0.6rem 0.9rem;
      border-bottom: 1px solid var(--pv-border-soft);
      background: var(--pv-bg-card);
    }
    .ddv-pane-label {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.74rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--pv-text-muted);
    }
    .ddv-pane-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
    }
    .ddv-pane-dot.old { background: var(--pv-accent-red); box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.18); }
    .ddv-pane-dot.new { background: var(--pv-accent-teal); box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.18); }

    .ddv-scroll-pane {
      flex: 1;
      overflow: auto;
      background: var(--pv-bg-dark);
      min-height: 0;
    }

    .ddv-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      font-family: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace;
      font-size: 0.82rem;
      line-height: 1.65;
    }
    .ddv-table tbody tr {
      transition: background 120ms ease;
    }
    .ddv-table tbody tr:hover {
      background: rgba(14, 165, 233, 0.04);
    }

    .ddv-lineno {
      padding: 2px 0.7rem;
      text-align: right;
      color: var(--pv-text-subtle);
      font-size: 0.72rem;
      font-variant-numeric: tabular-nums;
      user-select: none;
      background: rgba(10, 22, 40, 0.7);
      border-right: 1px solid var(--pv-border-soft);
      white-space: nowrap;
      min-width: 38px;
      width: 1%;
    }
    .ddv-lineno-empty {
      background: rgba(10, 22, 40, 0.5);
    }
    .ddv-inline-table .ddv-lineno-left { min-width: 40px; }
    .ddv-inline-table .ddv-lineno-right { min-width: 40px; border-right: 1px solid var(--pv-border); }

    .ddv-line-content {
      padding: 2px 0.85rem;
      color: var(--pv-text-secondary);
      white-space: pre-wrap;
      word-break: break-word;
      vertical-align: top;
    }

    .ddv-line-delete > td {
      background: rgba(220, 38, 38, 0.08) !important;
    }
    .ddv-line-insert > td {
      background: rgba(20, 184, 166, 0.08) !important;
    }
    .ddv-line-delete > td.ddv-lineno-left::before {
      content: '−';
      color: var(--pv-accent-red);
      font-weight: 700;
      margin-right: 3px;
    }
    .ddv-line-insert > td.ddv-lineno-right::before {
      content: '+';
      color: var(--pv-accent-teal);
      font-weight: 700;
      margin-right: 3px;
    }

    .ddv-chunk-delete {
      background: rgba(220, 38, 38, 0.22);
      color: #fca5a5;
      text-decoration: line-through;
      text-decoration-color: rgba(220, 38, 38, 0.6);
      border-radius: 3px;
    }
    .ddv-chunk-insert {
      background: rgba(20, 184, 166, 0.22);
      color: #99f6e4;
      border-radius: 3px;
    }
    .ddv-chunk-equal { color: var(--pv-text-secondary); }

    .ddv-inline-left, .ddv-inline-right { display: block; }

    .ddv-empty-line { display: inline-block; width: 100%; }

    .ddv-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 3rem 1.5rem;
      color: var(--pv-text-muted);
    }
    .ddv-empty-icon {
      font-size: 2.75rem;
      margin-bottom: 1rem;
      opacity: 0.65;
    }
    .ddv-empty p {
      font-size: 0.92rem;
      font-weight: 500;
      color: var(--pv-text-secondary);
    }
  `]
})
export class DocumentDiffViewerComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() documentId!: string;
  @Input() leftVersion = 1;
  @Input() rightVersion = 2;

  private api = inject(ApiService);

  @ViewChild('scrollLeft') scrollLeft!: ElementRef<HTMLDivElement>;
  @ViewChild('scrollRight') scrollRight!: ElementRef<HTMLDivElement>;

  private dmp: any = null;

  loading = signal(true);
  diffMode = signal<DiffMode>('inline');
  availableVersions: number[] = [];

  inlineLines = signal<LineWithDiff[]>([]);
  sbsLeftLines = signal<LineWithDiff[]>([]);
  sbsRightLines = signal<LineWithDiff[]>([]);

  stats = computed<{ additions: number; deletions: number; changes: number } | null>(() => {
    let additions = 0;
    let deletions = 0;
    for (const line of this.inlineLines()) {
      for (const c of line.right) if (c.op === 'insert') additions += c.text.length;
      for (const c of line.left) if (c.op === 'delete') deletions += c.text.length;
    }
    if (additions === 0 && deletions === 0) return null;
    return { additions, deletions, changes: additions + deletions };
  });

  private scrollingFrom: 'left' | 'right' | null = null;
  private scrollTimeout: any = null;

  ngOnInit(): void {
    try {
      this.dmp = new (window as any).diff_match_patch?.();
    } catch {}
    if (!this.dmp) {
      try {
        const Dmp = (window as any).diff_match_patch || (globalThis as any).diff_match_patch;
        if (Dmp) this.dmp = new Dmp();
      } catch {}
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const shouldLoad =
      changes['documentId']?.currentValue ||
      changes['leftVersion']?.currentValue !== changes['leftVersion']?.previousValue ||
      changes['rightVersion']?.currentValue !== changes['rightVersion']?.previousValue;
    if (shouldLoad) {
      this.loadDiff();
      this.refreshAvailableVersions();
    }
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
  }

  onLeftChange(v: number): void {
    this.leftVersion = Number(v);
    this.loadDiff();
  }
  onRightChange(v: number): void {
    this.rightVersion = Number(v);
    this.loadDiff();
  }

  private refreshAvailableVersions(): void {
    if (!this.documentId) return;
    this.api.listVersions(this.documentId).subscribe({
      next: vs => {
        const nums = vs.map(v => v.versionNumber).sort((a, b) => b - a);
        this.availableVersions = nums.length ? nums : [1, 2];
      },
      error: () => {
        this.availableVersions = [this.leftVersion, this.rightVersion].filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => b - a);
      }
    });
  }

  private loadDiff(): void {
    if (!this.documentId) return;
    this.loading.set(true);
    this.inlineLines.set([]);
    this.sbsLeftLines.set([]);
    this.sbsRightLines.set([]);

    this.api.diffVersions(this.documentId, this.leftVersion, this.rightVersion).pipe(
      switchMap(diff => {
        const hasData = diff && (
          (diff.added && diff.added.length) ||
          (diff.deleted && diff.deleted.length) ||
          (diff.modified && diff.modified.length) ||
          diff.unifiedText
        );
        if (hasData) {
          return of({ kind: 'api' as const, diff });
        }
        return this.fallbackDiff();
      }),
      catchError(() => this.fallbackDiff())
    ).subscribe({
      next: (res) => {
        if (res.kind === 'api') {
          this.processApiDiff(res.diff);
        } else {
          this.processDmpDiff(res.diffs);
        }
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private fallbackDiff() {
    return forkJoin({
      left: this.api.getVersion(this.versionIdFromNumber(this.leftVersion)).pipe(catchError(() => of(null))),
      right: this.api.getVersion(this.versionIdFromNumber(this.rightVersion)).pipe(catchError(() => of(null))),
    }).pipe(
      map(({ left, right }) => {
        const leftText = left?.content ?? '';
        const rightText = right?.content ?? '';
        return { kind: 'dmp' as const, diffs: this.runDmp(leftText, rightText) };
      }),
      catchError(() => of({ kind: 'dmp' as const, diffs: [] as any[] }))
    );
  }

  private versionIdFromNumber(n: number): string {
    return `ver-${this.documentId}-${n}`;
  }

  private runDmp(a: string, b: string): any[] {
    if (!this.dmp) return this.fallbackLineDiff(a, b);
    try {
      const diffs = this.dmp.diff_main(a, b);
      this.dmp.diff_cleanupSemantic?.(diffs);
      return diffs;
    } catch {
      return this.fallbackLineDiff(a, b);
    }
  }

  private fallbackLineDiff(a: string, b: string): any[] {
    const al = a.split(/\r?\n/);
    const bl = b.split(/\r?\n/);
    const max = Math.max(al.length, bl.length);
    const result: any[] = [];
    for (let i = 0; i < max; i++) {
      const leftLine = al[i] ?? '';
      const rightLine = bl[i] ?? '';
      const leftSep = i === 0 ? '' : '\n';
      const rightSep = i === 0 ? '' : '\n';
      if (leftLine === rightLine) {
        result.push([0, leftSep + leftLine]);
      } else {
        if (i < al.length) result.push([-1, leftSep + leftLine]);
        if (i < bl.length) result.push([1, rightSep + rightLine]);
      }
    }
    return result;
  }

  private processApiDiff(diff: DocumentDiffResponse): void {
    const lines = this.buildLinesFromUnified(diff.unifiedText ?? '', diff.added ?? [], diff.deleted ?? [], diff.modified ?? []);
    this.inlineLines.set(lines.inline);
    this.sbsLeftLines.set(lines.sbsLeft);
    this.sbsRightLines.set(lines.sbsRight);
  }

  private processDmpDiff(diffs: any[]): void {
    if (!diffs || !diffs.length) {
      this.inlineLines.set([]);
      return;
    }

    let leftLines: LineDiffChunk[][] = [[]];
    let rightLines: LineDiffChunk[][] = [[]];
    let leftLineIdx = 0;
    let rightLineIdx = 0;

    for (const [op, text] of diffs) {
      if (!text) continue;
      const operation: 'equal' | 'delete' | 'insert' = op === -1 ? 'delete' : op === 1 ? 'insert' : 'equal';
      const lines = text.split(/\r?\n/);

      for (let i = 0; i < lines.length; i++) {
        const chunkText = lines[i];
        const hasLineBreak = i < lines.length - 1;

        if (operation !== 'insert') {
          if (!leftLines[leftLineIdx]) leftLines[leftLineIdx] = [];
          leftLines[leftLineIdx].push({ op: operation === 'equal' ? 'equal' : 'delete', text: chunkText });
        }
        if (operation !== 'delete') {
          if (!rightLines[rightLineIdx]) rightLines[rightLineIdx] = [];
          rightLines[rightLineIdx].push({ op: operation === 'equal' ? 'equal' : 'insert', text: chunkText });
        }

        if (hasLineBreak) {
          if (operation !== 'insert') {
            leftLineIdx++;
            leftLines[leftLineIdx] = leftLines[leftLineIdx] ?? [];
          }
          if (operation !== 'delete') {
            rightLineIdx++;
            rightLines[rightLineIdx] = rightLines[rightLineIdx] ?? [];
          }
        }
      }
    }

    const max = Math.max(leftLines.length, rightLines.length);
    const inline: LineWithDiff[] = [];
    const sbsL: LineWithDiff[] = [];
    const sbsR: LineWithDiff[] = [];

    for (let i = 0; i < max; i++) {
      const leftChunks = leftLines[i] ?? [];
      const rightChunks = rightLines[i] ?? [];

      const leftOnlyHasEqual = leftChunks.every(c => c.op === 'equal');
      const rightOnlyHasEqual = rightChunks.every(c => c.op === 'equal');
      const bothEqual = leftOnlyHasEqual && rightOnlyHasEqual;

      if (bothEqual) {
        inline.push({ leftNum: i + 1, rightNum: i + 1, left: leftChunks, right: rightChunks });
        sbsL.push({ leftNum: i + 1, rightNum: null, left: leftChunks, right: [] });
        sbsR.push({ leftNum: null, rightNum: i + 1, left: [], right: rightChunks });
      } else {
        const hasLeftContent = leftChunks.some(c => c.text.length);
        const hasRightContent = rightChunks.some(c => c.text.length);

        if (hasLeftContent) {
          inline.push({ leftNum: i + 1, rightNum: null, left: leftChunks, right: [] });
          sbsL.push({ leftNum: i + 1, rightNum: null, left: leftChunks, right: [] });
        } else {
          sbsL.push({ leftNum: null, rightNum: null, left: [], right: [] });
        }

        if (hasRightContent) {
          inline.push({ leftNum: null, rightNum: i + 1, left: [], right: rightChunks });
          sbsR.push({ leftNum: null, rightNum: i + 1, left: [], right: rightChunks });
        } else {
          sbsR.push({ leftNum: null, rightNum: null, left: [], right: [] });
        }
      }
    }

    this.inlineLines.set(inline);
    this.sbsLeftLines.set(sbsL);
    this.sbsRightLines.set(sbsR);
  }

  private buildLinesFromUnified(
    unifiedText: string,
    _added: DiffRange[],
    _deleted: DiffRange[],
    _modified: DiffRange[]
  ): { inline: LineWithDiff[]; sbsLeft: LineWithDiff[]; sbsRight: LineWithDiff[] } {
    if (unifiedText && unifiedText.trim()) {
      const rawA: string[] = [];
      const rawB: string[] = [];
      const unifiedLines = unifiedText.split(/\r?\n/);
      for (const l of unifiedLines) {
        if (l.startsWith('---') || l.startsWith('+++') || l.startsWith('@@')) continue;
        if (l.startsWith('-')) rawA.push(l.slice(1));
        else if (l.startsWith('+')) rawB.push(l.slice(1));
        else if (l.startsWith(' ')) { rawA.push(l.slice(1)); rawB.push(l.slice(1)); }
        else { rawA.push(l); rawB.push(l); }
      }
      return this.processDmpReturnStrings(rawA.join('\n'), rawB.join('\n'));
    }
    return { inline: [], sbsLeft: [], sbsRight: [] };
  }

  private processDmpReturnStrings(a: string, b: string) {
    const diffs = this.runDmp(a, b);
    let leftLines: LineDiffChunk[][] = [[]];
    let rightLines: LineDiffChunk[][] = [[]];
    let leftLineIdx = 0;
    let rightLineIdx = 0;
    for (const [op, text] of diffs) {
      if (!text) continue;
      const operation: 'equal' | 'delete' | 'insert' = op === -1 ? 'delete' : op === 1 ? 'insert' : 'equal';
      const lines = text.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const chunkText = lines[i];
        const hasBreak = i < lines.length - 1;
        if (operation !== 'insert') {
          if (!leftLines[leftLineIdx]) leftLines[leftLineIdx] = [];
          leftLines[leftLineIdx].push({ op: operation === 'equal' ? 'equal' : 'delete', text: chunkText });
        }
        if (operation !== 'delete') {
          if (!rightLines[rightLineIdx]) rightLines[rightLineIdx] = [];
          rightLines[rightLineIdx].push({ op: operation === 'equal' ? 'equal' : 'insert', text: chunkText });
        }
        if (hasBreak) {
          if (operation !== 'insert') { leftLineIdx++; leftLines[leftLineIdx] = []; }
          if (operation !== 'delete') { rightLineIdx++; rightLines[rightLineIdx] = []; }
        }
      }
    }
    const max = Math.max(leftLines.length, rightLines.length);
    const inline: LineWithDiff[] = [];
    const sbsL: LineWithDiff[] = [];
    const sbsR: LineWithDiff[] = [];
    for (let i = 0; i < max; i++) {
      const lc = leftLines[i] ?? [];
      const rc = rightLines[i] ?? [];
      const le = lc.every(c => c.op === 'equal');
      const re = rc.every(c => c.op === 'equal');
      if (le && re) {
        inline.push({ leftNum: i + 1, rightNum: i + 1, left: lc, right: rc });
        sbsL.push({ leftNum: i + 1, rightNum: null, left: lc, right: [] });
        sbsR.push({ leftNum: null, rightNum: i + 1, left: [], right: rc });
      } else {
        const hl = lc.some(c => c.text.length);
        const hr = rc.some(c => c.text.length);
        if (hl) {
          inline.push({ leftNum: i + 1, rightNum: null, left: lc, right: [] });
          sbsL.push({ leftNum: i + 1, rightNum: null, left: lc, right: [] });
        } else {
          sbsL.push({ leftNum: null, rightNum: null, left: [], right: [] });
        }
        if (hr) {
          inline.push({ leftNum: null, rightNum: i + 1, left: [], right: rc });
          sbsR.push({ leftNum: null, rightNum: i + 1, left: [], right: rc });
        } else {
          sbsR.push({ leftNum: null, rightNum: null, left: [], right: [] });
        }
      }
    }
    return { inline, sbsLeft: sbsL, sbsRight: sbsR };
  }

  onScrollLeft(): void {
    if (this.scrollingFrom === 'right') return;
    this.scrollingFrom = 'left';
    if (this.scrollRight?.nativeElement) {
      this.scrollRight.nativeElement.scrollTop = this.scrollLeft.nativeElement.scrollTop;
      this.scrollRight.nativeElement.scrollLeft = this.scrollLeft.nativeElement.scrollLeft;
    }
    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => { this.scrollingFrom = null; }, 80);
  }

  onScrollRight(): void {
    if (this.scrollingFrom === 'left') return;
    this.scrollingFrom = 'right';
    if (this.scrollLeft?.nativeElement) {
      this.scrollLeft.nativeElement.scrollTop = this.scrollRight.nativeElement.scrollTop;
      this.scrollLeft.nativeElement.scrollLeft = this.scrollRight.nativeElement.scrollLeft;
    }
    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
    this.scrollTimeout = setTimeout(() => { this.scrollingFrom = null; }, 80);
  }

  lineHasOp(line: LineWithDiff, op: 'delete' | 'insert'): boolean {
    if (op === 'delete') return line.left.some(c => c.op === 'delete');
    return line.right.some(c => c.op === 'insert');
  }

  lineHasOpSide(line: LineWithDiff, op: 'delete' | 'insert', side: 'left' | 'right'): boolean {
    const chunks = side === 'left' ? line.left : line.right;
    return chunks.some(c => c.op === op);
  }

  trackByLine(_: number, line: LineWithDiff): string {
    return `${line.leftNum ?? 'x'}-${line.rightNum ?? 'x'}-${line.left.map(c => c.op + c.text).join('|')}-${line.right.map(c => c.op + c.text).join('|')}`;
  }

  trackByChunk(_: number, chunk: LineDiffChunk): string {
    return chunk.op + chunk.text;
  }
}
