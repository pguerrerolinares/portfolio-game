import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TransitionService } from './transition.service';
import { InputService } from './input.service';
import { ExitPoint, SectionId } from '../models/world.model';
import { Vector2, vec2 } from '../models/physics.model';
import { PHYSICS } from '../constants/physics-constants';
import { GAME_CONFIG } from '../constants/game-config';

/**
 * Exit manager service.
 * Handles navigation between sections with animated transitions.
 */
@Injectable({ providedIn: 'root' })
export class ExitManagerService {
  private router = inject(Router);
  private transition = inject(TransitionService);
  private input = inject(InputService);

  // Pending exit (player is walking towards this exit)
  readonly pendingExit = signal<ExitPoint | null>(null);

  // Player dimensions for collision detection
  private readonly PLAYER_WIDTH = PHYSICS.TILE_SIZE;

  /**
   * Set the exit the player should walk towards
   */
  setTarget(exit: ExitPoint): void {
    this.pendingExit.set(exit);
    this.input.walkTarget.set(vec2(exit.x, exit.y));
  }

  /**
   * Check if player has reached the pending exit
   */
  checkReached(playerPosition: Vector2, playerVelocityX: number): boolean {
    const exit = this.pendingExit();
    if (!exit) return false;

    const playerCenterX = playerPosition.x + this.PLAYER_WIDTH / 2;
    const distanceX = Math.abs(playerCenterX - exit.x);

    // Check Y proximity - player should be at or above the exit level
    const exitPlatformY = exit.y + PHYSICS.TILE_SIZE;
    const isAtCorrectHeight = playerPosition.y <= exitPlatformY + PHYSICS.TILE_SIZE;

    // Check if player has stopped moving
    const isPlayerStopped = Math.abs(playerVelocityX) < 0.5;
    const hasWalkTarget = this.input.walkTarget() !== null;

    // Trigger transition when close enough (using centralized config)
    const isCloseEnough = distanceX < GAME_CONFIG.INTERACTION.EXIT_CLOSE_THRESHOLD && isAtCorrectHeight;
    const isStoppedNearby = isPlayerStopped && hasWalkTarget && distanceX < GAME_CONFIG.INTERACTION.EXIT_FAR_THRESHOLD;

    return isCloseEnough || isStoppedNearby;
  }

  /**
   * Navigate to a section with animated transition
   */
  async navigateTo(sectionId: SectionId): Promise<void> {
    const exit = this.pendingExit();

    // Clear pending state
    this.pendingExit.set(null);
    this.input.reset();

    // Start exit transition
    await this.transition.startExitTransition(
      sectionId,
      exit?.type ?? 'door',
      exit?.direction ?? 'right'
    );

    // Navigate to new section route
    await this.router.navigate(['/', sectionId]);

    // Entry transition will be played by the section component
  }

  /**
   * Cancel pending exit navigation
   */
  cancel(): void {
    this.pendingExit.set(null);
    this.input.clearWalkTarget();
  }

  /**
   * Check if currently navigating
   */
  isNavigating(): boolean {
    return this.transition.isTransitioning();
  }
}
