import { Injectable, signal, inject, DestroyRef } from '@angular/core';
import { Vector2, vec2, vec2Distance } from '../models/physics.model';
import { NPC } from '../models/world.model';
import { PHYSICS } from '../constants/physics-constants';
import { GAME_CONFIG } from '../constants/game-config';

/**
 * Input service for handling touch/mouse input
 */
@Injectable({ providedIn: 'root' })
export class InputService {
  private destroyRef = inject(DestroyRef);

  // Bound event handlers (for cleanup)
  private boundKeyDown = this.onKeyDown.bind(this);
  private boundKeyUp = this.onKeyUp.bind(this);
  // Target position for walking
  readonly walkTarget = signal<Vector2 | null>(null);

  // Swipe vector for jumping
  readonly swipeVector = signal<Vector2>(vec2());

  // Is user currently swiping?
  readonly isSwiping = signal(false);

  // Jump trigger (direction from swipe)
  readonly jumpTrigger = signal<Vector2 | null>(null);

  // Is this a mobile device?
  readonly isMobile = signal(false);

  // Current player position (for swipe detection)
  private playerPosition: Vector2 = vec2();
  private touchStart: Vector2 | null = null;

  // Keyboard movement
  readonly moveDirection = signal<number>(0); // -1 left, 0 none, 1 right
  readonly climbDirection = signal<number>(0); // -1 down, 0 none, 1 up (for ladders)
  private keysHeld = new Set<string>();

  // Jump hold state (for charge jump)
  readonly isJumpHeld = signal(false);

  // Nearby NPC for mobile interaction button
  readonly nearbyNPC = signal<NPC | null>(null);

  /**
   * Set jump held state (for mobile controls)
   */
  setJumpHeld(held: boolean): void {
    this.isJumpHeld.set(held);
  }

  /**
   * Set nearby NPC for mobile interaction button
   */
  setNearbyNPC(npc: NPC | null): void {
    this.nearbyNPC.set(npc);
  }

  constructor() {
    this.detectMobile();
    this.setupKeyboardListeners();
  }

