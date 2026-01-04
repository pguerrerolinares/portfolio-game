import {
  Component,
  input,
  signal,
  ChangeDetectionStrategy,
  inject,
  DestroyRef,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Section Title Component
 * Cinematic movie-style banner that displays the current section name.
 * Fades in, holds, then fades out automatically.
 */
@Component({
  selector: 'app-section-title',
  templateUrl: './section-title.component.html',
  styleUrl: './section-title.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe],
})
export class SectionTitleComponent {
  private document = inject(DOCUMENT);
  private destroyRef = inject(DestroyRef);

  // Base path for assets (handles GitHub Pages base-href)
  readonly basePath = this.document.baseURI.replace(/\/$/, '');

  readonly title = input.required<string>();
  readonly isVisible = signal(false);

  private hideTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Cleanup timeout on destroy
    this.destroyRef.onDestroy(() => {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
      }
    });
  }

  /**
   * Show the title with cinematic animation.
   * Auto-hides after 3 seconds (0.5s fade in + 2s hold + 0.5s fade out).
   */
  show(): void {
    // Clear any pending hide timeout
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    this.isVisible.set(true);

    // Auto-hide after hold duration (fade out is handled by CSS)
    this.hideTimeout = setTimeout(() => {
      this.isVisible.set(false);
      this.hideTimeout = null;
    }, 2500); // 0.5s fade in + 2s hold
  }

  /**
   * Immediately hide the title.
   */
  hide(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    this.isVisible.set(false);
  }
}
