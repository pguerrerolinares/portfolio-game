import { WorldSection } from '../../models/world.model';
import { TILE, PAGE_WIDTH, PAGE_HEIGHT, GROUND_Y, LEVEL, terrain } from './section-utils';

/**
 * HERO SECTION - Tutorial: Escalera Fácil
 * Theme: grass/hills
 * NPC: Frog (tutorial)
 * Difficulty: ⭐ (Very Easy)
 *
 * TOWER MODE: Plataformas en zigzag para aprender charge jump
 * Cada plataforma ~96px de altura (alcanzable con ~50% charge)
 *
 * Layout (Jump King Tower):
 *  Y=64  ██                        ← Exit (x=0-64, 1 tile para saltar libre desde x>64)
 *  Y=160 ████                      ← P4 (x=0-128, zona segura)
 *  Y=256     ████████              ← P3 (x=64-192, transición)
 *  Y=352     ████████ 🐸           ← P2 + NPC tutorial
 *  Y=448 ████                      ← P1 (espacio para saltar)
 *  Y=576 ████████████████████████  ← Ground (spawn)
 */
export const HERO_SECTION: WorldSection = {
  id: 'hero',
  width: PAGE_WIDTH,
  height: PAGE_HEIGHT,
  groundLevel: GROUND_Y,
  terrainType: 'grass',
  backgroundType: 'hills',
  terrain: [
    // Ground (full width) - y=576
    ...terrain(0, 6, GROUND_Y, 'terrain_grass', 'hero_ground', 'both'),

    // P1 (left) - y=448, primera plataforma desde ground (2 tiles para dejar espacio)
    ...terrain(0, 2, LEVEL.L2, 'terrain_grass', 'hero_p1', 'left'),

    // P2 (center) - y=352, NPC aquí (ajustada a la izq)
    ...terrain(TILE + 32, 3, LEVEL.L3 + 32, 'terrain_grass', 'hero_p2'),

    // P3 (center-left) - y=256, transición hacia zona segura (x<192)
    ...terrain(TILE, 2, LEVEL.L5, 'terrain_grass', 'hero_p3'),

    // P4 (left) - y=160, dentro del hueco de ABOUT (x<192)
    ...terrain(0, 2, LEVEL.L6 + 32, 'terrain_grass', 'hero_p4', 'left'),

    // Exit platform (left) - y=64, 1 tile para que el jugador pueda saltar desde x>64
    ...terrain(0, 1, LEVEL.L8, 'terrain_grass', 'hero_exit', 'left'),
  ],
  decorations: [
    // Ground decorations
    { id: 'hero_bush1', x: TILE * 3 + 16, y: GROUND_Y - 32, frame: 'bush', sheet: 'tiles' },
    { id: 'hero_bush2', x: TILE * 5, y: GROUND_Y - 32, frame: 'bush', sheet: 'tiles' },
    // P1 decoration
    { id: 'hero_grass1', x: TILE + 16, y: LEVEL.L2 - 32, frame: 'grass', sheet: 'tiles' },
    // Exit platform decoration (encima del único tile)
    { id: 'hero_grass2', x: 16, y: LEVEL.L8 - 32, frame: 'grass', sheet: 'tiles' },
  ],
  enemies: [],
  items: [],
  // No exits in tower mode - player jumps to next section
  exits: [],
  ladders: [],
  npcs: [
    {
      id: 'hero_frog',
      x: TILE + 48, // On P2 (ajustado)
      y: LEVEL.L3 + 32 - TILE, // On top of platform
      sprite: 'frog',
      name: 'npcs.frog.name',
      dialogue: [
        'npcs.hero.frog.line1',
        'npcs.hero.frog.line2',
        'npcs.hero.frog.line3',
      ],
      patrolMinX: TILE + 40,
      patrolMaxX: TILE + 32 + TILE * 3 - 48, // Dentro de P2
      patrolSpeed: 0.4,
    },
  ],
  entry: {
    x: TILE * 2, // Spawn center on ground
    type: 'fall',
    direction: 'right',
  },
  title: 'sections.hero.title',
};
