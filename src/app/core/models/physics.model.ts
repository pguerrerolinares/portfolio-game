/**
 * 2D Vector for positions and velocities
 */
export interface Vector2 {
  x: number;
  y: number;
}

/**
 * Axis-Aligned Bounding Box for collision detection
 */
export interface AABB {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Physics body with position, velocity and collision data
 */
export interface PhysicsBody {
  position: Vector2;
  velocity: Vector2;
  bounds: AABB;
  grounded: boolean;
  facingRight: boolean;
}

/**
 * Create a new Vector2
 */
export function vec2(x: number = 0, y: number = 0): Vector2 {
  return { x, y };
}

/**
 * Distance between two points
 */
export function vec2Distance(a: Vector2, b: Vector2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Check if two AABBs overlap
 */
export function aabbOverlap(a: AABB, b: AABB): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}
