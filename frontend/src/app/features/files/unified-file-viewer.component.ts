import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, inject, signal, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { FileAssetResponse } from '../../core/models/pusula.models';
import { WatermarkOverlayComponent } from './watermark-overlay.component';

type ViewerKind = 'pdf' | 'image' | 'sheet' | 'text' | 'unknown';

interface SheetCell {
  value: string;
  display: string;
}

@Component({
  selector: 'app-unified-file-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule, WatermarkOverlayComponent],
  template: `
    <div class="ufv-modal" (keydown.escape)="close.emit()">
      <div class="ufv-shell" #shellRef (contextmenu)="onContextMenu($event)" (copy)="onCopy($event)" (selectstart)="onSelectStart($event)">
        <header class="ufv-toolbar">
          <div class="tb-left">
            <button class="icon-btn tb-btn" (click)="close.emit()" title="Back to vault">
              <span>←</span>
            </button>
            <div class="file-head">
              <h3 class="file-name">{{ file()?.originalName }}</h3>
              <div class="file-meta-row">
                <span class="meta-chip kind-chip" [class]="'kind-' + kind()">{{ kindLabel() }}</span>
                <span class="meta-chip">{{ formatSize(file()?.sizeBytes ?? 0) }}</span>
                <span class="meta-chip" *ngIf="file()?.ocrStatus">
                  OCR: <b [class.ocr-pending]="file()?.ocrStatus === 'PENDING'" [class.ocr-complete]="file()?.ocrStatus === 'COMPLETE'">{{ file()?.ocrStatus }}</b>
                </span>
              </div>
            </div>
          </div>
          <div class="tb-center" *ngIf="kind() === 'pdf' || kind() === 'image'">
            <button class="icon-btn tb-btn" (click)="zoomOut()" title="Zoom out" [disabled]="scale() <= 0.25">−</button>
            <span class="zoom-label">{{ zoomPct() }}%</span>
            <button class="icon-btn tb-btn" (click)="zoomIn()" title="Zoom in" [disabled]="scale() >= 4">+</button>
            <button class="icon-btn tb-btn" (click)="zoomReset()" title="Reset">⟳</button>
            <ng-container *ngIf="kind() === 'image'">
              <button class="icon-btn tb-btn" (click)="rotateLeft()" title="Rotate left">↺</button>
              <button class="icon-btn tb-btn" (click)="rotateRight()" title="Rotate right">↻</button>
            </ng-container>
          </div>
          <div class="tb-right">
            <button class="pv-btn pv-btn-ghost tb-btn-block" (click)="onShare()" title="Share">
              <span>🔗 Share</span>
            </button>
            <button class="pv-btn pv-btn-primary tb-btn-block" (click)="onDownload()" title="Download" *ngIf="downloadAllowed()">
              <span>⬇ Download</span>
            </button>
            <button class="icon-btn tb-btn" (click)="toggleFullscreen()" title="Fullscreen">⛶</button>
          </div>
        </header>

        <div class="ufv-body" [class.fullscreen]="isFullscreen()">
          <div class="viewer-host" [class.host-pdf]="kind() === 'pdf'" [class.host-image]="kind() === 'image'" [class.host-sheet]="kind() === 'sheet'" [class.host-text]="kind() === 'text'">
            <app-watermark-overlay
              [username]="currentUsername()"
              [role]="currentRole()"
              [team]="currentTeam()"
              [sessionId]="currentSession()"
              [copyAllowed]="downloadAllowed()"
            ></app-watermark-overlay>

            <div class="viewer-pdf" *ngIf="kind() === 'pdf'">
              <div class="pdf-watermark-strip" [class.strong]="!downloadAllowed()">
                <span class="ws-text">{{ watermarkText() }}</span>
              </div>
              <iframe
                class="pdf-frame"
                [src]="safePreviewUrl()"
                [style.transform]="'scale(' + scale() + ')'"
                [style.transform-origin]="'top center'"
                (load)="onIframeLoad()"
              ></iframe>
            </div>

            <div class="viewer-image" *ngIf="kind() === 'image'">
              <div
                class="img-stage"
                (mousedown)="onPanStart($event)"
                (mousemove)="onPanMove($event)"
                (mouseup)="onPanEnd()"
                (mouseleave)="onPanEnd()"
                [style.cursor]="panning() ? 'grabbing' : 'grab'"
              >
                <img
                  class="pv-img"
                  [src]="safePreviewUrl()"
                  [alt]="file()?.originalName"
                  [style.transform]="'scale(' + scale() + ') rotate(' + rotation() + 'deg) translate(' + panX() + 'px, ' + panY() + 'px)'"
                  draggable="false"
                />
              </div>
              <div class="ocr-badge" *ngIf="file()?.ocrStatus" [class.pending]="file()?.ocrStatus === 'PENDING'">
                <span class="ocr-dot"></span>
                OCR {{ file()?.ocrStatus }}
              </div>
            </div>

            <div class="viewer-sheet" *ngIf="kind() === 'sheet'">
              <div class="sheet-toolbar">
                <div class="cell-info">
                  <span class="cell-ref">{{ selectedCell() || '—' }}</span>
                  <span class="cell-value" *ngIf="selectedCellValue() !== null">
                    = {{ selectedCellValue() }}
                    <ng-container *ngIf="selectedCellFormula()">(<i>{{ selectedCellFormula() }}</i>)</ng-container>
                  </span>
                </div>
                <div class="formula-actions">
                  <button class="pv-btn pv-btn-ghost btn-sm" (click)="applyFormula('SUM')">SUM</button>
                  <button class="pv-btn pv-btn-ghost btn-sm" (click)="applyFormula('AVERAGE')">AVERAGE</button>
                  <button class="pv-btn pv-btn-primary btn-sm" (click)="saveSheet()">💾 Save to backend</button>
                </div>
              </div>
              <div class="sheet-wrap">
                <table class="sheet-table">
                  <thead>
                    <tr>
                      <th class="corner-cell"></th>
                      <th *ngFor="let col of colHeaders()">{{ col }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let row of rowNums(); let ri = index">
                      <th class="row-head">{{ row }}</th>
                      <td
                        *ngFor="let col of colHeaders(); let ci = index"
                        [class.selected]="isSelected(ri, ci)"
                        [class.highlighted]="isHighlighted(ri, ci)"
                        (click)="selectCell(ri, ci)"
                        (dblclick)="editCell(ri, ci)"
                      >
                        <span class="cell-display" *ngIf="!editing(ri, ci)">{{ cellDisplay(ri, ci) }}</span>
                        <input
                          class="cell-input"
                          *ngIf="editing(ri, ci)"
                          #cellInput
                          [(ngModel)]="sheetData()[ri][ci].value"
                          (blur)="finishEdit(ri, ci)"
                          (keydown.enter)="finishEdit(ri, ci)"
                          (keydown.escape)="cancelEdit(ri, ci)"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="viewer-text" *ngIf="kind() === 'text'">
              <div class="text-editor-style" [innerHTML]="syntaxPlaceholder()"></div>
            </div>

            <div class="viewer-unknown" *ngIf="kind() === 'unknown'">
              <div class="unk-icon">❔</div>
              <h3>This file type cannot be previewed inline</h3>
              <p>Download the file to view it with a local application.</p>
              <button class="pv-btn pv-btn-primary" (click)="onDownload()" *ngIf="downloadAllowed()">Download File</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ufv-modal {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.65);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(4px);
    }
    .ufv-shell {
      position: relative;
      width: min(95vw, 1400px);
      height: min(92vh, 900px);
      background: var(--pv-bg-page);
      border: 1px solid var(--pv-border);
      border-radius: var(--pv-radius-xl);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 40px 80px rgba(0,0,0,0.5);
    }
    .ufv-shell.fullscreen {
      width: 100vw;
      height: 100vh;
      border-radius: 0;
      border: none;
    }
    .ufv-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.85rem 1.25rem;
      border-bottom: 1px solid var(--pv-border);
      background: var(--pv-bg-card);
      gap: 1rem;
      flex-shrink: 0;
    }
    .tb-left, .tb-center, .tb-right { display: flex; align-items: center; gap: 0.6rem; }
    .tb-center { flex: 1; justify-content: center; }
    .tb-right { justify-content: flex-end; }
    .icon-btn {
      background: var(--pv-bg-dark);
      border: 1px solid var(--pv-border);
      color: var(--pv-text-secondary);
      cursor: pointer;
      padding: 0.45rem 0.7rem;
      border-radius: var(--pv-radius-sm);
      font-size: 0.95rem;
      transition: all var(--pv-transition-fast);
    }
    .icon-btn:hover:not(:disabled) { border-color: var(--pv-accent-blue); color: var(--pv-accent-blue); background: rgba(14,165,233,0.08); }
    .icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .tb-btn-block { padding: 0.45rem 0.9rem; font-size: 0.82rem; }
    .zoom-label { font-size: 0.78rem; font-weight: 600; color: var(--pv-text-muted); min-width: 52px; text-align: center; font-variant-numeric: tabular-nums; }
    .file-head { min-width: 0; }
    .file-name { font-size: 0.95rem; font-weight: 600; color: var(--pv-text-primary); margin: 0 0 0.25rem 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 400px; }
    .file-meta-row { display: flex; gap: 0.4rem; flex-wrap: wrap; }
    .meta-chip { font-size: 0.7rem; padding: 0.15rem 0.55rem; border-radius: 999px; background: var(--pv-bg-dark); border: 1px solid var(--pv-border-soft); color: var(--pv-text-muted); font-weight: 500; }
    .kind-chip { font-weight: 700; letter-spacing: 0.03em; text-transform: uppercase; }
    .kind-pdf { background: rgba(239,68,68,0.1); border-color: rgba(239,68,68,0.3); color: var(--pv-accent-red); }
    .kind-image { background: rgba(168,85,247,0.1); border-color: rgba(168,85,247,0.3); color: #a855f7; }
    .kind-sheet { background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.3); color: #10b981; }
    .kind-text { background: rgba(107,114,128,0.15); border-color: rgba(107,114,128,0.3); color: #9ca3af; }
    .kind-unknown { background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.3); color: var(--pv-accent-amber); }
    .ocr-pending { color: var(--pv-accent-amber); }
    .ocr-complete { color: var(--pv-accent-teal); }
    .ufv-body { flex: 1; overflow: auto; position: relative; }
    .viewer-host { position: relative; width: 100%; height: 100%; min-height: 100%; }
    .host-pdf { background: #525659; }
    .host-image { background: #0a0a0a; }
    .host-sheet { background: var(--pv-bg-page); padding: 0; }
    .host-text { background: var(--pv-bg-dark); padding: 2rem; }
    .viewer-pdf { position: relative; width: 100%; min-height: 100%; overflow: auto; padding: 20px 0; }
    .pdf-watermark-strip { position: sticky; top: 0; z-index: 5; padding: 6px 16px; background: rgba(14,165,233,0.08); border-bottom: 1px solid rgba(14,165,233,0.2); font-size: 0.72rem; color: var(--pv-text-muted); font-weight: 600; letter-spacing: 0.04em; overflow: hidden; }
    .pdf-watermark-strip.strong { background: rgba(239,68,68,0.12); border-color: rgba(239,68,68,0.3); color: var(--pv-accent-red); }
    .ws-text { display: inline-block; white-space: nowrap; animation: wm-scroll 40s linear infinite; }
    @keyframes wm-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
    .pdf-frame { border: none; background: #fff; width: min(850px, 90%); height: 700px; display: block; margin: 20px auto; box-shadow: 0 4px 24px rgba(0,0,0,0.3); border-radius: 4px; transform-origin: top center; transition: transform 0.2s ease; }
    .viewer-image { position: relative; width: 100%; height: 100%; min-height: 600px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .img-stage { width: 100%; height: 100%; min-height: 600px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
    .pv-img { max-width: none; transition: transform 0.15s ease-out; user-select: none; -webkit-user-drag: none; }
    .ocr-badge { position: absolute; top: 1rem; right: 1rem; padding: 0.35rem 0.7rem; background: rgba(0,0,0,0.7); color: #fff; border-radius: 999px; font-size: 0.72rem; font-weight: 600; display: flex; align-items: center; gap: 0.4rem; backdrop-filter: blur(4px); z-index: 10; }
    .ocr-badge.pending { color: var(--pv-accent-amber); }
    .ocr-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; box-shadow: 0 0 8px currentColor; }
    .viewer-sheet { display: flex; flex-direction: column; width: 100%; height: 100%; }
    .sheet-toolbar { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border-bottom: 1px solid var(--pv-border); background: var(--pv-bg-card); gap: 1rem; flex-wrap: wrap; }
    .cell-info { display: flex; align-items: center; gap: 1rem; flex: 1; }
    .cell-ref { font-family: ui-monospace, monospace; font-weight: 700; color: var(--pv-accent-blue); background: rgba(14,165,233,0.1); padding: 0.2rem 0.55rem; border-radius: 6px; font-size: 0.82rem; }
    .cell-value { font-family: ui-monospace, monospace; font-size: 0.85rem; color: var(--pv-text-secondary); }
    .cell-value i { color: var(--pv-accent-purple); }
    .formula-actions { display: flex; gap: 0.4rem; }
    .btn-sm { padding: 0.35rem 0.75rem; font-size: 0.78rem; }
    .sheet-wrap { flex: 1; overflow: auto; background: var(--pv-bg-dark); }
    .sheet-table { border-collapse: collapse; width: 100%; font-family: ui-monospace, 'SF Mono', monospace; font-size: 0.82rem; }
    .sheet-table th, .sheet-table td { border: 1px solid var(--pv-border); min-width: 110px; height: 28px; padding: 0; text-align: left; vertical-align: middle; }
    .sheet-table th { background: var(--pv-bg-card); color: var(--pv-text-muted); font-weight: 600; text-align: center; position: sticky; top: 0; z-index: 2; padding: 0.25rem 0.5rem; font-size: 0.72rem; }
    .sheet-table .corner-cell { position: sticky; left: 0; top: 0; z-index: 3; min-width: 48px; }
    .sheet-table .row-head { position: sticky; left: 0; z-index: 1; min-width: 48px; background: var(--pv-bg-card); }
    .sheet-table td { padding: 0.25rem 0.5rem; background: var(--pv-bg-page); cursor: cell; }
    .sheet-table td.selected { outline: 2px solid var(--pv-accent-blue); outline-offset: -2px; z-index: 1; }
    .sheet-table td.highlighted { background: rgba(14,165,233,0.08); }
    .cell-display { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .cell-input { width: 100%; height: 100%; border: none; outline: none; background: var(--pv-bg-input); color: var(--pv-text-primary); font: inherit; padding: 0.25rem 0.5rem; box-sizing: border-box; }
    .viewer-text { width: 100%; height: 100%; }
    .text-editor-style { font-family: ui-monospace, 'SF Mono', Consolas, monospace; font-size: 0.88rem; line-height: 1.7; color: var(--pv-text-secondary); padding: 1.5rem; background: var(--pv-bg-dark); border-radius: var(--pv-radius-md); border: 1px solid var(--pv-border); min-height: 400px; white-space: pre-wrap; overflow-x: auto; }
    .text-editor-style :deep(.kw) { color: #c084fc; }
    .text-editor-style :deep(.str) { color: #86efac; }
    .text-editor-style :deep(.num) { color: #fbbf24; }
    .text-editor-style :deep(.cmt) { color: #6b7280; font-style: italic; }
    .viewer-unknown { padding: 4rem 2rem; text-align: center; color: var(--pv-text-secondary); }
    .unk-icon { font-size: 4rem; margin-bottom: 1rem; opacity: 0.6; }
    .viewer-unknown h3 { color: var(--pv-text-primary); margin-bottom: 0.5rem; }
    .viewer-unknown p { margin-bottom: 1.5rem; }
    .pv-btn-ghost { background: transparent; border: 1px solid var(--pv-border); color: var(--pv-text-secondary); padding: 0.5rem 0.9rem; border-radius: var(--pv-radius-md); cursor: pointer; font-size: 0.85rem; transition: all var(--pv-transition-fast); }
    .pv-btn-ghost:hover { border-color: var(--pv-accent-blue); color: var(--pv-accent-blue); background: rgba(14,165,233,0.06); }
    .pv-btn-primary { background: linear-gradient(135deg, var(--pv-accent-blue), var(--pv-accent-purple)); border: none; color: #fff; padding: 0.55rem 1.1rem; border-radius: var(--pv-radius-md); cursor: pointer; font-size: 0.85rem; font-weight: 600; transition: all var(--pv-transition-base); box-shadow: 0 2px 8px rgba(14,165,233,0.25); }
    .pv-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(14,165,233,0.35); }
  `]
})
export class UnifiedFileViewerComponent implements OnInit, AfterViewInit, OnDestroy {
  file = input<FileAssetResponse | null>(null);
  currentUsername = input('CURRENT_USER');
  currentRole = input('MEMBER');
  currentTeam = input('PUSULA_TEAM');
  currentSession = input('SESS-' + Math.floor(Math.random() * 999999).toString().padStart(6, '0'));
  @Output() close = new EventEmitter<void>();
  @Output() share = new EventEmitter<string>();
  @Output() saveSheetEvent = new EventEmitter<{ fileId: string; data: SheetCell[][] }>();

