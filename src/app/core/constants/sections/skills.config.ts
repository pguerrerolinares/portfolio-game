import { WorldSection } from '../../models/world.model';
import { TILE, PAGE_WIDTH, PAGE_HEIGHT, GROUND_Y, LEVEL, terrain } from './section-utils';

/**
 * SKILLS SECTION - Torres Gemelas
 * Theme: purple/mushrooms
 * NPC: Snail (technologies)
 * Difficulty: ⭐⭐⭐ (Medium)
 *
 * TOWER MODE: Dos columnas con puentes centrales
 * Saltos diagonales entre plataformas laterales
 * Requiere precisión y timing
 *
 * Layout (Twin Towers):
 *  Y=64          ██                  ← Salida hacia PROJECTS (1 tile)
 *  Y=160 ██              ██          ← Torres laterales (arriba)
 *  Y=256         ████████            ← Puente central alto
 *  Y=352 ██      🐌      ██          ← NPC en centro
 *  Y=448         ████████            ← Puente central bajo
 *  Y=576             ████████████████ ← Ground parcial (hueco izq)
 *        ↑ entrada desde ABOUT
 */
export const SKILLS_SECTION: WorldSection = {
  id: 'skills',
  width: PAGE_WIDTH,
  height: PAGE_HEIGHT,
  groundLevel: GROUND_Y,
  terrainType: 'purple',
  backgroundType: 'mushrooms',
  terrain: [
    // Ground (parcial derecha - hueco izq para entrada desde ABOUT) - y=576
    ...terrain(TILE * 3, 3, GROUND_Y, 'terrain_purple', 'skills_ground', 'right'),

    // Lower bridge (center) - y=448
    ...terrain(TILE * 2, 2, LEVEL.L2, 'terrain_purple', 'skills_bridge1'),

    // Left tower - y=352
    ...terrain(0, 1, LEVEL.L3, 'terrain_purple', 'skills_tower_l1', 'left'),

    // Right tower - y=352
    ...terrain(TILE * 5, 1, LEVEL.L3, 'terrain_purple', 'skills_tower_r1', 'right'),

    // Middle platform with NPC - y=352
    ...terrain(TILE * 2, 2, LEVEL.L3, 'terrain_purple', 'skills_mid'),

    // Upper bridge (center) - y=256
    ...terrain(TILE * 2, 2, LEVEL.L5, 'terrain_purple', 'skills_bridge2'),

    // Left tower top - y=160
    ...terrain(0, 1, LEVEL.L6, 'terrain_purple', 'skills_tower_l2', 'left'),

    // Right tower top - y=160
    ...terrain(TILE * 5, 1, LEVEL.L6, 'terrain_purple', 'skills_tower_r2', 'right'),

    // Exit platform (center) - y=64
    ...terrain(TILE, 2, LEVEL.L8, 'terrain_purple', 'skills_exit'),
  ],
  decorations: [
    // Ground mushroom decorations (en parte con suelo)
    { id: 'skills_mushroom1', x: TILE * 3 + 16, y: GROUND_Y - 32, frame: 'mushroom_red', sheet: 'tiles' },
    { id: 'skills_mushroom2', x: TILE * 5, y: GROUND_Y - 32, frame: 'mushroom_brown', sheet: 'tiles' },
  ],
  enemies: [],
  items: [],
  // No exits in tower mode - player jumps to next section
  exits: [],
  ladders: [],
  npcs: [
    {
      id: 'skills_snail',
      x: TILE * 2 + 16, // On upper bridge
      y: LEVEL.L5 - TILE, // On top of bridge2 platform
      sprite: 'snail',
      name: 'npcs.snail.name',
      dialogue: [
        'npcs.skills.snail.line1',
        'npcs.skills.snail.line2',
        'npcs.skills.snail.line3',
      ],
      // Patrol on upper bridge (skills_bridge2)
      patrolMinX: TILE * 2 + 8,
      patrolMaxX: TILE * 4 - 48,
      patrolSpeed: 0.3,
    },
  ],
  entry: {
    x: TILE * 2, // Spawn center on ground
    type: 'fall',
    direction: 'right',
  },
  title: 'sections.skills.title',
};
