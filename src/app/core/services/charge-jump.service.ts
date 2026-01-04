import { Injectable, signal, computed } from '@angular/core';
import { PHYSICS } from '../constants/physics-constants';

/**
 * Jump vector returned when releasing a charged jump
 */
export interface JumpVector {
  forceY: number;
  velocityX: number;
}

/**
 * Charge Jump Service (Jump King style)
 *
 * Manages the charge jump state machine:
 * 1. Player holds jump button → charging begins
 * 2. Charge builds over CHARGE_TIME_MS (0-100%)
 * 3. Player can aim left/right while charging
 * 4. On release → jump with force proportional to charge
 *
 * Movement is blocked while charging (authentic Jump King feel)
 */
@Injectable({ providedIn: 'root' })
export class ChargeJumpService {
  // State signals
  readonly isCharging = signal(false);
  readonly chargePercent = signal(0);
  readonly aimDirection = signal(0); // -1 (left) to 1 (right)

  // Computed
  readonly canJump = computed(() => {
    return this.isCharging() && this.chargePercent() >= PHYSICS.CHARGE_MIN_THRESHOLD * 100;
  });

  /**
   * Compute charge color based on percentage (HSL interpolation)
   * Verde → Amarillo (65%) → Rojo (90%)
   */
  readonly chargeColor = computed(() => {
    const percent = this.chargePercent();
    return this.interpolateColor(percent);
  });

  /**
   * Interpolate color in HSL space for smooth transitions
   * Colores intensos reservados para el final
   */
  private interpolateColor(percent: number): string {
    let hue: number;

    if (percent < 65) {
      // Verde (120°) hacia amarillo-verde (80°)
      hue = 120 - (percent / 65) * 40; // 120 → 80
    } else if (percent < 90) {
      // Amarillo-verde (80°) hacia amarillo (60°) hacia naranja (30°)
      const t = (percent - 65) / 25; // 0 → 1
      hue = 80 - t * 50; // 80 → 30
    } else {
      // Naranja (30°) hacia rojo (0°)
      const t = (percent - 90) / 10; // 0 → 1
      hue = 30 - t * 30; // 30 → 0
    }

    // Saturación y brillo aumentan con la carga
    const saturation = 70 + (percent * 0.2); // 70% → 90%
    const lightness = 50 + (percent * 0.1); // 50% → 60%

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }

  /**
   * Check if charge is at maximum (100%)
   */
  readonly isFullyCharged = computed(() => this.chargePercent() >= 100);

  // Internal state
  private chargeStartTime = 0;

  /**
   * Start charging a jump (called on key/button down)
   * Only starts if player is grounded (checked externally)
   */
  startCharge(): void {
    if (this.isCharging()) return;

    this.isCharging.set(true);
    this.chargePercent.set(0);
    this.chargeStartTime = performance.now();
  }

  /**
   * Update charge progress (called each frame while charging)
   * @param deltaTime - Time since last frame in ms
   */
  updateCharge(deltaTime: number): void {
    if (!this.isCharging()) return;

    const elapsed = performance.now() - this.chargeStartTime;
    const percent = Math.min(100, (elapsed / PHYSICS.CHARGE_TIME_MS) * 100);
    this.chargePercent.set(percent);
  }

  /**
   * Set aim direction while charging
   * @param dir - Direction from -1 (left) to 1 (right)
   */
  setAimDirection(dir: number): void {
    this.aimDirection.set(Math.max(-1, Math.min(1, dir)));
  }

  /**
   * Release the charged jump
   * @returns JumpVector with calculated forces, or null if charge too low
   */
  releaseJump(): JumpVector | null {
    if (!this.isCharging()) return null;

    const percent = this.chargePercent() / 100; // Convert to 0-1
    this.reset();

    // Don't jump if charge is below minimum threshold
    if (percent < PHYSICS.CHARGE_MIN_THRESHOLD) {
      return null;
    }

    // Calculate jump force based on charge percentage
    const minForce = PHYSICS.CHARGE_JUMP_MIN_FORCE;
    const maxForce = PHYSICS.CHARGE_JUMP_MAX_FORCE;
    const forceY = minForce + (maxForce - minForce) * percent;

    // Calculate horizontal velocity based on aim direction
    const velocityX = this.aimDirection() * PHYSICS.CHARGE_JUMP_HORIZONTAL * percent;

    return { forceY, velocityX };
  }

  /**
   * Cancel the charge without jumping
   */
  cancelCharge(): void {
    this.reset();
  }

  /**
   * Reset all charge state
   */
  private reset(): void {
    this.isCharging.set(false);
    this.chargePercent.set(0);
    this.aimDirection.set(0);
    this.chargeStartTime = 0;
  }
}
