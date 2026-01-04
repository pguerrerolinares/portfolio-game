import { Injectable, signal } from '@angular/core';
import { Vector2, PhysicsBody, AABB, vec2, aabbOverlap } from '../models/physics.model';
import { PHYSICS } from '../constants/physics-constants';
import { GAME_CONFIG } from '../constants/game-config';

/**
 * Physics service for handling movement, gravity, and collisions
 */
@Injectable({ providedIn: 'root' })
export class PhysicsService {
  /**
   * Apply gravity to a physics body
   */
  applyGravity(body: PhysicsBody): void {
    if (!body.grounded) {
      body.velocity.y = Math.min(
        body.velocity.y + PHYSICS.GRAVITY,
        PHYSICS.MAX_FALL_SPEED
      );
    }
  }

  /**
   * Apply friction to horizontal velocity
   */
  applyFriction(body: PhysicsBody): void {
    if (body.grounded) {
      body.velocity.x *= PHYSICS.FRICTION;
    } else {
      body.velocity.x *= PHYSICS.AIR_RESISTANCE;
    }

    // Stop very small movements
    if (Math.abs(body.velocity.x) < 0.1) {
      body.velocity.x = 0;
    }
  }

  /**
   * Move body towards a target X position
   */
  moveTowards(body: PhysicsBody, targetX: number): boolean {
    const diff = targetX - body.position.x;
    const distance = Math.abs(diff);

    if (distance < 5) {
      body.velocity.x = 0;
      return true; // Reached target
    }

    const direction = Math.sign(diff);
    body.velocity.x = PHYSICS.PLAYER_SPEED * direction;
    body.facingRight = direction > 0;

    return false; // Still moving
  }

  /**
   * Make body climb towards a target Y position
   */
  climbTowards(body: PhysicsBody, targetY: number): boolean {
    const diff = targetY - body.position.y;
    const distance = Math.abs(diff);

    if (distance < 5) {
      body.velocity.y = 0;
      return true; // Reached target
    }

    const direction = Math.sign(diff);
    body.velocity.y = PHYSICS.CLIMB_SPEED * direction;

    return false; // Still climbing
  }

  /**
   * Apply jump force to body
   */
  jump(body: PhysicsBody, force: number = PHYSICS.JUMP_FORCE): void {
    if (body.grounded) {
      body.velocity.y = force;
      body.grounded = false;
    }
  }

  /**
   * Apply charged jump force to body (Jump King style)
   * @param body - Physics body to apply jump to
   * @param chargePercent - Charge level from 0 to 1
   * @param aimX - Horizontal aim direction from -1 to 1
   */
  chargeJump(body: PhysicsBody, chargePercent: number, aimX: number): void {
    if (!body.grounded) return;

    const minForce = PHYSICS.CHARGE_JUMP_MIN_FORCE;
    const maxForce = PHYSICS.CHARGE_JUMP_MAX_FORCE;

    // Calculate vertical force based on charge percentage
    body.velocity.y = minForce + (maxForce - minForce) * chargePercent;

    // Calculate horizontal velocity based on aim and charge
    body.velocity.x = aimX * PHYSICS.CHARGE_JUMP_HORIZONTAL * chargePercent;

    // Update facing direction based on aim
    if (aimX !== 0) {
      body.facingRight = aimX > 0;
    }

    body.grounded = false;
  }

  /**
   * Update body position based on velocity
   */
  updatePosition(body: PhysicsBody): void {
    body.position.x += body.velocity.x;
    body.position.y += body.velocity.y;

    // Update bounds
    body.bounds.x = body.position.x;
    body.bounds.y = body.position.y;
  }

  /**
   * Check and resolve collision with terrain
   * Standard platformer physics (no step-up)
   */
  resolveTerrainCollision(body: PhysicsBody, terrain: AABB[]): void {
    // First check if grounded using a sensor below the body
    body.grounded = this.checkGrounded(body, terrain);

    for (const tile of terrain) {
      if (aabbOverlap(body.bounds, tile)) {
        // Calculate overlap on each axis
        const overlapX = Math.min(
          body.bounds.x + body.bounds.width - tile.x,
          tile.x + tile.width - body.bounds.x
        );
        const overlapY = Math.min(
          body.bounds.y + body.bounds.height - tile.y,
          tile.y + tile.height - body.bounds.y
        );

        // Resolve smallest overlap
        if (overlapX < overlapY) {
          // Horizontal collision - stop movement
          if (body.position.x < tile.x) {
            body.position.x = tile.x - body.bounds.width;
          } else {
            body.position.x = tile.x + tile.width;
          }
          body.velocity.x = 0;
        } else {
          // Vertical collision
          if (body.position.y < tile.y) {
            // Landing on top
            body.position.y = tile.y - body.bounds.height;
            body.velocity.y = 0;
            body.grounded = true;
          } else {
            // Hitting from below
            body.position.y = tile.y + tile.height;
            body.velocity.y = 0;
          }
        }

        // Update bounds after position change
        body.bounds.x = body.position.x;
        body.bounds.y = body.position.y;
      }
    }
  }

