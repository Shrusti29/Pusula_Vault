import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import {
  DocumentResponse,
  WorkspaceResponse,
  OverviewMetrics,
} from '../../core/models/pusula.models';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-documents-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dh-shell">
      <header class="dh-hero">
        <div class="dh-hero-bg">
          <div class="dh-glow dh-glow-1"></div>
          <div class="dh-glow dh-glow-2"></div>
        </div>
        <div class="dh-hero-content">
          <div class="dh-hero-left">
            <span class="dh-badge">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              Documents Home
            </span>
            <h1 class="dh-title">Welcome back</h1>
            <p class="dh-subtitle">Pick up where you left off, or explore your workspace summaries.</p>
          </div>
          <div class="dh-hero-stats">
            <div class="dh-hero-stat">
              <span class="dh-hero-stat-num">{{ metrics()?.totalDocuments ?? 0 }}</span>
              <span class="dh-hero-stat-label">Documents</span>
            </div>
            <div class="dh-hero-stat-sep"></div>
            <div class="dh-hero-stat">
              <span class="dh-hero-stat-num">{{ metrics()?.workspaces ?? 0 }}</span>
              <span class="dh-hero-stat-label">Workspaces</span>
            </div>
            <div class="dh-hero-stat-sep"></div>
            <div class="dh-hero-stat">
              <span class="dh-hero-stat-num">{{ metrics()?.totalFiles ?? 0 }}</span>
              <span class="dh-hero-stat-label">Files</span>
            </div>
          </div>
        </div>
      </header>

      <div class="dh-metric-row">
        <div class="dh-metric-card dh-metric-blue">
          <div class="dh-metric-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div class="dh-metric-body">
            <span class="dh-metric-num">{{ metrics()?.docsCreatedToday ?? 0 }}</span>
            <span class="dh-metric-label">Docs created today</span>
          </div>
          <div class="dh-metric-trend up">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
          </div>
        </div>

        <div class="dh-metric-card dh-metric-purple">
          <div class="dh-metric-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
          </div>
          <div class="dh-metric-body">
            <span class="dh-metric-num">{{ metrics()?.docsModifiedToday ?? 0 }}</span>
            <span class="dh-metric-label">Modified today</span>
          </div>
          <div class="dh-metric-trend up">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
          </div>
        </div>

        <div class="dh-metric-card dh-metric-teal">
          <div class="dh-metric-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
          </div>
          <div class="dh-metric-body">
            <span class="dh-metric-num">{{ metrics()?.activeUsersLast7d ?? 0 }}</span>
            <span class="dh-metric-label">Active users (7d)</span>
          </div>
          <div class="dh-metric-trend up">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
              <polyline points="17 6 23 6 23 12"/>
            </svg>
          </div>
        </div>

        <div class="dh-metric-card dh-metric-amber">
          <div class="dh-metric-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div class="dh-metric-body">
            <span class="dh-metric-num">{{ metrics()?.aiInteractionsLast7d ?? 0 }}</span>
            <span class="dh-metric-label">AI interactions (7d)</span>
          </div>
          <div class="dh-metric-trend spark">✨</div>
        </div>
      </div>

      <div class="dh-grid">
        <section class="dh-section dh-section-recent">
          <div class="dh-section-head">
            <div class="dh-section-title-wrap">
              <div class="dh-section-icon recent-icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
              </div>
              <div>
                <h2 class="dh-section-title">Recent documents</h2>
                <p class="dh-section-sub">Recently viewed and edited files</p>
              </div>
            </div>
            <a class="pv-btn pv-btn-ghost dh-link" routerLink="/documents">
              View all
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </a>
          </div>

          <div class="dh-doc-list">
            <div
              class="dh-doc-item"
              *ngFor="let doc of recentDocuments(); trackBy: trackById"
              (click)="openDocument(doc.id)"
            >
              <div class="dh-doc-type" [class]="'type-' + (doc.contentType ?? 'txt').split('/').pop()?.toLowerCase() ?? 'default'">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div class="dh-doc-main">
                <h4 class="dh-doc-title">{{ doc.title }}</h4>
                <div class="dh-doc-meta">
                  <span class="pv-badge" [ngClass]="statusBadge(doc.status)">{{ doc.status }}</span>
                  <span class="dh-doc-sep">·</span>
                  <span class="dh-doc-version">v{{ doc.currentVersion }}</span>
                  <span class="dh-doc-sep">·</span>
                  <span class="dh-doc-time">{{ formatDate(doc.lastEditedAt ?? doc.updatedAt) }}</span>
                </div>
              </div>
              <button class="dh-doc-cta" (click)="$event.stopPropagation(); openDocument(doc.id)">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </button>
            </div>

            <div class="dh-doc-empty" *ngIf="!recentDocuments().length">
              <div class="dh-empty-icon">📄</div>
              <h4>No documents yet</h4>
              <p>Create your first document to get started.</p>
            </div>
          </div>
        </section>

        <div class="dh-right-col">
          <section class="dh-section dh-section-favs">
            <div class="dh-section-head">
              <div class="dh-section-title-wrap">
                <div class="dh-section-icon fav-icon">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
                <div>
                  <h2 class="dh-section-title">Favorites</h2>
                  <p class="dh-section-sub">Pinned by you</p>
                </div>
              </div>
            </div>

            <div class="dh-fav-list">
              <div
                class="dh-fav-item"
                *ngFor="let doc of favoriteDocuments(); trackBy: trackById"
                (click)="openDocument(doc.id)"
              >
                <span class="dh-fav-star">★</span>
                <div class="dh-fav-body">
                  <span class="dh-fav-title">{{ doc.title }}</span>
                  <span class="dh-fav-time">{{ formatDate(doc.updatedAt) }}</span>
                </div>
              </div>
              <div class="dh-fav-empty" *ngIf="!favoriteDocuments().length">
                <span class="dh-fav-empty-icon">☆</span>
                <p>Star important documents to pin them here.</p>
              </div>
            </div>
          </section>

          <section class="dh-section dh-section-workspaces">
            <div class="dh-section-head">
              <div class="dh-section-title-wrap">
                <div class="dh-section-icon ws-icon">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
                    <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
                    <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
                    <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
                    <rect x="7" y="7" width="10" height="10" rx="2"/>
                  </svg>
                </div>
                <div>
                  <h2 class="dh-section-title">Workspaces</h2>
                  <p class="dh-section-sub">{{ workspaces().length }} total</p>
                </div>
              </div>
            </div>

            <div class="dh-ws-list">
              <div
                class="dh-ws-item"
                *ngFor="let ws of workspaces(); trackBy: trackById; let i = index"
                [style]="{ '--dh-accent': wsAccent(i) }"
              >
                <div class="dh-ws-logo">{{ ws.name.charAt(0).toUpperCase() }}</div>
                <div class="dh-ws-body">
                  <h4 class="dh-ws-name">{{ ws.name }}</h4>
                  <div class="dh-ws-stats">
                    <span class="dh-ws-stat">
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      {{ ws.documentCount ?? 0 }} docs
                    </span>
                    <span class="dh-ws-stat">
                      <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      {{ formatBytes(ws.storageUsedBytes ?? 0) }}
                    </span>
                  </div>
                </div>
                <button class="pv-btn pv-btn-ghost dh-ws-btn" [routerLink]="['/documents']" [queryParams]="{ workspace: ws.id }">
                  Open
                </button>
              </div>

              <div class="dh-ws-empty" *ngIf="!workspaces().length">
                <p>No workspaces available.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dh-shell {
      position: relative;
      z-index: 1;
      min-height: 100vh;
      padding: 1.5rem 2rem 3rem;
      overflow-y: auto;
    }

    .dh-hero {
      position: relative;
      padding: 2rem 2.25rem;
      margin-bottom: 1.5rem;
      border: 1px solid var(--pv-border);
      border-radius: var(--pv-radius-xl);
      overflow: hidden;
      background: linear-gradient(135deg, var(--pv-bg-card) 0%, rgba(15, 23, 42, 0.6) 100%);
      box-shadow: var(--pv-shadow-card);
    }
    .dh-hero-bg {
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
    }
    .dh-glow {
      position: absolute;
      width: 420px;
      height: 420px;
      border-radius: 50%;
      filter: blur(90px);
      opacity: 0.35;
    }
    .dh-glow-1 {
      top: -200px;
      left: -120px;
      background: radial-gradient(circle, var(--pv-accent-blue) 0%, transparent 70%);
    }
    .dh-glow-2 {
      bottom: -220px;
      right: -120px;
      background: radial-gradient(circle, var(--pv-accent-purple) 0%, transparent 70%);
    }
    .dh-hero-content {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2rem;
      flex-wrap: wrap;
    }
    .dh-hero-left { min-width: 0; }
    .dh-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.3rem 0.75rem;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--pv-accent-blue);
      background: rgba(14, 165, 233, 0.1);
      border: 1px solid rgba(14, 165, 233, 0.3);
      border-radius: 999px;
      margin-bottom: 0.9rem;
    }
    .dh-title {
      font-size: 2.2rem;
      margin: 0 0 0.35rem;
      background: linear-gradient(135deg, #fff 0%, #cbd5e1 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .dh-subtitle {
      font-size: 0.95rem;
      color: var(--pv-text-muted);
      max-width: 480px;
    }

    .dh-hero-stats {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 1rem 1.5rem;
      background: rgba(10, 22, 40, 0.6);
      border: 1px solid var(--pv-border-soft);
      border-radius: var(--pv-radius-lg);
      backdrop-filter: blur(8px);
    }
    .dh-hero-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.2rem;
      min-width: 72px;
    }
    .dh-hero-stat-num {
      font-size: 1.7rem;
      font-weight: 800;
      background: linear-gradient(135deg, var(--pv-accent-blue), var(--pv-accent-purple));
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      font-variant-numeric: tabular-nums;
      line-height: 1;
    }
    .dh-hero-stat-label {
      font-size: 0.68rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--pv-text-muted);
    }
    .dh-hero-stat-sep {
      width: 1px;
      height: 40px;
      background: var(--pv-border-soft);
    }

    .dh-metric-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .dh-metric-card {
      position: relative;
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.1rem 1.25rem;
      background: var(--pv-bg-card);
      border: 1px solid var(--pv-border);
      border-radius: var(--pv-radius-lg);
      box-shadow: var(--pv-shadow-card);
      transition: all var(--pv-transition-base);
      overflow: hidden;
    }
    .dh-metric-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 3px;
      opacity: 0.9;
    }
    .dh-metric-blue::before { background: linear-gradient(90deg, var(--pv-accent-blue), #38bdf8); }
    .dh-metric-purple::before { background: linear-gradient(90deg, var(--pv-accent-purple), #a78bfa); }
    .dh-metric-teal::before { background: linear-gradient(90deg, var(--pv-accent-teal), #2dd4bf); }
    .dh-metric-amber::before { background: linear-gradient(90deg, var(--pv-accent-amber), #fbbf24); }
    .dh-metric-card:hover {
      transform: translateY(-3px);
      border-color: var(--pv-border-soft);
      box-shadow: var(--pv-shadow-lg);
    }
    .dh-metric-icon {
      width: 46px;
      height: 46px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--pv-radius-md);
      flex-shrink: 0;
    }
    .dh-metric-blue .dh-metric-icon {
      background: rgba(14, 165, 233, 0.14);
      color: var(--pv-accent-blue);
      border: 1px solid rgba(14, 165, 233, 0.3);
    }
    .dh-metric-purple .dh-metric-icon {
      background: rgba(139, 92, 246, 0.14);
      color: var(--pv-accent-purple);
      border: 1px solid rgba(139, 92, 246, 0.3);
    }
    .dh-metric-teal .dh-metric-icon {
      background: rgba(20, 184, 166, 0.14);
      color: var(--pv-accent-teal);
      border: 1px solid rgba(20, 184, 166, 0.3);
    }
    .dh-metric-amber .dh-metric-icon {
      background: rgba(245, 158, 11, 0.14);
      color: var(--pv-accent-amber);
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
    .dh-metric-body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .dh-metric-num {
      font-size: 1.4rem;
      font-weight: 800;
      color: var(--pv-text-primary);
      line-height: 1;
      font-variant-numeric: tabular-nums;
    }
    .dh-metric-label {
      font-size: 0.72rem;
      font-weight: 600;
      color: var(--pv-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .dh-metric-trend {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border-radius: var(--pv-radius-sm);
      background: rgba(20, 184, 166, 0.12);
      color: var(--pv-accent-teal);
      flex-shrink: 0;
    }
    .dh-metric-trend.spark { font-size: 1rem; }

    .dh-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr);
      gap: 1.25rem;
      align-items: start;
    }
    .dh-right-col {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .dh-section {
      background: var(--pv-bg-card);
      border: 1px solid var(--pv-border);
      border-radius: var(--pv-radius-lg);
      box-shadow: var(--pv-shadow-card);
      overflow: hidden;
    }
    .dh-section-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1.1rem 1.3rem;
      border-bottom: 1px solid var(--pv-border-soft);
    }
    .dh-section-title-wrap {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 0;
    }
    .dh-section-icon {
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--pv-radius-sm);
      flex-shrink: 0;
    }
    .recent-icon {
      background: rgba(14, 165, 233, 0.12);
      color: var(--pv-accent-blue);
      border: 1px solid rgba(14, 165, 233, 0.28);
    }
    .fav-icon {
      background: rgba(245, 158, 11, 0.12);
      color: var(--pv-accent-amber);
      border: 1px solid rgba(245, 158, 11, 0.28);
    }
    .ws-icon {
      background: rgba(139, 92, 246, 0.12);
      color: var(--pv-accent-purple);
      border: 1px solid rgba(139, 92, 246, 0.28);
    }
    .dh-section-title {
      font-size: 0.98rem;
      margin: 0 0 0.15rem;
    }
    .dh-section-sub {
      font-size: 0.76rem;
      color: var(--pv-text-muted);
      margin: 0;
    }
    .dh-link {
      padding: 0.4rem 0.75rem;
      font-size: 0.76rem;
    }

    .dh-doc-list {
      padding: 0.5rem;
    }
    .dh-doc-item {
      display: flex;
      align-items: center;
      gap: 0.9rem;
      padding: 0.8rem 0.9rem;
      border-radius: var(--pv-radius-md);
      cursor: pointer;
      transition: all var(--pv-transition-fast);
    }
    .dh-doc-item:hover {
      background: var(--pv-bg-card-hover);
    }
    .dh-doc-type {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--pv-radius-sm);
      color: var(--pv-accent-blue);
      background: rgba(14, 165, 233, 0.12);
      border: 1px solid rgba(14, 165, 233, 0.25);
    }
    .dh-doc-type.type-pdf { color: var(--pv-accent-red); background: rgba(220, 38, 38, 0.1); border-color: rgba(220, 38, 38, 0.25); }
    .dh-doc-type.type-xlsx { color: var(--pv-accent-teal); background: rgba(20, 184, 166, 0.1); border-color: rgba(20, 184, 166, 0.25); }
    .dh-doc-type.type-docx { color: var(--pv-accent-blue); }
    .dh-doc-type.type-txt { color: var(--pv-text-muted); background: var(--pv-bg-mid); border-color: var(--pv-border); }
    .dh-doc-main { flex: 1; min-width: 0; }
    .dh-doc-title {
      font-size: 0.88rem;
      font-weight: 600;
      color: var(--pv-text-primary);
      margin: 0 0 0.25rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .dh-doc-meta {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.72rem;
      color: var(--pv-text-muted);
      flex-wrap: wrap;
    }
    .dh-doc-version { font-weight: 700; color: var(--pv-accent-purple); }
    .dh-doc-sep { color: var(--pv-text-subtle); }
    .dh-doc-time { font-variant-numeric: tabular-nums; }
    .dh-doc-cta {
      width: 32px;
      height: 32px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--pv-radius-sm);
      color: var(--pv-text-muted);
      cursor: pointer;
      flex-shrink: 0;
      transition: all var(--pv-transition-fast);
    }
    .dh-doc-cta:hover {
      background: rgba(14, 165, 233, 0.1);
      border-color: rgba(14, 165, 233, 0.3);
      color: var(--pv-accent-blue);
    }

    .dh-doc-empty {
      padding: 2.5rem 1.5rem;
      text-align: center;
      color: var(--pv-text-muted);
    }
    .dh-empty-icon { font-size: 2.4rem; margin-bottom: 0.75rem; opacity: 0.6; }
    .dh-doc-empty h4 {
      font-size: 0.92rem;
      color: var(--pv-text-secondary);
      margin-bottom: 0.3rem;
    }
    .dh-doc-empty p { font-size: 0.8rem; }

    .dh-fav-list { padding: 0.5rem; }
    .dh-fav-item {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      padding: 0.7rem 0.9rem;
      border-radius: var(--pv-radius-md);
      cursor: pointer;
      transition: all var(--pv-transition-fast);
    }
    .dh-fav-item:hover { background: var(--pv-bg-card-hover); }
    .dh-fav-star {
      width: 28px;
      height: 28px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.95rem;
      color: var(--pv-accent-amber);
      background: rgba(245, 158, 11, 0.1);
      border-radius: var(--pv-radius-sm);
    }
    .dh-fav-body {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }
    .dh-fav-title {
      font-size: 0.84rem;
      font-weight: 600;
      color: var(--pv-text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .dh-fav-time { font-size: 0.7rem; color: var(--pv-text-subtle); }
    .dh-fav-empty {
      padding: 1.75rem 1.25rem;
      text-align: center;
      color: var(--pv-text-muted);
    }
    .dh-fav-empty-icon {
      font-size: 1.5rem;
      opacity: 0.5;
      display: block;
      margin-bottom: 0.4rem;
    }
    .dh-fav-empty p { font-size: 0.78rem; line-height: 1.5; }

    .dh-ws-list { padding: 0.5rem; }
    .dh-ws-item {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.85rem 0.9rem;
      border-radius: var(--pv-radius-md);
      transition: all var(--pv-transition-fast);
      border: 1px solid transparent;
    }
    .dh-ws-item:hover {
      background: var(--pv-bg-card-hover);
      border-color: var(--pv-border-soft);
    }
    .dh-ws-logo {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--pv-radius-md);
      background: linear-gradient(135deg, var(--dh-accent, var(--pv-accent-blue)) 0%, rgba(139, 92, 246, 0.7) 100%);
      color: white;
      font-weight: 800;
      font-size: 1rem;
      letter-spacing: -0.02em;
    }
    .dh-ws-body {
      flex: 1;
      min-width: 0;
    }
    .dh-ws-name {
      font-size: 0.86rem;
      font-weight: 700;
      color: var(--pv-text-primary);
      margin: 0 0 0.3rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .dh-ws-stats {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .dh-ws-stat {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.7rem;
      color: var(--pv-text-muted);
      font-weight: 500;
    }
    .dh-ws-btn {
      padding: 0.35rem 0.7rem;
      font-size: 0.72rem;
      flex-shrink: 0;
    }

    .dh-ws-empty {
      padding: 1.75rem 1.25rem;
      text-align: center;
      color: var(--pv-text-muted);
      font-size: 0.8rem;
    }

    @media (max-width: 1200px) {
      .dh-metric-row { grid-template-columns: repeat(2, 1fr); }
      .dh-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 680px) {
      .dh-shell { padding: 1rem; }
      .dh-hero-stats { width: 100%; justify-content: space-around; }
      .dh-metric-row { grid-template-columns: 1fr; }
      .dh-hero { padding: 1.5rem; }
    }
  `]
})
export class DocumentsHomeComponent implements OnInit {
  private api = inject(ApiService);

  recentDocuments = signal<DocumentResponse[]>([]);
  favoriteDocuments = signal<DocumentResponse[]>([]);
  workspaces = signal<WorkspaceResponse[]>([]);
  metrics = signal<OverviewMetrics | null>(null);

  private readonly wsAccents = [
    '#0ea5e9',
    '#8b5cf6',
    '#14b8a6',
    '#f59e0b',
    '#ec4899',
    '#6366f1',
    '#22c55e',
    '#f97316',
  ];

  ngOnInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
    this.api.analyticsOverview().subscribe({
      next: m => this.metrics.set(m),
      error: () => {}
    });

    this.api.listWorkspaces().subscribe({
      next: w => this.workspaces.set(w.slice(0, 4)),
      error: () => {}
    });

    this.api.listDocuments({ page: 0, size: 10 }).subscribe({
      next: page => {
        const docs = page.content ?? [];
        const sorted = [...docs].sort((a, b) => {
          const ta = new Date(a.lastEditedAt ?? a.updatedAt).getTime();
          const tb = new Date(b.lastEditedAt ?? b.updatedAt).getTime();
          return tb - ta;
        });
        this.recentDocuments.set(sorted.slice(0, 6));
        this.favoriteDocuments.set(sorted.filter(d => d.tags?.includes('favorite') || d.tags?.includes('starred')).slice(0, 4));
      },
      error: () => {}
    });
  }

  openDocument(id: string): void {
    const router = (window as any).ngRouter;
    if (router) {
      router.navigate(['/documents', id]);
    } else {
      window.location.hash = `#/documents/${id}`;
    }
  }

  statusBadge(s: string): string {
    switch (s) {
      case 'ACTIVE': return 'pv-badge-teal';
      case 'DRAFT': return 'pv-badge-amber';
      case 'ARCHIVED': return 'pv-badge-purple';
      case 'LOCKED': return 'pv-badge-red';
      default: return 'pv-badge-blue';
    }
  }

  wsAccent(i: number): string {
    return this.wsAccents[i % this.wsAccents.length];
  }

  trackById(_: number, item: { id: string }): string {
    return item.id;
  }

  formatDate(iso: string): string {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diff = now.getTime() - d.getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `${hrs}h ago`;
      const days = Math.floor(hrs / 24);
      if (days < 7) return `${days}d ago`;
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch { return ''; }
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}
