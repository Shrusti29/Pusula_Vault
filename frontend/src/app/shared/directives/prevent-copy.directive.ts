import { Directive, ElementRef, HostListener, Input, OnInit } from '@angular/core';

@Directive({
  selector: '[appPreventCopy]',
  standalone: true
})
export class PreventCopyDirective implements OnInit {
  @Input() preventCopy: boolean = true;

  constructor(private el: ElementRef) {}

  ngOnInit() {}

  @HostListener('contextmenu', ['$event'])
  onContextMenu(event: MouseEvent) {
    if (this.preventCopy) {
      event.preventDefault();
    }
  }

  @HostListener('copy', ['$event'])
  onCopy(event: ClipboardEvent) {
    if (this.preventCopy) {
      event.preventDefault();
    }
  }

  @HostListener('selectstart', ['$event'])
  onSelectStart(event: Event) {
    if (this.preventCopy) {
      event.preventDefault();
    }
  }
}
