import { Injectable, inject, signal, computed } from '@angular/core';
import { PhysicsService } from './physics.service';
import { InputService } from './input.service';
import { ChargeJumpService } from './charge-jump.service';
import { Vector2, vec2, PhysicsBody, AABB } from '../models/physics.model';
import { EntityState } from '../models/game-entity.model';
import { EntryPoint } from '../models/world.model';
import { PHYSICS } from '../constants/physics-constants';
import { GAME_CONFIG } from '../constants/game-config';

/**
 * Player controller service.
 * Manages player state, physics, and movement.
 */
@Injectable({ providedIn: 'root' })
export class PlayerControllerService {
  private physics = inject(PhysicsService);
  private input = inject(InputService);
  private chargeJump = inject(ChargeJumpService);

  // Expose charge state for UI
  readonly isCharging = this.chargeJump.isCharging;
  readonly chargePercent = this.chargeJump.chargePercent;
  readonly chargeColor = this.chargeJump.chargeColor;
  readonly isFullyCharged = this.chargeJump.isFullyCharged;

  // Player dimensions from centralized config
  private readonly PLAYER_VISUAL_WIDTH = GAME_CONFIG.PLAYER.VISUAL_WIDTH;
  private readonly PLAYER_VISUAL_HEIGHT = GAME_CONFIG.PLAYER.VISUAL_HEIGHT;
  private readonly PLAYER_WIDTH = GAME_CONFIG.PLAYER.COLLISION_WIDTH;
  private readonly PLAYER_HEIGHT = GAME_CONFIG.PLAYER.COLLISION_HEIGHT;
  private readonly COLLISION_OFFSET_X = GAME_CONFIG.PLAYER.COLLISION_OFFSET_X;
  private readonly COLLISION_OFFSET_Y = GAME_CONFIG.PLAYER.COLLISION_OFFSET_Y;

  // Player state signals
  readonly position = signal<Vector2>(vec2(0, 0));
  readonly state = signal<EntityState>('idle');
  readonly facingRight = signal(true);
  readonly isClimbing = signal(false);
  readonly justTeleported = signal(false); // Set to true on menubar teleport, reset on next update

  // Physics body (created on init)
  private body: PhysicsBody | null = null;
  private currentLadder: AABB | null = null;

  /**
   * Get the current physics body
   */
  getBody(): PhysicsBody | null {
    return this.body;
  }

  /**
   * Initialize player at section entry point
   */
  initAtEntry(entry: EntryPoint, groundLevel: number): void {
    // Collision box position (feet at ground level)
    const collisionY = groundLevel - this.PLAYER_HEIGHT;
    const collisionX = entry.x + this.COLLISION_OFFSET_X;

    this.body = this.physics.createBody(
      collisionX,
      collisionY,
      this.PLAYER_WIDTH,
      this.PLAYER_HEIGHT
    );

    // Reset movement state
    this.body.velocity.x = 0;
    this.body.velocity.y = 0;
    this.body.grounded = true;

    // Visual position (offset from collision box)
    const visualX = collisionX - this.COLLISION_OFFSET_X;
    const visualY = collisionY - this.COLLISION_OFFSET_Y;
    this.position.set(vec2(visualX, visualY));
    this.state.set('idle');
    this.facingRight.set(entry.direction === 'right');

    // Update input service with player position
    this.input.setPlayerPosition(this.body.position);
  }

  // Track wall contact for wall jump
  private wallContact: 'left' | 'right' | null = null;

