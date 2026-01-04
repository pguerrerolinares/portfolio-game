import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
  ElementRef,
} from '@angular/core';
import { InputService } from '../../../core/services/input.service';
import { VirtualJoystickComponent } from '../virtual-joystick/virtual-joystick.component';
import { JumpButtonComponent } from '../jump-button/jump-button.component';
import { NpcInteractButtonComponent } from '../npc-interact-button/npc-interact-button.component';

/**
 * Mobile Controls Component - Steve Jobs Philosophy
 *
 * Two-zone layout for two-thumb control:
 * - LEFT ZONE: Dynamic joystick appears where you touch (movement)
 * - RIGHT ZONE: Fixed action buttons (jump, talk to NPC)
 *
 * Positioned within game-scene bounds for consistent layout.
 */
@Component({
  selector: 'app-mobile-controls',
  templateUrl: './mobile-controls.component.html',
  styleUrl: './mobile-controls.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [VirtualJoystickComponent, JumpButtonComponent, NpcInteractButtonComponent],
  host: {
    '(document:touchstart)': 'onTouchStart($event)',
    '(document:touchmove)': 'onTouchMove($event)',
    '(document:touchend)': 'onTouchEnd($event)',
    '(document:touchcancel)': 'onTouchEnd($event)',
  },
})
export class MobileControlsComponent {
  private input = inject(InputService);
  private elementRef = inject(ElementRef);

  // Device detection
  readonly isMobile = this.input.isMobile;

  // NPC interaction
  readonly nearbyNPC = this.input.nearbyNPC;

  // Dynamic joystick position (relative to game-scene)
  readonly joystickPosition = signal<{ x: number; y: number } | null>(null);
  readonly joystickVisible = computed(() => this.joystickPosition() !== null);

  // Joystick nub offset (for visual feedback)
  readonly joystickNubOffset = signal<{ x: number; y: number }>({ x: 0, y: 0 });

  // Track active touch for joystick
  private activeTouchId: number | null = null;

  /**
   * Get the tower-viewport element (game container)
   */
  private getGameScene(): HTMLElement | null {
    return this.elementRef.nativeElement.closest('.tower-viewport');
  }

  /**
   * Convert viewport coordinates to game-scene local coordinates
   */
  private viewportToLocal(clientX: number, clientY: number): { x: number; y: number } | null {
    const gameScene = this.getGameScene();
    if (!gameScene) return null;

    const rect = gameScene.getBoundingClientRect();

    // Account for any CSS transforms (scaling)
    const scaleX = gameScene.offsetWidth / rect.width;
    const scaleY = gameScene.offsetHeight / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  onTouchStart(event: TouchEvent): void {
    // Only handle if mobile and no active joystick touch
    if (this.activeTouchId !== null || !this.isMobile()) return;

    const target = event.target as HTMLElement;

    // Exclude UI elements that handle their own touches
    if (
      target.closest('.menubar') ||
      target.closest('.dialogue-box') ||
      target.closest('.action-buttons') ||
      target.closest('.dynamic-joystick')
    ) {
      return;
    }

    const touch = event.touches[0];

    // Convert to game-scene local coordinates
    const localPos = this.viewportToLocal(touch.clientX, touch.clientY);
    if (!localPos) return;

    const gameScene = this.getGameScene();
    if (!gameScene) return;

    // Only activate joystick in LEFT zone (left half of game scene)
    const gameSceneMidpoint = gameScene.offsetWidth / 2;

    if (localPos.x < gameSceneMidpoint) {
      this.activeTouchId = touch.identifier;

      // Clamp joystick position to stay within game-scene bounds
      const padding = 50; // Keep joystick away from edges
      const clampedX = Math.max(padding, Math.min(localPos.x, gameScene.offsetWidth - padding));
      const clampedY = Math.max(padding, Math.min(localPos.y, gameScene.offsetHeight - padding));

      this.joystickPosition.set({ x: clampedX, y: clampedY });
    }
  }

  onTouchMove(event: TouchEvent): void {
    if (this.activeTouchId === null || !this.isMobile()) return;

    // Find our tracked touch
    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i];
      if (touch.identifier === this.activeTouchId) {
        const joystickPos = this.joystickPosition();
        if (!joystickPos) return;

        const gameScene = this.getGameScene();
        if (!gameScene) return;

        const localPos = this.viewportToLocal(touch.clientX, touch.clientY);
        if (!localPos) return;

        // Calculate offset from joystick center
        const dx = localPos.x - joystickPos.x;
        const dy = localPos.y - joystickPos.y;

        // Joystick radius (same as VirtualJoystickComponent)
        const JOYSTICK_RADIUS = 30;

        // Normalize to -1..1
        const distance = Math.hypot(dx, dy);
        let normalX = distance > 0 ? dx / JOYSTICK_RADIUS : 0;
        let normalY = distance > 0 ? dy / JOYSTICK_RADIUS : 0;

        // Clamp to -1..1
        normalX = Math.max(-1, Math.min(1, normalX));
        normalY = Math.max(-1, Math.min(1, normalY));

        // Update visual nub offset (clamped to radius)
        const clampedDx = Math.max(-JOYSTICK_RADIUS, Math.min(JOYSTICK_RADIUS, dx));
        const clampedDy = Math.max(-JOYSTICK_RADIUS, Math.min(JOYSTICK_RADIUS, dy));
        this.joystickNubOffset.set({ x: clampedDx, y: clampedDy });

        this.input.setJoystickInput(normalX, normalY);
        break;
      }
    }
  }

  onTouchEnd(event: TouchEvent): void {
    if (this.activeTouchId === null) return;

    // Check if our tracked touch ended
    for (const touch of Array.from(event.changedTouches)) {
      if (touch.identifier === this.activeTouchId) {
        this.activeTouchId = null;
        this.joystickPosition.set(null);
        this.joystickNubOffset.set({ x: 0, y: 0 });
        // Reset joystick input when released
        this.input.setJoystickInput(0, 0);
        break;
      }
    }
  }
}
