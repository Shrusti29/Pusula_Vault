import {
  Component,
  Input,
  output,
  inject,
  signal,
  effect,
  ElementRef,
  viewChild,
  HostListener,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { TonePreset, HumanizeRequest } from '../../core/models/pusula.models';

@Component({
  selector: 'app-humanize-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (visible()) {
      <div
        #toolbarEl
        class="humanize-toolbar slide-in-up"
        [style.left.px]="position().x"
        [style.top.px]="position().y"
      >
        <div class="toolbar-inner">
          <div class="toolbar-group">
            <label class="tone-label">Tone</label>
            <select
              class="tone-select pv-select"
              [(ngModel)]="selectedTone"
              [disabled]="streaming()"
            >
              @for (t of tones; track t) {
                <option [value]="t">{{ t }}</option>
              }
            </select>
          </div>

          <span class="toolbar-divider"></span>

          @if (!streaming()) {
            <button
              class="humanize-btn"
              (click)="runHumanize()"
              [disabled]="!selectedText()"
              title="Humanize selection"
            >
              <span class="sparkle">✨</span>
              <span>Humanize</span>
            </button>
          } @else {
            <div class="streaming-indicator">
              <div class="stream-dots">
                <span></span><span></span><span></span>
              </div>
              <span class="stream-text">Humanizing...</span>
            </div>
            <button
              class="cancel-btn pv-btn-ghost"
              (click)="cancelStream()"
              title="Cancel"
            >
              Cancel
            </button>
          }
        </div>
        <div class="toolbar-arrow"></div>
      </div>
    }
  `,
  styles: [`
    .humanize-toolbar {
      position: fixed;
      z-index: 1000;
      pointer-events: auto;
      transform: translateX(-50%);
    }
    .toolbar-inner {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.5rem 0.75rem;
      background: linear-gradient(180deg, var(--pv-bg-elevated) 0%, var(--pv-bg-card) 100%);
      border: 1px solid var(--pv-border);
      border-radius: var(--pv-radius-lg);
      box-shadow: var(--pv-shadow-lg), var(--pv-shadow-glow-blue);
      backdrop-filter: blur(12px);
    }
    .toolbar-arrow {
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%) rotate(45deg);
      width: 12px;
      height: 12px;
      background: var(--pv-bg-card);
      border-right: 1px solid var(--pv-border);
      border-bottom: 1px solid var(--pv-border);
    }
    .toolbar-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .tone-label {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--pv-text-muted);
    }
    .tone-select {
      width: auto;
      min-width: 130px;
      padding: 0.4rem 0.75rem;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .toolbar-divider {
      width: 1px;
      height: 24px;
      background: var(--pv-border);
    }
    .humanize-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.45rem 0.95rem;
      background: linear-gradient(135deg, var(--pv-accent-purple) 0%, #6d28d9 100%);
      color: white;
      border: 1px solid rgba(139, 92, 246, 0.4);
      border-radius: var(--pv-radius-md);
      font-size: 0.82rem;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: all var(--pv-transition-fast);
      box-shadow: 0 4px 14px rgba(139, 92, 246, 0.3);
    }
    .humanize-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 8px 24px rgba(139, 92, 246, 0.45);
      filter: brightness(1.08);
    }
    .humanize-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .sparkle {
      font-size: 0.9rem;
      animation: sparklePulse 1.6s ease-in-out infinite;
    }
    @keyframes sparklePulse {
      0%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
      50%      { transform: scale(1.15) rotate(10deg); opacity: 0.85; }
    }
    .streaming-indicator {
      display: inline-flex;
      align-items: center;
      gap: 0.55rem;
      padding: 0.45rem 0.85rem;
      background: rgba(14, 165, 233, 0.1);
      border: 1px solid rgba(14, 165, 233, 0.3);
      border-radius: var(--pv-radius-md);
    }
    .stream-dots {
      display: inline-flex;
      gap: 3px;
    }
    .stream-dots span {
      width: 6px;
      height: 6px;
      background: var(--pv-accent-blue);
      border-radius: 50%;
      animation: streamBounce 1.2s ease-in-out infinite;
    }
    .stream-dots span:nth-child(2) { animation-delay: 0.15s; }
    .stream-dots span:nth-child(3) { animation-delay: 0.3s; }
    @keyframes streamBounce {
      0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
      40%           { transform: scale(1);   opacity: 1; }
    }
    .stream-text {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--pv-accent-blue);
      letter-spacing: 0.01em;
    }
    .cancel-btn {
      padding: 0.4rem 0.8rem;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--pv-accent-red);
      border-color: rgba(220, 38, 38, 0.3);
    }
    .cancel-btn:hover {
      background: rgba(220, 38, 38, 0.1);
      border-color: var(--pv-accent-red);
      color: var(--pv-accent-red-hover);
    }
  `]
})
export class HumanizeToolbarComponent implements OnDestroy {
  @Input() hostElement: HTMLElement | null = null;
  @Input() editorInstance: unknown = null;
  @Input() documentId: string | undefined;
  @Input() preserveMeaning = true;

  insertText = output<string>();
  streamStarted = output();
  streamCancelled = output();
  streamCompleted = output<string>();

  private api = inject(ApiService);
  private elRef = inject(ElementRef);

  toolbarEl = viewChild<ElementRef<HTMLDivElement>>('toolbarEl');

  visible = signal(false);
  streaming = signal(false);
  selectedText = signal('');
  selectedTone = signal<TonePreset>('Professional');
  position = signal({ x: 0, y: 0 });
  resultText = signal('');

  tones: TonePreset[] = ['Professional', 'Technical', 'Conversational', 'Concise', 'Formal'];

  private streamSub: Subscription | null = null;
  private checkSelectionTimer: number | null = null;

  constructor() {
    effect(() => {
      if (this.visible() && this.toolbarEl()) {
        requestAnimationFrame(() => this.reposition());
      }
    });
  }

  @HostListener('document:selectionchange')
  onSelectionChange() {
    if (this.checkSelectionTimer) {
      window.clearTimeout(this.checkSelectionTimer);
    }
    this.checkSelectionTimer = window.setTimeout(() => this.checkSelection(), 60);
  }

  @HostListener('document:mousedown', ['$event'])
  onDocMouseDown(e: MouseEvent) {
    const t = e.target as Node;
    if (this.toolbarEl()?.nativeElement?.contains(t)) return;
    if (this.streaming()) return;
    window.setTimeout(() => this.checkSelection(), 10);
  }

  private checkSelection() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
      this.visible.set(false);
      this.selectedText.set('');
      return;
    }

    const range = sel.getRangeAt(0);
    const text = sel.toString().trim();
    if (!text || text.length < 2) {
      this.visible.set(false);
      this.selectedText.set('');
      return;
    }

    if (this.hostElement) {
      if (!this.hostElement.contains(range.commonAncestorContainer)) {
        this.visible.set(false);
        this.selectedText.set('');
        return;
      }
    }

    this.selectedText.set(text);
    this.visible.set(true);
    this.updatePositionFromRange(range);
  }

  private updatePositionFromRange(range: Range) {
    try {
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      let y = rect.top - 16;
      const x = rect.left + rect.width / 2;

      const toolbarHeight = 60;
      if (y - toolbarHeight < 10) {
        y = rect.bottom + 16;
      }

      const toolbarWidth = 420;
      const clampedX = Math.max(toolbarWidth / 2 + 12, Math.min(window.innerWidth - toolbarWidth / 2 - 12, x));

      this.position.set({ x: clampedX, y: y - toolbarHeight });
    } catch {
      // noop
    }
  }

  private reposition() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    this.updatePositionFromRange(sel.getRangeAt(0));
  }

  runHumanize() {
    const text = this.selectedText();
    if (!text || this.streaming()) return;

    this.streaming.set(true);
    this.resultText.set('');
    this.streamStarted.emit();

    const req: HumanizeRequest = {
      text,
      tone: this.selectedTone(),
      documentId: this.documentId,
      preserveMeaning: this.preserveMeaning,
    };

    this.streamSub = this.api.humanizeStream(req).subscribe({
      next: (chunk) => {
        this.resultText.update(prev => prev + chunk);
      },
      error: (err) => {
        console.error('Humanize stream error:', err);
        this.streaming.set(false);
        this.streamSub = null;
      },
      complete: () => {
        this.streaming.set(false);
        const final = this.resultText();
        if (final) {
          this.insertText.emit(final);
          this.streamCompleted.emit(final);
        }
        this.streamSub = null;
      }
    });
  }

  cancelStream() {
    this.streamSub?.unsubscribe();
    this.streamSub = null;
    this.streaming.set(false);
    this.streamCancelled.emit();
  }

  hide() {
    this.visible.set(false);
    this.cancelStream();
  }

  ngOnDestroy() {
    if (this.checkSelectionTimer) {
      window.clearTimeout(this.checkSelectionTimer);
    }
    this.cancelStream();
  }
}
