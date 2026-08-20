import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { wikiUrl } from '../wiki-link/wiki-link';

@Component({
  selector: 'app-wiki-page-link',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: 'wiki-page-link.component.scss',
  template: `
    <a
      class="wiki-link"
      [href]="wikiUrl(title())"
      target="_blank"
      rel="noopener noreferrer"
      title="Apri su Wikipedia"
      (click)="onClick($event)"
    >
      @if (bold()) {
        <strong>{{ title() }}</strong>
      } @else {
        {{ title() }}
      }
    </a>
  `,
})
export class WikiPageLinkComponent {
  readonly title = input.required<string>();
  readonly bold = input(false);
  readonly stopPropagation = input(false);

  protected readonly wikiUrl = wikiUrl;

  protected onClick(event: MouseEvent): void {
    if (this.stopPropagation()) event.stopPropagation();
  }
}
