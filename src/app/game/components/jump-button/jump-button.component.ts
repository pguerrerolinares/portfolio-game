import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DOCUMENT, DecimalPipe } from '@angular/common';
import { InputService } from '../../../core/services/input.service';
import { ChargeJumpService } from '../../../core/services/charge-jump.service';

/**
 * Jump Button Component (Jump King style)
 *
 * Circle button with charge ring for mobile controls.
 * - Hold to charge jump
 * - Release to jump with charged force
 * - Ring fills as charge increases
 */
@Component({
  selector: 'app-jump-button',
  templateUrl: './jump-button.component.html',
  styleUrl: './jump-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
})
export class JumpButtonComponent {
  private document = inject(DOCUMENT);
  private input = inject(InputService);
  private chargeJump = inject(ChargeJumpService);

  // Base path for assets (handles GitHub Pages base-href)
  readonly basePath = this.document.baseURI.replace(/\/$/, '');

  readonly isPressed = signal(false);

  // Expose charge state for template
  readonly isCharging = this.chargeJump.isCharging;
  readonly chargePercent = this.chargeJump.chargePercent;
  readonly chargeColor = this.chargeJump.chargeColor;
  readonly isFullyCharged = this.chargeJump.isFullyCharged;

  // SVG circle properties for charge ring
  readonly ringRadius = 28;
  readonly ringCircumference = 2 * Math.PI * this.ringRadius;

  // Compute stroke-dashoffset based on charge percent
  readonly ringOffset = computed(() => {
    const percent = this.chargePercent() / 100;
    return this.ringCircumference * (1 - percent);
  });

  onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.isPressed.set(true);
    // Start charging jump (like holding Space)
    this.input.setJumpHeld(true);
  }

  onTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.isPressed.set(false);
    // Release jump (like releasing Space)
    this.input.setJumpHeld(false);
  }
}
