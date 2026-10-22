import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { UserResponse, ApiResponse, LoginRequest, LoginResponse } from '../models/pusula.models';
import { ApiService, API_BASE_URL } from '../services/api.service';
import { inject } from '@angular/core';

const SESSION_KEY = 'pv_session';

export function deviceId(): string {
  const key = 'pv_device_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenKey = 'pv_auth_token';
  private http = inject(HttpClient);
  private apiBase = inject(API_BASE_URL);
  public currentUser = signal<UserResponse | null>(null);
  public currentRole = signal<string | null>(null);
  public visibleWorkspaceIds = signal<string[]>([]);

  constructor(private apiService: ApiService, private router: Router) {
    const raw = localStorage.getItem(SESSION_KEY);
    const savedToken = localStorage.getItem(this.tokenKey);
    if (raw && savedToken) {
      try {
        const session = JSON.parse(raw) as LoginResponse;
        this.currentUser.set(session.user);
        this.currentRole.set(session.role);
        this.visibleWorkspaceIds.set(session.visibleWorkspaceIds || []);
      } catch {
        this.clearAuth();
      }
    }
  }

  login(credentials: { email: string; password: string }): Observable<ApiResponse<LoginResponse>> {
    const devId = deviceId();
    const label = navigator.userAgent.slice(0, 140);
    const loginRequest: any = {
      email: credentials.email.trim().toLowerCase(),
      password: credentials.password,
      deviceId: devId,
      device_id: devId,
      deviceLabel: label,
      device_label: label
    };
    return this.apiService.login(loginRequest).pipe(tap(res => {
      const status = res.data?.deviceStatus || (res.data as any)?.device_status;
      if (res.success && res.data?.token && status !== 'PENDING') {
        this.persist(res.data);
      }
    }));
  }

  pollDevice(pendingToken: string): Observable<ApiResponse<LoginResponse>> {
    return this.http.get<ApiResponse<LoginResponse>>(`${this.apiBase}/auth/device-status`, {
      headers: new HttpHeaders({
        Authorization: `Bearer ${pendingToken}`,
        'X-Device-Id': deviceId()
      })
    });
  }

  persist(session: LoginResponse): void {
    if (!session.token) return;
    localStorage.setItem(this.tokenKey, session.token);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    this.currentUser.set(session.user);
    this.currentRole.set(session.role);
    this.visibleWorkspaceIds.set(session.visibleWorkspaceIds || []);
  }

  logout(): void {
    this.apiService.logout().subscribe({
      next: () => this.clearAuth(),
      error: () => this.clearAuth()
    });
  }

  private clearAuth(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(SESSION_KEY);
    this.currentUser.set(null);
    this.currentRole.set(null);
    this.visibleWorkspaceIds.set([]);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isRestricted(): boolean {
    const role = this.currentRole();
    return role === 'EMPLOYEE' || role === 'INTERN';
  }

  isLeadership(): boolean {
    const role = this.currentRole();
    return role === 'ADMIN' || role === 'FOUNDER';
  }

  hasRole(role: string): boolean {
    return this.currentRole() === role;
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.includes(this.currentRole() || '');
  }
}