  /**
   * Update player physics and state
   */
  update(deltaTime: number, colliders: AABB[], pageWidth: number, ladders: AABB[] = []): void {
    if (!this.body) return;

    // Check if on a ladder and handle climbing
    this.currentLadder = this.physics.isOnLadder(this.body, ladders);
    const climbDir = this.input.climbDirection();
    this.handleClimbing(climbDir);

    // Check wall contact for wall jump
    this.updateWallContact(colliders);

    // Handle charge jump state machine (Jump King style)
    this.handleChargeJump(deltaTime);

    // Handle movement input (blocked while charging)
    const moveDir = this.input.moveDirection();
    if (!this.isCharging()) {
      this.handleMovement(moveDir);
    } else {
      // While charging, set aim direction but don't move
      this.chargeJump.setAimDirection(moveDir);
    }

    // Apply physics
    this.applyPhysics(colliders);

    // Clamp to bounds and update visual position
    this.clampToBounds(pageWidth);
    this.updateVisualPosition();

    // Update animation state
    this.updateState(moveDir, climbDir);
  }

  /**
   * Handle ladder climbing logic
   */
  private handleClimbing(climbDir: number): void {
    if (!this.body) return;

    if (this.currentLadder) {
      if (climbDir !== 0) {
        this.isClimbing.set(true);
        this.physics.climb(this.body, climbDir);
        this.input.clearJumpTrigger();

        // Clamp at bottom of ladder
        const ladderBottom = this.currentLadder.y + this.currentLadder.height - this.PLAYER_HEIGHT;
        if (this.body.position.y > ladderBottom) {
          this.body.position.y = ladderBottom;
          this.body.velocity.y = 0;
        }
      } else if (this.isClimbing()) {
        this.body.velocity.y = 0;
      }
    } else {
      this.isClimbing.set(false);
    }
  }

  /**
   * Update wall contact state for wall jumping
   */
  private updateWallContact(colliders: AABB[]): void {
    if (!this.body) return;

    if (!this.isClimbing()) {
      this.wallContact = this.physics.isTouchingWall(this.body, colliders);
    } else {
      this.wallContact = null;
    }
  }

  /**
   * Track previous jump held state for edge detection
   */
  private wasJumpHeld = false;

  /**
   * Handle charge jump state machine (Jump King style)
   * - Hold Space/button to charge
   * - Release to jump with force proportional to charge
   * - Can aim left/right while charging
   */
  private handleChargeJump(deltaTime: number): void {
    if (!this.body) return;

    const isHeld = this.input.isJumpHeld();
    const wasHeld = this.wasJumpHeld;
    this.wasJumpHeld = isHeld;

    // Handle ladder jump (instant, not charged)
    if (this.isClimbing() && isHeld && !wasHeld) {
      this.isClimbing.set(false);
      this.body.velocity.y = PHYSICS.JUMP_FORCE;
      this.body.velocity.x = this.input.moveDirection() * PHYSICS.PLAYER_SPEED;
      return;
    }

    // Handle wall jump (instant, not charged)
    if (this.wallContact && !this.body.grounded && isHeld && !wasHeld) {
      this.physics.wallJump(this.body, this.wallContact);
      this.facingRight.set(this.body.facingRight);
      return;
    }

    // Ground charge jump logic
    if (this.body.grounded && !this.isClimbing()) {
      // Start charging on press
      if (isHeld && !wasHeld) {
        this.chargeJump.startCharge();
      }

      // Update charge while held
      if (isHeld && this.isCharging()) {
        this.chargeJump.updateCharge(deltaTime);
      }

      // Release jump on button up
      if (!isHeld && wasHeld && this.isCharging()) {
        // Get charge percent BEFORE release (release resets it)
        const chargeLevel = this.chargePercent() / 100;
        const aimDir = this.chargeJump.aimDirection();

        const jumpVector = this.chargeJump.releaseJump();
        if (jumpVector) {
          this.physics.chargeJump(this.body, chargeLevel, aimDir);
          if (aimDir !== 0) {
            this.facingRight.set(aimDir > 0);
          }
        }
      }
    } else {
      // Cancel charge if player leaves ground
      if (this.isCharging()) {
        this.chargeJump.cancelCharge();
      }
    }
  }

