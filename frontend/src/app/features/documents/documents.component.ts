import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/auth/auth.service';
import { DocumentResponse, PaginatedResponse, WorkspaceResponse, FolderResponse } from '../../core/models/pusula.models';
import { Subscription } from 'rxjs';

interface DocumentType {
  value: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="documents-container" style="padding: 2rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h1 style="font-size: 1.75rem; margin: 0;">Documents</h1>
        <button class="btn-primary" (click)="showCreateModal.set(true)" style="padding: 0.75rem 1.5rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600;">
          + New Document
        </button>
      </div>

      <div class="filters" style="background: white; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem; border: 1px solid #e0e0e0;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <div>
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.9rem;">Workspace</label>
            <select [(ngModel)]="selectedWorkspaceId" (change)="loadDocuments()" style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">
              <option value="">Select Workspace</option>
              @for (ws of workspaces(); track ws.id) {
                <option [value]="ws.id">{{ ws.name }}</option>
              }
            </select>
          </div>
          <div>
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.9rem;">Folder</label>
            <select [(ngModel)]="selectedFolderId" (change)="loadDocuments()" style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;" [disabled]="!selectedWorkspaceId">
              <option value="">All Folders</option>
              @for (folder of folders(); track folder.id) {
                <option [value]="folder.id">{{ folder.name }}</option>
              }
            </select>
          </div>
          <div>
            <label style="display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.9rem;">Search</label>
            <input type="text" [(ngModel)]="searchQuery" placeholder="Search documents..." style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;" />
          </div>
        </div>
      </div>