  /**
   * Check if body is grounded on terrain
   */
  checkGrounded(body: PhysicsBody, terrain: AABB[]): boolean {
    // Create a small box below the body to check for ground
    const margin = GAME_CONFIG.COLLISION.TERRAIN_MARGIN_X;
    const sensorHeight = GAME_CONFIG.COLLISION.GROUND_SENSOR_HEIGHT;

    const groundCheck: AABB = {
      x: body.bounds.x + margin,
      y: body.bounds.y + body.bounds.height,
      width: body.bounds.width - margin * 2,
      height: sensorHeight,
    };

    for (const tile of terrain) {
      if (aabbOverlap(groundCheck, tile)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if body is touching a wall (for wall jump)
   * Returns 'left', 'right', or null
   */
  isTouchingWall(body: PhysicsBody, terrain: AABB[]): 'left' | 'right' | null {
    // Create sensors on left and right sides of body
    const sensorWidth = GAME_CONFIG.COLLISION.WALL_SENSOR_WIDTH;
    const sensorMargin = GAME_CONFIG.COLLISION.WALL_SENSOR_MARGIN;

    const leftSensor: AABB = {
      x: body.bounds.x - sensorWidth,
      y: body.bounds.y + sensorMargin,
      width: sensorWidth,
      height: body.bounds.height - sensorMargin * 2,
    };

    const rightSensor: AABB = {
      x: body.bounds.x + body.bounds.width,
      y: body.bounds.y + sensorMargin,
      width: sensorWidth,
      height: body.bounds.height - sensorMargin * 2,
    };

    for (const tile of terrain) {
      if (aabbOverlap(leftSensor, tile)) {
        return 'left';
      }
      if (aabbOverlap(rightSensor, tile)) {
        return 'right';
      }
    }

    return null;
  }

  /**
   * Perform wall jump (jump away from wall)
   */
  wallJump(body: PhysicsBody, wallSide: 'left' | 'right'): void {
    // Vertical force (slightly less than normal jump)
    body.velocity.y = PHYSICS.WALL_JUMP_FORCE;

    // Horizontal kick away from wall
    body.velocity.x = wallSide === 'left'
      ? PHYSICS.WALL_KICK_FORCE
      : -PHYSICS.WALL_KICK_FORCE;

    // Face away from wall
    body.facingRight = wallSide === 'left';
    body.grounded = false;
  }

  /**
   * Apply wall slide (slow down fall when touching wall)
   */
  applyWallSlide(body: PhysicsBody): void {
    if (body.velocity.y > PHYSICS.WALL_SLIDE_SPEED) {
      body.velocity.y = PHYSICS.WALL_SLIDE_SPEED;
    }
  }

  /**
   * Check if body is on a ladder
   * Returns the ladder AABB if on one, null otherwise
   */
  isOnLadder(body: PhysicsBody, ladders: AABB[]): AABB | null {
    // Center point of body (for ladder detection)
    const centerX = body.bounds.x + body.bounds.width / 2;
    const centerY = body.bounds.y + body.bounds.height / 2;

    for (const ladder of ladders) {
      // Check if center X is within ladder bounds
      if (centerX >= ladder.x && centerX <= ladder.x + ladder.width) {
        // Check if body overlaps vertically with ladder
        if (body.bounds.y + body.bounds.height > ladder.y &&
            body.bounds.y < ladder.y + ladder.height) {
          return ladder;
        }
      }
    }

    return null;
  }

  /**
   * Climb on ladder (move up or down)
   */
  climb(body: PhysicsBody, direction: number): void {
    body.velocity.y = PHYSICS.CLIMB_SPEED * direction;
    body.velocity.x = 0; // No horizontal movement while climbing
  }

  /**
   * Create a new physics body
   */
  createBody(x: number, y: number, width: number, height: number): PhysicsBody {
    return {
      position: vec2(x, y),
      velocity: vec2(),
      bounds: { x, y, width, height },
      grounded: false,
      facingRight: true,
    };
  }
}
