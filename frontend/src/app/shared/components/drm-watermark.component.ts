import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-drm-watermark',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="drm-watermark-overlay">
      @for (i of watermarkPositions(); track i) {
        <div class="watermark-item" [style.top]="i.top + '%'" [style.left]="i.left + '%'" [style.transform]="'rotate(' + i.rotation + 'deg)'">
          <div class="watermark-text">
            <div class="watermark-user">{{ currentUser() }}</div>
            <div class="watermark-timestamp">{{ timestamp() }}</div>
            <div class="watermark-label">CONFIDENTIAL</div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .drm-watermark-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 9999;
      overflow: hidden;
    }

    .watermark-item {
      position: absolute;
      opacity: 0.08;
      font-size: 14px;
      font-weight: 600;
      color: #000;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .watermark-text {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      white-space: nowrap;
    }

    .watermark-user {
      font-size: 16px;
      font-weight: 700;
    }

    .watermark-timestamp {
      font-size: 12px;
      font-weight: 500;
    }

    .watermark-label {
      font-size: 14px;
      font-weight: 800;
      color: #dc2626;
    }
  `]
})
export class DrmWatermarkComponent {
  private authService = inject(AuthService);

  currentUser = signal('');
  timestamp = signal('');

  watermarkPositions = signal<Array<{top: number, left: number, rotation: number}>>([]);

  constructor() {
    this.updateWatermark();
    setInterval(() => this.updateTimestamp(), 60000);
  }

  private updateWatermark() {
    const user = this.authService.currentUser();
    this.currentUser.set(user?.fullName || 'Unauthorized User');
    this.updateTimestamp();

    // Generate grid of watermark positions
    const positions: Array<{top: number, left: number, rotation: number}> = [];
    const rows = 5;
    const cols = 4;
    const rotations = [-45, -30, -15, 0, 15, 30, 45];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        positions.push({
          top: (r + 0.5) * (100 / rows),
          left: (c + 0.5) * (100 / cols),
          rotation: rotations[Math.floor(Math.random() * rotations.length)]
        });
      }
    }

    this.watermarkPositions.set(positions);
  }

  private updateTimestamp() {
    this.timestamp.set(new Date().toLocaleString());
  }
}