  /**
   * Handle movement input (keyboard and touch)
   */
  private handleMovement(moveDir: number): void {
    if (!this.body || this.isClimbing()) return;

    // Keyboard movement
    if (moveDir !== 0) {
      this.body.velocity.x = moveDir * PHYSICS.PLAYER_SPEED;
      this.body.facingRight = moveDir > 0;
      this.facingRight.set(moveDir > 0);
      return;
    }

    // Touch/click walking
    const walkTarget = this.input.walkTarget();
    if (walkTarget) {
      const reached = this.physics.moveTowards(this.body, walkTarget.x);
      this.facingRight.set(this.body.facingRight);
      if (reached) {
        this.input.clearWalkTarget();
      }
    }
  }

  /**
   * Apply physics (gravity, friction, collisions)
   */
  private applyPhysics(colliders: AABB[]): void {
    if (!this.body) return;

    if (!this.isClimbing()) {
      this.physics.applyGravity(this.body);

      // Wall slide (slow fall against wall)
      if (this.wallContact && !this.body.grounded && this.body.velocity.y > 0) {
        this.physics.applyWallSlide(this.body);
      }

      this.physics.applyFriction(this.body);
    }

    this.physics.updatePosition(this.body);

    if (!this.isClimbing()) {
      this.physics.resolveTerrainCollision(this.body, colliders);
    }
  }

  /**
   * Clamp player position to world bounds
   * Uses GAME_CONFIG.WORLD_BOUNDS - null values mean no limit
   */
  private clampToBounds(pageWidth: number): void {
    if (!this.body) return;

    const bounds = GAME_CONFIG.WORLD_BOUNDS;

    // Horizontal clamp (tight wall collision with small visual margin)
    const wallMargin = 14;
    const wallMarginLeft = 6;
    this.body.position.x = Math.max(
      bounds.MIN_X + wallMarginLeft,
      Math.min(this.body.position.x, bounds.MAX_X - this.PLAYER_WIDTH - wallMargin)
    );

    // Vertical clamp (solo si hay límites definidos en config)
    if (bounds.MIN_Y !== null) {
      this.body.position.y = Math.max(bounds.MIN_Y, this.body.position.y);
    }
    if (bounds.MAX_Y !== null) {
      this.body.position.y = Math.min(bounds.MAX_Y, this.body.position.y);
    }
  }

  /**
   * Update visual position from collision box
   */
  private updateVisualPosition(): void {
    if (!this.body) return;

    const visualX = this.body.position.x - this.COLLISION_OFFSET_X;
    const visualY = this.body.position.y - this.COLLISION_OFFSET_Y;
    this.position.set(vec2(visualX, visualY));
    this.input.setPlayerPosition(this.body.position);
  }

  /**
   * Update player animation state based on movement
   */
  private updateState(moveDir: number, climbDir: number = 0): void {
    if (!this.body) return;

    const speed = Math.abs(this.body.velocity.x);
    const isAirborne = !this.body.grounded;

    if (this.isCharging()) {
      this.state.set('charge');
    } else if (this.isClimbing()) {
      this.state.set('climb');
    } else if (isAirborne) {
      this.state.set('jump');
    } else if (speed > 1 || moveDir !== 0) {
      this.state.set('walk');
    } else {
      this.state.set('idle');
    }
  }

  /**
   * Reset player state
   */
  reset(): void {
    this.body = null;
    this.position.set(vec2(0, 0));
    this.state.set('idle');
    this.facingRight.set(true);
    this.input.reset();
  }

  /**
   * Teleport player to specific position
   * Used by menubar for section navigation
   */
  teleportTo(x: number, y: number): void {
    if (!this.body) return;

    // Set collision box position
    const collisionX = x + this.COLLISION_OFFSET_X;
    const collisionY = y - this.PLAYER_HEIGHT;

    this.body.position.x = collisionX;
    this.body.position.y = collisionY;
    this.body.velocity.x = 0;
    this.body.velocity.y = 0;
    this.body.grounded = true;

    // Update visual position
    this.updateVisualPosition();
    this.state.set('idle');

    // Mark as teleported (for background change detection)
    this.justTeleported.set(true);
  }

  /**
   * Get player top position for CSS rendering
   */
  readonly topPosition = computed(() => this.position().y);
}
