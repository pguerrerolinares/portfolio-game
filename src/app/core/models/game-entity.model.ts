import { Vector2, PhysicsBody } from './physics.model';
import { AnimationConfig } from './animation.model';

/**
 * Base entity state
 */
export type EntityState = 'idle' | 'walk' | 'jump' | 'climb' | 'fall' | 'hit' | 'charge';

/**
 * Enemy behavior type
 */
export type EnemyBehavior = 'patrol' | 'flee' | 'static';

/**
 * Base game entity
 */
export interface GameEntity {
  id: string;
  position: Vector2;
  width: number;
  height: number;
  active: boolean;
}

/**
 * Player entity
 */
export interface PlayerEntity extends GameEntity {
  body: PhysicsBody;
  state: EntityState;
  color: 'green';
  targetX: number | null;
  isMoving: boolean;
  isClimbing: boolean;
}

/**
 * Enemy entity
 */
export interface EnemyEntity extends GameEntity {
  type: string;
  behavior: EnemyBehavior;
  patrolStartX: number;
  patrolEndX: number;
  speed: number;
  detectionRadius: number;
  isFleeing: boolean;
  animation: string;
  fleeAnimation: string;
}

/**
 * Item entity
 */
export interface ItemEntity extends GameEntity {
  type: string;
  frame: string;
  linkedSection?: string;
  isGlowing: boolean;
  floatOffset: number;
}

/**
 * Enemy configurations
 */
export const ENEMY_CONFIGS: Record<string, Omit<EnemyEntity, 'id' | 'position' | 'active' | 'patrolStartX' | 'patrolEndX' | 'isFleeing'>> = {
  slime: {
    type: 'slime',
    width: 32,
    height: 24,
    behavior: 'patrol',
    speed: 1,
    detectionRadius: 100,
    animation: 'slime_normal_walk',
    fleeAnimation: 'slime_normal_walk',
  },
  bee: {
    type: 'bee',
    width: 32,
    height: 32,
    behavior: 'flee',
    speed: 3,
    detectionRadius: 150,
    animation: 'bee_fly',
    fleeAnimation: 'bee_fly',
  },
  ladybug: {
    type: 'ladybug',
    width: 32,
    height: 24,
    behavior: 'flee',
    speed: 2,
    detectionRadius: 80,
    animation: 'ladybug_walk',
    fleeAnimation: 'ladybug_fly',
  },
  snail: {
    type: 'snail',
    width: 32,
    height: 24,
    behavior: 'static',
    speed: 0.5,
    detectionRadius: 60,
    animation: 'snail_walk',
    fleeAnimation: 'snail_shell',
  },
};
