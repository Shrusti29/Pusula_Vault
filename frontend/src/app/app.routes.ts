import { Routes } from '@angular/router';
import { authGuard, leadershipGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent) },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'workspaces',
    loadComponent: () => import('./features/workspaces/workspaces.component').then(m => m.WorkspacesComponent),
    canActivate: [authGuard]
  },
  {
    path: 'documents',
    loadComponent: () => import('./features/documents/documents.component').then(m => m.DocumentsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'audit',
    loadComponent: () => import('./features/audit/audit.component').then(m => m.AuditComponent),
    canActivate: [authGuard]
  },
  {
    path: 'analytics',
    loadComponent: () => import('./features/analytics/analytics.component').then(m => m.AnalyticsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent),
    canActivate: [authGuard]
  },
  {
    path: 'governance',
    loadComponent: () => import('./features/governance/governance.component').then(m => m.GovernanceComponent),
    canActivate: [authGuard]
  },
  {
    path: 'documents/workspace/:workspaceId/:folderId?',
    loadComponent: () => import('./features/documents/document-browser.component').then(m => m.DocumentBrowserComponent),
    canActivate: [authGuard]
  },
  {
    path: 'document/:documentId',
    loadComponent: () => import('./features/documents/document-workspace.component').then(m => m.DocumentWorkspaceComponent),
    canActivate: [authGuard]
  },
  {
    path: 'desk',
    loadComponent: () => import('./features/desk/vault-desk.component').then(m => m.VaultDeskComponent),
    canActivate: [leadershipGuard]
  },
  {
    path: 'files',
    loadComponent: () => import('./features/files/file-vault.component').then(m => m.FileVaultComponent),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: 'dashboard' }
];
