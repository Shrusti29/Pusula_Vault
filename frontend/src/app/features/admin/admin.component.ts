import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

interface User {
  id: string;
  username?: string;
  email: string;
  displayName: string;
  role: string;
  active: boolean;
  featurePermissions: string[];
  workspaceIds?: string[];
}

interface DeviceRow {
  id: string;
  username: string;
  displayName: string;
  deviceId: string;
  label: string;
  status: string;
  firstSeenAt?: string;
}

interface FeaturePermission {
  key: string;
  label: string;
  category: string;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="admin-container">
      <div class="admin-header">
        <h2>User Management & Access Control</h2>
        <button class="pv-btn pv-btn-primary" (click)="openCreate()">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create User
        </button>
      </div>
      @if (formSuccess()) {
        <p class="form-success" role="status">{{ formSuccess() }}</p>
      }

      <div class="admin-content">
        <div class="users-table-wrapper" style="margin-bottom: 1.5rem; padding: 1rem 1.25rem;">
          <h3 style="margin: 0 0 0.75rem;">Device approvals</h3>
          <p style="margin: 0 0 1rem; color: var(--pv-text-muted);">An employee’s first browser stays pending until you approve it. Later sign-ins on that browser do not ask again.</p>
          @if (devices().length === 0) {
            <p>No devices have checked in yet.</p>
          } @else {
            <table class="pv-table">
              <thead>
                <tr><th>Employee</th><th>Device</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                @for (device of devices(); track device.id) {
                  <tr>
                    <td>{{ device.displayName || device.username }}</td>
                    <td>{{ device.label }}<div class="user-email">{{ device.deviceId }}</div></td>
                    <td><span class="pv-badge pv-badge-blue">{{ device.status }}</span></td>
                    <td>
                      @if (device.status !== 'APPROVED') {
                        <button class="pv-btn pv-btn-sm pv-btn-primary" (click)="approveDevice(device.id)">Approve</button>
                      }
                      @if (device.status === 'APPROVED') {
                        <button class="pv-btn pv-btn-sm pv-btn-danger" (click)="revokeDevice(device.id)">Revoke</button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
        <div class="users-table-wrapper">
          <table class="pv-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Permissions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (user of users(); track user.id) {
                <tr>
                  <td>
                    <div class="user-cell">
                      <div class="user-avatar-sm">{{ getInitials(user.displayName) }}</div>
                      <div>
                        <div class="user-name">{{ user.displayName }}</div>
                        <div class="user-email">{{ user.email }}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="pv-badge pv-badge-blue">{{ user.role }}</span>
                  </td>
                  <td>
                    <span [class]="'pv-badge ' + (user.active ? 'pv-badge-green' : 'pv-badge-red')">
                      {{ user.active ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                  <td>
                    <div class="permissions-preview">
                      {{ (user.featurePermissions || []).slice(0, 3).join(', ') }}
                      @if ((user.featurePermissions || []).length > 3) {
                        <span class="more-permissions">+{{ user.featurePermissions.length - 3 }} more</span>
                      }
                    </div>
                  </td>
                  <td>
                    <button class="pv-btn pv-btn-sm pv-btn-secondary" (click)="editUser(user)">Edit</button>
                    <button class="pv-btn pv-btn-sm pv-btn-danger" (click)="toggleUserStatus(user)">
                      {{ user.active ? 'Deactivate' : 'Activate' }}
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      @if (showCreateUserModal()) {
        <div class="modal-overlay" (click)="showCreateUserModal.set(false)">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ editingId() ? 'Update user' : 'Create New User' }}</h3>
              <button class="modal-close" (click)="showCreateUserModal.set(false)">×</button>
            </div>
            <form [formGroup]="userForm" (ngSubmit)="createUser()">
              @if (formError()) {
                <p class="form-error" role="alert">{{ formError() }}</p>
              }
              <div class="form-group">
                <label>Email address</label>
                <input type="email" formControlName="email" class="pv-input" autocomplete="email" />
              </div>
              <div class="form-group">
                <label>Full Name</label>
                <input type="text" formControlName="fullName" class="pv-input" />
              </div>
              <div class="form-group">
                <label>Password</label>
                <input type="password" formControlName="password" class="pv-input" autocomplete="new-password" />
              </div>
              <div class="form-group">
                <label>Role</label>
                <select formControlName="role" class="pv-input">
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="TEAM_LEAD">Team Lead</option>
                  <option value="EMPLOYEE">Employee</option>
                  <option value="INTERN">Intern</option>
                </select>
              </div>

              <div class="form-group">
                <label>Projects this person can open</label>
                <div class="permissions-grid">
                  @for (ws of workspaces(); track ws.id) {
                    <label class="permission-checkbox">
                      <input type="checkbox" [checked]="selectedWorkspaceIds().includes(ws.id)" (change)="toggleWorkspace(ws.id, $any($event.target).checked)" />
                      <span>{{ ws.name }}</span>
                    </label>
                  }
                </div>
                <p style="color: var(--pv-text-muted); font-size: 0.85rem;">Employees can edit and create documents only in the projects you tick. They cannot download or copy.</p>
              </div>

              <div class="form-group">
                <label>Feature Permissions</label>
                <div class="permissions-grid">
                  @for (category of permissionCategories; track category) {
                    <div class="permission-category">
                      <h4>{{ category }}</h4>
                      @for (perm of getPermissionsByCategory(category); track perm.key) {
                        <label class="permission-checkbox">
                          <input type="checkbox" [checked]="selectedPermissions().includes(perm.key)" (change)="togglePermission(perm.key, $any($event.target).checked)" />
                          <span>{{ perm.label }}</span>
                        </label>
                      }
                    </div>
                  }
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="pv-btn pv-btn-secondary" (click)="showCreateUserModal.set(false)">Cancel</button>
                <button type="submit" class="pv-btn pv-btn-primary" [disabled]="userForm.invalid">{{ editingId() ? 'Save' : 'Create User' }}</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }
    .admin-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    .admin-header h2 {
      margin: 0;
      font-size: 1.75rem;
      color: var(--pv-text-primary);
    }
    .users-table-wrapper {
      background: var(--pv-bg-card);
      border: 1px solid var(--pv-border);
      border-radius: 12px;
      overflow: hidden;
    }
    .pv-table {
      width: 100%;
      border-collapse: collapse;
    }
    .pv-table th {
      background: var(--pv-bg-dark);
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      color: var(--pv-text-secondary);
      border-bottom: 1px solid var(--pv-border);
    }
    .pv-table td {
      padding: 1rem;
      border-bottom: 1px solid var(--pv-border);
    }
    .user-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .user-avatar-sm {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--pv-accent-blue);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.85rem;
    }
    .user-name {
      font-weight: 600;
      color: var(--pv-text-primary);
    }
    .user-email {
      font-size: 0.85rem;
      color: var(--pv-text-muted);
    }
    .permissions-preview {
      font-size: 0.85rem;
      color: var(--pv-text-secondary);
    }
    .more-permissions {
      color: var(--pv-accent-blue);
    }
    .pv-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .pv-badge-blue { background: rgba(14, 165, 233, 0.15); color: #0ea5e9; }
    .pv-badge-green { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
    .pv-badge-red { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
    .pv-btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.875rem;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }
    .pv-btn-sm { padding: 0.35rem 0.75rem; font-size: 0.8rem; }
    .pv-btn-primary { background: var(--pv-accent-blue); color: white; }
    .pv-btn-primary:hover { background: #0284c7; }
    .pv-btn-secondary { background: var(--pv-bg-dark); color: var(--pv-text-primary); border: 1px solid var(--pv-border); }
    .pv-btn-secondary:hover { background: var(--pv-bg-card-hover); }
    .pv-btn-danger { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
    .pv-btn-danger:hover { background: rgba(239, 68, 68, 0.25); }
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-content {
      background: var(--pv-bg-card);
      border: 1px solid var(--pv-border);
      border-radius: 12px;
      max-width: 800px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid var(--pv-border);
    }
    .modal-header h3 { margin: 0; }
    .modal-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--pv-text-muted);
    }
    .form-group { padding: 1rem 1.5rem; }
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: var(--pv-text-secondary);
    }
    .pv-input {
      width: 100%;
      padding: 0.75rem;
      background: var(--pv-bg-dark);
      border: 1px solid var(--pv-border);
      border-radius: 8px;
      color: var(--pv-text-primary);
      font-family: inherit;
    }
    .permissions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }
    .permission-category h4 {
      margin: 0 0 0.75rem 0;
      font-size: 0.9rem;
      color: var(--pv-accent-blue);
    }
    .permission-checkbox {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      cursor: pointer;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1.5rem;
      border-top: 1px solid var(--pv-border);
    }
    .form-error {
      margin: 1rem 1.5rem 0;
      padding: 0.75rem 1rem;
      border: 1px solid rgba(239, 68, 68, 0.35);
      border-radius: 8px;
      color: #fca5a5;
      background: rgba(239, 68, 68, 0.1);
    }
    .form-success {
      margin: 0 0 1rem;
      padding: 0.75rem 1rem;
      border: 1px solid rgba(34, 197, 94, 0.35);
      border-radius: 8px;
      color: #86efac;
      background: rgba(34, 197, 94, 0.1);
    }
  `]
})
export class AdminComponent implements OnInit {
  users = signal<User[]>([]);
  devices = signal<DeviceRow[]>([]);
  workspaces = signal<{ id: string; name: string }[]>([]);
  selectedWorkspaceIds = signal<string[]>([]);
  showCreateUserModal = signal(false);
  editingId = signal<string | null>(null);
  userForm: FormGroup;

  private allPermissions: FeaturePermission[] = [
    { key: 'VIEW_WORKSPACES', label: 'View Workspaces', category: 'Workspaces' },
    { key: 'CREATE_WORKSPACES', label: 'Create Workspaces', category: 'Workspaces' },
    { key: 'DELETE_WORKSPACES', label: 'Delete Workspaces', category: 'Workspaces' },
    { key: 'VIEW_DOCUMENTS', label: 'View Documents', category: 'Documents' },
    { key: 'CREATE_DOCUMENTS', label: 'Create Documents', category: 'Documents' },
    { key: 'EDIT_DOCUMENTS', label: 'Edit Documents', category: 'Documents' },
    { key: 'DELETE_DOCUMENTS', label: 'Delete Documents', category: 'Documents' },
    { key: 'VIEW_AUDIT_LOGS', label: 'View Audit Logs', category: 'Governance' },
    { key: 'VIEW_ANALYTICS', label: 'View Analytics', category: 'Governance' },
    { key: 'GOVERNANCE_CONTROLS', label: 'Governance Controls', category: 'Governance' },
    { key: 'DRIVE_SYNC', label: 'Drive Sync', category: 'Governance' },
    { key: 'MANAGE_USERS', label: 'Manage Users', category: 'Administration' },
    { key: 'MANAGE_ROLES', label: 'Manage Roles', category: 'Administration' },
    { key: 'MANAGE_TEAMS', label: 'Manage Teams', category: 'Administration' }
  ];

  permissionCategories = [...new Set(this.allPermissions.map(p => p.category))];

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder
  ) {
    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role: ['EMPLOYEE', Validators.required],
      featurePermissions: [[]]
    });
  }

  ngOnInit() {
    this.loadUsers();
    this.loadDevices();
    this.apiService.listWorkspaces().subscribe({
      next: (rows) => this.workspaces.set(rows),
      error: () => this.workspaces.set([])
    });
  }

  loadUsers() {
    this.apiService.listUsers(0, 50).subscribe({
      next: (page) => {
        this.users.set(page.content.map((u) => ({
          id: u.id,
          username: u.username,
          email: u.email,
          displayName: u.fullName || u.email,
          role: u.role,
          active: u.active,
          featurePermissions: u.featurePermissions || [],
          workspaceIds: u.workspaceIds || []
        })));
      },
      error: (error) => console.error('Failed to load users:', error)
    });
  }

  loadDevices() {
    this.apiService.get<DeviceRow[]>('/admin/devices').subscribe({
      next: (response) => this.devices.set(response.data || []),
      error: () => this.devices.set([])
    });
  }

  approveDevice(id: string) {
    this.apiService.post<DeviceRow>(`/admin/devices/${id}/approve`, {}).subscribe({
      next: () => this.loadDevices()
    });
  }

  revokeDevice(id: string) {
    this.apiService.post<DeviceRow>(`/admin/devices/${id}/revoke`, {}).subscribe({
      next: () => this.loadDevices()
    });
  }

  openCreate() {
    this.editingId.set(null);
    this.formError.set('');
    this.formSuccess.set('');
    this.selectedWorkspaceIds.set([]);
    this.userForm.reset({ role: 'EMPLOYEE', featurePermissions: [] });
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.showCreateUserModal.set(true);
  }

  toggleWorkspace(id: string, checked: boolean) {
    this.selectedWorkspaceIds.update((current) => checked ? [...current, id] : current.filter((x) => x !== id));
  }

  createUser() {
    if (this.userForm.valid) {
      this.formError.set('');
      const formValue = this.userForm.value;
      const payload = {
        email: formValue.email,
        fullName: formValue.fullName,
        password: formValue.password,
        role: formValue.role,
        featurePermissions: formValue.role === 'EMPLOYEE' || formValue.role === 'INTERN'
          ? ['VIEW_WORKSPACES', 'VIEW_DOCUMENTS', 'CREATE_DOCUMENTS', 'EDIT_DOCUMENTS']
          : formValue.featurePermissions,
        workspaceIds: this.selectedWorkspaceIds()
      };
      const request = this.editingId()
        ? this.apiService.put<any>(`/admin/users/${this.editingId()}`, payload)
        : this.apiService.post<any>('/admin/users', payload);
      request.subscribe({
        next: () => {
          this.formSuccess.set(this.editingId() ? 'Account updated successfully.' : 'Account created successfully.');
          this.showCreateUserModal.set(false);
          this.editingId.set(null);
          this.selectedWorkspaceIds.set([]);
          this.userForm.reset({ role: 'EMPLOYEE', featurePermissions: [] });
          this.loadUsers();
        },
        error: (error) => {
          this.formError.set(error?.error?.message || 'Unable to save this account.');
        }
      });
    }
  }

  editUser(user: User) {
    this.formError.set('');
    this.formSuccess.set('');
    this.editingId.set(user.id);
    this.selectedWorkspaceIds.set([...(user.workspaceIds || [])]);
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.userForm.patchValue({
      email: user.email,
      fullName: user.displayName,
      password: '',
      role: user.role,
      featurePermissions: user.featurePermissions || []
    });
    this.showCreateUserModal.set(true);
  }

  toggleUserStatus(user: User) {
    this.apiService.toggleUserActive(user.id, !user.active).subscribe({
      next: () => this.loadUsers(),
      error: (error) => console.error('Failed to toggle user status:', error)
    });
  }

  formError = signal('');
  formSuccess = signal('');

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  getPermissionsByCategory(category: string): FeaturePermission[] {
    return this.allPermissions.filter(p => p.category === category);
  }
}
