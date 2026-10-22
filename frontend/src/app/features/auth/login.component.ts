import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService, deviceId } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h2>{{ waiting() ? 'Waiting for approval' : 'Welcome back' }}</h2>
          <p>{{ waiting() ? 'Your admin needs to allow this device once.' : 'Sign in to access your Pusula Vault workspace.' }}</p>
        </div>

        @if (!waiting()) {
          <form (ngSubmit)="onLogin()">
            <div class="form-group">
              <label class="pv-label">Email address</label>
              <input type="email" [(ngModel)]="email" name="email" required email class="pv-input" placeholder="you@company.com" autocomplete="email" />
            </div>
            <div class="form-group">
              <label class="pv-label">Password</label>
              <input type="password" [(ngModel)]="password" name="password" required minlength="8" class="pv-input" placeholder="Password" autocomplete="current-password" />
            </div>
            @if (error) {
              <p class="login-error" role="alert">{{ error }}</p>
            }
            <button type="submit" class="pv-btn pv-btn-primary" style="width: 100%;" [disabled]="busy">
              {{ busy ? 'Signing in…' : 'Sign in' }}
            </button>
          </form>

          <div class="demo-section">
            <span class="demo-label">Quick Sign-In Credentials</span>
            <div class="demo-buttons">
              <button type="button" class="demo-btn" (click)="fillAdmin()">
                <span class="badge-tag admin-tag">ADMIN</span> admin&#64;gmail.com
              </button>
              <button type="button" class="demo-btn" (click)="fillEmployee()">
                <span class="badge-tag emp-tag">EMPLOYEE</span> employee&#64;gmail.com
              </button>
            </div>
          </div>
        } @else {
          <div class="wait-box">
            <p>{{ message }}</p>
            <p class="device-id">Device {{ shortDevice }}</p>
            <p class="wait-note">Leave this page open. You will go straight in when an admin approves this browser.</p>
          </div>
        }

        <div class="login-footer">
          <a (click)="navigateToHome()" style="color: var(--pv-accent-primary); cursor: pointer; text-decoration: none;">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex; justify-content: center; align-items: center; min-height: 100vh;
      background:
        radial-gradient(ellipse at 20% 0%, rgba(212, 175, 55, 0.1) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 100%, rgba(30, 64, 175, 0.08) 0%, transparent 50%),
        linear-gradient(180deg, var(--pv-bg-dark) 0%, var(--pv-bg-mid) 100%);
    }
    .login-card {
      background: var(--pv-bg-card); padding: 2.5rem; border-radius: var(--pv-radius-xl);
      box-shadow: var(--pv-shadow-lg); width: 100%; max-width: 440px; border: 1px solid var(--pv-border);
    }
    .login-header { text-align: center; margin-bottom: 1.5rem; }
    .login-header h2 { font-size: 1.6rem; margin-bottom: 0.4rem; }
    .login-header p { color: var(--pv-text-muted); }
    .form-group { margin-bottom: 1.1rem; }
    .login-error { color: #f87171; font-size: 0.9rem; margin-bottom: 0.8rem; }
    .wait-box { background: rgba(14,165,233,0.08); border: 1px solid rgba(14,165,233,0.3); border-radius: 12px; padding: 1rem; }
    .device-id { font-family: ui-monospace, monospace; font-size: 0.85rem; color: var(--pv-text-secondary); }
    .wait-note { color: var(--pv-text-muted); font-size: 0.9rem; margin-top: 0.5rem; }
    .demo-section {
      margin-top: 1.25rem;
      padding-top: 1.1rem;
      border-top: 1px solid var(--pv-border-soft);
    }
    .demo-label {
      display: block;
      font-size: 0.72rem;
      color: var(--pv-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
      margin-bottom: 0.6rem;
      text-align: center;
    }
    .demo-buttons {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }
    .demo-btn {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      width: 100%;
      background: var(--pv-bg-dark);
      border: 1px solid var(--pv-border);
      border-radius: var(--pv-radius-md);
      padding: 0.45rem 0.75rem;
      color: var(--pv-text-primary);
      font-size: 0.8rem;
      cursor: pointer;
      transition: all var(--pv-transition-fast);
      text-align: left;
    }
    .demo-btn:hover {
      border-color: var(--pv-accent-primary);
      background: rgba(30, 64, 175, 0.15);
    }
    .badge-tag {
      font-size: 0.65rem;
      font-weight: 700;
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
      letter-spacing: 0.04em;
    }
    .admin-tag {
      background: rgba(212, 175, 55, 0.2);
      color: var(--pv-accent-primary);
      border: 1px solid rgba(212, 175, 55, 0.4);
    }
    .emp-tag {
      background: rgba(14, 165, 233, 0.2);
      color: #38bdf8;
      border: 1px solid rgba(14, 165, 233, 0.4);
    }
    .login-footer { margin-top: 1.5rem; text-align: center; padding-top: 1.2rem; border-top: 1px solid var(--pv-border-soft); }
  `]
})
export class LoginComponent implements OnDestroy {
  email = '';
  password = '';
  error = '';
  busy = false;
  message = '';
  shortDevice = deviceId().slice(0, 8);
  private pendingToken = '';
  private timer: ReturnType<typeof setInterval> | null = null;
  private isWaiting = false;

  constructor(private authService: AuthService, private router: Router) {}

  waiting(): boolean { return this.isWaiting; }

  navigateToHome() { this.router.navigate(['/']); }

  fillAdmin() {
    this.email = 'admin@gmail.com';
    this.password = 'admin123';
    this.error = '';
  }

  fillEmployee() {
    this.email = 'employee@gmail.com';
    this.password = 'employee123';
    this.error = '';
  }

  onLogin() {
    this.error = '';
    const cleanEmail = (this.email || '').trim().toLowerCase();
    const cleanPassword = (this.password || '').trim();
    if (!cleanEmail || !cleanPassword) {
      this.error = 'Please enter both your email address and password.';
      return;
    }
    this.busy = true;
    this.authService.login({ email: cleanEmail, password: cleanPassword }).subscribe({
      next: (res) => {
        this.busy = false;
        const data = res.data;
        const status = data.deviceStatus || (data as any).device_status;
        if (status === 'PENDING') {
          this.isWaiting = true;
          this.message = data.deviceMessage || (data as any).device_message || 'Waiting for admin approval.';
          this.pendingToken = data.token || '';
          this.startPoll();
          return;
        }
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.busy = false;
        this.error = err?.error?.message || 'Invalid email or password. Check your credentials and try again.';
      }
    });
  }

  private startPoll() {
    this.stopPoll();
    this.timer = setInterval(() => {
      if (!this.pendingToken) return;
      this.authService.pollDevice(this.pendingToken).subscribe({
        next: (res) => {
          const status = res.data?.deviceStatus || (res.data as any)?.device_status;
          if (status === 'APPROVED' && res.data?.token) {
            this.stopPoll();
            this.authService.persist(res.data);
            this.router.navigate(['/dashboard']);
          }
        }
      });
    }, 4000);
  }

  private stopPoll() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  ngOnDestroy() { this.stopPoll(); }
}
