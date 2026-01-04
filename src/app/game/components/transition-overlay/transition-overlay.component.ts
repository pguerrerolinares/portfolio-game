import {
  Component,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { TransitionService } from '../../../core/services/transition.service';

@Component({
  selector: 'app-transition-overlay',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './transition-overlay.component.html',
  styleUrl: './transition-overlay.component.scss',
})
export class TransitionOverlayComponent {
  private transition = inject(TransitionService);

  readonly fadeOpacity = this.transition.fadeOpacity;
  readonly isTransitioning = this.transition.isTransitioning;
}
