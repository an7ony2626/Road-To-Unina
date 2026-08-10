import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, input, output } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

// Wikipedia's real Vector skin stylesheet — loaded here instead of a
// hand-written CSS approximation of infobox/thumb/gallery layout, so the
// article looks exactly like it does on wikipedia.org. ShadowDom
// encapsulation is what makes this safe: a stylesheet built for an
// entire external site is scoped to this component's shadow root and
// cannot leak out to, or be affected by, the rest of the app.
// only=styles means no Wikipedia JS is loaded — nothing here can
// interfere with our own click handling below.
const WIKIPEDIA_STYLES_URL =
  'https://it.wikipedia.org/w/load.php?lang=it&modules=site.styles%7Cskins.vector.styles%7Cmediawiki.skinning.content.parsoid%7Cext.cite.styles&only=styles&skin=vector-2022';

@Component({
  selector: 'app-wiki-article',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
  styleUrl: './wiki-article.component.scss',
  template: `
    <link rel="stylesheet" [href]="stylesUrl" />
    <div class="mw-parser-output wiki-article" [innerHTML]="sanitizedContent()" (click)="onClick($event)"></div>
  `,
})
export class WikiArticleComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly html = input.required<string>();
  readonly disabled = input(false);
  readonly titleClicked = output<string>();

  protected readonly stylesUrl = WIKIPEDIA_STYLES_URL;

  protected sanitizedContent() {
    return this.sanitizer.bypassSecurityTrustHtml(this.html());
  }

  protected onClick(event: MouseEvent): void {
    if (this.disabled()) return;

    const anchor = (event.target as HTMLElement).closest('a');
    if (!anchor) return;

    event.preventDefault();

    const href = anchor.getAttribute('href') ?? '';
    if (!href.startsWith('/wiki/')) return;

    const title = decodeURIComponent(href.slice('/wiki/'.length).split('#')[0]).replace(/_/g, ' ');
    this.titleClicked.emit(title);
  }
}