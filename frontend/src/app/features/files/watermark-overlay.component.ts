import { Component, Input, OnInit, OnDestroy, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-watermark-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="wm-overlay" [style.pointer-events]="'none'">
      <div
        *ngFor="let line of watermarkLines(); let i = index"
        class="wm-line"
        [style.transform]="'rotate(-22deg) translateY(' + (i * 120) + 'px)'"
        [style.opacity]="copyAllowed ? 0.06 : 0.18"
        [style.color]="copyAllowed ? 'var(--pv-text-muted)' : 'var(--pv-accent-red)'"
      >
        <span class="wm-seg" *ngFor="let seg of repeatSegments(); trackBy: trackIdx">{{ wmText() }}</span>
      </div>
    </div>
  `,
  styles: [`
    .wm-overlay {
      position: absolute;
      inset: 0;
      overflow: hidden;
      z-index: 9999;
      user-select: none;
    }
    .wm-line {
      position: absolute;
      left: -20%;
      right: -20%;
      top: 50%;
      display: flex;
      gap: 120px;
      white-space: nowrap;
      font-weight: 700;
      font-size: 15px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      pointer-events: none;
      transform-origin: center center;
    }
    .wm-seg {
      flex-shrink: 0;
      padding: 0 20px;
    }
  `]
})
export class WatermarkOverlayComponent implements OnInit, OnDestroy {
  @Input() username = 'UNKNOWN_USER';
  @Input() role = 'GUEST';
  @Input() team = 'NO_TEAM';
  @Input() sessionId = 'SESS-0000';
  @Input() copyAllowed = true;

  timestamp = signal(new Date().toISOString());
  private timer: number | null = null;

  wmText = computed(() => {
    const ts = this.timestamp();
    const d = new Date(ts);
    const stamp = d.toLocaleString();
    return `● ${this.username} | ${this.role} | ${this.team} | ${stamp} | ${this.sessionId} ●`;
  });

  watermarkLines = computed(() => Array.from({ length: 10 }, (_, i) => i));
  repeatSegments = computed(() => Array.from({ length: 6 }, (_, i) => i));

  trackIdx(_i: number, n: number): number { return n; }

  ngOnInit(): void {
    this.timer = window.setInterval(() => {
      this.timestamp.set(new Date().toISOString());
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }
}
