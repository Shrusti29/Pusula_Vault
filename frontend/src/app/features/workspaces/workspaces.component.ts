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
    <div class="workspaces-container" style="padding: 2rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h1 style="font-size: 1.75rem; margin: 0;">Workspaces</h1>
        <button class="btn-primary" (click)="showCreateModal.set(true)" style="padding: 0.75rem 1.5rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">
          + New Workspace
        </button>
      </div>

      @if (loading()) {
        <div style="text-align: center; padding: 3rem; color: #666;">Loading workspaces...</div>
      } @else if (workspaces().length === 0) {
        <div style="text-align: center; padding: 3rem; color: #999;">
          <p>No workspaces found. Create your first workspace to get started.</p>
        </div>
      } @else {
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">
          @for (ws of workspaces(); track ws.id) {
            <div class="workspace-card" [class.hovered]="hoveredWorkspaceId() === ws.id" (click)="viewWorkspace(ws.id)" (mouseenter)="hoveredWorkspaceId.set(ws.id)" (mouseleave)="hoveredWorkspaceId.set(null)">
              <h3 style="margin: 0 0 0.5rem 0; font-size: 1.25rem; color: #333;">{{ ws.name }}</h3>
              <p style="margin: 0 0 1rem 0; color: #666; font-size: 0.9rem;">{{ ws.description || 'No description' }}</p>
              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; color: #999;">
                <span>{{ ws.documentCount || 0 }} documents</span>
                <span>Created: {{ ws.createdAt | date:'shortDate' }}</span>
              </div>
              <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #f0f0f0; display: flex; gap: 0.5rem;">
                <button class="btn-secondary" (click)="editWorkspace(ws, $event)" style="padding: 0.4rem 0.8rem; background: #f0f0f0; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">Edit</button>
                <button class="btn-danger" (click)="deleteWorkspace(ws.id, $event)" style="padding: 0.4rem 0.8rem; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">Delete</button>
              </div>
            </div>
          }
        </div>
      }

      @if (showCreateModal()) {
        <div class="modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
          <div class="modal-content" style="background: white; padding: 2rem; border-radius: 8px; width: 400px; max-width: 90%;">
            <h2 style="margin: 0 0 1.5rem 0;">{{ editingWorkspace() ? 'Edit Workspace' : 'Create Workspace' }}</h2>
            <form (ngSubmit)="saveWorkspace()">
              <div class="form-group" style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Name</label>
                <input type="text" [(ngModel)]="workspaceForm().name" name="name" required style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;" />
              </div>
              <div class="form-group" style="margin-bottom: 1.5rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Description</label>
                <textarea [(ngModel)]="workspaceForm().description" name="description" rows="3" style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; resize: vertical;"></textarea>
              </div>
              <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                <button type="button" (click)="closeModal()" style="padding: 0.5rem 1rem; background: #f0f0f0; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                <button type="submit" style="padding: 0.5rem 1rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">{{ editingWorkspace() ? 'Update' : 'Create' }}</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .workspace-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 1.5rem;
      cursor: pointer;
      transition: box-shadow 0.2s, transform 0.2s;
    }
    .workspace-card.hovered {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transform: translateY(-2px);
    }
    .btn-secondary:hover {
      background: #e0e0e0;
    }
    .btn-danger:hover {
      background: #c82333;
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
