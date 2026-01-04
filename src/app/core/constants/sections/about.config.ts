import { WorldSection } from '../../models/world.model';
import { TILE, PAGE_WIDTH, PAGE_HEIGHT, GROUND_Y, LEVEL, terrain } from './section-utils';

/**
 * ABOUT SECTION - Cascada Vertical
 * Theme: grass/trees
 * NPC: Ladybug (about Paul)
 * Difficulty: ⭐⭐ (Easy)
 *
 * TOWER MODE: Plataformas en patrón cascada (alternando izq-der)
 * Hueco izquierdo AMPLIO en ground para entrada desde HERO (x=0-256)
 *
 * Layout (Waterfall Pattern):
 *  Y=64  ██                            ← Salida hacia SKILLS (1 tile)
 *  Y=160             ████████          ← P4 derecha
 *  Y=256     ████████ 🐞               ← P3 NPC Ladybug
 *  Y=352                 ████████      ← P2 derecha
 *  Y=448             ████████          ← P1 derecha
 *  Y=576                     ████████  ← Ground parcial (hueco amplio izq x=0-256)
 *        ↑ entrada desde HERO
 */
export const ABOUT_SECTION: WorldSection = {
  id: 'about',
  width: PAGE_WIDTH,
  height: PAGE_HEIGHT,
  groundLevel: GROUND_Y,
  terrainType: 'grass',
  backgroundType: 'trees',
  terrain: [
    // Ground (partial - hueco AMPLIO izq para entrar desde HERO) - y=576
    // Empieza en x=256 (TILE*4) para dar espacio de maniobra (hueco x=0-256)
    ...terrain(TILE * 4, 2, GROUND_Y, 'terrain_grass', 'about_ground', 'right'),

    // P1 (right) - y=448, primera plataforma (espacio izq para saltar)
    ...terrain(TILE * 3, 2, LEVEL.L2, 'terrain_grass', 'about_p1'),

    // P2 (right) - y=352
    ...terrain(TILE * 4, 2, LEVEL.L3, 'terrain_grass', 'about_p2'),

    // P3 (center-left) - y=256, NPC aquí
    ...terrain(TILE, 2, LEVEL.L5, 'terrain_grass', 'about_p3'),

    // P4 (center-left) - y=160
    ...terrain(TILE * 2.5, 2, LEVEL.L6, 'terrain_grass', 'about_p4'),

    // Exit platform (left) - y=64, 1 tile para saltar libre desde x>64
    ...terrain(0, 1, LEVEL.L8, 'terrain_grass', 'about_exit', 'left'),
  ],
  decorations: [
    // Ground decorations (en la parte con suelo)
    { id: 'about_bush1', x: TILE * 4 + 16, y: GROUND_Y - 32, frame: 'bush', sheet: 'tiles' },
    { id: 'about_bush2', x: TILE * 5, y: GROUND_Y - 32, frame: 'bush', sheet: 'tiles' },
    // Exit platform decoration
    { id: 'about_grass2', x: 16, y: LEVEL.L8 - 32, frame: 'grass', sheet: 'tiles' },
  ],
  enemies: [],
  items: [],
  // No exits in tower mode - player jumps to next section
  exits: [],
  ladders: [],
  npcs: [
    {
      id: 'about_ladybug',
      x: TILE + 16, // On P3 (center-left)
      y: LEVEL.L5 - TILE, // On top of platform
      sprite: 'ladybug',
      name: 'npcs.ladybug.name',
      dialogue: [
        'npcs.about.ladybug.line1',
        'npcs.about.ladybug.line2',
        'npcs.about.ladybug.line3',
      ],
      // Patrol on P3 platform (2 tiles wide, x=64-192)
      patrolMinX: TILE + 8,
      patrolMaxX: TILE * 2 - 16, // Stay within P3, don't clip into P4
      patrolSpeed: 0.5,
    },
  ],
  entry: {
    x: TILE * 2, // Spawn center on ground
    type: 'fall',
    direction: 'right',
  },
  title: 'sections.about.title',
};
