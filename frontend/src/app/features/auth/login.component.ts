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
          <p>{{ waiting() ? 'Your admin needs to allow this device once.' : 'Sign in with the account your admin created.' }}</p>
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
        } @else {
          <div class="wait-box">
            <p>{{ message }}</p>
            <p class="device-id">Device {{ shortDevice }}</p>
            <p class="wait-note">Leave this page open. You will go straight in when an admin approves this browser. Next time, sign-in will not ask again.</p>
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
    .wait-note { color: var(--pv-text-muted); font-size: 0.9rem; }
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

  onLogin() {
    this.error = '';
    this.busy = true;
    this.authService.login({ email: this.email, password: this.password }).subscribe({
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
          if (res.data?.deviceStatus === 'APPROVED' && res.data.token) {
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