      @if (loading()) {
        <div style="text-align: center; padding: 3rem; color: #666;">Loading documents...</div>
      } @else if (!selectedWorkspaceId) {
        <div style="text-align: center; padding: 3rem; color: #999;">
          <p>Please select a workspace to view documents.</p>
        </div>
      } @else if (paginatedResponse().content.length === 0) {
        <div style="text-align: center; padding: 3rem; color: #999;">
          <p>No documents found in this workspace.</p>
        </div>
      } @else {
        <div style="background: white; border-radius: 8px; border: 1px solid #e0e0e0; overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead style="background: #f8f9fa; border-bottom: 2px solid #e0e0e0;">
              <tr>
                <th style="padding: 1rem; text-align: left; font-weight: 600; color: #333;">Title</th>
                <th style="padding: 1rem; text-align: left; font-weight: 600; color: #333;">Type</th>
                <th style="padding: 1rem; text-align: left; font-weight: 600; color: #333;">Status</th>
                <th style="padding: 1rem; text-align: left; font-weight: 600; color: #333;">Version</th>
                <th style="padding: 1rem; text-align: left; font-weight: 600; color: #333;">Last Updated</th>
                <th style="padding: 1rem; text-align: left; font-weight: 600; color: #333;">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (doc of filteredDocuments(); track doc.id; let even = $even) {
                <tr [style.background]="even ? '#f8f9fa' : 'white'" style="border-bottom: 1px solid #f0f0f0; cursor: pointer;" (click)="viewDocument(doc.id)">
                  <td style="padding: 1rem;">
                    <div style="font-weight: 500; color: #333;">{{ doc.title }}</div>
                    <div style="font-size: 0.85rem; color: #999; margin-top: 0.25rem;">{{ doc.contentType }}</div>
                  </td>
                  <td style="padding: 1rem; color: #666;">{{ doc.documentType || 'TEXT' }}</td>
                  <td style="padding: 1rem;">
                    <span [style.padding]="'0.25rem 0.75rem'" [style.border-radius]="'12px'" [style.fontSize]="'0.8rem'" [style.font-weight]="'600'"
                      [style.background]="doc.status === 'ACTIVE' ? '#d4edda' : doc.status === 'DRAFT' ? '#fff3cd' : '#f8d7da'"
                      [style.color]="doc.status === 'ACTIVE' ? '#155724' : doc.status === 'DRAFT' ? '#856404' : '#721c24'">
                      {{ doc.status }}
                    </span>
                  </td>
                  <td style="padding: 1rem; color: #666;">v{{ doc.currentVersion }}</td>
                  <td style="padding: 1rem; color: #666; font-size: 0.9rem;">{{ doc.updatedAt | date:'short' }}</td>
                  <td style="padding: 1rem;">
                    <button *ngIf="!auth.isRestricted()" (click)="deleteDocument(doc.id, $event)" style="padding: 0.4rem 0.8rem; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem;">Delete</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          @if (paginatedResponse().totalPages > 1) {
            <div style="padding: 1rem; border-top: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center;">
              <span style="color: #666; font-size: 0.9rem;">
                Page {{ paginatedResponse().number + 1 }} of {{ paginatedResponse().totalPages }}
                ({{ paginatedResponse().totalElements }} total)
              </span>
              <div style="display: flex; gap: 0.5rem;">
                <button (click)="goToPage(paginatedResponse().number - 1)" [disabled]="paginatedResponse().first" style="padding: 0.5rem 1rem; background: #f0f0f0; border: none; border-radius: 4px; cursor: pointer;">Previous</button>
                <button (click)="goToPage(paginatedResponse().number + 1)" [disabled]="paginatedResponse().last" style="padding: 0.5rem 1rem; background: #f0f0f0; border: none; border-radius: 4px; cursor: pointer;">Next</button>
              </div>
            </div>
          }
        </div>
      }

      @if (showCreateModal()) {
        <div class="modal-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;" (click)="showCreateModal.set(false)">
          <div class="modal-content" style="background: white; border-radius: 8px; padding: 2rem; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto;" (click)="$event.stopPropagation()">
            <h2 style="margin: 0 0 1.5rem 0;">Create New Document</h2>
            <form (ngSubmit)="submitCreateDocument()">
              <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Document Title</label>
                <input type="text" [(ngModel)]="newDocTitle" name="title" required style="width: 100%; padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px;" />
              </div>
              <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Document Type</label>
                <select [(ngModel)]="newDocType" name="docType" style="width: 100%; padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px;">
                  @for (type of documentTypes; track type.value) {
                    <option [value]="type.value">{{ type.label }}</option>
                  }
                </select>
              </div>
              <div style="margin-bottom: 1rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Sensitivity Level</label>
                <select [(ngModel)]="newDocSensitivity" name="sensitivity" style="width: 100%; padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px;">
                  <option value="PUBLIC">Public</option>
                  <option value="INTERNAL">Internal</option>
                  <option value="CONFIDENTIAL">Confidential</option>
                  <option value="RESTRICTED">Restricted</option>
                  <option value="TOP_SECRET">Top Secret</option>
                </select>
              </div>
              <div style="margin-bottom: 1.5rem;">
                <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Initial Content</label>
                <textarea [(ngModel)]="newDocContent" name="content" rows="6" style="width: 100%; padding: 0.75rem; border: 1px solid #ccc; border-radius: 4px; font-family: monospace;"></textarea>
              </div>
              <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                <button type="button" (click)="showCreateModal.set(false)" style="padding: 0.75rem 1.5rem; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                <button type="submit" style="padding: 0.75rem 1.5rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Create Document</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class DocumentsComponent implements OnInit, OnDestroy {
  private apiService = inject(ApiService);
  auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  workspaces = signal<WorkspaceResponse[]>([]);
  folders = signal<FolderResponse[]>([]);
  paginatedResponse = signal<PaginatedResponse<DocumentResponse>>({
    content: [],
    totalElements: 0,
    totalPages: 0,
    size: 20,
    number: 0,
    first: true,
    last: true
  });
  loading = signal(false);
  selectedWorkspaceId = '';
  selectedFolderId = '';
  searchQuery = '';
  currentPage = 0;
  pageSize = 20;
  showCreateModal = signal(false);
  newDocTitle = '';
  newDocType = 'WORD';
  newDocSensitivity = 'INTERNAL';
  newDocContent = '';

  documentTypes: DocumentType[] = [
    { value: 'WORD', label: 'Word Document', icon: '📄' },
    { value: 'EXCEL', label: 'Excel Spreadsheet', icon: '📊' },
    { value: 'POWERPOINT', label: 'PowerPoint Presentation', icon: '📽️' },
    { value: 'CODEBASE', label: 'Codebase/Repository', icon: '💻' },
    { value: 'CUSTOM_FORM', label: 'Custom Form', icon: '📝' },
    { value: 'TEXT', label: 'Text Document', icon: '📃' },
    { value: 'PDF', label: 'PDF Document', icon: '📕' }
  ];

  private subscription: Subscription | null = null;

  ngOnInit() {
    this.loadWorkspaces();
    this.route.params.subscribe(params => {
      if (params['workspaceId']) {
        this.selectedWorkspaceId = params['workspaceId'];
        this.loadDocuments();
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  loadWorkspaces() {
    this.apiService.listWorkspaces().subscribe({
      next: (data) => {
        this.workspaces.set(data);
      },
      error: (err) => {
        console.error('Failed to load workspaces:', err);
      }
    });
  }

  loadDocuments() {
    if (!this.selectedWorkspaceId) return;

    this.loading.set(true);
    this.subscription = this.apiService.listDocuments({
      workspaceId: this.selectedWorkspaceId,
      folderId: this.selectedFolderId || undefined,
      page: this.currentPage,
      size: this.pageSize
    }).subscribe({
      next: (data) => {
        this.paginatedResponse.set(data);
        this.loading.set(false);
        if (this.selectedWorkspaceId) {
          this.loadFolders(this.selectedWorkspaceId);
        }
      },
      error: (err) => {
        console.error('Failed to load documents:', err);
        this.loading.set(false);
      }
    });
  }

  loadFolders(workspaceId: string) {
    this.apiService.listFolders(workspaceId).subscribe({
      next: (data) => {
        this.folders.set(data);
      },
      error: (err) => {
        console.error('Failed to load folders:', err);
      }
    });
  }

  get filteredDocuments() {
    return () => {
      if (!this.searchQuery) {
        return this.paginatedResponse().content;
      }
      const query = this.searchQuery.toLowerCase();
      return this.paginatedResponse().content.filter(doc =>
        doc.title.toLowerCase().includes(query) ||
        (doc.content && doc.content.toLowerCase().includes(query))
      );
    };
  }

  viewDocument(id: string) {
    this.router.navigate(['/document', id]);
  }

  createDocument() {
    if (!this.selectedWorkspaceId) {
      alert('Please select a workspace first');
      return;
    }
    this.router.navigate(['/document/new'], { queryParams: { workspaceId: this.selectedWorkspaceId, folderId: this.selectedFolderId } });
  }

  deleteDocument(id: string, event: Event) {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this document?')) {
      this.apiService.deleteDocument(id).subscribe({
        next: () => {
          this.loadDocuments();
        },
        error: (err) => {
          console.error('Failed to delete document:', err);
          alert('Failed to delete document');
        }
      });
    }
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.loadDocuments();
  }

  starterContent(type: string): string {
    if (type === 'EXCEL') {
      return JSON.stringify({ rows: Array.from({ length: 8 }, () => Array.from({ length: 6 }, () => '')) });
    }
    if (type === 'POWERPOINT') {
      return JSON.stringify({ slides: [{ title: this.newDocTitle || 'Slide 1', bullets: [''] }] });
    }
    if (type === 'CODEBASE') {
      return JSON.stringify({ language: 'typescript', code: '' });
    }
    if (type === 'PDF' || type === 'CUSTOM_FORM') {
      return JSON.stringify({ kind: 'file', notes: '' });
    }
    return '<p></p>';
  }

  submitCreateDocument() {
    if (!this.selectedWorkspaceId) {
      alert('Please select a workspace first');
      return;
    }

    const payload = {
      workspaceId: this.selectedWorkspaceId,
      folderId: this.selectedFolderId || undefined,
      title: this.newDocTitle,
      content: this.starterContent(this.newDocType),
      contentType: 'application/vnd.pusula.document',
      documentType: this.newDocType,
      sensitivityLevel: this.newDocSensitivity,
      governancePolicyId: undefined
    };

    this.apiService.createDocument(payload).subscribe({
      next: (doc) => {
        this.showCreateModal.set(false);
        this.newDocTitle = '';
        this.newDocContent = '';
        this.newDocType = 'WORD';
        this.newDocSensitivity = 'INTERNAL';
        this.router.navigate(['/document', doc.id]);
      },
      error: (err) => {
        console.error('Failed to create document:', err);
        alert('Failed to create document');
      }
    });
  }
}

