import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TiptapEditorComponent } from './tiptap-editor.component';

interface Slide { title: string; bullets: string[]; }

@Component({
  selector: 'app-format-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, TiptapEditorComponent],
  template: `
    <div class="format-shell">
      @if (kind === 'sheet') {
        <div class="sheet-wrap">
          <table class="sheet">
            <tbody>
              <tr *ngFor="let row of rows; let r = index">
                <td *ngFor="let cell of row; let c = index">
                  <input [value]="cell" (input)="setCell(r, c, $any($event.target).value)" />
                </td>
              </tr>
            </tbody>
          </table>
          <button type="button" class="mini" (click)="addRow()">Add row</button>
        </div>
      } @else if (kind === 'slides') {
        <div class="slides">
          <article class="slide-card" *ngFor="let slide of slides; let i = index">
            <input class="slide-title" [value]="slide.title" (input)="setSlideTitle(i, $any($event.target).value)" placeholder="Slide title" />
            <input class="slide-bullet" *ngFor="let bullet of slide.bullets; let b = index" [value]="bullet" (input)="setBullet(i, b, $any($event.target).value)" placeholder="Point" />
            <button type="button" class="mini" (click)="addBullet(i)">Add point</button>
          </article>
          <button type="button" class="mini" (click)="addSlide()">Add slide</button>
        </div>
      } @else if (kind === 'code') {
        <div class="code-wrap">
          <select [ngModel]="language" (ngModelChange)="setLanguage($event)">
            <option>typescript</option>
            <option>javascript</option>
            <option>java</option>
            <option>python</option>
            <option>sql</option>
            <option>json</option>
            <option>html</option>
            <option>css</option>
          </select>
          <textarea [ngModel]="code" (ngModelChange)="setCode($event)" spellcheck="false" placeholder="Write code. It is saved in the vault, not on this computer."></textarea>
        </div>
      } @else if (kind === 'file') {
        <div class="file-wrap">
          <p>Other files stay in the vault. Employees can open them here. Downloads stay off for employee accounts.</p>
          <textarea [ngModel]="notes" (ngModelChange)="setNotes($event)" placeholder="Notes about this file"></textarea>
        </div>
      } @else {
        <app-tiptap-editor [content]="wordHtml" (contentChange)="emitWord($event)"></app-tiptap-editor>
      }
    </div>
  `,
  styles: [`
    .format-shell { min-height: 420px; }
    .sheet { width: 100%; border-collapse: collapse; background: #fff; }
    .sheet td { border: 1px solid #e5e7eb; padding: 0; }
    .sheet input, .slide-title, .slide-bullet, .code-wrap textarea, .file-wrap textarea, .code-wrap select {
      width: 100%; border: 0; padding: 0.55rem 0.7rem; font: inherit; background: transparent; color: inherit;
    }
    .sheet-wrap, .slides, .code-wrap, .file-wrap { padding: 1rem; }
    .slide-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 14px; padding: 0.8rem; margin-bottom: 0.8rem; box-shadow: 0 8px 24px rgba(15,23,42,0.04); }
    .slide-title { font-size: 1.25rem; font-weight: 700; }
    .code-wrap textarea, .file-wrap textarea { min-height: 360px; font-family: ui-monospace, monospace; background: #0f172a; color: #e2e8f0; border-radius: 12px; }
    .code-wrap select { max-width: 180px; margin-bottom: 0.5rem; background: #0f172a; color: #e2e8f0; border-radius: 8px; }
    .mini { margin-top: 0.6rem; border: 1px solid #cbd5e1; background: #fff; border-radius: 999px; padding: 0.35rem 0.8rem; cursor: pointer; }
    .file-wrap p { color: #64748b; margin-top: 0; }
  `]
})
export class FormatEditorComponent implements OnChanges {
  @Input() docType = 'TEXT';
  @Input() content = '';
  @Output() contentChange = new EventEmitter<string>();

  kind: 'word' | 'sheet' | 'slides' | 'code' | 'file' = 'word';
  rows: string[][] = [];
  slides: Slide[] = [];
  language = 'typescript';
  code = '';
  notes = '';
  wordHtml = '';
  private external = '';

  ngOnChanges(): void {
    this.kind = this.kindFor(this.docType);
    if (this.content === this.external) return;
    this.external = this.content || '';
    this.load(this.external);
  }

  private kindFor(type: string): 'word' | 'sheet' | 'slides' | 'code' | 'file' {
    switch ((type || '').toUpperCase()) {
      case 'EXCEL': return 'sheet';
      case 'POWERPOINT': return 'slides';
      case 'CODEBASE': return 'code';
      case 'PDF':
      case 'CUSTOM_FORM': return 'file';
      default: return 'word';
    }
  }

  private load(raw: string) {
    if (this.kind === 'sheet') {
      this.rows = this.readJson(raw)?.rows || this.blankSheet(raw);
      return;
    }
    if (this.kind === 'slides') {
      this.slides = this.readJson(raw)?.slides || [{ title: raw.replace(/<[^>]+>/g, ' ').trim() || 'Slide 1', bullets: [''] }];
      return;
    }
    if (this.kind === 'code') {
      const parsed = this.readJson(raw);
      this.language = parsed?.language || 'typescript';
      this.code = parsed?.code ?? raw;
      return;
    }
    if (this.kind === 'file') {
      const parsed = this.readJson(raw);
      this.notes = parsed?.notes ?? raw;
      return;
    }
    this.wordHtml = raw || '<p></p>';
  }

  private readJson(raw: string): any {
    try { return JSON.parse(raw); } catch { return null; }
  }

  private blankSheet(seed: string): string[][] {
    const rows = Array.from({ length: 8 }, () => Array.from({ length: 6 }, () => ''));
    rows[0][0] = seed.replace(/<[^>]+>/g, ' ').trim().slice(0, 200);
    return rows;
  }

  private push(next: string) {
    this.external = next;
    this.contentChange.emit(next);
  }

  setCell(r: number, c: number, value: string) {
    this.rows[r][c] = value;
    this.push(JSON.stringify({ rows: this.rows }));
  }
  addRow() {
    this.rows.push(Array.from({ length: this.rows[0]?.length || 6 }, () => ''));
    this.push(JSON.stringify({ rows: this.rows }));
  }
  setSlideTitle(i: number, value: string) {
    this.slides[i].title = value;
    this.push(JSON.stringify({ slides: this.slides }));
  }
  setBullet(i: number, b: number, value: string) {
    this.slides[i].bullets[b] = value;
    this.push(JSON.stringify({ slides: this.slides }));
  }
  addBullet(i: number) {
    this.slides[i].bullets.push('');
    this.push(JSON.stringify({ slides: this.slides }));
  }
  addSlide() {
    this.slides.push({ title: `Slide ${this.slides.length + 1}`, bullets: [''] });
    this.push(JSON.stringify({ slides: this.slides }));
  }
  setLanguage(value: string) {
    this.language = value;
    this.push(JSON.stringify({ language: this.language, code: this.code }));
  }
  setCode(value: string) {
    this.code = value;
    this.push(JSON.stringify({ language: this.language, code: this.code }));
  }
  setNotes(value: string) {
    this.notes = value;
    this.push(JSON.stringify({ kind: 'file', notes: this.notes }));
  }
  emitWord(html: string) {
    this.wordHtml = html;
    this.push(html);
  }
}
