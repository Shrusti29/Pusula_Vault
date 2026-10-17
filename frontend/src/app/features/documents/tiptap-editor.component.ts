import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  AfterViewInit,
  inject,
  signal,
  viewChild,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Heading from '@tiptap/extension-heading';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import CodeBlock from '@tiptap/extension-code-block';
import Blockquote from '@tiptap/extension-blockquote';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';

@Component({
  selector: 'app-tiptap-editor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="editor-wrap">
      <div class="editor-toolbar">
        <button
          class="toolbar-btn"
          [class.is-active]="false"
          (click)="undo()"
          title="Undo"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>
          </svg>
        </button>
        <button
          class="toolbar-btn"
          (click)="redo()"
          title="Redo"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 15-6.7L21 13"/>
          </svg>
        </button>
        <span class="toolbar-divider"></span>

        <button
          class="toolbar-btn"
          [class.is-active]="isActive('bold')"
          (click)="toggleBold()"
          title="Bold"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
          </svg>
        </button>
        <button
          class="toolbar-btn"
          [class.is-active]="isActive('italic')"
          (click)="toggleItalic()"
          title="Italic"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="4" x2="10" y2="4"/>
            <line x1="14" y1="20" x2="5" y2="20"/>
            <line x1="15" y1="4" x2="9" y2="20"/>
          </svg>
        </button>
        <button
          class="toolbar-btn"
          [class.is-active]="isActive('underline')"
          (click)="toggleUnderline()"
          title="Underline"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/>
            <line x1="4" y1="21" x2="20" y2="21"/>
          </svg>
        </button>
        <span class="toolbar-divider"></span>

        <button
          class="toolbar-btn"
          [class.is-active]="isActive('heading', { level: 1 })"
          (click)="toggleHeading(1)"
          title="Heading 1"
        >
          <span style="font-weight:800; font-size:0.9rem;">H1</span>
        </button>
        <button
          class="toolbar-btn"
          [class.is-active]="isActive('heading', { level: 2 })"
          (click)="toggleHeading(2)"
          title="Heading 2"
        >
          <span style="font-weight:800; font-size:0.9rem;">H2</span>
        </button>
        <button
          class="toolbar-btn"
          [class.is-active]="isActive('heading', { level: 3 })"
          (click)="toggleHeading(3)"
          title="Heading 3"
        >
          <span style="font-weight:800; font-size:0.9rem;">H3</span>
        </button>
        <span class="toolbar-divider"></span>

        <button
          class="toolbar-btn"
          [class.is-active]="isActive('bulletList')"
          (click)="toggleBulletList()"
          title="Bullet list"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="8" y1="6" x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
        </button>
        <button
          class="toolbar-btn"
          [class.is-active]="isActive('orderedList')"
          (click)="toggleOrderedList()"
          title="Ordered list"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="10" y1="6" x2="21" y2="6"/>
            <line x1="10" y1="12" x2="21" y2="12"/>
            <line x1="10" y1="18" x2="21" y2="18"/>
            <path d="M4 6h1v4"/>
            <path d="M4 10h2"/>
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>
          </svg>
        </button>
        <button
          class="toolbar-btn"
          [class.is-active]="isActive('blockquote')"
          (click)="toggleBlockquote()"
          title="Blockquote"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/>
            <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"/>
          </svg>
        </button>
        <span class="toolbar-divider"></span>

        <button
          class="toolbar-btn"
          [class.is-active]="isActive('table')"
          (click)="insertTable()"
          title="Insert table"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="3" y1="15" x2="21" y2="15"/>
            <line x1="9" y1="3" x2="9" y2="21"/>
            <line x1="15" y1="3" x2="15" y2="21"/>
          </svg>
        </button>
        <button
          class="toolbar-btn"
          (click)="addTableRow()"
          title="Add row"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span style="font-size:0.68rem; font-weight:700;">+R</span>
        </button>
        <button
          class="toolbar-btn"
          (click)="addTableCol()"
          title="Add column"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span style="font-size:0.68rem; font-weight:700;">+C</span>
        </button>
        <span class="toolbar-divider"></span>

        <button
          class="toolbar-btn"
          [class.is-active]="isActive('link')"
          (click)="setLink()"
          title="Insert link"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
        </button>
        <button
          class="toolbar-btn"
          (click)="setImage()"
          title="Insert image"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </button>
        <button
          class="toolbar-btn"
          [class.is-active]="isActive('codeBlock')"
          (click)="toggleCodeBlock()"
          title="Code block"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="16 18 22 12 16 6"/>
            <polyline points="8 6 2 12 8 18"/>
          </svg>
        </button>
        <span class="toolbar-divider"></span>

        <button
          class="toolbar-btn"
          [class.is-active]="isActiveTextAlign('left')"
          (click)="setTextAlign('left')"
          title="Align left"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="15" y2="12"/>
            <line x1="3" y1="18" x2="18" y2="18"/>
          </svg>
        </button>
        <button
          class="toolbar-btn"
          [class.is-active]="isActiveTextAlign('center')"
          (click)="setTextAlign('center')"
          title="Align center"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="6" y1="12" x2="18" y2="12"/>
            <line x1="4" y1="18" x2="20" y2="18"/>
          </svg>
        </button>
        <button
          class="toolbar-btn"
          [class.is-active]="isActiveTextAlign('right')"
          (click)="setTextAlign('right')"
          title="Align right"
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="9" y1="12" x2="21" y2="12"/>
            <line x1="6" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="editor-canvas">
        <div #editorContent class="editor-scroller"></div>
      </div>
    </div>
  `,
  styles: [`
    .editor-wrap {
      background: var(--pv-bg-card);
      border: 1px solid var(--pv-border);
      border-radius: var(--pv-radius-lg);
      box-shadow: var(--pv-shadow-card);
      overflow: hidden;
    }
    .editor-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.2rem;
      padding: 0.65rem 0.85rem;
      background: linear-gradient(180deg, var(--pv-bg-dark) 0%, rgba(10, 22, 40, 0.8) 100%);
      border-bottom: 1px solid var(--pv-border);
      position: sticky;
      top: 0;
      z-index: 5;
    }
    .toolbar-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      min-width: 34px;
      height: 34px;
      padding: 0 0.5rem;
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--pv-radius-sm);
      color: var(--pv-text-secondary);
      cursor: pointer;
      font-size: 0.85rem;
      transition: all var(--pv-transition-fast);
      font-weight: 500;
    }
    .toolbar-btn:hover {
      background: var(--pv-bg-card-hover);
      color: var(--pv-text-primary);
      border-color: var(--pv-border);
    }
    .toolbar-btn:active { transform: scale(0.96); }
    .toolbar-btn.is-active {
      background: rgba(14, 165, 233, 0.15);
      color: var(--pv-accent-blue);
      border-color: rgba(14, 165, 233, 0.35);
    }
    .toolbar-divider {
      width: 1px;
      height: 22px;
      background: var(--pv-border);
      margin: 0 0.35rem;
      align-self: center;
    }

    .editor-canvas {
      background: linear-gradient(180deg, #070f1f 0%, var(--pv-bg-mid) 100%);
      padding: 2.5rem 2.5rem 4rem;
    }
    .editor-scroller {
      background: var(--pv-bg-card);
      border: 1px solid var(--pv-border);
      border-radius: var(--pv-radius-md);
      min-height: 700px;
      max-width: 100%;
      margin: 0 auto;
      padding: 2rem 2.5rem;
      box-shadow: 0 2px 16px rgba(0, 0, 0, 0.25);
    }
    .editor-scroller :deep(.ProseMirror) {
      outline: none;
      min-height: 640px;
      padding: 0;
      color: var(--pv-text-primary);
      line-height: 1.75;
      font-size: 0.95rem;
    }
    .editor-scroller :deep(.ProseMirror h1) {
      font-size: 2rem;
      font-weight: 800;
      margin: 1.5rem 0 0.75rem;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, var(--pv-text-primary), var(--pv-accent-blue));
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .editor-scroller :deep(.ProseMirror h2) {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 1.25rem 0 0.6rem;
      color: var(--pv-text-primary);
      letter-spacing: -0.01em;
    }
    .editor-scroller :deep(.ProseMirror h3) {
      font-size: 1.15rem;
      font-weight: 700;
      margin: 1rem 0 0.5rem;
      color: var(--pv-text-primary);
    }
    .editor-scroller :deep(.ProseMirror p) {
      margin: 0.6rem 0;
      color: var(--pv-text-secondary);
    }
    .editor-scroller :deep(.ProseMirror ul),
    .editor-scroller :deep(.ProseMirror ol) {
      padding-left: 1.75rem;
      margin: 0.75rem 0;
    }
    .editor-scroller :deep(.ProseMirror ul li),
    .editor-scroller :deep(.ProseMirror ol li) {
      margin: 0.3rem 0;
      color: var(--pv-text-secondary);
    }
    .editor-scroller :deep(.ProseMirror ul li::marker) { color: var(--pv-accent-blue); }
    .editor-scroller :deep(.ProseMirror ol li::marker) { color: var(--pv-accent-purple); font-weight: 700; }
    .editor-scroller :deep(.ProseMirror blockquote) {
      border-left: 3px solid var(--pv-accent-blue);
      padding-left: 1.25rem;
      margin: 1.25rem 0;
      color: var(--pv-text-muted);
      font-style: italic;
      background: linear-gradient(90deg, rgba(14, 165, 233, 0.08), transparent);
      padding: 0.75rem 1rem 0.75rem 1.25rem;
      border-radius: 0 var(--pv-radius-md) var(--pv-radius-md) 0;
    }
    .editor-scroller :deep(.ProseMirror code) {
      background: rgba(14, 165, 233, 0.1);
      padding: 0.18rem 0.45rem;
      border-radius: 5px;
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 0.85em;
      color: var(--pv-accent-teal);
      border: 1px solid rgba(14, 165, 233, 0.15);
    }
    .editor-scroller :deep(.ProseMirror pre) {
      background: linear-gradient(180deg, var(--pv-bg-dark) 0%, #020612 100%);
      padding: 1.25rem;
      border-radius: var(--pv-radius-md);
      border: 1px solid var(--pv-border);
      overflow-x: auto;
      margin: 1.25rem 0;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
    }
    .editor-scroller :deep(.ProseMirror pre code) {
      background: none;
      padding: 0;
      border: none;
      color: var(--pv-text-secondary);
      font-size: 0.85rem;
      line-height: 1.7;
    }
    .editor-scroller :deep(.ProseMirror a) {
      color: var(--pv-accent-blue);
      text-decoration: underline;
      text-underline-offset: 3px;
      text-decoration-color: rgba(14, 165, 233, 0.4);
      transition: all var(--pv-transition-fast);
    }
    .editor-scroller :deep(.ProseMirror a:hover) {
      color: var(--pv-accent-blue-hover);
      text-decoration-color: var(--pv-accent-blue);
    }
    .editor-scroller :deep(.ProseMirror table) {
      border-collapse: collapse;
      margin: 1.25rem 0;
      overflow: hidden;
      width: 100%;
      border-radius: var(--pv-radius-md);
      border: 1px solid var(--pv-border);
    }
    .editor-scroller :deep(.ProseMirror td),
    .editor-scroller :deep(.ProseMirror th) {
      border: 1px solid var(--pv-border);
      padding: 0.65rem 0.85rem;
      min-width: 80px;
      vertical-align: top;
      color: var(--pv-text-secondary);
    }
    .editor-scroller :deep(.ProseMirror th) {
      background: linear-gradient(180deg, var(--pv-bg-dark) 0%, var(--pv-bg-mid) 100%);
      font-weight: 700;
      text-align: left;
      color: var(--pv-text-primary);
      font-size: 0.85rem;
    }
    .editor-scroller :deep(.ProseMirror tr:nth-child(even) td) {
      background: rgba(15, 23, 42, 0.4);
    }
    .editor-scroller :deep(.ProseMirror img) {
      max-width: 100%;
      border-radius: var(--pv-radius-md);
      margin: 1.25rem 0;
      border: 1px solid var(--pv-border);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }
    .editor-scroller :deep(.ProseMirror hr) {
      border: none;
      border-top: 1px solid var(--pv-border);
      margin: 2rem 0;
    }
    .editor-scroller :deep(.ProseMirror p.is-editor-empty:first-child::before) {
      content: attr(data-placeholder);
      float: left;
      color: var(--pv-text-subtle);
      pointer-events: none;
      height: 0;
      font-style: italic;
    }
    .editor-scroller :deep(hr) {
      border: none;
      border-top: 2px solid var(--pv-border);
      margin: 1.5rem 0;
      border-radius: 2px;
    }
  `]
})
export class TiptapEditorComponent implements OnInit, OnDestroy, AfterViewInit {
  private cdr = inject(ChangeDetectorRef);

  @Input() set content(val: string) {
    if (this._editor && this._editor.getHTML() !== val) {
      this._editor.commands.setContent(val ?? '', false);
    }
    this._inputContent = val ?? '';
  }
  @Output() contentChange = new EventEmitter<string>();

  editorContent = viewChild<ElementRef<HTMLDivElement>>('editorContent');

  private _editor?: Editor;
  private _inputContent = '';

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    const host = this.editorContent()?.nativeElement;
    if (!host) return;

    this._editor = new Editor({
      element: host,
      extensions: [
        StarterKit.configure({
          blockquote: false,
          codeBlock: false,
          heading: false,
        }),
        Heading.configure({ levels: [1, 2, 3] }),
        Underline,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: { rel: 'noopener noreferrer' },
        }),
        Table.configure({ resizable: false }),
        TableRow,
        TableCell,
        TableHeader,
        CodeBlock.configure({
          HTMLAttributes: { class: 'code-block' },
        }),
        Blockquote,
        Image.configure({ inline: false, allowBase64: true }),
        Placeholder.configure({
          placeholder: ({ node }) => {
            if (node.type.name === 'heading') {
              return `Heading ${(node.attrs as any)['level']}`;
            }
            return "Start writing, or press '/' for commands...";
          },
          includeChildren: true,
        }),
      ],
      content: this._inputContent,
      onUpdate: ({ editor }) => {
        this.contentChange.emit(editor.getHTML());
        this.cdr.detectChanges();
      },
      onSelectionUpdate: () => {
        this.cdr.detectChanges();
      },
      onTransaction: () => {
        this.cdr.detectChanges();
      },
    });

    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this._editor?.destroy();
  }

  get editor(): Editor | undefined {
    return this._editor;
  }

  isActive(name: string, attrs?: Record<string, unknown>): boolean {
    return this._editor?.isActive(name, attrs) ?? false;
  }

  isActiveTextAlign(align: string): boolean {
    return ((this._editor?.state.doc.type.schema as any)?.nodes?.paragraph)
      ? this._editor?.isActive({ textAlign: align }) ?? false
      : false;
  }

  undo(): void { this._editor?.chain().focus().undo().run(); }
  redo(): void { this._editor?.chain().focus().redo().run(); }

  toggleBold(): void { this._editor?.chain().focus().toggleBold().run(); }
  toggleItalic(): void { this._editor?.chain().focus().toggleItalic().run(); }
  toggleUnderline(): void { this._editor?.chain().focus().toggleUnderline().run(); }

  toggleHeading(level: 1 | 2 | 3): void {
    this._editor?.chain().focus().toggleHeading({ level }).run();
  }

  toggleBulletList(): void { this._editor?.chain().focus().toggleBulletList().run(); }
  toggleOrderedList(): void { this._editor?.chain().focus().toggleOrderedList().run(); }
  toggleBlockquote(): void { this._editor?.chain().focus().toggleBlockquote().run(); }
  toggleCodeBlock(): void { this._editor?.chain().focus().toggleCodeBlock().run(); }

  insertTable(): void {
    this._editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }
  addTableRow(): void {
    try { this._editor?.chain().focus().addRowBefore().run(); } catch { /* noop */ }
  }
  addTableCol(): void {
    try { this._editor?.chain().focus().addColumnBefore().run(); } catch { /* noop */ }
  }

  setLink(): void {
    const previousUrl = (this._editor?.getAttributes('link') as any)?.['href'] ?? '';
    const url = window.prompt('Enter URL:', previousUrl);
    if (url === null) return;
    if (url === '') {
      this._editor?.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    this._editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }

  setImage(): void {
    const url = window.prompt('Enter image URL:');
    if (!url) return;
    this._editor?.chain().focus().setImage({ src: url, alt: '' }).run();
  }

  setTextAlign(align: 'left' | 'center' | 'right'): void {
    try {
      const chain = this._editor?.chain().focus();
      if (!chain) return;
      (chain as unknown as { setTextAlign?: (a: string) => unknown })
        .setTextAlign?.(align);
      chain.run();
    } catch {
      // textAlign extension not loaded; apply inline styling as placeholder
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const el = sel.anchorNode?.parentElement;
      if (el) {
        el.style.textAlign = align;
      }
    }
  }
}
