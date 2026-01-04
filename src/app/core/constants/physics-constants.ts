/**
 * Physics constants for the game
 */
export const PHYSICS = {
  /** Gravity acceleration (pixels per frame squared) - lower = floatier */
  GRAVITY: 0.35,

  /** Maximum falling speed */
  MAX_FALL_SPEED: 8,

  /** Player horizontal movement speed */
  PLAYER_SPEED: 3.5,

  /** Player climb speed */
  CLIMB_SPEED: 3,

  /** Jump force (negative = upward) - creates ~120px max height with new gravity */
  JUMP_FORCE: -9.5,

  /** Wall jump vertical force (90% of normal jump) */
  WALL_JUMP_FORCE: -8.5,

  /** Wall jump horizontal kick force */
  WALL_KICK_FORCE: 5,

  /** Wall slide speed (slower than normal fall) */
  WALL_SLIDE_SPEED: 1.5,

  /** Ground friction */
  FRICTION: 0.85,

  /** Air resistance */
  AIR_RESISTANCE: 0.95,

  /** Tile size in pixels */
  TILE_SIZE: 64,

  /** Swipe minimum distance to trigger jump */
  SWIPE_MIN_DISTANCE: 30,

  /** Radius around player to detect swipe start */
  PLAYER_TAP_RADIUS: 80,

  /** Time threshold for double tap (ms) */
  DOUBLE_TAP_THRESHOLD: 300,

  // === Charge Jump (Jump King style) ===

  /** Minimum jump force at 10% charge (small hop ~40px) */
  CHARGE_JUMP_MIN_FORCE: -4,

  /** Maximum jump force at 100% charge (big jump ~180px) */
  CHARGE_JUMP_MAX_FORCE: -14,

  /** Horizontal velocity during charged jump */
  CHARGE_JUMP_HORIZONTAL: 6,

  /** Time to reach full charge (ms) */
  CHARGE_TIME_MS: 1000,

  /** Minimum charge percentage to trigger a jump (0-1) */
  CHARGE_MIN_THRESHOLD: 0.1,
} as const;
