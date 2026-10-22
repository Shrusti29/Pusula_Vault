import { Component, signal, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { ApiService } from './core/services/api.service';
import { GlobalSearchComponent } from './shared/components/global-search.component';
import { DrmWatermarkComponent } from './shared/components/drm-watermark.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive, GlobalSearchComponent, DrmWatermarkComponent],
  host: {
    '(contextmenu)': 'preventContextMenu($event)',
    '(selectstart)': 'preventSelection($event)',
    '(copy)': 'preventCopy($event)',
    '(keydown)': 'handleKeydown($event)'
  },
  template: `
    @if (!authService.isAuthenticated()) {
      <router-outlet />
    } @else {
      <div class="app-shell" [class.protected-view]="authService.isRestricted()">
        @if (captureShield()) {
          <div class="capture-shield">Protected view. A capture attempt was recorded.</div>
        }
        <header class="app-topbar">
          <div class="topbar-left">
            <button class="sidebar-toggle" (click)="toggleSidebar()" [class.collapsed]="isSidebarCollapsed()">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div class="brand-block">
              <div class="brand-logo">
                <svg width="28" height="28" viewBox="0 0 48 48" fill="none">
                  <path d="M24 4 L40 22 L32 44 L16 44 L8 22 Z" stroke="#0ea5e9" stroke-width="2" fill="rgba(14,165,233,0.1)"/>
                  <path d="M24 12 L32 22 L28 32 L20 32 L16 22 Z" fill="#dc2626"/>
                  <circle cx="24" cy="22" r="3" fill="#f8fafc"/>
                </svg>
              </div>
              <div class="brand-text">
                <h1 class="brand-title">PUSULA</h1>
                <span class="brand-sub">VAULT</span>
              </div>
            </div>
          </div>

          <div class="topbar-center">
            <button class="global-search-trigger" (click)="searchOverlayOpen.set(true)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <span>Search documents, files, knowledge...</span>
              <span class="kbd">Ctrl + K</span>
            </button>
          </div>

          <div class="topbar-right">
            <div class="workspace-switcher">
              <select class="workspace-select" [value]="activeWorkspace" (change)="onWorkspaceChange($event)">
                <option value="all">All Workspaces</option>
                @for (ws of workspaces; track ws.id) {
                  <option [value]="ws.id">{{ ws.name }}</option>
                }
              </select>
            </div>
            <button class="topbar-icon-btn" (click)="toggleNotifications()" title="Notifications">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span class="badge-dot"></span>
            </button>
            <div class="user-dropdown">
              <button class="user-btn" (click)="showUserMenu.set(!showUserMenu())">
                <div class="user-avatar">{{ initials }}</div>
                <div class="user-info">
                  <span class="user-name">{{ authService.currentUser()?.fullName || 'User' }}</span>
                  <span class="user-role">{{ authService.currentUser()?.role }}</span>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              @if (showUserMenu()) {
                <div class="user-menu slide-in-up">
                  <div class="user-menu-header">
                    <div class="user-avatar-lg">{{ initials }}</div>
                    <div>
                      <h4>{{ authService.currentUser()?.fullName }}</h4>
                      <p class="pv-badge pv-badge-blue">{{ authService.currentUser()?.role }}</p>
                    </div>
                  </div>
                  <div class="user-menu-divider"></div>
                  <a class="user-menu-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Profile
                  </a>
                  <a class="user-menu-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    Settings
                  </a>
                  <div class="user-menu-divider"></div>
                  <button class="user-menu-item danger" (click)="authService.logout()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Sign Out
                  </button>
                </div>
              }
            </div>
          </div>
        </header>

        <div class="main-layout" [class.sidebar-collapsed]="isSidebarCollapsed()">
          <aside class="app-sidebar" [class.collapsed]="isSidebarCollapsed()">
            <nav class="sidebar-nav">
              <div class="nav-section">
                <span class="nav-label" [class.hidden]="isSidebarCollapsed()">Main</span>
                <a routerLink="/dashboard" routerLinkActive="active" class="nav-item" [routerLinkActiveOptions]="{exact:true}">
                  <span class="nav-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                    </svg>
                  </span>
                  <span class="nav-text">Dashboard</span>
                </a>
                <a routerLink="/documents" routerLinkActive="active" class="nav-item">
                  <span class="nav-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </span>
                  <span class="nav-text">Documents</span>
                </a>
                <a routerLink="/files" routerLinkActive="active" class="nav-item">
                  <span class="nav-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                  </span>
                  <span class="nav-text">File Vault</span>
                </a>
              </div>
              <div class="nav-section">
                <span class="nav-label" [class.hidden]="isSidebarCollapsed()">Intelligence</span>
                <a routerLink="/desk" routerLinkActive="active" class="nav-item">
                  <span class="nav-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
                      <circle cx="7.5" cy="11.5" r="1.5" fill="currentColor"/>
                      <circle cx="16.5" cy="11.5" r="1.5" fill="currentColor"/>
                    </svg>
                  </span>
                  <span class="nav-text">Vault assistant</span>
                  <span class="nav-indicator-new" [class.hidden]="isSidebarCollapsed()">NEW</span>
                </a>
                <a routerLink="/analytics" routerLinkActive="active" class="nav-item">
                  <span class="nav-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                    </svg>
                  </span>
                  <span class="nav-text">Analytics</span>
                </a>
                <a routerLink="/audit" routerLinkActive="active" class="nav-item">
                  <span class="nav-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  </span>
                  <span class="nav-text">Audit Logs</span>
                </a>
                <a routerLink="/governance" routerLinkActive="active" class="nav-item">
                  <span class="nav-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      <path d="M9 12l2 2 4-4"/>
                    </svg>
                  </span>
                  <span class="nav-text">Governance</span>
                </a>
              </div>
              @if (showAdminNav) {
                <div class="nav-section">
                  <span class="nav-label" [class.hidden]="isSidebarCollapsed()">Administration</span>
                  <a routerLink="/admin" routerLinkActive="active" class="nav-item">
                    <span class="nav-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                    </span>
                    <span class="nav-text">User Management</span>
                  </a>
                </div>
              }
            </nav>

            <div class="sidebar-footer" [class.hidden]="isSidebarCollapsed()">
              <div class="storage-meter">
                <div class="storage-header">
                  <span class="storage-label">Storage</span>
                  <span class="storage-amount">34 GB / 500 GB</span>
                </div>
                <div class="storage-bar">
                  <div class="storage-fill" style="width: 6.8%"></div>
                </div>
              </div>
            </div>
          </aside>

          <main class="app-content">
            <router-outlet />
          </main>

          <div class="ai-drawer-wrapper" [class.open]="isAiDrawerOpen()">
            <button class="ai-drawer-toggle" (click)="toggleAiDrawer()" title="AI Assistant">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
              </svg>
            </button>
            @if (isAiDrawerOpen()) {
              <div class="ai-drawer slide-in-right">
                <div class="drawer-header">
                  <div class="drawer-title-block">
                    <div class="ai-logo">✨</div>
                    <div>
                      <h3>Knowledge AI</h3>
                      <p>RAG-powered with citations</p>
                    </div>
                  </div>
                  <button class="drawer-close" (click)="toggleAiDrawer()">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                <div class="drawer-tabs">
                  <button [class.active]="aiTab()=='chat'" (click)="aiTab.set('chat')">Chat</button>
                  <button [class.active]="aiTab()=='summary'" (click)="aiTab.set('summary')">Summary</button>
                  <button [class.active]="aiTab()=='citations'" (click)="aiTab.set('citations')">Sources</button>
                </div>
                <div class="drawer-body">
                  @if (aiTab() === 'chat') {
                    <div class="chat-messages">
                      @for (msg of aiMessages(); track msg.text + $index) {
                        <div class="chat-message" [class.ai]="msg.role === 'ai'" [class.user]="msg.role === 'user'">
                          <div class="chat-avatar" [class.ai]="msg.role === 'ai'" [class.user]="msg.role === 'user'">
                            {{ msg.role === 'ai' ? '✨' : initials }}
                          </div>
                          <div class="chat-bubble" [class.ai]="msg.role === 'ai'" [class.user]="msg.role === 'user'">
                            <p style="margin: 0; white-space: pre-wrap;">{{ msg.text }}</p>
                            @if (msg.sources?.length) {
                              <div class="citation-badges" style="margin-top: 0.5rem; display: flex; flex-wrap: wrap; gap: 0.35rem;">
                                @for (s of msg.sources; track s.title + $index) {
                                  <a [routerLink]="['/document', s.documentId]" class="pv-badge pv-badge-blue" style="text-decoration: none; font-size: 0.7rem;">
                                    📄 {{ s.title }}
                                  </a>
                                }
                              </div>
                            }
                          </div>
                        </div>
                      }
                      @if (aiLoading()) {
                        <div class="chat-message ai">
                          <div class="chat-avatar ai">✨</div>
                          <div class="chat-bubble ai">
                            <span class="pulsing-dots">Searching vault knowledge...</span>
                          </div>
                        </div>
                      }
                    </div>
                  }
                  @if (aiTab() === 'summary') {
                    <div class="pv-card fade-in">
                      <div class="pv-card-body">
                        <h4 style="margin-bottom: 0.75rem;">Executive Summary</h4>
                        <p class="muted-text" style="font-size: 0.85rem;">Instant intelligent summary across your workspace documents:</p>
                        <button class="pv-btn pv-btn-outline" style="margin-top: 0.5rem; width: 100%;" (click)="askVaultAi('Summarise the work done today')">Generate Today's Brief</button>
                      </div>
                    </div>
                  }
                  @if (aiTab() === 'citations') {
                    <div class="citation-list">
                      @if (aiCitations().length) {
                        @for (c of aiCitations(); track c.title + $index) {
                          <div class="pv-card" style="margin-bottom: 0.5rem;">
                            <div class="pv-card-body" style="padding: 0.75rem;">
                              <a [routerLink]="['/document', c.documentId]" style="font-weight: 600; color: var(--pv-accent-blue); text-decoration: none; font-size: 0.85rem;">
                                📄 {{ c.title }}
                              </a>
                              <p style="font-size: 0.78rem; color: var(--pv-text-secondary); margin: 0.25rem 0 0 0;">{{ c.excerpt }}</p>
                            </div>
                          </div>
                        }
                      } @else {
                        <p class="muted-text" style="font-size: 0.85rem;">Citations will appear here when AI answers reference documents.</p>
                      }
                    </div>
                  }
                </div>
                <div class="drawer-footer">
                  <input type="text" class="pv-input" [(ngModel)]="aiInputQuery" (keydown.enter)="sendAiMessage()" placeholder="Ask your knowledge vault..." [disabled]="aiLoading()" />
                  <button class="pv-btn pv-btn-primary" style="padding: 0.5rem 1rem;" (click)="sendAiMessage()" [disabled]="aiLoading() || !aiInputQuery.trim()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </button>
                </div>
              </div>
            }
          </div>
        </div>

        <global-search [(open)]="searchOverlayOpen" />
        <app-drm-watermark />
      </div>
    }
  `,
  styles: [`
    .protected-view {
      user-select: none;
      -webkit-user-select: none;
    }
    .protected-view .format-shell,
    .protected-view .editor-wrap,
    .protected-view input,
    .protected-view textarea,
    .protected-view [contenteditable="true"] {
      user-select: text;
      -webkit-user-select: text;
    }
    .capture-shield {
      position: fixed;
      inset: 0;
      z-index: 80;
      background: rgba(15, 23, 42, 0.94);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
      text-align: center;
      padding: 2rem;
    }
    @media print {
      .protected-view { display: none !important; }
    }

    .app-shell {
      position: relative;
      z-index: 1;
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* ==== TOPBAR ==== */
    .app-topbar {
      display: flex;
      align-items: center;
      height: 64px;
      flex-shrink: 0;
      padding: 0 1rem;
      background: linear-gradient(180deg, rgba(10,22,40,0.98) 0%, rgba(3,7,18,0.96) 100%);
      border-bottom: 1px solid var(--pv-border);
      backdrop-filter: blur(16px);
      position: relative;
      z-index: 50;
    }
    .topbar-left { display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; }
    .sidebar-toggle {
      background: transparent; border: none; color: var(--pv-text-muted);
      width: 38px; height: 38px; border-radius: 8px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all var(--pv-transition-fast);
    }
    .sidebar-toggle:hover { background: var(--pv-bg-card-hover); color: var(--pv-text-primary); }
    .brand-block { display: flex; align-items: center; gap: 0.65rem; padding-right: 1rem; }
    .brand-logo { display: flex; align-items: center; justify-content: center; }
    .brand-text { display: flex; align-items: baseline; gap: 0.25rem; }
    .brand-title {
      font-size: 1.25rem; font-weight: 800; letter-spacing: 0.08em;
      background: linear-gradient(135deg, #f8fafc 0%, #0ea5e9 100%);
      -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent;
    }
    .brand-sub { font-size: 0.75rem; font-weight: 700; color: var(--pv-accent-red); letter-spacing: 0.18em; }

    .topbar-center { flex: 1; display: flex; justify-content: center; max-width: 600px; margin: 0 1.5rem; }
    .global-search-trigger {
      display: flex; align-items: center; gap: 0.75rem;
      width: 100%; padding: 0.55rem 1rem;
      background: var(--pv-bg-card); border: 1px solid var(--pv-border);
      border-radius: 10px; color: var(--pv-text-muted); cursor: pointer;
      font-size: 0.875rem; font-family: inherit;
      transition: all var(--pv-transition-base);
    }
    .global-search-trigger:hover { border-color: var(--pv-accent-blue); color: var(--pv-text-secondary); box-shadow: var(--pv-shadow-glow-blue); }
    .global-search-trigger span { flex: 1; text-align: left; }
    .kbd {
      flex: 0 !important;
      padding: 0.15rem 0.5rem; background: var(--pv-bg-dark);
      border: 1px solid var(--pv-border); border-radius: 5px;
      font-size: 0.72rem; font-weight: 600; color: var(--pv-text-subtle);
    }

    .topbar-right { display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; }
    .workspace-select {
      padding: 0.5rem 0.75rem; background: var(--pv-bg-card);
      border: 1px solid var(--pv-border); border-radius: 8px;
      color: var(--pv-text-secondary); font-family: inherit; font-size: 0.85rem;
      cursor: pointer; outline: none; transition: border var(--pv-transition-fast);
    }
    .workspace-select:hover { border-color: var(--pv-accent-blue); }
    .topbar-icon-btn {
      position: relative; width: 40px; height: 40px;
      background: transparent; border: 1px solid var(--pv-border);
      border-radius: 10px; color: var(--pv-text-muted); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all var(--pv-transition-fast);
    }
    .topbar-icon-btn:hover { color: var(--pv-text-primary); border-color: var(--pv-accent-blue); }
    .badge-dot {
      position: absolute; top: 9px; right: 10px;
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--pv-accent-red);
      box-shadow: 0 0 0 2px var(--pv-bg-dark);
    }
    .user-dropdown { position: relative; }
    .user-btn {
      display: flex; align-items: center; gap: 0.65rem;
      padding: 0.35rem 0.5rem 0.35rem 0.35rem;
      background: var(--pv-bg-card); border: 1px solid var(--pv-border);
      border-radius: 10px; color: inherit; cursor: pointer;
      font-family: inherit; transition: all var(--pv-transition-fast);
    }
    .user-btn:hover { border-color: var(--pv-accent-blue); }
    .user-avatar {
      width: 32px; height: 32px; border-radius: 50%;
      background: linear-gradient(135deg, var(--pv-accent-blue) 0%, var(--pv-accent-purple) 100%);
      color: white; display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.82rem;
    }
    .user-avatar-lg {
      width: 48px; height: 48px; border-radius: 50%; font-size: 1.1rem;
      background: linear-gradient(135deg, var(--pv-accent-blue) 0%, var(--pv-accent-purple) 100%);
      color: white; display: flex; align-items: center; justify-content: center; font-weight: 700;
    }
    .user-info { display: flex; flex-direction: column; align-items: flex-start; min-width: 0; }
    .user-name { font-size: 0.82rem; font-weight: 600; color: var(--pv-text-primary); line-height: 1.2; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .user-role { font-size: 0.7rem; color: var(--pv-text-subtle); text-transform: uppercase; letter-spacing: 0.04em; font-weight: 600; }

    .user-menu {
      position: absolute; top: calc(100% + 10px); right: 0; min-width: 260px;
      background: var(--pv-bg-elevated); border: 1px solid var(--pv-border);
      border-radius: 14px; box-shadow: var(--pv-shadow-lg), var(--pv-shadow-glow-blue);
      overflow: hidden; z-index: 100;
    }
    .user-menu-header { display: flex; align-items: center; gap: 0.85rem; padding: 1rem; background: rgba(14,165,233,0.05); }
    .user-menu-header h4 { font-size: 0.9rem; margin-bottom: 0.25rem; }
    .user-menu-header p { margin-top: 0; display: inline-block; }
    .user-menu-divider { height: 1px; background: var(--pv-border); margin: 0.25rem 0; }
    .user-menu-item {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.7rem 1rem; background: none; border: none; width: 100%; text-align: left;
      color: var(--pv-text-secondary); cursor: pointer;
      font-size: 0.85rem; font-family: inherit; transition: all var(--pv-transition-fast);
      text-decoration: none;
    }
    .user-menu-item:hover { background: var(--pv-bg-card-hover); color: var(--pv-text-primary); }
    .user-menu-item.danger { color: var(--pv-accent-red); }
    .user-menu-item.danger:hover { background: rgba(220,38,38,0.08); }

    /* ==== MAIN LAYOUT ==== */
    .main-layout { display: flex; flex: 1; overflow: hidden; position: relative; }
    .main-layout.sidebar-collapsed .app-sidebar { width: 72px; }

    .app-sidebar {
      width: 256px; flex-shrink: 0;
      background: linear-gradient(180deg, rgba(3,7,18,0.85) 0%, rgba(10,22,40,0.95) 100%);
      border-right: 1px solid var(--pv-border);
      display: flex; flex-direction: column;
      transition: width var(--pv-transition-base);
      backdrop-filter: blur(8px);
      position: relative;
      z-index: 5;
    }
    .app-sidebar::before {
      content: ''; position: absolute; top: 0; right: 0; bottom: 0; width: 1px;
      background: linear-gradient(180deg, transparent, rgba(14,165,233,0.2), transparent);
    }
    .sidebar-nav { flex: 1; padding: 1rem 0.75rem; overflow-y: auto; }
    .nav-section { margin-bottom: 1.25rem; }
    .nav-label {
      display: block; font-size: 0.65rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.12em;
      color: var(--pv-text-subtle); padding: 0 0.75rem 0.5rem;
      transition: opacity var(--pv-transition-fast);
    }
    .nav-label.hidden, .nav-text + *,
    .sidebar-footer.hidden, .nav-indicator-new.hidden { display: none; }

    .nav-item {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.65rem 0.75rem; margin-bottom: 0.1rem;
      color: var(--pv-text-muted); text-decoration: none;
      border-radius: 9px; cursor: pointer;
      transition: all var(--pv-transition-fast);
      font-size: 0.875rem; font-weight: 500;
      background: none; border: none; width: 100%;
      font-family: inherit;
    }
    .app-sidebar.collapsed .nav-item { justify-content: center; padding: 0.75rem 0; border-radius: 10px; }
    .app-sidebar.collapsed .nav-text,
    .app-sidebar.collapsed .nav-indicator-new { display: none; }

    .nav-item:hover {
      background: rgba(30,58,95,0.4); color: var(--pv-text-primary);
    }
    .nav-item.active {
      background: linear-gradient(135deg, rgba(14,165,233,0.18) 0%, rgba(14,165,233,0.05) 100%);
      color: var(--pv-accent-blue);
      box-shadow: inset 2px 0 0 var(--pv-accent-blue);
    }
    .nav-icon { flex-shrink: 0; display: flex; align-items: center; justify-content: center; width: 24px; color: inherit; }
    .nav-text { overflow: hidden; white-space: nowrap; }
    .nav-indicator-new {
      margin-left: auto; padding: 0.1rem 0.4rem; font-size: 0.6rem;
      font-weight: 800; color: var(--pv-accent-red); letter-spacing: 0.08em;
      background: rgba(220,38,38,0.1); border-radius: 20px;
      animation: pulseGlow 2s ease-in-out infinite;
    }

    .sidebar-footer {
      padding: 1rem; border-top: 1px solid var(--pv-border);
      transition: opacity var(--pv-transition-fast);
    }
    .storage-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
    .storage-label { font-size: 0.72rem; font-weight: 600; color: var(--pv-text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
    .storage-amount { font-size: 0.75rem; color: var(--pv-text-secondary); font-weight: 500; }
    .storage-bar { height: 6px; background: var(--pv-bg-dark); border-radius: 3px; overflow: hidden; }
    .storage-fill {
      height: 100%; border-radius: 3px;
      background: linear-gradient(90deg, var(--pv-accent-blue) 0%, var(--pv-accent-teal) 100%);
      transition: width 0.4s ease;
    }

    /* ==== CONTENT ==== */
    .app-content { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 2rem 2.25rem; position: relative; }

    /* ==== AI DRAWER ==== */
    .ai-drawer-wrapper { position: absolute; top: 0; right: 0; bottom: 0; pointer-events: none; z-index: 30; }
    .ai-drawer-wrapper.open { pointer-events: auto; }
    .ai-drawer-toggle {
      position: absolute; right: 0; top: 28px;
      background: linear-gradient(135deg, var(--pv-accent-blue) 0%, #0284c7 100%);
      color: white; border: none; padding: 0.6rem 0.85rem;
      border-radius: 10px 0 0 10px; cursor: pointer;
      box-shadow: -4px 2px 16px rgba(14,165,233,0.3);
      transition: all var(--pv-transition-base);
      pointer-events: auto;
      z-index: 1;
    }
    .ai-drawer-wrapper.open .ai-drawer-toggle {
      right: 380px;
      background: var(--pv-bg-card);
      color: var(--pv-accent-blue);
      border: 1px solid var(--pv-border);
      box-shadow: -4px 2px 16px rgba(0,0,0,0.4);
    }
    .ai-drawer {
      width: 380px; height: 100%; margin-left: auto;
      background: linear-gradient(180deg, var(--pv-bg-elevated) 0%, var(--pv-bg-mid) 100%);
      border-left: 1px solid var(--pv-border);
      box-shadow: -8px 0 30px rgba(0,0,0,0.5);
      display: flex; flex-direction: column;
    }
    .drawer-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.1rem 1.25rem; border-bottom: 1px solid var(--pv-border);
    }
    .drawer-title-block { display: flex; align-items: center; gap: 0.75rem; }
    .ai-logo {
      width: 40px; height: 40px; border-radius: 10px;
      background: linear-gradient(135deg, rgba(14,165,233,0.15), rgba(139,92,246,0.15));
      display: flex; align-items: center; justify-content: center; font-size: 1.25rem;
      border: 1px solid rgba(14,165,233,0.3);
    }
    .drawer-title-block h3 { font-size: 0.95rem; }
    .drawer-title-block p { font-size: 0.72rem; color: var(--pv-text-subtle); }
    .drawer-close {
      background: none; border: none; color: var(--pv-text-muted);
      width: 32px; height: 32px; border-radius: 8px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all var(--pv-transition-fast);
    }
    .drawer-close:hover { background: var(--pv-bg-card-hover); color: var(--pv-text-primary); }
    .drawer-tabs {
      display: flex; padding: 0.5rem; gap: 0.25rem;
      border-bottom: 1px solid var(--pv-border);
    }
    .drawer-tabs button {
      flex: 1; padding: 0.5rem;
      background: none; border: none; border-radius: 7px;
      color: var(--pv-text-muted); font-family: inherit; font-size: 0.8rem; font-weight: 600;
      cursor: pointer; transition: all var(--pv-transition-fast);
    }
    .drawer-tabs button.active {
      background: rgba(14,165,233,0.12); color: var(--pv-accent-blue);
    }
    .drawer-tabs button:hover:not(.active) { background: var(--pv-bg-card-hover); color: var(--pv-text-secondary); }
    .drawer-body { flex: 1; overflow-y: auto; padding: 1rem; }
    .chat-messages { display: flex; flex-direction: column; gap: 0.85rem; }
    .chat-message { display: flex; gap: 0.65rem; align-items: flex-start; }
    .chat-avatar {
      width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: 0.85rem;
    }
    .chat-avatar.ai {
      background: linear-gradient(135deg, rgba(14,165,233,0.15), rgba(139,92,246,0.15));
      border: 1px solid rgba(14,165,233,0.3);
    }
    .chat-bubble {
      padding: 0.7rem 0.9rem; border-radius: 12px;
      font-size: 0.85rem; line-height: 1.55;
    }
    .chat-bubble.ai {
      background: var(--pv-bg-card); border: 1px solid var(--pv-border);
      color: var(--pv-text-secondary);
      border-top-left-radius: 4px;
    }
    .citation-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .muted-text { color: var(--pv-text-muted); }
    .drawer-footer {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 1rem; border-top: 1px solid var(--pv-border);
    }

    @media (max-width: 1024px) {
      .app-sidebar { position: absolute; left: 0; top: 0; bottom: 0; z-index: 40; transform: translateX(-100%); }
      .app-sidebar:not(.collapsed) { transform: translateX(0); box-shadow: var(--pv-shadow-lg); }
    }
  `]
})
export class AppComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  isSidebarCollapsed = signal(false);
  isAiDrawerOpen = signal(false);
  searchOverlayOpen = signal(false);
  showUserMenu = signal(false);
  aiTab = signal<'chat'|'summary'|'citations'>('chat');
  aiInputQuery = '';
  aiLoading = signal(false);
  aiMessages = signal<{ role: 'ai' | 'user'; text: string; sources?: { documentId: string; title: string; excerpt: string }[] }[]>([
    {
      role: 'ai',
      text: "Hello! I'm your Pusula Knowledge AI. I'm connected dynamically to all documents and files in your vault. Ask me anything!"
    }
  ]);
  aiCitations = signal<{ documentId: string; title: string; excerpt: string }[]>([]);

  workspaces = [
    { id: 'ws-alpha', name: 'Project Alpha' },
    { id: 'ws-beta', name: 'Project Beta' },
    { id: 'ws-platform', name: 'Platform Engineering' }
  ];
  activeWorkspace = 'all';

  captureShield = signal(false);
  private api = inject(ApiService);

  sendAiMessage() {
    const q = this.aiInputQuery.trim();
    if (!q) return;
    this.aiInputQuery = '';
    this.askVaultAi(q);
  }

  askVaultAi(question: string) {
    this.aiMessages.update(msgs => [...msgs, { role: 'user', text: question }]);
    this.aiLoading.set(true);
    this.api.post<{ answer: string; sources: { documentId: string; title: string; excerpt: string }[] }>('/vault/ask', { question }).subscribe({
      next: (res: any) => {
        this.aiLoading.set(false);
        const data = res?.data || res;
        const answer = data?.answer || 'No information found.';
        const sources = data?.sources || [];
        this.aiMessages.update(msgs => [...msgs, { role: 'ai', text: answer, sources }]);
        if (sources.length) {
          this.aiCitations.set(sources);
        }
      },
      error: (err: any) => {
        this.aiLoading.set(false);
        this.aiMessages.update(msgs => [...msgs, { role: 'ai', text: err?.error?.message || err?.message || 'Failed to query Knowledge AI.' }]);
      }
    });
  }

  get showAdminNav(): boolean {
    const r = this.authService.currentUser()?.role;
    return r === 'ADMIN' || r === 'FOUNDER';
  }

  get initials(): string {
    const name = this.authService.currentUser()?.fullName;
    if (!name) return 'U';
    const parts = name.split(' ').filter(Boolean);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || parts[0]?.[1] || '')).toUpperCase();
  }

  toggleSidebar() {
    this.isSidebarCollapsed.set(!this.isSidebarCollapsed());
  }

  toggleAiDrawer() {
    this.isAiDrawerOpen.set(!this.isAiDrawerOpen());
  }

  toggleNotifications() {}

  onWorkspaceChange(e: Event) {
    const v = (e.target as HTMLSelectElement).value;
    this.activeWorkspace = v;
    if (v !== 'all') this.router.navigate(['/documents/workspace', v]);
  }

  @HostListener('document:keydown.control.k', ['$event'])
  onCtrlK(e: KeyboardEvent) {
    e.preventDefault();
    this.searchOverlayOpen.set(true);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event) {
    if (this.showUserMenu()) {
      const target = e.target as HTMLElement;
      if (!target.closest('.user-dropdown')) this.showUserMenu.set(false);
    }
  }

  preventContextMenu(event: MouseEvent) {
    if (this.authService.isRestricted()) event.preventDefault();
  }

  preventSelection(event: Event) {
    if (this.authService.isRestricted()) {
      const target = event.target as HTMLElement | null;
      if (target?.closest('.format-shell, .editor-wrap, input, textarea')) return;
      event.preventDefault();
    }
  }

  preventCopy(event: ClipboardEvent) {
    if (this.authService.isRestricted()) event.preventDefault();
  }

  handleKeydown(event: KeyboardEvent) {
    if (!this.authService.isRestricted()) return;
    const key = event.key.toLowerCase();
    const capture = event.key === 'PrintScreen'
      || ((event.metaKey || event.ctrlKey) && event.shiftKey && ['3', '4', '5', 's'].includes(key));
    if (capture) {
      event.preventDefault();
      this.flashShield();
    }
    if ((event.ctrlKey || event.metaKey) && ['c', 'x', 'p', 's', 'u'].includes(key)) {
      event.preventDefault();
      if (key === 'p' || key === 's') this.flashShield();
    }
  }

  private flashShield() {
    this.captureShield.set(true);
    this.api.post('/dlp/capture-attempt', {}).subscribe({ error: () => {} });
    setTimeout(() => this.captureShield.set(false), 1600);
  }
}
