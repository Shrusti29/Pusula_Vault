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
    <div class="documents-container">
      <div class="documents-header">
        <div>
          <h1 class="page-title">Documents</h1>
          <p class="page-subtitle">Manage, create, and collaborate on intelligent workspace documents</p>
        </div>
        <button class="pv-btn pv-btn-primary" (click)="showCreateModal.set(true)">
          <span style="font-size: 1.1rem; margin-right: 0.35rem;">+</span> New Document
        </button>
      </div>

      <div class="pv-card filters-card">
        <div class="filters-grid">
          <div>
            <label class="pv-label">Workspace</label>
            <select class="pv-select" [(ngModel)]="selectedWorkspaceId" (change)="loadDocuments()">
              <option value="">-- Select Workspace --</option>
              @for (ws of workspaces(); track ws.id) {
                <option [value]="ws.id">{{ ws.name }}</option>
              }
            </select>
          </div>
          <div>
            <label class="pv-label">Folder</label>
            <select class="pv-select" [(ngModel)]="selectedFolderId" (change)="loadDocuments()" [disabled]="!selectedWorkspaceId">
              <option value="">All Folders</option>
              @for (folder of folders(); track folder.id) {
                <option [value]="folder.id">{{ folder.name }}</option>
              }
            </select>
          </div>
          <div>
            <label class="pv-label">Search</label>
            <input type="text" class="pv-input" [(ngModel)]="searchQuery" placeholder="Filter by title..." />
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state">Loading documents...</div>
      } @else if (!selectedWorkspaceId) {
        <div class="pv-card empty-state-card">
          <div class="empty-icon">📁</div>
          <h3>Select a workspace</h3>
          <p>Please select a workspace above to view and manage documents.</p>
        </div>
      } @else if (paginatedResponse().content.length === 0) {
        <div class="pv-card empty-state-card">
          <div class="empty-icon">📄</div>
          <h3>No documents found</h3>
          <p>There are no documents in this workspace folder yet.</p>
          <button class="pv-btn pv-btn-primary" style="margin-top: 1rem;" (click)="showCreateModal.set(true)">+ Create First Document</button>
        </div>
      } @else {
        <div class="pv-card table-card">
          <table class="pv-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Version</th>
                <th>Last Updated</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (doc of filteredDocuments(); track doc.id) {
                <tr class="clickable-row" (click)="viewDocument(doc.id)">
                  <td>
                    <div class="doc-title-cell">
                      <span class="doc-type-icon">📄</span>
                      <div>
                        <div class="doc-title">{{ doc.title }}</div>
                        <div class="doc-sub">{{ doc.contentType }}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="pv-badge pv-badge-blue">{{ doc.documentType || 'TEXT' }}</span>
                  </td>
                  <td>
                    <span class="pv-badge"
                      [class.pv-badge-green]="doc.status === 'ACTIVE'"
                      [class.pv-badge-amber]="doc.status === 'DRAFT'"
                      [class.pv-badge-red]="doc.status === 'ARCHIVED'">
                      {{ doc.status }}
                    </span>
                  </td>
                  <td class="version-cell">v{{ doc.currentVersion }}</td>
                  <td class="date-cell">{{ doc.updatedAt | date:'mediumDate' }}</td>
                  <td style="text-align: right;" (click)="$event.stopPropagation()">
                    <button *ngIf="!auth.isRestricted()" class="pv-btn pv-btn-ghost xs-btn danger-hover" (click)="deleteDocument(doc.id, $event)">Delete</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          @if (paginatedResponse().totalPages > 1) {
            <div class="pagination-bar">
              <span class="page-info">
                Page {{ paginatedResponse().number + 1 }} of {{ paginatedResponse().totalPages }}
                ({{ paginatedResponse().totalElements }} total)
              </span>
              <div class="page-buttons">
                <button class="pv-btn pv-btn-outline xs-btn" (click)="goToPage(paginatedResponse().number - 1)" [disabled]="paginatedResponse().first">Previous</button>
                <button class="pv-btn pv-btn-outline xs-btn" (click)="goToPage(paginatedResponse().number + 1)" [disabled]="paginatedResponse().last">Next</button>
              </div>
            </div>
          }
        </div>
      }

      @if (showCreateModal()) {
        <div class="modal-backdrop" (click)="showCreateModal.set(false)">
          <div class="modal-dialog pv-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Create New Document</h2>
              <button class="close-btn" (click)="showCreateModal.set(false)">&times;</button>
            </div>
            <form (ngSubmit)="submitCreateDocument()">
              <div class="form-group">
                <label class="pv-label">Document Title</label>
                <input type="text" class="pv-input" [(ngModel)]="newDocTitle" name="title" required placeholder="e.g. Q4 Strategy, Security Architecture" />
              </div>
              <div class="form-group">
                <label class="pv-label">Document Type</label>
                <select class="pv-select" [(ngModel)]="newDocType" name="docType">
                  @for (type of documentTypes; track type.value) {
                    <option [value]="type.value">{{ type.label }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label class="pv-label">Sensitivity Level</label>
                <select class="pv-select" [(ngModel)]="newDocSensitivity" name="sensitivity">
                  <option value="PUBLIC">Public</option>
                  <option value="INTERNAL">Internal</option>
                  <option value="CONFIDENTIAL">Confidential</option>
                  <option value="RESTRICTED">Restricted</option>
                  <option value="TOP_SECRET">Top Secret</option>
                </select>
              </div>
              <div class="form-group">
                <label class="pv-label">Initial Content (Optional)</label>
                <textarea class="pv-textarea" [(ngModel)]="newDocContent" name="content" rows="4" placeholder="Brief notes or outline..."></textarea>
              </div>
              <div class="modal-footer">
                <button type="button" class="pv-btn pv-btn-outline" (click)="showCreateModal.set(false)">Cancel</button>
                <button type="submit" class="pv-btn pv-btn-primary" [disabled]="!newDocTitle.trim()">Create Document</button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .documents-container {
      max-width: 1400px;
      margin: 0 auto;
    }
    .documents-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
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
    .filters-card {
      padding: 1.25rem;
      margin-bottom: 1.5rem;
    }
    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }
    .loading-state {
      text-align: center;
      padding: 3rem;
      color: var(--pv-text-muted);
    }
    .empty-state-card {
      text-align: center;
      padding: 3.5rem 2rem;
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
    .table-card {
      overflow: hidden;
    }
    .clickable-row {
      cursor: pointer;
      transition: background var(--pv-transition-fast);
    }
    .clickable-row:hover {
      background: var(--pv-bg-card-hover);
    }
    .doc-title-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .doc-type-icon {
      font-size: 1.25rem;
    }
    .doc-title {
      font-weight: 600;
      color: var(--pv-text-primary);
    }
    .doc-sub {
      font-size: 0.75rem;
      color: var(--pv-text-subtle);
      margin-top: 0.15rem;
    }
    .version-cell {
      color: var(--pv-text-muted);
      font-size: 0.85rem;
      font-family: monospace;
    }
    .date-cell {
      color: var(--pv-text-muted);
      font-size: 0.85rem;
    }
    .xs-btn {
      padding: 0.3rem 0.65rem;
      font-size: 0.75rem;
    }
    .danger-hover:hover {
      color: var(--pv-accent-red);
      background: rgba(220, 38, 38, 0.1);
    }
    .pagination-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      border-top: 1px solid var(--pv-border);
    }
    .page-info {
      font-size: 0.82rem;
      color: var(--pv-text-muted);
    }
    .page-buttons {
      display: flex;
      gap: 0.5rem;
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
      width: 540px;
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
      margin-bottom: 1.2rem;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }
  `]
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
        if (!this.selectedWorkspaceId && data.length > 0) {
          this.selectedWorkspaceId = data[0].id;
          this.loadDocuments();
        }
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

