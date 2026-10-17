import {
  Component,
  Input,
  output,
  inject,
  signal,
  effect,
  viewChild,
  ElementRef,
  HostListener,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { diff_match_patch, Diff } from 'diff-match-patch';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { TonePreset, HumanizeRequest } from '../../core/models/pusula.models';

@Component({
  selector: 'app-humanize-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (open()) {
      <div class="pv-modal-overlay" (click)="onBackdropClick($event)">
        <div class="pv-modal pv-modal-lg fade-in" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="header-left">
              <div class="icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z"/>
                </svg>
              </div>
              <div>
                <h3 class="modal-title">AI Humanize</h3>
                <p class="modal-sub">Refine your text with tone-aware AI rewriting</p>
              </div>
            </div>
            <button class="close-btn" (click)="close()" title="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <div class="controls-row">
              <div class="control-group">
                <label class="pv-label">Writing Tone</label>
                <div class="tone-chips">
                  @for (t of tones; track t) {
                    <button
                      class="tone-chip"
                      [class.active]="selectedTone() === t"
                      (click)="selectedTone.set(t)"
                      [disabled]="streaming()"
                    >
                      {{ toneIcon(t) }} {{ t }}
                    </button>
                  }
                </div>
              </div>

              <div class="control-group preserve-group">
                <label class="preserve-toggle">
                  <input
                    type="checkbox"
                    [checked]="preserveMeaning()"
                    (change)="preserveMeaning.set(!preserveMeaning())"
                    [disabled]="streaming()"
                  />
                  <span>Preserve original meaning strictly</span>
                </label>
              </div>
            </div>

            <div class="panes-container">
              <div class="pane">
                <div class="pane-header">
                  <span class="pane-title">Original Text</span>
                  <span class="char-count">{{ originalText().length }} chars</span>
                </div>
                <textarea
                  class="pv-textarea original-textarea"
                  [ngModel]="originalText()"
                  (ngModelChange)="originalText.set($event)"
                  [disabled]="streaming()"
                  placeholder="Paste or type the text you want to humanize..."
                  rows="14"
                ></textarea>
              </div>

              <div class="pane-divider">
                <div class="divider-line"></div>
                <div class="divider-arrow">→</div>
                <div class="divider-line"></div>
              </div>

              <div class="pane">
                <div class="pane-header">
                  <span class="pane-title">
                    Improved
                    @if (streaming()) {
                      <span class="live-badge">
                        <span class="live-dot"></span> LIVE
                      </span>
                    }
                  </span>
                  <span class="char-count">{{ improvedText().length }} chars</span>
                </div>
                <div class="improved-pane">
                  @if (showDiff() && improvedText()) {
                    <div class="diff-viewer" [innerHTML]="diffHtml()"></div>
                  } @else {
                    <textarea
                      class="pv-textarea improved-textarea"
                      [ngModel]="improvedText()"
                      (ngModelChange)="improvedText.set($event)"
                      placeholder="AI-improved text will appear here..."
                      rows="14"
                    ></textarea>
                  }
                  @if (!improvedText() && !streaming()) {
                    <div class="empty-hint">
                      <div class="hint-icon">✨</div>
                      <p>Click <strong>Humanize</strong> to rewrite with AI</p>
                    </div>
                  }
                </div>
                <div class="pane-footer">
                  <label class="diff-toggle">
                    <input
                      type="checkbox"
                      [checked]="showDiff()"
                      (change)="showDiff.set(!showDiff())"
                    />
                    <span>Show inline diff</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="pv-btn pv-btn-ghost" (click)="close()" [disabled]="streaming()">
              Cancel
            </button>

            <div class="spacer"></div>

            @if (improvedText() && !streaming()) {
              <button class="pv-btn pv-btn-outline" (click)="regenerate()" [disabled]="!originalText()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 4 23 10 17 10"/>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                </svg>
                Regenerate
              </button>
              <button class="pv-btn pv-btn-ghost copy-btn" (click)="copyToClipboard()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
                {{ copyBtnText() }}
              </button>
            }

            @if (!streaming()) {
              <button
                class="pv-btn pv-btn-primary"
                (click)="runHumanize()"
                [disabled]="!originalText().trim()"
              >
                <span class="sparkle">✨</span>
                {{ improvedText() ? 'Humanize Again' : 'Humanize' }}
              </button>
            } @else {
              <div class="streaming-actions">
                <span class="streaming-label">
                  <span class="stream-spinner"></span>
                  Rewriting in <strong>{{ selectedTone() }}</strong> tone...
                </span>
                <button class="pv-btn pv-btn-danger" (click)="cancelStream()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Cancel
                </button>
              </div>
            }

            @if (improvedText() && !streaming()) {
              <button class="pv-btn pv-btn-primary" (click)="insert()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Insert
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem 1.75rem;
      border-bottom: 1px solid var(--pv-border);
      background: linear-gradient(180deg, rgba(139, 92, 246, 0.06), transparent);
    }
    .header-left { display: flex; align-items: center; gap: 1rem; }
    .icon-wrap {
      width: 44px; height: 44px;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.18), rgba(14, 165, 233, 0.12));
      border: 1px solid rgba(139, 92, 246, 0.35);
      border-radius: var(--pv-radius-md);
      color: var(--pv-accent-purple);
      box-shadow: 0 0 24px rgba(139, 92, 246, 0.15);
    }
    .modal-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--pv-text-primary);
      letter-spacing: -0.01em;
    }
    .modal-sub {
      font-size: 0.82rem;
      color: var(--pv-text-muted);
      margin-top: 0.1rem;
    }
    .close-btn {
      width: 38px; height: 38px;
      display: flex; align-items: center; justify-content: center;
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--pv-radius-sm);
      color: var(--pv-text-muted);
      cursor: pointer;
      transition: all var(--pv-transition-fast);
    }
    .close-btn:hover {
      background: var(--pv-bg-card-hover);
      color: var(--pv-text-primary);
      border-color: var(--pv-border);
    }

    .modal-body { padding: 1.5rem 1.75rem; }

    .controls-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1.5rem;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
    }
    .control-group { display: flex; flex-direction: column; gap: 0.5rem; }
    .tone-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }
    .tone-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.42rem 0.85rem;
      background: var(--pv-bg-dark);
      border: 1px solid var(--pv-border);
      border-radius: 999px;
      color: var(--pv-text-secondary);
      font-size: 0.8rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      transition: all var(--pv-transition-fast);
    }
    .tone-chip:hover:not(:disabled) {
      background: var(--pv-bg-card-hover);
      border-color: var(--pv-accent-blue);
      color: var(--pv-text-primary);
      transform: translateY(-1px);
    }
    .tone-chip.active {
      background: linear-gradient(135deg, rgba(14, 165, 233, 0.18), rgba(139, 92, 246, 0.18));
      border-color: rgba(14, 165, 233, 0.55);
      color: var(--pv-accent-blue);
      box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.08);
    }
    .tone-chip:disabled { opacity: 0.55; cursor: not-allowed; }
    .preserve-group { justify-content: flex-end; }
    .preserve-toggle {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.45rem 0.85rem;
      background: var(--pv-bg-dark);
      border: 1px solid var(--pv-border);
      border-radius: var(--pv-radius-md);
      color: var(--pv-text-secondary);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--pv-transition-fast);
    }
    .preserve-toggle:hover { border-color: var(--pv-accent-teal); color: var(--pv-text-primary); }
    .preserve-toggle input { accent-color: var(--pv-accent-teal); }

    .panes-container {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 0;
      align-items: stretch;
    }
    .pane {
      display: flex;
      flex-direction: column;
      background: var(--pv-bg-dark);
      border: 1px solid var(--pv-border);
      border-radius: var(--pv-radius-lg);
      overflow: hidden;
    }
    .pane:first-child { border-top-right-radius: 0; border-bottom-right-radius: 0; }
    .pane:last-child { border-top-left-radius: 0; border-bottom-left-radius: 0; }
    .pane-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--pv-border);
      background: linear-gradient(180deg, var(--pv-bg-mid), transparent);
    }
    .pane-title {
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--pv-text-muted);
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    .live-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.1rem 0.55rem;
      background: rgba(220, 38, 38, 0.15);
      border: 1px solid rgba(220, 38, 38, 0.4);
      border-radius: 999px;
      color: var(--pv-accent-red);
      font-size: 0.65rem;
      font-weight: 800;
      letter-spacing: 0.08em;
    }
    .live-dot {
      width: 6px; height: 6px;
      background: var(--pv-accent-red);
      border-radius: 50%;
      animation: livePulse 1.2s ease-in-out infinite;
    }
    @keyframes livePulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50%      { opacity: 0.4; transform: scale(0.85); }
    }
    .char-count {
      font-size: 0.7rem;
      font-family: ui-monospace, monospace;
      color: var(--pv-text-subtle);
      padding: 0.15rem 0.5rem;
      background: rgba(10, 22, 40, 0.6);
      border-radius: 5px;
    }
    .original-textarea, .improved-textarea {
      border: none;
      border-radius: 0;
      background: transparent;
      padding: 1rem 1.1rem;
      font-size: 0.9rem;
      line-height: 1.65;
      resize: none;
    }
    .improved-pane {
      position: relative;
      flex: 1;
      min-height: 280px;
      display: flex;
      flex-direction: column;
    }
    .improved-textarea { flex: 1; }
    .diff-viewer {
      padding: 1rem 1.1rem;
      font-size: 0.9rem;
      line-height: 1.65;
      color: var(--pv-text-secondary);
      white-space: pre-wrap;
      word-break: break-word;
      flex: 1;
      overflow-y: auto;
      min-height: 280px;
    }
    .diff-viewer ins {
      background: rgba(20, 184, 166, 0.15);
      color: var(--pv-accent-teal);
      text-decoration: none;
      padding: 0.05rem 0.15rem;
      border-radius: 3px;
      border-bottom: 2px solid rgba(20, 184, 166, 0.55);
    }
    .diff-viewer del {
      background: rgba(220, 38, 38, 0.12);
      color: var(--pv-accent-red);
      text-decoration: line-through;
      text-decoration-color: rgba(220, 38, 38, 0.55);
      padding: 0.05rem 0.15rem;
      border-radius: 3px;
      opacity: 0.88;
    }
    .empty-hint {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      pointer-events: none;
      color: var(--pv-text-subtle);
    }
    .hint-icon { font-size: 2.4rem; opacity: 0.6; animation: hintBob 3s ease-in-out infinite; }
    @keyframes hintBob {
      0%, 100% { transform: translateY(0); }
      50%      { transform: translateY(-4px); }
    }
    .empty-hint p { font-size: 0.85rem; }
    .pane-footer {
      padding: 0.55rem 1rem;
      border-top: 1px solid var(--pv-border-soft);
      background: rgba(10, 22, 40, 0.5);
    }
    .diff-toggle {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--pv-text-muted);
      cursor: pointer;
    }
    .diff-toggle input { accent-color: var(--pv-accent-purple); }

    .pane-divider {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 0 0.4rem;
    }
    .divider-line {
      flex: 1;
      width: 1px;
      background: linear-gradient(180deg, transparent, var(--pv-border), transparent);
    }
    .divider-arrow {
      width: 32px; height: 32px;
      display: flex; align-items: center; justify-content: center;
      background: var(--pv-bg-elevated);
      border: 1px solid var(--pv-border);
      border-radius: 50%;
      color: var(--pv-accent-blue);
      font-size: 0.85rem;
      font-weight: 800;
      box-shadow: var(--pv-shadow-card);
    }

    .modal-footer {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 1.2rem 1.75rem;
      border-top: 1px solid var(--pv-border);
      background: linear-gradient(0deg, rgba(0,0,0,0.2), transparent);
    }
    .spacer { flex: 1; }
    .copy-btn { min-width: 110px; justify-content: center; }
    .sparkle {
      font-size: 0.95rem;
      animation: sparklePulse 1.8s ease-in-out infinite;
    }
    @keyframes sparklePulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50%      { transform: scale(1.15); opacity: 0.8; }
    }
    .streaming-actions {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      margin-left: auto;
    }
    .streaming-label {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 0.82rem;
      color: var(--pv-text-secondary);
    }
    .stream-spinner {
      width: 16px; height: 16px;
      border: 2px solid var(--pv-border);
      border-top-color: var(--pv-accent-blue);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class HumanizeModalComponent implements OnDestroy {
  @Input() open = signal(false);
  @Input() initialText = '';
  @Input() documentId: string | undefined;

  openChange = output<boolean>();
  close = output();
  insert = output<string>();

  private api = inject(ApiService);
  private sanitizer = inject(DomSanitizer);

  originalText = signal('');
  improvedText = signal('');
  selectedTone = signal<TonePreset>('Professional');
  preserveMeaning = signal(true);
  streaming = signal(false);
  showDiff = signal(true);
  copyBtnText = signal('Copy');

  tones: TonePreset[] = ['Professional', 'Technical', 'Conversational', 'Concise', 'Formal'];

  private streamSub: Subscription | null = null;
  private dmp = new diff_match_patch();

  diffHtml = signal<SafeHtml>('');

  constructor() {
    effect(() => {
      if (this.open()) {
        if (this.initialText && !this.originalText()) {
          this.originalText.set(this.initialText);
        }
      }
    });

    effect(() => {
      const orig = this.originalText();
      const imp = this.improvedText();
      if (orig && imp && this.showDiff()) {
        this.computeDiff(orig, imp);
      } else {
        this.diffHtml.set('');
      }
    });
  }

  toneIcon(t: TonePreset): string {
    switch (t) {
      case 'Professional': return '💼';
      case 'Technical':    return '⚙️';
      case 'Conversational': return '💬';
      case 'Concise':      return '✂️';
      case 'Formal':       return '🎩';
    }
  }

  private computeDiff(original: string, improved: string) {
    try {
      const diffs: Diff[] = this.dmp.diff_main(original, improved);
      this.dmp.diff_cleanupSemantic(diffs);

      let html = '';
      for (const [op, text] of diffs) {
        const escaped = this.escapeHtml(text);
        if (op === 1) {
          html += `<ins>${escaped}</ins>`;
        } else if (op === -1) {
          html += `<del>${escaped}</del>`;
        } else {
          html += escaped;
        }
      }
      this.diffHtml.set(this.sanitizer.bypassSecurityTrustHtml(html));
    } catch {
      this.diffHtml.set(this.sanitizer.bypassSecurityTrustHtml(this.escapeHtml(improved)));
    }
  }

  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  runHumanize() {
    const text = this.originalText().trim();
    if (!text || this.streaming()) return;

    this.improvedText.set('');
    this.streaming.set(true);

    const req: HumanizeRequest = {
      text,
      tone: this.selectedTone(),
      documentId: this.documentId,
      preserveMeaning: this.preserveMeaning(),
    };

    this.streamSub = this.api.humanizeStream(req).subscribe({
      next: (chunk) => {
        this.improvedText.update(prev => prev + chunk);
      },
      error: (err) => {
        console.error('Humanize stream error:', err);
        this.streaming.set(false);
        this.streamSub = null;
      },
      complete: () => {
        this.streaming.set(false);
        this.streamSub = null;
      }
    });
  }

  regenerate() {
    this.runHumanize();
  }

  cancelStream() {
    this.streamSub?.unsubscribe();
    this.streamSub = null;
    this.streaming.set(false);
  }

  async copyToClipboard() {
    const text = this.improvedText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      this.copyBtnText.set('Copied ✓');
      window.setTimeout(() => this.copyBtnText.set('Copy'), 1800);
    } catch (e) {
      console.error('Clipboard error:', e);
    }
  }

  onBackdropClick(e: MouseEvent) {
    if (this.streaming()) return;
    this.close();
  }

  closeModal() {
    this.cancelStream();
    this.open.set(false);
    this.openChange.emit(false);
    this.close.emit();
  }

  close() {
    this.closeModal();
  }

  doInsert() {
    const text = this.improvedText();
    if (!text) return;
    this.insert.emit(text);
    this.closeModal();
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.open() && !this.streaming()) this.closeModal();
  }

  ngOnDestroy() {
    this.cancelStream();
  }
}
