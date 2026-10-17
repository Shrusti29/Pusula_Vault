import { Component, model, output, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, switchMap, catchError, of, tap } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { SearchResultItem, ResourceType } from '../../core/models/pusula.models';
import { Router } from '@angular/router';

@Component({
  selector: 'global-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (open()) {
      <div class="overlay-backdrop" (click)="closeOverlay()">
        <div class="overlay-container fade-in" (click)="$event.stopPropagation()">
          <div class="search-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-ico">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              #searchInput
              type="text"
              class="search-input"
              placeholder="Search documents, files, tags, team members..."
              [ngModel]="query()"
              (ngModelChange)="onQuery($event)"
              autocomplete="off"
            />
            <span class="kbd esc">ESC</span>
          </div>

          <div class="search-filters">
            <button [class.active]="filterType()=='ALL'" (click)="filterType.set('ALL')">All</button>
            <button [class.active]="filterType()=='DOCUMENT'" (click)="filterType.set('DOCUMENT')">Docs</button>
            <button [class.active]="filterType()=='ASSET'" (click)="filterType.set('ASSET')">Files</button>
            <button [class.active]="filterType()=='FOLDER'" (click)="filterType.set('FOLDER')">Folders</button>
            <button [class.active]="filterType()=='WORKSPACE'" (click)="filterType.set('WORKSPACE')">Workspaces</button>
            <span class="spacer"></span>
            <label class="semantic-toggle">
              <input type="checkbox" [checked]="semantic()" (change)="semantic.set(!semantic())" />
              <span>Semantic AI Search</span>
            </label>
          </div>

          <div class="results-area">
            @if (loading()) {
              <div class="loading-row">
                <div class="spinner"></div>
                <span>Searching knowledge vault...</span>
              </div>
            } @else if (results().length) {
              <div class="results-header">
                <span>{{ totalCount() }} results</span>
                <span class="dimmed" *ngIf="semantic()">✨ RAG-enhanced</span>
              </div>
              <div class="results-list">
                @for (item of results(); track item.id + item.type; let idx = $index) {
                  <button class="result-card" (click)="openResult(item)" [style.--idx]="idx">
                    <div class="result-icon" [attr.data-type]="item.type">
                      @switch (item.type) {
                        @case ('DOCUMENT') { 📄 }
                        @case ('ASSET') { 📎 }
                        @case ('FOLDER') { 📁 }
                        @case ('WORKSPACE') { 🏢 }
                        @case ('TEAM') { 👥 }
                        @default { 🔍 }
                      }
                    </div>
                    <div class="result-body">
                      <div class="result-topline">
                        <h4 class="result-title" [innerHTML]="highlight(item.title)"></h4>
                        <span class="type-chip pv-badge pv-badge-blue">{{ item.type }}</span>
                      </div>
                      <p class="result-snippet" [innerHTML]="highlight(item.snippet || '')"></p>
                      <div class="result-meta">
                        <span *ngIf="item.workspaceName" class="workspace-chip">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7l9-4 9 4-9 4-9-4z"/><path d="M3 12l9 4 9-4"/><path d="M3 17l9 4 9-4"/></svg>
                          {{ item.workspaceName }}
                        </span>
                        <span class="meta-dot" *ngIf="item.author">•</span>
                        <span *ngIf="item.author" class="author">{{ item.author }}</span>
                        <span class="meta-dot">•</span>
                        <span class="date">{{ item.lastModified | date:'mediumDate' }}</span>
                        @if (item.version) {
                          <span class="version-chip">v{{ item.version }}</span>
                        }
                        @if (item.tags && item.tags.length > 0) {
                          <span class="tags">
                            @for (t of item.tags.slice(0, 3); track t) {
                              <span class="tag-chip">{{ t }}</span>
                            }
                          </span>
                        }
                      </div>
                    </div>
                    <div class="result-score" *ngIf="semantic() && item.score">
                      {{ (item.score * 100).toFixed(0) }}%
                    </div>
                  </button>
                }
              </div>
            } @else if (query().trim().length > 0 && !loading()) {
              <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h4>No results found</h4>
                <p>Try broader keywords or enable semantic AI search for concept-based matching.</p>
              </div>
            } @else {
              <div class="suggestions">
                <h4>Quick Access</h4>
                <div class="quick-grid">
                  <button class="quick-item" (click)="go('/dashboard')">
                    <span class="qi-ico">📊</span><span>Dashboard</span><span class="kbd">G D</span>
                  </button>
                  <button class="quick-item" (click)="go('/documents')">
                    <span class="qi-ico">📄</span><span>Documents</span><span class="kbd">G O</span>
                  </button>
                  <button class="quick-item" (click)="go('/files')">
                    <span class="qi-ico">📁</span><span>File Vault</span><span class="kbd">G F</span>
                  </button>
                  <button class="quick-item" (click)="go('/analytics')">
                    <span class="qi-ico">📈</span><span>Analytics</span><span class="kbd">G A</span>
                  </button>
                  <button class="quick-item" (click)="go('/audit')">
                    <span class="qi-ico">🛡️</span><span>Audit</span>
                  </button>
                  <button class="quick-item" (click)="go('/admin/users')">
                    <span class="qi-ico">👥</span><span>Users</span>
                  </button>
                </div>
              </div>
            }
          </div>

          <div class="search-footer">
            <div class="footer-hints">
              <span><span class="kbd">↑↓</span> Navigate</span>
              <span><span class="kbd">Enter</span> Open</span>
              <span><span class="kbd">Ctrl+K</span> Toggle</span>
              <span><span class="kbd">ESC</span> Close</span>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .overlay-backdrop {
      position: fixed; inset: 0; z-index: 500;
      background: rgba(2,6,23,0.75); backdrop-filter: blur(10px);
      display: flex; align-items: flex-start; justify-content: center;
      padding-top: 10vh;
    }
    .overlay-container {
      width: min(900px, 92vw);
      background: linear-gradient(180deg, rgba(10,22,40,0.98) 0%, rgba(3,7,18,0.98) 100%);
      border: 1px solid var(--pv-border);
      border-radius: 18px;
      box-shadow: var(--pv-shadow-lg), var(--pv-shadow-glow-blue), 0 0 0 1px rgba(14,165,233,0.05) inset;
      overflow: hidden;
    }
    .search-header {
      display: flex; align-items: center; gap: 0.9rem;
      padding: 1.15rem 1.4rem;
      border-bottom: 1px solid var(--pv-border);
      background: rgba(14,165,233,0.03);
    }
    .search-ico { color: var(--pv-accent-blue); flex-shrink: 0; }
    .search-input {
      flex: 1; background: transparent; border: none; outline: none;
      color: var(--pv-text-primary); font-size: 1.05rem; font-family: inherit;
      padding: 0.35rem 0;
    }
    .search-input::placeholder { color: var(--pv-text-subtle); }
    .kbd {
      padding: 0.15rem 0.5rem;
      background: var(--pv-bg-dark);
      border: 1px solid var(--pv-border);
      border-radius: 5px;
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--pv-text-muted);
      font-family: ui-monospace, monospace;
    }
    .kbd.esc { color: var(--pv-accent-red); border-color: rgba(220,38,38,0.25); background: rgba(220,38,38,0.06); }
    .search-filters {
      display: flex; align-items: center; gap: 0.4rem;
      padding: 0.7rem 1.3rem;
      border-bottom: 1px solid var(--pv-border-soft);
      overflow-x: auto;
    }
    .search-filters button {
      padding: 0.35rem 0.75rem;
      background: transparent; border: 1px solid transparent;
      color: var(--pv-text-muted); font-family: inherit; font-size: 0.8rem; font-weight: 600;
      border-radius: 7px; cursor: pointer; transition: all var(--pv-transition-fast);
      white-space: nowrap;
    }
    .search-filters button:hover { background: var(--pv-bg-card-hover); color: var(--pv-text-secondary); }
    .search-filters button.active {
      background: rgba(14,165,233,0.12);
      border-color: rgba(14,165,233,0.3);
      color: var(--pv-accent-blue);
    }
    .search-filters .spacer { flex: 1; }
    .semantic-toggle {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.25rem 0.7rem;
      background: rgba(139,92,246,0.08); border: 1px solid rgba(139,92,246,0.25);
      border-radius: 8px;
      color: var(--pv-accent-purple);
      font-size: 0.75rem; font-weight: 600; cursor: pointer;
      white-space: nowrap;
    }
    .semantic-toggle input { accent-color: var(--pv-accent-purple); }

    .results-area {
      max-height: 55vh; overflow-y: auto; padding: 0.5rem 0.4rem 0.8rem;
    }
    .loading-row {
      display: flex; align-items: center; gap: 0.75rem; justify-content: center;
      padding: 2rem; color: var(--pv-text-muted); font-size: 0.875rem;
    }
    .spinner {
      width: 22px; height: 22px;
      border: 2px solid var(--pv-border);
      border-top-color: var(--pv-accent-blue);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .results-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.5rem 1rem 0.75rem;
      font-size: 0.75rem; color: var(--pv-text-subtle); font-weight: 600; letter-spacing: 0.02em;
    }
    .dimmed { color: var(--pv-accent-purple); }

    .results-list { display: flex; flex-direction: column; gap: 0.35rem; padding: 0 0.6rem; }
    .result-card {
      display: flex; align-items: stretch; gap: 1rem;
      width: 100%;
      padding: 0.8rem 1rem;
      background: var(--pv-bg-card);
      border: 1px solid var(--pv-border-soft);
      border-radius: 12px;
      text-align: left;
      cursor: pointer;
      font-family: inherit;
      transition: all var(--pv-transition-base);
      opacity: 0; transform: translateY(6px);
      animation: resultIn 250ms ease forwards;
      animation-delay: calc(var(--idx, 0) * 30ms);
    }
    @keyframes resultIn { to { opacity: 1; transform: translateY(0); } }
    .result-card:hover {
      border-color: var(--pv-accent-blue);
      background: var(--pv-bg-card-hover);
      transform: translateX(4px);
      box-shadow: var(--pv-shadow-glow-blue);
    }
    .result-icon {
      width: 44px; height: 44px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      background: var(--pv-bg-dark);
      border: 1px solid var(--pv-border);
      border-radius: 10px; font-size: 1.3rem;
    }
    .result-icon[data-type="DOCUMENT"] { background: rgba(14,165,233,0.08); border-color: rgba(14,165,233,0.2); }
    .result-icon[data-type="ASSET"]    { background: rgba(20,184,166,0.08); border-color: rgba(20,184,166,0.2); }
    .result-icon[data-type="FOLDER"]   { background: rgba(245,158,11,0.08); border-color: rgba(245,158,11,0.2); }
    .result-icon[data-type="WORKSPACE"]{ background: rgba(139,92,246,0.08); border-color: rgba(139,92,246,0.2); }
    .result-body { flex: 1; min-width: 0; }
    .result-topline { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.25rem; }
    .result-title {
      font-size: 0.95rem; font-weight: 600; color: var(--pv-text-primary);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .result-title :deep(mark), .result-snippet :deep(mark) {
      background: rgba(220,38,38,0.22);
      color: inherit;
      border-radius: 2px;
      padding: 0 2px;
    }
    .result-snippet {
      font-size: 0.82rem; color: var(--pv-text-muted);
      line-height: 1.5; margin: 0.1rem 0 0.45rem;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .result-meta {
      display: flex; align-items: center; flex-wrap: wrap;
      gap: 0.4rem; font-size: 0.72rem; color: var(--pv-text-subtle);
    }
    .workspace-chip {
      display: inline-flex; align-items: center; gap: 0.3rem;
      padding: 0.1rem 0.45rem;
      background: rgba(139,92,246,0.08); border-radius: 4px;
      color: var(--pv-accent-purple); font-weight: 600;
    }
    .author { font-weight: 600; color: var(--pv-text-muted); }
    .meta-dot { color: var(--pv-border); }
    .date { font-family: ui-monospace, monospace; font-size: 0.68rem; }
    .version-chip {
      padding: 0.05rem 0.4rem; background: rgba(14,165,233,0.08);
      border-radius: 4px; color: var(--pv-accent-blue);
      font-family: ui-monospace, monospace; font-weight: 700;
    }
    .tags { display: inline-flex; flex-wrap: wrap; gap: 0.25rem; }
    .tag-chip {
      padding: 0.05rem 0.45rem;
      background: rgba(20,184,166,0.08);
      color: var(--pv-accent-teal);
      border-radius: 4px; font-size: 0.65rem; font-weight: 700;
      text-transform: lowercase;
    }
    .type-chip { font-size: 0.65rem; padding: 0.08rem 0.5rem; }
    .result-score {
      align-self: center;
      font-family: ui-monospace, monospace;
      font-size: 0.78rem; font-weight: 700;
      color: var(--pv-accent-purple);
      padding: 0.25rem 0.55rem;
      background: rgba(139,92,246,0.08);
      border: 1px solid rgba(139,92,246,0.25);
      border-radius: 8px;
    }

    .empty-state {
      text-align: center; padding: 3rem 2rem;
      color: var(--pv-text-muted);
    }
    .empty-icon { font-size: 3rem; margin-bottom: 0.75rem; opacity: 0.7; }
    .empty-state h4 { font-size: 1.05rem; margin-bottom: 0.4rem; color: var(--pv-text-secondary); }
    .empty-state p { font-size: 0.85rem; }

    .suggestions { padding: 1rem 1.4rem 1.5rem; }
    .suggestions h4 {
      font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em;
      color: var(--pv-text-subtle); margin-bottom: 0.75rem;
    }
    .quick-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 0.5rem; }
    .quick-item {
      display: flex; align-items: center; gap: 0.7rem;
      padding: 0.75rem 0.9rem;
      background: var(--pv-bg-card); border: 1px solid var(--pv-border-soft);
      border-radius: 10px; cursor: pointer; text-align: left;
      font-family: inherit; color: var(--pv-text-secondary);
      font-size: 0.85rem; font-weight: 500;
      transition: all var(--pv-transition-fast);
    }
    .quick-item:hover {
      background: var(--pv-bg-card-hover);
      border-color: var(--pv-accent-blue);
      color: var(--pv-text-primary);
    }
    .qi-ico { font-size: 1.1rem; }
    .quick-item .kbd { margin-left: auto; font-size: 0.65rem; }

    .search-footer {
      padding: 0.65rem 1.3rem;
      border-top: 1px solid var(--pv-border-soft);
      background: rgba(0,0,0,0.2);
    }
    .footer-hints {
      display: flex; gap: 1.1rem; flex-wrap: wrap;
      font-size: 0.72rem; color: var(--pv-text-subtle);
    }
    .footer-hints > span { display: inline-flex; align-items: center; gap: 0.35rem; }
    .footer-hints .kbd { padding: 0.1rem 0.35rem; font-size: 0.62rem; }
  `]
})
export class GlobalSearchComponent {
  open = model(false);
  close = output();

  private api = inject(ApiService);
  private router = inject(Router);

  query = signal('');
  filterType = signal<'ALL' | ResourceType>('ALL');
  semantic = signal(false);
  loading = signal(false);
  results = signal<SearchResultItem[]>([]);
  totalCount = signal(0);

  private searchSubject = new Subject<{ q: string; t: string; s: boolean; }>();
  private searchSub = this.searchSubject.pipe(
    debounceTime(300),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    tap(() => this.loading.set(true)),
    switchMap(({ q, t, s }) =>
      this.api.search({
        q,
        type: t === 'ALL' ? undefined : t,
        semantic: s,
        page: 0, size: 20
      }).pipe(catchError(() => of({ content: [], totalElements: 0, totalPages: 0, size: 20, number: 0, first: true, last: true })))
    )
  ).subscribe(r => {
    this.loading.set(false);
    this.results.set(r.content);
    this.totalCount.set(r.totalElements);
  });

  onQuery(q: string) {
    this.query.set(q);
    this.searchSubject.next({ q, t: this.filterType(), s: this.semantic() });
  }

  closeOverlay() {
    this.open.set(false);
    this.close.emit();
    this.query.set('');
    this.results.set([]);
    this.totalCount.set(0);
  }

  @HostListener('document:keydown.escape')
  onEsc() { if (this.open()) this.closeOverlay(); }

  go(path: string) {
    this.closeOverlay();
    this.router.navigateByUrl(path);
  }

  openResult(item: SearchResultItem) {
    let route: string[] | null = null;
    switch (item.type) {
      case 'DOCUMENT': route = ['/document', item.id]; break;
      case 'FOLDER':   route = ['/documents/workspace', item.workspaceId || 'all', item.id]; break;
      case 'WORKSPACE': route = ['/documents/workspace', item.id]; break;
      case 'ASSET':    route = ['/files']; break;
    }
    if (route) {
      this.closeOverlay();
      this.router.navigate(route);
    }
  }

  highlight(text: string): string {
    const q = this.query().trim();
    if (!q || !text) return text;
    try {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp('(' + escaped + ')', 'gi');
      return text.replace(regex, '<mark>$1</mark>');
    } catch { return text; }
  }
}
