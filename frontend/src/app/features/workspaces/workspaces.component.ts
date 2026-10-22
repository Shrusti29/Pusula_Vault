import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { WorkspaceResponse, CreateWorkspaceRequest, UpdateWorkspaceRequest } from '../../core/models/pusula.models';

@Component({
  selector: 'app-workspaces',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="workspaces-container">
      <div class="workspaces-header">
        <div>
          <h1 class="page-title">Workspaces</h1>
          <p class="page-subtitle">Organize documents, projects, and permissions across your organization</p>
        </div>
        <button class="pv-btn pv-btn-primary" (click)="showCreateModal.set(true)">
          <span style="font-size: 1.1rem; margin-right: 0.35rem;">+</span> New Workspace
        </button>
      </div>

      @if (loading()) {
        <div class="loading-state">Loading workspaces...</div>
      } @else if (workspaces().length === 0) {
        <div class="empty-state-card pv-card">
          <div class="empty-icon">🗂️</div>
          <h3>No workspaces found</h3>
          <p>Create your first workspace to start collaborating on documents.</p>
          <button class="pv-btn pv-btn-primary" style="margin-top: 1rem;" (click)="showCreateModal.set(true)">Create Workspace</button>
        </div>
      } @else {
        <div class="workspaces-grid">
          @for (ws of workspaces(); track ws.id) {
            <div class="pv-card workspace-card" (click)="viewWorkspace(ws.id)">
              <div class="ws-card-top">
                <div class="ws-icon">🗂️</div>
                <div class="ws-badge">{{ ws.documentCount || 0 }} docs</div>
              </div>
              <h3 class="ws-name">{{ ws.name }}</h3>
              <p class="ws-desc">{{ ws.description || 'No description provided' }}</p>
              <div class="ws-meta">
                <span>Created {{ ws.createdAt | date:'mediumDate' }}</span>
              </div>
              <div class="ws-actions" (click)="$event.stopPropagation()">
                <button class="pv-btn pv-btn-outline xs-btn" (click)="editWorkspace(ws, $event)">Edit</button>
                <button class="pv-btn pv-btn-ghost xs-btn danger-hover" (click)="deleteWorkspace(ws.id, $event)">Delete</button>
              </div>
            </div>
          }
        </div>
      }

      @if (showCreateModal()) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal-dialog pv-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editingWorkspace() ? 'Edit Workspace' : 'Create Workspace' }}</h2>
              <button class="close-btn" (click)="closeModal()">&times;</button>
            </div>
            <form (ngSubmit)="saveWorkspace()">
              <div class="form-group">
                <label class="pv-label">Workspace Name</label>
                <input type="text" class="pv-input" [(ngModel)]="workspaceForm().name" name="name" required placeholder="e.g. Engineering, Sales, Strategy" />
              </div>
              <div class="form-group">
                <label class="pv-label">Description</label>
                <textarea class="pv-textarea" [(ngModel)]="workspaceForm().description" name="description" rows="3" placeholder="Brief description of this workspace's purpose..."></textarea>
              </div>
              <div class="modal-footer">
                <button type="button" class="pv-btn pv-btn-outline" (click)="closeModal()">Cancel</button>
                <button type="submit" class="pv-btn pv-btn-primary">{{ editingWorkspace() ? 'Save Changes' : 'Create Workspace' }}</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .workspaces-container {
      max-width: 1400px;
      margin: 0 auto;
    }
    .workspaces-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    .page-title {
      font-size: 1.85rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin: 0 0 0.25rem 0;
      color: var(--pv-text-primary);
    }
    .page-subtitle {
      color: var(--pv-text-muted);
      font-size: 0.9rem;
      margin: 0;
    }
    .loading-state {
      text-align: center;
      padding: 3rem;
      color: var(--pv-text-muted);
    }
    .empty-state-card {
      text-align: center;
      padding: 3.5rem 2rem;
      margin-top: 1rem;
    }
    .empty-icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }
    .empty-state-card h3 {
      font-size: 1.25rem;
      margin-bottom: 0.5rem;
      color: var(--pv-text-primary);
    }
    .empty-state-card p {
      color: var(--pv-text-muted);
      font-size: 0.9rem;
    }
    .workspaces-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }
    .workspace-card {
      padding: 1.5rem;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      transition: all var(--pv-transition-fast);
      position: relative;
    }
    .workspace-card:hover {
      border-color: var(--pv-accent-blue);
      box-shadow: var(--pv-shadow-glow-blue);
      transform: translateY(-2px);
    }
    .ws-card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .ws-icon {
      font-size: 1.5rem;
    }
    .ws-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.2rem 0.6rem;
      border-radius: 20px;
      background: rgba(14, 165, 233, 0.12);
      color: var(--pv-accent-blue);
      border: 1px solid rgba(14, 165, 233, 0.25);
    }
    .ws-name {
      margin: 0 0 0.5rem 0;
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--pv-text-primary);
    }
    .ws-desc {
      color: var(--pv-text-secondary);
      font-size: 0.88rem;
      line-height: 1.5;
      margin: 0 0 1.25rem 0;
      flex: 1;
    }
    .ws-meta {
      font-size: 0.78rem;
      color: var(--pv-text-subtle);
      margin-bottom: 1rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--pv-border);
    }
    .ws-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }
    .xs-btn {
      padding: 0.35rem 0.75rem;
      font-size: 0.78rem;
    }
    .danger-hover:hover {
      color: var(--pv-accent-red);
      border-color: rgba(220, 38, 38, 0.4);
    }
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-dialog {
      width: 480px;
      max-width: 90vw;
      padding: 1.75rem;
      background: var(--pv-bg-elevated);
      box-shadow: var(--pv-shadow-lg);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    .modal-header h2 {
      margin: 0;
      font-size: 1.25rem;
      color: var(--pv-text-primary);
    }
    .close-btn {
      background: none;
      border: none;
      color: var(--pv-text-muted);
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }
    .close-btn:hover {
      color: var(--pv-text-primary);
    }
    .form-group {
      margin-bottom: 1.25rem;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }
  `]
})
export class WorkspacesComponent implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);

  workspaces = signal<WorkspaceResponse[]>([]);
  loading = signal(true);
  showCreateModal = signal(false);
  editingWorkspace = signal<WorkspaceResponse | null>(null);
  hoveredWorkspaceId = signal<string | null>(null);
  workspaceForm = signal<CreateWorkspaceRequest & { id?: string }>({ name: '', description: '' });

  ngOnInit() {
    this.loadWorkspaces();
  }

  loadWorkspaces() {
    this.loading.set(true);
    this.apiService.listWorkspaces().subscribe({
      next: (data) => {
        this.workspaces.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load workspaces:', err);
        this.loading.set(false);
      }
    });
  }

  viewWorkspace(id: string) {
    this.router.navigate(['/documents/workspace', id]);
  }

  editWorkspace(workspace: WorkspaceResponse, event: Event) {
    event.stopPropagation();
    this.editingWorkspace.set(workspace);
    this.workspaceForm.set({
      id: workspace.id,
      name: workspace.name,
      description: workspace.description
    });
    this.showCreateModal.set(true);
  }

  deleteWorkspace(id: string, event: Event) {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this workspace?')) {
      this.apiService.deleteWorkspace(id).subscribe({
        next: () => {
          this.workspaces.update(ws => ws.filter(w => w.id !== id));
        },
        error: (err) => {
          console.error('Failed to delete workspace:', err);
          alert('Failed to delete workspace');
        }
      });
    }
  }

  saveWorkspace() {
    if (this.editingWorkspace()) {
      const updateReq: UpdateWorkspaceRequest = {
        name: this.workspaceForm().name,
        description: this.workspaceForm().description
      };
      this.apiService.updateWorkspace(this.workspaceForm().id!, updateReq).subscribe({
        next: (updated) => {
          this.workspaces.update(ws => ws.map(w => w.id === updated.id ? updated : w));
          this.closeModal();
        },
        error: (err) => {
          console.error('Failed to update workspace:', err);
          alert('Failed to update workspace');
        }
      });
    } else {
      const createReq: CreateWorkspaceRequest = {
        name: this.workspaceForm().name,
        description: this.workspaceForm().description
      };
      this.apiService.createWorkspace(createReq).subscribe({
        next: (created) => {
          this.workspaces.update(ws => [...ws, created]);
          this.closeModal();
        },
        error: (err) => {
          console.error('Failed to create workspace:', err);
          alert('Failed to create workspace');
        }
      });
    }
  }

  closeModal() {
    this.showCreateModal.set(false);
    this.editingWorkspace.set(null);
    this.workspaceForm.set({ name: '', description: '' });
  }
}
