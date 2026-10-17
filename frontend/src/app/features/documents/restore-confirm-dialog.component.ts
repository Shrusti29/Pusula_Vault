import {
  Component,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-restore-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rcd-overlay" (click.self)="cancel.emit()">
      <div class="rcd-modal">
        <div class="rcd-head">
          <div class="rcd-icon-wrap">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
          </div>
          <div class="rcd-head-text">
            <h3 class="rcd-title">Restore this version?</h3>
            <p class="rcd-subtitle">
              Restoring <strong>{{ documentTitle }}</strong> from version
              <span class="rcd-ver-chip">v{{ fromVersion }}</span>
            </p>
          </div>
        </div>

        <div class="rcd-body">
          <div class="rcd-impact-card">
            <div class="rcd-impact-icon">ℹ️</div>
            <div class="rcd-impact-content">
              <h4 class="rcd-impact-title">What happens next</h4>
              <ul class="rcd-impact-list">
                <li>
                  <span class="rcd-bullet new">•</span>
                  <span>A <strong>new version will be created</strong> with the restored content</span>
                </li>
                <li>
                  <span class="rcd-bullet">•</span>
                  <span>Current version remains preserved in history</span>
                </li>
                <li>
                  <span class="rcd-bullet">•</span>
                  <span>All comments and permissions stay intact</span>
                </li>
              </ul>
            </div>
          </div>

          <div class="rcd-warn" *ngIf="fromVersion">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>Changes made after v{{ fromVersion }} will not be merged automatically.</span>
          </div>
        </div>

        <div class="rcd-foot">
          <button class="pv-btn pv-btn-ghost rcd-btn" (click)="cancel.emit()">
            Cancel
          </button>
          <button class="pv-btn pv-btn-primary rcd-btn rcd-restore" (click)="confirm.emit()">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            Restore version
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .rcd-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.78);
      backdrop-filter: blur(6px);
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      animation: rcdFade 180ms ease;
    }
    @keyframes rcdFade { from { opacity: 0; } to { opacity: 1; } }

    .rcd-modal {
      width: 100%;
      max-width: 520px;
      background: var(--pv-bg-elevated);
      border: 1px solid var(--pv-border);
      border-radius: var(--pv-radius-xl);
      box-shadow: var(--pv-shadow-lg), var(--pv-shadow-glow-blue);
      overflow: hidden;
      animation: rcdIn 280ms cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes rcdIn {
      from { opacity: 0; transform: scale(0.94) translateY(16px); }
      to   { opacity: 1; transform: scale(1) translateY(0); }
    }

    .rcd-head {
      display: flex;
      gap: 1rem;
      padding: 1.5rem;
      border-bottom: 1px solid var(--pv-border);
      background: linear-gradient(180deg, rgba(139, 92, 246, 0.06), transparent);
    }
    .rcd-icon-wrap {
      width: 52px;
      height: 52px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, rgba(14, 165, 233, 0.18), rgba(139, 92, 246, 0.18));
      border: 1px solid rgba(14, 165, 233, 0.35);
      color: var(--pv-accent-blue);
      border-radius: var(--pv-radius-lg);
    }
    .rcd-head-text { flex: 1; min-width: 0; }
    .rcd-title {
      font-size: 1.125rem;
      margin-bottom: 0.3rem;
      color: var(--pv-text-primary);
    }
    .rcd-subtitle {
      font-size: 0.82rem;
      color: var(--pv-text-muted);
      line-height: 1.5;
    }
    .rcd-subtitle strong { color: var(--pv-text-secondary); }
    .rcd-ver-chip {
      display: inline-block;
      margin: 0 0.15rem;
      padding: 0.1rem 0.5rem;
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--pv-accent-purple);
      background: rgba(139, 92, 246, 0.12);
      border: 1px solid rgba(139, 92, 246, 0.3);
      border-radius: 6px;
    }

    .rcd-body {
      padding: 1.5rem;
    }

    .rcd-impact-card {
      display: flex;
      gap: 0.9rem;
      padding: 1rem 1.1rem;
      background: var(--pv-bg-card);
      border: 1px solid var(--pv-border);
      border-radius: var(--pv-radius-md);
    }
    .rcd-impact-icon {
      font-size: 1.4rem;
      flex-shrink: 0;
      line-height: 1.2;
    }
    .rcd-impact-content { flex: 1; min-width: 0; }
    .rcd-impact-title {
      font-size: 0.74rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--pv-text-muted);
      font-weight: 700;
      margin-bottom: 0.6rem;
    }
    .rcd-impact-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .rcd-impact-list li {
      display: flex;
      gap: 0.55rem;
      align-items: flex-start;
      font-size: 0.84rem;
      color: var(--pv-text-secondary);
      line-height: 1.45;
    }
    .rcd-impact-list li strong { color: var(--pv-text-primary); }
    .rcd-bullet {
      flex-shrink: 0;
      color: var(--pv-text-subtle);
      font-weight: 700;
      margin-top: 1px;
    }
    .rcd-bullet.new { color: var(--pv-accent-teal); }

    .rcd-warn {
      margin-top: 1rem;
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
      padding: 0.8rem 1rem;
      background: rgba(245, 158, 11, 0.08);
      border: 1px solid rgba(245, 158, 11, 0.25);
      border-radius: var(--pv-radius-md);
      color: var(--pv-accent-amber);
      font-size: 0.8rem;
      line-height: 1.5;
    }

    .rcd-foot {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem 1.5rem;
      border-top: 1px solid var(--pv-border);
      background: var(--pv-bg-mid);
    }
    .rcd-btn { padding: 0.58rem 1.15rem; }
    .rcd-restore {
      background: linear-gradient(135deg, var(--pv-accent-blue) 0%, var(--pv-accent-purple) 100%);
      box-shadow: 0 4px 16px rgba(139, 92, 246, 0.28);
    }
    .rcd-restore:hover {
      box-shadow: 0 8px 26px rgba(139, 92, 246, 0.38);
    }
  `]
})
export class RestoreConfirmDialogComponent {
  @Input() documentTitle = 'this document';
  @Input() fromVersion = 0;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}