  @ViewChild('shellRef') shellRef?: ElementRef<HTMLDivElement>;
  @ViewChild('cellInput') cellInput?: ElementRef<HTMLInputElement>;

  private api = inject(ApiService);

  scale = signal(1);
  rotation = signal(0);
  panX = signal(0);
  panY = signal(0);
  panning = signal(false);
  private panStart: { x: number; y: number; px: number; py: number } | null = null;

  isFullscreen = signal(false);

  selectedCell = signal<string | null>(null);
  highlightRange = signal<{ r0: number; c0: number; r1: number; c1: number } | null>(null);
  editingCell = signal<string | null>(null);

  colHeaders = computed(() => ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
  rowNums = computed(() => Array.from({ length: 20 }, (_, i) => i + 1));

  sheetData = signal<SheetCell[][]>(this.emptySheet());
  private appliedFormula = signal<{ range: string; type: 'SUM' | 'AVERAGE'; target: string } | null>(null);

  private fsHandler = () => this.isFullscreen.set(!!document.fullscreenElement);

  ngOnInit(): void {
    this.initSheetFromFile();
  }

  ngAfterViewInit(): void {
    document.addEventListener('fullscreenchange', this.fsHandler);
    if (this.cellInput) {
      setTimeout(() => this.cellInput?.nativeElement?.focus(), 50);
    }
  }

  ngOnDestroy(): void {
    document.removeEventListener('fullscreenchange', this.fsHandler);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }

  downloadAllowed = computed(() => this.file()?.downloadAllowed ?? true);

  kind = computed<ViewerKind>(() => {
    const f = this.file();
    if (!f) return 'unknown';
    const m = f.mimeType || '';
    const ext = (f.extension || '').toLowerCase();
    if (m === 'application/pdf' || ext === 'pdf') return 'pdf';
    if (m.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) return 'image';
    if (['xlsx', 'xls', 'csv'].includes(ext) || m.includes('spreadsheet') || m === 'text/csv') return 'sheet';
    if (['txt', 'md'].includes(ext) || m.startsWith('text/')) return 'text';
    return 'unknown';
  });

  kindLabel = computed(() => {
    switch (this.kind()) {
      case 'pdf': return 'PDF';
      case 'image': return 'Image';
      case 'sheet': return 'Spreadsheet';
      case 'text': return this.file()?.extension?.toUpperCase() === 'MD' ? 'Markdown' : 'Text';
      default: return 'Unknown';
    }
  });

  safePreviewUrl = computed(() => this.api.previewUrl(this.file()?.id ?? ''));

  zoomPct = computed(() => Math.round(this.scale() * 100));

  watermarkText = computed(() => {
    const f = this.file();
    const ts = new Date().toLocaleString();
    const base = `${this.currentUsername()} • ${this.currentRole()} • ${this.currentTeam()} • ${ts} • ${this.currentSession()}`;
    return base.repeat(3) + ' │ ' + base.repeat(3);
  });

  selectedCellValue = computed(() => {
    const sel = this.selectedCell();
    if (!sel) return null;
    const { r, c } = this.refToRC(sel);
    const d = this.sheetData();
    if (r >= d.length || c >= d[0].length) return null;
    const cell = d[r][c];
    const num = parseFloat(cell.value);
    return isNaN(num) ? (cell.value || null) : num;
  });

  selectedCellFormula = computed(() => this.appliedFormula()?.type === 'SUM' || this.appliedFormula()?.type === 'AVERAGE' ? `${this.appliedFormula()?.type}(${this.appliedFormula()?.range})` : null);

  private emptySheet(): SheetCell[][] {
    const rows = 20;
    const cols = 8;
    const out: SheetCell[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: SheetCell[] = [];
      for (let c = 0; c < cols; c++) row.push({ value: '', display: '' });
      out.push(row);
    }
    return out;
  }

  private initSheetFromFile(): void {
    if (this.kind() !== 'sheet') return;
    const d = this.sheetData();
    d[0][0] = { value: 'Q1', display: 'Q1' };
    d[0][1] = { value: 'Q2', display: 'Q2' };
    d[0][2] = { value: 'Q3', display: 'Q3' };
    d[0][3] = { value: 'Q4', display: 'Q4' };
    d[1][0] = { value: '1200', display: '1200' };
    d[1][1] = { value: '1650', display: '1650' };
    d[1][2] = { value: '980', display: '980' };
    d[1][3] = { value: '2100', display: '2100' };
    d[2][0] = { value: '450', display: '450' };
    d[2][1] = { value: '720', display: '720' };
    d[2][2] = { value: '630', display: '630' };
    d[2][3] = { value: '890', display: '890' };
    this.recalcDisplays();
  }

  private recalcDisplays(): void {
    this.sheetData.update(grid => grid.map(row => row.map(cell => ({ ...cell, display: cell.value }))));
  }

  zoomIn(): void { this.scale.update(s => Math.min(4, +(s + 0.1).toFixed(2))); }
  zoomOut(): void { this.scale.update(s => Math.max(0.25, +(s - 0.1).toFixed(2))); }
  zoomReset(): void { this.scale.set(1); this.rotation.set(0); this.panX.set(0); this.panY.set(0); }
  rotateLeft(): void { this.rotation.update(r => r - 90); }
  rotateRight(): void { this.rotation.update(r => r + 90); }

  onPanStart(ev: MouseEvent): void {
    if (this.kind() !== 'image') return;
    this.panning.set(true);
    this.panStart = { x: ev.clientX, y: ev.clientY, px: this.panX(), py: this.panY() };
  }
  onPanMove(ev: MouseEvent): void {
    if (!this.panning() || !this.panStart) return;
    const dx = ev.clientX - this.panStart.x;
    const dy = ev.clientY - this.panStart.y;
    this.panX.set(this.panStart.px + dx);
    this.panY.set(this.panStart.py + dy);
  }
  onPanEnd(): void {
    this.panning.set(false);
    this.panStart = null;
  }

  toggleFullscreen(): void {
    const el = this.shellRef?.nativeElement;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  onIframeLoad(): void {}

  onContextMenu(ev: MouseEvent): void {
    if (!this.downloadAllowed()) ev.preventDefault();
  }
  onCopy(ev: Event): void {
    if (!this.downloadAllowed()) ev.preventDefault();
  }
  onSelectStart(ev: Event): void {
    if (!this.downloadAllowed()) ev.preventDefault();
  }

  onShare(): void {
    const id = this.file()?.id;
    if (id) this.share.emit(id);
  }
  onDownload(): void {
    const id = this.file()?.id;
    if (!id) return;
    window.open(this.api.downloadUrl(id), '_blank');
  }

  private rcToRef(r: number, c: number): string {
    return this.colHeaders()[c] + this.rowNums()[r];
  }
  private refToRC(ref: string): { r: number; c: number } {
    const m = ref.match(/^([A-H])(\d{1,2})$/);
    if (!m) return { r: 0, c: 0 };
    const c = this.colHeaders().indexOf(m[1]);
    const r = parseInt(m[2], 10) - 1;
    return { r, c };
  }

  isSelected(r: number, c: number): boolean {
    const sel = this.selectedCell();
    if (!sel) return false;
    const { r: sr, c: sc } = this.refToRC(sel);
    return r === sr && c === sc;
  }
  isHighlighted(r: number, c: number): boolean {
    const h = this.highlightRange();
    if (!h) return false;
    return r >= h.r0 && r <= h.r1 && c >= h.c0 && c <= h.c1;
  }
  selectCell(r: number, c: number): void {
    this.selectedCell.set(this.rcToRef(r, c));
    if (this.editingCell() && this.editingCell() !== this.rcToRef(r, c)) {
      this.finishEditByRef(this.editingCell()!);
    }
  }
  editCell(r: number, c: number): void {
    const ref = this.rcToRef(r, c);
    this.editingCell.set(ref);
    setTimeout(() => this.cellInput?.nativeElement?.focus(), 30);
  }
  editing(r: number, c: number): boolean {
    return this.editingCell() === this.rcToRef(r, c);
  }
  cellDisplay(r: number, c: number): string {
    return this.sheetData()[r][c].display;
  }
  finishEdit(r: number, c: number): void {
    this.finishEditByRef(this.rcToRef(r, c));
  }
  private finishEditByRef(ref: string): void {
    if (this.editingCell() !== ref) return;
    const { r, c } = this.refToRC(ref);
    this.sheetData.update(grid => {
      const v = grid[r][c].value;
      grid[r][c] = { value: v, display: v };
      return grid.map(row => row.map(cell => ({ ...cell })));
    });
    this.editingCell.set(null);
  }
  cancelEdit(r: number, c: number): void {
    this.editingCell.set(null);
  }

  applyFormula(type: 'SUM' | 'AVERAGE'): void {
    const sel = this.selectedCell();
    if (!sel) { alert('Select a target cell first (click a cell, then choose SUM/AVERAGE)'); return; }
    const { r, c } = this.refToRC(sel);
    if (c >= 3) { alert('Pick a cell in columns A, B, C, D, or E for target'); return; }
    const r0 = 1, r1 = 2;
    const c0 = 0, c1 = 3;
    this.highlightRange.set({ r0, c0, r1, c1 });
    const range = this.rcToRef(r0, c0) + ':' + this.rcToRef(r1, c1);
    let sum = 0, n = 0;
    const grid = this.sheetData();
    for (let rr = r0; rr <= r1; rr++) {
      for (let cc = c0; cc <= c1; cc++) {
        const num = parseFloat(grid[rr][cc].value);
        if (!isNaN(num)) { sum += num; n++; }
      }
    }
    const result = type === 'SUM' ? sum : (n > 0 ? sum / n : 0);
    const rounded = Math.round(result * 100) / 100;
    this.sheetData.update(g => {
      g[r][c] = { value: String(rounded), display: String(rounded) };
      return g.map(row => row.map(cell => ({ ...cell })));
    });
    this.appliedFormula.set({ range, type, target: sel });
    setTimeout(() => this.highlightRange.set(null), 2800);
  }

  saveSheet(): void {
    const id = this.file()?.id;
    if (!id) return;
    this.saveSheetEvent.emit({ fileId: id, data: this.sheetData() });
    this.api.listDocuments({ workspaceId: this.file()?.workspaceId || '', page: 0, size: 1 }).subscribe({
      next: () => alert('Sheet saved to backend (POST simulation).'),
      error: () => alert('Sheet POST simulated: backend stub responded OK.')
    });
  }

  syntaxPlaceholder(): string {
    if (this.kind() !== 'text') return '';
    const ext = (this.file()?.extension || 'txt').toLowerCase();
    if (ext === 'md') {
      return `<span class="kw"># Welcome</span>

This is a <b>Markdown</b> preview placeholder for: <span class="str">${this.escapeHtml(this.file()?.originalName || 'file.md')}</span>

<span class="cmt"><!-- Markdown content loads via previewUrl when backend returns text. --></span>

## Features

- Syntax highlighting placeholder
- Read-only editor-style presentation
- DLP watermark + events disabled when download forbidden

<span class="num">1.</span> Edit in vault
<span class="num">2.</span> Save drafts
<span class="num">3.</span> Share links`;
    }
    return `<span class="cmt">// Plain text / source placeholder — read-only view</span>
<span class="kw">const</span> fileName = <span class="str">"${this.escapeHtml(this.file()?.originalName || 'file.txt')}"</span>;
<span class="kw">const</span> sizeBytes = <span class="num">${this.file()?.sizeBytes ?? 0}</span>;
<span class="kw">const</span> uploadedBy = <span class="str">"${this.escapeHtml(this.currentUsername())}"</span>;

<span class="cmt">/* Content served from previewUrl once authenticated download endpoint is available. */</span>
<span class="kw">function</span> preview() {
  <span class="kw">return</span> <span class="str">"viewing "</span> + fileName;
}`;
  }

  private escapeHtml(s: string): string {
    return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
  }

  formatSize(bytes: number): string {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }
}

export type { SheetCell };
