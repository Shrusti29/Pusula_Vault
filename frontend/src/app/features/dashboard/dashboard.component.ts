import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { WorkspaceResponse, DocumentResponse, OverviewMetrics } from '../../core/models/pusula.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <h1>Pusula Vault Dashboard</h1>
        <p>Welcome to the enterprise knowledge management platform.</p>
      </div>

      @if (loading()) {
        <div class="loading-state">Loading dashboard...</div>
      } @else {
        <div class="metrics-grid">
          <div class="pv-card metric-card">
            <div class="metric-label">Total Workspaces</div>
            <div class="metric-value">{{ metrics().workspaces }}</div>
          </div>
          <div class="pv-card metric-card">
            <div class="metric-label">Total Documents</div>
            <div class="metric-value">{{ metrics().totalDocuments }}</div>
          </div>
          <div class="pv-card metric-card">
            <div class="metric-label">Total Users</div>
            <div class="metric-value">{{ metrics().totalUsers }}</div>
          </div>
          <div class="pv-card metric-card">
            <div class="metric-label">Active Users (7d)</div>
            <div class="metric-value">{{ metrics().activeUsersLast7d }}</div>
          </div>
        </div>

        <div class="content-grid">
          <div class="pv-card">
            <div class="pv-card-header">
              <h3>Workspaces</h3>
              <button (click)="router.navigate(['/workspaces'])" class="pv-btn pv-btn-primary">View All</button>
            </div>
            <div class="pv-card-body">
              @if (workspaces().length === 0) {
                <p class="empty-state">No workspaces available.</p>
              } @else {
                <div class="item-list">
                  @for (ws of workspaces().slice(0, 5); track ws.id) {
                    <div class="hover-item" (click)="router.navigate(['/documents/workspace', ws.id])">
                      <div class="item-title">{{ ws.name }}</div>
                      <div class="item-description">{{ ws.description || 'No description' }}</div>
                      <div class="item-meta">{{ ws.documentCount || 0 }} documents</div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>

          <div class="pv-card">
            <div class="pv-card-header">
              <h3>Recent Documents</h3>
              <button (click)="router.navigate(['/documents'])" class="pv-btn pv-btn-primary">View All</button>
            </div>
            <div class="pv-card-body">
              @if (recentDocuments().length === 0) {
                <p class="empty-state">No recent documents.</p>
              } @else {
                <div class="item-list">
                  @for (doc of recentDocuments().slice(0, 5); track doc.id) {
                    <div class="hover-item" (click)="router.navigate(['/document', doc.id])">
                      <div class="item-title">{{ doc.title }}</div>
                      <div class="item-description">{{ doc.contentType }}</div>
                      <div class="item-meta">Updated: {{ doc.updatedAt | date:'short' }}</div>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>

        <div class="action-bar">
          <button (click)="router.navigate(['/workspaces'])" class="pv-btn pv-btn-primary">Manage Workspaces</button>
          <button (click)="router.navigate(['/documents'])" class="pv-btn pv-btn-outline">Browse Documents</button>
          <button (click)="router.navigate(['/analytics'])" class="pv-btn pv-btn-ghost">View Analytics</button>
          <button (click)="router.navigate(['/audit'])" class="pv-btn pv-btn-ghost">View Audit Logs</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }
    .dashboard-header {
      margin-bottom: 2rem;
    }
    .dashboard-header h1 {
      font-size: 2rem;
      margin: 0 0 0.5rem 0;
      background: linear-gradient(135deg, var(--pv-text-primary) 0%, var(--pv-accent-primary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .dashboard-header p {
      color: var(--pv-text-muted);
      margin: 0;
    }
    .loading-state {
      text-align: center;
      padding: 3rem;
      color: var(--pv-text-muted);
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .metric-card {
      padding: 1.5rem;
      text-align: center;
    }
    .metric-label {
      font-size: 0.875rem;
      color: var(--pv-text-muted);
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 600;
    }
    .metric-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--pv-accent-primary);
    }
    .content-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .item-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .hover-item {
      padding: 1rem;
      background: var(--pv-bg-dark);
      border: 1px solid var(--pv-border);
      border-radius: var(--pv-radius-md);
      cursor: pointer;
      transition: all var(--pv-transition-fast);
    }
    .hover-item:hover {
      background: var(--pv-bg-card-hover);
      border-color: var(--pv-accent-primary);
      transform: translateX(4px);
    }
    .item-title {
      font-weight: 600;
      color: var(--pv-text-primary);
      margin-bottom: 0.25rem;
    }
    .item-description {
      font-size: 0.875rem;
      color: var(--pv-text-secondary);
      margin-bottom: 0.25rem;
    }
    .item-meta {
      font-size: 0.8rem;
      color: var(--pv-text-muted);
    }
    .empty-state {
      color: var(--pv-text-muted);
      text-align: center;
      padding: 2rem;
    }
    .action-bar {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private apiService = inject(ApiService);
  router = inject(Router);

  workspaces = signal<WorkspaceResponse[]>([]);
  recentDocuments = signal<DocumentResponse[]>([]);
  metrics = signal<OverviewMetrics>({
    totalUsers: 0,
    totalDocuments: 0,
    totalFiles: 0,
    storageUsedBytes: 0,
    docsCreatedToday: 0,
    docsModifiedToday: 0,
    aiInteractionsLast7d: 0,
    activeUsersLast7d: 0,
    workspaces: 0
  });
  loading = signal(true);

  ngOnInit() {
    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading.set(true);

    this.apiService.listWorkspaces().subscribe({
      next: (data) => {
        this.workspaces.set(data);
        if (data.length > 0) {
          this.apiService.listDocuments({ workspaceId: data[0].id, page: 0, size: 5 }).subscribe({
            next: (docData) => {
              this.recentDocuments.set(docData.content);
              this.loading.set(false);
            },
            error: (err) => {
              console.error('Failed to load recent documents:', err);
              this.loading.set(false);
            }
          });
        } else {
          this.loading.set(false);
        }
      },
      error: (err) => {
        console.error('Failed to load workspaces:', err);
        this.loading.set(false);
      }
    });

    this.apiService.analyticsOverview().subscribe({
      next: (data) => {
        this.metrics.set(data);
      },
      error: (err) => {
        console.error('Failed to load metrics:', err);
      }
    });
  }
}

