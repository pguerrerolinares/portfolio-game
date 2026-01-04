/**
 * Types of terrain available
 */
export type TerrainType = 'grass' | 'sand' | 'purple' | 'stone';

/**
 * Types of backgrounds available
 */
export type BackgroundType = 'hills' | 'trees' | 'mushrooms' | 'desert' | 'clouds';

/**
 * A single terrain tile
 */
export interface TerrainTile {
  id: string;
  x: number;
  y: number;
  frame: string;
  solid: boolean;
}

/**
 * A decoration element (non-solid)
 */
export interface Decoration {
  id: string;
  x: number;
  y: number;
  frame: string;
  sheet: string;
}

/**
 * Enemy spawn configuration
 */
export interface EnemySpawn {
  id: string;
  type: string;
  x: number;
  y: number;
  patrolStartX: number;
  patrolEndX: number;
}

/**
 * Base item types
 */
export type ItemType = 'coin_gold' | 'coin_silver' | 'info_stat' | 'info_badge';

/**
 * Info item types (collectibles that show information)
 */
export type InfoItemType = 'stat_exp' | 'stat_tech' | 'stat_builds' | 'skill_badge';

/**
 * Item spawn configuration
 */
export interface ItemSpawn {
  id: string;
  type: string;
  x: number;
  y: number;
  linkedSection?: string;
  // Info item specific fields
  infoType?: InfoItemType;
  infoTitle?: string;
  infoMessage?: string;
  infoIcon?: string;
}

/**
 * Exit point configuration (pipe, door, flag)
 */
export interface ExitPoint {
  id: string;
  targetSection: SectionId;
  x: number;
  y: number;
  type: 'pipe' | 'door' | 'flag';
  frame: string;
  direction: 'up' | 'down' | 'left' | 'right';
}

/**
 * NPC sprite types (friendly creatures)
 */
export type NPCSprite = 'frog' | 'ladybug' | 'snail' | 'mouse';

/**
 * NPC configuration (friendly creatures with dialogues)
 */
export interface NPC {
  id: string;
  x: number;
  y: number;
  sprite: NPCSprite;
  name: string;           // i18n key for name shown in dialogue
  dialogue: string[];     // Array of i18n keys for dialogue pages
  externalLink?: string;  // Optional: opens link after dialogue ends
  // Patrol behavior (optional)
  patrolMinX?: number;    // Left bound for patrol
  patrolMaxX?: number;    // Right bound for patrol
  patrolSpeed?: number;   // Movement speed (default: 1)
}

/**
 * Entry point configuration
 */
export interface EntryPoint {
  x: number;
  y?: number;
  type: 'pipe' | 'door' | 'fall';
  direction: 'up' | 'down' | 'left' | 'right';
}

/**
 * Ladder configuration (climbable element)
 */
export interface Ladder {
  id: string;
  x: number;
  topY: number;      // Y position of ladder top
  heightTiles: number; // Number of tiles tall
}

/**
 * A section/page of the world (corresponds to a portfolio section)
 */
export interface WorldSection {
  id: SectionId;
  width: number;
  height: number;
  groundLevel: number;
  terrainType: TerrainType;
  backgroundType: BackgroundType;
  terrain: TerrainTile[];
  decorations: Decoration[];
  enemies: EnemySpawn[];
  items: ItemSpawn[];
  exits: ExitPoint[];
  npcs: NPC[];
  ladders: Ladder[];
  entry: EntryPoint;
  title: string;
}

/**
 * Transition state
 */
export type TransitionState = 'none' | 'exiting' | 'entering';

/**
 * Transition type
 */
export type TransitionType = 'pipe' | 'door' | 'flag' | 'fall';

/**
 * Complete world configuration
 */
export interface WorldConfig {
  tileSize: number;
  sections: Record<SectionId, WorldSection>;
  initialSection: SectionId;
}

/**
 * Section IDs
 */
export type SectionId = 'hero' | 'about' | 'skills' | 'projects' | 'contact';

/**
 * Section order for navigation
 */
export const SECTION_ORDER: SectionId[] = ['hero', 'about', 'skills', 'projects', 'contact'];
