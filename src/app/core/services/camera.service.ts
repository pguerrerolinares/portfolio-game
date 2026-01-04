import { Injectable, signal, computed, inject } from '@angular/core';
import { TowerService } from './tower.service';
import { SectionId } from '../models/world.model';
import { GAME_CONFIG } from '../constants/game-config';

/**
 * Camera Service
 *
 * Manages the vertical scrolling camera for the tower world.
 * Features:
 * - Smooth following with dead zones
 * - Section detection for UI updates
 * - Clamped to tower bounds
 */
@Injectable({ providedIn: 'root' })
export class CameraService {
  private tower = inject(TowerService);

  // Camera configuration from centralized config
  readonly VIEWPORT_HEIGHT = GAME_CONFIG.VIEWPORT.HEIGHT;
  readonly VIEWPORT_WIDTH = GAME_CONFIG.VIEWPORT.WIDTH;
  private readonly DEAD_ZONE_TOP = GAME_CONFIG.CAMERA.DEAD_ZONE_TOP;
  private readonly DEAD_ZONE_BOTTOM = GAME_CONFIG.CAMERA.DEAD_ZONE_BOTTOM;
  private readonly SMOOTHNESS = GAME_CONFIG.CAMERA.SMOOTHNESS;

  // Tower bounds (calculated from config)
  private readonly CAMERA_MIN_Y = -(GAME_CONFIG.TOWER.SECTION_HEIGHT * (GAME_CONFIG.TOWER.SECTION_COUNT - 1)); // Top of contact
  private readonly CAMERA_MAX_Y = 0; // Bottom of hero section

  // Camera state signals
  readonly x = signal(0); // Always 0 for tower (no horizontal scroll)
  readonly y = signal(0); // World Y offset (negative = looking up)
  private targetY = 0;

  // Track section changes
  private lastSection: SectionId = 'hero';
  readonly sectionChanged = signal<{ from: SectionId; to: SectionId; direction: 'up' | 'down' } | null>(null);

  /**
   * Update camera position based on player Y
   * Call this every frame from the game loop
   */
  update(playerY: number): void {
    // Calculate where player is on screen (relative to camera)
    const screenY = playerY - this.y();

    // Move camera if player exits dead zone
    if (screenY < this.DEAD_ZONE_TOP) {
      // Player too close to top - move camera up
      this.targetY = playerY - this.DEAD_ZONE_TOP;
    } else if (screenY > this.VIEWPORT_HEIGHT - this.DEAD_ZONE_BOTTOM) {
      // Player too close to bottom - move camera down
      this.targetY = playerY - (this.VIEWPORT_HEIGHT - this.DEAD_ZONE_BOTTOM);
    }

    // Clamp camera to tower bounds
    this.targetY = Math.max(this.CAMERA_MIN_Y, Math.min(this.CAMERA_MAX_Y, this.targetY));

    // Smooth camera movement (lerp)
    const current = this.y();
    const newY = current + (this.targetY - current) * this.SMOOTHNESS;
    this.y.set(newY);

    // Check for section changes
    this.checkSectionChange(playerY);
  }

  /**
   * Check if player entered a new section
   */
  private checkSectionChange(playerY: number): void {
    const currentSection = this.tower.getSectionAtY(playerY);

    if (currentSection !== this.lastSection) {
      const isUp = this.tower.isMovingUp(this.lastSection, currentSection);

      this.sectionChanged.set({
        from: this.lastSection,
        to: currentSection,
        direction: isUp ? 'up' : 'down',
      });

      this.lastSection = currentSection;
      this.tower.updateCurrentSection(playerY);
    }
  }

  /**
   * Clear section change signal (after UI has responded)
   */
  clearSectionChange(): void {
    this.sectionChanged.set(null);
  }

  /**
   * Get current view bounds in world coordinates
   */
  getViewBounds(): { top: number; bottom: number; left: number; right: number } {
    const camY = this.y();
    return {
      top: camY,
      bottom: camY + this.VIEWPORT_HEIGHT,
      left: 0,
      right: this.VIEWPORT_WIDTH,
    };
  }

  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    return {
      x: worldX - this.x(),
      y: worldY - this.y(),
    };
  }

  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: screenX + this.x(),
      y: screenY + this.y(),
    };
  }

  /**
   * Check if a world position is visible in the viewport
   */
  isVisible(worldX: number, worldY: number, width: number = 0, height: number = 0): boolean {
    const screenPos = this.worldToScreen(worldX, worldY);
    return (
      screenPos.x + width > 0 &&
      screenPos.x < this.VIEWPORT_WIDTH &&
      screenPos.y + height > 0 &&
      screenPos.y < this.VIEWPORT_HEIGHT
    );
  }

  /**
   * Instantly set camera position (for respawn/teleport)
   */
  setPosition(x: number, y: number = 0): void {
    const clampedY = Math.max(this.CAMERA_MIN_Y, Math.min(this.CAMERA_MAX_Y, y));
    this.x.set(0); // Always 0 for tower
    this.y.set(clampedY);
    this.targetY = clampedY;
  }

  /**
   * Reset camera to bottom of tower
   */
  reset(): void {
    this.x.set(0);
    this.y.set(0);
    this.targetY = 0;
    this.lastSection = 'hero';
    this.sectionChanged.set(null);
  }

  /**
   * Get viewport dimensions
   */
  getViewport(): { width: number; height: number } {
    return {
      width: this.VIEWPORT_WIDTH,
      height: this.VIEWPORT_HEIGHT,
    };
  }

  /**
   * Get CSS transform for the tower content
   */
  readonly contentTransform = computed(() => {
    return `translateY(${-this.y()}px)`;
  });
}