  /**
   * Setup keyboard event listeners with proper cleanup
   */
  private setupKeyboardListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.boundKeyDown);
      window.addEventListener('keyup', this.boundKeyUp);

      // Cleanup on destroy
      this.destroyRef.onDestroy(() => {
        window.removeEventListener('keydown', this.boundKeyDown);
        window.removeEventListener('keyup', this.boundKeyUp);
      });
    }
  }

  /**
   * Handle keyboard key down
   */
  private onKeyDown(event: KeyboardEvent): void {
    this.keysHeld.add(event.code);

    switch (event.code) {
      case 'Space':
        // Start charging jump (Jump King style)
        if (!event.repeat) {
          event.preventDefault();
          this.isJumpHeld.set(true);
        }
        break;
      case 'ArrowUp':
      case 'KeyW':
        // Climb up (ladders only - use Space to jump)
        event.preventDefault();
        this.climbDirection.set(-1); // -1 = up in screen coords
        break;
      case 'ArrowDown':
      case 'KeyS':
        // Climb down
        event.preventDefault();
        this.climbDirection.set(1); // 1 = down in screen coords
        break;
      case 'ArrowLeft':
      case 'KeyA':
        // Move left
        event.preventDefault();
        this.moveDirection.set(-1);
        break;
      case 'ArrowRight':
      case 'KeyD':
        // Move right
        event.preventDefault();
        this.moveDirection.set(1);
        break;
    }
  }

  /**
   * Handle keyboard key up
   */
  private onKeyUp(event: KeyboardEvent): void {
    this.keysHeld.delete(event.code);

    // Handle jump release (charge jump)
    if (event.code === 'Space') {
      this.isJumpHeld.set(false);
      // ChargeJumpService handles the actual jump release
    }

    // Check if we should stop moving horizontally
    if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
      if (!this.keysHeld.has('ArrowRight') && !this.keysHeld.has('KeyD')) {
        this.moveDirection.set(0);
      } else {
        this.moveDirection.set(1);
      }
    } else if (event.code === 'ArrowRight' || event.code === 'KeyD') {
      if (!this.keysHeld.has('ArrowLeft') && !this.keysHeld.has('KeyA')) {
        this.moveDirection.set(0);
      } else {
        this.moveDirection.set(-1);
      }
    }

    // Check if we should stop climbing
    if (event.code === 'ArrowUp' || event.code === 'KeyW') {
      if (!this.keysHeld.has('ArrowDown') && !this.keysHeld.has('KeyS')) {
        this.climbDirection.set(0);
      } else {
        this.climbDirection.set(1); // Still holding down
      }
    } else if (event.code === 'ArrowDown' || event.code === 'KeyS') {
      if (!this.keysHeld.has('ArrowUp') && !this.keysHeld.has('KeyW')) {
        this.climbDirection.set(0);
      } else {
        this.climbDirection.set(-1); // Still holding up
      }
    }
  }

  /**
   * Update player position for swipe detection
   */
  setPlayerPosition(pos: Vector2): void {
    this.playerPosition = pos;
  }

  /**
   * Handle touch/mouse start
   */
  onPointerDown(screenX: number, screenY: number, worldX: number, worldY: number): void {
    this.touchStart = vec2(screenX, screenY);

    // Check if near player (for swipe)
    const distToPlayer = vec2Distance(vec2(worldX, worldY), this.playerPosition);

    if (distToPlayer < PHYSICS.PLAYER_TAP_RADIUS) {
      this.isSwiping.set(true);
      this.swipeVector.set(vec2());
    }
  }

  /**
   * Handle touch/mouse move
   */
  onPointerMove(screenX: number, screenY: number): void {
    if (this.isSwiping() && this.touchStart) {
      const delta = vec2(
        screenX - this.touchStart.x,
        screenY - this.touchStart.y
      );
      this.swipeVector.set(delta);
    }
  }

  /**
   * Handle touch/mouse end
   * Note: Tap-to-walk removed. Use ExitManagerService.setTarget() for exit auto-pathfinding.
   */
  onPointerUp(): void {
    if (this.isSwiping()) {
      const swipe = this.swipeVector();
      const swipeLength = Math.hypot(swipe.x, swipe.y);

      if (swipeLength > PHYSICS.SWIPE_MIN_DISTANCE) {
        // Normalize and invert swipe direction for jump
        // Swipe down = jump up
        const normalizedSwipe = vec2(
          swipe.x / swipeLength,
          -swipe.y / swipeLength // Invert Y for screen coordinates
        );
        this.jumpTrigger.set(normalizedSwipe);
      }

      this.isSwiping.set(false);
      this.swipeVector.set(vec2());
    }

    this.touchStart = null;
  }

  /**
   * Clear jump trigger after processing
   */
  clearJumpTrigger(): void {
    this.jumpTrigger.set(null);
  }

  /**
   * Clear walk target (called when player reaches destination)
   */
  clearWalkTarget(): void {
    this.walkTarget.set(null);
  }

  // ========================================
  // Touch Overlay Methods (Mobile Controls)
  // ========================================

  /**
   * Set move direction from touch zones
   * Called by TouchOverlayComponent
   */
  setMoveDirection(dir: -1 | 0 | 1): void {
    this.moveDirection.set(dir);
  }

  /**
   * Set climb direction from touch swipe
   * Called by TouchOverlayComponent
   */
  setClimbDirection(dir: -1 | 0 | 1): void {
    this.climbDirection.set(dir);
  }

  /**
   * Trigger jump with direction from touch swipe
   * Called by TouchOverlayComponent
   */
  triggerJump(direction: Vector2): void {
    this.jumpTrigger.set(direction);
  }

  /**
   * Set joystick input from virtual joystick
   * Called by VirtualJoystickComponent
   * @param x Horizontal axis: -1 (left) to 1 (right)
   * @param y Vertical axis: -1 (up) to 1 (down)
   */
  setJoystickInput(x: number, y: number): void {
    // Horizontal movement (using centralized deadzone config)
    if (Math.abs(x) > GAME_CONFIG.INPUT.JOYSTICK_DEADZONE_X) {
      this.moveDirection.set(x > 0 ? 1 : -1);
    } else {
      this.moveDirection.set(0);
    }

    // Vertical for ladder climbing (using centralized deadzone config)
    const deadzone = GAME_CONFIG.INPUT.JOYSTICK_DEADZONE_Y;
    if (y < -deadzone) {
      this.climbDirection.set(-1); // Up (negative Y = up in screen coords)
    } else if (y > deadzone) {
      this.climbDirection.set(1); // Down
    } else {
      this.climbDirection.set(0);
    }
  }

  /**
   * Reset all input state (called on section change)
   */
  reset(): void {
    this.walkTarget.set(null);
    this.jumpTrigger.set(null);
    this.swipeVector.set(vec2());
    this.isSwiping.set(false);
    this.moveDirection.set(0);
    this.touchStart = null;
    this.keysHeld.clear();
  }

  /**
   * Detect if this is a mobile/touch device
   * Uses media query for more reliable detection
   */
  private detectMobile(): void {
    if (typeof window !== 'undefined') {
      // Check for touch capability via media query (more reliable)
      const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
      // Fallback to feature detection
      const hasTouchEvents = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      this.isMobile.set(isTouchDevice || hasTouchEvents);
    }
  }
}
