import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/auth/auth.service';

interface Source { documentId: string; title: string; version?: number; excerpt: string; }
interface ChatTurn { role: 'you' | 'vault'; text: string; sources?: Source[]; }
interface Person { name: string; role: string; documentTitle?: string; documentId?: string; active: boolean; lastSeenAt?: string; }
interface ActionRow { id: number; at: string; actor: string; role: string; action: string; target?: string; }
interface ProjectStat { name: string; documents: number; versions: number; actions: number; people: number; }
interface ReportRow { id: string; period: string; generatedSummary: string; authorNotes?: string; createdAt: string; }

@Component({
  selector: 'app-vault-desk',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="desk">
      <header class="desk-head">
        <div>
          <p class="eyebrow">{{ auth.currentRole() }}</p>
          <h1>Vault desk</h1>
          <p>Every project and document is open to you. Ask from the stored text, watch who is in a document, and file a progress report.</p>
        </div>
        <a routerLink="/documents" class="pv-btn pv-btn-outline">Open documents</a>
      </header>

      <nav class="tabs">
        @for (tab of tabs; track tab.id) {
          <button [class.on]="active() === tab.id" (click)="active.set(tab.id)">{{ tab.label }}</button>
        }
      </nav>

      @if (active() === 'ask') {
        <section class="panel chat">
          <div class="thread">
            @for (turn of turns(); track turn.text) {
              <article [class.you]="turn.role === 'you'" [class.vault]="turn.role === 'vault'">
                <strong>{{ turn.role === 'you' ? 'You' : 'Vault' }}</strong>
                <p>{{ turn.text }}</p>
                @if (turn.sources?.length) {
                  <div class="sources">
                    @for (source of turn.sources; track source.documentId + source.excerpt) {
                      <a [routerLink]="['/document', source.documentId]">{{ source.title }} · v{{ source.version || 1 }}</a>
                    }
                  </div>
                }
              </article>
            }
          </div>
          <form (ngSubmit)="ask()">
            <input [(ngModel)]="question" name="question" placeholder="Compare the latest API note, or ask who changed Finance this week" />
            <button class="pv-btn pv-btn-primary" [disabled]="busy()">{{ busy() ? 'Reading…' : 'Ask' }}</button>
          </form>
          <div class="prompts">
            <button type="button" (click)="usePrompt('Who is working right now?')">Who is working</button>
            <button type="button" (click)="usePrompt('What changed between the latest versions?')">Version changes</button>
            <button type="button" (click)="usePrompt('Suggest how to improve the research notes')">Research suggestions</button>
            <button type="button" (click)="usePrompt('Summarise the work done today')">Today’s work</button>
          </div>
        </section>
      }

      @if (active() === 'people') {
        <section class="split">
          <div class="panel">
            <h2>In the vault now</h2>
            @for (person of people(); track person.name + person.documentTitle) {
              <div class="person">
                <span class="dot" [class.live]="person.active"></span>
                <div>
                  <strong>{{ person.name }}</strong>
                  <p>{{ person.active ? 'Active' : 'Last seen' }} · {{ person.documentTitle || 'No document open' }}</p>
                </div>
                <em>{{ person.role }}</em>
              </div>
            } @empty {
              <p class="muted">No one has opened a document yet.</p>
            }
          </div>
          <div class="panel">
            <h2>Action log</h2>
            @for (row of actions(); track row.id) {
              <div class="action">
                <div>
                  <strong>{{ row.actor }}</strong>
                  <p>{{ label(row.action) }} {{ row.target }}</p>
                </div>
                <time>{{ row.at | date:'short' }}</time>
              </div>
            } @empty {
              <p class="muted">Actions appear as people sign in, edit, and humanize.</p>
            }
          </div>
        </section>
      }

      @if (active() === 'reports') {
        <section class="split">
          <form class="panel" (ngSubmit)="saveReport()">
            <h2>Progress report</h2>
            <label>Period</label>
            <select [(ngModel)]="period" name="period">
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
            <label>Your note on the work</label>
            <textarea [(ngModel)]="notes" name="notes" rows="6" placeholder="What moved, what is blocked, what should be prioritised."></textarea>
            <button class="pv-btn pv-btn-primary" [disabled]="busy()">Save report</button>
          </form>
          <div class="panel">
            <h2>Saved reports</h2>
            @for (report of reports(); track report.id) {
              <article class="report">
                <header><strong>{{ report.period }}</strong><time>{{ report.createdAt | date:'medium' }}</time></header>
                @if (report.authorNotes) { <p class="note">{{ report.authorNotes }}</p> }
                <pre>{{ report.generatedSummary }}</pre>
              </article>
            } @empty { <p class="muted">No reports filed yet.</p> }
          </div>
        </section>
      }

      @if (active() === 'projects') {
        <section class="panel">
          <h2>Projects</h2>
          <p class="muted">Documents, stored versions, and recorded actions over the last 30 days.</p>
          @for (project of projects(); track project.name) {
            <div class="project">
              <div class="project-name">{{ project.name }}</div>
              <div class="bars">
                <div><span>Documents</span><i [style.width.%]="bar(project.documents, maxDocs())"></i><b>{{ project.documents }}</b></div>
                <div><span>Versions</span><i class="gold" [style.width.%]="bar(project.versions, maxVersions())"></i><b>{{ project.versions }}</b></div>
                <div><span>Actions</span><i class="ink" [style.width.%]="bar(project.actions, maxActions())"></i><b>{{ project.actions }}</b></div>
              </div>
            </div>
          }
        </section>
      }
    </div>
  `,
  styles: [`
    .desk { padding: 1.5rem 2rem 3rem; max-width: 1100px; margin: 0 auto; }
    .desk-head { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-end; margin-bottom: 1.2rem; }
    .eyebrow { letter-spacing: 0.14em; text-transform: uppercase; color: #b45309; font-size: 0.75rem; margin: 0 0 0.3rem; }
    h1 { margin: 0; font-size: 2rem; }
    .desk-head p { color: var(--pv-text-muted); max-width: 640px; }
    .tabs { display: flex; gap: 0.4rem; margin-bottom: 1rem; }
    .tabs button { border: 1px solid var(--pv-border); background: transparent; color: inherit; border-radius: 999px; padding: 0.45rem 0.9rem; cursor: pointer; }
    .tabs button.on { background: #0f172a; color: white; }
    .panel, .chat { background: var(--pv-bg-card); border: 1px solid var(--pv-border); border-radius: 16px; padding: 1rem; }
    .split { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .thread { min-height: 280px; max-height: 460px; overflow: auto; display: flex; flex-direction: column; gap: 0.7rem; }
    article { border-radius: 12px; padding: 0.8rem 1rem; background: #f8fafc; }
    article.you { background: #0f172a; color: white; }
    article p, .person p, .action p { white-space: pre-wrap; margin: 0.25rem 0 0; }
    form { display: flex; gap: 0.5rem; margin-top: 0.8rem; }
    input, select, textarea { width: 100%; border: 1px solid var(--pv-border); border-radius: 10px; padding: 0.7rem; font: inherit; background: white; }
    .prompts { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.7rem; }
    .prompts button { border: 0; background: #f1f5f9; border-radius: 999px; padding: 0.35rem 0.7rem; cursor: pointer; }
    .sources { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.5rem; }
    .sources a { color: inherit; font-size: 0.85rem; }
    .person, .action { display: flex; gap: 0.7rem; align-items: center; padding: 0.7rem 0; border-bottom: 1px solid var(--pv-border); }
    .person em, time { margin-left: auto; color: var(--pv-text-muted); font-style: normal; font-size: 0.85rem; }
    .dot { width: 10px; height: 10px; border-radius: 50%; background: #cbd5e1; }
    .dot.live { background: #16a34a; }
    .muted { color: var(--pv-text-muted); }
    label { display: block; margin: 0.8rem 0 0.3rem; font-weight: 600; }
    textarea { margin-bottom: 0.8rem; }
    pre { white-space: pre-wrap; font-family: inherit; font-size: 0.92rem; }
    .report { border-top: 1px solid var(--pv-border); padding-top: 0.8rem; margin-top: 0.8rem; }
    .report header, .note { display: flex; justify-content: space-between; }
    .note { background: #fff7ed; padding: 0.5rem 0.7rem; border-radius: 8px; }
    .project { display: grid; grid-template-columns: 160px 1fr; gap: 1rem; padding: 0.8rem 0; border-bottom: 1px solid var(--pv-border); }
    .bars div { display: grid; grid-template-columns: 90px 1fr 32px; gap: 0.4rem; align-items: center; margin: 0.25rem 0; font-size: 0.85rem; }
    .bars i { display: block; height: 8px; background: #0284c7; border-radius: 99px; min-width: 4px; }
    .bars i.gold { background: #d97706; }
    .bars i.ink { background: #0f172a; }
    @media (max-width: 800px) { .split, .project { grid-template-columns: 1fr; } }
  `]
})
export class VaultDeskComponent implements OnInit {
  auth: AuthService;
  tabs = [
    { id: 'ask', label: 'Assistant' },
    { id: 'people', label: 'Activity' },
    { id: 'reports', label: 'Reports' },
    { id: 'projects', label: 'Projects' }
  ];
  active = signal('ask');
  busy = signal(false);
  question = '';
  period = 'WEEKLY';
  notes = '';
  turns = signal<ChatTurn[]>([{
    role: 'vault',
    text: 'I answer from the documents stored in the vault, including version differences. I will not invent a passage that is not in the database.'
  }]);
  people = signal<Person[]>([]);
  actions = signal<ActionRow[]>([]);
  projects = signal<ProjectStat[]>([]);
  reports = signal<ReportRow[]>([]);

  constructor(private api: ApiService, auth: AuthService) { this.auth = auth; }

  ngOnInit() {
    this.loadPeople();
    this.loadReports();
    this.api.get<ProjectStat[]>('/vault/projects').subscribe({
      next: (res) => this.projects.set(res.data || []),
      error: () => this.projects.set([])
    });
  }

  ask() {
    const question = this.question.trim();
    if (!question) return;
    this.turns.update(list => [...list, { role: 'you', text: question }]);
    this.question = '';
    this.busy.set(true);
    this.api.post<{ answer: string; sources: Source[] }>('/vault/ask', { question }).subscribe({
      next: (res) => {
        this.turns.update(list => [...list, { role: 'vault', text: res.data?.answer || 'No answer', sources: res.data?.sources || [] }]);
        this.busy.set(false);
      },
      error: () => {
        this.turns.update(list => [...list, { role: 'vault', text: 'The vault could not answer just now.' }]);
        this.busy.set(false);
      }
    });
  }

  usePrompt(text: string) {
    this.question = text;
    this.ask();
  }

  saveReport() {
    this.busy.set(true);
    this.api.post<ReportRow>('/vault/reports', { period: this.period, notes: this.notes }).subscribe({
      next: () => {
        this.notes = '';
        this.busy.set(false);
        this.loadReports();
      },
      error: () => this.busy.set(false)
    });
  }

  loadPeople() {
    this.api.get<Person[]>('/vault/presence').subscribe({ next: (res) => this.people.set(res.data || []) });
    this.api.get<ActionRow[]>('/vault/actions').subscribe({ next: (res) => this.actions.set(res.data || []) });
  }

  loadReports() {
    this.api.get<ReportRow[]>('/vault/reports').subscribe({ next: (res) => this.reports.set(res.data || []) });
  }

  label(action: string) {
    return (action || '').toLowerCase().replaceAll('_', ' ');
  }

  bar(value: number, max: number) {
    if (!max) return 4;
    return Math.max(4, Math.round((value / max) * 100));
  }
  maxDocs() { return Math.max(1, ...this.projects().map(p => p.documents)); }
  maxVersions() { return Math.max(1, ...this.projects().map(p => p.versions)); }
  maxActions() { return Math.max(1, ...this.projects().map(p => p.actions)); }
}
