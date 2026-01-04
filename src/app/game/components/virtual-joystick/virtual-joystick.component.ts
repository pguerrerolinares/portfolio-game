import {
  Component,
  inject,
  input,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * Virtual Joystick Component (Visual Only)
 * Circle joystick with movable nub for mobile controls.
 * Logic handled by MobileControlsComponent parent.
 * Based on Kenney's mobile control assets.
 */
@Component({
  selector: 'app-virtual-joystick',
  templateUrl: './virtual-joystick.component.html',
  styleUrl: './virtual-joystick.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VirtualJoystickComponent {
  private document = inject(DOCUMENT);

  // Base path for assets (handles GitHub Pages base-href)
  readonly basePath = this.document.baseURI.replace(/\/$/, '');

  // Nub offset inputs from parent (MobileControlsComponent)
  readonly nubOffsetX = input<number>(0);
  readonly nubOffsetY = input<number>(0);

  // Computed offset object for template
  readonly nubOffset = computed(() => ({
    x: this.nubOffsetX(),
    y: this.nubOffsetY(),
  }));

  // Active state based on nub position
  readonly isActive = computed(() => {
    return this.nubOffsetX() !== 0 || this.nubOffsetY() !== 0;
  });
}
